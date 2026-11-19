(function () {
  'use strict';

  var els = {
    canvas: document.getElementById('void404-canvas'),
    swallowedCount: document.getElementById('swallowed-count'),
    btnSound: document.getElementById('btn-sound-404'),
    voidCard: document.getElementById('void-card'),
    eyebrowTag: document.getElementById('eyebrow-tag'),
    codeBadge: document.getElementById('code-badge'),
    headline: document.getElementById('headline-404'),
    requestedPath: document.getElementById('requested-path'),
    diagnosisText: document.getElementById('diagnosis-text'),
    voidDepth: document.getElementById('void-depth'),
    existProb: document.getElementById('exist-prob'),
    excuseLine: document.getElementById('excuse-line'),
    btnSearchHarder: document.getElementById('btn-search-harder'),
    btnFeedVoid: document.getElementById('btn-feed-void'),
    toast: document.getElementById('toast-404')
  };

  var reducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ========================================================================
  // Procedural Web Audio Sound Engine
  // ========================================================================

  var audioCtx = null;
  var soundEnabled = true;

  function getAudio() {
    if (!soundEnabled) return null;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (e) {
      return null;
    }
  }

  function playTone(opts) {
    var ctx = getAudio();
    if (!ctx) return;
    try {
      var now = ctx.currentTime + (opts.delay || 0);
      var dur = opts.duration || 0.14;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = opts.type || 'sine';
      osc.frequency.setValueAtTime(opts.freq || 320, now);
      if (opts.freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freqEnd), now + dur);
      }
      var vol = opts.volume != null ? opts.volume : 0.06;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch (e) {}
  }

  function playSwallowSound() {
    playTone({ type: 'sine', freq: 340, freqEnd: 110, duration: 0.22, volume: 0.045 });
  }

  function playGlitchSound() {
    playTone({ type: 'square', freq: 190, freqEnd: 95, duration: 0.08, volume: 0.04 });
    playTone({ type: 'triangle', freq: 520, freqEnd: 180, duration: 0.12, delay: 0.05, volume: 0.05 });
  }

  function playReceiptChime() {
    playTone({ type: 'sine', freq: 440, duration: 0.12, delay: 0, volume: 0.06 });
    playTone({ type: 'sine', freq: 554.37, duration: 0.12, delay: 0.07, volume: 0.06 });
    playTone({ type: 'sine', freq: 659.25, duration: 0.22, delay: 0.14, volume: 0.07 });
  }

  // ========================================================================
  // Safe Path Forensics
  // ========================================================================

  var rawPath =
    window.location && typeof window.location.pathname === 'string'
      ? window.location.pathname
      : '/404';
  var safePath = rawPath.length > 160 ? rawPath.slice(0, 160) + '...' : rawPath;
  var fullDisplayPath = 'siciju.online' + safePath;
  var lowerPath = safePath.toLowerCase();

  if (els.requestedPath) {
    els.requestedPath.textContent = fullDisplayPath;
  }

  function applyForensicDiagnosis() {
    var segments = safePath.split('/').filter(Boolean);
    var adminWords = ['admin', 'login', 'wp-', '.env', 'php', 'config', 'dashboard', 'secret', 'root', 'api'];
    var normalWords = ['about', 'contact', 'blog', 'shop', 'store', 'docs', 'pricing', 'portfolio', 'home'];
    var freeWords = ['robux', 'free', 'hack', 'cheat', 'gift', 'win', 'crypto'];

    var hasWord = function (list) {
      for (var i = 0; i < list.length; i++) {
        if (lowerPath.indexOf(list[i]) !== -1) return true;
      }
      return false;
    };

    if (hasWord(adminWords)) {
      els.eyebrowTag.textContent = '∅ NICE TRY · 404²';
      els.headline.textContent = 'there is no admin panel in the abyss.';
      els.diagnosisText.textContent = 'Looking for a backend on a 100% static void? Bold move.';
    } else if (hasWord(freeWords)) {
      els.eyebrowTag.textContent = '∅ SUSPICIOUS · 404²';
      els.headline.textContent = 'nothing free lives down this corridor.';
      els.diagnosisText.textContent = 'Zero loot found. Only squared emptiness.';
    } else if (hasWord(normalWords)) {
      els.eyebrowTag.textContent = '∅ OPTIMISTIC · 404²';
      els.headline.textContent = 'you expected actual pages on siciju.online?';
      els.diagnosisText.textContent = 'Even the homepage has nothing. This page stood no chance.';
    } else if (segments.length >= 3) {
      els.eyebrowTag.textContent = '∅ DEEP DIVE · 404²';
      els.headline.textContent = 'you walked way too far into nothing.';
      els.diagnosisText.textContent =
        'You dug ' + segments.length + ' folders deep into a domain with 0 folders.';
    } else {
      els.eyebrowTag.textContent = '∅ CASE #404² · SQUARED NOTHINGNESS';
      els.headline.textContent = 'you searched for a missing page inside a website that is already empty.';
      els.diagnosisText.textContent = 'The homepage is empty. This URL somehow has negative content.';
    }
  }

  applyForensicDiagnosis();

  // ========================================================================
  // Interactive Gravitational Vortex Canvas
  // ========================================================================

  var swallowedTotal = 0;
  var fragments = [];
  var motes = [];
  var absorptionRings = [];
  var DEFAULT_TOKENS = ['404', '∅', 'null', 'NaN', 'nope', 'void', '0x00', '404²'];
  var urlTokens = safePath.split('/').filter(Boolean).slice(0, 6);
  var allTokens = urlTokens.length ? urlTokens.concat(DEFAULT_TOKENS) : DEFAULT_TOKENS;

  function incrementSwallowed() {
    swallowedTotal++;
    if (els.swallowedCount) {
      els.swallowedCount.textContent = String(swallowedTotal);
    }
  }

  function spawnFragment(x, y, label) {
    if (fragments.length >= 45) {
      fragments.shift();
    }
    var w = window.innerWidth || 1280;
    var h = window.innerHeight || 720;
    var cx = w * 0.5;
    var cy = h * 0.5;
    var dx = x - cx;
    var dy = y - cy;
    var dist = Math.max(40, Math.hypot(dx, dy));
    var angle = Math.atan2(dy, dx);

    fragments.push({
      angle: angle,
      radius: dist,
      angularVel: (0.014 + Math.random() * 0.016) * (Math.random() < 0.5 ? 1 : -1),
      radialPull: 0.75 + Math.random() * 0.9,
      label: (label || allTokens[Math.floor(Math.random() * allTokens.length)]).slice(0, 14),
      alpha: 0.92,
      scale: 1
    });
  }

  (function initVortexCanvas() {
    var canvas = els.canvas;
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var w = window.innerWidth || 1280;
    var h = window.innerHeight || 720;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      w = window.innerWidth || 1280;
      h = window.innerHeight || 720;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initMotes() {
      motes = [];
      for (var i = 0; i < 42; i++) {
        motes.push({
          angle: Math.random() * Math.PI * 2,
          radius: 70 + Math.random() * Math.max(w, h) * 0.52,
          speed: 0.0012 + Math.random() * 0.0025,
          size: 0.7 + Math.random() * 1.5,
          alpha: 0.15 + Math.random() * 0.35
        });
      }
    }

    resize();
    initMotes();
    window.addEventListener('resize', resize);

    var start = performance.now();

    function drawFrame(now) {
      var t = (now - start) * 0.001;
      var cx = w * 0.5;
      var cy = h * 0.5;
      var horizonR = Math.min(w, h) < 640 ? 34 : 46;

      ctx.clearRect(0, 0, w, h);

      // Outer accretion aura
      var aura = ctx.createRadialGradient(cx, cy, horizonR * 0.6, cx, cy, horizonR * 4.8);
      aura.addColorStop(0, 'rgba(212, 255, 77, 0.14)');
      aura.addColorStop(0.42, 'rgba(212, 255, 77, 0.035)');
      aura.addColorStop(1, 'rgba(6, 6, 8, 0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, w, h);

      // Ambient orbiting dust motes
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        if (!reducedMotion) {
          m.angle += m.speed;
          m.radius -= 0.08;
          if (m.radius < horizonR + 8) {
            m.radius = Math.max(w, h) * 0.55;
          }
        }
        var mx = cx + Math.cos(m.angle) * m.radius;
        var my = cy + Math.sin(m.angle) * m.radius;
        ctx.beginPath();
        ctx.arc(mx, my, m.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(242, 240, 234, ' + m.alpha.toFixed(3) + ')';
        ctx.fill();
      }

      // Spiraling interactive text fragments
      for (var f = fragments.length - 1; f >= 0; f--) {
        var fr = fragments[f];
        var pullBoost = Math.max(1, 210 / Math.max(30, fr.radius));
        if (!reducedMotion) {
          fr.angle += fr.angularVel * pullBoost;
          fr.radius -= fr.radialPull * pullBoost;
        } else {
          fr.radius -= 2.4;
        }

        fr.scale = Math.max(0.25, Math.min(1, fr.radius / 180));
        fr.alpha = Math.max(0, Math.min(1, (fr.radius - horizonR * 0.65) / 60));

        if (fr.radius <= horizonR * 0.75) {
          fragments.splice(f, 1);
          incrementSwallowed();
          absorptionRings.push({ r: horizonR, alpha: 0.55 });
          continue;
        }

        var fx = cx + Math.cos(fr.angle) * fr.radius;
        var fy = cy + Math.sin(fr.angle) * fr.radius;

        ctx.save();
        ctx.translate(fx, fy);
        ctx.scale(fr.scale, fr.scale);
        ctx.font = '500 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(212, 255, 77, ' + fr.alpha.toFixed(3) + ')';
        ctx.fillText(fr.label, 0, 0);
        ctx.restore();
      }

      // Absorption pulse rings
      for (var a = absorptionRings.length - 1; a >= 0; a--) {
        var ar = absorptionRings[a];
        ar.r += 1.4;
        ar.alpha *= 0.93;
        if (ar.alpha < 0.02) {
          absorptionRings.splice(a, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(cx, cy, ar.r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(212, 255, 77, ' + ar.alpha.toFixed(3) + ')';
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }

      // Event horizon core
      var pulse = reducedMotion ? 0 : Math.sin(t * 2) * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, horizonR + pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#040406';
      ctx.fill();
      ctx.strokeStyle = 'rgba(212, 255, 77, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      window.requestAnimationFrame(drawFrame);
    }

    window.requestAnimationFrame(drawFrame);
  })();

  // Seed initial subtle fragments on load
  for (var s = 0; s < 4; s++) {
    var initAngle = (Math.PI * 2 * s) / 4;
    var r = 220 + s * 40;
    spawnFragment(
      (window.innerWidth || 1280) * 0.5 + Math.cos(initAngle) * r,
      (window.innerHeight || 720) * 0.5 + Math.sin(initAngle) * r,
      allTokens[s % allTokens.length]
    );
  }

  // ========================================================================
  // Interactive Gags & Controls
  // ========================================================================

  var toastTimer = null;
  function showToast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      els.toast.hidden = true;
    }, 3200);
  }

  var glitchClicks = 0;
  var depthStages = ['-404.00 KB', '-808.00 KB', '-1,616.00 KB', '-404.00 MB', '-∞ KB'];
  var pathConsumed = false;
  var feedingTimer = null;

  function restorePathDisplay() {
    window.clearInterval(feedingTimer);
    feedingTimer = null;
    pathConsumed = false;
    els.requestedPath.textContent = fullDisplayPath;
    els.btnFeedVoid.textContent = 'feed path to void';
  }

  if (els.codeBadge) {
    els.codeBadge.addEventListener('click', function () {
      glitchClicks++;
      playGlitchSound();
      els.codeBadge.classList.remove('is-glitching');
      void els.codeBadge.offsetWidth;
      els.codeBadge.classList.add('is-glitching');

      var depth = depthStages[glitchClicks % depthStages.length];
      els.voidDepth.textContent = depth;

      var rect = els.codeBadge.getBoundingClientRect();
      for (var i = 0; i < 6; i++) {
        spawnFragment(
          rect.left + Math.random() * rect.width,
          rect.top + Math.random() * rect.height,
          DEFAULT_TOKENS[(glitchClicks + i) % DEFAULT_TOKENS.length]
        );
      }

      if (pathConsumed) {
        restorePathDisplay();
        showToast('Reality glitched. Restored your missing URL.');
      } else {
        els.excuseLine.textContent = 'Gravity spiked. Payload depth is now ' + depth + '.';
      }
    });
  }

  var searchClicks = 0;
  var loopExcuses = [
    'Maybe the real webpage was the typos we made along the way.',
    'Schrödinger’s route: checked the box, definitely nothing inside.',
    'Permanently archived inside /dev/null since the dawn of DNS.',
    'Still 0.000% chance. Even quantum tunneling gave up.'
  ];

  function downloadLostReceipt() {
    var now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    var content = [
      '+--------------------------------------------------------------+',
      '|             LOST & FOUND RECEIPT · CASE #404^2               |',
      '|                      siciju.online                           |',
      '+--------------------------------------------------------------+',
      '',
      '  Requested URL      : ' + fullDisplayPath,
      '  Diagnosis          : ' + els.diagnosisText.textContent,
      '  Measured Payload   : ' + els.voidDepth.textContent,
      '  Fragments Swallowed: ' + swallowedTotal,
      '  Timestamp (UTC)    : ' + now,
      '',
      'Status: CONFIRMED MISSING INSIDE AN ALREADY EMPTY WEBSITE.',
      'Please retain this receipt as proof that nothing happened.',
      '+--------------------------------------------------------------+'
    ].join('\n');

    var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'missing-page-receipt-404.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  if (els.btnSearchHarder) {
    els.btnSearchHarder.addEventListener('click', function () {
      searchClicks++;
      var rect = els.btnSearchHarder.getBoundingClientRect();
      var bx = rect.left + rect.width * 0.5;
      var by = rect.top + rect.height * 0.5;

      if (searchClicks === 1) {
        playSwallowSound();
        for (var i = 0; i < 5; i++) spawnFragment(bx + (Math.random() - 0.5) * 90, by);
        els.excuseLine.textContent = 'Checked behind the CSS pixels. Still missing.';
      } else if (searchClicks === 2) {
        playSwallowSound();
        els.excuseLine.textContent = 'Checked the backup server. Reminder: there is no server.';
      } else if (searchClicks === 3) {
        playSwallowSound();
        els.excuseLine.textContent = 'Asked Cloudflare edge nodes worldwide. All of them shrugged.';
      } else if (searchClicks === 4) {
        playGlitchSound();
        els.voidCard.classList.remove('is-warping');
        void els.voidCard.offsetWidth;
        els.voidCard.classList.add('is-warping');
        for (var j = 0; j < 10; j++) {
          spawnFragment(
            (window.innerWidth || 1280) * Math.random(),
            (window.innerHeight || 720) * Math.random()
          );
        }
        els.excuseLine.textContent =
          'Whoa—searching too hard warped the void! Rescued the card, page still gone.';
      } else if (searchClicks === 5) {
        playReceiptChime();
        downloadLostReceipt();
        els.excuseLine.textContent =
          'Issued an official Lost & Found receipt for your missing page.';
        showToast('Downloaded missing-page-receipt-404.txt');
      } else {
        playSwallowSound();
        spawnFragment(bx, by);
        els.excuseLine.textContent = loopExcuses[(searchClicks - 6) % loopExcuses.length];
      }
    });
  }

  if (els.btnFeedVoid) {
    els.btnFeedVoid.addEventListener('click', function () {
      if (feedingTimer) return;

      if (pathConsumed) {
        playReceiptChime();
        restorePathDisplay();
        els.excuseLine.textContent = 'Spat your broken URL back out. Still leads nowhere.';
        return;
      }

      var remaining = safePath;
      var rect = els.requestedPath.getBoundingClientRect();
      els.btnFeedVoid.textContent = 'consuming...';

      feedingTimer = window.setInterval(function () {
        if (!remaining.length) {
          window.clearInterval(feedingTimer);
          feedingTimer = null;
          pathConsumed = true;
          els.requestedPath.textContent = 'siciju.online/[consumed]';
          els.btnFeedVoid.textContent = 'restore path';
          els.excuseLine.textContent = 'The void ate your broken URL. Much cleaner now.';
          return;
        }

        var chunk = remaining.slice(-2);
        remaining = remaining.slice(0, -2);
        els.requestedPath.textContent = 'siciju.online' + (remaining || '/...');
        spawnFragment(
          rect.left + Math.random() * Math.max(40, rect.width),
          rect.top + rect.height * 0.5,
          chunk
        );
        playSwallowSound();
      }, 65);
    });
  }

  if (els.btnSound) {
    els.btnSound.addEventListener('click', function () {
      soundEnabled = !soundEnabled;
      els.btnSound.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
      els.btnSound.textContent = soundEnabled ? 'sound: on' : 'sound: off';
      if (soundEnabled) {
        playTone({ type: 'sine', freq: 520, duration: 0.08, volume: 0.05 });
      }
    });
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('button, a, .void-card')) return;
    playSwallowSound();
    spawnFragment(e.clientX, e.clientY);
  });

  document.addEventListener('visibilitychange', function () {
    document.title = document.hidden
      ? 'still 404² — siciju.online'
      : '404² — Lost & Found Department of Nothing | siciju.online';
  });
})();
