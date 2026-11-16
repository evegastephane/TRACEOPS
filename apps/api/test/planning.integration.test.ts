import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createApplication } from '../src/application.js';
import { hashPassword } from '../src/domain/password.js';
import { localInstant } from '../src/interventions/interventions.controller.js';
import { addDays, siteToday } from '../src/procurement/payable.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
const migrations = ['001_identity_sites.sql', '002_account_access.sql', '003_audit_reason.sql', '004_provider_workspace.sql', '005_interventions.sql', '006_procurement.sql', '007_planning_attendance.sql'];
async function migration(name: string) {
  for (const dir of ['apps/api/migrations/', 'dist/migrations/']) { try { return await readFile(dir + name, 'utf8'); } catch { /* try the next place */ } }
  throw new Error('MIGRATION_NOT_FOUND ' + name);
}
type Row = Record<string, any>;

test('real PostgreSQL: imported Gantt plannings, providers’ free hours, site QR codes and the agents’ check-ins', { skip: !databaseUrl }, async () => {
  const root = new Pool({ connectionString: databaseUrl });
  const schema = 'plan_test_' + randomUUID().replaceAll('-', '');
  await root.query(`CREATE SCHEMA ${schema}`);
  const url = new URL(databaseUrl!); url.searchParams.set('options', '-c search_path=' + schema);
  process.env.DATABASE_URL = url.toString(); process.env.APP_ORIGIN = 'http://localhost:5173';
  const db = new Pool({ connectionString: url.toString() });
  const app = await createApplication(false);
  try {
    for (const name of migrations) await db.query(await migration(name));
    const password = 'Test2345', hash = await hashPassword(password);
    const ids = { client: randomUUID(), provider: randomUUID(), rival: randomUUID(), other: randomUUID(), site: randomUUID() };
    await db.query(`INSERT INTO organization(id,name,kind) VALUES ($1,'Client','CLIENT'),($2,'Provider','PROVIDER'),($3,'Rival','PROVIDER'),($4,'Other client','CLIENT')`, [ids.client, ids.provider, ids.rival, ids.other]);
    await db.query(`INSERT INTO site(id,client_id,name,sector) VALUES ($1,$2,'Plant','enterprise')`, [ids.site, ids.client]);
    const users: Record<string, string> = {};
    const person = async (login: string, org: string, role: string) => {
      const user = randomUUID(), membership = randomUUID(); users[login] = user;
      await db.query('INSERT INTO app_user(id,login,password_hash,display_name,must_change_password) VALUES($1,$2,$3,$4,false)', [user, login, hash, login]);
      await db.query('INSERT INTO membership(id,user_id,organization_id) VALUES($1,$2,$3)', [membership, user, org]);
      await db.query('INSERT INTO membership_role(membership_id,role) VALUES($1,$2)', [membership, role]);
      return membership;
    };
    await person('manager', ids.client, 'CLIENT_MANAGER'); await person('outsider', ids.other, 'CLIENT_MANAGER'); await person('boss', ids.provider, 'PROVIDER_MANAGER');
    const m1 = await person('agent1', ids.provider, 'FIELD_AGENT'), m2 = await person('agent2', ids.provider, 'FIELD_AGENT');
    await person('stranger', ids.rival, 'FIELD_AGENT');
    await app.listen(0, '127.0.0.1'); const base = await app.getUrl();
    function browser() {
      let cookie = '';
      const call = async (path: string, body?: unknown, org?: string) => {
        const response = await fetch(base + '/api/v1/' + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-Traceops': 'request', Cookie: cookie, ...(org ? { 'X-Organization-Id': org } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
        if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie')!.split(';')[0]!;
        return { status: response.status, data: await response.json() as any };
      };
      return Object.assign(call, { raw: (path: string, org: string) => fetch(base + '/api/v1/' + path, { headers: { Cookie: cookie, 'X-Organization-Id': org } }) });
    }
    const manager = browser(), outsider = browser(), boss = browser(), agent1 = browser(), agent2 = browser(), stranger = browser();
    for (const [b, login] of [[manager, 'manager'], [outsider, 'outsider'], [boss, 'boss'], [agent1, 'agent1'], [agent2, 'agent2'], [stranger, 'stranger']] as const) assert.equal((await b('auth/login', { login, password })).status, 201);
    const today = siteToday(), tomorrow = addDays(today, 1);

    // Earlier plannings, imported from Gantt files: checked task by task, visible to the organisation that imported them.
    const task = (name: string, start: string, end: string, extra: Row = {}) => ({ name, start, end, ...extra });
    assert.equal((await boss('plans', { title: 'Vide', format: 'CSV', tasks: [] }, ids.provider)).data.message, 'TASKS_REQUIRED');
    assert.equal((await boss('plans', { title: 'Dates', format: 'CSV', tasks: [task('A', '07/12/2026', '2026-12-08')] }, ids.provider)).data.message, 'INVALID_DATE');
    assert.equal((await boss('plans', { title: 'Ordre', format: 'CSV', tasks: [task('A', '2026-12-08', '2026-12-07')] }, ids.provider)).data.message, 'INVALID_PERIOD');
    assert.equal((await boss('plans', { title: 'Format', format: 'MPP', tasks: [task('A', today, today)] }, ids.provider)).data.message, 'INVALID_INPUT');
    assert.equal((await agent1('plans', { title: 'Agent', format: 'CSV', tasks: [task('A', today, today)] }, ids.provider)).status, 403);
    const imported = await boss('plans', { title: 'Arrêt technique', source: 'arret.xml', format: 'MSPROJECT_XML', tasks: [
      task('Arrêt technique', today, addDays(today, 10), { level: 0, progress: 20 }),
      task('Consignation', today, today, { level: 1, progress: 100, resource: 'Maintenance' }),
      task('Redémarrage', addDays(today, 10), addDays(today, 10), { level: 1, milestone: true, predecessors: '2' })] }, ids.provider);
    assert.equal(imported.status, 201); assert.equal(imported.data.tasks, 3);
    const gantt = await boss(`gantt?from=${addDays(today, -7)}&to=${addDays(today, 30)}`, undefined, ids.provider);
    assert.equal(gantt.status, 200); assert.equal(gantt.data.canImport, true);
    const plan = gantt.data.plans.find((p: Row) => p.id === imported.data.id);
    assert.equal(plan.tasks.length, 3); assert.equal(plan.tasks[2].milestone, true); assert.equal(plan.tasks[1].resource, 'Maintenance');
    assert.equal((await manager(`gantt?from=${today}&to=${addDays(today, 30)}`, undefined, ids.client)).data.plans.length, 0, 'a plan stays with its organisation unless attached to a shared contract');
    assert.equal((await agent1(`gantt?from=${today}&to=${addDays(today, 30)}`, undefined, ids.provider)).status, 403);
    assert.equal((await manager(`plans/${imported.data.id}/archive`, {}, ids.client)).status, 404);
    assert.equal((await boss(`plans/${imported.data.id}/archive`, {}, ids.provider)).status, 201);

    // A QR code per place, created by the client; until the provider is linked to the site, its agents cannot check in there.
    assert.equal((await boss('attendance/points', { siteId: ids.site, label: 'Entrée' }, ids.provider)).status, 403);
    assert.equal((await outsider('attendance/points', { siteId: ids.site, label: 'Entrée' }, ids.other)).data.message, 'INVALID_SITE');
    const point = await manager('attendance/points', { siteId: ids.site, label: 'Entrée du personnel' }, ids.client);
    assert.equal(point.status, 201); assert.match(point.data.link, /^http:\/\/localhost:5173\/#pointage=[0-9a-f]{32}$/);
    const token = point.data.link.split('=')[1] as string;
    assert.equal((await agent1(`attendance/scan/${token}`)).data.message, 'NOT_ON_SITE');
    assert.equal((await boss('attendance/points', undefined, ids.provider)).data.length, 0);
    await db.query(`INSERT INTO service_agreement(id,client_id,site_id,provider_id,starts_at) VALUES($1,$2,$3,$4,now()-interval '1 day')`, [randomUUID(), ids.client, ids.site, ids.provider]);
    assert.equal((await boss('attendance/points', undefined, ids.provider)).data.length, 1, 'the provider prints the codes of the sites it works on');
    const poster = await manager.raw(`attendance/points/${point.data.id}/poster.pdf`, ids.client);
    assert.equal(poster.status, 200); assert.equal(poster.headers.get('content-type'), 'application/pdf');
    assert.ok((await poster.arrayBuffer()).byteLength > 2000);

    // Today's mission for agent 1, tomorrow's for agent 2.
    const mission = async (member: string, date: string, from: string, to: string) => {
      const id = randomUUID();
      await db.query(`INSERT INTO intervention(id,client_id,provider_id,site_id,kind,title,starts_at,ends_at,status,created_by) VALUES($1,$2,$3,$4,'CLEANING','Nettoyage',$5,$6,'ASSIGNED',$7)`,
        [id, ids.client, ids.provider, ids.site, localInstant(date, from, 'Africa/Douala'), localInstant(date, to, 'Africa/Douala'), users.manager]);
      await db.query('INSERT INTO intervention_agent(intervention_id,membership_id,lead) VALUES($1,$2,true)', [id, member]);
      return id;
    };
    const todays = await mission(m1, today, '12:00', '14:00'), tomorrows = await mission(m2, tomorrow, '08:00', '10:00');

    // The scan: one tap for arrival, one for departure, an absence always with its reason; linked to the day's mission on that site.
    assert.equal((await stranger(`attendance/scan/${token}`)).data.message, 'NOT_ON_SITE');
    assert.equal((await manager(`attendance/scan/${token}`)).data.message, 'NOT_ON_SITE');
    assert.equal((await agent1('attendance/scan/' + '0'.repeat(32))).status, 404);
    const info = await agent1(`attendance/scan/${token}`);
    assert.equal(info.status, 200); assert.equal(info.data.point.label, 'Entrée du personnel'); assert.equal(info.data.open, false); assert.equal(info.data.missions[0].id, todays);
    assert.equal((await agent1(`attendance/scan/${token}`, { kind: 'OUT' })).data.message, 'NOT_IN');
    const arrived = await agent1(`attendance/scan/${token}`, { kind: 'IN' });
    assert.equal(arrived.status, 201); assert.equal(arrived.data.intervention_id, todays);
    assert.equal((await agent1(`attendance/scan/${token}`, { kind: 'IN' })).data.message, 'ALREADY_IN');
    assert.equal((await agent1(`attendance/scan/${token}`)).data.open, true);
    assert.equal((await agent1(`attendance/scan/${token}`, { kind: 'OUT' })).status, 201);
    assert.equal((await agent2(`attendance/scan/${token}`, { kind: 'ABSENT' })).data.message, 'REASON_REQUIRED');

    // An absence declared from the phone for a coming mission: once, by a member of its crew, while the mission is ahead.
    assert.equal((await agent1('attendance/absence', { interventionId: tomorrows, reason: 'Maladie' }, ids.provider)).data.message, 'MISSION_NOT_FOUND');
    assert.equal((await boss('attendance/absence', { interventionId: tomorrows, reason: 'Maladie' }, ids.provider)).status, 403);
    assert.equal((await agent2('attendance/absence', { interventionId: tomorrows, reason: 'Maladie — certificat transmis' }, ids.provider)).status, 201);
    assert.equal((await agent2('attendance/absence', { interventionId: tomorrows, reason: 'Encore' }, ids.provider)).data.message, 'ALREADY_DECLARED');
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM intervention_event WHERE intervention_id=$1 AND action='ABSENCE_DECLARED'`, [tomorrows])).rows[0].n, 1);

    // The register: the client and the provider's manager see everything on their side; an agent sees only its own records.
    const kinds = (rows: Row[]) => rows.map(r => r.kind).sort().join(',');
    const seen = await manager('attendance?days=7', undefined, ids.client);
    assert.equal(seen.status, 200); assert.equal(kinds(seen.data), 'ABSENT,IN,OUT');
    assert.equal(seen.data.find((r: Row) => r.kind === 'IN').intervention_id, todays); assert.equal(seen.data.find((r: Row) => r.kind === 'IN').point_label, 'Entrée du personnel');
    assert.equal(kinds((await boss('attendance?days=7', undefined, ids.provider)).data), 'ABSENT,IN,OUT');
    assert.equal(kinds((await agent1('attendance?days=7', undefined, ids.provider)).data), 'IN,OUT');
    assert.equal(kinds((await agent2('attendance?days=7', undefined, ids.provider)).data), 'ABSENT');
    assert.equal((await outsider('attendance?days=7', undefined, ids.other)).data.length, 0);
    assert.equal((await outsider('attendance?days=7', undefined, ids.client)).status, 403);

    // Free and busy hours: counts per hour, the client's own missions marked, absences taking the agent out of the day.
    const free = await manager(`providers/${ids.provider}/availability?from=${tomorrow}&days=1`, undefined, ids.client);
    assert.equal(free.status, 200); assert.equal(free.data.agents, 2); assert.deepEqual(free.data.hours, [6, 22]);
    const day = free.data.days[0];
    assert.equal(day.date, tomorrow); assert.equal(day.hours.length, 16); assert.equal(day.absent, 1);
    assert.equal(day.hours[0].busy, 1, 'the absent agent is not available'); assert.equal(day.hours[2].own, 1, '08:00 is one of the client’s own missions');
    assert.equal((await outsider(`providers/${ids.provider}/availability`, undefined, ids.other)).status, 404);
    assert.equal((await boss(`providers/${ids.provider}/availability?days=7`, undefined, ids.provider)).data.days.length, 7);
    assert.equal((await agent1(`providers/${ids.provider}/availability`, undefined, ids.provider)).status, 404);
  } finally { await app.close(); await db.end(); await root.query(`DROP SCHEMA ${schema} CASCADE`); await root.end(); }
});
