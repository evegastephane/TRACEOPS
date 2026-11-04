import { Database } from './database.module.js';
import { initializeDemo } from './demo-data.js';
async function main() {
 if (process.env.TRACEOPS_DEMO !== 'local-only' || process.env.NODE_ENV !== 'development') throw new Error('LOCAL_DEMO_DISABLED');
 const db = new Database();
 try {
  const accounts = await initializeDemo(db);
  process.stdout.write('TRACEOPS — comptes de démonstration locaux. Conservez ces mots de passe privés ; ils ne seront pas réaffichés.\n');
  process.stdout.write(JSON.stringify(accounts, null, 2) + '\n');
 } finally { await db.onApplicationShutdown(); }
}
main().catch(error => {
 const known = error instanceof Error && ['DEMO_REQUIRES_EMPTY_DATABASE','LOCAL_DEMO_DISABLED'].includes(error.message);
 process.stderr.write(known ? error.message + '\n' : 'Initialisation refusée. Vérifiez la base et les migrations.\n');
 process.exitCode = 1;
});
