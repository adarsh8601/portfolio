import { about, site } from '../data/content.js';
import { dots, icons, sparkle, squiggle, tape, wave } from '../lib/decor.js';

export function About() {
  return `
<section class="section section--about" id="about" aria-labelledby="about-title">
  ${dots('dots--about')}
  <div class="container about">
    <div class="about__media" data-tilt="about">
      ${sparkle('primary', 26, 'about__spark-top twinkle')}
      <div class="portrait-float portrait-float--slow">
        <figure class="frame frame--about tilt">
          ${tape('red', 'tape--about')}
          <div class="frame__clip"><img class="parallax" src="${site.portrait}" alt="${site.portraitAlt}" width="360" height="370" loading="lazy" /></div>
        </figure>
      </div>
      <span class="sticker sticker--red about__sticker">${about.sticker}</span>
      ${sparkle('yellow', 18, 'about__spark-bottom twinkle twinkle--slow')}
      <div class="about__waves">${wave('text-faint', 30)}${wave('text-faint', 30)}${wave('text-faint', 30)}</div>
    </div>

    <div class="about__text">
      <p class="eyebrow">${about.label}</p>
      <h2 class="about__title" id="about-title">${about.title}${squiggle('purple', 'about__underline')}</h2>
      <p class="about__body">${about.body}</p>
      <dl class="stats">
        ${about.stats.map((s) => `<div><dt>${s.value}</dt><dd>${s.label}</dd></div>`).join('')}
      </dl>
      <div class="about__highlight">
        <strong>${about.highlight.value}</strong>
        <span>${about.highlight.label}</span>
      </div>
      <div class="btn-row">
        <a class="btn btn--primary" href="${about.cta.href}">${icons.user}<span>${about.cta.label}</span>${icons.arrowRight}</a>
        <a class="icon-btn" href="${site.links.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn">${icons.linkedin}</a>
        <a class="icon-btn" href="${site.links.github}" target="_blank" rel="noopener" aria-label="GitHub">${icons.github}</a>
        <a class="icon-btn" href="#contact" aria-label="Send me a message" title="Send me a message">${icons.mail}</a>
      </div>
    </div>
  </div>
</section>`;
}
