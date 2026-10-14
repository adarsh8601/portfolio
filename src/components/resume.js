import { about, education, projects, resume, site, skills } from '../data/content.js';
import { LIMITS, RESUME_PURPOSES, validateResumeRequest } from '../../shared/validation.js';
import { dots, icons, sparkle, squiggle, tape } from '../lib/decor.js';
import { counters, errorMessage, liveValidate, send, setBusy, setStatus, showErrors } from '../lib/forms.js';

const printIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="7" rx="1"/><path d="M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/></svg>`;
const lockIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;

const pinIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`;
const linkLabel = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

export function ResumePage() {
  return `
<section class="section resume-intro" aria-labelledby="resume-title">
  <span class="hero__glow" aria-hidden="true"></span>
  ${dots('dots--resume')}
  <div class="container">
    ${sparkle('yellow', 18, 'resume-intro__spark')}
    <p class="eyebrow">${resume.title}</p>
    <h1 class="h2 h2--underlined resume-intro__title" id="resume-title">${site.fullName}${squiggle('primary', 'h2__underline')}</h1>
    <p class="resume-intro__lead">${resume.intro}</p>

    <div class="resume-options">
      <article class="card option-card option-card--a">
        ${tape('green', 'tape--card tape--left')}
        <span class="option-card__tag">Option A</span>
        <span class="icon-dot icon-dot--lg icon-dot--green">${icons.chart}</span>
        <h2>Online resume</h2>
        <p>Formatted for reading on screen. Print it or save it as a PDF straight from your browser.</p>
        <div class="btn-row">
          <a class="btn btn--primary btn--sm" href="#online-resume"><span>View Resume</span>${icons.chevronDown}</a>
          <button class="btn btn--ghost btn--sm" type="button" data-print>${printIcon}<span>Print / Save as PDF</span></button>
        </div>
      </article>

      <article class="card option-card option-card--b">
        ${tape('purple', 'tape--card tape--right')}
        <span class="option-card__tag">Option B</span>
        <span class="icon-dot icon-dot--lg icon-dot--purple">${lockIcon}</span>
        <h2>${resume.pdf.label}</h2>
        <p>${resume.pdf.blurb}</p>
        <div class="btn-row">
          <button class="btn btn--primary btn--sm" type="button" data-open-request>${lockIcon}<span>Request PDF</span></button>
        </div>
        <p class="option-card__note">Approval required · private link · expires automatically</p>
      </article>
    </div>
  </div>
</section>

${OnlineResume()}
${RequestDialog()}`;
}

function OnlineResume() {
  const section = (title, body) => (body ? `<section class="rd-section"><h3>${title}</h3>${body}</section>` : '');
  const exp = resume.experience.length
    ? resume.experience
        .map(
          (e) => `<div class="rd-item"><div class="rd-item__head"><strong>${e.role}</strong><span>${e.dates}</span></div>
          <p class="rd-meta">${e.org}${e.place ? ` · ${e.place}` : ''}</p>${e.points?.length ? `<ul>${e.points.map((p) => `<li>${p}</li>`).join('')}</ul>` : ''}</div>`
        )
        .join('')
    : '';
  return `
<section class="section resume-doc-wrap" id="online-resume" aria-label="Online resume">
  <div class="container">
    <article class="resume-doc">
      ${tape('yellow', 'tape--doc-left')}
      ${tape('cyan', 'tape--doc-right')}
      <header class="rd-header">
        <div>
          <h2 class="rd-name">${site.fullName}</h2>
          <p class="rd-headline">${site.headline}</p>
          ${site.availability ? `<p class="rd-availability">${site.availability}</p>` : ''}
        </div>
        <ul class="rd-links">
          ${site.location ? `<li>${pinIcon}<span>${site.location}</span></li>` : ''}
          <li>${icons.mail}<a href="mailto:${site.links.email}">${site.links.email}</a></li>
          <li>${icons.linkedin}<a href="${site.links.linkedin}" target="_blank" rel="noopener">${linkLabel(site.links.linkedin)}</a></li>
          <li>${icons.github}<a href="${site.links.github}" target="_blank" rel="noopener">${linkLabel(site.links.github)}</a></li>
        </ul>
      </header>

      ${section('Summary', `<p>${resume.summary || about.body}</p>`)}
      ${section('Experience', exp)}
      ${section(
        'Education',
        education.items
          .map(
            (e) => `<div class="rd-item"><div class="rd-item__head"><strong>${e.degree}</strong><span>${e.dates}</span></div>
            <p class="rd-meta">${e.school} · ${e.place}</p></div>`
          )
          .join('')
      )}
      ${section(
        'Technical skills',
        `<dl class="rd-skills">${skills.groups.map((g) => `<dt>${g.name}</dt><dd>${g.items.join(', ')}</dd>`).join('')}</dl>`
      )}
      ${section(
        'Projects',
        projects.items
          .map(
            (p) => `<div class="rd-item"><div class="rd-item__head"><strong><a href="${p.href}" target="_blank" rel="noopener">${p.title}</a></strong><span>${p.date || p.tag}</span></div>
            ${p.stack ? `<p class="rd-meta">${p.stack}</p>` : ''}${p.summary ? `<p class="rd-desc">${p.summary}</p>` : ''}</div>`
          )
          .join('')
      )}
      ${section(
        'Certifications',
        `<ul class="rd-list">${education.certs.map((c) => `<li><strong>${c.name}</strong> — ${c.meta}</li>`).join('')}</ul>`
      )}
      ${section('Achievements', resume.achievements?.length ? `<ul class="rd-list">${resume.achievements.map((a) => `<li>${a}</li>`).join('')}</ul>` : '')}
      <p class="rd-footnote">Web version of the resume, generated from the information on this site. The original PDF is available on request.</p>
    </article>
    <div class="btn-row btn-row--center resume-doc__actions">
      <button class="btn btn--primary" type="button" data-print>${printIcon}<span>Print / Save as PDF</span></button>
      <button class="btn btn--ghost" type="button" data-open-request>${lockIcon}<span>Request original PDF</span></button>
    </div>
  </div>
</section>`;
}

const rf = (name, label, control, { hint = '', count } = {}) => `
<div class="field" data-field="${name}">
  <div class="field__top"><label for="rr-${name}">${label}</label>${count ? `<span class="field__count" data-count="${name}" data-max="${count}" aria-hidden="true"></span>` : ''}</div>
  ${control}
  ${hint ? `<p class="field__hint" id="rr-${name}-hint">${hint}</p>` : ''}
  <p class="field__error" id="rr-${name}-err" aria-live="polite"></p>
</div>`;
const d = (name, hint) => `aria-describedby="${hint ? `rr-${name}-hint ` : ''}rr-${name}-err"`;

function RequestDialog() {
  return `
<dialog class="modal" id="pdf-request" aria-labelledby="rr-title" aria-describedby="rr-desc">
  <div class="modal__panel">
    ${tape('purple', 'tape--modal')}
    <button class="modal__close" type="button" data-close aria-label="Close">×</button>
    <div class="modal__body" data-view="form">
      <p class="eyebrow">Original PDF</p>
      <h2 class="modal__title" id="rr-title">Request my resume</h2>
      <p class="modal__desc" id="rr-desc">I review every request personally. If approved, you'll receive a private download link by email that expires after ${'{ttl}'}.</p>
      <form class="request-form" novalidate>
        <div class="form-grid">
          ${rf('name', 'Full name', `<input id="rr-name" name="name" type="text" autocomplete="name" placeholder="Your full name" required maxlength="${LIMITS.name.max}" ${d('name')} />`)}
          ${rf('email', 'Professional email', `<input id="rr-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="you@company.com" required maxlength="${LIMITS.email.max}" ${d('email')} />`)}
          ${rf('role', 'Current role or job title', `<input id="rr-role" name="role" type="text" autocomplete="organization-title" placeholder="e.g. Technical Recruiter" required maxlength="${LIMITS.role.max}" ${d('role')} />`)}
          ${rf('company', 'Company or organization <span class="optional">(optional)</span>', `<input id="rr-company" name="company" type="text" autocomplete="organization" placeholder="e.g. Acme Analytics" maxlength="${LIMITS.company.max}" ${d('company')} />`)}
          ${rf('purpose', 'Purpose', `<select id="rr-purpose" name="purpose" required ${d('purpose')}><option value="">Select a purpose…</option>${RESUME_PURPOSES.map((p) => `<option value="${p.value}">${p.label}</option>`).join('')}</select>`)}
          ${rf('purposeDetail', 'Tell me more <span class="optional" data-detail-optional>(optional)</span>', `<textarea id="rr-purposeDetail" name="purposeDetail" rows="3" placeholder="The role, project or context you're considering me for" maxlength="${LIMITS.purposeDetail.max}" ${d('purposeDetail')}></textarea>`, { count: LIMITS.purposeDetail.max })}
          <div class="field field--check" data-field="consent">
            <label class="check"><input type="checkbox" name="consent" required aria-describedby="rr-consent-err" />
              <span>I agree that ${site.firstName} may use the details above to review this request and email me about it. They aren't shared with anyone else and are deleted after 90 days.</span></label>
            <p class="field__error" id="rr-consent-err" aria-live="polite"></p>
          </div>
        </div>
        <div class="hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off" /></label></div>
        <div class="form-status" role="status" aria-live="polite" tabindex="-1" hidden></div>
        <div class="modal__actions">
          <button class="btn btn--ghost btn--sm" type="button" data-close>Cancel</button>
          <button class="btn btn--primary btn--sm" type="submit">${lockIcon}<span class="btn__label">Submit request</span></button>
        </div>
      </form>
    </div>
    <div class="modal__body modal__done" data-view="done" hidden tabindex="-1">
      ${sparkle('primary', 28, 'modal__spark')}
      <p class="eyebrow">Request received</p>
      <h2 class="modal__title">Thanks — your request is awaiting review</h2>
      <p class="modal__desc">You'll get an email at <strong data-done-email></strong> once I've reviewed it. Pending requests never receive the file automatically.</p>
      <p class="modal__ref">Reference: <code data-done-id></code></p>
      <div class="modal__actions"><button class="btn btn--primary btn--sm" type="button" data-close>Done</button></div>
    </div>
  </div>
</dialog>`;
}

export function initResumePage(root, { downloadTtlHours = 48 } = {}) {
  root.querySelectorAll('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));

  const dialog = root.querySelector('#pdf-request');
  const form = dialog.querySelector('.request-form');
  const status = form.querySelector('.form-status');
  const button = form.querySelector('[type="submit"]');
  const views = { form: dialog.querySelector('[data-view="form"]'), done: dialog.querySelector('[data-view="done"]') };
  const desc = dialog.querySelector('#rr-desc');
  desc.textContent = desc.textContent.replace('{ttl}', `${downloadTtlHours} hours`);
  let opener = null;
  let startedAt = Date.now();

  const collect = () => ({
    name: form.elements.name.value,
    email: form.elements.email.value,
    role: form.elements.role.value,
    company: form.elements.company.value,
    purpose: form.elements.purpose.value,
    purposeDetail: form.elements.purposeDetail.value,
    consent: form.elements.consent.checked,
  });

  const open = (e) => {
    opener = e.currentTarget;
    views.form.hidden = false;
    views.done.hidden = true;
    setStatus(status, 'info', '');
    startedAt = Date.now();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    document.documentElement.classList.add('modal-open');
    form.elements.name.focus();
  };
  const close = () => {
    if (dialog.open) dialog.close();
  };
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('modal-open');
    opener?.focus();
  });
  root.querySelectorAll('[data-open-request]').forEach((b) => b.addEventListener('click', open));
  dialog.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
  dialog.addEventListener('click', (e) => e.target === dialog && close()); // backdrop

  const optional = form.querySelector('[data-detail-optional]');
  form.elements.purpose.addEventListener('change', () => {
    const other = form.elements.purpose.value === 'other';
    optional.textContent = other ? '(required)' : '(optional)';
    form.elements.purposeDetail.required = other;
  });

  counters(form);
  liveValidate(form, validateResumeRequest, collect);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(status, 'info', '');
    const values = collect();
    const { errors, ok } = validateResumeRequest(values);
    if (!showErrors(form, errors) || !ok) return;

    setBusy(button, true, 'Submitting…');
    const res = await send('/api/resume/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, website: form.elements.website.value, startedAt }),
    });
    setBusy(button, false, 'Submit request');

    if (res.ok) {
      views.done.querySelector('[data-done-email]').textContent = values.email;
      views.done.querySelector('[data-done-id]').textContent = res.data.id || '—';
      form.reset();
      form.elements.purpose.dispatchEvent(new Event('change'));
      form.querySelectorAll('textarea').forEach((t) => t.dispatchEvent(new Event('input')));
      views.form.hidden = true;
      views.done.hidden = false;
      views.done.focus();
      return;
    }
    if (res.data.fields) showErrors(form, res.data.fields);
    setStatus(status, 'error', `<strong>Request not sent.</strong> ${errorMessage(res)}`);
    status.focus();
  });
}
