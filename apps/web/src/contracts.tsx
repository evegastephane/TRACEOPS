import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type { Lang } from './i18n';
import { AlertIcon, BackIcon, CheckIcon, ContractIcon, PenIcon, PlusIcon, TrashIcon } from './icons';
import { Alert, Empty, PageHead, Sheet, Skeleton } from './ui';
import {
  addDays, contractRef, dateText, daysBetween, fcfa, fill, instantDay, num, paymentState, say, serviceLabel, serviceState, shortFcfa, tenderRef, todayKey, valueText,
  type Ctx, type Field, type FieldValue, type Org, type QualityCriterion, type Tone,
} from './procurement-model';

/* ------------------------------------------------------------------ words */

const fr = {
  title: 'Contrats', intro: 'Chaque prestataire retenu est suivi sur trois dimensions — coût, délai et qualité — jusqu’au bilan qui compare les engagements initiaux aux résultats obtenus.',
  active: 'En cours', committed: 'Montant engagé', acceptedAmt: 'Réceptionné', avgQuality: 'Qualité moyenne', all: 'Tous', closedPl: 'Clôturés',
  number: 'N°', contract: 'Contrat', cost: 'Coût', delay: 'Délai', quality: 'Qualité', services: 'Prestations', status: 'Statut',
  ACTIVE: 'En cours', CLOSED: 'Clôturé', loading: 'Chargement…', retry: 'Réessayer', loadError: 'Impossible de charger les contrats. Réessayez.', back: 'Contrats',
  empty: 'Aucun contrat pour le moment.', emptyText: 'Un contrat s’ouvre quand un appel d’offres est attribué : les engagements de l’offre retenue y sont suivis.',
  ofCommitted: 'sur {a}', paidAmt: 'réglé {a}', endPlanned: 'Fin prévue le {d}', endedOn: 'Terminé le {d}', onTime: 'Dans les délais', lateN: '{n} en retard', notEvaluated: 'Pas encore évalué',
  targetOf: 'objectif {n}/10', acceptedOf: '{a}/{n} acceptées', toAcceptN: '{n} à réceptionner', rejectedN: '{n} rejetée(s)', overdueN: '{n} règlement(s) en retard',
  // detail
  provider: 'Prestataire', client: 'Client', period: 'Période', terms: 'Règlement', termsValue: '{n} j après acceptation', from: 'Issu de {n}',
  tracker: 'Coût, délai, qualité', costNote: 'réceptionnés sur {a} engagés', plannedSchedule: 'Prévu à l’échéancier', paid: 'Réglé', toPay: 'Reste à régler', overdueChip: '{n} en retard',
  delayDays: '{n} j restants', delayBefore: 'avant la fin prévue le {d}', delayLate: '+{n} j', delayLateNote: 'après la fin prévue du {d}', delayHeld: 'Tenu', delayEarly: '−{n} j',
  delayClosedNote: 'fin réelle le {a} pour une fin prévue le {b}', start: 'Début', end: 'Fin prévue', lateServices: 'Prestations en retard', rejected: 'Rejets, reprises comprises',
  qualityNote: 'objectif {t}/10 · {n} évaluation(s)', lastEval: 'Dernière évaluation', noEval: 'Aucune évaluation pour l’instant.',
  schedule: 'Prestations et règlements', scheduleMeta: '{a}/{n} acceptées · acceptation et règlement sont deux états distincts', service: 'Prestation', planned: 'Prévue le', amount: 'Montant',
  serviceState: 'Prestation', paymentState: 'Règlement', deliver: 'Déclarer réalisée', redeliver: 'Déclarer réalisée à nouveau', accept: 'Accepter', reject: 'Rejeter', pay: 'Enregistrer le règlement',
  edit: 'Modifier', remove: 'Retirer', addService: 'Ajouter une prestation', label: 'Intitulé', plannedDate: 'Date prévue', save: 'Enregistrer', cancel: 'Annuler', note: 'Observation (facultative)',
  rejectReason: 'Motif du rejet', confirmAccept: 'Confirmer l’acceptation', acceptHelp: 'Une fois acceptée, la prestation est due le {d} ({n} jours après l’acceptation).',
  deliverHelp: 'Le client réceptionne ensuite la prestation : il l’accepte ou la rejette avec un motif.', paidOn: 'Date du règlement', paidAmount: 'Montant réglé', reference: 'Référence (virement, chèque)',
  refShort: 'réf. {r}', reason: 'Motif', by: 'par {n}', deliveredMsg: 'Prestation déclarée réalisée.', acceptedMsg: 'Prestation acceptée : le règlement est programmé.', rejectedMsg: 'Prestation rejetée.',
  paidMsg: 'Règlement enregistré.', savedMsg: 'Échéancier mis à jour.',
  evaluations: 'Évaluations qualité', evalMeta: '{n} · moyenne {a}/10', newEval: 'Nouvelle évaluation', evalTitle: 'Évaluation qualité', evalHelp: 'Notez chaque critère de 1 (très insuffisant) à 10 (excellent). Justifiez vos notes : elles servent au bilan du contrat.',
  evalDate: 'Date de l’évaluation', evalService: 'Prestation concernée', wholeContract: 'Le contrat dans son ensemble', justification: 'Justification', justHint: 'Constat qui explique la note…',
  comment: 'Commentaire général', average: 'Moyenne', saveEval: 'Enregistrer l’évaluation', evalSaved: 'Évaluation enregistrée.', perCriterion: 'Moyenne par critère', evaluator: 'Évaluateur',
  bilanFinal: 'Bilan définitif', bilanDraft: 'Bilan provisoire', bilanFinalMeta: 'arrêté le {d} par {n}', bilanDraftMeta: 'au {d} · engagements initiaux et résultats',
  dimension: 'Dimension', commitment: 'Engagement initial', resultCol: 'Résultat obtenu', gap: 'Écart', verdict: 'Appréciation', bidRetained: 'offre retenue : {a}',
  forecast: 'prévu, dont {a} réceptionnés', duration: '{n} j · fin le {d}', endReal: 'fin réelle le {d}', endEstimate: 'fin estimée le {d}', evalCount: '{n} évaluation(s)',
  vConform: 'Conforme à l’engagement', vOver: 'Dépassement de {p} %', vSaving: 'Économie de {p} %', vHeld: 'Délai tenu', vEarly: 'Terminé avec {n} j d’avance', vLate: 'Retard de {n} j',
  vReached: 'Objectif atteint', vNear: 'Légèrement en deçà', vBelow: 'En deçà de l’objectif', vNone: 'Pas encore évalué', forecastTag: 'prévision',
  rejectedLine: '{n} rejet(s) de prestation, chaque fois repris par le prestataire', lastAcceptedOn: 'dernière acceptation le {d}', editHint: 'Modifier cette échéance', removeIt: 'Retirer cette prestation', paymentsLine: 'Règlements : {a} sur {n} payés à l’échéance', noPayment: 'Aucun règlement enregistré pour l’instant.',
  conclusion: 'Conclusion', closeContract: 'Clôturer le contrat et arrêter le bilan', closeHelp: 'Le bilan est figé à la clôture. Les règlements restant dus pourront encore être enregistrés.',
  pendingWarn: '{n} prestation(s) ne sont pas encore acceptées.', actualEnd: 'Date de fin réelle', closingNote: 'Conclusion du bilan', confirmClose: 'Clôturer et arrêter le bilan', closedMsg: 'Contrat clôturé : bilan arrêté.',
  offer: 'Offre retenue', offerAmount: 'Montant proposé', offerDelay: 'Délai proposé', content: 'Contenu', strengths: 'Points forts', history: 'Historique', days: 'jours', none: '—',
  PROPOSED: 'À accepter', DECLINED: 'Refusé', pendingClient: '{p} doit accepter ce contrat : il interviendra sur le site, et les prestations pourront être réceptionnées, seulement après son acceptation.',
  respondTitle: 'Acceptez-vous ce contrat ?', respondHelp: 'En l’acceptant, vous vous engagez sur le montant, la durée et le délai de règlement indiqués, et vous êtes rattaché au site. En le refusant, le client pourra retenir une autre offre.',
  acceptContract: 'Accepter le contrat', declineContract: 'Refuser le contrat', declineReason: 'Motif du refus', contractAccepted: 'Contrat accepté : vous êtes rattaché au site et pouvez réaliser les prestations.',
  contractDeclined: 'Contrat refusé : le client en est informé.', declinedTitle: 'Contrat refusé par le prestataire', declinedText: 'Refusé le {d} par {n} : {r}. L’appel d’offres est revenu en analyse pour retenir une autre offre.',
  acceptedOn: 'accepté le {d}', recordTitle: 'Réponse écrite du prestataire',
  recordHelp: '{p} n’a pas de compte TRACEOPS : enregistrez sa réponse écrite (courrier ou courriel signé). Acceptée, le contrat s’ouvre et le prestataire est rattaché au site ; refusée, l’appel d’offres revient en analyse.',
  recordAccept: 'Enregistrer l’acceptation', recordDecline: 'Enregistrer le refus', recordRef: 'Référence de la réponse écrite', recordRefHint: 'Ex. : courrier signé du 12/11, réf. DG/2026/118',
  recordedAccepted: 'Acceptation enregistrée : le contrat est ouvert.',
};
type T = typeof fr;
const en: T = {
  title: 'Contracts', intro: 'Each retained provider is followed on three dimensions — cost, delay and quality — up to the final review that compares the initial commitments with the results.',
  active: 'Active', committed: 'Committed amount', acceptedAmt: 'Accepted', avgQuality: 'Average quality', all: 'All', closedPl: 'Closed',
  number: 'No.', contract: 'Contract', cost: 'Cost', delay: 'Delay', quality: 'Quality', services: 'Services', status: 'Status',
  ACTIVE: 'Active', CLOSED: 'Closed', loading: 'Loading…', retry: 'Try again', loadError: 'The contracts could not be loaded. Try again.', back: 'Contracts',
  empty: 'No contract yet.', emptyText: 'A contract opens when a tender is awarded: the commitments of the retained offer are followed there.',
  ofCommitted: 'of {a}', paidAmt: 'paid {a}', endPlanned: 'Planned end {d}', endedOn: 'Ended on {d}', onTime: 'On time', lateN: '{n} late', notEvaluated: 'Not evaluated yet',
  targetOf: 'target {n}/10', acceptedOf: '{a}/{n} accepted', toAcceptN: '{n} to accept', rejectedN: '{n} rejected', overdueN: '{n} payment(s) overdue',
  provider: 'Provider', client: 'Client', period: 'Period', terms: 'Payment', termsValue: '{n} d after acceptance', from: 'From {n}',
  tracker: 'Cost, delay, quality', costNote: 'accepted of {a} committed', plannedSchedule: 'Planned in the schedule', paid: 'Paid', toPay: 'Left to pay', overdueChip: '{n} overdue',
  delayDays: '{n} d left', delayBefore: 'before the planned end on {d}', delayLate: '+{n} d', delayLateNote: 'after the planned end on {d}', delayHeld: 'Held', delayEarly: '−{n} d',
  delayClosedNote: 'actual end {a} for a planned end {b}', start: 'Start', end: 'Planned end', lateServices: 'Late services', rejected: 'Rejections, redone included',
  qualityNote: 'target {t}/10 · {n} evaluation(s)', lastEval: 'Last evaluation', noEval: 'No evaluation yet.',
  schedule: 'Services and payments', scheduleMeta: '{a}/{n} accepted · acceptance and payment are two separate states', service: 'Service', planned: 'Planned', amount: 'Amount',
  serviceState: 'Service', paymentState: 'Payment', deliver: 'Declare delivered', redeliver: 'Declare delivered again', accept: 'Accept', reject: 'Reject', pay: 'Record the payment',
  edit: 'Edit', remove: 'Remove', addService: 'Add a service', label: 'Title', plannedDate: 'Planned date', save: 'Save', cancel: 'Cancel', note: 'Remark (optional)',
  rejectReason: 'Reason for rejection', confirmAccept: 'Confirm acceptance', acceptHelp: 'Once accepted, the service is due on {d} ({n} days after acceptance).',
  deliverHelp: 'The client then accepts the service or rejects it with a reason.', paidOn: 'Payment date', paidAmount: 'Amount paid', reference: 'Reference (transfer, cheque)',
  refShort: 'ref. {r}', reason: 'Reason', by: 'by {n}', deliveredMsg: 'Service declared delivered.', acceptedMsg: 'Service accepted: the payment is scheduled.', rejectedMsg: 'Service rejected.',
  paidMsg: 'Payment recorded.', savedMsg: 'Schedule updated.',
  evaluations: 'Quality evaluations', evalMeta: '{n} · average {a}/10', newEval: 'New evaluation', evalTitle: 'Quality evaluation', evalHelp: 'Mark each criterion from 1 (very poor) to 10 (excellent). Justify your marks: they feed the contract’s final review.',
  evalDate: 'Evaluation date', evalService: 'Service concerned', wholeContract: 'The contract as a whole', justification: 'Justification', justHint: 'Finding that explains the mark…',
  comment: 'General comment', average: 'Average', saveEval: 'Save the evaluation', evalSaved: 'Evaluation saved.', perCriterion: 'Average per criterion', evaluator: 'Evaluator',
  bilanFinal: 'Final review', bilanDraft: 'Provisional review', bilanFinalMeta: 'closed on {d} by {n}', bilanDraftMeta: 'on {d} · initial commitments and results',
  dimension: 'Dimension', commitment: 'Initial commitment', resultCol: 'Result', gap: 'Gap', verdict: 'Assessment', bidRetained: 'retained offer: {a}',
  forecast: 'planned, of which {a} accepted', duration: '{n} d · end {d}', endReal: 'actual end {d}', endEstimate: 'estimated end {d}', evalCount: '{n} evaluation(s)',
  vConform: 'In line with the commitment', vOver: 'Overrun of {p}%', vSaving: 'Saving of {p}%', vHeld: 'Deadline held', vEarly: 'Finished {n} d early', vLate: '{n} d late',
  vReached: 'Target reached', vNear: 'Slightly below', vBelow: 'Below target', vNone: 'Not evaluated yet', forecastTag: 'forecast',
  rejectedLine: '{n} rejection(s) of a service, each redone by the provider', lastAcceptedOn: 'last acceptance {d}', editHint: 'Edit this instalment', removeIt: 'Remove this service', paymentsLine: 'Payments: {a} of {n} paid on time', noPayment: 'No payment recorded yet.',
  conclusion: 'Conclusion', closeContract: 'Close the contract and settle the review', closeHelp: 'The review is frozen at closing. Payments still due can still be recorded.',
  pendingWarn: '{n} service(s) are not accepted yet.', actualEnd: 'Actual end date', closingNote: 'Conclusion of the review', confirmClose: 'Close and settle the review', closedMsg: 'Contract closed: review settled.',
  offer: 'Retained offer', offerAmount: 'Offered amount', offerDelay: 'Offered lead time', content: 'Content', strengths: 'Strengths', history: 'History', days: 'days', none: '—',
  PROPOSED: 'To accept', DECLINED: 'Declined', pendingClient: '{p} must accept this contract: it works on the site, and services can be accepted, only once it has accepted.',
  respondTitle: 'Do you accept this contract?', respondHelp: 'Accepting commits you to the amount, duration and payment terms shown, and links you to the site. Declining lets the client retain another offer.',
  acceptContract: 'Accept the contract', declineContract: 'Decline the contract', declineReason: 'Reason for declining', contractAccepted: 'Contract accepted: you are linked to the site and can deliver the services.',
  contractDeclined: 'Contract declined: the client is informed.', declinedTitle: 'Contract declined by the provider', declinedText: 'Declined on {d} by {n}: {r}. The tender went back to analysis to retain another offer.',
  acceptedOn: 'accepted on {d}', recordTitle: 'Provider’s written answer',
  recordHelp: '{p} has no TRACEOPS account: record its written answer (signed letter or e-mail). Accepted, the contract opens and the provider is linked to the site; declined, the tender goes back to analysis.',
  recordAccept: 'Record the acceptance', recordDecline: 'Record the refusal', recordRef: 'Reference of the written answer', recordRefHint: 'E.g. signed letter of 12/11, ref. DG/2026/118',
  recordedAccepted: 'Acceptance recorded: the contract is open.',
};

/* ------------------------------------------------------------------ types */

type Row = { id: string; number: number; title: string; status: 'PROPOSED' | 'ACTIVE' | 'DECLINED' | 'CLOSED'; committed_amount_xaf: string; committed_days: number; start_date: string; planned_end_date: string; actual_end_date: string | null;
  quality_target: string; payment_terms_days: number; provider_name: string; client_name: string; site_name: string | null; tender_number: number | null; service_type: string | null;
  deliveries: number; accepted: number; rejected: number; to_decide: number; late: number; planned_amount: string; accepted_amount: string; paid_amount: string; overdue: number;
  quality: string | null; evaluations: number; last_evaluation: string | null };
type Delivery = { id: string; position: number; label: string; planned_date: string; amount_xaf: string; delivered_at: string | null; delivery_note: string | null; decision: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  decision_reason: string | null; decided_at: string | null; delivered_by: string | null; decided_by: string | null; payment_id: string | null; payment_status: 'PENDING' | 'PAID' | null; due_date: string | null;
  paid_on: string | null; paid_amount_xaf: string | null; reference: string | null; terms_days: number | null };
type Evaluation = { id: string; evaluated_on: string; scores: { key: string; label: string; score: number; justification?: string }[]; average: string; comment: string | null; delivery_id: string | null; evaluator: string; delivery_label: string | null };
type Ev = { id: string; action: string; reason: string | null; created_at: string; actor: string };
type Contract = { id: string; number: number; tender_id: string | null; title: string; scope: string | null; committed_amount_xaf: string; committed_days: number; start_date: string; planned_end_date: string;
  payment_terms_days: number; quality_target: string; quality_criteria: QualityCriterion[]; status: 'PROPOSED' | 'ACTIVE' | 'DECLINED' | 'CLOSED'; responded_at: string | null; decline_reason: string | null; responded_by_name: string | null; actual_end_date: string | null; closing_note: string | null; closed_at: string | null;
  provider_name: string; client_name: string; site_name: string | null; tender_number: number | null; tender_title: string | null; service_type: string | null; questions: Field[] | null; closed_by_name: string | null;
  bid: { amount_xaf: string; delay_days: number; content: string; strengths: string | null; answers: Record<string, FieldValue> } | null;
  deliveries: Delivery[]; evaluations: Evaluation[]; events: Ev[]; today: string; actions: string[] };

const events: Record<string, [string, string]> = {
  DELIVERY_PLANNED: ['Prestation ajoutée à l’échéancier', 'Service added to the schedule'], DELIVERY_EDITED: ['Prestation modifiée', 'Service edited'],
  DELIVERY_REMOVED: ['Prestation retirée', 'Service removed'], DELIVERY_DONE: ['Prestation déclarée réalisée', 'Service declared delivered'], DELIVERY_REDELIVERED: ['Prestation réalisée à nouveau', 'Service delivered again'],
  DELIVERY_ACCEPTED: ['Prestation acceptée', 'Service accepted'], DELIVERY_REJECTED: ['Prestation rejetée', 'Service rejected'], EVALUATED: ['Évaluation qualité', 'Quality evaluation'],
  PAYMENT_RECORDED: ['Règlement enregistré', 'Payment recorded'], CLOSED: ['Contrat clôturé, bilan arrêté', 'Contract closed, review settled'],
  CONTRACT_CREATED: ['Contrat proposé au prestataire', 'Contract offered to the provider'], ACCEPTED_BY_PROVIDER: ['Contrat accepté par le prestataire', 'Contract accepted by the provider'],
  DECLINED_BY_PROVIDER: ['Contrat refusé par le prestataire', 'Contract declined by the provider'],
};
const statusTone = (s: string) => s === 'ACTIVE' ? 'blue' : s === 'PROPOSED' ? 'amber' : s === 'DECLINED' ? 'red' : 'neutral';
const toneOfMark = (v: number, target = 7) => v >= target ? 'ok' : v >= target - 1.5 ? 'warn' : 'bad';
/** A state as a chip; a state that asks nothing yet (to deliver later, not yet due) stays quiet. */
const State = ({ tone, label, note, quiet }: { tone: Tone; label: string; note?: string; quiet?: boolean }) => <span className={quiet ? 'state-stack is-quiet' : 'state-stack'}>
  <span className={quiet ? 'state-quiet' : `state state-${tone}`}>{label}</span>{note && <small>{note}</small>}</span>;
function Clamp({ text, more, less }: { text: string | null | undefined; more: string; less: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return <span className="muted">—</span>;
  const long = text.length > 220;
  return <div className="clamp-wrap"><p className={long && !open ? 'clamp' : 'clamp is-open'}>{text}</p>{long && <button type="button" className="link-button" onClick={() => setOpen(o => !o)}>{open ? less : more}</button>}</div>;
}

/* ================================================================= the list */

export function ContractsPage({ org, lang, ctx, initialId }: { org: Org; lang: Lang; admin: boolean; ctx: Ctx; initialId?: string | null }) {
  const t = lang === 'fr' ? fr : en;
  const [openId, setOpenId] = useState<string | null>(initialId ?? null);
  const [rows, setRows] = useState<Row[]>([]), [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'), [attempt, setAttempt] = useState(0), [filter, setFilter] = useState<'ACTIVE' | 'CLOSED' | ''>('ACTIVE');
  useEffect(() => { let a = true; setState('loading'); api('contracts', undefined, org.id).then(r => { if (a) { setRows(r); setState('ready'); } }).catch(() => { if (a) setState('error'); }); return () => { a = false; }; }, [org.id, attempt]);
  if (openId) return <ContractDetail key={openId} org={org} lang={lang} id={openId} onBack={() => { setOpenId(null); setAttempt(n => n + 1); }} />;
  const client = org.kind === 'CLIENT';
  const active = rows.filter(r => r.status === 'ACTIVE'), shown = filter ? rows.filter(r => filter === 'ACTIVE' ? ['ACTIVE', 'PROPOSED'].includes(r.status) : ['CLOSED', 'DECLINED'].includes(r.status)) : rows;
  const rated = rows.filter(r => r.quality !== null);
  const ready = state === 'ready';
  return <section className="contracts">
    <PageHead title={t.title} subtitle={ctx.subtitle} cells={[
      { label: t.active, value: ready ? String(active.length) : '–' },
      { label: t.committed, value: ready ? shortFcfa(active.reduce((s, r) => s + Number(r.committed_amount_xaf), 0), lang) : '–' },
      { label: t.acceptedAmt, value: ready ? shortFcfa(active.reduce((s, r) => s + Number(r.accepted_amount), 0), lang) : '–' },
      { label: t.avgQuality, value: ready && rated.length ? `${num(rated.reduce((s, r) => s + Number(r.quality), 0) / rated.length, lang)}/10` : '–' },
    ]} />
    <p className="page-intro">{t.intro}</p>
    <div className="toolbar">
      <div className="segmented" role="group" aria-label={t.status}>{([['ACTIVE', t.active], ['CLOSED', t.closedPl], ['', t.all]] as const).map(([k, l]) => <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}</div>
    </div>
    {state === 'error' ? <Alert retry={() => setAttempt(n => n + 1)} retryLabel={t.retry}>{t.loadError}</Alert> : state === 'loading' && !rows.length ? <Skeleton label={t.loading} />
      : !shown.length ? <div className="sheet"><Empty icon={<ContractIcon />} title={t.empty}>{t.emptyText}</Empty></div>
      : <div className="table-card"><table className="audit-table contract-table">
          <thead><tr><th scope="col" className="col-ref">{t.number}</th><th scope="col">{t.contract}</th><th scope="col" className="col-cost">{t.cost}</th><th scope="col" className="col-delay">{t.delay}</th>
            <th scope="col" className="col-quality">{t.quality}</th><th scope="col" className="col-services">{t.services}</th><th scope="col" className="col-status">{t.status}</th></tr></thead>
          <tbody>{shown.map(r => {
            const committed = Number(r.committed_amount_xaf), accepted = Number(r.accepted_amount), q = r.quality === null ? null : Number(r.quality), target = Number(r.quality_target);
            const endGap = r.actual_end_date ? daysBetween(r.planned_end_date, r.actual_end_date) : 0;
            return <tr key={r.id} className="clickable" onClick={() => setOpenId(r.id)}>
              <td data-label={t.number}><span className="work-ref">{contractRef(r.number)}</span></td>
              <td data-label={t.contract} className="work-main-cell"><span className="work-head"><button type="button" className="work-title" title={r.title} onClick={e => { e.stopPropagation(); setOpenId(r.id); }}>{r.title}</button></span>
                <span className="work-meta">{[client ? r.provider_name : r.client_name, r.tender_number ? tenderRef(r.tender_number) : '', r.site_name].filter(Boolean).join(' · ')}</span></td>
              <td data-label={t.cost}><span className="slot-day">{shortFcfa(accepted, lang)} <small className="muted">{fill(t.ofCommitted, { a: shortFcfa(committed, lang) })}</small></span>
                <span className="meter" aria-hidden="true"><span style={{ width: `${Math.min(100, (accepted / committed) * 100)}%` }} /></span>
                <span className="slot-hours">{fill(t.paidAmt, { a: shortFcfa(Number(r.paid_amount), lang) })}</span></td>
              <td data-label={t.delay}>{r.status === 'CLOSED' ? <><span className="slot-day">{fill(t.endedOn, { d: dateText(r.actual_end_date, lang) })}</span>
                <span className={`state state-${endGap > 0 ? 'red' : 'green'}`}>{endGap > 0 ? fill(t.vLate, { n: endGap }) : t.vHeld}</span></>
                : <><span className="slot-day">{fill(t.endPlanned, { d: dateText(r.planned_end_date, lang) })}</span><span className={`state state-${r.late ? 'red' : 'green'}`}>{r.late ? fill(t.lateN, { n: r.late }) : t.onTime}</span></>}</td>
              <td data-label={t.quality}>{q === null ? <span className="muted">{t.notEvaluated}</span> : <><span className="mark-inline"><span className="score-pill" data-tone={toneOfMark(q, target)}>{num(q, lang)}</span><small>/10</small></span>
                <span className="slot-hours">{fill(t.targetOf, { n: num(target, lang) })}</span></>}</td>
              <td data-label={t.services}><span className="slot-day">{fill(t.acceptedOf, { a: r.accepted, n: r.deliveries })}</span>
                <span className="chips">{r.to_decide > 0 && <span className="state state-amber">{fill(t.toAcceptN, { n: r.to_decide })}</span>}{r.rejected > 0 && <span className="state state-red">{fill(t.rejectedN, { n: r.rejected })}</span>}
                  {r.overdue > 0 && <span className="state state-red">{fill(t.overdueN, { n: r.overdue })}</span>}</span></td>
              <td data-label={t.status}><span className={`state state-${statusTone(r.status)}`}>{t[r.status]}</span></td>
            </tr>;
          })}</tbody></table></div>}
  </section>;
}

/* =============================================================== the detail */

function ContractDetail({ org, lang, id, onBack }: { org: Org; lang: Lang; id: string; onBack: () => void }) {
  const t = lang === 'fr' ? fr : en;
  const [c, setC] = useState<Contract | null>(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [open, setOpen] = useState('');
  useEffect(() => { let a = true; setFailed(false); api(`contracts/${id}`, undefined, org.id).then(r => { if (a) setC(r); }).catch(() => { if (a) setFailed(true); }); return () => { a = false; }; }, [id, org.id, attempt]);
  const m = useMemo(() => c ? measure(c) : null, [c]);
  if (failed) return <><button className="back-link" onClick={onBack}><BackIcon />{t.back}</button><Alert retry={() => setAttempt(n => n + 1)} retryLabel={t.retry}>{t.loadError}</Alert></>;
  if (!c || !m) return <Skeleton label={t.loading} />;
  const can = (a: string) => c.actions.includes(a);
  const today = c.today;
  const client = org.kind === 'CLIENT';
  const run = (path: string, body: unknown, done?: string) => {
    setBusy(true); setError(''); setNotice('');
    return api(path, body, org.id).then(() => { setOpen(''); if (done) setNotice(done); setAttempt(n => n + 1); }).catch(e => setError(say(e, lang))).finally(() => setBusy(false));
  };
  const onContract = (path: string, body: unknown, done?: string) => run(`contracts/${id}/${path}`, body, done);
  const target = Number(c.quality_target);
  const inline = (key: string, submit: (f: FormData) => void, children: React.ReactNode, label: string, tone: 'primary' | 'danger' = 'primary') => open === key
    ? <form className="link-form" onSubmit={e => { e.preventDefault(); submit(new FormData(e.currentTarget)); }}>{children}
        <div className="toolbar-actions"><button type="button" className="secondary" disabled={busy} onClick={() => setOpen('')}>{t.cancel}</button><button className={tone} disabled={busy}>{label}</button></div></form>
    : null;
  const delayValue = c.status === 'CLOSED' ? (m.endGap > 0 ? fill(t.delayLate, { n: m.endGap }) : m.endGap < 0 ? fill(t.delayEarly, { n: -m.endGap }) : t.delayHeld)
    : today <= c.planned_end_date ? fill(t.delayDays, { n: daysBetween(today, c.planned_end_date) }) : fill(t.delayLate, { n: daysBetween(c.planned_end_date, today) });
  const delayNote = c.status === 'CLOSED' ? fill(t.delayClosedNote, { a: dateText(c.actual_end_date, lang), b: dateText(c.planned_end_date, lang) })
    : today <= c.planned_end_date ? fill(t.delayBefore, { d: dateText(c.planned_end_date, lang) }) : fill(t.delayLateNote, { d: dateText(c.planned_end_date, lang) });
  const delayAlert = c.status === 'CLOSED' ? m.endGap > 0 : m.lateServices > 0 || (today > c.planned_end_date && m.pendingServices > 0);

  return <section className="detail contract-detail">
    <button className="back-link" onClick={onBack}><BackIcon />{t.back}</button>
    <PageHead title={c.title} subtitle={[contractRef(c.number), c.tender_number ? fill(t.from, { n: tenderRef(c.tender_number) }) : '', c.service_type ? serviceLabel(c.service_type, lang) : '', c.site_name].filter(Boolean).join(' · ')}
      cells={[
        { label: client ? t.provider : t.client, value: client ? c.provider_name : c.client_name },
        { label: t.committed, value: fcfa(c.committed_amount_xaf, lang) },
        { label: t.period, value: `${dateText(c.start_date, lang)} → ${dateText(c.planned_end_date, lang)} · ${c.committed_days} ${t.days}` },
        { label: t.terms, value: fill(t.termsValue, { n: c.payment_terms_days }) },
        { label: t.status, value: <span className="cart-states"><span className={`state state-${statusTone(c.status)}`}>{t[c.status]}</span>{c.responded_at && c.status !== 'DECLINED' && <small className="cart-sub">{fill(t.acceptedOn, { d: dateText(c.responded_at, lang) })}</small>}</span> },
      ]} />
    {error && <Alert>{error}</Alert>}
    {notice && <Alert kind="success">{notice}</Alert>}
    {c.status === 'PROPOSED' && (can('RESPOND')
      ? <Sheet id="respond" title={t.respondTitle} className="sheet-action">
          <p className="next-text">{t.respondHelp}</p>
          {open === 'decline'
            ? <form className="link-form" onSubmit={e => { e.preventDefault(); void onContract('respond', { accept: false, reason: new FormData(e.currentTarget).get('reason') }, t.contractDeclined); }}>
                <label>{t.declineReason}<textarea name="reason" required maxLength={2000} rows={2} /></label>
                <div className="toolbar-actions"><button type="button" className="secondary" disabled={busy} onClick={() => setOpen('')}>{t.cancel}</button><button className="danger" disabled={busy}>{t.declineContract}</button></div></form>
            : <div className="toolbar-actions"><button className="primary" disabled={busy} onClick={() => void onContract('respond', { accept: true }, t.contractAccepted)}><CheckIcon />{t.acceptContract}</button>
                <button className="secondary" disabled={busy} onClick={() => setOpen('decline')}>{t.declineContract}</button></div>}
        </Sheet>
      : can('RECORD_RESPONSE')
        ? <Sheet id="respond" title={t.recordTitle} className="sheet-action">
            <p className="next-text">{fill(t.recordHelp, { p: c.provider_name })}</p>
            <form className="link-form" onSubmit={e => {
              e.preventDefault(); const f = new FormData(e.currentTarget), accept = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'accept';
              void onContract('respond', { accept, reason: f.get('reason') }, accept ? t.recordedAccepted : t.contractDeclined);
            }}>
              <label>{t.recordRef}<textarea name="reason" required maxLength={2000} rows={2} placeholder={t.recordRefHint} /></label>
              <div className="toolbar-actions"><button className="primary" name="answer" value="accept" disabled={busy}><CheckIcon />{t.recordAccept}</button>
                <button className="secondary" name="answer" value="decline" disabled={busy}>{t.recordDecline}</button></div></form>
          </Sheet>
        : <p className="sheet-note info-note"><AlertIcon />{fill(t.pendingClient, { p: c.provider_name })}</p>)}
    {c.status === 'DECLINED' && <Sheet id="declined" title={t.declinedTitle} className="sheet-alert">
      <p>{fill(t.declinedText, { d: dateText(c.responded_at, lang), n: c.responded_by_name ?? c.provider_name, r: c.decline_reason ?? '—' })}</p></Sheet>}

    <dl className="kpis kpis-3 tracker" aria-label={t.tracker}>
      <div className={m.overdue.length ? 'kpi is-alert-soft' : 'kpi'}><dt>{t.cost}</dt><dd>
        <span className="kpi-value">{shortFcfa(m.accepted, lang)}</span><span className="kpi-note">{fill(t.costNote, { a: fcfa(m.committed, lang) })}</span>
        <span className="meter" aria-hidden="true"><span style={{ width: `${Math.min(100, (m.accepted / m.committed) * 100)}%` }} /></span>
        <ul className="kpi-lines">
          <li><span>{t.plannedSchedule}</span><strong>{fcfa(m.planned, lang)}</strong>{m.planned !== m.committed && <span className={`state state-${m.planned > m.committed ? 'red' : 'green'}`}>{m.planned > m.committed ? '+' : ''}{num(((m.planned - m.committed) / m.committed) * 100, lang, 1)} %</span>}</li>
          <li><span>{t.paid}</span><strong>{fcfa(m.paid, lang)}</strong></li>
          <li><span>{t.toPay}</span><strong>{fcfa(m.due, lang)}</strong>{m.overdue.length > 0 && <span className="state state-red">{fill(t.overdueChip, { n: m.overdue.length })}</span>}</li>
        </ul></dd></div>
      <div className={delayAlert ? 'kpi is-alert' : 'kpi'}><dt>{t.delay}</dt><dd>
        <span className="kpi-value">{delayValue}</span><span className="kpi-note">{delayNote}</span>
        <ul className="kpi-lines">
          <li><span>{t.start}</span><strong>{dateText(c.start_date, lang)}</strong></li>
          <li><span>{t.lateServices}</span><strong>{m.lateServices}</strong></li>
          <li><span>{t.rejected}</span><strong>{m.rejections}</strong></li>
        </ul></dd></div>
      <div className="kpi"><dt>{t.quality}</dt><dd>
        <span className="kpi-value">{m.avg === null ? '–' : <span className={`q-${toneOfMark(m.avg, target)}`}>{num(m.avg, lang)}</span>}<small>/10</small></span>
        <span className="kpi-note">{fill(t.qualityNote, { t: num(target, lang), n: c.evaluations.length })}</span>
        {m.avg !== null && <span className="meter meter-target" aria-hidden="true" style={{ ['--target' as string]: `${target * 10}%` } as React.CSSProperties}><span style={{ width: `${m.avg * 10}%` }} data-tone={toneOfMark(m.avg, target)} /></span>}
        <ul className="kpi-lines"><li><span>{t.lastEval}</span><strong>{c.evaluations[0] ? dateText(c.evaluations[0].evaluated_on, lang) : '—'}</strong></li></ul>
      </dd></div>
    </dl>

    <Sheet id="schedule" title={t.schedule} meta={fill(t.scheduleMeta, { a: m.acceptedCount, n: c.deliveries.length })}
      actions={can('PLAN') && open !== 'add' ? <button className="secondary small" onClick={() => setOpen('add')}><PlusIcon />{t.addService}</button> : undefined}>
      {inline('add', f => void onContract('deliveries', { label: f.get('label'), plannedDate: f.get('plannedDate'), amount: Number(f.get('amount')) }, t.savedMsg), <>
        <label>{t.label}<input name="label" required maxLength={200} /></label>
        <div className="form-row"><label>{t.plannedDate}<input name="plannedDate" type="date" required defaultValue={today} /></label>
          <label>{t.amount}<span className="unit-input"><input name="amount" type="number" min={1} step={1} required /><span className="unit">FCFA</span></span></label></div></>, t.save)}
      <div className="table-card table-flat"><table className="audit-table delivery-table">
        <thead><tr><th scope="col" className="col-n">{t.number}</th><th scope="col">{t.service}</th><th scope="col" className="col-date">{t.planned}</th><th scope="col" className="col-amount num">{t.amount}</th>
          <th scope="col" className="col-state">{t.serviceState}</th><th scope="col" className="col-pay">{t.paymentState}</th></tr></thead>
        <tbody>{c.deliveries.map((x, i) => {
          const s = serviceState(x, today, lang), p = paymentState(x, today, lang);
          // Only what is due within two weeks carries its actions; a later instalment can still be edited from its title.
          const near = x.planned_date <= addDays(today, 14) || Boolean(x.delivered_at) || x.decision !== 'PENDING';
          const canDeliver = can('DELIVER') && near && x.decision !== 'ACCEPTED' && !(x.delivered_at && x.decision === 'PENDING');
          const canDecide = can('DECIDE') && x.decision === 'PENDING' && (Boolean(x.delivered_at) || x.planned_date <= today);
          const canPay = can('PAY') && x.payment_id && x.payment_status === 'PENDING';
          const canEdit = can('PLAN') && x.decision !== 'ACCEPTED';
          const any = canDeliver || canDecide || canPay || (canEdit && near) || open === 'edit-' + x.id;
          return <React.Fragment key={x.id}>
            <tr className={`delivery is-${s.key}`}>
              <td data-label={t.number}><span className="task-n">{i + 1}</span></td>
              <td data-label={t.service} className="task-body"><div className="task-stack"><strong className="task-label">{x.label}</strong>
                {x.delivery_note && <p className="task-note">{x.delivery_note}{x.delivered_by ? ` — ${x.delivered_by}` : ''}</p>}
                {x.decision_reason && <p className={x.decision === 'REJECTED' ? 'task-note is-bad' : 'task-note'}>{t.reason} : {x.decision_reason}{x.decided_by ? ` — ${x.decided_by}` : ''}</p>}
                {canEdit && !near && open !== 'edit-' + x.id && <button type="button" className="link-button row-edit" aria-label={`${t.editHint} : ${x.label}`} onClick={() => setOpen('edit-' + x.id)}><PenIcon />{t.edit}</button>}</div></td>
              <td data-label={t.planned}>{dateText(x.planned_date, lang)}</td>
              <td data-label={t.amount} className="num">{fcfa(x.amount_xaf, lang)}</td>
              <td data-label={t.serviceState}><State quiet={s.key === 'todo'} tone={s.tone} label={s.label} note={[s.note, x.decision !== 'PENDING' && x.decided_by ? fill(t.by, { n: x.decided_by }) : ''].filter(Boolean).join(' · ')} /></td>
              <td data-label={t.paymentState}><State quiet={p.key === 'notdue'} tone={p.tone} label={p.label} note={[p.note, x.reference ? fill(t.refShort, { r: x.reference }) : ''].filter(Boolean).join(' · ')} /></td>
            </tr>
            {any && <tr className="task-actions-row"><td colSpan={6}><div className="task-actions">
              {canDecide && open !== 'accept-' + x.id && <button className="primary small" disabled={busy} onClick={() => setOpen('accept-' + x.id)}><CheckIcon />{t.accept}</button>}
              {canDecide && <button className="secondary small" disabled={busy} onClick={() => setOpen('reject-' + x.id)}>{t.reject}</button>}
              {canDeliver && <button className="secondary small" disabled={busy} onClick={() => setOpen('deliver-' + x.id)}>{x.decision === 'REJECTED' ? t.redeliver : t.deliver}</button>}
              {canPay && <button className="secondary small" disabled={busy} onClick={() => setOpen('pay-' + x.id)}>{t.pay}</button>}
              {canEdit && near && open !== 'edit-' + x.id && <button className="link-button" disabled={busy} onClick={() => setOpen('edit-' + x.id)}><PenIcon />{t.edit}</button>}
              {inline('accept-' + x.id, f => void onContract(`deliveries/${x.id}/decision`, { accept: true, reason: f.get('reason') || null }, t.acceptedMsg), <>
                <p className="panel-desc">{fill(t.acceptHelp, { d: dateText(addDays(today, c.payment_terms_days), lang, 'long'), n: c.payment_terms_days })}</p>
                <label>{t.note}<textarea name="reason" maxLength={2000} rows={2} /></label></>, t.confirmAccept)}
              {inline('reject-' + x.id, f => void onContract(`deliveries/${x.id}/decision`, { accept: false, reason: f.get('reason') }, t.rejectedMsg), <label>{t.rejectReason}<textarea name="reason" required maxLength={2000} rows={2} /></label>, t.reject, 'danger')}
              {inline('deliver-' + x.id, f => void onContract(`deliveries/${x.id}/deliver`, { note: f.get('note') || null }, t.deliveredMsg), <><p className="panel-desc">{t.deliverHelp}</p><label>{t.note}<textarea name="note" maxLength={2000} rows={2} /></label></>, x.decision === 'REJECTED' ? t.redeliver : t.deliver)}
              {canPay && inline('pay-' + x.id, f => void run(`payments/${x.payment_id}/pay`, { paidOn: f.get('paidOn'), amount: Number(f.get('amount')), reference: f.get('reference') || null }, t.paidMsg), <div className="form-row form-row-3">
                <label>{t.paidOn}<input name="paidOn" type="date" required max={today} defaultValue={today} /></label>
                <label>{t.paidAmount}<span className="unit-input"><input name="amount" type="number" min={1} step={1} required defaultValue={Number(x.amount_xaf)} /><span className="unit">FCFA</span></span></label>
                <label>{t.reference}<input name="reference" maxLength={120} /></label></div>, t.pay)}
              {inline('edit-' + x.id, f => void onContract(`deliveries/${x.id}`, { label: f.get('label'), plannedDate: f.get('plannedDate'), amount: Number(f.get('amount')) }, t.savedMsg), <>
                <label>{t.label}<input name="label" required maxLength={200} defaultValue={x.label} /></label>
                <div className="form-row"><label>{t.plannedDate}<input name="plannedDate" type="date" required defaultValue={x.planned_date} /></label>
                  <label>{t.amount}<span className="unit-input"><input name="amount" type="number" min={1} step={1} required defaultValue={Number(x.amount_xaf)} /><span className="unit">FCFA</span></span></label></div>
                {!x.delivered_at && x.decision === 'PENDING' && <button type="button" className="link-button danger-link" disabled={busy} onClick={() => void onContract(`deliveries/${x.id}/remove`, {}, t.savedMsg)}><TrashIcon />{t.removeIt}</button>}</>, t.save)}
            </div></td></tr>}
          </React.Fragment>;
        })}</tbody></table></div>
    </Sheet>

    <div className="detail-grid">
      <div className="detail-main">
        <Sheet id="quality" title={t.evaluations} meta={c.evaluations.length ? fill(t.evalMeta, { n: c.evaluations.length, a: num(m.avg ?? 0, lang) }) : undefined}
          actions={can('EVALUATE') && open !== 'evaluate' ? <button className="primary small" onClick={() => setOpen('evaluate')}><PlusIcon />{t.newEval}</button> : undefined}>
          {open === 'evaluate' && <EvaluationForm c={c} lang={lang} busy={busy} onCancel={() => setOpen('')} onSubmit={body => void onContract('evaluations', body, t.evalSaved)} />}
          {c.evaluations.length ? <>
            <h3 className="sheet-sub first">{t.perCriterion}</h3>
            <ul className="crit-bars">{m.perCriterion.map(x => <li key={x.key}><span className="crit-name">{x.label}</span>
              <span className="crit-track" aria-hidden="true"><span className="crit-target" style={{ left: `${target * 10}%` }} /><span className="crit-fill" data-tone={x.avg === null ? 'none' : toneOfMark(x.avg, target)} style={{ width: `${(x.avg ?? 0) * 10}%` }} /></span>
              <strong className="crit-value">{x.avg === null ? '—' : `${num(x.avg, lang)}/10`}</strong></li>)}</ul>
            <ol className="eval-list">{c.evaluations.map(e => <li key={e.id} className="eval-card">
              <div className="eval-head"><span className="score-pill" data-tone={toneOfMark(Number(e.average), target)}>{num(Number(e.average), lang)}</span>
                <span className="eval-who"><strong>{dateText(e.evaluated_on, lang, 'long')}</strong><span className="muted">{[e.evaluator, e.delivery_label ?? t.wholeContract].join(' · ')}</span></span></div>
              <table className="eval-scores"><tbody>{e.scores.map(s => <tr key={s.key}><th scope="row">{s.label}</th>
                <td className="eval-mark"><span className="score-pill small" data-tone={toneOfMark(s.score, target)}>{s.score}</span><span className="mini-meter" aria-hidden="true"><span style={{ width: `${s.score * 10}%` }} /></span></td>
                <td className="eval-just">{s.justification ?? <span className="muted">—</span>}</td></tr>)}</tbody></table>
              {e.comment && <p className="eval-comment">{e.comment}</p>}
            </li>)}</ol>
          </> : open !== 'evaluate' && <p className="muted">{t.noEval}</p>}
        </Sheet>

        {/* Nothing to review before the provider has accepted, nor after it declined. */}
        {['ACTIVE', 'CLOSED'].includes(c.status) && <Bilan c={c} m={m} lang={lang} busy={busy} open={open} setOpen={setOpen} onClose={body => void onContract('close', body, t.closedMsg)} />}
      </div>
      <aside className="detail-side">
        {c.bid && <Sheet id="offer" title={t.offer}>
          <dl className="facts">
            <div><dt>{t.offerAmount}</dt><dd>{fcfa(c.bid.amount_xaf, lang)}</dd></div>
            <div><dt>{t.offerDelay}</dt><dd>{c.bid.delay_days} {t.days}</dd></div>
            <div><dt>{t.content}</dt><dd><Clamp text={c.bid.content} more={lang === 'fr' ? 'Lire la suite' : 'Read more'} less={lang === 'fr' ? 'Réduire' : 'Show less'} /></dd></div>
            {c.bid.strengths && <div><dt>{t.strengths}</dt><dd><Clamp text={c.bid.strengths} more={lang === 'fr' ? 'Lire la suite' : 'Read more'} less={lang === 'fr' ? 'Réduire' : 'Show less'} /></dd></div>}
            {(c.questions ?? []).filter(q => c.bid!.answers?.[q.key] !== undefined).map(q => <div key={q.key}><dt>{q.label}</dt><dd>{valueText(q, c.bid!.answers[q.key], lang)}</dd></div>)}
          </dl>
        </Sheet>}
        <Sheet id="history" title={t.history} meta={String(c.events.length)}>
          <ol className="timeline">{[...c.events].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(e => <li key={e.id}><strong>{(events[e.action] ?? [e.action, e.action])[lang === 'fr' ? 0 : 1]}</strong>
            <span className="muted">{e.actor} · {dateText(e.created_at, lang, 'time')}</span>{e.reason && <span className="timeline-reason">{e.reason}</span>}</li>)}</ol>
        </Sheet>
      </aside>
    </div>
  </section>;
}

/* ----------------------------------------------- the measures of a contract */

type Measures = ReturnType<typeof measure>;
function measure(c: Contract) {
  const today = c.today;
  const committed = Number(c.committed_amount_xaf);
  const planned = c.deliveries.reduce((s, d) => s + Number(d.amount_xaf), 0);
  const acceptedList = c.deliveries.filter(d => d.decision === 'ACCEPTED');
  const accepted = acceptedList.reduce((s, d) => s + Number(d.amount_xaf), 0);
  const paidList = c.deliveries.filter(d => d.payment_status === 'PAID');
  const paid = paidList.reduce((s, d) => s + Number(d.paid_amount_xaf ?? d.amount_xaf), 0);
  const due = c.deliveries.filter(d => d.payment_status === 'PENDING').reduce((s, d) => s + Number(d.amount_xaf), 0);
  const overdue = c.deliveries.filter(d => d.payment_status === 'PENDING' && d.due_date && d.due_date < today);
  const lateServices = c.deliveries.filter(d => d.decision !== 'ACCEPTED' && d.planned_date < today).length;
  const rejected = c.deliveries.filter(d => d.decision === 'REJECTED').length;
  // Every rejection counts, even when the service was redone and accepted afterwards.
  const rejections = c.events.filter(e => e.action === 'DELIVERY_REJECTED').length;
  const pendingServices = c.deliveries.filter(d => d.decision !== 'ACCEPTED').length;
  const avg = c.evaluations.length ? c.evaluations.reduce((s, e) => s + Number(e.average), 0) / c.evaluations.length : null;
  const perCriterion = c.quality_criteria.map(q => { const v = c.evaluations.flatMap(e => e.scores.filter(s => s.key === q.key).map(s => s.score)); return { key: q.key, label: q.label, avg: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null }; });
  // The end: the real one once closed; otherwise the last acceptance when everything is accepted, or the latest of the plan and today.
  const lastAccepted = acceptedList.map(d => d.decided_at ? instantDay(d.decided_at) : d.planned_date).sort().pop() ?? null;
  const remaining = c.deliveries.filter(d => d.decision !== 'ACCEPTED').map(d => d.planned_date).sort().pop() ?? null;
  const estimate = c.status === 'CLOSED' && c.actual_end_date ? c.actual_end_date
    : !remaining ? (lastAccepted ?? c.planned_end_date) : [c.planned_end_date, remaining, lateServices ? today : ''].filter(Boolean).sort().pop()!;
  const endGap = daysBetween(c.planned_end_date, estimate);
  const paidOnTime = paidList.filter(d => d.paid_on && d.due_date && d.paid_on <= d.due_date).length;
  return { committed, planned, accepted, paid, due, overdue, lateServices, rejected, rejections, pendingServices, avg, perCriterion, estimate, endGap, paidOnTime, paidCount: paidList.length, acceptedCount: acceptedList.length };
}

function Bilan({ c, m, lang, busy, open, setOpen, onClose }: { c: Contract; m: Measures; lang: Lang; busy: boolean; open: string; setOpen: (s: string) => void; onClose: (body: unknown) => void }) {
  const t = lang === 'fr' ? fr : en;
  const closed = c.status === 'CLOSED', target = Number(c.quality_target);
  const costResult = closed ? m.accepted : m.planned;
  const costGap = ((costResult - m.committed) / m.committed) * 100;
  const costVerdict: [string, Tone] = Math.abs(costGap) < 0.5 ? [t.vConform, 'green'] : costGap > 0 ? [fill(t.vOver, { p: num(costGap, lang, 1) }), 'red'] : [fill(t.vSaving, { p: num(-costGap, lang, 1) }), 'green'];
  const delayVerdict: [string, Tone] = m.endGap > 0 ? [fill(t.vLate, { n: m.endGap }), 'red'] : m.endGap < 0 ? [fill(t.vEarly, { n: -m.endGap }), 'green'] : [t.vHeld, 'green'];
  const qGap = m.avg === null ? null : m.avg - target;
  const qualityVerdict: [string, Tone] = m.avg === null ? [t.vNone, 'neutral'] : qGap! >= 0 ? [t.vReached, 'green'] : qGap! >= -1 ? [t.vNear, 'amber'] : [t.vBelow, 'red'];
  const sign = (v: number, digits = 1) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${num(Math.abs(v), lang, digits)}`;
  const lastAccepted = c.deliveries.filter(d => d.decision === 'ACCEPTED' && d.decided_at).map(d => instantDay(d.decided_at!)).sort().pop();
  return <Sheet id="bilan" title={closed ? t.bilanFinal : t.bilanDraft} className={closed ? 'sheet-bilan is-final' : 'sheet-bilan'}
    meta={closed ? fill(t.bilanFinalMeta, { d: dateText(c.closed_at, lang), n: c.closed_by_name ?? '—' }) : fill(t.bilanDraftMeta, { d: dateText(c.today, lang) })}>
    <div className="table-card table-flat"><table className="audit-table bilan-table">
      <thead><tr><th scope="col" className="col-dim">{t.dimension}</th><th scope="col">{t.commitment}</th><th scope="col">{t.resultCol}</th><th scope="col" className="col-gap">{t.gap}</th><th scope="col" className="col-verdict">{t.verdict}</th></tr></thead>
      <tbody>
        <tr><th scope="row" data-label={t.dimension}>{t.cost}</th>
          <td data-label={t.commitment}><strong>{fcfa(m.committed, lang)}</strong>{c.bid && Number(c.bid.amount_xaf) !== m.committed && <small className="cell-sub">{fill(t.bidRetained, { a: fcfa(c.bid.amount_xaf, lang) })}</small>}</td>
          <td data-label={t.resultCol}><strong>{fcfa(costResult, lang)}</strong>{!closed && <small className="cell-sub">{fill(t.forecast, { a: fcfa(m.accepted, lang) })}</small>}</td>
          <td data-label={t.gap} className="num">{sign(costGap)} %{!closed && <small className="cell-sub">{t.forecastTag}</small>}</td>
          <td data-label={t.verdict}><span className={`state state-${costVerdict[1]}`}>{costVerdict[0]}</span></td></tr>
        <tr><th scope="row" data-label={t.dimension}>{t.delay}</th>
          <td data-label={t.commitment}><strong>{fill(t.duration, { n: c.committed_days, d: dateText(c.planned_end_date, lang) })}</strong></td>
          <td data-label={t.resultCol}><strong>{closed ? fill(t.endReal, { d: dateText(c.actual_end_date, lang) }) : fill(t.endEstimate, { d: dateText(m.estimate, lang) })}</strong>{!closed && lastAccepted && <small className="cell-sub">{fill(t.lastAcceptedOn, { d: dateText(lastAccepted, lang) })}</small>}</td>
          <td data-label={t.gap} className="num">{sign(m.endGap, 0)} {lang === 'fr' ? 'j' : 'd'}</td>
          <td data-label={t.verdict}><span className={`state state-${delayVerdict[1]}`}>{delayVerdict[0]}</span></td></tr>
        <tr><th scope="row" data-label={t.dimension}>{t.quality}</th>
          <td data-label={t.commitment}><strong>{num(target, lang)}/10</strong></td>
          <td data-label={t.resultCol}><strong>{m.avg === null ? '—' : `${num(m.avg, lang)}/10`}</strong><small className="cell-sub">{fill(t.evalCount, { n: c.evaluations.length })}</small></td>
          <td data-label={t.gap} className="num">{qGap === null ? '—' : sign(qGap)}</td>
          <td data-label={t.verdict}><span className={`state state-${qualityVerdict[1]}`}>{qualityVerdict[0]}</span></td></tr>
      </tbody></table></div>
    <ul className="bilan-notes">
      {m.rejections > 0 && <li><AlertIcon />{fill(t.rejectedLine, { n: m.rejections })}</li>}
      <li><CheckIcon />{m.paidCount ? fill(t.paymentsLine, { a: m.paidOnTime, n: m.paidCount }) : t.noPayment}</li>
    </ul>
    {closed && c.closing_note && <div className="report-note"><h3>{t.conclusion}</h3><p>{c.closing_note}</p></div>}
    {c.actions.includes('CLOSE') && (open === 'close'
      ? <form className="link-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); onClose({ actualEndDate: f.get('end'), note: f.get('note') || null }); }}>
          <p className="panel-desc">{t.closeHelp}</p>
          {m.pendingServices > 0 && <p className="board-note is-alert"><AlertIcon />{fill(t.pendingWarn, { n: m.pendingServices })}</p>}
          <div className="form-row"><label>{t.actualEnd}<input name="end" type="date" required max={c.today} defaultValue={lastAccepted && lastAccepted <= c.today ? lastAccepted : c.today} /></label><span /></div>
          <label>{t.closingNote}<textarea name="note" rows={3} maxLength={3000} /></label>
          <div className="toolbar-actions"><button type="button" className="secondary" onClick={() => setOpen('')}>{t.cancel}</button><button className="primary" disabled={busy}>{t.confirmClose}</button></div>
        </form>
      : <button className="secondary" onClick={() => setOpen('close')}>{t.closeContract}</button>)}
  </Sheet>;
}

/* --------------------------------------------------------- evaluating */

function EvaluationForm({ c, lang, busy, onCancel, onSubmit }: { c: Contract; lang: Lang; busy: boolean; onCancel: () => void; onSubmit: (body: unknown) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [date, setDate] = useState(c.today), [delivery, setDelivery] = useState(''), [comment, setComment] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({}), [notes, setNotes] = useState<Record<string, string>>({});
  const given = c.quality_criteria.filter(q => scores[q.key]);
  const avg = given.length ? given.reduce((s, q) => s + scores[q.key]!, 0) / given.length : null;
  const complete = given.length === c.quality_criteria.length;
  const target = Number(c.quality_target);
  return <form className="link-form eval-form" onSubmit={e => {
    e.preventDefault();
    onSubmit({ evaluatedOn: date, deliveryId: delivery || null, comment: comment || null, scores: c.quality_criteria.map(q => ({ key: q.key, score: scores[q.key], justification: notes[q.key] || undefined })) });
  }}>
    <h3 className="form-title">{t.evalTitle}</h3>
    <p className="panel-desc">{t.evalHelp}</p>
    <div className="form-row">
      <label>{t.evalDate}<input type="date" required max={c.today} value={date} onChange={e => setDate(e.target.value)} /></label>
      <label>{t.evalService}<select value={delivery} onChange={e => setDelivery(e.target.value)}><option value="">{t.wholeContract}</option>{c.deliveries.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select></label>
    </div>
    {c.quality_criteria.map(q => <fieldset key={q.key} className="eval-criterion">
      <legend>{q.label}{scores[q.key] ? <span className="score-pill small" data-tone={toneOfMark(scores[q.key]!, target)}>{scores[q.key]}/10</span> : null}</legend>
      <div className="score-picker">{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <label key={n} className="score-option" data-tone={toneOfMark(n, target)}>
        <input type="radio" name={`score-${q.key}`} value={n} checked={scores[q.key] === n} required onChange={() => setScores(s => ({ ...s, [q.key]: n }))} /><span>{n}</span></label>)}</div>
      <label className="eval-just-input"><span className="sr-only">{t.justification} — {q.label}</span><textarea rows={2} maxLength={1000} placeholder={`${t.justification} : ${t.justHint}`} value={notes[q.key] ?? ''} onChange={e => setNotes(n => ({ ...n, [q.key]: e.target.value }))} /></label>
    </fieldset>)}
    <label>{t.comment}<textarea rows={2} maxLength={3000} value={comment} onChange={e => setComment(e.target.value)} /></label>
    <p className="eval-avg">{t.average} : <strong>{avg === null ? '—' : num(avg, lang, 2)}</strong>/10</p>
    <div className="toolbar-actions"><button type="button" className="secondary" onClick={onCancel}>{t.cancel}</button><button className="primary" disabled={busy || !complete}>{t.saveEval}</button></div>
  </form>;
}
