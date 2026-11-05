import React, { useEffect, useState } from 'react';
import { api, ApiError } from './api';
import { Avatar } from './avatar';
import { messageFor, type Dict, type Lang } from './i18n';
import { AlertIcon, CheckIcon, CloseIcon, PinIcon, SitesIcon, TeamIcon } from './icons';

export type Org = { id: string; name: string; kind: 'CLIENT' | 'PROVIDER'; roles?: string[] };
export type Member = { id: string; membership_id: string; display_name: string; login: string; roles: string[]; active: boolean };
export type Assignment = { membership_id: string; zone_id: string; code: string; name: string; kind: string; site_id: string; site_name: string; path: string[] };
type Site = { id: string; name: string; sector: string; timezone: string };
type Zone = { id: string; parent_id: string | null; code: string; name: string; kind: string };

export const isAgent = (m: Member) => m.roles.length === 1 && m.roles[0] === 'FIELD_AGENT';
export const placeLabel = (a: Assignment) => [...a.path, a.name].join(' › ');
const errorCode = (e: unknown) => e instanceof ApiError ? e.code : 'error';

function LoadError({ text, retry, t }: { text: string; retry: () => void; t: Dict }) {
  return <div className="alert alert-error" role="alert"><AlertIcon /><div className="alert-body"><p>{text}</p><button className="secondary small" onClick={retry}>{t.retry}</button></div></div>;
}

/** The sites the provider is linked to (through an active service agreement). */
function useLinkedSites(orgId: string) {
  const [sites, setSites] = useState<Site[]>([]), [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true; setState('loading');
    api('sites', undefined, orgId).then(list => { if (active) { setSites(list); setState('ready'); } }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [orgId, attempt]);
  return { sites, state, retry: () => setAttempt(n => n + 1) };
}

/* ---------------------------------------------------------------- Dashboard */

export function ProviderDashboard({ org, members, membersState, assignments, assignmentsState, t, actions, onManage, retryMembers, retryAssignments }: {
  org: Org; members: Member[]; membersState: 'loading' | 'ready' | 'error'; assignments: Assignment[]; assignmentsState: 'loading' | 'ready' | 'error';
  t: Dict; actions: React.ReactNode; onManage: (m: Member) => void; retryMembers: () => void; retryAssignments: () => void;
}) {
  const { sites, state: sitesState, retry: retrySites } = useLinkedSites(org.id);
  const agents = members.filter(m => isAgent(m) && m.active);
  const assigned = new Set(assignments.map(a => a.membership_id));
  const unassigned = agents.filter(m => !assigned.has(m.membership_id));
  const places = new Set(assignments.map(a => a.zone_id));
  const ready = membersState === 'ready' && assignmentsState === 'ready';
  const byName = new Map(members.map(m => [m.membership_id, m]));
  const stat = (value: number | string, label: string) => <div className="stat"><dt>{label}</dt><dd>{value}</dd></div>;
  const dash = '–';

  return <section className="pane-list provider-dashboard" aria-labelledby="dashboard-title">
    <h2 id="dashboard-title" className="sr-only">{t.dashboard}</h2>
    <div className="toolbar"><p className="toolbar-text" title={t.dashIntro}>{t.dashIntro}</p>{actions}</div>
    <dl className="stats">
      {stat(membersState === 'ready' ? agents.length : dash, t.statActive)}
      {stat(ready ? unassigned.length : dash, t.statUnassigned)}
      {stat(assignmentsState === 'ready' ? places.size : dash, t.statPlaces)}
      {stat(sitesState === 'ready' ? sites.length : dash, t.statSites)}
    </dl>
    {membersState === 'error' && <LoadError text={t.membersLoadError} retry={retryMembers} t={t} />}
    {assignmentsState === 'error' && <LoadError text={t.assignmentsLoadError} retry={retryAssignments} t={t} />}
    <div className="dashboard-grid">
      <section className="board" aria-labelledby="coverage-title">
        <h3 id="coverage-title" className="board-title">{t.coverage}</h3>
        {sitesState === 'loading' ? <div className="skeleton" role="status"><span className="sr-only">{t.loading}</span><span className="skeleton-row" /><span className="skeleton-row" /></div>
          : sitesState === 'error' ? <LoadError text={t.sitesLoadError} retry={retrySites} t={t} />
          : !sites.length ? <div className="empty"><span className="empty-icon" aria-hidden="true"><SitesIcon /></span><p>{t.noLinkedSites}</p></div>
          : <ul className="coverage">{sites.map(site => {
              const rows = assignments.filter(a => a.site_id === site.id);
              const zones = [...new Map(rows.map(a => [a.zone_id, a])).values()];
              return <li key={site.id} className="coverage-site">
                <p className="coverage-site-name"><span className="site-icon" aria-hidden="true"><SitesIcon /></span><strong>{site.name}</strong><span className="coverage-count">{zones.length}</span></p>
                {zones.length ? <ul className="coverage-zones">{zones.map(zone => <li key={zone.zone_id}>
                    <span className="coverage-place"><span>{placeLabel(zone)}</span><span className="zone-code">{zone.code}</span></span>
                    <span className="coverage-agents">{rows.filter(a => a.zone_id === zone.zone_id).map(a => {
                      const m = byName.get(a.membership_id);
                      return m && <button key={a.membership_id} className="agent-chip" onClick={() => onManage(m)} title={m.display_name}><Avatar name={m.display_name} seed={m.id} size="sm" /><span>{m.display_name}</span></button>;
                    })}</span>
                  </li>)}</ul>
                  : <p className="coverage-empty">{t.siteNoAgent}</p>}
              </li>;
            })}</ul>}
      </section>
      <section className="board" aria-labelledby="unassigned-title">
        <h3 id="unassigned-title" className="board-title">{t.unassignedTitle}</h3>
        {!ready ? (membersState === 'loading' || assignmentsState === 'loading') && <div className="skeleton" role="status"><span className="sr-only">{t.loading}</span><span className="skeleton-row" /></div>
          : !agents.length ? <div className="empty"><span className="empty-icon" aria-hidden="true"><TeamIcon /></span><p>{t.noAgents}</p></div>
          : unassigned.length ? <ul className="people">{unassigned.map(m => <li key={m.id}>
              <span className="member-id"><Avatar name={m.display_name} seed={m.id} /><span className="people-text"><strong>{m.display_name}</strong><code>{m.login}</code></span></span>
              <button className="secondary small" onClick={() => onManage(m)}><PinIcon />{t.assign}</button>
            </li>)}</ul>
          : <p className="board-note"><CheckIcon />{t.allAssigned}</p>}
      </section>
    </div>
  </section>;
}

/* ------------------------------------------------------------- Member drawer */

export function MemberPanel({ org, member, assignments, t, lang, setBusy, busy, onClose, onChanged, headingRef }: {
  org: Org; member: Member; assignments: Assignment[]; t: Dict; lang: Lang; setBusy: (b: boolean) => void; busy: boolean;
  onClose: () => void; onChanged: () => Promise<void>; headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const { sites, state: sitesState, retry } = useLinkedSites(org.id);
  const [siteId, setSiteId] = useState(''), [zones, setZones] = useState<Zone[]>([]), [zonesState, setZonesState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [zoneId, setZoneId] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState(''), [confirm, setConfirm] = useState(false);
  const mine = assignments.filter(a => a.membership_id === member.membership_id);
  const agent = isAgent(member) && org.kind === 'PROVIDER';

  useEffect(() => { if (!siteId && sites[0]) setSiteId(sites[0].id); }, [sites, siteId]);
  useEffect(() => {
    if (!siteId) return;
    let active = true; setZonesState('loading'); setZoneId('');
    api(`sites/${siteId}/zones`, undefined, org.id).then(list => { if (active) { setZones(list); setZonesState('ready'); } }).catch(() => { if (active) setZonesState('error'); });
    return () => { active = false; };
  }, [siteId, org.id]);

  async function run(work: () => Promise<void>, done?: string) {
    setBusy(true); setError(''); setNotice('');
    try { await work(); setConfirm(false); await onChanged(); if (done) setNotice(done); } catch (e) { setError(errorCode(e)); } finally { setBusy(false); }
  }
  const ancestors = (zone: Zone) => {
    const names: string[] = []; let id = zone.parent_id; const seen = new Set<string>();
    while (id && !seen.has(id)) { seen.add(id); const p = zones.find(z => z.id === id); if (!p) break; names.unshift(p.name); id = p.parent_id; }
    return names;
  };
  const taken = new Set(mine.map(a => a.zone_id));
  const options = zones.filter(z => !taken.has(z.id));
  const kindName = (k: string) => (({ BUILDING: lang === 'fr' ? 'Bâtiment' : 'Building', FLOOR: lang === 'fr' ? 'Étage' : 'Floor', AREA: lang === 'fr' ? 'Zone' : 'Area', ROOM: lang === 'fr' ? 'Salle' : 'Room', EQUIPMENT: lang === 'fr' ? 'Équipement' : 'Equipment' }) as Record<string, string>)[k] ?? k;

  return <div className="panel member-panel">
    <div className="panel-head">
      <h2 ref={headingRef} tabIndex={-1}>{member.display_name}</h2>
      <button type="button" className="icon-button" aria-label={t.close} disabled={busy} onClick={onClose}><CloseIcon /></button>
    </div>
    <div className="panel-body">
      <p className="member-summary"><code>{member.login}</code><span className={member.active ? 'status status-on' : 'status status-off'}>{member.active ? t.active : t.disabled}</span></p>
      {error && <div className="alert alert-error" role="alert"><AlertIcon /><p>{messageFor(t, error)}</p></div>}
      {notice && <p className="alert alert-success" role="status"><CheckIcon />{notice}</p>}

      <form className="panel-section" onSubmit={event => {
        event.preventDefault();
        const displayName = String(new FormData(event.currentTarget).get('displayName') ?? '');
        void run(() => api(`organization/members/${member.membership_id}`, { displayName }, org.id), t.savedChanges);
      }}>
        <h3>{t.memberDetails}</h3>
        <label>{t.displayName}<input name="displayName" required maxLength={120} defaultValue={member.display_name} key={member.display_name} /></label>
        <div><button className="secondary small" disabled={busy}>{t.saveName}</button></div>
      </form>

      {agent && member.active && <section className="panel-section" aria-labelledby="places-title">
        <h3 id="places-title">{t.placesTitle}</h3>
        <p className="panel-desc">{t.placesHelp}</p>
        {mine.length ? <ul className="assigned">{mine.map(a => <li key={a.zone_id}>
            <span className="assigned-text"><strong>{placeLabel(a)}</strong><span>{a.site_name} · <span className="zone-code">{a.code}</span></span></span>
            <button type="button" className="icon-button" aria-label={`${t.removeAssignment} : ${placeLabel(a)}`} title={t.removeAssignment} disabled={busy}
              onClick={() => void run(() => api('organization/assignments/remove', { membershipId: member.membership_id, zoneId: a.zone_id }, org.id))}><CloseIcon /></button>
          </li>)}</ul>
          : <p className="board-note">{t.noPlaceYet}</p>}
        {sitesState === 'error' ? <LoadError text={t.sitesLoadError} retry={retry} t={t} />
          : sitesState === 'ready' && !sites.length ? <p className="board-note">{t.noLinkedSites}</p>
          : <form className="assign-form" onSubmit={event => {
              event.preventDefault();
              if (zoneId) void run(async () => { await api('organization/assignments', { membershipId: member.membership_id, zoneId }, org.id); setZoneId(''); });
            }}>
              <label>{t.site}<select aria-label={t.site} value={siteId} onChange={e => setSiteId(e.target.value)} disabled={busy || sitesState !== 'ready'}>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></label>
              <label>{t.place}<select aria-label={t.place} value={zoneId} required onChange={e => setZoneId(e.target.value)} disabled={busy || zonesState !== 'ready' || !options.length}>
                <option value="">{zonesState === 'ready' && !zones.length ? t.noPlaceAvailable : t.choosePlace}</option>
                {options.map(z => <option key={z.id} value={z.id}>{[...ancestors(z), z.name].join(' › ')} — {kindName(z.kind)} ({z.code})</option>)}
              </select></label>
              {zonesState === 'error' && <p className="board-note">{t.sitesLoadError}</p>}
              <div><button className="primary" disabled={busy || !zoneId}>{t.addAssignment}</button></div>
            </form>}
      </section>}

      {agent && <section className="panel-section panel-danger">
        <h3>{member.active ? t.withdraw : t.reactivate}</h3>
        <p className="panel-desc">{member.active ? t.withdrawHelp : t.withdrawnHelp}</p>
        {member.active
          ? confirm
            ? <div className="toolbar-actions"><button className="danger" disabled={busy} onClick={() => void run(() => api(`organization/members/${member.membership_id}/withdraw`, {}, org.id), t.savedChanges)}>{t.confirmWithdraw}</button><button className="secondary" disabled={busy} onClick={() => setConfirm(false)}>{t.cancel}</button></div>
            : <div><button className="secondary danger-outline" disabled={busy} onClick={() => setConfirm(true)}>{t.withdraw}</button></div>
          : <div><button className="secondary" disabled={busy} onClick={() => void run(() => api(`organization/members/${member.membership_id}/reactivate`, {}, org.id), t.savedChanges)}>{t.reactivate}</button></div>}
      </section>}
    </div>
  </div>;
}

/* ------------------------------------------------------------------ Company */

type Profile = { name: string; kind: string; address: string | null; city: string | null; phone: string | null; email: string | null; niu: string | null; rccm: string | null; services: string | null; description: string | null; contact_name: string | null; updated_at: string | null };

export function Company({ org, canEdit, t, lang, busy, setBusy, onRenamed }: { org: Org; canEdit: boolean; t: Dict; lang: Lang; busy: boolean; setBusy: (b: boolean) => void; onRenamed: (name: string) => void }) {
  const [profile, setProfile] = useState<Profile | null>(null), [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'), [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true; setState('loading'); setNotice(''); setError('');
    api('organization/profile', undefined, org.id).then(p => { if (active) { setProfile(p); setState('ready'); } }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [org.id, attempt]);

  if (state === 'loading') return <div className="skeleton" role="status"><span className="sr-only">{t.loading}</span><span className="skeleton-row" /><span className="skeleton-row" /></div>;
  if (state === 'error' || !profile) return <LoadError text={t.companyLoadError} retry={() => setAttempt(n => n + 1)} t={t} />;

  const groups: { title: string; fields: { name: string; label: string; value: string | null; type?: string; long?: boolean; help?: string; max: number; required?: boolean }[] }[] = [
    { title: t.identity, fields: [
      { name: 'name', label: t.companyName, value: profile.name, max: 120, required: true },
      { name: 'contactName', label: t.contactName, value: profile.contact_name, max: 120 },
      { name: 'services', label: t.services, value: profile.services, max: 300, help: t.servicesHelp },
      { name: 'description', label: t.description, value: profile.description, max: 1000, long: true },
    ] },
    { title: t.contactDetails, fields: [
      { name: 'address', label: t.address, value: profile.address, max: 200 },
      { name: 'city', label: t.city, value: profile.city, max: 120 },
      { name: 'phone', label: t.phone, value: profile.phone, type: 'tel', max: 40 },
      { name: 'email', label: t.email, value: profile.email, type: 'email', max: 160 },
    ] },
    { title: t.legalIds, fields: [
      { name: 'niu', label: t.niu, value: profile.niu, max: 40 },
      { name: 'rccm', label: t.rccm, value: profile.rccm, max: 60 },
    ] },
  ];
  const updated = profile.updated_at && t.lastUpdate.replace('{date}', new Date(profile.updated_at).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'long', timeStyle: 'short' }));

  return <section className="company" aria-labelledby="company-title">
    <h2 id="company-title" className="sr-only">{t.company}</h2>
    <div className="toolbar"><p className="toolbar-text">{canEdit ? t.companyIntro : t.companyReadOnly}</p>{updated && <p className="toolbar-meta">{updated}</p>}</div>
    {error && <div className="alert alert-error" role="alert"><AlertIcon /><p>{messageFor(t, error)}</p></div>}
    {notice && <p className="alert alert-success" role="status"><CheckIcon />{notice}</p>}
    {canEdit
      ? <form className="company-form" onSubmit={event => {
          event.preventDefault();
          const data = Object.fromEntries(new FormData(event.currentTarget));
          setBusy(true); setError(''); setNotice('');
          api('organization/profile', data, org.id)
            .then(p => { setProfile(p); onRenamed(p.name); setNotice(t.savedChanges); })
            .catch(e => setError(errorCode(e)))
            .finally(() => setBusy(false));
        }}>
          {groups.map(group => <div className="company-group" key={group.title}>
            <h3>{group.title}</h3>
            <div className="company-fields">{group.fields.map(f => <label key={f.name} className={f.long ? 'span-2' : undefined}>{f.label}
              {f.long ? <textarea name={f.name} maxLength={f.max} defaultValue={f.value ?? ''} />
                : <input name={f.name} type={f.type ?? 'text'} maxLength={f.max} required={f.required} defaultValue={f.value ?? ''} aria-describedby={f.help ? `${f.name}-help` : undefined} />}
              {f.help && <small id={`${f.name}-help`}>{f.help}</small>}
            </label>)}</div>
          </div>)}
          <div className="company-actions"><button className="primary" disabled={busy}>{busy ? t.loading : t.saveCompany}</button></div>
        </form>
      : <div className="company-form">{groups.map(group => <div className="company-group" key={group.title}>
          <h3>{group.title}</h3>
          <dl className="company-fields">{group.fields.map(f => <div key={f.name} className={f.long ? 'span-2' : undefined}><dt>{f.label}</dt><dd className={f.value ? undefined : 'muted'}>{f.value || t.notProvided}</dd></div>)}</dl>
        </div>)}</div>}
  </section>;
}
