import { contact, site } from '../data/content.js';
import { ATTACHMENT_ACCEPT, LIMITS, validateContact } from '../../shared/validation.js';
import { dots, icons, sparkle, squiggle, tape } from '../lib/decor.js';
import { counters, errorMessage, liveValidate, send, setBusy, setStatus, showErrors } from '../lib/forms.js';

const field = (name, label, control, { hint = '', count } = {}) => `
<div class="field" data-field="${name}">
  <div class="field__top"><label for="cf-${name}">${label}</label>${count ? `<span class="field__count" data-count="${name}" data-max="${count}" aria-hidden="true"></span>` : ''}</div>
  ${control}
  ${hint ? `<p class="field__hint" id="cf-${name}-hint">${hint}</p>` : ''}
  <p class="field__error" id="cf-${name}-err" aria-live="polite"></p>
</div>`;

const describe = (name, hint) => `aria-describedby="${hint ? `cf-${name}-hint ` : ''}cf-${name}-err"`;

export function Contact() {
  return `
<section class="section section--contact" id="contact" aria-labelledby="contact-title">
  ${dots('dots--contact')}
  <div class="container">
    <div class="contact-panel">
      ${tape('purple', 'tape--contact')}
      ${sparkle('yellow', 26, 'contact__spark-tl')}
      ${sparkle('primary', 30, 'contact__spark-tr')}
      ${sparkle('cyan', 12, 'contact__spark-top')}
      ${sparkle('cyan', 16, 'contact__spark-br')}
      <p class="eyebrow eyebrow--center">${contact.label}</p>
      <h2 class="contact__title" id="contact-title">${contact.title[0]}<br/><span class="u">${contact.title[1]}${squiggle('primary', 'contact__underline')}</span></h2>
      <div class="btn-row btn-row--center">
        <a class="btn btn--primary" href="mailto:${site.links.email}" data-copy-email="${site.links.email}" title="Opens your mail app and copies the address">${icons.mail}<span class="btn__label">${site.links.email}</span></a>
        <a class="btn btn--ghost" href="${site.links.github}" target="_blank" rel="noopener">${icons.github}<span>${contact.secondary.label}</span></a>
      </div>

      <div class="contact-form-wrap">
        <h3 class="contact-form__title">${contact.formTitle}</h3>
        <p class="contact-form__intro">${contact.formIntro}</p>
        <form class="contact-form" novalidate>
          <div class="form-grid">
            ${field('name', 'Full name', `<input id="cf-name" name="name" type="text" autocomplete="name" placeholder="Your full name" required minlength="${LIMITS.name.min}" maxlength="${LIMITS.name.max}" ${describe('name')} />`)}
            ${field('email', 'Email address', `<input id="cf-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="you@company.com" required maxlength="${LIMITS.email.max}" ${describe('email')} />`)}
            ${field('subject', 'Subject or purpose', `<input id="cf-subject" name="subject" type="text" placeholder="e.g. Data analyst opening at Acme" required maxlength="${LIMITS.subject.max}" ${describe('subject')} />`)}
            ${field('message', 'Message', `<textarea id="cf-message" name="message" rows="5" placeholder="A few lines about the role, project or question…" required maxlength="${LIMITS.message.max}" ${describe('message')}></textarea>`, { count: LIMITS.message.max })}
            ${field('attachment', 'Attachment <span class="optional">(optional)</span>', `
              <label class="file-drop" for="cf-attachment">
                <input id="cf-attachment" name="attachment" type="file" accept="${ATTACHMENT_ACCEPT}" ${describe('attachment', true)} />
                <span class="file-drop__icon" aria-hidden="true">${icons.folder}</span>
                <span class="file-drop__text">Choose a file</span>
                <button type="button" class="file-drop__clear" hidden aria-label="Remove attachment">×</button>
              </label>`, { hint: 'PDF, DOC, DOCX, TXT, PNG or JPG · max 4 MB' })}
          </div>
          <div class="hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off" /></label></div>
          <div class="contact-form__actions">
            <button class="btn btn--primary" type="submit">${icons.mail}<span class="btn__label">Send message</span></button>
            <p class="contact-form__note">All fields except the attachment are required.</p>
          </div>
          <div class="form-status" role="status" aria-live="polite" tabindex="-1" hidden></div>
        </form>
      </div>
    </div>
  </div>
</section>`;
}

/** Email buttons: also copy the address, so they still help when no mail app is set up. */
export function initCopyEmail(root) {
  root.querySelectorAll('[data-copy-email]').forEach((a) => {
    const label = a.querySelector('.btn__label');
    a.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(a.dataset.copyEmail);
        if (!label) return;
        label.textContent = 'Email copied ✓';
        setTimeout(() => (label.textContent = a.dataset.copyEmail), 2200);
      } catch {
        /* clipboard unavailable — the mailto link still works */
      }
    });
  });
}

export function initContactForm(root) {
  const form = root.querySelector('.contact-form');
  if (!form) return;
  const status = form.querySelector('.form-status');
  const button = form.querySelector('[type="submit"]');
  const fileInput = form.elements.attachment;
  const fileText = form.querySelector('.file-drop__text');
  const clear = form.querySelector('.file-drop__clear');
  let startedAt = Date.now();

  const collect = () => ({
    name: form.elements.name.value,
    email: form.elements.email.value,
    subject: form.elements.subject.value,
    message: form.elements.message.value,
    attachment: fileInput.files[0] || null,
  });

  counters(form);
  liveValidate(form, validateContact, collect);

  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    fileText.textContent = f ? `${f.name} · ${(f.size / 1024 / 1024).toFixed(2)} MB` : 'Choose a file';
    clear.hidden = !f;
  });
  clear.addEventListener('click', (e) => {
    e.preventDefault();
    fileInput.value = '';
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    fileInput.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(status, 'info', '');
    const { errors, ok } = validateContact(collect());
    if (!showErrors(form, errors) || !ok) return;

    const data = new FormData(form);
    if (!fileInput.files[0]) data.delete('attachment');
    data.set('startedAt', String(startedAt));

    setBusy(button, true, 'Sending…');
    const res = await send('/api/contact', { method: 'POST', body: data });
    setBusy(button, false, 'Send message');

    if (res.ok) {
      form.reset();
      fileInput.dispatchEvent(new Event('change'));
      form.querySelectorAll('textarea').forEach((t) => t.dispatchEvent(new Event('input')));
      startedAt = Date.now();
      setStatus(status, 'success', `<strong>Message sent.</strong> ${contact.success}`);
      status.focus?.();
      return;
    }
    if (res.data.fields) showErrors(form, res.data.fields);
    setStatus(
      status,
      'error',
      `<strong>Not sent.</strong> ${errorMessage(res)} You can also email <a href="mailto:${site.links.email}">${site.links.email}</a>.`
    );
  });
}

export function Footer() {
  return `
<footer class="site-footer">
  <div class="container site-footer__inner">
    <p>© ${site.year} ${site.fullName}. All rights reserved.</p>
    <div class="site-footer__social">
      <a class="icon-btn icon-btn--sm" href="${site.links.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn">${icons.linkedin}</a>
      <a class="icon-btn icon-btn--sm" href="${site.links.github}" target="_blank" rel="noopener" aria-label="GitHub">${icons.github}</a>
      <a class="icon-btn icon-btn--sm" href="/#contact" aria-label="Send me a message" title="Send me a message">${icons.mail}</a>
    </div>
  </div>
</footer>`;
}
