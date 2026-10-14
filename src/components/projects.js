import { projects, site } from '../data/content.js';
import { burst, divider, dots, icons, sparkle, squiggle, tape } from '../lib/decor.js';

const ctaLabel = (href) =>
  !/github\.com/.test(href) ? 'Visit live website' : /github\.com\/[^/]+\/[^/]+/.test(href) ? 'View on GitHub' : 'GitHub profile';

export function Projects() {
  return `
<section class="section section--projects" id="projects" aria-labelledby="projects-title">
  ${dots('dots--projects')}
  <div class="container">
    <div class="section-head section-head--split">
      <div>
        <p class="eyebrow">${projects.label}</p>
        ${sparkle('cyan', 16, 'projects__spark')}
        <h2 class="h2 h2--underlined" id="projects-title">${projects.title}${squiggle('red', 'h2__underline')}</h2>
      </div>
      <a class="more-link" href="${site.links.github}" target="_blank" rel="noopener">${projects.moreLabel} ${icons.arrowUpRight}</a>
    </div>

    <div class="project-grid">
      ${projects.items
        .map(
          (p, i) => `
      <article class="card project-card project-card--${i + 1}${p.featured ? ' project-card--featured' : ''}">
        ${tape(p.tape.color, `tape--card tape--${p.tape.side}`)}
        ${p.badge ? burst('primary', p.badge, 44, 'project-card__badge') : ''}
        <a class="project-card__link" href="${p.href}"${/^https?:/.test(p.href) ? ' target="_blank" rel="noopener"' : ''} aria-label="${p.title} (opens in a new tab)">
          <div class="project-card__media"><img src="${p.image}" alt="" width="360" height="300" loading="lazy" /></div>
          <div class="project-card__body">
            <span class="tag tag--${p.color}">${p.tag}</span>
            <h3 class="project-card__title">${p.title}</h3>
            ${p.featured && p.summary ? `<p class="project-card__desc">${p.summary}</p>` : ''}
            <span class="project-card__cta">${ctaLabel(p.href)} ${icons.arrowUpRight}</span>
          </div>
        </a>
      </article>`
        )
        .join('')}
    </div>
  </div>
</section>
${divider('red')}`;
}
