import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';

test('HTTP liveness works while readiness fails safely without PostgreSQL', async () => {
  // Port zero is reserved and cannot host a database service.
  process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:0/test';
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  try {
    await app.listen(0, '127.0.0.1');
    const url = await app.getUrl();
    const live = await fetch(url + '/api/v1/health/live');
    assert.equal(live.status, 200);
    assert.deepEqual(await live.json(), { status: 'ok' });
    const ready = await fetch(url + '/api/v1/health/ready');
    assert.equal(ready.status, 503);
    const body = await ready.text();
    assert.ok(!body.includes('postgresql'));
    assert.ok(!body.includes('test:test'));
  } finally { await app.close(); }
});
