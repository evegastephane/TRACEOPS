import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { configuration } from './config.js';

async function bootstrap() {
  const config = configuration();
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  await app.listen(config.port);
}
bootstrap().catch(() => {
  process.stderr.write('TRACEOPS startup failed. Check configuration and runtime.\n');
  process.exitCode = 1;
});
