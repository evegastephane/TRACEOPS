import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configuration } from '../src/config.js';

test('configuration rejects absent, invalid and conflicting settings', () => {
  assert.throws(() => configuration({}), /DATABASE_URL/);
  assert.throws(() => configuration({ DATABASE_URL: 'https://example.com' }), /PostgreSQL/);
  assert.throws(() => configuration({ DATABASE_URL: 'postgres://localhost/db', PORT: '0' }), /PORT/);
  assert.throws(() => configuration({ DATABASE_URL: 'postgres://localhost/db?sslmode=disable' }), /TLS/);
  assert.throws(() => configuration({ DATABASE_URL: 'postgres://localhost/db', DATABASE_TLS: 'maybe' }), /TLS/);
  assert.equal(configuration({ DATABASE_URL: 'postgres://localhost/db', DATABASE_TLS: 'true' }).tls, true);
});
