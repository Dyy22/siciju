import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';
import { VoidAudio } from './audio.js';
import { ANOMALIES, buildVoidWorld } from './world.js';

const STORAGE_KEY = 'siciju_play_v1';
const VALID_ANOMALY_IDS = ANOMALIES.map((a) => a.id);

const els = {
  container: document.getElementById('canvas-container'),
  zoneIndicator: document.getElementById('zone-indicator'),
  btnLog: document.getElementById('btn-log'),
  anomalyCount: document.getElementById('anomaly-count'),
  btnFlashlight: document.getElementById('btn-flashlight'),
  btnAudio: document.getElementById('btn-audio'),
  btnLowGrav: document.getElementById('btn-lowgrav'),
  btnPause: document.getElementById('btn-pause'),
  reticle: document.getElementById('reticle'),
  interactPrompt: document.getElementById('interact-prompt'),
  interactLabel: document.getElementById('interact-label'),
  narratorBanner: document.getElementById('narrator-banner'),
  narratorTag: document.getElementById('narrator-tag'),
  narratorText: document.getElementById('narrator-text'),
  touchControls: document.getElementById('touch-controls'),
  touchStickBase: document.getElementById('touch-stick-base'),
  touchStickKnob: document.getElementById('touch-stick-knob'),
  touchJump: document.getElementById('touch-jump'),
  touchInteract: document.getElementById('touch-interact'),
  menuOverlay: document.getElementById('menu-overlay'),
  menuAchCount: document.getElementById('menu-ach-count'),
  anomalyList: document.getElementById('anomaly-list'),
  completeBanner: document.getElementById('complete-banner'),
  btnDownloadCert: document.getElementById('btn-download-cert'),
  btnEnter: document.getElementById('btn-enter'),
  webglError: document.getElementById('webgl-error'),
  warpVeil: document.getElementById('warp-veil')
};

const reducedMotion =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice =
  window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

const audio = new VoidAudio();

function loadProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const unique = [];
    for (const id of parsed) {
      if (VALID_ANOMALY_IDS.includes(id) && !unique.includes(id)) {
        unique.push(id);
      }
    }
    return unique;
  } catch (_) {
    return [];
  }
}

function saveProgress(list) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

const discovered = loadProgress();
let isPlaying = false;
let isWarping = false;
let lowGravity = false;
let portalNotified = false;
let narratorTimer = null;
const startTimestamp = Date.now();

function speak(tag, message, duration = 4800) {
  els.narratorTag.textContent = tag;
  els.narratorText.textContent = message;
  els.narratorBanner.hidden = false;
  window.clearTimeout(narratorTimer);
  narratorTimer = window.setTimeout(() => {
    els.narratorBanner.hidden = true;
  }, duration);
}

function renderAnomalyUI() {
  const count = discovered.length;
  els.anomalyCount.textContent = String(count);
  els.menuAchCount.textContent = String(count);

  els.anomalyList.textContent = '';
  for (const item of ANOMALIES) {
    const found = discovered.includes(item.id);
    const li = document.createElement('li');
    li.className = 'anomaly-item' + (found ? ' is-found' : '');

    const mark = document.createElement('span');
    mark.className = 'anomaly-mark';
    mark.textContent = found ? '[✓]' : '[ ]';

    const body = document.createElement('div');
    const name = document.createElement('span');
    name.className = 'anomaly-name';
    name.textContent = item.title + ' · ' + item.sector;

    const hint = document.createElement('span');
    hint.className = 'anomaly-hint';
    hint.textContent = found ? item.foundDesc : item.hint;

    body.appendChild(name);
    body.appendChild(hint);
    li.appendChild(mark);
    li.appendChild(body);
    els.anomalyList.appendChild(li);
  }

  if (count === ANOMALIES.length) {
    els.completeBanner.hidden = false;
    els.btnLowGrav.hidden = false;
  }
}

function downloadExplorerCert() {
  const elapsedSec = Math.max(1, Math.floor((Date.now() - startTimestamp) / 1000));
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const text = [
    '+--------------------------------------------------------------+',
    '|            3D VOID EXPLORER CERTIFICATE · SECTOR ∅           |',
    '|                     siciju.online/play/                      |',
    '+--------------------------------------------------------------+',
    '',
    'This certifies that the explorer wandered behind the empty',
    'homepage of siciju.online and documented every 3D anomaly.',
    '',
    '  Anomalies Found : ' + discovered.length + ' / ' + ANOMALIES.length,
    '  Session Time    : ' + elapsedSec + 's',
    '  Low-G Unlocked  : YES',
    '  Meaningful Loot : 0.00 KB (rendered in 3D)',
    '  Timestamp (UTC) : ' + now,
    '',
    'Signed from Origin (0, 0, 0),',
    '∅ Sector ∅ · siciju.online',
    '+--------------------------------------------------------------+'
  ].join('\n');

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '3d-void-explorer-certificate.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ==========================================================================
// Three.js Scene, Renderer & Camera Setup
// ==========================================================================

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  els.webglError.textContent = 'WebGL is unavailable in this browser. Enable hardware acceleration to explore Sector ∅.';
  els.webglError.hidden = false;
  els.btnEnter.disabled = true;
  throw err;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
els.container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060608);
scene.fog = new THREE.FogExp2(0x060608, 0.022);

const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.1, 180);
const euler = new THREE.Euler(0, 0, 0, 'YXZ');

// Handheld Camera Flashlight
const flashlight = new THREE.SpotLight(0xf6f4e8, 28, 38, Math.PI / 4.2, 0.52, 1.35);
flashlight.position.set(0.18, -0.15, 0);
const flashTarget = new THREE.Object3D();
flashTarget.position.set(0, -0.05, -8);
camera.add(flashlight);
camera.add(flashTarget);
flashlight.target = flashTarget;
scene.add(camera);

let flashlightOn = true;
function toggleFlashlight() {
  flashlightOn = !flashlightOn;
  flashlight.visible = flashlightOn;
  els.btnFlashlight.setAttribute('aria-pressed', String(flashlightOn));
  els.btnFlashlight.textContent = flashlightOn ? 'light: on' : 'light: off';
  audio.playFlashlight(flashlightOn);
}

const world = buildVoidWorld(scene);
if (discovered.length === ANOMALIES.length) {
  world.activateCentralPortal();
  portalNotified = true;
}

function discover(id) {
  if (discovered.includes(id)) return;
  discovered.push(id);
  saveProgress(discovered);
  renderAnomalyUI();
  audio.playAnomalyFound();

  if (discovered.length === ANOMALIES.length) {
    world.activateCentralPortal();
    if (!portalNotified) {
      portalNotified = true;
      window.setTimeout(() => {
        audio.playVictory();
        speak(
          'ALL 5 ANOMALIES FOUND',
          'The Central Atrium beacon is awake! Press [G] for Low-Gravity mode or open Menu for your certificate.',
          7000
        );
      }, 900);
    }
  }
}

renderAnomalyUI();

// ==========================================================================
// Player Physics & Input (WASD + PointerLock + Drag Fallback + Mobile Touch)
// ==========================================================================

const player = {
  pos: new THREE.Vector3(0, 0, 7.5),
  vel: new THREE.Vector3(),
  radius: 0.45,
  height: 1.72,
  eyeHeight: 1.62,
  onGround: true,
  coyoteTimer: 0,
  bobPhase: 0,
  lastBobSin: 0
};

camera.position.set(player.pos.x, player.pos.y + player.eyeHeight, player.pos.z);

const keys = Object.create(null);
const touchMove = { x: 0, y: 0 };
let isPointerLocked = false;
let isDraggingLook = false;
let lastLookX = 0;
let lastLookY = 0;
let activeLookTouchId = null;

function openMenu() {
  isPlaying = false;
  isDraggingLook = false;
  els.menuOverlay.hidden = false;
  els.btnEnter.textContent = discovered.length > 0 ? 'RESUME EXPLORATION' : 'ENTER THE VOID';
  if (document.pointerLockElement) {
    try {
      document.exitPointerLock();
    } catch (_) {}
  }
}

function enterGame() {
  audio.unlock();
  isPlaying = true;
  els.menuOverlay.hidden = true;
  if (!isTouchDevice && renderer.domElement.requestPointerLock) {
    try {
      renderer.domElement.requestPointerLock();
    } catch (_) {}
  }
  if (isTouchDevice) {
    els.touchControls.hidden = false;
  }
  speak('SECTOR ∅', 'Follow the glowing floor guide lines or climb the NE stepped bridge to explore.', 4200);
}

document.addEventListener('pointerlockchange', () => {
  const wasLocked = isPointerLocked;
  isPointerLocked = document.pointerLockElement === renderer.domElement;
  if (wasLocked && !isPointerLocked && isPlaying) {
    openMenu();
  }
});

window.addEventListener('mousemove', (e) => {
  if (!isPlaying) return;
  if (isPointerLocked) {
    euler.y -= e.movementX * 0.0022;
    euler.x = Math.max(-Math.PI / 2.15, Math.min(Math.PI / 2.15, euler.x - e.movementY * 0.0022));
    camera.quaternion.setFromEuler(euler);
  } else if (isDraggingLook) {
    const dx = e.clientX - lastLookX;
    const dy = e.clientY - lastLookY;
    lastLookX = e.clientX;
    lastLookY = e.clientY;
    euler.y -= dx * 0.004;
    euler.x = Math.max(-Math.PI / 2.15, Math.min(Math.PI / 2.15, euler.x - dy * 0.004));
    camera.quaternion.setFromEuler(euler);
  }
});

renderer.domElement.addEventListener('mousedown', (e) => {
  if (!isPlaying) return;
  if (e.button !== 0) return;
  if (currentTarget) {
    triggerInteraction();
    return;
  }
  if (!isPointerLocked && !isTouchDevice) {
    isDraggingLook = true;
    lastLookX = e.clientX;
    lastLookY = e.clientY;
    if (renderer.domElement.requestPointerLock) {
      try {
        renderer.domElement.requestPointerLock();
      } catch (_) {}
    }
  }
});

window.addEventListener('mouseup', () => {
  isDraggingLook = false;
});

// Touch Look & Virtual Joystick
if (isTouchDevice) {
  let stickTouchId = null;

  function updateStick(touch) {
    const rect = els.touchStickBase.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.36;
    let dx = touch.clientX - cx;
    let dy = touch.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    touchMove.x = dx / maxR;
    touchMove.y = dy / maxR;
    els.touchStickKnob.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px))`;
  }

  els.touchStickBase.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    if (!t) return;
    stickTouchId = t.identifier;
    updateStick(t);
  }, { passive: true });

  els.touchStickBase.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickTouchId) {
        updateStick(t);
      }
    }
  }, { passive: true });

  const resetStick = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickTouchId) {
        stickTouchId = null;
        touchMove.x = 0;
        touchMove.y = 0;
        els.touchStickKnob.style.transform = 'translate(-50%, -50%)';
      }
    }
  };
  els.touchStickBase.addEventListener('touchend', resetStick, { passive: true });
  els.touchStickBase.addEventListener('touchcancel', resetStick, { passive: true });

  renderer.domElement.addEventListener('touchstart', (e) => {
    if (!isPlaying) return;
    const t = e.changedTouches[0];
    if (!t) return;
    activeLookTouchId = t.identifier;
    lastLookX = t.clientX;
    lastLookY = t.clientY;
  }, { passive: true });

  renderer.domElement.addEventListener('touchmove', (e) => {
    if (!isPlaying) return;
    for (const t of e.changedTouches) {
      if (t.identifier === activeLookTouchId) {
        const dx = t.clientX - lastLookX;
        const dy = t.clientY - lastLookY;
        lastLookX = t.clientX;
        lastLookY = t.clientY;
        euler.y -= dx * 0.0055;
        euler.x = Math.max(-Math.PI / 2.15, Math.min(Math.PI / 2.15, euler.x - dy * 0.0055));
        camera.quaternion.setFromEuler(euler);
      }
    }
  }, { passive: true });

  renderer.domElement.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === activeLookTouchId) activeLookTouchId = null;
    }
  }, { passive: true });

  els.touchJump.addEventListener('click', () => attemptJump());
  els.touchInteract.addEventListener('click', () => triggerInteraction());
}

function attemptJump() {
  if (!isPlaying) return;
  if (player.onGround || player.coyoteTimer > 0) {
    player.vel.y = lowGravity ? 9.6 : 7.6;
    player.onGround = false;
    player.coyoteTimer = 0;
    audio.playJump();
  }
}

function toggleLowGravity() {
  if (discovered.length < ANOMALIES.length) return;
  lowGravity = !lowGravity;
  els.btnLowGrav.setAttribute('aria-pressed', String(lowGravity));
  els.btnLowGrav.textContent = lowGravity ? 'low-g: on' : 'low-g: off';
  audio.playInteractPing();
  speak('GRAVITY OVERRIDE', lowGravity ? 'Low-gravity mode active. Enjoy moon jumps across the void.' : 'Normal gravity restored.');
}

window.addEventListener('keydown', (e) => {
  const code = e.code;
  keys[code] = true;

  if (code === 'Escape') {
    if (isPlaying) openMenu();
    else enterGame();
    return;
  }

  if (!isPlaying) return;

  if (code === 'Space') {
    e.preventDefault();
    attemptJump();
  } else if (code === 'KeyE') {
    triggerInteraction();
  } else if (code === 'KeyF') {
    toggleFlashlight();
  } else if (code === 'KeyM') {
    toggleAudio();
  } else if (code === 'KeyG') {
    toggleLowGravity();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

function toggleAudio() {
  const next = !audio.isEnabled();
  audio.setEnabled(next);
  els.btnAudio.setAttribute('aria-pressed', String(next));
  els.btnAudio.textContent = next ? 'sound: on' : 'sound: off';
  if (next) audio.playInteractPing();
}

els.btnEnter.addEventListener('click', enterGame);
els.btnPause.addEventListener('click', openMenu);
els.btnLog.addEventListener('click', openMenu);
els.btnFlashlight.addEventListener('click', toggleFlashlight);
els.btnAudio.addEventListener('click', toggleAudio);
els.btnLowGrav.addEventListener('click', toggleLowGravity);
els.btnDownloadCert.addEventListener('click', downloadExplorerCert);

// ==========================================================================
// Raycaster Interaction System
// ==========================================================================

const raycaster = new THREE.Raycaster();
const centerNDC = new THREE.Vector2(0, 0);
let currentTarget = null;
let elapsedGlobal = 0;

function updateTargeting() {
  if (!isPlaying) {
    els.reticle.classList.remove('is-targeting');
    els.interactPrompt.hidden = true;
    els.touchInteract.hidden = true;
    currentTarget = null;
    return;
  }

  raycaster.setFromCamera(centerNDC, camera);
  raycaster.far = 6.2;
  const hits = raycaster.intersectObjects(world.interactables, false);

  if (hits.length > 0 && hits[0].object.userData.interactable) {
    currentTarget = hits[0].object.userData.interactable;
    els.reticle.classList.add('is-targeting');
    els.interactLabel.textContent = currentTarget.label;
    els.interactPrompt.hidden = false;
    if (isTouchDevice) els.touchInteract.hidden = false;
  } else {
    currentTarget = null;
    els.reticle.classList.remove('is-targeting');
    els.interactPrompt.hidden = true;
    els.touchInteract.hidden = true;
  }
}

function enterRunnerPortal() {
  if (isWarping) return;
  isWarping = true;
  if (document.pointerLockElement) {
    try {
      document.exitPointerLock();
    } catch (_) {}
  }
  audio.playPortalWarp();
  speak('PORTAL ENGAGED', 'Warping to VOID RUNNER // ∅-DRIFT...', 2000);
  if (els.warpVeil) {
    els.warpVeil.classList.add('is-active');
  }
  window.setTimeout(() => {
    window.location.href = '/run/';
  }, 600);
}

function triggerInteraction() {
  if (!currentTarget || !isPlaying || isWarping) return;
  currentTarget.onInteract({
    discover,
    speak,
    audio,
    openMenu,
    enterRunnerPortal,
    time: elapsedGlobal
  });
}

// ==========================================================================
// Collision Physics (AABB Sliding + Smooth Auto-Step on Stairs)
// ==========================================================================

const STEP_HEIGHT = 0.56;

function overlapsHorizontal(px, pz, r, box) {
  return (
    px + r > box.minX &&
    px - r < box.maxX &&
    pz + r > box.minZ &&
    pz - r < box.maxZ
  );
}

function stepPhysics(dt) {
  const forward = new THREE.Vector3(-Math.sin(euler.y), 0, -Math.cos(euler.y));
  const right = new THREE.Vector3(Math.cos(euler.y), 0, -Math.sin(euler.y));

  let inputZ = 0;
  let inputX = 0;
  if (keys.KeyW || keys.ArrowUp) inputZ += 1;
  if (keys.KeyS || keys.ArrowDown) inputZ -= 1;
  if (keys.KeyD || keys.ArrowRight) inputX += 1;
  if (keys.KeyA || keys.ArrowLeft) inputX -= 1;

  inputX += touchMove.x;
  inputZ -= touchMove.y;

  const moveDir = new THREE.Vector3();
  moveDir.addScaledVector(forward, inputZ);
  moveDir.addScaledVector(right, inputX);
  const moving = moveDir.lengthSq() > 0.001;
  if (moving) moveDir.normalize();

  const sprinting = Boolean(keys.ShiftLeft || keys.ShiftRight) && moving;
  const maxSpeed = sprinting ? 9.6 : 6.0;

  const targetFov = sprinting && !reducedMotion ? 79 : 74;
  if (Math.abs(camera.fov - targetFov) > 0.05) {
    camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 8);
    camera.updateProjectionMatrix();
  }

  const accel = player.onGround ? 14 : 5;
  const targetVx = moveDir.x * maxSpeed;
  const targetVz = moveDir.z * maxSpeed;
  player.vel.x += (targetVx - player.vel.x) * Math.min(1, dt * accel);
  player.vel.z += (targetVz - player.vel.z) * Math.min(1, dt * accel);

  const gravity = lowGravity ? 8.5 : 19.5;
  player.vel.y -= gravity * dt;

  // Horizontal X with auto-step check
  const nextX = player.pos.x + player.vel.x * dt;
  let blockedX = false;
  let stepUpY = player.pos.y;

  for (const box of world.colliders) {
    if (!overlapsHorizontal(nextX, player.pos.z, player.radius, box)) continue;
    if (player.pos.y + player.height <= box.minY || player.pos.y >= box.maxY) continue;
    const climbNeeded = box.maxY - player.pos.y;
    if (climbNeeded > 0 && climbNeeded <= STEP_HEIGHT && player.onGround) {
      stepUpY = Math.max(stepUpY, box.maxY);
    } else {
      blockedX = true;
      break;
    }
  }
  if (!blockedX) {
    player.pos.x = nextX;
    if (stepUpY > player.pos.y) player.pos.y = stepUpY;
  } else {
    player.vel.x = 0;
  }

  // Horizontal Z with auto-step check
  const nextZ = player.pos.z + player.vel.z * dt;
  let blockedZ = false;
  let stepUpYZ = player.pos.y;

  for (const box of world.colliders) {
    if (!overlapsHorizontal(player.pos.x, nextZ, player.radius, box)) continue;
    if (player.pos.y + player.height <= box.minY || player.pos.y >= box.maxY) continue;
    const climbNeeded = box.maxY - player.pos.y;
    if (climbNeeded > 0 && climbNeeded <= STEP_HEIGHT && player.onGround) {
      stepUpYZ = Math.max(stepUpYZ, box.maxY);
    } else {
      blockedZ = true;
      break;
    }
  }
  if (!blockedZ) {
    player.pos.z = nextZ;
    if (stepUpYZ > player.pos.y) player.pos.y = stepUpYZ;
  } else {
    player.vel.z = 0;
  }

  // Vertical Y + floor & platform landing
  const wasOnGround = player.onGround;
  const prevY = player.pos.y;
  player.pos.y += player.vel.y * dt;
  player.onGround = false;

  if (Math.abs(player.pos.x) <= 60 && Math.abs(player.pos.z) <= 60) {
    if (player.pos.y <= 0 && prevY >= -0.25) {
      player.pos.y = 0;
      if (player.vel.y < -4) audio.playLand();
      player.vel.y = 0;
      player.onGround = true;
    }
  }

  for (const box of world.colliders) {
    if (!overlapsHorizontal(player.pos.x, player.pos.z, player.radius * 0.9, box)) continue;
    if (player.vel.y <= 0 && prevY >= box.maxY - 0.12 && player.pos.y <= box.maxY) {
      player.pos.y = box.maxY;
      if (player.vel.y < -4) audio.playLand();
      player.vel.y = 0;
      player.onGround = true;
    } else if (player.vel.y > 0 && prevY + player.height <= box.minY + 0.15 && player.pos.y + player.height >= box.minY) {
      player.pos.y = box.minY - player.height;
      player.vel.y = 0;
    }
  }

  if (player.onGround) {
    player.coyoteTimer = 0.12;
  } else if (wasOnGround || player.coyoteTimer > 0) {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
  }

  // Out-of-bounds soft warp back to Origin (0, 1.5, 7.5)
  if (player.pos.y < -14) {
    player.pos.set(0, 1.5, 7.5);
    player.vel.set(0, 0, 0);
    audio.playWarp();
    speak('OUT OF BOUNDS', 'You stepped off the edge of the void. Reality gently placed you back at Origin.');
  }

  let bobOffset = 0;
  const horizSpeed = Math.hypot(player.vel.x, player.vel.z);
  if (player.onGround && horizSpeed > 0.6) {
    player.bobPhase += dt * (sprinting ? 11.5 : 8.2);
    const s = Math.sin(player.bobPhase);
    if (!reducedMotion) {
      bobOffset = s * 0.055;
    }
    if (player.lastBobSin >= 0 && s < 0) {
      audio.playFootstep(sprinting);
    }
    player.lastBobSin = s;
  } else {
    player.lastBobSin = 0;
  }

  camera.position.set(player.pos.x, player.pos.y + player.eyeHeight + bobOffset, player.pos.z);

  const zone = world.getZoneName(player.pos.x, player.pos.y, player.pos.z);
  els.zoneIndicator.textContent = `${zone} · (${Math.round(player.pos.x)}, ${Math.round(player.pos.z)})`;
}

// ==========================================================================
// Main Animation Loop & Resize
// ==========================================================================

let lastTime = performance.now();

function animate(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) * 0.001));
  lastTime = now;
  elapsedGlobal += dt;

  for (const fn of world.animated) {
    fn(elapsedGlobal, dt);
  }

  if (isWarping) {
    if (!reducedMotion && camera.fov < 110) {
      camera.fov += (110 - camera.fov) * Math.min(1, dt * 6);
      camera.updateProjectionMatrix();
    }
  } else if (isPlaying) {
    stepPhysics(dt);
    updateTargeting();
    const wp = world.runnerPortalPos;
    if (wp && Math.hypot(player.pos.x - wp.x, player.pos.z - wp.z) < 1.65 && player.pos.y < 3.5) {
      enterRunnerPortal();
    }
  } else if (discovered.length === 0 && !reducedMotion && els.menuOverlay && !els.menuOverlay.hidden) {
    euler.y = Math.sin(elapsedGlobal * 0.14) * 0.32;
    euler.x = 0.06;
    camera.quaternion.setFromEuler(euler);
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
