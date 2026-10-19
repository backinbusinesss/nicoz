/* ═══════════════════════════════════════════════════════════
   NICOZ — I18N (English default, Italian switch)
   How it works:
   - All static markup stays written in English (source of truth).
   - This module holds an IT dictionary keyed by CSS selectors and
     swaps the text in place: entry value = [EN, IT].
   - Language is persisted in localStorage (`nicoz-lang`), default EN.
   - Dynamic content (catalog cards, wizard chips/messages) reads
     window.NicozI18N.lang at render time and listens to the
     `nicoz:lang` event to re-render in the new language.
   - The EN|IT pill is injected into the nav + mobile panel here,
     so no HTML needs a special slot for it.
   - Legal pages (termini, cookie) are intentionally Italian-only
     and do not load this script.
   ═══════════════════════════════════════════════════════════ */
(() => {

  'use strict';

  const KEY = 'nicoz-lang';

  let lang = 'en';
  try { lang = localStorage.getItem(KEY) || 'en'; } catch { /* private mode */ }
  if (lang !== 'it') lang = 'en';

  /* ── dictionary ──────────────────────────────────────────
     Each entry: selector → { t: [EN, IT], ph: [EN, IT], href: [EN, IT] }
     - t   → innerHTML swap (may contain markup, mirrors current HTML)
     - ph  → placeholder attribute
     - href→ href attribute (used for the pre-filled WhatsApp CTA)
     EN values mirror the markup exactly, so switching back to EN
     always restores the original text.                              */
  const S = (t, ph, href) => {
    const e = {};
    if (t !== undefined) e.t = t;
    if (ph !== undefined) e.ph = ph;
    if (href !== undefined) e.href = href;
    return e;
  };

  const CHROME = {
    /* meta */
    'head > title': {
      home: S(['Nicoz — Web Developer & Designer', 'Nicoz — Web Developer & Designer']),
      catalogo: S(['Nicoz — Services & Pricing', 'Nicoz — Servizi e Prezzi']),
      build: S(['Nicoz — Build Your Idea', 'Nicoz — Realizza la tua idea']),
      demo: S(['Nicoz — Live demos', 'Nicoz — Demo dal vivo'])
    },

    /* nav (first two links shared by every page) */
    '#nav .nav-links a:nth-of-type(1)': S(['Work', 'Lavori']),
    '#nav .nav-links a:nth-of-type(2)': S(['Services', 'Servizi']),

    /* mobile panel (first two links) */
    '#nav-panel .nav-panel-links a:nth-of-type(1)': S(['Work', 'Lavori']),
    '#nav-panel .nav-panel-links a:nth-of-type(2)': S(['Services', 'Servizi']),

    /* footer brand + columns */
    '#footer .footer-brand .footer-tag':
      S(['Independent web developer &amp; designer. Design and code, same pair of hands.',
         'Sviluppatore e designer web indipendente. Design e codice, nella stessa coppia di mani.']),
    '#footer [aria-label="Footer sitemap"] h4': S(['Sitemap', 'Mappa del sito']),
    '#footer [aria-label="Footer sitemap"] a:nth-of-type(1)': S(['Work', 'Lavori']),
    '#footer [aria-label="Footer sitemap"] a:nth-of-type(2)': S(['Services', 'Servizi']),
    '#footer [aria-label="Footer sitemap"] a:nth-of-type(3)': S(['Build your idea', 'Realizza la tua idea']),
    '#footer [aria-label="Footer sitemap"] a:nth-of-type(4)': S(['Contact', 'Contatti']),
    '#footer [aria-label="Footer social"] h4': S(['Social', 'Social']),
    '#footer [aria-label="Footer legal"] h4': S(['Legale', 'Legale']),
    '#footer [aria-label="Footer legal"] a:nth-of-type(1)': S(['Termini e Condizioni', 'Termini e Condizioni']),
    '#footer [aria-label="Footer legal"] a:nth-of-type(2)': S(['Cookie Policy', 'Cookie Policy']),
    '#footer [aria-label="Footer legal"] a:nth-of-type(3)': S(['Preferenze di Privacy', 'Preferenze di Privacy']),
    '#footer .footer-legal a[data-open-consent]': S(['Preferenze di privacy', 'Preferenze di privacy'])

    ,/* consent banner */
    '#consent-title': S(['Cookie &amp; privacy', 'Cookie &amp; privacy']),
    '#consent .consent-copy p': S([
      'This site only stores your consent choice on this device. ' +
      'No analytics or advertising cookies are set. ' +
      'Read the <a href="cookie">Cookie Policy</a>.',
      'Questo sito salva solo la tua scelta di consenso su questo dispositivo. ' +
      'Nessun cookie di analisi o advertising viene impostato. ' +
      'Leggi la <a href="cookie">Cookie Policy</a>.'
    ]),
    '#consent .consent-actions [data-consent="essential"]': S(['Essential only', 'Solo essenziali']),
    '#consent .consent-actions [data-open-consent]': S(['Preferences', 'Preferenze']),
    '#consent .consent-actions [data-consent="all"]': S(['Accept all', 'Accetta tutto']),

    /* consent modal */
    '#modal-title': S(['Privacy preferences', 'Preferenze di privacy']),
    '#consent-modal .toggle.is-locked b': S(['Strictly necessary', 'Strettamente necessari']),
    '#consent-modal .toggle.is-locked i': S(['Required to remember this choice. Always active.',
                                             'Necessario per ricordare questa scelta. Sempre attivo.']),
    '#consent-modal .toggle:nth-of-type(2) b': S(['Experience', 'Esperienza']),
    '#consent-modal .toggle:nth-of-type(2) i': S(['Remembers interface preferences such as reduced motion.',
                                                  'Ricorda le preferenze di interfaccia, come il movimento ridotto.']),
    '#consent-modal .toggle:nth-of-type(3) b': S(['Analytics', 'Analisi']),
    '#consent-modal .toggle:nth-of-type(3) i': S(['Reserved. No analytics tool is installed on this site today.',
                                                  'Riservato. Nessuno strumento di analisi è installato su questo sito.']),
    '#consent-modal .modal-foot': S([
      'Full detail in the <a href="cookie">Cookie Policy</a>. ' +
      'You can change this at any time from the footer.',
      'Dettagli completi nella <a href="cookie">Cookie Policy</a>. ' +
      'Puoi cambiare idea in qualsiasi momento dal footer.'
    ]),
    '#consent-modal .modal-actions [data-consent="essential"]': S(['Essential only', 'Solo essenziali']),
    '#consent-modal .modal-actions [data-consent="save"]': S(['Save preferences', 'Salva preferenze']),

    /* fab (injected by fab.js — plain strings here) */
    '.fab .fab-hint': null /* handled below as raw pair */
  };

  const PAGES = {

    home: {
      '#nav .nav-links a:nth-of-type(3)': S(['About', 'Chi sono']),
      '#nav .nav-links a:nth-of-type(4)': S(['Contact', 'Contatti']),
      '#nav .nav-cta': S(['Hire me', 'Lavora con me']),
      '#nav-panel .nav-panel-links a:nth-of-type(3)': S(['About', 'Chi sono']),
      '#nav-panel .nav-panel-links a:nth-of-type(4)': S(['Build your idea', 'Realizza la tua idea']),
      '#nav-panel .nav-panel-links a:nth-of-type(5)': S(['Contact', 'Contatti']),

      '#hero .hero-eyebrow': null, /* innerHTML contains blink-dot: see HTML_TEXT below */
      '#hero .hero-desc':
        S(['I build <em>fast</em>, <em>memorable</em> digital experiences — ' +
           'from the first pixel through to production.',
           'Creo esperienze digitali <em>veloci</em> e <em>memorabili</em> — ' +
           'dal primo pixel fino alla produzione.']),
      '#hero .btn-solid span': S(['View selected work', 'Guarda i progetti']),
      '#hero .btn-ghost': S(['Let\u2019s talk', 'Parliamone']),
      '#hero .hero-meta div:nth-of-type(1) dt': S(['Status', 'Stato']),
      '#hero .hero-meta div:nth-of-type(1) dd': S(['Freelance &amp; remote', 'Freelance &amp; remoto']),
      '#hero .hero-meta div:nth-of-type(2) dt': S(['Focus', 'Focus']),
      '#hero .hero-scroll-hint span': S(['Scroll', 'Scorri']),

      '#projIntro .eyebrow': S(['Selected work', 'Progetti selezionati']),
      '#projIntro h2': S(['Projects I\u2019ve <em>shipped</em>', 'I progetti che ho <em>realizzato</em>']),
      '#projIntro .proj-intro-hint': S(['Keep scrolling', 'Continua a scorrere']),

      '#stage3d .pcard:nth-of-type(1) .pcard-desc': S([
        'Community platform for a motorcycle club: free membership, digital card, ' +
        'partner discounts, an event calendar and live social tracking. ' +
        'Built in React Three Fiber with scroll-driven GSAP timelines.',
        'Piattaforma community per un moto club: iscrizione gratuita, tessera digitale, ' +
        'sconti partner, calendario eventi e tracking social in tempo reale. ' +
        'Realizzata in React Three Fiber con timeline GSAP legate allo scroll.']),
      '#stage3d .pcard:nth-of-type(2) .pcard-desc': S([
        'Loader platform for Roblox: account system, key-based activation, ' +
        'hardware locking and a Discord community. Closed beta with ' +
        'automated build distribution after each game patch.',
        'Piattaforma di loader per Roblox: sistema di account, attivazione a chiave, ' +
        'hardware lock e community Discord. Beta chiusa con distribuzione ' +
        'automatica delle build a ogni patch del gioco.']),
      '#stage3d .pcard:nth-of-type(3) .pcard-desc': S([
        'Marketing site for Gambling Island, a Minecraft server built around ' +
        'casino games. Server status, rules, store and a one-click IP copy — ' +
        'the page players land on before they join.',
        'Sito vetrina per Gambling Island, un server Minecraft costruito attorno ' +
        'ai casino game. Stato del server, regole, store e copia IP con un clic — ' +
        'la pagina dove i giocatori arrivano prima di entrare.']),
      '#stage3d .pcard:nth-of-type(4) .pcard-desc': S([
        'Free streaming platform for movies and TV series. 1080p playback ' +
        'powered by the VixSrc API with TMDB metadata. Fully open source and ' +
        'self-hostable in a single container.',
        'Piattaforma di streaming gratuita per film e serie TV. Riproduzione ' +
        '1080p con API VixSrc e metadati TMDB. Completamente open source e ' +
        'self-hostable in un singolo container.']),
      '#stage3d .pcard:nth-of-type(5) .pcard-desc': S([
        'Discord username availability checker and sniper with a tiered ' +
        'subscription model from €7.99 to unlimited. Proxy access, ' +
        'wordlist uploads and a documented REST API.',
        'Checker e sniper per username Discord con abbonamenti a livelli, ' +
        'da €7,99 fino a illimitati. Accesso proxy, upload di wordlist ' +
        'e REST API documentata.']),
      '#stage3d .pcard:nth-of-type(1) .pcard-visit': S(['Visit site <span class="visit-arrow">→</span>', 'Visita il sito <span class="visit-arrow">→</span>']),
      '#stage3d .pcard:nth-of-type(2) .pcard-visit': S(['Visit site <span class="visit-arrow">→</span>', 'Visita il sito <span class="visit-arrow">→</span>']),
      '#stage3d .pcard:nth-of-type(3) .pcard-visit': S(['Visit site <span class="visit-arrow">→</span>', 'Visita il sito <span class="visit-arrow">→</span>']),
      '#stage3d .pcard:nth-of-type(4) .pcard-visit': S(['Visit site <span class="visit-arrow">→</span>', 'Visita il sito <span class="visit-arrow">→</span>']),
      '#stage3d .pcard:nth-of-type(5) .pcard-visit': S(['Visit site <span class="visit-arrow">→</span>', 'Visita il sito <span class="visit-arrow">→</span>']),
      '#mc-note': S(['Domain is live; the origin was returning 502 at the time of writing.',
                     'Il dominio è attivo; al momento della stesura l\u2019origine rispondeva 502.']),

      '#about .about-head .eyebrow': S(['About', 'Chi sono']),
      '#about .about-head h2':
        S(['I\u2019m Nicoz, a developer who cares about <em>details</em>.',
           'Sono Nicoz, uno sviluppatore che ci tiene ai <em>dettagli</em>.']),
      '#about .about-lead': S([
        'I build web experiences that are fast, visually striking and crafted ' +
        'with attention to every pixel. From streaming platforms to SaaS tools, ' +
        'I ship products people actually enjoy using.',
        'Creo esperienze web veloci, d\u2019impatto e curate al singolo pixel. ' +
        'Da piattaforme di streaming a strumenti SaaS, consegno prodotti ' +
        'che è davvero un piacere usare.']),
      '#about .about-sub': S([
        'Most of my work is design and engineering at the same time: I set the ' +
        'visual system, then write the code that runs it — no handoff, no ' +
        'approximation in the middle.',
        'Quasi sempre sono design ed engineering insieme: definisco il sistema ' +
        'visivo e scrivo il codice che lo rende reale — niente passaggi di mano, ' +
        'nessuna approssimazione a metà.']),
      '#about .service:nth-of-type(1) h3': S(['Product &amp; UI design', 'Design di prodotto e UI']),
      '#about .service:nth-of-type(1) p': S(['Design systems, typography, layout and interaction detail — delivered as a working spec, not a static file.',
                                             'Design system, tipografia, layout e dettaglio d\u2019interazione — consegnati come specifica funzionante, non come file statico.']),
      '#about .service:nth-of-type(2) h3': S(['Frontend engineering', 'Ingegneria frontend']),
      '#about .service:nth-of-type(2) p': S(['Hand-written HTML, CSS and JavaScript. Fast, accessible and maintainable, with no framework unless it earns its place.',
                                             'HTML, CSS e JavaScript scritti a mano. Veloci, accessibili e manutenibili, senza framework se non se lo meritano.']),
      '#about .service:nth-of-type(3) h3': S(['3D &amp; motion', '3D e motion']),
      '#about .service:nth-of-type(3) p': S(['Three.js scenes, WebGL shaders and scroll-driven GSAP timelines that support the story instead of slowing the page down.',
                                             'Scene Three.js, shader WebGL e timeline GSAP legate allo scroll: al servizio della storia, non a rallentarne la pagina.']),
      '#about .skill-group:nth-of-type(1) h4': S(['Frontend', 'Frontend']),
      '#about .skill-group:nth-of-type(2) h4': S(['Backend', 'Backend']),
      '#about .skill-group:nth-of-type(3) h4': S(['Tools', 'Strumenti']),
      '#about .about-stats div:nth-of-type(1) dd': S(['Projects live', 'Progetti live']),
      '#about .about-stats div:nth-of-type(2) dd': S(['Custom code', 'Codice custom']),
      '#about .about-stats div:nth-of-type(3) dd': S(['Passion', 'Passione']),

      '#contact .eyebrow': S(['Get in touch', 'Contattami']),
      '#contact .contact-title': S(['Let\u2019s build<br/>something <em>great</em>.',
                                    'Costruiamo<br/>qualcosa di <em>grande</em>.']),
      '#contact .contact-sub': S(['Have a project in mind? Pick whichever channel suits you.',
                                  'Hai un progetto in mente? Scegli il canale che preferisci.']),
      '#contact .contact-alt':
        S(['Prefer email? <a href="mailto:nicoz@secria.me">nicoz@secria.me</a>',
           'Preferisci la mail? <a href="mailto:nicoz@secria.me">nicoz@secria.me</a>'])
    },

    catalogo: {
      '#nav .nav-links a:nth-of-type(3)': S(['About', 'Chi sono']),
      '#nav .nav-links a:nth-of-type(4)': S(['Contact', 'Contatti']),
      '#nav .nav-cta': S(['Build your idea', 'Realizza la tua idea']),
      '#nav-panel .nav-panel-links a:nth-of-type(3)': S(['About', 'Chi sono']),
      '#nav-panel .nav-panel-links a:nth-of-type(4)': S(['Build your idea', 'Realizza la tua idea']),
      '#nav-panel .nav-panel-links a:nth-of-type(5)': S(['Contact', 'Contatti']),

      '.c-hero .eyebrow': null, /* blink-dot below */
      '.c-hero h1': S(['Pick a product.<br/>Or <em>build</em> your own.',
                       'Scegli un prodotto.<br/>Oppure <em>realizza</em> il tuo.']),
      '.c-hero .c-hero-sub': S([
        'Fixed prices, delivery times and bundles — no hidden costs. ' +
        'Order directly on WhatsApp, or describe your idea and I will ' +
        'shape the right mix for you.',
        'Prezzi fissi, tempi di consegna e bundle — nessun costo nascosto. ' +
        'Ordina direttamente su WhatsApp, oppure descrivi la tua idea ' +
        'e io compongo il mix giusto per te.']),

      '.c-hero .c-theme [data-theme-choice="dark"]': S(['Dark', 'Scuro']),
      '.c-hero .c-theme [data-theme-choice="light"]': S(['Light', 'Chiaro']),

      'section[aria-label="Products"] .c-section-head .eyebrow': S(['01 — Products', '01 — Prodotti']),
      'section[aria-label="Products"] .c-section-head h2': S(['Everything, <em>priced</em>.', 'Tutto, <em>col prezzo</em>.']),
      'section[aria-label="Products"] .c-section-note': S([
        'Each product is fixed-price and delivered on a stated timeline. ' +
        'Order with one tap on WhatsApp.',
        'Ogni prodotto ha un prezzo fisso e tempi di consegna dichiarati. ' +
        'Ordina con un tap su WhatsApp.']),

      'section[aria-label="Bundles"] .c-section-head .eyebrow': S(['02 — Bundles', '02 — Bundle']),
      'section[aria-label="Bundles"] .c-section-head h2': S(['Mix the right <em>stack</em>.', 'Componi lo <em>stack</em> giusto.']),
      'section[aria-label="Bundles"] .c-section-note': S([
        'Bundles pair products that work well together — always ' +
        'cheaper than buying them separately.',
        'Bundle che uniscono prodotti che funzionano bene insieme — ' +
        'sempre più economici che comprarli separatamente.']),

      '.c-cta .eyebrow': S(['Custom projects', 'Progetti custom']),
      '.c-cta .container h2': S(['Don\u2019t see exactly <em>what you need</em>?',
                                 'Non trovi esattamente <em>ciò che ti serve</em>?']),
      '.c-cta .container p': S([
        'Describe your idea in three quick steps, get a reference number ' +
        'and we take it from there.',
        'Descrivi la tua idea in tre passaggi veloci, ottieni un numero di ' +
        'riferimento e da lì partiamo.']),
      '.c-cta .btn-solid span': S(['Build your idea', 'Realizza la tua idea']),
      '.c-cta .btn-ghost': S(['WhatsApp', 'WhatsApp'],
        undefined,
        ['https://wa.me/18734741519?text=Hi%20Nicoz!%20I%20have%20a%20project%20in%20mind.',
         'https://wa.me/18734741519?text=Ciao%20Nicoz!%20Ho%20un%20progetto%20in%20mente.'])
    },

    build: {
      '#nav .nav-links a:nth-of-type(3)': S(['Contact', 'Contatti']),
      '#nav .nav-cta': S(['Catalog', 'Catalogo']),
      '#nav-panel .nav-panel-links a:nth-of-type(3)': S(['Contact', 'Contatti']),

      '.wiz-head .eyebrow': null, /* blink-dot below */
      '.wiz-head h1': S(['Tell me your <em>idea</em>.', 'Raccontami la tua <em>idea</em>.']),
      '.wiz-head p': S([
        'Three quick steps. At the end you get a reference number and a ' +
        'pre-filled WhatsApp message — nothing is sent without your consent.',
        'Tre passaggi veloci. Alla fine ottieni un numero di riferimento e un ' +
        'messaggio WhatsApp precompilato — nulla viene inviato senza il tuo consenso.']),

      '.wiz-progress .wp-item[data-step="1"] span:nth-child(2)': S(['Products', 'Prodotti']),
      '.wiz-progress .wp-item[data-step="2"] span:nth-child(2)': S(['Details', 'Dettagli']),
      '.wiz-progress .wp-item[data-step="3"] span:nth-child(2)': S(['Contact', 'Contatti']),

      '#step-1 .wiz-panel-head': S(['Step 01 — Pick your products', 'Step 01 — Scegli i prodotti']),
      '#step-1 .wiz-label > span': S(['Select one or more products', 'Seleziona uno o più prodotti']),
      '#err-products': S(['Select at least one product to continue.', 'Seleziona almeno un prodotto per continuare.']),
      '#step-1 .wiz-next span': S(['Continue', 'Continua']),

      '#step-2 .wiz-panel-head': S(['Step 02 — Project details', 'Step 02 — Dettagli del progetto']),
      'label[for="f-project"] span':
        S(['Project name <small style="text-transform:none;letter-spacing:0;">(optional)</small>',
           'Nome del progetto <small style="text-transform:none;letter-spacing:0;">(opzionale)</small>']),
      '#f-project': S(undefined, ['e.g. Bakery store, DJ portfolio, club site…',
                                  'es. Negozio di una panetteria, portfolio DJ, sito di un club…']),
      'label[for="f-desc"] span': S(['Describe your idea', 'Descrivi la tua idea']),
      '#f-desc': S(undefined, ['What is it, who is it for, what should it do?',
                               'Che cos\u2019è, per chi lo fai, che cosa deve fare?']),
      '#err-desc': S(['Write at least 10 characters.', 'Scrivi almeno 10 caratteri.']),
      '#step-2 .wiz-field:nth-of-type(3) .wiz-label > span':
        S(['Do you already have a design or mockup?', 'Hai già un design o una bozza?']),
      '#step-2 .wiz-field:nth-of-type(3) .wiz-label small': S(['optional', 'opzionale']),
      '#file-field .wiz-label > span': S(['Attach the mockup', 'Allega la bozza']),
      '#file-field .wiz-label small': S(['optional · image or PDF · max 5 MB', 'opzionale · immagine o PDF · max 5 MB']),
      '#file-field .wiz-hint': S([
        'Without a backend this file is not uploaded — you can attach it in the WhatsApp chat.',
        'Senza backend il file non viene caricato — puoi allegarlo nella chat WhatsApp.']),
      '#step-2 .wiz-field:nth-of-type(5) .wiz-label > span':
        S(['Do you need a domain or hosting?', 'Ti serve un dominio o un hosting?']),
      '#step-2 .wiz-field:nth-of-type(5) .wiz-label small': S(['optional', 'opzionale']),
      'label[for="f-date"] span': S(['When would you like to launch?', 'Quando vorresti fare il lancio?']),
      'label[for="f-date"] small': S(['optional', 'opzionale']),
      '#step-2 .wiz-field:nth-of-type(7) .wiz-label > span': S(['Rough budget', 'Budget indicativo']),
      '#step-2 .wiz-field:nth-of-type(7) .wiz-label small': S(['optional', 'opzionale']),
      '#step-2 .wiz-back span': S(['Back', 'Indietro']),
      '#step-2 .wiz-next span': S(['Continue', 'Continua']),

      '#step-3 .wiz-panel-head': S(['Step 03 — Contact &amp; send', 'Step 03 — Contatti e invio']),
      'label[for="f-name"] span': S(['Your name', 'Il tuo nome']),
      '#f-name': S(undefined, ['First and last name', 'Nome e cognome']),
      '#err-name': S(['Please enter your name.', 'Inserisci il tuo nome.']),
      'label[for="f-email"] span': S(['Email', 'Email']),
      '#err-email': S(['Please enter a valid email address.', 'Inserisci un indirizzo email valido.']),
      'label[for="f-phone"] span':
        S(['WhatsApp number <small>optional</small>',
           'Numero WhatsApp <small>opzionale</small>']),
      '#err-phone': S(['Required when WhatsApp is your preferred channel.',
                       'Obbligatorio se WhatsApp è il tuo canale preferito.']),
      '#step-3 .wiz-field:nth-of-type(4) .wiz-label > span': S(['Preferred contact channel', 'Canale di contatto preferito']),
      '#step-3 .wiz-field:nth-of-type(4) .wiz-label small': S(['optional', 'opzionale']),
      'label[for="f-notes"] span':
        S(['Extra notes <small>optional</small>',
           'Note extra <small>opzionale</small>']),
      '#f-notes': S(undefined, ['Anything else Nicoz should know…',
                                'Qualcos\u2019altro che Nicoz dovrebbe sapere…']),
      '#step-3 .wiz-field:nth-of-type(6) .wiz-label > span': S(['Summary', 'Riepilogo']),
      '#step-3 .wiz-field:nth-of-type(6) .wiz-label small': S(['review before sending', 'controlla prima di inviare']),
      '#step-3 .wiz-back span': S(['Back', 'Indietro']),
      '#wiz-submit span': S(['Send request', 'Invia richiesta']),

      '#step-success h2': S(['Your request is ready.', 'La tua richiesta è pronta.']),
      '#step-success .wiz-success > p': S([
        'One more tap and it lands on WhatsApp, already filled with your ' +
        'products, details and contact info. You can edit the message ' +
        'before sending.',
        'Un altro tap e arriva su WhatsApp, già riempito con prodotti, dettagli ' +
        'e contatti. Puoi modificare il messaggio prima di inviarlo.']),
      '#ws-wa span': S(['Open WhatsApp', 'Apri WhatsApp']),
      '#ws-mail span': S(['Email instead', 'Mandala via mail']),
      '.ws-note': S([
        'Tip: keep the reference number — quote it in any follow-up. ' +
        'You can also reach Nicoz directly at ' +
        '<a href="mailto:nicoz@secria.me" style="color: var(--mint);">nicoz@secria.me</a>.',
        'Consiglio: conserva il numero di riferimento — citalo in ogni follow-up. ' +
        'Puoi anche raggiungere Nicoz direttamente su ' +
        '<a href="mailto:nicoz@secria.me" style="color: var(--mint);">nicoz@secria.me</a>.'])
    },

    demo: {
      '#nav .nav-links a:nth-of-type(3)': S(['Contact', 'Contatti']),
      '#nav .nav-cta': S(['Catalog', 'Catalogo']),
      '#nav-panel .nav-panel-links a:nth-of-type(3)': S(['Contact', 'Contatti']),

      '.demo-head .eyebrow': null, /* blink-dot below */
      '#d-all-label': S(['All website demos', 'Tutte le demo website'])
    }
  };

  /* eyebrow items that contain a <span class="blink-dot"> before the text */
  const HTML_TEXT = {
    home:     { 'hero .hero-eyebrow':            ['Available for work', 'Disponibile a lavorare'] },
    catalogo: { '.c-hero .eyebrow':              [' Services &amp; pricing', ' Servizi e prezzi'] },
    build:    { '.wiz-head .eyebrow':            [' Build your idea', ' Realizza la tua idea'] },
    demo:     { '.demo-head .eyebrow':           [' Live demo — everything runs in your browser',
                                                 ' Demo dal vivo — tutto gira nel tuo browser'] }
  };

  /* ── engine ───────────────────────────────────────────── */
  const pick = (arr) => (lang === 'it' ? arr[1] : arr[0]);

  const applyOnce = () => {

    /* page type read lazily: body exists only once the DOM is parsed */
    const page = (document.body && document.body.dataset.page) || '';

    /* build the flat entry list for this page */
    const entries = {};
    Object.keys(CHROME).forEach(sel => {
      const e = CHROME[sel];
      if (sel === 'head > title') return; /* per-page, handled apart */
      if (e) entries[sel] = e;
    });
    Object.keys(PAGES[page] || {}).forEach(sel => {
      entries[sel] = PAGES[page][sel];
    });

    /* <title> */
    const titleEntry = (CHROME['head > title'] || {})[page];
    if (titleEntry && document.title) document.title = pick(titleEntry.t);

    function walk(map) {
      Object.keys(map).forEach(sel => {
        const entry = map[sel];
        if (!entry) return;
        document.querySelectorAll(sel).forEach(el => {
          if (entry.t) el.innerHTML = pick(entry.t);
          if (entry.ph !== undefined) el.setAttribute('placeholder', pick(entry.ph));
          if (entry.href !== undefined) el.setAttribute('href', pick(entry.href));
        });
      });
    }
    walk(entries);

    /* blink-dot eyebrows (non-animatable innerHTML) */
    const extra = HTML_TEXT[page];
    if (extra) {
      Object.keys(extra).forEach(sel => {
        const pair = extra[sel];
        document.querySelectorAll(sel).forEach(el => {
          el.innerHTML = '<span class="blink-dot"></span>' + pick(pair);
        });
      });
    }

    /* fab strings (no markup, injected late by fab.js) */
    document.querySelectorAll('.fab .fab-hint').forEach(el => {
      el.textContent = pick(['Build your idea', 'Realizza la tua idea']);
    });

    document.documentElement.lang = lang === 'it' ? 'it' : 'en';
  };

  /* ── language pill ────────────────────────────────────── */
  const syncPill = () => {
    document.querySelectorAll('.lang-switch [data-lang]').forEach(b =>
      b.classList.toggle('active', b.dataset.lang === lang));
  };

  const injectPill = () => {
    if (document.querySelector('.lang-switch')) { syncPill(); return; }

    const build = () => {
      const w = document.createElement('div');
      w.className = 'lang-switch';
      w.setAttribute('role', 'group');
      w.setAttribute('aria-label', 'Language / Lingua');
      w.innerHTML =
        '<button type="button" data-lang="en" aria-label="Switch to English">EN</button>' +
        '<button type="button" data-lang="it" aria-label="Passa all\u2019italiano">IT</button>';
      w.addEventListener('click', e => {
        const b = e.target.closest('[data-lang]');
        if (b && b.dataset.lang !== lang) window.NicozI18N.set(b.dataset.lang);
      });
      return w;
    };

    const navEnd = document.querySelector('.nav-end');
    if (navEnd) {
      const toggle = navEnd.querySelector('.nav-toggle');
      navEnd.insertBefore(build(), toggle || null);
    }
    const foot = document.querySelector('.nav-panel-foot');
    if (foot) foot.insertBefore(build(), foot.firstChild);
    syncPill();
  };

  /* ── public API ───────────────────────────────────────── */
  window.NicozI18N = {
    get lang() { return lang; },
    t: (en, it) => pick([en, it]),
    set(next) {
      if (next !== 'en' && next !== 'it') return;
      lang = next;
      try { localStorage.setItem(KEY, lang); } catch { /* private mode */ }
      applyOnce();
      syncPill();
      window.dispatchEvent(new CustomEvent('nicoz:lang', { detail: { lang } }));
    },
    reapply: applyOnce
  };

  const boot = () => { applyOnce(); injectPill(); };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})();
