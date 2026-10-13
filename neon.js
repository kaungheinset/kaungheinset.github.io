(() => {
  'use strict';
  const root = document.body;
  const button = document.getElementById('spectrum-toggle');
  const key = 'thomas-neon-spectrum';
  let spectrum = 'cyan';
  try { if (localStorage.getItem(key) === 'violet') spectrum = 'violet'; } catch (_) {}
  function sync() {
    root.dataset.spectrum = spectrum;
    if (!button) return;
    const violet = spectrum === 'violet';
    button.setAttribute('aria-pressed', String(violet));
    button.setAttribute('aria-label', violet ? 'Change neon color from violet to cyan' : 'Change neon color from cyan to violet');
    button.innerHTML = (violet ? 'VIOLET MODE' : 'CYAN MODE') + ' <span aria-hidden="true">&#8635;</span>';
  }
  sync();
  button?.addEventListener('click', () => {
    spectrum = spectrum === 'cyan' ? 'violet' : 'cyan';
    sync();
    try {localStorage.setItem(key, spectrum);} catch (_) {}
  });

  // Purely decorative pointer highlights: no tracking, network or analytics.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.hero-visual, .project-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--pointer-x', `${((event.clientX - rect.left) / rect.width * 100).toFixed(1)}%`);
        card.style.setProperty('--pointer-y', `${((event.clientY - rect.top) / rect.height * 100).toFixed(1)}%`);
      }, {passive: true});
    });
  }
})();
