import PDFDocument from 'pdfkit';
import type { Criterion, Field, QualityCriterion, Section } from './forms.js';

type Detail = Record<string, any>;

const words = {
  fr: { title: 'Dossier d’appel d’offres', client: 'Maître d’ouvrage', site: 'Site', type: 'Type de prestation', template: 'Modèle de formulaire', deadline: 'Date limite de remise des offres',
    start: 'Démarrage souhaité', duration: 'Durée d’exécution', days: 'jours', terms: 'Règlement', termsText: (n: number) => `${n} jours après l’acceptation de chaque prestation`, status: 'Statut',
    object: 'Objet', reply: 'Bordereau de réponse', replyIntro: 'Chaque offre indique son montant total (FCFA), son délai (en jours), le contenu de l’offre et ses points forts, puis répond aux rubriques suivantes :',
    required: 'obligatoire', award: 'Critères d’attribution', weight: 'Pondération', awardNote: 'Le prix et le délai sont notés automatiquement : la meilleure offre obtient 10, les autres en proportion. Les autres critères sont notés de 0 à 10 par la commission.',
    quality: 'Suivi de la qualité', qualityNote: 'Pendant l’exécution, un technicien du maître d’ouvrage note chaque critère de 1 à 10 et peut justifier sa note.',
    yes: 'Oui', no: 'Non', none: '—', generated: 'Document généré le', snapshot: 'Instantané à la date de génération.', auto: 'calculé',
    CLEANING: 'Nettoyage et hygiène', MAINTENANCE: 'Maintenance technique', HVAC: 'Froid et climatisation', SECURITY: 'Gardiennage et sécurité', PEST: 'Dératisation, désinsectisation, désinfection',
    GREEN: 'Espaces verts', WASTE: 'Collecte des déchets', OTHER: 'Prestation de services',
    DRAFT: 'Brouillon', PUBLISHED: 'Consultation en cours', CLOSED: 'Offres en cours d’analyse', AWARDED: 'Attribué', CANCELLED: 'Annulé' },
  en: { title: 'Tender file', client: 'Contracting client', site: 'Site', type: 'Type of service', template: 'Form template', deadline: 'Deadline for offers',
    start: 'Desired start', duration: 'Duration', days: 'days', terms: 'Payment', termsText: (n: number) => `${n} days after the acceptance of each service`, status: 'Status',
    object: 'Purpose', reply: 'Reply form', replyIntro: 'Each offer states its total amount (XAF), its lead time (days), its content and its strengths, then answers the following items:',
    required: 'required', award: 'Award criteria', weight: 'Weight', awardNote: 'Price and lead time are marked automatically: the best offer gets 10, the others in proportion. The other criteria are marked from 0 to 10 by the committee.',
    quality: 'Quality follow-up', qualityNote: 'During the work, a technician of the client marks each criterion from 1 to 10 and may justify the mark.',
    yes: 'Yes', no: 'No', none: '—', generated: 'Generated on', snapshot: 'Snapshot at generation time.', auto: 'computed',
    CLEANING: 'Cleaning and hygiene', MAINTENANCE: 'Technical maintenance', HVAC: 'Refrigeration and air conditioning', SECURITY: 'Guarding and security', PEST: 'Pest control and disinfection',
    GREEN: 'Grounds maintenance', WASTE: 'Waste collection', OTHER: 'Service contract',
    DRAFT: 'Draft', PUBLISHED: 'Open for offers', CLOSED: 'Offers under review', AWARDED: 'Awarded', CANCELLED: 'Cancelled' },
};

export function renderTender(d: Detail, lang: 'fr' | 'en'): Promise<Buffer> {
  const w = words[lang];
  const number = `AO-${String(d.number).padStart(4, '0')}`;
  const when = (v: string | Date) => new Date(v).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { timeZone: 'Africa/Douala', dateStyle: 'long', timeStyle: 'short' });
  const date = (v: string) => new Date(v + 'T12:00:00Z').toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'long', timeZone: 'UTC' });
  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `${w.title} ${number}`, Author: 'TRACEOPS' } });
  const chunks: Buffer[] = []; doc.on('data', c => chunks.push(c));
  const ink = '#17262c', muted = '#55656c', rule = '#c9d5d9', accent = '#0e4a5c';
  const heading = (label: string) => {
    if (doc.y > 720) doc.addPage();
    doc.moveDown(0.8); doc.fillColor(accent).font('Helvetica-Bold').fontSize(12).text(label, 48);
    doc.moveTo(48, doc.y + 2).lineTo(547, doc.y + 2).strokeColor(rule).lineWidth(1).stroke(); doc.moveDown(0.5);
  };
  const row = (label: string, value: string) => {
    if (doc.y > 760) doc.addPage();
    const y = doc.y;
    doc.font('Helvetica').fontSize(9).fillColor(muted).text(label, 48, y, { width: 190 });
    const after = doc.y;
    doc.font('Helvetica').fontSize(10).fillColor(ink).text(value || w.none, 248, y, { width: 299 });
    doc.y = Math.max(after, doc.y); doc.moveDown(0.25);
  };
  const value = (f: Field) => {
    const v = f.value;
    if (v === undefined || v === null || v === '') return w.none;
    if (typeof v === 'boolean') return v ? w.yes : w.no;
    if (Array.isArray(v)) return v.join(', ');
    if (typeof v === 'number') return `${String(v).replace('.', lang === 'fr' ? ',' : '.')}${f.unit ? ` ${f.unit}` : ''}`;
    return f.unit ? `${v} ${f.unit}` : String(v);
  };

  doc.font('Helvetica-Bold').fontSize(10).fillColor(accent).text('TRACE', { continued: true }).font('Helvetica').text('OPS');
  doc.moveDown(0.5).font('Helvetica-Bold').fontSize(18).fillColor(ink).text(`${w.title} ${number}`);
  doc.font('Helvetica').fontSize(12).fillColor(muted).text(d.title);
  doc.moveDown(0.7);
  row(w.client, d.client_name);
  if (d.site_name) row(w.site, d.site_name);
  row(w.type, w[d.service_type as 'OTHER'] ?? d.service_type);
  if (d.template_name) row(w.template, d.template_name);
  row(w.deadline, when(d.deadline));
  if (d.start_date) row(w.start, date(d.start_date));
  if (d.duration_days) row(w.duration, `${d.duration_days} ${w.days}`);
  row(w.terms, w.termsText(Number(d.payment_terms_days)));
  row(w.status, w[d.status as 'DRAFT'] ?? d.status);
  if (d.object) { heading(w.object); doc.font('Helvetica').fontSize(10).fillColor(ink).text(d.object, 48, doc.y, { width: 499 }); }

  for (const s of (d.sections ?? []) as Section[]) {
    heading(s.title);
    if (s.help) { doc.font('Helvetica-Oblique').fontSize(9).fillColor(muted).text(s.help, 48, doc.y, { width: 499 }); doc.moveDown(0.3); }
    for (const f of s.fields) row(f.label, value(f));
  }

  heading(w.reply);
  doc.font('Helvetica').fontSize(10).fillColor(ink).text(w.replyIntro, 48, doc.y, { width: 499 }); doc.moveDown(0.3);
  for (const [i, q] of ((d.questions ?? []) as Field[]).entries())
    doc.font('Helvetica').fontSize(10).fillColor(ink).text(`${i + 1}. ${q.label}${q.unit ? ` (${q.unit})` : ''}${q.required ? ` — ${w.required}` : ''}`, 60, doc.y, { width: 487 });

  heading(w.award);
  for (const c of (d.criteria ?? []) as Criterion[]) row(`${c.label}${c.auto ? ` (${w.auto})` : ''}`, `${c.weight} %`);
  doc.moveDown(0.2).font('Helvetica').fontSize(9).fillColor(muted).text(w.awardNote, 48, doc.y, { width: 499 });

  heading(w.quality);
  for (const [i, q] of ((d.quality_criteria ?? []) as QualityCriterion[]).entries())
    doc.font('Helvetica').fontSize(10).fillColor(ink).text(`${i + 1}. ${q.label}`, 60, doc.y, { width: 487 });
  doc.moveDown(0.3).font('Helvetica').fontSize(9).fillColor(muted).text(w.qualityNote, 48, doc.y, { width: 499 });

  doc.moveDown(1.2).font('Helvetica').fontSize(8).fillColor(muted).text(`${w.generated} ${when(new Date())}. ${w.snapshot}`, 48, undefined, { width: 499 });
  doc.end();
  return new Promise(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));
}
