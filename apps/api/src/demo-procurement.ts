import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import type { PoolClient } from 'pg';
import { Database } from './database.module.js';
import { localInstant } from './interventions/interventions.controller.js';
import { library, type Section } from './procurement/forms.js';
import { addDays, siteToday } from './procurement/payable.js';

/**
 * Local-only catalogue of tenders, offers, contracts, quality evaluations and payments, written to look real
 * (fictional Cameroonian companies). Additive: a tender already present under the same title is skipped, so it can run again.
 */

const TZ = 'Africa/Douala';
const dayOf = (offset: number) => addDays(siteToday(), offset);
const at = (offset: number, time = '10:00') => localInstant(dayOf(offset), time, TZ);
const PIECES = ['Registre du commerce (RCCM)', 'Carte de contribuable (NIU)', 'Attestation de conformité fiscale', 'Attestation de non-redevance CNPS', 'Assurance responsabilité civile professionnelle'];

type Status = 'SUBMITTED' | 'SHORTLISTED' | 'REJECTED' | 'AWARDED' | 'NOT_RETAINED';
type BidDef = { provider: string; amount: number; delay: number; content: string; strengths: string; answers: Record<string, unknown>; online?: boolean; at: number;
  scores?: Record<string, [number, string?]>; review?: string; status?: Status; reason?: string };
type DeliveryDef = { label?: string; planned?: number; amount?: number; delivered?: number; note?: string; rejected?: [number, string]; redelivered?: number; accepted?: number; acceptNote?: string; paid?: [number, string] };
type EvalDef = { on: number; delivery?: number; scores: [number, string?][]; comment?: string };
type ContractDef = { bid: string; start: number; days: number; target: number; installments: number; deliveries: DeliveryDef[]; extra?: DeliveryDef[]; evaluations: EvalDef[]; closed?: { on: number; end: number; note: string };
  /** Awarded but not yet answered by the provider. */
  proposed?: boolean };
type TenderDef = { client: string; manager: string; controller: string; site?: string; template: string; title: string; object: string; budget?: number; values: Record<string, unknown>;
  created: number; published?: number; deadline: [number, string]; closed?: number; awarded?: number; start?: number; duration?: number; invite: string[]; bids: BidDef[]; decision?: string; contracts?: ContractDef[];
  /** Answers given on the platform to the invitation, by providers that sent no offer: [answer, day, reason]. */
  responses?: Record<string, ['ACCEPTED' | 'DECLINED', number, string?]> };

/* ---------- Providers that answer by e-mail or on paper: no account on the platform ---------- */
const newcomers: { name: string; profile: [string, string, string, string, string, string, string, string, string] }[] = [
  { name: 'Sentinelle Gardiennage Services', profile: ['Rue Joss, Bonanjo', 'Douala', '+237 233 42 66 19', 'commercial@sentinelle-gardiennage.cm', 'M071500612384S', 'RC/DLA/2015/B/1752',
    'Gardiennage, sécurité incendie, contrôle d’accès, rondes motorisées', 'Société de gardiennage agréée, 600 agents à Douala et Edéa.', 'Hortense Mbappe — Directrice commerciale'] },
  { name: 'Garde Royale Sécurité', profile: ['Boulevard de la République, Akwa', 'Douala', '+237 233 43 51 77', 'contact@garderoyale.cm', 'M041900237561G', 'RC/DLA/2019/B/0884',
    'Gardiennage de sites industriels, maîtres-chiens, télésurveillance', 'Spécialiste des sites industriels et portuaires de Douala.', 'Bertrand Elong — Gérant'] },
  { name: 'Sotrabat Littoral', profile: ['Zone industrielle de Bonabéri', 'Douala', '+237 233 39 08 45', 'etudes@sotrabat-littoral.cm', 'M111100384265T', 'RC/DLA/2011/B/2031',
    'Étanchéité, couverture, charpente métallique, réhabilitation de bâtiments industriels', 'Entreprise de bâtiment spécialisée dans les toitures industrielles et l’étanchéité.', 'Joseph Nkotto — Directeur technique'] },
  { name: 'Kribi Paysages', profile: ['Quartier Mokolo, Kribi', 'Kribi', '+237 233 46 13 92', 'kribipaysages@gmail.com', 'M061800412975K', 'RC/KRI/2018/A/0112',
    'Entretien d’espaces verts, élagage, aménagement de jardins côtiers', 'Jardiniers et paysagistes de la côte sud, entretien d’hôtels et de résidences.', 'Marthe Ebanda — Gérante'] },
];

/* ---------- The tenders, oldest first: they receive their numbers in that order ---------- */
const AFISA = 'AFISA Food Industry', WOURI = 'Groupe Médical Wouri Santé', DELICES = 'Délices du Littoral', MANGROVE = 'Hôtels Mangrove';
const tenders: TenderDef[] = [
  { client: AFISA, manager: 'c.ebode', controller: 'l.tchamba', site: 'Usine de Bonabéri', template: 'lib-other', budget: 13000000,
    title: 'Réfection de l’étanchéité de la toiture du magasin de stockage',
    object: 'Remplacement de la couverture en fibrociment du magasin des produits finis, traitement de la charpente et pose d’une étanchéité durable avant la saison des pluies, sans interrompre l’activité du magasin.',
    values: { consistance: 'Dépose de la couverture existante en fibrociment (1 650 m²), traitement anticorrosion de la charpente métallique, pose d’une étanchéité bicouche et de tôles bac acier, reprise des chéneaux et des descentes d’eaux pluviales.',
      lieux: 'Magasin de stockage des produits finis, usine de Bonabéri.', quantites: '1 650 m² de couverture, 180 m de chéneaux, 12 descentes d’eaux pluviales.',
      normes: 'Magasin maintenu en activité : travaux par travées, bâchage des stocks, plan de prévention signé avec le service HSE.', livrables: 'Plan de prévention, procès-verbal de réception, essais d’étanchéité, attestation de garantie décennale.',
      duree: 'Prestation ponctuelle', visite: true, pieces: PIECES, penalites: '1/1000 du montant par jour de retard, plafonné à 10 %.' },
    created: -212, published: -206, deadline: [-191, '12:00'], closed: -190, awarded: -186, start: -180, duration: 45,
    invite: ['Sotrabat Littoral', 'Ampère & Fluides Services', 'MécaTech Industrie'],
    bids: [
      { provider: 'Sotrabat Littoral', amount: 12600000, delay: 45, at: -193, status: 'AWARDED',
        content: 'Travaux en quatre travées pour garder le magasin ouvert : dépose et évacuation du fibrociment par une filière agréée amiante, traitement anticorrosion de la charpente, étanchéité bicouche élastomère, tôles bac acier 63/100e, reprise complète des chéneaux. Équipe de 9 compagnons et un conducteur de travaux à plein temps.',
        strengths: 'Spécialiste des toitures industrielles (Brasseries du Littoral, entrepôts du port), garantie décennale, filière agréée pour le fibrociment amianté.',
        answers: { methodologie: 'Phasage par travées de 12 m, bâchage étanche des stocks chaque soir, levage par nacelle articulée.', moyens: '9 compagnons couvreurs, 1 conducteur de travaux, 2 nacelles, échafaudages de pied.', references: 'Entrepôts Port Autonome de Douala (2024, 4 200 m²), Brasseries du Littoral (2023), Cimenterie de Bonabéri (2022).' },
        scores: { technique: [8.5, 'Phasage par travées maîtrisé, évacuation du fibrociment par filière agréée.'], references: [9, 'Trois chantiers comparables en zone industrielle.'] }, review: 'Offre la plus solide techniquement, dans le budget.' },
      { provider: 'Ampère & Fluides Services', amount: 11900000, delay: 60, online: true, at: -194, status: 'NOT_RETAINED',
        content: 'Remplacement de la couverture par tôles bac acier avec sous-traitance de la dépose. Étanchéité par résine sur les noues.',
        strengths: 'Prix le plus bas, connaissance du site.', answers: { methodologie: 'Dépose et pose en une seule phase, magasin vidé pendant 3 semaines.', moyens: '6 techniciens, échafaudages loués.', references: 'Toiture de la clinique des Nations (2024, 600 m²).' },
        scores: { technique: [6, 'Impose de vider le magasin trois semaines ; la dépose du fibrociment est sous-traitée sans filière précisée.'], references: [5.5, 'Une seule référence, de surface réduite.'] }, review: 'Prix intéressant, mais incompatible avec l’activité du magasin.' },
      { provider: 'MécaTech Industrie', amount: 14250000, delay: 50, online: true, at: -192, status: 'NOT_RETAINED',
        content: 'Couverture en panneaux sandwich isolés avec reprise de la charpente.', strengths: 'Isolation thermique du magasin.',
        answers: { methodologie: 'Remplacement complet par panneaux sandwich.', moyens: '8 techniciens.', references: 'Ateliers MécaTech (2021).' },
        scores: { technique: [7, 'Bonne isolation, mais surcoût non demandé par le cahier des charges.'], references: [5, 'Pas de référence extérieure.'] }, review: 'Au-dessus du budget.' },
    ],
    decision: 'Mieux-disant : seule offre compatible avec le maintien en activité du magasin, filière agréée pour le fibrociment, prix dans le budget.',
    contracts: [{ bid: 'Sotrabat Littoral', start: -180, days: 45, target: 7.5, installments: 3,
      deliveries: [
        { label: 'Dépose de la couverture et traitement de la charpente', planned: -165, amount: 3780000, delivered: -164, accepted: -162, paid: [-134, 'VIR-AFI-2026-0611'] },
        { label: 'Pose de l’étanchéité bicouche et des tôles', planned: -146, amount: 6300000, delivered: -141, accepted: -139, paid: [-112, 'VIR-AFI-2026-0702'] },
        { label: 'Réception des travaux et essais d’étanchéité', planned: -136, amount: 2520000, delivered: -128, accepted: -127, acceptNote: 'Essais d’arrosage concluants, aucune infiltration.', paid: [-90, 'VIR-AFI-2026-0819'] },
      ],
      extra: [{ label: 'Travaux supplémentaires : remplacement de 6 chéneaux corrodés (avenant n° 1)', planned: -133, amount: 780000, delivered: -133, accepted: -131, paid: [-102, 'VIR-AFI-2026-0806'] }],
      evaluations: [
        { on: -150, delivery: 1, scores: [[8, 'Charpente traitée conformément au cahier des charges.'], [6, 'Retard de 5 jours sur la deuxième travée (pluies).'], [7], [7, 'Rapports hebdomadaires remis, parfois incomplets.'], [8, 'Port du harnais contrôlé à chaque visite.']] },
        { on: -127, delivery: 3, scores: [[8, 'Aucune infiltration après les essais d’arrosage.'], [6, 'Réception décalée de 9 jours.'], [8, 'Ouvrage conforme au cahier des charges et à l’avenant n° 1.'], [7, 'Gravats évacués avec retard.'], [8]], comment: 'Bon résultat technique ; organisation à améliorer sur les délais.' },
      ],
      closed: { on: -120, end: -127, note: 'Travaux conformes, étanchéité vérifiée après les fortes pluies de juillet. Retard de 9 jours dû aux intempéries ; dépassement de 6 % lié aux chéneaux supplémentaires validés par avenant.' } }] },

  { client: WOURI, manager: 'demo.client', controller: 'demo.controleur', site: 'Hôpital privé Wouri Santé — Bonanjo', template: 'lib-maintenance', budget: 10000000,
    title: 'Maintenance des groupes électrogènes et de l’onduleur du bloc opératoire',
    object: 'Maintenance préventive mensuelle et dépannage sous astreinte des sources d’énergie de l’hôpital : deux groupes électrogènes, l’inverseur de sources et l’onduleur du bloc.',
    values: { liste: 'Groupe électrogène 500 kVA (moteur Perkins, 2017), groupe de secours 250 kVA (2019), inverseur de sources automatique, onduleur 60 kVA du bloc opératoire.', nombre: 4,
      historique: 'Deux démarrages manqués en 2025 (batteries) ; fuite d’huile sur le 500 kVA réparée en mars 2026.',
      types: ['Maintenance préventive programmée', 'Maintenance corrective (dépannage)', 'Astreinte 24 h/24'], frequencePrev: 'Mensuelle',
      gammes: 'Essai en charge mensuel de 30 minutes, vidange toutes les 250 heures, contrôle des batteries, du liquide de refroidissement et de l’inverseur.',
      delaiIntervention: 2, delaiRemise: 6, disponibilite: 99.5, piecesIncluses: 'Sur devis préalable', garantie: 6,
      habilitations: ['Habilitation électrique B1V / B2V', 'Habilitation BR / BC'], consignation: true, rapport: true,
      duree: '6 mois', visite: true, pieces: PIECES, penalites: '200 000 FCFA par heure de dépassement du délai d’intervention garanti.' },
    created: -165, published: -160, deadline: [-146, '12:00'], closed: -145, awarded: -142, start: -140, duration: 180,
    invite: ['Ampère & Fluides Services', 'MécaTech Industrie'],
    bids: [
      { provider: 'Ampère & Fluides Services', amount: 9600000, delay: 5, online: true, at: -148, status: 'AWARDED',
        content: 'Six visites préventives mensuelles avec essai en charge, vidanges, contrôle des batteries et de l’inverseur ; astreinte 24 h/24 avec intervention sous 2 heures ; rapport après chaque visite.',
        strengths: 'Astreinte multitechnique 24 h/24 à 10 minutes de l’hôpital, techniciens habilités BR, stock de filtres Perkins.',
        answers: { techniciens: '2 électrotechniciens habilités B2V/BR, 1 mécanicien groupes électrogènes', delaiGaranti: 2, astreinte: 'Astreinte téléphonique et équipe de garde, véhicule d’intervention', stockPieces: true, references: 'Mangrove Hôtel (2025-2026), Kalaba Finance (siège, 2024-2026)' },
        scores: { competence: [8.5], reactivite: [9, 'Délai de 2 h garanti par écrit.'], references: [8] } },
      { provider: 'MécaTech Industrie', amount: 8700000, delay: 10, online: true, at: -147, status: 'NOT_RETAINED',
        content: 'Visites trimestrielles et dépannage en heures ouvrées.', strengths: 'Prix.',
        answers: { techniciens: '1 électromécanicien', delaiGaranti: 24, astreinte: 'Pas d’astreinte la nuit', stockPieces: false, references: 'AFISA (2025-2026)' },
        scores: { competence: [6], reactivite: [3, 'Pas d’astreinte de nuit : incompatible avec un bloc opératoire.'], references: [5] } },
    ],
    decision: 'Astreinte 24 h/24 indispensable pour le bloc opératoire.',
    contracts: [{ bid: 'Ampère & Fluides Services', start: -140, days: 180, target: 7.5, installments: 6,
      deliveries: [
        { delivered: -111, accepted: -108, paid: [-80, 'VIR-WS-2026-1408'] },
        { delivered: -81, accepted: -79, paid: [-50, 'VIR-WS-2026-1512'] },
        { delivered: -51, accepted: -49 },
        { delivered: -21, note: 'Visite de septembre : vidange du 500 kVA et remplacement des deux batteries de démarrage.' },
        {}, {},
      ],
      evaluations: [
        { on: -108, delivery: 1, scores: [[8], [9, 'Intervenu en 1 h 20 lors de la coupure du 12.'], [8], [7, 'Rapport remis avec trois jours de retard.'], [9], [8]] },
        { on: -79, delivery: 2, scores: [[8], [8], [9], [8], [9], [8]] },
        { on: -49, delivery: 3, scores: [[7, 'Fuite d’huile résiduelle constatée, reprise sous huit jours.'], [8], [7], [8], [8], [7]] },
      ] }] },

  { client: AFISA, manager: 'c.ebode', controller: 'l.tchamba', site: 'Usine de Bonabéri', template: 'lib-cleaning', budget: 60000000,
    title: 'Nettoyage industriel et hygiène de l’usine de Bonabéri — 2026-2027',
    object: 'Nettoyage des zones de production, de conditionnement et de stockage selon le plan HACCP, et entretien des bureaux, vestiaires et réfectoire, pour douze mois.',
    values: { surface: 14200, zones: 'Halls de production (lignes de biscuiterie L1 à L3), conditionnement, magasins matières premières et produits finis, laboratoire qualité, bureaux (1 200 m²), vestiaires, réfectoire et sanitaires.',
      sols: ['Béton quartz ou résine', 'Carrelage'], sensibles: 'Zones de production et de conditionnement soumises au plan HACCP : nettoyage après chaque poste, sans arrêt de ligne ; laboratoire qualité.',
      frequence: '6 jours sur 7', horaires: 'Après chaque poste (14:00–15:00 et 22:00–23:00) ; bureaux de 05:30 à 07:30', horsHeures: true, vitrerie: 'Semestrielle',
      effectif: 10, chef: true, remplacement: 4, tenue: true, fourniture: true, consommables: true,
      normes: 'Produits compatibles contact alimentaire, biocides homologués, fiches de données de sécurité remises au service HSE avant le démarrage.',
      materiel: 'Autolaveuse autoportée, centrale de nettoyage mousse, nettoyeurs haute pression à eau chaude.', controleContradictoire: 'Hebdomadaire', reclamation: 4,
      duree: '12 mois', visite: true, pieces: PIECES, penalites: '2 % du montant mensuel par passage non réalisé ; 5 % en cas de non-conformité HACCP relevée en audit.' },
    created: -122, published: -116, deadline: [-101, '12:00'], closed: -100, awarded: -96, start: -90, duration: 365,
    invite: ['Bleu Azur Nettoyage Industriel', 'Hygiène Plus Services', 'Éclat Pro Cameroun', 'ALOYS'],
    bids: [
      { provider: 'Bleu Azur Nettoyage Industriel', amount: 56400000, delay: 10, online: true, at: -103, status: 'AWARDED',
        content: 'Équipe dédiée de 11 agents formés HACCP et un chef de site permanent. Nettoyage des lignes après chaque poste par mousse alcaline puis acide, rinçage et désinfection, contrôle ATP hebdomadaire partagé avec le laboratoire qualité. Bureaux et vestiaires avant 07:30.',
        strengths: 'Équipes certifiées HACCP, intervention de nuit sans arrêt de production, chef de site permanent, références en agroalimentaire (Délices du Littoral, Huileries du Moungo).',
        answers: { effectifPropose: 11, encadrement: 'Chef de site permanent et superviseur qualité hebdomadaire', materielPropose: '2 autolaveuses, centrale de nettoyage mousse, 3 nettoyeurs haute pression à eau chaude',
          produitsProposes: 'Gamme alimentaire certifiée : détergent alcalin chloré, détartrant acide, désinfectant homologué contact alimentaire', references: 'Délices du Littoral (cuisine centrale, 2024-2026), Huileries et Savonneries du Moungo (2023-2026), Brasserie du Wouri (2022-2024)' },
        scores: { methodologie: [8.5, 'Plan de nettoyage par ligne, contrôle ATP partagé.'], moyens: [8, '11 agents pour 14 200 m², matériel mousse adapté.'], references: [9, 'Trois références agroalimentaires vérifiées.'] },
        review: 'Meilleure méthode HACCP ; prix inférieur de 6 % au budget.' },
      { provider: 'Hygiène Plus Services', amount: 49800000, delay: 7, online: true, at: -104, status: 'NOT_RETAINED',
        content: 'Reconduction et extension de l’équipe actuelle des chambres froides à l’ensemble de l’usine : 8 agents, un chef d’équipe partagé avec un autre site.',
        strengths: 'Prix le plus bas, démarrage immédiat, connaissance du site.',
        answers: { effectifPropose: 8, encadrement: 'Chef d’équipe présent le matin', materielPropose: '1 autolaveuse, nettoyeurs haute pression', produitsProposes: 'Produits multi-usages', references: 'AFISA (chambres froides, 2025-2026), deux PME agroalimentaires de Bonabéri' },
        scores: { methodologie: [6, 'Pas de plan de nettoyage par ligne.'], moyens: [5.5, '8 agents pour 14 200 m², sous-dimensionné pour les postes de nuit.'], references: [6] },
        review: 'Moins-disant mais effectif insuffisant pour nettoyer après chaque poste.' },
      { provider: 'Éclat Pro Cameroun', amount: 61200000, delay: 15, online: true, at: -102, status: 'REJECTED', reason: 'Au-dessus du budget, aucune référence en zone de production alimentaire.',
        content: 'Prestation de propreté tertiaire et industrielle, 12 agents, vitrerie en hauteur incluse.', strengths: 'Grande capacité, vitrerie en hauteur.',
        answers: { effectifPropose: 12, encadrement: 'Inspecteur de zone', materielPropose: 'Monobrosses, aspirateurs, nacelle pour la vitrerie', produitsProposes: 'Gamme tertiaire', references: 'Kalaba Finance, Tour Horizon, Mangrove Hôtel' },
        scores: { methodologie: [7], moyens: [8.5], references: [6.5, 'Références tertiaires uniquement.'] } },
      { provider: 'ALOYS', amount: 58900000, delay: 12, online: true, at: -101, status: 'NOT_RETAINED',
        content: 'Bio-nettoyage adapté de nos protocoles hospitaliers, 10 agents.', strengths: 'Rigueur des protocoles hospitaliers.',
        answers: { effectifPropose: 10, encadrement: 'Chef d’équipe', materielPropose: 'Chariots de bio-nettoyage, autolaveuse', produitsProposes: 'Détergents-désinfectants', references: 'Groupe Médical Wouri Santé, Polyclinique Les Colibris' },
        scores: { methodologie: [7], moyens: [7], references: [7.5, 'Solide en milieu hospitalier, pas en agroalimentaire.'] } },
    ],
    decision: 'Mieux-disant : meilleure méthodologie HACCP et références agroalimentaires, prix inférieur de 6 % au budget. L’offre la moins chère ne prévoit que 8 agents pour 14 200 m².',
    contracts: [{ bid: 'Bleu Azur Nettoyage Industriel', start: -90, days: 365, target: 7.5, installments: 12,
      deliveries: [
        { delivered: -61, accepted: -58, acceptNote: 'Contrôles ATP conformes sur les trois lignes.' },
        { delivered: -30, rejected: [-29, 'Convoyeurs de la ligne L2 non désinfectés après le poste de nuit du 14 ; traces de farine sur les tapis.'], redelivered: -27, accepted: -25, note: 'Reprise complète de la ligne L2 et contrôle ATP refait avec le laboratoire.' },
        { delivered: -1, note: 'Prestations du troisième mois réalisées ; contrôle ATP du 12 conforme.' },
      ],
      evaluations: [
        { on: -58, delivery: 1, scores: [[8, 'Zones de production propres à l’ouverture, sols secs.'], [9], [8], [9], [7, 'Un agent sans charlotte en zone de conditionnement le 12.'], [8]] },
        { on: -29, delivery: 2, scores: [[4, 'Convoyeurs de la ligne L2 non désinfectés après le poste de nuit.'], [6], [7], [8], [5, 'Désinfection incomplète confirmée par le contrôle ATP.'], [8, 'Reprise lancée dans la journée.']], comment: 'Non-conformité HACCP : prestation rejetée, reprise exigée sous 48 heures.' },
        { on: -10, scores: [[8], [8], [9, 'Aucune absence non remplacée ce mois-ci.'], [9], [8], [9]], comment: 'Nette amélioration depuis la reprise de la ligne L2.' },
      ] }] },

  { client: WOURI, manager: 'demo.client', controller: 'demo.controleur', site: 'Hôpital privé Wouri Santé — Bonanjo', template: 'lib-cleaning', budget: 40000000,
    title: 'Bio-nettoyage du bloc opératoire et de la stérilisation',
    object: 'Bio-nettoyage des zones à très haut risque infectieux du troisième étage, entre deux interventions et en fin de programme opératoire, selon le protocole validé par le comité d’hygiène.',
    values: { surface: 2400, zones: 'Bloc opératoire (2 salles), salle de réveil, stérilisation centrale, couloirs et vestiaires du troisième étage.', sols: ['PVC / linoléum', 'Carrelage'],
      sensibles: 'Zones à très haut risque (bloc, salle de réveil) : bio-nettoyage entre deux interventions et en fin de programme, protocole validé par le comité d’hygiène.',
      frequence: '7 jours sur 7', horaires: 'Entre deux interventions sur appel du bloc ; fin de programme de 19:00 à 21:00', horsHeures: true, vitrerie: 'Non concernée',
      effectif: 4, chef: true, remplacement: 2, tenue: true, fourniture: true, consommables: false,
      normes: 'Détergents-désinfectants conformes aux normes EN 14476 et EN 13727, méthode des deux seaux, traçabilité par feuille de route.', materiel: 'Chariots de bio-nettoyage, centrale de dilution, aspirateurs à filtre HEPA.',
      controleContradictoire: 'Hebdomadaire', reclamation: 2, duree: '12 mois', visite: true, pieces: PIECES, penalites: 'Retenue de 3 % du montant mensuel par non-conformité microbiologique confirmée.' },
    created: -78, published: -74, deadline: [-61, '12:00'], closed: -60, awarded: -57, start: -45, duration: 365,
    invite: ['ALOYS', 'Éclat Pro Cameroun', 'Bleu Azur Nettoyage Industriel'],
    bids: [
      { provider: 'ALOYS', amount: 38400000, delay: 7, online: true, at: -63, status: 'AWARDED',
        content: 'Quatre agents formés au bio-nettoyage, présents de 07:00 à 21:00, protocole en deux temps (détergence puis désinfection), traçabilité par feuille de route signée par l’infirmier de bloc.',
        strengths: 'Prestataire actuel des étages d’hospitalisation, équipes formées au bio-nettoyage, prélèvements de surface mensuels à ses frais.',
        answers: { effectifPropose: 4, encadrement: 'Chef d’équipe présent sur les plages opératoires', materielPropose: 'Chariots de bio-nettoyage, aspirateurs HEPA', produitsProposes: 'Détergent-désinfectant EN 14476', references: 'Groupe Médical Wouri Santé (hospitalisation, 2024-2026), Polyclinique Les Colibris (2023-2026)' },
        scores: { methodologie: [8.5], moyens: [8], references: [9] } },
      { provider: 'Éclat Pro Cameroun', amount: 35100000, delay: 10, online: true, at: -62, status: 'NOT_RETAINED',
        content: 'Trois agents en horaires de journée.', strengths: 'Prix.', answers: { effectifPropose: 3, encadrement: 'Inspecteur de zone', materielPropose: 'Chariots', produitsProposes: 'Gamme hospitalière', references: 'Clinique privée de Bali (2025)' },
        scores: { methodologie: [6, 'Pas de présence en fin de programme opératoire.'], moyens: [5.5], references: [6] } },
      { provider: 'Bleu Azur Nettoyage Industriel', amount: 41800000, delay: 14, online: true, at: -61, status: 'NOT_RETAINED',
        content: 'Bio-nettoyage par équipe de quatre agents avec désinfection par voie aérienne hebdomadaire.', strengths: 'Désinfection par voie aérienne.',
        answers: { effectifPropose: 4, encadrement: 'Superviseur hebdomadaire', materielPropose: 'Nébuliseur, chariots', produitsProposes: 'Peroxyde d’hydrogène', references: 'Laboratoires Biolittoral (2024)' },
        scores: { methodologie: [7], moyens: [8], references: [6.5] } },
    ],
    decision: 'Mieux-disant : présence garantie en fin de programme et prélèvements mensuels inclus.',
    contracts: [{ bid: 'ALOYS', start: -45, days: 365, target: 8, installments: 12,
      deliveries: [{ delivered: -16, accepted: -14, acceptNote: 'Prélèvements de surface conformes au bloc et en stérilisation.' }],
      evaluations: [{ on: -14, delivery: 1, scores: [[8, 'Prélèvements de surface conformes.'], [8], [9], [8], [8], [7, 'Appel de 14:10 traité en 25 minutes.']] }] }] },

  { client: WOURI, manager: 'demo.client', controller: 'demo.controleur', site: 'Hôpital privé Wouri Santé — Bonanjo', template: 'lib-cleaning', budget: 18000000,
    title: 'Nettoyage des halls d’accueil, des consultations externes et des circulations',
    object: 'Nettoyage quotidien des espaces ouverts au public du rez-de-chaussée et du premier étage : halls, salles d’attente, consultations externes, ascenseurs, escaliers et sanitaires publics.',
    values: { surface: 3100, zones: 'Hall d’accueil, salles d’attente, 14 boxes de consultation, attente de l’imagerie, ascenseurs, escaliers, sanitaires publics du rez-de-chaussée et du premier étage.', sols: ['Carrelage', 'PVC / linoléum'],
      sensibles: 'Sanitaires publics et salles d’attente : passage toutes les deux heures pendant les consultations.', frequence: '6 jours sur 7', horaires: 'Avant ouverture de 05:30 à 07:30, repasses de 10:00 à 18:00', horsHeures: true, vitrerie: 'Mensuelle',
      effectif: 5, chef: true, remplacement: 2, tenue: true, fourniture: true, consommables: true,
      normes: 'Détergents-désinfectants conformes à la norme EN 14476, méthode des deux seaux, fiches de passage affichées dans les sanitaires.', materiel: 'Autolaveuse compacte, chariots de ménage, aspirateurs.',
      controleContradictoire: 'Mensuel', reclamation: 4, duree: '12 mois', visite: true, pieces: PIECES, penalites: 'Retenue de 2 % du montant mensuel par non-conformité constatée lors du contrôle contradictoire.' },
    created: -38, published: -34, deadline: [-19, '12:00'], closed: -18, awarded: -1, start: 14, duration: 365,
    invite: ['Hygiène Plus Services', 'Éclat Pro Cameroun', 'ALOYS'],
    responses: { ALOYS: ['DECLINED', -30, 'Nos équipes sont mobilisées sur le bloc opératoire et les étages d’hospitalisation : nous préférons ne pas disperser l’encadrement.'] },
    bids: [
      { provider: 'Hygiène Plus Services', amount: 16200000, delay: 10, online: true, at: -21, status: 'AWARDED',
        content: 'Cinq agents dont un chef d’équipe, ouverture des halls à 05:30, repasses toutes les deux heures dans les sanitaires publics, autolaveuse dédiée au site, fiches de passage signées par zone.',
        strengths: 'Équipes habituées aux sites sensibles (AFISA), chef d’équipe présent de 05:30 à 14:00, remplacement d’un absent sous deux heures.',
        answers: { effectifPropose: 5, encadrement: 'Chef d’équipe présent de 05:30 à 14:00, contrôle hebdomadaire du responsable d’exploitation', materielPropose: 'Autolaveuse compacte, chariots de ménage, aspirateurs', produitsProposes: 'Détergent-désinfectant EN 14476', references: 'AFISA Food Industry (2025-2026), Kalaba Finance (2024-2025)' },
        scores: { methodologie: [8, 'Repasses toutes les deux heures dans les sanitaires publics.'], moyens: [8], references: [7] } },
      { provider: 'Éclat Pro Cameroun', amount: 14900000, delay: 7, online: true, at: -20, status: 'NOT_RETAINED',
        content: 'Quatre agents de 06:00 à 14:00, une repasse l’après-midi.', strengths: 'Prix, réactivité.',
        answers: { effectifPropose: 4, encadrement: 'Inspecteur de zone deux fois par semaine', materielPropose: 'Chariots, aspirateurs', produitsProposes: 'Gamme hospitalière', references: 'Mangrove Hôtel (2025-2026), Kassa Distribution (2024-2026)' },
        scores: { methodologie: [6, 'Une seule repasse l’après-midi pour près de 600 patients par jour.'], moyens: [6], references: [7.5] } },
    ],
    decision: 'Mieux-disant : ouverture des halls avant 07:30 et repasses toutes les deux heures dans les sanitaires publics.',
    contracts: [{ bid: 'Hygiène Plus Services', start: 14, days: 365, target: 7, installments: 12, deliveries: [], evaluations: [], proposed: true }] },

  { client: AFISA, manager: 'c.ebode', controller: 'l.tchamba', site: 'Usine de Bonabéri', template: 'lib-hvac', budget: 18000000,
    title: 'Maintenance préventive et dépannage des chambres froides et du groupe frigorifique',
    object: 'Contrat annuel de maintenance des deux chambres froides et de la climatisation du laboratoire qualité, avec astreinte et solution de secours pour la chambre négative.',
    values: { chambres: 'Chambre froide positive 0/+4 °C (180 m³) et chambre froide négative −22 °C (120 m³), groupe de condensation commun 2 × 15 kW.',
      climatiseurs: 'Climatisation du laboratoire qualité (2 splits de 18 000 BTU) et de la salle de conditionnement (centrale de traitement d’air de 25 kW).', fluides: ['R404A', 'R410A'],
      frequence: 'Mensuelle', operations: ['Nettoyage des filtres et batteries', 'Contrôle d’étanchéité', 'Relevé des pressions et températures', 'Contrôle électrique', 'Dégivrage et évacuation des condensats'], releves: true,
      delai: 4, astreinte: true, secours: 'Solution de secours exigée pour la chambre négative : groupe mobile ou conteneur frigorifique sous 6 heures.', attestation: true, recuperation: true,
      duree: '12 mois', visite: true, pieces: PIECES, penalites: '100 000 FCFA par heure de dépassement du délai d’intervention sur la chambre négative.' },
    created: -26, published: -22, deadline: [-4, '12:00'], closed: -3, start: 15, duration: 365,
    invite: ['Arctica Froid & Climatisation', 'MécaTech Industrie', 'Ampère & Fluides Services'],
    bids: [
      { provider: 'Arctica Froid & Climatisation', amount: 16800000, delay: 7, online: true, at: -6, status: 'SHORTLISTED',
        content: 'Douze visites préventives mensuelles des deux chambres et du groupe ; astreinte 24 h/24 avec intervention sous 4 heures ; proposition de passage du R404A au R452A lors de la visite de mars ; relevés de température transmis chaque mois au laboratoire.',
        strengths: 'Frigoristes titulaires de l’attestation de capacité, stock de compresseurs Bitzer et de détendeurs Danfoss à Bassa, groupe mobile de 15 kW disponible sous 6 heures.',
        answers: { frigoristes: '2 frigoristes certifiés catégorie I et un chef d’équipe', delaiPanne: 4, secoursPropose: 'Groupe frigorifique mobile de 15 kW et conteneur frigorifique de 20 pieds en location sous 6 heures', stock: 'Compresseurs Bitzer 4CES, détendeurs Danfoss, R404A et R452A', references: 'Kassa Distribution (3 hypermarchés, 2024-2026), Mangrove Hôtel (2025-2026), Laboratoires Biolittoral (2024-2026)' },
        scores: { competence: [9, 'Attestation de capacité vérifiée pour les deux frigoristes.'], secours: [9, 'Groupe mobile et conteneur proposés par écrit.'], references: [8.5] },
        review: 'Seule offre avec une solution de secours chiffrée pour la chambre négative.' },
      { provider: 'MécaTech Industrie', amount: 13950000, delay: 5, online: true, at: -5, status: 'SUBMITTED',
        content: 'Quatre visites préventives trimestrielles ; dépannage sous 24 heures ouvrées ; pièces sur devis.', strengths: 'Prix le plus bas, connaissance du site (maintenance mécanique des lignes).',
        answers: { frigoristes: 'Un technicien frigoriste et un électromécanicien', delaiPanne: 24, secoursPropose: 'Aucune solution de secours proposée', stock: 'Pièces commandées à la demande', references: 'AFISA (lignes de conditionnement, 2025-2026)' },
        scores: { competence: [6], secours: [4, 'Aucune solution pour une panne prolongée de la chambre négative.'], references: [5] },
        review: 'Moins-disant, mais 24 heures ouvrées de délai et visites trimestrielles seulement.' },
      { provider: 'Ampère & Fluides Services', amount: 17400000, delay: 10, online: true, at: -4, status: 'SHORTLISTED',
        content: 'Visites mensuelles, astreinte multitechnique 24 h/24, intervention sous 6 heures, contrat de location d’un conteneur frigorifique en cas de panne de plus de 12 heures.',
        strengths: 'Une seule équipe pour l’électricité et le froid, astreinte déjà connue du site.',
        answers: { frigoristes: 'Un frigoriste certifié et deux électrotechniciens', delaiPanne: 6, secoursPropose: 'Conteneur frigorifique en location au-delà de 12 heures de panne', stock: 'Fluides R404A, petites pièces', references: 'Groupe Médical Wouri Santé (2026), Kalaba Finance (2024-2026)' },
        scores: { competence: [7.5], secours: [7] } },
    ] },

  { client: AFISA, manager: 'c.ebode', controller: 'l.tchamba', site: 'Usine de Bonabéri', template: 'lib-security', budget: 30000000,
    title: 'Gardiennage et sécurité du site de Bonabéri',
    object: 'Surveillance du site 24 h/24 : contrôle des accès des personnes et des camions, rondes de nuit autour des magasins, tenue de la main courante.',
    values: { nbPostes: 3, couverture: '24 h/24, 7 j/7', agentsParPoste: 1, descriptionPostes: 'Guérite principale (accès camions), entrée du personnel, ronde périmétrique de nuit autour des magasins.',
      missions: ['Contrôle d’accès des personnes et véhicules', 'Rondes périmétriques', 'Gestion des clés'], rondes: 'Toutes les deux heures entre 20:00 et 06:00', mainCourante: true,
      equip: ['Radios portatives', 'Lampes torches', 'Contrôleur de rondes électronique'], telesurveillance: true, superviseur: 'Quotidiens', remplacement: 2, intervention: 20,
      duree: '12 mois', visite: true, pieces: [...PIECES, 'Agrément du ministère de l’Administration territoriale'], penalites: 'Retenue d’un trentième du prix mensuel d’un poste par poste non tenu.' },
    created: -11, published: -8, deadline: [6, '12:00'], start: 30, duration: 365,
    invite: ['Rempart Sécurité Privée', 'Sentinelle Gardiennage Services', 'Garde Royale Sécurité'],
    bids: [
      { provider: 'Rempart Sécurité Privée', amount: 27600000, delay: 15, online: true, at: -3,
        content: 'Trois postes tenus 24 h/24 par 12 agents en relève, superviseur motorisé chaque nuit, rondes contrôlées par pointeau électronique, raccordement à notre centrale de télésurveillance.',
        strengths: 'Centrale de télésurveillance 24 h/24, agrément à jour, 1 100 agents à Douala.', answers: { effectifTotal: 12, formation: 'Secourisme et première intervention incendie pour tous les agents', supervision: 'Superviseur motorisé chaque nuit', equipementsProposes: 'Radios, pointeau électronique, lampes', references: 'Kalaba Finance, Hôtels Mangrove, Sanaga Pétrole Distribution' } },
      { provider: 'Sentinelle Gardiennage Services', amount: 24900000, delay: 10, at: -1,
        content: 'Offre reçue par courriel : trois postes, 11 agents, rondes de nuit toutes les deux heures, superviseur trois fois par semaine.', strengths: 'Prix, présence à Bonabéri.',
        answers: { effectifTotal: 11, references: 'Dépôts pétroliers de Bonabéri (2024-2026)' } },
    ] },

  { client: MANGROVE, manager: 'o.mvondo', controller: 's.epee', site: 'Mangrove Beach Resort — Kribi', template: 'lib-green', budget: 9000000,
    title: 'Entretien des espaces verts du Mangrove Beach Resort',
    object: 'Entretien annuel des jardins, allées et abords de la piscine de l’hôtel de Kribi, avec un planning adapté aux saisons des pluies.',
    values: { pelouse: 9500, haies: 640, arbres: 85, description: 'Jardins en bord de mer, allées, abords de la piscine et cocoteraie.',
      travaux: ['Tonte et finitions', 'Taille des haies', 'Élagage', 'Désherbage', 'Arrosage', 'Évacuation des déchets verts'], tonte: 'Hebdomadaire', arrosage: 'Système automatique existant',
      materiel: true, evacuation: true, duree: '12 mois', visite: true, pieces: PIECES },
    created: -9, published: -7, deadline: [12, '12:00'], start: 45, duration: 365, invite: ['Les Jardins du Mungo', 'Kribi Paysages'], bids: [],
    responses: { 'Les Jardins du Mungo': ['ACCEPTED', -5] } },

  { client: DELICES, manager: 'g.mbouda', controller: 't.kingue', site: 'Cuisine centrale — Bonabéri', template: 'lib-cleaning', budget: 14000000,
    title: 'Nettoyage HACCP de la cuisine centrale de Bonabéri',
    object: 'Nettoyage et désinfection quotidiens des zones de production culinaire, plonge, chambres froides et quais, selon le plan de maîtrise sanitaire.',
    values: { surface: 1800, zones: 'Zones de cuisson, préparations froides, légumerie, plonge, chambres froides, quais de livraison, vestiaires.', sols: ['Carrelage'],
      sensibles: 'Préparations froides et légumerie : désinfection après chaque service.', frequence: '7 jours sur 7', horaires: 'Après chaque service : 14:30–16:00 et 22:00–23:30', horsHeures: true, vitrerie: 'Non concernée',
      effectif: 4, chef: true, remplacement: 3, tenue: true, fourniture: true, consommables: true, normes: 'Produits compatibles contact alimentaire, plan de nettoyage affiché par zone.', controleContradictoire: 'Hebdomadaire', reclamation: 4,
      duree: '12 mois', visite: true, pieces: PIECES },
    created: -6, published: -5, deadline: [9, '12:00'], start: 30, duration: 365, invite: ['Hygiène Plus Services', 'Bleu Azur Nettoyage Industriel', 'Éclat Pro Cameroun'],
    responses: { 'Éclat Pro Cameroun': ['DECLINED', -3, 'Pas de référence HACCP en restauration collective à présenter : nous préférons ne pas soumissionner.'] },
    bids: [{ provider: 'Bleu Azur Nettoyage Industriel', amount: 12600000, delay: 10, online: true, at: -2,
      content: 'Quatre agents formés HACCP, nettoyage après chaque service, désinfection des préparations froides, contrôles ATP mensuels.', strengths: 'Prestataire actuel de la cuisine centrale, équipes formées HACCP.',
      answers: { effectifPropose: 4, encadrement: 'Chef d’équipe présent aux deux services', references: 'Délices du Littoral (2024-2026), AFISA Food Industry (2026)' } }] },

  { client: AFISA, manager: 'c.ebode', controller: 'l.tchamba', site: 'Usine de Bonabéri', template: 'lib-pest', budget: 4800000,
    title: 'Dératisation, désinsectisation et désinfection — contrat annuel',
    object: 'Lutte contre les nuisibles dans les magasins de matières premières, les halls de production et aux abords, avec traçabilité exigée par l’audit de certification.',
    values: { zones: 'Magasins de matières premières (farines, sucre), halls de production, quai de réception, réfectoire et abords extérieurs.', surface: 16800,
      nuisibles: ['Rongeurs', 'Blattes', 'Mouches', 'Insectes des denrées stockées'], types: ['Postes d’appâtage sécurisés', 'Gel insecticide', 'Pièges lumineux à insectes volants'], frequence: 'Mensuelle', plan: true,
      homologation: true, contactAlimentaire: true, fds: true, rapport: true, duree: '12 mois' },
    created: -2, deadline: [21, '12:00'], start: 45, duration: 365, invite: ['Barrière 3D Services'], bids: [] },
];

export async function seedProcurement(tx: PoolClient, actor: string) {
  const one = async <T>(sql: string, values: unknown[] = []) => (await tx.query(sql, values)).rows[0] as T | undefined;
  const ev = (ids: { tender?: string; contract?: string }, by: string, action: string, when: Date, reason: string | null = null) =>
    tx.query('INSERT INTO procurement_event(id,tender_id,contract_id,actor_id,action,reason,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)', [randomUUID(), ids.tender ?? null, ids.contract ?? null, by, action, reason, when]);

  for (const n of newcomers) {
    let id = (await one<{ id: string }>(`SELECT id FROM organization WHERE lower(name)=lower($1) AND kind='PROVIDER'`, [n.name]))?.id;
    if (!id) { id = randomUUID(); await tx.query(`INSERT INTO organization(id,name,kind) VALUES($1,$2,'PROVIDER')`, [id, n.name]); }
    await tx.query(`INSERT INTO organization_profile(organization_id,address,city,phone,email,niu,rccm,services,description,contact_name,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (organization_id) DO NOTHING`, [id, ...n.profile, actor]);
  }
  const orgId = async (name: string, kind: 'CLIENT' | 'PROVIDER') => {
    const r = await one<{ id: string }>('SELECT id FROM organization WHERE lower(name)=lower($1) AND kind=$2 ORDER BY id LIMIT 1', [name, kind]);
    if (!r) throw new Error(`UNKNOWN_ORGANIZATION ${name}`);
    return r.id;
  };
  const userId = async (login: string) => {
    const r = await one<{ id: string }>('SELECT id FROM app_user WHERE lower(login)=$1', [login]);
    if (!r) throw new Error(`UNKNOWN_LOGIN ${login}`);
    return r.id;
  };
  const providerManager = async (org: string) => (await one<{ id: string }>(`SELECT m.user_id AS id FROM membership m JOIN membership_role r ON r.membership_id=m.id JOIN app_user u ON u.id=m.user_id
    WHERE m.organization_id=$1 AND r.role='PROVIDER_MANAGER' AND m.active ORDER BY u.created_at,u.id LIMIT 1`, [org]))?.id ?? null;
  let created = 0;
  // Answers given on the platform by invited providers that sent no offer (an offer sent online is itself a "yes").
  const answer = async (tender: string, d: TenderDef) => {
    for (const [name, [response, offset, reason]] of Object.entries(d.responses ?? {})) {
      const provider = await orgId(name, 'PROVIDER'), by = await providerManager(provider);
      if (!by) continue;
      const when = at(offset, '08:40');
      const r = await tx.query(`UPDATE tender_invitation SET response=$3,response_reason=$4,responded_at=$5,responded_by=$6 WHERE tender_id=$1 AND provider_id=$2 AND response IS NULL`,
        [tender, provider, response, reason ?? null, when, by]);
      if (r.rowCount) await ev({ tender }, by, response === 'ACCEPTED' ? 'INVITATION_ACCEPTED' : 'INVITATION_DECLINED', when, response === 'ACCEPTED' ? name : `${name} — ${reason}`);
    }
  };

  for (const d of tenders) {
    const client = await orgId(d.client, 'CLIENT');
    const existing = await one<{ id: string }>('SELECT id FROM tender WHERE client_id=$1 AND title=$2', [client, d.title]);
    if (existing) { await answer(existing.id, d); continue; }
    const manager = await userId(d.manager), controller = await userId(d.controller);
    const site = d.site ? (await one<{ id: string }>('SELECT id FROM site WHERE client_id=$1 AND name=$2', [client, d.site]))?.id ?? null : null;
    const tpl = library.find(t => t.id === d.template)!;
    const sections: Section[] = tpl.sections.map(s => ({ ...s, fields: s.fields.map(f => ({ ...f, value: (d.values[f.key] ?? null) as never })) }));
    const status = d.awarded !== undefined ? 'AWARDED' : d.closed !== undefined ? 'CLOSED' : d.published !== undefined ? 'PUBLISHED' : 'DRAFT';
    const id = randomUUID(), createdAt = at(d.created, '09:30');
    const number = (await tx.query(`INSERT INTO tender(id,client_id,site_id,template_name,service_type,title,object,budget_xaf,deadline,start_date,duration_days,payment_terms_days,sections,questions,criteria,quality_criteria,
        status,decision_note,created_by,created_at,updated_at,published_at,closed_at,awarded_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,30,$12,$13,$14,$15,$16,$17,$18,$19,$19,$20,$21,$22) RETURNING number`,
      [id, client, site, tpl.name, tpl.serviceType, d.title, d.object, d.budget ?? null, at(d.deadline[0], d.deadline[1]), d.start !== undefined ? dayOf(d.start) : null, d.duration ?? null,
        JSON.stringify(sections), JSON.stringify(tpl.questions), JSON.stringify(tpl.criteria), JSON.stringify(tpl.qualityCriteria), status, d.decision ?? null, manager, createdAt,
        d.published !== undefined ? at(d.published, '11:00') : null, d.closed !== undefined ? at(d.closed, '14:00') : null, d.awarded !== undefined ? at(d.awarded, '16:00') : null])).rows[0].number as number;
    created++;
    await ev({ tender: id }, manager, 'CREATED', createdAt, tpl.name);
    const providers: Record<string, string> = {};
    for (const name of d.invite) {
      providers[name] = await orgId(name, 'PROVIDER');
      await tx.query('INSERT INTO tender_invitation(tender_id,provider_id,invited_at) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [id, providers[name], d.published !== undefined ? at(d.published, '11:00') : createdAt]);
    }
    if (d.published !== undefined) await ev({ tender: id }, manager, 'PUBLISHED', at(d.published, '11:00'), `${d.invite.length} prestataires consultés`);
    if (d.published !== undefined) await answer(id, d);
    const bidIds: Record<string, string> = {};
    for (const b of [...d.bids].sort((x, y) => x.at - y.at)) {
      const provider = providers[b.provider] ?? await orgId(b.provider, 'PROVIDER');
      const author = b.online ? await providerManager(provider) : null;
      const bid = randomUUID(); bidIds[b.provider] = bid;
      const scores = Object.fromEntries(Object.entries(b.scores ?? {}).map(([k, [score, note]]) => [k, note ? { score, note } : { score }]));
      await tx.query(`INSERT INTO bid(id,tender_id,provider_id,amount_xaf,delay_days,content,strengths,answers,source,status,scores,review_note,status_reason,submitted_by,submitted_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)`,
        [bid, id, provider, b.amount, b.delay, b.content, b.strengths, JSON.stringify(b.answers), author ? 'ONLINE' : 'RECORDED', d.awarded !== undefined ? (b.status ?? 'NOT_RETAINED') : (b.status ?? 'SUBMITTED'),
          JSON.stringify(scores), b.review ?? null, b.reason ?? null, author ?? manager, at(b.at, '15:20')]);
      await ev({ tender: id }, author ?? manager, author ? 'BID_SUBMITTED' : 'BID_RECORDED', at(b.at, '15:20'), b.provider);
      if (author) await tx.query(`UPDATE tender_invitation SET response='ACCEPTED',responded_at=$3,responded_by=$4 WHERE tender_id=$1 AND provider_id=$2 AND response IS NULL`, [id, provider, at(b.at, '15:20'), author]);
    }
    if (d.closed !== undefined) {
      await ev({ tender: id }, manager, 'CLOSED', at(d.closed, '14:00'), `${d.bids.length} offres reçues`);
      for (const b of d.bids) {
        if (b.scores) await ev({ tender: id }, manager, 'BID_REVIEWED', at(d.closed + 1, '10:00'), b.provider);
        if (b.status === 'SHORTLISTED' || (d.awarded !== undefined && b.status === 'AWARDED')) await ev({ tender: id }, manager, 'BID_SHORTLISTED', at(d.closed + 1, '11:00'), b.provider);
        if (b.status === 'REJECTED') await ev({ tender: id }, manager, 'BID_REJECTED', at(d.closed + 1, '11:00'), `${b.provider} — ${b.reason}`);
      }
    }

    for (const c of d.contracts ?? []) {
      const provider = providers[c.bid]!, bid = bidIds[c.bid]!, b = d.bids.find(x => x.provider === c.bid)!;
      const supplier = await providerManager(provider);
      const contract = randomUUID(), start = dayOf(c.start), end = addDays(start, c.days - 1);
      const quality = tpl.qualityCriteria;
      const cn = (await tx.query(`INSERT INTO contract(id,tender_id,bid_id,client_id,provider_id,site_id,title,scope,committed_amount_xaf,committed_days,start_date,planned_end_date,payment_terms_days,quality_target,quality_criteria,status,created_by,created_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,30,$13,$14,$15,$16,$17) RETURNING number`,
        [contract, id, bid, client, provider, site, d.title, d.object, b.amount, c.days, start, end, c.target, JSON.stringify(quality), c.proposed ? 'PROPOSED' : 'ACTIVE', manager, at(d.awarded!, '16:00')])).rows[0].number as number;
      await ev({ tender: id, contract }, manager, 'CONTRACT_CREATED', at(d.awarded!, '16:00'), `CT-${String(cn).padStart(4, '0')} — ${c.bid} — ${String(b.amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA, ${c.days} j`);
      if (!c.proposed) {
        // Accepted the next morning: by the provider on the platform, or in writing (recorded by the client) for a provider without an account.
        const respondedAt = at(d.awarded! + 1, '09:15'), by = supplier ?? manager, note = supplier ? null : 'Acceptation signée reçue par courrier';
        await tx.query('UPDATE contract SET responded_at=$2,responded_by=$3 WHERE id=$1', [contract, respondedAt, by]);
        await ev({ contract }, by, 'ACCEPTED_BY_PROVIDER', respondedAt, note);
        await ev({ tender: id }, by, 'AWARD_ACCEPTED', respondedAt, note ? `${c.bid} — ${note}` : c.bid);
        if (site && !c.closed && !(await one('SELECT 1 FROM service_agreement WHERE site_id=$1 AND provider_id=$2 AND active', [site, provider])))
          await tx.query('INSERT INTO service_agreement(id,client_id,site_id,provider_id,starts_at) VALUES($1,$2,$3,$4,$5)', [randomUUID(), client, site, provider, respondedAt]);
      }
      const n = c.installments, share = Math.floor(b.amount / n);
      const list = Array.from({ length: n }, (_, i) => ({ k: i + 1, def: c.deliveries[i] ?? {} as DeliveryDef }));
      const deliveryIds: string[] = [];
      const plan = async (k: number, def: DeliveryDef, plannedDefault: string, amountDefault: number, labelDefault: string) => {
        const did = randomUUID(); deliveryIds.push(did);
        const planned = def.planned !== undefined ? dayOf(def.planned) : plannedDefault, amount = def.amount ?? amountDefault, label = def.label ?? labelDefault;
        await tx.query('INSERT INTO contract_delivery(id,contract_id,position,label,planned_date,amount_xaf,created_by,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [did, contract, k, label, planned, amount, manager, at(d.awarded!, '16:00')]);
        const doer = supplier ?? manager;
        if (def.delivered !== undefined) {
          await tx.query('UPDATE contract_delivery SET delivered_at=$2,delivered_by=$3,delivery_note=$4 WHERE id=$1', [did, at(def.delivered, '17:00'), doer, def.rejected ? null : def.note ?? null]);
          await ev({ contract }, doer, 'DELIVERY_DONE', at(def.delivered, '17:00'), label);
        }
        if (def.rejected) {
          await tx.query(`UPDATE contract_delivery SET decision='REJECTED',decision_reason=$2,decided_at=$3,decided_by=$4 WHERE id=$1`, [did, def.rejected[1], at(def.rejected[0], '09:00'), controller]);
          await ev({ contract }, controller, 'DELIVERY_REJECTED', at(def.rejected[0], '09:00'), `${label} — ${def.rejected[1]}`);
          if (def.redelivered !== undefined) {
            await tx.query(`UPDATE contract_delivery SET decision='PENDING',delivered_at=$2,delivered_by=$3,delivery_note=$4,decided_at=NULL,decided_by=NULL WHERE id=$1`, [did, at(def.redelivered, '18:00'), doer, def.note ?? null]);
            await ev({ contract }, doer, 'DELIVERY_REDELIVERED', at(def.redelivered, '18:00'), [label, def.note].filter(Boolean).join(' — '));
          }
        }
        if (def.accepted !== undefined) {
          const acceptedAt = at(def.accepted, '10:30');
          await tx.query(`UPDATE contract_delivery SET decision='ACCEPTED',decision_reason=$2,decided_at=$3,decided_by=$4 WHERE id=$1`, [did, def.acceptNote ?? null, acceptedAt, controller]);
          await ev({ contract }, controller, 'DELIVERY_ACCEPTED', acceptedAt, [label, def.acceptNote].filter(Boolean).join(' — '));
          const due = addDays(dayOf(def.accepted), 30);
          await tx.query(`INSERT INTO payment(id,client_id,provider_id,delivery_id,label,amount_xaf,accepted_at,terms_days,due_date,status,paid_on,paid_amount_xaf,reference,paid_by,paid_recorded_at)
            VALUES($1,$2,$3,$4,$5,$6,$7,30,$8,$9,$10,$11,$12,$13,$14)`,
            [randomUUID(), client, provider, did, `${d.title} — ${label}`, amount, acceptedAt, due, def.paid ? 'PAID' : 'PENDING', def.paid ? dayOf(def.paid[0]) : null, def.paid ? amount : null,
              def.paid?.[1] ?? null, def.paid ? manager : null, def.paid ? at(def.paid[0], '15:00') : null]);
          if (def.paid) await ev({ contract }, manager, 'PAYMENT_RECORDED', at(def.paid[0], '15:00'), `${d.title} — ${label} — ${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA — ${def.paid[1]}`);
        }
      };
      for (const { k, def } of list) {
        const planned = k === n ? end : addDays(start, Math.round((c.days * k) / n) - 1);
        const month = new Date(planned + 'T12:00:00Z').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
        await plan(k, def, planned, k === n ? b.amount - share * (n - 1) : share, n === 1 ? 'Exécution complète de la prestation' : `Échéance ${k} sur ${n} — ${month}`);
      }
      for (const [i, def] of (c.extra ?? []).entries()) {
        await plan(n + i + 1, def, dayOf(def.planned ?? c.start), def.amount ?? 1, def.label ?? 'Prestation supplémentaire');
        await ev({ contract }, manager, 'DELIVERY_PLANNED', at((def.planned ?? c.start) - 2, '09:00'), def.label ?? null);
      }
      for (const e of c.evaluations) {
        const scores = quality.map((q, i) => { const [score, justification] = e.scores[i] ?? [7]; return justification ? { key: q.key, label: q.label, score, justification } : { key: q.key, label: q.label, score }; });
        const average = Math.round((scores.reduce((s, x) => s + x.score, 0) / scores.length) * 100) / 100;
        await tx.query('INSERT INTO contract_evaluation(id,contract_id,delivery_id,evaluator_id,evaluated_on,scores,average,comment,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
          [randomUUID(), contract, e.delivery ? deliveryIds[e.delivery - 1] : null, controller, dayOf(e.on), JSON.stringify(scores), average, e.comment ?? null, at(e.on, '16:30')]);
        await ev({ contract }, controller, 'EVALUATED', at(e.on, '16:30'), `${String(average).replace('.', ',')}/10`);
      }
      if (c.closed) {
        await tx.query(`UPDATE contract SET status='CLOSED',actual_end_date=$2,closing_note=$3,closed_at=$4,closed_by=$5 WHERE id=$1`, [contract, dayOf(c.closed.end), c.closed.note, at(c.closed.on, '17:00'), manager]);
        await ev({ contract }, manager, 'CLOSED', at(c.closed.on, '17:00'), c.closed.note);
      }
    }
    if (d.awarded !== undefined) {
      const names = (d.contracts ?? []).map(c => c.bid).join(', ');
      await ev({ tender: id }, manager, 'AWARDED', at(d.awarded, '16:00'), [names, d.decision].filter(Boolean).join(' — '));
    }
    void number;
  }

  // Contracts opened before providers answered on the platform: their acceptance the morning after the award.
  for (const c of (await tx.query(`SELECT c.id,c.tender_id,c.provider_id,c.created_at,c.created_by,o.name FROM contract c JOIN organization o ON o.id=c.provider_id
      WHERE c.status IN ('ACTIVE','CLOSED') AND NOT EXISTS (SELECT 1 FROM procurement_event e WHERE e.contract_id=c.id AND e.action='ACCEPTED_BY_PROVIDER')`)).rows as { id: string; tender_id: string | null; provider_id: string; created_at: Date; created_by: string; name: string }[]) {
    const supplier = await providerManager(c.provider_id), by = supplier ?? c.created_by, note = supplier ? null : 'Acceptation signée reçue par courrier';
    const when = new Date(c.created_at.getTime() + 17.25 * 3600000);
    await tx.query('UPDATE contract SET responded_at=$2,responded_by=$3 WHERE id=$1', [c.id, when, by]);
    await ev({ contract: c.id }, by, 'ACCEPTED_BY_PROVIDER', when, note);
    if (c.tender_id) await ev({ tender: c.tender_id }, by, 'AWARD_ACCEPTED', when, note ? `${c.name} — ${note}` : c.name);
  }

  // Older accepted maintenance under a quote: payable 30 days after acceptance; the oldest ones are already paid.
  await tx.query(`INSERT INTO payment(id,client_id,provider_id,intervention_id,label,amount_xaf,accepted_at,terms_days,due_date)
    SELECT gen_random_uuid(),i.client_id,i.provider_id,i.id,i.title,q.amount_xaf,i.accepted_at,30,((i.accepted_at AT TIME ZONE '${TZ}')::date+30)
    FROM intervention i JOIN LATERAL (SELECT amount_xaf FROM quote WHERE intervention_id=i.id AND status='ACCEPTED' ORDER BY created_at DESC LIMIT 1) q ON true
    WHERE i.status='ACCEPTED' AND i.accepted_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM payment y WHERE y.intervention_id=i.id)`);
  return created;
}

/* Standalone run, inside its own transaction: node dist/src/demo-procurement.js */
async function main() {
  if (process.env.TRACEOPS_DEMO !== 'local-only' || process.env.NODE_ENV !== 'development') throw new Error('LOCAL_DEMO_DISABLED');
  const db = new Database();
  try {
    const n = await db.transaction(async tx => {
      await tx.query("SET LOCAL statement_timeout = '600s'");
      await tx.query('SELECT pg_advisory_xact_lock(728137)');
      const actor = (await tx.query('SELECT user_id AS id FROM platform_admin ORDER BY user_id LIMIT 1')).rows[0]?.id ?? (await tx.query('SELECT id FROM app_user ORDER BY created_at LIMIT 1')).rows[0]?.id;
      if (!actor) throw new Error('NO_ACCOUNT_TO_RECORD_CHANGES');
      return seedProcurement(tx, actor);
    });
    process.stdout.write(`Appels d’offres ajoutés : ${n}\n`);
  } finally { await db.onApplicationShutdown(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => {
  process.stderr.write(`Données d’appels d’offres refusées : ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
