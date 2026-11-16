/**
 * Reading an earlier Gantt planning in the browser: MS Project XML (MSPDI), GanttProject (.gan), CSV exported from Excel or
 * MS Project, or cells pasted from a spreadsheet. Nothing is sent before the person checks the preview.
 */

export type ImportedTask = { name: string; start: string; end: string; level: number; progress: number | null; milestone: boolean; resource: string | null; predecessors: string | null };
export type PlanFormat = 'CSV' | 'MSPROJECT_XML' | 'GANTTPROJECT' | 'PASTE';
export type ImportResult = { format: PlanFormat; title: string; tasks: ImportedTask[]; skipped: number; error?: 'BINARY' | 'EMPTY' | 'NO_DATES' | 'XML' };

const iso = (y: number, m: number, d: number) => {
  const t = Date.UTC(y, m - 1, d), x = new Date(t);
  return x.getUTCFullYear() === y && x.getUTCMonth() === m - 1 && x.getUTCDate() === d ? x.toISOString().slice(0, 10) : null;
};
export const addDays = (date: string, n: number) => new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const addWorkdays = (date: string, n: number) => { let d = date; while (n > 0) { d = addDays(d, 1); const w = new Date(d + 'T12:00:00Z').getUTCDay(); if (w !== 0 && w !== 6) n--; } return d; };
const MONTHS: Record<string, number> = { jan: 1, janv: 1, janvier: 1, january: 1, feb: 2, fev: 2, fevr: 2, fevrier: 2, february: 2, mar: 3, mars: 3, march: 3, apr: 4, avr: 4, avril: 4, april: 4,
  may: 5, mai: 5, jun: 6, juin: 6, june: 6, jul: 7, juil: 7, juillet: 7, july: 7, aug: 8, aou: 8, aout: 8, august: 8, sep: 9, sept: 9, septembre: 9, september: 9,
  oct: 10, octobre: 10, october: 10, nov: 11, novembre: 11, november: 11, dec: 12, decembre: 12, december: 12 };
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** A date as written in a planning: 2026-11-16, 16/11/2026, 16/11/26, "lun. 16/11/26", 16 nov. 2026, or an Excel serial number. */
export function parseDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = fold(String(raw)).trim().replace(/^(lun|mar|mer|jeu|ven|sam|dim|mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?\s+/, '');
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return iso(+m[1]!, +m[2]!, +m[3]!);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) { const y = +m[3]! < 100 ? 2000 + +m[3]! : +m[3]!; return +m[1]! > 12 || +m[2]! <= 12 ? iso(y, +m[2]!, +m[1]!) : iso(y, +m[1]!, +m[2]!); }
  m = s.match(/^(\d{1,2})(?:er)?\s+([a-z]+)\.?\s+(\d{4})/);
  if (m && MONTHS[m[2]!]) return iso(+m[3]!, MONTHS[m[2]!]!, +m[1]!);
  m = s.match(/^([a-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (m && MONTHS[m[1]!]) return iso(+m[3]!, MONTHS[m[1]!]!, +m[2]!);
  if (/^\d{5}(\.\d+)?$/.test(s)) { const n = Math.floor(Number(s)); if (n > 20000 && n < 80000) return addDays('1899-12-30', n); }
  return null;
}
/** A duration in days: "5 jours", "5j", "5 d", "2 sem", "1 mois", "0". */
export function parseDuration(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const s = fold(String(raw)).replace(',', '.').trim(), m = s.match(/^(\d+(?:\.\d+)?)\s*([a-z]*)\??$/);
  if (!m) return null;
  const n = Number(m[1]), u = m[2] ?? '';
  return Math.round(/^(sem|w)/.test(u) ? n * 7 : /^(mois|mo|mon)/.test(u) ? n * 30 : /^(h|hr|heure)/.test(u) ? n / 8 : n);
}
const parsePercent = (raw: string | null | undefined) => {
  if (raw === null || raw === undefined || String(raw).trim() === '') return null;
  const s = String(raw).replace(',', '.').replace('%', '').trim(), n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n <= 1 && s.includes('.') ? n * 100 : n)));
};
const truthy = (raw: string | null | undefined) => /^(oui|yes|true|vrai|1|x)$/i.test(String(raw ?? '').trim());

/* ------------------------------------------------------------- CSV and cells */

function splitRows(text: string, delimiter: string) {
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false; } else cell += ch; continue; }
    if (ch === '"' && !cell.trim()) { quoted = true; cell = ''; continue; }
    if (ch === delimiter) { row.push(cell); cell = ''; continue; }
    if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; continue; }
    cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}
const COLUMNS: Record<'name' | 'start' | 'end' | 'duration' | 'progress' | 'resource' | 'predecessors' | 'level' | 'wbs' | 'milestone', RegExp> = {
  name: /^(nom( de la)? tache|tache|nom|libelle|designation|activite|intitule|task( name)?|name|activity|description)$/,
  start: /^(date de )?debut( prevu)?$|^start( date)?$|^begin$|^date debut$/,
  end: /^(date de )?fin( prevue)?$|^finish( date)?$|^end( date)?$|^date fin$|^echeance$/,
  duration: /^duree$|^duration$|^jours$|^nb jours$/,
  progress: /^%|achev|avancement|progress|complete|realise/,
  resource: /ressource|responsable|assign|resource|owner|intervenant|prestataire/,
  predecessors: /^predecesseurs?$|^predecessors?$|^dependances?$/,
  level: /niveau( hierarchique)?|outline level|^level$/,
  wbs: /^(wbs|edt|n°|no|num|numero|id)$/,
  milestone: /^jalon$|^milestone$/,
};
function mapHeader(cells: string[]) {
  const map: Partial<Record<keyof typeof COLUMNS, number>> = {};
  cells.forEach((c, i) => {
    const h = fold(c).replace(/[^a-z0-9%° ]+/g, ' ').replace(/\s+/g, ' ').trim();
    for (const key of Object.keys(COLUMNS) as (keyof typeof COLUMNS)[]) if (map[key] === undefined && COLUMNS[key].test(h)) { map[key] = i; break; }
  });
  return map;
}
function fromRows(rows: string[][], format: PlanFormat, title: string): ImportResult {
  if (!rows.length) return { format, title, tasks: [], skipped: 0, error: 'EMPTY' };
  let map = mapHeader(rows[0]!), body = rows.slice(1);
  if (map.name === undefined || (map.start === undefined && map.end === undefined)) {
    // No header: a name, then dates, as in many quick plannings.
    const first = rows[0]!, dates = first.map((c, i) => parseDate(c) ? i : -1).filter(i => i >= 0);
    if (dates.length < 1) return { format, title, tasks: [], skipped: rows.length, error: 'NO_DATES' };
    map = { name: first.findIndex((c, i) => !dates.includes(i) && c.trim() && !parseDate(c)), start: dates[0], end: dates[1] };
    body = rows;
  }
  const tasks: ImportedTask[] = []; let skipped = 0;
  for (const r of body) {
    const cell = (k: keyof typeof COLUMNS) => map[k] === undefined ? '' : (r[map[k]!] ?? '').trim();
    const rawName = map.name === undefined || map.name < 0 ? '' : (r[map.name] ?? '');
    const name = rawName.trim();
    const start = parseDate(cell('start')), duration = parseDuration(cell('duration'));
    let end = parseDate(cell('end'));
    if (!name || (!start && !end)) { skipped++; continue; }
    const s = start ?? end!;
    if (!end) end = duration !== null && duration > 0 ? addDays(s, Math.max(0, Math.ceil(duration) - 1)) : s;
    if (end < s) end = s;
    const wbs = cell('wbs'), lvl = cell('level');
    const level = lvl && /^\d+$/.test(lvl) ? Math.max(0, +lvl - 1) : /^\d+(\.\d+)+$/.test(wbs) ? wbs.split('.').length - 1 : Math.min(9, Math.floor((rawName.length - rawName.trimStart().length) / 2));
    tasks.push({ name: name.slice(0, 300), start: s, end, level: Math.min(9, level), progress: parsePercent(cell('progress')),
      milestone: truthy(cell('milestone')) || duration === 0, resource: cell('resource').slice(0, 200) || null, predecessors: cell('predecessors').slice(0, 200) || null });
  }
  return { format, title, tasks: tasks.slice(0, 1000), skipped, error: tasks.length ? undefined : 'NO_DATES' };
}
export function parseDelimited(text: string, format: 'CSV' | 'PASTE', title: string): ImportResult {
  const head = text.split(/\r?\n/).find(l => l.trim()) ?? '';
  const delimiter = format === 'PASTE' || head.split('\t').length > 2 ? '\t' : head.split(';').length >= head.split(',').length ? ';' : ',';
  return fromRows(splitRows(text.replace(/^﻿/, ''), delimiter), format, title);
}

/* ------------------------------------------------------------------ XML */

const child = (el: Element, name: string) => Array.from(el.children).find(c => c.localName === name);
const childText = (el: Element, name: string) => child(el, name)?.textContent?.trim() ?? '';

function msProject(doc: Document, fallback: string): ImportResult {
  const root = doc.documentElement, title = childText(root, 'Title') || childText(root, 'Name') || fallback;
  const resources = new Map<string, string>(), byTask = new Map<string, string[]>();
  for (const r of Array.from(doc.getElementsByTagNameNS('*', 'Resource'))) { const uid = childText(r, 'UID'), name = childText(r, 'Name'); if (uid && name) resources.set(uid, name); }
  for (const a of Array.from(doc.getElementsByTagNameNS('*', 'Assignment'))) {
    const t = childText(a, 'TaskUID'), r = resources.get(childText(a, 'ResourceUID'));
    if (t && r) byTask.set(t, [...(byTask.get(t) ?? []), r]);
  }
  const tasks: ImportedTask[] = []; let skipped = 0;
  for (const el of Array.from(doc.getElementsByTagNameNS('*', 'Task'))) {
    const uid = childText(el, 'UID'), level = Number(childText(el, 'OutlineLevel') || '1');
    if (uid === '0' || childText(el, 'IsNull') === '1' || level < 1) continue;
    const name = childText(el, 'Name'), start = parseDate(childText(el, 'Start')), end = parseDate(childText(el, 'Finish'));
    if (!name || !start) { skipped++; continue; }
    const preds = Array.from(el.children).filter(c => c.localName === 'PredecessorLink').map(p => childText(p, 'PredecessorUID')).filter(Boolean);
    tasks.push({ name: name.slice(0, 300), start, end: end && end >= start ? end : start, level: Math.min(9, level - 1), progress: parsePercent(childText(el, 'PercentComplete')),
      milestone: childText(el, 'Milestone') === '1', resource: (byTask.get(uid) ?? []).join(', ').slice(0, 200) || null, predecessors: preds.join(', ').slice(0, 200) || null });
  }
  return { format: 'MSPROJECT_XML', title, tasks: tasks.slice(0, 1000), skipped, error: tasks.length ? undefined : 'NO_DATES' };
}

function ganttProject(doc: Document, fallback: string): ImportResult {
  const root = doc.documentElement, title = root.getAttribute('name') || fallback;
  const resources = new Map<string, string>(), byTask = new Map<string, string[]>(), preds = new Map<string, string[]>();
  for (const r of Array.from(doc.getElementsByTagName('resource'))) resources.set(r.getAttribute('id') ?? '', r.getAttribute('name') ?? '');
  for (const a of Array.from(doc.getElementsByTagName('allocation'))) {
    const t = a.getAttribute('task-id') ?? '', r = resources.get(a.getAttribute('resource-id') ?? '');
    if (r) byTask.set(t, [...(byTask.get(t) ?? []), r]);
  }
  const tasks: ImportedTask[] = []; let skipped = 0;
  const names = new Map<string, string>();
  for (const el of Array.from(doc.getElementsByTagName('task'))) names.set(el.getAttribute('id') ?? '', el.getAttribute('name') ?? '');
  for (const el of Array.from(doc.getElementsByTagName('task'))) for (const d of Array.from(el.children).filter(c => c.localName === 'depend'))
    preds.set(d.getAttribute('id') ?? '', [...(preds.get(d.getAttribute('id') ?? '') ?? []), el.getAttribute('id') ?? '']);
  const walk = (parent: Element, level: number) => {
    for (const el of Array.from(parent.children).filter(c => c.localName === 'task')) {
      const id = el.getAttribute('id') ?? '', name = el.getAttribute('name') ?? '', start = parseDate(el.getAttribute('start'));
      const duration = Number(el.getAttribute('duration') ?? '0'), milestone = el.getAttribute('meeting') === 'true' || duration === 0;
      if (!name || !start) skipped++;
      else tasks.push({ name: name.slice(0, 300), start, end: milestone ? start : addWorkdays(start, Math.max(0, duration - 1)), level: Math.min(9, level),
        progress: parsePercent(el.getAttribute('complete')), milestone, resource: (byTask.get(id) ?? []).join(', ').slice(0, 200) || null,
        predecessors: (preds.get(id) ?? []).map(p => names.get(p) ?? p).join(', ').slice(0, 200) || null });
      walk(el, level + 1);
    }
  };
  const list = Array.from(root.children).find(c => c.localName === 'tasks');
  if (list) walk(list, 0);
  return { format: 'GANTTPROJECT', title, tasks: tasks.slice(0, 1000), skipped, error: tasks.length ? undefined : 'NO_DATES' };
}

/** The planning in a file, whatever its kind; binary files (.mpp, .xlsx) are refused with the format to export to. */
export function parsePlanFile(fileName: string, text: string): ImportResult {
  const title = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Planning importé';
  if (/\.(mpp|xlsx|xls|pdf|docx)$/i.test(fileName) || /^PK|^ÐÏ/.test(text.slice(0, 4))) return { format: 'CSV', title, tasks: [], skipped: 0, error: 'BINARY' };
  const head = text.slice(0, 2000);
  if (/^\s*(<\?xml|<Project|<project)/.test(head)) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) return { format: 'MSPROJECT_XML', title, tasks: [], skipped: 0, error: 'XML' };
    return doc.documentElement.localName === 'Project' ? msProject(doc, title) : ganttProject(doc, title);
  }
  return parseDelimited(text, 'CSV', title);
}
