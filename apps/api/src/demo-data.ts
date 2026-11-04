import { randomUUID } from 'node:crypto';
import { Database } from './database.module.js';
import { hashPassword, temporaryPassword } from './domain/password.js';

/** Explicit local demo initializer. Never called by the application startup. */
export async function initializeDemo(db: Database) {
 const accounts = [
  { login: 'demo.admin', name: 'Administrateur démo', role: 'PLATFORM_ADMIN', org: 'none' },
  { login: 'demo.client', name: 'Responsable client démo', role: 'CLIENT_MANAGER', org: 'client' },
  { login: 'demo.controleur', name: 'Contrôleur démo', role: 'CLIENT_CONTROLLER', org: 'client' },
  { login: 'demo.prestataire', name: 'Responsable prestataire démo', role: 'PROVIDER_MANAGER', org: 'provider' },
  { login: 'demo.agent', name: 'Agent démo', role: 'FIELD_AGENT', org: 'provider' },
 ].map(a => ({ ...a, id: randomUUID(), password: temporaryPassword() }));
 const hashed = await Promise.all(accounts.map(a => hashPassword(a.password)));
 const client = randomUUID(), provider = randomUUID(), site = randomUUID();
 await db.transaction(async tx => {
  await tx.query('SELECT pg_advisory_xact_lock(728135)');
  const existing = await tx.query('SELECT 1 FROM app_user UNION ALL SELECT 1 FROM organization LIMIT 1');
  if (existing.rowCount) throw new Error('DEMO_REQUIRES_EMPTY_DATABASE');
  await tx.query("INSERT INTO organization(id,name,kind) VALUES($1,'Client de démonstration','CLIENT'),($2,'Prestataire de démonstration','PROVIDER')", [client, provider]);
  await tx.query("INSERT INTO site(id,client_id,name,sector) VALUES($1,$2,'Hôpital de démonstration','hospital')", [site, client]);
  const building = randomUUID(), floor = randomUUID();
  await tx.query("INSERT INTO zone(id,site_id,code,name,kind) VALUES($1,$2,'BAT-A','Bâtiment principal','BUILDING')", [building, site]);
  await tx.query("INSERT INTO zone(id,site_id,parent_id,code,name,kind) VALUES($1,$2,$3,'ET-1','Premier étage','FLOOR')", [floor, site, building]);
  await tx.query("INSERT INTO zone(id,site_id,parent_id,code,name,kind) VALUES($1,$2,$3,'SAL-101','Salle de consultation 101','ROOM')", [randomUUID(), site, floor]);
  await tx.query('INSERT INTO service_agreement(id,client_id,site_id,provider_id,starts_at) VALUES($1,$2,$3,$4,now())', [randomUUID(), client, site, provider]);
  for (const [index, account] of accounts.entries()) {
   await tx.query('INSERT INTO app_user(id,login,password_hash,display_name,must_change_password) VALUES($1,$2,$3,$4,$5)', [account.id, account.login, hashed[index], account.name, account.role === 'FIELD_AGENT']);
   if (account.role === 'PLATFORM_ADMIN') {
    await tx.query('INSERT INTO platform_admin(user_id) VALUES($1)', [account.id]);
   } else {
    const membership = randomUUID();
    await tx.query('INSERT INTO membership(id,user_id,organization_id) VALUES($1,$2,$3)', [membership, account.id, account.org === 'client' ? client : provider]);
    await tx.query('INSERT INTO membership_role(membership_id,role) VALUES($1,$2)', [membership, account.role]);
    if (account.role === 'CLIENT_CONTROLLER') await tx.query('INSERT INTO site_grant(membership_id,site_id) VALUES($1,$2)', [membership, site]);
   }
  }
  await tx.query("INSERT INTO access_audit(id,actor_id,action,target_id,reason) VALUES($1,$2,'LOCAL_DEMO_INITIALIZED',$3,'Données synthétiques pour tests locaux')", [randomUUID(), accounts[0]!.id, site]);
 });
 return accounts.map(({login,password,role}) => ({login,password,role}));
}
