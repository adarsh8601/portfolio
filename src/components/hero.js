import { site, hero } from '../data/content.js';
import { arrow, burst, dots, icons, sparkle, sparkleOutline, squiggle, star5, tape, wave } from '../lib/decor.js';

export function Hero() {
  // Typewriter name: the invisible "ghost" copy reserves the final size (no layout
  // shift); the visible copy is re-typed by JS. Without JS it simply shows the full name.
  return `
<section class="hero" id="home" aria-label="Introduction">
  <span class="hero__glow" aria-hidden="true"></span>
  ${dots('dots--hero-left')}
  ${dots('dots--hero-right')}
  <div class="container hero__inner">
    <div class="hero__text">
      <p class="hey-pill reveal" style="--d:0ms">${icons.sparkleSmall}<span>${hero.greeting}</span></p>
      ${wave('purple', 46, 'hero__wave')}
      <h1 class="hero__name" aria-label="${site.fullName}">
        <span class="hero__ghost" aria-hidden="true">${site.fullName}</span>
        <span class="hero__typed" aria-hidden="true"><span class="hero__typed-text" data-typewriter="${site.fullName}">${site.fullName}</span><span class="hero__caret"></span></span>
        ${squiggle('primary', 'hero__underline')}
      </h1>
      <p class="hero__subtitle reveal" style="--d:380ms">${site.headline}</p>
      <p class="hero__intro reveal" style="--d:460ms">${hero.intro}</p>
      <div class="btn-row reveal" style="--d:540ms">
        <a class="btn btn--primary" href="${hero.primaryCta.href}">${icons.folder}<span>${hero.primaryCta.label}</span></a>
        <a class="btn btn--ghost" href="${hero.secondaryCta.href}">${hero.secondaryCta.label}</a>
      </div>
    </div>

    <div class="hero__media" data-tilt="hero">
      ${arrow('text-muted', 74, 'hero__arrow', 'M3 6 C 20 8, 40 18, 62 32')}
      ${sparkle('yellow', 22, 'hero__spark-top twinkle')}
      ${star5('yellow', 30, 'hero__star twinkle twinkle--slow')}
      <span class="hero__ring" aria-hidden="true"></span>
      <div class="portrait-float">
        <figure class="frame frame--hero tilt">
          ${tape('red', 'tape--hero')}
          <div class="frame__clip"><img class="parallax" src="${site.portrait}" alt="${site.portraitAlt}" width="440" height="560" fetchpriority="high" /></div>
          <span class="sticker sticker--cyan hero__sticker sway">${hero.sticker}</span>
          ${burst('red', hero.burst, 64, 'hero__burst')}
        </figure>
      </div>
      ${sparkleOutline('primary', 26, 'hero__spark-bottom twinkle')}
    </div>
  </div>
  <a class="scroll-cue" href="#network" aria-label="Scroll to next section">
    <span>Scroll</span>${icons.chevronDown}
  </a>
</section>`;
}
