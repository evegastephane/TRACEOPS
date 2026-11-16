import React, { useEffect, useState } from 'react';
import { api } from './api';
import type { Lang } from './i18n';
import { AlertIcon, PaymentIcon, SearchIcon } from './icons';
import { Alert, Empty, PageHead, Sheet, Skeleton } from './ui';
import { addDays, contractRef, daysBetween, fcfa, fill, instantDay, interventionRef, num, paymentState, say, serviceState, shortFcfa, todayKey, type Billable, type Ctx, type Org, type Tone } from './procurement-model';

/* ------------------------------------------------------------------ words */

const fr = {
  title: 'Règlements', intro: 'Chaque prestation acceptée devient payable après le délai de règlement (30 jours par défaut). Le statut de la prestation — acceptée ou rejetée — et celui du paiement — en attente ou réglé — sont suivis séparément.',
  introProvider: 'Les sommes attendues de vos clients : une prestation acceptée devient payable après le délai de règlement convenu.',
  terms: 'Délai de règlement', termsValue: '30 jours après acceptation, sauf contrat', toPay: 'À régler', toCash: 'À encaisser', pendingN: '{n} règlement(s) en attente', late: 'En retard', lateNote: '{a} — le plus ancien depuis {d} j',
  lateNone: 'aucun retard', soon: 'Échéance sous 7 jours', soonNote: '{a}', paid30: 'Réglé sur 30 jours', paid30Note: '{n} règlement(s)', cashed30: 'Encaissé sur 30 jours', delay: 'Délai moyen de règlement',
  delayNote: 'entre acceptation et paiement · {p} % à l’échéance', days: 'j', alerts: 'Alertes', alertsMeta: 'échéances dépassées et à venir sous 7 jours', noAlert: 'Aucune échéance dépassée ni proche.',
  search: 'Rechercher', searchHint: 'Référence, prestation, prestataire', payFilter: 'Règlement', serviceFilter: 'Prestation', partner: 'Prestataire', client: 'Client', all: 'Tous',
  fNotDue: 'Non exigible', fPending: 'En attente', fSoon: 'Échéance proche', fLate: 'En retard', fPaid: 'Réglé', fNotOwed: 'Non dû',
  sTodo: 'À réaliser ou à réceptionner', sAccepted: 'Acceptée', sRejected: 'Rejetée',
  ref: 'Réf.', service: 'Prestation', amount: 'Montant', serviceState: 'Prestation', due: 'Échéance', paymentState: 'Règlement', maintenance: 'Maintenance sur devis accepté',
  pay: 'Enregistrer le règlement', paidOn: 'Date du règlement', paidAmount: 'Montant réglé', reference: 'Référence (virement, chèque)', cancel: 'Annuler', paidMsg: 'Règlement enregistré.',
  empty: 'Aucune prestation payable pour le moment.', emptyText: 'Les prestations des contrats et les maintenances sur devis apparaissent ici dès qu’elles sont planifiées.', noMatch: 'Aucune ligne ne correspond.',
  showLater: 'Afficher les {n} prestations à venir', loading: 'Chargement…', retry: 'Réessayer', loadError: 'Impossible de charger les règlements. Réessayez.', refShort: 'réf. {r}', none: '—', count: '{n} ligne(s)',
};
type T = typeof fr;
const en: T = {
  title: 'Payments', intro: 'Each accepted service becomes payable after the payment terms (30 days by default). The service’s state — accepted or rejected — and the payment’s — pending or paid — are followed separately.',
  introProvider: 'What your clients owe you: an accepted service becomes payable after the agreed payment terms.',
  terms: 'Payment terms', termsValue: '30 days after acceptance, unless the contract says otherwise', toPay: 'To pay', toCash: 'To receive', pendingN: '{n} pending payment(s)', late: 'Overdue', lateNote: '{a} — oldest {d} d overdue',
  lateNone: 'nothing overdue', soon: 'Due within 7 days', soonNote: '{a}', paid30: 'Paid in 30 days', paid30Note: '{n} payment(s)', cashed30: 'Received in 30 days', delay: 'Average payment time',
  delayNote: 'from acceptance to payment · {p}% on time', days: 'd', alerts: 'Alerts', alertsMeta: 'overdue and due within 7 days', noAlert: 'Nothing overdue or due soon.',
  search: 'Search', searchHint: 'Reference, service, provider', payFilter: 'Payment', serviceFilter: 'Service', partner: 'Provider', client: 'Client', all: 'All',
  fNotDue: 'Not yet due', fPending: 'Pending', fSoon: 'Due soon', fLate: 'Overdue', fPaid: 'Paid', fNotOwed: 'Not owed',
  sTodo: 'To deliver or accept', sAccepted: 'Accepted', sRejected: 'Rejected',
  ref: 'Ref.', service: 'Service', amount: 'Amount', serviceState: 'Service', due: 'Due date', paymentState: 'Payment', maintenance: 'Maintenance under accepted quote',
  pay: 'Record the payment', paidOn: 'Payment date', paidAmount: 'Amount paid', reference: 'Reference (transfer, cheque)', cancel: 'Cancel', paidMsg: 'Payment recorded.',
  empty: 'Nothing payable yet.', emptyText: 'Contract services and quoted maintenance appear here as soon as they are planned.', noMatch: 'No line matches.',
  showLater: 'Show the {n} upcoming services', loading: 'Loading…', retry: 'Try again', loadError: 'The payments could not be loaded. Try again.', refShort: 'ref. {r}', none: '—', count: '{n} line(s)',
};

type Row = Billable & { kind: 'DELIVERY' | 'INTERVENTION'; item_id: string; contract_id: string | null; intervention_id: string | null; parent_number: number; parent_title: string | null; label: string;
  provider_name: string; client_name: string; amount_xaf: string; decision_reason: string | null; payment_id: string | null; paid_amount_xaf: string | null; reference: string | null; terms_days: number | null; default_terms: number };

/** A state as a chip; a state that asks nothing yet (to deliver later, not yet due) stays quiet. */
const State = ({ tone, label, note, quiet }: { tone: Tone; label: string; note?: string; quiet?: boolean }) => <span className={quiet ? 'state-stack is-quiet' : 'state-stack'}>
  <span className={quiet ? 'state-quiet' : `state state-${tone}`}>{label}</span>{note && <small>{note}</small>}</span>;
/** What to look at first: overdue, due soon, pending, waiting for acceptance, then what is settled. */
const rank: Record<string, number> = { late: 0, soon: 1, pending: 2, notdue: 3, paid: 4, notowed: 5 };

export function PaymentsPage({ org, lang, admin, ctx, onOpenContract, onOpenIntervention }: { org: Org; lang: Lang; admin: boolean; ctx: Ctx; onOpenContract: (id: string) => void; onOpenIntervention: (id: string) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [rows, setRows] = useState<Row[]>([]), [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'), [attempt, setAttempt] = useState(0);
  const [q, setQ] = useState(''), [pay, setPay] = useState(''), [service, setService] = useState(''), [partner, setPartner] = useState('');
  const [open, setOpen] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [later, setLater] = useState(false);
  useEffect(() => { let a = true; setState(s => s === 'ready' ? 'ready' : 'loading'); api('payments', undefined, org.id).then(r => { if (a) { setRows(r); setState('ready'); } }).catch(() => { if (a) setState('error'); }); return () => { a = false; }; }, [org.id, attempt]);
  const client = org.kind === 'CLIENT', manager = client && !admin && (org.roles ?? []).includes('CLIENT_MANAGER');
  const today = todayKey(), ready = state === 'ready';
  const rowsWith = rows.map(r => ({ r, s: serviceState(r, today, lang), p: paymentState(r, today, lang) }));
  const pending = rowsWith.filter(x => x.r.payment_status === 'PENDING'), late = pending.filter(x => x.p.key === 'late'), soon = pending.filter(x => x.p.key === 'soon');
  const paid = rowsWith.filter(x => x.r.payment_status === 'PAID'), paid30 = paid.filter(x => x.r.paid_on && x.r.paid_on >= addDays(today, -30));
  const delays = paid.filter(x => x.r.decided_at && x.r.paid_on).map(x => daysBetween(instantDay(x.r.decided_at!), x.r.paid_on!));
  const onTime = paid.filter(x => x.r.paid_on && x.r.due_date && x.r.paid_on <= x.r.due_date).length;
  const sum = (list: typeof rowsWith) => list.reduce((s, x) => s + Number(x.r.amount_xaf), 0);
  const partners = [...new Set(rows.map(r => client ? r.provider_name : r.client_name))].sort((a, b) => a.localeCompare(b));
  const needle = q.trim().toLocaleLowerCase(lang);
  const refOf = (r: Row) => r.kind === 'DELIVERY' ? contractRef(r.parent_number) : interventionRef(r.parent_number);
  const shown = rowsWith.filter(({ r, s, p }) => (!pay || p.key === pay) && (!service || (service === 'todo' ? ['todo', 'late', 'delivered'].includes(s.key) : s.key === service))
    && (!partner || (client ? r.provider_name : r.client_name) === partner)
    && (!needle || [refOf(r), r.label, r.parent_title, r.provider_name, r.client_name, r.reference].filter(Boolean).join(' ').toLocaleLowerCase(lang).includes(needle)));
  // Services planned later and not delivered yet ask nothing of anyone: hidden unless asked for.
  const laterCount = rowsWith.filter(x => x.s.key === 'todo').length;
  const when = (x: typeof rowsWith[number]) => x.p.key === 'paid' ? -Date.parse(x.r.paid_on ?? '1970-01-01') : Date.parse(x.r.due_date ?? x.r.planned_date);
  const listed = shown.filter(x => later || pay || service || x.s.key !== 'todo')
    .sort((a, b) => rank[a.p.key]! - rank[b.p.key]! || (a.p.key === 'notdue' ? Number(Boolean(b.r.delivered_at)) - Number(Boolean(a.r.delivered_at)) : 0) || when(a) - when(b));
  const openRef = (r: Row) => r.kind === 'DELIVERY' ? r.contract_id && onOpenContract(r.contract_id) : r.intervention_id && onOpenIntervention(r.intervention_id);
  const submitPay = (r: Row, f: FormData) => {
    setBusy(true); setError(''); setNotice('');
    api(`payments/${r.payment_id}/pay`, { paidOn: f.get('paidOn'), amount: Number(f.get('amount')), reference: f.get('reference') || null }, org.id)
      .then(() => { setOpen(''); setNotice(t.paidMsg); setAttempt(n => n + 1); }).catch(e => setError(say(e, lang))).finally(() => setBusy(false));
  };
  const payForm = (r: Row) => <form className="link-form" onSubmit={e => { e.preventDefault(); submitPay(r, new FormData(e.currentTarget)); }}>
    <div className="form-row form-row-3">
      <label>{t.paidOn}<input name="paidOn" type="date" required max={today} defaultValue={today} /></label>
      <label>{t.paidAmount}<span className="unit-input"><input name="amount" type="number" min={1} step={1} required defaultValue={Number(r.amount_xaf)} /><span className="unit">FCFA</span></span></label>
      <label>{t.reference}<input name="reference" maxLength={120} /></label>
    </div>
    <div className="toolbar-actions"><button type="button" className="secondary" disabled={busy} onClick={() => setOpen('')}>{t.cancel}</button><button className="primary" disabled={busy}>{t.pay}</button></div>
  </form>;
  const title = (r: Row) => <>
    <button type="button" className="work-title is-wrapping" onClick={e => { e.stopPropagation(); openRef(r); }}>{r.label}</button>
    <span className="work-meta">{r.kind === 'DELIVERY' ? r.parent_title : t.maintenance}</span>
  </>;
  const oldest = late.reduce((mx, x) => Math.max(mx, x.p.days ?? 0), 0);

  return <section className="payments">
    <PageHead title={t.title} subtitle={ctx.subtitle} cells={[{ label: t.terms, value: t.termsValue, wide: true }, { label: lang === 'fr' ? 'Lignes' : 'Lines', value: ready ? String(rows.length) : '–' }]} />
    <p className="page-intro">{client ? t.intro : t.introProvider}</p>
    {error && <Alert>{error}</Alert>}
    {notice && <Alert kind="success">{notice}</Alert>}
    <dl className="kpis">
      <div className="kpi kpi-hero"><dt>{client ? t.toPay : t.toCash}</dt><dd><span className="kpi-value">{ready ? shortFcfa(sum(pending), lang) : '–'}</span><span className="kpi-note">{fill(t.pendingN, { n: pending.length })}</span></dd></div>
      <div className={late.length ? 'kpi is-alert' : 'kpi'}><dt>{t.late}</dt><dd><span className="kpi-value">{ready ? late.length : '–'}</span><span className="kpi-note">{late.length ? fill(t.lateNote, { a: fcfa(sum(late), lang), d: oldest }) : t.lateNone}</span></dd></div>
      <div className="kpi"><dt>{t.soon}</dt><dd><span className="kpi-value">{ready ? soon.length : '–'}</span><span className="kpi-note">{soon.length ? fcfa(sum(soon), lang) : '—'}</span></dd></div>
      <div className="kpi"><dt>{client ? t.paid30 : t.cashed30}</dt><dd><span className="kpi-value">{ready ? shortFcfa(paid30.reduce((s, x) => s + Number(x.r.paid_amount_xaf ?? x.r.amount_xaf), 0), lang) : '–'}</span><span className="kpi-note">{fill(t.paid30Note, { n: paid30.length })}</span></dd></div>
      <div className="kpi"><dt>{t.delay}</dt><dd><span className="kpi-value">{ready && delays.length ? <>{num(delays.reduce((a, b) => a + b, 0) / delays.length, lang, 0)}<small> {t.days}</small></> : '–'}</span>
        <span className="kpi-note">{fill(t.delayNote, { p: paid.length ? Math.round((onTime / paid.length) * 100) : 0 })}</span></dd></div>
    </dl>

    {state === 'error' ? <Alert retry={() => setAttempt(n => n + 1)} retryLabel={t.retry}>{t.loadError}</Alert> : state === 'loading' && !rows.length ? <Skeleton label={t.loading} /> : <>
      <Sheet id="alerts" title={t.alerts} meta={t.alertsMeta} className={late.length ? 'sheet-alert' : undefined}>
        {late.length + soon.length ? <ul className="alert-list">{[...late, ...soon].map(({ r, p }) => <li key={r.item_id} className={`alert-row is-${p.key}`}>
          <span className="alert-icon" aria-hidden="true"><AlertIcon /></span>
          <span className="alert-main"><span className="work-ref">{refOf(r)}</span>{title(r)}</span>
          <span className="alert-party">{client ? r.provider_name : r.client_name}</span>
          <strong className="alert-amount">{fcfa(r.amount_xaf, lang)}</strong>
          <State tone={p.tone} label={p.label} note={p.note} />
          {manager && r.payment_id && open !== 'pay-' + r.item_id && <button className="secondary small" onClick={() => setOpen('pay-' + r.item_id)}>{t.pay}</button>}
          {open === 'pay-' + r.item_id && <div className="alert-form">{payForm(r)}</div>}
        </li>)}</ul> : <p className="muted">{t.noAlert}</p>}
      </Sheet>

      <div className="filters">
        <label className="filter-search">{t.search}<span className="search-field"><SearchIcon /><input type="search" value={q} placeholder={t.searchHint} onChange={e => setQ(e.target.value)} /></span></label>
        <label>{t.payFilter}<select aria-label={t.payFilter} value={pay} onChange={e => setPay(e.target.value)}><option value="">{t.all}</option>
          <option value="notdue">{t.fNotDue}</option><option value="pending">{t.fPending}</option><option value="soon">{t.fSoon}</option><option value="late">{t.fLate}</option><option value="paid">{t.fPaid}</option><option value="notowed">{t.fNotOwed}</option></select></label>
        <label>{t.serviceFilter}<select aria-label={t.serviceFilter} value={service} onChange={e => setService(e.target.value)}><option value="">{t.all}</option>
          <option value="todo">{t.sTodo}</option><option value="accepted">{t.sAccepted}</option><option value="rejected">{t.sRejected}</option></select></label>
        <label>{client ? t.partner : t.client}<select aria-label={client ? t.partner : t.client} value={partner} onChange={e => setPartner(e.target.value)}><option value="">{t.all}</option>{partners.map(p => <option key={p} value={p}>{p}</option>)}</select></label>
        {laterCount > 0 && !pay && !service && <label className="check inline filter-check"><input type="checkbox" checked={later} onChange={e => setLater(e.target.checked)} /><span><strong>{fill(t.showLater, { n: laterCount })}</strong></span></label>}
      </div>
      {!rows.length ? <div className="sheet"><Empty icon={<PaymentIcon />} title={t.empty}>{t.emptyText}</Empty></div> : !listed.length ? <Empty icon={<PaymentIcon />}>{t.noMatch}</Empty>
        : <div className="table-card"><table className="audit-table payment-table">
            <thead><tr><th scope="col" className="col-ref">{t.ref}</th><th scope="col">{t.service}</th><th scope="col" className="col-party">{client ? t.partner : t.client}</th><th scope="col" className="col-amount num">{t.amount}</th>
              <th scope="col" className="col-state">{t.serviceState}</th><th scope="col" className="col-pay">{t.paymentState}</th></tr></thead>
            <tbody>{listed.map(({ r, s, p }) => <React.Fragment key={r.item_id}>
              <tr className={`pay-row is-${p.key}`}>
                <td data-label={t.ref}><span className="work-ref">{refOf(r)}</span></td>
                <td data-label={t.service} className="work-main-cell">{title(r)}</td>
                <td data-label={client ? t.partner : t.client} className="work-party-cell"><span className="work-party" title={client ? r.provider_name : r.client_name}>{client ? r.provider_name : r.client_name}</span></td>
                <td data-label={t.amount} className="num"><strong>{fcfa(r.amount_xaf, lang)}</strong>{r.paid_amount_xaf && Number(r.paid_amount_xaf) !== Number(r.amount_xaf) && <small className="cell-sub">{fcfa(r.paid_amount_xaf, lang)}</small>}</td>
                <td data-label={t.serviceState}><State quiet={s.key === 'todo'} tone={s.tone} label={s.label} note={s.note} /></td>
                <td data-label={t.paymentState}><State quiet={p.key === 'notdue'} tone={p.tone} label={p.label} note={[p.note, r.reference ? fill(t.refShort, { r: r.reference }) : ''].filter(Boolean).join(' · ')} />
                  {manager && r.payment_id && r.payment_status === 'PENDING' && open !== 'row-' + r.item_id && <button className="link-button pay-link" onClick={() => setOpen('row-' + r.item_id)}>{t.pay}</button>}</td>
              </tr>
              {open === 'row-' + r.item_id && <tr className="task-actions-row"><td colSpan={6}>{payForm(r)}</td></tr>}
            </React.Fragment>)}</tbody></table></div>}
    </>}
  </section>;
}
