/* ═══════════════════════════════════════════════════════════
   NICOZ — BUILD YOUR IDEA (wizard)
   3 steps: products → project details → contact.
   Works fully statically: validates, builds a reference id,
   and hands the visitor a pre-filled WhatsApp message.
   Draft autosaves to localStorage between steps/reloads.
   API_BASE reserved for a future backend: when set, the
   request is POSTed there and the server-side ref is used.
   Localized via window.NicozI18N (EN default, IT switch):
   option labels, review, validation + WhatsApp message follow
   the active language and re-render on the `nicoz:lang` event.
   ═══════════════════════════════════════════════════════════ */
(async () => {

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const API_BASE = ''; // e.g. "https://nicoz-api.vercel.app" — future backend

  const DEFAULT_CONTACT = {
    email: 'info@nicozdev.online',
    pec: 'help@pec.nicozdev.shop',
    whatsapp: '18734741519',
    whatsappDisplay: '+1 (873) 474-1519'
  };

  const DRAFT_KEY = 'nicoz-idea-draft-v1';
  const DESC_MAX  = 500;
  const FILE_MAX  = 5 * 1024 * 1024; // 5 MB

  /* option VALUES stay language-independent keys; labels localize */
  const BUDGET_KEYS = ['under100', '100-300', '300-600', '600plus'];
  const YESNO = [
    { v: 'yes',    en: 'Yes',           it: 'Sì' },
    { v: 'no',     en: 'No',            it: 'No' },
    { v: 'unsure', en: 'Not sure yet',  it: 'Non lo so ancora' }
  ];
  const BUDGETS = [
    { v: 'under100', en: 'Under $100',  it: 'Sotto i $100' },
    { v: '100-300',  en: '$100–$300',   it: '$100–$300'    },
    { v: '300-600',  en: '$300–$600',   it: '$300–$600'    },
    { v: '600plus',  en: '$600+',       it: '$600+'        }
  ];
  const CHANNELS = [
    { v: 'whatsapp', en: 'WhatsApp', it: 'WhatsApp' },
    { v: 'email',    en: 'Email',    it: 'Email'    },
    { v: 'telegram', en: 'Telegram', it: 'Telegram' }
  ];

  const hasI18N = () => typeof window.NicozI18N !== 'undefined';
  const lang    = () => (hasI18N() ? window.NicozI18N.lang : 'en');
  const pick    = (en, it) => (lang() === 'it' ? it : en);

  /* localized product view: reads products.json `it` block */
  const loc = o => (lang() === 'it' && o.it) ? { ...o, ...o.it } : o;

  const labelOf = (list, v) => {
    const found = list.find(x => x.v === v);
    return found ? pick(found.en, found.it) : '—';
  };

  const T = { /* runtime sentences */
    selected  : { en: ' selected',        it: ' selezionati' },
    attFile   : { en: 'Attach optional file', it: 'Allega un file (opzionale)' },
    tooLarge  : { en: 'File too large (max 5 MB).', it: 'File troppo grande (max 5 MB).' },
    att       : { en: ' Attached (',      it: ' Allegato (' },
    notSpec   : { en: 'Not specified',    it: 'Non specificato' },
    est       : { en: 'Estimate',         it: 'Stima' },
    dtProject : { en: 'Project',          it: 'Progetto' },
    dtIdea    : { en: 'Idea',             it: 'Idea' },
    dtDesign  : { en: 'Design',           it: 'Design' },
    dtDomain  : { en: 'Domain',           it: 'Dominio' },
    dtLaunch  : { en: 'Launch',           it: 'Lancio' },
    dtBudget  : { en: 'Budget',           it: 'Budget' },
    dtFile    : { en: 'File',             it: 'File' },
    waTitle   : { en: 'New idea request', it: 'Nuova richiesta idea' },
    waProd    : { en: 'Products',         it: 'Prodotti' },
    waEst     : { en: 'Estimate',         it: 'Stima' },
    waProj    : { en: 'Project',          it: 'Progetto' },
    waDesign  : { en: 'Design/mockup',    it: 'Design/bozza' },
    waDomain  : { en: 'Domain/hosting',   it: 'Dominio/hosting' },
    waLaunch  : { en: 'Launch date',      it: 'Data di lancio' },
    waFile    : { en: 'Mockup file ready: I will attach it in the chat',
                  it: 'File bozza pronto: lo allego nella chat' },
    waFrom    : { en: 'From',             it: 'Da' },
    waChannel : { en: 'Preferred contact', it: 'Contatto preferito' },
    waNotes   : { en: 'Notes',            it: 'Note' },
    mailSub   : { en: 'Idea request',     it: 'Richiesta idea'    },
    mo        : { en: '/mo',              it: '/mese' }
  };

  /* ── data ─────────────────────────────────────────────── */
  let contact = { ...DEFAULT_CONTACT };
  let products = [];
  let bundles  = [];
  let file = null;

  const state = {
    productSlugs: [],
    projectName: '',
    description: '',
    design: '',
    domain: '',
    date: '',
    budget: '',
    name: '',
    email: '',
    phone: '',
    channel: 'whatsapp',
    notes: ''
  };

  try {
    const res = await fetch('products.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    products = data.products || [];
    if (data.contact) contact = data.contact;
  } catch (err) {
    console.error('[nicoz] product list load failed:', err);
  }
  try {
    const res = await fetch('bundles.json', { cache: 'no-cache' });
    if (res.ok) bundles = (await res.json()).bundles || [];
  } catch { /* bundles optional here */ }

  /* ── elements ─────────────────────────────────────────── */
  const wiz      = $('#wiz');
  const panels   = $$('.wiz-panel');
  const progress = $$('.wiz-progress .wp-item');

  /* ── helpers ──────────────────────────────────────────── */
  const fmt = n => '$' + n;

  const chosenProducts = () =>
    state.productSlugs
      .map(slug => products.find(p => p.slug === slug))
      .filter(Boolean);

  const estimate = () => {
    const all = chosenProducts();
    const oneTime = all.filter(p => p.billing !== 'monthly')
                       .reduce((s, p) => s + p.price, 0);
    const monthly = all.filter(p => p.billing === 'monthly')
                       .reduce((s, p) => s + p.price, 0);
    return { oneTime, monthly };
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        ...state, _ts: Date.now()
      }));
    } catch { /* private mode */ }
  };

  const loadDraft = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (saved && Array.isArray(saved.productSlugs)) Object.assign(state, saved);
    } catch { /* */ }
  };

  const nextRef = () => {
    let seq = 0;
    try {
      seq = (parseInt(localStorage.getItem('nicoz-idea-seq') || '0', 10) || 0) + 1;
      localStorage.setItem('nicoz-idea-seq', String(seq));
    } catch { seq = 1; }
    return '#IDEA-' + String(seq).padStart(4, '0');
  };

  const showFieldError = (inputId, msgId, show) => {
    const input = inputId ? $(inputId) : null;
    const err   = $(msgId);
    if (input) input.classList.toggle('invalid', show);
    if (err) err.classList.toggle('show', show);
  };

  const scrollWizardIntoView = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (wiz) wiz.scrollIntoView(
      { behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  /* ── step navigation ──────────────────────────────────── */
  let step = 1;

  const goTo = n => {
    step = n;
    if (n === 3) renderReview();
    panels.forEach(p =>
      p.classList.toggle('active', p.dataset.step === String(n)));
    progress.forEach(p => {
      const i = +p.dataset.step;
      p.classList.toggle('active', i === n);
      p.classList.toggle('done', i < n);
    });
    scrollWizardIntoView();
  };

  $$('.wiz-next').forEach(b =>
    b.addEventListener('click', () => { if (validateStep(step)) goTo(step + 1); }));
  $$('.wiz-back').forEach(b =>
    b.addEventListener('click', () => goTo(step - 1)));
  progress.forEach(p => p.addEventListener('click', () => {
    const target = +p.dataset.step;
    if (target < step) goTo(target);
    else if (target > step && validateStep(step)) goTo(target);
  }));

  /* ── step 1: product chips ────────────────────────────── */
  const chipsWrap = $('#wiz-chips');

  const renderChips = () => {
    if (!chipsWrap) return;
    chipsWrap.innerHTML = products.map(raw => {
      const p = loc(raw);
      return (
        '<button type="button" class="wiz-chip" data-slug="' + raw.slug + '">' +
          '<span class="wiz-chip-emoji" aria-hidden="true">' + raw.emoji + '</span>' +
          '<span class="wiz-chip-info"><b>' + p.name + '</b>' +
          '<i>' + p.tagline + '</i></span>' +
          '<span class="wiz-chip-price">' + fmt(raw.price) +
          (raw.billing === 'monthly' ? pick('/mo', '/mese') : '') + '</span>' +
          '<span class="wiz-chip-check">✓</span>' +
        '</button>'
      );
    }).join('');
    syncChips();
  };

  const syncChips = () => { if (chipsWrap) $$('.wiz-chip', chipsWrap).forEach(chip =>
    chip.classList.toggle('selected', state.productSlugs.includes(chip.dataset.slug))); };

  const syncChipCount = () => {
    const el = $('#wiz-chip-count');
    if (el) el.textContent = state.productSlugs.length + pick(T.selected.en, T.selected.it);
  };

  if (chipsWrap) {
    chipsWrap.addEventListener('click', e => {
      const chip = e.target.closest('.wiz-chip');
      if (!chip) return;
      const slug = chip.dataset.slug;
      const i = state.productSlugs.indexOf(slug);
      if (i >= 0) state.productSlugs.splice(i, 1);
      else state.productSlugs.push(slug);
      syncChips();
      syncChipCount();
      saveDraft();
      showFieldError(null, '#err-products', false);
    });
  }

  /* deep links: ?product=a,b & ?bundle=starter */
  loadDraft(); // draft first, deep links override it
  const params = new URLSearchParams(location.search);
  if (params.get('product')) {
    state.productSlugs = params.get('product').split(',').filter(s => s);
  }
  if (params.get('bundle')) {
    const bundle = bundles.find(b => b.slug === params.get('bundle'));
    if (bundle) state.productSlugs = [...(bundle.includes || [])];
  }

  /* ── step 2: fields + option groups ───────────────────── */
  const descEl = $('#f-desc');
  const descCount = $('#desc-count');
  if (descEl) {
    descEl.value = state.description || '';
    descCount.textContent = descEl.value.length + '/' + DESC_MAX;
    descEl.addEventListener('input', () => {
      if (descEl.value.length > DESC_MAX) descEl.value = descEl.value.slice(0, DESC_MAX);
      state.description = descEl.value;
      descCount.textContent = descEl.value.length + '/' + DESC_MAX;
      saveDraft();
      showFieldError('#f-desc', '#err-desc', false);
    });
  }

  const buildOptions = (wrapEl, list, key) => {
    if (!wrapEl) return;
    wrapEl.innerHTML = list.map(o =>
      '<button type="button" class="wiz-option" data-v="' + o.v + '">' +
      pick(o.en, o.it) + '</button>'
    ).join('');
    const sync = () => $$('.wiz-option', wrapEl).forEach(b =>
      b.classList.toggle('selected', String(state[key]) === b.dataset.v));
    if (wrapEl.dataset.bound !== '1') {
      wrapEl.addEventListener('click', e => {
        const b = e.target.closest('.wiz-option');
        if (!b) return;
        state[key] = b.dataset.v;
        sync();
        saveDraft();
      });
      wrapEl.dataset.bound = '1';
    }
    sync();
  };

  const renderOptions = () => {
    buildOptions($('#f-design'), YESNO, 'design');
    buildOptions($('#f-domain'), YESNO, 'domain');
    buildOptions($('#f-budget'), BUDGETS, 'budget');
    buildOptions($('#f-channel'), CHANNELS, 'channel');
  };

  const nameEl = $('#f-project');
  if (nameEl) nameEl.addEventListener('input', () => { state.projectName = nameEl.value; saveDraft(); });
  const dateEl = $('#f-date');
  if (dateEl) dateEl.addEventListener('change', () => { state.date = dateEl.value; saveDraft(); });
  const fileEl = $('#f-file');
  const fileLabel = $('#f-file-label');
  const setFileLabel = () => {
    if (fileLabel)
      fileLabel.textContent = file
        ? '📎 ' + file.name
        : pick(T.attFile.en, T.attFile.it);
  };
  if (fileEl) {
    fileEl.addEventListener('change', () => {
      file = fileEl.files && fileEl.files[0] ? fileEl.files[0] : null;
      if (file && file.size > FILE_MAX) {
        file = null;
        fileEl.value = '';
        $('#err-file').textContent = pick(T.tooLarge.en, T.tooLarge.it);
        $('#err-file').classList.add('show');
        return;
      }
      $('#err-file').classList.remove('show');
      setFileLabel();
      const wrap = fileEl.closest('.wiz-file');
      if (wrap) wrap.classList.toggle('hasfile', !!file);
    });
  }

  /* ── step 3: contact fields ───────────────────────────── */
  const bind = (sel, key) => {
    const el = $(sel);
    if (!el) return;
    el.value = state[key] || '';
    el.addEventListener('input', () => { state[key] = el.value; saveDraft(); });
  };
  bind('#f-name', 'name');
  bind('#f-email', 'email');
  bind('#f-phone', 'phone');
  bind('#f-notes', 'notes');

  /* ── validation ───────────────────────────────────────── */
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const validateStep = n => {
    if (n === 1) {
      if (!state.productSlugs.length) {
        showFieldError(null, '#err-products', true);
        return false;
      }
      showFieldError(null, '#err-products', false);
      return true;
    }
    if (n === 2) {
      const bad = !state.description || state.description.trim().length < 10;
      showFieldError('#f-desc', '#err-desc', bad);
      return !bad;
    }
    if (n === 3) {
      let ok = true;
      const nameBad  = !state.name || state.name.trim().length < 2;
      const mailBad  = !state.email || !emailOk(state.email.trim());
      const phoneBad = state.channel === 'whatsapp' && !state.phone.trim();
      showFieldError('#f-name',  '#err-name',  nameBad);  ok = ok && !nameBad;
      showFieldError('#f-email', '#err-email', mailBad);  ok = ok && !mailBad;
      showFieldError('#f-phone', '#err-phone', phoneBad); ok = ok && !phoneBad;
      return ok;
    }
    return true;
  };

  /* ── review + submit ──────────────────────────────────── */
  const reviewBox = '#wiz-review';

  const renderReview = () => {
    const box = $(reviewBox);
    if (!box) return;
    const { oneTime, monthly } = estimate();
    box.innerHTML =
      '<dl>' +
        (state.projectName   ? '<div><dt>' + pick(T.dtProject.en, T.dtProject.it) + '</dt><dd>' + esc(state.projectName) + '</dd></div>' : '') +
        (state.description   ? '<div><dt>' + pick(T.dtIdea.en, T.dtIdea.it) + '</dt><dd>' + esc(state.description.slice(0, 120)) +
                               (state.description.length > 120 ? '…' : '') + '</dd></div>' : '') +
        '<div><dt>' + pick(T.dtDesign.en, T.dtDesign.it) + '</dt><dd>' + labelOf(YESNO, state.design) + '</dd></div>' +
        '<div><dt>' + pick(T.dtDomain.en, T.dtDomain.it) + '</dt><dd>' + labelOf(YESNO, state.domain) + '</dd></div>' +
        (state.date          ? '<div><dt>' + pick(T.dtLaunch.en, T.dtLaunch.it) + '</dt><dd>' + esc(state.date) + '</dd></div>' : '') +
        '<div><dt>' + pick(T.dtBudget.en, T.dtBudget.it) + '</dt><dd>' +
          (state.budget ? esc(labelOf(BUDGETS, state.budget)) : pick(T.notSpec.en, T.notSpec.it)) + '</dd></div>' +
        (file                ? '<div><dt>' + pick(T.dtFile.en, T.dtFile.it) + '</dt><dd>' +
          pick(T.att.en, T.att.it) + esc(file.name) + ')</dd></div>' : '') +
      '</dl>' +
      '<div class="wiz-review-products">' +
        chosenProducts().map(raw => {
          const p = loc(raw);
          return '<div><b>' + raw.emoji + ' ' + p.name + '</b><i>' +
            fmt(raw.price) + (raw.billing === 'monthly' ? pick(T.mo.en, T.mo.it) : '') + '</i></div>';
        }).join('') +
      '</div>' +
      '<div class="wiz-review-total"><dt>' + pick(T.est.en, T.est.it) + '</dt>' +
      '<dd>' + (oneTime ? fmt(oneTime) : '—') +
        (monthly ? ' <em>+' + fmt(monthly) + pick(T.mo.en, T.mo.it) + '</em>' : '') +
      '</dd></div>';
  };

  const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const buildMessage = ref => {
    const { oneTime, monthly } = estimate();
    const mo = pick(T.mo.en, T.mo.it);
    const lines = [];
    lines.push('*' + pick(T.waTitle.en, T.waTitle.it) + ' ' + ref + '*');
    lines.push('');
    lines.push('*' + pick(T.waProd.en, T.waProd.it) + '*');
    chosenProducts().forEach(raw => {
      const p = loc(raw);
      lines.push('• ' + p.name + ' — ' + fmt(raw.price) +
        (raw.billing === 'monthly' ? mo : ''));
    });
    if (oneTime || monthly) {
      lines.push('*' + pick(T.waEst.en, T.waEst.it) + '* ' + (oneTime ? fmt(oneTime) : '') +
        (monthly ? (oneTime ? ' + ' : '') + fmt(monthly) + mo : ''));
    }
    if (state.projectName) {
      lines.push('');
      lines.push('*' + pick(T.waProj.en, T.waProj.it) + '* ' + state.projectName);
    }
    if (state.description) {
      lines.push('');
      lines.push(state.description);
    }
    lines.push('');
    lines.push('• ' + pick(T.waDesign.en, T.waDesign.it) + ': ' + labelOf(YESNO, state.design));
    lines.push('• ' + pick(T.waDomain.en, T.waDomain.it) + ': ' + labelOf(YESNO, state.domain));
    if (state.date)   lines.push('• ' + pick(T.waLaunch.en, T.waLaunch.it) + ': ' + state.date);
    if (state.budget) lines.push('• ' + pick(T.dtBudget.en, T.dtBudget.it) + ': ' + labelOf(BUDGETS, state.budget));
    if (file)         lines.push('• ' + pick(T.waFile.en, T.waFile.it));
    lines.push('');
    lines.push('*' + pick(T.waFrom.en, T.waFrom.it) + '* ' + state.name);
    lines.push('• Email: ' + state.email);
    if (state.phone) lines.push('• WhatsApp: ' + state.phone);
    lines.push('• ' + pick(T.waChannel.en, T.waChannel.it) + ': ' + labelOf(CHANNELS, state.channel));
    if (state.notes) { lines.push(''); lines.push('*' + pick(T.waNotes.en, T.waNotes.it) + '* ' + state.notes); }
    return lines.join('\n');
  };

  /* success view */
  const showSuccess = ref => {
    const msg = buildMessage(ref);
    const waHref =
      'https://wa.me/' + contact.whatsapp + '?text=' + encodeURIComponent(msg);

    const panel = $('#step-success');
    if (!panel) return;
    $('#ws-ref').textContent = ref;
    $('#ws-wa').href = waHref;

    /* the filled form is delivered to info@nicozdev.online */
    const mailSubject = pick(T.mailSub.en, T.mailSub.it) + ' ' + ref;
    const setVal = (sel, val) => { const el = $(sel); if (el) el.value = val; };
    setVal('#ws-mail-subject', mailSubject);
    setVal('#ws-mail-name', state.name || '');
    setVal('#ws-mail-email', state.email || '');
    setVal('#ws-mail-body', msg);

    panels.forEach(p => p.classList.toggle('active', p === panel));
    progress.forEach(p => { p.classList.add('done'); p.classList.remove('active'); });
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* */ }
    scrollWizardIntoView();
  };

  const submitBtn = $('#wiz-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      if (!validateStep(3)) return;
      if (API_BASE) {
        try {
          const fd = new FormData();
          fd.append('payload', JSON.stringify({ ...state }));
          if (file) fd.append('file', file);
          const res = await fetch(API_BASE + '/api/idea-requests', {
            method: 'POST', body: fd
          });
          if (res.ok) {
            const data = await res.json();
            showSuccess(data.ref || nextRef());
            return;
          }
        } catch (err) { console.warn('[nicoz] API submit failed, fallback to WhatsApp.', err); }
      }
      showSuccess(nextRef());
    });
  }

  /* ── live language switch ─────────────────────────────── */
  const relocalize = () => {
    renderChips();
    renderOptions();
    syncChipCount();
    setFileLabel();
    if (step === 3 || $('#step-success').classList.contains('active')) {
      renderReview();
    }
  };
  window.addEventListener('nicoz:lang', relocalize);

  /* ── "request sent" confirmation (?sent=1) ────────────── */
  const sentBanner = $('#wiz-sent');
  if (sentBanner && new URLSearchParams(location.search).get('sent') === '1') {
    sentBanner.hidden = false;
    try {
      const u = new URL(location.href);
      u.searchParams.delete('sent');
      history.replaceState({}, '', u.pathname + u.search + u.hash);
    } catch { /* ignore */ }
  }

  /* ── first paint ──────────────────────────────────────── */
  renderChips();
  renderOptions();
  goTo(1);
  syncChipCount();

})();
