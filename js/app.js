/* ═══════════════════════════════════════════════════════════
   NICOZ — APP.JS
   Works on every page: each block guards against its own
   markup being missing, so the legal pages reuse this file
   without dragging the project reel along.
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE    = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof gsap !== 'undefined';

  /* ── MOCKUP ACCENT COLOURS ─────────────────────────────
     The browser mockups take their palette from data-accent
     attributes so each project reads as its own product.    */
  $$('.mock').forEach(mock => {
    if (mock.dataset.accent) mock.style.setProperty('--a',  mock.dataset.accent);
    if (mock.dataset.accent2) mock.style.setProperty('--a2', mock.dataset.accent2);
    if (mock.dataset.bg)     mock.style.setProperty('--mbg', mock.dataset.bg);
  });

  /* ── PRELOADER ─────────────────────────────────────────── */
  const loader = $('#loader');
  const dismissLoader = () => {
    if (!loader || loader.classList.contains('out')) return;
    loader.classList.add('out');
    document.body.classList.add('loaded');
    runHeroIntro();
  };
  window.addEventListener('load', () => setTimeout(dismissLoader, REDUCED ? 0 : 1200));
  // Safety net: never trap the visitor behind the loader.
  setTimeout(dismissLoader, 4000);

  /* ── HERO INTRO ────────────────────────────────────────── */
  let introPlayed = false;

  function runHeroIntro() {
    if (introPlayed) return;
    introPlayed = true;

    const name = $('.hero-name');
    if (!name) return;

    // Split into letters, wrapped so the mask can lift them.
    const text = name.textContent.trim();
    name.innerHTML = `<span class="word">${
      text.split('').map(c => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('')
    }</span>`;

    const letters = $$('.word > span', name);
    const reveal = ['.hero-eyebrow', '.hero-role', '.hero-desc', '.hero-cta', '.hero-meta'];

    if (!hasGSAP || REDUCED) return;

    gsap.set(letters, { yPercent: 110 });
    gsap.set(reveal, { opacity: 0, y: 18 });

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(letters, { yPercent: 0, duration: 1.1, stagger: 0.045 }, 0.1)
      .to(reveal, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.35);
  }

  /* ── CUSTOM CURSOR ─────────────────────────────────────── */
  const cursor = $('#cursor');
  if (cursor && FINE && !REDUCED) {
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;

    window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });

    (function loop() {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();

    const HOVER = 'a, button, label, input, [data-magnetic], .pdot, .psn-item';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(HOVER)) cursor.classList.add('is-hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(HOVER)) cursor.classList.remove('is-hover');
    });
    window.addEventListener('mousedown', () => cursor.classList.add('is-down'));
    window.addEventListener('mouseup',   () => cursor.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => cursor.style.opacity = '0');
    document.addEventListener('mouseenter', () => cursor.style.opacity = '1');
  } else if (cursor) {
    cursor.style.display = 'none';
  }

  /* ── SPOTLIGHT + SCROLL PROGRESS ───────────────────────── */
  const spotlight = $('#spotlight');
  if (spotlight && FINE && !REDUCED) {
    window.addEventListener('mousemove', e => {
      spotlight.style.setProperty('--mx', e.clientX + 'px');
      spotlight.style.setProperty('--my', e.clientY + 'px');
    }, { passive: true });
  }

  const progress = $('#scroll-progress');
  if (progress) {
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ── NAV: scrolled state + mobile panel ───────────────── */
  const nav = $('#nav');
  if (nav) {
    const setNav = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', setNav, { passive: true });
    setNav();
  }

  const toggle = $('#nav-toggle');
  const panel  = $('#nav-panel');
  if (toggle && panel) {
    const setMenu = open => {
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      panel.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    $$('a', panel).forEach(a => a.addEventListener('click', () => setMenu(false)));
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
    });
  }

  /* ── SCROLL REVEALS ────────────────────────────────────── */
  const revealables = $$('[data-reveal]');
  if (revealables.length) {
    if (REDUCED) {
      revealables.forEach(el => el.classList.add('revealed'));
    } else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      revealables.forEach(el => io.observe(el));
    }
  }

  /* ── MAGNETIC BUTTONS ──────────────────────────────────── */
  if (hasGSAP && FINE && !REDUCED) {
    $$('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, {
          x: (e.clientX - r.left - r.width  / 2) * 0.25,
          y: (e.clientY - r.top  - r.height / 2) * 0.3,
          duration: 0.35, ease: 'power2.out'
        });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
      });
    });
  }

  /* ── COUNTERS ──────────────────────────────────────────── */
  const counters = $$('.astat-n[data-count]');
  if (counters.length) {
    const countObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = +el.dataset.count;
        const suffix = el.dataset.suffix || '';
        if (!hasGSAP || REDUCED) {
          el.textContent = target + suffix;
        } else {
          gsap.to({ v: 0 }, {
            v: target, duration: 1.5, ease: 'power2.out',
            onUpdate() { el.textContent = Math.round(this.targets()[0].v) + suffix; },
            onComplete() { el.textContent = target + suffix; }
          });
        }
        countObs.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(el => countObs.observe(el));
  }

  /* ── HERO NAME SCRAMBLE ON HOVER ───────────────────────── */
  const heroName = $('.hero-name');
  if (heroName && FINE && !REDUCED) {
    const ORIG = heroName.textContent.trim();
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#@$%&';
    let timer = null;

    heroName.addEventListener('mouseenter', () => {
      let iter = 0;
      clearInterval(timer);
      timer = setInterval(() => {
        const txt = ORIG.split('').map((ch, i) =>
          i < iter ? ch : CHARS[Math.floor(Math.random() * CHARS.length)]
        ).join('');
        heroName.textContent = txt;
        if (iter >= ORIG.length) {
          clearInterval(timer);
          heroName.textContent = ORIG;
        }
        iter += 0.34;
      }, 40);
    });
  }

  /* ═════════════════════════════════════════════════════════
     PROJECT REEL — only on the home page
     ═════════════════════════════════════════════════════════ */
  const wrapper = $('#projects-wrapper');

  if (wrapper && hasGSAP && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    const sticky   = $('#projects-sticky');
    const stage    = $('#stage3d');
    const cards    = $$('.pcard');
    const dots     = $$('.pdot');
    const psnItems = $$('.psn-item');
    const psnFill  = $('#psnFill');
    const sideNav  = $('#projSideNav');
    const intro    = $('#projIntro');
    const idxEl    = $('#reelIndex');
    const totalEl  = $('#reelTotal');

    const NAMES = ['Sponky Squad', 'Autopsy', 'Gambling Island', 'Disinfecting', 'SnipeX'];
    const N = cards.length;

    if (!N || !sticky) return;

    if (totalEl) totalEl.textContent = String(N).padStart(2, '0');

    // Scroll budget: a little over one viewport per project.
    const PER = 1.15;
    const scrollLen = () => window.innerHeight * N * PER;
    wrapper.style.height = (scrollLen() + window.innerHeight) + 'px';

    gsap.set(stage, { transformStyle: 'preserve-3d' });
    gsap.set(cards, { z: -2600, opacity: 0, rotateX: 14, scale: 0.86, force3D: true });

    let current = -1;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapper,
        start: 'top top',
        end: () => '+=' + scrollLen(),
        pin: sticky,
        pinSpacing: false,
        scrub: 0.7,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: self => {
          const p = self.progress;

          if (sideNav) sideNav.classList.toggle('visible', p > 0.015 && p < 0.985);
          if (psnFill) psnFill.style.height = (Math.min(p, 1) * 100) + '%';

          if (intro) intro.classList.toggle('hidden', p > 0.015);

          const idx = Math.min(Math.floor(p * N), N - 1);
          if (idx === current) return;
          current = idx;

          if (idxEl) idxEl.textContent = String(idx + 1).padStart(2, '0');

          sticky.classList.remove('theme-0', 'theme-1', 'theme-2', 'theme-3', 'theme-4');
          sticky.classList.add('theme-' + idx);

          psnItems.forEach((el, i) => el.classList.toggle('active', i === idx));
          dots.forEach((el, i) => el.classList.toggle('active', i === idx));
          cards.forEach((el, i) => el.classList.toggle('active', i === idx));
        }
      }
    });

    // One unit of timeline per card: fly in, hold, fly past.
    const unit = 1 / N;
    cards.forEach((card, i) => {
      const at = i * unit;
      tl.fromTo(card,
        { z: -2600, opacity: 0, rotateX: 14, scale: 0.86 },
        { z: 0, opacity: 1, rotateX: 0, scale: 1, duration: unit * 0.45, ease: 'power3.out' },
        at)
        .to(card,
        { z: 40, scale: 1.02, duration: unit * 0.22, ease: 'sine.inOut' },
        at + unit * 0.45)
        .to(card,
        { z: 2200, opacity: 0, rotateX: -8, scale: 1.35, duration: unit * 0.33, ease: 'power2.in' },
        at + unit * 0.67);
    });

    // Jump helpers shared by the dots and the side rail.
    const goTo = i => {
      const top = wrapper.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + (i / N) * scrollLen() + 4, behavior: REDUCED ? 'auto' : 'smooth' });
    };
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
    psnItems.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

    // Motion blur only while actually scrolling fast.
    let lastY = window.scrollY, blurTimer;
    window.addEventListener('scroll', () => {
      const delta = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      if (!stage || delta < 12) return;
      stage.classList.add('fast-scroll');
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => stage.classList.remove('fast-scroll'), 160);
    }, { passive: true });

    // Pointer tilt on the mockup, desktop only.
    if (FINE && !REDUCED) {
      cards.forEach(card => {
        const visual = card.querySelector('.mock');
        if (!visual) return;
        card.addEventListener('mousemove', e => {
          const r = card.getBoundingClientRect();
          gsap.to(visual, {
            rotateY: ((e.clientX - r.left) / r.width  - 0.5) * 10,
            rotateX: ((e.clientY - r.top)  / r.height - 0.5) * -7,
            duration: 0.4, ease: 'power2.out'
          });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(visual, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'elastic.out(1, 0.6)' });
        });
      });
    }

    window.addEventListener('resize', () => {
      wrapper.style.height = (scrollLen() + window.innerHeight) + 'px';
      ScrollTrigger.refresh();
    });
  }

  /* ═════════════════════════════════════════════════════════
     COOKIE CONSENT — banner, preferences modal, storage
     ═════════════════════════════════════════════════════════ */
  const KEY = 'nicoz-consent-v1';

  const banner  = $('#consent');
  const modal   = $('#consent-modal');
  const toggles = $$('[data-consent-key]');

  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch { return null; }
  };
  const write = value => {
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* private mode */ }
  };

  const state = read() || { essential: true, experience: false, analytics: false };

  const syncToggles = () => {
    toggles.forEach(t => { t.checked = !!state[t.dataset.consentKey]; });
  };

  const closeBanner = () => banner && banner.classList.remove('show');
  const closeModal  = () => {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  const openModal = () => {
    if (!modal) return;
    syncToggles();
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const close = modal.querySelector('[data-close-modal]');
    if (close) close.focus();
  };

  const save = next => {
    write({ ...next, essential: true, ts: Date.now() });
    Object.assign(state, next);
    closeBanner();
    closeModal();
    refresh();
  };

  if (banner && !read()) {
    setTimeout(() => banner.classList.add('show'), REDUCED ? 300 : 2200);
  }
  syncToggles();

  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-open-consent]');
    if (opener) { e.preventDefault(); openModal(); return; }

    const closer = e.target.closest('[data-close-modal]');
    if (closer) { closeModal(); return; }

    const action = e.target.closest('[data-consent]');
    if (!action) return;

    const kind = action.dataset.consent;
    if (kind === 'all') {
      save({ experience: true, analytics: true });
    } else if (kind === 'essential') {
      save({ experience: false, analytics: false });
    } else if (kind === 'save') {
      const next = {};
      toggles.forEach(t => { next[t.dataset.consentKey] = t.checked; });
      save(next);
    }
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && modal.classList.contains('show')) closeModal();
  });

  /* ── OPTIONAL: status line + clear button on cookie.html ── */
  const status = $('#consent-status');
  const clearBtn = $('#consent-clear');

  const describe = () => {
    if (!status) return;
    const stored = read();
    if (!stored) {
      status.textContent = 'Nessuna scelta salvata: nessuna categoria facoltativa è attiva.';
      return;
    }
    const on = ['experience', 'analytics'].filter(k => stored[k]);
    status.textContent = on.length
      ? 'Salvato su questo dispositivo — attivi: ' + on.join(', ') + '.'
      : 'Salvato su questo dispositivo — solo categorie necessarie.';
  };

  const refresh = () => { syncToggles(); describe(); };

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      try { localStorage.removeItem(KEY); } catch { /* ignore */ }
      state.essential = true;
      state.experience = false;
      state.analytics = false;
      refresh();
      if (banner) banner.classList.add('show');
    });
  }

  refresh();

});
