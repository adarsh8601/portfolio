// Run with: npm test   (Node's built-in test runner — no extra dependencies)
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.js';
import { loadConfig, checkConfig } from '../server/config.js';
import { memoryMailer } from '../server/lib/mailer.js';
import { createFileStore, createMemoryStore } from '../server/lib/store.js';
import { signToken, verifyToken } from '../server/lib/tokens.js';
import { validateContact, validateResumeRequest } from '../shared/validation.js';

const SECRET = 'x'.repeat(40);
const PASS = 'correct-horse-battery';
let tmp, clock;

function setup({ pdf = true } = {}) {
  const config = {
    ...loadConfig({}),
    tokenSecret: SECRET,
    adminPasscode: PASS,
    notifyEmail: 'owner@example.com',
    siteUrl: 'https://portfolio.test',
    resumePdfPath: pdf ? path.join(tmp, 'resume.pdf') : path.join(tmp, 'missing.pdf'),
  };
  const mailer = memoryMailer();
  const store = createMemoryStore();
  let ip = 0;
  const app = createApp({ config, mailer, store, now: () => clock, clientIp: () => `10.0.0.${ip++ % 250}` });
  return { app, mailer, store, config };
}

const validRequest = (over = {}) => ({
  name: 'Priya Sharma', email: 'priya@company.com', role: 'Talent Partner', company: 'Acme',
  purpose: 'recruitment', purposeDetail: '', consent: true, startedAt: clock - 10_000, ...over,
});

const postJson = (app, url, body) => app.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const tokenFrom = (text, kind) => new URL(text.match(new RegExp(`https://portfolio\\.test/api/resume/${kind}\\?token=\\S+`))[0]).searchParams.get('token');
const review = (app, token, passcode, decision) =>
  app.request('/api/resume/review', { method: 'POST', body: new URLSearchParams({ token, passcode, decision }) });

before(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-test-'));
  // Test fixture only (a minimal valid PDF header) — not a real resume.
  await fs.writeFile(path.join(tmp, 'resume.pdf'), '%PDF-1.4\n% test fixture\n%%EOF\n');
  clock = Date.parse('2026-10-14T10:00:00Z');
});
after(() => fs.rm(tmp, { recursive: true, force: true }));

describe('tokens', () => {
  test('round-trips, rejects tampering, wrong purpose and expiry', () => {
    const now = 1_000_000;
    const t = signToken(SECRET, { purpose: 'download', rid: 'abc', ttlMs: 1000, now });
    assert.deepEqual(verifyToken(SECRET, t, 'download', now + 10).ok, true);
    assert.equal(verifyToken(SECRET, t, 'review', now).reason, 'purpose');
    assert.equal(verifyToken(SECRET, t, 'download', now + 2000).reason, 'expired');
    assert.equal(verifyToken('y'.repeat(40), t, 'download', now).reason, 'signature');
    const [body, sig] = t.split('.');
    const forged = Buffer.from(JSON.stringify({ p: 'download', rid: 'other', exp: now + 1e9 })).toString('base64url');
    assert.equal(verifyToken(SECRET, `${forged}.${sig}`, 'download', now).reason, 'signature');
    assert.equal(verifyToken(SECRET, `${body}`, 'download', now).reason, 'malformed');
  });
});

describe('shared validation', () => {
  test('contact rules', () => {
    assert.equal(validateContact({ name: 'A', email: 'bad', subject: '', message: 'short' }).ok, false);
    const r = validateContact({ name: 'Ada', email: 'ada@x.io', subject: 'Hello there', message: 'x'.repeat(25), attachment: { name: 'run.exe', size: 10 } });
    assert.match(r.errors.attachment, /Unsupported/);
    const big = validateContact({ name: 'Ada', email: 'ada@x.io', subject: 'Hello', message: 'x'.repeat(25), attachment: { name: 'a.pdf', size: 6e6 } });
    assert.match(big.errors.attachment, /too large/);
  });
  test('resume request rules', () => {
    const r = validateResumeRequest({ name: 'Ada', email: 'ada@x.io', role: 'CTO', purpose: 'other', consent: false });
    assert.ok(r.errors.purposeDetail && r.errors.consent);
    assert.equal(validateResumeRequest({ name: 'Ada', email: 'ada@x.io', role: 'CTO', purpose: 'internship', consent: true }).ok, true);
  });
});

describe('config', () => {
  test('production refuses console mail and weak secrets', () => {
    const problems = checkConfig(loadConfig({ NODE_ENV: 'production', TOKEN_SECRET: 'short' }));
    assert.ok(problems.some((p) => p.includes('TOKEN_SECRET')));
    assert.ok(problems.some((p) => p.includes('console')));
  });
});

describe('contact form', () => {
  const form = (over = {}, file) => {
    const fd = new FormData();
    const v = { name: 'Ada Lovelace', email: 'ada@example.com', subject: 'Data role', message: 'Hello, I would like to talk about a role.', startedAt: String(clock - 8000), ...over };
    for (const [k, val] of Object.entries(v)) fd.append(k, val);
    if (file) fd.append('attachment', file);
    return fd;
  };

  test('delivers a valid message with a PDF attachment to the owner', async () => {
    const { app, mailer } = setup();
    const pdf = new File(['%PDF-1.7\nhello'], 'brief.pdf', { type: 'application/pdf' });
    const res = await app.request('/api/contact', { method: 'POST', body: form({}, pdf) });
    assert.equal(res.status, 200);
    assert.equal(mailer.outbox.length, 1);
    assert.equal(mailer.outbox[0].to, 'owner@example.com');
    assert.equal(mailer.outbox[0].replyTo, 'ada@example.com');
    assert.equal(mailer.outbox[0].attachments[0].filename, 'brief.pdf');
  });

  test('rejects executables, spoofed PDFs and invalid fields server-side', async () => {
    const { app, mailer } = setup();
    let res = await app.request('/api/contact', { method: 'POST', body: form({}, new File(['MZ...'], 'setup.exe')) });
    assert.equal(res.status, 422);
    res = await app.request('/api/contact', { method: 'POST', body: form({}, new File(['MZ fake'], 'cv.pdf')) });
    assert.equal(res.status, 422);
    assert.match((await res.json()).fields.attachment, /do not match/);
    res = await app.request('/api/contact', { method: 'POST', body: form({ email: 'nope' }) });
    assert.equal(res.status, 422);
    assert.ok((await res.json()).fields.email);
    assert.equal(mailer.outbox.length, 0);
  });

  test('honeypot / too-fast submissions are dropped silently', async () => {
    const { app, mailer } = setup();
    await app.request('/api/contact', { method: 'POST', body: form({ website: 'spam.com' }) });
    await app.request('/api/contact', { method: 'POST', body: form({ startedAt: String(clock - 100) }) });
    assert.equal(mailer.outbox.length, 0);
  });

  test('reports delivery failure instead of pretending success', async () => {
    const { app, mailer } = setup();
    mailer.send = async () => { throw new Error('smtp down'); };
    const res = await app.request('/api/contact', { method: 'POST', body: form() });
    assert.equal(res.status, 502);
  });

  test('rate limits per client', async () => {
    const config = { ...loadConfig({}), tokenSecret: SECRET, adminPasscode: PASS, notifyEmail: 'o@x.io' };
    const app = createApp({ config, mailer: memoryMailer(), store: createMemoryStore(), now: () => clock, clientIp: () => '1.1.1.1' });
    const codes = [];
    for (let i = 0; i < 6; i++) codes.push((await app.request('/api/contact', { method: 'POST', body: form() })).status);
    assert.deepEqual(codes, [200, 200, 200, 200, 200, 429]);
  });
});

describe('resume approval workflow', () => {
  test('full approve → download flow with all guards', async () => {
    const { app, mailer, store } = setup();
    const res = await postJson(app, '/api/resume/request', validRequest());
    assert.equal(res.status, 201);
    const { id, status } = await res.json();
    assert.equal(status, 'pending');
    assert.equal((await store.get(id)).status, 'pending');

    // Owner was notified with a signed review link; visitor got nothing yet.
    assert.equal(mailer.outbox.length, 1);
    assert.equal(mailer.outbox[0].to, 'owner@example.com');
    const reviewToken = tokenFrom(mailer.outbox[0].text, 'review');

    // A review token can never be used as a download token.
    let r = await app.request(`/api/resume/download?token=${reviewToken}`);
    assert.equal(r.status, 403);

    // Forged download token for this id is rejected.
    const forged = signToken('z'.repeat(40), { purpose: 'download', rid: id, ttlMs: 1e6, now: clock });
    assert.equal((await app.request(`/api/resume/download?token=${forged}`)).status, 403);

    // A correctly-signed download token is still useless while pending.
    const premature = signToken(SECRET, { purpose: 'download', rid: id, ttlMs: 1e6, now: clock });
    assert.equal((await app.request(`/api/resume/download?token=${premature}`)).status, 403);

    // Review page renders; wrong passcode cannot approve.
    assert.equal((await app.request(`/api/resume/review?token=${reviewToken}`)).status, 200);
    assert.equal((await review(app, reviewToken, 'guess', 'approve')).status, 401);
    assert.equal((await store.get(id)).status, 'pending');

    // Correct passcode approves, records time, emails visitor a download link.
    r = await review(app, reviewToken, PASS, 'approve');
    assert.equal(r.status, 200);
    const rec = await store.get(id);
    assert.equal(rec.status, 'approved');
    assert.ok(rec.decidedAt);
    const visitorMail = mailer.outbox.at(-1);
    assert.equal(visitorMail.to, 'priya@company.com');
    const dl = tokenFrom(visitorMail.text, 'download');

    // Download token cannot be used to review/approve anything.
    assert.equal((await review(app, dl, PASS, 'approve')).status, 400);

    // Download works and returns the PDF with no-store caching.
    r = await app.request(`/api/resume/download?token=${dl}`);
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('content-type'), 'application/pdf');
    assert.match(r.headers.get('cache-control'), /no-store/);
    assert.match(await r.text(), /^%PDF/);

    // Second decision is refused.
    assert.equal((await review(app, reviewToken, PASS, 'reject')).status, 409);

    // Download limit enforced (default 3).
    await app.request(`/api/resume/download?token=${dl}`);
    await app.request(`/api/resume/download?token=${dl}`);
    assert.equal((await app.request(`/api/resume/download?token=${dl}`)).status, 410);
  });

  test('download links expire', async () => {
    const { app, mailer, config } = setup();
    await postJson(app, '/api/resume/request', validRequest());
    await review(app, tokenFrom(mailer.outbox[0].text, 'review'), PASS, 'approve');
    const dl = tokenFrom(mailer.outbox.at(-1).text, 'download');
    const saved = clock;
    clock += (config.downloadTtlHours + 1) * 3600_000;
    const r = await app.request(`/api/resume/download?token=${dl}`);
    clock = saved;
    assert.equal(r.status, 410);
    assert.match(await r.text(), /expired/);
  });

  test('rejected requests never get access', async () => {
    const { app, mailer, store } = setup();
    const { id } = await (await postJson(app, '/api/resume/request', validRequest())).json();
    const r = await review(app, tokenFrom(mailer.outbox[0].text, 'review'), PASS, 'reject');
    assert.equal(r.status, 200);
    assert.equal((await store.get(id)).status, 'rejected');
    assert.equal(mailer.outbox.at(-1).to, 'priya@company.com');
    assert.doesNotMatch(mailer.outbox.at(-1).text, /download/i);
    const t = signToken(SECRET, { purpose: 'download', rid: id, ttlMs: 1e6, now: clock });
    assert.equal((await app.request(`/api/resume/download?token=${t}`)).status, 403);
  });

  test('validation, unknown ids, expired review links, missing PDF', async () => {
    const { app } = setup({ pdf: false });
    let r = await postJson(app, '/api/resume/request', validRequest({ consent: false, email: 'x' }));
    assert.equal(r.status, 422);
    const body = await r.json();
    assert.ok(body.fields.consent && body.fields.email);
    assert.equal((await app.request('/api/resume/status/00000000-0000-0000-0000-000000000000')).status, 404);
    assert.equal((await app.request('/api/resume/status/../../etc')).status, 404);
    const oldReview = signToken(SECRET, { purpose: 'review', rid: 'x', ttlMs: 1, now: clock - 10_000 });
    r = await app.request(`/api/resume/review?token=${oldReview}`);
    assert.equal(r.status, 400);
    assert.match(await r.text(), /expired/);
    assert.equal((await app.request('/api/resume/download?token=garbage')).status, 403);
  });

  test('missing PDF on disk yields 503, not a crash', async () => {
    const { app, mailer } = setup({ pdf: false });
    await postJson(app, '/api/resume/request', validRequest());
    await review(app, tokenFrom(mailer.outbox[0].text, 'review'), PASS, 'approve');
    const r = await app.request(`/api/resume/download?token=${tokenFrom(mailer.outbox.at(-1).text, 'download')}`);
    assert.equal(r.status, 503);
  });

  test('if the owner cannot be notified, the request is rolled back and the visitor told', async () => {
    const { app, mailer, store } = setup();
    const created = [];
    const origCreate = store.create;
    store.create = async (rec) => (created.push(rec.id), origCreate(rec));
    mailer.send = async () => { throw new Error('down'); };
    const r = await postJson(app, '/api/resume/request', validRequest());
    assert.equal(r.status, 502);
    assert.equal(created.length, 1);
    assert.equal(await store.get(created[0]), null);
  });

  test('review page escapes visitor-supplied HTML', async () => {
    const { app, mailer } = setup();
    await postJson(app, '/api/resume/request', validRequest({ name: '<script>alert(1)</script>' }));
    const page = await (await app.request(`/api/resume/review?token=${tokenFrom(mailer.outbox[0].text, 'review')}`)).text();
    assert.doesNotMatch(page, /<script>alert/);
    assert.match(page, /&lt;script&gt;/);
  });
});

describe('file store', () => {
  test('persists atomically and prunes old records', async () => {
    const dir = path.join(tmp, 'data');
    const s = createFileStore(dir, { retentionDays: 1 });
    await s.create({ id: 'old', createdAt: '2000-01-01T00:00:00Z', status: 'pending' });
    await s.create({ id: 'new', createdAt: new Date().toISOString(), status: 'pending' });
    await s.update('new', (r) => { r.status = 'approved'; });
    const raw = JSON.parse(await fs.readFile(path.join(dir, 'resume-requests.json'), 'utf8'));
    assert.equal(raw.new.status, 'approved');
    assert.equal(raw.old, undefined);
  });
});
