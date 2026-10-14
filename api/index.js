/**
 * Vercel serverless entry for the portfolio API (Node.js runtime).
 * vercel.json rewrites /api/* here; Hono routes on the original path.
 * Storage + the private resume PDF live in Upstash Redis (no disk on Vercel).
 */
import { handle } from 'hono/vercel';
import { Hono } from 'hono';
import { checkConfig, loadConfig } from '../server/config.js';
import { createApp } from '../server/app.js';
import { createMailer } from '../server/lib/mailer.js';
import { createUpstashStore, upstashClient, upstashResumeLoader } from '../server/lib/upstash.js';

function build() {
  const config = loadConfig();
  const problems = checkConfig(config);
  if (problems.length) {
    console.error(`[api] configuration problems:\n  - ${problems.join('\n  - ')}`);
    const broken = new Hono();
    broken.all('*', (c) =>
      c.json({ ok: false, error: 'The service is not configured yet. Please try again later.' }, 503)
    );
    return broken;
  }
  const cmd = upstashClient(config.upstash);
  return createApp({
    config,
    mailer: createMailer(config),
    store: createUpstashStore(cmd, { retentionDays: config.retentionDays }),
    loadResume: upstashResumeLoader(cmd),
    clientIp: (c) => (c.req.header('x-forwarded-for') || '').split(',')[0].trim() || 'unknown',
  });
}

const app = build();

/**
 * vercel.json rewrites /api/<path> → /api?__path=<path>. Restore the original
 * path (whether or not Vercel already kept it) before handing over to Hono.
 */
const handler = handle({
  fetch(request) {
    const url = new URL(request.url);
    const p = url.searchParams.get('__path');
    url.searchParams.delete('__path');
    if (p !== null && (url.pathname === '/api' || url.pathname === '/api/')) url.pathname = `/api/${p}`;
    const hasBody = !['GET', 'HEAD'].includes(request.method);
    return app.fetch(
      new Request(url, { method: request.method, headers: request.headers, body: hasBody ? request.body : undefined, duplex: 'half' })
    );
  },
});
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
