import React, { useState } from 'react';
import type { Lang } from './i18n';
import { Planning, type Ctx } from './interventions';
import { GanttView } from './gantt';
import { AvailabilityView } from './availability';

type Org = { id: string; name: string; kind: 'CLIENT' | 'PROVIDER'; roles?: string[] };
type View = 'week' | 'gantt' | 'availability';

/**
 * The planning in three views: the week of passages, the Gantt chart of everything dated (with earlier plannings imported
 * from Gantt files), and the providers' free and busy hours. Field agents keep the week of their own missions.
 */
export function PlanningPage({ org, lang, admin, ctx, onOpen, onOpenContract, onOpenTender }: { org: Org; lang: Lang; admin: boolean; ctx: Ctx;
  onOpen: (id: string) => void; onOpenContract: (id: string) => void; onOpenTender?: (id: string) => void }) {
  const roles = org.roles ?? [];
  const agentOnly = !admin && org.kind === 'PROVIDER' && roles.length > 0 && roles.every(r => r === 'FIELD_AGENT');
  const availability = admin || roles.includes('CLIENT_MANAGER') || roles.includes('PROVIDER_MANAGER');
  const [view, setView] = useState<View>('week');
  const labels: Record<View, string> = lang === 'fr' ? { week: 'Semaine', gantt: 'Gantt', availability: 'Disponibilités' } : { week: 'Week', gantt: 'Gantt', availability: 'Availability' };
  const views: View[] = agentOnly ? [] : availability ? ['week', 'gantt', 'availability'] : ['week', 'gantt'];
  const switcher = views.length ? <div className="segmented" role="group" aria-label={lang === 'fr' ? 'Vue du planning' : 'Planning view'}>
    {views.map(v => <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>{labels[v]}</button>)}</div> : undefined;
  if (view === 'gantt' && !agentOnly) return <GanttView org={org} lang={lang} ctx={ctx} switcher={switcher} onOpen={onOpen} onOpenContract={onOpenContract} onOpenTender={onOpenTender} />;
  if (view === 'availability' && availability) return <AvailabilityView org={org} lang={lang} ctx={ctx} switcher={switcher} />;
  return <Planning org={org} lang={lang} ctx={ctx} onOpen={onOpen} switcher={switcher} />;
}
