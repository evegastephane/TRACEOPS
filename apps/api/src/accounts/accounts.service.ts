import { BadRequestException, ConflictException, ForbiddenException, HttpException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PoolClient } from 'pg';
import { Database } from '../database.module.js';
import { hashPassword, verifyPassword, temporaryPassword as generateTemporaryPassword } from '../domain/password.js';

export const digest = (text: string) => createHash('sha256').update(text).digest();
export function field(body: unknown, name: string, max = 120): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('INVALID_INPUT');
  const value = (body as Record<string, unknown>)[name];
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new BadRequestException('INVALID_INPUT');
  return value;
}
export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new BadRequestException('INVALID_CONTEXT');
  return value;
}
const loginName = (body: unknown) => {
  const value = field(body, 'login').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._@+-]{2,119}$/.test(value)) throw new BadRequestException('INVALID_LOGIN');
  return value;
};
export interface Identity { id: string; login: string; display_name: string; must_change_password: boolean; locale: string; admin: boolean; }

@Injectable()
export class AccountsService {
  private readonly dummy = hashPassword(randomBytes(24).toString('hex'));
  constructor(private readonly db: Database) {}
  async throttle(key: string, limit = 10) {
    const result = await this.db.query(`INSERT INTO auth_rate_limit(key_hash,attempts,reset_at)
      VALUES ($1,1,now()+interval '15 minutes') ON CONFLICT (key_hash) DO UPDATE SET
      attempts=CASE WHEN auth_rate_limit.reset_at<=now() THEN 1 ELSE auth_rate_limit.attempts+1 END,
      reset_at=CASE WHEN auth_rate_limit.reset_at<=now() THEN now()+interval '15 minutes' ELSE auth_rate_limit.reset_at END RETURNING attempts`, [digest(key).toString('hex')]);
    if (result.rows[0].attempts > limit) throw new HttpException('TOO_MANY_ATTEMPTS', 429);
  }
  async audit(tx: PoolClient, actor: string, org: string | null, action: string, target: string | null, reason?: string) {
    await tx.query('INSERT INTO access_audit(id,actor_id,organization_id,action,target_id,reason) VALUES($1,$2,$3,$4,$5,$6)', [randomUUID(), actor, org, action, target, reason ?? null]);
  }
  async session(tx: PoolClient, userId: string) {
    const token = randomBytes(32).toString('hex');
    await tx.query("INSERT INTO user_session(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')", [digest(token), userId]);
    return token;
  }
  async login(body: unknown, ip: string) {
    await this.throttle('ip:'+ip, 40);
    const login = loginName(body), password = field(body, 'password', 1024);
    await this.throttle('login:'+login);
    return this.db.transaction(async tx => {
      const result = await tx.query('SELECT * FROM app_user WHERE lower(login)=$1 FOR UPDATE', [login]);
      const user = result.rows[0];
      const valid = await verifyPassword(password, user?.password_hash ?? await this.dummy);
      if (!valid || !user?.active) throw new UnauthorizedException('INVALID_CREDENTIALS');
      await this.audit(tx,user.id,null,'LOGIN',user.id);
      return this.session(tx,user.id);
    });
  }
  async identify(token: unknown): Promise<Identity> {
    if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) throw new UnauthorizedException('SESSION_REQUIRED');
    const r = await this.db.query<Identity>(`SELECT u.id,u.login,u.display_name,u.must_change_password,u.locale,
      EXISTS(SELECT 1 FROM platform_admin p WHERE p.user_id=u.id AND p.active) AS admin
      FROM user_session s JOIN app_user u ON u.id=s.user_id
      WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.active`, [digest(token)]);
    if (!r.rows[0]) throw new UnauthorizedException('SESSION_REQUIRED');
    return r.rows[0];
  }
  async me(user: Identity) {
    const r = await this.db.query(`SELECT o.id,o.name,o.kind,array_agg(r.role ORDER BY r.role) AS roles
      FROM membership m JOIN organization o ON o.id=m.organization_id JOIN membership_role r ON r.membership_id=m.id
      WHERE m.user_id=$1 AND m.active AND o.active GROUP BY o.id ORDER BY o.name`, [user.id]);
    return { ...user, memberships: r.rows };
  }
  async changePassword(user: Identity, body: unknown) {
    const current = field(body,'currentPassword',1024), next = field(body,'newPassword',1024);
    if (current === next) throw new BadRequestException('PASSWORD_UNCHANGED');
    let encoded: string;
    try { encoded = await hashPassword(next); } catch { throw new BadRequestException('PASSWORD_POLICY'); }
    return this.db.transaction(async tx => {
      const r=await tx.query('SELECT password_hash FROM app_user WHERE id=$1 AND active FOR UPDATE',[user.id]);
      if (!r.rows[0] || !await verifyPassword(current,r.rows[0].password_hash)) throw new UnauthorizedException('INVALID_CREDENTIALS');
      await tx.query('UPDATE app_user SET password_hash=$1,must_change_password=false WHERE id=$2',[encoded,user.id]);
      await tx.query('UPDATE user_session SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL',[user.id]);
      await this.audit(tx,user.id,null,'PASSWORD_CHANGED',user.id);
      return this.session(tx,user.id);
    });
  }
  async logout(token: string) { await this.db.query('UPDATE user_session SET revoked_at=now() WHERE token_hash=$1',[digest(token)]); }
  ensureReady(user: Identity) { if (user.must_change_password) throw new ForbiddenException('PASSWORD_CHANGE_REQUIRED'); }
  async admin(user: Identity) {
    this.ensureReady(user);
    if (!user.admin) throw new ForbiddenException('FORBIDDEN');
  }
  async context(user: Identity, org: string, manager = false) {
    this.ensureReady(user);
    const r=await this.db.query(`SELECT o.id,o.name,o.kind,
      COALESCE(array_agg(r.role) FILTER (WHERE r.role IS NOT NULL),'{}') AS roles
      FROM organization o LEFT JOIN membership m ON m.organization_id=o.id AND m.user_id=$2 AND m.active
      LEFT JOIN membership_role r ON r.membership_id=m.id
      WHERE o.id=$1 AND o.active GROUP BY o.id`,[uuid(org),user.id]);
    const row=r.rows[0];
    if (!row || (!user.admin && (!row.roles.length || (manager && !row.roles.some((x: string)=>['CLIENT_MANAGER','PROVIDER_MANAGER'].includes(x)))))) throw new ForbiddenException('FORBIDDEN');
    return row;
  }
  async organizations(user: Identity) { await this.admin(user); return (await this.db.query('SELECT id,name,kind,active FROM organization ORDER BY name')).rows; }
  async createOrganization(user: Identity, body: unknown) {
    await this.admin(user);
    const name=field(body,'name').trim(), kind=field(body,'kind');
    if (!['CLIENT','PROVIDER'].includes(kind)) throw new BadRequestException('INVALID_INPUT');
    return this.db.transaction(async tx=>{
      const id=randomUUID();
      await tx.query('INSERT INTO organization(id,name,kind) VALUES($1,$2,$3)',[id,name,kind]);
      await this.audit(tx,user.id,id,'ORGANIZATION_CREATED',id);
      return {id,name,kind,active:true};
    });
  }
  async members(user: Identity, org: string) {
    await this.context(user,org,true);
    return (await this.db.query(`SELECT u.id,m.id AS membership_id,u.display_name,u.login,m.active,array_agg(r.role ORDER BY r.role) AS roles
      FROM membership m JOIN app_user u ON u.id=m.user_id JOIN membership_role r ON r.membership_id=m.id
      WHERE m.organization_id=$1 GROUP BY u.id,m.id ORDER BY u.display_name`,[org])).rows;
  }
  async invite(user: Identity, org: string, body: unknown) {
    const context=await this.context(user,org,true), role=field(body,'role');
    const allowed=context.kind==='CLIENT'?['CLIENT_MANAGER','CLIENT_CONTROLLER']:['PROVIDER_MANAGER'];
    if (!allowed.includes(role)) throw new BadRequestException('INVALID_ROLE');
    await this.throttle('invite:'+user.id,40);
    return this.db.transaction(async tx=>{
      const token=randomBytes(32).toString('hex'), id=randomUUID();
      await tx.query("INSERT INTO invitation(id,token_hash,organization_id,role,created_by,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '48 hours')",[id,digest(token),org,role,user.id]);
      await this.audit(tx,user.id,org,'INVITATION_CREATED',id);
      return { token, expiresInHours:48 };
    });
  }
  async accept(body: unknown, ip: string) {
    await this.throttle('accept:'+ip,30);
    const token=field(body,'token',64), login=loginName(body), password=field(body,'password',1024), name=field(body,'displayName');
    if (!/^[0-9a-f]{64}$/.test(token)) throw new BadRequestException('INVALID_INVITATION');
    return this.db.transaction(async tx=>{
      const result=await tx.query(`SELECT i.* FROM invitation i JOIN organization o ON o.id=i.organization_id
        WHERE i.token_hash=$1 AND i.accepted_at IS NULL AND i.expires_at>now() AND o.active FOR UPDATE OF i`,[digest(token)]);
      const invite=result.rows[0];
      if (!invite) throw new BadRequestException('INVALID_INVITATION');
      // Serializes account creation through different invitations with the same login.
      await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[login]);
      const existing=(await tx.query('SELECT * FROM app_user WHERE lower(login)=$1 FOR UPDATE',[login])).rows[0];
      let id: string;
      if (existing) {
        if (!existing.active || existing.must_change_password || !await verifyPassword(password,existing.password_hash)) throw new UnauthorizedException('INVALID_CREDENTIALS');
        id=existing.id;
      } else {
        let hash: string; try { hash=await hashPassword(password); } catch { throw new BadRequestException('PASSWORD_POLICY'); }
        id=randomUUID();
        await tx.query('INSERT INTO app_user(id,login,password_hash,display_name,must_change_password) VALUES($1,$2,$3,$4,false)',[id,login,hash,name]);
      }
      const member=randomUUID();
      const membership=(await tx.query(`INSERT INTO membership(id,user_id,organization_id) VALUES($1,$2,$3)
        ON CONFLICT (user_id,organization_id) DO UPDATE SET active=true RETURNING id`,[member,id,invite.organization_id])).rows[0].id;
      await tx.query('INSERT INTO membership_role(membership_id,role) VALUES($1,$2) ON CONFLICT DO NOTHING',[membership,invite.role]);
      await tx.query('UPDATE invitation SET accepted_at=now(),accepted_by=$1 WHERE id=$2',[id,invite.id]);
      await this.audit(tx,id,invite.organization_id,'INVITATION_ACCEPTED',invite.id);
      return this.session(tx,id);
    });
  }
  async createAgent(user: Identity, org: string, body: unknown) {
    const context=await this.context(user,org,true);
    if (context.kind!=='PROVIDER') throw new ForbiddenException('FORBIDDEN');
    await this.throttle('agent-create:'+user.id,40);
    const login=loginName(body), name=field(body,'displayName');
    const temporaryPassword=generateTemporaryPassword(), hash=await hashPassword(temporaryPassword);
    try {
      return await this.db.transaction(async tx=>{
        const id=randomUUID(), membership=randomUUID();
        await tx.query('INSERT INTO app_user(id,login,password_hash,display_name) VALUES($1,$2,$3,$4)',[id,login,hash,name]);
        await tx.query('INSERT INTO membership(id,user_id,organization_id) VALUES($1,$2,$3)',[membership,id,org]);
        await tx.query("INSERT INTO membership_role(membership_id,role) VALUES($1,'FIELD_AGENT')",[membership]);
        await this.audit(tx,user.id,org,'AGENT_CREATED',id);
        return {id,login,displayName:name,temporaryPassword};
      });
    } catch(e) { if ((e as {code?:string}).code==='23505') throw new ConflictException('LOGIN_UNAVAILABLE'); throw e; }
  }

  /* Company details. Any member reads them; managers (and the administrator) edit them. */
  async profile(user: Identity, org: string) {
    await this.context(user,org);
    const r=await this.db.query(`SELECT o.name,o.kind,p.address,p.city,p.phone,p.email,p.niu,p.rccm,p.services,p.description,p.contact_name,p.updated_at
      FROM organization o LEFT JOIN organization_profile p ON p.organization_id=o.id WHERE o.id=$1`,[org]);
    return r.rows[0];
  }
  async updateProfile(user: Identity, org: string, body: unknown) {
    await this.context(user,org,true);
    const name=field(body,'name').trim();
    const v={ address:optional(body,'address',200), city:optional(body,'city',120), phone:optional(body,'phone',40), email:optional(body,'email',160),
      niu:optional(body,'niu',40), rccm:optional(body,'rccm',60), services:optional(body,'services',300), description:optional(body,'description',1000), contactName:optional(body,'contactName',120) };
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) throw new BadRequestException('INVALID_EMAIL');
    if (v.phone && !/^\+?[0-9 ().-]{6,40}$/.test(v.phone)) throw new BadRequestException('INVALID_PHONE');
    await this.db.transaction(async tx=>{
      await tx.query('UPDATE organization SET name=$2 WHERE id=$1',[org,name]);
      await tx.query(`INSERT INTO organization_profile(organization_id,address,city,phone,email,niu,rccm,services,description,contact_name,updated_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (organization_id) DO UPDATE SET address=$2,city=$3,phone=$4,email=$5,niu=$6,rccm=$7,
        services=$8,description=$9,contact_name=$10,updated_by=$11,updated_at=now()`,
        [org,v.address,v.city,v.phone,v.email,v.niu,v.rccm,v.services,v.description,v.contactName,user.id]);
      await this.audit(tx,user.id,org,'PROFILE_UPDATED',org);
    });
    return this.profile(user,org);
  }

  /* Field agents of a provider: edit, withdraw from the team (history kept), reactivate. */
  private async manageable(tx: PoolClient, user: Identity, org: string, membership: string) {
    const context=await this.context(user,org,true);
    const row=(await tx.query('SELECT id,user_id,active FROM membership WHERE id=$1 AND organization_id=$2 FOR UPDATE',[uuid(membership),org])).rows[0];
    if (!row) throw new NotFoundException('MEMBER_NOT_FOUND');
    if (row.user_id===user.id) throw new ForbiddenException('SELF_FORBIDDEN');
    const roles=(await tx.query('SELECT role FROM membership_role WHERE membership_id=$1',[row.id])).rows.map((r: {role:string})=>r.role);
    if (!user.admin && !(context.kind==='PROVIDER' && roles.length===1 && roles[0]==='FIELD_AGENT')) throw new ForbiddenException('FORBIDDEN');
    return row as {id:string;user_id:string;active:boolean};
  }
  async updateMember(user: Identity, org: string, membership: string, body: unknown) {
    const name=field(body,'displayName').trim();
    return this.db.transaction(async tx=>{
      const row=await this.manageable(tx,user,org,membership);
      await tx.query('UPDATE app_user SET display_name=$2 WHERE id=$1',[row.user_id,name]);
      await this.audit(tx,user.id,org,'MEMBER_UPDATED',row.user_id);
      return {ok:true};
    });
  }
  async setMemberActive(user: Identity, org: string, membership: string, active: boolean) {
    return this.db.transaction(async tx=>{
      const row=await this.manageable(tx,user,org,membership);
      await tx.query('UPDATE membership SET active=$2 WHERE id=$1',[row.id,active]);
      if (active) await tx.query('UPDATE app_user SET active=true WHERE id=$1',[row.user_id]);
      else {
        await tx.query('DELETE FROM agent_assignment WHERE membership_id=$1',[row.id]);
        // An account with no other team and no platform role can no longer sign in.
        const other=(await tx.query(`SELECT 1 FROM membership WHERE user_id=$1 AND active
          UNION SELECT 1 FROM platform_admin WHERE user_id=$1 AND active`,[row.user_id])).rowCount;
        if (!other) await tx.query('UPDATE app_user SET active=false WHERE id=$1',[row.user_id]);
        await tx.query('UPDATE user_session SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL',[row.user_id]);
      }
      await this.audit(tx,user.id,org,active?'MEMBER_REACTIVATED':'MEMBER_WITHDRAWN',row.user_id);
      return {ok:true};
    });
  }

  /* Agent assignments to the places of the sites the provider is linked to. */
  async assignments(user: Identity, org: string) {
    await this.context(user,org,true);
    const rows=(await this.db.query(`SELECT a.membership_id,z.id AS zone_id,z.code,z.name,z.kind,s.id AS site_id,s.name AS site_name
      FROM agent_assignment a JOIN membership m ON m.id=a.membership_id JOIN zone z ON z.id=a.zone_id JOIN site s ON s.id=z.site_id
      WHERE m.organization_id=$1 AND m.active AND z.active AND s.active ORDER BY s.name,z.code`,[org])).rows;
    const sites=[...new Set(rows.map((r: {site_id:string})=>r.site_id))];
    const zones=sites.length ? (await this.db.query('SELECT id,parent_id,name FROM zone WHERE site_id=ANY($1)',[sites])).rows as {id:string;parent_id:string|null;name:string}[] : [];
    const byId=new Map(zones.map(z=>[z.id,z]));
    return rows.map((r: {zone_id:string})=>{
      const path: string[]=[]; let parent=byId.get(r.zone_id)?.parent_id; const seen=new Set<string>();
      while (parent && !seen.has(parent)) { seen.add(parent); const z=byId.get(parent); if (!z) break; path.unshift(z.name); parent=z.parent_id; }
      return {...r,path};
    });
  }
  private async assignment(tx: PoolClient, user: Identity, org: string, body: unknown) {
    const context=await this.context(user,org,true);
    if (context.kind!=='PROVIDER') throw new ForbiddenException('FORBIDDEN');
    const membership=uuid(field(body,'membershipId')), zone=uuid(field(body,'zoneId'));
    const agent=(await tx.query(`SELECT 1 FROM membership m JOIN membership_role r ON r.membership_id=m.id
      WHERE m.id=$1 AND m.organization_id=$2 AND m.active AND r.role='FIELD_AGENT'`,[membership,org])).rowCount;
    if (!agent) throw new BadRequestException('INVALID_AGENT');
    const place=(await tx.query(`SELECT 1 FROM zone z JOIN site s ON s.id=z.site_id JOIN service_agreement a ON a.site_id=s.id
      WHERE z.id=$1 AND z.active AND s.active AND a.provider_id=$2 AND a.active AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now())`,[zone,org])).rowCount;
    if (!place) throw new BadRequestException('INVALID_ZONE');
    return {membership,zone};
  }
  async assign(user: Identity, org: string, body: unknown) {
    return this.db.transaction(async tx=>{
      const {membership,zone}=await this.assignment(tx,user,org,body);
      await tx.query('INSERT INTO agent_assignment(membership_id,zone_id,created_by) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[membership,zone,user.id]);
      await this.audit(tx,user.id,org,'AGENT_ASSIGNED',zone);
      return {ok:true};
    });
  }
  async unassign(user: Identity, org: string, body: unknown) {
    return this.db.transaction(async tx=>{
      const membership=uuid(field(body,'membershipId')), zone=uuid(field(body,'zoneId'));
      const context=await this.context(user,org,true);
      if (context.kind!=='PROVIDER') throw new ForbiddenException('FORBIDDEN');
      const r=await tx.query(`DELETE FROM agent_assignment a USING membership m WHERE a.membership_id=m.id AND m.organization_id=$1 AND a.membership_id=$2 AND a.zone_id=$3`,[org,membership,zone]);
      if (r.rowCount) await this.audit(tx,user.id,org,'AGENT_UNASSIGNED',zone);
      return {ok:true};
    });
  }
}

function optional(body: unknown, name: string, max: number): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('INVALID_INPUT');
  const value=(body as Record<string, unknown>)[name];
  if (value===undefined || value===null) return null;
  if (typeof value!=='string' || value.length>max) throw new BadRequestException('INVALID_INPUT');
  return value.trim() || null;
}
