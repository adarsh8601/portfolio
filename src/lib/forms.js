/** Small helpers shared by the contact form and the resume-request form. */
import { site } from '../data/content.js';

export const api = (path) => `${site.apiBase}${path}`;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Shows / clears inline errors. `errors` maps field name → message. */
export function showErrors(form, errors, { focus = true } = {}) {
  if (focus) form.dataset.attempted = '1';
  let first = null;
  form.querySelectorAll('[data-field]').forEach((wrap) => {
    const name = wrap.dataset.field;
    const input = form.elements[name];
    const msg = wrap.querySelector('.field__error');
    const err = errors[name];
    wrap.classList.toggle('has-error', Boolean(err));
    if (msg) msg.textContent = err || '';
    if (input && input.setAttribute) input.setAttribute('aria-invalid', err ? 'true' : 'false');
    if (err && !first) first = input;
  });
  if (focus && first?.focus) first.focus();
  return !first;
}

/** Validates a single field on blur / change using the shared rules. */
export function liveValidate(form, validate, collect) {
  const touched = new Set();
  const run = () => {
    const { errors } = validate(collect());
    // Before the first submit only touched fields are checked; afterwards all of them.
    if (form.dataset.attempted) return showErrors(form, errors, { focus: false });
    const subset = {};
    touched.forEach((n) => errors[n] && (subset[n] = errors[n]));
    showErrors(form, subset, { focus: false });
  };
  form.addEventListener('reset', () => {
    touched.clear();
    delete form.dataset.attempted;
    setTimeout(() => showErrors(form, {}, { focus: false }));
  });
  form.addEventListener('focusout', (e) => {
    const name = e.target.name;
    if (!name || !e.target.value) return;
    touched.add(name);
    run();
  });
  form.addEventListener('change', (e) => {
    if (!e.target.name) return;
    touched.add(e.target.name);
    run();
  });
  form.addEventListener('input', (e) => touched.has(e.target.name) && run());
}

/** Character counters for elements with data-count="fieldName" + data-max. */
export function counters(form) {
  form.querySelectorAll('[data-count]').forEach((el) => {
    const input = form.elements[el.dataset.count];
    const max = Number(el.dataset.max);
    const update = () => {
      el.textContent = `${input.value.length} / ${max}`;
      el.classList.toggle('is-over', input.value.length > max);
    };
    input.addEventListener('input', update);
    update();
  });
}

export function setStatus(el, type, html) {
  el.className = `form-status form-status--${type}`;
  el.innerHTML = html;
  el.hidden = !html;
}

export function setBusy(button, busy, label) {
  button.disabled = busy;
  button.setAttribute('aria-busy', String(busy));
  button.querySelector('.btn__label').textContent = label;
}

/** Sends a request and normalises network / server errors into {ok, status, data}. */
export async function send(path, init) {
  try {
    const res = await fetch(api(path), { ...init, headers: { Accept: 'application/json', ...(init.headers || {}) } });
    let data = {};
    try {
      data = await res.json();
    } catch {
      /* non-JSON (e.g. no API deployed) */
    }
    return { ok: res.ok && data.ok !== false, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

export function errorMessage({ status, data }) {
  if (status === 0) return 'Could not reach the server. Check your connection and try again.';
  if (status === 404 || status === 405) return 'The message service is not available right now.';
  return escapeHtml(data.error || 'Something went wrong. Please try again.');
}
