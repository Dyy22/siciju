(function (global) {
  'use strict';

  var canvas = document.getElementById('void-canvas');
  if (!canvas) {
    global.SicijuCanvas = {
      setTheme: function () {},
      spawnRipple: function () {},
      spawnZeroBurst: function () {}
    };
    return;
  }

  var ctx = canvas.getContext('2d');
  var reducedMotion =
    global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var width = global.innerWidth || 1280;
  var height = global.innerHeight || 720;
  var dpr = Math.min(global.devicePixelRatio || 1, 2);
  var theme = 'dark';

  var pointer = {
    tx: width * 0.5,
    ty: height * 0.45,
    x: width * 0.5,
    y: height * 0.45,
    hasMoved: false
  };

  var motes = [];
  var ripples = [];
  var burstParticles = [];
  var ZERO_SYMBOLS = ['0', '∅', 'null', 'NaN', 'undefined', '{}'];

  function resize() {
    width = global.innerWidth || 1280;
    height = global.innerHeight || 720;
    dpr = Math.min(global.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!pointer.hasMoved) {
      pointer.tx = width * 0.5;
      pointer.ty = height * 0.45;
    }
  }

  function initMotes() {
    motes = [];
    var count = 56;
    for (var i = 0; i < count; i++) {
      motes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.2 - 0.05,
        size: Math.random() * 1.6 + 0.6,
        alpha: Math.random() * 0.35 + 0.15
      });
    }
  }

  function updatePointerTarget(clientX, clientY) {
    pointer.tx = clientX;
    pointer.ty = clientY;
    pointer.hasMoved = true;
  }

  global.addEventListener('pointermove', function (e) {
    updatePointerTarget(e.clientX, e.clientY);
  }, { passive: true });

  global.addEventListener('pointerdown', function (e) {
    updatePointerTarget(e.clientX, e.clientY);
  }, { passive: true });

  global.addEventListener('resize', resize);

  resize();
  initMotes();

  function spawnRipple(x, y, label) {
    ripples.push({
      x: x,
      y: y,
      radius: 6,
      maxRadius: 110,
      alpha: 0.72,
      label: label || ''
    });
  }

  function spawnZeroBurst(x, y) {
    var count = 24;
    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
      var speed = 1.8 + Math.random() * 4.2;
      burstParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.8,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.12,
        alpha: 1,
        text: ZERO_SYMBOLS[i % ZERO_SYMBOLS.length]
      });
    }
  }

  var startTime = performance.now();

  function frame(now) {
    var t = (now - startTime) * 0.001;
    ctx.clearRect(0, 0, width, height);

    if (!pointer.hasMoved && !reducedMotion) {
      pointer.tx = width * 0.5 + Math.sin(t * 0.45) * Math.min(110, width * 0.16);
      pointer.ty = height * 0.44 + Math.sin(t * 0.9) * Math.min(55, height * 0.08);
    }

    var ease = reducedMotion ? 1 : 0.14;
    pointer.x += (pointer.tx - pointer.x) * ease;
    pointer.y += (pointer.ty - pointer.y) * ease;

    document.documentElement.style.setProperty('--mx', pointer.x.toFixed(1) + 'px');
    document.documentElement.style.setProperty('--my', pointer.y.toFixed(1) + 'px');

    var isLight = theme === 'light';

    // Darkroom warm flashlight cone
    if (!isLight) {
      var cone = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 260);
      cone.addColorStop(0, 'rgba(255, 248, 225, 0.085)');
      cone.addColorStop(0.55, 'rgba(212, 255, 77, 0.025)');
      cone.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cone;
      ctx.fillRect(0, 0, width, height);
    }

    // Floating dust motes
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      if (!reducedMotion) {
        m.x += m.vx;
        m.y += m.vy;
      }

      var dx = m.x - pointer.x;
      var dy = m.y - pointer.y;
      var dist = Math.hypot(dx, dy);

      if (dist < 140 && dist > 1 && !reducedMotion) {
        var push = (140 - dist) * 0.003;
        m.x += (dx / dist) * push;
        m.y += (dy / dist) * push;
      }

      if (m.x < -10) m.x = width + 10;
      if (m.x > width + 10) m.x = -10;
      if (m.y < -10) m.y = height + 10;
      if (m.y > height + 10) m.y = -10;

      var glow = !isLight && dist < 240 ? (1 - dist / 240) * 0.45 : 0;
      var alpha = isLight ? m.alpha * 0.25 : m.alpha * 0.22 + glow;

      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fillStyle = isLight
        ? 'rgba(20, 20, 19, ' + alpha.toFixed(3) + ')'
        : 'rgba(242, 240, 234, ' + alpha.toFixed(3) + ')';
      ctx.fill();
    }

    // Click sonar ripples + echo words
    for (var r = ripples.length - 1; r >= 0; r--) {
      var rp = ripples[r];
      rp.radius += reducedMotion ? 3.5 : 2.1;
      rp.alpha *= 0.962;

      if (rp.alpha < 0.02 || rp.radius > rp.maxRadius) {
        ripples.splice(r, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2);
      ctx.strokeStyle = isLight
        ? 'rgba(200, 75, 49, ' + (rp.alpha * 0.7).toFixed(3) + ')'
        : 'rgba(212, 255, 77, ' + (rp.alpha * 0.65).toFixed(3) + ')';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (rp.radius > 16) {
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.radius * 0.56, 0, Math.PI * 2);
        ctx.strokeStyle = isLight
          ? 'rgba(20, 20, 19, ' + (rp.alpha * 0.25).toFixed(3) + ')'
          : 'rgba(242, 240, 234, ' + (rp.alpha * 0.22).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (rp.label) {
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = isLight
          ? 'rgba(20, 20, 19, ' + rp.alpha.toFixed(3) + ')'
          : 'rgba(212, 255, 77, ' + rp.alpha.toFixed(3) + ')';
        ctx.fillText(rp.label, rp.x, rp.y - rp.radius * 0.42 - 6);
      }
    }

    // Zero-confetti bursts
    for (var b = burstParticles.length - 1; b >= 0; b--) {
      var p = burstParticles[b];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.vx *= 0.99;
      p.rot += p.vRot;
      p.alpha -= 0.015;

      if (p.alpha <= 0.02) {
        burstParticles.splice(b, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = isLight
        ? 'rgba(200, 75, 49, ' + p.alpha.toFixed(3) + ')'
        : 'rgba(212, 255, 77, ' + p.alpha.toFixed(3) + ')';
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }

    global.requestAnimationFrame(frame);
  }

  global.requestAnimationFrame(frame);

  global.SicijuCanvas = {
    setTheme: function (nextTheme) {
      theme = nextTheme === 'light' ? 'light' : 'dark';
    },
    spawnRipple: spawnRipple,
    spawnZeroBurst: spawnZeroBurst
  };
})(window);
