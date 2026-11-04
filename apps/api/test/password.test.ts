import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, temporaryPassword } from '../src/domain/password.js';

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

test('eight-character passwords work, seven are rejected, existing longer passwords still verify', async () => {
  const password = 'Abcd2345';
  assert.equal(await verifyPassword(password, await hashPassword(password)), true);
  await assert.rejects(hashPassword('Abcd234'), RangeError);
  for (let i = 0; i < 32; i++) assert.match(temporaryPassword(), /^[a-hj-km-np-zA-HJKMNP-Z2-9]{8}$/);
});
