import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        resume: resolve(import.meta.dirname, 'resume/index.html'),
      },
    },
  },
  server: {
    // During `npm run dev` the API runs separately (server/node.js on :8787).
    proxy: { '/api': 'http://localhost:8787' },
  },
  preview: { proxy: { '/api': 'http://localhost:8787' } },
});
