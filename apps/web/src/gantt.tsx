import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type { Lang } from './i18n';
import { BackIcon, ChevronIcon, CloseIcon, DownIcon, TrashIcon, UpIcon } from './icons';
import { Alert, Empty, PageHead, Skeleton } from './ui';
import { addDays, contractRef, dateText, daysBetween, fill, interventionRef, say, tenderRef, todayKey, type Ctx, type Org } from './procurement-model';
import { parseDelimited, parsePlanFile, type ImportResult } from './gantt-import';

/* ------------------------------------------------------------------ words */

const fr = {
  title: 'Planning', gantt: 'Diagramme de Gantt', period: 'Période', lines: 'Lignes', importBtn: 'Importer un ancien planning', zoom: 'Échelle', weeks: 'Semaines', months: 'Mois', quarter: 'Trimestre',
  prev: 'Période précédente', next: 'Période suivante', today: 'Aujourd’hui', asTable: 'Afficher en tableau', asChart: 'Afficher le diagramme', task: 'Tâche',
  tenders: 'Appels d’offres', contracts: 'Contrats', programmes: 'Programmes de nettoyage', maintenance: 'Maintenances ponctuelles', plans: 'Plannings importés', show: 'Afficher',
  consultation: 'Consultation', awarded: 'Attribution', deadline: 'Date limite', services: 'prestations', passages: '{a}/{n} passages acceptés', progress: 'Avancement', start: 'Début', end: 'Fin', group: 'Rubrique',
  importedFrom: 'Importé de {s} par {n} le {d}', importedBy: 'Importé par {n} le {d}', linkedTo: 'rattaché à {c}', remove: 'Retirer ce planning', removed: 'Planning retiré.', imported: 'Planning importé : {n} tâches.',
  empty: 'Aucune tâche sur la période.', emptyText: 'Les appels d’offres, contrats, programmes et maintenances datés apparaissent ici. Vous pouvez aussi importer un ancien planning Gantt.',
  loading: 'Chargement…', retry: 'Réessayer', loadError: 'Impossible de charger le planning. Réessayez.',
  PROPOSED: 'à accepter', ACTIVE: 'en cours', CLOSED: 'clôturé', DRAFT: 'brouillon', PUBLISHED: 'consultation', CLOSED_T: 'analyse', AWARDED: 'attribué', open: 'Ouvrir',
  // import
  imTitle: 'Importer un ancien planning Gantt', imIntro: 'Fichier MS Project enregistré en XML, fichier GanttProject (.gan), fichier CSV exporté d’Excel ou de MS Project, ou lignes copiées depuis un tableur. Le planning est lu dans votre navigateur ; vous vérifiez l’aperçu avant d’importer.',
  imFile: 'Choisir un fichier', imPaste: 'Coller des lignes', imPasteHint: 'Collez ici les lignes copiées depuis Excel ou MS Project (avec la ligne des titres : Tâche, Début, Fin…)', imRead: 'Lire les lignes collées',
  imSample: 'Essayer avec un exemple', imName: 'Nom du planning', imContract: 'Rattacher à un contrat (facultatif)', imNone: 'Aucun : planning de votre organisation', imConfirm: 'Importer {n} tâches', imCancel: 'Annuler',
  imFound: '{n} tâches lues · du {a} au {b}', imSkipped: '{n} ligne(s) ignorée(s) sans nom ou sans date', imFormat: 'Format', more: '… et {n} autres tâches',
  CSV: 'CSV (Excel, MS Project)', MSPROJECT_XML: 'MS Project (XML)', GANTTPROJECT: 'GanttProject', PASTE: 'Lignes collées',
  BINARY: 'Ce fichier est un format binaire (.mpp, .xlsx…) : enregistrez le planning en XML depuis MS Project, ou en CSV depuis Excel, puis importez ce fichier.',
  EMPTY: 'Le fichier est vide.', NO_DATES: 'Aucune tâche datée n’a été trouvée : vérifiez les colonnes Tâche, Début et Fin (ou Durée).', XML: 'Le fichier XML est illisible.',
  milestone: 'jalon', resource: 'Ressource',
};
type T = typeof fr;
const en: T = {
  title: 'Planning', gantt: 'Gantt chart', period: 'Period', lines: 'Lines', importBtn: 'Import an earlier planning', zoom: 'Scale', weeks: 'Weeks', months: 'Months', quarter: 'Quarter',
  prev: 'Previous period', next: 'Next period', today: 'Today', asTable: 'Show as a table', asChart: 'Show the chart', task: 'Task',
  tenders: 'Tenders', contracts: 'Contracts', programmes: 'Cleaning programmes', maintenance: 'One-off maintenance', plans: 'Imported plannings', show: 'Show',
  consultation: 'Consultation', awarded: 'Award', deadline: 'Deadline', services: 'services', passages: '{a}/{n} passages accepted', progress: 'Progress', start: 'Start', end: 'End', group: 'Section',
  importedFrom: 'Imported from {s} by {n} on {d}', importedBy: 'Imported by {n} on {d}', linkedTo: 'attached to {c}', remove: 'Remove this planning', removed: 'Planning removed.', imported: 'Planning imported: {n} tasks.',
  empty: 'No task in this period.', emptyText: 'Dated tenders, contracts, programmes and maintenance appear here. You can also import an earlier Gantt planning.',
  loading: 'Loading…', retry: 'Try again', loadError: 'The planning could not be loaded. Try again.',
  PROPOSED: 'to accept', ACTIVE: 'active', CLOSED: 'closed', DRAFT: 'draft', PUBLISHED: 'open', CLOSED_T: 'analysis', AWARDED: 'awarded', open: 'Open',
  imTitle: 'Import an earlier Gantt planning', imIntro: 'MS Project file saved as XML, GanttProject file (.gan), CSV exported from Excel or MS Project, or rows copied from a spreadsheet. The planning is read in your browser; you check the preview before importing.',
  imFile: 'Choose a file', imPaste: 'Paste rows', imPasteHint: 'Paste here the rows copied from Excel or MS Project (with the header row: Task, Start, Finish…)', imRead: 'Read the pasted rows',
  imSample: 'Try with an example', imName: 'Planning name', imContract: 'Attach to a contract (optional)', imNone: 'None: your organisation’s planning', imConfirm: 'Import {n} tasks', imCancel: 'Cancel',
  imFound: '{n} tasks read · from {a} to {b}', imSkipped: '{n} row(s) skipped without a name or a date', imFormat: 'Format', more: '… and {n} more tasks',
  CSV: 'CSV (Excel, MS Project)', MSPROJECT_XML: 'MS Project (XML)', GANTTPROJECT: 'GanttProject', PASTE: 'Pasted rows',
  BINARY: 'This file is in a binary format (.mpp, .xlsx…): save the planning as XML from MS Project, or as CSV from Excel, then import that file.',
  EMPTY: 'The file is empty.', NO_DATES: 'No dated task was found: check the Task, Start and Finish (or Duration) columns.', XML: 'The XML file cannot be read.',
  milestone: 'milestone', resource: 'Resource',
};

/* ------------------------------------------------------------------ types */

type Delivery = { id: string; label: string; date: string; decision: 'PENDING' | 'ACCEPTED' | 'REJECTED'; delivered: boolean };
type PlanTask = { id: string; level: number; name: string; start: string; end: string; progress: number | null; milestone: boolean; resource: string | null; predecessors: string | null };
type GanttData = { from: string; to: string; today: string; canImport: boolean;
  contracts: { id: string; number: number; title: string; status: string; start: string; end: string; provider_name: string; client_name: string; site_name: string | null; deliveries: Delivery[] }[];
  programmes: { id: string; title: string; start: string; end: string; site_name: string; provider_name: string; client_name: string; passages: number; accepted: number }[];
  maintenance: { id: string; number: number; title: string; status: string; start: string; end: string; site_name: string; provider_name: string; client_name: string }[];
  tenders: { id: string; number: number; title: string; status: string; start: string; end: string; awarded: string | null }[];
  plans: { id: string; title: string; source: string | null; format: string; created_at: string; contract_id: string | null; organization_id: string; owner_name: string; created_by_name: string; site_name: string | null; contract_number: number | null; tasks: PlanTask[] }[] };
type Tone = 'petrol' | 'ok' | 'warn' | 'bad' | 'info' | 'muted' | 'plan' | 'proposed';
type BarDef = { start: string; end: string; tone: Tone; label: string; progress?: number | null; milestone?: boolean; onOpen?: () => void };
type RowDef = { key: string; label: string; meta?: string; level: number; bars: BarDef[] };
type GroupDef = { key: string; kind: 'tenders' | 'contracts' | 'programmes' | 'maintenance' | 'plans'; label: string; meta?: string; rows: RowDef[]; planId?: string; removable?: boolean };
type Zoom = 'week' | 'month' | 'quarter';
const ZOOM: Record<Zoom, { dayW: number; span: number }> = { week: { dayW: 30, span: 42 }, month: { dayW: 11, span: 120 }, quarter: { dayW: 4, span: 364 } };
const loc = (lang: Lang) => lang === 'fr' ? 'fr-FR' : 'en-GB';

/** The rows of the chart, from what the server returned. */
function build(d: GanttData, org: Org, t: T, lang: Lang, open: { intervention: (id: string) => void; contract: (id: string) => void; tender?: (id: string) => void }): GroupDef[] {
  const client = org.kind === 'CLIENT', today = d.today;
  const deliveryTone = (x: Delivery): Tone => x.decision === 'ACCEPTED' ? 'ok' : x.decision === 'REJECTED' ? 'bad' : x.delivered ? 'warn' : x.date < today ? 'bad' : 'muted';
  const statusTone = (s: string): Tone => s === 'ACCEPTED' ? 'ok' : s === 'UNDER_REVIEW' || s === 'QUOTE_SUBMITTED' ? 'warn' : s === 'REWORK' || s === 'QUOTE_REFUSED' ? 'bad' : ['ASSIGNED', 'IN_PROGRESS'].includes(s) ? 'info' : 'muted';
  const groups: GroupDef[] = [];
  if (d.tenders.length) groups.push({ key: 'tenders', kind: 'tenders', label: t.tenders, rows: d.tenders.map(x => ({ key: x.id, level: 0, label: `${tenderRef(x.number)} · ${x.title}`,
    meta: x.status === 'CLOSED' ? t.CLOSED_T : t[x.status as 'DRAFT'] ?? x.status,
    bars: [{ start: x.start, end: x.end, tone: 'warn', label: t.consultation, onOpen: open.tender ? () => open.tender!(x.id) : undefined },
      ...(x.awarded ? [{ start: x.awarded, end: x.awarded, tone: 'ok' as Tone, label: t.awarded, milestone: true }] : [{ start: x.end, end: x.end, tone: 'warn' as Tone, label: t.deadline, milestone: true }])] })) });
  if (d.contracts.length) groups.push({ key: 'contracts', kind: 'contracts', label: t.contracts, rows: d.contracts.map(x => {
    const accepted = x.deliveries.filter(y => y.decision === 'ACCEPTED').length;
    return { key: x.id, level: 0, label: `${contractRef(x.number)} · ${x.title}`, meta: [client ? x.provider_name : x.client_name, t[x.status as 'ACTIVE'] ?? x.status].join(' · '),
      bars: [{ start: x.start, end: x.end, tone: x.status === 'PROPOSED' ? 'proposed' : x.status === 'CLOSED' ? 'ok' : 'petrol', label: `${accepted}/${x.deliveries.length} ${t.services}`,
        progress: x.deliveries.length ? (accepted / x.deliveries.length) * 100 : 0, onOpen: () => open.contract(x.id) },
        ...x.deliveries.map(y => ({ start: y.date, end: y.date, tone: deliveryTone(y), label: y.label, milestone: true, onOpen: () => open.contract(x.id) }))] };
  }) });
  if (d.programmes.length) groups.push({ key: 'programmes', kind: 'programmes', label: t.programmes, rows: d.programmes.map(x => ({ key: x.id, level: 0, label: x.title,
    meta: [x.site_name, client ? x.provider_name : x.client_name, fill(t.passages, { a: x.accepted, n: x.passages })].join(' · '),
    bars: [{ start: x.start, end: x.end, tone: 'info', label: fill(t.passages, { a: x.accepted, n: x.passages }), progress: x.passages ? (x.accepted / x.passages) * 100 : 0 }] })) });
  if (d.maintenance.length) groups.push({ key: 'maintenance', kind: 'maintenance', label: t.maintenance, rows: d.maintenance.map(x => ({ key: x.id, level: 0, label: `${interventionRef(x.number)} · ${x.title}`,
    meta: [x.site_name, client ? x.provider_name : x.client_name].join(' · '), bars: [{ start: x.start, end: x.end, tone: statusTone(x.status), label: x.title, onOpen: () => open.intervention(x.id) }] })) });
  for (const p of d.plans) groups.push({ key: 'plan:' + p.id, kind: 'plans', planId: p.id, removable: d.canImport && p.organization_id === org.id, label: p.title,
    meta: [p.source ? fill(t.importedFrom, { s: p.source, n: p.created_by_name, d: dateText(p.created_at, lang) }) : fill(t.importedBy, { n: p.created_by_name, d: dateText(p.created_at, lang) }),
      p.contract_number ? fill(t.linkedTo, { c: contractRef(p.contract_number) }) : '', p.organization_id !== org.id ? p.owner_name : ''].filter(Boolean).join(' · '),
    rows: p.tasks.map(x => ({ key: x.id, level: x.level, label: x.name, meta: [x.resource, x.milestone ? t.milestone : ''].filter(Boolean).join(' · ') || undefined,
      bars: [{ start: x.start, end: x.end, tone: 'plan', label: x.name, progress: x.progress, milestone: x.milestone }] })) });
  return groups;
}

/* ================================================================ the view */

export function GanttView({ org, lang, ctx, switcher, onOpen, onOpenContract, onOpenTender }: { org: Org; lang: Lang; ctx: Ctx; switcher?: React.ReactNode;
  onOpen: (id: string) => void; onOpenContract: (id: string) => void; onOpenTender?: (id: string) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [zoom, setZoom] = useState<Zoom>('month');
  const [from, setFrom] = useState(() => addDays(todayKey(), -Math.round(ZOOM.month.span * 0.2)));
  const { dayW, span } = ZOOM[zoom], to = addDays(from, span - 1);
  const [data, setData] = useState<GanttData | null>(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  const [hidden, setHidden] = useState<Record<string, boolean>>({}), [collapsed, setCollapsed] = useState<Record<string, boolean>>({}), [table, setTable] = useState(false);
  const [importing, setImporting] = useState(false), [notice, setNotice] = useState(''), [error, setError] = useState('');
  useEffect(() => { let a = true; setFailed(false); api(`gantt?from=${from}&to=${to}`, undefined, org.id).then(r => { if (a) setData(r); }).catch(() => { if (a) setFailed(true); }); return () => { a = false; }; }, [org.id, from, to, attempt]);
  const groups = useMemo(() => data ? build(data, org, t, lang, { intervention: onOpen, contract: onOpenContract, tender: onOpenTender }) : [], [data, lang]);
  const kinds = ([['tenders', t.tenders], ['contracts', t.contracts], ['programmes', t.programmes], ['maintenance', t.maintenance], ['plans', t.plans]] as const).filter(([k]) => groups.some(g => g.kind === k));
  const shown = groups.filter(g => !hidden[g.kind]);
  const setScale = (z: Zoom) => { const centre = addDays(from, Math.round(span / 2)); setZoom(z); setFrom(addDays(centre, -Math.round(ZOOM[z].span / 2))); };
  const archive = (id: string) => { setError(''); api(`plans/${id}/archive`, {}, org.id).then(() => { setNotice(t.removed); setAttempt(n => n + 1); }).catch(e => setError(say(e, lang))); };
  return <section className="planning gantt-page">
    <PageHead title={t.title} subtitle={ctx.subtitle}
      cells={[{ label: t.period, value: `${dateText(from, lang)} – ${dateText(to, lang)}` }, { label: t.lines, value: data ? String(shown.reduce((n, g) => n + g.rows.length, 0)) : '–' }]}
      actions={data?.canImport ? <button className="secondary" onClick={() => { setImporting(true); setNotice(''); }}>{t.importBtn}</button> : undefined} />
    <div className="toolbar gantt-toolbar">
      {switcher}
      <div className="toolbar-actions">
        <div className="segmented" role="group" aria-label={t.zoom}>{(['week', 'month', 'quarter'] as Zoom[]).map(z => <button key={z} type="button" aria-pressed={zoom === z} onClick={() => setScale(z)}>{z === 'week' ? t.weeks : z === 'month' ? t.months : t.quarter}</button>)}</div>
        <button className="secondary icon-only" aria-label={t.prev} onClick={() => setFrom(f => addDays(f, -Math.round(span / 3)))}><BackIcon /></button>
        <button className="secondary" onClick={() => setFrom(addDays(todayKey(), -Math.round(span * 0.2)))}>{t.today}</button>
        <button className="secondary icon-only" aria-label={t.next} onClick={() => setFrom(f => addDays(f, Math.round(span / 3)))}><ChevronIcon /></button>
        <button className="link-button" aria-pressed={table} onClick={() => setTable(v => !v)}>{table ? t.asChart : t.asTable}</button>
      </div>
    </div>
    {notice && <Alert kind="success">{notice}</Alert>}
    {error && <Alert>{error}</Alert>}
    {importing && data && <ImportPanel org={org} lang={lang} contracts={data.contracts} onCancel={() => setImporting(false)} onDone={n => { setImporting(false); setNotice(fill(t.imported, { n })); setAttempt(x => x + 1); }} />}
    {kinds.length > 1 && <div className="gantt-filters" role="group" aria-label={t.show}>{kinds.map(([k, label]) => <label key={k} className="chip-check"><input type="checkbox" checked={!hidden[k]} onChange={e => setHidden(h => ({ ...h, [k]: !e.target.checked }))} /><span>{label}</span></label>)}</div>}
    {failed ? <Alert retry={() => setAttempt(n => n + 1)} retryLabel={t.retry}>{t.loadError}</Alert> : !data ? <Skeleton label={t.loading} rows={5} />
      : !shown.some(g => g.rows.length) ? <div className="sheet"><Empty title={t.empty}>{t.emptyText}</Empty></div>
      : table ? <GanttTable groups={shown} lang={lang} t={t} />
      : <GanttChart groups={shown} from={from} days={span} dayW={dayW} today={data.today} lang={lang} t={t} collapsed={collapsed} setCollapsed={setCollapsed} onArchive={archive} />}
  </section>;
}

function GanttChart({ groups, from, days, dayW, today, lang, t, collapsed, setCollapsed, onArchive }: { groups: GroupDef[]; from: string; days: number; dayW: number; today: string; lang: Lang; t: T;
  collapsed: Record<string, boolean>; setCollapsed: (f: (c: Record<string, boolean>) => Record<string, boolean>) => void; onArchive: (id: string) => void }) {
  const width = days * dayW;
  const dates = useMemo(() => Array.from({ length: days }, (_, i) => addDays(from, i)), [from, days]);
  const months: { i: number; n: number; label: string }[] = [];
  dates.forEach((d, i) => { if (i === 0 || d.endsWith('-01')) months.push({ i, n: 0, label: new Date(d + 'T12:00:00Z').toLocaleDateString(loc(lang), { month: dayW < 6 ? 'short' : 'long', year: 'numeric', timeZone: 'UTC' }) }); months[months.length - 1]!.n++; });
  const firstMonday = dates.findIndex(d => new Date(d + 'T12:00:00Z').getUTCDay() === 1);
  const offset = ((firstMonday < 0 ? 0 : firstMonday) * dayW) % (7 * dayW);
  const background = [dayW >= 20 ? `repeating-linear-gradient(to right, transparent 0 ${5 * dayW}px, rgb(14 74 92 / .045) ${5 * dayW}px ${7 * dayW}px)` : '',
    `linear-gradient(to right, var(--rule-2) 1px, transparent 1px)`].filter(Boolean).join(',');
  const trackStyle: React.CSSProperties = { width, backgroundImage: background, backgroundSize: dayW >= 20 ? `${7 * dayW}px 100%, ${7 * dayW}px 100%` : `${7 * dayW}px 100%`, backgroundPosition: `${offset}px 0` };
  const ti = daysBetween(from, today);
  const dayLabel = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString(loc(lang), { weekday: 'narrow', timeZone: 'UTC' });
  return <div className="gantt sheet">
    <div className="gantt-scroll" role="region" aria-label={t.gantt} tabIndex={0}>
      <div className="gantt-grid" style={{ width: `calc(var(--gantt-label) + ${width}px)` }}>
        <div className="gantt-head">
          <div className="gantt-corner">{t.task}</div>
          <div className="gantt-scale" style={{ width }}>
            <div className="gantt-months">{months.map(m => <span key={m.i} style={{ left: m.i * dayW, width: m.n * dayW }}>{m.n * dayW > 40 ? m.label : ''}</span>)}</div>
            <div className="gantt-days">{dates.map((d, i) => {
              const monday = new Date(d + 'T12:00:00Z').getUTCDay() === 1;
              if (dayW >= 20) return <span key={d} className={d === today ? 'is-today' : undefined} style={{ left: i * dayW, width: dayW }}><b>{Number(d.slice(8))}</b><i>{dayLabel(d)}</i></span>;
              return monday ? <span key={d} className={ti >= i && ti < i + 7 ? 'is-today' : undefined} style={{ left: i * dayW, width: 7 * dayW }}>{dayW >= 8 ? Number(d.slice(8)) : ''}</span> : null;
            })}</div>
          </div>
        </div>
        {groups.map(g => <div className="gantt-group" key={g.key}>
          <div className="gantt-row is-group">
            <div className="gantt-label">
              <button type="button" className="gantt-toggle" aria-expanded={!collapsed[g.key]} onClick={() => setCollapsed(c => ({ ...c, [g.key]: !c[g.key] }))}>
                {collapsed[g.key] ? <DownIcon /> : <UpIcon />}<strong title={g.label}>{g.label}</strong><span className="gantt-count">{g.rows.length}</span></button>
              {g.meta && <span className="gantt-meta" title={g.meta}>{g.meta}</span>}
              {g.removable && g.planId && <button type="button" className="icon-button danger-icon gantt-remove" aria-label={`${t.remove} : ${g.label}`} title={t.remove} onClick={() => onArchive(g.planId!)}><TrashIcon /></button>}
            </div>
            <div className="gantt-track is-group" style={trackStyle} />
          </div>
          {!collapsed[g.key] && g.rows.map(r => <div className="gantt-row" key={r.key}>
            <div className="gantt-label" style={{ paddingLeft: 14 + r.level * 14 }}><span className="gantt-name" title={r.label}>{r.label}</span>{r.meta && <span className="gantt-meta" title={r.meta}>{r.meta}</span>}</div>
            <div className="gantt-track" style={trackStyle}>{r.bars.map((b, i) => <Bar key={i} b={b} from={from} days={days} dayW={dayW} lang={lang} t={t} />)}</div>
          </div>)}
        </div>)}
        {ti >= 0 && ti < days && <span className="gantt-today" style={{ left: `calc(var(--gantt-label) + ${ti * dayW + dayW / 2}px)` }} aria-hidden="true" />}
      </div>
    </div>
  </div>;
}

function Bar({ b, from, days, dayW, lang, t }: { b: BarDef; from: string; days: number; dayW: number; lang: Lang; t: T }) {
  const a = daysBetween(from, b.start), z = daysBetween(from, b.end);
  if (z < 0 || a > days - 1) return null;
  const when = b.start === b.end ? dateText(b.start, lang) : `${dateText(b.start, lang)} – ${dateText(b.end, lang)}`;
  const aria = [b.label, when, b.progress !== undefined && b.progress !== null ? `${t.progress} ${Math.round(b.progress)} %` : ''].filter(Boolean).join(' · ');
  if (b.milestone) {
    const style = { left: a * dayW + dayW / 2 };
    return b.onOpen ? <button type="button" className={`g-milestone tone-${b.tone}`} style={style} title={aria} aria-label={aria} onClick={b.onOpen} />
      : <span className={`g-milestone tone-${b.tone}`} style={style} title={aria} role="img" aria-label={aria} />;
  }
  const s = Math.max(0, a), e = Math.min(days - 1, z), width = Math.max((e - s + 1) * dayW, 5);
  const cls = `g-bar tone-${b.tone}${a < 0 ? ' cut-l' : ''}${z > days - 1 ? ' cut-r' : ''}`;
  const inner = <>{b.progress ? <span className="g-fill" style={{ width: `${Math.min(100, b.progress)}%` }} /> : null}{width > 70 && <span className="g-text">{b.label}</span>}</>;
  return b.onOpen ? <button type="button" className={cls} style={{ left: s * dayW, width }} title={aria} aria-label={aria} onClick={b.onOpen}>{inner}</button>
    : <span className={cls} style={{ left: s * dayW, width }} title={aria} role="img" aria-label={aria}>{inner}</span>;
}

function GanttTable({ groups, lang, t }: { groups: GroupDef[]; lang: Lang; t: T }) {
  return <div className="table-card"><table className="audit-table gantt-table">
    <thead><tr><th scope="col" className="col-group">{t.group}</th><th scope="col">{t.task}</th><th scope="col" className="col-date">{t.start}</th><th scope="col" className="col-date">{t.end}</th><th scope="col" className="col-pct">{t.progress}</th></tr></thead>
    <tbody>{groups.flatMap(g => g.rows.map(r => { const b = r.bars[0]; return <tr key={g.key + r.key}>
      <td data-label={t.group}>{g.label}</td>
      <td data-label={t.task} className="work-main-cell"><span className="work-title is-wrapping" style={{ paddingLeft: r.level * 12 }}>{r.label}</span>{r.meta && <span className="work-meta">{r.meta}</span>}</td>
      <td data-label={t.start}>{b ? dateText(b.start, lang) : '—'}</td><td data-label={t.end}>{b ? dateText(b.end, lang) : '—'}</td>
      <td data-label={t.progress}>{b?.progress !== undefined && b?.progress !== null ? `${Math.round(b.progress)} %` : '—'}</td>
    </tr>; }))}</tbody></table></div>;
}

/* ------------------------------------------------------------- importing */

const SAMPLE = `EDT;Nom de la tâche;Durée;Début;Fin;Prédécesseurs;Noms ressources;% achevé
1;Arrêt technique annuel de l'usine;12 jours;lun. 07/12/26;ven. 18/12/26;;;0%
1.1;Arrêt et consignation des lignes L1 à L3;1 jour;lun. 07/12/26;lun. 07/12/26;;MécaTech Industrie;0%
1.2;Vidange et nettoyage des fours tunnel;3 jours;mar. 08/12/26;jeu. 10/12/26;1.1;Bleu Azur Nettoyage Industriel;0%
1.3;Révision du groupe frigorifique;4 jours;mar. 08/12/26;ven. 11/12/26;1.1;Arctica Froid & Climatisation;0%
1.4;Remplacement des roulements des convoyeurs;3 jours;ven. 11/12/26;mar. 15/12/26;1.2;MécaTech Industrie;0%
1.5;Désinfection complète des zones de production;2 jours;mer. 16/12/26;jeu. 17/12/26;1.4;Bleu Azur Nettoyage Industriel;0%
1.6;Contrôle qualité et redémarrage;1 jour;ven. 18/12/26;ven. 18/12/26;1.5;Service qualité AFISA;0%`;

function ImportPanel({ org, lang, contracts, onCancel, onDone }: { org: Org; lang: Lang; contracts: GanttData['contracts']; onCancel: () => void; onDone: (n: number) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [result, setResult] = useState<ImportResult | null>(null), [file, setFile] = useState(''), [title, setTitle] = useState(''), [contract, setContract] = useState('');
  const [paste, setPaste] = useState(''), [mode, setMode] = useState<'file' | 'paste'>('file'), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const take = (r: ImportResult, name: string) => { setResult(r); setFile(name); setTitle(r.title); setError(''); };
  const span = result?.tasks.length ? [result.tasks.reduce((m, x) => x.start < m ? x.start : m, result.tasks[0]!.start), result.tasks.reduce((m, x) => x.end > m ? x.end : m, result.tasks[0]!.end)] : null;
  return <div className="sheet import-panel">
    <div className="sheet-head"><h2>{t.imTitle}</h2><div className="sheet-actions"><button type="button" className="icon-button" aria-label={t.imCancel} onClick={onCancel}><CloseIcon /></button></div></div>
    <div className="sheet-body">
      <p className="sheet-intro">{t.imIntro}</p>
      <div className="toolbar-actions import-modes">
        <div className="segmented" role="group" aria-label={t.imFormat}>
          <button type="button" aria-pressed={mode === 'file'} onClick={() => setMode('file')}>{t.imFile}</button>
          <button type="button" aria-pressed={mode === 'paste'} onClick={() => setMode('paste')}>{t.imPaste}</button>
        </div>
        <button type="button" className="link-button" onClick={() => take(parseDelimited(SAMPLE, 'CSV', lang === 'fr' ? 'Arrêt technique annuel — décembre 2026' : 'Annual plant shutdown — December 2026'), 'Arret_technique_2026.csv')}>{t.imSample}</button>
      </div>
      {mode === 'file'
        ? <label className="upload secondary import-file"><input type="file" accept=".xml,.gan,.csv,.txt,.tsv,.mpp,.xlsx,.xls" onChange={e => {
            const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
            f.text().then(text => take(parsePlanFile(f.name, text.slice(0, 5_000_000)), f.name)).catch(() => setError(t.XML));
          }} />{t.imFile} (.xml, .gan, .csv)</label>
        : <div className="import-paste"><label>{t.imPaste}<textarea rows={6} value={paste} placeholder={t.imPasteHint} onChange={e => setPaste(e.target.value)} /></label>
            <button type="button" className="secondary small" disabled={!paste.trim()} onClick={() => take(parseDelimited(paste, 'PASTE', lang === 'fr' ? 'Planning collé' : 'Pasted planning'), '')}>{t.imRead}</button></div>}
      {error && <Alert>{error}</Alert>}
      {result && (result.error ? <Alert>{t[result.error]}</Alert> : <div className="import-preview">
        <p className="sheet-note"><span className="state state-blue">{t[result.format]}</span>{fill(t.imFound, { n: result.tasks.length, a: dateText(span![0], lang), b: dateText(span![1], lang) })}
          {result.skipped > 0 && <span className="muted"> · {fill(t.imSkipped, { n: result.skipped })}</span>}</p>
        <div className="table-card"><table className="audit-table import-table">
          <thead><tr><th scope="col">{t.task}</th><th scope="col" className="col-date">{t.start}</th><th scope="col" className="col-date">{t.end}</th><th scope="col" className="col-pct">%</th><th scope="col" className="col-res">{t.resource}</th></tr></thead>
          <tbody>{result.tasks.slice(0, 14).map((x, i) => <tr key={i}>
            <td data-label={t.task}><span style={{ paddingLeft: x.level * 14 }} className={x.level === 0 ? 'import-top' : undefined}>{x.name}{x.milestone ? ` ◆` : ''}</span></td>
            <td data-label={t.start}>{dateText(x.start, lang)}</td><td data-label={t.end}>{dateText(x.end, lang)}</td><td data-label="%">{x.progress ?? '—'}</td><td data-label={t.resource}>{x.resource ?? '—'}</td>
          </tr>)}</tbody></table></div>
        {result.tasks.length > 14 && <p className="muted">{fill(t.more, { n: result.tasks.length - 14 })}</p>}
        <div className="form-row">
          <label>{t.imName}<input value={title} maxLength={200} onChange={e => setTitle(e.target.value)} /></label>
          <label>{t.imContract}<select value={contract} onChange={e => setContract(e.target.value)}><option value="">{t.imNone}</option>{contracts.map(c => <option key={c.id} value={c.id}>{contractRef(c.number)} · {c.title}</option>)}</select></label>
        </div>
        <div className="toolbar-actions"><button type="button" className="secondary" disabled={busy} onClick={onCancel}>{t.imCancel}</button>
          <button type="button" className="primary" disabled={busy || !title.trim()} onClick={() => {
            setBusy(true); setError('');
            api('plans', { title, source: file || null, format: result.format, contractId: contract || null, tasks: result.tasks }, org.id)
              .then(r => onDone(r.tasks)).catch(e => setError(say(e, lang))).finally(() => setBusy(false));
          }}>{fill(t.imConfirm, { n: result.tasks.length })}</button></div>
      </div>)}
    </div>
  </div>;
}
