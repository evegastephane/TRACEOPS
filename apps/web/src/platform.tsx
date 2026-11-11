import React, { useEffect, useState } from 'react';
import { api } from './api';
import { Avatar } from './avatar';
import type { Lang } from './i18n';
import { actionLabel } from './admin';
import { StackedColumns, type Series } from './charts';
import { Alert, Empty, PageHead, Sheet, Skeleton } from './ui';

type Totals = { clients: number; providers: number; users: number; agents: number; sites: number; zones: number; assignments: number; agreements: number; pending_invitations: number; actions_24h: number };
type OrgRow = { id: string; name: string; kind: 'CLIENT' | 'PROVIDER'; members: number; agents: number; sites: number; last_activity: string | null; interventions?: number; accepted?: number };
type Entry = { id: string; created_at: string; action: string; actor_name: string; actor_login: string; org_name: string | null; target_name: string | null };
type Interventions = { statuses: { status: string; kind: string; n: number }[]; days: { day: string; status: string; n: number }[] };

const text = {
  fr: { intro: 'Toute la plateforme en un coup d’œil : organisations, équipes, sites, interventions et dernières actions. Chaque chiffre est calculé sur les données réelles.',
    clients: 'Clients', providers: 'Prestataires', users: 'Utilisateurs actifs', agents: 'Agents terrain', sites: 'Sites', zones: 'Lieux définis', assignments: 'Affectations',
    agreements: 'Rattachements actifs', invitations: 'Invitations en attente', actions: 'Actions sur 24 h', orgs: 'Organisations', recent: 'Activité récente', all: 'Ouvrir le journal complet',
    name: 'Nom', kind: 'Type', members: 'Membres', lastActivity: 'Dernière action', open: 'Ouvrir', never: 'Aucune', client: 'Client', provider: 'Prestataire',
    filterAll: 'Toutes', loading: 'Chargement…', retry: 'Réessayer', error: 'Impossible de charger la vue d’ensemble. Réessayez.', noOrg: 'Aucune organisation pour le moment.',
    title: 'Vue d’ensemble', scope: 'Périmètre', platform: 'Toute la plateforme', edited: 'Édité', interventions: 'Interventions', accepted: 'Acceptées', acceptedShare: '{p} des interventions',
    perDay: 'Interventions par jour', perDayMeta: '4 semaines passées, 2 à venir', byStatus: 'Interventions par étape', showData: 'Afficher les données', hideData: 'Masquer les données', table: 'Données du graphique', noData: 'Aucune intervention enregistrée.',
    sAccepted: 'Acceptées', sReview: 'À contrôler', sAlert: 'Reprise ou retard', sPlanned: 'Planifiées', sAssign: 'À affecter ou à chiffrer',
    stRequest: 'Demande', stQuote: 'Devis', stAssign: 'Affectation', stWork: 'Réalisation', stReview: 'Contrôle', stAccepted: 'Acceptées', network: 'Réseau', teams: 'Équipes' },
  en: { intro: 'The whole platform at a glance: organizations, teams, sites, interventions and latest actions. Every figure is computed from live data.',
    clients: 'Clients', providers: 'Providers', users: 'Active users', agents: 'Field agents', sites: 'Sites', zones: 'Places defined', assignments: 'Assignments',
    agreements: 'Active links', invitations: 'Pending invitations', actions: 'Actions in 24 h', orgs: 'Organizations', recent: 'Recent activity', all: 'Open the full log',
    name: 'Name', kind: 'Type', members: 'Members', lastActivity: 'Last action', open: 'Open', never: 'None', client: 'Client', provider: 'Provider',
    filterAll: 'All', loading: 'Loading…', retry: 'Try again', error: 'The overview could not be loaded. Try again.', noOrg: 'No organization yet.',
    title: 'Overview', scope: 'Scope', platform: 'Whole platform', edited: 'Issued', interventions: 'Interventions', accepted: 'Accepted', acceptedShare: '{p} of interventions',
    perDay: 'Interventions per day', perDayMeta: 'past 4 weeks, next 2', byStatus: 'Interventions by step', showData: 'Show the data', hideData: 'Hide the data', table: 'Chart data', noData: 'No intervention recorded.',
    sAccepted: 'Accepted', sReview: 'To review', sAlert: 'Rework or late', sPlanned: 'Scheduled', sAssign: 'To assign or quote',
    stRequest: 'Request', stQuote: 'Quote', stAssign: 'Assignment', stWork: 'Work', stReview: 'Review', stAccepted: 'Accepted', network: 'Network', teams: 'Teams' },
};
const stepOf: Record<string, number> = { REQUESTED: 0, QUOTE_REFUSED: 0, QUOTE_SUBMITTED: 1, PLANNED: 2, ASSIGNED: 3, IN_PROGRESS: 3, REWORK: 3, UNDER_REVIEW: 4, ACCEPTED: 5 };

/** Administrator home: the whole platform, not one organization. */
export function PlatformOverview({ lang, userName, onOpenOrg, onOpenLog }: { lang: Lang; userName: string; onOpenOrg: (id: string) => void; onOpenLog: () => void }) {
  const t = text[lang], loc = lang === 'fr' ? 'fr-FR' : 'en-GB';
  const [data, setData] = useState<{ totals: Totals; organizations: OrgRow[]; recent: Entry[]; interventions?: Interventions } | null>(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  const [kind, setKind] = useState<'' | 'CLIENT' | 'PROVIDER'>(''), [showData, setShowData] = useState(false);
  useEffect(() => {
    let active = true; setFailed(false);
    api('admin/overview').then(d => { if (active) setData(d); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [attempt]);
  const stamp = (iso: string | null) => iso ? new Date(iso).toLocaleString(loc, { dateStyle: 'medium', timeStyle: 'short' }) : t.never;
  const head = <PageHead title={t.title} subtitle={t.intro} cells={[{ label: t.scope, value: t.platform }, { label: t.edited, value: `${new Date().toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })} · ${userName}` }]} />;
  if (failed) return <>{head}<Alert retry={() => setAttempt(n => n + 1)} retryLabel={t.retry}>{t.error}</Alert></>;
  if (!data) return <>{head}<Skeleton label={t.loading} /></>;
  const s = data.totals, rows = data.organizations.filter(o => !kind || o.kind === kind);
  const iv = data.interventions ?? { statuses: [], days: [] };
  const total = iv.statuses.filter(x => x.status !== 'CANCELLED').reduce((n, x) => n + x.n, 0), accepted = iv.statuses.filter(x => x.status === 'ACCEPTED').reduce((n, x) => n + x.n, 0);
  const steps = [t.stRequest, t.stQuote, t.stAssign, t.stWork, t.stReview, t.stAccepted].map((label, n) => ({ label, n: iv.statuses.filter(x => stepOf[x.status] === n).reduce((m, x) => m + x.n, 0) }));
  const stepMax = Math.max(1, ...steps.map(x => x.n));
  // One column per day, from four weeks back to two weeks ahead; planned work whose day has passed counts as late.
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Douala' });
  const series: Series[] = [{ key: 'accepted', label: t.sAccepted }, { key: 'review', label: t.sReview }, { key: 'alert', label: t.sAlert }, { key: 'planned', label: t.sPlanned }, { key: 'assign', label: t.sAssign }];
  const columns = Array.from({ length: 42 }, (_, n) => {
    const d = new Date(Date.parse(today + 'T12:00:00Z') + (n - 27) * 86400000), key = d.toISOString().slice(0, 10), past = key < today;
    const values: Record<string, number> = { accepted: 0, review: 0, alert: 0, planned: 0, assign: 0 };
    for (const x of iv.days.filter(r => r.day === key)) {
      const band = x.status === 'ACCEPTED' ? 'accepted' : x.status === 'UNDER_REVIEW' ? 'review' : x.status === 'REWORK' || (past && ['PLANNED', 'ASSIGNED'].includes(x.status)) ? 'alert'
        : ['ASSIGNED', 'IN_PROGRESS'].includes(x.status) ? 'planned' : x.status === 'CANCELLED' ? null : 'assign';
      if (band) values[band] += x.n;
    }
    return { key, values, highlight: key === today, label: d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }), short: d.toLocaleDateString(loc, { day: 'numeric', month: 'short', timeZone: 'UTC' }) };
  });
  const kpi = (v: number | string, label: string, note?: string, hero = false) => <div className={hero ? 'kpi kpi-hero' : 'kpi'} key={label}><dt>{label}</dt><dd><span className="kpi-value">{v}</span>{note && <span className="kpi-note">{note}</span>}</dd></div>;
  return <section className="platform">
    {head}
    <dl className="kpis">
      {kpi(total, t.interventions, `${accepted} ${t.accepted.toLowerCase()} · ${total ? t.acceptedShare.replace('{p}', `${Math.round((accepted / total) * 100)} %`) : '—'}`, true)}
      {kpi(s.clients, t.clients, `${s.sites} ${t.sites.toLowerCase()} · ${s.zones} ${t.zones.toLowerCase()}`)}
      {kpi(s.providers, t.providers, `${s.agreements} ${t.agreements.toLowerCase()}`)}
      {kpi(s.users, t.users, `${s.agents} ${t.agents.toLowerCase()}`)}
      {kpi(s.actions_24h, t.actions, `${s.pending_invitations} ${t.invitations.toLowerCase()}`)}
    </dl>
    <div className="dash-grid dash-grid-wide">
      <Sheet id="pdays" title={t.perDay} meta={t.perDayMeta} actions={<button className="link-button" aria-pressed={showData} onClick={() => setShowData(v => !v)}>{showData ? t.hideData : t.showData}</button>}>
        <StackedColumns title={t.perDay} columns={columns} series={series} tableLabel={t.table} showTable={showData} emptyText={t.noData} />
      </Sheet>
      <Sheet id="psteps" title={t.byStatus}>
        <ul className="step-bars">{steps.map((r, n) => <li key={r.label}><div className="step-bar">
          <span className="step-name"><span className="step-n">{n + 1}</span>{r.label}</span>
          <span className="step-track"><span className={`step-fill o${n + 1}`} style={{ width: `${(r.n / stepMax) * 100}%` }} /></span>
          <span className="step-count">{r.n}</span></div></li>)}</ul>
      </Sheet>
    </div>
    <Sheet id="porgs" title={t.orgs} meta={String(rows.length)} actions={<div className="segmented" role="group" aria-label={t.kind}>{([['', t.filterAll], ['CLIENT', t.clients], ['PROVIDER', t.providers]] as const).map(([v, l]) => <button key={v} type="button" aria-pressed={kind === v} onClick={() => setKind(v)}>{l}</button>)}</div>}>
        {!rows.length ? <Empty>{t.noOrg}</Empty>
          : <div className="table-card table-flat"><table className="audit-table org-table">
              <thead><tr><th scope="col">{t.name}</th><th scope="col" className="col-kind">{t.kind}</th><th scope="col" className="num col-n">{t.members}</th><th scope="col" className="num col-n">{t.sites}</th><th scope="col" className="num col-iv">{t.interventions}</th><th scope="col" className="col-when">{t.lastActivity}</th><th scope="col" className="col-open"><span className="sr-only">{t.open}</span></th></tr></thead>
              <tbody>{rows.map(o => <tr key={o.id}>
                <td data-label={t.name}><span className="member-id"><Avatar name={o.name} seed={o.id} shape="square" size="sm" /><strong title={o.name}>{o.name}</strong></span></td>
                <td data-label={t.kind}><span className="badge">{o.kind === 'CLIENT' ? t.client : t.provider}</span></td>
                <td data-label={t.members} className="num">{o.members}</td>
                <td data-label={t.sites} className="num">{o.sites}</td>
                <td data-label={t.interventions} className="num">{o.interventions ?? 0}{o.interventions ? <span className="muted"> · {o.accepted ?? 0} {t.accepted.toLowerCase()}</span> : null}</td>
                <td data-label={t.lastActivity} className="audit-when">{stamp(o.last_activity)}</td>
                <td><button className="secondary small" aria-label={`${t.open} : ${o.name}`} onClick={() => onOpenOrg(o.id)}>{t.open}</button></td>
              </tr>)}</tbody>
            </table></div>}
    </Sheet>
    <Sheet id="precent" title={t.recent} actions={<button className="link-button" onClick={onOpenLog}>{t.all}</button>}>
        <ul className="people recent">{data.recent.map(e => <li key={e.id}>
          <span className="member-id"><Avatar name={e.actor_name} seed={e.actor_login} size="sm" /><span className="people-text"><strong>{e.actor_name} · {actionLabel(e.action, lang)}</strong><span className="muted">{[e.target_name, e.org_name].filter(Boolean).join(' · ') || '—'}</span></span></span>
          <span className="audit-when">{stamp(e.created_at)}</span>
        </li>)}</ul>
    </Sheet>
  </section>;
}
