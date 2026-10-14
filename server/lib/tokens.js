/**
 * Compact signed tokens: base64url(JSON payload) + "." + base64url(HMAC-SHA256).
 * Each token carries a purpose ("review" | "download"), a request id and an
 * expiry. A token minted for one purpose is rejected for any other.
 */
import crypto from 'node:crypto';

const b64 = (buf) => Buffer.from(buf).toString('base64url');

export function signToken(secret, { purpose, rid, ttlMs, now = Date.now() }) {
  if (!secret) throw new Error('Token secret missing');
  const payload = { p: purpose, rid, exp: now + ttlMs, n: crypto.randomBytes(6).toString('base64url') };
  const body = b64(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

/** @returns {{ok:true, rid:string, exp:number} | {ok:false, reason:'malformed'|'signature'|'purpose'|'expired'}} */
export function verifyToken(secret, token, purpose, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 600 || !/^[\w-]+\.[\w-]+$/.test(token)) {
    return { ok: false, reason: 'malformed' };
  }
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(body).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return { ok: false, reason: 'signature' };
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (payload.p !== purpose) return { ok: false, reason: 'purpose' };
  if (typeof payload.exp !== 'number' || payload.exp < now) return { ok: false, reason: 'expired' };
  return { ok: true, rid: String(payload.rid), exp: payload.exp };
}

/** Constant-time comparison of two strings of possibly different length. */
export function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb) && String(a).length === String(b).length;
}
