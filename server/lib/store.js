/**
 * Resume-request store: a single JSON file written atomically (temp file + rename),
 * with all writes serialised through a promise queue. Suitable for one Node
 * process with a persistent disk. For serverless hosting, implement the same
 * four methods (create/get/update/purge) over a KV/database — see README.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

export function createFileStore(dir, { retentionDays = 90 } = {}) {
  const file = path.join(dir, 'resume-requests.json');
  let queue = Promise.resolve();
  const serial = (fn) => (queue = queue.then(fn, fn));

  async function read() {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (e) {
      if (e.code === 'ENOENT') return {};
      throw e;
    }
  }
  async function write(data) {
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
    await fs.rename(tmp, file);
  }
  function prune(data, now = Date.now()) {
    const cutoff = now - retentionDays * 864e5;
    for (const [id, r] of Object.entries(data)) if (Date.parse(r.createdAt) < cutoff) delete data[id];
    return data;
  }

  return {
    create: (record) =>
      serial(async () => {
        const data = prune(await read());
        data[record.id] = record;
        await write(data);
        return record;
      }),
    get: async (id) => {
      await queue;
      return (await read())[id] || null;
    },
    /** Applies `fn(record)` atomically; fn may return false to abort. */
    update: (id, fn) =>
      serial(async () => {
        const data = await read();
        const rec = data[id];
        if (!rec) return null;
        const next = { ...rec };
        if (fn(next) === false) return rec;
        data[id] = next;
        await write(data);
        return next;
      }),
    remove: (id) =>
      serial(async () => {
        const data = await read();
        delete data[id];
        await write(data);
      }),
  };
}

export function createMemoryStore() {
  const data = {};
  return {
    create: async (r) => (data[r.id] = { ...r }),
    get: async (id) => (data[id] ? { ...data[id] } : null),
    update: async (id, fn) => {
      if (!data[id]) return null;
      const next = { ...data[id] };
      if (fn(next) === false) return data[id];
      return (data[id] = next);
    },
    remove: async (id) => void delete data[id],
  };
}
