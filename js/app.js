(function (global) {
  'use strict';

  var STORAGE_KEY = 'siciju_void_v1';
  var I18N = global.SICIJU_I18N;
  var Sound = global.SicijuSound;
  var Canvas = global.SicijuCanvas;

  var els = {
    whispersLayer: document.getElementById('whispers-layer'),
    rulerTop: document.getElementById('ruler-top'),
    rulerSide: document.getElementById('ruler-side'),
    brandMark: document.getElementById('brand-mark'),
    pullCordBtn: document.getElementById('pull-cord-btn'),
    pullCordHint: document.getElementById('pull-cord-hint'),
    statusCode: document.getElementById('status-code'),
    voidTimer: document.getElementById('void-timer'),
    headline: document.getElementById('headline'),
    narrator: document.getElementById('narrator'),
    checkBtn: document.getElementById('check-btn'),
    checkBtnLabel: document.getElementById('check-btn-label'),
    clickBadge: document.getElementById('click-badge'),
    restoreGravityBtn: document.getElementById('restore-gravity-btn'),
    scanPanel: document.getElementById('scan-panel'),
    scanStatus: document.getElementById('scan-status'),
    scanPct: document.getElementById('scan-pct'),
    scanFill: document.getElementById('scan-fill'),
    runawayBtn: document.getElementById('runaway-btn'),
    toast: document.getElementById('toast'),
    btnAchievements: document.getElementById('btn-achievements'),
    achHudLabel: document.getElementById('ach-hud-label'),
    achCount: document.getElementById('ach-count'),
    btnManifest: document.getElementById('btn-manifest'),
    secretPlayLink: document.getElementById('secret-play-link'),
    btnTerminal: document.getElementById('btn-terminal'),
    btnSound: document.getElementById('btn-sound'),
    modalManifest: document.getElementById('modal-manifest'),
    manifestEyebrow: document.getElementById('manifest-eyebrow'),
    manifestTitle: document.getElementById('manifest-title'),
    manifestSubtitle: document.getElementById('manifest-subtitle'),
    manifestRows: document.getElementById('manifest-rows'),
    btnDownloadCert: document.getElementById('btn-download-cert'),
    btnCloseManifest: document.getElementById('btn-close-manifest'),
    modalAchievements: document.getElementById('modal-achievements'),
    achEyebrow: document.getElementById('ach-eyebrow'),
    achTitle: document.getElementById('ach-title'),
    achSubtitle: document.getElementById('ach-subtitle'),
    achProgressFill: document.getElementById('ach-progress-fill'),
    achList: document.getElementById('ach-list'),
    achCompleteBanner: document.getElementById('ach-complete-banner'),
    achCompleteText: document.getElementById('ach-complete-text'),
    btnDownloadCert2: document.getElementById('btn-download-cert-2'),
    btnCloseAchievements: document.getElementById('btn-close-achievements'),
    terminalPanel: document.getElementById('terminal-panel'),
    btnCloseTerminal: document.getElementById('btn-close-terminal'),
    terminalOutput: document.getElementById('terminal-output'),
    terminalForm: document.getElementById('terminal-form'),
    terminalInput: document.getElementById('terminal-input')
  };

  function loadState() {
    var fallback = {
      clicks: 0,
      theme: 'dark',
      soundEnabled: true,
      unlocked: []
    };
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return {
        clicks: typeof parsed.clicks === 'number' && parsed.clicks >= 0 ? parsed.clicks : 0,
        theme: parsed.theme === 'light' ? 'light' : 'dark',
        soundEnabled: parsed.soundEnabled !== false,
        unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : []
      };
    } catch (e) {
      return fallback;
    }
  }

  function saveState() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Ignore storage quota or private mode failures
    }
  }

  var state = loadState();
  var sessionClicks = 0;
  var sessionSeconds = 0;
  var isScanning = false;
  var isDropped = false;
  var brandKnocks = 0;
  var toastTimer = null;
  var pullTimestamps = [];
  var suppressCordClickUntil = 0;
  var runawayDodges = 0;
  var runawayCaught = false;
  var terminalHistory = [];
  var terminalHistoryIndex = -1;
  var terminalInitialized = false;
  var konamiBuffer = [];
  var KONAMI_SEQ = [
    'arrowup', 'arrowup', 'arrowdown', 'arrowdown',
    'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'
  ];

  function t() {
    return I18N;
  }

  function formatDuration(secs) {
    var mins = Math.floor(secs / 60);
    var rem = secs % 60;
    return (mins < 10 ? '0' : '') + mins + ':' + (rem < 10 ? '0' : '') + rem;
  }

  function showToast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.hidden = false;
    global.clearTimeout(toastTimer);
    toastTimer = global.setTimeout(function () {
      els.toast.hidden = true;
    }, 3400);
  }

  function renderHeadline(text) {
    if (!els.headline) return;
    els.headline.setAttribute('aria-label', text);
    els.headline.textContent = '';

    var words = text.split(' ');
    for (var w = 0; w < words.length; w++) {
      var wordSpan = document.createElement('span');
      wordSpan.className = 'word';

      var chars = words[w].split('');
      for (var c = 0; c < chars.length; c++) {
        var charSpan = document.createElement('span');
        charSpan.className = 'char';
        charSpan.textContent = chars[c];
        wordSpan.appendChild(charSpan);
      }

      els.headline.appendChild(wordSpan);
      if (w < words.length - 1) {
        els.headline.appendChild(document.createTextNode(' '));
      }
    }

    if (isDropped) {
      applyGravityVars();
    }
  }

  function applyGravityVars() {
    var chars = els.headline.querySelectorAll('.char');
    for (var i = 0; i < chars.length; i++) {
      var dropY = 95 + Math.round(Math.random() * 140);
      var dropX = Math.round((Math.random() - 0.5) * 70);
      var dropRot = Math.round((Math.random() - 0.5) * 68);
      chars[i].style.setProperty('--drop-y', dropY + 'px');
      chars[i].style.setProperty('--drop-x', dropX + 'px');
      chars[i].style.setProperty('--drop-rot', dropRot + 'deg');
    }
    els.headline.classList.add('is-dropped');
  }

  function dropHeadline() {
    isDropped = true;
    applyGravityVars();
    els.restoreGravityBtn.hidden = false;
  }

  function restoreHeadline(withToast) {
    if (!isDropped) return;
    isDropped = false;
    els.headline.classList.remove('is-dropped');
    els.restoreGravityBtn.hidden = true;
    if (withToast) {
      showToast(t().brandRestoredToast);
    }
  }

  function unlockAchievement(id) {
    if (state.unlocked.indexOf(id) !== -1) return;
    state.unlocked.push(id);
    saveState();
    Sound.playUnlock();

    var dict = t();
    var found = null;
    for (var i = 0; i < dict.achievements.length; i++) {
      if (dict.achievements[i].id === id) {
        found = dict.achievements[i];
        break;
      }
    }

    if (found) {
      showToast(dict.achUnlockToast(found.title));
    }

    if (state.unlocked.length === dict.achievements.length) {
      Canvas.spawnZeroBurst(global.innerWidth * 0.5, global.innerHeight * 0.4);
    }

    renderAchievementsUI();
    renderManifestUI();
  }

  function updateRulers() {
    var dict = t();
    if (els.rulerTop) {
      els.rulerTop.textContent =
        global.innerWidth + 'px × ' + global.innerHeight + 'px ' + dict.rulerTopSuffix;
    }
    if (els.rulerSide) {
      els.rulerSide.textContent = dict.rulerSide;
    }
  }

  function applyTheme(nextTheme, silent) {
    state.theme = nextTheme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);

    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', state.theme === 'light' ? '#f4f1ea' : '#060608');
    }

    Canvas.setTheme(state.theme);
    saveState();

    var isLight = state.theme === 'light';
    els.pullCordBtn.setAttribute('aria-pressed', isLight ? 'true' : 'false');

    var dict = t();
    els.statusCode.textContent = isLight ? dict.statusLit : dict.statusEmpty;
    els.pullCordHint.textContent = isLight ? dict.cordHintLight : dict.cordHintDark;
    renderHeadline(isLight ? dict.headlineLight : dict.headlineDark);

    if (!silent) {
      Sound.playCordPull(isLight);
    }
  }

  function applyCopy() {
    var dict = t();
    document.documentElement.lang = 'en';
    document.title = dict.metaTitleActive;

    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      if (typeof dict[key] === 'string') {
        nodes[i].textContent = dict[key];
      }
    }

    var isLight = state.theme === 'light';
    els.statusCode.textContent = isLight ? dict.statusLit : dict.statusEmpty;
    els.voidTimer.title = dict.timerTooltip;
    els.pullCordBtn.setAttribute('aria-label', dict.cordPullAria);
    els.pullCordHint.textContent = isLight ? dict.cordHintLight : dict.cordHintDark;
    renderHeadline(isLight ? dict.headlineLight : dict.headlineDark);

    els.checkBtnLabel.textContent = dict.btnCheck;
    els.restoreGravityBtn.textContent = dict.btnRestoreGravity;
    if (!els.runawayBtn.hidden) {
      els.runawayBtn.textContent = runawayCaught ? dict.btnRunawayCaught : dict.btnRunaway;
    }

    els.achHudLabel.textContent = dict.hudAchievements;
    els.btnManifest.textContent = dict.hudManifest;
    els.btnSound.textContent = state.soundEnabled ? dict.hudSoundOn : dict.hudSoundOff;

    els.terminalInput.placeholder = dict.terminalPlaceholder;

    if (sessionClicks === 0) {
      els.narrator.textContent =
        state.clicks >= 3 ? dict.returnNarrator(state.clicks) : dict.defaultNarrator;
    }

    updateRulers();
    renderManifestUI();
    renderAchievementsUI();
  }

  function renderManifestUI() {
    var dict = t();
    els.manifestEyebrow.textContent = dict.manifestEyebrow;
    els.manifestTitle.textContent = dict.manifestTitle;
    els.manifestSubtitle.textContent = dict.manifestSubtitle;
    els.btnDownloadCert.textContent = dict.downloadCertBtn;

    var rows = dict.manifestRows({
      clicks: state.clicks,
      timeStr: formatDuration(sessionSeconds),
      achCount: state.unlocked.length
    });

    els.manifestRows.textContent = '';
    for (var i = 0; i < rows.length; i++) {
      var row = document.createElement('div');
      row.className = 'manifest-row';

      var k = document.createElement('span');
      k.className = 'manifest-key';
      k.textContent = rows[i].key;

      var v = document.createElement('span');
      v.className = 'manifest-val' + (rows[i].accent ? ' is-accent' : '');
      v.textContent = rows[i].val;

      row.appendChild(k);
      row.appendChild(v);
      els.manifestRows.appendChild(row);
    }
  }

  function renderAchievementsUI() {
    var dict = t();
    var count = state.unlocked.length;
    var total = dict.achievements.length;

    els.achCount.textContent = String(count);
    els.achEyebrow.textContent = dict.achEyebrow;
    els.achTitle.textContent = dict.achTitle;
    els.achSubtitle.textContent = dict.achSubtitle;
    els.achProgressFill.style.width = Math.round((count / total) * 100) + '%';

    els.achList.textContent = '';
    for (var i = 0; i < total; i++) {
      var item = dict.achievements[i];
      var unlocked = state.unlocked.indexOf(item.id) !== -1;

      var li = document.createElement('li');
      li.className = 'ach-item' + (unlocked ? ' is-unlocked' : '');

      var badge = document.createElement('span');
      badge.className = 'ach-badge';
      badge.textContent = unlocked ? '[✓]' : '[ ]';

      var body = document.createElement('div');
      var name = document.createElement('div');
      name.className = 'ach-name';
      name.textContent = item.title;

      var desc = document.createElement('div');
      desc.className = 'ach-desc';
      desc.textContent = unlocked ? item.unlockedDesc : item.hint;

      body.appendChild(name);
      body.appendChild(desc);
      li.appendChild(badge);
      li.appendChild(body);
      els.achList.appendChild(li);
    }

    if (count === total) {
      els.achCompleteBanner.hidden = false;
      els.achCompleteText.textContent = dict.achCompleteText;
      els.btnDownloadCert2.textContent = dict.downloadCertBtn;
    } else {
      els.achCompleteBanner.hidden = true;
    }
  }

  function openModal(modal) {
    closeModals();
    modal.hidden = false;
    var closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModals() {
    els.modalManifest.hidden = true;
    els.modalAchievements.hidden = true;
  }

  function downloadCertificate() {
    var dict = t();
    var now = new Date();
    var dateStr = now.toISOString().slice(0, 19).replace('T', ' ');
    var text = dict.certificateTemplate({
      dateStr: dateStr,
      timeStr: formatDuration(sessionSeconds),
      clicks: state.clicks,
      achCount: state.unlocked.length
    });

    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'certificate-of-nothing-siciju.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    unlockAchievement('collector');
    Sound.playUnlock();
  }

  // ========================================================================
  // Pull-Cord Lamp Toggle & Drag Physics
  // ========================================================================

  function toggleLamp() {
    var next = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next, false);
    unlockAchievement('lamp');

    var now = Date.now();
    pullTimestamps.push(now);
    pullTimestamps = pullTimestamps.filter(function (ts) {
      return now - ts < 4000;
    });

    var dict = t();
    if (pullTimestamps.length >= 5) {
      document.body.classList.remove('is-flickering');
      void document.body.offsetWidth;
      document.body.classList.add('is-flickering');
      showToast(dict.lampSpamToast);
    } else {
      showToast(next === 'light' ? dict.lampToastOn : dict.lampToastOff);
    }
  }

  (function initPullCordDrag() {
    var startY = 0;
    var dragging = false;
    var currentPull = 0;

    els.pullCordBtn.addEventListener('pointerdown', function (e) {
      if (e.button && e.button !== 0) return;
      startY = e.clientY;
      dragging = true;
      currentPull = 0;
      els.pullCordBtn.classList.add('is-dragging');
      if (els.pullCordBtn.setPointerCapture) {
        try {
          els.pullCordBtn.setPointerCapture(e.pointerId);
        } catch (err) {}
      }
    });

    els.pullCordBtn.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var delta = Math.max(0, Math.min(56, e.clientY - startY));
      currentPull = delta;
      document.documentElement.style.setProperty('--cord-pull', delta.toFixed(1) + 'px');
    });

    function finishPull(e) {
      if (!dragging) return;
      dragging = false;
      els.pullCordBtn.classList.remove('is-dragging');
      document.documentElement.style.setProperty('--cord-pull', '0px');

      if (currentPull >= 24) {
        suppressCordClickUntil = Date.now() + 350;
        toggleLamp();
      }
      if (e && els.pullCordBtn.releasePointerCapture) {
        try {
          els.pullCordBtn.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
    }

    els.pullCordBtn.addEventListener('pointerup', finishPull);
    els.pullCordBtn.addEventListener('pointercancel', finishPull);

    els.pullCordBtn.addEventListener('click', function () {
      if (Date.now() < suppressCordClickUntil) return;
      document.documentElement.style.setProperty('--cord-pull', '20px');
      global.setTimeout(function () {
        if (!dragging) {
          document.documentElement.style.setProperty('--cord-pull', '0px');
        }
      }, 140);
      toggleLamp();
    });
  })();

  // ========================================================================
  // Fake Deep-Void Scan & Runaway Button
  // ========================================================================

  function runFakeScan() {
    if (isScanning) return;
    isScanning = true;

    var dict = t();
    var stages = dict.scanStages;
    var step = 0;
    var bar = els.scanPanel.querySelector('.scan-bar');

    els.scanPanel.hidden = false;
    els.scanFill.style.width = '4%';
    els.scanPct.textContent = '4%';
    els.scanStatus.textContent = stages[0].label;

    function nextStage() {
      if (step < stages.length) {
        var st = stages[step];
        els.scanFill.style.width = st.pct + '%';
        els.scanPct.textContent = st.pct + '%';
        els.scanStatus.textContent = st.label;
        if (bar) bar.setAttribute('aria-valuenow', String(st.pct));
        Sound.playScanTick(st.pct / 100);
        step++;
        global.setTimeout(nextStage, step === stages.length ? 750 : 420);
      } else {
        var d = t();
        els.scanFill.style.width = '100%';
        els.scanPct.textContent = '0.00 KB';
        els.scanStatus.textContent = d.scanCompleteStatus;
        if (bar) bar.setAttribute('aria-valuenow', '100');
        els.narrator.textContent = d.scanCompleteNarrator;

        Sound.playWomp();
        var rect = els.scanPanel.getBoundingClientRect();
        Canvas.spawnZeroBurst(rect.left + rect.width * 0.5, rect.top);
        unlockAchievement('scan');
        isScanning = false;
      }
    }

    global.setTimeout(nextStage, 300);
  }

  function placeRunawaySafe(nearCenter) {
    var vw = global.innerWidth;
    var vh = global.innerHeight;
    var btnW = Math.max(els.runawayBtn.offsetWidth || 150, 150);
    var btnH = Math.max(els.runawayBtn.offsetHeight || 42, 42);

    var minX = 20;
    var maxX = Math.max(minX, vw - btnW - 20);
    var minY = 90;
    var maxY = Math.max(minY, vh - btnH - 96);

    var nextX, nextY;
    if (nearCenter) {
      nextX = Math.min(maxX, Math.max(minX, vw * 0.5 - btnW * 0.5));
      nextY = Math.min(maxY, Math.max(minY, vh * 0.72));
    } else {
      for (var tries = 0; tries < 8; tries++) {
        nextX = minX + Math.random() * (maxX - minX);
        nextY = minY + Math.random() * (maxY - minY);
        // Keep away from top-right pull cord zone
        if (!(nextX > vw - 170 && nextY < 160)) break;
      }
    }

    els.runawayBtn.style.left = Math.round(nextX) + 'px';
    els.runawayBtn.style.top = Math.round(nextY) + 'px';
  }

  function spawnRunawayButton() {
    runawayDodges = 0;
    runawayCaught = false;
    els.runawayBtn.textContent = t().btnRunaway;
    els.runawayBtn.hidden = false;
    placeRunawaySafe(true);
    els.narrator.textContent = t().runawayDodgeNarrator;
  }

  function dodgeRunaway(isTap) {
    if (runawayCaught || els.runawayBtn.hidden) return false;
    var maxDodges = isTap ? 3 : 5;
    if (runawayDodges < maxDodges) {
      runawayDodges++;
      Sound.playDodge();
      placeRunawaySafe(false);
      if (runawayDodges >= 5) {
        unlockAchievement('runaway');
      }
      return true;
    }
    return false;
  }

  els.runawayBtn.addEventListener('pointerenter', function (e) {
    if (e.pointerType === 'touch') return;
    dodgeRunaway(false);
  });

  els.runawayBtn.addEventListener('click', function () {
    if (runawayCaught) return;
    if (dodgeRunaway(true)) return;

    runawayCaught = true;
    els.runawayBtn.textContent = t().btnRunawayCaught;
    els.narrator.textContent = t().runawayCaughtNarrator;

    var rect = els.runawayBtn.getBoundingClientRect();
    Canvas.spawnZeroBurst(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5);
    unlockAchievement('runaway');

    global.setTimeout(function () {
      els.runawayBtn.hidden = true;
    }, 1500);
  });

  // ========================================================================
  // Main Escalating Button
  // ========================================================================

  els.checkBtn.addEventListener('click', function () {
    if (isScanning) return;
    sessionClicks++;
    state.clicks++;
    saveState();

    els.clickBadge.hidden = false;
    els.clickBadge.textContent = String(state.clicks);
    Sound.playButtonClick();

    var rect = els.checkBtn.getBoundingClientRect();
    var cx = rect.left + rect.width * 0.5;
    var cy = rect.top + rect.height * 0.5;
    var dict = t();

    if (isDropped && sessionClicks !== 9) {
      restoreHeadline(false);
    }

    if (sessionClicks === 1) {
      Canvas.spawnRipple(cx, cy, '0x00');
      els.narrator.textContent = dict.stepNarrator(1);
    } else if (sessionClicks === 2) {
      els.checkBtn.classList.add('is-nudged');
      global.setTimeout(function () {
        els.checkBtn.classList.remove('is-nudged');
      }, 260);
      els.narrator.textContent = dict.stepNarrator(2);
    } else if (sessionClicks === 3) {
      els.narrator.textContent = dict.stepNarrator(3);
    } else if (sessionClicks === 4) {
      runFakeScan();
    } else if (sessionClicks === 5) {
      els.scanPanel.hidden = true;
      spawnRunawayButton();
    } else if (sessionClicks === 6) {
      els.narrator.textContent = dict.stepNarrator(6);
    } else if (sessionClicks === 7) {
      els.narrator.textContent = dict.stepNarrator(7);
    } else if (sessionClicks === 8) {
      els.narrator.textContent = dict.stepNarrator(8);
      renderManifestUI();
      openModal(els.modalManifest);
      unlockAchievement('collector');
    } else if (sessionClicks === 9) {
      els.narrator.textContent = dict.stepNarrator(9);
      dropHeadline();
    } else {
      els.narrator.textContent = dict.stepNarrator(sessionClicks, {
        seconds: sessionSeconds,
        clicks: state.clicks
      });
      Canvas.spawnRipple(cx, cy, dict.echoWords[sessionClicks % dict.echoWords.length]);
    }
  });

  els.restoreGravityBtn.addEventListener('click', function () {
    Sound.playButtonClick();
    restoreHeadline(true);
  });

  els.brandMark.addEventListener('click', function () {
    Sound.playVoidPing(0.15);
    if (isDropped) {
      restoreHeadline(true);
      return;
    }
    brandKnocks++;
    if (brandKnocks >= 3 && els.secretPlayLink && els.secretPlayLink.hidden) {
      els.secretPlayLink.hidden = false;
      Sound.playUnlock();
      var br = els.brandMark.getBoundingClientRect();
      Canvas.spawnZeroBurst(br.left + br.width * 0.5, br.bottom + 12);
      showToast(t().brandKnockToast);
    } else {
      showToast(t().brandToast);
    }
  });

  // ========================================================================
  // Click Anywhere in Void -> Sonar Ripple + Echo Word
  // ========================================================================

  document.addEventListener('click', function (e) {
    if (
      e.target.closest(
        'button, a, input, .hud-bar, .modal-backdrop, .terminal-panel, .pull-cord-wrap, .scan-panel'
      )
    ) {
      return;
    }

    var words = t().echoWords;
    var word = words[Math.floor(Math.random() * words.length)];
    Canvas.spawnRipple(e.clientX, e.clientY, word);
    Sound.playVoidPing(e.clientX / (global.innerWidth || 1));
  });

  // ========================================================================
  // HUD Buttons & Modals
  // ========================================================================

  els.btnManifest.addEventListener('click', function () {
    Sound.playButtonClick();
    renderManifestUI();
    openModal(els.modalManifest);
    unlockAchievement('collector');
  });

  els.btnAchievements.addEventListener('click', function () {
    Sound.playButtonClick();
    renderAchievementsUI();
    openModal(els.modalAchievements);
  });

  els.btnCloseManifest.addEventListener('click', closeModals);
  els.btnCloseAchievements.addEventListener('click', closeModals);

  els.modalManifest.addEventListener('click', function (e) {
    if (e.target === els.modalManifest) closeModals();
  });

  els.modalAchievements.addEventListener('click', function (e) {
    if (e.target === els.modalAchievements) closeModals();
  });

  els.btnDownloadCert.addEventListener('click', downloadCertificate);
  els.btnDownloadCert2.addEventListener('click', downloadCertificate);

  els.btnSound.addEventListener('click', function () {
    state.soundEnabled = !state.soundEnabled;
    Sound.setEnabled(state.soundEnabled);
    saveState();
    els.btnSound.setAttribute('aria-pressed', state.soundEnabled ? 'true' : 'false');
    els.btnSound.textContent = state.soundEnabled ? t().hudSoundOn : t().hudSoundOff;
    if (state.soundEnabled) Sound.playButtonClick();
  });

  // ========================================================================
  // Interactive Mini-Terminal (siciju-sh)
  // ========================================================================

  function appendTermLine(text, cls) {
    var line = document.createElement('div');
    line.className = 'term-line' + (cls ? ' ' + cls : '');
    line.textContent = text;
    els.terminalOutput.appendChild(line);
    els.terminalOutput.scrollTop = els.terminalOutput.scrollHeight;
  }

  function openTerminal() {
    els.terminalPanel.hidden = false;
    els.btnTerminal.setAttribute('aria-expanded', 'true');
    if (!terminalInitialized) {
      terminalInitialized = true;
      appendTermLine(t().terminalWelcome, 'is-muted');
    }
    els.terminalInput.focus();
  }

  function closeTerminal() {
    els.terminalPanel.hidden = true;
    els.btnTerminal.setAttribute('aria-expanded', 'false');
  }

  function toggleTerminal() {
    Sound.playButtonClick();
    if (els.terminalPanel.hidden) {
      openTerminal();
    } else {
      closeTerminal();
    }
  }

  function runTerminalCommand(raw) {
    var trimmed = raw.trim();
    if (!trimmed) return;

    terminalHistory.push(trimmed);
    terminalHistoryIndex = terminalHistory.length;
    appendTermLine('guest@siciju.online:~$ ' + trimmed, 'is-cmd');
    Sound.playTerminalKey();
    unlockAchievement('terminal');

    var cmd = trimmed.toLowerCase();
    var dict = t();
    var res = dict.terminalCommands;

    if (cmd === 'help' || cmd === '?') {
      appendTermLine(dict.terminalHelp);
    } else if (cmd === 'clear' || cmd === 'cls') {
      els.terminalOutput.textContent = '';
    } else if (cmd === 'exit' || cmd === 'quit') {
      closeTerminal();
    } else if (cmd === 'ls') {
      appendTermLine(res.ls);
    } else if (cmd === 'ls -la' || cmd === 'ls -al' || cmd === 'ls -a') {
      appendTermLine(res.lsLa);
    } else if (cmd === 'cat .breeze') {
      appendTermLine(res.catBreeze);
    } else if (cmd === 'cat hopes.txt') {
      appendTermLine(res.catHopes);
    } else if (cmd === 'pwd') {
      appendTermLine(res.pwd);
    } else if (cmd === 'whoami') {
      appendTermLine(res.whoami);
    } else if (cmd === 'find' || cmd === 'find .') {
      appendTermLine(res.find);
    } else if (cmd === 'ping' || cmd === 'ping siciju.online') {
      appendTermLine(res.ping);
    } else if (cmd.indexOf('rm ') !== -1 || cmd.indexOf('sudo') === 0) {
      appendTermLine(res.sudoRm);
    } else if (cmd === 'secret') {
      appendTermLine(res.secret);
    } else if (cmd === 'lamp') {
      toggleLamp();
      appendTermLine(res.lampToggled);
    } else if (cmd === 'play' || cmd === 'enter' || cmd === '3d' || cmd === 'cd .backstage' || cmd === 'cd play') {
      appendTermLine(res.enterPlay);
      Sound.playUnlock();
      global.setTimeout(function () {
        global.location.href = '/play/';
      }, 650);
    } else {
      appendTermLine(dict.terminalUnknown(trimmed));
    }
  }

  els.btnTerminal.addEventListener('click', toggleTerminal);
  els.btnCloseTerminal.addEventListener('click', closeTerminal);

  els.terminalForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var val = els.terminalInput.value;
    els.terminalInput.value = '';
    runTerminalCommand(val);
  });

  els.terminalInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp') {
      if (terminalHistoryIndex > 0) {
        terminalHistoryIndex--;
        els.terminalInput.value = terminalHistory[terminalHistoryIndex];
      }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (terminalHistoryIndex < terminalHistory.length - 1) {
        terminalHistoryIndex++;
        els.terminalInput.value = terminalHistory[terminalHistoryIndex];
      } else {
        terminalHistoryIndex = terminalHistory.length;
        els.terminalInput.value = '';
      }
      e.preventDefault();
    }
  });

  // ========================================================================
  // Keyboard Shortcuts, Konami Code, Tab Title & Live Timer
  // ========================================================================

  document.addEventListener('keydown', function (e) {
    var activeTag = document.activeElement ? document.activeElement.tagName : '';
    var typingInInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

    if (e.key === 'Escape') {
      closeModals();
      closeTerminal();
      return;
    }

    if (!typingInInput && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === '/' || e.key === '`')) {
      e.preventDefault();
      toggleTerminal();
      return;
    }

    var keyLower = e.key.toLowerCase();
    konamiBuffer.push(keyLower);
    if (konamiBuffer.length > KONAMI_SEQ.length) {
      konamiBuffer.shift();
    }
    if (konamiBuffer.length === KONAMI_SEQ.length) {
      var matched = true;
      for (var i = 0; i < KONAMI_SEQ.length; i++) {
        if (konamiBuffer[i] !== KONAMI_SEQ[i]) {
          matched = false;
          break;
        }
      }
      if (matched) {
        konamiBuffer = [];
        Sound.playUnlock();
        if (els.secretPlayLink) els.secretPlayLink.hidden = false;
        Canvas.spawnZeroBurst(global.innerWidth * 0.5, global.innerHeight * 0.45);
        showToast(t().konamiToast);
      }
    }
  });

  document.addEventListener('visibilitychange', function () {
    var dict = t();
    if (document.hidden) {
      document.title = dict.metaTitleHidden;
    } else {
      document.title = dict.metaTitleReturned;
      global.setTimeout(function () {
        if (!document.hidden) {
          document.title = t().metaTitleActive;
        }
      }, 2800);
    }
  });

  global.addEventListener('resize', function () {
    updateRulers();
    if (!els.runawayBtn.hidden && !runawayCaught) {
      placeRunawaySafe(false);
    }
  });

  global.setInterval(function () {
    sessionSeconds++;
    els.voidTimer.textContent = formatDuration(sessionSeconds);
    if (!els.modalManifest.hidden) {
      renderManifestUI();
    }
  }, 1000);

  // ========================================================================
  // Boot
  // ========================================================================

  Sound.setEnabled(state.soundEnabled);
  els.btnSound.setAttribute('aria-pressed', state.soundEnabled ? 'true' : 'false');

  if (state.clicks > 0) {
    els.clickBadge.hidden = false;
    els.clickBadge.textContent = String(state.clicks);
  }

  applyTheme(state.theme, true);
  applyCopy();

  try {
    console.log(
      t().consoleBanner,
      'background:#060608;color:#d4ff4d;padding:4px 8px;border-radius:4px;font-weight:bold;',
      'color:#999;'
    );
  } catch (err) {}
})(window);
