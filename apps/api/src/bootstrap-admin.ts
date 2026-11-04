import { randomUUID } from 'node:crypto';
import { Database } from './database.module.js';
import { hashPassword } from './domain/password.js';
async function bootstrap() {
  const login=process.env.ADMIN_LOGIN?.trim().toLowerCase(), name=process.env.ADMIN_NAME?.trim(), password=process.env.ADMIN_PASSWORD;
  if (!login || !/^[a-z0-9][a-z0-9._@+-]{2,119}$/.test(login) || !name || !password) throw new Error('Missing bootstrap settings');
  const hash=await hashPassword(password), db=new Database();
  try {
    await db.transaction(async tx=>{
      await tx.query('SELECT pg_advisory_xact_lock(728135)');
      if ((await tx.query('SELECT 1 FROM platform_admin LIMIT 1')).rowCount) throw new Error('Administrator already exists');
      const id=randomUUID();
      await tx.query('INSERT INTO app_user(id,login,password_hash,display_name,must_change_password) VALUES($1,$2,$3,$4,false)',[id,login,hash,name]);
      await tx.query('INSERT INTO platform_admin(user_id) VALUES($1)',[id]);
      await tx.query("INSERT INTO access_audit(id,actor_id,action,target_id) VALUES($1,$2,'ADMIN_BOOTSTRAPPED',$2)",[randomUUID(),id]);
    });
    process.stdout.write('Administrator created. No credentials were printed.\n');
  } finally { await db.onApplicationShutdown(); }
}
bootstrap().catch(()=>{process.stderr.write('Administrator bootstrap refused. Check settings or existing administrator.\n');process.exitCode=1;});
