import { Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { configuration } from './config.js';

@Injectable()
export class Database implements OnApplicationShutdown {
  private readonly pool: Pool;
  constructor() {
    const config = configuration();
    this.pool = new Pool({
      connectionString: config.databaseUrl,
      max: 10,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 30000,
      statement_timeout: 3000,
      ssl: config.tls ? { rejectUnauthorized: true } : false,
    });
    this.pool.on('error', () => {
      // Do not emit credentials or SQL text from dependency errors.
      process.stderr.write('PostgreSQL idle connection error\n');
    });
  }
  async check(): Promise<void> { await this.pool.query('SELECT 1'); }
  async onApplicationShutdown(): Promise<void> { await this.pool.end(); }
}

@Module({ providers: [Database], exports: [Database] })
export class DatabaseModule {}
