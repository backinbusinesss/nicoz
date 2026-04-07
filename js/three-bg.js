/* ============================================
   NICOZ — THREE.JS HERO BACKGROUND
   Starfield + floating wireframes + mouse parallax
   ============================================ */
(function () {
  const canvas = document.getElementById('three-bg');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  camera.position.z = 30;

  // ── STARFIELD ──
  const STAR_COUNT = 2200;
  const starPos = new Float32Array(STAR_COUNT * 3);
  const starSpeeds = new Float32Array(STAR_COUNT);
  for (let i = 0; i < STAR_COUNT; i++) {
    starPos[i*3]   = (Math.random() - 0.5) * 200;
    starPos[i*3+1] = (Math.random() - 0.5) * 150;
    starPos[i*3+2] = (Math.random() - 0.5) * 200 - 20;
    starSpeeds[i]  = 0.005 + Math.random() * 0.015;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.12,
    transparent: true, opacity: 0.7, sizeAttenuation: true
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ── VIOLET GLOW PARTICLES ──
  const GLOW_COUNT = 120;
  const glowPos = new Float32Array(GLOW_COUNT * 3);
  for (let i = 0; i < GLOW_COUNT; i++) {
    glowPos[i*3]   = (Math.random() - 0.5) * 80;
    glowPos[i*3+1] = (Math.random() - 0.5) * 60;
    glowPos[i*3+2] = (Math.random() - 0.5) * 60 - 5;
  }
  const glowGeo = new THREE.BufferGeometry();
  glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPos, 3));
  const glowMat = new THREE.PointsMaterial({
    color: 0x7c3aed, size: 0.35,
    transparent: true, opacity: 0.5, sizeAttenuation: true
  });
  scene.add(new THREE.Points(glowGeo, glowMat));

  // ── CYAN ACCENT PARTICLES ──
  const CYAN_COUNT = 60;
  const cyanPos = new Float32Array(CYAN_COUNT * 3);
  for (let i = 0; i < CYAN_COUNT; i++) {
    cyanPos[i*3]   = (Math.random() - 0.5) * 80;
    cyanPos[i*3+1] = (Math.random() - 0.5) * 60;
    cyanPos[i*3+2] = (Math.random() - 0.5) * 40 - 5;
  }
  const cyanGeo = new THREE.BufferGeometry();
  cyanGeo.setAttribute('position', new THREE.BufferAttribute(cyanPos, 3));
  const cyanMat = new THREE.PointsMaterial({
    color: 0x06d6a0, size: 0.25,
    transparent: true, opacity: 0.4, sizeAttenuation: true
  });
  scene.add(new THREE.Points(cyanGeo, cyanMat));

  // ── DEPTH WARP RINGS ──
  for (let r = 0; r < 6; r++) {
    const ringGeo = new THREE.TorusGeometry(16 + r * 8, 0.05, 6, 80);
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x7c3aed, transparent: true, opacity: Math.max(0.005, 0.032 - r * 0.004)
    });
    const ring = new THREE.LineSegments(new THREE.EdgesGeometry(ringGeo), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.z = -20 - r * 14;
    scene.add(ring);
  }

  // ── WIREFRAME GEOMETRIES ──
  const eMat = (opacity = 0.22) => new THREE.LineBasicMaterial({
    color: 0x7c3aed, transparent: true, opacity
  });
  const eMatCyan = (opacity = 0.14) => new THREE.LineBasicMaterial({
    color: 0x06d6a0, transparent: true, opacity
  });
  const shapes = [];
  const addWire = (geo, pos, rot, rx, ry, mat) => {
    const m = new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat || eMat());
    m.position.set(...pos);
    m.rotation.set(...rot);
    scene.add(m);
    shapes.push({ m, rx, ry });
  };

  addWire(new THREE.IcosahedronGeometry(3.2, 0),  [12, 4, -20],   [0.3, 0.5, 0],   0.003, 0.004);
  addWire(new THREE.OctahedronGeometry(2.2, 0),   [-14, -3, -18], [0.5, 0.3, 0.1], 0.004, 0.003);
  addWire(new THREE.TetrahedronGeometry(2, 0),    [5, -6, -12],   [0.2, 0.8, 0.3], 0.005, 0.003);
  addWire(new THREE.BoxGeometry(2.2, 2.2, 2.2),   [-8, 5, -15],   [0.4, 0.4, 0],   0.003, 0.005);
  addWire(new THREE.TorusGeometry(2.2, 0.4, 8, 16), [16, -5, -22], [1.2, 0.3, 0],  0.004, 0.002);
  // extra shapes
  addWire(new THREE.DodecahedronGeometry(1.8, 0), [-5, 7, -14],   [0.6, 0.2, 0.4], 0.003, 0.004, eMat(0.16));
  addWire(new THREE.TorusGeometry(1.4, 0.3, 6, 12), [-18, 6, -24], [0.8, 0.4, 0.2], 0.005, 0.003, eMatCyan(0.12));
  addWire(new THREE.OctahedronGeometry(1.4, 0),   [18, 7, -16],   [0.3, 0.7, 0.1], 0.004, 0.005, eMatCyan(0.10));

  // ── MOUSE PARALLAX ──
  const mouse = { x: 0, y: 0 };
  const camTarget = { x: 0, y: 0 };
  window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 1.5;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 1.2;
  });

  // ── RESIZE ──
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── ANIMATE ──
  const clock = new THREE.Clock();

  // Don't render if hero is off screen
  let heroVisible = true;
  const heroSection = document.getElementById('hero');
  const observer = new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
  });
  if (heroSection) observer.observe(heroSection);

  function animate() {
    requestAnimationFrame(animate);
    if (!heroVisible) return;

    const t = clock.getElapsedTime();

    // smooth camera parallax
    camTarget.x += (mouse.x - camTarget.x) * 0.04;
    camTarget.y += (-mouse.y - camTarget.y) * 0.04;
    camera.position.x = camTarget.x;
    camera.position.y = camTarget.y;
    camera.lookAt(0, 0, 0);

    // rotate shapes
    shapes.forEach(s => {
      s.m.rotation.x += s.rx;
      s.m.rotation.y += s.ry;
    });

    // drift stars slowly
    stars.rotation.y = t * 0.006;
    stars.rotation.x = t * 0.003;

    // pulse glow particles
    glowMat.opacity = 0.45 + Math.sin(t * 0.8) * 0.08;
    cyanMat.opacity = 0.35 + Math.cos(t * 0.6) * 0.06;

    renderer.render(scene, camera);
  }

  animate();
})();
