/** Server-side attachment checks: extension allow-list + magic-byte sniffing. */
import { ATTACHMENT_TYPES, LIMITS } from '../../shared/validation.js';

const startsWith = (buf, bytes) => bytes.every((b, i) => buf[i] === b);

const SNIFF = {
  pdf: (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46, 0x2d]), // %PDF-
  png: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  jpg: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  jpeg: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  docx: (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]), // ZIP container
  doc: (b) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), // OLE2
  txt: (b) => {
    // Plain UTF-8 text: no NUL bytes and decodes cleanly.
    if (b.includes(0)) return false;
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(b.subarray(0, 64 * 1024));
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * @param {File} file
 * @returns {Promise<{ok:true, filename:string, contentType:string, content:Buffer} | {ok:false, error:string}>}
 */
export async function inspectAttachment(file) {
  const rawName = String(file.name || 'attachment');
  const parts = rawName.split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
  if (!ATTACHMENT_TYPES[ext]) return { ok: false, error: 'Unsupported file type. Allowed: PDF, DOC, DOCX, TXT, PNG, JPG.' };
  if (file.size > LIMITS.attachmentBytes) return { ok: false, error: 'File is too large (maximum 4 MB).' };
  const content = Buffer.from(await file.arrayBuffer());
  if (content.length === 0) return { ok: false, error: 'The attached file is empty.' };
  if (content.length > LIMITS.attachmentBytes) return { ok: false, error: 'File is too large (maximum 4 MB).' };
  if (!SNIFF[ext](content)) return { ok: false, error: 'The file contents do not match its extension.' };
  // Normalise the name: keep it short and free of path or control characters.
  const base = parts.join('.').replace(/[^\w.\- ]+/g, '_').slice(0, 80) || 'attachment';
  return { ok: true, filename: `${base}.${ext}`, contentType: ATTACHMENT_TYPES[ext], content };
}
