import { mkdir, readFile, writeFile } from 'node:fs/promises';
// Keep the downloadable prototype self-contained, but serve external assets
// in the application so Helmet's script-src 'self' remains unchanged.
const source = await readFile('docs/ux/prototype.html', 'utf8');
const style = source.match(/<style>([\s\S]*?)<\/style>/);
const script = source.match(/<script>([\s\S]*?)<\/script>/);
if (!style || !script) throw new Error('Prototype style or script missing');
await mkdir('web-dist/prototype-assets', { recursive: true });
await writeFile('web-dist/prototype-assets/style.css', style[1]);
await writeFile('web-dist/prototype-assets/app.js', script[1]);
await writeFile('web-dist/prototype.html', source
  .replace(style[0], '<link rel="stylesheet" href="/prototype-assets/style.css">')
  .replace(script[0], '<script src="/prototype-assets/app.js"></script>'));
