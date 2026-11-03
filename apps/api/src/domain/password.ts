import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const parameters = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 32, parameters,
    (err, key) => err ? reject(err) : resolve(key)));
}
export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 1024) {
    throw new RangeError('Password must have at least 12 characters and at most 1024 UTF-8 bytes');
  }
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt-v1$${salt.toString('hex')}$${key.toString('hex')}`;
}
export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  // Fixed parameters prevent a corrupted hash from requesting unbounded work.
  if (Buffer.byteLength(password, 'utf8') > 1024) return false;
  const match = /^scrypt-v1\$([0-9a-f]{32})\$([0-9a-f]{64})$/.exec(encoded);
  if (!match?.[1] || !match[2]) return false;
  const actual = await derive(password, Buffer.from(match[1], 'hex'));
  return timingSafeEqual(actual, Buffer.from(match[2], 'hex'));
}
