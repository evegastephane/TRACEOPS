import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError } from './api';
import type { Lang } from './i18n';
import { AlertIcon, CheckIcon, CloseIcon, DownloadIcon, PlusIcon, ScanIcon, SearchIcon, TrashIcon } from './icons';
import { Alert, Empty, PageHead, Sheet, Skeleton } from './ui';
import { QrCode } from './qr';
import { dateText, fill, instantDay, interventionRef, say, todayKey, type Ctx, type Org } from './procurement-model';

/* ------------------------------------------------------------------ words */

const fr = {
  title: 'Présences', agentTitle: 'Pointage', intro: 'Les agents pointent leur arrivée et leur départ en scannant le QR code affiché sur le site, et déclarent leurs absences depuis leur téléphone. Chaque pointage arrive ici au moment où il est envoyé.',
  register: 'Registre', qr: 'QR codes', presentToday: 'Présents aujourd’hui', late: 'Retards', absences: 'Absences', hours: 'Heures pointées', period: 'Période', todayOpt: 'Aujourd’hui', d7: '7 jours', d30: '30 jours',
  site: 'Site', allSites: 'Tous les sites', search: 'Rechercher un agent', date: 'Date', agent: 'Agent', place: 'Site · point', arrival: 'Arrivée', departure: 'Départ', duration: 'Durée', mission: 'Mission', status: 'Statut',
  onTime: 'À l’heure', lateBy: 'Retard de {n} min', absent: 'Absent', onSite: 'Sur site', noDeparture: 'Départ non pointé', noMission: 'Hors mission planifiée', planned: 'prévue {a}–{b}',
  empty: 'Aucun pointage sur la période.', emptyText: 'Les pointages apparaissent dès qu’un agent scanne un QR code du site.', loading: 'Chargement…', retry: 'Réessayer', loadError: 'Impossible de charger les présences. Réessayez.',
  points: 'Points de pointage', pointsMeta: '{n} QR code(s) actif(s)', newPoint: 'Nouveau point de pointage', label: 'Nom du point', labelHint: 'ex. Entrée du personnel', zone: 'Lieu précis (facultatif)', wholeSite: 'Tout le site',
  create: 'Créer le QR code', cancel: 'Annuler', poster: 'Affiche à imprimer (PDF)', archive: 'Désactiver', archived: 'QR code désactivé.', created: 'QR code créé : imprimez l’affiche et placez-la sur le site.',
  scans: '{n} pointage(s) sur 7 jours', lastScan: 'dernier le {d}', never: 'jamais utilisé', qrHelp: 'Le QR code ouvre TRACEOPS sur le téléphone de l’agent ; une fois connecté, il choisit « J’arrive », « Je pars » ou « Je suis absent ». Seuls les agents des prestataires rattachés au site peuvent pointer.',
  noPoint: 'Aucun QR code pour le moment.', noPointText: 'Créez un point de pointage par entrée ou par zone, puis imprimez son affiche.', qrOf: 'QR code de pointage — {p}', address: 'Adresse encodée',
  // agent
  scanTitle: 'Pointer mon arrivée ou mon départ', step1: 'Ouvrez l’appareil photo de votre téléphone.', step2: 'Visez le QR code affiché sur le site.', step3: 'Touchez le lien, puis « J’arrive » ou « Je pars ».',
  scanInApp: 'Scanner avec TRACEOPS', todayCard: 'Aujourd’hui', nothingToday: 'Aucun pointage aujourd’hui.', upcoming: 'Mes prochaines missions', upcomingMeta: 'déclarez une absence si vous ne pouvez pas venir',
  declare: 'Je serai absent', declared: 'Absence déclarée', reason: 'Motif', details: 'Précision (facultatif)', send: 'Envoyer', absenceSent: 'Absence envoyée à votre responsable et au client.', noUpcoming: 'Aucune mission dans les 7 prochains jours.',
  history: 'Mes pointages', historyMeta: '30 derniers jours · tout ce que vous avez envoyé', reasons: ['Maladie', 'Raison familiale', 'Problème de transport', 'Autre'],
  lastSent: 'Dernier envoi', closeScanner: 'Fermer la caméra', camera: 'Placez le QR code dans le cadre.', cameraError: 'La caméra n’est pas accessible : utilisez l’appareil photo du téléphone.',
  // scan page
  scanPage: 'Pointage', now: 'Il est {h}', youAre: 'Vous êtes sur site depuis {h}.', notYet: 'Pas encore d’arrivée aujourd’hui sur ce site.', missionsToday: 'Vos missions ici aujourd’hui', noMissionToday: 'Aucune mission planifiée ici aujourd’hui : le pointage est enregistré quand même.',
  arrive: 'J’arrive', leave: 'Je pars', absentBtn: 'Je suis absent', confirmAbsent: 'Envoyer mon absence', inDone: 'Arrivée enregistrée à {h}', outDone: 'Départ enregistré à {h}', absentDone: 'Absence enregistrée à {h}',
  sentTo: 'Votre responsable et le client la voient dans leurs registres.', finish: 'Terminer', todayRecords: 'Vos pointages ici aujourd’hui', for: 'pour {p}',
  IN: 'Arrivée', OUT: 'Départ', ABSENT: 'Absence',
};
type T = typeof fr;
const en: T = {
  title: 'Attendance', agentTitle: 'Check-in', intro: 'Agents record their arrival and departure by scanning the QR code posted on the site, and declare absences from their phone. Each record arrives here as soon as it is sent.',
  register: 'Register', qr: 'QR codes', presentToday: 'Present today', late: 'Late arrivals', absences: 'Absences', hours: 'Hours recorded', period: 'Period', todayOpt: 'Today', d7: '7 days', d30: '30 days',
  site: 'Site', allSites: 'All sites', search: 'Search an agent', date: 'Date', agent: 'Agent', place: 'Site · point', arrival: 'Arrival', departure: 'Departure', duration: 'Duration', mission: 'Mission', status: 'Status',
  onTime: 'On time', lateBy: '{n} min late', absent: 'Absent', onSite: 'On site', noDeparture: 'No departure recorded', noMission: 'Outside a planned mission', planned: 'planned {a}–{b}',
  empty: 'No record in this period.', emptyText: 'Records appear as soon as an agent scans a QR code of the site.', loading: 'Loading…', retry: 'Try again', loadError: 'The attendance could not be loaded. Try again.',
  points: 'Check-in points', pointsMeta: '{n} active QR code(s)', newPoint: 'New check-in point', label: 'Point name', labelHint: 'e.g. Staff entrance', zone: 'Precise place (optional)', wholeSite: 'Whole site',
  create: 'Create the QR code', cancel: 'Cancel', poster: 'Printable poster (PDF)', archive: 'Deactivate', archived: 'QR code deactivated.', created: 'QR code created: print the poster and post it on the site.',
  scans: '{n} record(s) in 7 days', lastScan: 'last on {d}', never: 'never used', qrHelp: 'The QR code opens TRACEOPS on the agent’s phone; once signed in, the agent chooses “I am arriving”, “I am leaving” or “I am absent”. Only agents of providers linked to the site can check in.',
  noPoint: 'No QR code yet.', noPointText: 'Create a check-in point per entrance or area, then print its poster.', qrOf: 'Check-in QR code — {p}', address: 'Encoded address',
  scanTitle: 'Record my arrival or departure', step1: 'Open your phone’s camera.', step2: 'Aim at the QR code posted on the site.', step3: 'Tap the link, then “I am arriving” or “I am leaving”.',
  scanInApp: 'Scan with TRACEOPS', todayCard: 'Today', nothingToday: 'No record today.', upcoming: 'My next missions', upcomingMeta: 'declare an absence if you cannot come',
  declare: 'I will be absent', declared: 'Absence declared', reason: 'Reason', details: 'Details (optional)', send: 'Send', absenceSent: 'Absence sent to your manager and the client.', noUpcoming: 'No mission in the next 7 days.',
  history: 'My records', historyMeta: 'last 30 days · everything you sent', reasons: ['Illness', 'Family reason', 'Transport problem', 'Other'],
  lastSent: 'Last record', closeScanner: 'Close the camera', camera: 'Place the QR code in the frame.', cameraError: 'The camera is not available: use the phone’s camera app.',
  scanPage: 'Check-in', now: 'It is {h}', youAre: 'You have been on site since {h}.', notYet: 'No arrival on this site today yet.', missionsToday: 'Your missions here today', noMissionToday: 'No mission planned here today: the record is kept anyway.',
  arrive: 'I am arriving', leave: 'I am leaving', absentBtn: 'I am absent', confirmAbsent: 'Send my absence', inDone: 'Arrival recorded at {h}', outDone: 'Departure recorded at {h}', absentDone: 'Absence recorded at {h}',
  sentTo: 'Your manager and the client see it in their registers.', finish: 'Done', todayRecords: 'Your records here today', for: 'for {p}',
  IN: 'Arrival', OUT: 'Departure', ABSENT: 'Absence',
};
const errors: Record<string, [string, string]> = {
  NOT_ON_SITE: ['Ce QR code concerne un site où votre équipe n’intervient pas.', 'This QR code belongs to a site your team does not work on.'],
  POINT_NOT_FOUND: ['QR code inconnu ou désactivé.', 'Unknown or deactivated QR code.'], ALREADY_IN: ['Votre arrivée est déjà enregistrée : pointez votre départ.', 'Your arrival is already recorded: record your departure.'],
  NOT_IN: ['Aucune arrivée enregistrée aujourd’hui sur ce site.', 'No arrival recorded today on this site.'], ALREADY_DECLARED: ['Cette absence est déjà déclarée.', 'This absence is already declared.'],
  MISSION_OVER: ['Cette mission est terminée.', 'This mission is over.'], MISSION_NOT_FOUND: ['Mission introuvable.', 'Mission not found.'], REASON_REQUIRED: ['Un motif est obligatoire.', 'A reason is required.'],
};
const tell = (e: unknown, lang: Lang) => { const code = e instanceof ApiError ? e.code : ''; return errors[code]?.[lang === 'fr' ? 0 : 1] ?? say(e, lang); };
const loc = (lang: Lang) => lang === 'fr' ? 'fr-FR' : 'en-GB';
const time = (iso: string, lang: Lang) => new Date(iso).toLocaleTimeString(loc(lang), { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Douala' });
const hm = (minutes: number) => `${Math.floor(minutes / 60)} h ${String(Math.round(minutes % 60)).padStart(2, '0')}`;

/* ------------------------------------------------------------- the register */

type Rec = { id: string; kind: 'IN' | 'OUT' | 'ABSENT'; at: string; reason: string | null; site_id: string; membership_id: string; intervention_id: string | null; agent_name: string; provider_name: string;
  client_name: string; site_name: string; point_label: string | null; intervention_number: number | null; intervention_title: string | null; planned_start: string | null; planned_end: string | null };
type Session = { key: string; siteId: string; day: string; agent: string; provider: string; client: string; site: string; point: string | null; in?: string; out?: string; absent?: string;
  mission?: { number: number; title: string; start: string | null; end: string | null }; late?: number };

/** Arrivals and departures paired per agent, site and day; each absence on its own line. */
function sessions(records: Rec[]): Session[] {
  const out: Session[] = [], open = new Map<string, Session>();
  for (const r of [...records].sort((a, b) => a.at.localeCompare(b.at))) {
    const day = instantDay(r.kind === 'ABSENT' && r.planned_start ? r.planned_start : r.at), key = `${r.membership_id}|${r.site_id}|${day}`;
    const base = { siteId: r.site_id, day, agent: r.agent_name, provider: r.provider_name, client: r.client_name, site: r.site_name, point: r.point_label,
      mission: r.intervention_number ? { number: r.intervention_number, title: r.intervention_title ?? '', start: r.planned_start, end: r.planned_end } : undefined };
    if (r.kind === 'ABSENT') { out.push({ ...base, key: r.id, absent: r.reason ?? '' }); continue; }
    if (r.kind === 'IN') {
      const s: Session = { ...base, key: r.id, in: r.at };
      if (s.mission?.start) s.late = Math.round((Date.parse(r.at) - Date.parse(s.mission.start)) / 60000);
      out.push(s); open.set(key, s); continue;
    }
    const s = open.get(key);
    if (s) { s.out = r.at; open.delete(key); } else out.push({ ...base, key: r.id, out: r.at });
  }
  return out.sort((a, b) => (b.in ?? b.out ?? b.day).localeCompare(a.in ?? a.out ?? a.day));
}
function stateOf(s: Session, today: string, t: T): [string, string] {
  if (s.absent !== undefined) return [t.absent, 'red'];
  if (s.in && !s.out) return s.day < today ? [t.noDeparture, 'amber'] : [t.onSite, 'blue'];
  if (s.late !== undefined && s.late > 10) return [fill(t.lateBy, { n: s.late }), 'amber'];
  return s.mission ? [t.onTime, 'green'] : [t.noMission, 'neutral'];
}

export function AttendancePage({ org, lang, admin, ctx }: { org: Org; lang: Lang; admin: boolean; ctx: Ctx }) {
  const t = lang === 'fr' ? fr : en;
  const [tab, setTab] = useState<'register' | 'qr'>('register'), [days, setDays] = useState(7), [site, setSite] = useState(''), [q, setQ] = useState('');
  const [records, setRecords] = useState<Rec[]>([]), [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'), [attempt, setAttempt] = useState(0);
  useEffect(() => { let a = true; setState(s => s === 'ready' ? 'ready' : 'loading'); api(`attendance?days=${days}`, undefined, org.id).then(r => { if (a) { setRecords(r); setState('ready'); } }).catch(() => { if (a) setState('error'); }); return () => { a = false; }; }, [org.id, days, attempt]);
  const client = org.kind === 'CLIENT', today = todayKey();
  const all = useMemo(() => sessions(records), [records]);
  const sites = [...new Map(records.map(r => [r.site_id, r.site_name])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const needle = q.trim().toLocaleLowerCase(lang);
  const shown = all.filter(s => (!site || s.siteId === site) && (!needle || [s.agent, s.provider, s.client].join(' ').toLocaleLowerCase(lang).includes(needle)));
  const present = new Set(records.filter(r => r.kind === 'IN' && instantDay(r.at) === today).map(r => r.membership_id)).size;
  const lateCount = all.filter(s => s.late !== undefined && s.late > 10).length, absentCount = all.filter(s => s.absent !== undefined).length;
  const minutes = all.reduce((m, s) => s.in && s.out ? m + (Date.parse(s.out) - Date.parse(s.in)) / 60000 : m, 0);
  const ready = state === 'ready';
  const canQr = admin || (org.roles ?? []).some(r => ['CLIENT_MANAGER', 'CLIENT_CONTROLLER', 'PROVIDER_MANAGER'].includes(r));
  return <section className="attendance">
    <PageHead title={t.title} subtitle={ctx.subtitle} cells={[
      { label: t.presentToday, value: ready ? String(present) : '–' }, { label: t.late, value: ready ? String(lateCount) : '–' },
      { label: t.absences, value: ready ? String(absentCount) : '–' }, { label: t.hours, value: ready ? hm(minutes) : '–' }]} />
    <p className="page-intro">{t.intro}</p>
    <div className="toolbar">
      <div className="segmented" role="group" aria-label={t.title}>
        <button type="button" aria-pressed={tab === 'register'} onClick={() => setTab('register')}>{t.register}</button>
        {canQr && <button type="button" aria-pressed={tab === 'qr'} onClick={() => setTab('qr')}>{t.qr}</button>}
      </div>
    </div>
    {tab === 'qr' ? <QrPoints org={org} lang={lang} canCreate={!admin && client && (org.roles ?? []).includes('CLIENT_MANAGER')} /> : <>
      <div className="filters">
        <label className="filter-search">{t.search}<span className="search-field"><SearchIcon /><input type="search" value={q} onChange={e => setQ(e.target.value)} /></span></label>
        <label>{t.period}<select value={days} onChange={e => setDays(Number(e.target.value))}><option value={1}>{t.todayOpt}</option><option value={7}>{t.d7}</option><option value={30}>{t.d30}</option></select></label>
        <label>{t.site}<select value={site} onChange={e => setSite(e.target.value)}><option value="">{t.allSites}</option>{sites.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      </div>
      {state === 'error' ? <Alert retry={() => setAttempt(n => n + 1)} retryLabel={t.retry}>{t.loadError}</Alert> : state === 'loading' && !records.length ? <Skeleton label={t.loading} />
        : !shown.length ? <div className="sheet"><Empty icon={<ScanIcon />} title={t.empty}>{t.emptyText}</Empty></div>
        : <div className="table-card"><table className="audit-table attendance-table">
            <thead><tr><th scope="col" className="col-date">{t.date}</th><th scope="col">{t.agent}</th><th scope="col" className="col-place">{t.place}</th><th scope="col" className="col-time">{t.arrival}</th>
              <th scope="col" className="col-time">{t.departure}</th><th scope="col" className="col-dur">{t.duration}</th><th scope="col" className="col-mission">{t.mission}</th><th scope="col" className="col-status">{t.status}</th></tr></thead>
            <tbody>{shown.map(s => { const [label, tone] = stateOf(s, today, t); return <tr key={s.key}>
              <td data-label={t.date}>{dateText(s.day, lang)}</td>
              <td data-label={t.agent} className="work-main-cell"><span className="work-title is-wrapping">{s.agent}</span><span className="work-meta">{client ? s.provider : s.client}</span></td>
              <td data-label={t.place}><span className="slot-day">{s.site}</span>{s.point && <span className="slot-hours">{s.point}</span>}</td>
              <td data-label={t.arrival} className="num-cell">{s.in ? time(s.in, lang) : '—'}</td>
              <td data-label={t.departure} className="num-cell">{s.out ? time(s.out, lang) : '—'}</td>
              <td data-label={t.duration} className="num-cell">{s.in && s.out ? hm((Date.parse(s.out) - Date.parse(s.in)) / 60000) : '—'}</td>
              <td data-label={t.mission}>{s.mission ? <><span className="work-ref">{interventionRef(s.mission.number)}</span>
                <span className="slot-hours">{s.mission.start && s.mission.end ? fill(t.planned, { a: time(s.mission.start, lang), b: time(s.mission.end, lang) }) : s.mission.title}</span></> : <span className="muted">—</span>}</td>
              <td data-label={t.status}><span className="state-stack"><span className={`state state-${tone}`}>{label}</span>{s.absent && <small>{s.absent}</small>}</span></td>
            </tr>; })}</tbody></table></div>}
    </>}
  </section>;
}

type Point = { id: string; label: string; token: string; link: string; site_id: string; site_name: string; zone_name: string | null; zone_code: string | null; client_name: string; scans_7d: number; last_scan: string | null };

function QrPoints({ org, lang, canCreate }: { org: Org; lang: Lang; canCreate: boolean }) {
  const t = lang === 'fr' ? fr : en;
  const [points, setPoints] = useState<Point[] | null>(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  const [form, setForm] = useState(false), [sites, setSites] = useState<{ id: string; name: string }[]>([]), [zones, setZones] = useState<{ id: string; code: string; name: string }[]>([]);
  const [site, setSite] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  useEffect(() => { let a = true; setFailed(false); api('attendance/points', undefined, org.id).then(r => { if (a) setPoints(r); }).catch(() => { if (a) setFailed(true); }); return () => { a = false; }; }, [org.id, attempt]);
  useEffect(() => { if (form && !sites.length) api('sites', undefined, org.id).then((s: { id: string; name: string }[]) => { setSites(s); setSite(x => x || s[0]?.id || ''); }).catch(() => undefined); }, [form]);
  useEffect(() => { setZones([]); if (site) api(`sites/${site}/zones`, undefined, org.id).then(setZones).catch(() => undefined); }, [site]);
  const poster = (p: Point) => fetch(`/api/v1/attendance/points/${p.id}/poster.pdf`, { headers: { 'X-Organization-Id': org.id }, credentials: 'same-origin' }).then(r => r.ok ? r.blob() : Promise.reject())
    .then(b => { const href = URL.createObjectURL(b), a = document.createElement('a'); a.href = href; a.download = `TRACEOPS-pointage-${p.label}.pdf`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(href), 2000); })
    .catch(() => setError(say(new ApiError('error'), lang)));
  return <div className="stack">
    <p className="sheet-note info-note"><ScanIcon />{t.qrHelp}</p>
    {notice && <Alert kind="success">{notice}</Alert>}
    {error && <Alert>{error}</Alert>}
    <Sheet id="points" title={t.points} meta={points ? fill(t.pointsMeta, { n: points.length }) : undefined}
      actions={canCreate && !form ? <button className="primary small" onClick={() => { setForm(true); setNotice(''); }}><PlusIcon />{t.newPoint}</button> : undefined}>
      {form && <form className="link-form point-form" onSubmit={e => {
        e.preventDefault(); const f = new FormData(e.currentTarget);
        setBusy(true); setError('');
        api('attendance/points', { siteId: site, zoneId: f.get('zone') || null, label: f.get('label') }, org.id)
          .then(() => { setForm(false); setNotice(t.created); setAttempt(n => n + 1); }).catch(err => setError(say(err, lang))).finally(() => setBusy(false));
      }}>
        <div className="form-row form-row-3">
          <label>{t.site}<select value={site} required onChange={e => setSite(e.target.value)}>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label>{t.zone}<select name="zone" defaultValue=""><option value="">{t.wholeSite}</option>{zones.map(z => <option key={z.id} value={z.id}>{z.name} ({z.code})</option>)}</select></label>
          <label>{t.label}<input name="label" required maxLength={120} placeholder={t.labelHint} defaultValue={lang === 'fr' ? 'Entrée du personnel' : 'Staff entrance'} /></label>
        </div>
        <div className="toolbar-actions"><button type="button" className="secondary" disabled={busy} onClick={() => setForm(false)}>{t.cancel}</button><button className="primary" disabled={busy || !site}>{t.create}</button></div>
      </form>}
      {failed ? <Alert retry={() => setAttempt(n => n + 1)} retryLabel={t.retry}>{t.loadError}</Alert> : !points ? <Skeleton label={t.loading} />
        : !points.length ? <Empty icon={<ScanIcon />} title={t.noPoint}>{t.noPointText}</Empty>
        : <ul className="qr-grid">{points.map(p => <li key={p.id} className="qr-card">
            <QrCode value={p.link} size={148} label={fill(t.qrOf, { p: `${p.site_name} — ${p.label}` })} />
            <div className="qr-text">
              <strong>{p.label}</strong>
              <span>{[p.site_name, p.zone_name].filter(Boolean).join(' · ')}</span>
              {org.kind === 'PROVIDER' && <span className="muted">{p.client_name}</span>}
              <span className="muted">{fill(t.scans, { n: p.scans_7d })} · {p.last_scan ? fill(t.lastScan, { d: dateText(p.last_scan, lang, 'time') }) : t.never}</span>
              <code className="qr-link" title={`${t.address} : ${p.link}`}>{p.link}</code>
              <div className="toolbar-actions">
                <button className="secondary small" onClick={() => void poster(p)}><DownloadIcon />{t.poster}</button>
                {canCreate && <button className="link-button danger-link" onClick={() => { setError(''); api(`attendance/points/${p.id}/archive`, {}, org.id).then(() => { setNotice(t.archived); setAttempt(n => n + 1); }).catch(err => setError(say(err, lang))); }}><TrashIcon />{t.archive}</button>}
              </div>
            </div>
          </li>)}</ul>}
    </Sheet>
  </div>;
}

/* ---------------------------------------------------------------- the agent */

type Mission = { id: string; number: number; title: string; status: string; starts_at: string; ends_at: string; site_name: string; zones: string[] };
const canDetect = () => typeof window !== 'undefined' && 'BarcodeDetector' in window && Boolean(navigator.mediaDevices?.getUserMedia);
/** A token read from a scanned TRACEOPS address. */
export const tokenOf = (value: string) => { const m = value.match(/pointage=([0-9a-f]{32})/); return m ? m[1]! : ''; };

export function AgentAttendance({ org, lang, ctx, onScan }: { org: Org; lang: Lang; ctx: Ctx; onScan: (token: string) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [records, setRecords] = useState<Rec[]>([]), [missions, setMissions] = useState<Mission[]>([]), [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'), [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [scanning, setScanning] = useState(false);
  useEffect(() => {
    let a = true; setState('loading');
    const from = new Date(Date.now() - 12 * 3600000).toISOString(), to = new Date(Date.now() + 8 * 86400000).toISOString();
    Promise.all([api('attendance?days=30', undefined, org.id), api(`interventions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, undefined, org.id)])
      .then(([r, m]) => { if (a) { setRecords(r); setMissions((m as Mission[]).filter(x => ['PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'REWORK'].includes(x.status) && Date.parse(x.ends_at) > Date.now())); setState('ready'); } })
      .catch(() => { if (a) setState('error'); });
    return () => { a = false; };
  }, [org.id, attempt]);
  const today = todayKey(), mine = sessions(records), todays = records.filter(r => instantDay(r.at) === today).sort((a, b) => b.at.localeCompare(a.at));
  const absentFor = new Set(records.filter(r => r.kind === 'ABSENT' && r.intervention_id).map(r => r.intervention_id!));
  const last = [...records].sort((a, b) => b.at.localeCompare(a.at))[0];
  return <section className="attendance agent-attendance">
    <PageHead title={t.agentTitle} subtitle={ctx.subtitle} cells={[{ label: t.todayCard, value: new Date().toLocaleDateString(loc(lang), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Douala' }) },
      { label: t.lastSent, value: last ? `${t[last.kind]} · ${dateText(last.at, lang, 'time')}` : '—' }]} />
    {notice && <Alert kind="success">{notice}</Alert>}
    {error && <Alert>{error}</Alert>}
    <Sheet id="scan" title={t.scanTitle} className="sheet-action">
      <ol className="scan-steps"><li>{t.step1}</li><li>{t.step2}</li><li>{t.step3}</li></ol>
      {canDetect() && <button className="primary wide-mobile" onClick={() => setScanning(true)}><ScanIcon />{t.scanInApp}</button>}
    </Sheet>
    {scanning && <Scanner lang={lang} onClose={() => setScanning(false)} onToken={token => { setScanning(false); onScan(token); }} />}
    {state === 'error' ? <Alert retry={() => setAttempt(n => n + 1)} retryLabel={t.retry}>{t.loadError}</Alert> : state === 'loading' ? <Skeleton label={t.loading} /> : <>
      <Sheet id="today" title={t.todayCard} meta={todays.length ? String(todays.length) : undefined}>
        {todays.length ? <ul className="record-list">{todays.map(r => <li key={r.id} className={`record is-${r.kind.toLowerCase()}`}>
          <span className="record-time">{time(r.at, lang)}</span><span className="record-kind">{t[r.kind]}</span>
          <span className="record-where">{[r.site_name, r.point_label].filter(Boolean).join(' · ')}{r.reason ? ` — ${r.reason}` : ''}</span></li>)}</ul> : <p className="muted">{t.nothingToday}</p>}
      </Sheet>
      <Sheet id="upcoming" title={t.upcoming} meta={t.upcomingMeta}>
        {missions.length ? <ul className="mission-absence">{missions.map(m => <li key={m.id}>
          <div className="ma-main"><span className="work-ref">{interventionRef(m.number)}</span><strong>{m.title}</strong>
            <span className="muted">{dateText(m.starts_at, lang, 'time')} – {time(m.ends_at, lang)} · {m.site_name}</span></div>
          {absentFor.has(m.id) ? <span className="state state-red">{t.declared}</span>
            : open === m.id ? <form className="link-form" onSubmit={e => {
                e.preventDefault(); const f = new FormData(e.currentTarget);
                const reason = [f.get('reason'), String(f.get('details') ?? '').trim()].filter(Boolean).join(' — ');
                setBusy(true); setError(''); setNotice('');
                api('attendance/absence', { interventionId: m.id, reason }, org.id).then(() => { setOpen(''); setNotice(t.absenceSent); setAttempt(n => n + 1); }).catch(err => setError(tell(err, lang))).finally(() => setBusy(false));
              }}>
                <div className="form-row"><label>{t.reason}<select name="reason" required>{t.reasons.map(r => <option key={r} value={r}>{r}</option>)}</select></label>
                  <label>{t.details}<input name="details" maxLength={300} /></label></div>
                <div className="toolbar-actions"><button type="button" className="secondary" disabled={busy} onClick={() => setOpen('')}>{t.cancel}</button><button className="danger" disabled={busy}>{t.send}</button></div>
              </form>
            : <button className="secondary small" onClick={() => setOpen(m.id)}>{t.declare}</button>}
        </li>)}</ul> : <p className="muted">{t.noUpcoming}</p>}
      </Sheet>
      <Sheet id="history" title={t.history} meta={t.historyMeta}>
        {mine.length ? <div className="table-card table-flat"><table className="audit-table attendance-table compact">
          <thead><tr><th scope="col" className="col-date">{t.date}</th><th scope="col">{t.place}</th><th scope="col" className="col-time">{t.arrival}</th><th scope="col" className="col-time">{t.departure}</th><th scope="col" className="col-status">{t.status}</th></tr></thead>
          <tbody>{mine.map(s => { const [label, tone] = stateOf(s, today, t); return <tr key={s.key}>
            <td data-label={t.date}>{dateText(s.day, lang)}</td><td data-label={t.place}><span className="slot-day">{s.site}</span>{s.point && <span className="slot-hours">{s.point}</span>}</td>
            <td data-label={t.arrival}>{s.in ? time(s.in, lang) : '—'}</td><td data-label={t.departure}>{s.out ? time(s.out, lang) : '—'}</td>
            <td data-label={t.status}><span className="state-stack"><span className={`state state-${tone}`}>{label}</span>{s.absent && <small>{s.absent}</small>}</span></td></tr>; })}</tbody></table></div>
          : <p className="muted">{t.nothingToday}</p>}
      </Sheet>
    </>}
  </section>;
}

function Scanner({ lang, onClose, onToken }: { lang: Lang; onClose: () => void; onToken: (token: string) => void }) {
  const t = lang === 'fr' ? fr : en;
  const video = useRef<HTMLVideoElement>(null), [failed, setFailed] = useState(false);
  useEffect(() => {
    let stream: MediaStream | null = null, stop = false, timer = 0;
    const Detector = (window as unknown as { BarcodeDetector: new (o: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    const detector = new Detector({ formats: ['qr_code'] });
    const look = async () => {
      if (stop || !video.current) return;
      try { const token = (await detector.detect(video.current)).map(c => tokenOf(c.rawValue)).find(Boolean); if (token) { onToken(token); return; } } catch { /* frame not ready */ }
      timer = window.setTimeout(look, 300);
    };
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(s => { stream = s; if (video.current) { video.current.srcObject = s; void video.current.play(); look(); } }).catch(() => setFailed(true));
    return () => { stop = true; window.clearTimeout(timer); stream?.getTracks().forEach(x => x.stop()); };
  }, []);
  return <div className="scanner" role="dialog" aria-modal="true" aria-label={t.scanInApp}>
    <div className="scanner-box">{failed ? <p className="scanner-error"><AlertIcon />{t.cameraError}</p> : <><video ref={video} playsInline muted /><span className="scanner-frame" aria-hidden="true" /><p>{t.camera}</p></>}
      <button className="secondary" onClick={onClose}><CloseIcon />{t.closeScanner}</button></div>
  </div>;
}

/* --------------------------------------------------------- the scanned page */

type ScanInfo = { point: { label: string; site_name: string; zone_name: string | null; client_name: string }; provider: { id: string; name: string }; agent: string;
  records: { id: string; kind: 'IN' | 'OUT' | 'ABSENT'; at: string; reason: string | null }[]; missions: { id: string; number: number; title: string; starts_at: string; ends_at: string }[]; open: boolean; now: string };

/** What an agent sees after scanning a site's QR code: where, when, and one big button. */
export function ScanPage({ token, lang, onClose }: { token: string; lang: Lang; onClose: () => void }) {
  const t = lang === 'fr' ? fr : en;
  const [info, setInfo] = useState<ScanInfo | null>(null), [failed, setFailed] = useState(''), [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [done, setDone] = useState<{ kind: 'IN' | 'OUT' | 'ABSENT'; at: string } | null>(null), [absent, setAbsent] = useState(false);
  useEffect(() => { let a = true; setFailed(''); api(`attendance/scan/${token}`).then(r => { if (a) setInfo(r); }).catch(e => { if (a) setFailed(tell(e, lang)); }); return () => { a = false; }; }, [token, attempt]);
  const send = (kind: 'IN' | 'OUT' | 'ABSENT', reason?: string) => {
    setBusy(true); setError('');
    api(`attendance/scan/${token}`, { kind, reason }).then(r => { setDone({ kind, at: r.at }); setAbsent(false); setAttempt(n => n + 1); }).catch(e => setError(tell(e, lang))).finally(() => setBusy(false));
  };
  return <section className="scan-page">
    <div className="sheet scan-card">
      <div className="sheet-body">
        <p className="scan-kicker"><ScanIcon />{t.scanPage}</p>
        {failed ? <><Alert>{failed}</Alert><button className="secondary" onClick={onClose}>{t.finish}</button></> : !info ? <Skeleton label={t.loading} rows={3} /> : <>
          <h1 className="scan-site">{info.point.site_name}</h1>
          <p className="scan-point">{[info.point.label, info.point.zone_name].filter(Boolean).join(' · ')} — {info.point.client_name}</p>
          <p className="scan-who"><strong>{info.agent}</strong> · {info.provider.name}</p>
          {done ? <div className="scan-done" role="status">
              <span className="scan-check" aria-hidden="true"><CheckIcon /></span>
              <strong>{fill(done.kind === 'IN' ? t.inDone : done.kind === 'OUT' ? t.outDone : t.absentDone, { h: time(done.at, lang) })}</strong>
              <span>{t.sentTo}</span>
            </div>
            : <>
              <p className="scan-clock">{fill(t.now, { h: time(info.now, lang) })}</p>
              <p className="scan-state">{info.open ? fill(t.youAre, { h: time([...info.records].reverse().find(r => r.kind === 'IN')!.at, lang) }) : t.notYet}</p>
              {error && <Alert>{error}</Alert>}
              {absent ? <form className="link-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); send('ABSENT', [f.get('reason'), String(f.get('details') ?? '').trim()].filter(Boolean).join(' — ')); }}>
                  <div className="form-row"><label>{t.reason}<select name="reason" required>{t.reasons.map(r => <option key={r} value={r}>{r}</option>)}</select></label><label>{t.details}<input name="details" maxLength={300} /></label></div>
                  <div className="toolbar-actions"><button type="button" className="secondary" disabled={busy} onClick={() => setAbsent(false)}>{t.cancel}</button><button className="danger" disabled={busy}>{t.confirmAbsent}</button></div>
                </form>
                : <div className="scan-actions">
                  <button className="primary scan-main" disabled={busy} onClick={() => send(info.open ? 'OUT' : 'IN')}>{info.open ? t.leave : t.arrive}</button>
                  {!info.open && <button className="secondary" disabled={busy} onClick={() => setAbsent(true)}>{t.absentBtn}</button>}
                </div>}
            </>}
          <div className="scan-missions">
            <h2>{t.missionsToday}</h2>
            {info.missions.length ? <ul>{info.missions.map(m => <li key={m.id}><span className="work-ref">{interventionRef(m.number)}</span> {m.title} <span className="muted">{time(m.starts_at, lang)}–{time(m.ends_at, lang)}</span></li>)}</ul>
              : <p className="muted">{t.noMissionToday}</p>}
          </div>
          {info.records.length > 0 && <div className="scan-missions"><h2>{t.todayRecords}</h2><ul className="record-list">{info.records.map(r => <li key={r.id} className={`record is-${r.kind.toLowerCase()}`}>
            <span className="record-time">{time(r.at, lang)}</span><span className="record-kind">{t[r.kind]}</span>{r.reason && <span className="record-where">{r.reason}</span>}</li>)}</ul></div>}
          <button className={done ? 'primary' : 'link-button'} onClick={onClose}>{t.finish}</button>
        </>}
      </div>
    </div>
  </section>;
}
