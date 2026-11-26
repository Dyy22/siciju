// Procedural Web Audio synth & rhythmic beat for VOID RUNNER // ∅-DRIFT

export class RunnerAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.beatAccumulator = 0;
    this.beatStep = 0;
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
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
      return this.ctx;
    } catch (_) {
      return null;
    }
  }

  _tone({ type = 'sine', freq = 320, freqEnd = null, duration = 0.12, delay = 0, volume = 0.06 }) {
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

  tickBeat(dt, speed, active) {
    if (!active || !this.enabled) return;
    const interval = Math.max(0.22, 0.44 - (speed - 24) * 0.0045);
    this.beatAccumulator += dt;
    if (this.beatAccumulator < interval) return;
    this.beatAccumulator -= interval;

    const pattern = [55, 55, 65.41, 73.42, 55, 55, 82.41, 65.41];
    const note = pattern[this.beatStep % pattern.length];
    this.beatStep++;

    this._tone({
      type: 'triangle',
      freq: note,
      freqEnd: note * 0.92,
      duration: interval * 0.72,
      volume: 0.032
    });
  }

  playLaneSwitch(dir = 1) {
    const f = dir > 0 ? 460 : 380;
    this._tone({ type: 'sine', freq: f, freqEnd: f * 1.28, duration: 0.055, volume: 0.045 });
  }

  playJump() {
    this._tone({ type: 'sine', freq: 240, freqEnd: 560, duration: 0.14, volume: 0.06 });
  }

  playDuck() {
    this._tone({ type: 'triangle', freq: 420, freqEnd: 150, duration: 0.1, volume: 0.055 });
  }

  playOrb(combo = 1) {
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const freq = scale[Math.min(scale.length - 1, Math.max(0, combo - 1))];
    this._tone({ type: 'sine', freq, freqEnd: freq * 1.15, duration: 0.14, volume: 0.065 });
  }

  playNearMiss() {
    this._tone({ type: 'sine', freq: 720, freqEnd: 1080, duration: 0.09, volume: 0.05 });
  }

  playShieldPickup() {
    this._tone({ type: 'sine', freq: 440, duration: 0.12, delay: 0, volume: 0.065 });
    this._tone({ type: 'sine', freq: 659.25, duration: 0.16, delay: 0.06, volume: 0.065 });
    this._tone({ type: 'sine', freq: 880, duration: 0.22, delay: 0.12, volume: 0.07 });
  }

  playShieldBreak() {
    this._tone({ type: 'sawtooth', freq: 520, freqEnd: 110, duration: 0.24, volume: 0.07 });
  }

  playMilestone() {
    this._tone({ type: 'triangle', freq: 440, duration: 0.12, delay: 0, volume: 0.065 });
    this._tone({ type: 'triangle', freq: 554.37, duration: 0.12, delay: 0.08, volume: 0.065 });
    this._tone({ type: 'triangle', freq: 659.25, duration: 0.22, delay: 0.16, volume: 0.07 });
  }

  playCrash() {
    this._tone({ type: 'sawtooth', freq: 180, freqEnd: 42, duration: 0.36, volume: 0.095 });
    this._tone({ type: 'square', freq: 115, freqEnd: 34, duration: 0.3, delay: 0.04, volume: 0.07 });
  }
}
