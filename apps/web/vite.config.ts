import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Dev only: the API (Docker, http://localhost:3000) rejects writes from another origin, so the proxy presents its own.
const apiOrigin = process.env.TRACEOPS_API_ORIGIN ?? 'http://localhost:3000';
export default defineConfig({plugins:[react()],server:{host:'127.0.0.1',port:5173,proxy:{'/api':{target:'http://127.0.0.1:3000',configure:proxy=>{proxy.on('proxyReq',req=>{if(req.getHeader('origin'))req.setHeader('origin',apiOrigin);});}}}},build:{outDir:'../../web-dist',emptyOutDir:true}});
