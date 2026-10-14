/** Fixed-window, in-memory rate limiter keyed by e.g. "contact:<ip>". */
export function createRateLimiter() {
  const hits = new Map();
  return {
    /** @returns true when the call is allowed */
    hit(key, limit, windowMs, now = Date.now()) {
      const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
      if (list.length >= limit) {
        hits.set(key, list);
        return false;
      }
      list.push(now);
      hits.set(key, list);
      if (hits.size > 5000) for (const k of hits.keys()) { hits.delete(k); if (hits.size < 4000) break; }
      return true;
    },
  };
}
