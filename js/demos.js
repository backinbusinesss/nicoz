/* ═══════════════════════════════════════════════════════════
   NICOZ — LIVE DEMOS (demo.html runtime)
   One interactive mini-demo per Website-category service:
     one-page-landing · static-website · custom-design ·
     brand-kit · seo-speed · 3d-motion · cms-admin ·
     ecommerce · support-maintenance
   Everything is static, local and self-contained (only the 3D
   demo lazily pulls three.js, the same CDN already used on
   index). Reads product data from products.json, follows the
   active language (window.NicozI18N) and re-renders on the
   `nicoz:lang` event. Each build() may return a cleanup fn so
   intervals / rAF never leak between demos.
   ═══════════════════════════════════════════════════════════ */
(() => {

  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const view = $('#d-view');
  if (!view) return;

  /* ── i18n plumbing ────────────────────────────────────── */
  const hasI18N = () => typeof window.NicozI18N !== 'undefined';
  const lang    = () => (hasI18N() ? window.NicozI18N.lang : 'en');
  const pick    = (en, it) => (lang() === 'it' ? it : en);
  const fmt     = n => '$' + n;

  const CATEGORY_LABEL = {
    website: ['Website', 'Website'],
    discord: ['Discord', 'Discord'],
    telegram: ['Telegram', 'Telegram'],
    app: ['App', 'App']
  };

  /* ── data ─────────────────────────────────────────────── */
  let contact  = { email: 'nicoz@secria.me', whatsapp: '18734741519' };
  let products = [];
  let ready    = false;

  /* demo-enabled slugs follow the products.json `demo: true` flag */
  const demoProducts = () => products.filter(p => p.demo);

  const bySlug = () => Object.fromEntries(products.map(p => [p.slug, p]));
  const loc = o => (lang() === 'it' && o && o.it) ? { ...o, ...o.it } : o;

  const currentSlug = () => {
    const want = new URLSearchParams(location.search).get('product');
    const allowed = demoProducts().map(p => p.slug);
    if (want && allowed.includes(want)) return want;
    return allowed[0] || 'one-page-landing';
  };

  let cleanup = null;
  let slug = null;

  /* ══════════════════════════════════════════════════════
     THE NINE DEMOS
     build(host) → optional cleanup function
     `host` is a fresh <div> inside #d-view for every demo.
  ══════════════════════════════════════════════════════ */

  /* 01 · One-Page Landing — Orbit Coffee ------------------- */
  const dLanding = host => {
    host.className = 'demo dm-landing';
    host.innerHTML = `
      <div>
        <p class="dm-kicker">${pick('Orbit Coffee · single page', 'Orbit Coffee · pagina singola')}</p>
        <h1>${pick('Coffee that <em>takes off</em>', 'Caffè che <em>decola</em>')}</h1>
        <p class="dm-lead">${pick(
          'Specialty beans, roasted weekly, delivered to your door in 48 hours.',
          'Caffè di specialità, tostato ogni settimana, consegnato a casa in 48 ore.')}</p>
        <div class="dm-feats">
          <span>🚚 ${pick('Free shipping', 'Spedizione gratis')}</span>
          <span>⭐ ${pick('4.9 / 5 · 1.2k reviews', '4,9 / 5 · 1,2k recensioni')}</span>
          <span>🔁 ${pick('Cancel anytime', 'Disdici quando vuoi')}</span>
        </div>
        <form id="dm-lp-form">
          <input type="email" required placeholder="${pick('you@example.com', 'tu@example.com')}" aria-label="Email" />
          <button class="dm-btn" type="submit">${pick('Get 10% off', 'Sconto del 10%')}</button>
        </form>
        <p class="dm-ok" id="dm-lp-ok" style="min-height:1.2rem; margin-top:.7rem; font-size:.8rem;"></p>
      </div>`;
    const form = $('#dm-lp-form', host);
    const ok = $('#dm-lp-ok', host);
    const onSubmit = e => {
      e.preventDefault();
      ok.textContent = pick('✓ You are in! Check your inbox.', '✓ Ci sei! Controlla la posta.');
      form.reset();
    };
    form.addEventListener('submit', onSubmit);
    return () => form.removeEventListener('submit', onSubmit);
  };

  /* 02 · Static Website — Mamma Rosa bakery --------------- */
  const dSite = host => {
    host.className = 'demo dm-site';
    const T = {
      tabs:  [pick('Home', 'Home'), pick('Menu', 'Menù'), pick('Contact', 'Contatti')],
      open:  pick('Open now · 7:00 – 19:30', 'Aperto ora · 7:00 – 19:30'),
      hero:  pick('Fresh bread since 1972', 'Pane fresco dal 1972'),
      lead:  pick('Family bakery in the old town. Sourdough, focaccia and pastries, every single day.',
                  'Forno di famiglia nel centro storico. Pane lievitato, focaccia e pasticceria, ogni giorno.'),
      menuH: pick('Today’s menu', 'Menù di oggi'),
      contH: pick('Find us', 'Dove siamo'),
      addr:  pick('Via Roma 12 · Old town', 'Via Roma 12 · Centro storico'),
      phone: pick('Phone · +39 02 555 0132', 'Telefono · +39 02 555 0132'),
      items: [
        ['🍕', pick('Focaccia Genovese', 'Focaccia Genovese'), '€3,50'],
        ['🥖', pick('Sourdough loaf', 'Pane lievitato'), '€4,20'],
        ['🥐', pick('Butter croissant', 'Cornetto burro'), '€1,80'],
        ['🍰', pick('Tiramisù slice', 'Porzione di tiramisù'), '€4,00']
      ]
    };
    host.innerHTML = `
      <div class="dm-site-bar">
        <b>🌹 Mamma Rosa</b>
        ${T.tabs.map((t, i) => `<button type="button" data-p="${i}"${i === 0 ? ' class="on"' : ''}>${t}</button>`).join('')}
      </div>
      <div class="dm-pane on" data-pane="0">
        <span class="dm-open">● ${T.open}</span>
        <h2>${T.hero}</h2>
        <p style="color:var(--muted); font-size:.88rem; line-height:1.6; max-width:32rem;">${T.lead}</p>
      </div>
      <div class="dm-pane" data-pane="1">
        <h2>${T.menuH}</h2>
        ${T.items.map(it => `<div class="dm-menu-item"><b>${it[0]} ${it[1]}</b><i></i><span>${it[2]}</span></div>`).join('')}
      </div>
      <div class="dm-pane" data-pane="2">
        <h2>${T.contH}</h2>
        <p style="color:var(--muted); font-size:.86rem; line-height:1.7;">${T.addr}<br/>${T.phone}</p>
        <div class="dm-map">📍</div>
      </div>`;
    const onClick = e => {
      const b = e.target.closest('button[data-p]');
      if (!b) return;
      $$('button[data-p]', host).forEach(x => x.classList.toggle('on', x === b));
      $$('.dm-pane', host).forEach(p => p.classList.toggle('on', p.dataset.pane === b.dataset.p));
    };
    host.addEventListener('click', onClick);
    return () => host.removeEventListener('click', onClick);
  };

  /* 03 · Custom Design — wireframe ⇄ final slider ---------- */
  const dDesign = host => {
    host.className = 'demo dm-ba';
    host.innerHTML = `
      <div class="dm-ba-top">
        <span class="dm-hint">${pick('Drag to reveal the design', 'Trascina per rivelare il design')}</span>
        <span class="dm-hint" style="color:var(--violet);">${pick('Wireframe → Final', 'Wireframe → Finale')}</span>
      </div>
      <div class="dm-ba-stage">
        <div class="dm-ba-layer dm-wire">
          <span class="w-cap">Wireframe</span>
          <div class="w-box w-head"></div>
          <div class="w-box w-txt"></div>
          <div class="w-box w-txt2"></div>
          <div class="w-box w-btn"></div>
          <div class="w-row" style="margin-top:.9rem;">
            <div class="w-box"></div><div class="w-box"></div><div class="w-box"></div>
          </div>
        </div>
        <div class="dm-ba-layer dm-final" id="dm-final" style="width:50%;">
          <span class="w-cap">${pick('Final design', 'Design finale')}</span>
          <div class="f-head"><b>Nicoz</b><i>${pick('Live', 'Live')}</i></div>
          <div class="f-txt"></div>
          <div class="f-txt2"></div>
          <span class="f-btn">${pick('Get started', 'Inizia ora')}</span>
          <div class="f-row"><span></span><span></span><span></span></div>
        </div>
        <div class="dm-ba-line" id="dm-line"></div>
        <div class="dm-ba-knob" id="dm-knob">↔</div>
        <input class="dm-ba-range" type="range" min="0" max="100" value="50"
               aria-label="${pick('Reveal slider', 'Slider di rivelazione')}" />
      </div>`;
    const range = $('.dm-ba-range', host);
    const final = $('#dm-final', host);
    const line = $('#dm-line', host);
    const knob = $('#dm-knob', host);
    const onInput = () => {
      const v = range.value;
      final.style.width = v + '%';
      line.style.left = v + '%';
      knob.style.left = v + '%';
    };
    range.addEventListener('input', onInput);
    return () => range.removeEventListener('input', onInput);
  };

  /* 04 · Brand Kit — interactive board --------------------- */
  const dBrand = host => {
    host.className = 'demo dm-brand';
    const palettes = [
      ['#7c3aed', '#22d3ee', '#f472b6', '#34d399', '#fbbf24'],
      ['#f43f5e', '#fb923c', '#fbbf24', '#34d399', '#60a5fa'],
      ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'],
      ['#84cc16', '#14b8a6', '#0ea5e9', '#6366f1', '#d946ef'],
      ['#e2e8f0', '#94a3b8', '#475569', '#7c3aed', '#22d3ee']
    ];
    let pal = palettes[0];
    let accent = pal[0];
    let outline = false;

    const render = () => {
      host.style.setProperty('--bacc', accent);
      host.innerHTML = `
        <div class="dm-brand-logo">
          <span class="dm-brand-mark${outline ? ' outline' : ''}">NZ</span>
          <span class="dm-brand-tag">${pick('Primary logo · v2', 'Logo primario · v2')}</span>
        </div>
        <div class="dm-brand-side">
          <div>
            <h4>${pick('Colour palette', 'Palette colori')}</h4>
            <div class="dm-pal">
              ${pal.map(c => `<button type="button" class="${c === accent ? 'sel' : ''}" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}
            </div>
          </div>
          <div>
            <h4>${pick('Typography', 'Tipografia')}</h4>
            <div class="dm-brand-spec"><b>Aa</b><span>Syne — headings<br/>Inter — body text</span></div>
          </div>
          <div class="dm-brand-actions">
            <button type="button" class="dm-btn2" data-a="outline">${outline ? pick('Solid logo', 'Logo pieno') : pick('Outline logo', 'Logo outline')}</button>
            <button type="button" class="dm-btn2" data-a="shuffle">🎲 ${pick('New palette', 'Nuova palette')}</button>
          </div>
        </div>`;
    };
    const onClick = e => {
      const sw = e.target.closest('[data-c]');
      if (sw) { accent = sw.dataset.c; render(); return; }
      const act = e.target.closest('[data-a]');
      if (!act) return;
      if (act.dataset.a === 'outline') outline = !outline;
      if (act.dataset.a === 'shuffle') {
        pal = palettes.slice().sort(() => Math.random() - 0.5)[0];
        accent = pal[0];
      }
      render();
    };
    render();
    host.addEventListener('click', onClick);
    return () => host.removeEventListener('click', onClick);
  };

  /* 05 · SEO & Speed — live audit -------------------------- */
  const dSeo = host => {
    host.className = 'demo dm-seo';
    host.innerHTML = `
      <h3>${pick('Page audit', 'Audit della pagina')}</h3>
      <p class="dm-sub">${pick('One click — see the score jump', 'Un clic — guarda il punteggio schizzare')}</p>
      <button class="dm-btn" id="dm-seo-run">${pick('Run audit', 'Esegui audit')}</button>
      <div class="dm-gauges" style="margin-top:1.2rem;">
        ${[
          ['Performance', 42, 97, '#34d399'],
          ['Access.', 88, 96, '#22d3ee'],
          ['Best prac.', 79, 100, '#a78bfa'],
          ['SEO', 71, 100, '#fbbf24']
        ].map(g => `
          <div class="dm-gauge" style="--gv:${g[3]}">
            <svg viewBox="0 0 60 60"><circle class="g-bg" cx="30" cy="30" r="26"></circle><circle class="g-val" cx="30" cy="30" r="26"></circle></svg>
            <b data-final="${g[2]}" data-from="${g[1]}">${g[1]}</b>
            <i>${g[0]}</i>
          </div>`).join('')}
      </div>
      <ul class="dm-checks">
        <li>${pick('Meta titles & descriptions', 'Meta title e description')}</li>
        <li>${pick('Sitemap + robots.txt', 'Sitemap + robots.txt')}</li>
        <li>${pick('Images compressed (WebP)', 'Immagini compresse (WebP)')}</li>
        <li>${pick('Cache & minification', 'Cache e minificazione')}</li>
        <li>${pick('Mobile Core Web Vitals', 'Core Web Vitals mobile')}</li>
      </ul>`;

    let timers = [];
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const run = () => {
      clear();
      $$('.dm-gauge .g-val', host).forEach(c => { c.style.strokeDashoffset = '163.4'; });
      $$('.dm-gauge b', host).forEach(b => { b.textContent = b.dataset.from; });
      $$('.dm-checks li', host).forEach(li => li.classList.remove('on'));
      timers.push(setTimeout(() => {
        $$('.dm-gauge .g-val', host).forEach(c => { c.style.strokeDashoffset = '0'; });
        $$('.dm-gauge b', host).forEach((b, i) => {
          const from = +b.dataset.from, to = +b.dataset.final;
          const t0 = performance.now();
          const tick = () => {
            const p = Math.min(1, (performance.now() - t0) / 900);
            b.textContent = Math.round(from + (to - from) * p);
            if (p < 1) timers.push(setTimeout(tick, 30));
          };
          timers.push(setTimeout(tick, i * 90));
        });
        $$('.dm-checks li', host).forEach((li, i) =>
          timers.push(setTimeout(() => li.classList.add('on'), 250 + i * 160)));
      }, 250));
    };
    $('#dm-seo-run', host).addEventListener('click', run);
    timers.push(setTimeout(run, 500));
    return clear;
  };

  /* 06 · 3D & Motion — WebGL stage ------------------------- */
  const d3d = host => {
    host.className = 'demo dm-3d';
    host.innerHTML = `<span class="dm-hint">${pick('Drag to spin · WebGL', 'Trascina per ruotare · WebGL')}</span>`;

    let raf = 0, ro = null, renderer = null;
    let inner = null;      /* cleanup of the three.js scene */
    let disposed = false;  /* demo left the stage before three.js arrived */

    const fallback = () => {
      if (disposed) return;
      host.insertAdjacentHTML('afterbegin', '<div class="dm-3d-fallback"><span></span></div>');
    };

    const init = () => {
      if (!window.THREE) { fallback(); return null; }
      try {
        const w = host.clientWidth || 800, h = host.clientHeight || 520;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(46, w / h, 0.1, 100);
        camera.position.z = 4.2;
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        renderer.setSize(w, h);
        host.prepend(renderer.domElement);

        const geo = new THREE.IcosahedronGeometry(1.5, 1);
        const mat = new THREE.MeshBasicMaterial({ color: 0x7c3aed, wireframe: true, transparent: true, opacity: 0.9 });
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);

        const core = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.8, 0),
          new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.55 })
        );
        scene.add(core);

        const N = 320, pos = new Float32Array(N * 3);
        for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 22;
        const stars = new THREE.Points(
          new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)),
          new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.65 })
        );
        scene.add(stars);

        let drag = false, px = 0, py = 0, vx = 0.004, vy = 0.002;
        const down = e => { drag = true; px = e.clientX; py = e.clientY; };
        const move = e => {
          if (!drag) return;
          vy = (e.clientX - px) * 0.006; vx = (e.clientY - py) * 0.006;
          px = e.clientX; py = e.clientY;
        };
        const up = () => { drag = false; };
        host.addEventListener('pointerdown', down);
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);

        const loop = () => {
          raf = requestAnimationFrame(loop);
          if (!drag) {
            vx *= 0.985; vy *= 0.985;
            if (Math.abs(vx) < 0.002) vx = 0.002;
            if (Math.abs(vy) < 0.003) vy = 0.003;
          }
          mesh.rotation.x += vx; mesh.rotation.y += vy;
          core.rotation.x -= vx * 0.6; core.rotation.y -= vy * 0.8;
          stars.rotation.y += 0.0004;
          renderer.render(scene, camera);
        };
        loop();

        ro = new ResizeObserver(() => {
          const nw = host.clientWidth, nh = host.clientHeight;
          if (!nw || !nh) return;
          camera.aspect = nw / nh; camera.updateProjectionMatrix();
          renderer.setSize(nw, nh);
        });
        ro.observe(host);

        return () => {
          cancelAnimationFrame(raf);
          host.removeEventListener('pointerdown', down);
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          if (ro) ro.disconnect();
          geo.dispose(); mat.dispose();
          if (renderer) {
            renderer.dispose();
            if (renderer.forceContextLoss) renderer.forceContextLoss();
            renderer.domElement.remove();
          }
        };
      } catch (e) {
        console.warn('[nicoz] demos: WebGL failed', e);
        fallback();
        return null;
      }
    };

    if (window.THREE) {
      inner = init();
    } else {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload = () => { if (!disposed) inner = init(); };
      s.onerror = fallback;
      document.head.appendChild(s);
    }

    return () => {
      disposed = true;
      if (inner) { inner(); inner = null; }
    };
  };

  /* 07 · CMS & Admin Panel — edit → live preview ----------- */
  const dCms = host => {
    host.className = 'demo dm-cms';
    const items = [
      { emoji: '🍕', name: pick('Margherita', 'Margherita'), price: 7 },
      { emoji: '🍝', name: pick('Carbonara', 'Carbonara'), price: 9 },
      { emoji: '🥗', name: pick('Insalata mista', 'Insalata mista'), price: 6 },
      { emoji: '🍮', name: pick('Dolce del giorno', 'Dolce del giorno'), price: 5 }
    ];
    const state = items.map(it => ({ price: it.price, on: true }));

    host.innerHTML = `
      <div class="dm-cms-admin">
        <h4>${pick('Admin panel — no code needed', 'Pannello admin — senza codice')}</h4>
        ${items.map((it, i) => `
          <div class="dm-cms-row">
            <label>${it.emoji} ${it.name}</label>
            <input type="number" min="0" step="0.5" value="${it.price}" data-i="${i}" aria-label="${it.name}" />
            <button type="button" class="dm-sw on" data-i="${i}" aria-label="${it.name} available"></button>
          </div>`).join('')}
        <p class="dm-cms-note">${pick('↑ Edit prices, toggle items — the storefront updates live.',
                                      '↑ Modifica prezzi e disponibilità — la vetrina si aggiorna live.')}</p>
      </div>
      <div class="dm-cms-store">
        <h4>${pick('Live storefront', 'Vetrina live')}</h4>
        ${items.map((it, i) => `
          <div class="dm-cms-card" data-card="${i}">
            <span>${it.emoji}</span><b>${it.name}</b>
            <span class="dm-price" data-price="${i}">€${it.price.toFixed(2)}</span>
            <span class="dm-sold" data-sold="${i}" hidden>${pick('Sold out', 'Esaurito')}</span>
          </div>`).join('')}
      </div>`;

    const onInput = e => {
      const inp = e.target.closest('input[data-i]');
      if (inp) {
        const i = +inp.dataset.i;
        let v = parseFloat(inp.value);
        if (isNaN(v) || v < 0) v = 0;
        state[i].price = v;
        $('[data-price="' + i + '"]', host).textContent = '€' + v.toFixed(2);
      }
      const sw = e.target.closest('.dm-sw');
      if (sw) {
        const i = +sw.dataset.i;
        state[i].on = !state[i].on;
        sw.classList.toggle('on', state[i].on);
        $('[data-card="' + i + '"]', host).classList.toggle('off', !state[i].on);
        $('[data-sold="' + i + '"]', host).hidden = state[i].on;
      }
    };
    host.addEventListener('click', onInput);
    host.addEventListener('input', onInput);
    return () => {
      host.removeEventListener('click', onInput);
      host.removeEventListener('input', onInput);
    };
  };

  /* 08 · E-commerce storefront — cart + WhatsApp order ----- */
  const dShop = host => {
    host.className = 'demo dm-shop';
    const items = [
      { emoji: '👟', name: 'Kickz Runner', price: 79 },
      { emoji: '🧥', name: pick('Hoodie Classic', 'Felpa Classic'), price: 59 },
      { emoji: '🧢', name: pick('Cap Snapback', 'Cappellino Snapback'), price: 25 },
      { emoji: '🧦', name: pick('Sock pack ×3', 'Calzini ×3'), price: 12 }
    ];
    let cart = [];
    host.innerHTML = `
      <div class="dm-shop-bar">
        <b>Kickz Store</b>
        <span>${pick('Pay on WhatsApp · no fees', 'Paga su WhatsApp · senza commissioni')}</span>
      </div>
      <div class="dm-grid">
        ${items.map((it, i) => `
          <div class="dm-item">
            <span class="dm-emo">${it.emoji}</span>
            <b>${it.name}</b>
            <span class="dm-price">${fmt(it.price)}</span>
            <button type="button" data-add="${i}">${pick('+ Add to cart', '+ Aggiungi')}</button>
          </div>`).join('')}
      </div>
      <div class="dm-cart-msg" id="dm-cart-msg"></div>
      <div class="dm-cart">
        <span class="dm-count" id="dm-count">${pick('Cart · empty', 'Carrello · vuoto')}</span>
        <span class="dm-total" id="dm-total"></span>
        <button type="button" class="dm-btn dm-wa" id="dm-checkout">${pick('Checkout on WhatsApp', 'Checkout su WhatsApp')} 💬</button>
      </div>`;

    const total = () => cart.reduce((s, i) => s + items[i].price, 0);
    const sync = () => {
      $('#dm-count', host).textContent = cart.length
        ? pick('Cart · ' + cart.length + ' item(s)', 'Carrello · ' + cart.length + ' articolo/i')
        : pick('Cart · empty', 'Carrello · vuoto');
      $('#dm-total', host).textContent = cart.length ? '· ' + fmt(total()) : '';
    };
    const msg = $('#dm-cart-msg', host);
    let hideT = 0;

    const onClick = e => {
      const add = e.target.closest('[data-add]');
      if (add) {
        cart.push(+add.dataset.add);
        sync();
        msg.textContent = pick('✓ Added! Cart total: ', '✓ Aggiunto! Totale carrello: ') + fmt(total());
        msg.classList.add('on');
        clearTimeout(hideT);
        hideT = setTimeout(() => msg.classList.remove('on'), 1600);
        return;
      }
      if (e.target.closest('#dm-checkout')) {
        if (!cart.length) {
          msg.textContent = pick('Your cart is empty — add something first! 🛒',
                                'Il carrello è vuoto — aggiungi qualcosa! 🛒');
        } else {
          const lines = cart.map(i => '• ' + items[i].name + ' — ' + fmt(items[i].price));
          msg.textContent = pick('WhatsApp order preview:\n', 'Anteprima ordine WhatsApp:\n') +
            lines.join('\n') + '\n*Total ' + fmt(total()) + '*';
        }
        msg.classList.add('on');
        clearTimeout(hideT);
        hideT = setTimeout(() => msg.classList.remove('on'), 3200);
      }
    };
    host.addEventListener('click', onClick);
    sync();
    return () => {
      clearTimeout(hideT);
      host.removeEventListener('click', onClick);
    };
  };

  /* 09 · Support & Maintenance — ops dashboard ------------- */
  const dOps = host => {
    host.className = 'demo dm-ops';
    const bars = [];
    for (let i = 0; i < 30; i++) bars.push(i === 18 ? 'warn' : 'ok');
    host.innerHTML = `
      <div class="dm-ops-top">
        <div class="dm-ops-stat"><i>${pick('Uptime 30d', 'Uptime 30g')}</i><b>99.98%</b></div>
        <div class="dm-ops-stat"><i>${pick('Avg response', 'Risposta media')}</i><b id="dm-avg" style="--gv:#22d3ee;">214ms</b></div>
        <div class="dm-ops-stat"><i>${pick('Incidents', 'Incidenti')}</i><b style="--gv:#fbbf24;">1</b></div>
      </div>
      <div class="dm-ops-bars">
        ${bars.map((b, i) => `<span class="${b === 'warn' ? 'warn' : ''}" style="animation-delay:${i * 22}ms"></span>`).join('')}
      </div>
      <div class="dm-ops-chart">
        <span class="dm-hint">${pick('Response time · last 60s', 'Tempo di risposta · ultimi 60s')}</span>
        <canvas id="dm-spark" width="640" height="74"></canvas>
      </div>
      <ul class="dm-ops-list">
        <li>${pick('Weekly backups verified', 'Backup settimanali verificati')}</li>
        <li>${pick('Dependencies updated', 'Dipendenze aggiornate')}</li>
        <li>${pick('SSL renewed automatically', 'SSL rinnovato automaticamente')}</li>
      </ul>`;

    const cv = $('#dm-spark', host);
    const ctx = cv.getContext('2d');
    const data = Array.from({ length: 48 }, () => 150 + Math.random() * 130);
    let timer = 0;

    const draw = () => {
      const w = cv.width, h = cv.height;
      ctx.clearRect(0, 0, w, h);
      const min = Math.min(...data) - 20, max = Math.max(...data) + 20;
      ctx.beginPath();
      data.forEach((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / (max - min)) * (h - 12) - 6;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(34,211,238,.28)');
      g.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = g;
      ctx.fill();
    };
    const tick = () => {
      data.push(150 + Math.random() * 130);
      data.shift();
      draw();
      $('#dm-avg', host).textContent = Math.round(data.reduce((a, b) => a + b, 0) / data.length) + 'ms';
    };
    draw();
    timer = setInterval(tick, 1200);
    return () => clearInterval(timer);
  };

  /* ══════════════════════════════════════════════════════
     REGISTRY + PAGE WIRING
  ══════════════════════════════════════════════════════ */
  const DEMOS = {
    'one-page-landing':    { url: 'orbit-coffee.nicoz.app', build: dLanding },
    'static-website':      { url: 'mammarosa.example.it',   build: dSite    },
    'custom-design':       { url: 'before-after.nicoz.app', build: dDesign  },
    'brand-kit':           { url: 'brandboard.nicoz.app',   build: dBrand   },
    'seo-speed':           { url: 'audit.nicoz.app',        build: dSeo     },
    '3d-motion':           { url: 'orbit.nicoz.app',        build: d3d      },
    'cms-admin':           { url: 'admin.pizzeria.example', build: dCms     },
    'ecommerce':           { url: 'kickz.example.shop',     build: dShop    },
    'support-maintenance': { url: 'status.nicoz.app',       build: dOps     }
  };

  /* keep the current file name when pushing the ?product= param */
  const currentFile = () => location.pathname.substring(location.pathname.lastIndexOf('/') + 1) || 'demo';

  const waText = p => {
    const L = loc(p);
    const price = fmt(p.price) + (p.billing === 'monthly' ? pick('/month', '/mese') : '');
    return lang() === 'it'
      ? 'Ciao Nicoz! Ho visto la demo di ' + L.name + ' — la voglio. (' + price + ')'
      : 'Hi Nicoz! I saw the ' + L.name + ' demo — I want one. (' + price + ')';
  };

  function show(next, first) {
    if (!ready) return;
    const d = DEMOS[next];
    const p = bySlug()[next];
    if (!d || !p) return;

    if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
    slug = next;
    const L = loc(p);

    /* header */
    $('#d-title').innerHTML = p.emoji + ' ' + L.name;
    $('#d-sub').textContent = L.description || L.tagline || '';
    const catLabel = (CATEGORY_LABEL[p.category] || [p.category, p.category]);
    $('#d-badges').innerHTML = [
      '<span class="b-price">' + fmt(p.price) +
        (p.billing === 'monthly' ? pick('/month', '/mese') : pick(' one-time', ' una tantum')) + '</span>',
      '<span>' + pick('Delivery', 'Consegna') + ': ' + p.delivery + '</span>',
      '<span>' + pick('Category', 'Categoria') + ': ' + pick(catLabel[0], catLabel[1]) + '</span>',
      '<span>' + pick('Fully interactive', 'Completamente interattiva') + '</span>'
    ].join('');
    document.title = 'Nicoz — ' + L.name + ' · ' + pick('Live demo', 'Demo dal vivo');

    /* frame chrome */
    $('#d-url').textContent = d.url;
    $('#d-tag').textContent = pick('interactive', 'interattiva');

    /* CTAs */
    $('#d-order').href = 'https://wa.me/' + contact.whatsapp +
      '?text=' + encodeURIComponent(waText(p));
    $('#d-order-label').textContent = pick('Order this', 'Ordina questo');
    $('#d-build').textContent = pick('Request it', 'Richiedilo');
    $('#d-build').href = 'build?product=' + encodeURIComponent(p.slug);
    $('#d-note').textContent = pick(
      'This demo was built by hand — no templates, like every real project.',
      'Questa demo è stata costruita a mano — niente template, come ogni progetto reale.');

    /* stage: fresh host for every demo */
    view.innerHTML = '';
    const host = document.createElement('div');
    host.className = 'demo';
    view.appendChild(host);
    cleanup = d.build(host) || null;

    /* switcher state */
    $$('#d-switcher button').forEach(b =>
      b.classList.toggle('active', b.dataset.slug === next));

    /* URL */
    if (!first) {
      history.pushState({ slug: next }, '',
        currentFile() + '?product=' + encodeURIComponent(next));
    }
  }

  function renderSwitcher() {
    const wrap = $('#d-switcher');
    if (!wrap) return;
    wrap.innerHTML = demoProducts().map(p =>
      '<button type="button" data-slug="' + p.slug + '">' + p.emoji + ' ' + loc(p).name +
      '<span class="ds-price">' + fmt(p.price) + '</span></button>').join('');
    $$('#d-switcher button').forEach(b =>
      b.classList.toggle('active', b.dataset.slug === slug));
  }

  $('#d-switcher').addEventListener('click', e => {
    const b = e.target.closest('button[data-slug]');
    if (b && b.dataset.slug !== slug) {
      show(b.dataset.slug);
      $('#d-frame').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  window.addEventListener('popstate', () => show(currentSlug(), true));

  /* language switch → rebuild everything */
  window.addEventListener('nicoz:lang', () => {
    show(slug || currentSlug(), true);
    renderSwitcher();
  });

  /* load the catalog, then paint */
  fetch('products.json', { cache: 'no-cache' })
    .then(r => r.json())
    .then(d => {
      products = d.products || [];
      if (d.contact) contact = d.contact;
      ready = true;
      show(currentSlug(), true);
      renderSwitcher();
    })
    .catch(err => {
      console.error('[nicoz] demos: products.json failed', err);
      view.innerHTML = '<div class="demo dm-seo"><h3>' +
        pick('Demo unavailable', 'Demo non disponibile') + '</h3>' +
        '<p class="dm-sub">' + pick('Reload the page, or ask on WhatsApp.',
        'Ricarica la pagina, o scrivimi su WhatsApp.') + '</p></div>';
    });

})();
