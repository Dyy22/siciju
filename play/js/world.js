import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';
import {
  createFloorTexture,
  createMonolithTexture,
  createGlowSpriteTexture,
  createPlaqueTexture,
  createPortalVortexTexture
} from './textures.js';

export const ANOMALIES = [
  {
    id: 'door404',
    title: 'Door #404',
    sector: 'North Corridor',
    hint: 'Follow the north guide line through the shrinking arches.',
    foundDesc: 'Opened Door #404. Behind it was even more void.'
  },
  {
    id: 'worldLamp',
    title: 'The Gallery Switch',
    sector: 'East Gallery',
    hint: 'Visit the East Gallery of Unwritten Pages and pull the giant lamp.',
    foundDesc: 'Flipped the lighting for an entire 3D dimension.'
  },
  {
    id: 'phantomServer',
    title: 'Phantom Server Node',
    sector: 'South Server Room',
    hint: 'Inspect the humming hollow server racks to the south.',
    foundDesc: 'Pinged a purely decorative server (0.00ms, 0 MB RAM).'
  },
  {
    id: 'gravityCore',
    title: 'Levitating Polyhedron',
    sector: 'West Gravity Garden',
    hint: 'Climb the floating platforms in the West Gravity Garden.',
    foundDesc: 'Touched the suspended core floating above the western void.'
  },
  {
    id: 'horizonBeacon',
    title: 'Horizon Observer',
    sector: 'Upper Skywalk',
    hint: 'Ascend the glowing stepped bridge near the Atrium to the upper observatory.',
    foundDesc: 'Surveyed the infinite nothingness from the Upper Observatory.'
  }
];

export function buildVoidWorld(scene) {
  const colliders = [];
  const interactables = [];
  const animated = [];

  const floorTexDark = createFloorTexture(false);
  const floorTexLight = createFloorTexture(true);
  const monolithTex = createMonolithTexture();
  const limeGlowTex = createGlowSpriteTexture('#d4ff4d');
  const coralGlowTex = createGlowSpriteTexture('#ff6b52');

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTexDark,
    roughness: 0.48,
    metalness: 0.22
  });

  const monolithMat = new THREE.MeshStandardMaterial({
    map: monolithTex,
    roughness: 0.72,
    metalness: 0.18
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xd4ff4d,
    emissive: 0xd4ff4d,
    emissiveIntensity: 1.6,
    roughness: 0.25
  });

  const coralMat = new THREE.MeshStandardMaterial({
    color: 0xff6b52,
    emissive: 0xff6b52,
    emissiveIntensity: 1.3,
    roughness: 0.3
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xf2f0ea,
    transparent: true,
    opacity: 0.14,
    roughness: 0.1,
    metalness: 0.35
  });

  const wireLimeMat = new THREE.MeshBasicMaterial({
    color: 0xd4ff4d,
    wireframe: true,
    transparent: true,
    opacity: 0.55
  });

  const wireChalkMat = new THREE.MeshBasicMaterial({
    color: 0xf2f0ea,
    wireframe: true,
    transparent: true,
    opacity: 0.26
  });

  function addBox(x, y, z, w, h, d, mat = monolithMat, solid = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    if (solid) {
      colliders.push({
        minX: x - w / 2,
        maxX: x + w / 2,
        minY: y - h / 2,
        maxY: y + h / 2,
        minZ: z - d / 2,
        maxZ: z + d / 2
      });
    }
    return mesh;
  }

  function addPlaque(x, y, z, rotY, config) {
    const tex = createPlaqueTexture(config);
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 1.8),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    panel.position.set(x, y, z);
    panel.rotation.y = rotY;
    scene.add(panel);
    return panel;
  }

  function addGlowSprite(x, y, z, scale = 3.2, tex = limeGlowTex) {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    sp.position.set(x, y, z);
    sp.scale.set(scale, scale, 1);
    scene.add(sp);
    return sp;
  }

  function registerInteractable(mesh, info) {
    mesh.userData.interactable = info;
    interactables.push(mesh);
    return mesh;
  }

  // ========================================================================
  // Lighting (Dark Obsidian default; toggleable to Astral Light Gallery)
  // ========================================================================

  const hemiLight = new THREE.HemisphereLight(0xd8e0ff, 0x101016, 0.34);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.16);
  scene.add(ambientLight);

  // Main Floor (120m x 120m finite plaza hovering above infinite void)
  const mainFloor = new THREE.Mesh(new THREE.BoxGeometry(120, 1, 120), floorMat);
  mainFloor.position.set(0, -0.5, 0);
  scene.add(mainFloor);

  // Glowing perimeter border strips on the floor edge
  addBox(0, 0.02, -59.8, 120, 0.04, 0.25, accentMat, false);
  addBox(0, 0.02, 59.8, 120, 0.04, 0.25, accentMat, false);
  addBox(-59.8, 0.02, 0, 0.25, 0.04, 120, accentMat, false);
  addBox(59.8, 0.02, 0, 0.25, 0.04, 120, accentMat, false);

  // ========================================================================
  // Starfield & Drifting Void Motes
  // ========================================================================

  const starCount = 900;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 200;
    starPos[i * 3 + 1] = Math.random() * 55 + 0.5;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 200;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xf2f0ea,
    size: 0.16,
    transparent: true,
    opacity: 0.65
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
  animated.push((t) => {
    stars.rotation.y = t * 0.008;
  });

  // ========================================================================
  // 1. CENTRAL ATRIUM (Origin 0, 0, 0)
  // ========================================================================

  const atriumRing = new THREE.Mesh(
    new THREE.RingGeometry(4.6, 4.9, 48),
    new THREE.MeshBasicMaterial({ color: 0xd4ff4d, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
  );
  atriumRing.rotation.x = -Math.PI / 2;
  atriumRing.position.set(0, 0.02, 0);
  scene.add(atriumRing);

  // Diagonal slash making ∅ on the atrium floor
  const slash = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 11.4),
    new THREE.MeshBasicMaterial({ color: 0xd4ff4d, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
  );
  slash.rotation.x = -Math.PI / 2;
  slash.rotation.z = Math.PI / 4;
  slash.position.set(0, 0.025, 0);
  scene.add(slash);

  // 8 Monumental Colonnade Pillars around Atrium
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 + Math.PI / 8;
    const r = 11.5;
    const px = Math.cos(angle) * r;
    const pz = Math.sin(angle) * r;
    addBox(px, 5.5, pz, 1.35, 11, 1.35, monolithMat, true);
    addBox(px, 11.08, pz, 1.45, 0.16, 1.45, accentMat, false);
  }

  // Hovering Wireframe Gyroscope / Tesseract Overhead
  const gyroGroup = new THREE.Group();
  gyroGroup.position.set(0, 7.6, 0);
  const outerOct = new THREE.Mesh(new THREE.OctahedronGeometry(2.3, 0), wireLimeMat);
  const innerBox = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 1.7), wireChalkMat);
  const coreSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), accentMat);
  gyroGroup.add(outerOct, innerBox, coreSphere);
  scene.add(gyroGroup);

  const atriumLight = new THREE.PointLight(0xd4ff4d, 16, 26, 1.5);
  atriumLight.position.set(0, 7.5, 0);
  scene.add(atriumLight);

  // Awakened Portal Beacon (hidden until all 5 anomalies found!)
  const portalBeacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.5, 42, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xd4ff4d,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  portalBeacon.position.set(0, 21, 0);
  portalBeacon.visible = false;
  scene.add(portalBeacon);

  const portalRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.0, 0.08, 12, 48),
    accentMat
  );
  portalRing.position.set(0, 2.1, 0);
  portalRing.visible = false;
  scene.add(portalRing);

  animated.push((t) => {
    outerOct.rotation.y = t * 0.35;
    outerOct.rotation.x = t * 0.2;
    innerBox.rotation.y = -t * 0.55;
    innerBox.rotation.z = t * 0.3;
    coreSphere.position.y = Math.sin(t * 2) * 0.22;
    if (portalRing.visible) {
      portalRing.rotation.y = t * 0.9;
      portalRing.position.y = 2.0 + Math.sin(t * 2.5) * 0.18;
    }
  });

  // Directional Guide Floor Strips (N, E, S, W)
  addBox(0, 0.018, -23, 0.18, 0.03, 24, coralMat, false);   // North -> Door 404
  addBox(23, 0.018, 0, 24, 0.03, 0.18, accentMat, false);   // East -> Gallery
  addBox(0, 0.018, 23, 0.18, 0.03, 24, accentMat, false);   // South -> Server Room
  addBox(-23, 0.018, 0, 24, 0.03, 0.18, accentMat, false);  // West -> Gravity Garden

  // ========================================================================
  // 1B. NW RUNNER PORTAL GATE (Walkable Gate -> /run/)
  // ========================================================================

  const cyanGlowTex = createGlowSpriteTexture('#4df3ff');
  const cyanMat = new THREE.MeshStandardMaterial({
    color: 0x4df3ff,
    emissive: 0x4df3ff,
    emissiveIntensity: 1.6,
    roughness: 0.2
  });

  // Cyan guide line along NW diagonal from Atrium edge to portal plinth
  const nwGuide = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 10.5), cyanMat);
  nwGuide.position.set(-9.4, 0.018, -9.4);
  nwGuide.rotation.y = Math.PI / 4;
  scene.add(nwGuide);

  const runnerPortalPos = new THREE.Vector3(-15, 0, -15);
  const portalGate = new THREE.Group();
  portalGate.position.copy(runnerPortalPos);
  portalGate.rotation.y = Math.PI / 4;
  scene.add(portalGate);

  // Octagonal step-up plinth
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 3.1, 0.32, 8), monolithMat);
  plinth.position.y = 0.16;
  portalGate.add(plinth);
  colliders.push({
    minX: runnerPortalPos.x - 2.1,
    maxX: runnerPortalPos.x + 2.1,
    minY: 0,
    maxY: 0.32,
    minZ: runnerPortalPos.z - 2.1,
    maxZ: runnerPortalPos.z + 2.1
  });

  // Twin side pillars + top lintel (visual inside rotated group)
  const gatePillarGeo = new THREE.BoxGeometry(0.65, 4.4, 0.75);
  const gatePostL = new THREE.Mesh(gatePillarGeo, monolithMat);
  gatePostL.position.set(-2.05, 2.52, 0);
  const gatePostR = new THREE.Mesh(gatePillarGeo, monolithMat);
  gatePostR.position.set(2.05, 2.52, 0);
  const gateLintel = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.55, 0.85), monolithMat);
  gateLintel.position.set(0, 4.85, 0);
  const gateTrim = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.1, 0.9), cyanMat);
  gateTrim.position.set(0, 4.55, 0);
  portalGate.add(gatePostL, gatePostR, gateLintel, gateTrim);

  // World-space AABB colliders for side pillars only (center remains open & walkable)
  const cos45 = Math.cos(Math.PI / 4);
  [-2.05, 2.05].forEach((lx) => {
    const wx = runnerPortalPos.x + lx * cos45;
    const wz = runnerPortalPos.z - lx * cos45;
    colliders.push({
      minX: wx - 0.42,
      maxX: wx + 0.42,
      minY: 0.32,
      maxY: 4.8,
      minZ: wz - 0.42,
      maxZ: wz + 0.42
    });
  });

  // Swirling cyan/lime vortex disc + counter-rotating energy rings
  const portalVortex = new THREE.Mesh(
    new THREE.CircleGeometry(1.55, 36),
    new THREE.MeshBasicMaterial({
      map: createPortalVortexTexture(),
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  portalVortex.position.set(0, 2.28, 0);
  portalGate.add(portalVortex);

  const gateRingOuter = new THREE.Mesh(new THREE.TorusGeometry(1.66, 0.055, 10, 42), cyanMat);
  gateRingOuter.position.set(0, 2.28, 0);
  const gateRingInner = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.035, 10, 36), accentMat);
  gateRingInner.position.set(0, 2.28, 0);
  portalGate.add(gateRingOuter, gateRingInner);

  const portalGateLight = new THREE.PointLight(0x4df3ff, 14, 18, 1.5);
  portalGateLight.position.set(runnerPortalPos.x + 1.5, 2.6, runnerPortalPos.z + 1.5);
  scene.add(portalGateLight);
  addGlowSprite(runnerPortalPos.x, 2.35, runnerPortalPos.z, 4.2, cyanGlowTex);

  addPlaque(-11.4, 1.5, -16.8, Math.PI / 4, {
    eyebrow: 'PORTAL · ∅-DRIFT',
    title: 'VOID RUNNER',
    lines: [
      'Step through or press [E]',
      'to launch high-speed 3D drift.',
      'Destination: siciju.online/run/'
    ],
    accent: '#4df3ff'
  });

  animated.push((t) => {
    portalVortex.rotation.z = -t * 1.1;
    gateRingOuter.rotation.z = t * 0.45;
    gateRingInner.rotation.z = -t * 0.75;
  });

  registerInteractable(portalVortex, {
    id: 'runnerPortal',
    label: 'Enter Void Runner Portal (/run/)',
    onInteract: ({ enterRunnerPortal }) => {
      if (enterRunnerPortal) enterRunnerPortal();
    }
  });

  // Welcome Plaque facing player spawn (player spawns at 0, 0, 7.5 looking north -Z)
  addBox(0, 1.35, -6.4, 3.6, 2.7, 0.35, monolithMat, true);
  addPlaque(0, 1.55, -6.2, 0, {
    eyebrow: 'SICIJU.ONLINE · BACKSTAGE',
    title: 'SECTOR ∅',
    lines: [
      'You bypassed the empty homepage.',
      'Follow the 4 floor lines & skywalk',
      'to inspect all 5 void anomalies.'
    ]
  });

  // ========================================================================
  // 2. NORTH SECTOR — ENDLESS ARCH CORRIDOR & DOOR #404
  // ========================================================================

  for (let i = 0; i < 6; i++) {
    const z = -17 - i * 4.4;
    const h = 6.2 - i * 0.32;
    const span = 5.4 - i * 0.26;
    const colW = 0.55;
    addBox(-span / 2, h / 2, z, colW, h, 0.65, monolithMat, true);
    addBox(span / 2, h / 2, z, colW, h, 0.65, monolithMat, true);
    addBox(0, h, z, span + colW, 0.45, 0.65, monolithMat, true);
    addBox(0, h - 0.28, z, span - 0.3, 0.08, 0.12, i === 5 ? coralMat : accentMat, false);
  }

  // Solitary Red Door #404 at z = -45.5
  const doorFrameZ = -45.5;
  addBox(-1.3, 1.9, doorFrameZ, 0.28, 3.8, 0.4, monolithMat, true);
  addBox(1.3, 1.9, doorFrameZ, 0.28, 3.8, 0.4, monolithMat, true);
  addBox(0, 3.85, doorFrameZ, 2.9, 0.3, 0.4, monolithMat, true);

  const doorPivot = new THREE.Group();
  doorPivot.position.set(-1.12, 1.85, doorFrameZ);
  scene.add(doorPivot);

  const doorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.24, 3.6, 0.16),
    new THREE.MeshStandardMaterial({
      color: 0xc84b31,
      emissive: 0x3b1008,
      roughness: 0.42,
      metalness: 0.2
    })
  );
  doorMesh.position.set(1.12, 0, 0);
  doorPivot.add(doorMesh);

  const doorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), accentMat);
  doorKnob.position.set(1.95, -0.1, 0.14);
  doorPivot.add(doorKnob);

  const doorLight = new THREE.PointLight(0xff6b52, 14, 18, 1.6);
  doorLight.position.set(0, 3.2, doorFrameZ + 2.2);
  scene.add(doorLight);
  addGlowSprite(0, 4.4, doorFrameZ, 2.8, coralGlowTex);

  addPlaque(3.4, 1.5, doorFrameZ + 2.4, -0.5, {
    eyebrow: 'ANOMALY 01 · NORTH',
    title: 'DOOR #404',
    lines: [
      'Leads directly to a route',
      'that was never built.',
      'Press [E] to open.'
    ],
    accent: '#ff6b52'
  });

  let doorOpen = false;
  let doorTargetRot = 0;
  animated.push(() => {
    doorPivot.rotation.y += (doorTargetRot - doorPivot.rotation.y) * 0.08;
  });

  registerInteractable(doorMesh, {
    id: 'door404',
    label: 'Open Door #404',
    onInteract: ({ discover, speak, audio }) => {
      doorOpen = !doorOpen;
      doorTargetRot = doorOpen ? -Math.PI * 0.68 : 0;
      audio.playInteractPing();
      discover('door404');
      speak(
        'DOOR #404',
        doorOpen
          ? 'The door swings open into... even more nothingness. Quality architecture.'
          : 'You closed the door on nothing. Polite.'
      );
    }
  });

  // ========================================================================
  // 3. EAST SECTOR — GALLERY OF UNWRITTEN PAGES + WORLD LAMP SWITCH
  // ========================================================================

  const eastX = 36;
  addBox(eastX + 9, 4.5, 0, 0.7, 9, 24, monolithMat, true);
  addBox(eastX + 8.6, 8.6, 0, 0.15, 0.12, 23, accentMat, false);

  const galleryLight = new THREE.PointLight(0xf2f0ea, 18, 28, 1.4);
  galleryLight.position.set(eastX + 1, 7, 0);
  scene.add(galleryLight);

  // Exhibit A: Empty Glass Vitrine (North pedestal)
  addBox(eastX, 0.65, -7, 2.2, 1.3, 2.2, monolithMat, true);
  const vitrine = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.9, 1.7), glassMat);
  vitrine.position.set(eastX, 2.25, -7);
  scene.add(vitrine);
  const tinyPixel = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), accentMat);
  tinyPixel.position.set(eastX, 2.25, -7);
  scene.add(tinyPixel);
  animated.push((t) => {
    tinyPixel.rotation.y = t * 1.4;
    tinyPixel.position.y = 2.25 + Math.sin(t * 2.5) * 0.12;
  });
  registerInteractable(vitrine, {
    id: 'exhibitA',
    label: 'Inspect Exhibit 01',
    onInteract: ({ speak, audio }) => {
      audio.playInteractPing();
      speak('EXHIBIT 01', '"The Last Remaining Pixel" — Estimated value: $0.00. Do not breathe near the glass.');
    }
  });

  // Exhibit B: Unbuilt Homepage Sculpture (South pedestal)
  addBox(eastX, 0.65, 7, 2.2, 1.3, 2.2, monolithMat, true);
  const unbuiltGroup = new THREE.Group();
  unbuiltGroup.position.set(eastX, 2.4, 7);
  const uTorus = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.14, 12, 32), wireLimeMat);
  const uCube = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), wireChalkMat);
  unbuiltGroup.add(uTorus, uCube);
  scene.add(unbuiltGroup);
  animated.push((t) => {
    uTorus.rotation.x = t * 0.8;
    uTorus.rotation.y = t * 0.5;
    uCube.rotation.z = -t * 0.7;
  });
  registerInteractable(uTorus, {
    id: 'exhibitB',
    label: 'Inspect Exhibit 02',
    onInteract: ({ speak, audio }) => {
      audio.playInteractPing();
      speak('EXHIBIT 02', '"Unbuilt Homepage v0.1" — A conceptual sculpture of everything the owner decided not to code.');
    }
  });

  // Exhibit C: THE GIANT 3D WORLD PULL-LAMP (Center pedestal -> Anomaly #2)
  addBox(eastX + 2, 0.55, 0, 2.4, 1.1, 2.4, monolithMat, true);
  const lampCord = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 6.2, 10), monolithMat);
  lampCord.position.set(eastX + 2, 5.4, 0);
  scene.add(lampCord);

  const lampTassel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.36, 0.85, 16),
    accentMat
  );
  lampTassel.position.set(eastX + 2, 2.15, 0);
  scene.add(lampTassel);
  addGlowSprite(eastX + 2, 2.15, 0, 3.0, limeGlowTex);

  addPlaque(eastX + 8.5, 2.4, 0, -Math.PI / 2, {
    eyebrow: 'ANOMALY 02 · EAST GALLERY',
    title: 'WORLD LIGHT SWITCH',
    lines: [
      'Pull the suspended brass-lime tassel',
      'to illuminate the entire 3D void.',
      'Warning: still empty with lights on.'
    ]
  });

  let worldLit = false;
  let lampPullOffset = 0;

  function setWorldLighting(lit) {
    worldLit = lit;
    floorMat.map = lit ? floorTexLight : floorTexDark;
    floorMat.needsUpdate = true;
    scene.background.setHex(lit ? 0xeae6dc : 0x060608);
    scene.fog.color.setHex(lit ? 0xeae6dc : 0x060608);
    scene.fog.density = lit ? 0.014 : 0.022;
    hemiLight.intensity = lit ? 1.15 : 0.34;
    ambientLight.intensity = lit ? 0.55 : 0.16;
    starMat.color.setHex(lit ? 0x141413 : 0xf2f0ea);
  }

  animated.push((t) => {
    lampPullOffset *= 0.86;
    lampTassel.position.y = 2.15 - lampPullOffset + Math.sin(t * 1.8) * 0.06;
  });

  registerInteractable(lampTassel, {
    id: 'worldLamp',
    label: 'Pull World Light Cord',
    onInteract: ({ discover, speak, audio }) => {
      lampPullOffset = 0.55;
      setWorldLighting(!worldLit);
      audio.playWorldLamp(worldLit);
      discover('worldLamp');
      speak(
        'GALLERY LIGHTS',
        worldLit
          ? 'Dimension lights ON. Congrats, now you can admire the empty space in archival white.'
          : 'Dimension lights OFF. Back to obsidian silence.'
      );
    }
  });

  // ========================================================================
  // 4. SOUTH SECTOR — THE PHANTOM SERVER ROOM (Anomaly #3)
  // ========================================================================

  const southZ = 38;
  const rackLights = [];
  const rackPositions = [
    [-6.5, southZ - 2],
    [-6.5, southZ + 3],
    [6.5, southZ - 2],
    [6.5, southZ + 3]
  ];

  rackPositions.forEach(([rx, rz], idx) => {
    addBox(rx, 0.35, rz, 2.2, 0.7, 2.2, monolithMat, true);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4.6, 2.0), wireChalkMat);
    frame.position.set(rx, 3.0, rz);
    scene.add(frame);
    colliders.push({
      minX: rx - 1.05,
      maxX: rx + 1.05,
      minY: 0,
      maxY: 5.3,
      minZ: rz - 1.05,
      maxZ: rz + 1.05
    });

    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.1, 0.28),
      new THREE.MeshBasicMaterial({ color: 0xd4ff4d })
    );
    led.position.set(rx, 4.8, rz);
    scene.add(led);
    rackLights.push({ mesh: led, phase: idx * 1.4 });
  });

  // Center Phantom Console
  addBox(0, 0.75, southZ + 2, 2.6, 1.5, 1.4, monolithMat, true);
  const consoleScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 1.15),
    new THREE.MeshBasicMaterial({
      map: createPlaqueTexture({
        eyebrow: 'SICIJU-NODE-00',
        title: 'STATUS: 0.00 KB',
        lines: [
          'CPU: 0% · RAM: 0 MB',
          'UPTIME: FOREVER',
          '[E] PING PHANTOM SERVER'
        ]
      })
    })
  );
  consoleScreen.position.set(0, 2.0, southZ + 1.28);
  consoleScreen.rotation.y = Math.PI;
  scene.add(consoleScreen);
  addBox(0, 2.0, southZ + 1.45, 2.3, 1.35, 0.25, monolithMat, true);

  const serverLight = new THREE.PointLight(0xd4ff4d, 13, 20, 1.5);
  serverLight.position.set(0, 3.8, southZ);
  scene.add(serverLight);

  let serverBoostUntil = 0;
  animated.push((t) => {
    const fast = t < serverBoostUntil ? 8 : 2;
    rackLights.forEach((r) => {
      const pulse = Math.sin(t * fast + r.phase) > 0;
      r.mesh.material.color.setHex(pulse ? 0xd4ff4d : 0x263010);
    });
  });

  registerInteractable(consoleScreen, {
    id: 'phantomServer',
    label: 'Ping Phantom Server',
    onInteract: ({ discover, speak, audio, time }) => {
      serverBoostUntil = time + 2.5;
      audio.playInteractPing();
      discover('phantomServer');
      speak(
        'SICIJU-NODE-00',
        'PING 0.00ms. All four server racks are completely hollow wireframes. Still faster than most APIs.'
      );
    }
  });

  // ========================================================================
  // 5. WEST SECTOR — GRAVITY GARDEN PARKOUR & FLOATING CORE (Anomaly #4)
  // ========================================================================

  const platforms = [
    { x: -28, y: 0.6, z: 0, w: 3.8, h: 0.5, d: 3.8 },
    { x: -33.5, y: 1.5, z: -2.2, w: 3.4, h: 0.5, d: 3.4 },
    { x: -38.5, y: 2.5, z: 0.8, w: 3.4, h: 0.5, d: 3.4 },
    { x: -43.5, y: 3.6, z: -1.8, w: 3.6, h: 0.5, d: 3.6 },
    { x: -48.5, y: 4.7, z: 0, w: 5.4, h: 0.6, d: 5.4 }
  ];

  platforms.forEach((p, idx) => {
    addBox(p.x, p.y, p.z, p.w, p.h, p.d, monolithMat, true);
    addBox(p.x, p.y + p.h / 2 + 0.02, p.z, p.w - 0.3, 0.04, p.d - 0.3, idx === 4 ? accentMat : wireChalkMat, false);
  });

  const coreGroup = new THREE.Group();
  coreGroup.position.set(-48.5, 6.9, 0);
  const coreMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.9, 0),
    new THREE.MeshStandardMaterial({
      color: 0xd4ff4d,
      emissive: 0xd4ff4d,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.5
    })
  );
  const coreOrbitA = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.045, 10, 42), wireChalkMat);
  const coreOrbitB = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.035, 10, 42), wireLimeMat);
  coreGroup.add(coreMesh, coreOrbitA, coreOrbitB);
  scene.add(coreGroup);
  addGlowSprite(-48.5, 6.9, 0, 4.4, limeGlowTex);

  const westLight = new THREE.PointLight(0xd4ff4d, 16, 22, 1.5);
  westLight.position.set(-48.5, 7.6, 0);
  scene.add(westLight);

  addPlaque(-24, 1.5, -4.5, 0.9, {
    eyebrow: 'ANOMALY 04 · WEST GARDEN',
    title: 'GRAVITY STEPS',
    lines: [
      'Jump [SPACE] across the floating',
      'monoliths to reach the core.',
      'Falling is safe. Mostly.'
    ]
  });

  let coreSpinBoost = 0;
  animated.push((t) => {
    coreSpinBoost *= 0.96;
    coreMesh.rotation.y = t * (0.7 + coreSpinBoost);
    coreMesh.rotation.x = t * 0.45;
    coreOrbitA.rotation.x = t * 0.9;
    coreOrbitA.rotation.y = t * 0.4;
    coreOrbitB.rotation.z = -t * 0.7;
    coreOrbitB.rotation.x = Math.PI / 3;
    coreGroup.position.y = 6.9 + Math.sin(t * 2.2) * 0.22;
  });

  registerInteractable(coreMesh, {
    id: 'gravityCore',
    label: 'Touch Levitating Core',
    onInteract: ({ discover, speak, audio }) => {
      coreSpinBoost = 6.5;
      audio.playInteractPing();
      discover('gravityCore');
      speak(
        'GRAVITY CORE',
        'It hums with zero kilobytes of pure potential energy. Nice parkour.'
      );
    }
  });

  // ========================================================================
  // 6. UPPER OBSERVATORY SKYWALK (Walkable Stepped Bridge from NE Atrium)
  // ========================================================================

  const stairSteps = 14;
  for (let i = 0; i < stairSteps; i++) {
    const sy = 0.25 + i * 0.48;
    const sx = 12 + i * 0.95;
    const sz = -12 - i * 0.95;
    addBox(sx, sy, sz, 2.8, 0.5, 2.8, monolithMat, true);
    if (i % 2 === 0) {
      addBox(sx, sy + 0.27, sz, 2.4, 0.04, 0.12, accentMat, false);
    }
  }

  // Upper Observatory Deck centered at (28, 6.75, -28)
  addBox(28, 6.75, -28, 9, 0.6, 9, monolithMat, true);
  addBox(28, 7.2, -32.3, 9, 0.35, 0.28, accentMat, false);
  addBox(32.3, 7.2, -28, 0.28, 0.35, 9, accentMat, false);

  const horizonOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 24, 24),
    new THREE.MeshStandardMaterial({
      color: 0xf2f0ea,
      emissive: 0xd4ff4d,
      emissiveIntensity: 0.75,
      roughness: 0.15,
      metalness: 0.6
    })
  );
  horizonOrb.position.set(29.5, 8.8, -29.5);
  scene.add(horizonOrb);

  const horizonRing = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.05, 10, 48), accentMat);
  horizonRing.position.copy(horizonOrb.position);
  scene.add(horizonRing);
  addGlowSprite(29.5, 8.8, -29.5, 4.2, limeGlowTex);

  const obsLight = new THREE.PointLight(0xd4ff4d, 15, 24, 1.5);
  obsLight.position.set(29.5, 10.2, -29.5);
  scene.add(obsLight);

  animated.push((t) => {
    horizonOrb.position.y = 8.8 + Math.sin(t * 1.9) * 0.18;
    horizonRing.position.y = horizonOrb.position.y;
    horizonRing.rotation.x = Math.PI / 2 + Math.sin(t * 0.7) * 0.35;
    horizonRing.rotation.y = t * 0.5;
  });

  registerInteractable(horizonOrb, {
    id: 'horizonBeacon',
    label: 'Activate Horizon Observer',
    onInteract: ({ discover, speak, audio }) => {
      audio.playInteractPing();
      discover('horizonBeacon');
      speak(
        'UPPER OBSERVATORY',
        'From up here you can clearly see 360 degrees of carefully crafted nothingness.'
      );
    }
  });

  let portalActivated = false;
  function activateCentralPortal() {
    if (portalActivated) return;
    portalActivated = true;
    portalBeacon.visible = true;
    portalRing.visible = true;
    registerInteractable(portalRing, {
      id: 'centralPortal',
      label: 'Enter Awakened Beacon (Menu)',
      onInteract: ({ audio, openMenu }) => {
        audio.playVictory();
        openMenu();
      }
    });
  }

  return {
    colliders,
    interactables,
    animated,
    runnerPortalPos,
    activateCentralPortal,
    getZoneName(x, y, z) {
      if (Math.hypot(x - runnerPortalPos.x, z - runnerPortalPos.z) < 5.5) return 'RUNNER PORTAL';
      if (y > 5.2 && x > 18 && z < -18) return 'UPPER OBSERVATORY';
      if (z < -16 && Math.abs(x) < 12) return 'NORTH CORRIDOR';
      if (x > 20 && Math.abs(z) < 16) return 'EAST GALLERY';
      if (z > 20 && Math.abs(x) < 16) return 'SOUTH SERVER ROOM';
      if (x < -18 && Math.abs(z) < 14) return 'WEST GRAVITY GARDEN';
      return 'CENTRAL ATRIUM';
    }
  };
}
