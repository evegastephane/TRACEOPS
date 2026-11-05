import React, { useEffect, useState } from 'react';
import { api, ApiError } from './api';
import { Avatar } from './avatar';
import type { Lang } from './i18n';
import { AlertIcon, CheckIcon, SearchIcon } from './icons';

const fr = {
  auditIntro: 'Tout ce qui a été fait sur la plateforme : qui, quoi, sur quoi, quand et pourquoi.',
  search: 'Rechercher', searchHint: 'Auteur, organisation ou motif', action: 'Action', allActions: 'Toutes les actions', organization: 'Organisation', allOrgs: 'Toutes les organisations',
  when: 'Date', who: 'Auteur', what: 'Action', target: 'Cible', reason: 'Motif', more: 'Afficher plus', loading: 'Chargement…', retry: 'Réessayer',
  empty: 'Aucune action ne correspond à ces filtres.', loadError: 'Impossible de charger le journal. Réessayez.', platform: 'Plateforme', none: '—',
  profileIntro: 'Vos informations de compte. Votre identifiant de connexion ne change pas.', account: 'Compte', displayName: 'Nom complet', login: 'Identifiant',
  save: 'Enregistrer', saved: 'Modifications enregistrées.', password: 'Mot de passe', currentPassword: 'Mot de passe actuel', newPassword: 'Nouveau mot de passe',
  passwordHelp: 'Au moins 8 caractères. Vos autres sessions seront fermées.', changePassword: 'Changer le mot de passe', passwordSaved: 'Mot de passe modifié.',
  access: 'Accès', adminAccess: 'Administrateur de la plateforme', noMembership: 'Aucune organisation.',
};
type T = typeof fr;
const en: T = {
  auditIntro: 'Everything done on the platform: who, what, on what, when and why.',
  search: 'Search', searchHint: 'Author, organization or reason', action: 'Action', allActions: 'All actions', organization: 'Organization', allOrgs: 'All organizations',
  when: 'Date', who: 'Author', what: 'Action', target: 'Target', reason: 'Reason', more: 'Show more', loading: 'Loading…', retry: 'Try again',
  empty: 'No action matches these filters.', loadError: 'The log could not be loaded. Try again.', platform: 'Platform', none: '—',
  profileIntro: 'Your account details. Your sign-in username does not change.', account: 'Account', displayName: 'Full name', login: 'Username',
  save: 'Save', saved: 'Changes saved.', password: 'Password', currentPassword: 'Current password', newPassword: 'New password',
  passwordHelp: 'At least 8 characters. Your other sessions will be closed.', changePassword: 'Change password', passwordSaved: 'Password changed.',
  access: 'Access', adminAccess: 'Platform administrator', noMembership: 'No organization.',
};

/** Readable names for the audited actions; an unknown code is shown as is. */
const actions: Record<string, [string, string]> = {
  LOGIN: ['Connexion', 'Sign-in'], PASSWORD_CHANGED: ['Mot de passe modifié', 'Password changed'], ACCOUNT_UPDATED: ['Profil modifié', 'Profile updated'],
  ORGANIZATION_CREATED: ['Organisation créée', 'Organization created'], PROFILE_UPDATED: ['Fiche société modifiée', 'Company details updated'],
  INVITATION_CREATED: ['Invitation créée', 'Invitation created'], INVITATION_ACCEPTED: ['Invitation acceptée', 'Invitation accepted'],
  AGENT_CREATED: ['Agent ajouté', 'Agent added'], MEMBER_UPDATED: ['Employé modifié', 'Employee updated'], MEMBER_WITHDRAWN: ['Employé retiré', 'Employee removed'],
  MEMBER_REACTIVATED: ['Employé réactivé', 'Employee reactivated'], AGENT_ASSIGNED: ['Agent affecté', 'Agent assigned'], AGENT_UNASSIGNED: ['Affectation retirée', 'Assignment removed'],
  SITE_CREATED: ['Site créé', 'Site created'], ZONE_CREATED: ['Lieu créé', 'Place created'], PROVIDER_LINKED: ['Prestataire rattaché', 'Provider linked'],
  CONTROLLER_GRANTED: ['Contrôleur habilité', 'Controller authorized'], CONTROLLER_REVOKED: ['Habilitation retirée', 'Authorization removed'],
};
export const actionLabel = (code: string, lang: Lang) => actions[code]?.[lang === 'fr' ? 0 : 1] ?? code;

type Entry = { id: string; created_at: string; action: string; reason: string | null; actor_name: string; actor_login: string; org_name: string | null; target_name: string | null };

export function AuditLog({ lang, orgs }: { lang: Lang; orgs: { id: string; name: string }[] }) {
  const t = lang === 'fr' ? fr : en;
  const [entries, setEntries] = useState<Entry[]>([]), [more, setMore] = useState(false), [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [codes, setCodes] = useState<string[]>([]), [action, setAction] = useState(''), [org, setOrg] = useState(''), [q, setQ] = useState(''), [query, setQuery] = useState(''), [attempt, setAttempt] = useState(0);
  const params = (before?: string) => new URLSearchParams(Object.entries({ action, org, q: query, before: before ?? '', limit: '50' }).filter(([, v]) => v)).toString();
  useEffect(() => { api('admin/audit/actions').then(setCodes).catch(() => setCodes([])); }, []);
  useEffect(() => {
    let active = true; setState('loading');
    api('admin/audit?' + params()).then(r => { if (active) { setEntries(r.entries); setMore(r.more); setState('ready'); } }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [action, org, query, attempt]);
  // Typing filters after a short pause, so the list does not reload on every key.
  useEffect(() => { const id = setTimeout(() => setQuery(q.trim()), 300); return () => clearTimeout(id); }, [q]);
  const stamp = (iso: string) => new Date(iso).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  return <section className="audit" aria-labelledby="audit-title">
    <h2 id="audit-title" className="sr-only">{lang === 'fr' ? 'Journal d’activité' : 'Activity log'}</h2>
    <p className="toolbar-text page-intro">{t.auditIntro}</p>
    <div className="filters">
      <label className="filter-search">{t.search}<span className="search-field"><SearchIcon /><input type="search" value={q} placeholder={t.searchHint} onChange={e => setQ(e.target.value)} /></span></label>
      <label>{t.action}<select aria-label={t.action} value={action} onChange={e => setAction(e.target.value)}><option value="">{t.allActions}</option>{codes.map(c => <option key={c} value={c}>{actionLabel(c, lang)}</option>)}</select></label>
      <label>{t.organization}<select aria-label={t.organization} value={org} onChange={e => setOrg(e.target.value)}><option value="">{t.allOrgs}</option>{orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
    </div>
    {state === 'error'
      ? <div className="alert alert-error" role="alert"><AlertIcon /><div className="alert-body"><p>{t.loadError}</p><button className="secondary small" onClick={() => setAttempt(n => n + 1)}>{t.retry}</button></div></div>
      : state === 'loading' && !entries.length ? <div className="skeleton" role="status"><span className="sr-only">{t.loading}</span><span className="skeleton-row" /><span className="skeleton-row" /><span className="skeleton-row" /></div>
      : !entries.length ? <div className="empty"><p>{t.empty}</p></div>
      : <>
          <div className="table-card"><table className="audit-table">
            <thead><tr><th scope="col">{t.when}</th><th scope="col">{t.who}</th><th scope="col">{t.what}</th><th scope="col">{t.target}</th><th scope="col">{t.organization}</th><th scope="col">{t.reason}</th></tr></thead>
            <tbody>{entries.map(e => <tr key={e.id}>
              <td data-label={t.when} className="audit-when">{stamp(e.created_at)}</td>
              <td data-label={t.who}><span className="member-id"><Avatar name={e.actor_name} seed={e.actor_login} size="sm" /><span className="people-text"><strong>{e.actor_name}</strong><code>{e.actor_login}</code></span></span></td>
              <td data-label={t.what}><span className="audit-action">{actionLabel(e.action, lang)}</span></td>
              <td data-label={t.target}>{e.target_name ?? <span className="muted">{t.none}</span>}</td>
              <td data-label={t.organization}>{e.org_name ?? <span className="muted">{t.platform}</span>}</td>
              <td data-label={t.reason} className="audit-reason">{e.reason ?? <span className="muted">{t.none}</span>}</td>
            </tr>)}</tbody>
          </table></div>
          {more && <div className="load-more"><button className="secondary" disabled={state === 'loading'} onClick={() => {
            setState('loading');
            api('admin/audit?' + params(entries[entries.length - 1].created_at)).then(r => { setEntries(list => [...list, ...r.entries]); setMore(r.more); setState('ready'); }).catch(() => setState('error'));
          }}>{state === 'loading' ? t.loading : t.more}</button></div>}
        </>}
  </section>;
}

type Me = { id: string; login: string; display_name: string; admin: boolean; memberships: { id: string; name: string; kind: string; roles?: string[] }[] };

export function Profile({ lang, user, roleLabel, kindLabel, busy, setBusy, onSaved }: {
  lang: Lang; user: Me; roleLabel: (r: string) => string; kindLabel: (k: string) => string; busy: boolean; setBusy: (b: boolean) => void; onSaved: (name: string) => void;
}) {
  const t = lang === 'fr' ? fr : en;
  const [notice, setNotice] = useState(''), [error, setError] = useState(''), [pwNotice, setPwNotice] = useState(''), [pwError, setPwError] = useState('');
  const failure = (e: unknown) => e instanceof ApiError ? e.code : 'error';
  const messages: Record<string, [string, string]> = {
    INVALID_CREDENTIALS: ['Mot de passe actuel incorrect.', 'Current password is incorrect.'], PASSWORD_POLICY: ['Choisissez un mot de passe d’au moins 8 caractères.', 'Choose a password with at least 8 characters.'],
    PASSWORD_UNCHANGED: ['Choisissez un mot de passe différent.', 'Choose a different password.'], TOO_MANY_ATTEMPTS: ['Trop de tentatives. Réessayez dans 15 minutes.', 'Too many attempts. Try again in 15 minutes.'],
    INVALID_INPUT: ['Vérifiez les champs du formulaire.', 'Check the form fields.'], error: ['Une erreur est survenue. Réessayez.', 'Something went wrong. Please try again.'],
  };
  const say = (code: string) => (messages[code] ?? messages.error)[lang === 'fr' ? 0 : 1];
  return <section className="company" aria-labelledby="profile-title">
    <h2 id="profile-title" className="sr-only">{lang === 'fr' ? 'Mon profil' : 'My profile'}</h2>
    <p className="toolbar-text page-intro">{t.profileIntro}</p>
    <div className="company-form">
      <form className="company-group" onSubmit={event => {
        event.preventDefault();
        const displayName = String(new FormData(event.currentTarget).get('displayName') ?? '');
        setBusy(true); setError(''); setNotice('');
        api('auth/account', { displayName, locale: lang }).then(() => { onSaved(displayName.trim()); setNotice(t.saved); }).catch(e => setError(say(failure(e)))).finally(() => setBusy(false));
      }}>
        <h3>{t.account}</h3>
        {error && <div className="alert alert-error" role="alert"><AlertIcon /><p>{error}</p></div>}
        {notice && <p className="alert alert-success" role="status"><CheckIcon />{notice}</p>}
        <div className="company-fields">
          <label>{t.displayName}<input name="displayName" required maxLength={120} defaultValue={user.display_name} /></label>
          <label>{t.login}<input value={user.login} readOnly aria-readonly="true" className="readonly" /></label>
        </div>
        <div className="company-actions"><button className="primary" disabled={busy}>{t.save}</button></div>
      </form>
      <form className="company-group" onSubmit={event => {
        event.preventDefault();
        const form = event.currentTarget, data = Object.fromEntries(new FormData(form));
        setBusy(true); setPwError(''); setPwNotice('');
        api('auth/password', data).then(() => { form.reset(); setPwNotice(t.passwordSaved); }).catch(e => setPwError(say(failure(e)))).finally(() => setBusy(false));
      }}>
        <h3>{t.password}</h3>
        {pwError && <div className="alert alert-error" role="alert"><AlertIcon /><p>{pwError}</p></div>}
        {pwNotice && <p className="alert alert-success" role="status"><CheckIcon />{pwNotice}</p>}
        <div className="company-fields">
          <label>{t.currentPassword}<input name="currentPassword" type="password" required autoComplete="current-password" maxLength={1024} /></label>
          <label>{t.newPassword}<input name="newPassword" type="password" required minLength={8} autoComplete="new-password" maxLength={1024} aria-describedby="new-password-help" /><small id="new-password-help">{t.passwordHelp}</small></label>
        </div>
        <div className="company-actions"><button className="secondary" disabled={busy}>{t.changePassword}</button></div>
      </form>
      <div className="company-group">
        <h3>{t.access}</h3>
        <ul className="access-list">
          {user.admin && <li><strong>{t.adminAccess}</strong></li>}
          {user.memberships.map(m => <li key={m.id}><strong>{m.name}</strong><span>{kindLabel(m.kind)} · {(m.roles ?? []).map(roleLabel).join(', ')}</span></li>)}
          {!user.admin && !user.memberships.length && <li className="muted">{t.noMembership}</li>}
        </ul>
      </div>
    </div>
  </section>;
}
