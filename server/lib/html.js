/** Server-rendered pages (owner review screen, link-status pages) and email bodies. */
import { RESUME_PURPOSES } from '../../shared/validation.js';
import { site } from '../../src/data/content.js';

const OWNER = site.fullName;

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const purposeLabel = (v) => RESUME_PURPOSES.find((p) => p.value === v)?.label || v;

const fmt = (iso) => (iso ? new Date(iso).toUTCString().replace(' GMT', ' UTC') : '—');

/** Same tokens as the portfolio so these pages look like part of the site. */
const STYLE = `
:root{--bg:#0c091c;--surface:#17132a;--inset:#0b0919;--text:#f4f2fb;--muted:#9a96ad;--border:rgba(162,152,205,.22);--primary:#96d43c;--red:#e65f4d;--purple:#8c3fd2;--yellow:#efb43e}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--bg);color:var(--text);
font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;background-image:radial-gradient(rgba(150,140,200,.12) 1.2px,transparent 1.6px);background-size:14px 14px}
.card{position:relative;width:min(560px,100%);background:var(--surface);border:1.5px dashed var(--border);border-radius:24px;padding:40px 32px 32px;box-shadow:0 24px 50px rgba(0,0,0,.55)}
.tape{position:absolute;top:-12px;left:50%;width:72px;height:24px;transform:translateX(-50%) rotate(-3deg);background:var(--purple);
background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.16) 0 6px,transparent 6px 12px);border-radius:2px}
.eyebrow{font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--primary)}
h1{margin:8px 0 12px;font-size:28px;line-height:1.15;letter-spacing:-.02em}p{margin:0 0 12px;color:var(--muted)}
dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 16px;margin:20px 0;padding:16px;background:var(--inset);border-radius:14px;font-size:14px}
dt{color:var(--muted)}dd{margin:0;word-break:break-word}
label{display:block;font-size:14px;font-weight:600;margin:18px 0 6px}
input{width:100%;height:48px;padding:0 14px;border-radius:12px;border:1.5px solid var(--border);background:var(--inset);color:var(--text);font:inherit}
input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px rgba(150,212,60,.25)}
.row{display:flex;gap:12px;margin-top:20px;flex-wrap:wrap}
button,.btn{flex:1;height:50px;border-radius:999px;border:0;font-family:inherit;font-weight:700;font-size:15px;line-height:1;cursor:pointer;display:inline-grid;place-items:center;text-decoration:none;padding:0 22px}
.approve{background:var(--primary);color:#10140a;box-shadow:0 5px 0 rgba(0,0,0,.35)}.reject{background:transparent;color:var(--text);border:1.5px solid rgba(162,152,205,.4)}
.status{display:inline-block;padding:3px 12px;border-radius:999px;font-size:13px;font-weight:700;background:var(--yellow);color:#1a1205}
.status.approved{background:var(--primary);color:#10140a}.status.rejected{background:var(--red);color:#1d0b09}
.err{color:#ff9d8f}`;

export function page(title, body, { tape = true } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${esc(title)}</title><style>${STYLE}</style></head>
<body><main class="card">${tape ? '<span class="tape" aria-hidden="true"></span>' : ''}${body}</main></body></html>`;
}

export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
};

function details(r) {
  return `<dl>
<dt>Request ID</dt><dd>${esc(r.id)}</dd>
<dt>Name</dt><dd>${esc(r.name)}</dd>
<dt>Email</dt><dd>${esc(r.email)}</dd>
<dt>Role</dt><dd>${esc(r.role)}</dd>
<dt>Company</dt><dd>${esc(r.company || '—')}</dd>
<dt>Purpose</dt><dd>${esc(purposeLabel(r.purpose))}</dd>
<dt>Details</dt><dd>${esc(r.purposeDetail || '—')}</dd>
<dt>Submitted</dt><dd>${esc(fmt(r.createdAt))}</dd>
<dt>Status</dt><dd><span class="status ${esc(r.status)}">${esc(r.status)}</span>${r.decidedAt ? ` · ${esc(fmt(r.decidedAt))}` : ''}</dd>
</dl>`;
}

export function reviewPage(r, token, { error = '' } = {}) {
  const decided = r.status !== 'pending';
  return page(
    'Review resume request',
    `<p class="eyebrow">Resume request</p><h1>${decided ? 'Request already decided' : 'Approve or reject this request'}</h1>
${details(r)}
${
  decided
    ? '<p>No further action is needed.</p>'
    : `<form method="post" action="/api/resume/review">
<input type="hidden" name="token" value="${esc(token)}">
<label for="passcode">Admin passcode</label>
<input id="passcode" name="passcode" type="password" autocomplete="current-password" required autofocus>
${error ? `<p class="err" role="alert" style="margin-top:10px">${esc(error)}</p>` : ''}
<div class="row"><button class="approve" name="decision" value="approve">Approve &amp; send link</button>
<button class="reject" name="decision" value="reject">Reject</button></div></form>`
}`
  );
}

export function messagePage(title, text) {
  return page(title, `<p class="eyebrow">${esc(OWNER)} · Portfolio</p><h1>${esc(title)}</h1><p>${esc(text)}</p>`);
}

/* ---------------- Emails ---------------- */
export function ownerRequestEmail(r, reviewUrl, ttlHours) {
  const lines = [
    `New request for your original PDF resume.`,
    ``,
    `Name: ${r.name}`,
    `Email: ${r.email}`,
    `Role: ${r.role}`,
    `Company: ${r.company || '—'}`,
    `Purpose: ${purposeLabel(r.purpose)}`,
    `Details: ${r.purposeDetail || '—'}`,
    `Submitted: ${fmt(r.createdAt)}`,
    `Request ID: ${r.id}`,
    ``,
    `Review (approve / reject) — requires your admin passcode, link valid ${ttlHours} h:`,
    reviewUrl,
  ];
  return {
    subject: `Resume request from ${r.name} (${purposeLabel(r.purpose)})`,
    text: lines.join('\n'),
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.6">${lines
      .slice(0, -1)
      .map((l) => esc(l))
      .join('<br>')}<br><a href="${esc(reviewUrl)}">Open the review page</a></div>`,
  };
}

export function visitorApprovedEmail(r, downloadUrl, ttlHours, maxDownloads) {
  const text = `Hi ${r.name},

Thanks for your interest — your request for ${OWNER}'s resume has been approved.

Download link (valid for ${ttlHours} hours, up to ${maxDownloads} downloads):
${downloadUrl}

Request ID: ${r.id}`;
  return {
    subject: 'Your resume request was approved',
    text,
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.6">Hi ${esc(r.name)},<br><br>Thanks for your interest — your request for ${OWNER}'s resume has been approved.<br><br>
<a href="${esc(downloadUrl)}">Download the resume (PDF)</a><br><small>Valid for ${ttlHours} hours, up to ${maxDownloads} downloads. Request ID: ${esc(r.id)}</small></div>`,
  };
}

export function visitorRejectedEmail(r) {
  const text = `Hi ${r.name},

Thank you for your interest in ${OWNER}'s resume. Unfortunately the request couldn't be approved at this time.
You're welcome to get in touch through the contact form on the portfolio.

Request ID: ${r.id}`;
  return { subject: 'Update on your resume request', text, html: `<div style="font-family:system-ui,sans-serif;line-height:1.6">${esc(text).replace(/\n/g, '<br>')}</div>` };
}

export function contactEmail(v, hasFile) {
  const text = `New message from the portfolio contact form.

Name: ${v.name}
Email: ${v.email}
Subject: ${v.subject}
Attachment: ${hasFile ? 'yes (attached)' : 'none'}

${v.message}`;
  return {
    subject: `[Portfolio] ${v.subject}`,
    text,
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.6">${esc(text).replace(/\n/g, '<br>')}</div>`,
  };
}
