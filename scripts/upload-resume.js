// Uploads the private resume PDF to Upstash Redis so the Vercel API can serve it
// to approved requests. The PDF never goes into Git or /public.
//   npm run upload-resume            (reads RESUME_PDF_PATH + UPSTASH_* from .env)
import fs from 'node:fs/promises';
import path from 'node:path';
import { RESUME_PDF_KEY, upstashClient } from '../server/lib/upstash.js';

try {
  process.loadEnvFile?.(path.resolve(import.meta.dirname, '../.env'));
} catch {
  /* rely on real environment */
}

const file = path.resolve(import.meta.dirname, '..', process.env.RESUME_PDF_PATH || 'server/private/resume.pdf');
const url = (process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const token = process.env.UPSTASH_REDIS_REST_TOKEN || '';
if (!url || !token) {
  console.error('Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env first.');
  process.exit(1);
}
const pdf = await fs.readFile(file);
if (pdf.subarray(0, 5).toString() !== '%PDF-') {
  console.error(`${file} is not a PDF.`);
  process.exit(1);
}
const cmd = upstashClient({ url, token });
await cmd('SET', RESUME_PDF_KEY, pdf.toString('base64'));
const check = await cmd('STRLEN', RESUME_PDF_KEY);
console.log(`Uploaded ${path.basename(file)} (${(pdf.length / 1024).toFixed(1)} KB) to Upstash — stored ${check} base64 chars.`);
