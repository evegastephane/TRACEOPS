import { cp, mkdir } from 'node:fs/promises';
await mkdir('dist/migrations', { recursive: true });
await cp('apps/api/migrations', 'dist/migrations', { recursive: true });
