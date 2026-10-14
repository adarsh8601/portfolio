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

const contactForm = () => {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ name: 'Ada Lovelace', email: 'ada@x.io', subject: 'Hello', message: 'A message that is long enough.', startedAt: String(Date.now() - 9000) })) fd.append(k, v);
  return fd;
};
const resumeBody = () => JSON.stringify({ name: 'Priya', email: 'priya@co.com', role: 'Recruiter', purpose: 'recruitment', consent: true, startedAt: Date.now() - 10_000 });

// Regression: previously ANY missing setting (e.g. Upstash) made the whole API
// answer "The service is not configured yet", including the contact form.
test('missing Upstash only disables the resume workflow — contact form still sends', async () => {
  const saved = process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_URL;
  try {
    const api = await import('../api/index.js?noupstash');
    const health = await (await api.GET(new Request('https://adarsh.test/api/health'))).json();
    assert.equal(health.contact, true);
    assert.equal(health.resume, false);
    assert.ok(health.missing.some((m) => m.includes('UPSTASH_REDIS_REST_URL')));
    assert.ok(!JSON.stringify(health).includes('test-token'), 'no secret values in health output');

    const before = sent.length;
    const c = await api.POST(new Request('https://adarsh.test/api?__path=contact', { method: 'POST', body: contactForm() }));
    assert.equal(c.status, 200);
    assert.equal(sent.length, before + 1, 'contact email was handed to the provider');

    const r = await api.POST(new Request('https://adarsh.test/api?__path=resume/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: resumeBody() }));
    assert.equal(r.status, 503);
    assert.match((await r.json()).error, /resume request service is not configured/);
    assert.equal(sent.length, before + 1, 'no email for a disabled feature');
  } finally {
    process.env.UPSTASH_REDIS_REST_URL = saved;
  }
});

test('missing mail settings fail safely: contact 503, nothing sent, no fake success', async () => {
  const saved = { MAIL_PROVIDER: process.env.MAIL_PROVIDER, RESEND_API_KEY: process.env.RESEND_API_KEY };
  delete process.env.MAIL_PROVIDER; // falls back to "console", which production refuses
  try {
    const api = await import('../api/index.js?nomail');
    const health = await (await api.GET(new Request('https://adarsh.test/api/health'))).json();
    assert.deepEqual([health.contact, health.resume], [false, false]);
    assert.ok(health.missing.some((m) => m.includes('MAIL_PROVIDER')));
    const before = sent.length;
    const c = await api.POST(new Request('https://adarsh.test/api?__path=contact', { method: 'POST', body: contactForm() }));
    assert.equal(c.status, 503);
    const body = await c.json();
    assert.equal(body.ok, false);
    assert.match(body.error, /message service is not configured/);
    assert.equal(sent.length, before);
  } finally {
    Object.assign(process.env, saved);
  }
});

test('missing TOKEN_SECRET only disables resume routes', async () => {
  const saved = process.env.TOKEN_SECRET;
  delete process.env.TOKEN_SECRET;
  try {
    const api = await import('../api/index.js?nosecret');
    const health = await (await api.GET(new Request('https://adarsh.test/api/health'))).json();
    assert.deepEqual([health.contact, health.resume], [true, false]);
    assert.equal((await api.GET(new Request('https://adarsh.test/api/resume/download?token=x'))).status, 503);
    assert.equal((await api.POST(new Request('https://adarsh.test/api/contact', { method: 'POST', body: contactForm() }))).status, 200);
  } finally {
    process.env.TOKEN_SECRET = saved;
  }
});

test('fully configured deployment reports both features ready', async () => {
  const api = await import('../api/index.js?full');
  const health = await (await api.GET(new Request('https://adarsh.test/api/health'))).json();
  assert.deepEqual([health.contact, health.resume, health.missing], [true, true, []]);
});

// ── Public site URL used in email links ─────────────────────────────────────
const withEnv = async (changes, fn) => {
  const saved = {};
  for (const k of Object.keys(changes)) saved[k] = process.env[k];
  for (const [k, v] of Object.entries(changes)) (v === undefined ? delete process.env[k] : (process.env[k] = v));
  try {
    return await fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) (v === undefined ? delete process.env[k] : (process.env[k] = v));
  }
};
const SECRET_VALUES = ['s'.repeat(48), 'vercel-passcode-123', 're_test', 'test-token'];

test('production without PUBLIC_SITE_URL falls back to the Vercel production domain in email links', async () =>
  withEnv(
    { PUBLIC_SITE_URL: undefined, VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'adarsh-prod.vercel.app', VERCEL_URL: 'adarsh-git-abc123.vercel.app' },
    async () => {
      const api = await import('../api/index.js?prodfallback');
      const health = await (await api.GET(new Request('https://x.test/api/health'))).json();
      assert.deepEqual([health.contact, health.resume, health.linkSource], [true, true, 'VERCEL_PROJECT_PRODUCTION_URL']);

      const before = sent.length;
      const r = await api.POST(new Request('https://x.test/api/resume/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: resumeBody() }));
      assert.equal(r.status, 201);
      const mails = sent.slice(before).map((m) => `${m.text}\n${m.html}`).join('\n');
      const link = mails.match(/https:\/\/[^\s"'<]+\/api\/resume\/review\?token=[^\s"'<&]+/)[0];
      assert.ok(link.startsWith('https://adarsh-prod.vercel.app/api/resume/review?token='), 'review link uses the production domain');
      assert.ok(!/localhost|127\.0\.0\.1|git-abc123/.test(mails), 'no localhost or preview URL in emails');

      const token = new URL(link).searchParams.get('token');
      const form = new URLSearchParams({ token, passcode: 'vercel-passcode-123', decision: 'approve' });
      const mark = sent.length;
      assert.equal((await api.POST(new Request('https://x.test/api/resume/review', { method: 'POST', body: form }))).status, 200);
      const approved = sent.slice(mark).map((m) => m.text).join('\n');
      assert.match(approved, /https:\/\/adarsh-prod\.vercel\.app\/api\/resume\/download\?token=/);
    }
  ));

test('localhost PUBLIC_SITE_URL is refused in production: resume disabled, contact still works', async () =>
  withEnv({ PUBLIC_SITE_URL: 'http://localhost:5173', VERCEL_PROJECT_PRODUCTION_URL: 'adarsh-prod.vercel.app' }, async () => {
    const api = await import('../api/index.js?localhostsite');
    const health = await (await api.GET(new Request('https://x.test/api/health'))).json();
    assert.deepEqual([health.contact, health.resume], [true, false]);
    assert.ok(health.missing.some((m) => m.includes('PUBLIC_SITE_URL') && m.includes('localhost is not allowed')));
    const before = sent.length;
    const r = await api.POST(new Request('https://x.test/api/resume/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: resumeBody() }));
    assert.equal(r.status, 503);
    assert.equal(sent.length, before, 'no email with a broken link was sent');
    assert.equal((await api.POST(new Request('https://x.test/api/contact', { method: 'POST', body: contactForm() }))).status, 200);
  }));

test('no public URL determinable in production: resume reports PUBLIC_SITE_URL as missing', async () =>
  withEnv({ PUBLIC_SITE_URL: undefined, VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: undefined, VERCEL_URL: undefined }, async () => {
    const api = await import('../api/index.js?nosite');
    const health = await (await api.GET(new Request('https://x.test/api/health'))).json();
    assert.deepEqual([health.contact, health.resume, health.linkSource], [true, false, null]);
    assert.ok(health.missing.some((m) => m.startsWith('PUBLIC_SITE_URL is not set')));
    assert.equal((await api.GET(new Request('https://x.test/api/resume/download?token=x'))).status, 503);
  }));

test('resolveSiteUrl: explicit, preview, development and invalid values', async () => {
  const { resolveSiteUrl } = await import('../server/config.js');
  const prod = { NODE_ENV: 'production' };
  assert.deepEqual(resolveSiteUrl({ ...prod, PUBLIC_SITE_URL: 'https://adarsh.dev/' }), { url: 'https://adarsh.dev', source: 'PUBLIC_SITE_URL', problem: '' });
  assert.equal(resolveSiteUrl({ ...prod, VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_URL: 'p-abc.vercel.app', VERCEL_PROJECT_PRODUCTION_URL: 'prod.vercel.app' }).url, 'https://p-abc.vercel.app');
  assert.equal(resolveSiteUrl({ ...prod, VERCEL: '1', VERCEL_ENV: 'production', VERCEL_URL: 'p-abc.vercel.app' }).url, '', 'production never uses a per-deployment URL');
  assert.equal(resolveSiteUrl({}).url, 'http://localhost:5173', 'development default');
  assert.equal(resolveSiteUrl({ ...prod }).url, '', 'Node production never falls back to localhost');
  for (const bad of ['http://127.0.0.1:8787', 'http://adarsh.dev', 'not a url', 'ftp://adarsh.dev', 'https://localhost']) {
    const r = resolveSiteUrl({ ...prod, PUBLIC_SITE_URL: bad });
    assert.equal(r.url, '', bad);
    assert.ok(r.problem.includes('PUBLIC_SITE_URL'), bad);
  }
  assert.equal(resolveSiteUrl({ ...prod, VERCEL: '1', VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'localhost' }).url, '');
});

test('/api/health never exposes secret values or the email-link address', async () => {
  const api = await import('../api/index.js?healthsecrets');
  const text = await (await api.GET(new Request('https://x.test/api/health'))).text();
  for (const v of [...SECRET_VALUES, 'owner@example.com', UPSTASH, 'adarsh.test']) assert.ok(!text.includes(v), `health leaks ${v}`);
});
