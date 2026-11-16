import { BadRequestException } from '@nestjs/common';

/**
 * Tender forms. A form is a list of sections (rubriques) holding typed fields; the client fills the values
 * (the specification), the providers answer the questions (the reply form), the offers are compared on weighted
 * award criteria (price and delay are marked automatically), and the work is later marked from 1 to 10 on quality criteria.
 * Every type of service has its own sections: the library below is the starting point a client copies and adapts.
 */

export const SERVICE_TYPES = ['CLEANING', 'MAINTENANCE', 'HVAC', 'SECURITY', 'PEST', 'GREEN', 'WASTE', 'OTHER'] as const;
export type ServiceType = typeof SERVICE_TYPES[number];
export const FIELD_TYPES = ['text', 'textarea', 'number', 'yesno', 'choice', 'multi', 'date'] as const;
export type FieldType = typeof FIELD_TYPES[number];
export type FieldValue = string | number | boolean | string[] | null;
export type Field = { key: string; label: string; type: FieldType; unit?: string; options?: string[]; required?: boolean; help?: string; value?: FieldValue };
export type Section = { key: string; title: string; help?: string; fields: Field[] };
export type Criterion = { key: string; label: string; weight: number; auto?: 'price' | 'delay' };
export type QualityCriterion = { key: string; label: string; help?: string };
export type Template = { id: string; serviceType: ServiceType; name: string; nameEn: string; description: string; source: string;
  sections: Section[]; questions: Field[]; criteria: Criterion[]; qualityCriteria: QualityCriterion[] };

/* ------------------------------------------------------------------ input checks */

const bad = (code = 'INVALID_FORM') => new BadRequestException(code);
const KEY = /^[A-Za-z0-9_-]{1,40}$/;
function str(value: unknown, max: number, required = false): string | undefined {
  if (value === undefined || value === null || value === '') { if (required) throw bad(); return undefined; }
  if (typeof value !== 'string' || value.length > max) throw bad();
  const v = value.trim(); if (required && !v) throw bad();
  return v || undefined;
}
const obj = (value: unknown) => { if (!value || typeof value !== 'object' || Array.isArray(value)) throw bad(); return value as Record<string, unknown>; };
const arr = (value: unknown, max: number) => { if (value === undefined || value === null) return []; if (!Array.isArray(value) || value.length > max) throw bad(); return value as unknown[]; };
function unique(keys: string[]) { if (new Set(keys).size !== keys.length) throw bad('DUPLICATE_KEY'); }

/** A field value, checked against its type. Empty values become null. */
export function cleanValue(field: Pick<Field, 'type' | 'options'>, value: unknown): FieldValue {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) return null;
  switch (field.type) {
    case 'text': { const v = str(value, 500); return v ?? null; }
    case 'textarea': { const v = str(value, 4000); return v ?? null; }
    case 'number': {
      const n = typeof value === 'string' ? Number(value.replace(',', '.').replace(/\s/g, '')) : value;
      if (typeof n !== 'number' || !Number.isFinite(n) || Math.abs(n) > 1e12) throw bad('INVALID_VALUE');
      return n;
    }
    case 'yesno': if (typeof value !== 'boolean') throw bad('INVALID_VALUE'); return value;
    case 'date': if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) throw bad('INVALID_VALUE'); return value;
    case 'choice': {
      const v = str(value, 200); if (!v) return null;
      if (field.options?.length && !field.options.includes(v)) throw bad('INVALID_VALUE');
      return v;
    }
    case 'multi': {
      const list = arr(value, 30).map(x => str(x, 200, true)!);
      if (field.options?.length && list.some(x => !field.options!.includes(x))) throw bad('INVALID_VALUE');
      return [...new Set(list)];
    }
  }
}

export function cleanFields(input: unknown, withValues: boolean, max = 40): Field[] {
  const fields = arr(input, max).map(raw => {
    const f = obj(raw), type = f.type as FieldType;
    if (!FIELD_TYPES.includes(type)) throw bad();
    const key = str(f.key, 40, true)!; if (!KEY.test(key)) throw bad();
    const options = type === 'choice' || type === 'multi' ? [...new Set(arr(f.options, 30).map(o => str(o, 200, true)!))] : undefined;
    if ((type === 'choice' || type === 'multi') && !options?.length) throw bad('OPTIONS_REQUIRED');
    const field: Field = { key, label: str(f.label, 200, true)!, type };
    const unit = str(f.unit, 30), help = str(f.help, 300);
    if (unit) field.unit = unit; if (help) field.help = help; if (options) field.options = options; if (f.required === true) field.required = true;
    if (withValues) field.value = cleanValue(field, f.value);
    return field;
  });
  unique(fields.map(f => f.key));
  return fields;
}

export function cleanSections(input: unknown, withValues: boolean): Section[] {
  const sections = arr(input, 20).map(raw => {
    const s = obj(raw), key = str(s.key, 40, true)!; if (!KEY.test(key)) throw bad();
    const section: Section = { key, title: str(s.title, 200, true)!, fields: cleanFields(s.fields, withValues, 30) };
    const help = str(s.help, 300); if (help) section.help = help;
    return section;
  });
  unique(sections.map(s => s.key));
  unique(sections.flatMap(s => s.fields.map(f => f.key)));
  return sections;
}

/** Award criteria: integer weights that add up to 100; price and delay are marked from the offers themselves. */
export function cleanCriteria(input: unknown): Criterion[] {
  const list = arr(input, 12).map(raw => {
    const c = obj(raw), key = str(c.key, 40, true)!; if (!KEY.test(key)) throw bad();
    const weight = Number(c.weight);
    if (!Number.isInteger(weight) || weight < 0 || weight > 100) throw bad('CRITERIA_WEIGHTS');
    const criterion: Criterion = { key, label: str(c.label, 120, true)!, weight };
    if (c.auto === 'price' || c.auto === 'delay') criterion.auto = c.auto;
    return criterion;
  });
  unique(list.map(c => c.key));
  if (list.length && list.reduce((s, c) => s + c.weight, 0) !== 100) throw bad('CRITERIA_WEIGHTS');
  if (list.filter(c => c.auto === 'price').length > 1 || list.filter(c => c.auto === 'delay').length > 1) throw bad();
  return list;
}

export function cleanQuality(input: unknown): QualityCriterion[] {
  const list = arr(input, 15).map(raw => {
    const c = obj(raw), key = str(c.key, 40, true)!; if (!KEY.test(key)) throw bad();
    const q: QualityCriterion = { key, label: str(c.label, 160, true)! };
    const help = str(c.help, 300); if (help) q.help = help;
    return q;
  });
  unique(list.map(c => c.key));
  return list;
}

/** The answers of an offer to the tender's reply form: only known questions, each checked against its type. */
export function cleanAnswers(questions: Field[], input: unknown): Record<string, FieldValue> {
  if (input === undefined || input === null) return {};
  const raw = obj(input), out: Record<string, FieldValue> = {};
  for (const q of questions) { const v = cleanValue(q, raw[q.key]); if (v !== null) out[q.key] = v; }
  return out;
}

/* ------------------------------------------------------------------ the library */

const PIECES = ['Registre du commerce (RCCM)', 'Carte de contribuable (NIU)', 'Attestation de conformité fiscale', 'Attestation de non-redevance CNPS',
  'Attestation de domiciliation bancaire', 'Assurance responsabilité civile professionnelle'];
const administrative = (extra: string[] = []): Section => ({ key: 'administratif', title: 'Conditions administratives', help: 'Durée, visite des lieux et pièces à joindre à l’offre.', fields: [
  { key: 'duree', label: 'Durée du contrat', type: 'choice', options: ['Prestation ponctuelle', '3 mois', '6 mois', '12 mois', '24 mois', '36 mois'], required: true },
  { key: 'visite', label: 'Visite des lieux obligatoire avant la remise de l’offre', type: 'yesno' },
  { key: 'pieces', label: 'Pièces administratives exigées', type: 'multi', options: [...PIECES, ...extra] },
  { key: 'penalites', label: 'Pénalités de retard ou de non-exécution', type: 'textarea', help: 'ex. 1/1000 du montant par jour de retard, plafonné à 10 %' },
] });
const references = (label = 'Références similaires sur les trois dernières années'): Field => ({ key: 'references', label, type: 'textarea', required: true, help: 'Client, objet, montant et année ; joindre les attestations de bonne exécution.' });

export const library: Template[] = [
  { id: 'lib-cleaning', serviceType: 'CLEANING', name: 'Nettoyage et hygiène des locaux', nameEn: 'Cleaning and hygiene of premises', source: 'Bibliothèque TRACEOPS',
    description: 'Bureaux, ateliers, zones de production ou de soins : surfaces, fréquences, personnel, produits et contrôle de la propreté.',
    sections: [
      { key: 'perimetre', title: 'Périmètre et surfaces', fields: [
        { key: 'surface', label: 'Surface totale à entretenir', type: 'number', unit: 'm²', required: true },
        { key: 'zones', label: 'Zones à traiter', type: 'textarea', help: 'Bureaux, sanitaires, ateliers, vestiaires, vitreries…' },
        { key: 'sols', label: 'Nature des sols', type: 'multi', options: ['Carrelage', 'Béton quartz ou résine', 'PVC / linoléum', 'Marbre ou granito', 'Moquette'] },
        { key: 'sensibles', label: 'Zones à exigences particulières', type: 'textarea', help: 'Production alimentaire (HACCP), blocs opératoires, salles serveurs…' },
      ] },
      { key: 'frequences', title: 'Fréquences et horaires', fields: [
        { key: 'frequence', label: 'Fréquence des passages', type: 'choice', options: ['Quotidienne (5 j/7)', '6 jours sur 7', '7 jours sur 7', 'Hebdomadaire', 'Selon programme joint'], required: true },
        { key: 'horaires', label: 'Plages horaires d’intervention', type: 'text', help: 'ex. 05:30–07:30, avant l’arrivée du personnel' },
        { key: 'horsHeures', label: 'Interventions de nuit ou le dimanche', type: 'yesno' },
        { key: 'vitrerie', label: 'Vitrerie en hauteur', type: 'choice', options: ['Non concernée', 'Trimestrielle', 'Semestrielle', 'Annuelle'] },
      ] },
      { key: 'personnel', title: 'Personnel et encadrement', fields: [
        { key: 'effectif', label: 'Effectif minimum présent par passage', type: 'number', unit: 'agents' },
        { key: 'chef', label: 'Chef d’équipe présent sur site', type: 'yesno' },
        { key: 'remplacement', label: 'Délai de remplacement d’un agent absent', type: 'number', unit: 'heures' },
        { key: 'tenue', label: 'Tenue, badge et équipements de protection fournis par le prestataire', type: 'yesno' },
      ] },
      { key: 'produits', title: 'Produits, matériel et consommables', fields: [
        { key: 'fourniture', label: 'Produits et matériel à la charge du prestataire', type: 'yesno' },
        { key: 'consommables', label: 'Consommables sanitaires (papier, savon) inclus', type: 'yesno' },
        { key: 'normes', label: 'Exigences sur les produits', type: 'textarea', help: 'Biocides homologués, compatibles contact alimentaire, fiches de données de sécurité…' },
        { key: 'materiel', label: 'Matériel minimum attendu', type: 'textarea', help: 'Autolaveuse, monobrosse, aspirateurs à eau…' },
      ] },
      { key: 'controle', title: 'Contrôle qualité', fields: [
        { key: 'controleContradictoire', label: 'Contrôle contradictoire de la propreté', type: 'choice', options: ['Hebdomadaire', 'Mensuel', 'Trimestriel'] },
        { key: 'reclamation', label: 'Délai de traitement d’une réclamation', type: 'number', unit: 'heures' },
      ] },
      administrative(),
    ],
    questions: [
      { key: 'effectifPropose', label: 'Effectif proposé par passage', type: 'number', unit: 'agents', required: true },
      { key: 'encadrement', label: 'Encadrement proposé', type: 'text' },
      { key: 'materielPropose', label: 'Matériel affecté au site', type: 'textarea' },
      { key: 'produitsProposes', label: 'Produits utilisés (marques, homologations)', type: 'textarea' },
      references(),
    ],
    criteria: [
      { key: 'prix', label: 'Prix', weight: 35, auto: 'price' }, { key: 'delai', label: 'Délai de mise en place', weight: 10, auto: 'delay' },
      { key: 'methodologie', label: 'Méthodologie et organisation', weight: 25 }, { key: 'moyens', label: 'Moyens humains et matériels', weight: 15 }, { key: 'references', label: 'Références', weight: 15 },
    ],
    qualityCriteria: [
      { key: 'proprete', label: 'Propreté constatée des zones' }, { key: 'frequences', label: 'Respect des fréquences et des horaires' },
      { key: 'presence', label: 'Présence et ponctualité des agents' }, { key: 'tenue', label: 'Tenue, badge et comportement' },
      { key: 'hygiene', label: 'Respect des règles d’hygiène et de sécurité' }, { key: 'reactivite', label: 'Réactivité aux réclamations' },
    ] },

  { id: 'lib-maintenance', serviceType: 'MAINTENANCE', name: 'Maintenance technique des installations', nameEn: 'Technical maintenance of installations', source: 'Bibliothèque TRACEOPS',
    description: 'Électricité, groupes électrogènes, plomberie, équipements de production : maintenance préventive, dépannage et astreinte.',
    sections: [
      { key: 'equipements', title: 'Installations et équipements concernés', fields: [
        { key: 'liste', label: 'Liste des équipements (marque, modèle, puissance, année)', type: 'textarea', required: true },
        { key: 'nombre', label: 'Nombre d’équipements', type: 'number' },
        { key: 'historique', label: 'État général et historique des pannes', type: 'textarea' },
      ] },
      { key: 'nature', title: 'Nature de la maintenance', fields: [
        { key: 'types', label: 'Prestations attendues', type: 'multi', options: ['Maintenance préventive programmée', 'Maintenance corrective (dépannage)', 'Astreinte 24 h/24', 'Mise en conformité', 'Fourniture de pièces'], required: true },
        { key: 'frequencePrev', label: 'Fréquence des visites préventives', type: 'choice', options: ['Mensuelle', 'Trimestrielle', 'Semestrielle', 'Annuelle'] },
        { key: 'gammes', label: 'Opérations préventives minimales', type: 'textarea', help: 'Gammes du constructeur, relevés, essais en charge…' },
      ] },
      { key: 'reactivite', title: 'Délais et disponibilité', fields: [
        { key: 'delaiIntervention', label: 'Délai d’intervention garanti sur panne', type: 'number', unit: 'heures', required: true },
        { key: 'delaiRemise', label: 'Délai de remise en service', type: 'number', unit: 'heures' },
        { key: 'disponibilite', label: 'Taux de disponibilité attendu', type: 'number', unit: '%' },
      ] },
      { key: 'pieces', title: 'Pièces détachées et garanties', fields: [
        { key: 'piecesIncluses', label: 'Pièces détachées', type: 'choice', options: ['Incluses dans le forfait', 'Sur devis préalable', 'Fournies par le client'] },
        { key: 'garantie', label: 'Garantie sur les travaux', type: 'number', unit: 'mois' },
      ] },
      { key: 'securite', title: 'Sécurité et habilitations', fields: [
        { key: 'habilitations', label: 'Habilitations exigées', type: 'multi', options: ['Habilitation électrique B1V / B2V', 'Habilitation BR / BC', 'Travail en hauteur', 'Permis de feu', 'Espaces confinés'] },
        { key: 'consignation', label: 'Procédure de consignation imposée', type: 'yesno' },
        { key: 'rapport', label: 'Rapport écrit après chaque intervention', type: 'yesno' },
      ] },
      administrative(),
    ],
    questions: [
      { key: 'techniciens', label: 'Techniciens affectés et qualifications', type: 'textarea', required: true },
      { key: 'delaiGaranti', label: 'Délai d’intervention garanti proposé', type: 'number', unit: 'heures', required: true },
      { key: 'astreinte', label: 'Organisation de l’astreinte', type: 'textarea' },
      { key: 'stockPieces', label: 'Stock de pièces disponible à Douala', type: 'yesno' },
      references('Références sur des équipements similaires'),
    ],
    criteria: [
      { key: 'prix', label: 'Prix', weight: 35, auto: 'price' }, { key: 'delai', label: 'Délai d’exécution', weight: 15, auto: 'delay' },
      { key: 'competence', label: 'Compétence technique et habilitations', weight: 25 }, { key: 'reactivite', label: 'Réactivité et astreinte', weight: 15 }, { key: 'references', label: 'Références', weight: 10 },
    ],
    qualityCriteria: [
      { key: 'technique', label: 'Qualité technique des travaux' }, { key: 'delai', label: 'Respect du délai d’intervention' },
      { key: 'disponibilite', label: 'Disponibilité des installations après intervention' }, { key: 'rapports', label: 'Qualité des rapports d’intervention' },
      { key: 'securite', label: 'Respect des règles de sécurité' }, { key: 'chantier', label: 'Propreté du chantier en fin d’intervention' },
    ] },

  { id: 'lib-hvac', serviceType: 'HVAC', name: 'Froid et climatisation', nameEn: 'Refrigeration and air conditioning', source: 'Bibliothèque TRACEOPS',
    description: 'Chambres froides, climatiseurs, centrales de traitement d’air : entretien préventif, fluides frigorigènes, dépannage et secours.',
    sections: [
      { key: 'parc', title: 'Parc d’équipements', fields: [
        { key: 'chambres', label: 'Chambres froides (nombre, volume, température de consigne)', type: 'textarea' },
        { key: 'climatiseurs', label: 'Climatiseurs et centrales de traitement d’air (type, puissance, nombre)', type: 'textarea' },
        { key: 'fluides', label: 'Fluides frigorigènes en place', type: 'multi', options: ['R404A', 'R134a', 'R410A', 'R32', 'R290 (propane)', 'R717 (ammoniac)'] },
      ] },
      { key: 'entretien', title: 'Entretien préventif', fields: [
        { key: 'frequence', label: 'Fréquence des visites', type: 'choice', options: ['Mensuelle', 'Bimestrielle', 'Trimestrielle'], required: true },
        { key: 'operations', label: 'Opérations attendues', type: 'multi', options: ['Nettoyage des filtres et batteries', 'Contrôle d’étanchéité', 'Relevé des pressions et températures', 'Contrôle électrique', 'Dégivrage et évacuation des condensats'] },
        { key: 'releves', label: 'Enregistrement des températures', type: 'yesno' },
      ] },
      { key: 'depannage', title: 'Dépannage et secours', fields: [
        { key: 'delai', label: 'Délai d’intervention sur panne', type: 'number', unit: 'heures', required: true },
        { key: 'astreinte', label: 'Astreinte le week-end et les jours fériés', type: 'yesno' },
        { key: 'secours', label: 'Solution de secours en cas de panne prolongée', type: 'textarea', help: 'Groupe mobile, location de conteneur frigorifique…' },
      ] },
      { key: 'conformite', title: 'Réglementation et environnement', fields: [
        { key: 'attestation', label: 'Attestation de capacité à manipuler les fluides frigorigènes', type: 'yesno' },
        { key: 'recuperation', label: 'Récupération et traçabilité des fluides', type: 'yesno' },
      ] },
      administrative(),
    ],
    questions: [
      { key: 'frigoristes', label: 'Frigoristes affectés et certifications', type: 'textarea', required: true },
      { key: 'delaiPanne', label: 'Délai d’intervention proposé sur panne', type: 'number', unit: 'heures', required: true },
      { key: 'secoursPropose', label: 'Moyens de secours proposés', type: 'textarea' },
      { key: 'stock', label: 'Pièces et fluides en stock', type: 'textarea' },
      references('Références en froid commercial ou industriel'),
    ],
    criteria: [
      { key: 'prix', label: 'Prix', weight: 35, auto: 'price' }, { key: 'delai', label: 'Délai d’exécution', weight: 10, auto: 'delay' },
      { key: 'competence', label: 'Compétence et certifications', weight: 25 }, { key: 'secours', label: 'Réactivité et solution de secours', weight: 20 }, { key: 'references', label: 'Références', weight: 10 },
    ],
    qualityCriteria: [
      { key: 'temperatures', label: 'Maintien des températures de consigne' }, { key: 'delai', label: 'Respect du délai d’intervention' },
      { key: 'preventif', label: 'Qualité de l’entretien préventif' }, { key: 'tracabilite', label: 'Traçabilité (fiches, relevés, fluides)' },
      { key: 'securite', label: 'Respect des règles de sécurité et d’hygiène' }, { key: 'conseil', label: 'Communication et conseil' },
    ] },

  { id: 'lib-security', serviceType: 'SECURITY', name: 'Gardiennage et sécurité', nameEn: 'Guarding and security', source: 'Bibliothèque TRACEOPS',
    description: 'Postes à tenir, horaires, rondes, contrôle d’accès, équipements, encadrement et remplacement des agents.',
    sections: [
      { key: 'postes', title: 'Postes et horaires', fields: [
        { key: 'nbPostes', label: 'Nombre de postes à tenir', type: 'number', required: true },
        { key: 'couverture', label: 'Horaires de couverture', type: 'choice', options: ['Jour (06:00–18:00)', 'Nuit (18:00–06:00)', '24 h/24, 7 j/7'], required: true },
        { key: 'agentsParPoste', label: 'Agents par poste', type: 'number' },
        { key: 'descriptionPostes', label: 'Description des postes', type: 'textarea', help: 'Guérite principale, ronde périmétrique, accueil…' },
      ] },
      { key: 'missions', title: 'Missions', fields: [
        { key: 'missions', label: 'Missions confiées', type: 'multi', options: ['Contrôle d’accès des personnes et véhicules', 'Rondes périmétriques', 'Surveillance vidéo', 'Gestion des clés', 'Accueil et orientation', 'Maître-chien'] },
        { key: 'rondes', label: 'Fréquence des rondes de nuit', type: 'text' },
        { key: 'mainCourante', label: 'Tenue d’une main courante', type: 'yesno' },
      ] },
      { key: 'equipements', title: 'Équipements', fields: [
        { key: 'equip', label: 'Équipements à fournir', type: 'multi', options: ['Radios portatives', 'Lampes torches', 'Détecteurs de métaux', 'Contrôleur de rondes électronique', 'Véhicule d’intervention'] },
        { key: 'telesurveillance', label: 'Raccordement à une centrale de télésurveillance', type: 'yesno' },
      ] },
      { key: 'encadrement', title: 'Encadrement et remplacement', fields: [
        { key: 'superviseur', label: 'Passages d’un superviseur', type: 'choice', options: ['Quotidiens', 'Hebdomadaires'] },
        { key: 'remplacement', label: 'Délai de remplacement d’un agent absent', type: 'number', unit: 'heures' },
        { key: 'intervention', label: 'Délai d’arrivée de l’équipe d’intervention', type: 'number', unit: 'minutes' },
      ] },
      administrative(['Agrément du ministère de l’Administration territoriale']),
    ],
    questions: [
      { key: 'effectifTotal', label: 'Effectif total affecté, relèves comprises', type: 'number', unit: 'agents', required: true },
      { key: 'formation', label: 'Formation des agents (secourisme, incendie)', type: 'textarea' },
      { key: 'supervision', label: 'Dispositif de supervision', type: 'textarea' },
      { key: 'equipementsProposes', label: 'Équipements fournis', type: 'textarea' },
      references('Références de sites gardés'),
    ],
    criteria: [
      { key: 'prix', label: 'Prix', weight: 35, auto: 'price' }, { key: 'delai', label: 'Délai de mise en place', weight: 10, auto: 'delay' },
      { key: 'dispositif', label: 'Dispositif et effectif', weight: 25 }, { key: 'encadrement', label: 'Encadrement et formation', weight: 15 }, { key: 'references', label: 'Références', weight: 15 },
    ],
    qualityCriteria: [
      { key: 'presence', label: 'Présence effective aux postes' }, { key: 'releves', label: 'Ponctualité des relèves' },
      { key: 'tenue', label: 'Tenue et comportement' }, { key: 'rapports', label: 'Main courante et rapports d’incident' },
      { key: 'reactivite', label: 'Réactivité aux incidents' }, { key: 'consignes', label: 'Respect des consignes du site' },
    ] },

  { id: 'lib-pest', serviceType: 'PEST', name: 'Dératisation, désinsectisation, désinfection', nameEn: 'Pest control and disinfection', source: 'Bibliothèque TRACEOPS',
    description: 'Nuisibles ciblés, traitements, produits homologués compatibles avec les zones alimentaires, traçabilité des passages.',
    sections: [
      { key: 'perimetre', title: 'Locaux et nuisibles', fields: [
        { key: 'zones', label: 'Zones à traiter', type: 'textarea', required: true },
        { key: 'surface', label: 'Surface traitée', type: 'number', unit: 'm²' },
        { key: 'nuisibles', label: 'Nuisibles ciblés', type: 'multi', options: ['Rongeurs', 'Blattes', 'Mouches', 'Moustiques', 'Fourmis', 'Termites', 'Insectes des denrées stockées'], required: true },
      ] },
      { key: 'traitements', title: 'Traitements', fields: [
        { key: 'types', label: 'Types de traitement', type: 'multi', options: ['Postes d’appâtage sécurisés', 'Pulvérisation insecticide', 'Gel insecticide', 'Nébulisation et désinfection', 'Pièges lumineux à insectes volants'] },
        { key: 'frequence', label: 'Fréquence des passages', type: 'choice', options: ['Mensuelle', 'Bimestrielle', 'Trimestrielle'], required: true },
        { key: 'plan', label: 'Plan de positionnement des postes remis et tenu à jour', type: 'yesno' },
      ] },
      { key: 'produits', title: 'Produits et sécurité alimentaire', fields: [
        { key: 'homologation', label: 'Produits homologués exigés', type: 'yesno' },
        { key: 'contactAlimentaire', label: 'Compatibilité avec les zones de production alimentaire', type: 'yesno' },
        { key: 'fds', label: 'Fiches de données de sécurité remises avant intervention', type: 'yesno' },
      ] },
      { key: 'suivi', title: 'Suivi et traçabilité', fields: [
        { key: 'rapport', label: 'Rapport de passage avec relevé des consommations d’appâts', type: 'yesno' },
        { key: 'urgence', label: 'Délai d’intervention sur infestation', type: 'number', unit: 'heures' },
      ] },
      administrative(),
    ],
    questions: [
      { key: 'methode', label: 'Méthode et produits proposés (homologations)', type: 'textarea', required: true },
      { key: 'nbPostes', label: 'Nombre de postes d’appâtage proposés', type: 'number' },
      { key: 'frequenceProposee', label: 'Fréquence proposée', type: 'text' },
      { key: 'applicateur', label: 'Technicien applicateur et agréments', type: 'textarea' },
      references('Références en agroalimentaire, santé ou hôtellerie'),
    ],
    criteria: [
      { key: 'prix', label: 'Prix', weight: 35, auto: 'price' }, { key: 'delai', label: 'Délai de mise en place', weight: 10, auto: 'delay' },
      { key: 'methode', label: 'Méthode et produits', weight: 30 }, { key: 'tracabilite', label: 'Traçabilité', weight: 10 }, { key: 'references', label: 'Références', weight: 15 },
    ],
    qualityCriteria: [
      { key: 'efficacite', label: 'Efficacité constatée (absence de nuisibles)' }, { key: 'calendrier', label: 'Respect du calendrier de passage' },
      { key: 'produits', label: 'Conformité des produits utilisés' }, { key: 'rapports', label: 'Qualité des rapports de passage' },
      { key: 'hygiene', label: 'Respect des règles d’hygiène en zone de production' }, { key: 'reactivite', label: 'Réactivité sur infestation' },
    ] },

  { id: 'lib-green', serviceType: 'GREEN', name: 'Entretien des espaces verts', nameEn: 'Grounds maintenance', source: 'Bibliothèque TRACEOPS',
    description: 'Pelouses, haies, arbres, arrosage et évacuation des déchets verts, avec un planning adapté aux saisons.',
    sections: [
      { key: 'surfaces', title: 'Surfaces et végétaux', fields: [
        { key: 'pelouse', label: 'Surface de pelouses', type: 'number', unit: 'm²' },
        { key: 'haies', label: 'Linéaire de haies', type: 'number', unit: 'm' },
        { key: 'arbres', label: 'Arbres à entretenir', type: 'number' },
        { key: 'description', label: 'Description des espaces', type: 'textarea' },
      ] },
      { key: 'prestations', title: 'Prestations', fields: [
        { key: 'travaux', label: 'Travaux attendus', type: 'multi', options: ['Tonte et finitions', 'Taille des haies', 'Élagage', 'Désherbage', 'Arrosage', 'Fleurissement saisonnier', 'Évacuation des déchets verts'], required: true },
        { key: 'tonte', label: 'Fréquence de tonte en saison des pluies', type: 'choice', options: ['Hebdomadaire', 'Tous les 15 jours', 'Mensuelle'] },
        { key: 'arrosage', label: 'Gestion de l’arrosage', type: 'choice', options: ['Manuel, par le prestataire', 'Système automatique existant', 'Non concerné'] },
      ] },
      { key: 'moyens', title: 'Moyens', fields: [
        { key: 'materiel', label: 'Matériel à la charge du prestataire', type: 'yesno' },
        { key: 'evacuation', label: 'Évacuation des déchets verts incluse', type: 'yesno' },
      ] },
      administrative(),
    ],
    questions: [
      { key: 'equipe', label: 'Équipe affectée', type: 'textarea', required: true },
      { key: 'materielPropose', label: 'Matériel utilisé', type: 'textarea' },
      { key: 'planning', label: 'Planning annuel proposé', type: 'textarea' },
      references('Références de sites entretenus'),
    ],
    criteria: [
      { key: 'prix', label: 'Prix', weight: 40, auto: 'price' }, { key: 'delai', label: 'Délai de mise en place', weight: 10, auto: 'delay' },
      { key: 'organisation', label: 'Organisation et planning', weight: 25 }, { key: 'moyens', label: 'Moyens', weight: 10 }, { key: 'references', label: 'Références', weight: 15 },
    ],
    qualityCriteria: [
      { key: 'aspect', label: 'Aspect général des espaces' }, { key: 'planning', label: 'Respect du planning' },
      { key: 'finitions', label: 'Qualité des tailles et des finitions' }, { key: 'proprete', label: 'Propreté après intervention' },
      { key: 'securite', label: 'Sécurité des interventions' }, { key: 'reactivite', label: 'Réactivité aux demandes' },
    ] },

  { id: 'lib-waste', serviceType: 'WASTE', name: 'Collecte et traitement des déchets', nameEn: 'Waste collection and treatment', source: 'Bibliothèque TRACEOPS',
    description: 'Types et volumes de déchets, fréquence de collecte, filière d’élimination et bordereaux de suivi.',
    sections: [
      { key: 'gisement', title: 'Déchets à collecter', fields: [
        { key: 'types', label: 'Types de déchets', type: 'multi', options: ['Déchets banals', 'Cartons et papiers', 'Déchets d’activités de soins (DASRI)', 'Huiles usagées', 'Déchets industriels', 'Archives à détruire'], required: true },
        { key: 'volume', label: 'Volume moyen produit par semaine', type: 'number', unit: 'm³' },
        { key: 'contenants', label: 'Contenants à fournir', type: 'textarea' },
      ] },
      { key: 'collecte', title: 'Collecte', fields: [
        { key: 'frequence', label: 'Fréquence de collecte', type: 'choice', options: ['Quotidienne', 'Trois fois par semaine', 'Hebdomadaire', 'À la demande'], required: true },
        { key: 'horaires', label: 'Horaires de collecte', type: 'text' },
      ] },
      { key: 'traitement', title: 'Traitement et traçabilité', fields: [
        { key: 'filiere', label: 'Filière d’élimination exigée', type: 'textarea', help: 'Incinération agréée, valorisation, décharge contrôlée…' },
        { key: 'bordereau', label: 'Bordereau de suivi à chaque enlèvement', type: 'yesno' },
        { key: 'autorisation', label: 'Autorisation environnementale exigée', type: 'yesno' },
      ] },
      administrative(),
    ],
    questions: [
      { key: 'filierePropose', label: 'Filière et sites de traitement proposés', type: 'textarea', required: true },
      { key: 'vehicules', label: 'Véhicules et contenants', type: 'textarea' },
      { key: 'tracabilite', label: 'Documents de traçabilité remis', type: 'textarea' },
      references(),
    ],
    criteria: [
      { key: 'prix', label: 'Prix', weight: 35, auto: 'price' }, { key: 'delai', label: 'Délai de mise en place', weight: 10, auto: 'delay' },
      { key: 'filiere', label: 'Filière et conformité réglementaire', weight: 30 }, { key: 'logistique', label: 'Moyens logistiques', weight: 10 }, { key: 'references', label: 'Références', weight: 15 },
    ],
    qualityCriteria: [
      { key: 'frequences', label: 'Respect des fréquences de collecte' }, { key: 'proprete', label: 'Propreté des points de collecte' },
      { key: 'filiere', label: 'Conformité de la filière et des bordereaux' }, { key: 'ponctualite', label: 'Ponctualité' },
      { key: 'comportement', label: 'Comportement des équipes' }, { key: 'reactivite', label: 'Réactivité aux demandes ponctuelles' },
    ] },

  { id: 'lib-other', serviceType: 'OTHER', name: 'Prestation de services (modèle général)', nameEn: 'Service contract (general form)', source: 'Bibliothèque TRACEOPS',
    description: 'Un cadre minimal à compléter quand aucun modèle spécialisé ne convient : objet, exigences, délais et pièces.',
    sections: [
      { key: 'objet', title: 'Consistance de la prestation', fields: [
        { key: 'consistance', label: 'Description détaillée des prestations', type: 'textarea', required: true },
        { key: 'lieux', label: 'Lieux d’exécution', type: 'textarea' },
        { key: 'quantites', label: 'Quantités ou volumes estimés', type: 'textarea' },
      ] },
      { key: 'exigences', title: 'Exigences', fields: [
        { key: 'normes', label: 'Normes et exigences techniques', type: 'textarea' },
        { key: 'livrables', label: 'Livrables attendus', type: 'textarea' },
      ] },
      administrative(),
    ],
    questions: [
      { key: 'methodologie', label: 'Méthodologie proposée', type: 'textarea', required: true },
      { key: 'moyens', label: 'Moyens humains et matériels', type: 'textarea' },
      references(),
    ],
    criteria: [
      { key: 'prix', label: 'Prix', weight: 40, auto: 'price' }, { key: 'delai', label: 'Délai d’exécution', weight: 15, auto: 'delay' },
      { key: 'technique', label: 'Valeur technique', weight: 30 }, { key: 'references', label: 'Références', weight: 15 },
    ],
    qualityCriteria: [
      { key: 'qualite', label: 'Qualité du travail rendu' }, { key: 'delais', label: 'Respect des délais' },
      { key: 'conformite', label: 'Conformité au cahier des charges' }, { key: 'communication', label: 'Communication et réactivité' },
      { key: 'securite', label: 'Respect des règles de sécurité' },
    ] },
];
