import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Pool } from 'pg';
import { configuration } from './config.js';

async function migrate() {
  const config = configuration();
  const pool = new Pool({ connectionString: config.databaseUrl,
    connectionTimeoutMillis: 3000,
    ssl: config.tls ? { rejectUnauthorized: true } : false });
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(728134)');
      await client.query(`CREATE TABLE IF NOT EXISTS schema_migration (
        name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
      for (const name of ['001_identity_sites.sql', '002_account_access.sql', '003_audit_reason.sql']) {
      const sql = await readFile(new URL('../migrations/' + name, import.meta.url), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const result = await client.query<{ checksum: string }>('SELECT checksum FROM schema_migration WHERE name = $1', [name]);
      if (result.rows[0]) {
        if (result.rows[0].checksum !== checksum) throw new Error('Applied migration checksum differs');
      } else {
        await client.query(sql);
        await client.query('INSERT INTO schema_migration(name, checksum) VALUES ($1, $2)', [name, checksum]);
      }
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  } finally { await pool.end(); }
}
migrate().catch(() => {
  process.stderr.write('Migration failed; no partial schema was committed. Check configuration and database.\n');
  process.exitCode = 1;
});
