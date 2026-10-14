/**
 * Node entry point: serves the API and (in production) the built site from dist/.
 *   npm run dev     → API on :8787, Vite proxies /api to it
 *   npm start       → API + static site on $PORT
 */
import path from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { getConnInfo } from '@hono/node-server/conninfo';
import { loadConfig, checkConfig, featureProblems } from './config.js';
import { createApp } from './app.js';
import { createMailer } from './lib/mailer.js';
import { createFileStore } from './lib/store.js';

try {
  process.loadEnvFile?.(path.resolve(import.meta.dirname, '../.env'));
} catch {
  /* no .env file — rely on the real environment */
}

const config = loadConfig();
const problems = checkConfig(config);
if (problems.length) {
  const msg = `Configuration problems:\n  - ${problems.join('\n  - ')}`;
  if (config.env === 'production') {
    console.error(msg);
    process.exit(1);
  }
  console.warn(`${msg}\n(continuing because NODE_ENV is not production)`);
}

const clientIp = (c) => {
  if (config.trustProxy) {
    const fwd = c.req.header('x-forwarded-for');
    if (fwd) return fwd.split(',')[0].trim();
  }
  try {
    return getConnInfo(c).remote.address || 'unknown';
  } catch {
    return 'unknown';
  }
};

const app = createApp({
  config,
  // In development a feature with missing settings answers 503 instead of failing mid-request.
  problems: featureProblems(config),
  mailer: createMailer(config),
  store: createFileStore(config.dataDir, { retentionDays: config.retentionDays }),
  clientIp,
});

if (config.env === 'production') {
  const root = path.relative(process.cwd(), config.distDir);
  app.use('/*', async (c, next) => {
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('X-Frame-Options', 'DENY');
  });
  app.get('/resume', (c) => c.redirect('/resume/', 301));
  app.use('/*', serveStatic({ root }));
  app.get('*', (c) => c.text('Not found', 404));
}

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`[server] ${config.env} · http://localhost:${info.port} · mail: ${config.mail.provider}`);
});
