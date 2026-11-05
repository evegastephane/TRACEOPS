import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { resolve } from 'node:path';
import { AppModule } from './app.module.js';

export async function createApplication(logger: false | undefined = undefined) {
  const app = await NestFactory.create(AppModule, { bodyParser:false, logger });
  app.use(helmet());
  app.use(express.json({limit:'16kb'}));
  // Field photos arrive as raw JPEG or PNG bytes on their own route, never as JSON.
  app.use('/api/v1/interventions/:id/photos', express.raw({type:['image/jpeg','image/png'],limit:'6mb'}));
  app.use(cookieParser());
  const origin = process.env.APP_ORIGIN ?? 'http://localhost:5173';
  if (process.env.NODE_ENV === 'production' && !process.env.APP_ORIGIN) throw new Error('APP_ORIGIN required');
  app.use('/api', (req: express.Request,res: express.Response,next: express.NextFunction) => {
    res.setHeader('Cache-Control','no-store');
    if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
      if (req.get('X-Traceops')!=='request' || (req.get('Origin') && req.get('Origin')!==origin)) {
        res.status(403).json({message:'REQUEST_ORIGIN_REJECTED'});return;
      }
    }
    next();
  });
  app.setGlobalPrefix('api/v1');
  // Production frontend is built into web-dist; client navigation uses hash state.
  app.use(express.static(resolve('web-dist'), { index:'index.html' }));
  app.enableShutdownHooks();
  return app;
}
