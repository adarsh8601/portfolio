import { network } from '../data/content.js';
import { arrow, divider, dots, icons, plus, sparkle, tape } from '../lib/decor.js';

export function Network() {
  return `
<section class="section section--network" id="network" aria-labelledby="network-title">
  ${dots('dots--network')}
  <div class="container">
    ${plus('yellow', 12, 'network__plus')}
    <p class="eyebrow">${network.label}</p>
    <h2 class="h2" id="network-title">${network.title.join(' <br/>')}</h2>
    <div class="nn-panel">
      ${tape('yellow', 'tape--nn-left')}
      ${tape('cyan', 'tape--nn-right')}
      <div class="nn-panel__inner">
        <canvas class="nn-canvas" aria-label="Interactive neural network visualization" role="img"></canvas>
        ${arrow('text-muted', 56, 'nn-panel__arrow', 'M3 10 C 22 14, 36 22, 60 30')}
        <button class="nn-toggle" type="button" aria-label="Pause animation" aria-pressed="false">${icons.pause}</button>
      </div>
      ${sparkle('yellow', 26, 'nn-panel__spark')}
    </div>
    <p class="caption">${network.caption}</p>
  </div>
</section>
${divider('purple')}`;
}

/* ---------------- Lightweight pseudo-3D canvas renderer ---------------- */
export function initNetwork(root) {
  const canvas = root.querySelector('.nn-canvas');
  const toggle = root.querySelector('.nn-toggle');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const col = (n) => css.getPropertyValue(`--color-${n}`).trim();
  const palette = [col('red'), col('yellow'), col('yellow'), col('primary'), col('cyan')];

  // Seeded RNG so the layout is stable between reloads.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const layers = [3, 7, 8, 6, 4];
  const nodes = [];
  layers.forEach((count, li) => {
    for (let i = 0; i < count; i++) {
      nodes.push({
        layer: li,
        x: (li - (layers.length - 1) / 2) * 0.62 + (rnd() - 0.5) * 0.25,
        y: (i - (count - 1) / 2) * (1.9 / Math.max(count, 4)) + (rnd() - 0.5) * 0.25,
        z: (rnd() - 0.5) * 1.5,
        r: li === 0 ? 7 : 5 + rnd() * 1.5,
        color: palette[li],
      });
    }
  });
  // Small "satellite" particles
  const sats = Array.from({ length: 34 }, () => ({
    x: (rnd() - 0.5) * 2.4, y: (rnd() - 0.5) * 2.0, z: (rnd() - 0.5) * 1.6,
    color: palette[Math.floor(rnd() * palette.length)],
  }));
  const edges = [];
  nodes.forEach((a, ai) => nodes.forEach((b, bi) => {
    if (b.layer === a.layer + 1 && rnd() < 0.62) edges.push([ai, bi]);
  }));

  let rotY = -0.55, rotX = 0.18, playing = true, dragging = false, lastX = 0, lastY = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) playing = false;
  setToggle();

  let w = 0, h = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function project(p) {
    const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
    let x = p.x * cy - p.z * sy, z = p.x * sy + p.z * cy;
    let y = p.y * cx - z * sx; z = p.y * sx + z * cx;
    const scale = Math.min(w * 0.36, h * 0.5);
    const persp = 3.2 / (3.2 + z);
    return { x: w / 2 + x * scale * persp, y: h / 2 + y * scale * persp, s: persp, z };
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const P = nodes.map(project);
    ctx.lineWidth = 0.8;
    edges.forEach(([a, b]) => {
      const g = ctx.createLinearGradient(P[a].x, P[a].y, P[b].x, P[b].y);
      g.addColorStop(0, hexA(nodes[a].color, 0.32));
      g.addColorStop(1, hexA(nodes[b].color, 0.32));
      ctx.strokeStyle = g;
      ctx.beginPath(); ctx.moveTo(P[a].x, P[a].y); ctx.lineTo(P[b].x, P[b].y); ctx.stroke();
    });
    sats.forEach((s) => {
      const p = project(s);
      ctx.fillStyle = hexA(s.color, 0.7);
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.6 * p.s, 0, Math.PI * 2); ctx.fill();
    });
    nodes.map((n, i) => ({ n, p: P[i] })).sort((a, b) => b.p.z - a.p.z).forEach(({ n, p }) => {
      ctx.shadowColor = n.color; ctx.shadowBlur = 12;
      ctx.fillStyle = n.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, n.r * p.s, 0, Math.PI * 2); ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  function hexA(hex, a) {
    const v = hex.replace('#', '');
    const n = parseInt(v.length === 3 ? v.split('').map((c) => c + c).join('') : v, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  function loop() {
    if (playing && visible && !dragging) { rotY += 0.0028; draw(); }
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    rotY += (e.clientX - lastX) * 0.008;
    rotX = Math.max(-1, Math.min(1, rotX + (e.clientY - lastY) * 0.006));
    lastX = e.clientX; lastY = e.clientY; draw();
  });
  ['pointerup', 'pointercancel'].forEach((t) => canvas.addEventListener(t, () => { dragging = false; }));

  function setToggle() {
    if (!toggle) return;
    toggle.innerHTML = playing ? icons.pause : icons.play;
    toggle.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
    toggle.setAttribute('aria-pressed', String(!playing));
  }
  toggle?.addEventListener('click', () => { playing = !playing; setToggle(); });

  new ResizeObserver(resize).observe(canvas);
  resize();
  requestAnimationFrame(loop);
}
