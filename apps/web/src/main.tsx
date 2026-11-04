import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import './style.css';
import { api, ApiError } from './api';
import { Sites } from './sites';
import { dictionaries, messageFor, type Dict, type Lang } from './i18n';
import { Cloth, SampleStrip, Selvedge, orgStyle } from './motif';
import { BackIcon, CopyIcon, LogoutIcon, PlusIcon, SitesIcon, TeamIcon } from './icons';

type Org = { id: string; name: string; kind: 'CLIENT' | 'PROVIDER'; roles?: string[] };
type User = { id: string; login: string; display_name: string; admin: boolean; must_change_password: boolean; memberships: Org[] };
type Member = { id: string; display_name: string; login: string; roles: string[]; active: boolean };
type Secret = { kind: 'invite' | 'agent'; value: string; login?: string };
type Section = 'team' | 'sites';

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

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toLocaleUpperCase()).join('');

function App() {
  const [lang, setLang] = useState<Lang>(() => localStorage.getItem('traceops-language') === 'en' ? 'en' : 'fr');
  const t = dictionaries[lang];
  const [user, setUser] = useState<User | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]), [orgId, setOrgId] = useState('');
  const [members, setMembers] = useState<Member[]>([]), [membersLoading, setMembersLoading] = useState(false), [membersError, setMembersError] = useState('');
  const orgRef = useRef(orgId); orgRef.current = orgId;
  const [form, setForm] = useState<'org' | 'agent' | 'invite' | null>(null), [secret, setSecret] = useState<Secret | null>(null), [copied, setCopied] = useState(false);
  const [section, setSection] = useState<Section>('team');
  // Phone only: with several organisations, the list of organisations is its own screen.
  const [mobileView, setMobileView] = useState<'orgs' | 'org'>('orgs');
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const [token, setToken] = useState(() => new URLSearchParams(location.hash.slice(1)).get('invite') ?? '');

  useEffect(() => { document.documentElement.lang = lang; localStorage.setItem('traceops-language', lang); }, [lang]);
  // An opened form or secret takes the reading focus (on a phone it replaces the list).
  useEffect(() => { if (form || secret) detailHeading.current?.focus(); }, [form, secret]);

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

  const org = orgs.find(o => o.id === orgId);
  const manager = Boolean(user?.admin || org?.roles?.some(r => r === 'CLIENT_MANAGER' || r === 'PROVIDER_MANAGER'));
  const canSeeSections = Boolean(org && (manager || org.roles?.includes('CLIENT_CONTROLLER')));

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
  const errorBox = error ? <div className="error" role="alert">{messageFor(t, error)}</div> : null;
  const language = <LanguageSelect lang={lang} setLang={setLang} t={t} />;

  if (loading) return <main className="loading" role="status"><Brand /><p>{t.loading}</p></main>;

  if (!user || user.must_change_password || token) {
    const title = token ? t.join : user ? t.changeTitle : t.welcome;
    const text = token ? t.joinHelp : user ? t.changeText : t.intro;
    return <div className="auth">
      <header className="auth-top"><Brand />{language}</header>
      <main className="auth-body">
        <section className="auth-intro">
          <p className="auth-claim">{t.brandText.split(/(?<=\.)\s+/).map(sentence => <span key={sentence}>{sentence}</span>)}</p>
          <p className="auth-sub">{t.brandSub}</p>
          <SampleStrip />
        </section>
        <section className="auth-card" aria-labelledby="auth-title">
          <h1 id="auth-title">{title}</h1>
          <p>{text}</p>
          {errorBox}
          <form onSubmit={event => {
            const data = fields(event);
            void act(async () => {
              if (token) { await api('auth/accept', { ...data, token }); setToken(''); history.replaceState(null, '', location.pathname); }
              else if (user) await api('auth/password', data);
              else await api('auth/login', data);
              await refresh();
            });
          }}>
            {token && <Field name="displayName" label={t.displayName} />}
            {!user || token
              ? <><Field name="login" label={t.login} /><Field name="password" label={t.password} type="password" minLength={token ? 8 : undefined} /></>
              : <><Field name="currentPassword" label={t.currentPassword} type="password" /><Field name="newPassword" label={t.newPassword} type="password" minLength={8} /></>}
            {(token || user) && <small>{t.passwordHelp}</small>}
            <button className="primary wide" disabled={busy}>{busy ? t.loading : token ? t.accept : user ? t.savePassword : t.signIn}</button>
          </form>
          {user && <button className="text-button" disabled={busy} onClick={() => void act(async () => { await api('auth/logout', {}); setSecret(null); setUser(null); })}>{t.logout}</button>}
        </section>
      </main>
      <footer className="auth-foot">TRACEOPS · {t.accountsOnly}</footer>
    </div>;
  }

  const kindLabel = (o: Org) => o.kind === 'CLIENT' ? t.client : t.provider;
  const roleLabel = (r: string) => r === 'FIELD_AGENT' ? t.agent : r === 'CLIENT_CONTROLLER' ? t.controller : t.manager;
  const orgMeta = (o: Org) => [kindLabel(o), ...(o.roles?.length ? [o.roles.map(roleLabel).join(', ')] : [])].join(' · ');
  const signOut = () => void act(async () => { await api('auth/logout', {}); setUser(null); setSecret(null); setOrgs([]); setMembers([]); });
  const multiOrg = orgs.length > 1;
  // Phone screen: the organisations list, or the active organisation. An admin without any organisation starts on the list, where it can create one.
  const phoneView = multiOrg ? mobileView : orgs.length ? 'org' : user.admin && form !== 'org' ? 'orgs' : 'org';
  const chooseOrg = (id: string) => { setOrgId(id); setMobileView('org'); };
  const membersCounted = manager && !membersLoading && !membersError;

  // Right-hand pane of the team workspace: a one-time secret, an open form, or the team actions.
  const teamDetail = secret
    ? <div className="detail-card detail-secret" aria-live="polite">
        <h2 ref={detailHeading} tabIndex={-1}>{secret.kind === 'invite' ? t.inviteReady : t.agentReady}</h2>
        <p>{secret.kind === 'invite' ? t.inviteHelp : t.agentHelp}</p>
        {secret.login && <p className="result-login">{t.login} <code>{secret.login}</code></p>}
        <label>{secret.kind === 'invite' ? t.inviteLink : t.temporary}<textarea readOnly rows={secret.kind === 'invite' ? 3 : 1} value={secret.value} /></label>
        <div className="actions">
          <button className="secondary" onClick={() => void act(async () => { await navigator.clipboard.writeText(secret.value); setCopied(true); })}><CopyIcon />{copied ? t.copied : t.copy}</button>
          <button className="primary" onClick={() => { setSecret(null); setCopied(false); }}>{t.done}</button>
        </div>
      </div>
    : form
      ? <div className="detail-card">
          <h2 ref={detailHeading} tabIndex={-1}>{form === 'org' ? t.createOrg : form === 'agent' ? t.addAgent : t.invite}</h2>
          <form key={form + orgId} onSubmit={event => {
            const data = fields(event);
            void act(async () => {
              if (form === 'org') { const result = await api('admin/organizations', data); await refresh(); setOrgId(result.id); setMobileView('org'); }
              else if (form === 'agent') { const r = await api('organization/agents', data, orgId); setSecret({ kind: 'agent', value: r.temporaryPassword, login: r.login }); await reloadMembers(); }
              else { const r = await api('organization/invitations', data, orgId); setSecret({ kind: 'invite', value: location.origin + '/#invite=' + r.token }); }
              setCopied(false); setForm(null);
            });
          }}>
            {form === 'org'
              ? <><Field name="name" label={t.name} /><label>{t.kind}<select aria-label={t.kind} name="kind"><option value="CLIENT">{t.client}</option><option value="PROVIDER">{t.provider}</option></select></label></>
              : form === 'agent'
                ? <><Field name="displayName" label={t.displayName} /><Field name="login" label={t.login} /></>
                : <label>{t.role}<select aria-label={t.role} name="role">
                    <option value={org?.kind === 'CLIENT' ? 'CLIENT_MANAGER' : 'PROVIDER_MANAGER'}>{t.manager}</option>
                    {org?.kind === 'CLIENT' && <option value="CLIENT_CONTROLLER">{t.controller}</option>}
                  </select></label>}
            <div className="actions">
              <button className="primary" disabled={busy}>{busy ? t.loading : t.create}</button>
              <button type="button" className="secondary" disabled={busy} onClick={() => setForm(null)}>{t.cancel}</button>
            </div>
          </form>
        </div>
      : org && manager && section === 'team'
        ? <div className="detail-card detail-idle">
            <h2>{t.addPeople}</h2>
            <ul className="action-list">
              {org.kind === 'PROVIDER' && <li>
                <button className="primary" disabled={busy} onClick={() => { setForm('agent'); setSecret(null); }}><PlusIcon />{t.addAgent}</button>
                <p>{t.addAgentHelp}</p>
              </li>}
              <li>
                <button className={org.kind === 'CLIENT' ? 'primary' : 'secondary'} disabled={busy} onClick={() => { setForm('invite'); setSecret(null); }}>{org.kind === 'CLIENT' && <PlusIcon />}{t.invite}</button>
                <p>{org.kind === 'CLIENT' ? t.inviteHelpClient : t.inviteHelpProvider}</p>
              </li>
            </ul>
          </div>
        : null;

  return <div className="app" style={orgStyle(org)} data-view={phoneView}>
    <div className="orgs-pane">{org && <Selvedge org={org} vertical />}<div className="orgs-inner">
      <div className="pane-brand"><Brand /></div>
      <nav className="org-nav" aria-labelledby="org-nav-title">
        <p className="org-nav-title" id="org-nav-title">{t.orgs}</p>
        {orgs.length
          ? <ul className="org-list">{orgs.map(o => <li key={o.id}>
              <button className="org-item" aria-current={o.id === orgId ? 'true' : undefined} disabled={busy} onClick={() => chooseOrg(o.id)}>
                <Cloth org={o} className="org-swatch" />
                <span className="org-item-text"><span className="org-item-name">{o.name}</span><span className="org-item-meta">{orgMeta(o)}</span></span>
              </button>
            </li>)}</ul>
          : <p className="org-nav-empty">{user.admin ? t.emptyOrg : t.noContext}</p>}
        {user.admin && <button className="rail-button" disabled={busy} onClick={() => { setSection('team'); setForm('org'); setSecret(null); setMobileView('org'); }}><PlusIcon />{t.createOrg}</button>}
      </nav>
      <div className="pane-account">
        <p className="identity"><span className="identity-name">{user.display_name}</span><span className="identity-role">{user.admin ? t.admin : user.login}</span></p>
        <div className="account-controls">
          {language}
          <button className="logout" onClick={signOut} disabled={busy}><LogoutIcon /><span>{t.logout}</span></button>
        </div>
      </div>
    </div></div>

    <main className="content">
      {org && <Selvedge org={org} />}
      <div className="content-inner">
        {multiOrg && <button className="back-button orgs-back" disabled={busy} onClick={() => setMobileView('orgs')}><BackIcon />{t.orgs}</button>}
        <header className="page-heading">
          <h1>{org?.name ?? (user.admin ? t.orgs : t.noContext)}</h1>
          <p>{org ? <span className="kind-chip">{kindLabel(org)}</span> : user.admin ? t.emptyOrgText : t.noContextText}</p>
        </header>
        {canSeeSections && <nav className="section-tabs" aria-label={t.sections}>
          {(['team', 'sites'] as const).map(item => <button key={item} aria-current={section === item ? 'page' : undefined} disabled={busy}
            onClick={() => { setSection(item); setForm(null); setSecret(null); setError(''); }}>
            {item === 'team' ? <TeamIcon /> : <SitesIcon />}{item === 'team' ? t.team : t.sites}
            {item === 'team' && membersCounted && <span className="count" aria-hidden="true">{members.length}</span>}
          </button>)}
        </nav>}
        {errorBox}

        {section === 'sites' && org && canSeeSections
          ? <Sites key={orgId} org={org} admin={user.admin} lang={lang} setBusy={setBusy} />
          : <div className={teamDetail ? 'workspace workspace-team has-detail' : 'workspace workspace-team'} data-detail={form || secret ? 'open' : 'closed'}>
              {org && (manager
                ? <section className="pane-list" aria-labelledby="team-title">
                    <h2 id="team-title" className="sr-only">{t.team}{membersCounted ? ` (${members.length})` : ''}</h2>
                    {membersLoading
                      ? <div className="skeleton" role="status"><span className="sr-only">{t.loading}</span>{[0, 1, 2].map(i => <span key={i} className="skeleton-row" />)}</div>
                      : membersError
                        ? <div className="error" role="alert"><p>{messageFor(t, membersError)}</p><button className="secondary" onClick={() => void reloadMembers()}>{t.retry}</button></div>
                        : members.length
                          ? <div className="table-wrap">
                              <table className="members" role="table">
                                <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">{t.displayName}</th><th role="columnheader" scope="col">{t.login}</th><th role="columnheader" scope="col">{t.role}</th><th role="columnheader" scope="col">{t.access}</th></tr></thead>
                                <tbody role="rowgroup">{members.map(m => <tr role="row" key={m.id}>
                                  <td role="cell" className="member-name"><span className="member-id"><span className="avatar" aria-hidden="true">{initials(m.display_name)}</span><strong>{m.display_name}</strong></span></td>
                                  <td role="cell" data-label={t.login} className="member-login">{m.login}</td>
                                  <td role="cell" data-label={t.role} className="member-role">{m.roles.map(roleLabel).join(', ')}</td>
                                  <td role="cell" data-label={t.access} className="member-access"><span className={m.active ? 'status status-on' : 'status status-off'}>{m.active ? t.active : t.disabled}</span></td>
                                </tr>)}</tbody>
                              </table>
                            </div>
                          : <div className="empty"><h3>{t.emptyTeam}</h3><p>{t.emptyTeamText}</p></div>}
                  </section>
                : <section className="pane-list empty"><h2>{t.agentView}</h2><p>{t.agentViewText}</p></section>)}
              {teamDetail && <aside className="pane-detail">{teamDetail}</aside>}
            </div>}
      </div>
    </main>
  </div>;
}

createRoot(document.getElementById('root')!).render(<App />);
