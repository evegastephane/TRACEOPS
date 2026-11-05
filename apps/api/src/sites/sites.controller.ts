import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Module, NotFoundException, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { AccountsModule } from '../accounts/accounts.controller.js';
import { AccountsService, field, uuid, Identity } from '../accounts/accounts.service.js';
import { Database, DatabaseModule } from '../database.module.js';

@Controller('sites')
export class SitesController {
 constructor(private readonly db:Database,private readonly accounts:AccountsService){}
 private async actor(req:Request){const u=await this.accounts.identify(req.cookies?.traceops_session);this.accounts.ensureReady(u);return u;}
 private async scope(req:Request){const user=await this.actor(req);const org=uuid(req.headers['x-organization-id']);const context=await this.accounts.context(user,org);return {user,org,context};}
 private reason(user:Identity,body:unknown){if(user.admin)field(body,'reason',500);}
 private async access(req:Request,id:string,write=false){
  const scope=await this.scope(req);uuid(id);
  const site=(await this.db.query('SELECT * FROM site WHERE id=$1 AND active',[id])).rows[0];
  if(!site)throw new NotFoundException('SITE_NOT_FOUND');
  const manager=scope.context.roles.includes('CLIENT_MANAGER');
  if(scope.user.admin)return {...scope,site};
  if(write){if(site.client_id!==scope.org||!manager)throw new ForbiddenException('FORBIDDEN');return {...scope,site};}
  const allowed=(await this.db.query(`SELECT 1 WHERE
   ($1::uuid=$2::uuid AND ($3::boolean OR EXISTS(SELECT 1 FROM site_grant g JOIN membership m ON m.id=g.membership_id
     WHERE g.site_id=$4 AND m.user_id=$5 AND m.organization_id=$1 AND m.active)))
   OR ($6::boolean AND EXISTS(SELECT 1 FROM service_agreement a WHERE a.site_id=$4 AND a.provider_id=$1
     AND a.active AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now())))`,
    [scope.org,site.client_id,manager,id,scope.user.id,scope.context.roles.includes('PROVIDER_MANAGER')])).rowCount;
  if(!allowed)throw new NotFoundException('SITE_NOT_FOUND');
  return {...scope,site};
 }
 @Get() async list(@Req()req:Request){const {user,org,context}=await this.scope(req);
  if(user.admin&&context.kind==='CLIENT')return (await this.db.query('SELECT id,name,sector,timezone FROM site WHERE client_id=$1 AND active ORDER BY name',[org])).rows;
  if(context.kind==='CLIENT')return (await this.db.query(`SELECT s.id,s.name,s.sector,s.timezone FROM site s WHERE s.client_id=$1 AND s.active AND
   ($2 OR EXISTS(SELECT 1 FROM site_grant g JOIN membership m ON m.id=g.membership_id WHERE g.site_id=s.id AND m.user_id=$3 AND m.organization_id=$1 AND m.active)) ORDER BY s.name`,[org,context.roles.includes('CLIENT_MANAGER'),user.id])).rows;
  if(!user.admin&&!context.roles.includes('PROVIDER_MANAGER'))return [];
  return (await this.db.query(`SELECT DISTINCT s.id,s.name,s.sector,s.timezone FROM site s JOIN service_agreement a ON a.site_id=s.id WHERE a.provider_id=$1 AND s.active AND a.active AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now()) ORDER BY s.name`,[org])).rows;
 }
 @Post() async create(@Req()req:Request,@Body()body:unknown){const {user,org,context}=await this.scope(req);
  if(context.kind!=='CLIENT'||(!user.admin&&!context.roles.includes('CLIENT_MANAGER')))throw new ForbiddenException('FORBIDDEN');
  this.reason(user,body);const name=field(body,'name'),sector=field(body,'sector');
  const timezone=(body as Record<string,unknown>).timezone===undefined?'Africa/Douala':field(body,'timezone');
  try{new Intl.DateTimeFormat('en',{timeZone:timezone});}catch{throw new BadRequestException('INVALID_TIMEZONE');}
  return this.db.transaction(async tx=>{const id=randomUUID();await tx.query('INSERT INTO site(id,client_id,name,sector,timezone) VALUES($1,$2,$3,$4,$5)',[id,org,name,sector,timezone]);
   await this.accounts.audit(tx,user.id,org,'SITE_CREATED',id,user.admin?field(body,'reason',500):undefined);return {id,name,sector,timezone};});
 }
 @Get(':id/zones')async zones(@Req()req:Request,@Param('id')id:string){await this.access(req,id);return(await this.db.query('SELECT id,parent_id,code,name,kind FROM zone WHERE site_id=$1 AND active ORDER BY code',[id])).rows;}
 @Post(':id/zones')async zone(@Req()req:Request,@Param('id')id:string,@Body()body:unknown){const {user,site}=await this.access(req,id,true);this.reason(user,body);
  const code=field(body,'code'),name=field(body,'name'),kind=field(body,'kind');const kinds=['BUILDING','FLOOR','AREA','ROOM','EQUIPMENT'];
  if(!kinds.includes(kind))throw new BadRequestException('INVALID_ZONE_TYPE');
  const parent=(body as Record<string,unknown>).parentId==null?null:uuid((body as Record<string,unknown>).parentId);
  try{return await this.db.transaction(async tx=>{
   await tx.query('SELECT id FROM site WHERE id=$1 FOR UPDATE',[id]);
   if(parent){const p=(await tx.query('SELECT kind FROM zone WHERE id=$1 AND site_id=$2 AND active',[parent,id])).rows[0];
    if(!p||kinds.indexOf(p.kind)>=kinds.indexOf(kind))throw new BadRequestException('INVALID_ZONE_PARENT');}
   const zoneId=randomUUID();await tx.query('INSERT INTO zone(id,site_id,parent_id,code,name,kind) VALUES($1,$2,$3,$4,$5,$6)',[zoneId,id,parent,code,name,kind]);
   await this.accounts.audit(tx,user.id,site.client_id,'ZONE_CREATED',zoneId,user.admin?field(body,'reason',500):undefined);return{id:zoneId,parent_id:parent,code,name,kind};
  });}catch(e){if((e as {code?:string}).code==='23505')throw new ConflictException('ZONE_CODE_EXISTS');throw e;}
 }
 @Post(':id/providers')async provider(@Req()req:Request,@Param('id')id:string,@Body()body:unknown){const {user,site}=await this.access(req,id,true);this.reason(user,body);const provider=uuid(field(body,'providerId'));
  return this.db.transaction(async tx=>{const p=(await tx.query("SELECT id FROM organization WHERE id=$1 AND active AND kind='PROVIDER'",[provider])).rows[0];if(!p)throw new BadRequestException('INVALID_PROVIDER');
   await tx.query('SELECT id FROM site WHERE id=$1 FOR UPDATE',[id]);
   if((await tx.query('SELECT 1 FROM service_agreement WHERE site_id=$1 AND provider_id=$2 AND active',[id,provider])).rowCount)throw new ConflictException('PROVIDER_ALREADY_LINKED');
   const agreement=randomUUID();await tx.query('INSERT INTO service_agreement(id,client_id,site_id,provider_id,starts_at) VALUES($1,$2,$3,$4,now())',[agreement,site.client_id,id,provider]);
   await this.accounts.audit(tx,user.id,site.client_id,'PROVIDER_LINKED',agreement,user.admin?field(body,'reason',500):undefined);return{id:agreement,providerId:provider};});
 }
 @Post(':id/controllers')async controller(@Req()req:Request,@Param('id')id:string,@Body()body:unknown){const {user,site}=await this.access(req,id,true);this.reason(user,body);const membership=uuid(field(body,'membershipId'));
  return this.db.transaction(async tx=>{const r=await tx.query(`SELECT 1 FROM membership m JOIN membership_role r ON r.membership_id=m.id WHERE m.id=$1 AND m.organization_id=$2 AND m.active AND r.role='CLIENT_CONTROLLER'`,[membership,site.client_id]);
   if(!r.rowCount)throw new BadRequestException('INVALID_CONTROLLER');await tx.query('INSERT INTO site_grant(membership_id,site_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[membership,id]);
   await this.accounts.audit(tx,user.id,site.client_id,'CONTROLLER_GRANTED',membership,user.admin?field(body,'reason',500):undefined);return{ok:true};});
 }
 @Post(':id/controllers/remove')async removeController(@Req()req:Request,@Param('id')id:string,@Body()body:unknown){const {user,site}=await this.access(req,id,true);this.reason(user,body);const membership=uuid(field(body,'membershipId'));
  return this.db.transaction(async tx=>{const r=await tx.query('DELETE FROM site_grant WHERE membership_id=$1 AND site_id=$2',[membership,id]);
   if(r.rowCount)await this.accounts.audit(tx,user.id,site.client_id,'CONTROLLER_REVOKED',membership,user.admin?field(body,'reason',500):undefined);return{ok:true};});
 }
}
@Module({imports:[DatabaseModule,AccountsModule],controllers:[SitesController]})
export class SitesModule{}
