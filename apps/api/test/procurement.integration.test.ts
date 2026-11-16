import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createApplication } from '../src/application.js';
import { hashPassword } from '../src/domain/password.js';
import { library } from '../src/procurement/forms.js';
import { addDays, siteToday } from '../src/procurement/payable.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
const migrations = ['001_identity_sites.sql', '002_account_access.sql', '003_audit_reason.sql', '004_provider_workspace.sql', '005_interventions.sql', '006_procurement.sql', '007_planning_attendance.sql'];
/** From a checkout (apps/api/migrations) or from the built application (dist/migrations). */
async function migration(name: string) {
  for (const dir of ['apps/api/migrations/', 'dist/migrations/']) { try { return await readFile(dir + name, 'utf8'); } catch { /* try the next place */ } }
  throw new Error('MIGRATION_NOT_FOUND ' + name);
}
type Row = Record<string, any>;

test('real PostgreSQL: tender → answers to the invitation → sealed offers → comparison → award → provider’s acceptance → services → payment → quality marks → final review', { skip: !databaseUrl }, async () => {
  const root = new Pool({ connectionString: databaseUrl });
  const schema = 'proc_test_' + randomUUID().replaceAll('-', '');
  await root.query(`CREATE SCHEMA ${schema}`);
  const url = new URL(databaseUrl!); url.searchParams.set('options', '-c search_path=' + schema);
  process.env.DATABASE_URL = url.toString(); process.env.APP_ORIGIN = 'http://localhost:5173';
  const db = new Pool({ connectionString: url.toString() });
  const app = await createApplication(false);
  try {
    for (const name of migrations) await db.query(await migration(name));
    const password = 'Test2345', hash = await hashPassword(password);
    const ids = { client: randomUUID(), p1: randomUUID(), p2: randomUUID(), other: randomUUID(), site: randomUUID() };
    await db.query(`INSERT INTO organization(id,name,kind) VALUES ($1,'Client','CLIENT'),($2,'Provider One','PROVIDER'),($3,'Provider Two','PROVIDER'),($4,'Other client','CLIENT')`, [ids.client, ids.p1, ids.p2, ids.other]);
    await db.query(`INSERT INTO site(id,client_id,name,sector) VALUES ($1,$2,'Plant','enterprise')`, [ids.site, ids.client]);
    const person = async (login: string, org: string, role: string) => {
      const user = randomUUID(), membership = randomUUID();
      await db.query('INSERT INTO app_user(id,login,password_hash,display_name,must_change_password) VALUES($1,$2,$3,$4,false)', [user, login, hash, login]);
      await db.query('INSERT INTO membership(id,user_id,organization_id) VALUES($1,$2,$3)', [membership, user, org]);
      await db.query('INSERT INTO membership_role(membership_id,role) VALUES($1,$2)', [membership, role]);
      return membership;
    };
    await person('manager', ids.client, 'CLIENT_MANAGER');
    await db.query('INSERT INTO site_grant(membership_id,site_id) VALUES($1,$2)', [await person('tech', ids.client, 'CLIENT_CONTROLLER'), ids.site]);
    await person('one', ids.p1, 'PROVIDER_MANAGER'); await person('two', ids.p2, 'PROVIDER_MANAGER'); await person('outsider', ids.other, 'CLIENT_MANAGER');
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
    const manager = browser(), tech = browser(), one = browser(), two = browser(), outsider = browser();
    for (const [b, login] of [[manager, 'manager'], [tech, 'tech'], [one, 'one'], [two, 'two'], [outsider, 'outsider']] as const) assert.equal((await b('auth/login', { login, password })).status, 201);
    const today = siteToday();

    // Forms by type of service: the library, and the client's own templates.
    const templates = await manager('tender-templates', undefined, ids.client);
    assert.equal(templates.status, 200); assert.equal(templates.data.library.length, library.length);
    assert.equal((await one('tender-templates', undefined, ids.p1)).status, 403);
    const tpl = library.find(t => t.id === 'lib-cleaning')!;
    assert.equal((await manager('tender-templates', { name: 'Nettoyage usine', serviceType: 'CLEANING', sections: tpl.sections, questions: tpl.questions, criteria: tpl.criteria, qualityCriteria: tpl.qualityCriteria }, ids.client)).status, 201);
    assert.equal((await manager('tender-templates', { name: 'Prix seul', serviceType: 'CLEANING', sections: tpl.sections, criteria: [{ key: 'prix', label: 'Prix', weight: 60, auto: 'price' }] }, ids.client)).data.message, 'CRITERIA_WEIGHTS');
    assert.equal((await manager('tender-templates', undefined, ids.client)).data.own.length, 1);

    // A draft, invisible to providers; values are checked against the field types.
    const deadline = addDays(today, 5) + 'T12:00';
    const sections = tpl.sections.map(s => ({ ...s, fields: s.fields.map(f => ({ ...f, value: f.key === 'surface' ? 14200 : f.key === 'frequence' ? '6 jours sur 7' : f.key === 'duree' ? '12 mois' : null })) }));
    const body = { title: 'Nettoyage de l’usine', object: 'Douze mois', serviceType: 'CLEANING', templateName: tpl.name, siteId: ids.site, budget: 60000000, deadline, durationDays: 365, paymentTermsDays: 30,
      sections, questions: tpl.questions, criteria: tpl.criteria, qualityCriteria: tpl.qualityCriteria, providerIds: [ids.p1, ids.p2] };
    assert.equal((await manager('tenders', { ...body, sections: [{ key: 'x', title: 'X', fields: [{ key: 'n', label: 'N', type: 'number', value: 'beaucoup' }] }] }, ids.client)).data.message, 'INVALID_VALUE');
    assert.equal((await one('tenders', body, ids.p1)).status, 403);
    const created = await manager('tenders', body, ids.client);
    assert.equal(created.status, 201);
    const tid = created.data.id as string;
    assert.equal((await one(`tenders/${tid}`, undefined, ids.p1)).status, 404);
    assert.equal((await outsider(`tenders/${tid}`, undefined, ids.other)).status, 404);
    assert.equal((await manager(`tenders/${tid}/publish`, {}, ids.client)).status, 201);
    assert.equal((await manager(`tenders/${tid}`, { ...body, title: 'Changé sans motif' }, ids.client)).data.message, 'REASON_REQUIRED');
    assert.equal((await manager(`tenders/${tid}`, { ...body, reason: 'Visite des lieux ajoutée' }, ids.client)).status, 201);

    // The invited provider reads the file (never the budget nor the other invitees) and answers the required items.
    const seen = await one(`tenders/${tid}`, undefined, ids.p1);
    assert.equal(seen.status, 200); assert.equal(seen.data.budget_xaf, undefined); assert.deepEqual(seen.data.actions, ['BID', 'RESPOND']); assert.equal(seen.data.invitations.length, 0);
    assert.equal(seen.data.my_invitation.response, null);
    assert.ok(seen.data.events.some((e: Row) => e.action === 'AMENDED' && e.reason === 'Visite des lieux ajoutée'));
    const answers = { effectifPropose: 11, references: 'Trois références agroalimentaires' };
    assert.equal((await one(`tenders/${tid}/bids`, { amount: 56400000, delayDays: 10, content: 'Équipe dédiée', answers: {} }, ids.p1)).data.message, 'ANSWERS_REQUIRED');
    assert.equal((await one(`tenders/${tid}/bids`, { amount: 56400000, delayDays: 10, content: 'Équipe dédiée', strengths: 'HACCP', answers }, ids.p1)).status, 201);
    assert.equal((await one(`tenders/${tid}/invitation`, { accept: true }, ids.p1)).data.message, 'BID_ALREADY_SENT');
    // An invited provider says whether it takes part; declined, it cannot send an offer until it changes its mind.
    const offer2 = { amount: 49800000, delayDays: 7, content: 'Huit agents', answers: { effectifPropose: 8, references: 'Une PME' } };
    assert.equal((await two(`tenders/${tid}/invitation`, { accept: false }, ids.p2)).data.message, 'REASON_REQUIRED');
    assert.equal((await two(`tenders/${tid}/invitation`, { accept: false, reason: 'Équipes complètes en décembre' }, ids.p2)).status, 201);
    assert.equal((await two(`tenders/${tid}/bids`, offer2, ids.p2)).data.message, 'INVITATION_DECLINED');
    const declined = (await manager(`tenders/${tid}`, undefined, ids.client)).data.invitations.find((i: Row) => i.provider_id === ids.p2);
    assert.equal(declined.response, 'DECLINED'); assert.equal(declined.response_reason, 'Équipes complètes en décembre');
    assert.equal((await two(`tenders/${tid}/invitation`, { accept: true }, ids.p2)).status, 201);
    assert.equal((await two(`tenders/${tid}/bids`, offer2, ids.p2)).status, 201);
    assert.equal((await manager(`tenders/${tid}`, undefined, ids.client)).data.invitations.find((i: Row) => i.provider_id === ids.p1).response, 'ACCEPTED');
    assert.equal((await manager(`tenders/${tid}/bids`, { providerId: ids.p1, amount: 1, delayDays: 1, content: 'Copie papier' }, ids.client)).data.message, 'BID_ALREADY_ONLINE');

    // Sealed until closing: the client sees who answered, not the amounts; a provider never sees the others.
    const sealed = await manager(`tenders/${tid}`, undefined, ids.client);
    assert.equal(sealed.data.sealed, true); assert.equal(sealed.data.bids.length, 2); assert.equal(sealed.data.bids[0].amount_xaf, undefined);
    const own = (await one(`tenders/${tid}`, undefined, ids.p1)).data;
    assert.equal(own.bids.length, 1);
    assert.ok(own.events.some((e: Row) => e.action === 'BID_SUBMITTED' && e.actor === 'one'));
    assert.ok(!own.events.some((e: Row) => e.actor === 'two'), 'a provider never learns who else answered');
    assert.equal((await manager(`tenders/${tid}/award`, { awards: [{ bidId: sealed.data.bids[0].id, amount: 1, days: 1, startDate: today }] }, ids.client)).status, 403);

    // Closing opens the offers; the committee marks what is not computed.
    assert.equal((await manager(`tenders/${tid}/close`, {}, ids.client)).status, 201);
    assert.equal((await one(`tenders/${tid}/bids`, { amount: 1, delayDays: 1, content: 'Trop tard', answers }, ids.p1)).data.message, 'TENDER_CLOSED');
    const opened = await manager(`tenders/${tid}`, undefined, ids.client);
    const b1 = opened.data.bids.find((b: Row) => b.provider_id === ids.p1), b2 = opened.data.bids.find((b: Row) => b.provider_id === ids.p2);
    assert.equal(Number(b1.amount_xaf), 56400000); assert.equal(b1.answers.effectifPropose, 11);
    assert.equal((await manager(`tenders/${tid}/bids/${b1.id}/review`, { scores: { prix: { score: 9 } } }, ids.client)).data.message, 'INVALID_CRITERION');
    assert.equal((await manager(`tenders/${tid}/bids/${b1.id}/review`, { scores: { methodologie: { score: 11 } } }, ids.client)).data.message, 'INVALID_SCORE');
    assert.equal((await manager(`tenders/${tid}/bids/${b1.id}/review`, { scores: { methodologie: { score: 8.5, note: 'Plan HACCP' }, moyens: { score: 8 }, references: { score: 9 } }, reviewNote: 'Mieux-disant' }, ids.client)).status, 201);
    assert.equal((await manager(`tenders/${tid}/bids/${b1.id}/status`, { status: 'SHORTLISTED' }, ids.client)).status, 201);
    assert.equal((await manager(`tenders/${tid}/bids/${b2.id}/status`, { status: 'REJECTED' }, ids.client)).data.message, 'REASON_REQUIRED');
    assert.equal((await manager(`tenders/${tid}/bids/${b2.id}/status`, { status: 'REJECTED', reason: 'Effectif insuffisant' }, ids.client)).status, 201);
    const providerView = (await two(`tenders/${tid}`, undefined, ids.p2)).data.bids[0];
    assert.equal(providerView.status, 'SUBMITTED'); assert.deepEqual(providerView.scores, {}); assert.equal(providerView.status_reason, null); assert.equal(providerView.review_note, null);

    // Award: a rejected offer cannot be retained; the retained one becomes a contract with its schedule of services.
    assert.equal((await manager(`tenders/${tid}/award`, { awards: [{ bidId: b2.id, amount: 49800000, days: 365, startDate: today }] }, ids.client)).data.message, 'INVALID_BID');
    const start = addDays(today, -60);
    const award = await manager(`tenders/${tid}/award`, { awards: [{ bidId: b1.id, amount: 56400000, days: 90, startDate: start, installments: 3, qualityTarget: 7.5 }], note: 'Meilleure méthode' }, ids.client);
    assert.equal(award.status, 201);
    const cid = award.data.contracts[0] as string;
    assert.equal((await one(`tenders/${tid}`, undefined, ids.p1)).data.bids[0].status, 'AWARDED');
    assert.equal((await two(`tenders/${tid}`, undefined, ids.p2)).data.bids[0].status, 'NOT_RETAINED');
    assert.equal((await manager(`tenders/${tid}`, undefined, ids.client)).data.status, 'AWARDED');

    // Proposed until the provider accepts: nothing can be delivered, and the provider is not yet linked to the site.
    assert.equal((await two(`contracts/${cid}`, undefined, ids.p2)).status, 404);
    const proposed = await one(`contracts/${cid}`, undefined, ids.p1);
    assert.equal(proposed.data.status, 'PROPOSED'); assert.deepEqual(proposed.data.actions, ['RESPOND']);
    assert.deepEqual((await tech(`contracts/${cid}`, undefined, ids.client)).data.actions, []);
    assert.ok(!(await manager(`contracts/${cid}`, undefined, ids.client)).data.actions.includes('RECORD_RESPONSE'), 'a provider with an account answers itself');
    assert.equal((await one(`contracts/${cid}/deliveries/${proposed.data.deliveries[0].id}/deliver`, { note: 'Trop tôt' }, ids.p1)).status, 403);
    assert.equal((await manager(`sites/${ids.site}/providers`, { providerId: ids.p1 }, ids.client)).data.message, 'TENDER_REQUIRED');
    assert.equal((await manager(`contracts/${cid}/respond`, { accept: true, reason: 'À sa place' }, ids.client)).status, 403);
    assert.equal((await one(`contracts/${cid}/respond`, { accept: true }, ids.p1)).status, 201);
    assert.equal((await one(`contracts/${cid}/respond`, { accept: true }, ids.p1)).status, 403);
    assert.equal((await one('sites', undefined, ids.p1)).data.length, 1, 'accepting links the provider to the site');
    assert.ok((await manager(`tenders/${tid}`, undefined, ids.client)).data.events.some((e: Row) => e.action === 'AWARD_ACCEPTED' && e.reason === 'Provider One'));

    // The contract: visible to the client's staff on its site and to the retained provider only.
    const contract = await tech(`contracts/${cid}`, undefined, ids.client);
    assert.equal(contract.data.status, 'ACTIVE'); assert.ok(contract.data.responded_at);
    assert.equal(contract.status, 200); assert.equal(contract.data.deliveries.length, 3);
    assert.equal(contract.data.deliveries.reduce((s: number, d: Row) => s + Number(d.amount_xaf), 0), 56400000);
    assert.equal(contract.data.planned_end_date, addDays(start, 89));
    assert.deepEqual(contract.data.actions, ['DECIDE', 'EVALUATE']);
    const [d1, d2] = contract.data.deliveries as Row[];

    // Acceptance and payment are two separate facts: accepted, a service is due 30 days later; rejected, it is never due.
    assert.equal((await one(`contracts/${cid}/deliveries/${d1!.id}/deliver`, { note: 'Fait' }, ids.p1)).status, 201);
    assert.equal((await tech(`contracts/${cid}/deliveries/${d1!.id}/decision`, { accept: true }, ids.client)).status, 201);
    const row = (await manager('payments', undefined, ids.client)).data.find((p: Row) => p.item_id === d1!.id);
    assert.equal(row.decision, 'ACCEPTED'); assert.equal(row.payment_status, 'PENDING'); assert.equal(row.due_date, addDays(today, 30));
    assert.equal((await one('payments', undefined, ids.p1)).data.find((p: Row) => p.item_id === d1!.id).payment_status, 'PENDING');
    assert.equal((await tech(`payments/${row.payment_id}/pay`, { paidOn: today }, ids.client)).status, 403);
    assert.equal((await manager(`payments/${row.payment_id}/pay`, { paidOn: addDays(today, 1) }, ids.client)).data.message, 'INVALID_DATE');
    assert.equal((await manager(`payments/${row.payment_id}/pay`, { paidOn: today, reference: 'VIR-1' }, ids.client)).status, 201);
    assert.equal((await manager(`payments/${row.payment_id}/pay`, { paidOn: today }, ids.client)).status, 409);
    assert.equal((await tech(`contracts/${cid}/deliveries/${d2!.id}/decision`, { accept: false }, ids.client)).data.message, 'REASON_REQUIRED');
    assert.equal((await tech(`contracts/${cid}/deliveries/${d2!.id}/decision`, { accept: false, reason: 'Ligne 2 non désinfectée' }, ids.client)).status, 201);
    const rejected = (await manager('payments', undefined, ids.client)).data.find((p: Row) => p.item_id === d2!.id);
    assert.equal(rejected.decision, 'REJECTED'); assert.equal(rejected.payment_id, null);
    assert.equal((await one(`contracts/${cid}/deliveries/${d2!.id}/deliver`, { note: 'Repris' }, ids.p1)).status, 201);
    assert.equal((await tech(`contracts/${cid}/deliveries/${d2!.id}/decision`, { accept: true }, ids.client)).status, 201);
    assert.equal((await tech(`contracts/${cid}/deliveries/${d2!.id}/decision`, { accept: true }, ids.client)).data.message, 'DELIVERY_LOCKED');

    // Quality, by the internal technician: every criterion from 1 to 10, each with its optional justification.
    assert.equal((await tech(`contracts/${cid}/evaluations`, { evaluatedOn: today, scores: [{ key: 'proprete', score: 8 }] }, ids.client)).data.message, 'SCORES_REQUIRED');
    assert.equal((await tech(`contracts/${cid}/evaluations`, { evaluatedOn: today, scores: tpl.qualityCriteria.map(q => ({ key: q.key, score: 11 })) }, ids.client)).data.message, 'SCORES_REQUIRED');
    const scores = tpl.qualityCriteria.map((q, i) => ({ key: q.key, score: [8, 9, 8, 9, 7, 8][i], justification: i === 4 ? 'Un agent sans charlotte' : undefined }));
    const evaluation = await tech(`contracts/${cid}/evaluations`, { evaluatedOn: today, deliveryId: d1!.id, scores, comment: 'Bon mois' }, ids.client);
    assert.equal(evaluation.status, 201); assert.equal(evaluation.data.average, 8.17);
    assert.equal((await one(`contracts/${cid}/evaluations`, { evaluatedOn: today, scores }, ids.p1)).status, 403);
    const evaluated = (await one(`contracts/${cid}`, undefined, ids.p1)).data;
    assert.equal(evaluated.evaluations[0].scores[4].justification, 'Un agent sans charlotte');
    assert.deepEqual(evaluated.actions, ['DELIVER']);

    // The final review: closing freezes it; payments still due can be recorded afterwards.
    assert.equal((await tech(`contracts/${cid}/close`, { actualEndDate: today }, ids.client)).status, 403);
    assert.equal((await manager(`contracts/${cid}/close`, { actualEndDate: today, note: 'Bilan conforme' }, ids.client)).status, 201);
    const closed = (await manager(`contracts/${cid}`, undefined, ids.client)).data;
    assert.equal(closed.status, 'CLOSED'); assert.deepEqual(closed.actions, ['PAY']);
    assert.equal((await tech(`contracts/${cid}/evaluations`, { evaluatedOn: today, scores }, ids.client)).status, 403);

    // Counters, scoping and the printed tender file.
    const summary = await manager('procurement/summary', undefined, ids.client);
    assert.equal(summary.status, 200); assert.equal(summary.data.dueSoon, 0); assert.equal(summary.data.overdue, 0);
    assert.equal((await outsider('payments', undefined, ids.client)).status, 403);
    assert.equal((await outsider('contracts', undefined, ids.other)).data.length, 0);
    const pdf = await one.raw(`tenders/${tid}/document.pdf`, ids.p1);
    assert.equal(pdf.status, 200); assert.equal(pdf.headers.get('content-type'), 'application/pdf');
    assert.ok((await pdf.arrayBuffer()).byteLength > 1000);

    // A second tender: the retained provider declines the contract, so the offers go back to the analysis.
    const paper = randomUUID();
    await db.query(`INSERT INTO organization(id,name,kind) VALUES ($1,'Paper Provider','PROVIDER')`, [paper]);
    const t2 = (await manager('tenders', { ...body, title: 'Vitrerie', deadline: addDays(today, 3) + 'T12:00', providerIds: [ids.p2] }, ids.client)).data.id as string;
    assert.equal((await manager(`tenders/${t2}/publish`, {}, ids.client)).status, 201);
    assert.equal((await two(`tenders/${t2}/bids`, offer2, ids.p2)).status, 201);
    assert.equal((await manager(`tenders/${t2}/close`, {}, ids.client)).status, 201);
    // An offer received on paper from a provider without an account, recorded by the client.
    assert.equal((await manager(`tenders/${t2}/bids`, { providerId: paper, amount: 51000000, delayDays: 9, content: 'Offre reçue par courrier' }, ids.client)).status, 201);
    const bids2 = (await manager(`tenders/${t2}`, undefined, ids.client)).data.bids as Row[];
    const viaTwo = bids2.find(b => b.provider_id === ids.p2)!, viaPaper = bids2.find(b => b.provider_id === paper)!;
    const c2 = (await manager(`tenders/${t2}/award`, { awards: [{ bidId: viaTwo.id, amount: 49800000, days: 30, startDate: today }] }, ids.client)).data.contracts[0] as string;
    assert.equal((await two(`contracts/${c2}/respond`, { accept: false }, ids.p2)).data.message, 'REASON_REQUIRED');
    assert.equal((await two(`contracts/${c2}/respond`, { accept: false, reason: 'Effectif indisponible avant mars' }, ids.p2)).status, 201);
    const reopened = (await manager(`tenders/${t2}`, undefined, ids.client)).data;
    assert.equal(reopened.status, 'CLOSED');
    assert.equal(reopened.bids.find((b: Row) => b.id === viaTwo.id).status, 'DECLINED');
    assert.equal(reopened.bids.find((b: Row) => b.id === viaPaper.id).status, 'SUBMITTED');
    assert.ok(reopened.events.some((e: Row) => e.action === 'AWARD_DECLINED' && e.reason === 'Provider Two — Effectif indisponible avant mars'));
    const refused = (await manager(`contracts/${c2}`, undefined, ids.client)).data;
    assert.equal(refused.status, 'DECLINED'); assert.equal(refused.decline_reason, 'Effectif indisponible avant mars');
    assert.equal((await manager(`tenders/${t2}/award`, { awards: [{ bidId: viaTwo.id, amount: 49800000, days: 30, startDate: today }] }, ids.client)).data.message, 'INVALID_BID');
    // The paper provider has no account: the client manager records its written answer, with its reference.
    const c3 = (await manager(`tenders/${t2}/award`, { awards: [{ bidId: viaPaper.id, amount: 51000000, days: 30, startDate: today }] }, ids.client)).data.contracts[0] as string;
    const waiting = (await manager(`contracts/${c3}`, undefined, ids.client)).data;
    assert.equal(waiting.status, 'PROPOSED'); assert.ok(waiting.actions.includes('RECORD_RESPONSE'));
    assert.equal((await tech(`contracts/${c3}/respond`, { accept: true, reason: 'Courrier' }, ids.client)).status, 403);
    assert.equal((await manager(`contracts/${c3}/respond`, { accept: true }, ids.client)).data.message, 'REASON_REQUIRED');
    assert.equal((await manager(`contracts/${c3}/respond`, { accept: true, reason: 'Courrier signé du 12/11, réf. DG/118' }, ids.client)).status, 201);
    const opened3 = (await manager(`contracts/${c3}`, undefined, ids.client)).data;
    assert.equal(opened3.status, 'ACTIVE'); assert.equal(opened3.responded_by_name, 'manager');
    assert.ok(opened3.events.some((e: Row) => e.action === 'ACCEPTED_BY_PROVIDER' && e.reason === 'Courrier signé du 12/11, réf. DG/118'));
    assert.equal((await db.query('SELECT count(*)::int AS n FROM service_agreement WHERE site_id=$1 AND provider_id=$2 AND active', [ids.site, paper])).rows[0].n, 1);
  } finally { await app.close(); await db.end(); await root.query(`DROP SCHEMA ${schema} CASCADE`); await root.end(); }
});
