import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { Database } from './database.module.js';
import { hashPassword, temporaryPassword } from './domain/password.js';
import { createPassage, localInstant, passages } from './interventions/interventions.controller.js';

/**
 * Local-only catalogue for the demonstration database: realistic but fictional clients of every sector,
 * provider companies, sites and rooms, accounts, contracts and a few weeks of activity.
 * It is additive: it skips whatever already exists, so it can run again. It only renames the old
 * "démonstration" labels and removes the three sites this script itself created in the wrong organisation.
 */

type Kind = 'BUILDING' | 'FLOOR' | 'AREA' | 'ROOM' | 'EQUIPMENT';
type Zone = [code: string, name: string, kind: Kind, parent?: string];
type Role = 'CLIENT_MANAGER' | 'CLIENT_CONTROLLER' | 'PROVIDER_MANAGER' | 'FIELD_AGENT';
/** Login, display name, role and, for a controller, the sites it may inspect (all of them when omitted). */
type Person = [login: string, name: string, role: Role, sites?: string[]];
type Profile = [address: string, city: string, phone: string, email: string, niu: string, rccm: string, services: string, description: string, contact: string];
type SiteDef = { name: string; sector: string; zones: Zone[] };
type OrgDef = { key: string; name: string; kind: 'CLIENT' | 'PROVIDER'; profile?: Profile; sites?: SiteDef[]; people: Person[]; providers?: [provider: string, sites?: string[]][] };
/** A recurring cleaning contract. Start and end are day offsets from today; an empty team leaves every passage waiting to be assigned. */
type Cleaning = { provider: string; title: string; description: string; zones: string[]; tasks: string[]; weekdays: number[]; from: string; to: string; team: string[];
 start?: number; end?: number; report?: string; rework?: string; acceptance?: string };
type Stage = 'requested' | 'quoted' | 'refused' | 'planned' | 'assigned' | 'review' | 'done';
type Maintenance = { provider: string; zones: string[]; title: string; description: string; tasks: string[]; day: number; from: string; to: string; stage: Stage; urgent?: boolean;
 quote?: [amount: number, delay: number, description: string]; quoteReason?: string; tech?: string; report?: string; acceptance?: string;
 anomaly?: { zone: string; title: string; description: string; resolution: string; closing?: string } };
type Activity = { client: string; site: string; manager: string; controller: string; cleaning: Cleaning; maintenance: Maintenance[] };

const TZ = 'Africa/Douala';
const DAY = 86400000, HOUR = 3600000;
const AFISA_DESCRIPTION = 'Biscuiterie et farines enrichies. Deux lignes de conditionnement, chambres froides positive et négative, laboratoire qualité sur site.';
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7], WORK_DAYS = [1, 2, 3, 4, 5], SIX_DAYS = [1, 2, 3, 4, 5, 6];
/** Today's date at the site, "YYYY-MM-DD", shifted by a number of days. */
const siteDate = (shift = 0) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + shift * DAY));
function need<T>(map: Record<string, T>, key: string): T { const value = map[key]; if (value === undefined) throw new Error(`UNKNOWN_REFERENCE ${key}`); return value; }

/* ---------- Repeated layouts ---------- */
const bankAgency = (): Zone[] => [
 ['AG', 'Agence', 'BUILDING'], ['AG-CLI', 'Espace clientèle', 'AREA', 'AG'], ['AG-GUI', 'Guichets (×6)', 'AREA', 'AG'], ['AG-COFF', 'Salle des coffres', 'ROOM', 'AG'],
 ['AG-GAB', 'Guichet automatique extérieur', 'EQUIPMENT', 'AG'], ['AG-BUR', 'Bureaux des conseillers', 'ROOM', 'AG'], ['AG-SAN', 'Sanitaires', 'ROOM', 'AG'],
];
const supermarket = (): Zone[] => [
 ['MAG', 'Magasin', 'BUILDING'], ['VENTE', 'Surface de vente (1 800 m²)', 'AREA', 'MAG'], ['V-FRAIS', 'Rayons frais et surgelés', 'AREA', 'VENTE'], ['V-CAISS', 'Caisses (1 à 8)', 'AREA', 'VENTE'],
 ['RESERVE', 'Réserve', 'AREA', 'MAG'], ['CF-POS', 'Chambre froide positive', 'ROOM', 'RESERVE'], ['SAN-CLI', 'Sanitaires clients', 'ROOM', 'MAG'], ['PARK', 'Parking clients', 'AREA'],
];
const fuelStation = (): Zone[] => [
 ['PISTE', 'Piste de distribution', 'AREA'], ['EQ-POMP', 'Distributeurs de carburant (×6)', 'EQUIPMENT', 'PISTE'], ['EQ-CUVES', 'Cuves enterrées (3 × 50 m³)', 'EQUIPMENT'],
 ['EQ-SEP', 'Séparateur d’hydrocarbures', 'EQUIPMENT'], ['BOUT', 'Boutique', 'ROOM'], ['LAV', 'Baie de lavage', 'AREA'], ['LUB', 'Local lubrifiants', 'ROOM'], ['SAN', 'Sanitaires', 'ROOM'],
];
const rooms = (from: number, to: number, label: string, parent: string): Zone[] => Array.from({ length: to - from + 1 }, (_, i) => [`CH-${from + i}`, `${label} ${from + i}`, 'ROOM', parent]);

/* ---------- Provider companies ---------- */
const providers: OrgDef[] = [
 { key: 'aloys', name: 'ALOYS', kind: 'PROVIDER', people: [
  ['demo.prestataire', 'Thierry Kamdem', 'PROVIDER_MANAGER'], ['b.mbarga', 'Brigitte Mbarga', 'PROVIDER_MANAGER'],
  ['demo.agent', 'Pauline Ngono', 'FIELD_AGENT'], ['jc.tchoumi', 'Jean-Claude Tchoumi', 'FIELD_AGENT'], ['r.ndongo', 'Rose Ndongo', 'FIELD_AGENT'], ['i.moussa', 'Ibrahim Moussa', 'FIELD_AGENT'],
  ['c.eyenga', 'Clarisse Eyenga', 'FIELD_AGENT'], ['h.nkeng', 'Hervé Nkeng', 'FIELD_AGENT'], ['g.abena', 'Gisèle Abena', 'FIELD_AGENT'],
 ] },
 { key: 'eclat', name: 'Éclat Pro Cameroun', kind: 'PROVIDER',
  profile: ['Immeuble Le Rond-Point, boulevard de la Liberté, Akwa', 'Douala', '+237 233 43 08 27', 'contact@eclatpro.cm', 'M081100635218V', 'RC/DLA/2011/B/1046',
   'Nettoyage de bureaux, commerces et hôtels, vitrerie en hauteur, remise en état après travaux', 'Entreprise de propreté de 420 salariés, présente à Douala, Yaoundé et Kribi.', 'Cédric Mouelle — Directeur d’exploitation'],
  people: [['c.mouelle', 'Cédric Mouelle', 'PROVIDER_MANAGER'], ['o.ndjeng', 'Odile Ndjeng', 'FIELD_AGENT'], ['s.etoga', 'Samuel Etoga', 'FIELD_AGENT'], ['f.mvogo', 'Félicité Mvogo', 'FIELD_AGENT'],
   ['r.pouhe', 'Rodrigue Pouhe', 'FIELD_AGENT'], ['e.bekolo', 'Estelle Bekolo', 'FIELD_AGENT'], ['l.ngando', 'Laurent Ngando', 'FIELD_AGENT']] },
 { key: 'bleuazur', name: 'Bleu Azur Nettoyage Industriel', kind: 'PROVIDER',
  profile: ['Zone industrielle de Bonabéri', 'Douala', '+237 233 39 22 41', 'exploitation@bleuazur-industrie.cm', 'M101400792605B', 'RC/DLA/2014/B/2219',
   'Nettoyage industriel, haute pression, nettoyage HACCP en agroalimentaire, curage', 'Spécialiste du nettoyage industriel et agroalimentaire, équipes formées HACCP et au travail en zone ATEX.', 'Prosper Ekwalla — Gérant'],
  people: [['p.ekwalla', 'Prosper Ekwalla', 'PROVIDER_MANAGER'], ['m.ondobo', 'Mariette Ondobo', 'FIELD_AGENT'], ['j.kamga', 'Junior Kamga', 'FIELD_AGENT'], ['s.eboa', 'Sidonie Eboa', 'FIELD_AGENT'],
   ['a.manga', 'Alphonse Manga', 'FIELD_AGENT'], ['c.ayissi', 'Clément Ayissi', 'FIELD_AGENT'], ['n.fouda', 'Nadia Fouda', 'FIELD_AGENT']] },
 { key: 'rempart', name: 'Rempart Sécurité Privée', kind: 'PROVIDER',
  profile: ['Rue Koloko, Bonapriso', 'Douala', '+237 233 42 71 13', 'centrale@rempart-securite.cm', 'M060900481537G', 'RC/DLA/2009/B/0981',
   'Gardiennage, rondes, contrôle d’accès, télésurveillance, maîtres-chiens', 'Société de sécurité privée agréée : 1 100 agents et une centrale de télésurveillance 24 h/24.', 'Gilbert Mbozo’o — Directeur des opérations'],
  people: [['g.mbozoo', 'Gilbert Mbozo’o', 'PROVIDER_MANAGER'], ['p.nlend', 'Paul Nlend', 'FIELD_AGENT'], ['y.essama', 'Yannick Essama', 'FIELD_AGENT'], ['a.hamadou', 'Ali Hamadou', 'FIELD_AGENT'],
   ['c.abega', 'Christian Abega', 'FIELD_AGENT'], ['m.bouba', 'Moussa Bouba', 'FIELD_AGENT']] },
 { key: 'ampere', name: 'Ampère & Fluides Services', kind: 'PROVIDER',
  profile: ['Ndogbong, route de l’aéroport', 'Douala', '+237 233 40 56 98', 'interventions@ampere-fluides.cm', 'M051600384927P', 'RC/DLA/2016/B/1874',
   'Électricité HT/BT, groupes électrogènes, plomberie, maintenance multitechnique', 'Maintenance multitechnique des bâtiments et des sites industriels, astreinte 24 h/24.', 'Didier Nguélé — Responsable travaux'],
  people: [['d.nguele', 'Didier Nguélé', 'PROVIDER_MANAGER'], ['f.tagne', 'Francis Tagne', 'FIELD_AGENT'], ['r.ekeke', 'Ruben Ekeke', 'FIELD_AGENT'], ['a.bassong', 'Achille Bassong', 'FIELD_AGENT']] },
 { key: 'arctica', name: 'Arctica Froid & Climatisation', kind: 'PROVIDER',
  profile: ['Bassa, rue des Frigoristes', 'Douala', '+237 233 37 44 05', 'sav@arctica-froid.cm', 'M121200573804A', 'RC/DLA/2012/B/2690',
   'Froid commercial et industriel, climatisation, centrales de traitement d’air, climatisation de précision', 'Frigoristes certifiés, contrats de maintenance pour la distribution, l’hôtellerie, la santé et les data centers.', 'Sylvain Moukouri — Chef d’agence'],
  people: [['s.moukouri', 'Sylvain Moukouri', 'PROVIDER_MANAGER'], ['b.ndzana', 'Bruno Ndzana', 'FIELD_AGENT'], ['l.tchakounte', 'Landry Tchakounté', 'FIELD_AGENT']] },
 { key: 'barriere', name: 'Barrière 3D Services', kind: 'PROVIDER',
  profile: ['Makepe, Douala', 'Douala', '+237 233 47 29 61', 'contact@barriere3d.cm', 'M031700925463K', 'RC/DLA/2017/B/0603',
   'Dératisation, désinsectisation, désinfection, lutte contre les termites', 'Traitements 3D pour l’agroalimentaire, la santé et l’hôtellerie, produits homologués.', 'Edwige Nkolo — Gérante'],
  people: [['e.nkolo', 'Edwige Nkolo', 'PROVIDER_MANAGER'], ['m.bikoro', 'Marcel Bikoro', 'FIELD_AGENT'], ['f.ongolo', 'Fabrice Ongolo', 'FIELD_AGENT']] },
 { key: 'jardins', name: 'Les Jardins du Mungo', kind: 'PROVIDER',
  profile: ['PK 12, route de Yabassi', 'Douala', '+237 233 47 81 36', 'devis@jardinsdumungo.cm', 'M081500461830J', 'RC/DLA/2015/B/2547',
   'Entretien d’espaces verts, élagage, arrosage automatique, aménagement paysager', 'Paysagistes et jardiniers pour résidences, hôtels et établissements scolaires.', 'Augustin Moto — Gérant'],
  people: [['a.moto', 'Augustin Moto', 'PROVIDER_MANAGER'], ['j.mbella', 'Joseph Mbella', 'FIELD_AGENT'], ['t.ekoume', 'Thérèse Ekoumè', 'FIELD_AGENT']] },
 { key: 'elevation', name: 'Élévation Ascenseurs Cameroun', kind: 'PROVIDER',
  profile: ['Akwa Nord, Douala', 'Douala', '+237 233 43 92 70', 'depannage@elevation-ascenseurs.cm', 'M071000347159E', 'RC/DLA/2010/B/1385',
   'Installation, maintenance et dépannage d’ascenseurs, de monte-charges et d’escaliers mécaniques', 'Ascensoriste multimarque, dépannage 24 h/24 avec délai d’intervention garanti.', 'Patrice Nyemb — Directeur technique'],
  people: [['p.nyemb', 'Patrice Nyemb', 'PROVIDER_MANAGER'], ['g.mpondo', 'Guy Mpondo', 'FIELD_AGENT'], ['e.moukam', 'Éric Moukam', 'FIELD_AGENT']] },
 { key: 'ignis', name: 'Ignis Protection Incendie', kind: 'PROVIDER',
  profile: ['Bonamoussadi, Douala', 'Douala', '+237 233 47 60 18', 'contact@ignis-incendie.cm', 'M041300862714I', 'RC/DLA/2013/B/0442',
   'Extincteurs, RIA, systèmes de sécurité incendie, désenfumage, formation des équipes', 'Vérifications réglementaires et maintenance des installations de sécurité incendie.', 'Rosine Ateba — Responsable technique'],
  people: [['r.ateba', 'Rosine Ateba', 'PROVIDER_MANAGER'], ['k.nkwenti', 'Kevin Nkwenti', 'FIELD_AGENT'], ['h.oumarou', 'Hamidou Oumarou', 'FIELD_AGENT']] },
 { key: 'ecotri', name: 'EcoTri Collecte & Valorisation', kind: 'PROVIDER',
  profile: ['Zone industrielle de Bassa', 'Douala', '+237 233 37 90 52', 'collecte@ecotri.cm', 'M091800238176C', 'RC/DLA/2018/B/3950',
   'Collecte des déchets banals et des DASRI, tri, huiles usagées, destruction d’archives', 'Collecte et valorisation des déchets, filière DASRI agréée.', 'Nathalie Engome — Directrice générale'],
  people: [['n.engome', 'Nathalie Engome', 'PROVIDER_MANAGER'], ['b.mveng', 'Boris Mveng', 'FIELD_AGENT'], ['i.zang', 'Isidore Zang', 'FIELD_AGENT']] },
 { key: 'biomedica', name: 'Biomédica Services Cameroun', kind: 'PROVIDER',
  profile: ['Bonanjo, Douala', 'Douala', '+237 233 42 35 89', 'service@biomedica.cm', 'M061400519372M', 'RC/DLA/2014/B/1123',
   'Maintenance biomédicale : imagerie, laboratoire, bloc opératoire, néonatologie', 'Ingénieurs et techniciens biomédicaux, contrats multimarques pour les établissements de santé.', 'Éric Sop — Ingénieur biomédical, gérant'],
  people: [['e.sop', 'Éric Sop', 'PROVIDER_MANAGER'], ['a.djomo', 'Armelle Djomo', 'FIELD_AGENT'], ['w.tamba', 'Wilfried Tamba', 'FIELD_AGENT']] },
 /* The two providers of the AFISA Food Industry presentation (same fictional companies as the fresh-install demo). */
 { key: 'hygieneplus', name: 'Hygiène Plus Services', kind: 'PROVIDER',
  profile: ['', 'Douala', '+237 600 00 00 02', 'contact@hygieneplus.example', '', '', 'Nettoyage industriel, désinfection, hygiène agroalimentaire',
   'Prestataire fictif de nettoyage sous contrat.', 'Martin Ekollo — Chef d’équipe'],
  people: [['m.ekollo', 'Martin Ekollo', 'PROVIDER_MANAGER'], ['j.bilong', 'Josiane Bilong', 'FIELD_AGENT'], ['a.ndoumbe', 'Arsène Ndoumbè', 'FIELD_AGENT']] },
 { key: 'mecatech', name: 'MécaTech Industrie', kind: 'PROVIDER',
  profile: ['', 'Douala', '+237 600 00 00 03', 'atelier@mecatech.example', '', '', 'Maintenance industrielle, mécanique, froid, électricité',
   'Prestataire fictif de maintenance ponctuelle.', 'Gervais Talla — Responsable atelier'],
  people: [['g.talla', 'Gervais Talla', 'PROVIDER_MANAGER'], ['y.nganou', 'Yves Nganou', 'FIELD_AGENT']] },
];

/* ---------- Client companies, one per kind of customer ---------- */
const WOURI_HOSPITAL = 'Hôpital privé Wouri Santé — Bonanjo';
const AFISA_PLANT = 'Usine de Bonabéri';
const clients: OrgDef[] = [
 { key: 'wouri', name: 'Groupe Médical Wouri Santé', kind: 'CLIENT',
  profile: ['Rue Njo-Njo, Bonapriso', 'Douala', '+237 233 42 18 60', 'services.generaux@wourisante.cm', 'M061700482931Q', 'RC/DLA/2017/B/2384',
   'Hospitalisation, urgences 24 h/24, chirurgie, maternité, imagerie, laboratoire', 'Groupe de santé privé : un hôpital à Bonanjo, deux cliniques et un centre de santé à Douala.', 'Josiane Ewodo — Directrice des services généraux'],
  sites: [
   { name: WOURI_HOSPITAL, sector: 'hospital', zones: [
    ['BAT-A', 'Bâtiment principal', 'BUILDING'], ['RDC', 'Rez-de-chaussée', 'FLOOR', 'BAT-A'], ['ACC', 'Hall d’accueil et admissions', 'AREA', 'RDC'],
    ['URG', 'Service des urgences', 'AREA', 'RDC'], ['URG-DECH', 'Salle de déchocage', 'ROOM', 'URG'], ['URG-B1', 'Box d’examen 1', 'ROOM', 'URG'], ['URG-B2', 'Box d’examen 2', 'ROOM', 'URG'],
    ['RAD', 'Imagerie médicale', 'AREA', 'RDC'], ['EQ-IRM', 'IRM 1,5 tesla', 'EQUIPMENT', 'RAD'], ['EQ-SCAN', 'Scanner 64 barrettes', 'EQUIPMENT', 'RAD'],
    ['ET-1', 'Premier étage', 'FLOOR', 'BAT-A'], ['SAL-101', 'Salle de consultation 101', 'ROOM', 'ET-1'], ['SAL-102', 'Salle de consultation 102', 'ROOM', 'ET-1'], ['SAL-103', 'Salle de consultation 103', 'ROOM', 'ET-1'],
    ['ET-2', 'Deuxième étage — Hospitalisation', 'FLOOR', 'BAT-A'], ...rooms(201, 206, 'Chambre', 'ET-2'), ['INF-2', 'Poste de soins infirmiers', 'ROOM', 'ET-2'],
    ['ET-3', 'Troisième étage — Bloc opératoire', 'FLOOR', 'BAT-A'], ['BLOC-1', 'Salle d’opération 1', 'ROOM', 'ET-3'], ['BLOC-2', 'Salle d’opération 2', 'ROOM', 'ET-3'],
    ['SSPI', 'Salle de réveil (SSPI)', 'ROOM', 'ET-3'], ['STER', 'Stérilisation centrale', 'ROOM', 'ET-3'], ['EQ-AUTO', 'Autoclave 600 litres', 'EQUIPMENT', 'STER'],
    ['ASC-1', 'Ascenseur brancardier', 'EQUIPMENT', 'BAT-A'],
    ['BAT-T', 'Bâtiment technique', 'BUILDING'], ['GE', 'Groupe électrogène 500 kVA', 'EQUIPMENT', 'BAT-T'], ['CTA', 'Centrale de traitement d’air du bloc', 'EQUIPMENT', 'BAT-T'],
    ['O2', 'Centrale d’oxygène médical', 'EQUIPMENT', 'BAT-T'], ['CUIS', 'Cuisine centrale', 'ROOM'], ['DASRI', 'Local DASRI (déchets de soins)', 'ROOM'], ['MORT', 'Chambre mortuaire', 'ROOM'],
   ] },
   { name: 'Clinique des Nations', sector: 'hospital', zones: [
    ['PAV-M', 'Pavillon mère-enfant', 'BUILDING'], ['PM-RDC', 'Rez-de-chaussée', 'FLOOR', 'PAV-M'], ['PM-CPN', 'Consultations prénatales', 'ROOM', 'PM-RDC'], ['PM-ECHO', 'Salle d’échographie', 'ROOM', 'PM-RDC'],
    ['PM-E1', '1er étage — Maternité', 'FLOOR', 'PAV-M'], ['PM-ACC1', 'Salle de naissance 1', 'ROOM', 'PM-E1'], ['PM-ACC2', 'Salle de naissance 2', 'ROOM', 'PM-E1'],
    ['PM-NEO', 'Unité de néonatologie', 'ROOM', 'PM-E1'], ['EQ-COUV', 'Couveuses (6 postes)', 'EQUIPMENT', 'PM-NEO'],
    ['PAV-C', 'Pavillon chirurgie', 'BUILDING'], ['PC-BLOC', 'Bloc opératoire', 'AREA', 'PAV-C'], ['PC-SAL1', 'Salle d’opération A', 'ROOM', 'PC-BLOC'], ['PC-REA', 'Réanimation (8 lits)', 'ROOM', 'PAV-C'],
    ['BUANDERIE', 'Buanderie et lingerie', 'ROOM'], ['CUISINE', 'Cuisine centrale', 'ROOM'],
   ] },
   { name: 'Clinique Les Palmiers — Bonapriso', sector: 'hospital', zones: [
    ['BAT-A', 'Bâtiment A — Hospitalisation', 'BUILDING'], ['A-RDC', 'Rez-de-chaussée', 'FLOOR', 'BAT-A'], ['A-ACC', 'Hall d’accueil et admissions', 'AREA', 'A-RDC'],
    ['A-URG', 'Service des urgences', 'AREA', 'A-RDC'], ['A-URG-B1', 'Box d’examen 1', 'ROOM', 'A-URG'], ['A-URG-B2', 'Box d’examen 2', 'ROOM', 'A-URG'],
    ['A-E1', '1er étage — Médecine', 'FLOOR', 'BAT-A'], ['A-101', 'Chambre 101', 'ROOM', 'A-E1'], ['A-102', 'Chambre 102', 'ROOM', 'A-E1'], ['A-103', 'Chambre 103', 'ROOM', 'A-E1'],
    ['A-104', 'Chambre 104', 'ROOM', 'A-E1'], ['A-INF1', 'Poste de soins infirmiers', 'ROOM', 'A-E1'],
    ['A-E2', '2e étage — Bloc opératoire', 'FLOOR', 'BAT-A'], ['A-BLOC1', 'Salle d’opération 1', 'ROOM', 'A-E2'], ['A-BLOC2', 'Salle d’opération 2', 'ROOM', 'A-E2'],
    ['A-SSPI', 'Salle de réveil (SSPI)', 'ROOM', 'A-E2'], ['A-STER', 'Stérilisation centrale', 'ROOM', 'A-E2'], ['EQ-AUTO1', 'Autoclave Matachana S1000', 'EQUIPMENT', 'A-STER'],
    ['BAT-B', 'Bâtiment B — Plateau technique', 'BUILDING'], ['B-RAD', 'Imagerie médicale', 'AREA', 'BAT-B'], ['EQ-SCAN', 'Scanner 64 barrettes', 'EQUIPMENT', 'B-RAD'],
    ['B-LAB', 'Laboratoire d’analyses', 'ROOM', 'BAT-B'], ['B-PHA', 'Pharmacie à usage intérieur', 'ROOM', 'BAT-B'], ['EXT-DASRI', 'Local DASRI (déchets de soins)', 'ROOM'],
   ] },
   { name: 'Centre de santé — Bonamoussadi', sector: 'hospital', zones: [
    ['CS', 'Bâtiment principal', 'BUILDING'], ['CS-ACC', 'Accueil et caisse', 'ROOM', 'CS'], ['CS-C1', 'Cabinet de consultation 1', 'ROOM', 'CS'], ['CS-C2', 'Cabinet de consultation 2', 'ROOM', 'CS'],
    ['CS-PED', 'Consultation pédiatrique', 'ROOM', 'CS'], ['CS-MAT', 'Salle d’accouchement', 'ROOM', 'CS'], ['CS-VAC', 'Salle de vaccination', 'ROOM', 'CS'],
    ['EQ-FRIG', 'Réfrigérateur à vaccins', 'EQUIPMENT', 'CS-VAC'], ['CS-LAB', 'Petit laboratoire', 'ROOM', 'CS'],
   ] },
  ],
  people: [['demo.client', 'Josiane Ewodo', 'CLIENT_MANAGER'], ['m.ngobiyong', 'Mireille Ngo Biyong', 'CLIENT_MANAGER'],
   ['demo.controleur', 'Alain Tchatchoua', 'CLIENT_CONTROLLER', [WOURI_HOSPITAL]], ['s.ekotto', 'Serge Ekotto', 'CLIENT_CONTROLLER', ['Clinique Les Palmiers — Bonapriso', 'Centre de santé — Bonamoussadi']],
   ['a.bello', 'Aïcha Bello', 'CLIENT_CONTROLLER', [WOURI_HOSPITAL, 'Clinique des Nations']], ['p.fotso', 'Patrick Fotso', 'CLIENT_CONTROLLER', [WOURI_HOSPITAL]]],
  providers: [['aloys'], ['biomedica'], ['ecotri'], ['barriere'], ['rempart', [WOURI_HOSPITAL]], ['ampere', [WOURI_HOSPITAL, 'Clinique des Nations']],
   ['arctica', [WOURI_HOSPITAL, 'Clinique Les Palmiers — Bonapriso']], ['elevation', [WOURI_HOSPITAL]], ['ignis', [WOURI_HOSPITAL, 'Clinique Les Palmiers — Bonapriso']]] },

 { key: 'colibris', name: 'Polyclinique Les Colibris', kind: 'CLIENT',
  profile: ['Rue 1.839, Bastos', 'Yaoundé', '+237 222 20 47 15', 'contact@lescolibris.cm', 'M091400731850C', 'RC/YAO/2014/B/1187',
   'Maternité, pédiatrie, gynécologie, consultations spécialisées', 'Polyclinique mère-enfant de 60 lits à Yaoundé, avec un centre de consultations à Mvog-Mbi.', 'Hélène Atangana — Directrice administrative'],
  sites: [
   { name: 'Polyclinique Les Colibris — Bastos, Yaoundé', sector: 'hospital', zones: [
    ['PAV-A', 'Pavillon A — Consultations', 'BUILDING'], ['A-ACC', 'Accueil et caisse', 'ROOM', 'PAV-A'], ['A-PED1', 'Cabinet de pédiatrie 1', 'ROOM', 'PAV-A'], ['A-PED2', 'Cabinet de pédiatrie 2', 'ROOM', 'PAV-A'],
    ['A-GYN', 'Cabinet de gynécologie', 'ROOM', 'PAV-A'], ['A-ECHO', 'Salle d’échographie', 'ROOM', 'PAV-A'], ['EQ-ECHO', 'Échographe 4D', 'EQUIPMENT', 'A-ECHO'],
    ['PAV-B', 'Pavillon B — Maternité', 'BUILDING'], ['B-E1', 'Étage — Suites de naissance', 'FLOOR', 'PAV-B'], ['B-NAI1', 'Salle de naissance 1', 'ROOM', 'B-E1'], ['B-NAI2', 'Salle de naissance 2', 'ROOM', 'B-E1'],
    ['B-NEO', 'Néonatologie', 'ROOM', 'B-E1'], ['EQ-COUV', 'Couveuses (8 postes)', 'EQUIPMENT', 'B-NEO'], ['B-CH', 'Chambres mère-enfant 1 à 12', 'AREA', 'PAV-B'], ['B-CES', 'Salle de césarienne', 'ROOM', 'PAV-B'],
    ['PHA', 'Pharmacie', 'ROOM'], ['LAB', 'Laboratoire', 'ROOM'], ['BUA', 'Buanderie', 'ROOM'], ['DASRI', 'Local DASRI (déchets de soins)', 'ROOM'],
   ] },
   { name: 'Centre de consultations Les Colibris — Mvog-Mbi', sector: 'hospital', zones: [
    ['CC', 'Bâtiment de consultations', 'BUILDING'], ['CC-ACC', 'Accueil et salle d’attente', 'ROOM', 'CC'], ['CC-C1', 'Cabinet 1', 'ROOM', 'CC'], ['CC-C2', 'Cabinet 2', 'ROOM', 'CC'], ['CC-C3', 'Cabinet 3', 'ROOM', 'CC'],
    ['CC-SOINS', 'Salle de soins', 'ROOM', 'CC'], ['CC-VAC', 'Salle de vaccination', 'ROOM', 'CC'], ['EQ-FRIGO', 'Réfrigérateur à vaccins', 'EQUIPMENT', 'CC-VAC'],
   ] },
  ],
  people: [['h.atangana', 'Hélène Atangana', 'CLIENT_MANAGER'], ['b.owona', 'Bertrand Owona', 'CLIENT_CONTROLLER']],
  providers: [['aloys'], ['biomedica'], ['ecotri'], ['barriere', ['Polyclinique Les Colibris — Bastos, Yaoundé']], ['arctica', ['Polyclinique Les Colibris — Bastos, Yaoundé']]] },

 { key: 'biolab', name: 'Laboratoires Biolittoral', kind: 'CLIENT',
  profile: ['Boulevard de la Liberté, Akwa', 'Douala', '+237 233 43 75 02', 'qualite@biolittoral.cm', 'M051200394716B', 'RC/DLA/2012/B/0958',
   'Analyses de biologie médicale, prélèvements à domicile, bilans d’entreprise', 'Réseau de laboratoires d’analyses : un plateau technique à Akwa et des centres de prélèvement.', 'Nadège Kotto — Responsable qualité'],
  sites: [
   { name: 'Laboratoire central — Akwa', sector: 'Laboratoire d’analyses médicales', zones: [
    ['LAB', 'Immeuble du laboratoire', 'BUILDING'], ['L-RDC', 'Rez-de-chaussée — Accueil', 'FLOOR', 'LAB'], ['L-ACC', 'Accueil et salle d’attente', 'ROOM', 'L-RDC'],
    ['L-PR1', 'Box de prélèvement 1', 'ROOM', 'L-RDC'], ['L-PR2', 'Box de prélèvement 2', 'ROOM', 'L-RDC'], ['L-PR3', 'Box de prélèvement 3', 'ROOM', 'L-RDC'],
    ['L-E1', '1er étage — Plateau technique', 'FLOOR', 'LAB'], ['L-BIO', 'Biochimie', 'ROOM', 'L-E1'], ['EQ-BIOCH', 'Automate de biochimie', 'EQUIPMENT', 'L-BIO'],
    ['L-HEM', 'Hématologie', 'ROOM', 'L-E1'], ['EQ-NFS', 'Automate d’hématologie', 'EQUIPMENT', 'L-HEM'], ['L-MIC', 'Microbiologie (P2)', 'ROOM', 'L-E1'],
    ['EQ-PSM', 'Poste de sécurité microbiologique', 'EQUIPMENT', 'L-MIC'], ['L-CF', 'Chambre froide des réactifs (+4 °C)', 'ROOM', 'L-E1'], ['L-DASRI', 'Local DASRI (déchets de soins)', 'ROOM'],
   ] },
   { name: 'Centre de prélèvement — Bonabéri', sector: 'Laboratoire d’analyses médicales', zones: [
    ['CP', 'Centre de prélèvement', 'BUILDING'], ['CP-ACC', 'Accueil', 'ROOM', 'CP'], ['CP-B1', 'Box de prélèvement 1', 'ROOM', 'CP'], ['CP-B2', 'Box de prélèvement 2', 'ROOM', 'CP'], ['CP-ATT', 'Salle d’attente', 'ROOM', 'CP'],
   ] },
  ],
  people: [['n.kotto', 'Nadège Kotto', 'CLIENT_MANAGER'], ['e.djoko', 'Emmanuel Djoko', 'CLIENT_CONTROLLER']],
  providers: [['aloys'], ['ecotri'], ['biomedica', ['Laboratoire central — Akwa']], ['arctica', ['Laboratoire central — Akwa']]] },

 { key: 'mangrove', name: 'Hôtels Mangrove', kind: 'CLIENT',
  profile: ['Avenue du Général de Gaulle, Bonanjo', 'Douala', '+237 233 50 12 00', 'exploitation@hotels-mangrove.cm', 'M101000286415H', 'RC/DLA/2010/B/0412',
   'Hôtellerie d’affaires et de loisirs, séminaires, restauration', 'Deux établissements : un hôtel d’affaires de 120 chambres à Douala et un resort en bord de mer à Kribi.', 'Olivier Mvondo — Directeur d’exploitation'],
  sites: [
   { name: 'Mangrove Hôtel — Bonanjo', sector: 'hotel', zones: [
    ['TOUR', 'Tour hôtel (9 niveaux)', 'BUILDING'], ['T-RDC', 'Rez-de-chaussée', 'FLOOR', 'TOUR'], ['T-HALL', 'Hall et réception', 'AREA', 'T-RDC'], ['T-REST', 'Restaurant Le Wouri', 'ROOM', 'T-RDC'],
    ['T-BAR', 'Bar lounge', 'ROOM', 'T-RDC'], ['T-CUIS', 'Cuisine', 'ROOM', 'T-RDC'], ['EQ-HOTTE', 'Hotte et extraction de la cuisine', 'EQUIPMENT', 'T-CUIS'], ['T-CF', 'Chambres froides de la cuisine', 'ROOM', 'T-RDC'],
    ['T-E1', '1er étage — Salons et séminaires', 'FLOOR', 'TOUR'], ['T-SAL1', 'Salle de conférence Akwa (120 places)', 'ROOM', 'T-E1'], ['T-SAL2', 'Salon Bonanjo (30 places)', 'ROOM', 'T-E1'],
    ['T-CH', 'Étages 2 à 8 — Chambres 201 à 820', 'AREA', 'TOUR'], ['T-SPA', 'Spa et salle de sport', 'ROOM', 'TOUR'], ['ASC-H', 'Ascenseurs clients (×2)', 'EQUIPMENT', 'TOUR'],
    ['PISC', 'Piscine extérieure', 'AREA'], ['EQ-PISC', 'Local de filtration de la piscine', 'EQUIPMENT', 'PISC'], ['BUA', 'Buanderie', 'ROOM'], ['SS-TECH', 'Local technique — production d’eau chaude', 'ROOM'],
   ] },
   { name: 'Mangrove Beach Resort — Kribi', sector: 'hotel', zones: [
    ['REC', 'Pavillon d’accueil', 'BUILDING'], ['R-HALL', 'Réception', 'ROOM', 'REC'], ['BUNG', 'Bungalows 1 à 24', 'AREA'], ['R-REST', 'Restaurant de plage', 'ROOM'], ['R-CUIS', 'Cuisine', 'ROOM'],
    ['R-PISC', 'Piscine à débordement', 'AREA'], ['R-PLAGE', 'Plage privée et paillotes', 'AREA'], ['R-EAU', 'Station de traitement d’eau', 'EQUIPMENT'], ['R-GE', 'Groupe électrogène 250 kVA', 'EQUIPMENT'],
    ['R-JARD', 'Jardins tropicaux', 'AREA'],
   ] },
  ],
  people: [['o.mvondo', 'Olivier Mvondo', 'CLIENT_MANAGER'], ['s.epee', 'Sandrine Epée', 'CLIENT_CONTROLLER']],
  providers: [['eclat'], ['rempart'], ['ampere'], ['arctica'], ['barriere'], ['elevation', ['Mangrove Hôtel — Bonanjo']], ['ignis', ['Mangrove Hôtel — Bonanjo']], ['jardins', ['Mangrove Beach Resort — Kribi']]] },

 { key: 'kalaba', name: 'Kalaba Finance', kind: 'CLIENT',
  profile: ['Place du Gouvernement, Bonanjo', 'Douala', '+237 233 42 90 00', 'moyens.generaux@kalabafinance.cm', 'M020800157392K', 'RC/DLA/2008/B/0217',
   'Banque de détail, banque d’entreprise, transferts d’argent', 'Banque commerciale : siège à Bonanjo et trois agences au Cameroun.', 'Roland Essomba — Responsable des moyens généraux'],
  sites: [
   { name: 'Siège Kalaba Finance — Bonanjo', sector: 'Banque', zones: [
    ['IMM', 'Immeuble du siège (7 niveaux)', 'BUILDING'], ['I-RDC', 'Rez-de-chaussée — Agence principale', 'FLOOR', 'IMM'], ['I-GUI', 'Espace guichets', 'AREA', 'I-RDC'],
    ['I-COFF', 'Salle des coffres', 'ROOM', 'I-RDC'], ['EQ-GAB1', 'Guichet automatique en façade', 'EQUIPMENT', 'I-RDC'], ['I-E1', '1er étage — Direction générale', 'FLOOR', 'IMM'],
    ['I-CONS', 'Salle du conseil d’administration', 'ROOM', 'I-E1'], ['I-E2', 'Étages 2 à 6 — Directions métiers', 'AREA', 'IMM'], ['I-INFO', 'Salle informatique', 'ROOM', 'IMM'],
    ['EQ-CLIM-P', 'Climatisation de précision (×2)', 'EQUIPMENT', 'I-INFO'], ['EQ-OND', 'Onduleurs 2 × 120 kVA', 'EQUIPMENT', 'I-INFO'], ['I-ASC', 'Ascenseurs (×3)', 'EQUIPMENT', 'IMM'],
    ['I-PARK', 'Parking souterrain', 'AREA'], ['I-GE', 'Groupe électrogène 800 kVA', 'EQUIPMENT'],
   ] },
   { name: 'Agence Kalaba Finance — Akwa', sector: 'Banque', zones: bankAgency() },
   { name: 'Agence Kalaba Finance — Bastos, Yaoundé', sector: 'Banque', zones: bankAgency() },
   { name: 'Agence Kalaba Finance — Bafoussam', sector: 'Banque', zones: bankAgency() },
  ],
  people: [['r.essomba', 'Roland Essomba', 'CLIENT_MANAGER'], ['f.moukoko', 'Francine Moukoko', 'CLIENT_CONTROLLER', ['Siège Kalaba Finance — Bonanjo', 'Agence Kalaba Finance — Akwa']],
   ['d.ebogo', 'Daniel Ebogo', 'CLIENT_CONTROLLER', ['Agence Kalaba Finance — Bastos, Yaoundé', 'Agence Kalaba Finance — Bafoussam']]],
  providers: [['eclat'], ['rempart'], ['ampere'], ['ignis'], ['arctica', ['Siège Kalaba Finance — Bonanjo']], ['elevation', ['Siège Kalaba Finance — Bonanjo']]] },

 { key: 'kassa', name: 'Kassa Distribution', kind: 'CLIENT',
  profile: ['Carrefour Ndokoti', 'Douala', '+237 233 39 64 20', 'technique@kassa-distribution.cm', 'M111500846203D', 'RC/DLA/2015/B/3307',
   'Hypermarchés et supermarchés : alimentaire, produits frais, produits ménagers', 'Enseigne de grande distribution : un hypermarché et deux supermarchés à Douala et Yaoundé.', 'Ibrahim Adamou — Directeur technique et sécurité'],
  sites: [
   { name: 'Hypermarché Kassa — Ndokoti', sector: 'Grande distribution', zones: [
    ['MAG', 'Bâtiment commercial', 'BUILDING'], ['VENTE', 'Surface de vente (6 500 m²)', 'AREA', 'MAG'], ['V-FRAIS', 'Rayons frais et surgelés', 'AREA', 'VENTE'],
    ['EQ-VITR', 'Vitrines réfrigérées (42 mètres linéaires)', 'EQUIPMENT', 'V-FRAIS'], ['V-BOUCH', 'Boucherie', 'ROOM', 'VENTE'], ['V-POIS', 'Poissonnerie', 'ROOM', 'VENTE'],
    ['V-BOUL', 'Boulangerie-pâtisserie', 'ROOM', 'VENTE'], ['EQ-FOUR', 'Four à sole', 'EQUIPMENT', 'V-BOUL'], ['V-CAISS', 'Ligne de caisses (1 à 18)', 'AREA', 'VENTE'],
    ['RESERVE', 'Réserve', 'AREA', 'MAG'], ['CF-POS', 'Chambre froide positive', 'ROOM', 'RESERVE'], ['CF-NEG', 'Chambre froide négative (−22 °C)', 'ROOM', 'RESERVE'],
    ['QUAI', 'Quai de réception', 'AREA', 'MAG'], ['SAN-CLI', 'Sanitaires clients', 'ROOM', 'MAG'], ['PARK', 'Parking clients (350 places)', 'AREA'], ['DECH', 'Aire de déchets et compacteur', 'AREA'],
   ] },
   { name: 'Supermarché Kassa — Bonamoussadi', sector: 'Grande distribution', zones: supermarket() },
   { name: 'Supermarché Kassa — Mvan, Yaoundé', sector: 'Grande distribution', zones: supermarket() },
  ],
  people: [['i.adamou', 'Ibrahim Adamou', 'CLIENT_MANAGER'], ['c.ngah', 'Christelle Ngah', 'CLIENT_CONTROLLER', ['Hypermarché Kassa — Ndokoti', 'Supermarché Kassa — Bonamoussadi']],
   ['m.zambo', 'Martial Zambo', 'CLIENT_CONTROLLER', ['Supermarché Kassa — Mvan, Yaoundé']]],
  providers: [['eclat'], ['rempart'], ['arctica'], ['barriere'], ['ecotri', ['Hypermarché Kassa — Ndokoti']], ['ignis', ['Hypermarché Kassa — Ndokoti']], ['ampere', ['Hypermarché Kassa — Ndokoti']]] },

 { key: 'moungo', name: 'Huileries et Savonneries du Moungo', kind: 'CLIENT',
  profile: ['Zone industrielle de Njombé', 'Njombé', '+237 233 49 21 77', 'maintenance@hsmoungo.cm', 'M039500218640F', 'RC/NKS/1995/B/0061',
   'Huile de palme raffinée, savons de ménage, tourteaux', 'Huilerie et savonnerie industrielles de 280 salariés, avec un dépôt de distribution à Bonabéri.', 'Jean-Pierre Ndjock — Responsable maintenance et HSE'],
  sites: [
   { name: 'Usine de Njombé', sector: 'Industrie agroalimentaire', zones: [
    ['HUIL', 'Huilerie', 'BUILDING'], ['H-RCP', 'Réception des régimes', 'AREA', 'HUIL'], ['H-STER', 'Stérilisation', 'AREA', 'HUIL'], ['EQ-STER', 'Stérilisateurs horizontaux (×3)', 'EQUIPMENT', 'H-STER'],
    ['H-PRES', 'Atelier de pressage', 'AREA', 'HUIL'], ['EQ-PRES1', 'Presse à vis P1', 'EQUIPMENT', 'H-PRES'], ['EQ-PRES2', 'Presse à vis P2', 'EQUIPMENT', 'H-PRES'], ['H-CLAR', 'Clarification', 'AREA', 'HUIL'],
    ['RAFF', 'Raffinerie', 'BUILDING'], ['SAV', 'Savonnerie', 'BUILDING'], ['S-SAPO', 'Saponification', 'AREA', 'SAV'], ['EQ-CUVE', 'Cuves de saponification (×2)', 'EQUIPMENT', 'S-SAPO'],
    ['S-COND', 'Ligne de conditionnement', 'AREA', 'SAV'], ['EQ-BOUD', 'Boudineuse et estampeuse', 'EQUIPMENT', 'S-COND'], ['CHAUF', 'Chaufferie', 'ROOM'], ['EQ-CHAUD', 'Chaudière vapeur 10 t/h', 'EQUIPMENT', 'CHAUF'],
    ['LABO', 'Laboratoire qualité', 'ROOM'], ['STEP', 'Station d’épuration', 'AREA'], ['MAG-PF', 'Magasin des produits finis', 'AREA'], ['VEST', 'Vestiaires et sanitaires', 'ROOM'], ['CANT', 'Cantine du personnel', 'ROOM'],
   ] },
   { name: 'Dépôt de Bonabéri', sector: 'Industrie agroalimentaire', zones: [
    ['ENT', 'Entrepôt', 'BUILDING'], ['E-STOCK', 'Zone de stockage palettisé', 'AREA', 'ENT'], ['E-QUAI', 'Quais de chargement', 'AREA', 'ENT'], ['E-BUR', 'Bureaux commerciaux', 'ROOM', 'ENT'],
   ] },
  ],
  people: [['jp.ndjock', 'Jean-Pierre Ndjock', 'CLIENT_MANAGER'], ['l.tsafack', 'Lydie Tsafack', 'CLIENT_CONTROLLER']],
  providers: [['bleuazur'], ['rempart'], ['barriere'], ['ignis'], ['ampere', ['Usine de Njombé']], ['ecotri', ['Usine de Njombé']]] },

 { key: 'bonanjo', name: 'Bonanjo Properties', kind: 'CLIENT',
  profile: ['Rue Joss, Bonanjo', 'Douala', '+237 233 42 66 30', 'gestion@bonanjo-properties.cm', 'M071300594128N', 'RC/DLA/2013/B/1752',
   'Gestion d’immeubles de bureaux, de centres commerciaux et de résidences', 'Société de gestion immobilière : une tour de bureaux, un centre commercial et une résidence à Douala.', 'Aurélie Biloa — Directrice technique'],
  sites: [
   { name: 'Tour Horizon — Bonanjo', sector: 'property', zones: [
    ['TOUR', 'Tour Horizon (14 niveaux)', 'BUILDING'], ['T-HALL', 'Hall d’entrée et accueil', 'AREA', 'TOUR'], ['T-PLAT', 'Étages 1 à 12 — Plateaux de bureaux', 'AREA', 'TOUR'],
    ['T-ROOF', 'Rooftop et terrasse', 'AREA', 'TOUR'], ['T-SAN', 'Sanitaires communs (chaque étage)', 'ROOM', 'TOUR'], ['ASC-A', 'Ascenseur A', 'EQUIPMENT', 'TOUR'], ['ASC-B', 'Ascenseur B', 'EQUIPMENT', 'TOUR'],
    ['ASC-C', 'Ascenseur C', 'EQUIPMENT', 'TOUR'], ['MC', 'Monte-charge', 'EQUIPMENT', 'TOUR'], ['T-SSI', 'Système de sécurité incendie (SSI)', 'EQUIPMENT', 'TOUR'],
    ['SS', 'Sous-sols', 'FLOOR', 'TOUR'], ['SS-PARK', 'Parking (2 niveaux, 180 places)', 'AREA', 'SS'], ['SS-GE', 'Groupe électrogène 1 000 kVA', 'EQUIPMENT', 'SS'], ['SS-BACHE', 'Bâche à eau et surpresseurs', 'EQUIPMENT', 'SS'],
   ] },
   { name: 'Centre commercial Rivage — Bonapriso', sector: 'property', zones: [
    ['CC', 'Centre commercial', 'BUILDING'], ['CC-GAL', 'Galerie marchande (42 boutiques)', 'AREA', 'CC'], ['CC-FOOD', 'Food court', 'AREA', 'CC'], ['CC-SAN', 'Sanitaires publics', 'ROOM', 'CC'],
    ['CC-ESC', 'Escaliers mécaniques (×4)', 'EQUIPMENT', 'CC'], ['CC-ASC', 'Ascenseur panoramique', 'EQUIPMENT', 'CC'], ['CC-PARK', 'Parking extérieur', 'AREA'], ['CC-DECH', 'Local déchets', 'ROOM'],
   ] },
   { name: 'Résidence Les Hibiscus — Bonapriso', sector: 'property', zones: [
    ['RES-A', 'Bâtiment A (24 appartements)', 'BUILDING'], ['RES-B', 'Bâtiment B (24 appartements)', 'BUILDING'], ['A-HALL', 'Hall et cage d’escalier A', 'AREA', 'RES-A'],
    ['B-HALL', 'Hall et cage d’escalier B', 'AREA', 'RES-B'], ['A-ASC', 'Ascenseur A', 'EQUIPMENT', 'RES-A'], ['B-ASC', 'Ascenseur B', 'EQUIPMENT', 'RES-B'],
    ['PISC', 'Piscine', 'AREA'], ['JARD', 'Jardins', 'AREA'], ['LOGE', 'Loge du gardien', 'ROOM'], ['PARK', 'Parking des résidents', 'AREA'],
   ] },
  ],
  people: [['a.biloa', 'Aurélie Biloa', 'CLIENT_MANAGER'], ['s.tchinda', 'Stéphane Tchinda', 'CLIENT_CONTROLLER', ['Tour Horizon — Bonanjo', 'Centre commercial Rivage — Bonapriso']],
   ['p.ondoa', 'Prisca Ondoa', 'CLIENT_CONTROLLER', ['Résidence Les Hibiscus — Bonapriso']]],
  providers: [['eclat'], ['rempart'], ['ampere'], ['elevation'], ['ignis'], ['jardins', ['Résidence Les Hibiscus — Bonapriso']],
   ['barriere', ['Centre commercial Rivage — Bonapriso']], ['ecotri', ['Centre commercial Rivage — Bonapriso']]] },

 { key: 'cargo', name: 'Littoral Cargo & Logistique', kind: 'CLIENT',
  profile: ['Zone industrielle de Bassa', 'Douala', '+237 233 37 18 45', 'exploitation@littoralcargo.cm', 'M081800673051L', 'RC/DLA/2018/B/4410',
   'Entreposage, préparation de commandes, transport routier, logistique du froid', 'Logisticien : plateforme de 12 000 m² à Douala et base de distribution à Yaoundé.', 'Blaise Nana — Directeur des opérations'],
  sites: [
   { name: 'Plateforme logistique — Zone industrielle de Bassa', sector: 'Logistique', zones: [
    ['HAL1', 'Hall de stockage 1', 'BUILDING'], ['H1-RCP', 'Zone de réception', 'AREA', 'HAL1'], ['H1-RAY', 'Allées de rayonnage A à F', 'AREA', 'HAL1'], ['H1-PREP', 'Zone de préparation de commandes', 'AREA', 'HAL1'],
    ['EQ-CHAR1', 'Chariot élévateur électrique 2,5 t', 'EQUIPMENT', 'H1-RCP'], ['EQ-CHAR2', 'Chariot élévateur 3 t', 'EQUIPMENT', 'H1-PREP'],
    ['HAL2', 'Hall de stockage 2 — Froid', 'BUILDING'], ['H2-CFP', 'Chambre froide positive (+2/+8 °C)', 'ROOM', 'HAL2'], ['H2-CFN', 'Chambre froide négative (−20 °C)', 'ROOM', 'HAL2'],
    ['QUAIS', 'Quais de chargement 1 à 6', 'AREA'], ['ATEL', 'Atelier de maintenance des chariots', 'ROOM'],
    ['BUR-LOG', 'Bureaux d’exploitation', 'BUILDING'], ['BL-VEST', 'Vestiaires et douches', 'ROOM', 'BUR-LOG'], ['BL-REF', 'Réfectoire', 'ROOM', 'BUR-LOG'],
   ] },
   { name: 'Base de distribution — Nsam, Yaoundé', sector: 'Logistique', zones: [
    ['ENT', 'Entrepôt', 'BUILDING'], ['E-STOCK', 'Zone de stockage', 'AREA', 'ENT'], ['E-QUAIS', 'Quais (1 à 4)', 'AREA', 'ENT'], ['ATEL-PL', 'Atelier poids lourds', 'ROOM'],
    ['EQ-PONT', 'Pont élévateur 20 t', 'EQUIPMENT', 'ATEL-PL'], ['LAV', 'Station de lavage des camions', 'AREA'], ['BUR', 'Bureaux d’exploitation', 'ROOM'],
   ] },
  ],
  people: [['b.nana', 'Blaise Nana', 'CLIENT_MANAGER'], ['r.edimo', 'Rachel Edimo', 'CLIENT_CONTROLLER']],
  providers: [['bleuazur'], ['rempart'], ['ignis'], ['arctica', ['Plateforme logistique — Zone industrielle de Bassa']], ['ampere', ['Plateforme logistique — Zone industrielle de Bassa']]] },

 { key: 'acacias', name: 'Groupe Scolaire Bilingue Les Acacias', kind: 'CLIENT',
  profile: ['Logpom, Douala', 'Douala', '+237 233 47 03 18', 'intendance@lesacacias.cm', 'M050900478216S', 'RC/DLA/2009/B/0733',
   'Enseignement maternel, primaire et secondaire bilingue, internat', 'Établissement privé laïc bilingue de 1 400 élèves sur deux campus.', 'Pascal Eloundou — Intendant général'],
  sites: [
   { name: 'Campus de Logpom — Douala', sector: 'Enseignement', zones: [
    ['MAT', 'Bâtiment maternelle', 'BUILDING'], ['M-CL', 'Classes de maternelle (×6)', 'AREA', 'MAT'], ['M-SIESTE', 'Salle de sieste', 'ROOM', 'MAT'],
    ['PRIM', 'Bâtiment primaire', 'BUILDING'], ['P-CL', 'Classes du CP au CM2 (×12)', 'AREA', 'PRIM'],
    ['SEC', 'Bâtiment secondaire', 'BUILDING'], ['S-CL', 'Salles de classe de la 6e à la Terminale (×18)', 'AREA', 'SEC'], ['S-LABO', 'Laboratoire de sciences', 'ROOM', 'SEC'], ['S-INFO', 'Salle informatique', 'ROOM', 'SEC'],
    ['BIBL', 'Bibliothèque', 'ROOM'], ['REF', 'Réfectoire et cuisine', 'ROOM'], ['INFIR', 'Infirmerie', 'ROOM'], ['SAN-EL', 'Blocs sanitaires des élèves (×4)', 'AREA'],
    ['SPORT', 'Terrain de sport et préau', 'AREA'], ['INT', 'Internat (filles et garçons)', 'BUILDING'],
   ] },
   { name: 'Campus d’Odza — Yaoundé', sector: 'Enseignement', zones: [
    ['BAT', 'Bâtiment principal', 'BUILDING'], ['B-CL', 'Salles de classe (×14)', 'AREA', 'BAT'], ['B-ADM', 'Administration', 'ROOM', 'BAT'], ['B-SAN', 'Sanitaires des élèves', 'AREA', 'BAT'],
    ['COUR', 'Cour de récréation', 'AREA'], ['CANT', 'Cantine', 'ROOM'],
   ] },
  ],
  people: [['p.eloundou', 'Pascal Eloundou', 'CLIENT_MANAGER'], ['v.ngassa', 'Viviane Ngassa', 'CLIENT_CONTROLLER']],
  providers: [['eclat'], ['rempart'], ['barriere'], ['jardins', ['Campus de Logpom — Douala']], ['ampere', ['Campus de Logpom — Douala']]] },

 { key: 'delices', name: 'Délices du Littoral', kind: 'CLIENT',
  profile: ['Zone portuaire de Bonabéri', 'Douala', '+237 233 39 80 54', 'qualite@delicesdulittoral.cm', 'M071600529384R', 'RC/DLA/2016/B/2961',
   'Restauration collective d’entreprise, traiteur, restaurants', 'Cuisine centrale de 4 000 repas par jour et restaurant Le Comptoir à Akwa.', 'Gaëlle Mbouda — Responsable qualité et hygiène'],
  sites: [
   { name: 'Cuisine centrale — Bonabéri', sector: 'Restauration', zones: [
    ['CUIS', 'Cuisine centrale', 'BUILDING'], ['C-RCP', 'Réception des marchandises', 'AREA', 'CUIS'], ['C-LEG', 'Légumerie', 'ROOM', 'CUIS'], ['C-FROID', 'Préparation froide', 'ROOM', 'CUIS'],
    ['C-CHAUD', 'Zone de cuisson', 'ROOM', 'CUIS'], ['EQ-SAUT', 'Sauteuses basculantes (×2)', 'EQUIPMENT', 'C-CHAUD'], ['EQ-FMIX', 'Fours mixtes (×3)', 'EQUIPMENT', 'C-CHAUD'],
    ['C-PLONGE', 'Plonge batterie', 'ROOM', 'CUIS'], ['C-CF1', 'Chambre froide viandes (0/+2 °C)', 'ROOM', 'CUIS'], ['C-CF2', 'Chambre froide légumes (+4 °C)', 'ROOM', 'CUIS'],
    ['C-EXP', 'Quai d’expédition des repas', 'AREA', 'CUIS'], ['C-VEST', 'Vestiaires du personnel', 'ROOM'],
   ] },
   { name: 'Restaurant Le Comptoir — Akwa', sector: 'Restauration', zones: [
    ['REST', 'Restaurant', 'BUILDING'], ['R-SALLE', 'Salle (90 couverts)', 'AREA', 'REST'], ['R-TERR', 'Terrasse', 'AREA', 'REST'], ['R-BAR', 'Bar', 'ROOM', 'REST'],
    ['R-CUIS', 'Cuisine', 'ROOM', 'REST'], ['EQ-HOTTE', 'Hotte d’extraction', 'EQUIPMENT', 'R-CUIS'], ['R-SAN', 'Sanitaires clients', 'ROOM', 'REST'],
   ] },
  ],
  people: [['g.mbouda', 'Gaëlle Mbouda', 'CLIENT_MANAGER'], ['t.kingue', 'Thomas Kingue', 'CLIENT_CONTROLLER']],
  providers: [['bleuazur'], ['arctica'], ['barriere'], ['ecotri', ['Cuisine centrale — Bonabéri']], ['ampere', ['Cuisine centrale — Bonabéri']], ['ignis', ['Restaurant Le Comptoir — Akwa']]] },

 { key: 'sanaga', name: 'Sanaga Pétrole Distribution', kind: 'CLIENT',
  profile: ['Bonabéri, route de Bekoko', 'Douala', '+237 233 39 14 90', 'hse@sanagapetrole.cm', 'M020300318745E', 'RC/DLA/2003/B/0388',
   'Distribution de carburants et de lubrifiants, stations-service, dépôt de stockage', 'Distributeur de produits pétroliers : deux stations-service et un dépôt de stockage.', 'Valentin Ekambi — Responsable HSE'],
  sites: [
   { name: 'Station-service Ndokoti', sector: 'Énergie et carburants', zones: fuelStation() },
   { name: 'Station-service Mvan — Yaoundé', sector: 'Énergie et carburants', zones: fuelStation() },
   { name: 'Dépôt de stockage — Bonabéri', sector: 'Énergie et carburants', zones: [
    ['BACS', 'Parc de bacs', 'AREA'], ['EQ-BAC1', 'Bac n° 1 — Gasoil (2 000 m³)', 'EQUIPMENT', 'BACS'], ['EQ-BAC2', 'Bac n° 2 — Super (1 500 m³)', 'EQUIPMENT', 'BACS'],
    ['POMP', 'Pomperie', 'ROOM'], ['CHARG', 'Poste de chargement des camions', 'AREA'], ['CTRL', 'Salle de contrôle', 'ROOM'], ['INC', 'Réseau incendie et réserve d’émulseur', 'EQUIPMENT'],
    ['BUR', 'Bâtiment administratif', 'BUILDING'],
   ] },
  ],
  people: [['v.ekambi', 'Valentin Ekambi', 'CLIENT_MANAGER'], ['j.abanda', 'Josué Abanda', 'CLIENT_CONTROLLER']],
  providers: [['rempart'], ['ignis'], ['ampere'], ['eclat', ['Station-service Ndokoti', 'Station-service Mvan — Yaoundé']], ['bleuazur', ['Dépôt de stockage — Bonabéri']]] },

 { key: 'nyanga', name: 'Nyanga Data Center', kind: 'CLIENT',
  profile: ['Logbaba, Douala', 'Douala', '+237 233 47 55 60', 'noc@nyanga-dc.cm', 'M011900741563T', 'RC/DLA/2019/B/5127',
   'Hébergement de serveurs, colocation, cloud privé', 'Centre de données Tier III de 400 baies à Douala.', 'Arnaud Fotsing — Responsable des installations'],
  sites: [
   { name: 'Nyanga Data Center — Logbaba', sector: 'Data center', zones: [
    ['DC', 'Bâtiment du data center', 'BUILDING'], ['SAS', 'Sas de contrôle d’accès', 'ROOM', 'DC'], ['SALLE-1', 'Salle informatique 1 (200 baies)', 'ROOM', 'DC'],
    ['SALLE-2', 'Salle informatique 2 (200 baies)', 'ROOM', 'DC'], ['EQ-CRAC', 'Climatiseurs de précision (×8)', 'EQUIPMENT', 'DC'], ['ELEC', 'Salle électrique', 'ROOM', 'DC'],
    ['EQ-UPS', 'Onduleurs 2 × 500 kVA', 'EQUIPMENT', 'ELEC'], ['NOC', 'Salle de supervision (NOC)', 'ROOM', 'DC'], ['EXTINC', 'Extinction automatique au gaz', 'EQUIPMENT', 'DC'],
    ['GE', 'Groupes électrogènes 2 × 1 250 kVA', 'EQUIPMENT'], ['CUVE', 'Cuve de gasoil (72 h d’autonomie)', 'EQUIPMENT'], ['TOIT', 'Toiture — condenseurs', 'AREA'],
   ] },
  ],
  people: [['a.fotsing', 'Arnaud Fotsing', 'CLIENT_MANAGER'], ['l.mballa', 'Laure Mballa', 'CLIENT_CONTROLLER']],
  providers: [['eclat'], ['rempart'], ['arctica'], ['ampere'], ['ignis']] },

 /* Presentation at AFISA Food Industry: an agri-food plant, contract cleaning and one-off industrial maintenance.
    The company, its record, places, equipment, people and activity are fictional but written to look real. */
 { key: 'afisa', name: 'AFISA Food Industry', kind: 'CLIENT',
  profile: ['Zone industrielle de Bonabéri, route de Bekoko', 'Douala', '+237 600 00 00 01', 'services.generaux@afisa.example', 'M091300528417A', 'RC/DLA/2013/B/1406', 'Industrie agroalimentaire', AFISA_DESCRIPTION, 'Carine Ebode — Responsable services généraux'],
  sites: [
   { name: AFISA_PLANT, sector: 'Industrie agroalimentaire', zones: [
    ['BAT-P', 'Bâtiment de production', 'BUILDING'], ['ZN-RCP', 'Réception des matières premières', 'AREA', 'BAT-P'], ['ZN-PRE', 'Zone de préparation', 'AREA', 'BAT-P'],
    ['EQ-MEL1', 'Mélangeur M1 (500 L)', 'EQUIPMENT', 'ZN-PRE'], ['ZN-CUI', 'Zone de cuisson', 'AREA', 'BAT-P'], ['EQ-FOU1', 'Four tunnel F1', 'EQUIPMENT', 'ZN-CUI'],
    ['SAL-CDT', 'Salle de conditionnement', 'ROOM', 'BAT-P'], ['EQ-CON2', 'Convoyeur ligne 2', 'EQUIPMENT', 'SAL-CDT'], ['EQ-ENS1', 'Ensacheuse E1', 'EQUIPMENT', 'SAL-CDT'],
    ['CF-POS', 'Chambre froide positive (+4 °C)', 'ROOM', 'BAT-P'], ['CF-NEG', 'Chambre froide négative (−18 °C)', 'ROOM', 'BAT-P'], ['SAS-HYG', 'Sas d’hygiène et vestiaires', 'ROOM', 'BAT-P'],
    ['LABO-Q', 'Laboratoire qualité', 'ROOM', 'BAT-P'], ['LOC-TECH', 'Local technique', 'ROOM', 'BAT-P'], ['EQ-COMP', 'Compresseur d’air 37 kW', 'EQUIPMENT', 'LOC-TECH'],
    ['BAT-L', 'Bâtiment logistique', 'BUILDING'], ['QUAI-EXP', 'Quai d’expédition', 'AREA', 'BAT-L'], ['BAT-A', 'Bâtiment administratif', 'BUILDING'], ['SAL-REU', 'Salle de réunion', 'ROOM', 'BAT-A'],
   ] },
  ],
  people: [['c.ebode', 'Carine Ebode', 'CLIENT_MANAGER'], ['l.tchamba', 'Laurence Tchamba', 'CLIENT_CONTROLLER']],
  providers: [['hygieneplus'], ['mecatech']] },
];

/* ---------- A few weeks of activity for each client ---------- */
const activity: Activity[] = [
 { client: 'wouri', site: WOURI_HOSPITAL, manager: 'm.ngobiyong', controller: 'a.bello',
  cleaning: { provider: 'aloys', title: 'Bionettoyage quotidien — urgences et bloc opératoire', weekdays: ALL_DAYS, from: '05:30', to: '07:15', team: ['i.moussa', 'c.eyenga'],
   description: 'Protocole de bionettoyage en trois temps. Bloc prêt avant le premier patient de 07h30. Détergent-désinfectant conforme à la norme EN 14476.',
   zones: ['URG', 'URG-DECH', 'BLOC-1', 'BLOC-2', 'SSPI'],
   tasks: ['Dépoussiérage humide des surfaces hautes et des scialytiques', 'Bionettoyage des tables d’opération et des surfaces de soins', 'Lavage-désinfection des sols à l’autolaveuse',
    'Évacuation des déchets DASRI vers le local dédié', 'Réapprovisionnement des distributeurs de solution hydroalcoolique'],
   report: 'Bloc opératoire prêt à 07h10. Traçabilité des produits notée sur la fiche du bloc.', rework: 'Traces de sang séché sous la table d’opération de la salle 2. Reprise demandée avant le premier patient.' },
  maintenance: [
   { provider: 'biomedica', zones: ['EQ-IRM'], title: 'Maintenance préventive semestrielle de l’IRM', stage: 'quoted', day: 4, from: '07:00', to: '13:00', tech: 'a.djomo',
    description: 'Contrôle constructeur : niveau d’hélium, bobines, chaîne radiofréquence. Imagerie fermée le samedi matin.',
    tasks: ['Contrôle du niveau d’hélium et du compresseur', 'Tests de qualité d’image sur fantôme', 'Vérification de la cage de Faraday'],
    quote: [2850000, 3, 'Visite préventive semestrielle, fantôme de contrôle et rapport de conformité. Pièces hors forfait sur devis.'] },
   { provider: 'ampere', zones: ['GE'], title: 'Essai mensuel en charge du groupe électrogène', stage: 'done', day: -6, from: '06:00', to: '08:00', tech: 'f.tagne',
    description: 'Essai obligatoire avec basculement réel de l’alimentation du bloc opératoire.',
    tasks: ['Contrôle des niveaux (huile, gasoil, liquide de refroidissement)', 'Basculement réseau / groupe en charge pendant 45 minutes', 'Relevé des paramètres et retour sur le réseau'],
    report: 'Basculement en 9 secondes. Groupe stable en charge à 62 %. Suintement constaté sur la durite de retour gasoil.',
    anomaly: { zone: 'GE', title: 'Suintement sur la durite de retour gasoil', description: 'Traces de gasoil sous le raccord de retour.', resolution: 'Durite commandée, remplacement prévu à la prochaine visite.' } },
   { provider: 'arctica', zones: ['CTA'], title: 'Filtres terminaux du bloc opératoire à remplacer', stage: 'requested', urgent: true, day: 2, from: '19:00', to: '23:00',
    description: 'Pression différentielle hors tolérance sur la CTA du bloc. Intervention à faire avant la reprise du programme opératoire.',
    tasks: ['Remplacement des filtres terminaux HEPA', 'Contrôle des pressions différentielles', 'Comptage particulaire après intervention'] },
  ] },
 { client: 'colibris', site: 'Polyclinique Les Colibris — Bastos, Yaoundé', manager: 'h.atangana', controller: 'b.owona',
  cleaning: { provider: 'aloys', title: 'Bionettoyage de la maternité et de la néonatologie', weekdays: ALL_DAYS, from: '06:00', to: '08:00', team: ['h.nkeng', 'g.abena'],
   description: 'Zone à haut risque infectieux. Ordre de passage : néonatologie, salles de naissance, chambres.',
   zones: ['B-NEO', 'B-NAI1', 'B-NAI2', 'B-CH'],
   tasks: ['Bionettoyage des couveuses et des tables de réanimation néonatale', 'Désinfection des salles de naissance après les accouchements de la nuit',
    'Nettoyage des chambres mère-enfant et des sanitaires', 'Évacuation du linge sale vers la buanderie'] },
  maintenance: [
   { provider: 'biomedica', zones: ['EQ-COUV'], title: 'Contrôle annuel des couveuses de néonatologie', stage: 'review', day: -1, from: '09:00', to: '15:00', tech: 'w.tamba',
    description: 'Contrôle de sécurité électrique et étalonnage des sondes de température et d’humidité.',
    tasks: ['Contrôle de sécurité électrique (IEC 62353)', 'Étalonnage des sondes de température cutanée', 'Remplacement des filtres à air'],
    report: 'Huit couveuses contrôlées. Sonde de température du poste 5 remplacée.' },
   { provider: 'arctica', zones: ['B-CES'], title: 'Climatisation en panne — salle de césarienne', stage: 'planned', urgent: true, day: 1, from: '08:00', to: '12:00',
    description: 'Température de 27 °C relevée ce matin. Salle utilisée en urgence uniquement.',
    tasks: ['Diagnostic du split et du groupe extérieur', 'Recharge en fluide ou remplacement du compresseur', 'Contrôle de la température après 2 heures'] },
  ] },
 { client: 'biolab', site: 'Laboratoire central — Akwa', manager: 'n.kotto', controller: 'e.djoko',
  cleaning: { provider: 'aloys', title: 'Nettoyage-désinfection des boxes et du plateau technique', weekdays: SIX_DAYS, from: '19:00', to: '21:00', team: ['jc.tchoumi', 'r.ndongo'],
   description: 'Passage après la dernière série d’analyses. Paillasses désinfectées à l’alcool à 70 %.',
   zones: ['L-PR1', 'L-PR2', 'L-PR3', 'L-BIO', 'L-HEM'],
   tasks: ['Désinfection des fauteuils et des plans de prélèvement', 'Désinfection des paillasses du plateau technique', 'Lavage des sols', 'Évacuation des DASRI vers le local dédié'] },
  maintenance: [
   { provider: 'arctica', zones: ['L-CF'], title: 'Alarme de température — chambre froide des réactifs', stage: 'done', day: -2, from: '07:30', to: '10:30', tech: 'b.ndzana',
    description: 'Température montée à +9 °C dans la nuit. Réactifs transférés dans les réfrigérateurs de secours.',
    tasks: ['Diagnostic du groupe frigorifique', 'Remplacement de la pièce défectueuse', 'Enregistrement de la température sur 24 heures'],
    report: 'Pressostat haute pression défectueux remplacé. Température stable à +4,2 °C depuis 24 heures.',
    anomaly: { zone: 'L-CF', title: 'Pressostat haute pression défectueux', description: 'Déclenchements répétés du groupe frigorifique.', resolution: 'Pressostat remplacé pendant l’intervention.', closing: 'Aucune alarme depuis 48 heures.' } },
   { provider: 'biomedica', zones: ['EQ-BIOCH'], title: 'Maintenance préventive de l’automate de biochimie', stage: 'assigned', day: 6, from: '13:00', to: '17:00', tech: 'a.djomo',
    description: 'Maintenance annuelle constructeur, automate à l’arrêt le samedi après-midi.',
    tasks: ['Remplacement du kit de maintenance annuelle', 'Nettoyage des aiguilles et du circuit hydraulique', 'Passage des contrôles qualité'],
    quote: [640000, 2, 'Kit de maintenance annuelle constructeur et 4 heures d’intervention.'] },
  ] },
 { client: 'mangrove', site: 'Mangrove Hôtel — Bonanjo', manager: 'o.mvondo', controller: 's.epee',
  cleaning: { provider: 'eclat', title: 'Nettoyage des parties communes et des salles de séminaire', weekdays: ALL_DAYS, from: '04:30', to: '06:30', team: ['o.ndjeng', 's.etoga'],
   description: 'Hall, restaurant et salles de conférence prêts avant l’ouverture du petit-déjeuner à 06h30.',
   zones: ['T-HALL', 'T-REST', 'T-SAL1', 'T-SAL2'],
   tasks: ['Aspiration et détachage des moquettes des salles de conférence', 'Nettoyage des vitres et des portes du hall', 'Lavage des sols du restaurant et désinfection des tables',
    'Nettoyage et réapprovisionnement des sanitaires publics'] },
  maintenance: [
   { provider: 'elevation', zones: ['ASC-H'], title: 'Ascenseur client n° 2 bloqué entre deux étages', stage: 'review', urgent: true, day: -1, from: '20:00', to: '23:00', tech: 'g.mpondo',
    description: 'Client évacué par le service de sécurité. Ascenseur consigné.',
    tasks: ['Diagnostic de la carte de manœuvre', 'Contrôle des portes palières', 'Essais à vide et remise en service'],
    report: 'Contact de porte palière du 5e étage encrassé, nettoyé et réglé. 20 cycles d’essai sans défaut.' },
   { provider: 'arctica', zones: ['T-CF'], title: 'Révision des chambres froides de la cuisine', stage: 'quoted', day: 8, from: '14:00', to: '18:00', tech: 'l.tchakounte',
    description: 'Révision préventive avant la haute saison.',
    tasks: ['Nettoyage des évaporateurs et des condenseurs', 'Contrôle d’étanchéité du circuit', 'Remplacement des joints de porte'],
    quote: [480000, 4, 'Nettoyage des évaporateurs, contrôle d’étanchéité et remplacement des joints de porte.'] },
  ] },
 { client: 'kalaba', site: 'Siège Kalaba Finance — Bonanjo', manager: 'r.essomba', controller: 'f.moukoko',
  cleaning: { provider: 'eclat', title: 'Nettoyage des bureaux et de l’agence principale', weekdays: WORK_DAYS, from: '18:30', to: '21:00', team: ['f.mvogo', 'r.pouhe'],
   description: 'Passage après la fermeture au public. Salle des coffres uniquement en présence du gardien de nuit.',
   zones: ['I-GUI', 'I-COFF', 'I-CONS', 'I-E2'],
   tasks: ['Vidage des corbeilles et dépôt du papier confidentiel dans le bac sécurisé', 'Dépoussiérage des postes de travail, désinfection des claviers et des combinés',
    'Aspiration et lavage des sols', 'Nettoyage des sanitaires et réapprovisionnement'] },
  maintenance: [
   { provider: 'arctica', zones: ['EQ-CLIM-P'], title: 'Alarme de haute température en salle informatique', stage: 'done', urgent: true, day: -3, from: '20:00', to: '23:30', tech: 'b.ndzana',
    description: 'Une des deux unités de climatisation de précision en défaut. Température à 27 °C.',
    tasks: ['Diagnostic de l’unité en défaut', 'Remplacement du ventilateur du condenseur', 'Contrôle de la température en salle'],
    report: 'Ventilateur du condenseur extérieur remplacé. Les deux unités fonctionnent, 21 °C en salle.' },
   { provider: 'ampere', zones: ['I-GE'], title: 'Révision des 500 heures du groupe électrogène', stage: 'planned', day: 9, from: '07:00', to: '12:00',
    description: 'Révision constructeur prévue un samedi, agence fermée.',
    tasks: ['Vidange de l’huile et remplacement des filtres', 'Contrôle des batteries de démarrage', 'Essai en charge sur banc de charge'] },
  ] },
 { client: 'kassa', site: 'Hypermarché Kassa — Ndokoti', manager: 'i.adamou', controller: 'c.ngah',
  cleaning: { provider: 'eclat', title: 'Nettoyage de la surface de vente avant l’ouverture', weekdays: ALL_DAYS, from: '05:00', to: '07:30', team: ['e.bekolo', 'l.ngando'],
   description: 'Magasin propre pour l’ouverture de 08h00. Autolaveuse autorisée dans les allées à partir de 05h00.',
   zones: ['VENTE', 'V-BOUCH', 'V-POIS', 'V-CAISS', 'SAN-CLI'],
   tasks: ['Lavage mécanisé des allées à l’autolaveuse', 'Nettoyage et désinfection des postes de découpe (boucherie, poissonnerie)', 'Nettoyage des tapis de caisse et des terminaux',
    'Nettoyage et désinfection des sanitaires clients'],
   rework: 'Odeur persistante et écailles sous l’étal de la poissonnerie. Reprise demandée avant 08h00.' },
  maintenance: [
   { provider: 'arctica', zones: ['EQ-VITR'], title: 'Vitrines réfrigérées des produits laitiers à +9 °C', stage: 'requested', urgent: true, day: 1, from: '06:00', to: '09:00',
    description: 'Produits retirés de la vente. Perte de froid sur 6 mètres linéaires.',
    tasks: ['Diagnostic du circuit frigorifique des vitrines', 'Réparation ou remplacement de la pièce en défaut', 'Contrôle de la température avant la remise en rayon'] },
   { provider: 'barriere', zones: ['RESERVE', 'QUAI'], title: 'Dératisation trimestrielle — réserve et quai', stage: 'done', day: -9, from: '21:00', to: '23:30', tech: 'm.bikoro',
    description: 'Contrôle des 32 postes d’appâtage et traitement curatif après les traces relevées près du quai.',
    tasks: ['Relevé et réapprovisionnement des postes d’appâtage', 'Pose de barrières physiques en bas des portes du quai', 'Rapport de passage avec le plan des postes'],
    report: '32 postes contrôlés, 5 consommations relevées côté quai.',
    anomaly: { zone: 'QUAI', title: 'Bas de porte du quai n° 2 arraché', description: 'Passage possible pour les rongeurs.', resolution: 'Remplacement à prévoir par le service technique du magasin.' } },
  ] },
 { client: 'moungo', site: 'Usine de Njombé', manager: 'jp.ndjock', controller: 'l.tsafack',
  cleaning: { provider: 'bleuazur', title: 'Nettoyage industriel de la savonnerie et de la cantine', weekdays: SIX_DAYS, from: '06:00', to: '08:00', team: ['m.ondobo', 'j.kamga'],
   description: 'Nettoyage en fin de poste de nuit. Lignes consignées par le chef de quart avant l’intervention.',
   zones: ['S-SAPO', 'S-COND', 'VEST', 'CANT'],
   tasks: ['Raclage et évacuation des résidus de pâte de savon', 'Nettoyage haute pression des abords de la ligne de conditionnement', 'Lavage et désinfection des vestiaires et sanitaires',
    'Nettoyage de la cantine après le service'] },
  maintenance: [
   { provider: 'ampere', zones: ['EQ-PRES2'], title: 'Remplacement de la vis et de la cage de la presse P2', stage: 'quoted', day: 5, from: '06:00', to: '18:00', tech: 'r.ekeke',
    description: 'Usure de la vis constatée lors de l’arrêt hebdomadaire. Rendement d’extraction en baisse de 4 %.',
    tasks: ['Consignation électrique et mécanique de la presse', 'Dépose de la vis et de la cage usées', 'Montage des pièces neuves et réglage du cône', 'Essais en charge et contrôle du taux d’huile'],
    quote: [3750000, 7, 'Vis et cage d’origine constructeur, trois techniciens sur une journée, levage compris.'] },
   { provider: 'ignis', zones: ['CHAUF'], title: 'Vérification annuelle des extincteurs et du RIA de la chaufferie', stage: 'done', day: -12, from: '08:00', to: '12:00', tech: 'k.nkwenti',
    description: 'Vérification réglementaire annuelle.',
    tasks: ['Contrôle et pesée des extincteurs', 'Essai de débit et de pression des RIA', 'Mise à jour du registre de sécurité'],
    report: '14 extincteurs vérifiés, 2 recharges effectuées. RIA conformes.' },
  ] },
 { client: 'bonanjo', site: 'Tour Horizon — Bonanjo', manager: 'a.biloa', controller: 's.tchinda',
  cleaning: { provider: 'eclat', title: 'Nettoyage des parties communes de la Tour Horizon', weekdays: SIX_DAYS, from: '05:30', to: '07:30', team: ['f.mvogo', 'r.pouhe'],
   description: 'Hall et sanitaires communs prêts avant l’arrivée des occupants à 07h30.',
   zones: ['T-HALL', 'T-SAN', 'SS-PARK'],
   tasks: ['Lavage et lustrage du hall en marbre', 'Nettoyage des cabines d’ascenseur et des portes palières', 'Nettoyage et désinfection des sanitaires communs', 'Balayage du parking et des rampes'] },
  maintenance: [
   { provider: 'elevation', zones: ['ASC-B'], title: 'Visite d’entretien mensuelle des ascenseurs', stage: 'assigned', day: 3, from: '09:00', to: '12:00', tech: 'e.moukam',
    description: 'Contrat d’entretien complet. Visite mensuelle obligatoire.',
    tasks: ['Contrôle des organes de sécurité et du parachute', 'Graissage des guides et contrôle des câbles', 'Essai de la téléalarme'] },
   { provider: 'ignis', zones: ['T-SSI'], title: 'Défaut sur la boucle de détection incendie — 7e étage', stage: 'review', urgent: true, day: -1, from: '14:00', to: '17:00', tech: 'h.oumarou',
    description: 'Le SSI signale un dérangement sur la boucle 3 depuis ce matin.',
    tasks: ['Localisation du défaut sur la boucle', 'Remplacement du détecteur ou du module en défaut', 'Essai de la boucle et réarmement'],
    report: 'Détecteur optique du bureau 704 encrassé par des travaux de peinture. Remplacé, boucle 3 de nouveau en veille.' },
  ] },
 { client: 'cargo', site: 'Plateforme logistique — Zone industrielle de Bassa', manager: 'b.nana', controller: 'r.edimo',
  cleaning: { provider: 'bleuazur', title: 'Nettoyage des halls de stockage et des quais', weekdays: [1, 3, 5, 7], from: '05:00', to: '07:00', team: ['s.eboa', 'a.manga'],
   description: 'Passage avant la prise de poste. Allées de rayonnage libérées par le chef de quai.',
   zones: ['H1-RCP', 'H1-PREP', 'QUAIS', 'BL-VEST'],
   tasks: ['Balayage mécanisé des allées et des quais', 'Dégraissage des taches d’huile des chariots', 'Nettoyage des vestiaires et du réfectoire', 'Évacuation des emballages vers les bennes de tri'] },
  maintenance: [
   { provider: 'arctica', zones: ['H2-CFN'], title: 'Dégivrage et contrôle de la chambre froide négative', stage: 'assigned', day: 2, from: '20:00', to: '23:30', tech: 'l.tchakounte',
    description: 'Givre important sur les évaporateurs, température à −16 °C au lieu de −20 °C.',
    tasks: ['Dégivrage des évaporateurs', 'Contrôle des résistances de dégivrage', 'Contrôle de la température après remise en froid'] },
   { provider: 'ampere', zones: ['EQ-CHAR1'], title: 'Remplacement de la batterie de traction du chariot n° 1', stage: 'done', day: -5, from: '08:00', to: '11:00', tech: 'a.bassong',
    description: 'Autonomie réduite à 2 heures, la batterie ne tient plus la charge.',
    tasks: ['Dépose de l’ancienne batterie', 'Pose de la batterie neuve 48 V', 'Paramétrage du chargeur et essai'],
    quote: [2100000, 10, 'Batterie de traction 48 V 625 Ah et main-d’œuvre.'], report: 'Batterie de traction 48 V remplacée, chargeur reparamétré.' },
  ] },
 { client: 'acacias', site: 'Campus de Logpom — Douala', manager: 'p.eloundou', controller: 'v.ngassa',
  cleaning: { provider: 'eclat', title: 'Nettoyage des classes et des sanitaires après les cours', weekdays: WORK_DAYS, from: '16:30', to: '19:00', team: ['e.bekolo', 'l.ngando'],
   description: 'Passage après la sortie des élèves. Sanitaires désinfectés une seconde fois à la pause de midi.',
   zones: ['M-CL', 'P-CL', 'S-CL', 'SAN-EL'],
   tasks: ['Balayage humide et lavage des sols des classes', 'Nettoyage des tableaux et des tables', 'Désinfection des blocs sanitaires', 'Vidage des poubelles et tri'] },
  maintenance: [
   { provider: 'barriere', zones: ['REF', 'INT'], title: 'Désinsectisation du réfectoire et de l’internat', stage: 'assigned', day: 10, from: '08:00', to: '13:00', tech: 'f.ongolo',
    description: 'Traitement programmé pendant les congés, locaux vides pendant 48 heures.',
    tasks: ['Traitement des cuisines et du réfectoire contre les blattes', 'Traitement de l’internat contre les punaises de lit', 'Aération et remise en état des locaux'] },
   { provider: 'ampere', zones: ['S-INFO'], title: 'Coupures électriques répétées en salle informatique', stage: 'done', day: -8, from: '13:00', to: '16:00', tech: 'f.tagne',
    description: 'Le disjoncteur général de la salle déclenche plusieurs fois par jour.',
    tasks: ['Mesure des consommations du tableau', 'Création d’un circuit dédié à la climatisation', 'Essais et étiquetage du tableau'],
    report: 'Tableau surchargé par les climatiseurs. Circuit dédié créé pour la climatisation.' },
  ] },
 { client: 'delices', site: 'Cuisine centrale — Bonabéri', manager: 'g.mbouda', controller: 't.kingue',
  cleaning: { provider: 'bleuazur', title: 'Nettoyage-désinfection HACCP de la cuisine centrale', weekdays: SIX_DAYS, from: '15:00', to: '18:00', team: ['s.eboa', 'a.manga'],
   description: 'Plan de nettoyage HACCP après la production. Prélèvements de surface mensuels par le laboratoire.',
   zones: ['C-LEG', 'C-FROID', 'C-CHAUD', 'C-PLONGE'],
   tasks: ['Démontage et nettoyage des trancheurs et des cutters', 'Dégraissage des sauteuses et des fours mixtes', 'Nettoyage-désinfection des plans de travail et des sols',
    'Contrôle visuel et enregistrement sur la fiche HACCP'],
   rework: 'Dépôts de graisse sur le bord de la sauteuse n° 2. Reprise avant la production de 05h00.' },
  maintenance: [
   { provider: 'arctica', zones: ['C-CF1'], title: 'Porte de la chambre froide des viandes mal ajustée', stage: 'quoted', day: 1, from: '15:00', to: '17:00', tech: 'b.ndzana',
    description: 'Joint déchiré, givre sur le cadre. Température limite à +3 °C.',
    tasks: ['Remplacement du joint de porte', 'Réglage des charnières et de la fermeture', 'Contrôle de la température sur 2 heures'],
    quote: [185000, 1, 'Joint magnétique sur mesure et réglage de la porte.'] },
   { provider: 'ampere', zones: ['EQ-FMIX'], title: 'Four mixte n° 2 en défaut de chauffe', stage: 'done', day: -3, from: '14:00', to: '17:00', tech: 'r.ekeke',
    description: 'Le four n’atteint plus la température de consigne.',
    tasks: ['Diagnostic des résistances et de la carte de commande', 'Remplacement de la résistance', 'Essai de montée en température'],
    report: 'Résistance de la chambre de cuisson remplacée. Four testé à 220 °C.' },
  ] },
 { client: 'sanaga', site: 'Dépôt de stockage — Bonabéri', manager: 'v.ekambi', controller: 'j.abanda',
  cleaning: { provider: 'bleuazur', title: 'Nettoyage de la pomperie et du poste de chargement', weekdays: [2, 4, 6], from: '07:00', to: '09:00', team: ['c.ayissi', 'n.fouda'],
   description: 'Permis de travail délivré par la salle de contrôle. Chiffons et absorbants souillés évacués en fûts étanches.',
   zones: ['POMP', 'CHARG', 'CTRL'],
   tasks: ['Absorption des égouttures et nettoyage des bacs de rétention', 'Nettoyage du poste de chargement', 'Nettoyage de la salle de contrôle', 'Évacuation des déchets souillés en fûts étanches'] },
  maintenance: [
   { provider: 'ignis', zones: ['INC'], title: 'Essai trimestriel du réseau incendie du dépôt', stage: 'assigned', day: 6, from: '08:00', to: '12:00', tech: 'k.nkwenti',
    description: 'Essai des motopompes incendie et de la couronne de refroidissement des bacs.',
    tasks: ['Démarrage des motopompes incendie', 'Essai de la couronne de refroidissement du bac n° 1', 'Contrôle du taux d’émulseur'] },
   { provider: 'ampere', zones: ['POMP'], title: 'Fuite sur la garniture de la pompe de chargement n° 2', stage: 'review', urgent: true, day: -2, from: '09:00', to: '13:00', tech: 'a.bassong',
    description: 'Fuite de gasoil au niveau de la garniture mécanique. Pompe isolée.',
    tasks: ['Consignation et vidange de la pompe', 'Remplacement de la garniture mécanique', 'Essai sous pression'],
    report: 'Garniture mécanique remplacée, essai sous pression sans fuite.' },
  ] },
 { client: 'nyanga', site: 'Nyanga Data Center — Logbaba', manager: 'a.fotsing', controller: 'l.mballa',
  cleaning: { provider: 'eclat', title: 'Nettoyage technique des salles informatiques', weekdays: [6], from: '08:00', to: '12:00', team: ['o.ndjeng', 's.etoga'],
   description: 'Nettoyage antistatique, aspirateur à filtre HEPA uniquement. Accompagnement obligatoire par un agent du NOC.',
   zones: ['SALLE-1', 'SALLE-2', 'SAS', 'NOC'],
   tasks: ['Aspiration HEPA des faux planchers et des allées froides', 'Dépoussiérage antistatique des façades de baies', 'Nettoyage des sas et de la salle de supervision'] },
  maintenance: [
   { provider: 'arctica', zones: ['EQ-CRAC'], title: 'Maintenance trimestrielle des climatiseurs de précision', stage: 'quoted', day: 7, from: '08:00', to: '17:00', tech: 'l.tchakounte',
    description: 'Les huit unités sont traitées une par une, sans perte de redondance.',
    tasks: ['Remplacement des filtres', 'Contrôle des pressions et de la charge en fluide', 'Contrôle des humidificateurs'],
    quote: [1350000, 1, 'Forfait trimestriel pour 8 unités, filtres G4 inclus.'] },
   { provider: 'ampere', zones: ['EQ-UPS'], title: 'Test de décharge des batteries d’onduleurs', stage: 'done', day: -10, from: '08:00', to: '14:00', tech: 'a.bassong',
    description: 'Test annuel d’autonomie à charge réelle.',
    tasks: ['Bascule de la charge sur la chaîne A', 'Décharge contrôlée de la chaîne B', 'Relevé des tensions bloc par bloc'],
    report: 'Autonomie mesurée : 14 minutes à charge réelle. Deux blocs batteries faibles sur la chaîne B.',
    anomaly: { zone: 'EQ-UPS', title: 'Deux blocs batteries faibles — chaîne B', description: 'Tension en fin de décharge sous le seuil du constructeur.', resolution: 'Remplacement des deux blocs proposé sur devis.' } },
  ] },

 /* AFISA Food Industry — journey 1: regular cleaning under contract, one passage tracked per day (accepted,
    rework requested, awaiting review, today in progress, upcoming), with its own start and end dates. */
 { client: 'afisa', site: AFISA_PLANT, manager: 'c.ebode', controller: 'l.tchamba',
  cleaning: { provider: 'hygieneplus', title: 'Nettoyage quotidien — conditionnement et sas d’hygiène', weekdays: SIX_DAYS, from: '05:30', to: '07:00', start: -12, end: 75,
   team: ['j.bilong', 'a.ndoumbe'], zones: ['SAL-CDT', 'EQ-CON2', 'SAS-HYG'],
   description: 'Contrat annuel de nettoyage. Passage avant le démarrage de la ligne 2. Produits alimentaires compatibles uniquement.',
   tasks: ['Démontage des carters et dégraissage du convoyeur ligne 2', 'Nettoyage et désinfection des surfaces en contact alimentaire', 'Lavage et raclage des sols, évacuation des siphons',
    'Nettoyage du sas d’hygiène (lave-mains, distributeurs, pédiluve)', 'Vidage et désinfection des poubelles'],
   report: 'Ligne 2 prête pour le démarrage de 07h00. Produits : détergent alcalin puis désinfectant agréé contact alimentaire.',
   rework: 'Résidus de graisse visibles sous le carter aval du convoyeur. Reprendre le dégraissage avant 10h.',
   acceptance: 'Contrôle visuel et test ATP conformes.' },
  /* Journey 2: one-off industrial maintenance, a prior quote when needed, at every step. */
  maintenance: [
   { provider: 'mecatech', zones: ['EQ-ENS1'], title: 'Fuite d’huile hydraulique sur l’ensacheuse E1', stage: 'requested', urgent: true, day: 4, from: '14:00', to: '18:00',
    description: 'Fuite constatée sous le vérin de soudure. Bac de rétention en place. Devis demandé avant intervention.',
    tasks: ['Consignation électrique et hydraulique de l’ensacheuse', 'Recherche de fuite et remplacement des joints du vérin', 'Essais à vide puis en production', 'Nettoyage de la zone et déconsignation'] },
   { provider: 'mecatech', zones: ['EQ-CON2'], title: 'Remplacement des roulements du convoyeur ligne 2', stage: 'quoted', day: 6, from: '08:00', to: '12:00', tech: 'y.nganou',
    description: 'Bruit anormal en sortie de ligne. Intervention à prévoir lors de l’arrêt hebdomadaire.',
    tasks: ['Consignation du convoyeur', 'Dépose du tambour et remplacement des roulements', 'Graissage alimentaire (NSF H1) et remontage', 'Essais et mesure vibratoire'],
    quote: [850000, 2, 'Fourniture de 4 roulements étanches inox, main-d’œuvre 2 techniciens, graisse alimentaire NSF H1. Pièces disponibles sous 48 h.'] },
   { provider: 'mecatech', zones: ['EQ-COMP'], title: 'Remplacement du compresseur d’air de l’usine', stage: 'refused', day: 12, from: '07:00', to: '17:00',
    description: 'Le compresseur peine à maintenir 7 bars en pleine production.',
    tasks: ['Dépose du compresseur existant', 'Pose et raccordement du compresseur neuf', 'Mise en service et contrôle des fuites du réseau'],
    quote: [4200000, 15, 'Compresseur à vis 37 kW neuf, dépose de l’ancien, raccordement et mise en service.'],
    quoteReason: 'Montant hors budget cette année. Demander d’abord un diagnostic et la réparation du compresseur actuel.' },
   { provider: 'mecatech', zones: ['EQ-FOU1', 'ZN-CUI'], title: 'Étalonnage des sondes de température — cuisson', stage: 'assigned', day: 2, from: '10:00', to: '13:00', tech: 'y.nganou',
    description: 'Étalonnage annuel exigé par le plan HACCP.',
    tasks: ['Comparaison des sondes avec l’étalon de référence', 'Ajustement des écarts supérieurs à 0,5 °C', 'Rédaction du certificat d’étalonnage'] },
   { provider: 'mecatech', zones: ['EQ-MEL1'], title: 'Remplacement de la sonde de niveau du mélangeur M1', stage: 'review', day: -1, from: '13:00', to: '15:00', tech: 'y.nganou',
    description: 'Le mélangeur s’arrête en alarme de niveau haut alors que la cuve est à moitié pleine.',
    tasks: ['Consignation du mélangeur', 'Remplacement de la sonde de niveau', 'Réglage des seuils et essais en eau'],
    report: 'Sonde de niveau capacitive remplacée et seuils réglés. Trois cycles d’essai en eau sans alarme.' },
   { provider: 'mecatech', zones: ['EQ-FOU1'], title: 'Révision annuelle du four tunnel F1', stage: 'done', day: -6, from: '07:00', to: '15:00', tech: 'y.nganou',
    description: 'Révision préventive annuelle prévue au plan de maintenance.',
    tasks: ['Contrôle des brûleurs et de la combustion', 'Vérification des joints de portes et de l’isolation', 'Contrôle des sondes de température', 'Essais de montée en température'],
    quote: [1250000, 5, 'Révision complète selon le carnet constructeur, remplacement des pièces d’usure courantes inclus.'], quoteReason: 'Budget maintenance préventive validé.',
    report: 'Révision réalisée. Combustion réglée. Joint de la porte de sortie usé : pièce commandée, remplacement à planifier.',
    acceptance: 'Révision acceptée. L’anomalie du joint reste ouverte jusqu’à son remplacement.',
    anomaly: { zone: 'EQ-FOU1', title: 'Joint de la porte de sortie usé', description: 'Perte de chaleur mesurée en sortie de four.', resolution: 'Joint commandé, remplacement proposé lors de l’arrêt du mois prochain.' } },
   { provider: 'mecatech', zones: ['CF-NEG'], title: 'Contrôle d’étanchéité de la chambre froide négative', stage: 'done', day: -9, from: '09:00', to: '12:00', tech: 'y.nganou',
    description: 'Givre anormal autour de la porte.',
    tasks: ['Contrôle des joints et de la résistance de porte', 'Recherche de fuite de fluide frigorigène', 'Relevé des températures sur 2 h'],
    report: 'Résistance de porte défectueuse remplacée. Pas de fuite de fluide.', acceptance: 'Intervention acceptée.',
    anomaly: { zone: 'CF-NEG', title: 'Résistance de porte hors service', description: 'Givre sur le cadre de porte.', resolution: 'Résistance remplacée pendant l’intervention.', closing: 'Plus de givre constaté après 48 h.' } },
  ] },
 /* Weekly cold-room cleaning, starting tomorrow: the provider has not yet named its team, so every passage waits to be assigned. */
 { client: 'afisa', site: AFISA_PLANT, manager: 'c.ebode', controller: 'l.tchamba', maintenance: [],
  cleaning: { provider: 'hygieneplus', title: 'Nettoyage hebdomadaire des chambres froides', weekdays: [6], from: '13:00', to: '16:00', start: 1, end: 60, team: [],
   description: 'Chambres froides vidées par la logistique le samedi midi.', zones: ['CF-POS', 'CF-NEG'],
   tasks: ['Évacuation des palettes vides et des déchets', 'Nettoyage des parois, portes et joints', 'Désinfection des étagères et du sol', 'Contrôle de la température après fermeture'] } },
];

/** Labels of the first local demonstration, replaced by realistic ones (only while they still say "démo"). */
const demoNames: [login: string, name: string][] = [['demo.admin', 'Administrateur TRACEOPS'], ['demo.client', 'Josiane Ewodo'], ['demo.controleur', 'Alain Tchatchoua'],
 ['demo.prestataire', 'Thierry Kamdem'], ['demo.agent', 'Pauline Ngono']];
/** Sites an earlier run of this script put in the wrong organisation; their clients now have their own. */
const misplaced = ['Siège social — Akwa', 'Entrepôt logistique — Zone industrielle de Bassa', 'Agence Yaoundé — Bastos'];

type Member = { user: string; membership: string; org: string; role: Role };

async function main() {
 if (process.env.TRACEOPS_DEMO !== 'local-only' || process.env.NODE_ENV !== 'development') throw new Error('LOCAL_DEMO_DISABLED');
 const orgs = [...providers, ...clients];
 const logins = orgs.flatMap(o => o.people.map(p => p[0].toLowerCase()));
 const duplicate = logins.find((l, i) => logins.indexOf(l) !== i);
 if (duplicate) throw new Error(`DUPLICATE_LOGIN ${duplicate}`);

 const db = new Database();
 const created: { login: string; password: string; role: Role; organization: string }[] = [];
 try {
  const existing = new Set((await db.query('SELECT lower(login) AS login FROM app_user')).rows.map((r: { login: string }) => r.login));
  const secrets = new Map(await Promise.all(logins.filter(l => !existing.has(l)).map(async login => {
   const password = temporaryPassword();
   return [login, { password, hash: await hashPassword(password) }] as const;
  })));

  await db.transaction(async tx => {
   // A one-off local seed: a slow development disk must not trip the application's 3 s statement limit.
   await tx.query("SET LOCAL statement_timeout = '600s'");
   await tx.query('SELECT pg_advisory_xact_lock(728136)');
   const one = async <T>(sql: string, values: unknown[] = []) => (await tx.query(sql, values)).rows[0] as T | undefined;
   const actor = (await one<{ id: string }>('SELECT user_id AS id FROM platform_admin ORDER BY user_id LIMIT 1'))?.id
    ?? (await one<{ id: string }>('SELECT id FROM app_user ORDER BY created_at LIMIT 1'))?.id;
   if (!actor) throw new Error('NO_ACCOUNT_TO_RECORD_CHANGES');

   /* 1. The organisations the demo logins already belong to, and their old "démonstration" labels. */
   const home = (login: string, role: Role) => one<{ id: string; name: string }>(`SELECT o.id, o.name FROM app_user u JOIN membership m ON m.user_id=u.id
    JOIN membership_role r ON r.membership_id=m.id JOIN organization o ON o.id=m.organization_id WHERE lower(u.login)=$1 AND r.role=$2 ORDER BY o.id LIMIT 1`, [login, role]);
   const orgId: Record<string, string> = {};
   const wouri = clients.find(c => c.key === 'wouri')!;
   const demoClient = await home('demo.client', 'CLIENT_MANAGER');
   if (demoClient && (/démonstration/i.test(demoClient.name) || demoClient.name.trim() === wouri.name)) {
    orgId.wouri = demoClient.id;
    await tx.query('UPDATE organization SET name=$2 WHERE id=$1 AND name<>$2', [demoClient.id, wouri.name]);
    await tx.query('UPDATE site SET name=$3 WHERE client_id=$1 AND name=$2', [demoClient.id, 'Hôpital de démonstration', WOURI_HOSPITAL]);
    await tx.query("UPDATE site SET sector='hospital' WHERE client_id=$1 AND sector='Santé'", [demoClient.id]);
    for (const name of misplaced) {
     const site = await one<{ id: string }>('SELECT id FROM site WHERE client_id=$1 AND name=$2', [demoClient.id, name]);
     if (!site || await one('SELECT 1 FROM intervention WHERE site_id=$1 UNION ALL SELECT 1 FROM programme WHERE site_id=$1 LIMIT 1', [site.id])) continue;
     await tx.query('DELETE FROM agent_assignment WHERE zone_id IN (SELECT id FROM zone WHERE site_id=$1)', [site.id]);
     await tx.query('DELETE FROM site_grant WHERE site_id=$1', [site.id]);
     await tx.query('DELETE FROM service_agreement WHERE site_id=$1', [site.id]);
     await tx.query('UPDATE zone SET parent_id=NULL WHERE site_id=$1', [site.id]);
     await tx.query('DELETE FROM zone WHERE site_id=$1', [site.id]);
     await tx.query('DELETE FROM site WHERE id=$1', [site.id]);
    }
   }
   const demoProvider = await home('demo.prestataire', 'PROVIDER_MANAGER');
   if (demoProvider) orgId.aloys = demoProvider.id;
   for (const [login, name] of demoNames) await tx.query("UPDATE app_user SET display_name=$2 WHERE lower(login)=$1 AND display_name ILIKE '%démo%'", [login, name]);

   /* 2. Organisations and their company record (blank fields only are filled). */
   for (const o of orgs) {
    if (!orgId[o.key]) {
     const found = await one<{ id: string }>('SELECT id FROM organization WHERE lower(trim(name))=lower($1) AND kind=$2 ORDER BY id LIMIT 1', [o.name, o.kind]);
     orgId[o.key] = found?.id ?? randomUUID();
     if (!found) await tx.query('INSERT INTO organization(id,name,kind) VALUES($1,$2,$3)', [orgId[o.key], o.name, o.kind]);
    }
    if (!o.profile) continue;
    await tx.query(`INSERT INTO organization_profile(organization_id,address,city,phone,email,niu,rccm,services,description,contact_name,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (organization_id) DO UPDATE SET address=COALESCE(NULLIF(trim(organization_profile.address),''),EXCLUDED.address), city=COALESCE(NULLIF(trim(organization_profile.city),''),EXCLUDED.city),
      phone=COALESCE(NULLIF(trim(organization_profile.phone),''),EXCLUDED.phone), email=COALESCE(NULLIF(trim(organization_profile.email),''),EXCLUDED.email),
      niu=COALESCE(NULLIF(trim(organization_profile.niu),''),EXCLUDED.niu), rccm=COALESCE(NULLIF(trim(organization_profile.rccm),''),EXCLUDED.rccm),
      services=COALESCE(NULLIF(trim(organization_profile.services),''),EXCLUDED.services), description=COALESCE(NULLIF(trim(organization_profile.description),''),EXCLUDED.description),
      contact_name=COALESCE(NULLIF(trim(organization_profile.contact_name),''),EXCLUDED.contact_name)`, [orgId[o.key], ...o.profile.map(v => v || null), actor]);
   }

   await tx.query(`UPDATE organization_profile SET description=$2 WHERE organization_id=$1 AND description='Données fictives pour la présentation.'`, [orgId.afisa, AFISA_DESCRIPTION]);

   /* 3. Sites and every location in them. */
   const siteId: Record<string, string> = {}, zoneId: Record<string, string> = {};
   for (const o of clients) for (const s of o.sites ?? []) {
    const client = need(orgId, o.key);
    const found = await one<{ id: string }>('SELECT id FROM site WHERE client_id=$1 AND lower(trim(name))=lower($2) ORDER BY id LIMIT 1', [client, s.name]);
    const id = found?.id ?? randomUUID();
    if (!found) await tx.query('INSERT INTO site(id,client_id,name,sector,timezone) VALUES($1,$2,$3,$4,$5)', [id, client, s.name, s.sector, TZ]);
    siteId[`${o.key}|${s.name}`] = id;
    for (const [code, name, kind, parent] of s.zones) {
     const zone = await one<{ id: string }>('SELECT id FROM zone WHERE site_id=$1 AND code=$2', [id, code]);
     const zid = zone?.id ?? randomUUID();
     if (!zone) await tx.query('INSERT INTO zone(id,site_id,parent_id,code,name,kind) VALUES($1,$2,$3,$4,$5,$6)', [zid, id, parent ? need(zoneId, `${id}|${parent}`) : null, code, name, kind]);
     zoneId[`${id}|${code}`] = zid;
    }
   }

   /* 4. People. An existing login is reused only when it already belongs to that organisation. */
   const member: Record<string, Member> = {};
   for (const o of orgs) for (const [rawLogin, name, role] of o.people) {
    const login = rawLogin.toLowerCase(), org = need(orgId, o.key);
    const user = await one<{ id: string }>('SELECT id FROM app_user WHERE lower(login)=$1', [login]);
    if (user) {
     const m = await one<{ id: string }>('SELECT id FROM membership WHERE user_id=$1 AND organization_id=$2', [user.id, org]);
     if (m) member[login] = { user: user.id, membership: m.id, org, role };
     continue;
    }
    const secret = secrets.get(login);
    if (!secret) throw new Error(`ACCOUNT_CREATED_MEANWHILE ${login}`);
    const id = randomUUID(), membership = randomUUID();
    await tx.query('INSERT INTO app_user(id,login,password_hash,display_name,must_change_password) VALUES($1,$2,$3,$4,$5)', [id, login, secret.hash, name, role === 'FIELD_AGENT']);
    await tx.query('INSERT INTO membership(id,user_id,organization_id) VALUES($1,$2,$3)', [membership, id, org]);
    await tx.query('INSERT INTO membership_role(membership_id,role) VALUES($1,$2)', [membership, role]);
    member[login] = { user: id, membership, org, role };
    created.push({ login, password: secret.password, role, organization: o.name });
   }
   const person = (login: string, org: string, roles: Role[]) => {
    const m = member[login];
    if (!m || m.org !== org || !roles.includes(m.role)) throw new Error(`UNKNOWN_PERSON ${login}`);
    return m;
   };
   const managerOf = (key: string) => {
    const def = orgs.find(o => o.key === key)!;
    const login = def.people.map(p => p[0].toLowerCase()).find(l => member[l]?.role === 'PROVIDER_MANAGER' || member[l]?.role === 'CLIENT_MANAGER');
    if (!login) throw new Error(`NO_MANAGER ${key}`);
    return member[login]!;
   };

   /* 5. Contracts: which provider works on which site. */
   const providerSites: Record<string, { site: string; roots: string[] }[]> = {};
   for (const o of clients) for (const [provider, names] of o.providers ?? []) for (const name of names ?? (o.sites ?? []).map(s => s.name)) {
    const site = need(siteId, `${o.key}|${name}`), prov = need(orgId, provider);
    if (!await one('SELECT 1 FROM service_agreement WHERE site_id=$1 AND provider_id=$2 AND active', [site, prov]))
     await tx.query('INSERT INTO service_agreement(id,client_id,site_id,provider_id,starts_at) VALUES($1,$2,$3,$4,$5)', [randomUUID(), need(orgId, o.key), site, prov, new Date(Date.now() - 120 * DAY)]);
    const roots = (o.sites ?? []).find(s => s.name === name)!.zones.filter(z => !z[3]).map(z => z[0]);
    (providerSites[provider] ??= []).push({ site, roots });
   }

   /* 6. Controllers see their sites; agents are posted on the rooms they look after. */
   for (const o of clients) for (const [login, , role, names] of o.people) {
    const m = member[login.toLowerCase()];
    if (role !== 'CLIENT_CONTROLLER' || !m) continue;
    for (const name of names ?? (o.sites ?? []).map(s => s.name))
     await tx.query('INSERT INTO site_grant(membership_id,site_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [m.membership, need(siteId, `${o.key}|${name}`)]);
   }
   const assign = (m: Member, zone: string, by: string) => tx.query(`INSERT INTO agent_assignment(membership_id,zone_id,created_by) SELECT $1::uuid,$2::uuid,$3::uuid
    WHERE NOT EXISTS (SELECT 1 FROM agent_assignment WHERE membership_id=$1::uuid AND zone_id=$2::uuid)`, [m.membership, zone, by]);
   for (const a of activity) {
    const site = need(siteId, `${a.client}|${a.site}`);
    const cleaningLead = managerOf(a.cleaning.provider);
    for (const login of a.cleaning.team) for (const code of a.cleaning.zones) await assign(person(login, need(orgId, a.cleaning.provider), ['FIELD_AGENT']), need(zoneId, `${site}|${code}`), cleaningLead.user);
    for (const m of a.maintenance) if (m.tech) for (const code of m.zones) await assign(person(m.tech, need(orgId, m.provider), ['FIELD_AGENT']), need(zoneId, `${site}|${code}`), managerOf(m.provider).user);
   }
   for (const p of providers) {
    const sites = providerSites[p.key] ?? [];
    if (!sites.length) continue;
    let turn = 0;
    for (const [login, , role] of p.people) {
     const m = member[login.toLowerCase()];
     if (role !== 'FIELD_AGENT' || !m || await one('SELECT 1 FROM agent_assignment WHERE membership_id=$1', [m.membership])) continue;
     const target = sites[turn++ % sites.length]!;
     for (const code of target.roots.slice(0, 2)) await assign(m, need(zoneId, `${target.site}|${code}`), managerOf(p.key).user);
    }
   }

   /* 7. Activity: a recurring cleaning contract and one-off maintenance at every step. */
   const ev = (id: string, by: string, action: string, from: string | null, to: string | null, at: Date, reason: string | null = null) =>
    tx.query('INSERT INTO intervention_event(id,intervention_id,actor_id,action,from_status,to_status,reason,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [randomUUID(), id, by, action, from, to, reason, at]);
   const tasksOf = async (id: string) => (await tx.query('SELECT id FROM intervention_task WHERE intervention_id=$1 ORDER BY position', [id])).rows as { id: string }[];
   const doTasks = async (id: string, by: string, at: Date, count = Infinity) => {
    for (const [i, t] of (await tasksOf(id)).slice(0, count).entries())
     await tx.query(`UPDATE intervention_task SET status='DONE',done_by=$2,done_at=$3 WHERE id=$1`, [t.id, by, new Date(at.getTime() + (i + 1) * 12 * 60000)]);
   };
   const now = Date.now(), today = siteDate();
   const unsigned = (await tx.query(`SELECT i.id,i.provider_id,i.created_at FROM intervention i WHERE i.programme_id IS NOT NULL
     AND EXISTS (SELECT 1 FROM intervention_agent a WHERE a.intervention_id=i.id)
     AND NOT EXISTS (SELECT 1 FROM intervention_event e WHERE e.intervention_id=i.id AND e.action='ASSIGNED')`)).rows as { id: string; provider_id: string; created_at: Date }[];
   for (const r of unsigned) {
    const assigner = await one<{ id: string }>(`SELECT m.user_id AS id FROM membership m JOIN membership_role x ON x.membership_id=m.id JOIN app_user u ON u.id=m.user_id
      WHERE m.organization_id=$1 AND x.role='PROVIDER_MANAGER' AND m.active ORDER BY u.created_at,u.id LIMIT 1`, [r.provider_id]);
    if (assigner) await ev(r.id, assigner.id, 'ASSIGNED', 'PLANNED', 'ASSIGNED', new Date(new Date(r.created_at).getTime() + HOUR));
   }
   for (const a of activity) {
    const client = need(orgId, a.client), site = need(siteId, `${a.client}|${a.site}`);
    const manager = person(a.manager, client, ['CLIENT_MANAGER']), controller = person(a.controller, client, ['CLIENT_CONTROLLER']);
    const zone = (code: string) => need(zoneId, `${site}|${code}`);

    const c = a.cleaning, provider = need(orgId, c.provider);
    if (!await one('SELECT 1 FROM programme WHERE client_id=$1 AND title=$2', [client, c.title])) {
     const team = c.team.map(l => person(l, provider, ['FIELD_AGENT'])), lead = team[0];
     const id = randomUUID(), start = siteDate(c.start ?? -14), end = siteDate(c.end ?? 30), createdAt = new Date(now - (Math.max(0, -(c.start ?? -14)) + 2) * DAY);
     await tx.query(`INSERT INTO programme(id,client_id,provider_id,site_id,title,description,weekdays,start_date,end_date,start_time,end_time,zone_ids,tasks,team,lead_membership_id,created_by,created_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [id, client, provider, site, c.title, c.description, c.weekdays, start, end, c.from, c.to, c.zones.map(zone), c.tasks, team.map(t => t.membership), lead?.membership ?? null, manager.user, createdAt]);
     const p = { id, client, provider, site, title: c.title, description: c.description, zones: c.zones.map(zone), tasks: c.tasks, team: team.map(t => t.membership), lead: lead?.membership ?? null, actor: manager.user };
     for (const [n, date] of passages(start, end, c.weekdays).entries()) {
      const starts = localInstant(date, c.from, TZ), ends = localInstant(date, c.to, TZ);
      const iid = await createPassage(tx as unknown as PoolClient, p, starts, ends, lead ? 'ASSIGNED' : 'PLANNED');
      await tx.query('UPDATE intervention SET created_at=$2 WHERE id=$1', [iid, createdAt]);
      await tx.query('UPDATE intervention_event SET created_at=$2 WHERE intervention_id=$1', [iid, createdAt]);
      if (lead) await ev(iid, managerOf(c.provider).user, 'ASSIGNED', 'PLANNED', 'ASSIGNED', new Date(createdAt.getTime() + HOUR));
      if (!lead || starts.getTime() > now) continue;
      const doer = team[n % team.length]!;
      await tx.query(`UPDATE intervention SET status='IN_PROGRESS',started_at=$2 WHERE id=$1`, [iid, starts]);
      await ev(iid, lead.user, 'STARTED', 'ASSIGNED', 'IN_PROGRESS', starts);
      if (ends.getTime() > now) { await doTasks(iid, doer.user, starts, 2); continue; }
      await doTasks(iid, doer.user, starts);
      const submitted = new Date(ends.getTime() - 5 * 60000);
      await tx.query('UPDATE intervention SET submitted_at=$2,submitted_by=$3,report_note=$4 WHERE id=$1', [iid, submitted, lead.user, c.report ?? 'Passage réalisé selon le protocole. Aucune anomalie constatée.']);
      await ev(iid, lead.user, 'SUBMITTED', 'IN_PROGRESS', 'UNDER_REVIEW', submitted);
      const back = Math.round((Date.parse(today) - Date.parse(date)) / DAY);
      if (back <= 1) { await tx.query(`UPDATE intervention SET status='UNDER_REVIEW' WHERE id=$1`, [iid]); continue; }
      if (back === 2 && c.rework) {
       const first = (await tasksOf(iid))[0]!;
       await tx.query(`UPDATE intervention_task SET status='TODO',rework=true,done_by=NULL,done_at=NULL WHERE id=$1`, [first.id]);
       await tx.query(`UPDATE intervention SET status='REWORK',round=2 WHERE id=$1`, [iid]);
       await ev(iid, controller.user, 'REWORK_REQUESTED', 'UNDER_REVIEW', 'REWORK', new Date(ends.getTime() + 90 * 60000), c.rework);
       continue;
      }
      const accepted = new Date(ends.getTime() + 2 * HOUR);
      await tx.query(`UPDATE intervention SET status='ACCEPTED',accepted_at=$2 WHERE id=$1`, [iid, accepted]);
      await ev(iid, controller.user, 'ACCEPTED', 'UNDER_REVIEW', 'ACCEPTED', accepted, c.acceptance ?? 'Contrôle visuel conforme.');
     }
    }

    for (const m of a.maintenance) {
     if (await one('SELECT 1 FROM intervention WHERE client_id=$1 AND title=$2', [client, m.title])) continue;
     const prov = need(orgId, m.provider), lead = managerOf(m.provider);
     const date = siteDate(m.day), starts = localInstant(date, m.from, TZ), ends = localInstant(date, m.to, TZ);
     const base = Math.min(starts.getTime(), now);
     const createdAt = new Date(m.stage === 'requested' ? now - 6 * HOUR : base - 4 * DAY);
     const quoteRequired = Boolean(m.quote) || m.stage === 'requested' || m.stage === 'quoted';
     let status = quoteRequired ? 'REQUESTED' : 'PLANNED';
     const id = randomUUID();
     await tx.query(`INSERT INTO intervention(id,client_id,provider_id,site_id,kind,title,description,priority,starts_at,ends_at,status,quote_required,created_by,created_at)
      VALUES($1,$2,$3,$4,'MAINTENANCE',$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [id, client, prov, site, m.title, m.description, m.urgent ? 'URGENT' : 'NORMAL', starts, ends, status, quoteRequired, manager.user, createdAt]);
     for (const code of m.zones) await tx.query('INSERT INTO intervention_zone(intervention_id,zone_id) VALUES($1,$2)', [id, zone(code)]);
     for (const [i, label] of m.tasks.entries()) await tx.query('INSERT INTO intervention_task(id,intervention_id,position,label) VALUES($1,$2,$3,$4)', [randomUUID(), id, i + 1, label]);
     await ev(id, manager.user, 'REQUESTED', null, status, createdAt);
     if (m.stage !== 'requested') {
      if (m.quote) {
       // The client decides on the quote: accepted (work can be planned) or refused with a reason (nothing is planned).
       const quotedAt = new Date(createdAt.getTime() + DAY), decided = m.stage !== 'quoted', refused = m.stage === 'refused', decidedAt = new Date(createdAt.getTime() + 2 * DAY);
       const reason = decided ? m.quoteReason ?? (refused ? 'Devis refusé.' : 'Devis validé par la direction.') : null;
       await tx.query(`INSERT INTO quote(id,intervention_id,amount_xaf,delay_days,description,status,reason,created_by,created_at,decided_by,decided_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [randomUUID(), id, m.quote[0], m.quote[1], m.quote[2], !decided ? 'PENDING' : refused ? 'REFUSED' : 'ACCEPTED', reason, lead.user, quotedAt, decided ? manager.user : null, decided ? decidedAt : null]);
       await ev(id, lead.user, 'QUOTE_SUBMITTED', 'REQUESTED', 'QUOTE_SUBMITTED', quotedAt);
       status = 'QUOTE_SUBMITTED';
       if (decided && refused) { await ev(id, manager.user, 'QUOTE_REFUSED', 'QUOTE_SUBMITTED', 'QUOTE_REFUSED', decidedAt, reason); status = 'QUOTE_REFUSED'; }
       else if (decided) { await ev(id, manager.user, 'QUOTE_ACCEPTED', 'QUOTE_SUBMITTED', 'PLANNED', decidedAt, reason); status = 'PLANNED'; }
      }
      const tech = m.tech ? person(m.tech, prov, ['FIELD_AGENT']) : null;
      if (tech && !['quoted', 'refused', 'planned'].includes(m.stage)) {
       await tx.query('INSERT INTO intervention_agent(intervention_id,membership_id,lead) VALUES($1,$2,true)', [id, tech.membership]);
       await ev(id, lead.user, 'ASSIGNED', 'PLANNED', 'ASSIGNED', new Date(createdAt.getTime() + 3 * DAY));
       status = 'ASSIGNED';
       if (m.stage === 'review' || m.stage === 'done') {
        await ev(id, tech.user, 'STARTED', 'ASSIGNED', 'IN_PROGRESS', starts);
        await doTasks(id, tech.user, starts);
        // Closed at most two days after the visit, and never later than now.
        const closedAt = new Date(Math.min(ends.getTime() + 2 * DAY, now - 30 * 60000));
        if (m.anomaly) {
         const at = new Date(ends.getTime() - 30 * 60000), closed = m.stage === 'done' && m.anomaly.closing;
         await tx.query(`INSERT INTO anomaly(id,intervention_id,zone_id,title,description,status,resolution,closing_note,created_by,created_at,closed_by,closed_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [randomUUID(), id, zone(m.anomaly.zone), m.anomaly.title, m.anomaly.description, closed ? 'CLOSED' : 'RESOLUTION_PROPOSED', m.anomaly.resolution, closed ? m.anomaly.closing : null,
           tech.user, at, closed ? controller.user : null, closed ? closedAt : null]);
         await ev(id, tech.user, 'ANOMALY_REPORTED', 'IN_PROGRESS', 'IN_PROGRESS', at, m.anomaly.title);
        }
        const submitted = new Date(ends.getTime() - 10 * 60000);
        await tx.query('UPDATE intervention SET started_at=$2,submitted_at=$3,submitted_by=$4,report_note=$5 WHERE id=$1', [id, starts, submitted, tech.user, m.report ?? 'Intervention réalisée.']);
        await ev(id, tech.user, 'SUBMITTED', 'IN_PROGRESS', 'UNDER_REVIEW', submitted);
        status = 'UNDER_REVIEW';
        if (m.stage === 'done') {
         const accepted = new Date(Math.min(ends.getTime() + 3 * HOUR, now - HOUR));
         await tx.query('UPDATE intervention SET accepted_at=$2 WHERE id=$1', [id, accepted]);
         await ev(id, controller.user, 'ACCEPTED', 'UNDER_REVIEW', 'ACCEPTED', accepted, m.acceptance ?? 'Intervention conforme.');
         status = 'ACCEPTED';
         if (m.anomaly?.closing) await ev(id, controller.user, 'ANOMALY_CLOSED', 'ACCEPTED', 'ACCEPTED', closedAt, `${m.anomaly.title} — ${m.anomaly.closing}`);
        }
       }
      }
     }
     await tx.query('UPDATE intervention SET status=$2 WHERE id=$1', [id, status]);
    }
   }

   await tx.query("INSERT INTO access_audit(id,actor_id,action,target_id,reason) VALUES($1,$2,'LOCAL_DEMO_INITIALIZED',$3,'Catalogue fictif : clients de tous secteurs, prestataires, sites, comptes et activité')", [randomUUID(), actor, need(orgId, 'wouri')]);
  });
  process.stdout.write(JSON.stringify(created, null, 2) + '\n');
 } finally { await db.onApplicationShutdown(); }
}
main().catch(error => {
 process.stderr.write(`Enrichissement refusé : ${error instanceof Error ? error.message : String(error)}\n`);
 process.exitCode = 1;
});
