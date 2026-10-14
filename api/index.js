/**
 * Vercel serverless entry for the portfolio API (Node.js runtime).
 * vercel.json rewrites /api/* here; Hono routes on the original path.
 * Storage + the private resume PDF live in Upstash Redis (no disk on Vercel).
 */
import { handle } from 'hono/vercel';
import { featureProblems, loadConfig } from '../server/config.js';
import { createApp } from '../server/app.js';
import { createMailer } from '../server/lib/mailer.js';
import { createUpstashStore, upstashClient, upstashResumeLoader } from '../server/lib/upstash.js';

// Placeholder used when Upstash isn't configured; the resume routes are disabled
// (503) in that case, so this is never reached by a request.
const unavailable = () => {
  throw new Error('Upstash is not configured');
};

function build() {
  const config = loadConfig();
  const problems = featureProblems(config);
  const all = [...problems.mail, ...problems.resume];
  // Logged to Vercel → Logs: names of missing settings only, never their values.
  if (all.length) console.error(`[api] configuration problems:\n  - ${all.join('\n  - ')}`);

  const hasUpstash = Boolean(config.upstash.url && config.upstash.token);
  const cmd = hasUpstash ? upstashClient(config.upstash) : null;
  return createApp({
    config,
    problems,
    mailer: createMailer(config),
    store: cmd
      ? createUpstashStore(cmd, { retentionDays: config.retentionDays })
      : { create: unavailable, get: unavailable, update: unavailable, remove: unavailable },
    loadResume: cmd ? upstashResumeLoader(cmd) : unavailable,
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
