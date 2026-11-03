import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/domain/password.js';

test('salted password hashes verify without storing cleartext', async () => {
  const password = 'Correct horse café 2026';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.ok(!first.includes(password));
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword(password + 'x', first), false);
});
test('malformed hashes and excessive passwords are rejected', async () => {
  await assert.rejects(hashPassword('short'), RangeError);
  await assert.rejects(hashPassword('é'.repeat(600)), RangeError);
  assert.equal(await verifyPassword('anything', 'scrypt-v1$ff$ff'), false);
  assert.equal(await verifyPassword('anything', 'scrypt-v99$xx$yy'), false);
});
