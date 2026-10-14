/**
 * Restrained portrait motion:
 *  - pointer tilt + image parallax (desktop, fine pointer only)
 *  - pause the CSS float/twinkle loops while the element is off-screen
 * Everything is skipped when the visitor prefers reduced motion.
 */
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * @param {HTMLElement} area  element that listens for pointer movement
 * @param {{maxTilt?: number, shift?: number}} opts
 */
export function attachTilt(area, { maxTilt = 6, shift = 8 } = {}) {
  if (!area || reduced() || !finePointer()) return;
  const card = area.querySelector('.tilt');
  if (!card) return;
  let raf = 0;
  let target = { x: 0, y: 0 };

  const apply = () => {
    raf = 0;
    card.style.setProperty('--rx', `${(-target.y * maxTilt).toFixed(2)}deg`);
    card.style.setProperty('--ry', `${(target.x * maxTilt).toFixed(2)}deg`);
    card.style.setProperty('--px', `${(-target.x * shift).toFixed(1)}px`);
    card.style.setProperty('--py', `${(-target.y * shift).toFixed(1)}px`);
  };
  const schedule = () => (raf ||= requestAnimationFrame(apply));

  area.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = card.getBoundingClientRect();
    // -1 … 1 relative to the card centre, clamped
    target = {
      x: Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2))),
      y: Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2))),
    };
    card.classList.add('is-tilting');
    schedule();
  });
  area.addEventListener('pointerleave', () => {
    target = { x: 0, y: 0 };
    card.classList.remove('is-tilting');
    schedule();
  });
}

/** Adds .is-paused to elements while they are off-screen (stops CSS loops). */
export function pauseOffscreen(elements) {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) =>
    entries.forEach((e) => e.target.classList.toggle('is-paused', !e.isIntersecting))
  );
  elements.forEach((el) => el && io.observe(el));
}

/**
 * Types the text letter by letter, holds, erases, and types again — on a loop.
 * Pauses while the hero is off-screen or the tab is hidden; disabled for
 * visitors who prefer reduced motion (the full name simply stays visible).
 */
export function typewriter(el, { typeMs = 110, eraseMs = 55, holdMs = 4200, gapMs = 650 } = {}) {
  if (!el) return;
  const text = el.dataset.typewriter || el.textContent;
  const host = el.closest('.hero__name');
  if (reduced()) {
    host?.classList.add('is-static');
    return;
  }
  host?.classList.add('is-typing');
  let i = 0;
  let dir = 1; // 1 typing, -1 erasing
  let timer = 0;
  let paused = false;

  const tick = () => {
    if (paused) return;
    i += dir;
    el.textContent = text.slice(0, i);
    let wait = dir > 0 ? typeMs + (text[i - 1] === ' ' ? 120 : Math.random() * 60) : eraseMs;
    if (dir > 0 && i >= text.length) {
      dir = -1;
      wait = holdMs;
      host?.classList.add('is-done');
    } else if (dir < 0 && i <= 0) {
      dir = 1;
      wait = gapMs;
      host?.classList.remove('is-done');
    } else if (dir < 0 && i === text.length - 1) {
      host?.classList.remove('is-done');
    }
    timer = setTimeout(tick, wait);
  };
  const start = () => {
    clearTimeout(timer);
    paused = false;
    timer = setTimeout(tick, 120);
  };
  const stop = () => {
    paused = true;
    clearTimeout(timer);
  };

  el.textContent = '';
  setTimeout(start, 350);
  if ('IntersectionObserver' in window && host) {
    new IntersectionObserver(([e]) => (e.isIntersecting ? !paused || start() : stop())).observe(host);
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}

/** Fades/slides elements in the first time they scroll into view. */
export function revealOnScroll(elements) {
  const els = [...elements];
  if (reduced() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }),
    { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
  );
  els.forEach((el) => io.observe(el));
}
