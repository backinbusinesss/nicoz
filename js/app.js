/* ============================================
   NICOZ — APP.JS
   Loader · Nav · Cursor · 3D Scroll Zoom · Reveals
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── LOADER ──
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('out'), 1600);
  });

  // ── CUSTOM CURSOR ──
  const cur  = document.getElementById('cursor');
  const trail = document.getElementById('cursor-trail');
  let tx = 0, ty = 0, cx = 0, cy = 0;
  window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  (function moveCursor() {
    cx += (tx - cx) * 0.15;
    cy += (ty - cy) * 0.15;
    if (cur)   { cur.style.left   = tx + 'px'; cur.style.top   = ty + 'px'; }
    if (trail) { trail.style.left = cx + 'px'; trail.style.top = cy + 'px'; }
    requestAnimationFrame(moveCursor);
  })();

  // ── NAV SCROLL ──
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // ── SCROLL REVEAL (sections outside sticky) ──
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

  // ══════════════════════════════════════════
  // 3D SCROLL ZOOM — PROJECTS
  // ══════════════════════════════════════════

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const wrapper   = document.getElementById('projects-wrapper');
  const sticky    = document.getElementById('projects-sticky');
  const stage     = document.getElementById('stage3d');
  const cards     = Array.from(document.querySelectorAll('.pcard'));
  const bgNum     = document.getElementById('projBgNum');
  const bgName    = document.getElementById('projBgName');
  const intro     = document.getElementById('projIntro');
  const dots      = Array.from(document.querySelectorAll('.pdot'));
  const scrollHint= document.getElementById('projScrollHint');

  const CARD_NAMES = ['Disinfecting', 'SnipeX', 'kidnap.lol'];
  const N = cards.length;

  // Initial states — all cards deep in Z space
  gsap.set(cards, {
    z: (i) => -2800 - i * 600,
    opacity: 0,
    rotateX: 12,
    scale: 0.85,
    force3D: true,
  });

  // Make the stage preserve 3D
  gsap.set(stage, { transformStyle: 'preserve-3d', perspective: 1100 });

  // Wrapper height = 100vh (sticky) + N * 2 * 100vh scrollable
  // Already set via CSS as 500vh for 3 cards

  let currentCard = -1;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: wrapper,
      start: 'top top',
      end: `+=${window.innerHeight * (N * 2)}`,
      pin: sticky,
      scrub: 0.8,
      anticipatePin: 1,
      onUpdate: self => {
        const p = self.progress; // 0 → 1

        // fade out intro
        if (p > 0.02) {
          intro && intro.classList.add('hidden');
          scrollHint && scrollHint.classList.add('hidden');
        } else {
          intro && intro.classList.remove('hidden');
          scrollHint && scrollHint.classList.remove('hidden');
        }

        // which card is active?
        const idx = Math.min(Math.floor(p * N), N - 1);
        if (idx !== currentCard) {
          currentCard = idx;
          // update bg label
          if (bgNum) bgNum.textContent = String(idx + 1).padStart(2, '0');
          if (bgName) bgName.textContent = CARD_NAMES[idx] || '';
          // update dots
          dots.forEach((d, i) => d.classList.toggle('active', i === idx));
          // mark active card
          cards.forEach((c, i) => c.classList.toggle('active', i === idx));
        }
      }
    }
  });

  // Per-card animation: each occupies 1/N of the timeline
  const unit = 1 / N;
  cards.forEach((card, i) => {
    const start  = i * unit;           // when this card starts zooming in
    const center = start + unit * 0.35; // card fully centered
    const exit   = start + unit * 0.7;  // card starts zooming past

    // Phase 1: zoom IN from depth
    tl.fromTo(card,
      { z: -2800, opacity: 0, rotateX: 14, scale: 0.7 },
      { z: 0,     opacity: 1, rotateX: 0,  scale: 1,
        ease: 'power3.out', duration: unit * 0.5 },
      start
    )
    // Phase 2: brief hover at center (subtle breathe)
    .to(card,
      { z: 20, scale: 1.02, ease: 'sine.inOut', duration: unit * 0.2 },
      center
    )
    // Phase 3: zoom PAST camera
    .to(card,
      { z: 2200, opacity: 0, rotateX: -8, scale: 1.4,
        ease: 'power3.in', duration: unit * 0.3 },
      exit
    );
  });

  // Dots click — scroll to that card
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
      const total      = window.innerHeight * N * 2;
      const targetY    = wrapperTop + (i / N) * total + 10;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
  });

  // ── PAGE TRANSITIONS ──
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;
    background:linear-gradient(135deg,#7c3aed,#4f46e5);
    z-index:8999;
    transform:translateY(100%);
    pointer-events:none;
  `;
  document.body.appendChild(overlay);

  // Slide out on arrive
  gsap.set(overlay, { y: '0%' });
  gsap.to(overlay, { y: '-100%', duration: 0.7, ease: 'power3.inOut', delay: 0.1 });

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') ||
        href.startsWith('mailto') || href.startsWith('tel') ||
        link.target === '_blank') return;
    link.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      gsap.to(overlay, {
        y: '0%', duration: 0.5, ease: 'power3.in',
        onComplete: () => { window.location.href = href; }
      });
    });
  });

  // ── ABOUT SECTION REVEALS ──
  const aboutEls = document.querySelectorAll('#about .about-left, #about .about-right, #about .skill-group, #about .astat');
  aboutEls.forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
        },
        delay: i * 0.08,
      }
    );
  });

  // ── CONTACT REVEALS ──
  gsap.fromTo('.contact-inner > *',
    { opacity: 0, y: 30 },
    {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: '#contact', start: 'top 75%' }
    }
  );

  // ── CONTACT LINK HOVER GLOW ──
  document.querySelectorAll('.contact-link').forEach(el => {
    el.addEventListener('mouseenter', () => {
      gsap.to(el, { scale: 1.04, duration: 0.3, ease: 'power2.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { scale: 1, duration: 0.3, ease: 'power2.out' });
    });
  });

  // ── CARD HOVER TILT ──
  cards.forEach(card => {
    const browser = card.querySelector('.pcard-browser');
    if (!browser) return;
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 12;
      const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -8;
      gsap.to(browser, { rotateY: x, rotateX: y, duration: 0.3, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(browser, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'elastic.out(1,0.7)' });
    });
  });

  // ── SCROLL PROGRESS BAR ──
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
      progressBar.style.width = pct + '%';
    }, { passive: true });
  }

  // ── SPOTLIGHT CURSOR ──
  const spotlight = document.getElementById('spotlight');
  if (spotlight) {
    window.addEventListener('mousemove', e => {
      spotlight.style.setProperty('--mx', e.clientX + 'px');
      spotlight.style.setProperty('--my', e.clientY + 'px');
    }, { passive: true });
  }

  // ── MAGNETIC BUTTONS ──
  document.querySelectorAll('.btn-glow, .btn-ghost, .nav-cta').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width  / 2) * 0.28;
      const y = (e.clientY - rect.top  - rect.height / 2) * 0.28;
      gsap.to(btn, { x, y, duration: 0.3, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    });
  });

  // ── STATS COUNTER ──
  const statEls = document.querySelectorAll('.astat-n[data-count]');
  if (statEls.length) {
    const countObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = +el.dataset.count;
        const suffix = el.dataset.suffix || '';
        gsap.to({ val: 0 }, {
          val: target, duration: 1.6, ease: 'power2.out',
          onUpdate: function () {
            el.textContent = Math.round(this.targets()[0].val) + suffix;
          },
          onComplete: () => { el.textContent = target + suffix; }
        });
        countObs.unobserve(el);
      });
    }, { threshold: 0.6 });
    statEls.forEach(el => countObs.observe(el));
  }

  // ── TEXT SCRAMBLE ON HERO NAME HOVER ──
  const heroGlitch = document.querySelector('.hero-name .glitch');
  if (heroGlitch) {
    const ORIG = 'NICOZ';
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&';
    let scrambleInterval = null;
    heroGlitch.addEventListener('mouseenter', () => {
      let iter = 0;
      clearInterval(scrambleInterval);
      scrambleInterval = setInterval(() => {
        const txt = ORIG.split('').map((l, i) =>
          i < iter ? ORIG[i] : CHARS[Math.floor(Math.random() * CHARS.length)]
        ).join('');
        heroGlitch.textContent = txt;
        heroGlitch.setAttribute('data-text', txt);
        if (iter >= ORIG.length) {
          clearInterval(scrambleInterval);
          heroGlitch.textContent = ORIG;
          heroGlitch.setAttribute('data-text', ORIG);
        }
        iter += 0.35;
      }, 38);
    });
  }

});
