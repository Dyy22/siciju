(function (global) {
  'use strict';

  var ctx = null;
  var enabled = true;

  function ensureContext() {
    if (!enabled) return null;
    try {
      var AudioCtx = global.AudioContext || global.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!ctx) {
        ctx = new AudioCtx();
      }
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      return ctx;
    } catch (e) {
      return null;
    }
  }

  function playTone(opts) {
    var audio = ensureContext();
    if (!audio) return;

    try {
      var now = audio.currentTime + (opts.delay || 0);
      var dur = opts.duration || 0.14;
      var osc = audio.createOscillator();
      var gain = audio.createGain();

      osc.type = opts.type || 'sine';
      osc.frequency.setValueAtTime(opts.freq || 330, now);
      if (opts.freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freqEnd), now + dur);
      }

      var vol = opts.volume != null ? opts.volume : 0.08;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(audio.destination);

      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch (e) {
      // Ignore audio scheduling failures gracefully
    }
  }

  var SicijuSound = {
    setEnabled: function (val) {
      enabled = Boolean(val);
    },

    isEnabled: function () {
      return enabled;
    },

    playCordPull: function (isLightOn) {
      var base = isLightOn ? 620 : 420;
      playTone({ type: 'triangle', freq: base, freqEnd: base * 0.72, duration: 0.045, volume: 0.11 });
      playTone({
        type: 'sine',
        freq: isLightOn ? 920 : 320,
        freqEnd: isLightOn ? 1140 : 210,
        duration: 0.08,
        delay: 0.04,
        volume: 0.07
      });
    },

    playVoidPing: function (xRatio) {
      var ratio = Math.min(1, Math.max(0, xRatio || 0.5));
      var freq = 220 + ratio * 220;
      playTone({ type: 'sine', freq: freq, freqEnd: freq * 0.96, duration: 0.34, volume: 0.065 });
      playTone({ type: 'sine', freq: freq * 1.5, freqEnd: freq * 1.48, duration: 0.22, delay: 0.015, volume: 0.02 });
    },

    playButtonClick: function () {
      playTone({ type: 'triangle', freq: 520, freqEnd: 290, duration: 0.055, volume: 0.08 });
    },

    playScanTick: function (progress) {
      var pct = Math.min(1, Math.max(0, progress || 0));
      playTone({ type: 'sine', freq: 380 + pct * 440, duration: 0.055, volume: 0.05 });
    },

    playWomp: function () {
      playTone({ type: 'triangle', freq: 310, freqEnd: 250, duration: 0.16, volume: 0.09 });
      playTone({ type: 'triangle', freq: 245, freqEnd: 155, duration: 0.28, delay: 0.15, volume: 0.09 });
    },

    playDodge: function () {
      playTone({ type: 'sine', freq: 440, freqEnd: 780, duration: 0.09, volume: 0.07 });
    },

    playUnlock: function () {
      playTone({ type: 'sine', freq: 523.25, duration: 0.14, delay: 0, volume: 0.08 });
      playTone({ type: 'sine', freq: 659.25, duration: 0.14, delay: 0.08, volume: 0.08 });
      playTone({ type: 'sine', freq: 783.99, duration: 0.28, delay: 0.16, volume: 0.09 });
    },

    playTerminalKey: function () {
      playTone({ type: 'square', freq: 720, freqEnd: 520, duration: 0.025, volume: 0.025 });
    }
  };

  global.SicijuSound = SicijuSound;
})(window);
