import { BadRequestException, Body, Controller, ForbiddenException, Get, Module, NotFoundException, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { AccountsModule } from '../accounts/accounts.controller.js';
import { AccountsService, uuid, type Identity } from '../accounts/accounts.service.js';
import { Database, DatabaseModule } from '../database.module.js';
import { localInstant } from '../interventions/interventions.controller.js';
import { TZ, addDays, siteToday } from '../procurement/payable.js';

type Scope = { user: Identity; org: string; kind: 'CLIENT' | 'PROVIDER'; roles: string[]; membership: string | null };
const FORMATS = ['CSV', 'MSPROJECT_XML', 'GANTTPROJECT', 'PASTE'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const input = (body: unknown) => { if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('INVALID_INPUT'); return body as Record<string, unknown>; };
function text(body: unknown, name: string, max: number, required = false) {
  const value = input(body)[name];
  if (value === undefined || value === null || value === '') { if (required) throw new BadRequestException('INVALID_INPUT'); return null; }
  if (typeof value !== 'string' || value.length > max) throw new BadRequestException('INVALID_INPUT');
  const v = value.trim(); if (required && !v) throw new BadRequestException('INVALID_INPUT');
  return v || null;
}
const isDate = (v: unknown): v is string => typeof v === 'string' && DATE.test(v) && !Number.isNaN(Date.parse(v));
const dayParam = (v: unknown, fallback: string) => isDate(v) ? v : fallback;
const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const mondayOf = (date: string) => addDays(date, -((new Date(date + 'T12:00:00Z').getUTCDay() + 6) % 7));
const pad = (n: number) => String(n).padStart(2, '0');

@Controller()
export class PlanningController {
  constructor(private readonly db: Database, private readonly accounts: AccountsService) {}

  private async scope(req: Request): Promise<Scope> {
    const user = await this.accounts.identify(req.cookies?.traceops_session); this.accounts.ensureReady(user);
    const org = uuid(req.headers['x-organization-id']);
    const context = await this.accounts.context(user, org);
    const membership = (await this.db.query('SELECT id FROM membership WHERE user_id=$1 AND organization_id=$2 AND active', [user.id, org])).rows[0]?.id ?? null;
    return { user, org, kind: context.kind, roles: context.roles, membership };
  }
  /** The Gantt is for the people who plan: managers of both sides, the client's controllers, the administrator. */
  private planner(s: Scope) {
    return s.user.admin || (s.kind === 'CLIENT' ? s.roles.includes('CLIENT_MANAGER') || s.roles.includes('CLIENT_CONTROLLER') : s.roles.includes('PROVIDER_MANAGER'));
  }
  private manager(s: Scope) { return !s.user.admin && s.roles.includes(s.kind === 'CLIENT' ? 'CLIENT_MANAGER' : 'PROVIDER_MANAGER'); }

  /**
   * Everything that has dates, for the Gantt: tenders, contracts and their scheduled services, cleaning programmes,
   * one-off maintenance, and the earlier plannings imported from Gantt files. Each list follows the usual visibility rules.
   */
  @Get('gantt') async gantt(@Req() req: Request, @Query() query: Record<string, unknown>) {
    const s = await this.scope(req);
    if (!this.planner(s)) throw new ForbiddenException('FORBIDDEN');
    const today = siteToday();
    const from = dayParam(query.from, addDays(today, -30)), to = dayParam(query.to, addDays(today, 150));
    if (to < from || days(from, to) > 800) throw new BadRequestException('INVALID_PERIOD');
    const client = s.kind === 'CLIENT', wide = s.user.admin || s.roles.includes(client ? 'CLIENT_MANAGER' : 'PROVIDER_MANAGER');
    const q = async (sql: string, v: unknown[]) => (await this.db.query(sql, v)).rows;
    const contracts = await q(`SELECT c.id,c.number,c.title,c.status,c.start_date::text AS start,COALESCE(c.actual_end_date,c.planned_end_date)::text AS end,
        p.name AS provider_name,cl.name AS client_name,st.name AS site_name,
        COALESCE((SELECT json_agg(json_build_object('id',d.id,'label',d.label,'date',d.planned_date::text,'decision',d.decision,'delivered',d.delivered_at IS NOT NULL) ORDER BY d.planned_date,d.position)
          FROM contract_delivery d WHERE d.contract_id=c.id),'[]') AS deliveries
      FROM contract c JOIN organization p ON p.id=c.provider_id JOIN organization cl ON cl.id=c.client_id LEFT JOIN site st ON st.id=c.site_id
      WHERE c.status IN ('PROPOSED','ACTIVE','CLOSED') AND c.start_date<=$3::date AND COALESCE(c.actual_end_date,c.planned_end_date)>=$2::date
        AND (($4='CLIENT' AND c.client_id=$1 AND ($5::boolean OR c.site_id IS NULL OR EXISTS(SELECT 1 FROM site_grant g WHERE g.membership_id=$6 AND g.site_id=c.site_id)))
          OR ($4='PROVIDER' AND c.provider_id=$1))
      ORDER BY c.start_date,c.number`, [s.org, from, to, s.kind, wide, s.membership]);
    const programmes = await q(`SELECT pr.id,pr.title,pr.start_date::text AS start,pr.end_date::text AS end,pr.weekdays,to_char(pr.start_time,'HH24:MI') AS start_time,to_char(pr.end_time,'HH24:MI') AS end_time,
        st.name AS site_name,p.name AS provider_name,c.name AS client_name,
        (SELECT count(*)::int FROM intervention i WHERE i.programme_id=pr.id) AS passages,
        (SELECT count(*)::int FROM intervention i WHERE i.programme_id=pr.id AND i.status='ACCEPTED') AS accepted
      FROM programme pr JOIN site st ON st.id=pr.site_id JOIN organization p ON p.id=pr.provider_id JOIN organization c ON c.id=pr.client_id
      WHERE (pr.client_id=$1 OR pr.provider_id=$1) AND pr.start_date<=$3::date AND pr.end_date>=$2::date
        AND ($4::boolean OR pr.provider_id=$1 OR EXISTS(SELECT 1 FROM site_grant g WHERE g.membership_id=$5 AND g.site_id=pr.site_id))
      ORDER BY pr.start_date`, [s.org, from, to, wide, s.membership]);
    const maintenance = await q(`SELECT i.id,i.number,i.title,i.status,i.priority,to_char(i.starts_at AT TIME ZONE st.timezone,'YYYY-MM-DD') AS start,
        to_char(i.ends_at AT TIME ZONE st.timezone,'YYYY-MM-DD') AS end,st.name AS site_name,p.name AS provider_name,c.name AS client_name
      FROM intervention i JOIN site st ON st.id=i.site_id JOIN organization p ON p.id=i.provider_id JOIN organization c ON c.id=i.client_id
      WHERE i.programme_id IS NULL AND i.status<>'CANCELLED' AND (i.client_id=$1 OR i.provider_id=$1)
        AND (i.starts_at AT TIME ZONE st.timezone)::date<=$3::date AND (i.ends_at AT TIME ZONE st.timezone)::date>=$2::date
        AND ($4::boolean OR i.provider_id=$1 OR EXISTS(SELECT 1 FROM site_grant g WHERE g.membership_id=$5 AND g.site_id=i.site_id))
      ORDER BY i.starts_at LIMIT 300`, [s.org, from, to, wide, s.membership]);
    const tenders = client && wide ? await q(`SELECT t.id,t.number,t.title,t.status,to_char(COALESCE(t.published_at,t.created_at) AT TIME ZONE '${TZ}','YYYY-MM-DD') AS start,
        to_char(t.deadline AT TIME ZONE '${TZ}','YYYY-MM-DD') AS end,to_char(t.awarded_at AT TIME ZONE '${TZ}','YYYY-MM-DD') AS awarded
      FROM tender t WHERE t.client_id=$1 AND t.status<>'CANCELLED' AND (COALESCE(t.published_at,t.created_at) AT TIME ZONE '${TZ}')::date<=$3::date
        AND (COALESCE(t.awarded_at,t.deadline) AT TIME ZONE '${TZ}')::date>=$2::date ORDER BY t.created_at`, [s.org, from, to]) : [];
    const plans = await q(`SELECT pl.id,pl.title,pl.source,pl.format,pl.created_at,pl.contract_id,pl.organization_id,o.name AS owner_name,u.display_name AS created_by_name,
        st.name AS site_name,c.number AS contract_number,
        COALESCE((SELECT json_agg(json_build_object('id',t.id,'level',t.level,'name',t.name,'start',t.start_date::text,'end',t.end_date::text,'progress',t.progress,
          'milestone',t.milestone,'resource',t.resource,'predecessors',t.predecessors) ORDER BY t.position) FROM plan_task t WHERE t.plan_id=pl.id),'[]') AS tasks
      FROM plan pl JOIN organization o ON o.id=pl.organization_id JOIN app_user u ON u.id=pl.created_by LEFT JOIN site st ON st.id=pl.site_id LEFT JOIN contract c ON c.id=pl.contract_id
      WHERE pl.active AND (pl.organization_id=$1 OR c.client_id=$1 OR c.provider_id=$1) ORDER BY pl.created_at DESC`, [s.org]);
    return { from, to, today, contracts, programmes, maintenance, tenders, plans, canImport: this.manager(s) };
  }

  /** An earlier planning, read from a Gantt file in the browser (MS Project XML, GanttProject, CSV or pasted cells), kept as it was. */
  @Post('plans') async importPlan(@Req() req: Request, @Body() body: unknown) {
    const s = await this.scope(req); if (!this.manager(s)) throw new ForbiddenException('FORBIDDEN');
    const b = input(body), title = text(b, 'title', 200, true)!, source = text(b, 'source', 200), format = text(b, 'format', 20, true)!;
    if (!FORMATS.includes(format)) throw new BadRequestException('INVALID_INPUT');
    const contract = b.contractId ? uuid(b.contractId) : null, site = b.siteId ? uuid(b.siteId) : null;
    const raw = Array.isArray(b.tasks) && b.tasks.length >= 1 && b.tasks.length <= 1000 ? b.tasks : null;
    if (!raw) throw new BadRequestException('TASKS_REQUIRED');
    const tasks = raw.map((r, position) => {
      const t = input(r), start = t.start, end = t.end ?? t.start;
      if (!isDate(start) || !isDate(end)) throw new BadRequestException('INVALID_DATE');
      if (end < start) throw new BadRequestException('INVALID_PERIOD');
      const level = t.level === undefined || t.level === null ? 0 : Number(t.level), progress = t.progress === undefined || t.progress === null || t.progress === '' ? null : Number(t.progress);
      if (!Number.isInteger(level) || level < 0 || level > 9) throw new BadRequestException('INVALID_INPUT');
      if (progress !== null && (!Number.isFinite(progress) || progress < 0 || progress > 100)) throw new BadRequestException('INVALID_INPUT');
      return { position, level, name: text(t, 'name', 300, true)!, start_date: start, end_date: end, progress: progress === null ? null : Math.round(progress),
        milestone: t.milestone === true, resource: text(t, 'resource', 200), predecessors: text(t, 'predecessors', 200) };
    });
    return this.db.transaction(async tx => {
      if (contract && !(await tx.query('SELECT 1 FROM contract WHERE id=$1 AND (client_id=$2 OR provider_id=$2)', [contract, s.org])).rowCount) throw new BadRequestException('INVALID_CONTRACT');
      if (site && !(await tx.query(`SELECT 1 FROM site s WHERE s.id=$1 AND s.active AND (s.client_id=$2 OR EXISTS(SELECT 1 FROM service_agreement a WHERE a.site_id=s.id AND a.provider_id=$2 AND a.active))`, [site, s.org])).rowCount)
        throw new BadRequestException('INVALID_SITE');
      const id = randomUUID();
      await tx.query('INSERT INTO plan(id,organization_id,contract_id,site_id,title,source,format,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [id, s.org, contract, site, title, source, format, s.user.id]);
      await tx.query(`INSERT INTO plan_task(id,plan_id,position,level,name,start_date,end_date,progress,milestone,resource,predecessors)
        SELECT gen_random_uuid(),$1,x.position,x.level,x.name,x.start_date,x.end_date,x.progress,x.milestone,x.resource,x.predecessors
        FROM json_to_recordset($2::json) AS x(position int,level int,name text,start_date date,end_date date,progress int,milestone boolean,resource text,predecessors text)`, [id, JSON.stringify(tasks)]);
      await this.accounts.audit(tx, s.user.id, s.org, 'PLAN_IMPORTED', id, `${title} — ${tasks.length} tâches`);
      return { id, tasks: tasks.length };
    });
  }
  @Post('plans/:id/archive') async archivePlan(@Req() req: Request, @Param('id') id: string) {
    const s = await this.scope(req); if (!this.manager(s)) throw new ForbiddenException('FORBIDDEN');
    return this.db.transaction(async tx => {
      const r = await tx.query('UPDATE plan SET active=false WHERE id=$1 AND organization_id=$2 AND active RETURNING title', [uuid(id), s.org]);
      if (!r.rowCount) throw new NotFoundException('PLAN_NOT_FOUND');
      await this.accounts.audit(tx, s.user.id, s.org, 'PLAN_ARCHIVED', id, r.rows[0].title);
      return { ok: true };
    });
  }

  /**
   * When a provider is free, hour by hour: its field agents, minus those on a mission (for any client) or declared absent.
   * A client sees counts only — never who the other clients are; it may look at a provider it works with, consulted or contracted.
   */
  @Get('providers/:id/availability') async availability(@Req() req: Request, @Param('id') id: string, @Query() query: Record<string, unknown>) {
    const s = await this.scope(req), provider = uuid(id);
    if (s.kind === 'PROVIDER') {
      if (provider !== s.org || !(s.user.admin || s.roles.includes('PROVIDER_MANAGER'))) throw new NotFoundException('PROVIDER_NOT_FOUND');
    } else {
      if (!this.planner(s)) throw new ForbiddenException('FORBIDDEN');
      const related = (await this.db.query(`SELECT 1 FROM service_agreement WHERE client_id=$1 AND provider_id=$2 AND active
        UNION SELECT 1 FROM tender_invitation i JOIN tender t ON t.id=i.tender_id WHERE t.client_id=$1 AND i.provider_id=$2
        UNION SELECT 1 FROM contract WHERE client_id=$1 AND provider_id=$2 LIMIT 1`, [s.org, provider])).rowCount;
      if (!related) throw new NotFoundException('PROVIDER_NOT_FOUND');
    }
    const org = (await this.db.query(`SELECT name FROM organization WHERE id=$1 AND kind='PROVIDER'`, [provider])).rows[0];
    if (!org) throw new NotFoundException('PROVIDER_NOT_FOUND');
    const from = dayParam(query.from, mondayOf(siteToday())), count = Math.min(31, Math.max(1, Number(query.days) || 7));
    const agents = Number((await this.db.query(`SELECT count(DISTINCT m.id)::int AS n FROM membership m JOIN membership_role r ON r.membership_id=m.id
      WHERE m.organization_id=$1 AND m.active AND r.role='FIELD_AGENT'`, [provider])).rows[0].n);
    const start = localInstant(from, '00:00', TZ), end = localInstant(addDays(from, count), '00:00', TZ);
    const busy = (await this.db.query(`SELECT a.membership_id,i.starts_at,i.ends_at,(i.client_id=$4) AS own FROM intervention_agent a JOIN intervention i ON i.id=a.intervention_id
      WHERE i.provider_id=$1 AND i.status<>'CANCELLED' AND i.starts_at<$3 AND i.ends_at>$2`, [provider, start, end, s.kind === 'CLIENT' ? s.org : null])).rows as { membership_id: string; starts_at: Date; ends_at: Date; own: boolean | null }[];
    // An absence counts for the day of the mission it was declared for (often the day before), else for the day it was sent.
    const absent = (await this.db.query(`SELECT DISTINCT a.membership_id,to_char(COALESCE(i.starts_at,a.at) AT TIME ZONE '${TZ}','YYYY-MM-DD') AS day
      FROM attendance a LEFT JOIN intervention i ON i.id=a.intervention_id
      WHERE a.provider_id=$1 AND a.kind='ABSENT' AND COALESCE(i.starts_at,a.at)>=$2 AND COALESCE(i.starts_at,a.at)<$3`, [provider, start, end])).rows as { membership_id: string; day: string }[];
    const H0 = 6, H1 = 22, out: { date: string; hours: { busy: number; own: number }[]; absent: number }[] = [];
    for (let d = 0; d < count; d++) {
      const date = addDays(from, d), away = absent.filter(a => a.day === date).map(a => a.membership_id), hours: { busy: number; own: number }[] = [];
      for (let h = H0; h < H1; h++) {
        const a = localInstant(date, `${pad(h)}:00`, TZ).getTime(), b = a + 3600000, taken = new Set(away), own = new Set<string>();
        for (const r of busy) if (r.starts_at.getTime() < b && r.ends_at.getTime() > a) { taken.add(r.membership_id); if (r.own) own.add(r.membership_id); }
        hours.push({ busy: Math.min(taken.size, agents), own: own.size });
      }
      out.push({ date, hours, absent: away.length });
    }
    return { provider: { id: provider, name: org.name }, agents, from, hours: [H0, H1], days: out };
  }
}

@Module({ imports: [DatabaseModule, AccountsModule], controllers: [PlanningController] })
export class PlanningModule {}
