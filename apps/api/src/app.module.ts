import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
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

@Module({ imports: [DatabaseModule], controllers: [HealthController] })
export class AppModule {}
