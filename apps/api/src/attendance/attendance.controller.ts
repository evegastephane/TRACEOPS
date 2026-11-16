import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Module, NotFoundException, Param, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { AccountsModule } from '../accounts/accounts.controller.js';
import { AccountsService, uuid, type Identity } from '../accounts/accounts.service.js';
import { Database, DatabaseModule } from '../database.module.js';
import { localInstant } from '../interventions/interventions.controller.js';
import { TZ, siteToday } from '../procurement/payable.js';

type Scope = { user: Identity; org: string; kind: 'CLIENT' | 'PROVIDER'; roles: string[]; membership: string | null };
type Point = { id: string; client_id: string; site_id: string; zone_id: string | null; label: string; token: string; site_name: string; zone_name: string | null; client_name: string };
type Agent = { membership_id: string; provider_id: string; provider_name: string };
const input = (body: unknown) => { if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('INVALID_INPUT'); return body as Record<string, unknown>; };
function text(body: unknown, name: string, max: number, required = false) {
  const value = input(body)[name];
  if (value === undefined || value === null || value === '') { if (required) throw new BadRequestException('INVALID_INPUT'); return null; }
  if (typeof value !== 'string' || value.length > max) throw new BadRequestException('INVALID_INPUT');
  const v = value.trim(); if (required && !v) throw new BadRequestException('INVALID_INPUT');
  return v || null;
}
/** The address printed in the QR code: the public address of the application, then the point's token. */
const base = () => (process.env.PUBLIC_URL || process.env.APP_ORIGIN || 'http://localhost:3000').replace(/\/+$/, '');
export const pointLink = (token: string) => `${base()}/#pointage=${token}`;

@Controller()
export class AttendanceController {
  constructor(private readonly db: Database, private readonly accounts: AccountsService) {}

  private async scope(req: Request): Promise<Scope> {
    const user = await this.accounts.identify(req.cookies?.traceops_session); this.accounts.ensureReady(user);
    const org = uuid(req.headers['x-organization-id']);
    const context = await this.accounts.context(user, org);
    const membership = (await this.db.query('SELECT id FROM membership WHERE user_id=$1 AND organization_id=$2 AND active', [user.id, org])).rows[0]?.id ?? null;
    return { user, org, kind: context.kind, roles: context.roles, membership };
  }
  private clientManager(s: Scope) { return !s.user.admin && s.kind === 'CLIENT' && s.roles.includes('CLIENT_MANAGER'); }

  /** The QR points this organisation may print: a client's own sites, or the sites a provider works on. */
  private async visiblePoints(s: Scope, id?: string) {
    const wide = s.user.admin || s.roles.includes('CLIENT_MANAGER');
    if (s.kind === 'CLIENT' && !(wide || s.roles.includes('CLIENT_CONTROLLER'))) throw new ForbiddenException('FORBIDDEN');
    if (s.kind === 'PROVIDER' && !(s.user.admin || s.roles.includes('PROVIDER_MANAGER'))) throw new ForbiddenException('FORBIDDEN');
    return (await this.db.query(`SELECT p.id,p.label,p.token,p.created_at,p.site_id,p.zone_id,st.name AS site_name,z.name AS zone_name,z.code AS zone_code,c.name AS client_name,
        (SELECT count(*)::int FROM attendance a WHERE a.point_id=p.id AND a.at>now()-interval '7 days') AS scans_7d,
        (SELECT max(a.at) FROM attendance a WHERE a.point_id=p.id) AS last_scan
      FROM attendance_point p JOIN site st ON st.id=p.site_id LEFT JOIN zone z ON z.id=p.zone_id JOIN organization c ON c.id=p.client_id
      WHERE p.active AND ($5::uuid IS NULL OR p.id=$5)
        AND (($2='CLIENT' AND p.client_id=$1 AND ($3::boolean OR EXISTS(SELECT 1 FROM site_grant g WHERE g.membership_id=$4 AND g.site_id=p.site_id)))
          OR ($2='PROVIDER' AND EXISTS(SELECT 1 FROM service_agreement a WHERE a.site_id=p.site_id AND a.provider_id=$1 AND a.active AND (a.ends_at IS NULL OR a.ends_at>now()))))
      ORDER BY st.name,p.label`, [s.org, s.kind, wide, s.membership, id ?? null])).rows;
  }
  @Get('attendance/points') async points(@Req() req: Request) {
    const s = await this.scope(req);
    return (await this.visiblePoints(s)).map(p => ({ ...p, link: pointLink(p.token) }));
  }
  /** Client: a new QR point on one of its sites, optionally on a precise place (entrance, floor, room). */
  @Post('attendance/points') async createPoint(@Req() req: Request, @Body() body: unknown) {
    const s = await this.scope(req); if (!this.clientManager(s)) throw new ForbiddenException('FORBIDDEN');
    const b = input(body), site = uuid(b.siteId), zone = b.zoneId ? uuid(b.zoneId) : null, label = text(b, 'label', 120, true)!;
    return this.db.transaction(async tx => {
      if (!(await tx.query('SELECT 1 FROM site WHERE id=$1 AND client_id=$2 AND active', [site, s.org])).rowCount) throw new BadRequestException('INVALID_SITE');
      if (zone && !(await tx.query('SELECT 1 FROM zone WHERE id=$1 AND site_id=$2 AND active', [zone, site])).rowCount) throw new BadRequestException('INVALID_ZONE');
      const id = randomUUID(), token = randomBytes(16).toString('hex');
      await tx.query('INSERT INTO attendance_point(id,client_id,site_id,zone_id,label,token,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)', [id, s.org, site, zone, label, token, s.user.id]);
      await this.accounts.audit(tx, s.user.id, s.org, 'ATTENDANCE_POINT_CREATED', id, label);
      return { id, link: pointLink(token) };
    });
  }
  @Post('attendance/points/:id/archive') async archivePoint(@Req() req: Request, @Param('id') id: string) {
    const s = await this.scope(req); if (!this.clientManager(s)) throw new ForbiddenException('FORBIDDEN');
    return this.db.transaction(async tx => {
      const r = await tx.query('UPDATE attendance_point SET active=false WHERE id=$1 AND client_id=$2 AND active RETURNING label', [uuid(id), s.org]);
      if (!r.rowCount) throw new NotFoundException('POINT_NOT_FOUND');
      await this.accounts.audit(tx, s.user.id, s.org, 'ATTENDANCE_POINT_ARCHIVED', id, r.rows[0].label);
      return { ok: true };
    });
  }
  /** The poster to print and stick on the site: the QR code, where it is, and how to use it. */
  @Get('attendance/points/:id/poster.pdf') async poster(@Req() req: Request, @Param('id') id: string, @Res() res: Response) {
    const s = await this.scope(req);
    const p = (await this.visiblePoints(s, uuid(id)))[0];
    if (!p) throw new NotFoundException('POINT_NOT_FOUND');
    const link = pointLink(p.token), qr = QRCode.create(link, { errorCorrectionLevel: 'M' });
    const doc = new PDFDocument({ size: 'A4', margin: 56, info: { Title: `Pointage — ${p.site_name} — ${p.label}`, Author: 'TRACEOPS' } });
    const chunks: Buffer[] = []; doc.on('data', c => chunks.push(c));
    const ink = '#17262c', muted = '#55656c', accent = '#0e4a5c';
    doc.font('Helvetica-Bold').fontSize(12).fillColor(accent).text('TRACE', { continued: true }).font('Helvetica').text('OPS');
    doc.moveDown(1.2).font('Helvetica-Bold').fontSize(30).fillColor(ink).text('Pointage des agents', { align: 'center' });
    doc.moveDown(0.3).font('Helvetica').fontSize(15).fillColor(muted).text(`${p.site_name}${p.zone_name ? ` — ${p.zone_name}` : ''}`, { align: 'center' });
    doc.font('Helvetica-Bold').fontSize(18).fillColor(accent).text(p.label, { align: 'center' });
    const size = 300, n = qr.modules.size, cell = size / (n + 8), x0 = (595.28 - size) / 2, y0 = doc.y + 24;
    doc.rect(x0, y0, size, size).fill('#ffffff');
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.modules.get(r, c)) doc.rect(x0 + (c + 4) * cell, y0 + (r + 4) * cell, cell + 0.2, cell + 0.2).fill(ink);
    doc.y = y0 + size + 24;
    doc.font('Helvetica-Bold').fontSize(14).fillColor(ink).text('Avec votre téléphone :', 56, doc.y, { align: 'center', width: 483 });
    doc.moveDown(0.4).font('Helvetica').fontSize(13).fillColor(ink)
      .text('1. Ouvrez l’appareil photo et visez ce code.', { align: 'center', width: 483 })
      .text('2. Touchez le lien qui apparaît.', { align: 'center', width: 483 })
      .text('3. Choisissez « J’arrive », « Je pars » ou « Je suis absent ».', { align: 'center', width: 483 });
    doc.moveDown(0.6).font('Helvetica-Oblique').fontSize(10).fillColor(muted).text('Phone: open the camera, scan the code, then choose “I am arriving”, “I am leaving” or “I am absent”.', { align: 'center', width: 483 });
    doc.moveDown(1.2).font('Helvetica').fontSize(8.5).fillColor(muted).text(`${link}\n${p.client_name} · TRACEOPS · imprimé le ${new Date().toLocaleDateString('fr-FR', { timeZone: TZ, dateStyle: 'long' })}`, { align: 'center', width: 483 });
    doc.end();
    const pdf = await new Promise<Buffer>(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="TRACEOPS-pointage-${p.label.normalize('NFD').replace(/[^A-Za-z0-9]+/g, '-').slice(0, 40)}.pdf"`);
    res.end(pdf);
  }

  /* ------------------------------------------------------------- the scan */

  /** The scanned point, and the agent's team working on that site (an agent of a provider linked to the site). */
  private async resolve(req: Request, token: string): Promise<{ user: Identity; point: Point; agent: Agent }> {
    const user = await this.accounts.identify(req.cookies?.traceops_session); this.accounts.ensureReady(user);
    if (!/^[0-9a-f]{32}$/.test(token)) throw new NotFoundException('POINT_NOT_FOUND');
    const point = (await this.db.query(`SELECT p.id,p.client_id,p.site_id,p.zone_id,p.label,p.token,st.name AS site_name,z.name AS zone_name,c.name AS client_name
      FROM attendance_point p JOIN site st ON st.id=p.site_id LEFT JOIN zone z ON z.id=p.zone_id JOIN organization c ON c.id=p.client_id
      WHERE p.token=$1 AND p.active AND st.active`, [token])).rows[0] as Point | undefined;
    if (!point) throw new NotFoundException('POINT_NOT_FOUND');
    const agent = (await this.db.query(`SELECT m.id AS membership_id,m.organization_id AS provider_id,o.name AS provider_name
      FROM membership m JOIN membership_role r ON r.membership_id=m.id JOIN organization o ON o.id=m.organization_id
      WHERE m.user_id=$1 AND m.active AND r.role='FIELD_AGENT' AND o.active
        AND EXISTS(SELECT 1 FROM service_agreement a WHERE a.site_id=$2 AND a.provider_id=m.organization_id AND a.active AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now()))
      ORDER BY o.name LIMIT 1`, [user.id, point.site_id])).rows[0] as Agent | undefined;
    if (!agent) throw new ForbiddenException('NOT_ON_SITE');
    return { user, point, agent };
  }
  private async day(userId: string, membership: string, site: string) {
    const start = localInstant(siteToday(), '00:00', TZ);
    const records = (await this.db.query(`SELECT a.id,a.kind,a.at,a.reason,a.intervention_id,p.label AS point_label FROM attendance a LEFT JOIN attendance_point p ON p.id=a.point_id
      WHERE a.user_id=$1 AND a.site_id=$2 AND a.at>=$3 ORDER BY a.at`, [userId, site, start])).rows as { id: string; kind: string; at: Date; reason: string | null; intervention_id: string | null }[];
    const missions = (await this.db.query(`SELECT i.id,i.number,i.title,i.starts_at,i.ends_at,i.status FROM intervention i JOIN intervention_agent ag ON ag.intervention_id=i.id
      WHERE ag.membership_id=$1 AND i.site_id=$2 AND i.status<>'CANCELLED' AND i.starts_at>=$3 AND i.starts_at<$3::timestamptz + interval '1 day' ORDER BY i.starts_at`, [membership, site, start])).rows as { id: string; number: number; title: string; starts_at: Date; ends_at: Date }[];
    let open: { at: Date; intervention_id: string | null } | null = null;
    for (const r of records) if (r.kind === 'IN') open = r; else if (r.kind === 'OUT') open = null;
    return { records, missions, open };
  }
  @Get('attendance/scan/:token') async scanInfo(@Req() req: Request, @Param('token') token: string) {
    const { user, point, agent } = await this.resolve(req, token);
    const d = await this.day(user.id, agent.membership_id, point.site_id);
    return { point: { label: point.label, site_name: point.site_name, zone_name: point.zone_name, client_name: point.client_name }, provider: { id: agent.provider_id, name: agent.provider_name },
      agent: user.display_name, records: d.records, missions: d.missions, open: Boolean(d.open), now: new Date() };
  }
  /** Arrival, departure or absence, recorded at the server's time and linked to today's mission on that site when there is one. */
  @Post('attendance/scan/:token') async scan(@Req() req: Request, @Param('token') token: string, @Body() body: unknown) {
    const b = input(body), kind = text(b, 'kind', 10, true)!, reason = text(b, 'reason', 500), chosen = b.interventionId ? uuid(b.interventionId) : null;
    if (!['IN', 'OUT', 'ABSENT'].includes(kind)) throw new BadRequestException('INVALID_INPUT');
    if (kind === 'ABSENT' && !reason) throw new BadRequestException('REASON_REQUIRED');
    const { user, point, agent } = await this.resolve(req, token);
    return this.db.transaction(async tx => {
      await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', ['attendance:' + user.id]);
      const d = await this.day(user.id, agent.membership_id, point.site_id);
      if (kind === 'IN' && d.open) throw new ConflictException('ALREADY_IN');
      if (kind === 'OUT' && !d.open) throw new ConflictException('NOT_IN');
      if (chosen && !d.missions.some(m => m.id === chosen)) throw new BadRequestException('INVALID_MISSION');
      const now = Date.now();
      const mission = chosen ?? (kind === 'OUT' ? d.open?.intervention_id ?? null
        : [...d.missions].sort((x, y) => Math.abs(x.starts_at.getTime() - now) - Math.abs(y.starts_at.getTime() - now))[0]?.id ?? null);
      const id = randomUUID();
      const at = (await tx.query(`INSERT INTO attendance(id,point_id,client_id,site_id,provider_id,membership_id,user_id,intervention_id,kind,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING at`,
        [id, point.id, point.client_id, point.site_id, agent.provider_id, agent.membership_id, user.id, mission, kind, reason])).rows[0].at;
      await this.accounts.audit(tx, user.id, agent.provider_id, 'ATTENDANCE_' + kind, id, [point.site_name, point.label, reason].filter(Boolean).join(' — '));
      return { id, kind, at, intervention_id: mission };
    });
  }
  /** An agent who will not come declares the absence from the phone, for one of its missions; client and provider see it at once. */
  @Post('attendance/absence') async absence(@Req() req: Request, @Body() body: unknown) {
    const s = await this.scope(req);
    if (s.kind !== 'PROVIDER' || !s.roles.includes('FIELD_AGENT') || !s.membership) throw new ForbiddenException('FORBIDDEN');
    const intervention = uuid(input(body).interventionId), reason = text(body, 'reason', 500, true)!;
    return this.db.transaction(async tx => {
      const i = (await tx.query(`SELECT i.id,i.client_id,i.site_id,i.provider_id,i.number,i.ends_at FROM intervention i JOIN intervention_agent ag ON ag.intervention_id=i.id
        WHERE i.id=$1 AND ag.membership_id=$2 AND i.provider_id=$3 AND i.status IN ('PLANNED','ASSIGNED','IN_PROGRESS','REWORK')`, [intervention, s.membership, s.org])).rows[0];
      if (!i) throw new NotFoundException('MISSION_NOT_FOUND');
      if (new Date(i.ends_at).getTime() < Date.now()) throw new BadRequestException('MISSION_OVER');
      if ((await tx.query(`SELECT 1 FROM attendance WHERE intervention_id=$1 AND user_id=$2 AND kind='ABSENT'`, [i.id, s.user.id])).rowCount) throw new ConflictException('ALREADY_DECLARED');
      const id = randomUUID();
      await tx.query(`INSERT INTO attendance(id,client_id,site_id,provider_id,membership_id,user_id,intervention_id,kind,reason) VALUES($1,$2,$3,$4,$5,$6,$7,'ABSENT',$8)`,
        [id, i.client_id, i.site_id, i.provider_id, s.membership, s.user.id, i.id, reason]);
      await tx.query('INSERT INTO intervention_event(id,intervention_id,actor_id,action,from_status,to_status,reason) SELECT $1,$2,$3,$4,status,status,$5 FROM intervention WHERE id=$2',
        [randomUUID(), i.id, s.user.id, 'ABSENCE_DECLARED', reason]);
      await this.accounts.audit(tx, s.user.id, s.org, 'ATTENDANCE_ABSENT', id, reason);
      return { id };
    });
  }

  /** The register: arrivals, departures and absences, with the mission each one belongs to. Agents see their own. */
  @Get('attendance') async register(@Req() req: Request, @Query() query: Record<string, unknown>) {
    const s = await this.scope(req);
    const back = Math.min(92, Math.max(1, Number(query.days) || 7)), since = localInstant(siteToday(), '00:00', TZ).getTime() - (back - 1) * 86400000;
    const site = typeof query.siteId === 'string' && query.siteId ? uuid(query.siteId) : null;
    const client = s.kind === 'CLIENT', wide = s.user.admin || s.roles.includes(client ? 'CLIENT_MANAGER' : 'PROVIDER_MANAGER');
    if (client && !(wide || s.roles.includes('CLIENT_CONTROLLER'))) throw new ForbiddenException('FORBIDDEN');
    if (!client && !wide && !s.roles.includes('FIELD_AGENT')) throw new ForbiddenException('FORBIDDEN');
    return (await this.db.query(`SELECT a.id,a.kind,a.at,a.reason,a.site_id,a.membership_id,a.intervention_id,u.display_name AS agent_name,p.name AS provider_name,cl.name AS client_name,
        st.name AS site_name,pt.label AS point_label,i.number AS intervention_number,i.title AS intervention_title,i.starts_at AS planned_start,i.ends_at AS planned_end
      FROM attendance a JOIN app_user u ON u.id=a.user_id JOIN organization p ON p.id=a.provider_id JOIN organization cl ON cl.id=a.client_id JOIN site st ON st.id=a.site_id
      LEFT JOIN attendance_point pt ON pt.id=a.point_id LEFT JOIN intervention i ON i.id=a.intervention_id
      WHERE a.at>=$2 AND ($6::uuid IS NULL OR a.site_id=$6)
        AND (($3='CLIENT' AND a.client_id=$1 AND ($4::boolean OR EXISTS(SELECT 1 FROM site_grant g WHERE g.membership_id=$5 AND g.site_id=a.site_id)))
          OR ($3='PROVIDER' AND a.provider_id=$1 AND ($4::boolean OR a.user_id=$7)))
      ORDER BY a.at DESC LIMIT 2000`, [s.org, new Date(since), s.kind, wide, s.membership, site, s.user.id])).rows;
  }
}

@Module({ imports: [DatabaseModule, AccountsModule], controllers: [AttendanceController] })
export class AttendanceModule {}
