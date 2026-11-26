import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';

export function createFloorTexture(isLight = false) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = isLight ? '#ece8de' : '#09090d';
  ctx.fillRect(0, 0, size, size);

  // Subtle architectural tile seams
  ctx.strokeStyle = isLight ? 'rgba(20, 20, 19, 0.12)' : 'rgba(242, 240, 234, 0.075)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);

  ctx.strokeStyle = isLight ? 'rgba(20, 20, 19, 0.05)' : 'rgba(242, 240, 234, 0.032)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size, size / 2);
  ctx.stroke();

  // Tiny crosshair mark at tile intersections
  ctx.fillStyle = isLight ? 'rgba(200, 75, 49, 0.35)' : 'rgba(212, 255, 77, 0.25)';
  ctx.fillRect(size / 2 - 4, size / 2 - 1, 8, 2);
  ctx.fillRect(size / 2 - 1, size / 2 - 4, 2, 8);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(36, 36);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createMonolithTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#121218';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 650; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const a = 0.02 + Math.random() * 0.04;
    ctx.fillStyle = `rgba(242, 240, 234, ${a.toFixed(3)})`;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.strokeStyle = 'rgba(242, 240, 234, 0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, size - 8, size - 8);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createGlowSpriteTexture(colorHex = '#d4ff4d') {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  grad.addColorStop(0, colorHex);
  grad.addColorStop(0.28, colorHex + '99');
  grad.addColorStop(0.6, colorHex + '22');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createPlaqueTexture({ eyebrow, title, lines, accent = '#d4ff4d' }) {
  const w = 640;
  const h = 360;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0d0d12';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(242, 240, 234, 0.2)';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  ctx.fillStyle = accent;
  ctx.fillRect(10, 10, 8, h - 20);

  ctx.fillStyle = accent;
  ctx.font = '600 22px "JetBrains Mono", monospace';
  ctx.fillText(eyebrow, 42, 64);

  ctx.fillStyle = '#f2f0ea';
  ctx.font = '700 40px "Space Grotesk", sans-serif';
  ctx.fillText(title, 42, 126);

  ctx.fillStyle = '#9a968e';
  ctx.font = '400 24px "JetBrains Mono", monospace';
  lines.forEach((line, idx) => {
    ctx.fillText(line, 42, 190 + idx * 38);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createPortalVortexTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const cx = size / 2;
  const cy = size / 2;
  const bg = ctx.createRadialGradient(cx, cy, 8, cx, cy, cx);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(0.22, '#4df3ff');
  bg.addColorStop(0.58, 'rgba(212, 255, 77, 0.55)');
  bg.addColorStop(0.88, 'rgba(77, 243, 255, 0.14)');
  bg.addColorStop(1, 'rgba(6, 6, 8, 0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  ctx.translate(cx, cy);
  for (let arm = 0; arm < 6; arm++) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * arm) / 6);
    ctx.beginPath();
    for (let t = 0; t < 36; t++) {
      const angle = t * 0.14;
      const r = t * 6.5;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = arm % 2 === 0 ? 'rgba(255, 255, 255, 0.55)' : 'rgba(212, 255, 77, 0.6)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
