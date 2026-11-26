// Procedural Web Audio soundscape for SECTOR ∅ (zero external audio files)

export class VoidAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.droneRunning = false;
    this.droneGain = null;
    this.oscA = null;
    this.oscB = null;
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    if (this.droneGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.droneGain.gain.cancelScheduledValues(now);
        this.droneGain.gain.setTargetAtTime(this.enabled ? 0.028 : 0.0001, now, 0.15);
      } catch (_) {}
    }
  }

  isEnabled() {
    return this.enabled;
  }

  unlock() {
    if (!this.enabled) return null;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (!this.droneRunning) {
        this._startAmbientDrone();
      }
      return this.ctx;
    } catch (_) {
      return null;
    }
  }

  _startAmbientDrone() {
    if (!this.ctx || this.droneRunning) return;
    try {
      const ctx = this.ctx;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 180;

      const gain = ctx.createGain();
      gain.gain.value = this.enabled ? 0.028 : 0.0001;

      const oscA = ctx.createOscillator();
      oscA.type = 'sine';
      oscA.frequency.value = 55; // A1

      const oscB = ctx.createOscillator();
      oscB.type = 'triangle';
      oscB.frequency.value = 82.41; // E2

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.09;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 55;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      oscA.start();
      oscB.start();
      lfo.start();

      this.oscA = oscA;
      this.oscB = oscB;
      this.droneGain = gain;
      this.droneRunning = true;
    } catch (_) {}
  }

  _tone({ type = 'sine', freq = 330, freqEnd = null, duration = 0.14, delay = 0, volume = 0.06 }) {
    const ctx = this.unlock();
    if (!ctx) return;
    try {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
      }

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (_) {}
  }

  playFootstep(sprint = false) {
    const base = sprint ? 115 : 88;
    const jitter = (Math.random() - 0.5) * 18;
    this._tone({
      type: 'triangle',
      freq: base + jitter,
      freqEnd: 38,
      duration: 0.065,
      volume: sprint ? 0.045 : 0.03
    });
  }

  playJump() {
    this._tone({ type: 'sine', freq: 150, freqEnd: 290, duration: 0.13, volume: 0.05 });
  }

  playLand() {
    this._tone({ type: 'triangle', freq: 95, freqEnd: 36, duration: 0.09, volume: 0.055 });
  }

  playFlashlight(isOn) {
    this._tone({
      type: 'square',
      freq: isOn ? 880 : 540,
      freqEnd: isOn ? 620 : 320,
      duration: 0.032,
      volume: 0.04
    });
  }

  playWorldLamp(isLight) {
    this._tone({ type: 'triangle', freq: isLight ? 620 : 420, freqEnd: 260, duration: 0.06, volume: 0.08 });
    this._tone({
      type: 'sine',
      freq: isLight ? 880 : 280,
      freqEnd: isLight ? 1120 : 190,
      duration: 0.14,
      delay: 0.045,
      volume: 0.06
    });
  }

  playAnomalyFound() {
    const notes = [329.63, 440, 554.37, 659.25];
    notes.forEach((n, idx) => {
      this._tone({ type: 'sine', freq: n, duration: 0.34, delay: idx * 0.075, volume: 0.07 });
    });
  }

  playInteractPing() {
    this._tone({ type: 'sine', freq: 480, freqEnd: 620, duration: 0.1, volume: 0.055 });
  }

  playWarp() {
    this._tone({ type: 'sawtooth', freq: 420, freqEnd: 95, duration: 0.3, volume: 0.045 });
  }

  playVictory() {
    const chord = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
    chord.forEach((n, idx) => {
      this._tone({ type: 'sine', freq: n, duration: 0.65, delay: idx * 0.09, volume: 0.07 });
    });
  }
}
