import { Body, Controller, Get, Module, Param, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DatabaseModule } from '../database.module.js';
import { AccountsService, uuid } from './accounts.service.js';

@Controller()
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}
  private user(req: Request) { return this.accounts.identify(req.cookies?.traceops_session); }
  private cookie(res: Response, token: string) {
    res.cookie('traceops_session',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:8*60*60*1000});
  }
  @Post('auth/login') async login(@Body() body: unknown,@Req() req: Request,@Res({passthrough:true}) res: Response) {
    this.cookie(res,await this.accounts.login(body,req.ip??'unknown')); return {ok:true};
  }
  @Get('auth/me') async me(@Req() req: Request) { return this.accounts.me(await this.user(req)); }
  @Post('auth/logout') async logout(@Req() req: Request,@Res({passthrough:true}) res: Response) {
    await this.user(req); await this.accounts.logout(req.cookies.traceops_session); res.clearCookie('traceops_session',{path:'/'}); return {ok:true};
  }
  @Post('auth/password') async password(@Body() body: unknown,@Req() req: Request,@Res({passthrough:true}) res: Response) {
    const user=await this.user(req); await this.accounts.throttle('password:'+user.id);
    this.cookie(res,await this.accounts.changePassword(user,body)); return {ok:true};
  }
  @Post('auth/accept') async accept(@Body() body: unknown,@Req() req: Request,@Res({passthrough:true}) res: Response) {
    this.cookie(res,await this.accounts.accept(body,req.ip??'unknown')); return {ok:true};
  }
  @Get('admin/organizations') async organizations(@Req() req: Request) { return this.accounts.organizations(await this.user(req)); }
  @Post('admin/organizations') async createOrganization(@Body() body: unknown,@Req() req: Request) { return this.accounts.createOrganization(await this.user(req),body); }
  @Get('organization/members') async members(@Req() req: Request) { return this.accounts.members(await this.user(req),uuid(req.headers['x-organization-id'])); }
  @Post('organization/invitations') async invite(@Body() body: unknown,@Req() req: Request) { return this.accounts.invite(await this.user(req),uuid(req.headers['x-organization-id']),body); }
  @Post('organization/agents') async agent(@Body() body: unknown,@Req() req: Request) { return this.accounts.createAgent(await this.user(req),uuid(req.headers['x-organization-id']),body); }
  @Get('admin/audit') async audit(@Query() query: Record<string, unknown>,@Req() req: Request) { return this.accounts.auditLog(await this.user(req),query); }
  @Get('admin/overview') async platform(@Req() req: Request) { return this.accounts.platformOverview(await this.user(req)); }
  @Get('admin/audit/actions') async auditActions(@Req() req: Request) { return this.accounts.auditActions(await this.user(req)); }
  @Post('auth/account') async account(@Body() body: unknown,@Req() req: Request) { return this.accounts.updateAccount(await this.user(req),body); }
  @Get('organization/directory') async directory(@Req() req: Request) { return this.accounts.directory(await this.user(req),uuid(req.headers['x-organization-id'])); }
  @Get('organization/overview') async overview(@Req() req: Request) { return this.accounts.overview(await this.user(req),uuid(req.headers['x-organization-id'])); }
  @Get('organization/profile') async profile(@Req() req: Request) { return this.accounts.profile(await this.user(req),uuid(req.headers['x-organization-id'])); }
  @Post('organization/profile') async updateProfile(@Body() body: unknown,@Req() req: Request) { return this.accounts.updateProfile(await this.user(req),uuid(req.headers['x-organization-id']),body); }
  @Post('organization/members/:id') async updateMember(@Param('id') id: string,@Body() body: unknown,@Req() req: Request) { return this.accounts.updateMember(await this.user(req),uuid(req.headers['x-organization-id']),id,body); }
  @Post('organization/members/:id/withdraw') async withdraw(@Param('id') id: string,@Req() req: Request) { return this.accounts.setMemberActive(await this.user(req),uuid(req.headers['x-organization-id']),id,false); }
  @Post('organization/members/:id/reactivate') async reactivate(@Param('id') id: string,@Req() req: Request) { return this.accounts.setMemberActive(await this.user(req),uuid(req.headers['x-organization-id']),id,true); }
  @Get('organization/assignments') async assignments(@Req() req: Request) { return this.accounts.assignments(await this.user(req),uuid(req.headers['x-organization-id'])); }
  @Post('organization/assignments') async assign(@Body() body: unknown,@Req() req: Request) { return this.accounts.assign(await this.user(req),uuid(req.headers['x-organization-id']),body); }
  @Post('organization/assignments/remove') async unassign(@Body() body: unknown,@Req() req: Request) { return this.accounts.unassign(await this.user(req),uuid(req.headers['x-organization-id']),body); }
}
@Module({imports:[DatabaseModule],providers:[AccountsService],controllers:[AccountsController],exports:[AccountsService]})
export class AccountsModule {}
