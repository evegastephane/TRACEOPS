/**
 * Figures for the dashboards, computed in the browser from the intervention list the server already
 * filtered by the user's rights. Nothing here is invented: every number is a count or a delay read
 * from real interventions, and a figure without data says so (null) instead of showing zero.
 */

export type Item = {
  id: string; number: number; kind: 'CLEANING' | 'MAINTENANCE'; title: string; status: string; priority: string;
  starts_at: string; ends_at: string; programme_id: string | null; site_name: string; timezone: string;
  client_name: string; provider_name: string; agents: { name: string; lead: boolean }[]; zones: string[];
  open_anomalies: number; tasks_total: number; tasks_done: number; round?: number;
  started_at?: string | null; submitted_at?: string | null; accepted_at?: string | null;
  created_at?: string; created_by_name?: string | null;
  /** Latest author and date of each signed step (event action → who, when). */
  visas?: Record<string, { by: string; at: string }> | null;
};

/** The chain of custody, in order: who holds the intervention at each step. */
export const steps = ['request', 'quote', 'assign', 'work', 'review', 'accepted'] as const;
export type Step = typeof steps[number];
export const stepOf = (status: string): Step | null => ({
  REQUESTED: 'request', QUOTE_REFUSED: 'request', QUOTE_SUBMITTED: 'quote', PLANNED: 'assign',
  ASSIGNED: 'work', IN_PROGRESS: 'work', REWORK: 'work', UNDER_REVIEW: 'review', ACCEPTED: 'accepted',
} as Record<string, Step>)[status] ?? null;

const HOUR = 3600000, DAY = 86400000;
export const dayKey = (iso: string | Date, tz: string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

/** Planned work whose start has passed without anyone starting it, or work still open after its slot. */
export function lateness(i: Item, now = Date.now()): 'late' | 'overrun' | null {
  if ((i.status === 'PLANNED' || i.status === 'ASSIGNED') && Date.parse(i.starts_at) < now) return 'late';
  if (i.status === 'IN_PROGRESS' && Date.parse(i.ends_at) < now) return 'overrun';
  return null;
}

/** How a passage reads on a day chart: its outcome when known, otherwise what it waits for. */
export type Band = 'accepted' | 'review' | 'rework' | 'late' | 'planned' | 'assign' | 'request';
export const bands: Band[] = ['accepted', 'review', 'rework', 'late', 'planned', 'assign', 'request'];
export function bandOf(i: Item, now = Date.now()): Band | null {
  if (i.status === 'CANCELLED') return null;
  if (i.status === 'ACCEPTED') return 'accepted';
  if (i.status === 'UNDER_REVIEW') return 'review';
  if (i.status === 'REWORK') return 'rework';
  if (lateness(i, now)) return 'late';
  if (i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS') return 'planned';
  if (i.status === 'PLANNED') return 'assign';
  return 'request';
}

export type DayColumn = { key: string; date: Date; isToday: boolean; isPast: boolean; counts: Record<Band, number>; total: number };
/** One column per calendar day (site time zone) from `from` to `to` included. */
export function perDay(items: Item[], from: Date, to: Date, tz: string, now = Date.now()): DayColumn[] {
  const today = dayKey(new Date(now), tz), out: DayColumn[] = [], index = new Map<string, DayColumn>();
  for (let t = from.getTime(); t <= to.getTime(); t += DAY) {
    const key = dayKey(new Date(t), tz);
    if (index.has(key)) continue;
    const col: DayColumn = { key, date: new Date(key + 'T12:00:00Z'), isToday: key === today, isPast: key < today, counts: Object.fromEntries(bands.map(b => [b, 0])) as Record<Band, number>, total: 0 };
    index.set(key, col); out.push(col);
  }
  for (const i of items) {
    const band = bandOf(i, now), col = index.get(dayKey(i.starts_at, i.timezone));
    if (!band || !col) continue;
    col.counts[band]++; col.total++;
  }
  return out;
}

const median = (values: number[]) => { if (!values.length) return null; const s = [...values].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export type Summary = {
  total: number; byStep: Record<Step, number>; rework: number; urgent: number; late: number; overrun: number; anomalies: number;
  /** Accepted without any rework, out of every intervention that went through a review decision. */
  firstPass: { accepted: number; reviewed: number; rate: number | null };
  /** Hours between the report and the client's acceptance (median). */
  reviewDelay: number | null;
  /** Share of started work that started no later than 15 minutes after the planned time. */
  punctuality: { onTime: number; started: number; rate: number | null };
  tasks: { done: number; total: number };
  quotesPending: number;
};
export function summarize(items: Item[], now = Date.now()): Summary {
  const live = items.filter(i => i.status !== 'CANCELLED');
  const byStep = Object.fromEntries(steps.map(s => [s, 0])) as Record<Step, number>;
  for (const i of live) { const s = stepOf(i.status); if (s) byStep[s]++; }
  const accepted = live.filter(i => i.status === 'ACCEPTED');
  const firstPassAccepted = accepted.filter(i => (i.round ?? 1) === 1).length;
  const reviewed = accepted.length + live.filter(i => i.status === 'REWORK' || (i.status === 'UNDER_REVIEW' && (i.round ?? 1) > 1)).length;
  const delays = accepted.filter(i => i.submitted_at && i.accepted_at).map(i => (Date.parse(i.accepted_at!) - Date.parse(i.submitted_at!)) / HOUR).filter(h => h >= 0);
  const started = live.filter(i => i.started_at);
  const onTime = started.filter(i => Date.parse(i.started_at!) <= Date.parse(i.starts_at) + 15 * 60000).length;
  return {
    total: live.length, byStep,
    rework: live.filter(i => i.status === 'REWORK').length,
    urgent: live.filter(i => i.priority === 'URGENT' && i.status !== 'ACCEPTED').length,
    late: live.filter(i => lateness(i, now) === 'late').length,
    overrun: live.filter(i => lateness(i, now) === 'overrun').length,
    anomalies: live.reduce((n, i) => n + i.open_anomalies, 0),
    firstPass: { accepted: firstPassAccepted, reviewed, rate: reviewed ? firstPassAccepted / reviewed : null },
    reviewDelay: median(delays),
    punctuality: { onTime, started: started.length, rate: started.length ? onTime / started.length : null },
    tasks: { done: live.reduce((n, i) => n + i.tasks_done, 0), total: live.reduce((n, i) => n + i.tasks_total, 0) },
    quotesPending: live.filter(i => i.status === 'QUOTE_SUBMITTED').length,
  };
}

/** First-pass acceptance per week (Monday start, site time zone), oldest first; weeks without a decision are null. */
export function weeklyFirstPass(items: Item[], weeks: number, tz: string, now = Date.now()) {
  const monday = (d: Date) => { const k = dayKey(d, tz), x = new Date(k + 'T00:00:00Z'); return new Date(x.getTime() - ((x.getUTCDay() + 6) % 7) * DAY); };
  const start = monday(new Date(now - (weeks - 1) * 7 * DAY));
  return Array.from({ length: weeks }, (_, w) => {
    const from = start.getTime() + w * 7 * DAY, to = from + 7 * DAY;
    const inWeek = items.filter(i => { const t = Date.parse(dayKey(i.starts_at, i.timezone) + 'T00:00:00Z'); return t >= from && t < to; });
    const accepted = inWeek.filter(i => i.status === 'ACCEPTED'), first = accepted.filter(i => (i.round ?? 1) === 1).length;
    const reviewed = accepted.length + inWeek.filter(i => i.status === 'REWORK' || (i.status === 'UNDER_REVIEW' && (i.round ?? 1) > 1)).length;
    return { week: new Date(from), reviewed, rate: reviewed ? first / reviewed : null };
  });
}

/** Interventions per partner (provider for a client, client for a provider), with how far each got. */
export function perPartner(items: Item[], side: 'provider' | 'client', now = Date.now()) {
  const map = new Map<string, { name: string; total: number; counts: Record<Band, number> }>();
  for (const i of items) {
    const band = bandOf(i, now); if (!band) continue;
    const name = side === 'provider' ? i.provider_name : i.client_name;
    const row = map.get(name) ?? { name, total: 0, counts: Object.fromEntries(bands.map(b => [b, 0])) as Record<Band, number> };
    row.total++; row.counts[band]++; map.set(name, row);
  }
  return [...map.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

/** The places that receive the most interventions in the period. */
export function perPlace(items: Item[], limit = 6) {
  const map = new Map<string, number>();
  for (const i of items) if (i.status !== 'CANCELLED') for (const z of i.zones) map.set(z, (map.get(z) ?? 0) + 1);
  return [...map.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)).slice(0, limit);
}
