/* ═══════════════════════════════════════════════════════════
   NICOZ — BUILD YOUR IDEA (wizard)
   3 steps: products → project details → contact.
   Works fully statically: validates, builds a reference id,
   and hands the visitor a pre-filled WhatsApp message.
   Draft autosaves to localStorage between steps/reloads.
   API_BASE reserved for a future backend: when set, the
   request is POSTed there and the server-side ref is used.
   ═══════════════════════════════════════════════════════════ */
(async () => {

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const API_BASE = ''; // e.g. "https://nicoz-api.vercel.app" — future backend

  const DEFAULT_CONTACT = {
    email: 'nicoz@secria.me',
    whatsapp: '18734741519',
    whatsappDisplay: '+1 (873) 474-1519'
  };

  const DRAFT_KEY = 'nicoz-idea-draft-v1';
  const DESC_MAX  = 500;
  const FILE_MAX  = 5 * 1024 * 1024; // 5 MB

  const BUDGETS  = ['Under $100', '$100–$300', '$300–$600', '$600+'];
  const YESNO    = [{ v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }, { v: 'unsure', l: 'Not sure yet' }];
  const CHANNELS = [
    { v: 'whatsapp', l: 'WhatsApp' },
    { v: 'email',    l: 'Email'    },
    { v: 'telegram', l: 'Telegram' }
  ];

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
  if (chipsWrap) {
    chipsWrap.innerHTML = products.map(p => (
      '<button type="button" class="wiz-chip" data-slug="' + p.slug + '">' +
        '<span class="wiz-chip-emoji" aria-hidden="true">' + p.emoji + '</span>' +
        '<span class="wiz-chip-info"><b>' + p.name + '</b>' +
        '<i>' + p.tagline + '</i></span>' +
        '<span class="wiz-chip-price">' + fmt(p.price) +
        (p.billing === 'monthly' ? '/mo' : '') + '</span>' +
        '<span class="wiz-chip-check">✓</span>' +
      '</button>'
    )).join('');

    const syncChips = () => $$('.wiz-chip', chipsWrap).forEach(chip =>
      chip.classList.toggle('selected', state.productSlugs.includes(chip.dataset.slug)));

    const syncChipCount = () => {
      const el = $('#wiz-chip-count');
      if (el) el.textContent = state.productSlugs.length + ' selected';
    };

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
  if (chipsWrap) $$('.wiz-chip', chipsWrap).forEach(chip =>
    chip.classList.toggle('selected', state.productSlugs.includes(chip.dataset.slug)));

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
    wrapEl.innerHTML = list.map(o => {
      const v = typeof o === 'string' ? o : o.v;
      const l = typeof o === 'string' ? o : o.l;
      return '<button type="button" class="wiz-option" data-v="' + v + '">' + l + '</button>';
    }).join('');
    const sync = () => $$('.wiz-option', wrapEl).forEach(b =>
      b.classList.toggle('selected', String(state[key]) === b.dataset.v));
    wrapEl.addEventListener('click', e => {
      const b = e.target.closest('.wiz-option');
      if (!b) return;
      state[key] = b.dataset.v;
      sync();
      saveDraft();
    });
  };

  buildOptions($('#f-design'), YESNO, 'design');
  buildOptions($('#f-domain'), YESNO, 'domain');
  buildOptions($( '#f-budget'), BUDGETS, 'budget');
  buildOptions($('#f-channel'), CHANNELS, 'channel');

  const nameEl = $('#f-project');
  if (nameEl) nameEl.addEventListener('input', () => { state.projectName = nameEl.value; saveDraft(); });
  const dateEl = $('#f-date');
  if (dateEl) dateEl.addEventListener('change', () => { state.date = dateEl.value; saveDraft(); });
  const fileEl = $('#f-file');
  const fileLabel = $('#f-file-label');
  if (fileEl) {
    fileEl.addEventListener('change', () => {
      file = fileEl.files && fileEl.files[0] ? fileEl.files[0] : null;
      if (file && file.size > FILE_MAX) {
        file = null;
        fileEl.value = '';
        $('#err-file').textContent = 'File too large (max 5 MB).';
        $('#err-file').classList.add('show');
        return;
      }
      $('#err-file').classList.remove('show');
      if (fileLabel) fileLabel.textContent = file ? '📎 ' + file.name : 'Attach optional file';
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
    const detail = (k, fallback) => {
      const o = YESNO.find(x => x.v === k);
      return o ? o.l : fallback;
    };
    box.innerHTML =
      '<dl>' +
        (state.projectName   ? '<div><dt>Project</dt><dd>' + esc(state.projectName) + '</dd></div>' : '') +
        (state.description   ? '<div><dt>Idea</dt><dd>' + esc(state.description.slice(0, 120)) +
                               (state.description.length > 120 ? '…' : '') + '</dd></div>' : '') +
        '<div><dt>Design</dt><dd>' + detail(state.design, '—') + '</dd></div>' +
        '<div><dt>Domain</dt><dd>' + detail(state.domain, '—') + '</dd></div>' +
        (state.date          ? '<div><dt>Launch</dt><dd>' + esc(state.date) + '</dd></div>' : '') +
        '<div><dt>Budget</dt><dd>' + (state.budget || 'Not specified') + '</dd></div>' +
        (file                ? '<div><dt>File</dt><dd> Attached (' + esc(file.name) + ')</dd></div>' : '') +
      '</dl>' +
      '<div class="wiz-review-products">' +
        chosenProducts().map(p =>
          '<div><b>' + p.emoji + ' ' + p.name + '</b><i>' +
          fmt(p.price) + (p.billing === 'monthly' ? '/mo' : '') + '</i></div>').join('') +
      '</div>' +
      '<div class="wiz-review-total"><dt>Estimate</dt>' +
      '<dd>' + (oneTime ? fmt(oneTime) : '—') +
        (monthly ? ' <em>+' + fmt(monthly) + '/mo</em>' : '') +
      '</dd></div>';
  };

  const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const buildMessage = ref => {
    const { oneTime, monthly } = estimate();
    const lines = [];
    lines.push('*New idea request ' + ref + '*');
    lines.push('');
    lines.push('*Products*');
    chosenProducts().forEach(p =>
      lines.push('• ' + p.name + ' — ' + fmt(p.price) + (p.billing === 'monthly' ? '/mo' : '')));
    if (oneTime || monthly) {
      lines.push('*Estimate* ' + (oneTime ? fmt(oneTime) : '') +
        (monthly ? (oneTime ? ' + ' : '') + fmt(monthly) + '/mo' : ''));
    }
    if (state.projectName) { lines.push(''); lines.push('*Project* ' + state.projectName); }
    if (state.description) {
      lines.push('');
      lines.push(state.description);
    }
    lines.push('');
    lines.push('• Design/mockup: ' + detailLabel(state.design));
    lines.push('• Domain/hosting: ' + detailLabel(state.domain));
    if (state.date)   lines.push('• Launch date: ' + state.date);
    if (state.budget) lines.push('• Budget: ' + state.budget);
    if (file)         lines.push('• Mockup file ready: I will attach it in the chat');
    lines.push('');
    lines.push('*From* ' + state.name);
    lines.push('• Email: ' + state.email);
    if (state.phone) lines.push('• WhatsApp: ' + state.phone);
    lines.push('• Preferred contact: ' + channelLabel(state.channel));
    if (state.notes) { lines.push(''); lines.push('*Notes* ' + state.notes); }
    return lines.join('\n');
  };

  const detailLabel = v => {
    const found = YESNO.find(x => x.v === v);
    return found ? found.l : '—';
  };
  const channelLabel = v => {
    const found = CHANNELS.find(x => x.v === v);
    return found ? found.l : '—';
  };

  /* success view */
  const showSuccess = ref => {
    const msg = buildMessage(ref);
    const waHref =
      'https://wa.me/' + contact.whatsapp + '?text=' + encodeURIComponent(msg);
    const mailHref =
      'mailto:' + contact.email + '?subject=' +
      encodeURIComponent('Idea request ' + ref) + '&body=' + encodeURIComponent(msg);

    const panel = $('#step-success');
    if (!panel) return;
    $('#ws-ref').textContent = ref;
    $('#ws-wa').href = waHref;
    $('#ws-mail').href = mailHref;
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

  /* re-render the review when step 3 activates (handled in goTo) */

  /* restore option chip states from a loaded draft */
  const syncAllOptions = () => {
    [['#f-design', 'design'], ['#f-domain', 'domain'],
     ['#f-budget', 'budget'], ['#f-channel', 'channel']].forEach(([sel, key]) => {
      const wrap = $(sel);
      if (!wrap) return;
      $$('.wiz-option', wrap).forEach(b =>
        b.classList.toggle('selected', String(state[key]) === b.dataset.v));
    });
  };

  /* first paint */
  goTo(1);
  syncAllOptions();
  {
    const el = $('#wiz-chip-count');
    if (el) el.textContent = state.productSlugs.length + ' selected';
  }

})();
