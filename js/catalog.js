/* ═══════════════════════════════════════════════════════════
   NICOZ — CATALOGO
   Renders products + bundles from products.json / bundles.json.
   Categories: website / discord / telegram / app (filter tabs).
   Localized: static JSON fields use the `it` block when
   window.NicozI18N.lang === 'it' (falls back to English), and
   everything re-renders on the `nicoz:lang` event.
   Falls back to a friendly error state if the JSON is missing.
   Also powers the dark/light reading toggle (catalog page only).
   ═══════════════════════════════════════════════════════════ */
(async () => {

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const hasI18N  = () => typeof window.NicozI18N !== 'undefined';
  const lang     = () => (hasI18N() ? window.NicozI18N.lang : 'en');
  const pick     = (en, it) => (lang() === 'it' ? it : en);

  const DEFAULT_CONTACT = {
    email: 'info@nicozdev.online',
    pec: 'help@pec.nicozdev.shop',
    whatsapp: '18734741519',
    whatsappDisplay: '+1 (873) 474-1519'
  };

  const CATEGORY_LABELS = {
    en: { all: 'All', website: 'Website', discord: 'Discord', telegram: 'Telegram', app: 'App' },
    it: { all: 'Tutti', website: 'Website', discord: 'Discord', telegram: 'Telegram', app: 'App' }
  };
  const CATEGORY_ORDER = ['all', 'website', 'discord', 'telegram', 'app'];

  let contact = { ...DEFAULT_CONTACT };
  let products = [];
  let bundles  = [];
  let updated  = null;
  let categoryTags = [];
  let failed   = false;

  const loadJSON = async (url) => {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(url + ' → ' + res.status);
    return res.json();
  };

  try {
    const [p, b] = await Promise.all([
      loadJSON('products.json'),
      loadJSON('bundles.json')
    ]);
    products = Array.isArray(p.products) ? p.products : [];
    bundles  = Array.isArray(b.bundles)  ? b.bundles  : [];
    updated  = p.updated || null;
    categoryTags = Array.isArray(p.categories)
      ? p.categories.filter(c => CATEGORY_LABELS.en[c])
      : null;
    if (p.contact) contact = p.contact;
  } catch (err) {
    console.error('[nicoz] catalog load failed:', err);
    failed = true;
  }

  const fmt = n => '$' + n;

  /* localized view of a product/bundle: the `it` block overrides
     name/tagline/description/includes/upsell when lang === 'it' */
  const loc = o => (lang() === 'it' && o.it) ? { ...o, ...o.it } : o;

  const waLink = text =>
    'https://wa.me/' + contact.whatsapp + '?text=' + encodeURIComponent(text);

  const ICON_ARROW =
    '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
    '<path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.19L10.47 5.53a.75.75 0 111.06-1.06l5 5a.75.75 0 010 1.06l-5 5a.75.75 0 11-1.06-1.06l3.47-3.47H3.75A.75.75 0 013 10z" clip-rule="evenodd"/></svg>';

  const ICON_WA =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

  const productCard = prod => {
    const p = loc(prod);
    const badge = p.billing === 'monthly'
      ? pick('per month', 'al mese')
      : pick('one-time', 'una tantum');
    const waMsg = lang() === 'it'
      ? 'Ciao Nicoz! Vorrei ordinare: ' + p.name +
        ' (' + fmt(p.price) + (p.billing === 'monthly' ? '/mese' : '') + ').'
      : 'Hi Nicoz! I am interested in ' + p.name +
        ' (' + fmt(p.price) + (p.billing === 'monthly' ? '/month' : '') + ').';
    const upsell = p.upsell
      ? '<span class="c-card-upsell">' + p.upsell + '</span>' : '';
    const demoLink = prod.demo
      ? '<a class="c-card-demo" href="demo?product=' + encodeURIComponent(prod.slug) + '">' +
          '<span class="c-demo-dot" aria-hidden="true"></span>' +
          pick('Live demo', 'Demo dal vivo') +
        '</a>'
      : '';
    return (
      '<article class="c-card">' +
        '<span class="c-card-emoji" aria-hidden="true">' + p.emoji + '</span>' +
        '<h3>' + p.name + '</h3>' +
        '<p class="c-card-tagline">' + p.description + '</p>' +
        '<ul class="c-card-includes">' +
          p.includes.map(i => '<li>' + i + '</li>').join('') +
        '</ul>' +
        upsell +
        '<div class="c-card-price">' +
          '<span class="price">' + fmt(p.price) + '</span>' +
          '<span class="c-badge">' + badge + ' · ' + p.delivery + '</span>' +
        '</div>' +
        demoLink +
        '<div class="c-card-actions">' +
          '<a class="btn btn-solid" target="_blank" rel="noopener"' +
             ' aria-label="Order ' + p.name + ' on WhatsApp"' +
             ' href="' + waLink(waMsg) + '">' + pick('Order', 'Ordina') +
             ICON_ARROW +
          '</a>' +
          '<a class="btn btn-ghost" href="build?product=' + encodeURIComponent(prod.slug) + '">' +
            pick('Request it', 'Richiedilo') +
          '</a>' +
        '</div>' +
      '</article>'
    );
  };

  /* ── category filter + product grid ──────────────────── */
  let currentFilter = 'all';
  const productsGrid = $('#c-products');
  const filterWrap   = $('#c-filter');

  const availableCategories = (categoryTags || CATEGORY_ORDER.slice(1))
    .filter(c => products.some(p => p.category === c));

  const catLabel = cat =>
    CATEGORY_LABELS[lang()] && CATEGORY_LABELS[lang()][cat] || CATEGORY_LABELS.en[cat];

  const renderFilter = () => {
    if (!filterWrap) return;
    const counts = cat => cat === 'all'
      ? products.length
      : products.filter(p => p.category === cat).length;
    const tabs = ['all', ...availableCategories];
    filterWrap.innerHTML = tabs.map(cat =>
      '<button type="button" class="cf-btn' +
      (cat === currentFilter ? ' active' : '') + '"' +
      ' data-cat="' + cat + '"' +
      ' role="tab" aria-selected="' + (cat === currentFilter ? 'true' : 'false') + '">' +
        catLabel(cat) +
        '<span class="cf-count">' + counts(cat) + '</span>' +
      '</button>'
    ).join('');
  };

  const renderProducts = () => {
    if (!productsGrid) return;
    if (failed) {
      productsGrid.innerHTML =
        '<div class="c-card"><h3>' + pick('Catalog unavailable', 'Catalogo non disponibile') + '</h3>' +
        '<p class="c-card-tagline">' +
        pick('Could not load the catalog. Please refresh the page, or reach out on WhatsApp.',
             'Non è stato possibile caricare il catalogo. Ricarica la pagina, o scrivimi su WhatsApp.') +
        '</p>' +
        '<div class="c-card-actions"><a class="btn btn-solid" target="_blank" rel="noopener" ' +
        'href="' + waLink(pick('Hi Nicoz! Your catalog page did not load for me.',
                              'Ciao Nicoz! La pagina catalogo non mi ha caricato.')) +
        '">WhatsApp</a></div></div>';
      return;
    }
    const shown = currentFilter === 'all'
      ? products
      : products.filter(p => p.category === currentFilter);
    productsGrid.innerHTML = shown.map(productCard).join('');
  };

  const renderMeta = () => {
    const meta = $('#c-product-meta');
    if (!meta) return;
    meta.textContent =
      products.length + ' ' + pick('services', 'servizi') +
      (updated ? (lang() === 'it' ? ' · aggiornato ' + updated : ' · updated ' + updated) : '');
  };

  const renderAll = () => {
    renderFilter();
    renderProducts();
    renderMeta();
    renderBundles();
  };

  if (filterWrap) {
    filterWrap.addEventListener('click', e => {
      const btn = e.target.closest('.cf-btn');
      if (!btn) return;
      currentFilter = btn.dataset.cat || 'all';
      renderFilter();
      renderProducts();
    });
  }

  /* ── render bundles ──────────────────────────────────── */
  const bundlesGrid = $('#c-bundles');

  const renderBundles = () => {
    if (!bundlesGrid || failed) return;
    const bySlug = Object.fromEntries(products.map(p => [p.slug, p]));
    bundlesGrid.innerHTML = bundles.map(raw => {
      const bundle = loc(raw);
      const items = (raw.includes || [])
        .map(s => bySlug[s]).filter(Boolean);
      const value = items.reduce((sum, p) => sum + p.price, 0);
      const save  = value - raw.price;
      const featured = raw.slug === 'full-stack' ? ' is-featured' : '';
      return (
        '<article class="c-bundle' + featured + '">' +
          '<div class="c-bundle-top">' +
            '<span class="c-bundle-emoji" aria-hidden="true">' + raw.emoji + '</span>' +
            '<div><p class="c-bundle-tag">' +
              pick('Bundle', 'Bundle') + ' · ' + pick('save', 'risparmi') + ' ' + fmt(save) + '</p>' +
            '<h3>' + bundle.name + '</h3></div>' +
          '</div>' +
          '<p class="c-bundle-desc">' + (bundle.tagline || '') + '</p>' +
          '<ul class="c-bundle-items">' +
            items.map(p => {
              const l = loc(p);
              return '<li><b>' + l.name + '</b><i>' + fmt(p.price) + '</i></li>';
            }).join('') +
          '</ul>' +
          '<div class="c-bundle-price">' +
            '<span class="price">' + fmt(raw.price) + '</span>' +
            (save > 0 ? '<span class="c-save">' + pick('Save', 'Risparmi') + ' ' + fmt(save) + '</span>' : '') +
            (value > raw.price ? '<span class="c-was">' + fmt(value) + '</span>' : '') +
          '</div>' +
          '<div class="c-card-actions">' +
            '<a class="btn btn-solid" target="_blank" rel="noopener"' +
               ' href="' + waLink(lang() === 'it'
                 ? 'Ciao Nicoz! Vorrei ordinare il bundle ' + bundle.name + ' (' + fmt(raw.price) + ').'
                 : 'Hi Nicoz! I am interested in the ' + bundle.name + ' bundle (' + fmt(raw.price) + ').') +
               '">' +
              'WhatsApp' + ICON_WA +
            '</a>' +
            '<a class="btn btn-ghost" href="build?bundle=' + encodeURIComponent(raw.slug) + '">' +
              pick('Request it', 'Richiedilo') +
            '</a>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  };

  renderAll();

  /* ── reading theme toggle (catalog page only) ────────── */
  const main = $('.c-main');
  const THEME_KEY = 'nicoz-catalog-theme';
  const btns = $$('.c-theme button');
  if (main && btns.length) {
    const apply = theme => {
      main.classList.toggle('light', theme === 'light');
      btns.forEach(b =>
        b.classList.toggle('active', b.dataset.themeChoice === theme));
    };
    btns.forEach(b => b.addEventListener('click', () => {
      const theme = b.dataset.themeChoice || 'dark';
      apply(theme);
      try { localStorage.setItem(THEME_KEY, theme); } catch { /* private mode */ }
    }));
    let saved = 'dark';
    try { saved = localStorage.getItem(THEME_KEY) || 'dark'; } catch { /* */ }
    apply(saved);
  }

  /* ── live language switch: re-render everything ───────── */
  window.addEventListener('nicoz:lang', renderAll);

})();
