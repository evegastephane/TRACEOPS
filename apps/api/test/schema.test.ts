import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

test('PostgreSQL schema prevents cross-client references and zone cycles', async () => {
  const db = new PGlite();
  try {
    await db.exec(await readFile('apps/api/migrations/001_identity_sites.sql', 'utf8'));
    const client = randomUUID(), other = randomUUID(), provider = randomUUID();
    const site = randomUUID(), otherSite = randomUUID();
    await db.query("INSERT INTO organization(id,name,kind) VALUES ($1,'Client','CLIENT'),($2,'Other','CLIENT'),($3,'Provider','PROVIDER')", [client,other,provider]);
    await db.query("INSERT INTO site(id,client_id,name,sector) VALUES ($1,$2,'Office','enterprise'),($3,$4,'Other','hotel')", [site,client,otherSite,other]);
    await assert.rejects(db.query("INSERT INTO site(id,client_id,name,sector) VALUES ($1,$2,'Invalid','hotel')", [randomUUID(),provider]));
    const floor = randomUUID(), room = randomUUID();
    await db.query("INSERT INTO zone(id,site_id,code,name,kind) VALUES ($1,$2,'F1','Floor','FLOOR')", [floor,site]);
    await db.query("INSERT INTO zone(id,site_id,parent_id,code,name,kind) VALUES ($1,$2,$3,'R1','Room','ROOM')", [room,site,floor]);
    await assert.rejects(db.query('UPDATE zone SET parent_id=$1 WHERE id=$2', [room,floor]), /cycle/);
    await assert.rejects(db.query("INSERT INTO zone(id,site_id,parent_id,code,name,kind) VALUES ($1,$2,$3,'R2','Wrong site','ROOM')", [randomUUID(),otherSite,floor]));
    await assert.rejects(db.query("INSERT INTO service_agreement(id,client_id,site_id,provider_id,starts_at) VALUES ($1,$2,$3,$4,now())", [randomUUID(),other,site,provider]));
    const result = await db.query<{ parent_id: string | null }>('SELECT parent_id FROM zone WHERE id=$1', [floor]);
    assert.equal(result.rows[0]?.parent_id, null);
  } finally { await db.close(); }
});
test('one identity supports multiple memberships and case-insensitive unique login', async () => {
  const db = new PGlite();
  try {
    await db.exec(await readFile('apps/api/migrations/001_identity_sites.sql', 'utf8'));
    const user = randomUUID(), a = randomUUID(), b = randomUUID();
    await db.query("INSERT INTO app_user(id,login,password_hash,display_name) VALUES ($1,'Agent01','test-hash','Agent')", [user]);
    await assert.rejects(db.query("INSERT INTO app_user(id,login,password_hash,display_name) VALUES ($1,'agent01','test-hash','Duplicate')", [randomUUID()]));
    await db.query("INSERT INTO organization(id,name,kind) VALUES ($1,'A','CLIENT'),($2,'B','PROVIDER')", [a,b]);
    await db.query('INSERT INTO membership(id,user_id,organization_id) VALUES ($1,$2,$3),($4,$2,$5)', [randomUUID(),user,a,randomUUID(),b]);
    await assert.rejects(db.query('INSERT INTO membership(id,user_id,organization_id) VALUES ($1,$2,$3)', [randomUUID(),user,a]));
    const result = await db.query<{ count: number }>('SELECT count(*)::int AS count FROM membership WHERE user_id=$1', [user]);
    assert.equal(result.rows[0]?.count, 2);
  } finally { await db.close(); }
});
