import { site } from '../data/content.js';
import { icons, sparkle, squiggle } from '../lib/decor.js';

/**
 * @param {{page?: 'home' | 'resume'}} opts
 * On the home page section links are in-page anchors; on other pages they
 * point back to the home page sections.
 */
export function Header({ page = 'home' } = {}) {
  const onHome = page === 'home';
  const href = (l) => l.href || (onHome ? `#${l.id}` : `/#${l.id}`);
  const isActive = (l, i) => (onHome ? i === 0 && !l.href : l.id === page);
  return `
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header" id="top">
  <div class="container site-header__inner">
    <a class="logo" href="${onHome ? '#home' : '/'}" aria-label="${site.fullName} — home">${site.logo}<span class="logo__dot">.</span></a>
    ${sparkle('yellow', 9, 'site-header__spark')}
    <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="site-nav">${icons.menu}</button>
    <nav class="nav" id="site-nav" aria-label="Primary">
      <ul>
        ${site.nav
          .map((l, i) => {
            const active = isActive(l, i);
            return `<li><a href="${href(l)}" ${l.href ? '' : `data-nav="${l.id}"`} class="${active ? 'is-active' : ''}"${active && !onHome ? ' aria-current="page"' : ''}>${l.label}${squiggle('primary', 'nav__underline')}</a></li>`;
          })
          .join('')}
      </ul>
    </nav>
  </div>
</header>`;
}

/** Mobile toggle + (home only) scroll-spy for the active indicator. */
export function initHeader(root, { spy = true } = {}) {
  // Glass navbar gets a little more solid once the page is scrolled.
  const header = root.querySelector('.site-header');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggle = root.querySelector('.nav-toggle');
  const nav = root.querySelector('.nav');
  const close = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', (e) => e.target.closest('a') && close());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      close();
      toggle.focus();
    }
  });

  if (!spy) return;
  const links = [...root.querySelectorAll('[data-nav]')];
  const setActive = (id) => links.forEach((l) => l.classList.toggle('is-active', l.dataset.nav === id));
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
    { rootMargin: '-45% 0px -50% 0px' }
  );
  links.forEach((l) => {
    const s = document.getElementById(l.dataset.nav);
    if (s) io.observe(s);
  });
}
