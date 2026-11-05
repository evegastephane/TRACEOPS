import React, { useEffect, useState } from 'react';
import { api } from './api';
import { Avatar } from './avatar';
import type { Lang } from './i18n';
import { AlertIcon } from './icons';
import { actionLabel } from './admin';

type Totals = { clients: number; providers: number; users: number; agents: number; sites: number; zones: number; assignments: number; agreements: number; pending_invitations: number; actions_24h: number };
type OrgRow = { id: string; name: string; kind: 'CLIENT' | 'PROVIDER'; members: number; agents: number; sites: number; last_activity: string | null };
type Entry = { id: string; created_at: string; action: string; actor_name: string; actor_login: string; org_name: string | null; target_name: string | null };

const text = {
  fr: { intro: 'Toute la plateforme en un coup d’œil : organisations, équipes, sites et dernières actions. Chaque chiffre est calculé sur les données réelles.',
    clients: 'Clients', providers: 'Prestataires', users: 'Utilisateurs actifs', agents: 'Agents terrain', sites: 'Sites', zones: 'Lieux définis', assignments: 'Affectations',
    agreements: 'Rattachements actifs', invitations: 'Invitations en attente', actions: 'Actions sur 24 h', orgs: 'Organisations', recent: 'Activité récente', all: 'Ouvrir le journal complet',
    name: 'Nom', kind: 'Type', members: 'Membres', lastActivity: 'Dernière action', open: 'Ouvrir', never: 'Aucune', client: 'Client', provider: 'Prestataire',
    filterAll: 'Toutes', loading: 'Chargement…', retry: 'Réessayer', error: 'Impossible de charger la vue d’ensemble. Réessayez.', noOrg: 'Aucune organisation pour le moment.',
    interventions: 'Interventions, photos et rapports PDF arriveront avec le prochain lot : aucun chiffre n’est encore calculé pour eux.', title: 'Vue d’ensemble' },
  en: { intro: 'The whole platform at a glance: organizations, teams, sites and latest actions. Every figure is computed from live data.',
    clients: 'Clients', providers: 'Providers', users: 'Active users', agents: 'Field agents', sites: 'Sites', zones: 'Places defined', assignments: 'Assignments',
    agreements: 'Active links', invitations: 'Pending invitations', actions: 'Actions in 24 h', orgs: 'Organizations', recent: 'Recent activity', all: 'Open the full log',
    name: 'Name', kind: 'Type', members: 'Members', lastActivity: 'Last action', open: 'Open', never: 'None', client: 'Client', provider: 'Provider',
    filterAll: 'All', loading: 'Loading…', retry: 'Try again', error: 'The overview could not be loaded. Try again.', noOrg: 'No organization yet.',
    interventions: 'Interventions, photos and PDF reports come with the next release: no figure is computed for them yet.', title: 'Overview' },
};

/** Administrator home: the whole platform, not one organization. */
export function PlatformOverview({ lang, onOpenOrg, onOpenLog }: { lang: Lang; onOpenOrg: (id: string) => void; onOpenLog: () => void }) {
  const t = text[lang];
  const [data, setData] = useState<{ totals: Totals; organizations: OrgRow[]; recent: Entry[] } | null>(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  const [kind, setKind] = useState<'' | 'CLIENT' | 'PROVIDER'>('');
  useEffect(() => {
    let active = true; setFailed(false);
    api('admin/overview').then(d => { if (active) setData(d); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [attempt]);
  const stamp = (iso: string | null) => iso ? new Date(iso).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : t.never;
  if (failed) return <div className="alert alert-error" role="alert"><AlertIcon /><div className="alert-body"><p>{t.error}</p><button className="secondary small" onClick={() => setAttempt(n => n + 1)}>{t.retry}</button></div></div>;
  if (!data) return <div className="skeleton" role="status"><span className="sr-only">{t.loading}</span><span className="skeleton-row" /><span className="skeleton-row" /><span className="skeleton-row" /></div>;
  const s = data.totals, stat = (v: number, label: string) => <div className="stat" key={label}><dt>{label}</dt><dd>{v}</dd></div>;
  const rows = data.organizations.filter(o => !kind || o.kind === kind);
  return <section className="platform" aria-labelledby="platform-title">
    <h2 id="platform-title" className="sr-only">{t.title}</h2>
    <p className="toolbar-text page-intro">{t.intro}</p>
    <dl className="stats stats-wide">{[stat(s.clients, t.clients), stat(s.providers, t.providers), stat(s.users, t.users), stat(s.agents, t.agents), stat(s.sites, t.sites)]}</dl>
    <dl className="stats stats-wide">{[stat(s.zones, t.zones), stat(s.agreements, t.agreements), stat(s.assignments, t.assignments), stat(s.pending_invitations, t.invitations), stat(s.actions_24h, t.actions)]}</dl>
    <p className="board-note platform-note">{t.interventions}</p>
    <div className="dashboard-grid platform-grid">
      <section className="board" aria-labelledby="platform-orgs">
        <div className="board-head"><h3 id="platform-orgs" className="board-title">{t.orgs}</h3>
          <div className="segmented" role="group" aria-label={t.kind}>{([['', t.filterAll], ['CLIENT', t.clients], ['PROVIDER', t.providers]] as const).map(([v, l]) => <button key={v} type="button" aria-pressed={kind === v} onClick={() => setKind(v)}>{l}</button>)}</div></div>
        {!rows.length ? <div className="empty"><p>{t.noOrg}</p></div>
          : <div className="table-card"><table className="audit-table">
              <thead><tr><th scope="col">{t.name}</th><th scope="col">{t.kind}</th><th scope="col">{t.members}</th><th scope="col">{t.agents}</th><th scope="col">{t.sites}</th><th scope="col">{t.lastActivity}</th><th scope="col"><span className="sr-only">{t.open}</span></th></tr></thead>
              <tbody>{rows.map(o => <tr key={o.id}>
                <td data-label={t.name}><span className="member-id"><Avatar name={o.name} seed={o.id} shape="square" size="sm" /><strong>{o.name}</strong></span></td>
                <td data-label={t.kind}><span className="badge">{o.kind === 'CLIENT' ? t.client : t.provider}</span></td>
                <td data-label={t.members} className="num">{o.members}</td>
                <td data-label={t.agents} className="num">{o.kind === 'PROVIDER' ? o.agents : '—'}</td>
                <td data-label={t.sites} className="num">{o.sites}</td>
                <td data-label={t.lastActivity} className="audit-when">{stamp(o.last_activity)}</td>
                <td><button className="secondary small" aria-label={`${t.open} : ${o.name}`} onClick={() => onOpenOrg(o.id)}>{t.open}</button></td>
              </tr>)}</tbody>
            </table></div>}
      </section>
      <section className="board" aria-labelledby="platform-recent">
        <div className="board-head"><h3 id="platform-recent" className="board-title">{t.recent}</h3><button className="link-button" onClick={onOpenLog}>{t.all}</button></div>
        <ul className="people recent">{data.recent.map(e => <li key={e.id}>
          <span className="member-id"><Avatar name={e.actor_name} seed={e.actor_login} size="sm" /><span className="people-text"><strong>{e.actor_name} · {actionLabel(e.action, lang)}</strong><span className="muted">{[e.target_name, e.org_name].filter(Boolean).join(' · ') || '—'}</span></span></span>
          <span className="audit-when">{stamp(e.created_at)}</span>
        </li>)}</ul>
      </section>
    </div>
  </section>;
}
