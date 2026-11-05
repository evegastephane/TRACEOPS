import React, { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from './api';
import { Avatar } from './avatar';
import type { Lang } from './i18n';
import { AlertIcon, BackIcon, CheckIcon, ChevronIcon, CloseIcon, PlusIcon, SearchIcon } from './icons';

/* ------------------------------------------------------------------ words */

const fr = {
  overviewIntro: 'Ce qui demande votre attention, ce qui se passe aujourd’hui et l’état des interventions.',
  toHandle: 'À traiter', today: 'Aujourd’hui', inProgress: 'En cours', toReview: 'À contrôler', rework: 'Reprises', quotes: 'Devis en attente', anomalies: 'Anomalies ouvertes', toAssign: 'À affecter',
  nothingToHandle: 'Rien à traiter pour le moment.', nothingToday: 'Aucune intervention prévue aujourd’hui.', seeAll: 'Voir toutes les interventions', openPlanning: 'Ouvrir le planning',
  interventions: 'Interventions', programmes: 'Programmes', newMaintenance: 'Nouvelle demande de maintenance', newProgramme: 'Nouveau programme de nettoyage',
  search: 'Rechercher', searchHint: 'N°, titre, lieu, prestataire', status: 'Statut', allStatuses: 'Tous les statuts', kind: 'Type', allKinds: 'Tous les types', period: 'Période',
  p7: '7 prochains jours', p30: '30 jours (passés et à venir)', pAll: 'Toutes', CLEANING: 'Nettoyage', MAINTENANCE: 'Maintenance',
  number: 'N°', title: 'Intervention', place: 'Lieu', slot: 'Créneau', team: 'Équipe', partner: 'Prestataire', client: 'Client', none: '—', empty: 'Aucune intervention ne correspond.',
  loading: 'Chargement…', retry: 'Réessayer', loadError: 'Impossible de charger les interventions. Réessayez.', urgent: 'Urgent', back: 'Toutes les interventions', from: 'Programme',
  site: 'Site', places: 'Lieux', planned: 'Créneau prévu', started: 'Démarrée', submitted: 'Soumise', accepted: 'Acceptée le', createdBy: 'Demandée par', round: 'Passage de contrôle',
  nextStep: 'Prochaine étape', waitingFor: 'En attente de', noAction: 'Aucune action de votre part pour l’instant.', pdf: 'Télécharger le compte rendu (PDF)',
  quote: 'Devis', amount: 'Montant (FCFA)', delay: 'Délai d’exécution (jours)', quoteDesc: 'Contenu du devis', sendQuote: 'Transmettre le devis', acceptQuote: 'Accepter le devis', refuseQuote: 'Refuser le devis',
  reason: 'Motif', reasonRequired: 'Un motif est obligatoire.', assignTeam: 'Affecter l’équipe', lead: 'Responsable de mission', agents: 'Agents', chooseAgents: 'Choisissez au moins un agent et le responsable.',
  start: 'Démarrer l’intervention', tasks: 'Tâches', done: 'Effectuée', impossible: 'Impossible', reopen: 'Rouvrir', todo: 'À faire', reworkFlag: 'à reprendre', note: 'Observation', impossibleNote: 'Expliquez pourquoi la tâche est impossible.',
  photos: 'Photos', before: 'Avant', after: 'Après', addBefore: 'Photo avant', addAfter: 'Photo après', photoHelp: 'JPEG ou PNG, 5 Mo maximum.', noPhoto: 'Aucune photo.',
  report: 'Compte rendu', reportNote: 'Compte rendu de l’agent', submit: 'Soumettre le compte rendu', submitHelp: 'Toutes les tâches doivent être effectuées ou déclarées impossibles.',
  control: 'Contrôle', acceptWork: 'Accepter la prestation', askRework: 'Demander une reprise', reworkTasks: 'Tâches à reprendre', reworkHelp: 'Seules les tâches cochées seront refaites ; le reste est conservé.',
  acceptNote: 'Observation (facultative)', anomalyNotice: 'Accepter la prestation ne clôture pas les anomalies : elles se clôturent une par une.',
  cancel: 'Annuler l’intervention', confirmCancel: 'Confirmer l’annulation',
  anomaliesTitle: 'Anomalies', reportAnomaly: 'Signaler une anomalie', anomalyTitle: 'Objet', description: 'Description', zone: 'Lieu concerné', anyZone: 'Toute l’intervention',
  propose: 'Proposer une résolution', resolution: 'Résolution proposée', close: 'Clôturer l’anomalie', closingNote: 'Constat de clôture', noAnomaly: 'Aucune anomalie.',
  OPEN: 'Ouverte', RESOLUTION_PROPOSED: 'Résolution proposée', CLOSED: 'Clôturée', PENDING: 'En attente', ACCEPTED: 'Accepté', REFUSED: 'Refusé',
  history: 'Historique', save: 'Enregistrer', send: 'Envoyer', closePanel: 'Fermer',
  prTitle: 'Intitulé', prProvider: 'Prestataire destinataire', prSite: 'Site', prZones: 'Lieux concernés', prDays: 'Jours de passage', prStartDate: 'Date de début', prEndDate: 'Date de fin',
  prStartTime: 'Heure de début', prEndTime: 'Heure de fin', prTasks: 'Tâches (une par ligne)', prHelp: 'Chaque passage devient une intervention suivie séparément : affectation, compte rendu, contrôle.',
  prCreated: 'Programme créé : {n} passages planifiés.', mtCreated: 'Demande envoyée au prestataire.', mtStarts: 'Début', mtEnds: 'Fin', mtPriority: 'Urgente', mtQuote: 'Devis préalable requis',
  mtQuoteHelp: 'Le prestataire transmet un devis ; rien n’est planifié avant votre accord.', noLinked: 'Aucun prestataire n’est rattaché à ce site.',
  days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], passages: 'Passages', acceptedOf: '{a} acceptés sur {n}', setTeam: 'Affecter l’équipe à tous les passages à venir',
  teamSet: '{n} passages affectés{s}.', skipped: ', {n} ignorés (agent déjà occupé)', noProgramme: 'Aucun programme de nettoyage.', week: 'Semaine du {d}', prev: 'Semaine précédente', next: 'Semaine suivante', thisWeek: 'Cette semaine',
  noVisit: 'Aucun passage', waiting: { REQUESTED: 'le devis du prestataire', QUOTE_SUBMITTED: 'la décision du client sur le devis', QUOTE_REFUSED: 'un nouveau devis', PLANNED: 'l’affectation par le prestataire', ASSIGNED: 'le démarrage par l’agent', IN_PROGRESS: 'le compte rendu de l’agent', UNDER_REVIEW: 'le contrôle du client', REWORK: 'la reprise par l’agent', ACCEPTED: '', CANCELLED: '' } as Record<string, string>,
};
type T = typeof fr;
const en: T = {
  overviewIntro: 'What needs your attention, what happens today and where interventions stand.',
  toHandle: 'To handle', today: 'Today', inProgress: 'In progress', toReview: 'To review', rework: 'Rework', quotes: 'Pending quotes', anomalies: 'Open anomalies', toAssign: 'To assign',
  nothingToHandle: 'Nothing to handle right now.', nothingToday: 'No intervention planned today.', seeAll: 'See all interventions', openPlanning: 'Open the planning',
  interventions: 'Interventions', programmes: 'Programmes', newMaintenance: 'New maintenance request', newProgramme: 'New cleaning programme',
  search: 'Search', searchHint: 'No., title, place, provider', status: 'Status', allStatuses: 'All statuses', kind: 'Type', allKinds: 'All types', period: 'Period',
  p7: 'Next 7 days', p30: '30 days (past and upcoming)', pAll: 'All', CLEANING: 'Cleaning', MAINTENANCE: 'Maintenance',
  number: 'No.', title: 'Intervention', place: 'Place', slot: 'Slot', team: 'Team', partner: 'Provider', client: 'Client', none: '—', empty: 'No intervention matches.',
  loading: 'Loading…', retry: 'Try again', loadError: 'The interventions could not be loaded. Try again.', urgent: 'Urgent', back: 'All interventions', from: 'Programme',
  site: 'Site', places: 'Places', planned: 'Planned slot', started: 'Started', submitted: 'Submitted', accepted: 'Accepted on', createdBy: 'Requested by', round: 'Review round',
  nextStep: 'Next step', waitingFor: 'Waiting for', noAction: 'Nothing for you to do yet.', pdf: 'Download the report (PDF)',
  quote: 'Quote', amount: 'Amount (XAF)', delay: 'Lead time (days)', quoteDesc: 'Quote content', sendQuote: 'Send the quote', acceptQuote: 'Accept the quote', refuseQuote: 'Refuse the quote',
  reason: 'Reason', reasonRequired: 'A reason is required.', assignTeam: 'Assign the team', lead: 'Mission lead', agents: 'Agents', chooseAgents: 'Choose at least one agent and the lead.',
  start: 'Start the intervention', tasks: 'Tasks', done: 'Done', impossible: 'Impossible', reopen: 'Reopen', todo: 'To do', reworkFlag: 'to redo', note: 'Remark', impossibleNote: 'Explain why the task is impossible.',
  photos: 'Photos', before: 'Before', after: 'After', addBefore: 'Before photo', addAfter: 'After photo', photoHelp: 'JPEG or PNG, 5 MB max.', noPhoto: 'No photo.',
  report: 'Report', reportNote: 'Agent report', submit: 'Submit the report', submitHelp: 'Every task must be done or declared impossible.',
  control: 'Review', acceptWork: 'Accept the work', askRework: 'Request rework', reworkTasks: 'Tasks to redo', reworkHelp: 'Only the checked tasks are redone; everything else is kept.',
  acceptNote: 'Remark (optional)', anomalyNotice: 'Accepting the work does not close anomalies: they are closed one by one.',
  cancel: 'Cancel the intervention', confirmCancel: 'Confirm cancellation',
  anomaliesTitle: 'Anomalies', reportAnomaly: 'Report an anomaly', anomalyTitle: 'Subject', description: 'Description', zone: 'Place concerned', anyZone: 'Whole intervention',
  propose: 'Propose a resolution', resolution: 'Proposed resolution', close: 'Close the anomaly', closingNote: 'Closing statement', noAnomaly: 'No anomaly.',
  OPEN: 'Open', RESOLUTION_PROPOSED: 'Resolution proposed', CLOSED: 'Closed', PENDING: 'Pending', ACCEPTED: 'Accepted', REFUSED: 'Refused',
  history: 'History', save: 'Save', send: 'Send', closePanel: 'Close',
  prTitle: 'Title', prProvider: 'Receiving provider', prSite: 'Site', prZones: 'Places', prDays: 'Passage days', prStartDate: 'Start date', prEndDate: 'End date',
  prStartTime: 'Start time', prEndTime: 'End time', prTasks: 'Tasks (one per line)', prHelp: 'Each passage becomes its own intervention: assignment, report, review.',
  prCreated: 'Programme created: {n} passages scheduled.', mtCreated: 'Request sent to the provider.', mtStarts: 'Start', mtEnds: 'End', mtPriority: 'Urgent', mtQuote: 'Prior quote required',
  mtQuoteHelp: 'The provider sends a quote; nothing is scheduled before you approve it.', noLinked: 'No provider is linked to this site.',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], passages: 'Passages', acceptedOf: '{a} accepted of {n}', setTeam: 'Assign the team to every upcoming passage',
  teamSet: '{n} passages assigned{s}.', skipped: ', {n} skipped (agent already busy)', noProgramme: 'No cleaning programme.', week: 'Week of {d}', prev: 'Previous week', next: 'Next week', thisWeek: 'This week',
  noVisit: 'No passage', waiting: { REQUESTED: 'the provider’s quote', QUOTE_SUBMITTED: 'the client’s decision on the quote', QUOTE_REFUSED: 'a new quote', PLANNED: 'assignment by the provider', ASSIGNED: 'the agent to start', IN_PROGRESS: 'the agent’s report', UNDER_REVIEW: 'the client’s review', REWORK: 'rework by the agent', ACCEPTED: '', CANCELLED: '' },
};
export const statuses: Record<string, [string, string, string]> = {
  REQUESTED: ['Demandée', 'Requested', 'neutral'], QUOTE_SUBMITTED: ['Devis à valider', 'Quote to approve', 'amber'], QUOTE_REFUSED: ['Devis refusé', 'Quote refused', 'red'],
  PLANNED: ['À affecter', 'To assign', 'amber'], ASSIGNED: ['Planifiée', 'Scheduled', 'blue'], IN_PROGRESS: ['En cours', 'In progress', 'blue'], UNDER_REVIEW: ['À contrôler', 'Awaiting review', 'amber'],
  REWORK: ['Reprise demandée', 'Rework requested', 'red'], ACCEPTED: ['Acceptée', 'Accepted', 'green'], CANCELLED: ['Annulée', 'Cancelled', 'neutral'],
};
const events: Record<string, [string, string]> = {
  REQUESTED: ['Demande créée', 'Request created'], SCHEDULED: ['Passage programmé', 'Passage scheduled'], QUOTE_SUBMITTED: ['Devis transmis', 'Quote submitted'], QUOTE_ACCEPTED: ['Devis accepté', 'Quote accepted'],
  QUOTE_REFUSED: ['Devis refusé', 'Quote refused'], ASSIGNED: ['Équipe affectée', 'Team assigned'], STARTED: ['Intervention démarrée', 'Work started'], TASK_DONE: ['Tâche effectuée', 'Task done'],
  TASK_IMPOSSIBLE: ['Tâche impossible', 'Task impossible'], TASK_TODO: ['Tâche rouverte', 'Task reopened'], PHOTO_BEFORE: ['Photo avant ajoutée', 'Before photo added'], PHOTO_AFTER: ['Photo après ajoutée', 'After photo added'],
  SUBMITTED: ['Compte rendu soumis', 'Report submitted'], RESUBMITTED: ['Compte rendu soumis à nouveau', 'Report resubmitted'], REWORK_REQUESTED: ['Reprise demandée', 'Rework requested'],
  ACCEPTED: ['Prestation acceptée', 'Work accepted'], CANCELLED: ['Intervention annulée', 'Cancelled'], ANOMALY_REPORTED: ['Anomalie signalée', 'Anomaly reported'],
  ANOMALY_RESOLUTION_PROPOSED: ['Résolution proposée', 'Resolution proposed'], ANOMALY_CLOSED: ['Anomalie clôturée', 'Anomaly closed'],
};
const errors: Record<string, [string, string]> = {
  ACTION_NOT_ALLOWED: ['Cette action n’est plus possible : l’intervention a changé. Rechargez la fiche.', 'This action is no longer possible: the intervention changed. Reload it.'],
  AGENT_BUSY: ['Un des agents est déjà sur une autre mission à ce créneau.', 'One of the agents is already on another mission at that time.'],
  TASKS_PENDING: ['Des tâches sont encore à faire.', 'Some tasks are still to do.'], REASON_REQUIRED: ['Un motif est obligatoire.', 'A reason is required.'],
  REWORK_DETAILS_REQUIRED: ['Indiquez le motif et au moins une tâche à reprendre.', 'Give a reason and at least one task to redo.'], PHOTO_FORMAT: ['Seules les photos JPEG ou PNG lisibles sont acceptées.', 'Only readable JPEG or PNG photos are accepted.'],
  PROVIDER_NOT_LINKED: ['Ce prestataire n’est pas rattaché au site.', 'This provider is not linked to the site.'], ZONE_REQUIRED: ['Choisissez au moins un lieu.', 'Choose at least one place.'],
  INVALID_PERIOD: ['La fin doit être après le début.', 'The end must be after the start.'], INVALID_DATE: ['Date ou heure invalide.', 'Invalid date or time.'], NO_PASSAGE: ['Aucun passage dans cette période pour ces jours.', 'No passage in this period for these days.'],
  TOO_MANY_PASSAGES: ['Plus de 400 passages : réduisez la période.', 'More than 400 passages: shorten the period.'], INVALID_QUOTE: ['Montant ou délai invalide.', 'Invalid amount or lead time.'],
  TEAM_REQUIRED: ['Choisissez au moins un agent.', 'Choose at least one agent.'], LEAD_NOT_IN_TEAM: ['Le responsable doit faire partie de l’équipe.', 'The lead must be part of the team.'],
  INVALID_WEEKDAYS: ['Choisissez au moins un jour.', 'Choose at least one day.'], INVALID_INPUT: ['Vérifiez les champs du formulaire.', 'Check the form fields.'],
  network: ['Connexion au serveur impossible.', 'Cannot reach the server.'], error: ['Une erreur est survenue. Réessayez.', 'Something went wrong. Please try again.'],
};
const say = (e: unknown, lang: Lang) => { const code = e instanceof ApiError ? e.code : 'error'; return (errors[code] ?? errors.error)[lang === 'fr' ? 0 : 1]; };
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
export const statusBadge = (s: string, lang: Lang) => { const st = statuses[s] ?? [s, s, 'neutral']; return <span className={`state state-${st[2]}`}>{st[lang === 'fr' ? 0 : 1]}</span>; };
const ref = (n: number) => 'INT-' + String(n).padStart(4, '0');

type Org = { id: string; name: string; kind: 'CLIENT' | 'PROVIDER'; roles?: string[] };
export type Item = { id: string; number: number; kind: 'CLEANING' | 'MAINTENANCE'; title: string; status: string; priority: string; starts_at: string; ends_at: string; programme_id: string | null; site_name: string; timezone: string;
  client_name: string; provider_name: string; agents: { name: string; lead: boolean }[]; zones: string[]; open_anomalies: number; tasks_total: number; tasks_done: number };

/** What this role is expected to do next, from the status alone (the detail asks the server for the exact rights). */
function mine(item: Item, org: Org, admin: boolean) {
  if (admin) return false;
  const r = org.roles ?? [];
  if (org.kind === 'CLIENT') return (r.includes('CLIENT_MANAGER') && item.status === 'QUOTE_SUBMITTED') || ((r.includes('CLIENT_MANAGER') || r.includes('CLIENT_CONTROLLER')) && item.status === 'UNDER_REVIEW');
  if (r.includes('PROVIDER_MANAGER')) return ['REQUESTED', 'QUOTE_REFUSED', 'PLANNED'].includes(item.status);
  return ['ASSIGNED', 'IN_PROGRESS', 'REWORK'].includes(item.status);
}
function when(iso: string, tz: string, lang: Lang, style: 'full' | 'time' | 'day' = 'full') {
  const opts: Intl.DateTimeFormatOptions = style === 'time' ? { hour: '2-digit', minute: '2-digit' } : style === 'day' ? { weekday: 'short', day: 'numeric', month: 'short' } : { dateStyle: 'medium', timeStyle: 'short' };
  return new Date(iso).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { timeZone: tz, ...opts });
}
const slot = (i: Item, lang: Lang) => {
  const sameDay = when(i.starts_at, i.timezone, lang, 'day') === when(i.ends_at, i.timezone, lang, 'day');
  return sameDay ? `${when(i.starts_at, i.timezone, lang, 'day')} · ${when(i.starts_at, i.timezone, lang, 'time')}–${when(i.ends_at, i.timezone, lang, 'time')}` : `${when(i.starts_at, i.timezone, lang)} – ${when(i.ends_at, i.timezone, lang)}`;
};
const dayKey = (iso: string, tz: string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

function useInterventions(org: Org, from?: string, to?: string) {
  const [items, setItems] = useState<Item[]>([]), [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true; setState('loading');
    const q = new URLSearchParams(Object.entries({ from: from ?? '', to: to ?? '' }).filter(([, v]) => v)).toString();
    api('interventions' + (q ? '?' + q : ''), undefined, org.id).then(r => { if (active) { setItems(r); setState('ready'); } }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [org.id, from, to, attempt]);
  return { items, state, reload: () => setAttempt(n => n + 1) };
}
function LoadError({ text, retry, t }: { text: string; retry: () => void; t: T }) {
  return <div className="alert alert-error" role="alert"><AlertIcon /><div className="alert-body"><p>{text}</p><button className="secondary small" onClick={retry}>{t.retry}</button></div></div>;
}
const Skeleton = ({ t }: { t: T }) => <div className="skeleton" role="status"><span className="sr-only">{t.loading}</span><span className="skeleton-row" /><span className="skeleton-row" /><span className="skeleton-row" /></div>;

function Row({ i, lang, onOpen, partner }: { i: Item; lang: Lang; onOpen: (id: string) => void; partner: 'provider' | 'client' }) {
  return <li><button className="work-row" onClick={() => onOpen(i.id)}>
    <span className="work-main"><span className="work-ref">{ref(i.number)}</span><strong>{i.title}</strong>
      <span className="muted">{[i.zones.join(', '), partner === 'provider' ? i.provider_name : i.client_name].filter(Boolean).join(' · ')}</span></span>
    <span className="work-side"><span className="work-slot">{slot(i, lang)}</span>{statusBadge(i.status, lang)}</span>
    <ChevronIcon />
  </button></li>;
}

/* --------------------------------------------------------------- overview */

export function WorkOverview({ org, lang, admin, onOpen, onNavigate }: { org: Org; lang: Lang; admin: boolean; onOpen: (id: string) => void; onNavigate: (s: 'planning' | 'interventions') => void }) {
  const t = lang === 'fr' ? fr : en;
  const range = useMemo(() => ({ from: new Date(Date.now() - 45 * 86400000).toISOString(), to: new Date(Date.now() + 45 * 86400000).toISOString() }), [org.id]);
  const { items, state, reload } = useInterventions(org, range.from, range.to);
  const partner = org.kind === 'CLIENT' ? 'provider' : 'client';
  const todayKey = dayKey(new Date().toISOString(), items[0]?.timezone ?? 'Africa/Douala');
  const today = items.filter(i => dayKey(i.starts_at, i.timezone) === todayKey && i.status !== 'CANCELLED');
  const handle = items.filter(i => mine(i, org, admin)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const count = (s: string[]) => items.filter(i => s.includes(i.status)).length;
  const stat = (v: number, label: string) => <div className="stat" key={label}><dt>{label}</dt><dd>{state === 'ready' ? v : '–'}</dd></div>;
  return <section className="work-overview" aria-labelledby="work-overview-title">
    <h2 id="work-overview-title" className="sr-only">{lang === 'fr' ? 'Vue d’ensemble' : 'Overview'}</h2>
    <div className="toolbar"><p className="toolbar-text">{t.overviewIntro}</p>
      <div className="toolbar-actions"><button className="secondary" onClick={() => onNavigate('planning')}>{t.openPlanning}</button><button className="primary" onClick={() => onNavigate('interventions')}>{t.seeAll}</button></div></div>
    <dl className="stats stats-8">{[stat(handle.length, t.toHandle), stat(today.length, t.today), stat(count(['IN_PROGRESS']), t.inProgress), stat(count(['UNDER_REVIEW']), t.toReview),
      stat(count(['REWORK']), t.rework), stat(count(['REQUESTED', 'QUOTE_SUBMITTED']), t.quotes), stat(count(['PLANNED']), t.toAssign), stat(items.reduce((n, i) => n + i.open_anomalies, 0), t.anomalies)]}</dl>
    {state === 'error' && <LoadError text={t.loadError} retry={reload} t={t} />}
    <div className="dashboard-grid">
      <section className="board" aria-labelledby="handle-title"><h3 id="handle-title" className="board-title">{t.toHandle}</h3>
        {state === 'loading' ? <Skeleton t={t} /> : handle.length ? <ul className="work-list">{handle.slice(0, 8).map(i => <Row key={i.id} i={i} lang={lang} onOpen={onOpen} partner={partner} />)}</ul> : <div className="empty"><p>{t.nothingToHandle}</p></div>}
      </section>
      <section className="board" aria-labelledby="today-title"><h3 id="today-title" className="board-title">{t.today}</h3>
        {state === 'loading' ? <Skeleton t={t} /> : today.length ? <ul className="work-list">{today.map(i => <Row key={i.id} i={i} lang={lang} onOpen={onOpen} partner={partner} />)}</ul> : <div className="empty"><p>{t.nothingToday}</p></div>}
      </section>
    </div>
  </section>;
}

/* --------------------------------------------------------------- planning */

const mondayOf = (d: Date) => { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); const w = (x.getUTCDay() + 6) % 7; return new Date(x.getTime() - w * 86400000); };
export function Planning({ org, lang, onOpen }: { org: Org; lang: Lang; onOpen: (id: string) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [monday, setMonday] = useState(() => mondayOf(new Date()));
  const from = new Date(monday.getTime() - 86400000).toISOString(), to = new Date(monday.getTime() + 8 * 86400000).toISOString();
  const { items, state, reload } = useInterventions(org, from, to);
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getTime() + i * 86400000).toISOString().slice(0, 10));
  const todayKey = new Date().toISOString().slice(0, 10);
  const label = monday.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return <section className="planning" aria-labelledby="planning-title">
    <h2 id="planning-title" className="sr-only">{lang === 'fr' ? 'Planning' : 'Planning'}</h2>
    <div className="toolbar"><p className="planning-week">{fill(t.week, { d: label })}</p>
      <div className="toolbar-actions"><button className="secondary small" aria-label={t.prev} onClick={() => setMonday(m => new Date(m.getTime() - 7 * 86400000))}><BackIcon /></button>
        <button className="secondary small" onClick={() => setMonday(mondayOf(new Date()))}>{t.thisWeek}</button>
        <button className="secondary small" aria-label={t.next} onClick={() => setMonday(m => new Date(m.getTime() + 7 * 86400000))}><ChevronIcon /></button></div></div>
    {state === 'error' && <LoadError text={t.loadError} retry={reload} t={t} />}
    <div className="week">{days.map((d, idx) => {
      const list = items.filter(i => dayKey(i.starts_at, i.timezone) === d && i.status !== 'CANCELLED');
      return <section key={d} className={d === todayKey ? 'day is-today' : 'day'} aria-label={new Date(d + 'T12:00:00Z').toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}>
        <header className="day-head"><span>{t.days[idx]}</span><strong>{Number(d.slice(8))}</strong></header>
        {state === 'loading' ? <span className="skeleton-row day-skeleton" /> : list.length ? <ul className="day-list">{list.map(i => <li key={i.id}>
          <button className={`visit visit-${i.kind.toLowerCase()}`} onClick={() => onOpen(i.id)}>
            <span className="visit-time">{when(i.starts_at, i.timezone, lang, 'time')}–{when(i.ends_at, i.timezone, lang, 'time')}</span>
            <strong>{i.title}</strong>
            <span className="muted">{i.zones.join(', ')}</span>
            <span className="visit-foot">{statusBadge(i.status, lang)}{i.agents[0] && <span className="muted">{i.agents.map(a => a.name).join(', ')}</span>}</span>
          </button></li>)}</ul> : <p className="day-empty">{t.noVisit}</p>}
      </section>;
    })}</div>
  </section>;
}

/* ------------------------------------------------------------- the list */

type Programme = { id: string; title: string; weekdays: number[]; start_date: string; end_date: string; start_time: string; end_time: string; site_name: string; provider_name: string; client_name: string; passages: number; accepted: number; team: string[] };

export function InterventionsPage({ org, lang, admin, onOpen }: { org: Org; lang: Lang; admin: boolean; onOpen: (id: string) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [tab, setTab] = useState<'list' | 'programmes'>('list'), [form, setForm] = useState<'maintenance' | 'programme' | null>(null), [notice, setNotice] = useState('');
  const [period, setPeriod] = useState<'7' | '30' | 'all'>('30'), [status, setStatus] = useState(''), [kind, setKind] = useState(''), [q, setQ] = useState('');
  const range = useMemo(() => period === 'all' ? {} : period === '7' ? { from: new Date(Date.now() - 86400000).toISOString(), to: new Date(Date.now() + 7 * 86400000).toISOString() } : { from: new Date(Date.now() - 30 * 86400000).toISOString(), to: new Date(Date.now() + 30 * 86400000).toISOString() }, [period]);
  const { items, state, reload } = useInterventions(org, range.from, range.to);
  const clientManager = !admin && org.kind === 'CLIENT' && (org.roles ?? []).includes('CLIENT_MANAGER');
  const needle = q.trim().toLocaleLowerCase(lang);
  const visible = items.filter(i => (!status || i.status === status) && (!kind || i.kind === kind) && (!needle || [ref(i.number), i.title, i.zones.join(' '), i.provider_name, i.client_name].join(' ').toLocaleLowerCase(lang).includes(needle)));
  const partner = org.kind === 'CLIENT' ? 'provider' : 'client';
  return <section className="interventions" aria-labelledby="interventions-title">
    <h2 id="interventions-title" className="sr-only">{t.interventions}</h2>
    <div className="toolbar">
      <div className="segmented" role="group" aria-label={t.interventions}>
        <button type="button" aria-pressed={tab === 'list'} onClick={() => setTab('list')}>{t.interventions}</button>
        <button type="button" aria-pressed={tab === 'programmes'} onClick={() => setTab('programmes')}>{t.programmes}</button></div>
      {clientManager && <div className="toolbar-actions"><button className="secondary" onClick={() => { setForm('programme'); setNotice(''); }}><PlusIcon />{t.newProgramme}</button><button className={form ? 'secondary' : 'primary'} onClick={() => { setForm('maintenance'); setNotice(''); }}><PlusIcon />{t.newMaintenance}</button></div>}
    </div>
    {notice && <p className="alert alert-success" role="status"><CheckIcon />{notice}</p>}
    <div className={form ? 'workspace has-panel' : 'workspace'} data-detail={form ? 'open' : 'closed'}>
      <div className="pane-list">
        {tab === 'programmes' ? <Programmes org={org} lang={lang} admin={admin} />
          : <>
            <div className="filters">
              <label className="filter-search">{t.search}<span className="search-field"><SearchIcon /><input type="search" value={q} placeholder={t.searchHint} onChange={e => setQ(e.target.value)} /></span></label>
              <label>{t.status}<select aria-label={t.status} value={status} onChange={e => setStatus(e.target.value)}><option value="">{t.allStatuses}</option>{Object.entries(statuses).map(([k, v]) => <option key={k} value={k}>{v[lang === 'fr' ? 0 : 1]}</option>)}</select></label>
              <label>{t.period}<select aria-label={t.period} value={period} onChange={e => setPeriod(e.target.value as '7')}><option value="7">{t.p7}</option><option value="30">{t.p30}</option><option value="all">{t.pAll}</option></select></label>
              <label>{t.kind}<select aria-label={t.kind} value={kind} onChange={e => setKind(e.target.value)}><option value="">{t.allKinds}</option><option value="CLEANING">{t.CLEANING}</option><option value="MAINTENANCE">{t.MAINTENANCE}</option></select></label>
            </div>
            {state === 'error' ? <LoadError text={t.loadError} retry={reload} t={t} /> : state === 'loading' ? <Skeleton t={t} />
              : !visible.length ? <div className="empty"><p>{t.empty}</p></div>
              : <div className="table-card"><table className="audit-table work-table">
                  <thead><tr><th scope="col">{t.number}</th><th scope="col">{t.title}</th><th scope="col">{t.slot}</th><th scope="col">{partner === 'provider' ? t.partner : t.client}</th><th scope="col">{t.team}</th><th scope="col">{t.status}</th></tr></thead>
                  <tbody>{visible.map(i => <tr key={i.id} className="clickable" onClick={() => onOpen(i.id)}>
                    <td data-label={t.number}><button className="link-button work-ref" onClick={e => { e.stopPropagation(); onOpen(i.id); }}>{ref(i.number)}</button></td>
                    <td data-label={t.title}><span className="people-text"><strong>{i.title}{i.priority === 'URGENT' && <span className="state state-red tag-inline">{t.urgent}</span>}</strong><span className="muted">{t[i.kind]}{i.programme_id ? ` · ${t.from}` : ''} · {i.zones.join(', ')}</span></span></td>
                    <td data-label={t.slot} className="audit-when">{slot(i, lang)}</td>
                    <td data-label={partner === 'provider' ? t.partner : t.client}>{partner === 'provider' ? i.provider_name : i.client_name}</td>
                    <td data-label={t.team}>{i.agents.length ? i.agents.map(a => a.name).join(', ') : <span className="muted">{t.none}</span>}</td>
                    <td data-label={t.status}>{statusBadge(i.status, lang)}{i.open_anomalies > 0 && <span className="state state-red tag-inline" title={t.anomalies}>{i.open_anomalies} ⚠</span>}</td>
                  </tr>)}</tbody></table></div>}
          </>}
      </div>
      {form && <aside className="pane-panel">{form === 'maintenance'
        ? <MaintenanceForm org={org} lang={lang} onClose={() => setForm(null)} onDone={() => { setForm(null); setNotice(t.mtCreated); reload(); }} />
        : <ProgrammeForm org={org} lang={lang} onClose={() => setForm(null)} onDone={n => { setForm(null); setNotice(fill(t.prCreated, { n })); setTab('programmes'); reload(); }} />}</aside>}
    </div>
  </section>;
}

function Programmes({ org, lang, admin }: { org: Org; lang: Lang; admin: boolean }) {
  const t = lang === 'fr' ? fr : en;
  const [rows, setRows] = useState<Programme[]>([]), [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'), [attempt, setAttempt] = useState(0), [open, setOpen] = useState(''), [notice, setNotice] = useState('');
  useEffect(() => { let a = true; setState('loading'); api('programmes', undefined, org.id).then(r => { if (a) { setRows(r); setState('ready'); } }).catch(() => { if (a) setState('error'); }); return () => { a = false; }; }, [org.id, attempt]);
  const providerManager = !admin && org.kind === 'PROVIDER' && (org.roles ?? []).includes('PROVIDER_MANAGER');
  if (state === 'loading') return <Skeleton t={t} />;
  if (state === 'error') return <LoadError text={t.loadError} retry={() => setAttempt(n => n + 1)} t={t} />;
  if (!rows.length) return <div className="empty"><p>{t.noProgramme}</p></div>;
  return <>
    {notice && <p className="alert alert-success" role="status"><CheckIcon />{notice}</p>}
    <ul className="provider-cards">{rows.map(p => <li key={p.id} className="provider-card">
      <div className="people-text"><strong>{p.title}</strong><span className="muted">{p.site_name} · {org.kind === 'CLIENT' ? p.provider_name : p.client_name}</span></div>
      <p className="provider-services">{p.weekdays.map(d => t.days[d - 1]).join(', ')} · {p.start_time}–{p.end_time}</p>
      <p className="provider-services muted">{new Date(p.start_date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { timeZone: 'UTC' })} – {new Date(p.end_date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { timeZone: 'UTC' })}</p>
      <p className="provider-links"><strong>{p.passages}</strong> {t.passages.toLowerCase()} · {fill(t.acceptedOf, { a: p.accepted, n: p.passages })}</p>
      {providerManager && (open === p.id ? <TeamForm org={org} lang={lang} url={`programmes/${p.id}/team`} onCancel={() => setOpen('')} onDone={r => { setOpen(''); setNotice(fill(t.teamSet, { n: r.assigned, s: r.skipped ? fill(t.skipped, { n: r.skipped }) : '' })); setAttempt(n => n + 1); }} />
        : <div><button className="secondary small" onClick={() => setOpen(p.id)}>{t.setTeam}</button></div>)}
    </li>)}</ul>
  </>;
}

/* ------------------------------------------------------------ forms */

type Site = { id: string; name: string; timezone: string };
type Zone = { id: string; parent_id: string | null; code: string; name: string; kind: string };
function useSiteChoices(org: Org) {
  const [sites, setSites] = useState<Site[]>([]), [providers, setProviders] = useState<{ id: string; name: string; site_ids: string[] }[]>([]);
  useEffect(() => { Promise.all([api('sites', undefined, org.id), api('organization/directory', undefined, org.id)]).then(([s, p]) => { setSites(s); setProviders(p); }).catch(() => undefined); }, [org.id]);
  return { sites, providers };
}
function ZonePicker({ org, site, value, onChange, t }: { org: Org; site: string; value: string[]; onChange: (v: string[]) => void; t: T }) {
  const [zones, setZones] = useState<Zone[]>([]);
  useEffect(() => { if (!site) return; setZones([]); api(`sites/${site}/zones`, undefined, org.id).then(setZones).catch(() => setZones([])); }, [site, org.id]);
  const path = (z: Zone) => { const out: string[] = []; let p = z.parent_id; const seen = new Set<string>(); while (p && !seen.has(p)) { seen.add(p); const parent = zones.find(x => x.id === p); if (!parent) break; out.unshift(parent.name); p = parent.parent_id; } return out; };
  return <fieldset className="zone-picker"><legend>{t.prZones}</legend>
    <ul className="checks">{zones.map(z => <li key={z.id}><label className="check"><input type="checkbox" checked={value.includes(z.id)} onChange={e => onChange(e.target.checked ? [...value, z.id] : value.filter(v => v !== z.id))} />
      <span><strong>{z.name}</strong><span className="muted">{[...path(z), z.code].join(' › ')}</span></span></label></li>)}</ul></fieldset>;
}
function Panel({ title, onClose, children, t }: { title: string; onClose: () => void; children: React.ReactNode; t: T }) {
  return <div className="panel"><div className="panel-head"><h2 tabIndex={-1} ref={h => h?.focus()}>{title}</h2><button type="button" className="icon-button" aria-label={t.closePanel} onClick={onClose}><CloseIcon /></button></div>{children}</div>;
}
function MaintenanceForm({ org, lang, onClose, onDone }: { org: Org; lang: Lang; onClose: () => void; onDone: () => void }) {
  const t = lang === 'fr' ? fr : en; const { sites, providers } = useSiteChoices(org);
  const [site, setSite] = useState(''), [zones, setZones] = useState<string[]>([]), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { if (!site && sites[0]) setSite(sites[0].id); }, [sites, site]);
  const linked = providers.filter(p => p.site_ids.includes(site));
  return <Panel title={t.newMaintenance} onClose={onClose} t={t}><form className="panel-form" onSubmit={e => {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    setBusy(true); setError('');
    api('interventions', { title: f.get('title'), description: f.get('description'), siteId: site, providerId: f.get('providerId'), zoneIds: zones, startsAt: f.get('startsAt'), endsAt: f.get('endsAt'),
      priority: f.get('urgent') ? 'URGENT' : 'NORMAL', quoteRequired: Boolean(f.get('quote')), tasks: String(f.get('tasks') ?? '').split('\n').map(s => s.trim()).filter(Boolean) }, org.id)
      .then(onDone).catch(err => setError(say(err, lang))).finally(() => setBusy(false));
  }}><div className="panel-body">
    {error && <div className="alert alert-error" role="alert"><AlertIcon /><p>{error}</p></div>}
    <label>{t.prTitle}<input name="title" required maxLength={200} /></label>
    <label>{t.description}<textarea name="description" maxLength={4000} /></label>
    <label>{t.prSite}<select aria-label={t.prSite} value={site} onChange={e => { setSite(e.target.value); setZones([]); }}>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label>{t.prProvider}<select aria-label={t.prProvider} name="providerId" required>{linked.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>{!linked.length && <small>{t.noLinked}</small>}</label>
    {site && <ZonePicker org={org} site={site} value={zones} onChange={setZones} t={t} />}
    <div className="form-row"><label>{t.mtStarts}<input name="startsAt" type="datetime-local" required /></label><label>{t.mtEnds}<input name="endsAt" type="datetime-local" required /></label></div>
    <label className="check"><input type="checkbox" name="quote" /><span><strong>{t.mtQuote}</strong><span className="muted">{t.mtQuoteHelp}</span></span></label>
    <label className="check"><input type="checkbox" name="urgent" /><span><strong>{t.mtPriority}</strong></span></label>
    <label>{t.prTasks}<textarea name="tasks" rows={4} /></label>
  </div><div className="panel-foot"><button type="button" className="secondary" disabled={busy} onClick={onClose}>{lang === 'fr' ? 'Annuler' : 'Cancel'}</button><button className="primary" disabled={busy || !linked.length}>{t.send}</button></div></form></Panel>;
}
function ProgrammeForm({ org, lang, onClose, onDone }: { org: Org; lang: Lang; onClose: () => void; onDone: (n: number) => void }) {
  const t = lang === 'fr' ? fr : en; const { sites, providers } = useSiteChoices(org);
  const [site, setSite] = useState(''), [zones, setZones] = useState<string[]>([]), [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { if (!site && sites[0]) setSite(sites[0].id); }, [sites, site]);
  const linked = providers.filter(p => p.site_ids.includes(site));
  return <Panel title={t.newProgramme} onClose={onClose} t={t}><form className="panel-form" onSubmit={e => {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    setBusy(true); setError('');
    api('programmes', { title: f.get('title'), description: f.get('description'), siteId: site, providerId: f.get('providerId'), zoneIds: zones, weekdays: days, startDate: f.get('startDate'), endDate: f.get('endDate'),
      startTime: f.get('startTime'), endTime: f.get('endTime'), tasks: String(f.get('tasks') ?? '').split('\n').map(s => s.trim()).filter(Boolean) }, org.id)
      .then(r => onDone(r.passages)).catch(err => setError(say(err, lang))).finally(() => setBusy(false));
  }}><div className="panel-body">
    <p className="panel-desc">{t.prHelp}</p>
    {error && <div className="alert alert-error" role="alert"><AlertIcon /><p>{error}</p></div>}
    <label>{t.prTitle}<input name="title" required maxLength={200} /></label>
    <label>{t.prSite}<select aria-label={t.prSite} value={site} onChange={e => { setSite(e.target.value); setZones([]); }}>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label>{t.prProvider}<select aria-label={t.prProvider} name="providerId" required>{linked.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>{!linked.length && <small>{t.noLinked}</small>}</label>
    {site && <ZonePicker org={org} site={site} value={zones} onChange={setZones} t={t} />}
    <fieldset><legend>{t.prDays}</legend><div className="day-chips">{t.days.map((d, i) => <label key={d} className="chip-check"><input type="checkbox" checked={days.includes(i + 1)} onChange={e => setDays(e.target.checked ? [...days, i + 1].sort() : days.filter(x => x !== i + 1))} /><span>{d}</span></label>)}</div></fieldset>
    <div className="form-row"><label>{t.prStartDate}<input name="startDate" type="date" required /></label><label>{t.prEndDate}<input name="endDate" type="date" required /></label></div>
    <div className="form-row"><label>{t.prStartTime}<input name="startTime" type="time" required defaultValue="06:00" /></label><label>{t.prEndTime}<input name="endTime" type="time" required defaultValue="07:30" /></label></div>
    <label>{t.prTasks}<textarea name="tasks" rows={5} /></label>
  </div><div className="panel-foot"><button type="button" className="secondary" disabled={busy} onClick={onClose}>{lang === 'fr' ? 'Annuler' : 'Cancel'}</button><button className="primary" disabled={busy || !linked.length}>{t.save}</button></div></form></Panel>;
}
function TeamForm({ org, lang, url, onCancel, onDone }: { org: Org; lang: Lang; url: string; onCancel: () => void; onDone: (r: { assigned: number; skipped: number }) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [agents, setAgents] = useState<{ membership_id: string; display_name: string; roles: string[]; active: boolean }[]>([]), [team, setTeam] = useState<string[]>([]), [lead, setLead] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { api('organization/members', undefined, org.id).then(m => setAgents(m.filter((x: { roles: string[]; active: boolean }) => x.active && x.roles.includes('FIELD_AGENT')))).catch(() => undefined); }, [org.id]);
  return <form className="link-form" onSubmit={e => {
    e.preventDefault(); if (!team.length || !lead) { setError(t.chooseAgents); return; }
    setBusy(true); setError('');
    api(url, { membershipIds: team, leadId: lead }, org.id).then(r => onDone(r ?? { assigned: 0, skipped: 0 })).catch(err => setError(say(err, lang))).finally(() => setBusy(false));
  }}>
    {error && <div className="alert alert-error" role="alert"><AlertIcon /><p>{error}</p></div>}
    <fieldset><legend>{t.agents}</legend><ul className="checks">{agents.map(a => <li key={a.membership_id}><label className="check"><input type="checkbox" checked={team.includes(a.membership_id)}
      onChange={e => { const next = e.target.checked ? [...team, a.membership_id] : team.filter(x => x !== a.membership_id); setTeam(next); if (!next.includes(lead)) setLead(next[0] ?? ''); }} /><span><strong>{a.display_name}</strong></span></label></li>)}</ul></fieldset>
    <label>{t.lead}<select aria-label={t.lead} value={lead} onChange={e => setLead(e.target.value)}><option value="">—</option>{agents.filter(a => team.includes(a.membership_id)).map(a => <option key={a.membership_id} value={a.membership_id}>{a.display_name}</option>)}</select></label>
    <div className="toolbar-actions"><button type="button" className="secondary" disabled={busy} onClick={onCancel}>{lang === 'fr' ? 'Annuler' : 'Cancel'}</button><button className="primary" disabled={busy}>{t.assignTeam}</button></div>
  </form>;
}

/* ------------------------------------------------------------- the detail */

type Detail = Item & { description: string | null; quote_required: boolean; report_note: string | null; started_at: string | null; submitted_at: string | null; accepted_at: string | null; round: number; created_by_name: string; programme_title: string | null;
  zones: never; zoneList?: never;
  tasks: { id: string; position: number; label: string; status: string; note: string | null; rework: boolean; done_by: string | null; done_at: string | null }[];
  agents: never; crew?: never; actions: string[];
  quotes: { id: string; amount_xaf: string; delay_days: number; description: string; status: string; reason: string | null; created_at: string; created_by: string; decided_by: string | null }[];
  photos: { id: string; task_id: string | null; phase: string; round: number; created_at: string; uploaded_by: string }[];
  anomalies: { id: string; title: string; description: string | null; status: string; resolution: string | null; closing_note: string | null; created_at: string; zone_name: string | null; created_by: string; closed_by: string | null }[];
  events: { id: string; action: string; reason: string | null; created_at: string; actor: string; to_status: string | null }[] };
type Raw = Omit<Detail, 'zones' | 'agents'> & { zones: { id: string; code: string; name: string; kind: string; path: string[] }[]; agents: { membership_id: string; lead: boolean; display_name: string; login: string }[] };

/** A protected photo: fetched with the organization header, shown from memory. */
function Photo({ org, id, photo, alt }: { org: Org; id: string; photo: string; alt: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let url = '', active = true;
    fetch(`/api/v1/interventions/${id}/photos/${photo}`, { headers: { 'X-Organization-Id': org.id }, credentials: 'same-origin' }).then(r => r.ok ? r.blob() : Promise.reject()).then(b => { if (active) { url = URL.createObjectURL(b); setSrc(url); } }).catch(() => undefined);
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [id, photo, org.id]);
  return src ? <img className="photo" src={src} alt={alt} loading="lazy" /> : <span className="photo photo-loading" aria-hidden="true" />;
}

export function InterventionDetail({ org, id, lang, onBack }: { org: Org; id: string; lang: Lang; onBack: () => void }) {
  const t = lang === 'fr' ? fr : en;
  const [d, setD] = useState<Raw | null>(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [open, setOpen] = useState<'' | 'quote' | 'refuse' | 'assign' | 'rework' | 'cancel' | 'anomaly' | string>('');
  useEffect(() => { let a = true; setFailed(false); api(`interventions/${id}`, undefined, org.id).then(r => { if (a) setD(r); }).catch(() => { if (a) setFailed(true); }); return () => { a = false; }; }, [id, org.id, attempt]);
  if (failed) return <LoadError text={t.loadError} retry={() => setAttempt(n => n + 1)} t={t} />;
  if (!d) return <Skeleton t={t} />;
  const can = (a: string) => d.actions.includes(a);
  const tz = d.timezone;
  const run = (path: string, body: unknown, done?: string) => {
    setBusy(true); setError(''); setNotice('');
    return api(`interventions/${id}/${path}`, body, org.id).then(() => { setOpen(''); if (done) setNotice(done); setAttempt(n => n + 1); }).catch(e => setError(say(e, lang))).finally(() => setBusy(false));
  };
  const upload = (file: File, phase: 'BEFORE' | 'AFTER', task: string) => {
    setBusy(true); setError('');
    fetch(`/api/v1/interventions/${id}/photos?phase=${phase}&taskId=${task}`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': file.type, 'X-Traceops': 'request', 'X-Organization-Id': org.id }, body: file })
      .then(async r => { if (!r.ok) { const b = await r.json().catch(() => ({})); throw new ApiError(typeof b.message === 'string' ? b.message : 'error'); } setAttempt(n => n + 1); })
      .catch(e => setError(say(e, lang))).finally(() => setBusy(false));
  };
  const download = () => {
    fetch(`/api/v1/interventions/${id}/report.pdf?lang=${lang}`, { headers: { 'X-Organization-Id': org.id }, credentials: 'same-origin' }).then(r => r.ok ? r.blob() : Promise.reject()).then(b => {
      const url = URL.createObjectURL(b), a = document.createElement('a'); a.href = url; a.download = `TRACEOPS-${ref(d.number)}.pdf`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    }).catch(() => setError(say(new ApiError('error'), lang)));
  };
  const form = (key: string, submit: (f: FormData) => void, children: React.ReactNode, label: string, primary = true) => open === key
    ? <form className="link-form" onSubmit={e => { e.preventDefault(); submit(new FormData(e.currentTarget)); }}>{children}
        <div className="toolbar-actions"><button type="button" className="secondary" disabled={busy} onClick={() => setOpen('')}>{lang === 'fr' ? 'Annuler' : 'Cancel'}</button><button className={primary ? 'primary' : 'danger'} disabled={busy}>{label}</button></div></form>
    : null;
  const pending = d.tasks.filter(x => x.status === 'TODO').length;
  const waiting = t.waiting[d.status];
  const photosOf = (task: string | null, phase: string) => d.photos.filter(p => p.task_id === task && p.phase === phase);

  return <section className="detail" aria-labelledby="detail-title">
    <button className="back-link" onClick={onBack}><BackIcon />{t.back}</button>
    <header className="detail-top">
      <div className="detail-title-block">
        <p className="detail-ref">{ref(d.number)} · {t[d.kind]}{d.programme_title ? ` · ${t.from} « ${d.programme_title} »` : ''}</p>
        <h2 id="detail-title">{d.title}</h2>
        <p className="detail-meta">{statusBadge(d.status, lang)}{d.priority === 'URGENT' && <span className="state state-red">{t.urgent}</span>}<span className="muted">{d.site_name} · {d.client_name} → {d.provider_name}</span></p>
      </div>
      <button className="secondary" onClick={download}>{t.pdf}</button>
    </header>
    {error && <div className="alert alert-error" role="alert"><AlertIcon /><p>{error}</p></div>}
    {notice && <p className="alert alert-success" role="status"><CheckIcon />{notice}</p>}

    <div className="detail-grid">
      <div className="detail-main">
        <section className="next-step" aria-labelledby="next-title">
          <h3 id="next-title">{t.nextStep}</h3>
          {!['QUOTE', 'DECIDE_QUOTE', 'ASSIGN', 'START', 'SUBMIT', 'REVIEW'].some(can) && <p className="muted">{waiting ? `${t.waitingFor} ${waiting}.` : t.noAction}</p>}
          {can('QUOTE') && (form('quote', f => void run('quote', { amount: Number(f.get('amount')), delayDays: Number(f.get('delay')), description: f.get('description') }), <>
            <div className="form-row"><label>{t.amount}<input name="amount" type="number" min={1} step={1} required /></label><label>{t.delay}<input name="delay" type="number" min={0} max={365} required defaultValue={2} /></label></div>
            <label>{t.quoteDesc}<textarea name="description" required maxLength={4000} /></label></>, t.sendQuote) ?? <button className="primary" onClick={() => setOpen('quote')}>{t.sendQuote}</button>)}
          {can('DECIDE_QUOTE') && (open === 'refuse' ? form('refuse', f => void run('quote/decision', { accept: false, reason: f.get('reason') }), <label>{t.reason}<textarea name="reason" required maxLength={1000} /></label>, t.refuseQuote, false)
            : <div className="toolbar-actions"><button className="secondary" disabled={busy} onClick={() => setOpen('refuse')}>{t.refuseQuote}</button><button className="primary" disabled={busy} onClick={() => void run('quote/decision', { accept: true })}>{t.acceptQuote}</button></div>)}
          {can('ASSIGN') && (open === 'assign' ? <TeamForm org={org} lang={lang} url={`interventions/${id}/assign`} onCancel={() => setOpen('')} onDone={() => { setOpen(''); setAttempt(n => n + 1); }} /> : <button className="primary" onClick={() => setOpen('assign')}>{t.assignTeam}</button>)}
          {can('START') && <button className="primary" disabled={busy} onClick={() => void run('start', {})}>{t.start}</button>}
          {can('SUBMIT') && (form('submit', f => void run('submit', { note: f.get('note') }), <label>{t.reportNote}<textarea name="note" maxLength={4000} defaultValue={d.report_note ?? ''} /></label>, t.submit)
            ?? <div className="submit-row"><button className="primary" disabled={busy || pending > 0} onClick={() => setOpen('submit')}>{t.submit}</button>{pending > 0 && <small>{t.submitHelp}</small>}</div>)}
          {can('REVIEW') && (open === 'rework' ? form('rework', f => void run('review', { decision: 'REWORK', reason: f.get('reason'), taskIds: f.getAll('task') }), <>
              <fieldset><legend>{t.reworkTasks}</legend><p className="panel-desc">{t.reworkHelp}</p><ul className="checks">{d.tasks.map(x => <li key={x.id}><label className="check"><input type="checkbox" name="task" value={x.id} /><span><strong>{x.label}</strong></span></label></li>)}</ul></fieldset>
              <label>{t.reason}<textarea name="reason" required maxLength={2000} /></label></>, t.askRework, false)
            : open === 'accept' ? form('accept', f => void run('review', { decision: 'ACCEPT', reason: f.get('reason') }), <><label>{t.acceptNote}<textarea name="reason" maxLength={2000} /></label>{d.anomalies.some(a => a.status !== 'CLOSED') && <p className="board-note"><AlertIcon />{t.anomalyNotice}</p>}</>, t.acceptWork)
            : <div className="toolbar-actions"><button className="secondary" onClick={() => setOpen('rework')}>{t.askRework}</button><button className="primary" onClick={() => setOpen('accept')}>{t.acceptWork}</button></div>)}
          {can('CANCEL') && (form('cancel', f => void run('cancel', { reason: f.get('reason') }), <label>{t.reason}<textarea name="reason" required maxLength={1000} /></label>, t.confirmCancel, false)
            ?? <button className="link-button danger-link" onClick={() => setOpen('cancel')}>{t.cancel}</button>)}
        </section>

        <section className="detail-section" aria-labelledby="tasks-title">
          <h3 id="tasks-title">{t.tasks} <span className="muted">{d.tasks.filter(x => x.status !== 'TODO').length}/{d.tasks.length}</span></h3>
          <ol className="task-list">{d.tasks.map(x => <li key={x.id} className={`task task-${x.status.toLowerCase()}`}>
            <div className="task-head"><span className="task-mark" aria-hidden="true">{x.status === 'DONE' ? <CheckIcon /> : x.status === 'IMPOSSIBLE' ? <CloseIcon /> : null}</span>
              <span className="task-text"><strong>{x.label}</strong><span className="muted">{x.status === 'DONE' ? t.done : x.status === 'IMPOSSIBLE' ? t.impossible : t.todo}{x.rework ? ` · ${t.reworkFlag}` : ''}{x.done_by ? ` · ${x.done_by}, ${when(x.done_at!, tz, lang)}` : ''}</span>{x.note && <span className="task-note">{x.note}</span>}</span></div>
            <div className="task-photos">{(['BEFORE', 'AFTER'] as const).map(ph => photosOf(x.id, ph).map(p => <figure key={p.id}><Photo org={org} id={id} photo={p.id} alt={`${ph === 'BEFORE' ? t.before : t.after} — ${x.label}`} /><figcaption>{ph === 'BEFORE' ? t.before : t.after}</figcaption></figure>))}</div>
            {can('TASKS') && <div className="task-actions">
              {x.status !== 'DONE' && <button className="secondary small" disabled={busy} onClick={() => void run(`tasks/${x.id}`, { status: 'DONE' })}><CheckIcon />{t.done}</button>}
              {x.status === 'TODO' && (open === 'imp-' + x.id ? null : <button className="secondary small" disabled={busy} onClick={() => setOpen('imp-' + x.id)}>{t.impossible}</button>)}
              {x.status !== 'TODO' && <button className="link-button" disabled={busy} onClick={() => void run(`tasks/${x.id}`, { status: 'TODO' })}>{t.reopen}</button>}
              {(['BEFORE', 'AFTER'] as const).map(ph => <label key={ph} className="upload secondary small"><input type="file" accept="image/jpeg,image/png" capture="environment" disabled={busy} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f, ph, x.id); }} />{ph === 'BEFORE' ? t.addBefore : t.addAfter}</label>)}
              {form('imp-' + x.id, f => void run(`tasks/${x.id}`, { status: 'IMPOSSIBLE', note: f.get('note') }), <label>{t.impossibleNote}<textarea name="note" required maxLength={2000} /></label>, t.impossible, false)}
            </div>}
          </li>)}</ol>
          {d.report_note && <div className="report-note"><h4>{t.reportNote}</h4><p>{d.report_note}</p></div>}
        </section>

        <section className="detail-section" aria-labelledby="anomalies-title">
          <h3 id="anomalies-title">{t.anomaliesTitle}</h3>
          {d.anomalies.length ? <ul className="anomaly-list">{d.anomalies.map(a => <li key={a.id} className={`anomaly anomaly-${a.status.toLowerCase()}`}>
            <div className="anomaly-head"><strong>{a.title}</strong><span className={`state ${a.status === 'CLOSED' ? 'state-green' : a.status === 'OPEN' ? 'state-red' : 'state-amber'}`}>{t[a.status as 'OPEN']}</span></div>
            <p className="muted">{[a.zone_name, a.created_by, when(a.created_at, tz, lang)].filter(Boolean).join(' · ')}</p>
            {a.description && <p>{a.description}</p>}
            {a.resolution && <p><span className="muted">{t.resolution} : </span>{a.resolution}</p>}
            {a.closing_note && <p><span className="muted">{t.closingNote} : </span>{a.closing_note} — {a.closed_by}</p>}
            {a.status !== 'CLOSED' && <div className="toolbar-actions">
              {can('PROPOSE_RESOLUTION') && (form('prop-' + a.id, f => void run(`anomalies/${a.id}/propose`, { resolution: f.get('resolution') }), <label>{t.resolution}<textarea name="resolution" required maxLength={2000} /></label>, t.propose) ?? <button className="secondary small" onClick={() => setOpen('prop-' + a.id)}>{t.propose}</button>)}
              {can('CLOSE_ANOMALY') && (form('close-' + a.id, f => void run(`anomalies/${a.id}/close`, { note: f.get('note') }), <label>{t.closingNote}<textarea name="note" required maxLength={2000} /></label>, t.close) ?? <button className="secondary small" onClick={() => setOpen('close-' + a.id)}>{t.close}</button>)}
            </div>}
          </li>)}</ul> : <p className="muted">{t.noAnomaly}</p>}
          {can('REPORT_ANOMALY') && (form('anomaly', f => void run('anomalies', { title: f.get('title'), description: f.get('description'), zoneId: f.get('zoneId') || undefined }), <>
            <label>{t.anomalyTitle}<input name="title" required maxLength={200} /></label>
            <label>{t.zone}<select aria-label={t.zone} name="zoneId"><option value="">{t.anyZone}</option>{d.zones.map(z => <option key={z.id} value={z.id}>{z.name} ({z.code})</option>)}</select></label>
            <label>{t.description}<textarea name="description" maxLength={4000} /></label></>, t.reportAnomaly) ?? <button className="secondary small" onClick={() => setOpen('anomaly')}><PlusIcon />{t.reportAnomaly}</button>)}
        </section>
      </div>

      <aside className="detail-side">
        <dl className="facts">
          <div><dt>{t.planned}</dt><dd>{when(d.starts_at, tz, lang)} – {when(d.ends_at, tz, lang)}</dd></div>
          <div><dt>{t.places}</dt><dd>{d.zones.map(z => <span key={z.id} className="fact-place">{[...z.path, z.name].join(' › ')} <span className="zone-code">{z.code}</span></span>)}</dd></div>
          <div><dt>{t.team}</dt><dd>{d.agents.length ? d.agents.map(a => <span key={a.membership_id} className="agent-chip static"><Avatar name={a.display_name} seed={a.login} size="sm" /><span>{a.display_name}{a.lead ? ` · ${t.lead.toLowerCase()}` : ''}</span></span>) : t.none}</dd></div>
          {d.started_at && <div><dt>{t.started}</dt><dd>{when(d.started_at, tz, lang)}</dd></div>}
          {d.submitted_at && <div><dt>{t.submitted}</dt><dd>{when(d.submitted_at, tz, lang)}</dd></div>}
          {d.accepted_at && <div><dt>{t.accepted}</dt><dd>{when(d.accepted_at, tz, lang)}</dd></div>}
          {d.round > 1 && <div><dt>{t.round}</dt><dd>{d.round}</dd></div>}
          <div><dt>{t.createdBy}</dt><dd>{d.created_by_name}</dd></div>
        </dl>
        {d.description && <p className="detail-desc">{d.description}</p>}
        {(d.quote_required || d.quotes.length > 0) && <section className="side-block"><h3>{t.quote}</h3>{d.quotes.length ? d.quotes.map(q => <div key={q.id} className="quote">
          <p><strong>{Number(q.amount_xaf).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB')} FCFA</strong> · {q.delay_days} {lang === 'fr' ? 'j' : 'd'} <span className={`state ${q.status === 'ACCEPTED' ? 'state-green' : q.status === 'REFUSED' ? 'state-red' : 'state-amber'}`}>{t[q.status as 'PENDING']}</span></p>
          <p className="muted">{q.description}</p>{q.reason && <p className="muted">{t.reason} : {q.reason}</p>}</div>) : <p className="muted">{t.waiting.REQUESTED}</p>}</section>}
        {d.photos.some(p => !p.task_id) && <section className="side-block"><h3>{t.photos}</h3><div className="task-photos">{d.photos.filter(p => !p.task_id).map(p => <figure key={p.id}><Photo org={org} id={id} photo={p.id} alt={p.phase} /><figcaption>{p.phase === 'BEFORE' ? t.before : t.after}</figcaption></figure>)}</div></section>}
        <section className="side-block"><h3>{t.history}</h3><ol className="timeline">{[...d.events].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(e => <li key={e.id}><strong>{(events[e.action] ?? [e.action, e.action])[lang === 'fr' ? 0 : 1]}</strong><span className="muted">{e.actor} · {when(e.created_at, tz, lang)}</span>{e.reason && <span className="timeline-reason">{e.reason}</span>}</li>)}</ol></section>
      </aside>
    </div>
  </section>;
}
