import React, { useEffect, useState } from 'react';
import { api, ApiError } from './api';
import { Avatar } from './avatar';
import type { Lang } from './i18n';
import { AlertIcon, CheckIcon, CloseIcon, LinkIcon, SearchIcon, SitesIcon } from './icons';

const fr = {
  intro: 'Vos sites, leurs lieux, les prestataires rattachés et les contrôleurs habilités.',
  sites: 'Sites', places: 'Lieux définis', rooms: 'Salles', providers: 'Prestataires rattachés', controllers: 'Contrôleurs habilités',
  bySite: 'Vos sites', noSite: 'Aucun site pour le moment. Créez votre premier site dans « Sites et salles ».', noProvider: 'Aucun prestataire rattaché', noController: 'Aucun contrôleur habilité',
  placesOf: '{n} lieu(x) dont {r} salle(s)', openSites: 'Ouvrir les sites et salles', findProvider: 'Trouver un prestataire',
  interventions: 'Suivi des interventions', interventionsText: 'Les missions, photos déposées par les agents, validations et rapports PDF arrivent avec le prochain lot. Aucun indicateur d’intervention n’est calculé pour le moment.',
  loading: 'Chargement…', retry: 'Réessayer', loadError: 'Impossible de charger la vue d’ensemble. Réessayez.',
  dirIntro: 'Recherchez un prestataire et rattachez-le à l’un de vos sites.', search: 'Rechercher un prestataire', searchHint: 'Nom, ville ou service',
  noMatch: 'Aucun prestataire ne correspond à cette recherche.', noProviders: 'Aucun prestataire n’est encore inscrit sur la plateforme.',
  linkedTo: 'Rattaché à', notLinked: 'Rattaché à aucun de vos sites', link: 'Rattacher à un site', site: 'Site', chooseSite: 'Choisir un site', confirmLink: 'Rattacher',
  reason: 'Motif de l’action administrative', reasonHelp: 'Ce motif sera conservé dans le journal d’audit.', cancel: 'Annuler', linked: 'Prestataire rattaché.',
  allLinked: 'Ce prestataire est déjà rattaché à tous vos sites.', services: 'Services', contact: 'Contact', dirLoadError: 'Impossible de charger les prestataires. Réessayez.',
  access: 'Sites habilités', accessHelp: 'Le contrôleur ne voit et ne vérifie que les sites cochés.', close: 'Fermer', saved: 'Habilitation mise à jour.',
};
type T = typeof fr;
const en: T = {
  intro: 'Your sites, their places, linked providers and authorized controllers.',
  sites: 'Sites', places: 'Places defined', rooms: 'Rooms', providers: 'Linked providers', controllers: 'Authorized controllers',
  bySite: 'Your sites', noSite: 'No site yet. Create your first site in “Sites and rooms”.', noProvider: 'No linked provider', noController: 'No authorized controller',
  placesOf: '{n} place(s) including {r} room(s)', openSites: 'Open sites and rooms', findProvider: 'Find a provider',
  interventions: 'Intervention tracking', interventionsText: 'Missions, photos uploaded by agents, validations and PDF reports come with the next release. No intervention indicator is calculated yet.',
  loading: 'Loading…', retry: 'Try again', loadError: 'The overview could not be loaded. Try again.',
  dirIntro: 'Search for a provider and link it to one of your sites.', search: 'Search providers', searchHint: 'Name, city or service',
  noMatch: 'No provider matches this search.', noProviders: 'No provider is registered on the platform yet.',
  linkedTo: 'Linked to', notLinked: 'Not linked to any of your sites', link: 'Link to a site', site: 'Site', chooseSite: 'Choose a site', confirmLink: 'Link',
  reason: 'Reason for the administrative action', reasonHelp: 'This reason will be kept in the audit log.', cancel: 'Cancel', linked: 'Provider linked.',
  allLinked: 'This provider is already linked to all your sites.', services: 'Services', contact: 'Contact', dirLoadError: 'The providers could not be loaded. Try again.',
  access: 'Authorized sites', accessHelp: 'The controller only sees and reviews the checked sites.', close: 'Close', saved: 'Authorization updated.',
};
const errors: Record<string, [string, string]> = {
  PROVIDER_ALREADY_LINKED: ['Ce prestataire est déjà rattaché à ce site.', 'This provider is already linked to this site.'],
  FORBIDDEN: ['Vous n’avez pas accès à cette action.', 'You do not have access to this action.'], INVALID_INPUT: ['Vérifiez les champs du formulaire.', 'Check the form fields.'],
  error: ['Une erreur est survenue. Réessayez.', 'Something went wrong. Please try again.'], network: ['Connexion au serveur impossible.', 'Cannot reach the server.'],
};
const say = (e: unknown, lang: Lang) => { const code = e instanceof ApiError ? e.code : 'error'; return (errors[code] ?? errors.error)[lang === 'fr' ? 0 : 1]; };
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

type Org = { id: string; name: string; kind: string };
export type OverviewSite = { id: string; name: string; sector: string; timezone: string; zones: number; rooms: number; providers: { id: string; name: string }[]; controllers: { membership_id: string; name: string }[] };

export function useOverview(org: Org | undefined, enabled: boolean) {
  const [sites, setSites] = useState<OverviewSite[]>([]), [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!org || !enabled) return;
    let active = true; setState('loading');
    api('organization/overview', undefined, org.id).then(r => { if (active) { setSites(r.sites); setState('ready'); } }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [org?.id, enabled, attempt]);
  return { sites, state, reload: () => setAttempt(n => n + 1) };
}

export function ClientDashboard({ org, lang, teamCount, onNavigate }: { org: Org; lang: Lang; teamCount: number | null; onNavigate: (s: 'sites' | 'providers' | 'team') => void }) {
  const t = lang === 'fr' ? fr : en;
  const { sites, state, reload } = useOverview(org, true);
  const providers = new Set(sites.flatMap(s => s.providers.map(p => p.id)));
  const controllers = new Set(sites.flatMap(s => s.controllers.map(c => c.membership_id)));
  const ready = state === 'ready', dash = '–';
  const stat = (value: number | string, label: string) => <div className="stat"><dt>{label}</dt><dd>{value}</dd></div>;
  return <section className="client-dashboard" aria-labelledby="client-dash-title">
    <h2 id="client-dash-title" className="sr-only">{lang === 'fr' ? 'Tableau de bord' : 'Dashboard'}</h2>
    <div className="toolbar"><p className="toolbar-text">{t.intro}</p>
      <div className="toolbar-actions"><button className="secondary" onClick={() => onNavigate('sites')}><SitesIcon />{t.openSites}</button><button className="primary" onClick={() => onNavigate('providers')}><SearchIcon />{t.findProvider}</button></div></div>
    <dl className="stats">
      {stat(ready ? sites.length : dash, t.sites)}
      {stat(ready ? sites.reduce((n, s) => n + s.zones, 0) : dash, t.places)}
      {stat(ready ? providers.size : dash, t.providers)}
      {stat(ready ? controllers.size : dash, t.controllers)}
    </dl>
    {state === 'error' && <div className="alert alert-error" role="alert"><AlertIcon /><div className="alert-body"><p>{t.loadError}</p><button className="secondary small" onClick={reload}>{t.retry}</button></div></div>}
    <div className="dashboard-grid">
      <section className="board" aria-labelledby="client-sites-title">
        <h3 id="client-sites-title" className="board-title">{t.bySite}</h3>
        {state === 'loading' ? <div className="skeleton" role="status"><span className="sr-only">{t.loading}</span><span className="skeleton-row" /><span className="skeleton-row" /></div>
          : ready && !sites.length ? <div className="empty"><span className="empty-icon" aria-hidden="true"><SitesIcon /></span><p>{t.noSite}</p></div>
          : <ul className="coverage">{sites.map(s => <li key={s.id} className="coverage-site">
              <p className="coverage-site-name"><span className="site-icon" aria-hidden="true"><SitesIcon /></span><strong>{s.name}</strong><span className="muted">{fill(t.placesOf, { n: s.zones, r: s.rooms })}</span></p>
              <dl className="site-facts">
                <div><dt>{t.providers}</dt><dd>{s.providers.length ? s.providers.map(p => <span key={p.id} className="agent-chip static"><Avatar name={p.name} seed={p.id} shape="square" size="sm" /><span>{p.name}</span></span>) : <span className="muted">{t.noProvider}</span>}</dd></div>
                <div><dt>{t.controllers}</dt><dd>{s.controllers.length ? s.controllers.map(c => <span key={c.membership_id} className="agent-chip static"><Avatar name={c.name} seed={c.membership_id} size="sm" /><span>{c.name}</span></span>) : <span className="muted">{t.noController}</span>}</dd></div>
              </dl>
            </li>)}</ul>}
      </section>
      <section className="board" aria-labelledby="interventions-title">
        <h3 id="interventions-title" className="board-title">{t.interventions}</h3>
        <div className="empty"><p>{t.interventionsText}</p></div>
        {teamCount !== null && <p className="board-note">{lang === 'fr' ? `${teamCount} personne(s) dans votre équipe.` : `${teamCount} person(s) in your team.`} <button className="link-button" onClick={() => onNavigate('team')}>{lang === 'fr' ? 'Voir l’équipe' : 'View team'}</button></p>}
      </section>
    </div>
  </section>;
}

type Provider = { id: string; name: string; city: string | null; phone: string | null; email: string | null; services: string | null; description: string | null; contact_name: string | null; site_ids: string[] };

export function Directory({ org, lang, admin, busy, setBusy }: { org: Org; lang: Lang; admin: boolean; busy: boolean; setBusy: (b: boolean) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [providers, setProviders] = useState<Provider[]>([]), [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'), [attempt, setAttempt] = useState(0);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]), [q, setQ] = useState(''), [open, setOpen] = useState(''), [siteId, setSiteId] = useState('');
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true; setState('loading');
    Promise.all([api('organization/directory', undefined, org.id), api('sites', undefined, org.id)])
      .then(([list, own]) => { if (active) { setProviders(list); setSites(own); setState('ready'); } }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [org.id, attempt]);
  const needle = q.trim().toLocaleLowerCase(lang);
  const visible = providers.filter(p => !needle || [p.name, p.city, p.services, p.description].filter(Boolean).join(' ').toLocaleLowerCase(lang).includes(needle));
  const siteName = (id: string) => sites.find(s => s.id === id)?.name;

  return <section className="directory" aria-labelledby="directory-title">
    <h2 id="directory-title" className="sr-only">{lang === 'fr' ? 'Prestataires' : 'Providers'}</h2>
    <p className="toolbar-text page-intro">{t.dirIntro}</p>
    <label className="location-search">{t.search}<span className="search-field"><SearchIcon /><input type="search" value={q} placeholder={t.searchHint} onChange={e => setQ(e.target.value)} /></span></label>
    {notice && <p className="alert alert-success" role="status"><CheckIcon />{notice}</p>}
    {state === 'loading' ? <div className="skeleton" role="status"><span className="sr-only">{t.loading}</span><span className="skeleton-row" /><span className="skeleton-row" /></div>
      : state === 'error' ? <div className="alert alert-error" role="alert"><AlertIcon /><div className="alert-body"><p>{t.dirLoadError}</p><button className="secondary small" onClick={() => setAttempt(n => n + 1)}>{t.retry}</button></div></div>
      : !providers.length ? <div className="empty"><p>{t.noProviders}</p></div>
      : !visible.length ? <div className="empty"><p>{t.noMatch}</p></div>
      : <ul className="provider-cards">{visible.map(p => {
          const free = sites.filter(s => !p.site_ids.includes(s.id));
          return <li key={p.id} className="provider-card">
            <div className="provider-head"><Avatar name={p.name} seed={p.id} shape="square" size="md" /><div className="people-text"><strong>{p.name}</strong><span className="muted">{[p.city, p.contact_name].filter(Boolean).join(' · ') || '—'}</span></div></div>
            {p.services && <p className="provider-services"><span className="muted">{t.services} : </span>{p.services}</p>}
            {p.description && <p className="provider-desc">{p.description}</p>}
            {(p.phone || p.email) && <p className="provider-contact"><span className="muted">{t.contact} : </span>{[p.phone, p.email].filter(Boolean).join(' · ')}</p>}
            <p className="provider-links">{p.site_ids.length ? <><span className="muted">{t.linkedTo} : </span>{p.site_ids.map(id => siteName(id)).filter(Boolean).join(', ')}</> : <span className="muted">{t.notLinked}</span>}</p>
            {open === p.id
              ? <form className="link-form" onSubmit={event => {
                  event.preventDefault();
                  const reason = String(new FormData(event.currentTarget).get('reason') ?? '');
                  setBusy(true); setError(''); setNotice('');
                  api(`sites/${siteId}/providers`, { providerId: p.id, ...(admin ? { reason } : {}) }, org.id)
                    .then(() => { setOpen(''); setNotice(t.linked); setAttempt(n => n + 1); }).catch(e => setError(say(e, lang))).finally(() => setBusy(false));
                }}>
                  {error && <div className="alert alert-error" role="alert"><AlertIcon /><p>{error}</p></div>}
                  <label>{t.site}<select aria-label={t.site} required value={siteId} onChange={e => setSiteId(e.target.value)}><option value="">{t.chooseSite}</option>{free.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
                  {admin && <label>{t.reason}<input name="reason" required maxLength={500} aria-describedby={`reason-${p.id}`} /><small id={`reason-${p.id}`}>{t.reasonHelp}</small></label>}
                  <div className="toolbar-actions"><button type="button" className="secondary" disabled={busy} onClick={() => setOpen('')}>{t.cancel}</button><button className="primary" disabled={busy || !siteId}><LinkIcon />{t.confirmLink}</button></div>
                </form>
              : free.length ? <div><button className="secondary small" disabled={busy || !sites.length} onClick={() => { setOpen(p.id); setSiteId(''); setError(''); setNotice(''); }}><LinkIcon />{t.link}</button></div>
              : sites.length ? <p className="muted">{t.allLinked}</p> : null}
          </li>;
        })}</ul>}
  </section>;
}

/** Drawer: which of the client's sites a controller may see and review. */
export function ControllerPanel({ org, member, lang, admin, busy, setBusy, headingRef, onClose }: {
  org: Org; member: { membership_id: string; display_name: string }; lang: Lang; admin: boolean; busy: boolean; setBusy: (b: boolean) => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>; onClose: () => void;
}) {
  const t = lang === 'fr' ? fr : en;
  const { sites, state, reload } = useOverview(org, true);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [reason, setReason] = useState('');
  const granted = (s: OverviewSite) => s.controllers.some(c => c.membership_id === member.membership_id);
  return <div className="panel member-panel">
    <div className="panel-head"><h2 ref={headingRef} tabIndex={-1}>{member.display_name}</h2>
      <button type="button" className="icon-button" aria-label={t.close} disabled={busy} onClick={onClose}><CloseIcon /></button></div>
    <div className="panel-body">
      <section className="panel-section" aria-labelledby="access-title">
        <h3 id="access-title">{t.access}</h3>
        <p className="panel-desc">{t.accessHelp}</p>
        {error && <div className="alert alert-error" role="alert"><AlertIcon /><p>{error}</p></div>}
        {notice && <p className="alert alert-success" role="status"><CheckIcon />{notice}</p>}
        {admin && <label>{t.reason}<input value={reason} maxLength={500} onChange={e => setReason(e.target.value)} aria-describedby="grant-reason-help" /><small id="grant-reason-help">{t.reasonHelp}</small></label>}
        {state === 'loading' ? <div className="skeleton" role="status"><span className="sr-only">{t.loading}</span><span className="skeleton-row" /></div>
          : state === 'error' ? <div className="alert alert-error" role="alert"><AlertIcon /><div className="alert-body"><p>{t.loadError}</p><button className="secondary small" onClick={reload}>{t.retry}</button></div></div>
          : !sites.length ? <p className="board-note">{t.noSite}</p>
          : <ul className="checks">{sites.map(s => <li key={s.id}><label className="check"><input type="checkbox" checked={granted(s)} disabled={busy || (admin && !reason.trim())}
              onChange={e => {
                setBusy(true); setError(''); setNotice('');
                api(`sites/${s.id}/controllers${e.target.checked ? '' : '/remove'}`, { membershipId: member.membership_id, ...(admin ? { reason } : {}) }, org.id)
                  .then(() => { setNotice(t.saved); reload(); }).catch(err => setError(say(err, lang))).finally(() => setBusy(false));
              }} /><span><strong>{s.name}</strong><span className="muted">{fill(t.placesOf, { n: s.zones, r: s.rooms })}</span></span></label></li>)}</ul>}
      </section>
    </div>
  </div>;
}
