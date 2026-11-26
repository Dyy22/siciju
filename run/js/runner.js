import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';
import { RunnerAudio } from './audio.js';

const STORAGE_KEY = 'siciju_runner_v1';
const LANES = [-2.6, 0, 2.6];

const els = {
  container: document.getElementById('runner-canvas'),
  scoreVal: document.getElementById('score-val'),
  multBadge: document.getElementById('mult-badge'),
  distVal: document.getElementById('dist-val'),
  bestVal: document.getElementById('best-val'),
  shieldPill: document.getElementById('shield-pill'),
  btnSound: document.getElementById('btn-sound'),
  btnPause: document.getElementById('btn-pause'),
  callout: document.getElementById('callout-banner'),
  touchPad: document.getElementById('touch-pad'),
  touchLeft: document.getElementById('touch-left'),
  touchRight: document.getElementById('touch-right'),
  touchDuck: document.getElementById('touch-duck'),
  touchJump: document.getElementById('touch-jump'),
  overlay: document.getElementById('run-overlay'),
  overlayEyebrow: document.getElementById('overlay-eyebrow'),
  overlayTitle: document.getElementById('overlay-title'),
  overlaySubtitle: document.getElementById('overlay-subtitle'),
  statsGrid: document.getElementById('stats-grid'),
  statScore: document.getElementById('stat-score'),
  statDist: document.getElementById('stat-dist'),
  statOrbs: document.getElementById('stat-orbs'),
  statBest: document.getElementById('stat-best'),
  newRecordBadge: document.getElementById('new-record-badge'),
  btnStart: document.getElementById('btn-start'),
  webglError: document.getElementById('webgl-error')
};

const reducedMotion =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch =
  (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
  (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

const audio = new RunnerAudio();

function loadBest() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { bestScore: 0, bestDistance: 0, totalOrbs: 0 };
    const parsed = JSON.parse(raw);
    return {
      bestScore: Number.isFinite(parsed.bestScore) && parsed.bestScore > 0 ? Math.floor(parsed.bestScore) : 0,
      bestDistance: Number.isFinite(parsed.bestDistance) && parsed.bestDistance > 0 ? Math.floor(parsed.bestDistance) : 0,
      totalOrbs: Number.isFinite(parsed.totalOrbs) && parsed.totalOrbs > 0 ? Math.floor(parsed.totalOrbs) : 0
    };
  } catch (_) {
    return { bestScore: 0, bestDistance: 0, totalOrbs: 0 };
  }
}

function saveBest(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
}

let records = loadBest();
els.bestVal.textContent = String(records.bestScore);

let calloutTimer = null;
function showCallout(text) {
  els.callout.textContent = text;
  els.callout.hidden = false;
  window.clearTimeout(calloutTimer);
  calloutTimer = window.setTimeout(() => {
    els.callout.hidden = true;
  }, 1550);
}

// ==========================================================================
// Three.js Renderer, Scene & Procedural Highway Assets
// ==========================================================================

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  els.webglError.textContent = 'WebGL is unavailable in this browser. Enable hardware acceleration to play Void Runner.';
  els.webglError.hidden = false;
  els.btnStart.disabled = true;
  throw err;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
els.container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060608);
scene.fog = new THREE.FogExp2(0x060608, 0.014);

const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.1, 220);
camera.position.set(0, 3.3, 6.2);
camera.lookAt(0, 1.0, -14);

scene.add(new THREE.HemisphereLight(0xdce6ff, 0x101016, 0.55));
scene.add(new THREE.AmbientLight(0xffffff, 0.25));

const dirLight = new THREE.DirectionalLight(0xf2f0ea, 1.1);
dirLight.position.set(8, 18, 10);
scene.add(dirLight);

function createHighwayTexture() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#09090e';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(242, 240, 234, 0.11)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    const y = (size / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Subtle lane divider ticks
  ctx.fillStyle = 'rgba(212, 255, 77, 0.42)';
  const laneOneThird = size / 3;
  const laneTwoThird = (size * 2) / 3;
  for (let d = 0; d < 4; d++) {
    ctx.fillRect(laneOneThird - 2, d * 128 + 20, 4, 64);
    ctx.fillRect(laneTwoThird - 2, d * 128 + 20, 4, 64);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 24);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGlowTex(hex) {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  g.addColorStop(0, hex);
  g.addColorStop(0.35, hex + '88');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const highwayTex = createHighwayTexture();
const trackGeo = new THREE.PlaneGeometry(8.8, 220);
const trackMat = new THREE.MeshStandardMaterial({
  map: highwayTex,
  roughness: 0.45,
  metalness: 0.25
});
const trackMesh = new THREE.Mesh(trackGeo, trackMat);
trackMesh.rotation.x = -Math.PI / 2;
trackMesh.position.set(0, 0, -96);
scene.add(trackMesh);

// Glowing outer track edge rails
const limeEmissiveMat = new THREE.MeshStandardMaterial({
  color: 0xd4ff4d,
  emissive: 0xd4ff4d,
  emissiveIntensity: 1.5,
  roughness: 0.2
});
const railGeo = new THREE.BoxGeometry(0.14, 0.14, 220);
const leftRail = new THREE.Mesh(railGeo, limeEmissiveMat);
leftRail.position.set(-4.45, 0.07, -96);
const rightRail = new THREE.Mesh(railGeo, limeEmissiveMat);
rightRail.position.set(4.45, 0.07, -96);
scene.add(leftRail, rightRail);

// Recycled Void Arches rushing past camera
const arches = [];
const archMat = new THREE.MeshStandardMaterial({ color: 0x15151d, roughness: 0.75, metalness: 0.2 });
const archTrimMat = new THREE.MeshBasicMaterial({ color: 0xd4ff4d, transparent: true, opacity: 0.42 });

for (let i = 0; i < 18; i++) {
  const g = new THREE.Group();
  const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.55, 7.2, 0.65), archMat);
  leftPost.position.set(-5.8, 3.6, 0);
  const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.55, 7.2, 0.65), archMat);
  rightPost.position.set(5.8, 3.6, 0);
  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.48, 0.65), archMat);
  topBeam.position.set(0, 7.2, 0);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.08, 0.12), archTrimMat);
  strip.position.set(0, 6.92, 0.3);
  g.add(leftPost, rightPost, topBeam, strip);
  g.position.set(0, 0, 8 - i * 11);
  scene.add(g);
  arches.push(g);
}

// Star streaks
const starCount = 420;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 90;
  starPos[i * 3 + 1] = 0.5 + Math.random() * 28;
  starPos[i * 3 + 2] = -Math.random() * 190 + 10;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starPoints = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: 0xf2f0ea, size: 0.18, transparent: true, opacity: 0.65 })
);
scene.add(starPoints);

// ==========================================================================
// Player Null Glider
// ==========================================================================

const gliderGroup = new THREE.Group();
const hullMat = new THREE.MeshStandardMaterial({
  color: 0x2a2d3a,
  emissive: 0x0b0e14,
  roughness: 0.28,
  metalness: 0.65
});

const hullGeo = new THREE.ConeGeometry(0.58, 2.0, 4);
hullGeo.rotateY(Math.PI / 4);
hullGeo.rotateX(-Math.PI / 2);
hullGeo.scale(1.15, 0.44, 1.0);
const hullBody = new THREE.Mesh(hullGeo, hullMat);
gliderGroup.add(hullBody);

const dorsalSpine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 1.45), limeEmissiveMat);
dorsalSpine.position.set(0, 0.2, -0.05);
gliderGroup.add(dorsalSpine);

const wingGeo = new THREE.BoxGeometry(1.75, 0.07, 0.62);
const wingMesh = new THREE.Mesh(wingGeo, hullMat);
wingMesh.position.set(0, -0.02, 0.34);
gliderGroup.add(wingMesh);

const wingTrim = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.08), limeEmissiveMat);
wingTrim.position.set(0, 0.01, 0.66);
gliderGroup.add(wingTrim);

const finGeo = new THREE.BoxGeometry(0.06, 0.28, 0.42);
const finL = new THREE.Mesh(finGeo, hullMat);
finL.position.set(-0.66, 0.12, 0.52);
finL.rotation.z = 0.22;
const finR = new THREE.Mesh(finGeo, hullMat);
finR.position.set(0.66, 0.12, 0.52);
finR.rotation.z = -0.22;
gliderGroup.add(finL, finR);

const thruster = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), limeEmissiveMat);
thruster.position.set(0, 0, 0.96);
gliderGroup.add(thruster);

const gliderHalo = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: createGlowTex('#d4ff4d'),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
);
gliderHalo.position.set(0, 0, 1.04);
gliderHalo.scale.set(1.3, 1.3, 1);
gliderGroup.add(gliderHalo);

const gliderLight = new THREE.PointLight(0xd4ff4d, 6.5, 9, 1.6);
gliderLight.position.set(0, 0.4, 0.35);
gliderGroup.add(gliderLight);

const shieldBubble = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.15, 1),
  new THREE.MeshBasicMaterial({
    color: 0x4df3ff,
    wireframe: true,
    transparent: true,
    opacity: 0.52
  })
);
shieldBubble.visible = false;
gliderGroup.add(shieldBubble);

gliderGroup.position.set(0, 0.58, 0);
scene.add(gliderGroup);

// ==========================================================================
// Obstacles, Collectibles & Burst Particles
// ==========================================================================

const hazardBodyMat = new THREE.MeshStandardMaterial({ color: 0x16141a, roughness: 0.5, metalness: 0.35 });
const hazardTrimMat = new THREE.MeshStandardMaterial({
  color: 0xff6b52,
  emissive: 0xff6b52,
  emissiveIntensity: 1.5,
  roughness: 0.25
});
const shifterTrimMat = new THREE.MeshStandardMaterial({
  color: 0xffb84d,
  emissive: 0xffb84d,
  emissiveIntensity: 1.4,
  roughness: 0.25
});
const shieldOrbMat = new THREE.MeshStandardMaterial({
  color: 0x4df3ff,
  emissive: 0x4df3ff,
  emissiveIntensity: 1.6,
  roughness: 0.2
});

const activeObstacles = [];
const activeCollectibles = [];
const shards = [];

function spawnBurst(x, y, z, colorHex, count = 16) {
  const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 1 });
  const geo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, mat.clone());
    m.position.set(x, y, z);
    const angle = Math.random() * Math.PI * 2;
    const spd = 2.5 + Math.random() * 6.5;
    scene.add(m);
    shards.push({
      mesh: m,
      vx: Math.cos(angle) * spd,
      vy: 1.5 + Math.random() * 6.0,
      vz: (Math.random() - 0.5) * 6.0,
      life: 0.75 + Math.random() * 0.35
    });
  }
}

const hazardEdgeMat = new THREE.LineBasicMaterial({ color: 0xff6b52, transparent: true, opacity: 0.6 });
const shifterEdgeMat = new THREE.LineBasicMaterial({ color: 0xffb84d, transparent: true, opacity: 0.65 });

function addEdgeOutline(mesh, edgeMat) {
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat);
  mesh.add(edges);
}

function createObstacle(type, laneIdx, zPos, extra = {}) {
  const x = LANES[laneIdx];
  const group = new THREE.Group();
  let box;

  if (type === 'pillar') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.75, 4.2, 1.4), hazardBodyMat);
    body.position.y = 2.1;
    addEdgeOutline(body, hazardEdgeMat);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.16, 1.46), hazardTrimMat);
    trim.position.y = 1.25;
    const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.12, 1.46), hazardTrimMat);
    baseTrim.position.y = 0.08;
    group.add(body, trim, baseTrim);
    box = { halfW: 0.78, minY: 0, maxY: 4.1, halfD: 0.62 };
  } else if (type === 'low') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.86, 0.9), hazardBodyMat);
    body.position.y = 0.43;
    addEdgeOutline(body, hazardEdgeMat);
    const laser = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.16, 0.96), hazardTrimMat);
    laser.position.y = 0.84;
    group.add(body, laser);
    box = { halfW: 0.84, minY: 0, maxY: 0.88, halfD: 0.42 };
  } else if (type === 'high') {
    // Overhead crossbar at y=0.64..2.35 -> duck underneath or switch lane!
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.35, 0.36), hazardBodyMat);
    postL.position.set(-1.02, 1.175, 0);
    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.35, 0.36), hazardBodyMat);
    postR.position.set(1.02, 1.175, 0);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.7, 0.8), hazardBodyMat);
    bar.position.y = 1.5;
    addEdgeOutline(bar, hazardEdgeMat);
    const bottomLaser = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.14, 0.84), hazardTrimMat);
    bottomLaser.position.y = 0.65;
    group.add(postL, postR, bar, bottomLaser);
    box = { halfW: 0.86, minY: 0.62, maxY: 2.35, halfD: 0.42 };
  } else if (type === 'shifter') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.6, 1.2), hazardBodyMat);
    body.position.y = 1.3;
    addEdgeOutline(body, shifterEdgeMat);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.18, 1.26), shifterTrimMat);
    trim.position.y = 1.3;
    group.add(body, trim);
    box = { halfW: 0.74, minY: 0, maxY: 2.6, halfD: 0.52 };
  }

  group.position.set(x, 0, zPos);
  scene.add(group);
  activeObstacles.push({
    type,
    group,
    box,
    baseX: x,
    shiftSpan: extra.shiftSpan || 0,
    shiftPhase: extra.shiftPhase || 0,
    nearMissed: false
  });
}

function createCollectible(kind, laneIdx, yPos, zPos) {
  const x = LANES[laneIdx];
  let mesh;
  if (kind === 'shield') {
    mesh = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.11, 12, 28), shieldOrbMat);
  } else {
    mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), limeEmissiveMat);
  }
  mesh.position.set(x, yPos, zPos);
  scene.add(mesh);
  activeCollectibles.push({ kind, mesh, baseY: yPos });
}

// ==========================================================================
// Game State, Wave Spawner & Physics
// ==========================================================================

const state = {
  mode: 'menu', // 'menu' | 'playing' | 'paused' | 'gameover'
  speed: 25,
  distance: 0,
  score: 0,
  orbs: 0,
  combo: 0,
  multiplier: 1,
  shield: false,
  lane: 1,
  posY: 0.58,
  velY: 0,
  onGround: true,
  duckTimer: 0,
  nextSpawnZ: -45,
  nextMilestone: 250,
  shake: 0,
  elapsed: 0
};

function clearEntities() {
  for (const ob of activeObstacles) scene.remove(ob.group);
  activeObstacles.length = 0;
  for (const col of activeCollectibles) scene.remove(col.mesh);
  activeCollectibles.length = 0;
  for (const s of shards) scene.remove(s.mesh);
  shards.length = 0;
}

function updateHUD() {
  els.scoreVal.textContent = String(Math.floor(state.score));
  els.multBadge.textContent = '×' + state.multiplier;
  els.distVal.textContent = Math.floor(state.distance) + 'm';
  els.bestVal.textContent = String(records.bestScore);
  els.shieldPill.hidden = !state.shield;
  shieldBubble.visible = state.shield;
}

function resetGame() {
  clearEntities();
  state.mode = 'playing';
  state.speed = 25;
  state.distance = 0;
  state.score = 0;
  state.orbs = 0;
  state.combo = 0;
  state.multiplier = 1;
  state.shield = false;
  state.lane = 1;
  state.posY = 0.58;
  state.velY = 0;
  state.onGround = true;
  state.duckTimer = 0;
  state.nextSpawnZ = -48;
  state.nextMilestone = 250;
  state.shake = 0;

  gliderGroup.position.set(0, 0.58, 0);
  gliderGroup.rotation.set(0, 0, 0);
  gliderGroup.scale.set(1, 1, 1);

  for (let i = 0; i < 6; i++) {
    spawnWave();
  }

  els.overlay.hidden = true;
  if (isTouch) els.touchPad.hidden = false;
  updateHUD();
}

function pauseGame() {
  if (state.mode !== 'playing') return;
  state.mode = 'paused';
  els.overlayEyebrow.textContent = '∅ PAUSED';
  els.overlayTitle.textContent = 'DRIFT SUSPENDED';
  els.overlaySubtitle.textContent = 'Take a breather. The void is patiently waiting.';
  els.statsGrid.hidden = true;
  els.btnStart.textContent = 'RESUME DRIFT';
  els.overlay.hidden = false;
}

function resumeGame() {
  if (state.mode !== 'paused') return;
  audio.unlock();
  state.mode = 'playing';
  els.overlay.hidden = true;
}

function triggerGameOver() {
  state.mode = 'gameover';
  audio.playCrash();
  state.shake = 0.6;
  spawnBurst(gliderGroup.position.x, gliderGroup.position.y, 0, 0xff6b52, 26);

  const finalScore = Math.floor(state.score);
  const finalDist = Math.floor(state.distance);
  const isNewRecord = finalScore > records.bestScore;

  if (isNewRecord) records.bestScore = finalScore;
  if (finalDist > records.bestDistance) records.bestDistance = finalDist;
  records.totalOrbs += state.orbs;
  saveBest(records);
  updateHUD();

  els.overlayEyebrow.textContent = '∅ COLLISION DETECTED';
  els.overlayTitle.textContent = 'RUN TERMINATED';
  els.overlaySubtitle.textContent =
    finalDist >= 1000
      ? 'Impressive distance. Still zero destination at the end.'
      : 'You crashed into solid nothingness.';

  els.statScore.textContent = String(finalScore);
  els.statDist.textContent = finalDist + 'm';
  els.statOrbs.textContent = String(state.orbs);
  els.statBest.textContent = String(records.bestScore);
  els.newRecordBadge.hidden = !isNewRecord;
  els.statsGrid.hidden = false;
  els.btnStart.textContent = 'RUN AGAIN';
  els.overlay.hidden = false;
}

function spawnWave() {
  const z = state.nextSpawnZ;
  const dist = state.distance + Math.abs(z);
  const roll = Math.random();

  if (dist > 350 && roll < 0.2) {
    // Shifting pillar between two adjacent lanes (3rd lane stays safe)
    const dir = Math.random() < 0.5 ? 1 : -1;
    const startLane = dir > 0 ? 0 : 2;
    createObstacle('shifter', startLane, z, {
      shiftSpan: dir * 2.6,
      shiftPhase: Math.random() * Math.PI * 2
    });
    const safeLane = dir > 0 ? 2 : 0;
    createCollectible('orb', safeLane, 0.85, z);
  } else if (roll < 0.44) {
    // 1 or 2 pillars blocking lanes (always leaves at least 1 clear lane)
    const lanes = [0, 1, 2];
    const safeLane = lanes.splice(Math.floor(Math.random() * lanes.length), 1)[0];
    const blockCount = dist > 160 && Math.random() < 0.55 ? 2 : 1;
    for (let i = 0; i < blockCount; i++) {
      createObstacle('pillar', lanes[i], z);
    }
    if (Math.random() < 0.85) {
      createCollectible('orb', safeLane, 0.85, z - 2);
      createCollectible('orb', safeLane, 0.85, z + 2);
    }
  } else if (roll < 0.74) {
    // Low laser hurdles (jump over or dodge)
    const count = dist > 200 && Math.random() < 0.45 ? 3 : Math.random() < 0.5 ? 2 : 1;
    const indices = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, count);
    for (const lane of indices) {
      createObstacle('low', lane, z);
      if (Math.random() < 0.65) {
        createCollectible('orb', lane, 2.25, z);
      }
    }
  } else {
    // High overhead gates (duck underneath or switch lane)
    const count = dist > 220 && Math.random() < 0.4 ? 3 : 2;
    const indices = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, count);
    for (const lane of indices) {
      createObstacle('high', lane, z);
      if (Math.random() < 0.6) {
        createCollectible('orb', lane, 0.45, z);
      }
    }
  }

  // Rare Phase Shield spawn
  if (!state.shield && Math.random() < 0.075) {
    const lane = Math.floor(Math.random() * 3);
    createCollectible('shield', lane, 1.0, z - 9);
  }

  const gap = Math.max(16.5, state.speed * 0.5 + Math.random() * 5);
  state.nextSpawnZ -= gap;
}

// ==========================================================================
// Player Actions & Input
// ==========================================================================

function switchLane(delta) {
  if (state.mode !== 'playing') return;
  const next = Math.max(0, Math.min(2, state.lane + delta));
  if (next !== state.lane) {
    state.lane = next;
    audio.playLaneSwitch(delta);
  }
}

function triggerJump() {
  if (state.mode !== 'playing') return;
  if (state.onGround) {
    state.velY = 14.5;
    state.onGround = false;
    state.duckTimer = 0;
    audio.playJump();
  }
}

function triggerDuck() {
  if (state.mode !== 'playing') return;
  if (!state.onGround) {
    state.velY = Math.min(state.velY, -24);
  }
  state.duckTimer = 0.48;
  audio.playDuck();
}

window.addEventListener('keydown', (e) => {
  const code = e.code;

  if (code === 'Escape' || code === 'KeyP') {
    if (state.mode === 'playing') pauseGame();
    else if (state.mode === 'paused') resumeGame();
    return;
  }

  if (code === 'KeyM') {
    toggleAudio();
    return;
  }

  if (state.mode === 'menu' || state.mode === 'gameover') {
    if (code === 'Space' || code === 'Enter') {
      e.preventDefault();
      audio.unlock();
      resetGame();
    }
    return;
  }

  if (state.mode !== 'playing') return;

  if (code === 'ArrowLeft' || code === 'KeyA') {
    e.preventDefault();
    switchLane(-1);
  } else if (code === 'ArrowRight' || code === 'KeyD') {
    e.preventDefault();
    switchLane(1);
  } else if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') {
    e.preventDefault();
    triggerJump();
  } else if (code === 'ArrowDown' || code === 'KeyS') {
    e.preventDefault();
    triggerDuck();
  }
});

// Touch Swipes on Canvas + On-Screen Pad
let swipeStartX = 0;
let swipeStartY = 0;
renderer.domElement.addEventListener('touchstart', (e) => {
  if (state.mode !== 'playing') return;
  const t = e.changedTouches[0];
  if (!t) return;
  swipeStartX = t.clientX;
  swipeStartY = t.clientY;
}, { passive: true });

renderer.domElement.addEventListener('touchend', (e) => {
  if (state.mode !== 'playing') return;
  const t = e.changedTouches[0];
  if (!t) return;
  const dx = t.clientX - swipeStartX;
  const dy = t.clientY - swipeStartY;
  if (Math.hypot(dx, dy) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    switchLane(dx > 0 ? 1 : -1);
  } else if (dy < 0) {
    triggerJump();
  } else {
    triggerDuck();
  }
}, { passive: true });

els.touchLeft.addEventListener('click', () => switchLane(-1));
els.touchRight.addEventListener('click', () => switchLane(1));
els.touchJump.addEventListener('click', triggerJump);
els.touchDuck.addEventListener('click', triggerDuck);

function toggleAudio() {
  const next = !audio.isEnabled();
  audio.setEnabled(next);
  els.btnSound.setAttribute('aria-pressed', String(next));
  els.btnSound.textContent = next ? 'sound: on' : 'sound: off';
}

els.btnSound.addEventListener('click', toggleAudio);
els.btnPause.addEventListener('click', () => {
  if (state.mode === 'playing') pauseGame();
  else if (state.mode === 'paused') resumeGame();
});
els.btnStart.addEventListener('click', () => {
  audio.unlock();
  if (state.mode === 'paused') resumeGame();
  else resetGame();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.mode === 'playing') {
    pauseGame();
  }
});

// ==========================================================================
// Main Game Loop
// ==========================================================================

let lastTime = performance.now();

function stepPlaying(dt) {
  state.speed = Math.min(54, 25 + state.distance * 0.014);
  const dz = state.speed * dt;
  state.distance += dz;
  state.score += dz * 1.4 * state.multiplier;
  state.nextSpawnZ += dz;

  audio.tickBeat(dt, state.speed, true);

  if (state.distance >= state.nextMilestone) {
    audio.playMilestone();
    showCallout(state.nextMilestone + 'M REACHED · STILL NOTHING');
    state.nextMilestone *= 2;
  }

  // Scroll highway & recycle arches / stars
  highwayTex.offset.y -= dz * 0.11;

  for (const arch of arches) {
    arch.position.z += dz;
    if (arch.position.z > 14) {
      arch.position.z -= 18 * 11;
    }
  }

  const sAttr = starGeo.attributes.position;
  for (let i = 0; i < starCount; i++) {
    let sz = sAttr.getZ(i) + dz * 1.4;
    if (sz > 14) sz -= 200;
    sAttr.setZ(i, sz);
  }
  sAttr.needsUpdate = true;

  // Glider lateral & vertical movement
  const targetX = LANES[state.lane];
  const prevX = gliderGroup.position.x;
  gliderGroup.position.x += (targetX - prevX) * Math.min(1, dt * 16);
  const vx = (gliderGroup.position.x - prevX) / Math.max(0.001, dt);
  gliderGroup.rotation.z = THREE.MathUtils.clamp(-vx * 0.045, -0.55, 0.55);

  if (state.duckTimer > 0) {
    state.duckTimer = Math.max(0, state.duckTimer - dt);
  }

  if (!state.onGround) {
    state.velY -= 38 * dt;
    state.posY += state.velY * dt;
    const floorY = state.duckTimer > 0 ? 0.34 : 0.58;
    if (state.posY <= floorY) {
      state.posY = floorY;
      state.velY = 0;
      state.onGround = true;
    }
  } else {
    const targetGroundY = state.duckTimer > 0 ? 0.34 : 0.58;
    state.posY += (targetGroundY - state.posY) * Math.min(1, dt * 20);
  }

  const hoverBob = state.onGround && !reducedMotion && state.duckTimer <= 0 ? Math.sin(state.elapsed * 9) * 0.04 : 0;
  gliderGroup.position.y = state.posY + hoverBob;

  const targetScaleY = state.duckTimer > 0 ? 0.52 : 1.0;
  gliderGroup.scale.y += (targetScaleY - gliderGroup.scale.y) * Math.min(1, dt * 18);

  if (shieldBubble.visible) {
    shieldBubble.rotation.y += dt * 1.8;
    shieldBubble.rotation.x += dt * 0.9;
  }

  // Player hitbox
  const pX = gliderGroup.position.x;
  const pHalfW = 0.42;
  const pHalfD = 0.55;
  const pMinY = state.posY - (state.duckTimer > 0 ? 0.16 : 0.28);
  const pMaxY = state.posY + (state.duckTimer > 0 ? 0.16 : 0.27);

  // Spawn upcoming waves as needed
  while (state.nextSpawnZ > -145) {
    spawnWave();
  }

  // Update Obstacles & Collisions
  for (let i = activeObstacles.length - 1; i >= 0; i--) {
    const ob = activeObstacles[i];
    ob.group.position.z += dz;

    if (ob.type === 'shifter') {
      const wave = (Math.sin(state.elapsed * 2.6 + ob.shiftPhase) + 1) * 0.5;
      ob.group.position.x = ob.baseX + wave * ob.shiftSpan;
    }

    const oz = ob.group.position.z;
    const ox = ob.group.position.x;
    const b = ob.box;

    // Collision check around z = 0
    if (Math.abs(oz) < pHalfD + b.halfD) {
      const overlapX = Math.abs(pX - ox) < pHalfW + b.halfW;
      const overlapY = pMaxY > b.minY && pMinY < b.maxY;
      if (overlapX && overlapY) {
        if (state.shield) {
          state.shield = false;
          audio.playShieldBreak();
          state.shake = 0.35;
          spawnBurst(ox, 1.0, oz, 0x4df3ff, 22);
          showCallout('SHIELD SHATTERED');
          scene.remove(ob.group);
          activeObstacles.splice(i, 1);
          continue;
        } else {
          triggerGameOver();
          return;
        }
      }
    }

    // Near-miss bonus once passed behind z = 0.9
    if (!ob.nearMissed && oz > 0.9) {
      ob.nearMissed = true;
      const edgeGap = Math.abs(pX - ox) - (pHalfW + b.halfW);
      if (edgeGap >= 0 && edgeGap < 0.72) {
        state.score += 75 * state.multiplier;
        audio.playNearMiss();
        showCallout('NEAR MISS +' + 75 * state.multiplier);
      }
    }

    if (oz > 12) {
      scene.remove(ob.group);
      activeObstacles.splice(i, 1);
    }
  }

  // Update Collectibles
  for (let i = activeCollectibles.length - 1; i >= 0; i--) {
    const col = activeCollectibles[i];
    col.mesh.position.z += dz;
    col.mesh.rotation.y += dt * 3.0;
    col.mesh.position.y = col.baseY + Math.sin(state.elapsed * 4 + i) * 0.1;

    const dx = col.mesh.position.x - pX;
    const dy = col.mesh.position.y - gliderGroup.position.y;
    const dzCol = col.mesh.position.z;

    if (Math.abs(dzCol) < 1.05 && Math.abs(dx) < 0.95 && Math.abs(dy) < 0.9) {
      if (col.kind === 'shield') {
        state.shield = true;
        audio.playShieldPickup();
        spawnBurst(col.mesh.position.x, col.mesh.position.y, dzCol, 0x4df3ff, 18);
        showCallout('PHASE SHIELD ONLINE');
      } else {
        state.orbs++;
        state.combo++;
        state.multiplier = Math.min(5, 1 + Math.floor(state.combo / 5));
        state.score += 50 * state.multiplier;
        audio.playOrb(state.multiplier);
        spawnBurst(col.mesh.position.x, col.mesh.position.y, dzCol, 0xd4ff4d, 10);
      }
      scene.remove(col.mesh);
      activeCollectibles.splice(i, 1);
      continue;
    }

    if (col.mesh.position.z > 10) {
      scene.remove(col.mesh);
      activeCollectibles.splice(i, 1);
    }
  }

  // Dynamic Camera follow + speed FOV + subtle shake
  const targetFov = 66 + ((state.speed - 25) / 29) * 14;
  if (!reducedMotion && Math.abs(camera.fov - targetFov) > 0.08) {
    camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 4);
    camera.updateProjectionMatrix();
  }

  updateHUD();
}

function animate(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) * 0.001));
  lastTime = now;
  state.elapsed += dt;

  if (state.mode === 'playing') {
    stepPlaying(dt);
  } else if (state.mode === 'menu') {
    highwayTex.offset.y -= dt * 1.4;
    gliderGroup.position.y = 0.58 + Math.sin(state.elapsed * 2.5) * 0.08;
  }

  // Shard burst particles update
  for (let i = shards.length - 1; i >= 0; i--) {
    const s = shards[i];
    s.life -= dt;
    if (s.life <= 0) {
      scene.remove(s.mesh);
      shards.splice(i, 1);
      continue;
    }
    s.vy -= 18 * dt;
    s.mesh.position.x += s.vx * dt;
    s.mesh.position.y += s.vy * dt;
    s.mesh.position.z += s.vz * dt;
    s.mesh.rotation.x += dt * 6;
    s.mesh.rotation.y += dt * 5;
    s.mesh.material.opacity = Math.max(0, s.life * 1.2);
  }

  // Camera shake & subtle X follow
  state.shake = Math.max(0, state.shake - dt * 1.8);
  const sx = state.shake > 0 && !reducedMotion ? (Math.random() - 0.5) * state.shake : 0;
  const sy = state.shake > 0 && !reducedMotion ? (Math.random() - 0.5) * state.shake : 0;
  camera.position.x = gliderGroup.position.x * 0.42 + sx;
  camera.position.y = 3.25 + (state.posY - 0.58) * 0.35 + sy;
  camera.lookAt(gliderGroup.position.x * 0.25, 1.0, -16);

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
