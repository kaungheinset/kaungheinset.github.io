/* THOMAS SECURITY / DEPTH ENGINE
   Pointer parallax and scroll-tied 3D transforms. No network requests or analytics. */
(() => {
  'use strict';
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff = () => prefersReduced.matches || document.body.classList.contains('pause-motion');

  // The hero is controlled by the full 360-degree orbit engine in orbit360.js.

  // Scroll drives an exploded 3D investigation stack from collect to respond.
  const story = document.getElementById('lab-3d');
  const stack = document.getElementById('depth-stack');
  if (!story || !stack) return;
  const phases = [...story.querySelectorAll('[data-depth-phase]')];
  const layers = [...story.querySelectorAll('[data-layer]')];
  const indicator = document.getElementById('depth-stage-index');
  const stageLabel = document.getElementById('depth-stage-name');
  const meter = story.querySelector('.depth-scroll-meter');
  const stageNames = ['COLLECT','CORRELATE','DETECT','RESPOND'];
  let lastStage = -1;
  let queued = false;

  function scaledForViewport(progress) {
    const w = window.innerWidth;
    const base = w <= 390 ? .44 : w <= 620 ? .50 : w <= 860 ? .75 : w <= 1050 ? .72 : w <= 1230 ? .85 : 1;
    return base * (.91 + progress * .12);
  }
  function redraw() {
    queued = false;
    const rect = story.getBoundingClientRect();
    const distance = Math.max(1, story.offsetHeight - window.innerHeight);
    const progress = clamp(-rect.top / distance, 0, 1);
    const stage = Math.min(3, Math.floor(progress * 3.999));
    const skipAnimation = motionOff();
    if (!skipAnimation) {
      // Camera slowly orbits the layered object through real CSS perspective.
      const x = 56 - progress * 13 + Math.sin(progress * Math.PI) * 3;
      const y = -29 + progress * 54 + Math.sin(progress * Math.PI * 2) * 6;
      const z = -18 + progress * 21;
      stack.style.setProperty('--story-x', x.toFixed(2) + 'deg');
      stack.style.setProperty('--story-y', y.toFixed(2) + 'deg');
      stack.style.setProperty('--story-z', z.toFixed(2) + 'deg');
      stack.style.setProperty('--story-scale', scaledForViewport(progress).toFixed(3));
      // Inline transform overcomes old-browser calc multiplication differences.
      stack.style.transform = `rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg) rotateZ(${z.toFixed(2)}deg) scale(${scaledForViewport(progress).toFixed(3)})`;
    } else {
      stack.style.transform = '';
    }
    meter?.style.setProperty('--scroll-complete', (progress * 100).toFixed(1) + '%');
    if (stage !== lastStage) {
      phases.forEach((button, index) => {
        const active = index === stage;
        button.classList.toggle('is-current', active);
        if (active) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      layers.forEach((layer, index) => layer.classList.toggle('is-highlighted', index === stage));
      if (indicator) indicator.textContent = `${String(stage + 1).padStart(2, '0')} / 04`;
      if (stageLabel) stageLabel.textContent = stageNames[stage];
      lastStage = stage;
    }

    // Subtle depth on artwork only, not the clickable project card itself.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !skipAnimation) {
      document.querySelectorAll('.project-card').forEach(card => {
        if (card.hidden) return;
        const bounds = card.getBoundingClientRect();
        if (bounds.bottom < -30 || bounds.top > window.innerHeight + 30) return;
        const offset = clamp((bounds.top + bounds.height/2 - window.innerHeight/2) / window.innerHeight, -1, 1);
        card.style.setProperty('--card-scroll-x', (offset * -2.7).toFixed(2) + 'deg');
        card.style.setProperty('--card-scroll-y', (offset * -5).toFixed(1) + 'px');
      });
    }
  }
  const requestRedraw = () => {
    if (!queued) { queued = true; requestAnimationFrame(redraw); }
  };
  window.addEventListener('scroll', requestRedraw, {passive:true});
  window.addEventListener('resize', requestRedraw, {passive:true});
  prefersReduced.addEventListener?.('change', requestRedraw);
  document.getElementById('motion-toggle')?.addEventListener('click', requestRedraw);
  phases.forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.depthPhase);
      if (!Number.isInteger(index) || index < 0 || index > 3) return;
      const top = story.getBoundingClientRect().top + window.scrollY;
      const range = Math.max(1, story.offsetHeight - window.innerHeight);
      window.scrollTo({top: top + range * ((index + .40) / 4),behavior:motionOff()?'instant':'smooth'});
    });
  });
  requestRedraw();
})();
