import { education } from '../data/content.js';
import { divider, dots, icons, sparkle, squiggle, tape } from '../lib/decor.js';

export function Education() {
  return `
<section class="section section--education" id="education" aria-labelledby="education-title">
  ${dots('dots--education')}
  <div class="container">
    ${sparkle('primary', 20, 'education__spark')}
    <p class="eyebrow">${education.label}</p>
    <h2 class="h2 h2--underlined" id="education-title">${education.title}${squiggle('purple', 'h2__underline')}</h2>

    <div class="edu-grid">
      ${education.items
        .map(
          (e, i) => `
      <article class="card edu-card edu-card--${i + 1} edu-card--${e.color} reveal-up" style="--stagger:${i * 120}ms">
        <span class="edu-card__glow" aria-hidden="true"></span>
        ${tape(e.tape.color, `tape--card tape--${e.tape.side}`)}
        <span class="icon-dot icon-dot--lg icon-dot--${e.color}">${icons.cap}</span>
        <p class="edu-card__dates">${e.dates}</p>
        <h3 class="edu-card__degree">${e.degree}</h3>
        <p class="edu-card__school">${e.school}</p>
        <p class="edu-card__place">${e.place}</p>
      </article>`
        )
        .join('')}
    </div>

    <h3 class="cert-title reveal-up">${education.certTitle}</h3>
    <ul class="cert-row">
      ${education.certs
        .map((c, i) => {
          const inner = `
          <span class="icon-dot icon-dot--yellow cert__icon">${icons.award}</span>
          <span class="cert__text"><strong>${c.name}</strong><small>${c.meta}</small>
            ${c.url ? `<span class="cert__verify">View credential ${icons.arrowUpRight}</span>` : ''}</span>`;
          return `
      <li class="cert reveal-up" style="--stagger:${i * 110}ms">
        ${c.url ? `<a class="cert__link" href="${c.url}" target="_blank" rel="noopener" aria-label="${c.name} — view credential (opens in a new tab)">${inner}</a>` : `<div class="cert__link">${inner}</div>`}
      </li>`;
        })
        .join('')}
    </ul>
  </div>
</section>
${divider('yellow')}`;
}
