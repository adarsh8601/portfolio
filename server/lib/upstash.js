/**
 * Minimal Upstash Redis REST client + store/PDF helpers for serverless hosting.
 * Docs: POST <url> with a JSON array command, Authorization: Bearer <token>.
 */
export function upstashClient({ url, token }) {
  if (!url || !token) throw new Error('Upstash URL/token missing');
  return async function cmd(...args) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args.map(String)),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) throw new Error(`Upstash ${args[0]} failed: ${data.error || res.status}`);
    return data.result;
  };
}

const KEY = (id) => `resume-request:${id}`;
export const RESUME_PDF_KEY = 'resume-pdf:base64';

/** Same interface as createFileStore (create/get/update/remove). Records expire after retentionDays. */
export function createUpstashStore(cmd, { retentionDays = 90 } = {}) {
  const ttl = Math.max(1, Math.round(retentionDays * 86400));
  const put = (rec) => cmd('SET', KEY(rec.id), JSON.stringify(rec), 'EX', ttl);
  const read = async (id) => {
    const raw = await cmd('GET', KEY(id));
    return raw ? JSON.parse(raw) : null;
  };
  return {
    create: async (rec) => (await put(rec), rec),
    get: read,
    update: async (id, fn) => {
      const rec = await read(id);
      if (!rec) return null;
      const next = { ...rec };
      if (fn(next) === false) return rec;
      await cmd('SET', KEY(id), JSON.stringify(next), 'KEEPTTL');
      return next;
    },
    remove: async (id) => void (await cmd('DEL', KEY(id))),
  };
}

/** Loads the private resume PDF that `npm run upload-resume` stored in Upstash. */
export function upstashResumeLoader(cmd) {
  return async () => {
    const b64 = await cmd('GET', RESUME_PDF_KEY);
    if (!b64) throw new Error('resume PDF not uploaded to Upstash');
    return Buffer.from(b64, 'base64');
  };
}
