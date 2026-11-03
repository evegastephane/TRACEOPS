export function configuration(env: NodeJS.ProcessEnv = process.env) {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  const url = new URL(databaseUrl);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must use PostgreSQL');
  }
  // TLS must be governed in one place, never silently overridden by URL options.
  if (['sslmode', 'sslcert', 'sslkey', 'sslrootcert'].some(k => url.searchParams.has(k))) {
    throw new Error('Configure database TLS through DATABASE_TLS and system CA trust');
  }
  if (env.DATABASE_TLS && !['true', 'false'].includes(env.DATABASE_TLS)) {
    throw new Error('DATABASE_TLS must be true or false');
  }
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  return { databaseUrl, port, tls: env.DATABASE_TLS === 'true' };
}
