import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/source-sans-3/wght.css';
import '@fontsource-variable/source-code-pro/wght.css';
import './style.css';
import { api, ApiError } from './api';
import { Sites } from './sites';
import { Dashboard } from './dashboard';
import { dictionaries, messageFor, type Dict, type Lang } from './i18n';
import { Avatar } from './avatar';
import { AlertIcon, BackIcon, CheckIcon, CloseIcon, CompanyIcon, CopyIcon, CalendarIcon, ClipboardIcon, DashboardIcon, GlobeIcon, HandshakeIcon, LinkIcon, LogIcon, LogoutIcon, PanelIcon, PlusIcon, SitesIcon, TeamIcon, UserIcon, UserPlusIcon } from './icons';
import { Company, MemberPanel, isAgent, placeLabel, type Assignment, type Member, type Org } from './provider';
import { AuditLog, Profile } from './admin';
import { PlatformOverview } from './platform';
import { ControllerPanel, Directory } from './client';
import { InterventionDetail, InterventionsPage, Planning, WorkOverview, type Ctx } from './interventions';
import { PageHead, Skeleton } from './ui';
import type { Step } from './metrics';

type User = { id: string; login: string; display_name: string; admin: boolean; must_change_password: boolean; memberships: Org[] };
type Secret = { kind: 'invite' | 'agent'; value: string; login?: string };
type Section = 'overview' | 'dashboard' | 'planning' | 'interventions' | 'team' | 'sites' | 'providers' | 'company' | 'audit' | 'profile';
type LoadState = 'loading' | 'ready' | 'error';

const Brand = () => <a className="brand" href="/" aria-label="TRACEOPS">TRACE<span>OPS</span><span className="brand-dot" /></a>;

function LanguageSelect({ lang, setLang, t }: { lang: Lang; setLang: (l: Lang) => void; t: Dict }) {
  return <label className="language">
    <span className="sr-only">{t.language}</span>
    <select aria-label={t.language} value={lang} onChange={e => setLang(e.target.value as Lang)}>
      <option value="fr">Français</option>
      <option value="en">English</option>
    </select>
  </label>;
}

function Field({ name, label, type = 'text', minLength }: { name: string; label: string; type?: string; minLength?: number }) {
  const autoComplete = name === 'login' ? 'username'
    : name === 'currentPassword' || name === 'password' ? 'current-password'
    : name === 'newPassword' ? 'new-password' : 'off';
  return <label>{label}<input name={name} type={type} required minLength={minLength} maxLength={type === 'password' ? 1024 : 120} autoComplete={autoComplete} /></label>;
}

/** The chain of custody as the sign-in page explains it: what TRACEOPS records, step by step. */
function AuthChain({ lang }: { lang: Lang }) {
  const rows = lang === 'fr'
    ? [['Demandé par', 'le client, qui crée l’intervention'], ['Affecté par', 'le prestataire, qui désigne l’équipe'], ['Réalisé par', 'l’agent, tâche par tâche, photos à l’appui'], ['Contrôlé par', 'le client, qui accepte ou demande une reprise']]
    : [['Requested by', 'the client, who creates the intervention'], ['Assigned by', 'the provider, who names the team'], ['Done by', 'the agent, task by task, with photos'], ['Reviewed by', 'the client, who accepts or asks for rework']];
  return <ol className="auth-chain">{rows.map(([step, who], n) => <li key={step}><span className="visa-n">{n + 1}</span><strong>{step}</strong><span>{who}</span></li>)}</ol>;
}

function App() {
  const [lang, setLang] = useState<Lang>(() => localStorage.getItem('traceops-language') === 'en' ? 'en' : 'fr');
  const t = dictionaries[lang];
  const [user, setUser] = useState<User | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]), [orgId, setOrgId] = useState('');
  const [members, setMembers] = useState<Member[]>([]), [membersLoading, setMembersLoading] = useState(false), [membersError, setMembersError] = useState('');
  const orgRef = useRef(orgId); orgRef.current = orgId;
  const [form, setForm] = useState<'org' | 'agent' | 'invite' | null>(null), [secret, setSecret] = useState<Secret | null>(null), [copied, setCopied] = useState(false);
  const [section, setSection] = useState<Section>('dashboard'), [openId, setOpenId] = useState<string | null>(null), [step, setStep] = useState<Step | null>(null), [intent, setIntent] = useState<'maintenance' | null>(null);
  // Provider workspace: agent assignments, and the agent whose drawer is open.
  const [assignments, setAssignments] = useState<Assignment[]>([]), [assignmentsState, setAssignmentsState] = useState<LoadState>('loading');
  const [manageId, setManageId] = useState<string | null>(null);
  // Desktop sidebar can shrink to an icon rail; the choice is remembered on this device.
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('traceops-sidebar') === 'collapsed'; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem('traceops-sidebar', collapsed ? 'collapsed' : 'open'); } catch { /* storage unavailable */ } }, [collapsed]);
  // Phone only: with several organisations, the list of organisations is its own screen.
  const [mobileView, setMobileView] = useState<'orgs' | 'org'>('org');
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const [token, setToken] = useState(() => new URLSearchParams(location.hash.slice(1)).get('invite') ?? '');

  useEffect(() => { document.documentElement.lang = lang; localStorage.setItem('traceops-language', lang); }, [lang]);
  // An opened form or secret takes the reading focus (below 1280px it replaces the list).
  useEffect(() => { if (form || secret || manageId) detailHeading.current?.focus(); }, [form, secret, manageId]);

  const landed = useRef('');
  async function refresh() {
    setLoading(true); setError('');
    try {
      const me = await api('auth/me') as User;
      // The administrator lands on the whole platform, not on one organization (once per sign-in).
      if (landed.current !== me.id && !me.must_change_password) { landed.current = me.id; if (me.admin) setSection('overview'); }
      setUser(me);
      const list = me.admin && !me.must_change_password ? await api('admin/organizations') : me.memberships;
      setOrgs(list);
      setOrgId(prev => list.some((o: Org) => o.id === prev) ? prev : list[0]?.id ?? '');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SESSION_REQUIRED') { setUser(null); setOrgs([]); }
      else setError(e instanceof ApiError ? e.code : 'error');
    } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);

  const org = orgs.find(o => o.id === orgId);
  const manager = Boolean(user?.admin || org?.roles?.some(r => r === 'CLIENT_MANAGER' || r === 'PROVIDER_MANAGER'));
  const canSeeSections = Boolean(org && (manager || org.roles?.includes('CLIENT_CONTROLLER')));
  const providerManager = Boolean(org && org.kind === 'PROVIDER' && manager);

  async function reloadAssignments() {
    const target = orgId; if (!target || !providerManager) return;
    try { const data = await api('organization/assignments', undefined, target); if (orgRef.current === target) { setAssignments(data); setAssignmentsState('ready'); } }
    catch { if (orgRef.current === target) setAssignmentsState('error'); }
  }
  useEffect(() => {
    let stale = false;
    setAssignments([]); setManageId(null); setAssignmentsState('loading');
    if (orgId && providerManager && !user?.must_change_password) {
      api('organization/assignments', undefined, orgId)
        .then(data => { if (!stale) { setAssignments(data); setAssignmentsState('ready'); } })
        .catch(() => { if (!stale) setAssignmentsState('error'); });
    }
    return () => { stale = true; };
  }, [orgId, providerManager, user?.must_change_password]);

  async function reloadMembers() {
    const target = orgId; if (!target || !manager) return;
    setMembersLoading(true); setMembersError('');
    try { const data = await api('organization/members', undefined, target); if (orgRef.current === target) setMembers(data); }
    catch (e) { if (orgRef.current === target) setMembersError(e instanceof ApiError ? e.code : 'error'); }
    finally { if (orgRef.current === target) setMembersLoading(false); }
  }
  useEffect(() => {
    let stale = false;
    setMembers([]); setMembersError(''); setForm(null); setSecret(null); setError('');
    if (orgId && manager && !user?.must_change_password) {
      setMembersLoading(true);
      api('organization/members', undefined, orgId)
        .then(data => { if (!stale) setMembers(data); })
        .catch(e => { if (!stale) setMembersError(e.code ?? 'error'); })
        .finally(() => { if (!stale) setMembersLoading(false); });
    }
    return () => { stale = true; };
  }, [orgId, manager, user?.must_change_password]);

  async function act(work: () => Promise<void>) {
    setBusy(true); setError('');
    try { await work(); } catch (e) { setError(e instanceof ApiError ? e.code : 'error'); } finally { setBusy(false); }
  }
  const fields = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); return Object.fromEntries(new FormData(event.currentTarget)); };
  const errorBox = error ? <div className="alert alert-error" role="alert"><AlertIcon /><p>{messageFor(t, error)}</p></div> : null;
  const language = <LanguageSelect lang={lang} setLang={setLang} t={t} />;

  if (loading) return <main className="loading" role="status"><Brand /><p><span className="spinner" aria-hidden="true" />{t.loading}</p></main>;

  if (!user || user.must_change_password || token) {
    const title = token ? t.join : user ? t.changeTitle : t.welcome;
    const text = token ? t.joinHelp : user ? t.changeText : t.intro;
    return <div className="auth">
      <aside className="auth-side">
        <Brand />
        <div className="auth-pitch">
          <p className="auth-claim">{lang === 'fr' ? 'Chaque intervention, signée à chaque étape.' : 'Every intervention, signed at every step.'}</p>
          <AuthChain lang={lang} />
        </div>
        <p className="auth-foot">TRACEOPS · {t.accountsOnly}</p>
      </aside>
      <main className="auth-main">
        <header className="auth-top"><span className="auth-brand-mobile"><Brand /></span>{language}</header>
        <section className="auth-card" aria-labelledby="auth-title">
          <h1 id="auth-title">{title}</h1>
          <p className="auth-lead">{text}</p>
          {errorBox}
          <form onSubmit={event => {
            const data = fields(event);
            void act(async () => {
              if (token) { await api('auth/accept', { ...data, token }); setToken(''); history.replaceState(null, '', location.pathname); }
              else if (user) await api('auth/password', data);
              else await api('auth/login', data);
              setSection('dashboard'); await refresh();
            });
          }}>
            {token && <Field name="displayName" label={t.displayName} />}
            {!user || token
              ? <><Field name="login" label={t.login} /><Field name="password" label={t.password} type="password" minLength={token ? 8 : undefined} /></>
              : <><Field name="currentPassword" label={t.currentPassword} type="password" /><Field name="newPassword" label={t.newPassword} type="password" minLength={8} /></>}
            {(token || user) && <small>{t.passwordHelp}</small>}
            <button className="primary wide" disabled={busy}>{busy ? t.loading : token ? t.accept : user ? t.savePassword : t.signIn}</button>
          </form>
          {user && <button className="link-button auth-logout" disabled={busy} onClick={() => void act(async () => { await api('auth/logout', {}); setSecret(null); setUser(null); })}>{t.logout}</button>}
        </section>
      </main>
    </div>;
  }

  const kindLabel = (o: Org) => o.kind === 'CLIENT' ? t.client : t.provider;
  const roleLabel = (r: string) => r === 'FIELD_AGENT' ? t.agent : r === 'CLIENT_CONTROLLER' ? t.controller : t.manager;
  const rolesOf = (o: Org) => o.roles?.length ? o.roles.map(roleLabel).join(', ') : '';
  const signOut = () => void act(async () => { await api('auth/logout', {}); setUser(null); setSecret(null); setOrgs([]); setMembers([]); setSection('dashboard'); landed.current = ''; });
  const multiOrg = orgs.length > 1;
  // Phone screen: the organisations list, or the active organisation. An admin without any organisation starts on the list, where it can create one.
  const phoneView = multiOrg ? mobileView : 'org';
  const chooseOrg = (id: string) => { setOrgId(id); setSection('dashboard'); setOpenId(null); setStep(null); setMobileView('org'); };
  const membersCounted = manager && !membersLoading && !membersError;
  // Organisations of both kinds are grouped under Clients / Prestataires; the group then names the kind.
  const groups = (['CLIENT', 'PROVIDER'] as const).map(kind => ({ kind, items: orgs.filter(o => o.kind === kind) })).filter(group => group.items.length);
  const grouped = groups.length > 1;
  const itemMeta = (o: Org) => grouped ? rolesOf(o) : [kindLabel(o), rolesOf(o)].filter(Boolean).join(' · ');
  const roleLine = org ? (rolesOf(org) || (user.admin ? t.adminAccess : '')) : '';
  const ctx: Ctx = { subtitle: org ? [org.name, kindLabel(org), roleLine].filter(Boolean).join(' · ') : user.admin ? t.adminAccess : t.noContext, userName: user.display_name };
  const clientManager = Boolean(org && org.kind === 'CLIENT' && manager);
  const canManage = (m: Member) => (providerManager && isAgent(m)) || (clientManager && m.roles.includes('CLIENT_CONTROLLER') && m.active);
  const managed = manageId ? members.find(m => m.membership_id === manageId) : undefined;
  const panelOpen = Boolean(form || secret || managed);
  const closeForm = () => setForm(null);
  const openForm = (next: 'agent' | 'invite') => { setForm(next); setSecret(null); setManageId(null); };
  const openManage = (m: Member) => { setManageId(m.membership_id); setForm(null); setSecret(null); };
  const assignmentsOf = (m: Member) => assignments.filter(a => a.membership_id === m.membership_id);

  // Right-hand drawer of the team workspace: a one-time secret or an open form.
  const teamPanel = secret
    ? <div className="panel panel-secret" aria-live="polite">
        <div className="panel-head">
          <span className="panel-status" aria-hidden="true"><CheckIcon /></span>
          <h2 ref={detailHeading} tabIndex={-1}>{secret.kind === 'invite' ? t.inviteReady : t.agentReady}</h2>
        </div>
        <div className="panel-body">
          <p className="panel-desc">{secret.kind === 'invite' ? t.inviteHelp : t.agentHelp}</p>
          {secret.login && <p className="secret-login"><span>{t.login}</span><code>{secret.login}</code></p>}
          <label className="secret-field">{secret.kind === 'invite' ? t.inviteLink : t.temporary}<textarea readOnly rows={secret.kind === 'invite' ? 3 : 1} value={secret.value} /></label>
        </div>
        <div className="panel-foot">
          <button className="secondary" onClick={() => void act(async () => { await navigator.clipboard.writeText(secret.value); setCopied(true); })}>{copied ? <CheckIcon /> : <CopyIcon />}{copied ? t.copied : t.copy}</button>
          <button className="primary" onClick={() => { setSecret(null); setCopied(false); }}>{t.done}</button>
        </div>
      </div>
    : form
      ? <div className="panel">
          <div className="panel-head">
            <h2 ref={detailHeading} tabIndex={-1}>{form === 'org' ? t.createOrg : form === 'agent' ? t.addAgent : t.invite}</h2>
            <button type="button" className="icon-button" aria-label={t.close} disabled={busy} onClick={closeForm}><CloseIcon /></button>
          </div>
          <form key={form + orgId} className="panel-form" onSubmit={event => {
            const data = fields(event);
            void act(async () => {
              if (form === 'org') { const result = await api('admin/organizations', data); await refresh(); setOrgId(result.id); setMobileView('org'); }
              else if (form === 'agent') { const r = await api('organization/agents', data, orgId); setSecret({ kind: 'agent', value: r.temporaryPassword, login: r.login }); await reloadMembers(); }
              else { const r = await api('organization/invitations', data, orgId); setSecret({ kind: 'invite', value: location.origin + '/#invite=' + r.token }); }
              setCopied(false); setForm(null);
            });
          }}>
            <div className="panel-body">
              {form !== 'org' && <p className="panel-desc">{form === 'agent' ? t.addAgentHelp : org?.kind === 'CLIENT' ? t.inviteHelpClient : t.inviteHelpProvider}</p>}
              {form === 'org'
                ? <><Field name="name" label={t.name} /><label>{t.kind}<select aria-label={t.kind} name="kind"><option value="CLIENT">{t.client}</option><option value="PROVIDER">{t.provider}</option></select></label></>
                : form === 'agent'
                  ? <><Field name="displayName" label={t.displayName} /><Field name="login" label={t.login} /></>
                  : <label>{t.role}<select aria-label={t.role} name="role">
                      <option value={org?.kind === 'CLIENT' ? 'CLIENT_MANAGER' : 'PROVIDER_MANAGER'}>{t.manager}</option>
                      {org?.kind === 'CLIENT' && <option value="CLIENT_CONTROLLER">{t.controller}</option>}
                    </select></label>}
            </div>
            <div className="panel-foot">
              <button type="button" className="secondary" disabled={busy} onClick={closeForm}>{t.cancel}</button>
              <button className="primary" disabled={busy}>{busy ? t.loading : t.create}</button>
            </div>
          </form>
        </div>
      : managed && org && org.kind === 'CLIENT'
        ? <ControllerPanel key={managed.membership_id} org={org} member={managed} lang={lang} admin={user.admin} busy={busy} setBusy={setBusy} headingRef={detailHeading} onClose={() => setManageId(null)} />
      : managed && org
        ? <MemberPanel key={managed.membership_id} org={org} member={managed} assignments={assignments} t={t} lang={lang} busy={busy} setBusy={setBusy}
            headingRef={detailHeading} onClose={() => setManageId(null)} onChanged={async () => { await Promise.all([reloadMembers(), reloadAssignments()]); }} />
        : null;

  // Team actions sit above the list; the one strong action yields to the drawer's own while it is open.
  const teamActions = org && manager && <div className="toolbar-actions">
    {org.kind === 'PROVIDER' && <button className="secondary" disabled={busy} onClick={() => openForm('invite')}><LinkIcon />{t.invite}</button>}
    {org.kind === 'PROVIDER'
      ? <button className={panelOpen ? 'secondary' : 'primary'} disabled={busy} onClick={() => openForm('agent')}><UserPlusIcon />{t.addAgent}</button>
      : <button className={panelOpen ? 'secondary' : 'primary'} disabled={busy} onClick={() => openForm('invite')}><LinkIcon />{t.invite}</button>}
  </div>;

  // Sidebar menu: the active organisation's sections, then the platform-wide pages.
  const go = (item: Section) => { setSection(item); setOpenId(null); setStep(null); setIntent(null); setForm(null); setSecret(null); setManageId(null); setError(''); };
  const openIntervention = (id: string) => { go('interventions'); setOpenId(id); };
  // Every page of the organisation is its own tab, side by side: no folded group, no sub-menu.
  const agentOnly = Boolean(org && !user.admin && org.kind === 'PROVIDER' && org.roles?.length && org.roles.every(r => r === 'FIELD_AGENT'));
  const orgItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: agentOnly ? t.missionsNav : t.dashboard, icon: <DashboardIcon /> },
    ...(org ? [{ id: 'planning' as Section, label: t.planningNav, icon: <CalendarIcon /> }, { id: 'interventions' as Section, label: t.interventionsNav, icon: <ClipboardIcon /> }] : []),
    ...(canSeeSections ? [{ id: 'sites' as Section, label: t.sites, icon: <SitesIcon /> }, { id: 'team' as Section, label: t.team, icon: <TeamIcon /> }] : []),
    ...(clientManager ? [{ id: 'providers' as Section, label: t.providersNav, icon: <HandshakeIcon /> }] : []),
    ...(org ? [{ id: 'company' as Section, label: t.company, icon: <CompanyIcon /> }] : []),
  ];
  // Platform pages exist for the administrator only; "Mon profil" is the account block at the foot of the sidebar.
  const globalItems: { id: Section; label: string; icon: React.ReactNode }[] = user.admin
    ? [{ id: 'overview', label: t.overviewNav, icon: <GlobeIcon /> }, { id: 'audit', label: t.auditNav, icon: <LogIcon /> }] : [];
  function navButton(item: { id: Section; label: string; icon: React.ReactNode }) { return <li key={item.id}>
    <button className="nav-item" aria-current={section === item.id ? 'page' : undefined} title={collapsed ? item.label : undefined} disabled={busy} onClick={() => go(item.id)}>
      {item.icon}<span className="nav-text">{item.label}</span>
      {item.id === 'team' && manager && <span className={membersCounted ? 'count' : 'count count-pending'} aria-hidden="true">{membersCounted ? members.length : '–'}</span>}
    </button>
  </li>; }
  // The administrator picks an organisation in the list below; its pages then appear here, named after it.
  const orgSection = user.admin && !['overview', 'audit', 'profile'].includes(section);
  const ownHead = (section === 'overview' && user.admin) || (org && ['dashboard', 'planning', 'interventions'].includes(section));
  const pageTitle = section === 'overview' ? t.overviewNav : section === 'audit' ? t.auditNav : section === 'profile' ? t.profileNav : section === 'team' ? t.team
    : section === 'sites' ? t.sites : section === 'providers' ? t.providersNav : section === 'company' ? t.company : t.dashboard;
  const pageCells = section === 'team' && org && manager ? [{ label: t.team, value: membersCounted ? String(members.length) : '–' }] : [];
  const platformPage = ['overview', 'audit', 'profile'].includes(section);

  return <div className="app" data-view={phoneView} data-collapsed={collapsed ? 'true' : undefined}>
    <aside className="sidebar">
      <div className="sidebar-top"><Brand />
        <button type="button" className="icon-button collapse-toggle" aria-label={collapsed ? t.expandMenu : t.collapseMenu} title={collapsed ? t.expandMenu : t.collapseMenu} aria-expanded={!collapsed} onClick={() => setCollapsed(c => !c)}><PanelIcon /></button>
      </div>
      {/* Between the brand and the account, everything scrolls as one column: nothing collapses on a short screen. */}
      <div className="sidebar-scroll">
      {org && <div className="sidebar-org" title={org.name}>
        <Avatar name={org.name} seed={org.id} shape="square" size="sm" />
        <span className="sidebar-org-text"><strong>{org.name}</strong><span>{[kindLabel(org), roleLine].filter(Boolean).join(' · ')}</span></span>
      </div>}
      <nav className="section-nav" aria-label={t.sections}>
        {user.admin && org && <p className="nav-label nav-org-label" title={org.name}>{org.name}</p>}
        <ul className="nav-list">{orgItems.map(navButton)}</ul>
        {globalItems.length > 0 && <><p className="nav-label nav-divider">{t.platformNav}</p><ul className="nav-list">{globalItems.map(navButton)}</ul></>}
        {/* On a phone the account block shows only the language and sign-out, so the profile joins the tabs there. */}
        <ul className="nav-list nav-phone-only">{navButton({ id: 'profile', label: t.profileNav, icon: <UserIcon /> })}</ul>
      </nav>
      {(user.admin || multiOrg) && <nav className="org-nav" aria-labelledby="org-nav-title">
        <p className={grouped ? 'nav-label sr-only' : 'nav-label'} id="org-nav-title">{t.orgs}</p>
        {orgs.length
          ? <div className="org-groups">{groups.map(group => <div className="org-group" key={group.kind}>
              {grouped && <p className="nav-label" id={`org-group-${group.kind}`}>{group.kind === 'CLIENT' ? t.clients : t.providers}</p>}
              <ul className="org-list" aria-labelledby={grouped ? `org-group-${group.kind}` : undefined}>{group.items.map(o => <li key={o.id}>
                <button className="org-item" title={o.name} aria-current={o.id === orgId && (orgSection || !user.admin) ? 'true' : undefined} disabled={busy} onClick={() => chooseOrg(o.id)}>
                  <Avatar name={o.name} seed={o.id} shape="square" size="sm" />
                  <span className="org-item-text"><span className="org-item-name">{o.name}</span>{itemMeta(o) && <span className="org-item-meta">{itemMeta(o)}</span>}</span>
                </button>
              </li>)}</ul>
            </div>)}</div>
          : <p className="org-nav-empty">{user.admin ? t.emptyOrg : t.noContext}</p>}
        {user.admin && <button className="nav-action" disabled={busy} onClick={() => { setSection('team'); setForm('org'); setSecret(null); setMobileView('org'); }}><PlusIcon />{t.createOrg}</button>}
      </nav>}
      </div>
      <div className="account">
        {/* The account block is the "Mon profil" tab: the person, then where the click leads. */}
        <button type="button" className="identity" aria-current={section === 'profile' ? 'page' : undefined} title={collapsed ? `${t.profileNav} · ${user.display_name}` : user.display_name} disabled={busy} onClick={() => go('profile')}>
          <Avatar name={user.display_name} seed={user.id} />
          <span className="identity-text"><span className="identity-name">{user.display_name}</span><span className="identity-role">{t.profileNav}{user.admin ? ` · ${t.admin}` : ''}</span></span>
        </button>
        <div className="account-controls">
          {language}
          <button className="logout" title={t.logout} onClick={signOut} disabled={busy}><LogoutIcon /><span>{t.logout}</span></button>
        </div>
      </div>
    </aside>

    <main className="content">
      <div className="content-inner">
        {multiOrg && <button className="back-link orgs-back" disabled={busy} onClick={() => setMobileView('orgs')}><BackIcon />{t.orgs}</button>}
        {!ownHead && <PageHead title={pageTitle} subtitle={platformPage ? (user.admin ? t.adminAccess : user.display_name) : ctx.subtitle} cells={pageCells} actions={section === 'team' ? teamActions : undefined} />}
        {errorBox}

        {section === 'overview' && user.admin
          ? <PlatformOverview lang={lang} userName={user.display_name} onOpenOrg={id => chooseOrg(id)} onOpenLog={() => go('audit')} />
        : section === 'audit' && user.admin
          ? <AuditLog lang={lang} orgs={orgs} />
        : section === 'profile'
          ? <Profile lang={lang} user={user} roleLabel={roleLabel} kindLabel={k => k === 'CLIENT' ? t.client : t.provider} busy={busy} setBusy={setBusy} onSaved={name => setUser(u => u && { ...u, display_name: name })} />
        : section === 'providers' && org && clientManager
          ? <Directory key={orgId} org={org} lang={lang} admin={user.admin} busy={busy} setBusy={setBusy} />
        : section === 'dashboard' && org
          ? <WorkOverview key={orgId} org={org} lang={lang} admin={user.admin} ctx={ctx} onOpen={openIntervention} onNavigate={go} onStep={s => { go('interventions'); setStep(s); }} onNewRequest={() => { go('interventions'); setIntent('maintenance'); }} />
        : section === 'planning' && org
          ? <Planning key={orgId} org={org} lang={lang} ctx={ctx} onOpen={openIntervention} />
        : section === 'interventions' && org
          ? openId ? <InterventionDetail key={openId} org={org} id={openId} lang={lang} onBack={() => setOpenId(null)} /> : <InterventionsPage key={orgId + (step ?? '') + (intent ?? '')} org={org} lang={lang} admin={user.admin} ctx={ctx} initialStep={step} initialForm={intent} onOpen={setOpenId} />
        : section === 'company' && org
          ? <Company key={orgId} org={org} canEdit={manager} t={t} lang={lang} busy={busy} setBusy={setBusy} onRenamed={name => setOrgs(list => list.map(o => o.id === org.id ? { ...o, name } : o))} />
        : section === 'dashboard' ? <Dashboard org={org} admin={user.admin} lang={lang} orgCount={orgs.length} onNavigate={setSection} onCreateOrg={() => { setSection('team'); setForm('org'); setSecret(null); }} />
        : section === 'sites' && org && canSeeSections
          ? <Sites key={orgId} org={org} admin={user.admin} lang={lang} setBusy={setBusy} />
          : <div className={['workspace', 'workspace-team', panelOpen && 'has-panel', !org && 'no-list'].filter(Boolean).join(' ')} data-detail={panelOpen ? 'open' : 'closed'}>
              {org && (manager
                ? <section className="pane-list" aria-labelledby="team-title">
                    <h2 id="team-title" className="sr-only">{t.team}{membersCounted ? ` (${members.length})` : ''}</h2>
                    <p className="toolbar-text page-intro" title={t.teamIntro}>{t.teamIntro}</p>
                    {membersLoading
                      ? <Skeleton label={t.loading} />
                      : membersError
                        ? <div className="alert alert-error" role="alert"><AlertIcon /><div className="alert-body"><p>{membersError === 'error' ? t.membersLoadError : messageFor(t, membersError)}</p><button className="secondary small" onClick={() => void reloadMembers()}>{t.retry}</button></div></div>
                        : members.length
                          ? <div className="table-card">
                              <table className="members" role="table">
                                <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">{t.displayName}</th><th role="columnheader" scope="col" className="col-login">{t.login}</th><th role="columnheader" scope="col" className="col-role">{t.role}</th>
                                  {providerManager && <th role="columnheader" scope="col" className="col-places">{t.assignmentsCol}</th>}
                                  <th role="columnheader" scope="col" className="col-access">{t.access}</th>
                                  {(providerManager || clientManager) && <th role="columnheader" scope="col" className="col-actions"><span className="sr-only">{t.manage}</span></th>}</tr></thead>
                                <tbody role="rowgroup">{members.map(m => {
                                  // One line per fact; a long name or place ends in an ellipsis and stays whole on hover and in the drawer.
                                  const roles = m.roles.map(roleLabel).join(', '), places = assignmentsOf(m), first = places[0];
                                  return <tr role="row" key={m.id} className={[!m.active && 'is-suspended', m.membership_id === manageId && 'is-selected'].filter(Boolean).join(' ') || undefined}>
                                  <td role="cell" className="member-name"><span className="member-id"><Avatar name={m.display_name} seed={m.id} /><strong title={m.display_name}>{m.display_name}</strong></span></td>
                                  <td role="cell" data-label={t.login} className="member-login"><code title={m.login}>{m.login}</code></td>
                                  <td role="cell" data-label={t.role} className="member-role" title={roles}>{roles}</td>
                                  {providerManager && <td role="cell" data-label={t.assignmentsCol} className="member-places">{isAgent(m)
                                    ? first
                                      ? <span className="place-summary" title={places.map(a => `${a.site_name} › ${placeLabel(a)}`).join('\n')}>
                                          <span className="place-main"><span className="place-name">{first.name}</span>{places.length > 1 && <span className="place-more">{t.moreAssignments.replace('{n}', String(places.length - 1))}</span>}</span>
                                          <span className="place-where">{first.site_name}</span></span>
                                      : <span className="muted">{t.noAssignment}</span>
                                    : <span className="muted">—</span>}</td>}
                                  <td role="cell" data-label={t.access} className="member-access"><span className={m.active ? 'status status-on' : 'status status-off'}>{m.active ? t.active : t.disabled}</span></td>
                                  {(providerManager || clientManager) && <td role="cell" className="member-actions">{canManage(m) && <button className="secondary small" aria-label={`${t.manage} : ${m.display_name}`} disabled={busy} onClick={() => openManage(m)}>{t.manage}</button>}</td>}
                                </tr>; })}</tbody>
                              </table>
                            </div>
                          : <div className="empty"><span className="empty-icon" aria-hidden="true"><TeamIcon /></span><h3>{t.emptyTeam}</h3><p>{t.emptyTeamText}</p></div>}
                  </section>
                : <section className="pane-list"><div className="empty"><span className="empty-icon" aria-hidden="true"><TeamIcon /></span><h2>{t.agentView}</h2><p>{t.agentViewText}</p></div></section>)}
              {teamPanel && <aside className="pane-panel">{teamPanel}</aside>}
            </div>}
      </div>
    </main>
  </div>;
}

createRoot(document.getElementById('root')!).render(<App />);
