/**
 * Server-only configuration. Every secret comes from environment variables
 * (see .env.example). Nothing in this file is ever bundled into the browser.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const num = (v, d) => (v !== undefined && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : d);

const LOCAL_HOST = /^(localhost|.*\.localhost|127(\.\d{1,3}){3}|0\.0\.0\.0|\[::1?\])$/i;
const HOSTNAME = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

/**
 * Public address used to build links inside emails (review / download links).
 * Order: PUBLIC_SITE_URL → Vercel's own URL variables → localhost (development only).
 * In production it must be a public https URL; otherwise siteUrl is '' and the
 * resume feature reports the problem instead of emailing broken links.
 * Returns { url, source, problem } — never a secret.
 */
export function resolveSiteUrl(env = process.env) {
  const production = (env.NODE_ENV || 'development') === 'production';
  const explicit = (env.PUBLIC_SITE_URL || '').trim();

  if (explicit) {
    let u;
    try {
      u = new URL(explicit);
    } catch {
      return { url: '', source: 'PUBLIC_SITE_URL', problem: 'PUBLIC_SITE_URL is not a valid URL (expected e.g. https://your-site.vercel.app).' };
    }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') {
      return { url: '', source: 'PUBLIC_SITE_URL', problem: 'PUBLIC_SITE_URL must start with https://.' };
    }
    if (production && (u.protocol !== 'https:' || LOCAL_HOST.test(u.hostname))) {
      return { url: '', source: 'PUBLIC_SITE_URL', problem: 'PUBLIC_SITE_URL must be a public https:// address in production (localhost is not allowed).' };
    }
    return { url: (u.origin + u.pathname).replace(/\/+$/, ''), source: 'PUBLIC_SITE_URL', problem: '' };
  }

  if (env.VERCEL) {
    // Vercel provides host names without the protocol. Production uses the project's
    // production domain; preview deployments link to their own deployment URL.
    const candidates =
      env.VERCEL_ENV === 'production'
        ? ['VERCEL_PROJECT_PRODUCTION_URL']
        : ['VERCEL_URL', 'VERCEL_PROJECT_PRODUCTION_URL'];
    for (const name of candidates) {
      const host = (env[name] || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
      if (host && HOSTNAME.test(host) && !LOCAL_HOST.test(host)) return { url: `https://${host}`, source: name, problem: '' };
    }
  }

  if (production) {
    return { url: '', source: '', problem: 'PUBLIC_SITE_URL is not set and no Vercel production URL is available (needed for links in emails).' };
  }
  return { url: 'http://localhost:5173', source: 'development default', problem: '' };
}

export function loadConfig(env = process.env) {
  const site = resolveSiteUrl(env);
  const cfg = {
    env: env.NODE_ENV || 'development',
    port: num(env.PORT, 8787),
    siteUrl: site.url,
    siteUrlSource: site.source,
    siteUrlProblem: site.problem,
    allowedOrigins: (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
    trustProxy: env.TRUST_PROXY === 'true',

    tokenSecret: env.TOKEN_SECRET || '',
    adminPasscode: env.ADMIN_PASSCODE || '',

    notifyEmail: env.NOTIFY_EMAIL || '',
    mailFrom: env.MAIL_FROM || '',
    mail: {
      provider: (env.MAIL_PROVIDER || 'console').toLowerCase(),
      resendApiKey: env.RESEND_API_KEY || '',
      smtp: {
        host: env.SMTP_HOST || '',
        port: num(env.SMTP_PORT, 465),
        secure: env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : true,
        user: env.SMTP_USER || '',
        pass: env.SMTP_PASS || '',
      },
    },

    resumePdfPath: path.resolve(root, env.RESUME_PDF_PATH || 'server/private/resume.pdf'),
    // Upstash Redis (REST) — used for requests + the private PDF on serverless hosts like Vercel.
    upstash: { url: (env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, ''), token: env.UPSTASH_REDIS_REST_TOKEN || '' },
    serverless: Boolean(env.VERCEL),
    dataDir: path.resolve(root, env.DATA_DIR || 'data'),
    distDir: path.resolve(root, 'dist'),

    reviewTtlHours: num(env.REVIEW_LINK_TTL_HOURS, 168),
    downloadTtlHours: num(env.DOWNLOAD_LINK_TTL_HOURS, 48),
    maxDownloads: num(env.MAX_DOWNLOADS, 3),
    retentionDays: num(env.RETENTION_DAYS, 90),
  };
  return cfg;
}

/**
 * Configuration problems grouped by feature, so one missing setting doesn't
 * take down everything:
 *  - mail:   needed by the contact form AND the resume workflow (it emails too)
 *  - resume: extra settings only the resume request / review / download need
 * Messages name variables only — never their values.
 */
export function featureProblems(cfg) {
  const mail = [];
  const resume = [];
  if (!cfg.notifyEmail) mail.push('NOTIFY_EMAIL is not set (where contact messages and resume requests go).');
  const p = cfg.mail.provider;
  if (!['resend', 'smtp', 'console', 'memory'].includes(p)) mail.push(`Unknown MAIL_PROVIDER "${p}".`);
  if (p === 'resend' && !cfg.mail.resendApiKey) mail.push('RESEND_API_KEY is required for MAIL_PROVIDER=resend.');
  if (p === 'smtp' && (!cfg.mail.smtp.host || !cfg.mail.smtp.user || !cfg.mail.smtp.pass)) {
    mail.push('SMTP_HOST, SMTP_USER and SMTP_PASS are required for MAIL_PROVIDER=smtp.');
  }
  if ((p === 'resend' || p === 'smtp') && !cfg.mailFrom) mail.push('MAIL_FROM is required.');
  if (cfg.env === 'production' && (p === 'console' || p === 'memory')) {
    mail.push('MAIL_PROVIDER is not set to smtp or resend (console only prints emails to the log; not allowed in production).');
  }
  if (cfg.tokenSecret.length < 32) resume.push('TOKEN_SECRET must be at least 32 characters.');
  if (cfg.adminPasscode.length < 12) resume.push('ADMIN_PASSCODE must be at least 12 characters.');
  // Contact emails contain no links, so only the resume workflow depends on the public URL.
  if (cfg.siteUrlProblem) resume.push(cfg.siteUrlProblem);
  else if (!cfg.siteUrl) resume.push('PUBLIC_SITE_URL is not set (needed for links in emails).');
  if (cfg.serverless && (!cfg.upstash.url || !cfg.upstash.token)) {
    resume.push('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required on Vercel (there is no persistent disk).');
  }
  return { mail, resume };
}

/** All problems as one list (used by the Node server, where any problem is fatal in production). */
export function checkConfig(cfg) {
  const { mail, resume } = featureProblems(cfg);
  return [...mail, ...resume];
}
