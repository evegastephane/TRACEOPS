import React, { useEffect, useState } from 'react';
import { api } from './api';
import type { Lang } from './i18n';
import { BackIcon, ChevronIcon } from './icons';
import { Alert, Empty, PageHead, Sheet, Skeleton } from './ui';
import { addDays, dateText, fill, todayKey, type Ctx, type Org } from './procurement-model';

const fr = {
  title: 'Planning', availability: 'Disponibilités', provider: 'Prestataire', choose: 'Choisir un prestataire', week: 'Semaine du {d}', prev: 'Semaine précédente', next: 'Semaine suivante', thisWeek: 'Cette semaine',
  agents: '{n} agent(s) de terrain', free: 'Libre', partial: 'En partie occupé', full: 'Complet', none: 'Aucun agent déclaré', own: 'dont vos interventions', hour: 'Heure',
  cell: '{d}, {h} : {f} agent(s) libre(s) sur {n}', freeShare: '{p} % des heures libres cette semaine', absences: '{n} absence(s) déclarée(s)',
  intro: 'Les créneaux où le prestataire a des agents libres, calculés sur ses missions chez tous ses clients (sans jamais les nommer) et sur les absences déclarées.',
  introOwn: 'Vos créneaux libres, tels que vos clients les voient : missions affectées et absences déclarées de vos agents.',
  noProvider: 'Aucun prestataire à afficher : les disponibilités sont visibles pour les prestataires rattachés, consultés ou sous contrat.',
  loading: 'Chargement…', retry: 'Réessayer', loadError: 'Impossible de charger les disponibilités. Réessayez.',
};
type T = typeof fr;
const en: T = {
  title: 'Planning', availability: 'Availability', provider: 'Provider', choose: 'Choose a provider', week: 'Week of {d}', prev: 'Previous week', next: 'Next week', thisWeek: 'This week',
  agents: '{n} field agent(s)', free: 'Free', partial: 'Partly busy', full: 'Fully booked', none: 'No agent declared', own: 'of which your work', hour: 'Hour',
  cell: '{d}, {h}: {f} agent(s) free of {n}', freeShare: '{p}% of the hours free this week', absences: '{n} absence(s) declared',
  intro: 'The slots where the provider has free agents, computed from its missions for all its clients (never named) and from declared absences.',
  introOwn: 'Your free slots, as your clients see them: assigned missions and declared absences of your agents.',
  noProvider: 'No provider to show: availability is visible for providers linked, consulted or under contract.',
  loading: 'Loading…', retry: 'Try again', loadError: 'The availability could not be loaded. Try again.',
};
type Data = { provider: { id: string; name: string }; agents: number; from: string; hours: [number, number]; days: { date: string; hours: { busy: number; own: number }[]; absent: number }[] };
const mondayOf = (date: string) => addDays(date, -((new Date(date + 'T12:00:00Z').getUTCDay() + 6) % 7));
const loc = (lang: Lang) => lang === 'fr' ? 'fr-FR' : 'en-GB';

/** One week, hour by hour: how many of the provider's agents are free. */
export function AvailabilityGrid({ org, providerId, lang }: { org: { id: string; kind: string }; providerId: string; lang: Lang }) {
  const t = lang === 'fr' ? fr : en;
  const [from, setFrom] = useState(() => mondayOf(todayKey())), [data, setData] = useState<Data | null>(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => { let a = true; setFailed(false); api(`providers/${providerId}/availability?from=${from}&days=7`, undefined, org.id).then(r => { if (a) setData(r); }).catch(() => { if (a) setFailed(true); }); return () => { a = false; }; }, [providerId, from, org.id, attempt]);
  if (failed) return <Alert retry={() => setAttempt(n => n + 1)} retryLabel={t.retry}>{t.loadError}</Alert>;
  if (!data) return <Skeleton label={t.loading} rows={4} />;
  const n = data.agents, [h0, h1] = data.hours, hours = Array.from({ length: h1 - h0 }, (_, i) => h0 + i);
  const slots = data.days.flatMap(d => d.hours), freeShare = n ? Math.round((slots.reduce((s, x) => s + (n - x.busy), 0) / (slots.length * n)) * 100) : 0;
  const absences = data.days.reduce((s, d) => s + d.absent, 0), today = todayKey();
  const tone = (busy: number) => !n ? 'none' : busy === 0 ? 'free' : busy >= n ? 'full' : 'partial';
  const dayName = (d: string, style: 'short' | 'long') => new Date(d + 'T12:00:00Z').toLocaleDateString(loc(lang), { weekday: style, day: 'numeric', month: style === 'long' ? 'long' : undefined, timeZone: 'UTC' });
  return <div className="availability">
    <div className="availability-head">
      <div><strong>{data.provider.name}</strong><span className="muted"> · {fill(t.agents, { n })}{n ? ` · ${fill(t.freeShare, { p: freeShare })}` : ''}{absences ? ` · ${fill(t.absences, { n: absences })}` : ''}</span></div>
      <div className="toolbar-actions">
        <button className="secondary icon-only small" aria-label={t.prev} onClick={() => setFrom(f => addDays(f, -7))}><BackIcon /></button>
        <button className="secondary small" onClick={() => setFrom(mondayOf(todayKey()))}>{fill(t.week, { d: dateText(from, lang) })}</button>
        <button className="secondary icon-only small" aria-label={t.next} onClick={() => setFrom(f => addDays(f, 7))}><ChevronIcon /></button>
      </div>
    </div>
    <div className="availability-scroll" role="region" aria-label={t.availability} tabIndex={0}>
      <table className="availability-grid">
        <thead><tr><th scope="col" className="av-hour">{t.hour}</th>{data.days.map(d => <th key={d.date} scope="col" className={d.date === today ? 'is-today' : undefined}><span>{dayName(d.date, 'short')}</span></th>)}</tr></thead>
        <tbody>{hours.map((h, hi) => <tr key={h}><th scope="row" className="av-hour">{String(h).padStart(2, '0')}:00</th>{data.days.map(d => {
          const x = d.hours[hi]!, free = Math.max(0, n - x.busy);
          return <td key={d.date} className={`av-cell is-${tone(x.busy)}${d.date === today ? ' is-today' : ''}`} title={fill(t.cell, { d: dayName(d.date, 'long'), h: `${String(h).padStart(2, '0')}:00`, f: free, n })}>
            <span className="sr-only">{fill(t.cell, { d: dayName(d.date, 'long'), h: `${String(h).padStart(2, '0')}:00`, f: free, n })}</span>
            <span aria-hidden="true">{n ? free : ''}</span>{x.own > 0 && <i className="av-own" aria-hidden="true" />}</td>;
        })}</tr>)}</tbody>
      </table>
    </div>
    <ul className="legend availability-legend">
      <li><span className="swatch av-free" />{t.free}</li><li><span className="swatch av-partial" />{t.partial}</li><li><span className="swatch av-full" />{t.full}</li>
      {org.kind === 'CLIENT' && <li><i className="av-own static" aria-hidden="true" />{t.own}</li>}
      {!n && <li className="muted">{t.none}</li>}
    </ul>
  </div>;
}

/** The planning's availability view: a client picks one of its providers; a provider sees itself. */
export function AvailabilityView({ org, lang, ctx, switcher }: { org: Org; lang: Lang; ctx: Ctx; switcher?: React.ReactNode }) {
  const t = lang === 'fr' ? fr : en;
  const client = org.kind === 'CLIENT';
  const [providers, setProviders] = useState<{ id: string; name: string }[] | null>(client ? null : [{ id: org.id, name: org.name }]), [pick, setPick] = useState(client ? '' : org.id), [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!client) return;
    api('organization/directory', undefined, org.id).then((list: { id: string; name: string; site_ids: string[]; under_contract: boolean; open_tenders: number }[]) => {
      const related = list.filter(p => p.site_ids.length || p.under_contract || p.open_tenders);
      setProviders(related); setPick(p => p || related[0]?.id || '');
    }).catch(() => setFailed(true));
  }, [org.id, client]);
  return <section className="planning availability-page">
    <PageHead title={t.title} subtitle={ctx.subtitle} cells={[{ label: t.availability, value: providers?.find(p => p.id === pick)?.name ?? '–' }]} />
    <div className="toolbar">{switcher}{client && providers && providers.length > 0 && <label className="inline-select">{t.provider}
      <select value={pick} onChange={e => setPick(e.target.value)}>{providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}</div>
    <Sheet id="availability" title={t.availability} meta={client ? undefined : org.name}>
      <p className="sheet-intro">{client ? t.intro : t.introOwn}</p>
      {failed ? <Alert>{t.loadError}</Alert> : !providers ? <Skeleton label={t.loading} /> : !providers.length || !pick ? <Empty>{t.noProvider}</Empty> : <AvailabilityGrid key={pick} org={org} providerId={pick} lang={lang} />}
    </Sheet>
  </section>;
}
