// Small reusable decorative SVG pieces (stars, tape, squiggles, arrows, icons).

const C = (name) => `var(--color-${name})`;

export const tape = (color = 'yellow', cls = '') =>
  `<span class="tape tape--${color} ${cls}" aria-hidden="true"></span>`;

/** Four-point sparkle star */
export const sparkle = (color = 'yellow', size = 20, cls = '') => `
<svg class="deco ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="${C(color)}"/>
</svg>`;

/** Outline sparkle (used for the small green one bottom-right of hero) */
export const sparkleOutline = (color = 'primary', size = 22, cls = '') => `
<svg class="deco ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M10 2 C11 8 13 10 19 11 C13 12 11 14 10 20 C9 14 7 12 1 11 C7 10 9 8 10 2Z" fill="none" stroke="${C(color)}" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M19 15 l0.8 2.2 2.2 0.8 -2.2 0.8 -0.8 2.2 -0.8 -2.2 -2.2 -0.8 2.2 -0.8z" fill="${C(color)}"/>
</svg>`;

export const plus = (color = 'red', size = 16, cls = '') => `
<svg class="deco ${cls}" width="${size}" height="${size}" viewBox="0 0 16 16" aria-hidden="true">
  <path d="M8 1v14M1 8h14" stroke="${C(color)}" stroke-width="2" stroke-linecap="round"/>
</svg>`;

export const star5 = (color = 'yellow', size = 26, cls = '') => `
<svg class="deco ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 2.2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="${C(color)}" stroke="${C(color)}" stroke-width="1.5" stroke-linejoin="round"/>
</svg>`;

/** Spiky burst sticker with text */
export const burst = (color = 'red', text = '', size = 56, cls = '') => {
  const pts = [];
  const n = 14;
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? 34 : 50;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  return `
<svg class="deco burst ${cls}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
  <polygon points="${pts.join(' ')}" fill="${C(color)}"/>
  <text x="50" y="57" text-anchor="middle" font-family="var(--font-display)" font-weight="800" font-size="22" fill="#1a0f12">${text}</text>
</svg>`;
};

/** Hand-drawn squiggle underline; stretches to width */
export const squiggle = (color = 'primary', cls = '') => `
<svg class="squiggle ${cls}" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true">
  <path d="M2 8 C 40 3, 70 3, 110 6 S 190 10, 230 6 S 285 3, 298 5" fill="none" stroke="${C(color)}" stroke-width="3.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
</svg>`;

/** Short wave (the small purple ~ under the greeting pill, and grey ones under About photo) */
export const wave = (color = 'purple', w = 46, cls = '') => `
<svg class="deco ${cls}" width="${w}" height="10" viewBox="0 0 46 10" aria-hidden="true">
  <path d="M1 7 Q 6 1, 11.5 7 T 23 7 T 34.5 7 T 46 7" fill="none" stroke="${C(color)}" stroke-width="2" stroke-linecap="round"/>
</svg>`;

/** Dashed hand-drawn arrow */
export const arrow = (color = 'text-muted', w = 70, cls = '', d = 'M3 8 C 25 12, 45 22, 64 34') => `
<svg class="deco ${cls}" width="${w}" height="${Math.round(w * 0.6)}" viewBox="0 0 70 42" aria-hidden="true">
  <path d="${d}" fill="none" stroke="${C(color)}" stroke-width="1.6" stroke-dasharray="3 4" stroke-linecap="round"/>
  <path d="M56 35 L65 35 L61 27" fill="none" stroke="${C(color)}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** Wavy dotted section divider */
export const divider = (color = 'purple') => `
<div class="divider container" aria-hidden="true">
  <svg viewBox="0 0 1300 14" preserveAspectRatio="none">
    <path d="M0 7 ${Array.from({ length: 26 }, (_, i) => `Q ${i * 50 + 25} ${i % 2 ? 12 : 2}, ${i * 50 + 50} 7`).join(' ')}"
      fill="none" stroke="${C(color)}" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity="0.75"/>
  </svg>
</div>`;

export const dots = (cls = '') => `<span class="dots ${cls}" aria-hidden="true"></span>`;

/* ---------- Line icons (24px, stroke = currentColor) ---------- */
const ic = (paths, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const icons = {
  code: ic('<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/>'),
  flask: ic('<path d="M9 3h6M10 3v6L5 19a1.5 1.5 0 0 0 1.3 2h11.4A1.5 1.5 0 0 0 19 19l-5-10V3"/><path d="M7.5 15h9"/>'),
  brain: ic('<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>'),
  chat: ic('<path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8 10h8M8 13h5"/>'),
  sigma: ic('<path d="M17 5H7l6 7-6 7h10"/>'),
  chart: ic('<path d="M4 4v16h16"/><path d="M8 15l3-4 3 2 4-6"/>'),
  cloud: ic('<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9z"/>'),
  nodes: ic('<circle cx="12" cy="5" r="2.2"/><circle cx="5.5" cy="18" r="2.2"/><circle cx="18.5" cy="18" r="2.2"/><path d="M11 7l-4.5 9M13 7l4.5 9M7.7 18h8.6"/>'),
  cap: ic('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/>'),
  award: ic('<circle cx="12" cy="9" r="5"/><path d="M9 13.5L8 21l4-2 4 2-1-7.5"/>'),
  folder: ic('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', 16),
  mail: ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', 16),
  github: ic('<path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-1-2.5c3 0 6-1.5 6-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6.2 0C6.6 2.3 5.6 2.6 5.6 2.6a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.2 9c0 4.5 3 6 6 6a3 3 0 0 0-1 2.5V21"/>', 16),
  linkedin: ic('<path d="M6 9v10M6 5.5v.01M10 19v-6a3 3 0 0 1 6 0v6M10 9v10"/>', 16),
  arrowUpRight: ic('<path d="M7 17L17 7M8 7h9v9"/>', 13),
  chevronDown: ic('<path d="M6 9l6 6 6-6"/>', 14),
  arrowRight: ic('<path d="M5 12h14M13 6l6 6-6 6"/>', 15),
  user: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', 16),
  globe: ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', 15),
  sparkleSmall: ic('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/>', 14),
  pause: ic('<path d="M9 6v12M15 6v12"/>', 16),
  play: ic('<path d="M8 5l11 7-11 7z"/>', 16),
  menu: ic('<path d="M4 7h16M4 12h16M4 17h16"/>', 22),
};
