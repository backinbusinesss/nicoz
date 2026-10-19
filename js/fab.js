/* ═══════════════════════════════════════════════════════════
   NICOZ — FLOATING CTA
   Injects the "Build your idea" pill on every page that
   includes this script. Skipped on the wizard page itself
   (data-page="build") to avoid a button pointing at itself.
   ═══════════════════════════════════════════════════════════ */
(() => {
  const page = document.body.dataset.page || '';
  if (page === 'build' || page === 'admin') return;
  if (document.querySelector('.fab')) return;

  const a = document.createElement('a');
  a.className = 'fab';
  a.href = 'build';
  a.setAttribute('aria-label', 'Build your idea — start a project request');
  a.innerHTML =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>' +
    '<span class="fab-hint">Build your idea</span>';

  document.body.appendChild(a);
})();
