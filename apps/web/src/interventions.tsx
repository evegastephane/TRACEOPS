import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError } from './api';
import { Avatar } from './avatar';
import type { Lang } from './i18n';
import { AlertIcon, BackIcon, CalendarIcon, CheckIcon, ChevronIcon, ClipboardIcon, CloseIcon, PlusIcon, SearchIcon } from './icons';
import { Alert, Empty, PageHead, Sheet, Skeleton, VisaBand, VisaStrip, type Visa } from './ui';
import { Legend, RankedRows, RateLine, SimpleBars, StackedColumns, type Series } from './charts';
import { bandOf, dayKey, lateness, perDay, perPartner, perPlace, stepOf, steps, summarize, weeklyFirstPass, type Item, type Step } from './metrics';

/* ------------------------------------------------------------------ words */

const fr = {
  overviewIntro: 'Ce qui demande votre attention, ce qui se passe aujourd’hui et l’état des interventions.',
  toHandle: 'À viser', today: 'Aujourd’hui', inProgress: 'En cours', toReview: 'À contrôler', rework: 'Reprises', quotes: 'Devis en attente', anomalies: 'Anomalies ouvertes', toAssign: 'À affecter',
  nothingToHandle: 'Rien n’attend votre visa pour le moment.', nothingToday: 'Aucune intervention prévue aujourd’hui.', seeAll: 'Voir toutes les interventions', openPlanning: 'Ouvrir le planning',
  interventions: 'Interventions', programmes: 'Programmes', newMaintenance: 'Nouvelle demande de maintenance', newProgramme: 'Nouveau programme de nettoyage',
  search: 'Rechercher', searchHint: 'N°, titre, lieu, prestataire', status: 'Statut', allStatuses: 'Tous les statuts', kind: 'Type', allKinds: 'Tous les types', period: 'Période',
  step: 'Étape', allSteps: 'Toutes les étapes',
  p7: '7 prochains jours', p30: '± 30 jours', pAll: 'Toutes', CLEANING: 'Nettoyage', MAINTENANCE: 'Maintenance',
  number: 'N°', title: 'Intervention', place: 'Lieu', slot: 'Créneau', team: 'Équipe', partner: 'Prestataire', client: 'Client', none: '—', empty: 'Aucune intervention ne correspond.',
  loading: 'Chargement…', retry: 'Réessayer', loadError: 'Impossible de charger les interventions. Réessayez.', urgent: 'Urgent', back: 'Toutes les interventions', from: 'Programme',
  site: 'Site', places: 'Lieux', planned: 'Créneau prévu', started: 'Démarrée', submitted: 'Soumise', accepted: 'Acceptée le', createdBy: 'Demandée par', round: 'Passage de contrôle',
  nextStep: 'Prochaine étape', waitingFor: 'En attente de', noAction: 'Aucune action de votre part pour l’instant.', pdf: 'Compte rendu PDF',
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
  history: 'Historique', save: 'Enregistrer', send: 'Envoyer', closePanel: 'Fermer', cancelForm: 'Annuler',
  prTitle: 'Intitulé', prProvider: 'Prestataire destinataire', prSite: 'Site', prZones: 'Lieux concernés', prDays: 'Jours de passage', prStartDate: 'Date de début', prEndDate: 'Date de fin',
  prStartTime: 'Heure de début', prEndTime: 'Heure de fin', prTasks: 'Tâches (une par ligne)', prHelp: 'Chaque passage devient une intervention suivie séparément : affectation, compte rendu, contrôle.',
  prCreated: 'Programme créé : {n} passages planifiés.', mtCreated: 'Demande envoyée au prestataire.', mtStarts: 'Début', mtEnds: 'Fin', mtPriority: 'Urgente', mtQuote: 'Devis préalable requis',
  mtQuoteHelp: 'Le prestataire transmet un devis ; rien n’est planifié avant votre accord.', noLinked: 'Aucun prestataire n’est rattaché à ce site.',
  days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], passages: 'Passages', acceptedOf: '{a} acceptés sur {n}', setTeam: 'Affecter l’équipe à tous les passages à venir',
  teamSet: '{n} passages affectés{s}.', skipped: ', {n} ignorés (agent déjà occupé)', noProgramme: 'Aucun programme de nettoyage.', week: 'Semaine du {d}', prev: 'Semaine précédente', next: 'Semaine suivante', thisWeek: 'Cette semaine',
  noVisit: 'Aucun passage', waiting: { REQUESTED: 'le devis du prestataire', QUOTE_SUBMITTED: 'la décision du client sur le devis', QUOTE_REFUSED: 'un nouveau devis', PLANNED: 'l’affectation par le prestataire', ASSIGNED: 'le démarrage par l’agent', IN_PROGRESS: 'le compte rendu de l’agent', UNDER_REVIEW: 'le contrôle du client', REWORK: 'la reprise par l’agent', ACCEPTED: '', CANCELLED: '' } as Record<string, string>,
  // Dashboard
  dashTitle: 'Vue d’ensemble', sites: 'Site', periodLast: '{n} derniers jours', edited: 'Édité', by: 'par', p7d: '7 j', p30d: '30 j', p90d: '90 j', periodChoice: 'Période analysée',
  firstPass: 'Conformité au premier contrôle', firstPassOf: '{a} acceptées sans reprise sur {n} contrôlées', noReview: 'Aucun contrôle sur la période.',
  doneKpi: 'Passages réalisés', doneOf: 'comptes rendus soumis sur {n} passages dus', late: 'En retard', lateNote: 'non démarrées à l’heure prévue', lateNone: 'aucune intervention en retard',
  reviewDelay: 'Délai de contrôle', reviewDelayNote: 'médiane entre compte rendu et acceptation', punctuality: 'Ponctualité', punctualityNote: '{a} démarrées à l’heure sur {n}',
  quotesNote: 'à décider', trend: 'Évolution de la conformité', trendMeta: '{n} dernières semaines', bySteps: 'Registre des étapes', byStepsMeta: 'cliquez une étape pour la liste',
  perDayTitle: 'Passages par jour', perWeekTitle: 'Passages par semaine', perProvider: 'Par prestataire', perClient: 'Par client', topPlaces: 'Lieux les plus sollicités', interventionsN: '{n} interventions',
  showData: 'Afficher les données', hideData: 'Masquer les données', tableOf: 'Données du graphique', noData: 'Aucune intervention sur la période.', weekOf: 'sem. du {d}', reviews: 'contrôles',
  sAccepted: 'Acceptées', sReview: 'À contrôler', sAlert: 'Reprise ou retard', sPlanned: 'Planifiées', sAssign: 'À affecter ou à chiffrer',
  stRequest: 'Demande', stQuote: 'Devis', stAssign: 'Affectation', stWork: 'Réalisation', stReview: 'Contrôle', stAccepted: 'Acceptées', yourActions: 'vos visas en attente', allDue: 'à traiter',
  // Visas
  visas: 'Bande de visa', vRequest: 'Demandé par', vQuote: 'Devis', vAssign: 'Affecté par', vWork: 'Réalisé par', vReview: 'Contrôlé par', vWaiting: 'En attente', vMine: 'À vous de viser',
  vInProgress: 'En cours depuis {d}', vRework: 'Reprise demandée', vRefused: 'Devis refusé', vQuoteSent: 'Transmis par {n}', vLead: 'Responsable : {n}', vCancelled: 'Intervention annulée',
  // Agent
  myMissions: 'Mes missions', toRedo: 'À reprendre', upcoming: 'Prochaines missions', recent: 'Récemment soumises', openMission: 'Ouvrir la mission', tasksOf: '{a}/{n} tâches', noMission: 'Aucune mission prévue aujourd’hui.', noUpcoming: 'Aucune mission dans les 7 prochains jours.', missionsWeek: 'Missions cette semaine',
  weekPassages: '{n} passages', hours: 'Heures', lateChip: 'En retard',
  waitsClient: 'attend le client', waitsProvider: 'attend le prestataire', waitsAgent: 'attend l’agent', closed: 'clôturées', register: 'Registre des étapes',
  checksTitle: 'Contrôles par semaine', checksMeta: '{n} dernières semaines · taux de conformité au-dessus', okFirst: 'Acceptées sans reprise', withRework: 'Avec reprise', noCheck: 'aucun contrôle',
  upcomingTo: 'à venir jusqu’au {d}', future: 'à venir', visaBand: 'Bande de visa', toRedoLate: 'En retard', lateIntro: 'Passages non démarrés à l’heure prévue', noPhotoCell: 'sans photo', result: 'Résultat', doneBy: 'Visa',
};
type T = typeof fr;
const en: T = {
  overviewIntro: 'What needs your attention, what happens today and where interventions stand.',
  toHandle: 'Awaiting your sign-off', today: 'Today', inProgress: 'In progress', toReview: 'To review', rework: 'Rework', quotes: 'Pending quotes', anomalies: 'Open anomalies', toAssign: 'To assign',
  nothingToHandle: 'Nothing awaits your sign-off right now.', nothingToday: 'No intervention planned today.', seeAll: 'See all interventions', openPlanning: 'Open the planning',
  interventions: 'Interventions', programmes: 'Programmes', newMaintenance: 'New maintenance request', newProgramme: 'New cleaning programme',
  search: 'Search', searchHint: 'No., title, place, provider', status: 'Status', allStatuses: 'All statuses', kind: 'Type', allKinds: 'All types', period: 'Period',
  step: 'Step', allSteps: 'All steps',
  p7: 'Next 7 days', p30: '± 30 days', pAll: 'All', CLEANING: 'Cleaning', MAINTENANCE: 'Maintenance',
  number: 'No.', title: 'Intervention', place: 'Place', slot: 'Slot', team: 'Team', partner: 'Provider', client: 'Client', none: '—', empty: 'No intervention matches.',
  loading: 'Loading…', retry: 'Try again', loadError: 'The interventions could not be loaded. Try again.', urgent: 'Urgent', back: 'All interventions', from: 'Programme',
  site: 'Site', places: 'Places', planned: 'Planned slot', started: 'Started', submitted: 'Submitted', accepted: 'Accepted on', createdBy: 'Requested by', round: 'Review round',
  nextStep: 'Next step', waitingFor: 'Waiting for', noAction: 'Nothing for you to do yet.', pdf: 'PDF report',
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
  history: 'History', save: 'Save', send: 'Send', closePanel: 'Close', cancelForm: 'Cancel',
  prTitle: 'Title', prProvider: 'Receiving provider', prSite: 'Site', prZones: 'Places', prDays: 'Passage days', prStartDate: 'Start date', prEndDate: 'End date',
  prStartTime: 'Start time', prEndTime: 'End time', prTasks: 'Tasks (one per line)', prHelp: 'Each passage becomes its own intervention: assignment, report, review.',
  prCreated: 'Programme created: {n} passages scheduled.', mtCreated: 'Request sent to the provider.', mtStarts: 'Start', mtEnds: 'End', mtPriority: 'Urgent', mtQuote: 'Prior quote required',
  mtQuoteHelp: 'The provider sends a quote; nothing is scheduled before you approve it.', noLinked: 'No provider is linked to this site.',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], passages: 'Passages', acceptedOf: '{a} accepted of {n}', setTeam: 'Assign the team to every upcoming passage',
  teamSet: '{n} passages assigned{s}.', skipped: ', {n} skipped (agent already busy)', noProgramme: 'No cleaning programme.', week: 'Week of {d}', prev: 'Previous week', next: 'Next week', thisWeek: 'This week',
  noVisit: 'No passage', waiting: { REQUESTED: 'the provider’s quote', QUOTE_SUBMITTED: 'the client’s decision on the quote', QUOTE_REFUSED: 'a new quote', PLANNED: 'assignment by the provider', ASSIGNED: 'the agent to start', IN_PROGRESS: 'the agent’s report', UNDER_REVIEW: 'the client’s review', REWORK: 'rework by the agent', ACCEPTED: '', CANCELLED: '' },
  dashTitle: 'Overview', sites: 'Site', periodLast: 'Last {n} days', edited: 'Issued', by: 'by', p7d: '7 d', p30d: '30 d', p90d: '90 d', periodChoice: 'Period analysed',
  firstPass: 'First-review compliance', firstPassOf: '{a} accepted without rework of {n} reviewed', noReview: 'No review in the period.',
  doneKpi: 'Passages completed', doneOf: 'reports submitted for {n} passages due', late: 'Late', lateNote: 'not started at the planned time', lateNone: 'no late intervention',
  reviewDelay: 'Review time', reviewDelayNote: 'median from report to acceptance', punctuality: 'Punctuality', punctualityNote: '{a} started on time of {n}',
  quotesNote: 'to decide', trend: 'Compliance trend', trendMeta: 'last {n} weeks', bySteps: 'Register of steps', byStepsMeta: 'click a step for the list',
  perDayTitle: 'Passages per day', perWeekTitle: 'Passages per week', perProvider: 'By provider', perClient: 'By client', topPlaces: 'Busiest places', interventionsN: '{n} interventions',
  showData: 'Show the data', hideData: 'Hide the data', tableOf: 'Chart data', noData: 'No intervention in the period.', weekOf: 'wk of {d}', reviews: 'reviews',
  sAccepted: 'Accepted', sReview: 'To review', sAlert: 'Rework or late', sPlanned: 'Scheduled', sAssign: 'To assign or quote',
  stRequest: 'Request', stQuote: 'Quote', stAssign: 'Assignment', stWork: 'Work', stReview: 'Review', stAccepted: 'Accepted', yourActions: 'your pending sign-offs', allDue: 'to handle',
  visas: 'Sign-off band', vRequest: 'Requested by', vQuote: 'Quote', vAssign: 'Assigned by', vWork: 'Done by', vReview: 'Reviewed by', vWaiting: 'Waiting', vMine: 'Your sign-off',
  vInProgress: 'In progress since {d}', vRework: 'Rework requested', vRefused: 'Quote refused', vQuoteSent: 'Sent by {n}', vLead: 'Lead: {n}', vCancelled: 'Intervention cancelled',
  myMissions: 'My missions', toRedo: 'To redo', upcoming: 'Upcoming missions', recent: 'Recently submitted', openMission: 'Open the mission', tasksOf: '{a}/{n} tasks', noMission: 'No mission planned today.', noUpcoming: 'No mission in the next 7 days.', missionsWeek: 'Missions this week',
  weekPassages: '{n} passages', hours: 'Hours', lateChip: 'Late',
  waitsClient: 'waits for the client', waitsProvider: 'waits for the provider', waitsAgent: 'waits for the agent', closed: 'closed', register: 'Register of steps',
  checksTitle: 'Reviews per week', checksMeta: 'last {n} weeks · compliance rate above', okFirst: 'Accepted without rework', withRework: 'With rework', noCheck: 'no review',
  upcomingTo: 'upcoming until {d}', future: 'upcoming', visaBand: 'Sign-off band', toRedoLate: 'Late', lateIntro: 'Passages not started at the planned time', noPhotoCell: 'no photo', result: 'Result', doneBy: 'Sign-off',
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
/** The status, and a "late" chip when planned work has not started at its time. */
const chips = (i: Item, lang: Lang, compact = false) => { const late = lateness(i) === 'late', label = lang === 'fr' ? 'En retard' : 'Late';
  return compact && late ? <span className="state state-red">{label}</span> : <>{statusBadge(i.status, lang)}{late && <span className="state state-red">{label}</span>}</>; };
const locale = (lang: Lang) => lang === 'fr' ? 'fr-FR' : 'en-GB';

type Org = { id: string; name: string; kind: 'CLIENT' | 'PROVIDER'; roles?: string[] };
export type { Item };
/** What the page head shows under every title: the organisation and the role. */
export type Ctx = { subtitle: string; userName: string };

const isAgentOrg = (org: Org) => org.kind === 'PROVIDER' && (org.roles ?? []).length > 0 && (org.roles ?? []).every(r => r === 'FIELD_AGENT');

/** What this role is expected to do next, from the status alone (the detail asks the server for the exact rights). */
function mine(item: Item, org: Org, admin: boolean) {
  if (admin) return false;
  const r = org.roles ?? [];
  if (org.kind === 'CLIENT') return (r.includes('CLIENT_MANAGER') && item.status === 'QUOTE_SUBMITTED') || ((r.includes('CLIENT_MANAGER') || r.includes('CLIENT_CONTROLLER')) && item.status === 'UNDER_REVIEW');
  if (r.includes('PROVIDER_MANAGER')) return ['REQUESTED', 'QUOTE_REFUSED', 'PLANNED'].includes(item.status);
  return ['ASSIGNED', 'IN_PROGRESS', 'REWORK'].includes(item.status);
}
function when(iso: string, tz: string, lang: Lang, style: 'full' | 'time' | 'day' | 'date' = 'full') {
  const opts: Intl.DateTimeFormatOptions = style === 'time' ? { hour: '2-digit', minute: '2-digit' } : style === 'day' ? { weekday: 'short', day: 'numeric', month: 'short' } : style === 'date' ? { day: 'numeric', month: 'short', year: 'numeric' } : { dateStyle: 'medium', timeStyle: 'short' };
  return new Date(iso).toLocaleString(locale(lang), { timeZone: tz, ...opts });
}
const slot = (i: Item, lang: Lang) => {
  const sameDay = when(i.starts_at, i.timezone, lang, 'day') === when(i.ends_at, i.timezone, lang, 'day');
  return sameDay ? `${when(i.starts_at, i.timezone, lang, 'day')} · ${when(i.starts_at, i.timezone, lang, 'time')}–${when(i.ends_at, i.timezone, lang, 'time')}` : `${when(i.starts_at, i.timezone, lang)} – ${when(i.ends_at, i.timezone, lang)}`;
};
/** The slot on two short lines for a table cell: the day, then the hours (or the end, when it spans several days). */
const slotLines = (i: Item, lang: Lang): [string, string] => {
  const day = when(i.starts_at, i.timezone, lang, 'day'), endDay = when(i.ends_at, i.timezone, lang, 'day');
  const from = when(i.starts_at, i.timezone, lang, 'time'), to = when(i.ends_at, i.timezone, lang, 'time');
  return day === endDay ? [day, `${from}–${to}`] : [`${day} ${from}`, `→ ${endDay} ${to}`];
};

const shortName = (name?: string | null) => { if (!name) return '—'; const p = name.trim().split(/\s+/); return p.length > 1 && p[0].length > 2 ? `${p[0][0]}. ${p.slice(1).join(' ')}` : name; };
const dayShort = (iso: string, tz: string, lang: Lang) => new Date(iso).toLocaleDateString(locale(lang), { day: 'numeric', month: 'short', timeZone: tz });

/** The visa band of a list row: who signed each step and when, and who must act on the next one. */
function visasOfItem(i: Item, org: Org, admin: boolean, t: T, lang: Lang): Visa[] {
  const v = i.visas ?? {}, act = mine(i, org, admin), lead = i.agents.find(a => a.lead)?.name ?? i.agents[0]?.name;
  const at = (iso?: string | null) => iso ? dayShort(iso, i.timezone, lang) : undefined;
  const req = v.REQUESTED ?? v.SCHEDULED, rep = [v.SUBMITTED, v.RESUBMITTED].filter(Boolean).sort((a, b) => b!.at.localeCompare(a!.at))[0];
  const waiting = (key: string, step: string, who: string): Visa => ({ key, step, state: act ? 'mine' : 'waiting', name: act ? t.vMine : shortName(who) });
  const preAssign = ['REQUESTED', 'QUOTE_SUBMITTED', 'QUOTE_REFUSED', 'PLANNED'].includes(i.status);
  return [
    { key: 'request', step: t.vRequest, state: 'signed', name: shortName(req?.by ?? i.created_by_name), date: at(req?.at ?? i.created_at) },
    preAssign ? (i.status === 'QUOTE_SUBMITTED' ? waiting('assign', t.vAssign, i.client_name) : waiting('assign', t.vAssign, i.provider_name))
      : { key: 'assign', step: t.vAssign, state: 'signed', name: v.ASSIGNED ? shortName(v.ASSIGNED.by) : i.provider_name, date: at(v.ASSIGNED?.at) },
    ['UNDER_REVIEW', 'ACCEPTED'].includes(i.status) && rep ? { key: 'work', step: t.vWork, state: 'signed', name: shortName(rep.by), date: at(rep.at) }
      : ['ASSIGNED', 'IN_PROGRESS', 'REWORK'].includes(i.status) ? waiting('work', t.vWork, lead ?? i.provider_name) : { key: 'work', step: t.vWork, state: 'future' },
    i.status === 'ACCEPTED' && v.ACCEPTED ? { key: 'review', step: t.vReview, state: 'signed', name: shortName(v.ACCEPTED.by), date: at(v.ACCEPTED.at) }
      : i.status === 'UNDER_REVIEW' ? waiting('review', t.vReview, i.client_name)
      : i.status === 'REWORK' && v.REWORK_REQUESTED ? { key: 'review', step: t.vReview, state: 'rework', name: shortName(v.REWORK_REQUESTED.by), date: at(v.REWORK_REQUESTED.at) }
      : { key: 'review', step: t.vReview, state: 'future' },
  ];
}

/** The compact visa strip of a list row, read from the status: signed steps, the step waiting, the steps to come. */
function stripOf(i: Item, org: Org, admin: boolean, t: T) {
  const order: Step[] = ['request', 'assign', 'work', 'review'];
  const at = stepOf(i.status), reached = at === 'accepted' ? 4 : at === 'review' ? 3 : at === 'work' ? 2 : 1;
  const marks: Visa['state'][] = order.map((_, n) => n < reached ? 'signed' : n === reached ? (i.status === 'REWORK' || i.status === 'QUOTE_REFUSED' ? 'rework' : mine(i, org, admin) ? 'mine' : 'waiting') : 'future');
  if (i.status === 'ACCEPTED') marks.fill('signed');
  const names = [t.vRequest, t.vAssign, t.vWork, t.vReview];
  const label = marks.map((m, n) => `${names[n]} : ${m === 'signed' ? '✓' : m === 'future' ? '—' : m === 'mine' ? t.vMine : m === 'rework' ? (i.status === 'QUOTE_REFUSED' ? t.vRefused : t.vRework) : t.vWaiting}`).join(' · ');
  return <VisaStrip marks={marks} label={label} />;
}

function useInterventions(org: Org, from?: string, to?: string) {
  const [items, setItems] = useState<Item[]>([]), [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true; setState(s => s === 'ready' ? 'ready' : 'loading');
    const q = new URLSearchParams(Object.entries({ from: from ?? '', to: to ?? '' }).filter(([, v]) => v)).toString();
    api('interventions' + (q ? '?' + q : ''), undefined, org.id).then(r => { if (active) { setItems(r); setState('ready'); } }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [org.id, from, to, attempt]);
  return { items, state, reload: () => setAttempt(n => n + 1) };
}
const LoadError = ({ text, retry, t }: { text: string; retry: () => void; t: T }) => <Alert retry={retry} retryLabel={t.retry}>{text}</Alert>;

function Row({ i, lang, onOpen, partner, org, admin, t }: { i: Item; lang: Lang; onOpen: (id: string) => void; partner: 'provider' | 'client'; org: Org; admin: boolean; t: T }) {
  return <li><button className="work-row" onClick={() => onOpen(i.id)}>
    <span className="work-ref">{ref(i.number)}</span>
    <span className="work-main"><strong title={i.title}>{i.title}</strong>
      <span className="muted">{[slot(i, lang), partner === 'provider' ? i.provider_name : i.client_name].filter(Boolean).join(' · ')}</span></span>
    <span className="work-side">{stripOf(i, org, admin, t)}{chips(i, lang)}</span>
    <ChevronIcon />
  </button></li>;
}

/** What awaits a sign-off, as a register: the intervention, then its visa band with names and dates. */
function SignTable({ rows, org, admin, lang, t, onOpen }: { rows: Item[]; org: Org; admin: boolean; lang: Lang; t: T; onOpen: (id: string) => void }) {
  const partner = org.kind === 'CLIENT' ? 'provider' : 'client';
  return <div className="table-card table-flat"><table className="audit-table sign-table">
    <thead><tr><th scope="col" className="col-ref">{t.number}</th><th scope="col">{t.title}</th><th scope="col" className="col-visas">{t.visaBand}</th><th scope="col" className="col-status">{t.status}</th></tr></thead>
    <tbody>{rows.map(i => <tr key={i.id} className="clickable" onClick={() => onOpen(i.id)}>
      <td data-label={t.number}><span className="work-ref">{ref(i.number)}</span></td>
      <td data-label={t.title} className="sign-main"><button type="button" className="work-title is-wrapping" onClick={e => { e.stopPropagation(); onOpen(i.id); }}>{i.title}</button>
        <span className="work-meta is-wrapping">{[slot(i, lang), partner === 'provider' ? i.provider_name : i.client_name].join(' · ')}</span></td>
      <td data-label={t.visaBand} className="sign-visas"><VisaBand compact visas={visasOfItem(i, org, admin, t, lang)} label={`${t.visaBand} ${ref(i.number)}`} /></td>
      <td data-label={t.status}><span className="work-status">{chips(i, lang)}</span></td>
    </tr>)}</tbody></table></div>;
}

/* --------------------------------------------------------------- dashboard */

const DAY = 86400000;
const pct = (v: number) => `${Math.round(v * 100)} %`;
function hoursText(h: number, lang: Lang) {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 48) { const H = Math.floor(h), M = Math.round((h - H) * 60); return M ? `${H} h ${String(M).padStart(2, '0')}` : `${H} h`; }
  return lang === 'fr' ? `${Math.round(h / 24)} j` : `${Math.round(h / 24)} d`;
}

export function WorkOverview({ org, lang, admin, ctx, onOpen, onNavigate, onStep, onNewRequest }: {
  org: Org; lang: Lang; admin: boolean; ctx: Ctx; onOpen: (id: string) => void; onNavigate: (s: 'planning' | 'interventions') => void; onStep: (step: Step) => void; onNewRequest: () => void;
}) {
  if (!admin && isAgentOrg(org)) return <AgentHome org={org} lang={lang} ctx={ctx} onOpen={onOpen} />;
  return <Dashboard org={org} lang={lang} admin={admin} ctx={ctx} onOpen={onOpen} onNavigate={onNavigate} onStep={onStep} onNewRequest={onNewRequest} />;
}

function Dashboard({ org, lang, admin, ctx, onOpen, onNavigate, onStep, onNewRequest }: {
  org: Org; lang: Lang; admin: boolean; ctx: Ctx; onOpen: (id: string) => void; onNavigate: (s: 'planning' | 'interventions') => void; onStep: (step: Step) => void; onNewRequest: () => void;
}) {
  const t = lang === 'fr' ? fr : en;
  const [days, setDays] = useState<7 | 30 | 90>(30), [showData, setShowData] = useState(false);
  // One fetch covers the period, the to-do list and the work planned in the next weeks.
  const range = useMemo(() => ({ from: new Date(Date.now() - Math.max(days, 45) * DAY).toISOString(), to: new Date(Date.now() + 45 * DAY).toISOString() }), [org.id, days]);
  const { items, state, reload } = useInterventions(org, range.from, range.to);
  const now = Date.now(), tz = items[0]?.timezone ?? 'Africa/Douala';
  const startOfPeriod = now - days * DAY;
  // Everything measured is read on the period; only the day chart also shows the work already planned, marked as upcoming.
  const inPeriod = items.filter(i => Date.parse(i.starts_at) >= startOfPeriod && Date.parse(i.starts_at) <= now);
  const s = summarize(inPeriod, now), all = summarize(items, now);
  const due = inPeriod.filter(i => !['REQUESTED', 'QUOTE_SUBMITTED', 'QUOTE_REFUSED', 'CANCELLED'].includes(i.status));
  const submitted = due.filter(i => ['UNDER_REVIEW', 'REWORK', 'ACCEPTED'].includes(i.status) || i.submitted_at).length;
  const handle = items.filter(i => mine(i, org, admin)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const todayKey = dayKey(new Date(now), tz), today = items.filter(i => dayKey(i.starts_at, i.timezone) === todayKey && i.status !== 'CANCELLED');
  const partner = org.kind === 'CLIENT' ? 'provider' : 'client';
  const sites = [...new Set(items.map(i => i.site_name))];
  const fmt = (ms: number, year = false) => new Date(ms).toLocaleDateString(locale(lang), { day: 'numeric', month: 'short', year: year ? 'numeric' : undefined, timeZone: tz });
  const windowEnd = now + (days === 7 ? 7 : 14) * DAY;
  const periodLabel = `${fmt(startOfPeriod)} – ${fmt(now, true)}`;
  const series: Series[] = [{ key: 'accepted', label: t.sAccepted }, { key: 'review', label: t.sReview }, { key: 'alert', label: t.sAlert }, { key: 'planned', label: t.sPlanned }, { key: 'assign', label: t.sAssign }];
  const fold = (c: Record<string, number>) => ({ accepted: c.accepted, review: c.review, alert: c.rework + c.late, planned: c.planned, assign: c.assign + c.request });
  const weekly = days === 90;
  const columns = useMemo(() => {
    if (!weekly) return perDay(items, new Date(startOfPeriod + DAY), new Date(windowEnd), tz, now).map(c => ({
      key: c.key, highlight: c.isToday, future: !c.isPast && !c.isToday, values: fold(c.counts),
      label: c.date.toLocaleDateString(locale(lang), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }),
      short: c.date.toLocaleDateString(locale(lang), { day: 'numeric', month: 'short', timeZone: 'UTC' }),
      note: c.isToday ? t.today : !c.isPast ? t.future : undefined,
    }));
    const daily = perDay(items, new Date(startOfPeriod), new Date(windowEnd), tz, now), weeks: { key: string; date: Date; counts: Record<string, number>; today: boolean; future: boolean }[] = [];
    for (const c of daily) {
      const monday = new Date(c.date.getTime() - ((c.date.getUTCDay() + 6) % 7) * DAY), key = monday.toISOString().slice(0, 10);
      let w = weeks.find(x => x.key === key); if (!w) { w = { key, date: monday, counts: { accepted: 0, review: 0, rework: 0, late: 0, planned: 0, assign: 0, request: 0 }, today: false, future: true }; weeks.push(w); }
      for (const [k, v] of Object.entries(c.counts)) w.counts[k] += v; if (c.isToday) w.today = true; if (c.isPast || c.isToday) w.future = false;
    }
    return weeks.map(w => ({ key: w.key, highlight: w.today, future: w.future, values: fold(w.counts), label: fill(t.weekOf, { d: w.date.toLocaleDateString(locale(lang), { day: 'numeric', month: 'long', timeZone: 'UTC' }) }), short: w.date.toLocaleDateString(locale(lang), { day: 'numeric', month: 'short', timeZone: 'UTC' }) }));
  }, [items, days, lang]);
  // Reviews per week: accepted at the first review, and reworked; the rate is printed above, a week without review says so.
  const nWeeks = weekly ? 13 : days === 30 ? 5 : 4;
  const checks = useMemo(() => {
    const monday = (ms: number) => { const k = dayKey(new Date(ms), tz), x = Date.parse(k + 'T00:00:00Z'); return x - ((new Date(x).getUTCDay() + 6) % 7) * DAY; };
    const start = monday(now - (nWeeks - 1) * 7 * DAY);
    return Array.from({ length: nWeeks }, (_, w) => {
      const from = start + w * 7 * DAY, to = from + 7 * DAY;
      const list = items.filter(i => { const x = Date.parse(dayKey(i.starts_at, i.timezone) + 'T00:00:00Z'); return x >= from && x < to; });
      const ok = list.filter(i => i.status === 'ACCEPTED' && (i.round ?? 1) === 1).length;
      const redo = list.filter(i => (i.status === 'ACCEPTED' && (i.round ?? 1) > 1) || i.status === 'REWORK' || (i.status === 'UNDER_REVIEW' && (i.round ?? 1) > 1)).length;
      const d = new Date(from), total = ok + redo;
      return { key: String(from), values: { accepted: ok, alert: redo }, top: total ? pct(ok / total) : nWeeks <= 6 ? t.noCheck : '—',
        label: fill(t.weekOf, { d: d.toLocaleDateString(locale(lang), { day: 'numeric', month: 'long', timeZone: 'UTC' }) }), short: d.toLocaleDateString(locale(lang), { day: 'numeric', month: 'short', timeZone: 'UTC' }),
        note: total ? `${pct(ok / total)} · ${total} ${t.reviews}` : t.noCheck, highlight: now >= from && now < to };
    });
  }, [items, days, lang]);
  const stepRows: { step: Step; label: string; n: number; waits: string }[] = [
    { step: 'request', label: t.stRequest, n: all.byStep.request, waits: t.waitsProvider }, { step: 'quote', label: t.stQuote, n: all.byStep.quote, waits: t.waitsClient },
    { step: 'assign', label: t.stAssign, n: all.byStep.assign, waits: t.waitsProvider }, { step: 'work', label: t.stWork, n: all.byStep.work, waits: t.waitsAgent },
    { step: 'review', label: t.stReview, n: all.byStep.review, waits: t.waitsClient }, { step: 'accepted', label: t.stAccepted, n: all.byStep.accepted, waits: t.closed },
  ];
  const stepMax = Math.max(1, ...stepRows.map(r => r.n));
  const ready = state !== 'loading' || items.length > 0, dash = '–';
  const period = <div className="segmented" role="group" aria-label={t.periodChoice}>
    {([7, 30, 90] as const).map(n => <button key={n} type="button" aria-pressed={days === n} onClick={() => setDays(n)}>{n === 7 ? t.p7d : n === 30 ? t.p30d : t.p90d}</button>)}
  </div>;
  const clientManager = !admin && org.kind === 'CLIENT' && (org.roles ?? []).includes('CLIENT_MANAGER');

  return <section className="dash" aria-busy={state === 'loading'} data-refreshing={state === 'loading' && items.length > 0 ? 'true' : undefined}>
    <PageHead title={t.dashTitle} subtitle={ctx.subtitle}
      cells={[
        { label: t.sites, value: sites.length ? sites.join(', ') : dash },
        { label: t.period, value: <span className="cart-period">{periodLabel}{period}</span>, wide: true },
        { label: t.edited, value: `${new Date(now).toLocaleDateString(locale(lang), { day: 'numeric', month: 'short', year: 'numeric' })} · ${ctx.userName}` },
      ]}
      actions={clientManager ? <button className="primary" onClick={onNewRequest}><PlusIcon />{t.newMaintenance}</button> : <button className="secondary" onClick={() => onNavigate('interventions')}>{t.seeAll}</button>} />
    {state === 'error' && <LoadError text={t.loadError} retry={reload} t={t} />}

    <dl className="kpis">
      <div className="kpi kpi-hero">
        <dt>{t.firstPass}</dt>
        <dd><span className="kpi-value">{ready && s.firstPass.rate !== null ? pct(s.firstPass.rate) : dash}</span>
          <span className="kpi-note">{ready ? (s.firstPass.rate !== null ? fill(t.firstPassOf, { a: s.firstPass.accepted, n: s.firstPass.reviewed }) : t.noReview) : t.loading}</span>
          {s.firstPass.rate !== null && <span className="meter" aria-hidden="true"><span style={{ width: pct(s.firstPass.rate).replace(' ', '') }} /></span>}</dd>
      </div>
      <div className="kpi"><dt>{t.doneKpi}</dt><dd><span className="kpi-value">{ready ? <>{submitted}<small> / {due.length}</small></> : dash}</span><span className="kpi-note">{fill(t.doneOf, { n: due.length })}</span></dd></div>
      <div className={all.late ? 'kpi is-alert' : 'kpi'}><dt>{t.late}</dt><dd><span className="kpi-value">{ready ? all.late : dash}</span><span className="kpi-note">{all.late ? t.lateNote : t.lateNone}</span></dd></div>
      <div className="kpi"><dt>{t.reviewDelay}</dt><dd><span className="kpi-value">{ready && s.reviewDelay !== null ? hoursText(s.reviewDelay, lang) : dash}</span><span className="kpi-note">{t.reviewDelayNote}</span></dd></div>
      <div className="kpi"><dt>{t.quotes}</dt><dd><span className="kpi-value">{ready ? all.quotesPending : dash}</span><span className="kpi-note">{t.quotesNote}</span></dd></div>
    </dl>

    <div className="dash-grid">
      <Sheet id="trend" title={t.checksTitle} meta={fill(t.checksMeta, { n: nWeeks })}
        actions={<button className="link-button" aria-pressed={showData} onClick={() => setShowData(v => !v)}>{showData ? t.hideData : t.showData}</button>}>
        <StackedColumns title={t.checksTitle} columns={checks} series={[{ key: 'accepted', label: t.okFirst }, { key: 'alert', label: t.withRework }]} height={232} tableLabel={t.tableOf} showTable={showData} emptyText={t.noReview} />
      </Sheet>
      <Sheet id="steps" title={t.bySteps} meta={t.byStepsMeta}>
        <ul className="step-bars">{stepRows.map((r, n) => <li key={r.step}>
          <button type="button" className="step-bar" onClick={() => onStep(r.step)} disabled={!r.n}>
            <span className="step-name"><span className="step-n">{n + 1}</span><span className="step-label">{r.label}<small>{r.waits}</small></span></span>
            <span className="step-track"><span className={`step-fill o${n + 1}`} style={{ width: `${(r.n / stepMax) * 100}%` }} /></span>
            <span className="step-count">{ready ? r.n : dash}</span>
          </button></li>)}</ul>
        {all.rework > 0 && <p className="sheet-note is-alert"><AlertIcon />{all.rework} {lang === 'fr' ? (all.rework > 1 ? 'reprises en cours' : 'reprise en cours') : 'rework in progress'}</p>}
      </Sheet>
    </div>

    <Sheet id="handle" title={t.toHandle} meta={ready ? `${handle.length} · ${admin ? t.allDue : t.yourActions}` : undefined}
      actions={<button className="link-button" onClick={() => onNavigate('interventions')}>{t.seeAll}</button>}>
      {state === 'loading' && !items.length ? <Skeleton label={t.loading} /> : handle.length
        ? <SignTable rows={handle.slice(0, 6)} org={org} admin={admin} lang={lang} t={t} onOpen={onOpen} />
        : <Empty>{admin ? t.noAction : t.nothingToHandle}</Empty>}
    </Sheet>

    <Sheet id="today" title={t.today} meta={today.length ? String(today.length) : undefined} actions={<button className="link-button" onClick={() => onNavigate('planning')}>{t.openPlanning}</button>}>
      {state === 'loading' && !items.length ? <Skeleton label={t.loading} rows={2} /> : today.length
        ? <SignTable rows={today} org={org} admin={admin} lang={lang} t={t} onOpen={onOpen} />
        : <Empty>{t.nothingToday}</Empty>}
    </Sheet>

    <Sheet id="perday" title={weekly ? t.perWeekTitle : t.perDayTitle} meta={`${periodLabel} · ${fill(t.upcomingTo, { d: fmt(windowEnd) })}`}>
      <StackedColumns title={weekly ? t.perWeekTitle : t.perDayTitle} columns={columns} series={series} tableLabel={t.tableOf} showTable={showData} emptyText={t.noData} futureLabel={t.future} />
    </Sheet>

    <div className="dash-grid dash-grid-even">
      <Sheet id="partners" title={partner === 'provider' ? t.perProvider : t.perClient} meta={periodLabel}>
        <RankedRows rows={perPartner(inPeriod, partner, now).map(r => ({ ...r, counts: fold(r.counts) }))} series={series} unit={n => String(n)} empty={t.noData} />
        <div className="sheet-legend"><Legend series={series} /></div>
      </Sheet>
      <Sheet id="places" title={t.topPlaces} meta={periodLabel}>
        <SimpleBars rows={perPlace(inPeriod, 6)} label={n => String(n)} empty={t.noData} />
      </Sheet>
    </div>
  </section>;
}

/* ------------------------------------------------------------ agent home */

function AgentHome({ org, lang, ctx, onOpen }: { org: Org; lang: Lang; ctx: Ctx; onOpen: (id: string) => void }) {
  const t = lang === 'fr' ? fr : en;
  const range = useMemo(() => ({ from: new Date(Date.now() - 14 * DAY).toISOString(), to: new Date(Date.now() + 8 * DAY).toISOString() }), [org.id]);
  const { items, state, reload } = useInterventions(org, range.from, range.to);
  const now = Date.now(), tz = items[0]?.timezone ?? 'Africa/Douala', todayKey = dayKey(new Date(now), tz);
  const live = items.filter(i => i.status !== 'CANCELLED');
  const redo = live.filter(i => i.status === 'REWORK');
  const late = live.filter(i => lateness(i, now) === 'late' && dayKey(i.starts_at, i.timezone) < todayKey);
  const today = live.filter(i => dayKey(i.starts_at, i.timezone) === todayKey && i.status !== 'REWORK');
  const upcoming = live.filter(i => dayKey(i.starts_at, i.timezone) > todayKey && ['ASSIGNED', 'PLANNED'].includes(i.status)).slice(0, 6);
  const recent = live.filter(i => ['UNDER_REVIEW', 'ACCEPTED'].includes(i.status) && dayKey(i.starts_at, i.timezone) < todayKey).slice(-4).reverse();
  // One row per mission inside its sheet: time first, then what and where, the task progress, and the state.
  const mission = (i: Item) => <li key={i.id}><button className="mission" onClick={() => onOpen(i.id)}>
    <span className="mission-time">{dayKey(i.starts_at, i.timezone) !== todayKey && <small className="mission-day">{when(i.starts_at, i.timezone, lang, 'day')}</small>}{when(i.starts_at, i.timezone, lang, 'time')}<small>{when(i.ends_at, i.timezone, lang, 'time')}</small></span>
    <span className="mission-main"><strong>{i.title}</strong><span className="muted">{i.zones.join(', ')}</span>
      <span className="mission-progress"><span className="meter" aria-hidden="true"><span style={{ width: `${i.tasks_total ? (i.tasks_done / i.tasks_total) * 100 : 0}%` }} /></span>{fill(t.tasksOf, { a: i.tasks_done, n: i.tasks_total })}</span></span>
    <span className="mission-side">{chips(i, lang)}<ChevronIcon /></span>
  </button></li>;
  return <section className="agent-home" aria-busy={state === 'loading'}>
    <PageHead title={t.myMissions} subtitle={ctx.subtitle} cells={[{ label: t.today, value: new Date(now).toLocaleDateString(locale(lang), { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz }) }]} />
    {state === 'error' && <LoadError text={t.loadError} retry={reload} t={t} />}
    {state === 'loading' && !items.length ? <Skeleton label={t.loading} /> : <>
      {redo.length > 0 && <Sheet id="redo" title={t.toRedo} meta={String(redo.length)} className="sheet-alert"><ul className="missions">{redo.map(mission)}</ul></Sheet>}
      {late.length > 0 && <Sheet id="late" title={t.toRedoLate} meta={t.lateIntro} className="sheet-alert"><ul className="missions">{late.map(mission)}</ul></Sheet>}
      <Sheet id="today" title={t.today} meta={today.length ? String(today.length) : undefined}>
        {today.length ? <ul className="missions">{today.map(mission)}</ul> : <Empty icon={<CalendarIcon />}>{t.noMission}</Empty>}
      </Sheet>
      <Sheet id="upcoming" title={t.upcoming}>
        {upcoming.length ? <ul className="work-list">{upcoming.map(i => <li key={i.id}><button className="work-row" onClick={() => onOpen(i.id)}>
          <span className="work-day">{when(i.starts_at, i.timezone, lang, 'day')}</span>
          <span className="work-main"><strong>{i.title}</strong><span className="muted">{when(i.starts_at, i.timezone, lang, 'time')}–{when(i.ends_at, i.timezone, lang, 'time')} · {i.zones.join(', ')}</span></span>
          <span className="work-side">{chips(i, lang)}</span><ChevronIcon /></button></li>)}</ul> : <Empty>{t.noUpcoming}</Empty>}
      </Sheet>
      {recent.length > 0 && <Sheet id="recent" title={t.recent}><ul className="work-list">{recent.map(i => <li key={i.id}><button className="work-row" onClick={() => onOpen(i.id)}>
        <span className="work-ref">{ref(i.number)}</span><span className="work-main"><strong>{i.title}</strong><span className="muted">{slot(i, lang)}</span></span>
        <span className="work-side">{chips(i, lang)}</span><ChevronIcon /></button></li>)}</ul></Sheet>}
    </>}
  </section>;
}

/* --------------------------------------------------------------- planning */

const mondayOf = (d: Date) => { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); const w = (x.getUTCDay() + 6) % 7; return new Date(x.getTime() - w * DAY); };
const minutesIn = (iso: string, tz: string) => { const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso)); return Number(p.find(x => x.type === 'hour')?.value ?? 0) * 60 + Number(p.find(x => x.type === 'minute')?.value ?? 0); };
const toneOf = (i: Item, now: number) => { const b = bandOf(i, now); return b === 'accepted' ? 'ok' : b === 'review' ? 'warn' : b === 'rework' || b === 'late' ? 'bad' : b === 'planned' ? 'info' : 'neutral'; };

export function Planning({ org, lang, ctx, onOpen }: { org: Org; lang: Lang; ctx: Ctx; onOpen: (id: string) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [monday, setMonday] = useState(() => mondayOf(new Date()));
  const from = new Date(monday.getTime() - DAY).toISOString(), to = new Date(monday.getTime() + 8 * DAY).toISOString();
  const { items, state, reload } = useInterventions(org, from, to);
  const now = Date.now(), tz = items[0]?.timezone ?? 'Africa/Douala';
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getTime() + i * DAY).toISOString().slice(0, 10));
  const todayKey = dayKey(new Date(now), tz);
  const label = monday.toLocaleDateString(locale(lang), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const week = items.filter(i => days.includes(dayKey(i.starts_at, i.timezone)) && i.status !== 'CANCELLED');
  // The grid covers the week's hours, a little wider on each side; an empty week shows a working day.
  const starts = week.map(i => minutesIn(i.starts_at, i.timezone)), ends = week.map(i => { const e = minutesIn(i.ends_at, i.timezone); return dayKey(i.ends_at, i.timezone) !== dayKey(i.starts_at, i.timezone) ? 24 * 60 : e; });
  const first = Math.max(0, Math.floor(((starts.length ? Math.min(...starts) : 7 * 60) - 30) / 60)), last = Math.min(24, Math.ceil(((ends.length ? Math.max(...ends) : 17 * 60) + 30) / 60));
  const span = Math.max(4, last - first), hours = Array.from({ length: span }, (_, n) => first + n);
  const dayName = (d: string, style: 'long' | 'short') => new Date(d + 'T12:00:00Z').toLocaleDateString(locale(lang), { weekday: style, day: 'numeric', month: style === 'long' ? 'long' : undefined, timeZone: 'UTC' });
  const lanes = (list: Item[]) => {
    const sorted = [...list].sort((a, b) => a.starts_at.localeCompare(b.starts_at)), ends: number[] = [], lane = new Map<string, number>();
    for (const i of sorted) { const s = Date.parse(i.starts_at); let n = ends.findIndex(e => e <= s); if (n < 0) { n = ends.length; ends.push(0); } ends[n] = Date.parse(i.ends_at); lane.set(i.id, n); }
    return { lane, count: Math.max(1, ends.length) };
  };
  return <section className="planning" aria-busy={state === 'loading'}>
    <PageHead title={lang === 'fr' ? 'Planning' : 'Planning'} subtitle={ctx.subtitle}
      cells={[{ label: lang === 'fr' ? 'Semaine' : 'Week', value: fill(t.week, { d: label }) }, { label: t.passages, value: state === 'ready' ? fill(t.weekPassages, { n: week.length }) : '–' }]}
      actions={<div className="toolbar-actions">
        <button className="secondary icon-only" aria-label={t.prev} onClick={() => setMonday(m => new Date(m.getTime() - 7 * DAY))}><BackIcon /></button>
        <button className="secondary" onClick={() => setMonday(mondayOf(new Date()))}>{t.thisWeek}</button>
        <button className="secondary icon-only" aria-label={t.next} onClick={() => setMonday(m => new Date(m.getTime() + 7 * DAY))}><ChevronIcon /></button></div>} />
    {state === 'error' && <LoadError text={t.loadError} retry={reload} t={t} />}
    <div className="sheet timegrid" style={{ ['--hours' as string]: span } as React.CSSProperties}>
      <div className="tg-corner" aria-hidden="true" />
      {days.map(d => <div key={d} className={d === todayKey ? 'tg-day-head is-today' : 'tg-day-head'}><span>{dayName(d, 'short')}</span></div>)}
      <div className="tg-hours" aria-hidden="true">{hours.map(h => <span key={h}>{String(h).padStart(2, '0')}:00</span>)}</div>
      {days.map(d => {
        const list = week.filter(i => dayKey(i.starts_at, i.timezone) === d), { lane, count } = lanes(list);
        return <section key={d} className={d === todayKey ? 'tg-day is-today' : 'tg-day'} aria-label={dayName(d, 'long')}>
          {state === 'loading' && !items.length ? <span className="skeleton-row tg-skeleton" /> : <ul className="day-list">{list.map(i => {
            const s = minutesIn(i.starts_at, i.timezone), e = dayKey(i.ends_at, i.timezone) !== d ? 24 * 60 : minutesIn(i.ends_at, i.timezone);
            const top = ((s - first * 60) / (span * 60)) * 100, height = Math.max(((e - s) / (span * 60)) * 100, 3.2), n = lane.get(i.id) ?? 0;
            return <li key={i.id} style={{ top: `${top}%`, height: `${height}%`, left: `${(n / count) * 100}%`, width: `${100 / count}%` }}>
              <button className={`visit visit-${i.kind.toLowerCase()} tone-${toneOf(i, now)}`} onClick={() => onOpen(i.id)} title={`${i.title} — ${i.zones.join(', ')}`}>
                <span className="visit-time">{when(i.starts_at, i.timezone, lang, 'time')}–{when(i.ends_at, i.timezone, lang, 'time')}</span>
                <strong>{i.title}</strong>
                <span className="visit-foot">{chips(i, lang, true)}</span>
              </button></li>;
          })}</ul>}
        </section>;
      })}
    </div>
    {/* Phones read the week as a list of days. */}
    <div className="week-list">{days.map(d => {
      const list = week.filter(i => dayKey(i.starts_at, i.timezone) === d);
      return <section key={d} className={d === todayKey ? 'sheet day is-today' : 'sheet day'} aria-label={dayName(d, 'long')}>
        <h2 className="day-head">{dayName(d, 'long')}</h2>
        {list.length ? <ul className="work-list">{list.map(i => <li key={i.id}><button className="work-row" onClick={() => onOpen(i.id)}>
          <span className="work-day">{when(i.starts_at, i.timezone, lang, 'time')}</span>
          <span className="work-main"><strong>{i.title}</strong><span className="muted">{i.zones.join(', ')}</span></span>
          <span className="work-side">{chips(i, lang)}</span><ChevronIcon /></button></li>)}</ul> : <p className="day-empty">{t.noVisit}</p>}
      </section>;
    })}</div>
  </section>;
}

/* ------------------------------------------------------------- the list */

type Programme = { id: string; title: string; weekdays: number[]; start_date: string; end_date: string; start_time: string; end_time: string; site_name: string; provider_name: string; client_name: string; passages: number; accepted: number; team: string[] };
const stepStatuses: Record<Step, string[]> = { request: ['REQUESTED', 'QUOTE_REFUSED'], quote: ['QUOTE_SUBMITTED'], assign: ['PLANNED'], work: ['ASSIGNED', 'IN_PROGRESS', 'REWORK'], review: ['UNDER_REVIEW'], accepted: ['ACCEPTED'] };

export function InterventionsPage({ org, lang, admin, ctx, initialStep, initialForm, onOpen }: { org: Org; lang: Lang; admin: boolean; ctx: Ctx; initialStep?: Step | null; initialForm?: 'maintenance' | null; onOpen: (id: string) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [tab, setTab] = useState<'list' | 'programmes'>('list'), [form, setForm] = useState<'maintenance' | 'programme' | null>(initialForm ?? null), [notice, setNotice] = useState('');
  const [period, setPeriod] = useState<'7' | '30' | 'all'>(initialStep ? 'all' : '30'), [status, setStatus] = useState(''), [kind, setKind] = useState(''), [q, setQ] = useState(''), [step, setStep] = useState<Step | ''>(initialStep ?? '');
  const range = useMemo(() => period === 'all' ? {} : period === '7' ? { from: new Date(Date.now() - DAY).toISOString(), to: new Date(Date.now() + 7 * DAY).toISOString() } : { from: new Date(Date.now() - 30 * DAY).toISOString(), to: new Date(Date.now() + 30 * DAY).toISOString() }, [period]);
  const { items, state, reload } = useInterventions(org, range.from, range.to);
  const clientManager = !admin && org.kind === 'CLIENT' && (org.roles ?? []).includes('CLIENT_MANAGER');
  const needle = q.trim().toLocaleLowerCase(lang);
  const visible = items.filter(i => (!status || i.status === status) && (!step || stepStatuses[step].includes(i.status)) && (!kind || i.kind === kind) && (!needle || [ref(i.number), i.title, i.zones.join(' '), i.provider_name, i.client_name].join(' ').toLocaleLowerCase(lang).includes(needle)));
  const partner = org.kind === 'CLIENT' ? 'provider' : 'client';
  const stepNames: Record<Step, string> = { request: t.stRequest, quote: t.stQuote, assign: t.stAssign, work: t.stWork, review: t.stReview, accepted: t.stAccepted };
  return <section className="interventions">
    <PageHead title={t.interventions} subtitle={ctx.subtitle}
      cells={[{ label: tab === 'list' ? t.interventions : t.programmes, value: tab === 'list' ? (state === 'ready' ? `${visible.length}${visible.length !== items.length ? ` / ${items.length}` : ''}` : '–') : '—' }]}
      actions={clientManager ? <div className="toolbar-actions"><button className="secondary" onClick={() => { setForm('programme'); setNotice(''); }}><PlusIcon />{t.newProgramme}</button><button className={form ? 'secondary' : 'primary'} onClick={() => { setForm('maintenance'); setNotice(''); }}><PlusIcon />{t.newMaintenance}</button></div> : undefined} />
    <div className="toolbar">
      <div className="segmented" role="group" aria-label={t.interventions}>
        <button type="button" aria-pressed={tab === 'list'} onClick={() => setTab('list')}>{t.interventions}</button>
        <button type="button" aria-pressed={tab === 'programmes'} onClick={() => setTab('programmes')}>{t.programmes}</button></div>
    </div>
    {notice && <Alert kind="success">{notice}</Alert>}
    <div className={form ? 'workspace has-panel' : 'workspace'} data-detail={form ? 'open' : 'closed'}>
      <div className="pane-list">
        {tab === 'programmes' ? <Programmes org={org} lang={lang} admin={admin} />
          : <>
            <div className="filters">
              <label className="filter-search">{t.search}<span className="search-field"><SearchIcon /><input type="search" value={q} placeholder={t.searchHint} onChange={e => setQ(e.target.value)} /></span></label>
              <label>{t.step}<select aria-label={t.step} value={step} onChange={e => setStep(e.target.value as Step | '')}><option value="">{t.allSteps}</option>{steps.map(s => <option key={s} value={s}>{stepNames[s]}</option>)}</select></label>
              <label>{t.status}<select aria-label={t.status} value={status} onChange={e => setStatus(e.target.value)}><option value="">{t.allStatuses}</option>{Object.entries(statuses).map(([k, v]) => <option key={k} value={k}>{v[lang === 'fr' ? 0 : 1]}</option>)}</select></label>
              <label>{t.period}<select aria-label={t.period} value={period} onChange={e => setPeriod(e.target.value as '7')}><option value="7">{t.p7}</option><option value="30">{t.p30}</option><option value="all">{t.pAll}</option></select></label>
              <label>{t.kind}<select aria-label={t.kind} value={kind} onChange={e => setKind(e.target.value)}><option value="">{t.allKinds}</option><option value="CLEANING">{t.CLEANING}</option><option value="MAINTENANCE">{t.MAINTENANCE}</option></select></label>
            </div>
            {state === 'error' ? <LoadError text={t.loadError} retry={reload} t={t} /> : state === 'loading' && !items.length ? <Skeleton label={t.loading} />
              : !visible.length ? <Empty icon={<ClipboardIcon />}>{t.empty}</Empty>
              : <div className="table-card"><table className="audit-table work-table">
                  <thead><tr><th scope="col" className="col-ref">{t.number}</th><th scope="col">{t.title}</th><th scope="col" className="col-slot">{t.slot}</th><th scope="col" className="col-party">{partner === 'provider' ? t.partner : t.client}</th>
                    <th scope="col" className="col-visa">{lang === 'fr' ? 'Visas' : 'Sign-offs'}</th><th scope="col" className="col-status">{t.status}</th></tr></thead>
                  <tbody>{visible.map(i => {
                    const party = partner === 'provider' ? i.provider_name : i.client_name, [day, hours] = slotLines(i, lang);
                    const team = [...i.agents].sort((a, b) => Number(b.lead) - Number(a.lead)), meta = [t[i.kind], i.programme_id ? t.from : '', i.zones.join(', ')].filter(Boolean).join(' · ');
                    return <tr key={i.id} className="clickable" onClick={() => onOpen(i.id)}>
                      <td data-label={t.number} className="work-ref-cell"><span className="work-ref">{ref(i.number)}</span></td>
                      <td data-label={t.title} className="work-main-cell">
                        <span className="work-head"><button type="button" className="work-title" title={i.title} onClick={e => { e.stopPropagation(); onOpen(i.id); }}>{i.title}</button>
                          {i.priority === 'URGENT' && <span className="state state-red">{t.urgent}</span>}</span>
                        <span className="work-meta" title={meta}>{meta}{team.length ? ` · ${team.map(a => a.name).join(', ')}` : ''}</span>
                      </td>
                      <td data-label={t.slot} className="work-slot-cell"><span className="slot-day">{day}</span><span className="slot-hours">{hours}</span></td>
                      <td data-label={partner === 'provider' ? t.partner : t.client} className="work-party-cell"><span className="work-party" title={party}>{party}</span></td>
                      <td data-label={lang === 'fr' ? 'Visas' : 'Sign-offs'} className="work-visa-cell">{stripOf(i, org, admin, t)}</td>
                      <td data-label={t.status} className="work-status-cell"><span className="work-status">{chips(i, lang)}
                        {i.open_anomalies > 0 && <span className="state state-red work-anomalies" title={t.anomalies}><AlertIcon />{i.open_anomalies}</span>}</span></td>
                    </tr>;
                  })}</tbody></table></div>}
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
  const date = (d: string) => new Date(d).toLocaleDateString(locale(lang), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  if (state === 'loading') return <Skeleton label={t.loading} />;
  if (state === 'error') return <LoadError text={t.loadError} retry={() => setAttempt(n => n + 1)} t={t} />;
  if (!rows.length) return <Empty icon={<CalendarIcon />}>{t.noProgramme}</Empty>;
  return <>
    {notice && <Alert kind="success">{notice}</Alert>}
    <ul className="programmes">{rows.map(p => <li key={p.id} className="sheet programme">
      <div className="programme-head"><div><h3>{p.title}</h3><p className="muted">{p.site_name} · {org.kind === 'CLIENT' ? p.provider_name : p.client_name}</p></div>
        {providerManager && open !== p.id && <button className="secondary small" onClick={() => setOpen(p.id)}>{t.setTeam}</button>}</div>
      <dl className="programme-facts">
        <div><dt>{t.prDays}</dt><dd>{p.weekdays.map(d => t.days[d - 1]).join(', ')} · {p.start_time}–{p.end_time}</dd></div>
        <div><dt>{t.period}</dt><dd>{date(p.start_date)} – {date(p.end_date)}</dd></div>
        <div><dt>{t.passages}</dt><dd><span className="programme-progress"><span className="meter" aria-hidden="true"><span style={{ width: `${p.passages ? (p.accepted / p.passages) * 100 : 0}%` }} /></span>{fill(t.acceptedOf, { a: p.accepted, n: p.passages })}</span></dd></div>
        {p.team.length > 0 && <div><dt>{t.team}</dt><dd>{p.team.join(', ')}</dd></div>}
      </dl>
      {providerManager && open === p.id && <TeamForm org={org} lang={lang} url={`programmes/${p.id}/team`} onCancel={() => setOpen('')} onDone={r => { setOpen(''); setNotice(fill(t.teamSet, { n: r.assigned, s: r.skipped ? fill(t.skipped, { n: r.skipped }) : '' })); setAttempt(n => n + 1); }} />}
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
    {error && <Alert>{error}</Alert>}
    <label>{t.prTitle}<input name="title" required maxLength={200} /></label>
    <label>{t.description}<textarea name="description" maxLength={4000} /></label>
    <label>{t.prSite}<select aria-label={t.prSite} value={site} onChange={e => { setSite(e.target.value); setZones([]); }}>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label>{t.prProvider}<select aria-label={t.prProvider} name="providerId" required>{linked.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>{!linked.length && <small>{t.noLinked}</small>}</label>
    {site && <ZonePicker org={org} site={site} value={zones} onChange={setZones} t={t} />}
    <div className="form-row"><label>{t.mtStarts}<input name="startsAt" type="datetime-local" required /></label><label>{t.mtEnds}<input name="endsAt" type="datetime-local" required /></label></div>
    <label className="check"><input type="checkbox" name="quote" /><span><strong>{t.mtQuote}</strong><span className="muted">{t.mtQuoteHelp}</span></span></label>
    <label className="check"><input type="checkbox" name="urgent" /><span><strong>{t.mtPriority}</strong></span></label>
    <label>{t.prTasks}<textarea name="tasks" rows={4} /></label>
  </div><div className="panel-foot"><button type="button" className="secondary" disabled={busy} onClick={onClose}>{t.cancelForm}</button><button className="primary" disabled={busy || !linked.length}>{t.send}</button></div></form></Panel>;
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
    {error && <Alert>{error}</Alert>}
    <label>{t.prTitle}<input name="title" required maxLength={200} /></label>
    <label>{t.prSite}<select aria-label={t.prSite} value={site} onChange={e => { setSite(e.target.value); setZones([]); }}>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label>{t.prProvider}<select aria-label={t.prProvider} name="providerId" required>{linked.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>{!linked.length && <small>{t.noLinked}</small>}</label>
    {site && <ZonePicker org={org} site={site} value={zones} onChange={setZones} t={t} />}
    <fieldset><legend>{t.prDays}</legend><div className="day-chips">{t.days.map((d, i) => <label key={d} className="chip-check"><input type="checkbox" checked={days.includes(i + 1)} onChange={e => setDays(e.target.checked ? [...days, i + 1].sort() : days.filter(x => x !== i + 1))} /><span>{d}</span></label>)}</div></fieldset>
    <div className="form-row"><label>{t.prStartDate}<input name="startDate" type="date" required /></label><label>{t.prEndDate}<input name="endDate" type="date" required /></label></div>
    <div className="form-row"><label>{t.prStartTime}<input name="startTime" type="time" required defaultValue="06:00" /></label><label>{t.prEndTime}<input name="endTime" type="time" required defaultValue="07:30" /></label></div>
    <label>{t.prTasks}<textarea name="tasks" rows={5} /></label>
  </div><div className="panel-foot"><button type="button" className="secondary" disabled={busy} onClick={onClose}>{t.cancelForm}</button><button className="primary" disabled={busy || !linked.length}>{t.save}</button></div></form></Panel>;
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
    {error && <Alert>{error}</Alert>}
    <fieldset><legend>{t.agents}</legend><ul className="checks">{agents.map(a => <li key={a.membership_id}><label className="check"><input type="checkbox" checked={team.includes(a.membership_id)}
      onChange={e => { const next = e.target.checked ? [...team, a.membership_id] : team.filter(x => x !== a.membership_id); setTeam(next); if (!next.includes(lead)) setLead(next[0] ?? ''); }} /><span><strong>{a.display_name}</strong></span></label></li>)}</ul></fieldset>
    <label>{t.lead}<select aria-label={t.lead} value={lead} onChange={e => setLead(e.target.value)}><option value="">—</option>{agents.filter(a => team.includes(a.membership_id)).map(a => <option key={a.membership_id} value={a.membership_id}>{a.display_name}</option>)}</select></label>
    <div className="toolbar-actions"><button type="button" className="secondary" disabled={busy} onClick={onCancel}>{t.cancelForm}</button><button className="primary" disabled={busy}>{t.assignTeam}</button></div>
  </form>;
}

/* ------------------------------------------------------------- the detail */

type Raw = Omit<Item, 'zones' | 'agents'> & { description: string | null; quote_required: boolean; report_note: string | null; started_at: string | null; submitted_at: string | null; accepted_at: string | null; round: number; created_by_name: string; programme_title: string | null;
  tasks: { id: string; position: number; label: string; status: string; note: string | null; rework: boolean; done_by: string | null; done_at: string | null }[];
  actions: string[];
  quotes: { id: string; amount_xaf: string; delay_days: number; description: string; status: string; reason: string | null; created_at: string; created_by: string; decided_by: string | null }[];
  photos: { id: string; task_id: string | null; phase: string; round: number; created_at: string; uploaded_by: string }[];
  anomalies: { id: string; title: string; description: string | null; status: string; resolution: string | null; closing_note: string | null; created_at: string; zone_name: string | null; created_by: string; closed_by: string | null }[];
  events: { id: string; action: string; reason: string | null; created_at: string; actor: string; to_status: string | null }[];
  zones: { id: string; code: string; name: string; kind: string; path: string[] }[]; agents: { membership_id: string; lead: boolean; display_name: string; login: string }[] };

/** The visa band of a dossier: each step of the chain, signed by its real author, or waiting for the next one. */
function visasOf(d: Raw, t: T, lang: Lang): Visa[] {
  const last = (actions: string[]) => [...d.events].filter(e => actions.includes(e.action)).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const at = (iso: string) => when(iso, d.timezone, lang);
  const can = (a: string) => d.actions.includes(a);
  const waitOr = (action: string) => can(action) ? 'mine' as const : 'waiting' as const;
  const out: Visa[] = [];
  const req = last(['REQUESTED', 'SCHEDULED']);
  out.push({ key: 'request', step: t.vRequest, state: 'signed', name: req?.actor ?? d.created_by_name, date: req ? at(req.created_at) : undefined });
  if (d.quote_required || d.quotes.length) {
    const acc = last(['QUOTE_ACCEPTED']), refused = last(['QUOTE_REFUSED']), sent = last(['QUOTE_SUBMITTED']);
    const quote = d.quotes.find(q => q.status === 'ACCEPTED'), amount = quote ? `${Number(quote.amount_xaf).toLocaleString(locale(lang))} FCFA` : undefined;
    if (d.status === 'REQUESTED') out.push({ key: 'quote', step: t.vQuote, state: waitOr('QUOTE'), name: can('QUOTE') ? t.vMine : d.provider_name, note: t.waiting.REQUESTED });
    else if (d.status === 'QUOTE_SUBMITTED') out.push({ key: 'quote', step: t.vQuote, state: waitOr('DECIDE_QUOTE'), name: can('DECIDE_QUOTE') ? t.vMine : d.client_name, note: sent ? fill(t.vQuoteSent, { n: sent.actor }) : undefined });
    else if (d.status === 'QUOTE_REFUSED') out.push({ key: 'quote', step: t.vQuote, state: 'refused', name: refused?.actor, date: refused ? at(refused.created_at) : undefined, note: t.vRefused });
    else out.push({ key: 'quote', step: t.vQuote, state: acc ? 'signed' : 'future', name: acc?.actor, date: acc ? at(acc.created_at) : undefined, note: amount });
  }
  const assigned = last(['ASSIGNED']), lead = d.agents.find(a => a.lead), teamSet = d.agents.length > 0 && !['REQUESTED', 'QUOTE_SUBMITTED', 'QUOTE_REFUSED', 'PLANNED'].includes(d.status);
  out.push(assigned && teamSet
    ? { key: 'assign', step: t.vAssign, state: 'signed', name: assigned.actor, date: at(assigned.created_at), note: lead ? fill(t.vLead, { n: lead.display_name }) : undefined }
    // A programme passage receives its team with the programme: the provider assigned it, without a separate event.
    : teamSet ? { key: 'assign', step: t.vAssign, state: 'signed', name: d.provider_name, note: lead ? fill(t.vLead, { n: lead.display_name }) : undefined }
    : { key: 'assign', step: t.vAssign, state: d.status === 'PLANNED' ? waitOr('ASSIGN') : 'future', name: d.status === 'PLANNED' ? (can('ASSIGN') ? t.vMine : d.provider_name) : undefined, note: d.status === 'PLANNED' ? t.waiting.PLANNED : undefined });
  // A waiting case names who must act: the agent leading the mission, or the organisation expected to decide.
  const reported = last(['SUBMITTED', 'RESUBMITTED']), agent = lead?.display_name ?? d.agents[0]?.display_name ?? d.provider_name;
  out.push(['UNDER_REVIEW', 'ACCEPTED'].includes(d.status) && reported
    ? { key: 'work', step: t.vWork, state: 'signed', name: reported.actor, date: at(reported.created_at), note: d.round > 1 ? `${t.round} ${d.round}` : undefined }
    // Rework keeps the report it supersedes, and says who redoes it.
    : d.status === 'REWORK' ? { key: 'work', step: t.vWork, state: can('SUBMIT') || can('TASKS') ? 'mine' : 'waiting', name: reported?.actor ?? agent, date: reported ? at(reported.created_at) : undefined, note: `${t.vRework} · ${can('SUBMIT') || can('TASKS') ? t.vMine : agent}` }
    : d.status === 'IN_PROGRESS' ? { key: 'work', step: t.vWork, state: waitOr('SUBMIT'), name: can('SUBMIT') ? t.vMine : agent, note: d.started_at ? fill(t.vInProgress, { d: at(d.started_at) }) : undefined }
    : d.status === 'ASSIGNED' ? { key: 'work', step: t.vWork, state: waitOr('START'), name: can('START') ? t.vMine : agent, note: t.waiting.ASSIGNED }
    : { key: 'work', step: t.vWork, state: 'future' });
  const accepted = last(['ACCEPTED']), rework = last(['REWORK_REQUESTED']);
  out.push(d.status === 'ACCEPTED' && accepted ? { key: 'review', step: t.vReview, state: 'signed', name: accepted.actor, date: at(accepted.created_at) }
    : d.status === 'UNDER_REVIEW' ? { key: 'review', step: t.vReview, state: waitOr('REVIEW'), name: can('REVIEW') ? t.vMine : d.client_name, note: t.waiting.UNDER_REVIEW }
    : d.status === 'REWORK' && rework ? { key: 'review', step: t.vReview, state: 'rework', name: rework.actor, date: at(rework.created_at), note: t.vRework }
    : { key: 'review', step: t.vReview, state: 'future' });
  return out;
}

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
  const [open, setOpen] = useState<string>('');
  // Steps signed since the dossier was opened get the stamp; the first load shows them as they are.
  const signedBefore = useRef<Set<string> | null>(null), [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => { let a = true; setFailed(false); api(`interventions/${id}`, undefined, org.id).then(r => { if (a) setD(r); }).catch(() => { if (a) setFailed(true); }); return () => { a = false; }; }, [id, org.id, attempt]);
  const visas = useMemo(() => d ? visasOf(d, t, lang) : [], [d, lang]);
  useEffect(() => {
    if (!d) return;
    const now = new Set(visas.filter(v => v.state === 'signed').map(v => v.key));
    if (signedBefore.current) setFresh(new Set([...now].filter(k => !signedBefore.current!.has(k))));
    signedBefore.current = now;
  }, [visas]);
  if (failed) return <LoadError text={t.loadError} retry={() => setAttempt(n => n + 1)} t={t} />;
  if (!d) return <Skeleton label={t.loading} />;
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
        <div className="toolbar-actions"><button type="button" className="secondary" disabled={busy} onClick={() => setOpen('')}>{t.cancelForm}</button><button className={primary ? 'primary' : 'danger'} disabled={busy}>{label}</button></div></form>
    : null;
  const pending = d.tasks.filter(x => x.status === 'TODO').length, finished = d.tasks.length - pending;
  const waiting = t.waiting[d.status];
  const photosOf = (task: string | null, phase: string) => d.photos.filter(p => p.task_id === task && p.phase === phase);
  const anyAction = ['QUOTE', 'DECIDE_QUOTE', 'ASSIGN', 'START', 'SUBMIT', 'REVIEW'].some(can);
  const meta = [ref(d.number), t[d.kind], d.programme_title ? `${t.from} « ${d.programme_title} »` : ''].filter(Boolean).join(' · ');

  return <section className="detail">
    <button className="back-link" onClick={onBack}><BackIcon />{t.back}</button>
    <PageHead title={d.title} subtitle={meta}
      cells={[
        { label: t.site, value: d.site_name },
        { label: `${t.client} → ${t.partner}`, value: `${d.client_name} → ${d.provider_name}` },
        { label: t.planned, value: `${when(d.starts_at, tz, lang)} – ${when(d.ends_at, tz, lang, dayKey(d.starts_at, tz) === dayKey(d.ends_at, tz) ? 'time' : 'full')}` },
        { label: t.status, value: <span className="cart-states">{statusBadge(d.status, lang)}{d.priority === 'URGENT' && <span className="state state-red">{t.urgent}</span>}</span> },
      ]}
      actions={<button className="secondary" onClick={download}>{t.pdf}</button>} />
    <div className={fresh.size ? 'visa-wrap has-fresh' : 'visa-wrap'} data-fresh={[...fresh].join(' ') || undefined}>
      <VisaBand visas={visas.map(v => fresh.has(v.key) ? { ...v, fresh: true } : v)} label={t.visas} />
    </div>
    {d.status === 'CANCELLED' && <p className="sheet-note is-alert"><AlertIcon />{t.vCancelled}</p>}
    {error && <Alert>{error}</Alert>}
    {notice && <Alert kind="success">{notice}</Alert>}

    <div className="detail-grid">
      <div className="detail-main">
        <Sheet id="next" title={t.nextStep} className={anyAction ? 'sheet-action' : undefined}>
          {!anyAction && <p className="muted">{waiting ? `${t.waitingFor} ${waiting}.` : t.noAction}</p>}
          <div className="next-actions">
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
          </div>
          {can('CANCEL') && (form('cancel', f => void run('cancel', { reason: f.get('reason') }), <label>{t.reason}<textarea name="reason" required maxLength={1000} /></label>, t.confirmCancel, false)
            ?? <button className="link-button danger-link" onClick={() => setOpen('cancel')}>{t.cancel}</button>)}
        </Sheet>

        <Sheet id="tasks" title={t.tasks} meta={`${finished}/${d.tasks.length}`}>
          <div className="table-card table-flat"><table className="conformity">
            <thead><tr><th scope="col" className="col-n">{t.number}</th><th scope="col">{t.tasks}</th><th scope="col" className="col-result">{t.result}</th><th scope="col" className="col-by">{t.doneBy}</th><th scope="col" className="col-photo">{t.before}</th><th scope="col" className="col-photo">{t.after}</th></tr></thead>
            <tbody>{d.tasks.map((x, n) => {
              const cell = (ph: 'BEFORE' | 'AFTER') => { const list = photosOf(x.id, ph); return list.length
                ? <span className="photo-cell">{list.map(p => <Photo key={p.id} org={org} id={id} photo={p.id} alt={`${ph === 'BEFORE' ? t.before : t.after} — ${x.label}`} />)}</span>
                : <span className="no-photo">{t.noPhotoCell}</span>; };
              return <React.Fragment key={x.id}>
                <tr className={`task task-${x.status.toLowerCase()}${x.rework ? ' is-rework' : ''}`}>
                  <td data-label={t.number}><span className="task-n">{n + 1}</span></td>
                  <td data-label={t.tasks} className="task-body"><div className="task-stack"><strong className="task-label">{x.label}</strong>{x.rework && <span className="state state-red">{t.reworkFlag}</span>}{x.note && <p className="task-note">{x.note}</p>}</div></td>
                  <td data-label={t.result}><span className={`task-result result-${x.status.toLowerCase()}`}>{x.status === 'DONE' ? <><CheckIcon />{t.done}</> : x.status === 'IMPOSSIBLE' ? <><CloseIcon />{t.impossible}</> : t.todo}</span></td>
                  <td data-label={t.doneBy} className="task-by">{x.done_by ? <div className="task-stack"><span>{x.done_by}</span><small>{when(x.done_at!, tz, lang)}</small></div> : <span className="muted">—</span>}</td>
                  <td data-label={t.before}>{cell('BEFORE')}</td>
                  <td data-label={t.after}>{cell('AFTER')}</td>
                </tr>
                {can('TASKS') && <tr className="task-actions-row"><td colSpan={6}><div className="task-actions">
                  {x.status !== 'DONE' && <button className="secondary small" disabled={busy} onClick={() => void run(`tasks/${x.id}`, { status: 'DONE' })}><CheckIcon />{t.done}</button>}
                  {x.status === 'TODO' && (open === 'imp-' + x.id ? null : <button className="secondary small" disabled={busy} onClick={() => setOpen('imp-' + x.id)}>{t.impossible}</button>)}
                  {x.status !== 'TODO' && <button className="link-button" disabled={busy} onClick={() => void run(`tasks/${x.id}`, { status: 'TODO' })}>{t.reopen}</button>}
                  {(['BEFORE', 'AFTER'] as const).map(ph => <label key={ph} className="upload secondary small"><input type="file" accept="image/jpeg,image/png" capture="environment" disabled={busy} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f, ph, x.id); }} />{ph === 'BEFORE' ? t.addBefore : t.addAfter}</label>)}
                  {form('imp-' + x.id, f => void run(`tasks/${x.id}`, { status: 'IMPOSSIBLE', note: f.get('note') }), <label>{t.impossibleNote}<textarea name="note" required maxLength={2000} /></label>, t.impossible, false)}
                </div></td></tr>}
              </React.Fragment>;
            })}</tbody></table></div>
          {d.report_note && <div className="report-note"><h3>{t.reportNote}</h3><p>{d.report_note}</p></div>}
        </Sheet>

        <Sheet id="anomalies" title={t.anomaliesTitle} meta={d.anomalies.length ? String(d.anomalies.length) : undefined}>
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
            <label>{t.description}<textarea name="description" maxLength={4000} /></label></>, t.reportAnomaly) ?? <div><button className="secondary small" onClick={() => setOpen('anomaly')}><PlusIcon />{t.reportAnomaly}</button></div>)}
        </Sheet>
      </div>

      <aside className="detail-side">
        <Sheet id="facts" title={lang === 'fr' ? 'Fiche' : 'Record'}>
          <dl className="facts">
            <div><dt>{t.places}</dt><dd>{d.zones.map(z => <span key={z.id} className="fact-place"><span>{[...z.path, z.name].join(' › ')}</span><span className="zone-code">{z.code}</span></span>)}</dd></div>
            <div><dt>{t.team}</dt><dd>{d.agents.length ? d.agents.map(a => <span key={a.membership_id} className="agent-chip static"><Avatar name={a.display_name} seed={a.login} size="sm" /><span>{a.display_name}{a.lead ? ` · ${t.lead.toLowerCase()}` : ''}</span></span>) : t.none}</dd></div>
            {d.started_at && <div><dt>{t.started}</dt><dd>{when(d.started_at, tz, lang)}</dd></div>}
            {d.submitted_at && <div><dt>{t.submitted}</dt><dd>{when(d.submitted_at, tz, lang)}</dd></div>}
            {d.accepted_at && <div><dt>{t.accepted}</dt><dd>{when(d.accepted_at, tz, lang)}</dd></div>}
            {d.round > 1 && <div><dt>{t.round}</dt><dd>{d.round}</dd></div>}
            <div><dt>{t.createdBy}</dt><dd>{d.created_by_name}</dd></div>
          </dl>
          {d.description && <p className="detail-desc">{d.description}</p>}
        </Sheet>
        {(d.quote_required || d.quotes.length > 0) && <Sheet id="quote" title={t.quote}>{d.quotes.length ? d.quotes.map(q => <div key={q.id} className="quote">
          <p className="quote-head"><strong>{Number(q.amount_xaf).toLocaleString(locale(lang))} FCFA</strong><span>{q.delay_days} {lang === 'fr' ? 'j' : 'd'}</span><span className={`state ${q.status === 'ACCEPTED' ? 'state-green' : q.status === 'REFUSED' ? 'state-red' : 'state-amber'}`}>{t[q.status as 'PENDING']}</span></p>
          <p className="muted">{q.description}</p>{q.reason && <p className="muted">{t.reason} : {q.reason}</p>}</div>) : <p className="muted">{t.waiting.REQUESTED}</p>}</Sheet>}
        {d.photos.some(p => !p.task_id) && <Sheet id="photos" title={t.photos}><div className="task-photos">{d.photos.filter(p => !p.task_id).map(p => <figure key={p.id}><Photo org={org} id={id} photo={p.id} alt={p.phase} /><figcaption>{p.phase === 'BEFORE' ? t.before : t.after}</figcaption></figure>)}</div></Sheet>}
        <Sheet id="history" title={t.history} meta={String(d.events.length)}>
          <ol className="timeline">{[...d.events].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(e => <li key={e.id}><strong>{(events[e.action] ?? [e.action, e.action])[lang === 'fr' ? 0 : 1]}</strong><span className="muted">{e.actor} · {when(e.created_at, tz, lang)}</span>{e.reason && <span className="timeline-reason">{e.reason}</span>}</li>)}</ol>
        </Sheet>
      </aside>
    </div>
  </section>;
}
