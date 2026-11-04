import { createApplication } from './application.js';
import { configuration } from './config.js';
async function bootstrap() {
  const config = configuration();
  const app = await createApplication();
  await app.listen(config.port);
}
bootstrap().catch(() => {
  process.stderr.write('TRACEOPS startup failed. Check configuration and runtime.\n');
  process.exitCode = 1;
});
