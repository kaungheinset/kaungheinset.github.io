(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const header = $('.site-header');
  const progress = $('.scroll-progress');

  function updateScroll() {
    const top = document.documentElement.scrollTop || document.body.scrollTop;
    const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (progress) progress.style.width = (top / total * 100).toFixed(2) + '%';
    header?.classList.toggle('scrolled', top > 12);
  }
  window.addEventListener('scroll', updateScroll, {passive:true});
  updateScroll();

  const menuButton = $('.menu-toggle');
  const nav = $('.main-nav');
  function closeMenu() {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    nav.classList.remove('is-open');
  }
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav?.classList.toggle('is-open', open);
  });
  $$('.main-nav a').forEach(el => el.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => {
    if (nav && menuButton && !nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });

  const filters = $$('[data-filter]');
  const cards = $$('.project-card[data-category]');
  const filterStatus = $('#filter-status');
  filters.forEach(button => button.addEventListener('click', () => {
    const value = button.dataset.filter;
    filters.forEach(item => {
      const selected = item === button;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    let visible = 0;
    cards.forEach(card => {
      const show = value === 'all' || card.dataset.category === value;
      card.hidden = !show;
      if (show) visible++;
    });
    if (filterStatus) filterStatus.textContent = `SHOWING ${String(visible).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;
  }));

  if ('IntersectionObserver' in window) {
    const revealed = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        revealed.unobserve(entry.target);
      });
    }, {threshold:0.075,rootMargin:'0px 0px 80px 0px'});
    $$('.reveal').forEach(el => revealed.observe(el));
  } else { $$('.reveal').forEach(el => el.classList.add('in-view')); }

  const navLinks = $$('.main-nav a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    const sections = navLinks.map(link => document.getElementById(link.getAttribute('href').slice(1))).filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => link.classList.toggle('is-active', link.hash === `#${entry.target.id}`));
      });
    }, {rootMargin:'-25% 0px -60% 0px'});
    sections.forEach(el => observer.observe(el));
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); return true; } catch (_) {}
    }
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.style.position='fixed';temp.style.opacity='0';
    document.body.appendChild(temp);temp.select();
    let ok=false;
    try {ok = document.execCommand('copy');} catch (_) {}
    temp.remove();
    return ok;
  }
  $$('[data-copy-email]').forEach(button => button.addEventListener('click', async () => {
    const ok=await copyText(button.dataset.copyEmail);
    const status=$('.copy-status');
    if(status) status.textContent = ok ? 'EMAIL COPIED TO CLIPBOARD ✓' : 'COPY FAILED — PLEASE SELECT THE ADDRESS BELOW';
    window.setTimeout(() => {if(status) status.textContent='';},4200);
  }));

  const motionToggle=$('#motion-toggle');
  let paused=false;
  try {paused=localStorage.getItem('thomas-portfolio-pause-motion')==='yes';}catch(_){/* local file browsers may disable storage */}
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion) paused=true;
  function syncMotion(){
    document.body.classList.toggle('pause-motion',paused);
    if(motionToggle){
      motionToggle.setAttribute('aria-pressed',String(paused));
      motionToggle.setAttribute('aria-label',paused?'Play decorative animations':'Pause decorative animations');
      motionToggle.innerHTML = paused ? 'PLAY MOTION <span aria-hidden="true">▶</span>' : 'PAUSE MOTION <span aria-hidden="true">Ⅱ</span>';
    }
  }
  syncMotion();
  motionToggle?.addEventListener('click',()=>{
    paused=!paused;syncMotion();
    try{localStorage.setItem('thomas-portfolio-pause-motion',paused?'yes':'no');}catch(_){}
  });
  if($('#year')) $('#year').textContent=String(new Date().getFullYear());
})();
