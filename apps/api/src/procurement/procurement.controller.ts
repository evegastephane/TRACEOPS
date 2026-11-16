import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Module, NotFoundException, Param, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { AccountsModule } from '../accounts/accounts.controller.js';
import { AccountsService, uuid, type Identity } from '../accounts/accounts.service.js';
import { Database, DatabaseModule } from '../database.module.js';
import { localInstant } from '../interventions/interventions.controller.js';
import { renderTender } from './document.js';
import { SERVICE_TYPES, cleanAnswers, cleanCriteria, cleanFields, cleanQuality, cleanSections, library, type Criterion, type Field, type QualityCriterion, type ServiceType } from './forms.js';
import { TZ, addDays, recordPayable, siteToday } from './payable.js';

type Scope = { user: Identity; org: string; kind: 'CLIENT' | 'PROVIDER'; roles: string[]; membership: string | null };
type Q = { query: (sql: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> };
const on = (tx: PoolClient | undefined, db: Database) => (tx ?? db) as unknown as Q;
type TenderRow = { id: string; number: number; client_id: string; status: string; deadline: Date; title: string; questions: Field[]; criteria: Criterion[]; quality_criteria: QualityCriterion[];
  payment_terms_days: number; site_id: string | null; object: string | null };
type ContractRow = { id: string; number: number; client_id: string; provider_id: string; site_id: string | null; status: string; payment_terms_days: number; title: string; quality_criteria: QualityCriterion[]; tender_id: string | null; bid_id: string | null;
  /** Whether the provider can answer on the platform: an active provider manager. */
  provider_online: boolean };

const input = (body: unknown) => { if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('INVALID_INPUT'); return body as Record<string, unknown>; };
function text(body: unknown, name: string, max = 2000, required = false) {
  const value = input(body)[name];
  if (value === undefined || value === null || value === '') { if (required) throw new BadRequestException('INVALID_INPUT'); return null; }
  if (typeof value !== 'string' || value.length > max) throw new BadRequestException('INVALID_INPUT');
  const trimmed = value.trim(); if (required && !trimmed) throw new BadRequestException('INVALID_INPUT');
  return trimmed || null;
}
function int(body: unknown, name: string, min: number, max: number, required = false) {
  const value = input(body)[name];
  if (value === undefined || value === null || value === '') { if (required) throw new BadRequestException('INVALID_INPUT'); return null; }
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) throw new BadRequestException('INVALID_INPUT');
  return n;
}
function day(body: unknown, name: string, required = false) {
  const value = text(body, name, 10, required);
  if (value === null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) throw new BadRequestException('INVALID_DATE');
  return value;
}
const ref = (prefix: string, n: number) => `${prefix}-${String(n).padStart(4, '0')}`;
const money = (v: number | string) => String(Math.round(Number(v))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
const monthOf = (date: string) => new Date(date + 'T12:00:00Z').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

@Controller()
export class ProcurementController {
  constructor(private readonly db: Database, private readonly accounts: AccountsService) {}

  private async scope(req: Request): Promise<Scope> {
    const user = await this.accounts.identify(req.cookies?.traceops_session); this.accounts.ensureReady(user);
    const org = uuid(req.headers['x-organization-id']);
    const context = await this.accounts.context(user, org);
    const membership = (await this.db.query('SELECT id FROM membership WHERE user_id=$1 AND organization_id=$2 AND active', [user.id, org])).rows[0]?.id ?? null;
    return { user, org, kind: context.kind, roles: context.roles, membership };
  }
  /** The client's managers: they write tenders, award them, plan the services and record payments. */
  private manager(s: Scope) { return !s.user.admin && s.kind === 'CLIENT' && s.roles.includes('CLIENT_MANAGER'); }
  /** Managers and controllers (the internal technicians) accept services and evaluate their quality. */
  private staff(s: Scope) { return !s.user.admin && s.kind === 'CLIENT' && (s.roles.includes('CLIENT_MANAGER') || s.roles.includes('CLIENT_CONTROLLER')); }
  private supplier(s: Scope) { return !s.user.admin && s.kind === 'PROVIDER' && s.roles.includes('PROVIDER_MANAGER'); }
  /** Reading the client side: its managers, and the administrator acting for the organisation. */
  private clientReader(s: Scope) { return s.kind === 'CLIENT' && (s.user.admin || s.roles.includes('CLIENT_MANAGER')); }
  private providerReader(s: Scope) { return s.kind === 'PROVIDER' && (s.user.admin || s.roles.includes('PROVIDER_MANAGER')); }
  private async event(tx: PoolClient, ids: { tender?: string | null; contract?: string | null }, actor: string, action: string, reason: string | null = null) {
    await tx.query('INSERT INTO procurement_event(id,tender_id,contract_id,actor_id,action,reason) VALUES($1,$2,$3,$4,$5,$6)', [randomUUID(), ids.tender ?? null, ids.contract ?? null, actor, action, reason]);
  }

  /* ============================================================ form templates */

  @Get('tender-templates') async templates(@Req() req: Request) {
    const s = await this.scope(req);
    if (!this.clientReader(s)) throw new ForbiddenException('FORBIDDEN');
    const own = (await this.db.query(`SELECT t.id,t.service_type,t.name,t.description,t.source,t.sections,t.questions,t.criteria,t.quality_criteria,t.updated_at,u.display_name AS author
      FROM tender_template t JOIN app_user u ON u.id=t.created_by WHERE t.client_id=$1 AND t.active ORDER BY t.updated_at DESC`, [s.org])).rows;
    return {
      library: library.map(t => ({ ...t, library: true })),
      own: own.map(r => ({ id: r.id, serviceType: r.service_type, name: r.name, description: r.description, source: r.source, sections: r.sections, questions: r.questions,
        criteria: r.criteria, qualityCriteria: r.quality_criteria, updatedAt: r.updated_at, author: r.author, library: false })),
    };
  }
  private templateBody(body: unknown) {
    const b = input(body), serviceType = text(b, 'serviceType', 20, true) as ServiceType;
    if (!SERVICE_TYPES.includes(serviceType)) throw new BadRequestException('INVALID_INPUT');
    const sections = cleanSections(b.sections, false);
    if (!sections.length) throw new BadRequestException('SECTIONS_REQUIRED');
    return { name: text(b, 'name', 160, true)!, serviceType, description: text(b, 'description', 600), source: text(b, 'source', 200), sections,
      questions: cleanFields(b.questions, false, 20), criteria: cleanCriteria(b.criteria), qualityCriteria: cleanQuality(b.qualityCriteria) };
  }
  @Post('tender-templates') async createTemplate(@Req() req: Request, @Body() body: unknown) {
    const s = await this.scope(req); if (!this.manager(s)) throw new ForbiddenException('FORBIDDEN');
    const v = this.templateBody(body);
    return this.db.transaction(async tx => {
      const id = randomUUID();
      await tx.query(`INSERT INTO tender_template(id,client_id,service_type,name,description,source,sections,questions,criteria,quality_criteria,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [id, s.org, v.serviceType, v.name, v.description, v.source, JSON.stringify(v.sections), JSON.stringify(v.questions), JSON.stringify(v.criteria), JSON.stringify(v.qualityCriteria), s.user.id]);
      await this.accounts.audit(tx, s.user.id, s.org, 'TENDER_TEMPLATE_CREATED', id, v.name);
      return { id };
    });
  }
  @Post('tender-templates/:id') async updateTemplate(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const s = await this.scope(req); if (!this.manager(s)) throw new ForbiddenException('FORBIDDEN');
    const v = this.templateBody(body);
    return this.db.transaction(async tx => {
      const r = await tx.query(`UPDATE tender_template SET service_type=$3,name=$4,description=$5,source=COALESCE($6,source),sections=$7,questions=$8,criteria=$9,quality_criteria=$10,updated_at=now()
        WHERE id=$1 AND client_id=$2 AND active`, [uuid(id), s.org, v.serviceType, v.name, v.description, v.source, JSON.stringify(v.sections), JSON.stringify(v.questions), JSON.stringify(v.criteria), JSON.stringify(v.qualityCriteria)]);
      if (!r.rowCount) throw new NotFoundException('TEMPLATE_NOT_FOUND');
      await this.accounts.audit(tx, s.user.id, s.org, 'TENDER_TEMPLATE_UPDATED', id, v.name);
      return { ok: true };
    });
  }
  @Post('tender-templates/:id/archive') async archiveTemplate(@Req() req: Request, @Param('id') id: string) {
    const s = await this.scope(req); if (!this.manager(s)) throw new ForbiddenException('FORBIDDEN');
    return this.db.transaction(async tx => {
      const r = await tx.query('UPDATE tender_template SET active=false,updated_at=now() WHERE id=$1 AND client_id=$2 AND active RETURNING name', [uuid(id), s.org]);
      if (!r.rowCount) throw new NotFoundException('TEMPLATE_NOT_FOUND');
      await this.accounts.audit(tx, s.user.id, s.org, 'TENDER_TEMPLATE_ARCHIVED', id, r.rows[0].name);
      return { ok: true };
    });
  }

  /* ================================================================== tenders */

  private tenderBody(body: unknown) {
    const b = input(body);
    const serviceType = text(b, 'serviceType', 20, true) as ServiceType;
    if (!SERVICE_TYPES.includes(serviceType)) throw new BadRequestException('INVALID_INPUT');
    const raw = text(b, 'deadline', 16, true)!;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) throw new BadRequestException('INVALID_DATE');
    const [d, t] = raw.split('T') as [string, string];
    const ids = b.providerIds === undefined ? [] : Array.isArray(b.providerIds) && b.providerIds.length <= 30 ? b.providerIds : null;
    if (!ids) throw new BadRequestException('INVALID_INPUT');
    return {
      title: text(b, 'title', 200, true)!, object: text(b, 'object', 4000), serviceType, templateName: text(b, 'templateName', 160),
      site: b.siteId ? uuid(b.siteId) : null, budget: int(b, 'budget', 1, 1e12), deadline: localInstant(d, t, TZ),
      startDate: day(b, 'startDate'), durationDays: int(b, 'durationDays', 1, 3650), paymentTermsDays: int(b, 'paymentTermsDays', 0, 180) ?? 30,
      sections: cleanSections(b.sections, true), questions: cleanFields(b.questions, false, 20), criteria: cleanCriteria(b.criteria), qualityCriteria: cleanQuality(b.qualityCriteria),
      providers: [...new Set(ids.map(uuid))],
    };
  }
  private async checkRefs(tx: PoolClient, s: Scope, v: { site: string | null; providers: string[] }) {
    if (v.site && !(await tx.query('SELECT 1 FROM site WHERE id=$1 AND client_id=$2 AND active', [v.site, s.org])).rowCount) throw new BadRequestException('INVALID_SITE');
    if (v.providers.length) {
      const n = (await tx.query(`SELECT count(*)::int AS n FROM organization WHERE id=ANY($1) AND kind='PROVIDER' AND active`, [v.providers])).rows[0].n;
      if (n !== v.providers.length) throw new BadRequestException('INVALID_PROVIDER');
    }
  }
  private async invite(tx: PoolClient, tender: string, providers: string[]) {
    for (const p of providers) await tx.query('INSERT INTO tender_invitation(tender_id,provider_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [tender, p]);
  }
  /** A tender as this person may see it: the client's managers see their own; a provider sees the ones it is invited to, once published. */
  private async loadTender(s: Scope, id: string, tx?: PoolClient, lock = false): Promise<TenderRow> {
    uuid(id);
    const q = on(tx, this.db);
    const row = (await q.query(`SELECT * FROM tender WHERE id=$1${lock ? ' FOR UPDATE' : ''}`, [id])).rows[0] as TenderRow | undefined;
    if (!row) throw new NotFoundException('TENDER_NOT_FOUND');
    if (s.kind === 'CLIENT') { if (row.client_id !== s.org || !this.clientReader(s)) throw new NotFoundException('TENDER_NOT_FOUND'); }
    else if (row.status === 'DRAFT' || !this.providerReader(s) || !(await q.query('SELECT 1 FROM tender_invitation WHERE tender_id=$1 AND provider_id=$2', [id, s.org])).rowCount) throw new NotFoundException('TENDER_NOT_FOUND');
    return row;
  }
  /** What this person may do now. A provider answers the invitation (take part or decline), then sends its offer unless it declined. */
  private tenderActions(s: Scope, t: TenderRow, invitation?: { response: string | null; hasBid: boolean }) {
    const a: string[] = [];
    if (this.manager(s)) {
      if (['DRAFT', 'PUBLISHED'].includes(t.status)) a.push('EDIT');
      if (t.status === 'DRAFT') a.push('PUBLISH');
      if (t.status === 'PUBLISHED') a.push('CLOSE');
      if (['PUBLISHED', 'CLOSED'].includes(t.status)) a.push('RECORD_BID');
      if (t.status === 'CLOSED') a.push('REVIEW', 'AWARD');
      if (['DRAFT', 'PUBLISHED', 'CLOSED'].includes(t.status)) a.push('CANCEL');
    }
    if (this.supplier(s) && t.status === 'PUBLISHED' && new Date(t.deadline).getTime() > Date.now()) {
      if (invitation?.response !== 'DECLINED') a.push('BID');
      if (!invitation?.hasBid) a.push('RESPOND');
    }
    return a;
  }

  @Get('tenders') async tenders(@Req() req: Request) {
    const s = await this.scope(req);
    if (s.kind === 'CLIENT') {
      if (!this.clientReader(s)) throw new ForbiddenException('FORBIDDEN');
      return (await this.db.query(`SELECT t.id,t.number,t.title,t.service_type,t.status,t.deadline,t.created_at,t.published_at,t.closed_at,t.awarded_at,t.budget_xaf,t.template_name,
          s.name AS site_name,
          (SELECT count(*)::int FROM tender_invitation i WHERE i.tender_id=t.id) AS invited,
          (SELECT count(*)::int FROM bid b WHERE b.tender_id=t.id) AS bids,
          (SELECT count(*)::int FROM bid b WHERE b.tender_id=t.id AND b.status='SHORTLISTED') AS shortlisted,
          CASE WHEN t.status IN ('CLOSED','AWARDED') THEN (SELECT min(b.amount_xaf) FROM bid b WHERE b.tender_id=t.id AND b.status<>'REJECTED') END AS best_amount,
          (SELECT string_agg(p.name, ', ' ORDER BY p.name) FROM bid b JOIN organization p ON p.id=b.provider_id WHERE b.tender_id=t.id AND b.status='AWARDED') AS awarded_to
        FROM tender t LEFT JOIN site s ON s.id=t.site_id WHERE t.client_id=$1 ORDER BY t.created_at DESC LIMIT 300`, [s.org])).rows;
    }
    if (!this.providerReader(s)) throw new ForbiddenException('FORBIDDEN');
    return (await this.db.query(`SELECT t.id,t.number,t.title,t.service_type,t.status,t.deadline,t.published_at,t.closed_at,t.awarded_at,t.template_name,
        s.name AS site_name,c.name AS client_name,i.invited_at,i.response,i.response_reason,i.responded_at,
        (SELECT json_build_object('id',b.id,'status',CASE WHEN t.status='AWARDED' THEN (CASE WHEN b.status='AWARDED' THEN 'AWARDED' ELSE 'NOT_RETAINED' END) ELSE 'SUBMITTED' END,
          'submitted_at',b.submitted_at,'updated_at',b.updated_at,'amount_xaf',b.amount_xaf,'delay_days',b.delay_days) FROM bid b WHERE b.tender_id=t.id AND b.provider_id=$1) AS my_bid
      FROM tender t JOIN tender_invitation i ON i.tender_id=t.id AND i.provider_id=$1 JOIN organization c ON c.id=t.client_id LEFT JOIN site s ON s.id=t.site_id
      WHERE t.status<>'DRAFT' ORDER BY t.deadline DESC LIMIT 300`, [s.org])).rows;
  }

  @Get('tenders/:id') async tender(@Req() req: Request, @Param('id') id: string) {
    const s = await this.scope(req);
    const row = await this.loadTender(s, id);
    const q = async (sql: string, v: unknown[] = [id]) => (await this.db.query(sql, v)).rows;
    const [head] = await q(`SELECT t.id,t.number,t.client_id,t.site_id,t.template_name,t.service_type,t.title,t.object,t.budget_xaf,t.deadline,t.start_date::text AS start_date,t.duration_days,
        t.payment_terms_days,t.sections,t.questions,t.criteria,t.quality_criteria,t.status,t.decision_note,t.created_at,t.updated_at,t.published_at,t.closed_at,t.awarded_at,
        s.name AS site_name,c.name AS client_name,u.display_name AS created_by_name
      FROM tender t JOIN organization c ON c.id=t.client_id LEFT JOIN site s ON s.id=t.site_id JOIN app_user u ON u.id=t.created_by WHERE t.id=$1`);
    const client = s.kind === 'CLIENT';
    const sealed = client && row.status === 'PUBLISHED';
    const bids = (await q(`SELECT b.id,b.provider_id,p.name AS provider_name,b.amount_xaf,b.delay_days,b.content,b.strengths,b.answers,b.source,b.status,b.scores,b.review_note,b.status_reason,
        b.submitted_at,b.updated_at,u.display_name AS submitted_by_name,pp.city AS provider_city
      FROM bid b JOIN organization p ON p.id=b.provider_id LEFT JOIN organization_profile pp ON pp.organization_id=p.id JOIN app_user u ON u.id=b.submitted_by
      WHERE b.tender_id=$1 AND ($2::uuid IS NULL OR b.provider_id=$2) ORDER BY b.submitted_at`, [id, client ? null : s.org]))
      .map(b => sealed ? { id: b.id, provider_id: b.provider_id, provider_name: b.provider_name, provider_city: b.provider_city, source: b.source, status: b.status, submitted_at: b.submitted_at, updated_at: b.updated_at, submitted_by_name: b.submitted_by_name, sealed: true }
        : client ? b
        // A provider sees its own offer; the committee's marks and notes stay with the client, and the result is told once the tender is awarded.
        : { ...b, scores: {}, review_note: null, status_reason: null, status: row.status === 'AWARDED' ? (b.status === 'AWARDED' ? 'AWARDED' : 'NOT_RETAINED') : 'SUBMITTED' });
    const invitations = client ? await q(`SELECT i.provider_id,p.name,i.invited_at,i.response,i.response_reason,i.responded_at,pp.city,pp.services,b.submitted_at
      FROM tender_invitation i JOIN organization p ON p.id=i.provider_id LEFT JOIN organization_profile pp ON pp.organization_id=p.id
      LEFT JOIN bid b ON b.tender_id=i.tender_id AND b.provider_id=i.provider_id WHERE i.tender_id=$1 ORDER BY p.name`) : [];
    // A provider follows the public steps and its own offer only: never who else answered, nor the committee's work.
    const publicEvents = ['PUBLISHED', 'AMENDED', 'CLOSED', 'AWARDED', 'CANCELLED'];
    const own = client ? null : (await q('SELECT name FROM organization WHERE id=$1', [s.org]))[0]?.name as string | undefined;
    const events = (await q(`SELECT e.id,e.action,e.reason,e.created_at,u.display_name AS actor FROM procurement_event e JOIN app_user u ON u.id=e.actor_id WHERE e.tender_id=$1 ORDER BY e.created_at,e.id`))
      .filter(e => client || publicEvents.includes(e.action)
        || (['BID_SUBMITTED', 'BID_UPDATED', 'BID_RECORDED', 'INVITATION_ACCEPTED', 'INVITATION_DECLINED', 'AWARD_ACCEPTED', 'AWARD_DECLINED'].includes(e.action) && (e.reason === own || String(e.reason ?? '').startsWith(`${own} — `))))
      .map(e => client || ['AMENDED', 'CANCELLED'].includes(e.action) ? e : { ...e, reason: null });
    const contracts = client ? await q(`SELECT c.id,c.number,c.provider_id,p.name AS provider_name,c.status FROM contract c JOIN organization p ON p.id=c.provider_id WHERE c.tender_id=$1 ORDER BY c.number`) : [];
    const mine = client ? null : (await q('SELECT response,response_reason,responded_at FROM tender_invitation WHERE tender_id=$1 AND provider_id=$2', [id, s.org]))[0] ?? null;
    const out = { ...head, invitations, bids, events, contracts, sealed, my_invitation: mine,
      actions: this.tenderActions(s, row, mine ? { response: mine.response, hasBid: bids.length > 0 } : undefined) } as Record<string, unknown>;
    if (!client) { delete out.budget_xaf; delete out.decision_note; }
    return out;
  }

  /** Client: a new tender, as a draft. */
  @Post('tenders') async createTender(@Req() req: Request, @Body() body: unknown) {
    const s = await this.scope(req); if (!this.manager(s)) throw new ForbiddenException('FORBIDDEN');
    const v = this.tenderBody(body);
    return this.db.transaction(async tx => {
      await this.checkRefs(tx, s, v);
      const id = randomUUID();
      const r = await tx.query(`INSERT INTO tender(id,client_id,site_id,template_name,service_type,title,object,budget_xaf,deadline,start_date,duration_days,payment_terms_days,sections,questions,criteria,quality_criteria,created_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING number`,
        [id, s.org, v.site, v.templateName, v.serviceType, v.title, v.object, v.budget, v.deadline, v.startDate, v.durationDays, v.paymentTermsDays,
          JSON.stringify(v.sections), JSON.stringify(v.questions), JSON.stringify(v.criteria), JSON.stringify(v.qualityCriteria), s.user.id]);
      await this.invite(tx, id, v.providers);
      await this.event(tx, { tender: id }, s.user.id, 'CREATED', v.templateName);
      await this.accounts.audit(tx, s.user.id, s.org, 'TENDER_CREATED', id, v.title);
      return { id, number: r.rows[0].number };
    });
  }
  /** Client: edit the draft; once published, every change is an amendment with its reason, and invited providers can only be added. */
  @Post('tenders/:id') async updateTender(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const s = await this.scope(req); if (!this.manager(s)) throw new ForbiddenException('FORBIDDEN');
    const v = this.tenderBody(body), reason = text(body, 'reason', 1000);
    return this.db.transaction(async tx => {
      const t = await this.loadTender(s, id, tx, true);
      if (!['DRAFT', 'PUBLISHED'].includes(t.status)) throw new ForbiddenException('ACTION_NOT_ALLOWED');
      if (t.status === 'PUBLISHED' && !reason) throw new BadRequestException('REASON_REQUIRED');
      if (t.status === 'PUBLISHED' && v.deadline.getTime() <= Date.now()) throw new BadRequestException('DEADLINE_PASSED');
      await this.checkRefs(tx, s, v);
      await tx.query(`UPDATE tender SET site_id=$2,template_name=COALESCE($3,template_name),service_type=$4,title=$5,object=$6,budget_xaf=$7,deadline=$8,start_date=$9,duration_days=$10,
        payment_terms_days=$11,sections=$12,questions=$13,criteria=$14,quality_criteria=$15,updated_at=now() WHERE id=$1`,
        [t.id, v.site, v.templateName, v.serviceType, v.title, v.object, v.budget, v.deadline, v.startDate, v.durationDays, v.paymentTermsDays,
          JSON.stringify(v.sections), JSON.stringify(v.questions), JSON.stringify(v.criteria), JSON.stringify(v.qualityCriteria)]);
      if (t.status === 'DRAFT') await tx.query(`DELETE FROM tender_invitation i WHERE i.tender_id=$1 AND NOT (i.provider_id = ANY($2::uuid[]))
        AND NOT EXISTS (SELECT 1 FROM bid b WHERE b.tender_id=i.tender_id AND b.provider_id=i.provider_id)`, [t.id, v.providers]);
      await this.invite(tx, t.id, v.providers);
      await this.event(tx, { tender: t.id }, s.user.id, t.status === 'PUBLISHED' ? 'AMENDED' : 'EDITED', reason);
      await this.accounts.audit(tx, s.user.id, s.org, t.status === 'PUBLISHED' ? 'TENDER_AMENDED' : 'TENDER_EDITED', t.id, reason ?? undefined);
      return { ok: true };
    });
  }
  /** Runs a guarded change of a tender's status, with its event and its audit. */
  private transition(req: Request, id: string, from: string[], work: (tx: PoolClient, t: TenderRow, s: Scope) => Promise<{ event: string; reason?: string | null; result?: unknown }>) {
    return this.scope(req).then(s => {
      if (!this.manager(s)) throw new ForbiddenException('FORBIDDEN');
      return this.db.transaction(async tx => {
        const t = await this.loadTender(s, id, tx, true);
        if (!from.includes(t.status)) throw new ForbiddenException('ACTION_NOT_ALLOWED');
        const out = await work(tx, t, s);
        await this.event(tx, { tender: t.id }, s.user.id, out.event, out.reason ?? null);
        await this.accounts.audit(tx, s.user.id, s.org, 'TENDER_' + out.event, t.id, out.reason ?? undefined);
        return out.result ?? { ok: true };
      });
    });
  }
  @Post('tenders/:id/publish') publish(@Req() req: Request, @Param('id') id: string) {
    return this.transition(req, id, ['DRAFT'], async (tx, t) => {
      if (new Date(t.deadline).getTime() <= Date.now()) throw new BadRequestException('DEADLINE_PASSED');
      const invited = (await tx.query('SELECT count(*)::int AS n FROM tender_invitation WHERE tender_id=$1', [t.id])).rows[0].n;
      if (!invited) throw new BadRequestException('PROVIDERS_REQUIRED');
      if (!t.criteria.length || t.criteria.reduce((sum, c) => sum + c.weight, 0) !== 100) throw new BadRequestException('CRITERIA_WEIGHTS');
      if (!t.quality_criteria.length) throw new BadRequestException('QUALITY_REQUIRED');
      await tx.query(`UPDATE tender SET status='PUBLISHED',published_at=now() WHERE id=$1`, [t.id]);
      return { event: 'PUBLISHED', reason: `${invited} prestataire${invited > 1 ? 's' : ''} consulté${invited > 1 ? 's' : ''}` };
    });
  }
  /** Closing the reception opens the offers: amounts and contents become readable for the comparison. */
  @Post('tenders/:id/close') close(@Req() req: Request, @Param('id') id: string) {
    return this.transition(req, id, ['PUBLISHED'], async (tx, t) => {
      const n = (await tx.query('SELECT count(*)::int AS n FROM bid WHERE tender_id=$1', [t.id])).rows[0].n;
      await tx.query(`UPDATE tender SET status='CLOSED',closed_at=now() WHERE id=$1`, [t.id]);
      return { event: 'CLOSED', reason: `${n} offre${n > 1 ? 's' : ''} reçue${n > 1 ? 's' : ''}` };
    });
  }
  @Post('tenders/:id/cancel') cancel(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const reason = text(body, 'reason', 1000, true);
    return this.transition(req, id, ['DRAFT', 'PUBLISHED', 'CLOSED'], async (tx, t) => {
      await tx.query(`UPDATE tender SET status='CANCELLED',decision_note=$2 WHERE id=$1`, [t.id, reason]);
      return { event: 'CANCELLED', reason };
    });
  }

  /** An offer: sent by the invited provider before the deadline, or recorded by the client from a reply received on paper or by e-mail. */
  @Post('tenders/:id/bids') async bid(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const s = await this.scope(req);
    const b = input(body);
    const amount = int(b, 'amount', 1, 1e12, true)!, delay = int(b, 'delayDays', 0, 3650, true)!;
    const content = text(b, 'content', 6000, true)!, strengths = text(b, 'strengths', 3000);
    return this.db.transaction(async tx => {
      const t = await this.loadTender(s, id, tx, true);
      let provider: string, source: 'ONLINE' | 'RECORDED';
      if (this.supplier(s)) {
        if (t.status !== 'PUBLISHED' || new Date(t.deadline).getTime() <= Date.now()) throw new ForbiddenException('TENDER_CLOSED');
        provider = s.org; source = 'ONLINE';
        const inv = (await tx.query('SELECT response FROM tender_invitation WHERE tender_id=$1 AND provider_id=$2', [t.id, provider])).rows[0];
        if (inv?.response === 'DECLINED') throw new ForbiddenException('INVITATION_DECLINED');
        // Sending an offer is taking part.
        await tx.query(`UPDATE tender_invitation SET response='ACCEPTED',responded_at=now(),responded_by=$3 WHERE tender_id=$1 AND provider_id=$2 AND response IS NULL`, [t.id, provider, s.user.id]);
      } else if (this.manager(s)) {
        if (!['PUBLISHED', 'CLOSED'].includes(t.status)) throw new ForbiddenException('ACTION_NOT_ALLOWED');
        provider = uuid(b.providerId); source = 'RECORDED';
        if (!(await tx.query(`SELECT 1 FROM organization WHERE id=$1 AND kind='PROVIDER' AND active`, [provider])).rowCount) throw new BadRequestException('INVALID_PROVIDER');
        await this.invite(tx, t.id, [provider]);
      } else throw new ForbiddenException('FORBIDDEN');
      const answers = cleanAnswers(t.questions, b.answers);
      if (source === 'ONLINE' && t.questions.some(q => q.required && !(q.key in answers))) throw new BadRequestException('ANSWERS_REQUIRED');
      const existing = (await tx.query('SELECT id,source FROM bid WHERE tender_id=$1 AND provider_id=$2 FOR UPDATE', [t.id, provider])).rows[0];
      // What a provider sent itself is never overwritten by the client.
      if (existing && source === 'RECORDED' && existing.source === 'ONLINE') throw new ConflictException('BID_ALREADY_ONLINE');
      const bidId = existing?.id ?? randomUUID();
      if (existing) await tx.query(`UPDATE bid SET amount_xaf=$2,delay_days=$3,content=$4,strengths=$5,answers=$6,submitted_by=$7,updated_at=now() WHERE id=$1`,
        [bidId, amount, delay, content, strengths, JSON.stringify(answers), s.user.id]);
      else await tx.query(`INSERT INTO bid(id,tender_id,provider_id,amount_xaf,delay_days,content,strengths,answers,source,submitted_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [bidId, t.id, provider, amount, delay, content, strengths, JSON.stringify(answers), source, s.user.id]);
      const name = (await tx.query('SELECT name FROM organization WHERE id=$1', [provider])).rows[0].name as string;
      const action = existing ? 'BID_UPDATED' : source === 'ONLINE' ? 'BID_SUBMITTED' : 'BID_RECORDED';
      await this.event(tx, { tender: t.id }, s.user.id, action, name);
      await this.accounts.audit(tx, s.user.id, s.org, 'TENDER_' + action, t.id, name);
      return { id: bidId };
    });
  }
  /** The invited provider takes part or declines (with a reason), until the deadline and as long as it has sent no offer. */
  @Post('tenders/:id/invitation') async respondInvitation(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const s = await this.scope(req); if (!this.supplier(s)) throw new ForbiddenException('FORBIDDEN');
    const accept = input(body).accept === true, reason = text(body, 'reason', 1000);
    if (!accept && !reason) throw new BadRequestException('REASON_REQUIRED');
    return this.db.transaction(async tx => {
      const t = await this.loadTender(s, id, tx, true);
      if (t.status !== 'PUBLISHED' || new Date(t.deadline).getTime() <= Date.now()) throw new ForbiddenException('TENDER_CLOSED');
      if ((await tx.query('SELECT 1 FROM bid WHERE tender_id=$1 AND provider_id=$2', [t.id, s.org])).rowCount) throw new ConflictException('BID_ALREADY_SENT');
      await tx.query('UPDATE tender_invitation SET response=$3,response_reason=$4,responded_at=now(),responded_by=$5 WHERE tender_id=$1 AND provider_id=$2',
        [t.id, s.org, accept ? 'ACCEPTED' : 'DECLINED', accept ? null : reason, s.user.id]);
      const name = (await tx.query('SELECT name FROM organization WHERE id=$1', [s.org])).rows[0].name as string;
      await this.event(tx, { tender: t.id }, s.user.id, accept ? 'INVITATION_ACCEPTED' : 'INVITATION_DECLINED', accept ? name : `${name} — ${reason}`);
      await this.accounts.audit(tx, s.user.id, s.org, accept ? 'TENDER_INVITATION_ACCEPTED' : 'TENDER_INVITATION_DECLINED', t.id, reason ?? undefined);
      return { ok: true };
    });
  }

  /** The committee's marks on the criteria that are not computed (0 to 10), with a note for each, and its overall opinion. */
  @Post('tenders/:id/bids/:bidId/review') review(@Req() req: Request, @Param('id') id: string, @Param('bidId') bidId: string, @Body() body: unknown) {
    const b = input(body), note = text(b, 'reviewNote', 3000);
    const raw = b.scores === undefined ? {} : b.scores;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new BadRequestException('INVALID_INPUT');
    return this.transition(req, id, ['CLOSED'], async (tx, t) => {
      const bid = (await tx.query('SELECT b.id,b.scores,p.name FROM bid b JOIN organization p ON p.id=b.provider_id WHERE b.id=$1 AND b.tender_id=$2 FOR UPDATE', [uuid(bidId), t.id])).rows[0];
      if (!bid) throw new NotFoundException('BID_NOT_FOUND');
      const scores: Record<string, { score: number; note?: string }> = { ...(bid.scores ?? {}) };
      for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        const c = t.criteria.find(x => x.key === key);
        if (!c || c.auto) throw new BadRequestException('INVALID_CRITERION');
        if (value === null) { delete scores[key]; continue; }
        const v = input(value), score = Number(v.score);
        if (!Number.isFinite(score) || score < 0 || score > 10 || Math.round(score * 2) !== score * 2) throw new BadRequestException('INVALID_SCORE');
        const n = typeof v.note === 'string' ? v.note.trim().slice(0, 1000) : '';
        scores[key] = n ? { score, note: n } : { score };
      }
      await tx.query('UPDATE bid SET scores=$2,review_note=COALESCE($3,review_note),updated_at=now() WHERE id=$1', [bid.id, JSON.stringify(scores), note]);
      return { event: 'BID_REVIEWED', reason: bid.name };
    });
  }
  /** Pre-selection: keep an offer on the short list, set it aside with a reason, or put it back. */
  @Post('tenders/:id/bids/:bidId/status') bidStatus(@Req() req: Request, @Param('id') id: string, @Param('bidId') bidId: string, @Body() body: unknown) {
    const status = text(body, 'status', 20, true)!, reason = text(body, 'reason', 1000);
    if (!['SHORTLISTED', 'REJECTED', 'SUBMITTED'].includes(status)) throw new BadRequestException('INVALID_INPUT');
    if (status === 'REJECTED' && !reason) throw new BadRequestException('REASON_REQUIRED');
    return this.transition(req, id, ['CLOSED'], async (tx, t) => {
      const r = await tx.query(`UPDATE bid b SET status=$3,status_reason=$4,updated_at=now() FROM organization p WHERE p.id=b.provider_id AND b.id=$1 AND b.tender_id=$2 RETURNING p.name`,
        [uuid(bidId), t.id, status, status === 'REJECTED' ? reason : null]);
      if (!r.rowCount) throw new NotFoundException('BID_NOT_FOUND');
      const name = r.rows[0].name as string;
      return { event: status === 'SHORTLISTED' ? 'BID_SHORTLISTED' : status === 'REJECTED' ? 'BID_REJECTED' : 'BID_RESTORED', reason: status === 'REJECTED' ? `${name} — ${reason}` : name };
    });
  }
  /**
   * The award: one or several providers are retained. Each becomes a contract whose commitments are those of its offer
   * (amount, delay), with a schedule of services; the other offers are not retained.
   */
  @Post('tenders/:id/award') award(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const b = input(body), note = text(b, 'note', 2000);
    const list = Array.isArray(b.awards) && b.awards.length >= 1 && b.awards.length <= 10 ? b.awards : null;
    if (!list) throw new BadRequestException('AWARD_REQUIRED');
    const awards = list.map(raw => {
      const a = input(raw), days = int(a, 'days', 1, 3650, true)!;
      const target = a.qualityTarget === undefined || a.qualityTarget === null || a.qualityTarget === '' ? 7 : Number(a.qualityTarget);
      if (!Number.isFinite(target) || target < 1 || target > 10) throw new BadRequestException('INVALID_INPUT');
      return { bid: uuid(a.bidId), amount: int(a, 'amount', 1, 1e12, true)!, days, start: day(a, 'startDate', true)!, installments: int(a, 'installments', 1, 36) ?? (days >= 60 ? Math.round(days / 30) : 1), target: Math.round(target * 10) / 10 };
    });
    if (new Set(awards.map(a => a.bid)).size !== awards.length) throw new BadRequestException('INVALID_INPUT');
    return this.transition(req, id, ['CLOSED'], async (tx, t, s) => {
      const names: string[] = [], contracts: string[] = [];
      for (const a of awards) {
        const bid = (await tx.query(`SELECT b.id,b.provider_id,p.name FROM bid b JOIN organization p ON p.id=b.provider_id WHERE b.id=$1 AND b.tender_id=$2 AND b.status NOT IN ('REJECTED','DECLINED') FOR UPDATE OF b`, [a.bid, t.id])).rows[0];
        if (!bid) throw new BadRequestException('INVALID_BID');
        const contract = randomUUID(), end = addDays(a.start, a.days - 1);
        const title = awards.length > 1 ? `${t.title} — ${bid.name}` : t.title;
        // The provider still has to accept: until then the contract is only proposed and nothing can be delivered or paid.
        const number = (await tx.query(`INSERT INTO contract(id,tender_id,bid_id,client_id,provider_id,site_id,title,scope,committed_amount_xaf,committed_days,start_date,planned_end_date,payment_terms_days,quality_target,quality_criteria,created_by,status)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'PROPOSED') RETURNING number`,
          [contract, t.id, bid.id, t.client_id, bid.provider_id, t.site_id, title, t.object, a.amount, a.days, a.start, end, t.payment_terms_days, a.target, JSON.stringify(t.quality_criteria), s.user.id])).rows[0].number;
        // The schedule: one service at the end, or one per period when the contract runs over several months.
        const n = Math.min(a.installments, a.days), share = Math.floor(a.amount / n);
        for (let k = 1; k <= n; k++) {
          const planned = k === n ? end : addDays(a.start, Math.round((a.days * k) / n) - 1);
          const label = n === 1 ? 'Exécution complète de la prestation' : `Échéance ${k} sur ${n} — ${monthOf(planned)}`;
          await tx.query(`INSERT INTO contract_delivery(id,contract_id,position,label,planned_date,amount_xaf,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)`,
            [randomUUID(), contract, k, label, planned, k === n ? a.amount - share * (n - 1) : share, s.user.id]);
        }
        await tx.query(`UPDATE bid SET status='AWARDED',updated_at=now() WHERE id=$1`, [bid.id]);
        await this.event(tx, { tender: t.id, contract }, s.user.id, 'CONTRACT_CREATED', `${ref('CT', number)} — ${bid.name} — ${money(a.amount)}, ${a.days} j — en attente d’acceptation`);
        names.push(bid.name); contracts.push(contract);
      }
      await tx.query(`UPDATE bid SET status='NOT_RETAINED',updated_at=now() WHERE tender_id=$1 AND status IN ('SUBMITTED','SHORTLISTED')`, [t.id]);
      await tx.query(`UPDATE tender SET status='AWARDED',awarded_at=now(),decision_note=$2 WHERE id=$1`, [t.id, note]);
      return { event: 'AWARDED', reason: [names.join(', '), note].filter(Boolean).join(' — '), result: { contracts } };
    });
  }

  /** The tender file, printed: specification, reply form and award criteria (never the budget, never the other providers). */
  @Get('tenders/:id/document.pdf') async document(@Req() req: Request, @Param('id') id: string, @Query('lang') lang: string, @Res() res: Response) {
    const detail = await this.tender(req, id) as Record<string, any>;
    const pdf = await renderTender(detail, lang === 'en' ? 'en' : 'fr');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="TRACEOPS-${ref('AO', detail.number)}.pdf"`);
    res.end(pdf);
  }

  /* ================================================================ contracts */

  private async loadContract(s: Scope, id: string, tx?: PoolClient, lock = false): Promise<ContractRow> {
    uuid(id);
    const q = on(tx, this.db);
    const row = (await q.query(`SELECT c.*,EXISTS (SELECT 1 FROM membership m JOIN membership_role r ON r.membership_id=m.id
        WHERE m.organization_id=c.provider_id AND m.active AND r.role='PROVIDER_MANAGER') AS provider_online FROM contract c WHERE c.id=$1${lock ? ' FOR UPDATE OF c' : ''}`, [id])).rows[0] as ContractRow | undefined;
    if (!row) throw new NotFoundException('CONTRACT_NOT_FOUND');
    if (s.kind === 'CLIENT') {
      if (row.client_id !== s.org) throw new NotFoundException('CONTRACT_NOT_FOUND');
      if (!s.user.admin && !s.roles.includes('CLIENT_MANAGER')) {
        const granted = !row.site_id || (await q.query('SELECT 1 FROM site_grant WHERE membership_id=$1 AND site_id=$2', [s.membership, row.site_id])).rowCount;
        if (!s.roles.includes('CLIENT_CONTROLLER') || !granted) throw new NotFoundException('CONTRACT_NOT_FOUND');
      }
    } else if (row.provider_id !== s.org || !this.providerReader(s)) throw new NotFoundException('CONTRACT_NOT_FOUND');
    return row;
  }
  private contractActions(s: Scope, c: ContractRow) {
    const a: string[] = [];
    const client = s.kind === 'CLIENT' && c.client_id === s.org && !s.user.admin;
    const manager = client && s.roles.includes('CLIENT_MANAGER'), staff = client && (manager || s.roles.includes('CLIENT_CONTROLLER'));
    const supplier = this.supplier(s) && c.provider_id === s.org;
    if (c.status === 'PROPOSED' && supplier) a.push('RESPOND');
    // A provider without an account (offer recorded from paper or e-mail) answers in writing: the client manager records that answer.
    if (c.status === 'PROPOSED' && manager && !c.provider_online) a.push('RECORD_RESPONSE');
    if (c.status === 'ACTIVE') {
      if (manager) a.push('PLAN', 'CLOSE');
      if (staff) a.push('DECIDE', 'EVALUATE');
      if (supplier || manager) a.push('DELIVER');
    }
    if (manager) a.push('PAY');
    return a;
  }

  @Get('contracts') async contracts(@Req() req: Request) {
    const s = await this.scope(req);
    if (s.kind === 'PROVIDER' && !this.providerReader(s)) throw new ForbiddenException('FORBIDDEN');
    return (await this.db.query(`SELECT c.id,c.number,c.title,c.status,c.committed_amount_xaf,c.committed_days,c.start_date::text AS start_date,c.planned_end_date::text AS planned_end_date,
        c.actual_end_date::text AS actual_end_date,c.quality_target,c.payment_terms_days,c.closed_at,p.name AS provider_name,cl.name AS client_name,st.name AS site_name,t.number AS tender_number,t.service_type,
        (SELECT count(*)::int FROM contract_delivery d WHERE d.contract_id=c.id) AS deliveries,
        (SELECT count(*)::int FROM contract_delivery d WHERE d.contract_id=c.id AND d.decision='ACCEPTED') AS accepted,
        (SELECT count(*)::int FROM contract_delivery d WHERE d.contract_id=c.id AND d.decision='REJECTED') AS rejected,
        (SELECT count(*)::int FROM contract_delivery d WHERE d.contract_id=c.id AND d.decision='PENDING' AND d.delivered_at IS NOT NULL) AS to_decide,
        (SELECT count(*)::int FROM contract_delivery d WHERE d.contract_id=c.id AND d.decision<>'ACCEPTED' AND d.planned_date<$5::date) AS late,
        COALESCE((SELECT sum(d.amount_xaf) FROM contract_delivery d WHERE d.contract_id=c.id),0)::bigint AS planned_amount,
        COALESCE((SELECT sum(d.amount_xaf) FROM contract_delivery d WHERE d.contract_id=c.id AND d.decision='ACCEPTED'),0)::bigint AS accepted_amount,
        COALESCE((SELECT sum(COALESCE(y.paid_amount_xaf,y.amount_xaf)) FROM payment y JOIN contract_delivery d ON d.id=y.delivery_id WHERE d.contract_id=c.id AND y.status='PAID'),0)::bigint AS paid_amount,
        (SELECT count(*)::int FROM payment y JOIN contract_delivery d ON d.id=y.delivery_id WHERE d.contract_id=c.id AND y.status='PENDING' AND y.due_date<$5::date) AS overdue,
        (SELECT round(avg(e.average),2) FROM contract_evaluation e WHERE e.contract_id=c.id) AS quality,
        (SELECT count(*)::int FROM contract_evaluation e WHERE e.contract_id=c.id) AS evaluations,
        (SELECT max(e.evaluated_on)::text FROM contract_evaluation e WHERE e.contract_id=c.id) AS last_evaluation,
        (SELECT min(d.planned_date)::text FROM contract_delivery d WHERE d.contract_id=c.id AND d.decision<>'ACCEPTED') AS next_planned,
        (SELECT max(d.planned_date)::text FROM contract_delivery d WHERE d.contract_id=c.id) AS last_planned,
        (SELECT max((d.decided_at AT TIME ZONE '${TZ}')::date)::text FROM contract_delivery d WHERE d.contract_id=c.id AND d.decision='ACCEPTED') AS last_accepted
      FROM contract c JOIN organization p ON p.id=c.provider_id JOIN organization cl ON cl.id=c.client_id LEFT JOIN site st ON st.id=c.site_id LEFT JOIN tender t ON t.id=c.tender_id
      WHERE ($2='CLIENT' AND c.client_id=$1 AND ($3::boolean OR c.site_id IS NULL OR EXISTS(SELECT 1 FROM site_grant g WHERE g.membership_id=$4 AND g.site_id=c.site_id)))
         OR ($2='PROVIDER' AND c.provider_id=$1)
      ORDER BY c.status, c.start_date DESC LIMIT 300`,
      [s.org, s.kind, s.user.admin || s.roles.includes('CLIENT_MANAGER'), s.membership, siteToday()])).rows;
  }

  @Get('contracts/:id') async contract(@Req() req: Request, @Param('id') id: string) {
    const s = await this.scope(req);
    const row = await this.loadContract(s, id);
    const q = async (sql: string, v: unknown[] = [id]) => (await this.db.query(sql, v)).rows;
    const [head] = await q(`SELECT c.id,c.number,c.tender_id,c.bid_id,c.title,c.scope,c.committed_amount_xaf,c.committed_days,c.start_date::text AS start_date,c.planned_end_date::text AS planned_end_date,
        c.payment_terms_days,c.quality_target,c.quality_criteria,c.status,c.actual_end_date::text AS actual_end_date,c.closing_note,c.closed_at,c.created_at,
        p.name AS provider_name,cl.name AS client_name,st.name AS site_name,t.number AS tender_number,t.title AS tender_title,t.service_type,t.questions,
        u.display_name AS created_by_name,x.display_name AS closed_by_name,c.responded_at,c.decline_reason,r.display_name AS responded_by_name
      FROM contract c JOIN organization p ON p.id=c.provider_id JOIN organization cl ON cl.id=c.client_id LEFT JOIN site st ON st.id=c.site_id LEFT JOIN tender t ON t.id=c.tender_id
      JOIN app_user u ON u.id=c.created_by LEFT JOIN app_user x ON x.id=c.closed_by LEFT JOIN app_user r ON r.id=c.responded_by WHERE c.id=$1`);
    const bid = head.bid_id ? (await q(`SELECT amount_xaf,delay_days,content,strengths,answers,submitted_at FROM bid WHERE id=$1`, [head.bid_id]))[0] ?? null : null;
    const deliveries = await q(`SELECT d.id,d.position,d.label,d.planned_date::text AS planned_date,d.amount_xaf,d.delivered_at,d.delivery_note,d.decision,d.decision_reason,d.decided_at,
        du.display_name AS delivered_by,xu.display_name AS decided_by,
        y.id AS payment_id,y.status AS payment_status,y.due_date::text AS due_date,y.paid_on::text AS paid_on,y.paid_amount_xaf,y.reference,y.terms_days,y.accepted_at
      FROM contract_delivery d LEFT JOIN app_user du ON du.id=d.delivered_by LEFT JOIN app_user xu ON xu.id=d.decided_by LEFT JOIN payment y ON y.delivery_id=d.id
      WHERE d.contract_id=$1 ORDER BY d.planned_date,d.position`);
    const evaluations = await q(`SELECT e.id,e.evaluated_on::text AS evaluated_on,e.scores,e.average,e.comment,e.created_at,e.delivery_id,u.display_name AS evaluator,d.label AS delivery_label
      FROM contract_evaluation e JOIN app_user u ON u.id=e.evaluator_id LEFT JOIN contract_delivery d ON d.id=e.delivery_id WHERE e.contract_id=$1 ORDER BY e.evaluated_on DESC,e.created_at DESC`);
    const events = await q(`SELECT e.id,e.action,e.reason,e.created_at,u.display_name AS actor FROM procurement_event e JOIN app_user u ON u.id=e.actor_id WHERE e.contract_id=$1 ORDER BY e.created_at,e.id`);
    return { ...head, bid, deliveries, evaluations, events, today: siteToday(), actions: this.contractActions(s, row) };
  }

  /** Runs a guarded change on a contract: the action must be allowed for this person, right now. */
  private async onContract<T>(req: Request, id: string, action: string | string[], work: (tx: PoolClient, c: ContractRow, s: Scope) => Promise<{ event: string; reason?: string | null; result?: T }>) {
    const s = await this.scope(req);
    return this.db.transaction(async tx => {
      const c = await this.loadContract(s, id, tx, true);
      const allowed = this.contractActions(s, c);
      if (!([] as string[]).concat(action).some(a => allowed.includes(a))) throw new ForbiddenException('ACTION_NOT_ALLOWED');
      const out = await work(tx, c, s);
      await this.event(tx, { contract: c.id }, s.user.id, out.event, out.reason ?? null);
      await this.accounts.audit(tx, s.user.id, s.org, 'CONTRACT_' + out.event, c.id, out.reason ?? undefined);
      return out.result ?? { ok: true };
    });
  }
  private deliveryBody(body: unknown) {
    return { label: text(body, 'label', 200, true)!, planned: day(body, 'plannedDate', true)!, amount: int(body, 'amount', 1, 1e12, true)! };
  }
  @Post('contracts/:id/deliveries') addDelivery(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const v = this.deliveryBody(body);
    return this.onContract(req, id, 'PLAN', async (tx, c, s) => {
      const position = (await tx.query('SELECT COALESCE(max(position),0)+1 AS n FROM contract_delivery WHERE contract_id=$1', [c.id])).rows[0].n;
      const did = randomUUID();
      await tx.query('INSERT INTO contract_delivery(id,contract_id,position,label,planned_date,amount_xaf,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)', [did, c.id, position, v.label, v.planned, v.amount, s.user.id]);
      return { event: 'DELIVERY_PLANNED', reason: `${v.label} — ${money(v.amount)}`, result: { id: did } };
    });
  }
  @Post('contracts/:id/deliveries/:did') editDelivery(@Req() req: Request, @Param('id') id: string, @Param('did') did: string, @Body() body: unknown) {
    const v = this.deliveryBody(body);
    return this.onContract(req, id, 'PLAN', async (tx, c) => {
      const r = await tx.query(`UPDATE contract_delivery SET label=$3,planned_date=$4,amount_xaf=$5 WHERE id=$1 AND contract_id=$2 AND decision<>'ACCEPTED'`, [uuid(did), c.id, v.label, v.planned, v.amount]);
      if (!r.rowCount) throw new BadRequestException('DELIVERY_LOCKED');
      return { event: 'DELIVERY_EDITED', reason: `${v.label} — ${money(v.amount)}` };
    });
  }
  @Post('contracts/:id/deliveries/:did/remove') removeDelivery(@Req() req: Request, @Param('id') id: string, @Param('did') did: string) {
    return this.onContract(req, id, 'PLAN', async (tx, c) => {
      const r = await tx.query(`DELETE FROM contract_delivery WHERE id=$1 AND contract_id=$2 AND decision='PENDING' AND delivered_at IS NULL RETURNING label`, [uuid(did), c.id]);
      if (!r.rowCount) throw new BadRequestException('DELIVERY_LOCKED');
      return { event: 'DELIVERY_REMOVED', reason: r.rows[0].label };
    });
  }
  /** The provider (or the client for it) declares a service done; a rejected one can be delivered again. */
  @Post('contracts/:id/deliveries/:did/deliver') deliver(@Req() req: Request, @Param('id') id: string, @Param('did') did: string, @Body() body: unknown) {
    const note = text(body, 'note', 2000);
    return this.onContract(req, id, 'DELIVER', async (tx, c, s) => {
      const d = (await tx.query('SELECT id,label,decision FROM contract_delivery WHERE id=$1 AND contract_id=$2 FOR UPDATE', [uuid(did), c.id])).rows[0];
      if (!d) throw new NotFoundException('DELIVERY_NOT_FOUND');
      if (d.decision === 'ACCEPTED') throw new BadRequestException('DELIVERY_LOCKED');
      await tx.query(`UPDATE contract_delivery SET delivered_at=now(),delivered_by=$2,delivery_note=$3,decision='PENDING',decided_at=NULL,decided_by=NULL WHERE id=$1`, [d.id, s.user.id, note]);
      return { event: d.decision === 'REJECTED' ? 'DELIVERY_REDELIVERED' : 'DELIVERY_DONE', reason: [d.label, note].filter(Boolean).join(' — ') };
    });
  }
  /** Acceptance or rejection of a service. Accepted, it becomes payable after the contract's payment terms; rejected, it is never due. */
  @Post('contracts/:id/deliveries/:did/decision') decide(@Req() req: Request, @Param('id') id: string, @Param('did') did: string, @Body() body: unknown) {
    const accept = input(body).accept === true, reason = text(body, 'reason', 2000);
    if (!accept && !reason) throw new BadRequestException('REASON_REQUIRED');
    return this.onContract(req, id, 'DECIDE', async (tx, c, s) => {
      const d = (await tx.query('SELECT id,label,amount_xaf,decision FROM contract_delivery WHERE id=$1 AND contract_id=$2 FOR UPDATE', [uuid(did), c.id])).rows[0];
      if (!d) throw new NotFoundException('DELIVERY_NOT_FOUND');
      if (d.decision !== 'PENDING') throw new BadRequestException('DELIVERY_LOCKED');
      await tx.query(`UPDATE contract_delivery SET decision=$2,decision_reason=$3,decided_at=now(),decided_by=$4,delivered_at=COALESCE(delivered_at,now()) WHERE id=$1`,
        [d.id, accept ? 'ACCEPTED' : 'REJECTED', reason, s.user.id]);
      if (accept) await recordPayable(tx, { client: c.client_id, provider: c.provider_id, delivery: d.id, label: `${c.title} — ${d.label}`, amount: d.amount_xaf, terms: c.payment_terms_days });
      return { event: accept ? 'DELIVERY_ACCEPTED' : 'DELIVERY_REJECTED', reason: [d.label, reason].filter(Boolean).join(' — ') };
    });
  }
  /** Quality evaluation by an internal technician: every criterion gets a mark from 1 to 10, each one may carry its justification. */
  @Post('contracts/:id/evaluations') evaluate(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const b = input(body), evaluatedOn = day(b, 'evaluatedOn', true)!, comment = text(b, 'comment', 3000);
    if (evaluatedOn > siteToday()) throw new BadRequestException('INVALID_DATE');
    const delivery = b.deliveryId ? uuid(b.deliveryId) : null;
    const raw = Array.isArray(b.scores) && b.scores.length <= 15 ? b.scores : null;
    if (!raw) throw new BadRequestException('INVALID_INPUT');
    return this.onContract(req, id, 'EVALUATE', async (tx, c, s) => {
      if (delivery && !(await tx.query('SELECT 1 FROM contract_delivery WHERE id=$1 AND contract_id=$2', [delivery, c.id])).rowCount) throw new BadRequestException('DELIVERY_NOT_FOUND');
      const given = new Map(raw.map(x => { const v = input(x); return [String(v.key), v] as const; }));
      const scores = c.quality_criteria.map(q => {
        const v = given.get(q.key); const score = Number(v?.score);
        if (!v || !Number.isInteger(score) || score < 1 || score > 10) throw new BadRequestException('SCORES_REQUIRED');
        const justification = typeof v.justification === 'string' ? v.justification.trim().slice(0, 1000) : '';
        return { key: q.key, label: q.label, score, ...(justification ? { justification } : {}) };
      });
      if (!scores.length) throw new BadRequestException('SCORES_REQUIRED');
      const average = Math.round((scores.reduce((sum, x) => sum + x.score, 0) / scores.length) * 100) / 100;
      const eid = randomUUID();
      await tx.query('INSERT INTO contract_evaluation(id,contract_id,delivery_id,evaluator_id,evaluated_on,scores,average,comment) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
        [eid, c.id, delivery, s.user.id, evaluatedOn, JSON.stringify(scores), average, comment]);
      return { event: 'EVALUATED', reason: `${String(average).replace('.', ',')}/10`, result: { id: eid, average } };
    });
  }
  /**
   * The retained provider accepts the contract, or declines it with a reason. Accepted, it starts and links the provider to the
   * tender's site: a provider works for a client only after a tender it accepted. Declined, the tender reopens for another offer.
   */
  @Post('contracts/:id/respond') respond(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const accept = input(body).accept === true, reason = text(body, 'reason', 2000);
    if (!accept && !reason) throw new BadRequestException('REASON_REQUIRED');
    return this.onContract(req, id, ['RESPOND', 'RECORD_RESPONSE'], async (tx, c, s) => {
      const name = (await tx.query('SELECT name FROM organization WHERE id=$1', [c.provider_id])).rows[0].name as string;
      // Recorded by the client: the reference of the provider's written answer is required, whatever the answer.
      const recorded = s.kind === 'CLIENT';
      if (recorded && !reason) throw new BadRequestException('REASON_REQUIRED');
      if (accept) {
        await tx.query(`UPDATE contract SET status='ACTIVE',responded_at=now(),responded_by=$2 WHERE id=$1`, [c.id, s.user.id]);
        if (c.site_id && !(await tx.query('SELECT 1 FROM service_agreement WHERE site_id=$1 AND provider_id=$2 AND active AND (ends_at IS NULL OR ends_at>now())', [c.site_id, c.provider_id])).rowCount)
          await tx.query('INSERT INTO service_agreement(id,client_id,site_id,provider_id,starts_at) VALUES($1,$2,$3,$4,now())', [randomUUID(), c.client_id, c.site_id, c.provider_id]);
        if (c.tender_id) await this.event(tx, { tender: c.tender_id }, s.user.id, 'AWARD_ACCEPTED', recorded ? `${name} — ${reason}` : name);
        return { event: 'ACCEPTED_BY_PROVIDER', reason: recorded ? reason : null };
      }
      await tx.query(`UPDATE contract SET status='DECLINED',responded_at=now(),responded_by=$2,decline_reason=$3 WHERE id=$1`, [c.id, s.user.id, reason]);
      if (c.bid_id) await tx.query(`UPDATE bid SET status='DECLINED',updated_at=now() WHERE id=$1`, [c.bid_id]);
      if (c.tender_id) {
        const others = (await tx.query(`SELECT count(*)::int AS n FROM contract WHERE tender_id=$1 AND id<>$2 AND status IN ('PROPOSED','ACTIVE','CLOSED')`, [c.tender_id, c.id])).rows[0].n;
        // Nobody else retained: the offers are back in the analysis, so another one can be retained.
        if (!others) {
          await tx.query(`UPDATE tender SET status='CLOSED',awarded_at=NULL WHERE id=$1`, [c.tender_id]);
          await tx.query(`UPDATE bid SET status='SUBMITTED',updated_at=now() WHERE tender_id=$1 AND status='NOT_RETAINED'`, [c.tender_id]);
        }
        await this.event(tx, { tender: c.tender_id }, s.user.id, 'AWARD_DECLINED', `${name} — ${reason}`);
      }
      return { event: 'DECLINED_BY_PROVIDER', reason };
    });
  }

  /** Closing a contract freezes its final review: commitments against results in cost, delay and quality. */
  @Post('contracts/:id/close') closeContract(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const end = day(body, 'actualEndDate', true)!, note = text(body, 'note', 3000);
    if (end > siteToday()) throw new BadRequestException('INVALID_DATE');
    return this.onContract(req, id, 'CLOSE', async (tx, c, s) => {
      await tx.query(`UPDATE contract SET status='CLOSED',actual_end_date=$2,closing_note=$3,closed_at=now(),closed_by=$4 WHERE id=$1`, [c.id, end, note, s.user.id]);
      return { event: 'CLOSED', reason: note };
    });
  }

  /* ================================================================= payments */

  /**
   * Everything payable, from both sides of the work: the services of the contracts (to accept, accepted, rejected) and the
   * maintenance under an accepted quote. The service's acceptance and the payment's state are returned as two separate facts.
   */
  @Get('payments') async payments(@Req() req: Request) {
    const s = await this.scope(req);
    const col = s.kind === 'CLIENT' ? 'client_id' : 'provider_id';
    if (!(s.kind === 'CLIENT' ? this.clientReader(s) : this.providerReader(s))) throw new ForbiddenException('FORBIDDEN');
    return (await this.db.query(`SELECT * FROM (
        SELECT 'DELIVERY' AS kind,d.id AS item_id,c.id AS contract_id,NULL::uuid AS intervention_id,c.number AS parent_number,c.title AS parent_title,d.label,
          p.name AS provider_name,cl.name AS client_name,d.amount_xaf,d.planned_date::text AS planned_date,d.delivered_at,d.decision,d.decided_at,d.decision_reason,
          y.id AS payment_id,y.status AS payment_status,y.due_date::text AS due_date,y.paid_on::text AS paid_on,y.paid_amount_xaf,y.reference,y.terms_days,c.payment_terms_days AS default_terms
        FROM contract_delivery d JOIN contract c ON c.id=d.contract_id JOIN organization p ON p.id=c.provider_id JOIN organization cl ON cl.id=c.client_id
        LEFT JOIN payment y ON y.delivery_id=d.id WHERE c.${col}=$1 AND c.status<>'DECLINED'
        UNION ALL
        SELECT 'INTERVENTION',i.id,NULL,i.id,i.number,NULL,i.title,p.name,cl.name,q.amount_xaf,((i.ends_at AT TIME ZONE st.timezone)::date)::text,i.submitted_at,
          CASE WHEN i.status='ACCEPTED' THEN 'ACCEPTED' ELSE 'PENDING' END,i.accepted_at,NULL,
          y.id,y.status,y.due_date::text,y.paid_on::text,y.paid_amount_xaf,y.reference,y.terms_days,30
        FROM intervention i JOIN LATERAL (SELECT amount_xaf FROM quote WHERE intervention_id=i.id AND status='ACCEPTED' ORDER BY created_at DESC LIMIT 1) q ON true
        JOIN organization p ON p.id=i.provider_id JOIN organization cl ON cl.id=i.client_id JOIN site st ON st.id=i.site_id LEFT JOIN payment y ON y.intervention_id=i.id
        WHERE i.${col}=$1 AND i.status<>'CANCELLED'
      ) x ORDER BY COALESCE(x.due_date, x.planned_date) DESC, x.parent_number DESC LIMIT 1000`, [s.org])).rows;
  }
  @Post('payments/:id/pay') async pay(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const s = await this.scope(req); if (!this.manager(s)) throw new ForbiddenException('FORBIDDEN');
    const paidOn = day(body, 'paidOn', true)!, amount = int(body, 'amount', 1, 1e12), reference = text(body, 'reference', 120);
    if (paidOn > siteToday()) throw new BadRequestException('INVALID_DATE');
    return this.db.transaction(async tx => {
      const y = (await tx.query('SELECT * FROM payment WHERE id=$1 AND client_id=$2 FOR UPDATE', [uuid(id), s.org])).rows[0];
      if (!y) throw new NotFoundException('PAYMENT_NOT_FOUND');
      if (y.status === 'PAID') throw new ConflictException('ALREADY_PAID');
      const paid = amount ?? Number(y.amount_xaf);
      await tx.query(`UPDATE payment SET status='PAID',paid_on=$2,paid_amount_xaf=$3,reference=$4,paid_by=$5,paid_recorded_at=now() WHERE id=$1`, [y.id, paidOn, paid, reference, s.user.id]);
      const reason = [y.label, money(paid), reference].filter(Boolean).join(' — ');
      if (y.delivery_id) {
        const contract = (await tx.query('SELECT contract_id FROM contract_delivery WHERE id=$1', [y.delivery_id])).rows[0]?.contract_id;
        if (contract) await this.event(tx, { contract }, s.user.id, 'PAYMENT_RECORDED', reason);
      } else if (y.intervention_id) {
        const status = (await tx.query('SELECT status FROM intervention WHERE id=$1', [y.intervention_id])).rows[0]?.status;
        await tx.query('INSERT INTO intervention_event(id,intervention_id,actor_id,action,from_status,to_status,reason) VALUES($1,$2,$3,$4,$5,$5,$6)', [randomUUID(), y.intervention_id, s.user.id, 'PAYMENT_RECORDED', status, reason]);
      }
      await this.accounts.audit(tx, s.user.id, s.org, 'PAYMENT_RECORDED', y.id, reason);
      return { ok: true };
    });
  }

  /** What waits for this person, for the counters of the menu: offers to analyse or to send, services to accept, late payments. */
  @Get('procurement/summary') async summary(@Req() req: Request) {
    const s = await this.scope(req), today = siteToday(), soon = addDays(today, 7);
    const one = async (sql: string, v: unknown[]) => Number((await this.db.query(sql, v)).rows[0]?.n ?? 0);
    const out = { tenders: 0, contracts: 0, overdue: 0, dueSoon: 0 };
    if (s.kind === 'CLIENT') {
      if (this.clientReader(s)) {
        out.tenders = await one(`SELECT count(*)::int AS n FROM tender WHERE client_id=$1 AND (status='CLOSED' OR (status='PUBLISHED' AND deadline<now()))`, [s.org]);
        out.overdue = await one(`SELECT count(*)::int AS n FROM payment WHERE client_id=$1 AND status='PENDING' AND due_date<$2::date`, [s.org, today]);
        out.dueSoon = await one(`SELECT count(*)::int AS n FROM payment WHERE client_id=$1 AND status='PENDING' AND due_date>=$2::date AND due_date<=$3::date`, [s.org, today, soon]);
      }
      out.contracts = await one(`SELECT count(*)::int AS n FROM contract_delivery d JOIN contract c ON c.id=d.contract_id WHERE c.client_id=$1 AND c.status='ACTIVE' AND d.decision='PENDING' AND d.delivered_at IS NOT NULL
        AND ($2::boolean OR c.site_id IS NULL OR EXISTS(SELECT 1 FROM site_grant g WHERE g.membership_id=$3 AND g.site_id=c.site_id))`, [s.org, s.user.admin || s.roles.includes('CLIENT_MANAGER'), s.membership]);
    } else if (this.providerReader(s)) {
      out.tenders = await one(`SELECT count(*)::int AS n FROM tender t JOIN tender_invitation i ON i.tender_id=t.id AND i.provider_id=$1
        WHERE t.status='PUBLISHED' AND t.deadline>now() AND (i.response IS NULL OR i.response='ACCEPTED') AND NOT EXISTS (SELECT 1 FROM bid b WHERE b.tender_id=t.id AND b.provider_id=$1)`, [s.org]);
      out.contracts = await one(`SELECT count(*)::int AS n FROM contract WHERE provider_id=$1 AND status='PROPOSED'`, [s.org]) + await one(`SELECT count(*)::int AS n FROM contract_delivery d JOIN contract c ON c.id=d.contract_id WHERE c.provider_id=$1 AND c.status='ACTIVE'
        AND (d.decision='REJECTED' OR (d.decision='PENDING' AND d.delivered_at IS NULL AND d.planned_date<=$2::date))`, [s.org, today]);
      out.overdue = await one(`SELECT count(*)::int AS n FROM payment WHERE provider_id=$1 AND status='PENDING' AND due_date<$2::date`, [s.org, today]);
      out.dueSoon = await one(`SELECT count(*)::int AS n FROM payment WHERE provider_id=$1 AND status='PENDING' AND due_date>=$2::date AND due_date<=$3::date`, [s.org, today, soon]);
    }
    return out;
  }
}

@Module({ imports: [DatabaseModule, AccountsModule], controllers: [ProcurementController] })
export class ProcurementModule {}
