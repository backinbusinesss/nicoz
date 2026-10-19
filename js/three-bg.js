/* ═══════════════════════════════════════════════════════════
   NICOZ — HERO BACKGROUND (three.js)
   A quiet field: fine dust, a few slow wireframes, one depth
   grid. Deliberately sparse — the type is the subject here.
   ═══════════════════════════════════════════════════════════ */
(function () {
  const canvas = document.getElementById('three-bg');
  if (!canvas || typeof THREE === 'undefined') return;

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile  = window.innerWidth < 768;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  camera.position.z = 34;

  const VIOLET = 0x7c3aed;
  const MINT   = 0x06d6a0;

  /* ── FINE DUST ─────────────────────────────────────────── */
  const STAR_COUNT = mobile ? 700 : 1500;
  const starPos = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    starPos[i * 3]     = (Math.random() - 0.5) * 220;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 150;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 200 - 25;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.13, transparent: true,
    opacity: 0.5, sizeAttenuation: true, depthWrite: false
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* ── ACCENT DUST ───────────────────────────────────────── */
  const ACCENT_COUNT = mobile ? 45 : 90;
  const accPos = new Float32Array(ACCENT_COUNT * 3);
  for (let i = 0; i < ACCENT_COUNT; i++) {
    accPos[i * 3]     = (Math.random() - 0.5) * 90;
    accPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
    accPos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 8;
  }
  const accGeo = new THREE.BufferGeometry();
  accGeo.setAttribute('position', new THREE.BufferAttribute(accPos, 3));
  const accMat = new THREE.PointsMaterial({
    color: VIOLET, size: 0.3, transparent: true,
    opacity: 0.42, sizeAttenuation: true, depthWrite: false
  });
  scene.add(new THREE.Points(accGeo, accMat));

  /* ── DEPTH GRID ────────────────────────────────────────── */
  // Concentric wireframe rings receding into Z. They must be seen slightly
  // off-axis: exactly edge-on (rotation.x = PI/2) every ring projects to the
  // same hairline and reads as a stray rule across the hero.
  const RING_TILT = Math.PI / 2 - 0.5;
  const rings = [];
  for (let r = 0; r < 5; r++) {
    const geo = new THREE.TorusGeometry(24 + r * 13, 0.05, 5, 90);
    const mat = new THREE.LineBasicMaterial({
      color: VIOLET, transparent: true, opacity: Math.max(0.018, 0.06 - r * 0.011)
    });
    const ring = new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat);
    ring.rotation.x = RING_TILT;
    ring.position.set(10, -6, -40 - r * 22);
    scene.add(ring);
    rings.push(ring);
  }

  /* ── WIREFRAME SOLIDS ──────────────────────────────────── */
  const line = (opacity, color) => new THREE.LineBasicMaterial({
    color: color, transparent: true, opacity: opacity
  });
  const shapes = [];
  const addWire = (geo, pos, rot, rx, ry, mat) => {
    const m = new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat);
    m.position.set(pos[0], pos[1], pos[2]);
    m.rotation.set(rot[0], rot[1], rot[2]);
    scene.add(m);
    shapes.push({ m: m, rx: rx, ry: ry });
  };

  // Kept to five, large and slow: a dozen small ones turns into noise.
  // They live in the right half and in deep Z — the left column is where the
  // copy sits, and wireframes behind type read as smudges.
  addWire(new THREE.IcosahedronGeometry(7.5, 0), [18, 6,  -46], [0.3, 0.5, 0],  0.0018, 0.0026, line(0.15, VIOLET));
  addWire(new THREE.TorusGeometry(6, 1.4, 6, 42), [27, -9, -54], [1.2, 0.3, 0], 0.0022, 0.0016, line(0.1,  MINT));
  addWire(new THREE.OctahedronGeometry(5, 0),    [15, 17, -58], [0.5, 0.3, 0.1], 0.0024, 0.0018, line(0.12, VIOLET));
  if (!mobile) {
    addWire(new THREE.DodecahedronGeometry(3.6, 0), [32, -15, -44], [0.6, 0.2, 0.4], 0.002, 0.0026, line(0.1,  VIOLET));
    addWire(new THREE.TorusGeometry(4, 1, 6, 30),   [24, -19, -66], [0.8, 0.4, 0.2], 0.0026, 0.0016, line(0.07, MINT));
  }

  /* ── POINTER PARALLAX ──────────────────────────────────── */
  const mouse = { x: 0, y: 0 };
  const camTarget = { x: 0, y: 0 };
  window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 1.5;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 1.1;
  }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ── VISIBILITY GATE ───────────────────────────────────── */
  let visible = true;
  const hero = document.getElementById('hero');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; })
      .observe(hero);
  }

  const clock = new THREE.Clock();
  let started = false;

  // Avvia il loop di animazione solo dopo la prima interazione utente
  const startOnInteraction = () => {
    if (started) return;
    started = true;
    window.removeEventListener('mousedown', startOnInteraction);
    window.removeEventListener('touchstart', startOnInteraction);
    window.removeEventListener('scroll', startOnInteraction);
    window.removeEventListener('keydown', startOnInteraction);
    requestAnimationFrame(loop);
  };

  window.addEventListener('mousedown', startOnInteraction);
  window.addEventListener('touchstart', startOnInteraction);
  window.addEventListener('scroll', startOnInteraction);
  window.addEventListener('keydown', startOnInteraction);

  function frame() {
    if (!visible) return;

    const t = clock.getElapsedTime();

    camTarget.x += (mouse.x - camTarget.x) * 0.045;
    camTarget.y += (-mouse.y - camTarget.y) * 0.045;
    camera.position.x = camTarget.x;
    camera.position.y = camTarget.y;
    camera.lookAt(0, 0, 0);

    shapes.forEach(s => { s.m.rotation.x += s.rx; s.m.rotation.y += s.ry; });
    rings.forEach((r, i) => { r.rotation.z = t * (0.02 + i * 0.006); });

    stars.rotation.y = t * 0.005;
    stars.rotation.x = t * 0.0025;

    accMat.opacity = 0.36 + Math.sin(t * 0.7) * 0.08;

    renderer.render(scene, camera);
  }

  if (REDUCED) {
    // One static frame, no loop: the scene still reads, nothing moves.
    renderer.render(scene, camera);
    window.addEventListener('resize', () => renderer.render(scene, camera));
    return;
  }

  (function loop() {
    requestAnimationFrame(loop);
    frame();
  })();
})();
