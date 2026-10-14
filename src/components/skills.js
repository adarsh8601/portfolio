import { skills } from '../data/content.js';
import { arrow, divider, dots, icons, plus, squiggle } from '../lib/decor.js';

export function Skills() {
  return `
<section class="section section--skills" id="skills" aria-labelledby="skills-title">
  ${dots('dots--skills')}
  <div class="container">
    ${plus('red', 16, 'skills__plus')}
    <p class="eyebrow">${skills.label}</p>
    <h2 class="h2 h2--underlined" id="skills-title">${skills.title}${squiggle('primary', 'h2__underline')}</h2>
    ${arrow('text-faint', 56, 'skills__arrow', 'M3 6 C 20 12, 40 20, 62 30')}
    <div class="skill-grid">
      ${skills.groups
        .map(
          (g, i) => `
      <article class="card skill-card skill-card--${i + 1}">
        <header class="skill-card__head">
          <span class="icon-dot icon-dot--${g.color}">${icons[g.icon]}</span>
          <h3>${g.name}</h3>
        </header>
        <ul class="pills">${g.items.map((s) => `<li>${s}</li>`).join('')}</ul>
      </article>`
        )
        .join('')}
    </div>
    <span class="skills__dot" aria-hidden="true"></span>
  </div>
</section>
${divider('cyan')}`;
}
