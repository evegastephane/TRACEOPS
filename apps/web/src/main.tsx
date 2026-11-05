import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/opsz.css';
import './style.css';
import { api, ApiError } from './api';
import { Sites } from './sites';
import { Dashboard } from './dashboard';
import { dictionaries, messageFor, type Dict, type Lang } from './i18n';
import { Avatar } from './avatar';
import { AlertIcon, BackIcon, CheckIcon, CloseIcon, CompanyIcon, CopyIcon, ChevronIcon, DashboardIcon, GlobeIcon, HandshakeIcon, LinkIcon, LogIcon, LogoutIcon, PanelIcon, PlusIcon, SitesIcon, TeamIcon, UserIcon, UserPlusIcon } from './icons';
import { Company, MemberPanel, ProviderDashboard, isAgent, placeLabel, type Assignment, type Member, type Org } from './provider';
import { AuditLog, Profile } from './admin';
import { PlatformOverview } from './platform';
import { ClientDashboard, ControllerPanel, Directory } from './client';

type User = { id: string; login: string; display_name: string; admin: boolean; must_change_password: boolean; memberships: Org[] };
type Secret = { kind: 'invite' | 'agent'; value: string; login?: string };
type Section = 'overview' | 'dashboard' | 'team' | 'sites' | 'providers' | 'company' | 'audit' | 'profile';
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

function App() {
  const [lang, setLang] = useState<Lang>(() => localStorage.getItem('traceops-language') === 'en' ? 'en' : 'fr');
  const t = dictionaries[lang];
  const [user, setUser] = useState<User | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]), [orgId, setOrgId] = useState('');
  const [members, setMembers] = useState<Member[]>([]), [membersLoading, setMembersLoading] = useState(false), [membersError, setMembersError] = useState('');
  const orgRef = useRef(orgId); orgRef.current = orgId;
  const [form, setForm] = useState<'org' | 'agent' | 'invite' | null>(null), [secret, setSecret] = useState<Secret | null>(null), [copied, setCopied] = useState(false);
  const [section, setSection] = useState<Section>('dashboard');
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

  async function refresh() {
    setLoading(true); setError('');
    try {
      const me = await api('auth/me') as User;
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
  // The administrator lands on the whole platform, not on one organization.
  useEffect(() => { if (user?.admin && !user.must_change_password) setSection(s => s === 'dashboard' ? 'overview' : s); }, [user?.id, user?.admin, user?.must_change_password]);

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
      <header className="auth-top"><Brand />{language}</header>
      <main className="auth-main">
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
      <footer className="auth-foot">TRACEOPS · {t.accountsOnly}</footer>
    </div>;
  }

  const kindLabel = (o: Org) => o.kind === 'CLIENT' ? t.client : t.provider;
  const roleLabel = (r: string) => r === 'FIELD_AGENT' ? t.agent : r === 'CLIENT_CONTROLLER' ? t.controller : t.manager;
  const rolesOf = (o: Org) => o.roles?.length ? o.roles.map(roleLabel).join(', ') : '';
  const signOut = () => void act(async () => { await api('auth/logout', {}); setUser(null); setSecret(null); setOrgs([]); setMembers([]); setSection('dashboard'); });
  const multiOrg = orgs.length > 1;
  // Phone screen: the organisations list, or the active organisation. An admin without any organisation starts on the list, where it can create one.
  const phoneView = multiOrg ? mobileView : 'org';
  const chooseOrg = (id: string) => { setOrgId(id); setSection('dashboard'); setMobileView('org'); };
  const membersCounted = manager && !membersLoading && !membersError;
  // Organisations of both kinds are grouped under Clients / Prestataires; the group then names the kind.
  const groups = (['CLIENT', 'PROVIDER'] as const).map(kind => ({ kind, items: orgs.filter(o => o.kind === kind) })).filter(group => group.items.length);
  const grouped = groups.length > 1;
  const itemMeta = (o: Org) => grouped ? rolesOf(o) : [kindLabel(o), rolesOf(o)].filter(Boolean).join(' · ');
  const roleLine = org && (rolesOf(org) ? `${t.yourRole} ${rolesOf(org)}` : user.admin ? t.adminAccess : '');
  const clientManager = Boolean(org && org.kind === 'CLIENT' && manager);
  const canManage = (m: Member) => (providerManager && isAgent(m)) || (clientManager && m.roles.includes('CLIENT_CONTROLLER') && m.active);
  const managed = manageId ? members.find(m => m.membership_id === manageId) : undefined;
  const panelOpen = Boolean(form || secret || managed);
  const closeForm = () => setForm(null);
  const openForm = (next: 'agent' | 'invite') => { setForm(next); setSecret(null); setManageId(null); };
  const openManage = (m: Member) => { setManageId(m.membership_id); setForm(null); setSecret(null); };
  const membersState: LoadState = membersLoading ? 'loading' : membersError ? 'error' : 'ready';
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

  // Team actions sit above the list; the one blue action yields to the drawer's own while it is open.
  const teamActions = org && manager && <div className="toolbar-actions">
    {org.kind === 'PROVIDER' && <button className="secondary" disabled={busy} onClick={() => openForm('invite')}><LinkIcon />{t.invite}</button>}
    {org.kind === 'PROVIDER'
      ? <button className={panelOpen ? 'secondary' : 'primary'} disabled={busy} onClick={() => openForm('agent')}><UserPlusIcon />{t.addAgent}</button>
      : <button className={panelOpen ? 'secondary' : 'primary'} disabled={busy} onClick={() => openForm('invite')}><LinkIcon />{t.invite}</button>}
  </div>;

  const skeleton = <div className="skeleton" role="status"><span className="sr-only">{t.loading}</span>{[0, 1, 2].map(i => <span key={i} className="skeleton-row" />)}</div>;

  // Sidebar menu: the active organisation's sections, then the platform-wide pages.
  const go = (item: Section) => { setSection(item); setForm(null); setSecret(null); setManageId(null); setError(''); };
  const orgItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t.dashboard, icon: <DashboardIcon /> },
    ...(canSeeSections ? [{ id: 'team' as Section, label: t.team, icon: <TeamIcon /> }, { id: 'sites' as Section, label: t.sites, icon: <SitesIcon /> }] : []),
    ...(clientManager ? [{ id: 'providers' as Section, label: t.providersNav, icon: <HandshakeIcon /> }] : []),
    ...(org ? [{ id: 'company' as Section, label: t.company, icon: <CompanyIcon /> }] : []),
  ];
  const globalItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    ...(user.admin ? [{ id: 'overview' as Section, label: t.overviewNav, icon: <GlobeIcon /> }, { id: 'audit' as Section, label: t.auditNav, icon: <LogIcon /> }] : []),
    { id: 'profile', label: t.profileNav, icon: <UserIcon /> },
  ];
  const navButton = (item: { id: Section; label: string; icon: React.ReactNode }) => <li key={item.id}>
    <button className="nav-item" aria-current={section === item.id ? 'page' : undefined} title={collapsed ? item.label : undefined} disabled={busy} onClick={() => go(item.id)}>
      {item.icon}<span className="nav-text">{item.label}</span>
      {item.id === 'team' && manager && <span className={membersCounted ? 'count' : 'count count-pending'} aria-hidden="true">{membersCounted ? members.length : '–'}</span>}
    </button>
  </li>;
  const orgSection = !['overview', 'audit', 'profile'].includes(section);
  const pageTitle = section === 'overview' ? t.overviewNav : section === 'audit' ? t.auditNav : section === 'profile' ? t.profileNav : null;

  return <div className="app" data-view={phoneView} data-collapsed={collapsed ? 'true' : undefined}>
    <aside className="sidebar">
      <div className="sidebar-top"><Brand />
        <button type="button" className="icon-button collapse-toggle" aria-label={collapsed ? t.expandMenu : t.collapseMenu} title={collapsed ? t.expandMenu : t.collapseMenu} aria-expanded={!collapsed} onClick={() => setCollapsed(c => !c)}><PanelIcon /></button>
      </div>
      <nav className="section-nav" aria-label={t.sections}>
        <ul className="nav-list nav-org-mobile">{orgItems.map(navButton)}</ul>
        <p className="nav-label nav-divider">{t.platformNav}</p>
        <ul className="nav-list">{globalItems.map(navButton)}</ul>
      </nav>
      <nav className="org-nav" aria-labelledby="org-nav-title">
        <p className={grouped ? 'nav-label sr-only' : 'nav-label'} id="org-nav-title">{t.orgs}</p>
        {orgs.length
          ? <div className="org-groups">{groups.map(group => <div className="org-group" key={group.kind}>
              {grouped && <p className="nav-label" id={`org-group-${group.kind}`}>{group.kind === 'CLIENT' ? t.clients : t.providers}</p>}
              <ul className="org-list" aria-labelledby={grouped ? `org-group-${group.kind}` : undefined}>{group.items.map(o => <li key={o.id}>
                <button className="org-item" title={o.name} aria-current={o.id === orgId && orgSection ? 'true' : undefined} aria-expanded={o.id === orgId && orgSection} disabled={busy} onClick={() => chooseOrg(o.id)}>
                  <Avatar name={o.name} seed={o.id} shape="square" size="sm" />
                  <span className="org-item-text"><span className="org-item-name">{o.name}</span>{itemMeta(o) && <span className="org-item-meta">{itemMeta(o)}</span>}</span>
                  <ChevronIcon />
                </button>
                {o.id === orgId && orgSection && <ul className="org-subnav" aria-label={o.name}>{orgItems.map(navButton)}</ul>}
              </li>)}</ul>
            </div>)}</div>
          : <p className="org-nav-empty">{user.admin ? t.emptyOrg : t.noContext}</p>}
        {user.admin && <button className="nav-action" disabled={busy} onClick={() => { setSection('team'); setForm('org'); setSecret(null); setMobileView('org'); }}><PlusIcon />{t.createOrg}</button>}
      </nav>
      <div className="account">
        <p className="identity">
          <Avatar name={user.display_name} seed={user.id} />
          <span className="identity-text"><span className="identity-name" title={user.display_name}>{user.display_name}</span><span className="identity-role" title={user.admin ? t.admin : user.login}>{user.admin ? t.admin : user.login}</span></span>
        </p>
        <div className="account-controls">
          {language}
          <button className="logout" title={t.logout} onClick={signOut} disabled={busy}><LogoutIcon /><span>{t.logout}</span></button>
        </div>
      </div>
    </aside>

    <main className="content">
      <div className="content-inner">
        {multiOrg && <button className="back-link orgs-back" disabled={busy} onClick={() => setMobileView('orgs')}><BackIcon />{t.orgs}</button>}
        {pageTitle
          ? <header className="page-header"><div className="page-title"><h1>{pageTitle}</h1></div></header>
          : <header className="page-header">
              {org && <Avatar name={org.name} seed={org.id} shape="square" size="lg" />}
              <div className="page-title">
                <h1>{org?.name ?? (user.admin ? t.orgs : t.noContext)}</h1>
                <p className="page-meta">{org ? <><span className="badge">{kindLabel(org)}</span>{roleLine && <span>{roleLine}</span>}</> : user.admin ? t.emptyOrgText : t.noContextText}</p>
              </div>
            </header>}
        {errorBox}

        {section === 'overview' && user.admin
          ? <PlatformOverview lang={lang} onOpenOrg={id => chooseOrg(id)} onOpenLog={() => go('audit')} />
        : section === 'audit' && user.admin
          ? <AuditLog lang={lang} orgs={orgs} />
        : section === 'profile'
          ? <Profile lang={lang} user={user} roleLabel={roleLabel} kindLabel={k => k === 'CLIENT' ? t.client : t.provider} busy={busy} setBusy={setBusy} onSaved={name => setUser(u => u && { ...u, display_name: name })} />
        : section === 'providers' && org && clientManager
          ? <Directory key={orgId} org={org} lang={lang} admin={user.admin} busy={busy} setBusy={setBusy} />
        : section === 'dashboard' && org && clientManager
          ? <ClientDashboard key={orgId} org={org} lang={lang} teamCount={membersCounted ? members.length : null} onNavigate={go} />
        : section === 'company' && org
          ? <Company key={orgId} org={org} canEdit={manager} t={t} lang={lang} busy={busy} setBusy={setBusy} onRenamed={name => setOrgs(list => list.map(o => o.id === org.id ? { ...o, name } : o))} />
        : section === 'dashboard' && org && providerManager
          ? <div className={['workspace', 'workspace-team', panelOpen && 'has-panel'].filter(Boolean).join(' ')} data-detail={panelOpen ? 'open' : 'closed'}>
              <ProviderDashboard org={org} members={members} membersState={membersState} assignments={assignments} assignmentsState={assignmentsState} t={t}
                actions={teamActions} onManage={openManage} retryMembers={() => void reloadMembers()} retryAssignments={() => void reloadAssignments()} />
              {teamPanel && <aside className="pane-panel">{teamPanel}</aside>}
            </div>
        : section === 'dashboard' ? <Dashboard org={org} admin={user.admin} lang={lang} orgCount={orgs.length} onNavigate={setSection} onCreateOrg={()=>{setSection('team');setForm('org');setSecret(null);}} /> : section === 'sites' && org && canSeeSections
          ? <Sites key={orgId} org={org} admin={user.admin} lang={lang} setBusy={setBusy} />
          : <div className={['workspace', 'workspace-team', panelOpen && 'has-panel', !org && 'no-list'].filter(Boolean).join(' ')} data-detail={panelOpen ? 'open' : 'closed'}>
              {org && (manager
                ? <section className="pane-list" aria-labelledby="team-title">
                    <h2 id="team-title" className="sr-only">{t.team}{membersCounted ? ` (${members.length})` : ''}</h2>
                    <div className="toolbar"><p className="toolbar-text" title={t.teamIntro}>{t.teamIntro}</p>{teamActions}</div>
                    {membersLoading
                      ? skeleton
                      : membersError
                        ? <div className="alert alert-error" role="alert"><AlertIcon /><div className="alert-body"><p>{membersError === 'error' ? t.membersLoadError : messageFor(t, membersError)}</p><button className="secondary small" onClick={() => void reloadMembers()}>{t.retry}</button></div></div>
                        : members.length
                          ? <div className="table-card">
                              <table className="members" role="table">
                                <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">{t.displayName}</th><th role="columnheader" scope="col">{t.login}</th><th role="columnheader" scope="col">{t.role}</th>
                                  {providerManager && <th role="columnheader" scope="col">{t.assignmentsCol}</th>}
                                  <th role="columnheader" scope="col">{t.access}</th>
                                  {(providerManager || clientManager) && <th role="columnheader" scope="col"><span className="sr-only">{t.manage}</span></th>}</tr></thead>
                                <tbody role="rowgroup">{members.map(m => <tr role="row" key={m.id} className={m.active ? undefined : 'is-suspended'}>
                                  <td role="cell" className="member-name"><span className="member-id"><Avatar name={m.display_name} seed={m.id} /><strong>{m.display_name}</strong></span></td>
                                  <td role="cell" data-label={t.login} className="member-login"><code>{m.login}</code></td>
                                  <td role="cell" data-label={t.role} className="member-role">{m.roles.map(roleLabel).join(', ')}</td>
                                  {providerManager && <td role="cell" data-label={t.assignmentsCol} className="member-places">{isAgent(m)
                                    ? assignmentsOf(m).length
                                      ? <span title={assignmentsOf(m).map(placeLabel).join('\n')}>{placeLabel(assignmentsOf(m)[0])}{assignmentsOf(m).length > 1 && <span className="more"> {t.moreAssignments.replace('{n}', String(assignmentsOf(m).length - 1))}</span>}</span>
                                      : <span className="muted">{t.noAssignment}</span>
                                    : <span className="muted">—</span>}</td>}
                                  <td role="cell" data-label={t.access} className="member-access"><span className={m.active ? 'status status-on' : 'status status-off'}>{m.active ? t.active : t.disabled}</span></td>
                                  {(providerManager || clientManager) && <td role="cell" className="member-actions">{canManage(m) && <button className="secondary small" aria-label={`${t.manage} : ${m.display_name}`} disabled={busy} onClick={() => openManage(m)}>{t.manage}</button>}</td>}
                                </tr>)}</tbody>
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
