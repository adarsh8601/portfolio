/**
 * API for the portfolio: contact form + gated resume-PDF workflow.
 *
 *   POST /api/contact                 multipart form → email to NOTIFY_EMAIL
 *   POST /api/resume/request          JSON → pending request + email owner a signed review link
 *   GET  /api/resume/status/:id       → { status }
 *   GET  /api/resume/review?token=    owner review page (needs ADMIN_PASSCODE to act)
 *   POST /api/resume/review           approve / reject (token + passcode)
 *   GET  /api/resume/download?token=  streams the private PDF for approved requests only
 *
 * Written against Web-standard Request/Response (Hono) so it can be moved to
 * other runtimes; the Node entry point is server/node.js.
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { site } from '../src/data/content.js';
import { LIMITS, validateContact, validateResumeRequest } from '../shared/validation.js';
import { inspectAttachment } from './lib/files.js';
import {
  SECURITY_HEADERS, contactEmail, messagePage, ownerRequestEmail, reviewPage,
  visitorApprovedEmail, visitorRejectedEmail,
} from './lib/html.js';
import { createRateLimiter } from './lib/ratelimit.js';
import { safeEqual, signToken, verifyToken } from './lib/tokens.js';

const MIN = 60_000;

/**
 * @param {object} deps
 * @param {ReturnType<import('./config.js').loadConfig>} deps.config
 * @param {{send:Function}} deps.mailer
 * @param {ReturnType<import('./lib/store.js').createFileStore>} deps.store
 * @param {() => number} [deps.now]
 * @param {(c) => string} [deps.clientIp]
 */
export function createApp({ config, mailer, store, now = Date.now, clientIp = () => 'unknown' }) {
  const app = new Hono();
  const limiter = createRateLimiter();
  const limited = (c, name, limit, windowMs) => !limiter.hit(`${name}:${clientIp(c)}`, limit, windowMs, now());
  const json = (c, status, body) => c.json(body, status, { 'Cache-Control': 'no-store' });
  const html = (c, status, markup) => c.html(markup, status, SECURITY_HEADERS);

  if (config.allowedOrigins.length) {
    app.use('/api/*', cors({ origin: config.allowedOrigins, allowMethods: ['GET', 'POST'], maxAge: 600 }));
  }

  app.onError((err, c) => {
    console.error('[api] unexpected error:', err);
    return json(c, 500, { ok: false, error: 'Something went wrong on our side. Please try again later.' });
  });

  app.get('/api/health', (c) => json(c, 200, { ok: true }));

  /* ------------------------------ Contact ------------------------------ */
  app.post(
    '/api/contact',
    bodyLimit({ maxSize: LIMITS.attachmentBytes + 256 * 1024, onError: (c) => json(c, 413, { ok: false, error: 'File is too large (maximum 5 MB).' }) }),
    async (c) => {
      if (limited(c, 'contact', 5, 10 * MIN)) return json(c, 429, { ok: false, error: 'Too many messages. Please try again in a few minutes.' });

      let form;
      try {
        form = await c.req.formData();
      } catch {
        return json(c, 400, { ok: false, error: 'Invalid form submission.' });
      }
      // Spam traps: hidden honeypot field + minimum fill time.
      if (isBot(form.get('website'), form.get('startedAt'), now())) return json(c, 200, { ok: true });

      const file = form.get('attachment');
      const attachment = file && typeof file === 'object' && file.size > 0 ? file : null;
      const { values, errors, ok } = validateContact({
        name: form.get('name'), email: form.get('email'), subject: form.get('subject'), message: form.get('message'), attachment,
      });
      if (!ok) return json(c, 422, { ok: false, error: 'Please fix the highlighted fields.', fields: errors });

      const attachments = [];
      if (attachment) {
        const res = await inspectAttachment(attachment);
        if (!res.ok) return json(c, 422, { ok: false, error: res.error, fields: { attachment: res.error } });
        attachments.push({ filename: res.filename, content: res.content, contentType: res.contentType });
      }

      const mail = contactEmail(values, attachments.length > 0);
      try {
        await mailer.send({ to: config.notifyEmail, replyTo: values.email, ...mail, attachments });
      } catch (e) {
        console.error('[contact] mail failed:', e.message);
        return json(c, 502, { ok: false, error: 'Your message could not be delivered right now. Please try again later or email directly.' });
      }
      return json(c, 200, { ok: true });
    }
  );

  /* ------------------------- Resume: request ------------------------- */
  app.post('/api/resume/request', bodyLimit({ maxSize: 16 * 1024 }), async (c) => {
    if (limited(c, 'resume', 3, 30 * MIN)) return json(c, 429, { ok: false, error: 'Too many requests. Please try again later.' });
    let body;
    try {
      body = await c.req.json();
    } catch {
      return json(c, 400, { ok: false, error: 'Invalid request.' });
    }
    if (isBot(body.website, body.startedAt, now())) return json(c, 200, { ok: true, id: crypto.randomUUID(), status: 'pending' });

    const { values, errors, ok } = validateResumeRequest(body);
    if (!ok) return json(c, 422, { ok: false, error: 'Please fix the highlighted fields.', fields: errors });

    const record = {
      id: crypto.randomUUID(),
      createdAt: new Date(now()).toISOString(),
      status: 'pending',
      name: values.name,
      email: values.email,
      role: values.role,
      company: values.company,
      purpose: values.purpose,
      purposeDetail: values.purposeDetail,
      consentAt: new Date(now()).toISOString(),
      decidedAt: null,
      downloads: 0,
      history: [{ at: new Date(now()).toISOString(), event: 'submitted' }],
    };
    await store.create(record);

    const reviewToken = signToken(config.tokenSecret, { purpose: 'review', rid: record.id, ttlMs: config.reviewTtlHours * 60 * MIN, now: now() });
    const reviewUrl = `${config.siteUrl}/api/resume/review?token=${reviewToken}`;
    try {
      await mailer.send({ to: config.notifyEmail, replyTo: record.email, ...ownerRequestEmail(record, reviewUrl, config.reviewTtlHours) });
    } catch (e) {
      console.error('[resume] owner notification failed:', e.message);
      await store.remove(record.id); // don't leave a request nobody will ever see
      return json(c, 502, { ok: false, error: 'Your request could not be submitted right now. Please try again later.' });
    }
    return json(c, 201, { ok: true, id: record.id, status: 'pending' });
  });

  app.get('/api/resume/status/:id', async (c) => {
    if (limited(c, 'status', 30, 10 * MIN)) return json(c, 429, { ok: false, error: 'Too many requests.' });
    const id = c.req.param('id');
    const rec = /^[0-9a-f-]{36}$/i.test(id) ? await store.get(id) : null;
    if (!rec) return json(c, 404, { ok: false, error: 'Request not found.' });
    return json(c, 200, { ok: true, status: rec.status });
  });

  /* ------------------------- Resume: owner review ------------------------- */
  const loadForReview = async (token) => {
    const v = verifyToken(config.tokenSecret, token, 'review', now());
    if (!v.ok) return { error: v.reason === 'expired' ? 'This review link has expired.' : 'This review link is invalid.' };
    const rec = await store.get(v.rid);
    if (!rec) return { error: 'This request no longer exists.' };
    return { rec };
  };

  app.get('/api/resume/review', async (c) => {
    const token = c.req.query('token') || '';
    const { rec, error } = await loadForReview(token);
    if (error) return html(c, 400, messagePage('Link not valid', error));
    return html(c, 200, reviewPage(rec, token));
  });

  app.post('/api/resume/review', bodyLimit({ maxSize: 8 * 1024 }), async (c) => {
    const form = await c.req.parseBody();
    const token = String(form.token || '');
    const { rec, error } = await loadForReview(token);
    if (error) return html(c, 400, messagePage('Link not valid', error));
    if (limited(c, 'review', 8, 15 * MIN)) return html(c, 429, reviewPage(rec, token, { error: 'Too many attempts. Wait 15 minutes and try again.' }));
    if (!safeEqual(String(form.passcode || ''), config.adminPasscode)) {
      return html(c, 401, reviewPage(rec, token, { error: 'Incorrect passcode.' }));
    }
    const decision = form.decision === 'approve' ? 'approved' : form.decision === 'reject' ? 'rejected' : null;
    if (!decision) return html(c, 400, reviewPage(rec, token, { error: 'Choose approve or reject.' }));
    if (rec.status !== 'pending') return html(c, 409, reviewPage(rec, token));

    const at = new Date(now()).toISOString();
    const updated = await store.update(rec.id, (r) => {
      if (r.status !== 'pending') return false;
      r.status = decision;
      r.decidedAt = at;
      r.history = [...(r.history || []), { at, event: decision }];
    });
    if (updated.status !== decision) return html(c, 409, reviewPage(updated, token));

    let note = '';
    try {
      if (decision === 'approved') {
        const dl = signToken(config.tokenSecret, { purpose: 'download', rid: rec.id, ttlMs: config.downloadTtlHours * 60 * MIN, now: now() });
        const url = `${config.siteUrl}/api/resume/download?token=${dl}`;
        await mailer.send({ to: rec.email, ...visitorApprovedEmail(rec, url, config.downloadTtlHours, config.maxDownloads) });
        note = `A download link (valid ${config.downloadTtlHours} h) was emailed to ${rec.email}.`;
      } else {
        await mailer.send({ to: rec.email, ...visitorRejectedEmail(rec) });
        note = `A polite notification was emailed to ${rec.email}.`;
      }
    } catch (e) {
      console.error('[resume] visitor notification failed:', e.message);
      note = 'The decision was saved, but the email to the visitor could not be sent. Check the mail configuration.';
    }
    return html(c, 200, messagePage(decision === 'approved' ? 'Request approved' : 'Request rejected', note));
  });

  /* ------------------------- Resume: download ------------------------- */
  app.get('/api/resume/download', async (c) => {
    if (limited(c, 'download', 20, 10 * MIN)) return html(c, 429, messagePage('Slow down', 'Too many download attempts. Try again later.'));
    const v = verifyToken(config.tokenSecret, c.req.query('token') || '', 'download', now());
    if (!v.ok) {
      const expired = v.reason === 'expired';
      return html(c, expired ? 410 : 403, messagePage(expired ? 'Link expired' : 'Link not valid',
        expired ? 'This download link has expired. You can submit a new request from the resume page.' : 'This download link is not valid.'));
    }
    const rec = await store.get(v.rid);
    if (!rec || rec.status !== 'approved') return html(c, 403, messagePage('Not available', 'This request has not been approved.'));
    if (rec.downloads >= config.maxDownloads) {
      return html(c, 410, messagePage('Download limit reached', 'This link has been used the maximum number of times. Please submit a new request.'));
    }
    let pdf;
    try {
      pdf = await fs.readFile(config.resumePdfPath);
    } catch {
      console.error('[resume] PDF missing at', config.resumePdfPath);
      return html(c, 503, messagePage('Temporarily unavailable', 'The resume file is not available right now. Please try again later.'));
    }
    await store.update(rec.id, (r) => {
      r.downloads = (r.downloads || 0) + 1;
      r.history = [...(r.history || []), { at: new Date(now()).toISOString(), event: 'downloaded' }];
    });
    return c.body(pdf, 200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${site.fullName.replace(/[^\w]+/g, '-')}-Resume.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    });
  });

  app.all('/api/*', (c) => json(c, 404, { ok: false, error: 'Not found.' }));
  return app;
}

function isBot(honeypot, startedAt, now) {
  if (honeypot) return true;
  const t = Number(startedAt);
  return !t || now - t < LIMITS.minFillMs || now - t > 24 * 60 * MIN;
}
