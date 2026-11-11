import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Module, NotFoundException, Param, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { AccountsModule } from '../accounts/accounts.controller.js';
import { AccountsService, field, uuid, type Identity } from '../accounts/accounts.service.js';
import { Database, DatabaseModule } from '../database.module.js';
import { readablePng, renderReport } from './report.js';

type Status = 'REQUESTED' | 'QUOTE_SUBMITTED' | 'QUOTE_REFUSED' | 'PLANNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'REWORK' | 'ACCEPTED' | 'CANCELLED';
type Row = { id: string; client_id: string; provider_id: string; site_id: string; status: Status; kind: string; starts_at: Date; ends_at: Date; submitted_by: string | null; round: number; quote_required: boolean; programme_id: string | null };
type Query = { query: (sql: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> };
const on = (tx: PoolClient | undefined, db: Database) => (tx ?? db) as unknown as Query;
type Scope = { user: Identity; org: string; kind: 'CLIENT' | 'PROVIDER'; roles: string[]; membership: string | null };
export type Action = 'QUOTE' | 'DECIDE_QUOTE' | 'ASSIGN' | 'START' | 'TASKS' | 'SUBMIT' | 'REVIEW' | 'CANCEL' | 'REPORT_ANOMALY' | 'PROPOSE_RESOLUTION' | 'CLOSE_ANOMALY';

const text = (body: unknown, name: string, max = 2000, required = false) => {
  const value = (body as Record<string, unknown> | null)?.[name];
  if (value === undefined || value === null || value === '') { if (required) throw new BadRequestException('INVALID_INPUT'); return null; }
  if (typeof value !== 'string' || value.length > max) throw new BadRequestException('INVALID_INPUT');
  const trimmed = value.trim(); if (required && !trimmed) throw new BadRequestException('INVALID_INPUT');
  return trimmed || null;
};
const list = (body: unknown, name: string, max = 40): unknown[] => {
  const value = (body as Record<string, unknown> | null)?.[name];
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > max) throw new BadRequestException('INVALID_INPUT');
  return value;
};

/** Offset of a time zone at an instant, in minutes. */
function offset(timeZone: string, at: number) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(new Date(at)).map(p => [p.type, p.value]));
  return (Date.UTC(+parts.year!, +parts.month! - 1, +parts.day!, +parts.hour!, +parts.minute!, +parts.second!) - at) / 60000;
}
/** A local date and time on a site ("2026-11-12", "06:00") to the exact instant. */
export function localInstant(date: string, time: string, timeZone: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new BadRequestException('INVALID_DATE');
  const [y, m, d] = date.split('-').map(Number), [h, min] = time.split(':').map(Number);
  const guess = Date.UTC(y!, m! - 1, d!, h!, min!);
  if (Number.isNaN(guess)) throw new BadRequestException('INVALID_DATE');
  return new Date(guess - offset(timeZone, guess) * 60000);
}
const splitLocal = (value: string | null) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new BadRequestException('INVALID_DATE');
  return value.split('T') as [string, string];
};

@Controller()
export class InterventionsController {
  constructor(private readonly db: Database, private readonly accounts: AccountsService) {}

  private async scope(req: Request): Promise<Scope> {
    const user = await this.accounts.identify(req.cookies?.traceops_session); this.accounts.ensureReady(user);
    const org = uuid(req.headers['x-organization-id']);
    const context = await this.accounts.context(user, org);
    const membership = (await this.db.query('SELECT id FROM membership WHERE user_id=$1 AND organization_id=$2 AND active', [user.id, org])).rows[0]?.id ?? null;
    return { user, org, kind: context.kind, roles: context.roles, membership };
  }
  private has(scope: Scope, role: string) { return scope.roles.includes(role); }

  /** What this person may do on this intervention, right now. The same rule guards every write. */
  private async allowed(scope: Scope, row: Row, tx?: PoolClient): Promise<Action[]> {
    const q = (sql: string, v: unknown[]) => on(tx, this.db).query(sql, v);
    if (scope.user.admin) return [];
    const actions: Action[] = [];
    const client = scope.kind === 'CLIENT' && row.client_id === scope.org, provider = scope.kind === 'PROVIDER' && row.provider_id === scope.org;
    const manager = client && this.has(scope, 'CLIENT_MANAGER');
    const controller = client && (manager || (this.has(scope, 'CLIENT_CONTROLLER') && Boolean((await q('SELECT 1 FROM site_grant WHERE membership_id=$1 AND site_id=$2', [scope.membership, row.site_id])).rowCount)));
    const providerManager = provider && this.has(scope, 'PROVIDER_MANAGER');
    const crew = provider && scope.membership ? (await q('SELECT lead FROM intervention_agent WHERE intervention_id=$1 AND membership_id=$2', [row.id, scope.membership])).rows[0] : undefined;
    const s = row.status;
    if (providerManager && ['REQUESTED', 'QUOTE_REFUSED'].includes(s) && row.quote_required) actions.push('QUOTE');
    if (manager && s === 'QUOTE_SUBMITTED') actions.push('DECIDE_QUOTE');
    if (providerManager && ['PLANNED', 'ASSIGNED'].includes(s)) actions.push('ASSIGN');
    if (crew && s === 'ASSIGNED') actions.push('START');
    if (crew && ['IN_PROGRESS', 'REWORK'].includes(s)) actions.push('TASKS');
    if (crew?.lead && ['IN_PROGRESS', 'REWORK'].includes(s)) actions.push('SUBMIT');
    if (controller && s === 'UNDER_REVIEW' && row.submitted_by !== scope.user.id) actions.push('REVIEW');
    if (manager && ['REQUESTED', 'QUOTE_SUBMITTED', 'QUOTE_REFUSED', 'PLANNED', 'ASSIGNED'].includes(s)) actions.push('CANCEL');
    if ((crew || providerManager || controller) && !['CANCELLED'].includes(s)) actions.push('REPORT_ANOMALY');
    if (providerManager) actions.push('PROPOSE_RESOLUTION');
    if (manager || controller) actions.push('CLOSE_ANOMALY');
    return actions;
  }
  private async load(scope: Scope, id: string, tx?: PoolClient, lock = false): Promise<Row> {
    uuid(id);
    const row = (await on(tx, this.db).query(`SELECT * FROM intervention WHERE id=$1${lock ? ' FOR UPDATE' : ''}`, [id])).rows[0] as Row | undefined;
    if (!row || !(await this.visible(scope, row, tx))) throw new NotFoundException('INTERVENTION_NOT_FOUND');
    return row;
  }
  private async visible(scope: Scope, row: Row, tx?: PoolClient) {
    if (scope.user.admin) return row.client_id === scope.org || row.provider_id === scope.org;
    if (scope.kind === 'CLIENT') {
      if (row.client_id !== scope.org) return false;
      if (this.has(scope, 'CLIENT_MANAGER')) return true;
      return Boolean((await on(tx, this.db).query('SELECT 1 FROM site_grant WHERE membership_id=$1 AND site_id=$2', [scope.membership, row.site_id])).rowCount);
    }
    if (row.provider_id !== scope.org) return false;
    if (this.has(scope, 'PROVIDER_MANAGER')) return true;
    return Boolean((await on(tx, this.db).query('SELECT 1 FROM intervention_agent WHERE intervention_id=$1 AND membership_id=$2', [row.id, scope.membership])).rowCount);
  }
  /** Runs a guarded transition: locks the row, checks the action is allowed, records the event and the audit. */
  private async step<T>(req: Request, id: string, action: Action, work: (tx: PoolClient, row: Row, scope: Scope) => Promise<{ to?: Status; event: string; reason?: string | null; result?: T }>) {
    const scope = await this.scope(req);
    return this.db.transaction(async tx => {
      const row = await this.load(scope, id, tx, true);
      if (!(await this.allowed(scope, row, tx)).includes(action)) throw new ForbiddenException('ACTION_NOT_ALLOWED');
      const out = await work(tx, row, scope);
      if (out.to && out.to !== row.status) await tx.query('UPDATE intervention SET status=$2 WHERE id=$1', [id, out.to]);
      await tx.query('INSERT INTO intervention_event(id,intervention_id,actor_id,action,from_status,to_status,reason) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [randomUUID(), id, scope.user.id, out.event, row.status, out.to ?? row.status, out.reason ?? null]);
      await this.accounts.audit(tx, scope.user.id, scope.org, 'INTERVENTION_' + out.event, id, out.reason ?? undefined);
      return out.result ?? { ok: true };
    });
  }

  /* ---------------------------------------------------------------- reading */

  @Get('interventions') async list(@Req() req: Request, @Query() query: Record<string, string>) {
    const scope = await this.scope(req);
    const from = query.from && !Number.isNaN(Date.parse(query.from)) ? query.from : null, to = query.to && !Number.isNaN(Date.parse(query.to)) ? query.to : null;
    const rows = (await this.db.query(`SELECT i.id,i.number,i.kind,i.title,i.status,i.priority,i.starts_at,i.ends_at,i.programme_id,i.quote_required,i.round,
        i.started_at,i.submitted_at,i.accepted_at,i.created_at,
        (SELECT u.display_name FROM app_user u WHERE u.id=i.created_by) AS created_by_name,
        -- The latest author and date of each signed step, for the visa band of list rows.
        (SELECT json_object_agg(x.action,json_build_object('by',x.name,'at',x.at)) FROM (SELECT DISTINCT ON (e.action) e.action,u.display_name AS name,e.created_at AS at
          FROM intervention_event e JOIN app_user u ON u.id=e.actor_id WHERE e.intervention_id=i.id AND e.action IN ('REQUESTED','SCHEDULED','QUOTE_ACCEPTED','ASSIGNED','SUBMITTED','RESUBMITTED','ACCEPTED','REWORK_REQUESTED')
          ORDER BY e.action,e.created_at DESC) x) AS visas,
        s.name AS site_name,s.timezone,c.name AS client_name,p.name AS provider_name,
        COALESCE((SELECT json_agg(json_build_object('name',u.display_name,'lead',a.lead) ORDER BY a.lead DESC,u.display_name) FROM intervention_agent a JOIN membership m ON m.id=a.membership_id JOIN app_user u ON u.id=m.user_id WHERE a.intervention_id=i.id),'[]') AS agents,
        COALESCE((SELECT json_agg(z.name ORDER BY z.code) FROM intervention_zone iz JOIN zone z ON z.id=iz.zone_id WHERE iz.intervention_id=i.id),'[]') AS zones,
        (SELECT count(*)::int FROM anomaly a WHERE a.intervention_id=i.id AND a.status<>'CLOSED') AS open_anomalies,
        (SELECT count(*)::int FROM intervention_task t WHERE t.intervention_id=i.id) AS tasks_total,
        (SELECT count(*)::int FROM intervention_task t WHERE t.intervention_id=i.id AND t.status<>'TODO') AS tasks_done
      FROM intervention i JOIN site s ON s.id=i.site_id JOIN organization c ON c.id=i.client_id JOIN organization p ON p.id=i.provider_id
      WHERE (i.client_id=$1 OR i.provider_id=$1)
        AND ($2::timestamptz IS NULL OR i.ends_at>=$2) AND ($3::timestamptz IS NULL OR i.starts_at<$3)
        AND ($4::boolean OR (CASE WHEN $5='CLIENT' THEN i.client_id=$1 AND ($6::boolean OR EXISTS(SELECT 1 FROM site_grant g WHERE g.membership_id=$7 AND g.site_id=i.site_id))
              ELSE i.provider_id=$1 AND ($8::boolean OR EXISTS(SELECT 1 FROM intervention_agent a WHERE a.intervention_id=i.id AND a.membership_id=$7)) END))
      ORDER BY i.starts_at,i.number LIMIT 500`,
      [scope.org, from, to, scope.user.admin, scope.kind, this.has(scope, 'CLIENT_MANAGER'), scope.membership, this.has(scope, 'PROVIDER_MANAGER')])).rows;
    return rows;
  }

  @Get('interventions/:id') async detail(@Req() req: Request, @Param('id') id: string) {
    const scope = await this.scope(req);
    const row = await this.load(scope, id);
    const q = async (sql: string) => (await this.db.query(sql, [id])).rows;
    const [head] = await q(`SELECT i.*,s.name AS site_name,s.timezone,c.name AS client_name,p.name AS provider_name,pr.title AS programme_title,u.display_name AS created_by_name
      FROM intervention i JOIN site s ON s.id=i.site_id JOIN organization c ON c.id=i.client_id JOIN organization p ON p.id=i.provider_id
      LEFT JOIN programme pr ON pr.id=i.programme_id JOIN app_user u ON u.id=i.created_by WHERE i.id=$1`);
    const zones = await q(`WITH RECURSIVE path AS (SELECT z.id AS leaf,z.parent_id,z.name,0 AS depth FROM intervention_zone iz JOIN zone z ON z.id=iz.zone_id WHERE iz.intervention_id=$1
        UNION ALL SELECT p.leaf,z.parent_id,z.name,p.depth+1 FROM path p JOIN zone z ON z.id=p.parent_id)
      SELECT z.id,z.code,z.name,z.kind,COALESCE((SELECT array_agg(name ORDER BY depth DESC) FROM path WHERE leaf=z.id AND depth>0),'{}') AS path
      FROM intervention_zone iz JOIN zone z ON z.id=iz.zone_id WHERE iz.intervention_id=$1 ORDER BY z.code`);
    const tasks = await q(`SELECT t.id,t.position,t.label,t.status,t.note,t.rework,t.done_at,u.display_name AS done_by FROM intervention_task t LEFT JOIN app_user u ON u.id=t.done_by WHERE t.intervention_id=$1 ORDER BY t.position`);
    const agents = await q(`SELECT a.membership_id,a.lead,u.display_name,u.login FROM intervention_agent a JOIN membership m ON m.id=a.membership_id JOIN app_user u ON u.id=m.user_id WHERE a.intervention_id=$1 ORDER BY a.lead DESC,u.display_name`);
    const quotes = await q(`SELECT q.id,q.amount_xaf,q.delay_days,q.description,q.status,q.reason,q.created_at,q.decided_at,u.display_name AS created_by,d.display_name AS decided_by
      FROM quote q JOIN app_user u ON u.id=q.created_by LEFT JOIN app_user d ON d.id=q.decided_by WHERE q.intervention_id=$1 ORDER BY q.created_at`);
    const photos = await q(`SELECT ph.id,ph.task_id,ph.phase,ph.round,ph.size,ph.created_at,u.display_name AS uploaded_by FROM intervention_photo ph JOIN app_user u ON u.id=ph.uploaded_by WHERE ph.intervention_id=$1 ORDER BY ph.created_at`);
    const anomalies = await q(`SELECT a.id,a.title,a.description,a.status,a.resolution,a.closing_note,a.created_at,a.closed_at,z.name AS zone_name,u.display_name AS created_by,c.display_name AS closed_by
      FROM anomaly a JOIN app_user u ON u.id=a.created_by LEFT JOIN app_user c ON c.id=a.closed_by LEFT JOIN zone z ON z.id=a.zone_id WHERE a.intervention_id=$1 ORDER BY a.created_at`);
    const events = await q(`SELECT e.id,e.action,e.from_status,e.to_status,e.reason,e.created_at,u.display_name AS actor FROM intervention_event e JOIN app_user u ON u.id=e.actor_id WHERE e.intervention_id=$1 ORDER BY e.created_at,e.id`);
    return { ...head, zones, tasks, agents, quotes, photos, anomalies, events, actions: await this.allowed(scope, row) };
  }

  /* ----------------------------------------------------- creating the work */

  /** Client: a one-off maintenance request, with or without a prior quote. */
  @Post('interventions') async create(@Req() req: Request, @Body() body: unknown) {
    const scope = await this.scope(req);
    if (scope.user.admin || scope.kind !== 'CLIENT' || !this.has(scope, 'CLIENT_MANAGER')) throw new ForbiddenException('FORBIDDEN');
    const title = text(body, 'title', 200, true)!, description = text(body, 'description', 4000);
    const site = uuid(field(body, 'siteId')), provider = uuid(field(body, 'providerId'));
    const priority = text(body, 'priority', 10) === 'URGENT' ? 'URGENT' : 'NORMAL';
    const quoteRequired = (body as Record<string, unknown>).quoteRequired === true;
    const zones = list(body, 'zoneIds').map(uuid), tasks = list(body, 'tasks', 30).map(t => { if (typeof t !== 'string' || !t.trim() || t.length > 300) throw new BadRequestException('INVALID_INPUT'); return t.trim(); });
    return this.db.transaction(async tx => {
      const s = (await tx.query('SELECT id,timezone FROM site WHERE id=$1 AND client_id=$2 AND active', [site, scope.org])).rows[0];
      if (!s) throw new BadRequestException('INVALID_SITE');
      await this.linked(tx, site, provider);
      const [startDate, startTime] = splitLocal(text(body, 'startsAt', 20)), [endDate, endTime] = splitLocal(text(body, 'endsAt', 20));
      const starts = localInstant(startDate, startTime, s.timezone), ends = localInstant(endDate, endTime, s.timezone);
      if (ends <= starts) throw new BadRequestException('INVALID_PERIOD');
      await this.zonesOf(tx, site, zones);
      const id = randomUUID();
      const status: Status = quoteRequired ? 'REQUESTED' : 'PLANNED';
      await tx.query(`INSERT INTO intervention(id,client_id,provider_id,site_id,kind,title,description,priority,starts_at,ends_at,status,quote_required,created_by)
        VALUES($1,$2,$3,$4,'MAINTENANCE',$5,$6,$7,$8,$9,$10,$11,$12)`, [id, scope.org, provider, site, title, description, priority, starts, ends, status, quoteRequired, scope.user.id]);
      for (const z of zones) await tx.query('INSERT INTO intervention_zone(intervention_id,zone_id) VALUES($1,$2)', [id, z]);
      for (const [i, label] of tasks.entries()) await tx.query('INSERT INTO intervention_task(id,intervention_id,position,label) VALUES($1,$2,$3,$4)', [randomUUID(), id, i + 1, label]);
      await tx.query('INSERT INTO intervention_event(id,intervention_id,actor_id,action,to_status) VALUES($1,$2,$3,$4,$5)', [randomUUID(), id, scope.user.id, 'REQUESTED', status]);
      await this.accounts.audit(tx, scope.user.id, scope.org, 'INTERVENTION_REQUESTED', id);
      return { id };
    });
  }
  private async linked(tx: PoolClient, site: string, provider: string) {
    const ok = (await tx.query(`SELECT 1 FROM service_agreement WHERE site_id=$1 AND provider_id=$2 AND active AND (ends_at IS NULL OR ends_at>now())`, [site, provider])).rowCount;
    if (!ok) throw new BadRequestException('PROVIDER_NOT_LINKED');
  }
  private async zonesOf(tx: PoolClient, site: string, zones: string[]) {
    if (!zones.length) throw new BadRequestException('ZONE_REQUIRED');
    const n = (await tx.query('SELECT count(*)::int AS n FROM zone WHERE id=ANY($1) AND site_id=$2 AND active', [zones, site])).rows[0].n;
    if (n !== new Set(zones).size) throw new BadRequestException('INVALID_ZONE');
  }

  /** Client: a recurring cleaning programme under a contract. Each passage is generated as its own intervention. */
  @Post('programmes') async programme(@Req() req: Request, @Body() body: unknown) {
    const scope = await this.scope(req);
    if (scope.user.admin || scope.kind !== 'CLIENT' || !this.has(scope, 'CLIENT_MANAGER')) throw new ForbiddenException('FORBIDDEN');
    const title = text(body, 'title', 200, true)!, description = text(body, 'description', 4000);
    const site = uuid(field(body, 'siteId')), provider = uuid(field(body, 'providerId'));
    const weekdays = [...new Set(list(body, 'weekdays', 7).map(Number))];
    if (!weekdays.length || weekdays.some(d => !Number.isInteger(d) || d < 1 || d > 7)) throw new BadRequestException('INVALID_WEEKDAYS');
    const startDate = text(body, 'startDate', 10, true)!, endDate = text(body, 'endDate', 10, true)!, startTime = text(body, 'startTime', 5, true)!, endTime = text(body, 'endTime', 5, true)!;
    const zones = list(body, 'zoneIds').map(uuid), tasks = list(body, 'tasks', 30).map(t => { if (typeof t !== 'string' || !t.trim() || t.length > 300) throw new BadRequestException('INVALID_INPUT'); return t.trim(); });
    return this.db.transaction(async tx => {
      const s = (await tx.query('SELECT id,timezone FROM site WHERE id=$1 AND client_id=$2 AND active', [site, scope.org])).rows[0];
      if (!s) throw new BadRequestException('INVALID_SITE');
      await this.linked(tx, site, provider); await this.zonesOf(tx, site, zones);
      const dates = passages(startDate, endDate, weekdays);
      if (!dates.length) throw new BadRequestException('NO_PASSAGE');
      if (dates.length > 400) throw new BadRequestException('TOO_MANY_PASSAGES');
      if (localInstant(dates[0]!, endTime, s.timezone) <= localInstant(dates[0]!, startTime, s.timezone)) throw new BadRequestException('INVALID_PERIOD');
      const id = randomUUID();
      await tx.query(`INSERT INTO programme(id,client_id,provider_id,site_id,title,description,weekdays,start_date,end_date,start_time,end_time,zone_ids,tasks,created_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [id, scope.org, provider, site, title, description, weekdays, startDate, endDate, startTime, endTime, zones, tasks, scope.user.id]);
      for (const date of dates) await createPassage(tx, { id, client: scope.org, provider, site, title, description, zones, tasks, team: [], lead: null, actor: scope.user.id }, localInstant(date, startTime, s.timezone), localInstant(date, endTime, s.timezone));
      await this.accounts.audit(tx, scope.user.id, scope.org, 'PROGRAMME_CREATED', id);
      return { id, passages: dates.length };
    });
  }
  @Get('programmes') async programmes(@Req() req: Request) {
    const scope = await this.scope(req);
    return (await this.db.query(`SELECT pr.id,pr.title,pr.weekdays,pr.start_date::text,pr.end_date::text,to_char(pr.start_time,'HH24:MI') AS start_time,to_char(pr.end_time,'HH24:MI') AS end_time,pr.active,pr.team,pr.lead_membership_id,
        s.name AS site_name,c.name AS client_name,p.name AS provider_name,
        (SELECT count(*)::int FROM intervention i WHERE i.programme_id=pr.id) AS passages,
        (SELECT count(*)::int FROM intervention i WHERE i.programme_id=pr.id AND i.status='ACCEPTED') AS accepted
      FROM programme pr JOIN site s ON s.id=pr.site_id JOIN organization c ON c.id=pr.client_id JOIN organization p ON p.id=pr.provider_id
      WHERE pr.client_id=$1 OR pr.provider_id=$1 ORDER BY pr.start_date DESC`, [scope.org])).rows;
  }
  /** Provider: the team that covers every future passage of a programme not yet started. */
  @Post('programmes/:id/team') async programmeTeam(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const scope = await this.scope(req);
    if (scope.user.admin || scope.kind !== 'PROVIDER' || !this.has(scope, 'PROVIDER_MANAGER')) throw new ForbiddenException('FORBIDDEN');
    const team = [...new Set(list(body, 'membershipIds', 20).map(uuid))], lead = uuid(field(body, 'leadId'));
    if (!team.includes(lead)) throw new BadRequestException('LEAD_NOT_IN_TEAM');
    return this.db.transaction(async tx => {
      const pr = (await tx.query('SELECT * FROM programme WHERE id=$1 AND provider_id=$2 FOR UPDATE', [uuid(id), scope.org])).rows[0];
      if (!pr) throw new NotFoundException('PROGRAMME_NOT_FOUND');
      await this.agentsOf(tx, scope.org, team);
      await tx.query('UPDATE programme SET team=$2,lead_membership_id=$3 WHERE id=$1', [pr.id, team, lead]);
      const future = (await tx.query(`SELECT * FROM intervention WHERE programme_id=$1 AND status IN ('PLANNED','ASSIGNED') AND starts_at>now() FOR UPDATE`, [pr.id])).rows as Row[];
      let skipped = 0;
      for (const row of future) {
        if (await this.busy(tx, team, row)) { skipped++; continue; }
        await this.setCrew(tx, row.id, team, lead);
        if (row.status === 'PLANNED') await tx.query(`UPDATE intervention SET status='ASSIGNED' WHERE id=$1`, [row.id]);
        await tx.query('INSERT INTO intervention_event(id,intervention_id,actor_id,action,from_status,to_status) VALUES($1,$2,$3,$4,$5,$6)', [randomUUID(), row.id, scope.user.id, 'ASSIGNED', row.status, 'ASSIGNED']);
      }
      await this.accounts.audit(tx, scope.user.id, scope.org, 'PROGRAMME_TEAM_SET', pr.id);
      return { assigned: future.length - skipped, skipped };
    });
  }

  /* ------------------------------------------------------------ the journey */

  @Post('interventions/:id/quote') quote(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const amount = Number((body as Record<string, unknown>)?.amount), delay = Number((body as Record<string, unknown>)?.delayDays);
    if (!Number.isInteger(amount) || amount <= 0 || amount > 1e12 || !Number.isInteger(delay) || delay < 0 || delay > 365) throw new BadRequestException('INVALID_QUOTE');
    const description = text(body, 'description', 4000, true)!;
    return this.step(req, id, 'QUOTE', async (tx, row, scope) => {
      await tx.query('INSERT INTO quote(id,intervention_id,amount_xaf,delay_days,description,created_by) VALUES($1,$2,$3,$4,$5,$6)', [randomUUID(), row.id, amount, delay, description, scope.user.id]);
      return { to: 'QUOTE_SUBMITTED', event: 'QUOTE_SUBMITTED' };
    });
  }
  @Post('interventions/:id/quote/decision') decideQuote(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const accept = (body as Record<string, unknown>)?.accept === true, reason = text(body, 'reason', 1000);
    if (!accept && !reason) throw new BadRequestException('REASON_REQUIRED');
    return this.step(req, id, 'DECIDE_QUOTE', async (tx, row, scope) => {
      await tx.query(`UPDATE quote SET status=$2,reason=$3,decided_by=$4,decided_at=now() WHERE intervention_id=$1 AND status='PENDING'`, [row.id, accept ? 'ACCEPTED' : 'REFUSED', reason, scope.user.id]);
      return { to: accept ? 'PLANNED' : 'QUOTE_REFUSED', event: accept ? 'QUOTE_ACCEPTED' : 'QUOTE_REFUSED', reason };
    });
  }
  @Post('interventions/:id/assign') assign(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const team = [...new Set(list(body, 'membershipIds', 20).map(uuid))], lead = uuid(field(body, 'leadId'));
    if (!team.includes(lead)) throw new BadRequestException('LEAD_NOT_IN_TEAM');
    return this.step(req, id, 'ASSIGN', async (tx, row, scope) => {
      await this.agentsOf(tx, scope.org, team);
      if (await this.busy(tx, team, row)) throw new ConflictException('AGENT_BUSY');
      await this.setCrew(tx, row.id, team, lead);
      return { to: 'ASSIGNED', event: 'ASSIGNED' };
    });
  }
  private async agentsOf(tx: PoolClient, org: string, team: string[]) {
    if (!team.length) throw new BadRequestException('TEAM_REQUIRED');
    const n = (await tx.query(`SELECT count(DISTINCT m.id)::int AS n FROM membership m JOIN membership_role r ON r.membership_id=m.id WHERE m.id=ANY($1) AND m.organization_id=$2 AND m.active AND r.role='FIELD_AGENT'`, [team, org])).rows[0].n;
    if (n !== team.length) throw new BadRequestException('INVALID_AGENT');
  }
  /** An agent cannot be on two missions at once (half-open intervals: back-to-back is fine). */
  private async busy(tx: PoolClient, team: string[], row: Row) {
    return Boolean((await tx.query(`SELECT 1 FROM intervention_agent a JOIN intervention i ON i.id=a.intervention_id
      WHERE a.membership_id=ANY($1) AND i.id<>$2 AND i.status IN ('ASSIGNED','IN_PROGRESS','REWORK') AND i.starts_at<$4 AND $3<i.ends_at LIMIT 1`, [team, row.id, row.starts_at, row.ends_at])).rowCount);
  }
  private async setCrew(tx: PoolClient, id: string, team: string[], lead: string) {
    await tx.query('DELETE FROM intervention_agent WHERE intervention_id=$1', [id]);
    for (const m of team) await tx.query('INSERT INTO intervention_agent(intervention_id,membership_id,lead) VALUES($1,$2,$3)', [id, m, m === lead]);
  }
  @Post('interventions/:id/start') start(@Req() req: Request, @Param('id') id: string) {
    return this.step(req, id, 'START', async (tx, row) => {
      await tx.query('UPDATE intervention SET started_at=now() WHERE id=$1', [row.id]);
      return { to: 'IN_PROGRESS', event: 'STARTED' };
    });
  }
  @Post('interventions/:id/tasks/:taskId') task(@Req() req: Request, @Param('id') id: string, @Param('taskId') taskId: string, @Body() body: unknown) {
    const status = text(body, 'status', 20, true)!, note = text(body, 'note', 2000);
    if (!['TODO', 'DONE', 'IMPOSSIBLE'].includes(status)) throw new BadRequestException('INVALID_INPUT');
    if (status === 'IMPOSSIBLE' && !note) throw new BadRequestException('REASON_REQUIRED');
    return this.step(req, id, 'TASKS', async (tx, row, scope) => {
      const t = (await tx.query('UPDATE intervention_task SET status=$3,note=$4,done_by=CASE WHEN $3=\'TODO\' THEN NULL ELSE $5::uuid END,done_at=CASE WHEN $3=\'TODO\' THEN NULL ELSE now() END WHERE id=$1 AND intervention_id=$2 RETURNING label', [uuid(taskId), row.id, status, note, scope.user.id])).rows[0];
      if (!t) throw new NotFoundException('TASK_NOT_FOUND');
      return { event: 'TASK_' + status, reason: t.label + (note ? ' — ' + note : '') };
    });
  }
  @Post('interventions/:id/photos') async photo(@Req() req: Request, @Param('id') id: string, @Query() query: Record<string, string>) {
    const data = req.body as unknown;
    if (!Buffer.isBuffer(data) || !data.length) throw new BadRequestException('PHOTO_REQUIRED');
    const mime = data[0] === 0xff && data[1] === 0xd8 ? 'image/jpeg' : data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? 'image/png' : null;
    if (!mime || (mime === 'image/png' && !readablePng(data))) throw new BadRequestException('PHOTO_FORMAT');
    const phase = query.phase === 'BEFORE' ? 'BEFORE' : query.phase === 'AFTER' ? 'AFTER' : null;
    if (!phase) throw new BadRequestException('INVALID_INPUT');
    const task = query.taskId ? uuid(query.taskId) : null;
    return this.step(req, id, 'TASKS', async (tx, row, scope) => {
      if (task && !(await tx.query('SELECT 1 FROM intervention_task WHERE id=$1 AND intervention_id=$2', [task, row.id])).rowCount) throw new BadRequestException('TASK_NOT_FOUND');
      const count = (await tx.query('SELECT count(*)::int AS n FROM intervention_photo WHERE intervention_id=$1', [row.id])).rows[0].n;
      if (count >= 60) throw new BadRequestException('TOO_MANY_PHOTOS');
      const photo = randomUUID();
      await tx.query('INSERT INTO intervention_photo(id,intervention_id,task_id,phase,mime,data,size,round,uploaded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)', [photo, row.id, task, phase, mime, data, data.length, row.round, scope.user.id]);
      return { event: 'PHOTO_' + phase, result: { id: photo } };
    });
  }
  @Get('interventions/:id/photos/:photoId') async photoFile(@Req() req: Request, @Param('id') id: string, @Param('photoId') photoId: string, @Res() res: Response) {
    const scope = await this.scope(req); const row = await this.load(scope, id);
    const p = (await this.db.query('SELECT mime,data FROM intervention_photo WHERE id=$1 AND intervention_id=$2', [uuid(photoId), row.id])).rows[0];
    if (!p) throw new NotFoundException('PHOTO_NOT_FOUND');
    res.setHeader('Content-Type', p.mime); res.setHeader('Cache-Control', 'private, max-age=600'); res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(p.data);
  }
  @Post('interventions/:id/submit') submit(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const note = text(body, 'note', 4000);
    return this.step(req, id, 'SUBMIT', async (tx, row, scope) => {
      const pending = (await tx.query(`SELECT count(*)::int AS n FROM intervention_task WHERE intervention_id=$1 AND status='TODO'`, [row.id])).rows[0].n;
      if (pending) throw new BadRequestException('TASKS_PENDING');
      await tx.query('UPDATE intervention SET report_note=$2,submitted_at=now(),submitted_by=$3 WHERE id=$1', [row.id, note, scope.user.id]);
      return { to: 'UNDER_REVIEW', event: row.status === 'REWORK' ? 'RESUBMITTED' : 'SUBMITTED', reason: note };
    });
  }
  /** Client control: accept the work, or ask for rework on the named tasks only. Open anomalies stay open either way. */
  @Post('interventions/:id/review') review(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const decision = text(body, 'decision', 10, true), reason = text(body, 'reason', 2000), tasks = list(body, 'taskIds', 30).map(uuid);
    if (decision !== 'ACCEPT' && decision !== 'REWORK') throw new BadRequestException('INVALID_INPUT');
    if (decision === 'REWORK' && (!reason || !tasks.length)) throw new BadRequestException('REWORK_DETAILS_REQUIRED');
    return this.step(req, id, 'REVIEW', async (tx, row) => {
      if (decision === 'ACCEPT') {
        await tx.query('UPDATE intervention SET accepted_at=now() WHERE id=$1', [row.id]);
        return { to: 'ACCEPTED', event: 'ACCEPTED', reason };
      }
      const r = await tx.query(`UPDATE intervention_task SET status='TODO',rework=true,done_by=NULL,done_at=NULL WHERE intervention_id=$1 AND id=ANY($2)`, [row.id, tasks]);
      if (r.rowCount !== tasks.length) throw new BadRequestException('TASK_NOT_FOUND');
      await tx.query('UPDATE intervention SET round=round+1 WHERE id=$1', [row.id]);
      return { to: 'REWORK', event: 'REWORK_REQUESTED', reason };
    });
  }
  @Post('interventions/:id/cancel') cancel(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const reason = text(body, 'reason', 1000, true);
    return this.step(req, id, 'CANCEL', async () => ({ to: 'CANCELLED', event: 'CANCELLED', reason }));
  }
  @Post('interventions/:id/anomalies') anomaly(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const title = text(body, 'title', 200, true), description = text(body, 'description', 4000), zone = (body as Record<string, unknown>)?.zoneId ? uuid((body as Record<string, unknown>).zoneId) : null;
    return this.step(req, id, 'REPORT_ANOMALY', async (tx, row, scope) => {
      if (zone && !(await tx.query('SELECT 1 FROM intervention_zone WHERE intervention_id=$1 AND zone_id=$2', [row.id, zone])).rowCount) throw new BadRequestException('INVALID_ZONE');
      const a = randomUUID();
      await tx.query('INSERT INTO anomaly(id,intervention_id,zone_id,title,description,created_by) VALUES($1,$2,$3,$4,$5,$6)', [a, row.id, zone, title, description, scope.user.id]);
      return { event: 'ANOMALY_REPORTED', reason: title, result: { id: a } };
    });
  }
  @Post('interventions/:id/anomalies/:aid/propose') propose(@Req() req: Request, @Param('id') id: string, @Param('aid') aid: string, @Body() body: unknown) {
    const resolution = text(body, 'resolution', 2000, true);
    return this.step(req, id, 'PROPOSE_RESOLUTION', async (tx, row) => {
      const r = await tx.query(`UPDATE anomaly SET status='RESOLUTION_PROPOSED',resolution=$3 WHERE id=$1 AND intervention_id=$2 AND status<>'CLOSED' RETURNING title`, [uuid(aid), row.id, resolution]);
      if (!r.rowCount) throw new NotFoundException('ANOMALY_NOT_FOUND');
      return { event: 'ANOMALY_RESOLUTION_PROPOSED', reason: r.rows[0].title };
    });
  }
  @Post('interventions/:id/anomalies/:aid/close') close(@Req() req: Request, @Param('id') id: string, @Param('aid') aid: string, @Body() body: unknown) {
    const note = text(body, 'note', 2000, true);
    return this.step(req, id, 'CLOSE_ANOMALY', async (tx, row, scope) => {
      const r = await tx.query(`UPDATE anomaly SET status='CLOSED',closing_note=$3,closed_by=$4,closed_at=now() WHERE id=$1 AND intervention_id=$2 AND status<>'CLOSED' RETURNING title`, [uuid(aid), row.id, note, scope.user.id]);
      if (!r.rowCount) throw new NotFoundException('ANOMALY_NOT_FOUND');
      return { event: 'ANOMALY_CLOSED', reason: r.rows[0].title + ' — ' + note };
    });
  }

  /** The intervention report as a PDF snapshot, for anyone who can see the intervention. */
  @Get('interventions/:id/report.pdf') async report(@Req() req: Request, @Param('id') id: string, @Query('lang') lang: string, @Res() res: Response) {
    const detail = await this.detail(req, id) as Record<string, unknown> & { number: number };
    const photos = (await this.db.query('SELECT id,task_id,phase,mime,data FROM intervention_photo WHERE intervention_id=$1 ORDER BY created_at LIMIT 12', [id])).rows;
    const pdf = await renderReport(detail, photos, lang === 'en' ? 'en' : 'fr');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="TRACEOPS-INT-${String(detail.number).padStart(4, '0')}.pdf"`);
    res.end(pdf);
  }
}

/** Every date between start and end (inclusive) that falls on one of the weekdays (1 = Monday … 7 = Sunday). */
export function passages(start: string, end: string, weekdays: number[]) {
  const out: string[] = [];
  const s = new Date(start + 'T00:00:00Z'), e = new Date(end + 'T00:00:00Z');
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) throw new BadRequestException('INVALID_PERIOD');
  for (let d = s; d <= e && out.length <= 400; d = new Date(d.getTime() + 86400000)) {
    const iso = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
    if (weekdays.includes(iso)) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
export async function createPassage(tx: PoolClient, p: { id: string; client: string; provider: string; site: string; title: string; description: string | null; zones: string[]; tasks: string[]; team: string[]; lead: string | null; actor: string }, starts: Date, ends: Date, status: Status = 'PLANNED') {
  const id = randomUUID();
  await tx.query(`INSERT INTO intervention(id,client_id,provider_id,site_id,programme_id,kind,title,description,starts_at,ends_at,status,created_by)
    VALUES($1,$2,$3,$4,$5,'CLEANING',$6,$7,$8,$9,$10,$11)`, [id, p.client, p.provider, p.site, p.id, p.title, p.description, starts, ends, status, p.actor]);
  for (const z of p.zones) await tx.query('INSERT INTO intervention_zone(intervention_id,zone_id) VALUES($1,$2)', [id, z]);
  for (const [i, label] of p.tasks.entries()) await tx.query('INSERT INTO intervention_task(id,intervention_id,position,label) VALUES($1,$2,$3,$4)', [randomUUID(), id, i + 1, label]);
  for (const m of p.team) await tx.query('INSERT INTO intervention_agent(intervention_id,membership_id,lead) VALUES($1,$2,$3)', [id, m, m === p.lead]);
  await tx.query('INSERT INTO intervention_event(id,intervention_id,actor_id,action,to_status) VALUES($1,$2,$3,$4,$5)', [randomUUID(), id, p.actor, 'SCHEDULED', status]);
  return id;
}

@Module({ imports: [DatabaseModule, AccountsModule], controllers: [InterventionsController] })
export class InterventionsModule {}
