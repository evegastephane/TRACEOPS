import { randomUUID } from 'node:crypto';
import { Database } from './database.module.js';
import { hashPassword, temporaryPassword } from './domain/password.js';

async function main() {
 if (process.env.TRACEOPS_DEMO !== 'local-only' || process.env.NODE_ENV !== 'development') throw new Error('LOCAL_DEMO_DISABLED');
 const login = process.argv[2];
 if (!login || !['demo.admin','demo.client','demo.controleur','demo.prestataire','demo.agent'].includes(login)) throw new Error('DEMO_LOGIN_REQUIRED');
 const password = temporaryPassword();
 const hash = await hashPassword(password);
 const db = new Database();
 try {
  await db.transaction(async tx => {
   const marker = await tx.query("SELECT actor_id FROM access_audit WHERE action='LOCAL_DEMO_INITIALIZED' LIMIT 1");
   if (!marker.rowCount) throw new Error('NOT_A_DEMO_DATABASE');
   const user = (await tx.query('SELECT id FROM app_user WHERE login=$1 AND active FOR UPDATE', [login])).rows[0];
   if (!user) throw new Error('DEMO_ACCOUNT_NOT_FOUND');
   await tx.query('UPDATE app_user SET password_hash=$1,must_change_password=$2 WHERE id=$3', [hash, login==='demo.agent', user.id]);
   await tx.query('UPDATE user_session SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [user.id]);
   await tx.query("INSERT INTO access_audit(id,actor_id,action,target_id,reason) VALUES($1,$2,'LOCAL_DEMO_PASSWORD_RESET',$3,'Commande locale explicite, sans session web')", [randomUUID(), marker.rows[0].actor_id, user.id]);
  });
  process.stdout.write(JSON.stringify({login,password},null,2)+'\n');
 } finally { await db.onApplicationShutdown(); }
}
main().catch(error => {
 const codes=['LOCAL_DEMO_DISABLED','DEMO_LOGIN_REQUIRED','NOT_A_DEMO_DATABASE','DEMO_ACCOUNT_NOT_FOUND'];
 process.stderr.write(error instanceof Error && codes.includes(error.message) ? error.message+'\n' : 'Réinitialisation refusée. Vérifiez la base de démonstration.\n');
 process.exitCode=1;
});
