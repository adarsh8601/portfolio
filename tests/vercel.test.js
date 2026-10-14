// Tests the Vercel entry (api/index.js) end to end with a mocked Upstash REST API
// and a mocked Resend API — no network, no real credentials.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { RESUME_PDF_KEY } from '../server/lib/upstash.js';

const UPSTASH = 'https://fake-upstash.test';
const redis = new Map();
const sent = [];
const realFetch = globalThis.fetch;
const savedEnv = { ...process.env };

before(() => {
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (url.startsWith(UPSTASH)) {
      assert.equal(init.headers.Authorization, 'Bearer test-token');
      const [cmd, key, value] = JSON.parse(init.body);
      let result = null;
      if (cmd === 'SET') result = (redis.set(key, value), 'OK');
      else if (cmd === 'GET') result = redis.get(key) ?? null;
      else if (cmd === 'DEL') result = Number(redis.delete(key));
      else if (cmd === 'STRLEN') result = (redis.get(key) || '').length;
      return new Response(JSON.stringify({ result }), { status: 200 });
    }
    if (url === 'https://api.resend.com/emails') {
      sent.push(JSON.parse(init.body));
      return new Response('{"id":"x"}', { status: 200 });
    }
    return realFetch(input, init);
  };
  Object.assign(process.env, {
    VERCEL: '1',
    NODE_ENV: 'production',
    PUBLIC_SITE_URL: 'https://adarsh.test',
    TOKEN_SECRET: 's'.repeat(48),
    ADMIN_PASSCODE: 'vercel-passcode-123',
    NOTIFY_EMAIL: 'owner@example.com',
    MAIL_FROM: 'Portfolio <p@example.com>',
    MAIL_PROVIDER: 'resend',
    RESEND_API_KEY: 're_test',
    UPSTASH_REDIS_REST_URL: UPSTASH,
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
  });
});
after(() => {
  globalThis.fetch = realFetch;
  process.env = savedEnv;
});

const tokenFrom = (text, kind) => new URL(text.match(new RegExp(`https://adarsh\\.test/api/resume/${kind}\\?token=\\S+`))[0]).searchParams.get('token');

test('Vercel entry: rewritten paths, Upstash storage and approved PDF download', async () => {
  const api = await import('../api/index.js');
  const call = (path, init) => api[init?.method || 'GET'](new Request(`https://adarsh.test${path}`, init));

  // Both the rewritten form and the original path reach the right route.
  assert.equal((await call('/api?__path=health')).status, 200);
  assert.equal((await call('/api/health')).status, 200);

  const body = JSON.stringify({ name: 'Priya', email: 'priya@co.com', role: 'Recruiter', purpose: 'recruitment', consent: true, startedAt: Date.now() - 10_000 });
  const r = await call('/api?__path=resume/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  assert.equal(r.status, 201);
  const { id } = await r.json();
  assert.ok(redis.has(`resume-request:${id}`), 'request stored in Upstash');

  const review = tokenFrom(sent[0].text, 'review');
  const form = new URLSearchParams({ token: review, passcode: 'vercel-passcode-123', decision: 'approve' });
  assert.equal((await call('/api?__path=resume/review', { method: 'POST', body: form })).status, 200);
  assert.equal(JSON.parse(redis.get(`resume-request:${id}`)).status, 'approved');

  const dl = tokenFrom(sent.at(-1).text, 'download');
  assert.equal((await call(`/api?__path=resume/download&token=${dl}`)).status, 503, 'PDF not uploaded yet → 503');
  redis.set(RESUME_PDF_KEY, Buffer.from('%PDF-1.4 test').toString('base64'));
  const pdf = await call(`/api?__path=resume/download&token=${dl}`);
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get('content-type'), 'application/pdf');
  assert.match(await pdf.text(), /^%PDF/);

  // Multipart contact form through the entry
  const fd = new FormData();
  for (const [k, v] of Object.entries({ name: 'Ada Lovelace', email: 'ada@x.io', subject: 'Hello', message: 'A message that is long enough.', startedAt: String(Date.now() - 9000) })) fd.append(k, v);
  fd.append('attachment', new File(['%PDF-1.7 x'], 'cv.pdf', { type: 'application/pdf' }));
  const c = await call('/api?__path=contact', { method: 'POST', body: fd });
  assert.equal(c.status, 200);
  assert.equal(sent.at(-1).attachments[0].filename, 'cv.pdf');
});

test('Vercel entry refuses to run without Upstash config', async () => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  const api = await import('../api/index.js?noupstash');
  const r = await api.GET(new Request('https://adarsh.test/api/health'));
  assert.equal(r.status, 503);
  process.env.UPSTASH_REDIS_REST_URL = UPSTASH;
});
