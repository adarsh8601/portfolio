/**
 * Server-only configuration. Every secret comes from environment variables
 * (see .env.example). Nothing in this file is ever bundled into the browser.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const num = (v, d) => (v !== undefined && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : d);

export function loadConfig(env = process.env) {
  const cfg = {
    env: env.NODE_ENV || 'development',
    port: num(env.PORT, 8787),
    siteUrl: (env.PUBLIC_SITE_URL || 'http://localhost:5173').replace(/\/$/, ''),
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

/** Returns a list of problems. In production any problem is fatal. */
export function checkConfig(cfg) {
  const problems = [];
  if (cfg.tokenSecret.length < 32) problems.push('TOKEN_SECRET must be at least 32 characters.');
  if (cfg.adminPasscode.length < 12) problems.push('ADMIN_PASSCODE must be at least 12 characters.');
  if (!cfg.notifyEmail) problems.push('NOTIFY_EMAIL is not set (where contact messages and resume requests go).');
  const p = cfg.mail.provider;
  if (p === 'resend' && !cfg.mail.resendApiKey) problems.push('RESEND_API_KEY is required for MAIL_PROVIDER=resend.');
  if (p === 'smtp' && (!cfg.mail.smtp.host || !cfg.mail.smtp.user || !cfg.mail.smtp.pass)) {
    problems.push('SMTP_HOST, SMTP_USER and SMTP_PASS are required for MAIL_PROVIDER=smtp.');
  }
  if ((p === 'resend' || p === 'smtp') && !cfg.mailFrom) problems.push('MAIL_FROM is required.');
  if (!['resend', 'smtp', 'console', 'memory'].includes(p)) problems.push(`Unknown MAIL_PROVIDER "${p}".`);
  if (cfg.serverless && (!cfg.upstash.url || !cfg.upstash.token)) {
    problems.push('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required on Vercel (there is no persistent disk).');
  }
  if (cfg.env === 'production' && (p === 'console' || p === 'memory')) {
    problems.push('MAIL_PROVIDER=console only prints emails to the log; configure resend or smtp for production.');
  }
  return problems;
}
