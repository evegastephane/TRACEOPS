import React, { useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api';
import { BackIcon, ChevronIcon, PlusIcon, SearchIcon } from './icons';

type Site = { id: string; name: string; sector: string; timezone: string };
type Kind = 'BUILDING' | 'FLOOR' | 'AREA' | 'ROOM' | 'EQUIPMENT';
type Zone = { id: string; parent_id: string | null; code: string; name: string; kind: Kind };
const kinds: Kind[] = ['BUILDING', 'FLOOR', 'AREA', 'ROOM', 'EQUIPMENT'];
const fr = {
 title: 'Sites et salles', intro: 'Définissez les lieux où vos équipes interviennent.', readOnly: 'Consultation des sites auxquels vous avez accès.',
 createSite: 'Créer un site', createZone: 'Ajouter un lieu', siteName: 'Nom du site', sector: 'Activité', otherSector: 'Précisez l’activité', timezone: 'Fuseau horaire',
 company: 'Entreprise', hospital: 'Hôpital', hotel: 'Hôtel', property: 'Immeuble', other: 'Autre',
 name: 'Nom du lieu', code: 'Code du lieu', codeHelp: 'Un code unique dans ce site, par exemple SAL-101.', kind: 'Type de lieu', parent: 'Rattachement', root: 'Directement au site',
 BUILDING: 'Bâtiment', FLOOR: 'Étage', AREA: 'Zone', ROOM: 'Salle', EQUIPMENT: 'Équipement',
 reason: 'Motif de l’action administrative', reasonHelp: 'Ce motif sera conservé dans le journal d’audit.',
 save: 'Enregistrer', cancel: 'Annuler', back: 'Tous les sites', loading: 'Chargement…', retry: 'Réessayer',
 empty: 'Aucun site accessible', emptyHelp: 'Créez un site pour définir ensuite ses bâtiments, étages et salles.', emptyRead: 'Les sites apparaîtront ici après leur rattachement ou votre habilitation.',
 noZones: 'Aucun lieu défini', noZonesHelp: 'Vous pouvez ajouter une salle directement au site, ou commencer par un bâtiment et un étage.', noZonesRead: 'Aucun lieu n’a encore été ajouté à ce site.',
 search: 'Rechercher un lieu', noMatch: 'Aucun lieu ne correspond à cette recherche.', places: 'Lieux du site', clear: 'Effacer la recherche',
 savedSite: 'Site créé.', savedZone: 'Lieu ajouté.', error: 'Chargement impossible. Réessayez.', saveError: 'Enregistrement non confirmé. Vérifiez la liste avant de réessayer.',
 network: 'Connexion au serveur impossible. Vérifiez votre réseau.', FORBIDDEN: 'Vous n’avez pas accès à cette action.', SESSION_REQUIRED: 'Votre session a expiré. Rechargez la page pour vous reconnecter.',
 INVALID_INPUT: 'Vérifiez les champs du formulaire.', INVALID_TIMEZONE: 'Fuseau horaire inconnu. Exemple : Africa/Douala.', ZONE_CODE_EXISTS: 'Ce code existe déjà dans ce site. Choisissez un autre code.', INVALID_ZONE_PARENT: 'Ce rattachement n’est plus valide. Rechargez les lieux du site.', SITE_NOT_FOUND: 'Ce site n’est plus accessible. Revenez à la liste des sites.',
};
const en: typeof fr = {
 title: 'Sites and rooms', intro: 'Define the places where your teams work.', readOnly: 'View the sites you have access to.',
 createSite: 'Create site', createZone: 'Add location', siteName: 'Site name', sector: 'Activity', otherSector: 'Specify activity', timezone: 'Time zone',
 company: 'Business', hospital: 'Hospital', hotel: 'Hotel', property: 'Building', other: 'Other',
 name: 'Location name', code: 'Location code', codeHelp: 'A code unique to this site, for example ROOM-101.', kind: 'Location type', parent: 'Parent location', root: 'Directly under the site',
 BUILDING: 'Building', FLOOR: 'Floor', AREA: 'Area', ROOM: 'Room', EQUIPMENT: 'Equipment',
 reason: 'Reason for the administrative action', reasonHelp: 'This reason will be kept in the audit log.',
 save: 'Save', cancel: 'Cancel', back: 'All sites', loading: 'Loading…', retry: 'Try again',
 empty: 'No accessible sites', emptyHelp: 'Create a site, then define its buildings, floors and rooms.', emptyRead: 'Sites will appear here once they are linked or you are granted access.',
 noZones: 'No locations defined', noZonesHelp: 'Add a room directly under the site, or start with a building and a floor.', noZonesRead: 'No locations have been added to this site yet.',
 search: 'Search locations', noMatch: 'No locations match your search.', places: 'Site locations', clear: 'Clear search',
 savedSite: 'Site created.', savedZone: 'Location added.', error: 'Unable to load. Try again.', saveError: 'Save not confirmed. Check the list before trying again.',
 network: 'Cannot reach the server. Check your network.', FORBIDDEN: 'You do not have access to this action.', SESSION_REQUIRED: 'Your session has expired. Reload the page to sign in again.',
 INVALID_INPUT: 'Check the form fields.', INVALID_TIMEZONE: 'Unknown time zone. Example: Africa/Douala.', ZONE_CODE_EXISTS: 'This code already exists in this site. Choose another code.', INVALID_ZONE_PARENT: 'This parent is no longer valid. Reload the site locations.', SITE_NOT_FOUND: 'This site is no longer accessible. Return to the site list.',
};

export function Sites({ org, admin, lang, setBusy }: {
 org: { id: string; kind: string; roles?: string[] }; admin: boolean; lang: 'fr' | 'en'; setBusy: (value: boolean) => void;
}) {
 const t = lang === 'fr' ? fr : en;
 const writable = org.kind === 'CLIENT' && (admin || org.roles?.includes('CLIENT_MANAGER'));
 const [sites, setSites] = useState<Site[]>([]), [selected, setSelected] = useState<Site | null>(null);
 const [zones, setZones] = useState<Zone[]>([]), [loading, setLoading] = useState(true), [loadError, setLoadError] = useState('');
 const [form, setForm] = useState<'site' | 'zone' | null>(null), [saving, setSaving] = useState(false), [saveError, setSaveError] = useState('');
 const [notice, setNotice] = useState<'savedSite' | 'savedZone' | ''>(''), [query, setQuery] = useState('');
 const [kind, setKind] = useState<Kind>('ROOM'), [sector, setSector] = useState('company');
 const [reload, setReload] = useState(0);
 const mounted = useRef(true), locked = useRef(false);
 const heading = useRef<HTMLHeadingElement>(null), formHeading = useRef<HTMLHeadingElement>(null);
 const focusAfterLoad = useRef(false);
 useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
 useEffect(() => {
  let stale = false;
  setLoading(true); setLoadError('');
  const path = selected ? `sites/${selected.id}/zones` : 'sites';
  api(path, undefined, org.id).then(data => {
   if (!stale) { if (selected) setZones(data); else setSites(data); }
  }).catch(e => { if (!stale) setLoadError(e instanceof ApiError ? e.code : 'error'); })
   .finally(() => { if (!stale) setLoading(false); });
  return () => { stale = true; };
 }, [org.id, selected?.id, reload]);
 useEffect(() => { if (form) formHeading.current?.focus(); }, [form]);
 useEffect(() => { if (!loading && focusAfterLoad.current) { heading.current?.focus(); focusAfterLoad.current = false; } }, [loading]);
 const message = (code: string, fallback: string) => (t as Record<string, string>)[code] ?? fallback;
 const ancestors = (zone: Zone) => {
  const names: string[] = []; let id = zone.parent_id; const visited = new Set<string>();
  while (id && !visited.has(id)) { visited.add(id); const parent = zones.find(z => z.id === id); if (!parent) break; names.unshift(parent.name); id = parent.parent_id; }
  return names;
 };
 const visible = zones.filter(z => [z.name, z.code, ...ancestors(z)].join(' ').toLocaleLowerCase(lang).includes(query.trim().toLocaleLowerCase(lang)));
 function open(site: Site | null) {
  if (locked.current) return;
  setSelected(site); setZones([]); setForm(null); setQuery(''); setSaveError(''); setNotice(''); setLoadError(''); setLoading(true); focusAfterLoad.current = true;
 }
 function showForm(next: 'site' | 'zone') { setForm(next); setSaveError(''); setNotice(''); setKind('ROOM'); setSector('company'); }
 async function submit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (locked.current) return;
  const fields = Object.fromEntries(new FormData(event.currentTarget));
  const body = form === 'site'
   ? { name: fields.name, sector: sector === 'other' ? fields.otherSector : sector, timezone: fields.timezone, reason: fields.reason }
   : { name: fields.name, code: fields.code, kind, parentId: fields.parentId || null, reason: fields.reason };
  locked.current = true; setSaving(true); setBusy(true); setSaveError('');
  try {
   const result = await api(form === 'site' ? 'sites' : `sites/${selected!.id}/zones`, body, org.id);
   if (!mounted.current) return;
   if (form === 'site') { setSelected(result); setZones([]); setNotice('savedSite'); }
   else { setZones(current => [...current, result].sort((a, b) => a.code.localeCompare(b.code))); setNotice('savedZone'); }
   setForm(null); setQuery(''); heading.current?.focus();
  } catch (e) { if (mounted.current) setSaveError(e instanceof ApiError ? e.code : 'saveError'); }
  finally { locked.current = false; if (mounted.current) { setSaving(false); setBusy(false); } }
 }
 const reason = admin && <label>{t.reason}<textarea aria-label={t.reason} name="reason" required maxLength={500} aria-describedby="site-reason-help"/><small id="site-reason-help">{t.reasonHelp}</small></label>;
 const parents = zones.filter(z => kinds.indexOf(z.kind) < kinds.indexOf(kind));
 const sectorName = (value: string) => ['company','hospital','hotel','property','other'].includes(value) ? (t as Record<string,string>)[value] : value;
 return <section className="sites-surface" aria-label={t.title}>
  {selected && <button className="back-button" disabled={saving} onClick={() => open(null)}><BackIcon />{t.back}</button>}
  <div className="section-heading">
   <div><h2 tabIndex={-1} ref={heading}>{selected?.name ?? t.title}</h2><p>{selected ? `${sectorName(selected.sector)} · ${selected.timezone}` : writable ? t.intro : t.readOnly}</p></div>
   {writable && !form && (!selected || (!loading && !loadError)) && <button className="primary" disabled={saving} onClick={() => showForm(selected ? 'zone' : 'site')}><PlusIcon />{selected ? t.createZone : t.createSite}</button>}
  </div>
  {notice && <p className="save-notice" role="status">{t[notice]}</p>}
  {form && <section className="form-panel"><h3 ref={formHeading} tabIndex={-1}>{form === 'site' ? t.createSite : t.createZone}</h3>
   <form onSubmit={event => void submit(event)}><fieldset disabled={saving}>
    <label>{form === 'site' ? t.siteName : t.name}<input name="name" required maxLength={120}/></label>
    {form === 'site' ? <>
     <label>{t.sector}<select aria-label={t.sector} value={sector} onChange={e => setSector(e.target.value)}>{(['company','hospital','hotel','property','other'] as const).map(k => <option key={k} value={k}>{t[k]}</option>)}</select></label>
     {sector === 'other' && <label>{t.otherSector}<input name="otherSector" required maxLength={120}/></label>}
     <label>{t.timezone}<input name="timezone" required defaultValue="Africa/Douala" maxLength={120}/></label>
    </> : <>
     <label>{t.code}<input aria-label={t.code} name="code" required maxLength={120} aria-describedby="zone-code-help" className="code-input"/><small id="zone-code-help">{t.codeHelp}</small></label>
     <label>{t.kind}<select aria-label={t.kind} value={kind} onChange={e => setKind(e.target.value as Kind)}>{kinds.map(k => <option key={k} value={k}>{t[k]}</option>)}</select></label>
     <label>{t.parent}<select aria-label={t.parent} name="parentId" key={kind} defaultValue=""><option value="">{t.root}</option>{parents.map(z => <option key={z.id} value={z.id}>{[...ancestors(z), `${z.name} (${z.code})`].join(' / ')}</option>)}</select></label>
    </>}
    {reason}
   </fieldset>
   {saveError && <div className="error" role="alert">{message(saveError, t.saveError)}</div>}
   <div className="actions"><button className="primary" disabled={saving}>{saving ? t.loading : t.save}</button><button type="button" className="secondary" disabled={saving} onClick={() => { setForm(null); setSaveError(''); heading.current?.focus(); }}>{t.cancel}</button></div>
   </form>
  </section>}
  {loading ? <div className="skeleton" role="status"><span className="sr-only">{t.loading}</span>{[0, 1, 2].map(i => <span key={i} className="skeleton-row" />)}</div>
   : loadError ? <div className="error" role="alert"><p>{message(loadError, t.error)}</p><button className="secondary" onClick={() => setReload(n => n + 1)}>{t.retry}</button></div>
   : !selected ? sites.length ? <ul className="site-list">{sites.map(site => <li key={site.id}><button className="site-link" onClick={() => open(site)} disabled={saving}><span className="site-text"><strong>{site.name}</strong><span>{sectorName(site.sector)} · {site.timezone}</span></span><ChevronIcon /></button></li>)}</ul>
   : <div className="empty"><h3>{t.empty}</h3><p>{writable ? t.emptyHelp : t.emptyRead}</p></div>
   : zones.length ? <section aria-label={t.places}><label className="location-search"><span>{t.search}</span><span className="search-field"><SearchIcon /><input type="search" value={query} onChange={e => setQuery(e.target.value)}/></span></label>
    {visible.length ? <ul className="zone-list">{visible.map(zone => <li key={zone.id}><div><strong>{zone.name}</strong><span className="zone-path">{ancestors(zone).join(' › ') || t.root}</span></div><div className="zone-meta"><span className="zone-kind">{t[zone.kind]}</span><span className="zone-code">{zone.code}</span></div></li>)}</ul> : <div className="empty"><p>{t.noMatch}</p><button className="secondary" onClick={() => setQuery('')}>{t.clear}</button></div>}
   </section> : <div className="empty"><h3>{t.noZones}</h3><p>{writable ? t.noZonesHelp : t.noZonesRead}</p></div>}
 </section>;
}
