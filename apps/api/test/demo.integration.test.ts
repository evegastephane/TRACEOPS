import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { Database } from '../src/database.module.js';
import { initializeDemo } from '../src/demo-data.js';
import { createApplication } from '../src/application.js';

test('demo CLI refuses production or missing explicit local flag', () => {
 for (const settings of [{NODE_ENV:'production',TRACEOPS_DEMO:'local-only'}, {NODE_ENV:'development',TRACEOPS_DEMO:''}]) {
  const result=spawnSync(process.execPath,['dist/src/demo-local.js'],{env:{...process.env,...settings},encoding:'utf8'});
  assert.equal(result.status,1);
  assert.match(result.stderr,/LOCAL_DEMO_DISABLED/);
  assert.equal(result.stdout,'');
 }
});
const databaseUrl=process.env.TEST_DATABASE_URL;
test('local demo creates usable scoped accounts once and preserves existing data', {skip:!databaseUrl}, async()=>{
 const root=new Pool({connectionString:databaseUrl});
 const schema='demo_test_'+randomUUID().replaceAll('-','');
 await root.query(`CREATE SCHEMA ${schema}`);
 const url=new URL(databaseUrl!);url.searchParams.set('options','-c search_path='+schema);
 process.env.DATABASE_URL=url.toString();process.env.APP_ORIGIN='http://localhost:5173';
 const db=new Database();const app=await createApplication(false);
 try {
  for(const name of ['001_identity_sites.sql','002_account_access.sql','003_audit_reason.sql'])await db.query(await readFile('apps/api/migrations/'+name,'utf8'));
  const accounts=await initializeDemo(db);
  assert.equal(new Set(accounts.map(a=>a.password)).size,5);
  assert.ok(accounts.every(a=>a.password.length===8));
  await assert.rejects(initializeDemo(db),/DEMO_REQUIRES_EMPTY_DATABASE/);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM app_user')).rows[0].count,5);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM organization')).rows[0].count,2);
  await app.listen(0,'127.0.0.1');const base=await app.getUrl();
  for(const account of accounts) {
   const login=await fetch(base+'/api/v1/auth/login',{method:'POST',headers:{'Content-Type':'application/json','X-Traceops':'request'},body:JSON.stringify({login:account.login,password:account.password})});
   assert.equal(login.status,201);
   const headers:Record<string,string>={Cookie:login.headers.get('set-cookie')!.split(';')[0]!};
   const me=await (await fetch(base+'/api/v1/auth/me',{headers})).json();
   assert.equal(me.must_change_password,account.role==='FIELD_AGENT');
   if(account.role==='PLATFORM_ADMIN') { assert.equal(me.admin,true); continue; }
   const org=me.memberships[0].id;
   const response=await fetch(base+'/api/v1/sites',{headers:{...headers,'X-Organization-Id':org}});
   if(account.role==='FIELD_AGENT') {assert.equal(response.status,403);continue;}
   const sites=await response.json();assert.equal(sites.length,1);
   const zones=await (await fetch(base+`/api/v1/sites/${sites[0].id}/zones`,{headers:{...headers,'X-Organization-Id':org}})).json();
   assert.equal(zones.length,3);
   if(account.role==='CLIENT_MANAGER') {
    const reset=spawnSync(process.execPath,['dist/src/reset-demo-password.js',account.login],{env:{...process.env,NODE_ENV:'development',TRACEOPS_DEMO:'local-only'},encoding:'utf8'});
    assert.equal(reset.status,0,reset.stderr);
    const changed=JSON.parse(reset.stdout); assert.equal(changed.password.length,8);
    assert.equal((await fetch(base+'/api/v1/auth/me',{headers})).status,401);
    const signIn=(password:string)=>fetch(base+'/api/v1/auth/login',{method:'POST',headers:{'Content-Type':'application/json','X-Traceops':'request'},body:JSON.stringify({login:account.login,password})});
    assert.equal((await signIn(account.password)).status,401);
    assert.equal((await signIn(changed.password)).status,201);
   }
  }
 } finally {await app.close();await db.onApplicationShutdown();await root.query(`DROP SCHEMA ${schema} CASCADE`);await root.end();}
});
