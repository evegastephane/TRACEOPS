import { ApiError } from './api';
import type { Lang } from './i18n';
import { dayKey } from './metrics';

/* Shared vocabulary of tenders, contracts and payments: types, labels, formats, the comparison of offers
   and the reading of an old tender file. Every figure is computed from what the server returns. */

export type FieldType = 'text' | 'textarea' | 'number' | 'yesno' | 'choice' | 'multi' | 'date';
export type FieldValue = string | number | boolean | string[] | null;
export type Field = { key: string; label: string; type: FieldType; unit?: string; options?: string[]; required?: boolean; help?: string; value?: FieldValue };
export type Section = { key: string; title: string; help?: string; fields: Field[] };
export type Criterion = { key: string; label: string; weight: number; auto?: 'price' | 'delay' };
export type QualityCriterion = { key: string; label: string; help?: string };
export type ServiceType = 'CLEANING' | 'MAINTENANCE' | 'HVAC' | 'SECURITY' | 'PEST' | 'GREEN' | 'WASTE' | 'OTHER';
export type Template = { id: string; serviceType: ServiceType; name: string; nameEn?: string; description: string | null; source: string | null; sections: Section[]; questions: Field[];
  criteria: Criterion[]; qualityCriteria: QualityCriterion[]; library: boolean; updatedAt?: string; author?: string };
export type Org = { id: string; name: string; kind: 'CLIENT' | 'PROVIDER'; roles?: string[] };
export type Ctx = { subtitle: string; userName: string };

export const TZ = 'Africa/Douala';
export const serviceTypes: Record<ServiceType, [string, string]> = {
  CLEANING: ['Nettoyage et hygiène', 'Cleaning and hygiene'], MAINTENANCE: ['Maintenance technique', 'Technical maintenance'], HVAC: ['Froid et climatisation', 'Refrigeration and HVAC'],
  SECURITY: ['Gardiennage et sécurité', 'Guarding and security'], PEST: ['Dératisation, désinsectisation, désinfection', 'Pest control'], GREEN: ['Espaces verts', 'Grounds maintenance'],
  WASTE: ['Collecte des déchets', 'Waste collection'], OTHER: ['Prestation de services', 'Service contract'],
};
export const serviceLabel = (t: string, lang: Lang) => (serviceTypes[t as ServiceType] ?? [t, t])[lang === 'fr' ? 0 : 1];
export const fieldTypes: Record<FieldType, [string, string]> = {
  text: ['Texte court', 'Short text'], textarea: ['Texte long', 'Long text'], number: ['Nombre', 'Number'], yesno: ['Oui / non', 'Yes / no'],
  choice: ['Choix unique', 'Single choice'], multi: ['Choix multiple', 'Multiple choice'], date: ['Date', 'Date'],
};

export const loc = (lang: Lang) => lang === 'fr' ? 'fr-FR' : 'en-GB';
export const num = (v: number, lang: Lang, digits = 1) => v.toLocaleString(loc(lang), { maximumFractionDigits: digits });
export const fcfa = (v: number | string | null | undefined, lang: Lang) => v === null || v === undefined || v === '' ? '—' : `${Math.round(Number(v)).toLocaleString(loc(lang))} FCFA`;
/** Large amounts in a KPI: "18,6 M FCFA". */
export const shortFcfa = (v: number, lang: Lang) => Math.abs(v) >= 1e6 ? `${num(v / 1e6, lang)} M FCFA` : Math.abs(v) >= 1e4 ? `${num(v / 1e3, lang, 0)} k FCFA` : fcfa(v, lang);
export const pad = (n: number) => String(n).padStart(4, '0');
export const tenderRef = (n: number) => 'AO-' + pad(n);
export const contractRef = (n: number) => 'CT-' + pad(n);
export const interventionRef = (n: number) => 'INT-' + pad(n);
/** Today in Douala, "YYYY-MM-DD". */
export const todayKey = () => dayKey(new Date(), TZ);
/** Days from a to b ("YYYY-MM-DD"). */
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
export const addDays = (date: string, days: number) => new Date(Date.parse(date + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10);
/** A calendar date ("YYYY-MM-DD") or an instant, as text. */
export function dateText(v: string | null | undefined, lang: Lang, style: 'short' | 'long' | 'time' = 'short') {
  if (!v) return '—';
  const plain = /^\d{4}-\d{2}-\d{2}$/.test(v);
  const d = new Date(plain ? v + 'T12:00:00Z' : v);
  const tz = plain ? 'UTC' : TZ;
  if (style === 'time') return d.toLocaleString(loc(lang), { timeZone: tz, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString(loc(lang), { timeZone: tz, day: 'numeric', month: style === 'long' ? 'long' : 'short', year: 'numeric' });
}
export const instantDay = (iso: string) => dayKey(iso, TZ);
export const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
export const plural = (n: number, one: string, many: string) => `${n.toLocaleString('fr-FR')} ${n > 1 ? many : one}`;

/* --------------------------------------------------------------- errors */

const errors: Record<string, [string, string]> = {
  ACTION_NOT_ALLOWED: ['Cette action n’est plus possible : le dossier a changé. Rechargez la page.', 'This action is no longer possible: the file changed. Reload the page.'],
  FORBIDDEN: ['Vous n’avez pas accès à cette action.', 'You do not have access to this action.'],
  INVALID_INPUT: ['Vérifiez les champs du formulaire.', 'Check the form fields.'], INVALID_FORM: ['Un champ du formulaire est incomplet : chaque rubrique et chaque information doivent avoir un nom.', 'A form item is incomplete: every section and field needs a name.'],
  INVALID_VALUE: ['Une valeur ne correspond pas au type attendu (nombre, date, choix).', 'A value does not match its expected type (number, date, choice).'],
  OPTIONS_REQUIRED: ['Un champ à choix doit proposer au moins une option.', 'A choice field needs at least one option.'], DUPLICATE_KEY: ['Deux éléments portent le même identifiant. Renommez l’un d’eux.', 'Two items share the same identifier. Rename one.'],
  CRITERIA_WEIGHTS: ['Les pondérations des critères doivent totaliser 100 %.', 'The criteria weights must add up to 100%.'], SECTIONS_REQUIRED: ['Ajoutez au moins une rubrique.', 'Add at least one section.'],
  INVALID_DATE: ['Date invalide.', 'Invalid date.'], DEADLINE_PASSED: ['La date limite de remise des offres est déjà passée : choisissez une date à venir.', 'The deadline has already passed: choose a future date.'],
  PROVIDERS_REQUIRED: ['Consultez au moins un prestataire avant de publier.', 'Invite at least one provider before publishing.'], QUALITY_REQUIRED: ['Ajoutez au moins un critère de suivi qualité.', 'Add at least one quality criterion.'],
  INVALID_SITE: ['Ce site n’existe pas ou n’est plus actif.', 'This site does not exist or is no longer active.'], INVALID_PROVIDER: ['Un des prestataires choisis n’est plus actif.', 'One of the chosen providers is no longer active.'],
  REASON_REQUIRED: ['Un motif est obligatoire.', 'A reason is required.'], TENDER_CLOSED: ['La remise des offres est close pour cet appel d’offres.', 'This tender no longer accepts offers.'],
  ANSWERS_REQUIRED: ['Répondez à toutes les rubriques obligatoires du bordereau.', 'Answer every required item of the reply form.'],
  BID_ALREADY_ONLINE: ['Ce prestataire a déjà transmis son offre en ligne : elle ne peut pas être remplacée.', 'This provider already sent its offer online: it cannot be replaced.'],
  INVALID_SCORE: ['Une note doit être comprise entre 0 et 10 (par demi-point).', 'A mark must be between 0 and 10 (in half points).'], INVALID_CRITERION: ['Critère inconnu.', 'Unknown criterion.'],
  AWARD_REQUIRED: ['Choisissez au moins une offre à retenir.', 'Choose at least one offer to retain.'], INVALID_BID: ['Une offre écartée ne peut pas être retenue.', 'A rejected offer cannot be retained.'],
  DELIVERY_LOCKED: ['Cette prestation est déjà acceptée ou réalisée : elle ne peut plus être modifiée.', 'This service is already accepted or delivered: it can no longer be changed.'],
  SCORES_REQUIRED: ['Notez chaque critère de 1 à 10.', 'Mark every criterion from 1 to 10.'], ALREADY_PAID: ['Ce règlement est déjà enregistré.', 'This payment is already recorded.'],
  TENDER_NOT_FOUND: ['Appel d’offres introuvable.', 'Tender not found.'], CONTRACT_NOT_FOUND: ['Contrat introuvable.', 'Contract not found.'],
  INVITATION_DECLINED: ['Vous avez décliné cette consultation : revenez sur votre décision pour envoyer une offre.', 'You declined this tender: change your answer to send an offer.'],
  BID_ALREADY_SENT: ['Votre offre est déjà transmise : vous participez à cette consultation.', 'Your offer is already sent: you take part in this tender.'],
  TENDER_REQUIRED: ['Ce prestataire n’a pas encore de contrat accepté avec vous : lancez d’abord un appel d’offres.', 'This provider has no accepted contract with you yet: launch a tender first.'],
  TASKS_REQUIRED: ['Le planning ne contient aucune tâche datée.', 'The planning holds no dated task.'], INVALID_CONTRACT: ['Contrat inconnu.', 'Unknown contract.'],
  PLAN_NOT_FOUND: ['Planning introuvable.', 'Planning not found.'], PROVIDER_NOT_FOUND: ['Prestataire introuvable.', 'Provider not found.'], INVALID_PERIOD: ['Période invalide.', 'Invalid period.'],
  network: ['Connexion au serveur impossible.', 'Cannot reach the server.'], error: ['Une erreur est survenue. Réessayez.', 'Something went wrong. Please try again.'],
};
export const say = (e: unknown, lang: Lang) => { const code = e instanceof ApiError ? e.code : 'error'; return (errors[code] ?? errors.error)[lang === 'fr' ? 0 : 1]; };

/* ------------------------------------------------------- keys and values */

/** A stable identifier from a label, unique among the existing ones. */
export function newKey(label: string, taken: string[]) {
  const base = label.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, ' ').trim().split(/\s+/).slice(0, 4)
    .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('').slice(0, 30) || 'champ';
  let key = base, n = 2;
  while (taken.includes(key)) key = `${base}${n++}`;
  return key;
}
export const allFieldKeys = (sections: Section[]) => sections.flatMap(s => s.fields.map(f => f.key));
export const isEmpty = (v: FieldValue | undefined) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
export function valueText(f: Field, v: FieldValue | undefined, lang: Lang) {
  if (isEmpty(v)) return '—';
  if (typeof v === 'boolean') return v ? (lang === 'fr' ? 'Oui' : 'Yes') : (lang === 'fr' ? 'Non' : 'No');
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'number') return `${num(v, lang, 2)}${f.unit ? ` ${f.unit}` : ''}`;
  if (f.type === 'date') return dateText(String(v), lang, 'long');
  return f.unit ? `${v} ${f.unit}` : String(v);
}
export const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/* ------------------------------------------------- comparing the offers */

export type Bid = { id: string; provider_id: string; provider_name: string; provider_city?: string | null; amount_xaf: string | number; delay_days: number; content: string; strengths: string | null;
  answers: Record<string, FieldValue>; source: 'ONLINE' | 'RECORDED'; status: 'SUBMITTED' | 'SHORTLISTED' | 'REJECTED' | 'AWARDED' | 'NOT_RETAINED' | 'DECLINED'; scores: Record<string, { score: number; note?: string }>;
  review_note: string | null; status_reason: string | null; submitted_at: string; updated_at: string; submitted_by_name: string; sealed?: boolean };
export type Score = { per: Record<string, number | null>; total: number | null; complete: boolean; rank: number | null };

/**
 * Weighted marks out of 10. Price and delay are marked from the offers themselves: the best one gets 10, the others
 * in proportion. The other criteria use the committee's marks; an offer not fully marked keeps a provisional total.
 */
export function scoreBids(bids: Bid[], criteria: Criterion[]): Map<string, Score> {
  const pool = bids.filter(b => !b.sealed && b.status !== 'REJECTED');
  // When every offer is set aside, they are still marked against each other.
  const reference = pool.length ? pool : bids.filter(b => !b.sealed);
  const minAmount = Math.min(...reference.map(b => Number(b.amount_xaf))), minDelay = Math.min(...reference.map(b => b.delay_days));
  const out = new Map<string, Score>();
  for (const b of bids) {
    if (b.sealed) { out.set(b.id, { per: {}, total: null, complete: false, rank: null }); continue; }
    const per: Record<string, number | null> = {};
    let sum = 0, weights = 0, complete = true;
    for (const c of criteria) {
      const v = c.auto === 'price' ? Math.round((10 * minAmount / Number(b.amount_xaf)) * 100) / 100
        : c.auto === 'delay' ? Math.round((10 * (minDelay + 1) / (b.delay_days + 1)) * 100) / 100
        : b.scores?.[c.key]?.score ?? null;
      per[c.key] = v;
      if (v === null) { complete = false; continue; }
      sum += c.weight * v; weights += c.weight;
    }
    out.set(b.id, { per, total: weights ? Math.round((sum / weights) * 100) / 100 : null, complete, rank: null });
  }
  [...pool].sort((a, b) => (out.get(b.id)!.total ?? -1) - (out.get(a.id)!.total ?? -1)).forEach((b, i) => { const s = out.get(b.id)!; if (s.total !== null) s.rank = i + 1; });
  return out;
}

/* ---------------------------------------- reading an old tender file */

const BULLET = /^(?:[-–—•·*▪►o]|\(?[a-z]\)|\d+[.)]\d*[.)]?|[ivx]+\))\s+/i;
/** "ARTICLE 3 :", "Chapitre II –", "Pièce 5." open a section whatever their case. */
const KEYWORD = /^(?:article|chapitre|titre|section|partie|pi[eè]ce)\s+[\dIVXLC]+\s*[-–—:.)]?\s*/i;
const ROMAN = /^[IVXLC]{1,5}\s*[-–—.)]\s+/;
const NUMBERED = /^\d{1,2}\s*[-–—.)]\s+/;
const CRITERIA_HEAD = /crit[eè]res?|notation|[ée]valuation des offres|grille/i;
const PIECES_HEAD = /pi[eè]ces?\s+(?:administratives|à fournir|exig)|dossier administratif/i;
const upperRatio = (s: string) => { const letters = s.replace(/[^A-Za-zÀ-ÿ]/g, ''); return letters.length ? letters.replace(/[^A-ZÀ-Ý]/g, '').length / letters.length : 0; };
/** Spaces and punctuation trimmed at both ends; a capitalised line is put back in sentence case. */
const tidy = (s: string) => {
  const t = s.replace(/\s+/g, ' ').replace(/^[\s:;.,–—-]+/, '').replace(/[\s:;.,–—-]+$/, '').trim();
  if (!t) return t;
  const c = upperRatio(t) > 0.8 ? t.toLowerCase() : t;
  return c.charAt(0).toUpperCase() + c.slice(1);
};

/** A field's type and unit, guessed from its wording. */
export function guessField(label: string, example?: string): Pick<Field, 'type' | 'unit'> {
  const s = `${label} ${example ?? ''}`.toLowerCase();
  const unit = /m²|m2\b/.test(s) ? 'm²' : /m³|m3\b/.test(s) ? 'm³' : /\bkva\b/.test(s) ? 'kVA' : /\bfcfa|\bxaf/.test(s) ? 'FCFA' : /%/.test(s) ? '%'
    : /\bheures?\b|\bh\b/.test(s) ? 'heures' : /\bminutes?\b/.test(s) ? 'minutes' : /\bjours?\b/.test(s) ? 'jours' : /\bmois\b/.test(s) ? 'mois' : /\bagents?\b|\bpersonnes?\b/.test(s) ? 'agents' : undefined;
  if (/\bdate\b/.test(s)) return { type: 'date' };
  if (/\b(nombre|nb|effectif|quantit[ée]|surface|superficie|lin[ée]aire|volume|d[ée]lai|puissance|capacit[ée]|taux|fr[ée]quence en)\b/.test(s) || (example && /^\s*[\d\s.,]+\s*\S{0,8}\s*$/.test(example))) return { type: 'number', unit };
  if (/\?$|\b(oui|non|exig[ée]e?s?|obligatoire|requis|fourni|inclus|pr[ée]sent)\b/.test(s)) return { type: 'yesno' };
  if (/\b(description|liste|d[ée]tail|modalit[ée]s|conditions|exigences|m[ée]thodologie|organisation|r[ée]f[ée]rences|observations|consistance)\b/.test(s)) return { type: 'textarea' };
  return { type: 'text', unit };
}

/**
 * The sections of an old tender file pasted as text: numbered or capitalised titles become sections, the lines below them
 * become fields ("label : example" keeps the old value as a hint), the lists of documents become a multiple choice and an
 * evaluation grid ("Offre financière : 40 points") becomes the award criteria. Everything stays to be checked by a person.
 */
export function extractTemplate(text: string, lang: Lang): { name: string; sections: Section[]; criteria: Criterion[]; found: { sections: number; fields: number; criteria: number } } {
  const lines = text.split(/\r?\n/).map(l => l.replace(/\t/g, ' ').trim()).filter(Boolean).slice(0, 800);
  const sections: Section[] = [], criteria: { label: string; points: number }[] = [];
  const st: { current: Section | null; mode: 'normal' | 'criteria' | 'pieces' } = { current: null, mode: 'normal' };
  let name = '';
  const taken: string[] = [];
  const open = (title: string) => {
    const current: Section = { key: newKey(title, sections.map(s => s.key)), title: title.slice(0, 120), fields: [] };
    st.current = current;
    sections.push(current);
    st.mode = CRITERIA_HEAD.test(title) ? 'criteria' : PIECES_HEAD.test(title) ? 'pieces' : 'normal';
  };
  for (const raw of lines) {
    // "OBJET : …" names the file rather than opening a section.
    const object = raw.match(/^(?:objet|intitul[ée])\s*:\s*(.{6,})$/i);
    if (object && !name) { name = tidy(object[1]!).slice(0, 160); continue; }
    const bullet = BULLET.test(raw), line = raw.replace(BULLET, '').trim();
    const rest = raw.replace(KEYWORD, '').replace(ROMAN, '').replace(NUMBERED, '').replace(/^[\s:.\-–—]+/, '');
    const shout = upperRatio(rest) > 0.85 && rest.replace(/[^A-Za-zÀ-ÿ]/g, '').length >= 4 && rest.length <= 90 && !/[.;,]$/.test(rest);
    // "1. Objet du marché" is a title; "1.2 Surface", "1) Attestation" or "Surface : 3 850 m²" are items.
    const numberedTitle = st.mode === 'normal' && /^\d{1,2}\s*[.–—-]\s+[A-ZÀ-Ý]/.test(raw) && !/^\d+\.\d/.test(raw) && raw.length <= 80 && !raw.includes(':');
    const romanTitle = /^[IVXLC]{1,5}\s*[-–—.]\s+/.test(raw) && (shout || st.mode === 'normal');
    const headingLike = KEYWORD.test(raw) || romanTitle || numberedTitle || (!bullet && shout);
    if (headingLike) {
      const title = tidy(rest);
      if (title && title.length >= 3 && !/^(dossier d.appel|appel d.offres n|r[ée]publique|paix|minist)/i.test(title)) open(title);
      continue;
    }
    if (!st.current) { if (!bullet && !/[:]/.test(line)) continue; open(lang === 'fr' ? 'Généralités' : 'General'); }
    const section = st.current!;
    const m = line.match(/^(.{3,70}?)\s*[:=]\s*(.+)$/);
    if (st.mode === 'criteria') {
      const points = (m?.[2] ?? line).match(/(\d+(?:[.,]\d+)?)\s*(?:points?|pts?|%)/i);
      if (points) { criteria.push({ label: tidy(m?.[1] ?? line.replace(points[0], '')), points: Number(points[1]!.replace(',', '.')) }); continue; }
    }
    if (st.mode === 'pieces' && (bullet || line.length <= 120)) {
      let f = section.fields.find(x => x.type === 'multi');
      if (!f) { f = { key: newKey('pieces', taken), label: lang === 'fr' ? 'Pièces administratives exigées' : 'Required documents', type: 'multi', options: [] }; taken.push(f.key); section.fields.push(f); }
      const option = tidy(line).slice(0, 200); if (option && !f.options!.includes(option)) f.options!.push(option);
      continue;
    }
    // Prose explains a section; it does not ask for a value.
    if (!m && ((line.length > 160) || (!bullet && /[.!]$/.test(line) && line.split(/\s+/).length > 8))) continue;
    const label = tidy(m ? m[1]! : line).slice(0, 200);
    if (!label || label.length < 3) continue;
    const g = guessField(label, m?.[2]);
    const field: Field = { key: newKey(label, taken), label, type: m ? g.type : bullet ? 'yesno' : g.type };
    if (g.unit && field.type === 'number') field.unit = g.unit;
    if (m) field.help = `${lang === 'fr' ? 'Ancien dossier' : 'Previous file'} : ${m[2]!.trim().slice(0, 200)}`;
    taken.push(field.key); section.fields.push(field);
  }
  // A title followed only by prose keeps one long text field, so the section survives.
  for (const s of sections) if (!s.fields.length) { const key = newKey(s.title, taken); taken.push(key); s.fields.push({ key, label: s.title, type: 'textarea' }); }
  const kept = sections.filter(s => !(CRITERIA_HEAD.test(s.title) && criteria.length && s.fields.every(f => f.type === 'textarea')));
  const total = criteria.reduce((s, c) => s + c.points, 0);
  let weights = total ? criteria.map(c => Math.round((c.points / total) * 100)) : [];
  if (weights.length) weights[weights.length - 1]! += 100 - weights.reduce((s, w) => s + w, 0);
  const crit: Criterion[] = criteria.map((c, i) => ({ key: newKey(c.label, criteria.slice(0, i).map(x => newKey(x.label, []))), label: c.label.slice(0, 120), weight: weights[i]!,
    ...( /financ|prix|co[uû]t|montant/i.test(c.label) ? { auto: 'price' as const } : /d[ée]lai/i.test(c.label) ? { auto: 'delay' as const } : {}) }));
  // At most one computed price and one computed delay criterion.
  let price = false, delay = false;
  for (const c of crit) { if (c.auto === 'price') { if (price) delete c.auto; price = true; } else if (c.auto === 'delay') { if (delay) delete c.auto; delay = true; } }
  return { name, sections: kept.slice(0, 20).map(s => ({ ...s, fields: s.fields.slice(0, 30) })), criteria: crit.slice(0, 12), found: { sections: kept.length, fields: kept.reduce((n, s) => n + s.fields.length, 0), criteria: crit.length } };
}

/** A fictional excerpt of an older tender file, to try the reading. */
export const sampleFile = `DOSSIER D'APPEL D'OFFRES N° 007/2024/DG
OBJET : ENTRETIEN ET NETTOYAGE DES LOCAUX ADMINISTRATIFS ET DES ATELIERS

ARTICLE 1 : OBJET DE LA CONSULTATION
La présente consultation a pour objet l'entretien quotidien des bureaux, sanitaires, vestiaires et ateliers du site.

ARTICLE 2 : CONSISTANCE DES PRESTATIONS
- Balayage et lavage humide des sols des bureaux
- Nettoyage et désinfection des sanitaires deux fois par jour
- Vidage des corbeilles et évacuation des déchets vers le local poubelles
- Lavage des vitres accessibles chaque trimestre
Surface totale des locaux : 3 850 m²
Horaires d'intervention : 05 h 30 – 07 h 30, du lundi au samedi

ARTICLE 3 : PERSONNEL
- Effectif minimum présent : 9 agents
- Chef d'équipe présent en permanence : oui
- Délai de remplacement d'un agent absent : 4 heures
- Tenue de travail et badge fournis par le prestataire

ARTICLE 4 : PRODUITS ET MATÉRIEL
- Produits homologués, fiches de données de sécurité remises au service HSE
- Autolaveuse et monobrosse affectées au site

ARTICLE 5 : DURÉE ET DÉLAIS
Durée du contrat : 12 mois
Délai de démarrage après notification : 10 jours

ARTICLE 6 : PIÈCES ADMINISTRATIVES À FOURNIR
a) Attestation de non-redevance CNPS
b) Attestation de conformité fiscale
c) Registre du commerce
d) Plan de localisation du siège

ARTICLE 7 : CRITÈRES D'ÉVALUATION DES OFFRES
- Offre financière : 40 points
- Méthodologie et organisation : 25 points
- Moyens humains et matériels : 20 points
- Références similaires : 15 points`;

/* ------------------------------------- the two separate facts: service and payment */

export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'neutral';
const states = {
  fr: { todo: 'À réaliser', late: 'En retard', lateSince: 'prévue le {d}', delivered: 'À réceptionner', deliveredOn: 'réalisée le {d}', accepted: 'Acceptée', rejected: 'Rejetée', on: 'le {d}',
    notDue: 'Non exigible', notDueNote: 'après acceptation', notOwed: 'Non dû', notOwedNote: 'prestation rejetée', pending: 'En attente', dueOn: 'échéance le {d}', soon: 'Échéance proche', inDays: 'dans {n} j', today: 'aujourd’hui',
    overdue: 'En retard de {n} j', paid: 'Réglé', paidOn: 'le {d}', paidLate: 'avec {n} j de retard' },
  en: { todo: 'To deliver', late: 'Late', lateSince: 'planned on {d}', delivered: 'To accept', deliveredOn: 'delivered on {d}', accepted: 'Accepted', rejected: 'Rejected', on: 'on {d}',
    notDue: 'Not yet due', notDueNote: 'after acceptance', notOwed: 'Not owed', notOwedNote: 'service rejected', pending: 'Pending', dueOn: 'due on {d}', soon: 'Due soon', inDays: 'in {n} d', today: 'today',
    overdue: '{n} d overdue', paid: 'Paid', paidOn: 'on {d}', paidLate: '{n} d late' },
};
export type Billable = { decision: 'PENDING' | 'ACCEPTED' | 'REJECTED'; delivered_at: string | null; planned_date: string; decided_at: string | null;
  payment_status: 'PENDING' | 'PAID' | null; due_date: string | null; paid_on: string | null };
/** The service's own state: to deliver, late, to accept, accepted or rejected. */
export function serviceState(x: Billable, today: string, lang: Lang): { key: string; label: string; note?: string; tone: Tone } {
  const w = states[lang];
  if (x.decision === 'ACCEPTED') return { key: 'accepted', label: w.accepted, note: x.decided_at ? fill(w.on, { d: dateText(x.decided_at, lang) }) : undefined, tone: 'green' };
  if (x.decision === 'REJECTED') return { key: 'rejected', label: w.rejected, note: x.decided_at ? fill(w.on, { d: dateText(x.decided_at, lang) }) : undefined, tone: 'red' };
  if (x.delivered_at) return { key: 'delivered', label: w.delivered, note: fill(w.deliveredOn, { d: dateText(x.delivered_at, lang) }), tone: 'amber' };
  if (x.planned_date < today) return { key: 'late', label: w.late, note: fill(w.lateSince, { d: dateText(x.planned_date, lang) }), tone: 'red' };
  return { key: 'todo', label: w.todo, tone: 'neutral' };
}
/** The payment's own state, which exists only once the service is accepted. */
export function paymentState(x: Billable, today: string, lang: Lang): { key: 'notdue' | 'notowed' | 'pending' | 'soon' | 'late' | 'paid'; label: string; note?: string; tone: Tone; days?: number } {
  const w = states[lang];
  if (x.decision === 'REJECTED') return { key: 'notowed', label: w.notOwed, note: w.notOwedNote, tone: 'neutral' };
  if (!x.payment_status || !x.due_date) return { key: 'notdue', label: w.notDue, note: w.notDueNote, tone: 'neutral' };
  if (x.payment_status === 'PAID') {
    const late = x.paid_on ? daysBetween(x.due_date, x.paid_on) : 0;
    return { key: 'paid', label: w.paid, note: [x.paid_on ? fill(w.paidOn, { d: dateText(x.paid_on, lang) }) : '', late > 0 ? fill(w.paidLate, { n: late }) : ''].filter(Boolean).join(' · '), tone: 'green', days: late };
  }
  const left = daysBetween(today, x.due_date);
  if (left < 0) return { key: 'late', label: fill(w.overdue, { n: -left }), note: fill(w.dueOn, { d: dateText(x.due_date, lang) }), tone: 'red', days: -left };
  if (left <= 7) return { key: 'soon', label: w.soon, note: `${fill(w.dueOn, { d: dateText(x.due_date, lang) })} · ${left === 0 ? w.today : fill(w.inDays, { n: left })}`, tone: 'amber', days: left };
  return { key: 'pending', label: w.pending, note: fill(w.dueOn, { d: dateText(x.due_date, lang) }), tone: 'blue', days: left };
}
