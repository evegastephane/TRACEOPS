import { SitesModule } from './sites/sites.controller.js';
import { InterventionsModule } from './interventions/interventions.controller.js';
import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.controller.js';
import { Database, DatabaseModule } from './database.module.js';

@Controller('health')
export class HealthController {
  constructor(private readonly database: Database) {}
  @Get('live') live() { return { status: 'ok' }; }
  @Get('ready') async ready() {
    try { await this.database.check(); }
    catch { throw new ServiceUnavailableException('Service unavailable'); }
    return { status: 'ok' };
  }
}

@Module({ imports: [DatabaseModule, AccountsModule, SitesModule, InterventionsModule], controllers: [HealthController] })
export class AppModule {}
