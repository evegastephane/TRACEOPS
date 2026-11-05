import PDFDocument from 'pdfkit';
import { inflateSync } from 'node:zlib';

/** True when the PNG's image data really decompresses: the PDF library fails outside any try block otherwise. */
export function readablePng(data: Buffer) {
  try {
    const parts: Buffer[] = [];
    for (let at = 8; at + 8 <= data.length;) {
      const length = data.readUInt32BE(at), type = data.toString('ascii', at + 4, at + 8);
      if (at + 12 + length > data.length) return false;
      if (type === 'IDAT') parts.push(data.subarray(at + 8, at + 8 + length));
      if (type === 'IEND') break;
      at += 12 + length;
    }
    return parts.length > 0 && inflateSync(Buffer.concat(parts)).length > 0;
  } catch { return false; }
}

type Detail = Record<string, any>;
type Photo = { id: string; task_id: string | null; phase: string; mime: string; data: Buffer };

const words = {
  fr: { title: 'Compte rendu d’intervention', client: 'Client', provider: 'Prestataire', site: 'Site', places: 'Lieux', kind: 'Type', planned: 'Créneau prévu', actual: 'Réalisation',
    started: 'démarrée le', submitted: 'soumise le', status: 'Statut', team: 'Équipe', lead: 'responsable', tasks: 'Tâches', note: 'Compte rendu de l’agent', quote: 'Devis', anomalies: 'Anomalies',
    history: 'Historique', photos: 'Photos', before: 'Avant', after: 'Après', none: 'Aucune', generated: 'Document généré le', snapshot: 'Instantané à la date de génération : il ne vaut pas signature.',
    CLEANING: 'Nettoyage', MAINTENANCE: 'Maintenance', TODO: 'À faire', DONE: 'Effectuée', IMPOSSIBLE: 'Impossible', OPEN: 'Ouverte', RESOLUTION_PROPOSED: 'Résolution proposée', CLOSED: 'Clôturée',
    PENDING: 'En attente', ACCEPTED: 'Accepté', REFUSED: 'Refusé', programme: 'Programme', rework: 'reprise demandée', round: 'Passage de contrôle n°' },
  en: { title: 'Intervention report', client: 'Client', provider: 'Provider', site: 'Site', places: 'Places', kind: 'Type', planned: 'Planned slot', actual: 'Execution',
    started: 'started on', submitted: 'submitted on', status: 'Status', team: 'Team', lead: 'lead', tasks: 'Tasks', note: 'Agent report', quote: 'Quote', anomalies: 'Anomalies',
    history: 'History', photos: 'Photos', before: 'Before', after: 'After', none: 'None', generated: 'Generated on', snapshot: 'Snapshot at generation time: not a signature.',
    CLEANING: 'Cleaning', MAINTENANCE: 'Maintenance', TODO: 'To do', DONE: 'Done', IMPOSSIBLE: 'Impossible', OPEN: 'Open', RESOLUTION_PROPOSED: 'Resolution proposed', CLOSED: 'Closed',
    PENDING: 'Pending', ACCEPTED: 'Accepted', REFUSED: 'Refused', programme: 'Programme', rework: 'rework requested', round: 'Review round' },
};
export const statusWords: Record<string, [string, string]> = {
  REQUESTED: ['Demandée', 'Requested'], QUOTE_SUBMITTED: ['Devis à valider', 'Quote to approve'], QUOTE_REFUSED: ['Devis refusé', 'Quote refused'], PLANNED: ['À affecter', 'To assign'],
  ASSIGNED: ['Planifiée', 'Scheduled'], IN_PROGRESS: ['En cours', 'In progress'], UNDER_REVIEW: ['À contrôler', 'Awaiting review'], REWORK: ['Reprise demandée', 'Rework requested'],
  ACCEPTED: ['Acceptée', 'Accepted'], CANCELLED: ['Annulée', 'Cancelled'],
};

/** Thousands with a plain space: the PDF's standard fonts have no narrow no-break space. */
const money = (v: number | string) => String(Math.round(Number(v))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const eventWords: Record<string, [string, string]> = {
  REQUESTED: ['Demande créée', 'Request created'], SCHEDULED: ['Passage programmé', 'Passage scheduled'], QUOTE_SUBMITTED: ['Devis transmis', 'Quote submitted'],
  QUOTE_ACCEPTED: ['Devis accepté', 'Quote accepted'], QUOTE_REFUSED: ['Devis refusé', 'Quote refused'], ASSIGNED: ['Équipe affectée', 'Team assigned'],
  STARTED: ['Intervention démarrée', 'Work started'], TASK_DONE: ['Tâche effectuée', 'Task done'], TASK_IMPOSSIBLE: ['Tâche impossible', 'Task impossible'], TASK_TODO: ['Tâche rouverte', 'Task reopened'],
  PHOTO_BEFORE: ['Photo avant ajoutée', 'Before photo added'], PHOTO_AFTER: ['Photo après ajoutée', 'After photo added'], SUBMITTED: ['Compte rendu soumis', 'Report submitted'],
  RESUBMITTED: ['Compte rendu soumis à nouveau', 'Report resubmitted'], REWORK_REQUESTED: ['Reprise demandée', 'Rework requested'], ACCEPTED: ['Prestation acceptée', 'Work accepted'],
  CANCELLED: ['Intervention annulée', 'Intervention cancelled'], ANOMALY_REPORTED: ['Anomalie signalée', 'Anomaly reported'],
  ANOMALY_RESOLUTION_PROPOSED: ['Résolution proposée', 'Resolution proposed'], ANOMALY_CLOSED: ['Anomalie clôturée', 'Anomaly closed'],
};
export function renderReport(d: Detail, photos: Photo[], lang: 'fr' | 'en'): Promise<Buffer> {
  const w = words[lang], tz = d.timezone || 'Africa/Douala';
  const when = (v: string | Date | null) => v ? new Date(v).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { timeZone: tz, dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `${w.title} INT-${String(d.number).padStart(4, '0')}`, Author: 'TRACEOPS' } });
  const chunks: Buffer[] = []; doc.on('data', c => chunks.push(c));
  const ink = '#111827', muted = '#6b7280', rule = '#e5e7eb', accent = '#2563eb';
  const heading = (label: string) => { doc.moveDown(0.8); doc.fillColor(ink).font('Helvetica-Bold').fontSize(12).text(label, 48); doc.moveTo(48, doc.y + 2).lineTo(547, doc.y + 2).strokeColor(rule).lineWidth(1).stroke(); doc.moveDown(0.4); };
  const row = (label: string, value: string) => { doc.font('Helvetica').fontSize(9).fillColor(muted).text(label, 48, doc.y, { continued: false, width: 130 }); doc.moveUp(); doc.fillColor(ink).fontSize(10).text(value || '—', 180, doc.y, { width: 367 }); doc.moveDown(0.15); };

  doc.font('Helvetica-Bold').fontSize(10).fillColor(accent).text('TRACE', { continued: true }).font('Helvetica').text('OPS');
  doc.moveDown(0.5).font('Helvetica-Bold').fontSize(18).fillColor(ink).text(`${w.title} INT-${String(d.number).padStart(4, '0')}`);
  doc.font('Helvetica').fontSize(11).fillColor(muted).text(d.title);
  doc.moveDown(0.6);
  row(w.status, (statusWords[d.status] ?? [d.status, d.status])[lang === 'fr' ? 0 : 1]);
  row(w.kind, w[d.kind as 'CLEANING'] + (d.programme_title ? ` · ${w.programme} « ${d.programme_title} »` : ''));
  row(w.client, d.client_name); row(w.provider, d.provider_name); row(w.site, `${d.site_name} (${tz})`);
  row(w.places, (d.zones as any[]).map(z => [...z.path, z.name].join(' › ') + ` (${z.code})`).join('\n'));
  row(w.planned, `${when(d.starts_at)} – ${when(d.ends_at)}`);
  row(w.actual, [d.started_at && `${w.started} ${when(d.started_at)}`, d.submitted_at && `${w.submitted} ${when(d.submitted_at)}`].filter(Boolean).join(' · ') || '—');
  row(w.team, (d.agents as any[]).map(a => a.display_name + (a.lead ? ` (${w.lead})` : '')).join(', ') || '—');

  if ((d.quotes as any[]).length) {
    heading(w.quote);
    for (const q of d.quotes as any[]) row(`${w[q.status as 'PENDING']} · ${when(q.created_at)}`, `${money(q.amount_xaf)} FCFA · ${q.delay_days} j\n${q.description}${q.reason ? `\n${q.reason}` : ''}`);
  }
  heading(w.tasks);
  for (const t of d.tasks as any[]) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text(`${t.position}. ${t.label}`, 48, doc.y, { continued: true }).font('Helvetica').fillColor(t.status === 'DONE' ? '#15803d' : t.status === 'IMPOSSIBLE' ? '#b91c1c' : muted)
      .text(`  ${w[t.status as 'TODO']}${t.rework ? ` · ${w.rework}` : ''}`);
    if (t.note || t.done_by) doc.font('Helvetica').fontSize(9).fillColor(muted).text([t.note, t.done_by && `${t.done_by} · ${when(t.done_at)}`].filter(Boolean).join(' — '), { indent: 14 });
    doc.moveDown(0.2);
  }
  if (d.report_note) { heading(w.note); doc.font('Helvetica').fontSize(10).fillColor(ink).text(d.report_note); }
  heading(w.anomalies);
  if (!(d.anomalies as any[]).length) doc.font('Helvetica').fontSize(10).fillColor(muted).text(w.none);
  for (const a of d.anomalies as any[]) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text(`${a.title}`, { continued: true }).font('Helvetica').fillColor(a.status === 'CLOSED' ? '#15803d' : '#b91c1c').text(`  ${w[a.status as 'OPEN']}`);
    doc.font('Helvetica').fontSize(9).fillColor(muted).text([a.zone_name, a.description, a.resolution, a.closing_note && `${a.closed_by} : ${a.closing_note}`].filter(Boolean).join(' — '), { indent: 14 });
    doc.moveDown(0.2);
  }
  heading(w.history);
  for (const e of d.events as any[]) doc.font('Helvetica').fontSize(9).fillColor(ink).text(`${when(e.created_at)} · ${e.actor} · ${(eventWords[e.action] ?? [e.action, e.action])[lang === 'fr' ? 0 : 1]}${e.reason ? ` — ${e.reason}` : ''}`, 48);
  if (photos.length) {
    doc.addPage(); doc.font('Helvetica-Bold').fontSize(12).fillColor(ink).text(w.photos); doc.moveDown(0.5);
    let x = 48, y = doc.y;
    for (const p of photos) {
      if (y > 640) { doc.addPage(); y = 48; }
      if (p.mime === 'image/png' && !readablePng(p.data)) continue;
      try { doc.image(p.data, x, y, { fit: [155, 120], align: 'center' }); } catch { continue; }
      const task = (d.tasks as any[]).find(t => t.id === p.task_id);
      doc.font('Helvetica').fontSize(8).fillColor(muted).text(`${p.phase === 'BEFORE' ? w.before : w.after}${task ? ` · ${task.label}` : ''}`, x, y + 124, { width: 155 });
      x += 167; if (x > 400) { x = 48; y += 160; }
    }
  }
  doc.moveDown(1.2).font('Helvetica').fontSize(8).fillColor(muted).text(`${w.generated} ${when(new Date())}. ${w.snapshot}`, 48, undefined, { width: 499 });
  doc.end();
  return new Promise(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));
}
