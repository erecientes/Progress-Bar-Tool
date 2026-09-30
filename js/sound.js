/**
 * sound.js
 * Procedural & authentic audio feedback engine with dynamic compression.
 * Plays the authentic RotMG White Bag chime recorded directly from gameplay audio,
 * with Web Audio API decoding and zero-latency HTML5 Audio fallback.
 */
class SoundController {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.audioBuffer = null;
    this.isDecoding = false;
    this.enabled = true;
    this.volume = 0.85; // 0.0 to 1.0
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Dynamics compressor prevents distortion even at high gain levels
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-10, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.updateMasterVolume();

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);

        this.loadAuthenticAudio();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  loadAuthenticAudio() {
    if (this.audioBuffer || this.isDecoding || !this.ctx) return;
    const b64 = typeof window !== 'undefined' && typeof window.WHITEBAG_B64 === 'string' ? window.WHITEBAG_B64 : null;
    if (b64 && /^[A-Za-z0-9+/=]+$/.test(b64)) {
      this.isDecoding = true;
      try {
        const binaryString = atob(b64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        this.ctx.decodeAudioData(
          bytes.buffer.slice(0),
          (buffer) => {
            this.audioBuffer = buffer;
            this.isDecoding = false;
          },
          (err) => {
            console.warn('decodeAudioData warning:', err);
            this.isDecoding = false;
          }
        );
      } catch (e) {
        console.warn('loadAuthenticAudio error:', e);
        this.isDecoding = false;
      }
    }
  }

  setEnabled(val) {
    this.enabled = !!val;
    this.updateMasterVolume();
  }

  setVolume(volPercent) {
    // volPercent is 0 to 100
    this.volume = Math.max(0, Math.min(100, volPercent)) / 100;
    this.updateMasterVolume();
  }

  updateMasterVolume() {
    if (!this.masterGain || !this.ctx) return;
    if (!this.enabled) {
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    } else {
      // Scaled up for nice loud presence
      const targetGain = Math.pow(this.volume, 1.3) * 1.25;
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
  }

  playTestTone() {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, t); // E5 pleasant test tone
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.1); // A5

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.19);
  }

  playClick(pitchMultiplier = 1) {
    if (!this.enabled || this.volume <= 0) return;
    this.init();

    const mult = typeof pitchMultiplier === 'number' && Number.isFinite(pitchMultiplier)
      ? Math.max(0.5, Math.min(2.5, pitchMultiplier))
      : 1.0;

    // Deep Resonance: 0.94x base pitch with 1.15x warmth, dynamically ascending with progress
    this.playAuthenticBuffer({
      gainMultiplier: 1.15,
      playbackRate: 0.94 * mult
    });
  }

  playAuthenticBuffer(options = {}) {
    const rawGain = options.gainMultiplier;
    const rawRate = options.playbackRate;
    const gainMultiplier = typeof rawGain === 'number' && Number.isFinite(rawGain) && rawGain >= 0 ? rawGain : 1.0;
    const playbackRate = typeof rawRate === 'number' && Number.isFinite(rawRate) && rawRate > 0 ? rawRate : 1.0;
    const shimmerBoost = !!options.shimmerBoost;

    if (this.ctx && this.audioBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.audioBuffer;
      source.playbackRate.setValueAtTime(playbackRate, this.ctx.currentTime);

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(gainMultiplier, this.ctx.currentTime);

      if (shimmerBoost) {
        // High-frequency crystal bell emphasis around 3.5k - 5.5k Hz
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.setValueAtTime(4200, this.ctx.currentTime);
        filter.gain.setValueAtTime(7.0, this.ctx.currentTime);
        filter.Q.setValueAtTime(1.1, this.ctx.currentTime);

        source.connect(filter);
        filter.connect(gainNode);
      } else {
        source.connect(gainNode);
      }

      gainNode.connect(this.masterGain);
      source.start(0);
    } else {
      // Audio element instant fallback
      try {
        const isB64Valid = typeof window !== 'undefined' && typeof window.WHITEBAG_B64 === 'string' && /^[A-Za-z0-9+/=]+$/.test(window.WHITEBAG_B64);
        const audioSrc = isB64Valid
          ? 'data:audio/mp3;base64,' + window.WHITEBAG_B64
          : 'sounds/whitebag.mp3';
        const audio = new Audio(audioSrc);
        audio.volume = Math.min(1.0, this.volume * gainMultiplier);
        audio.playbackRate = playbackRate;
        audio.play().catch(() => {});
      } catch (e) {
        this.playProceduralChime();
      }
    }
  }

  // Backup procedural chime (in case of offline/missing audio asset)
  playProceduralChime() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const notes = [
      { freq: 783.99, delay: 0.00, dur: 0.8 },
      { freq: 987.77, delay: 0.05, dur: 0.8 },
      { freq: 1174.66, delay: 0.10, dur: 0.9 },
      { freq: 1567.98, delay: 0.15, dur: 1.1 }
    ];
    notes.forEach((n) => {
      const start = t + n.delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, start);
      gain.gain.setValueAtTime(0.7, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + n.dur);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + n.dur + 0.02);
    });
  }

  // Original task completion noise: pure sine chirp C5 (523.25 Hz) -> G5 (784.88 Hz)
  playOriginalTaskSound(direction = 'up') {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = direction === 'down' ? 523.25 * 1.5 : 523.25;
    const targetFreq = direction === 'down' ? 523.25 : 523.25 * 1.5;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, t + 0.12);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  playUndo() {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.14);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.19);
  }

  // Serious reset sound: weighty, resonant two-stage power-down tone (A4 -> D4 -> A2 + sub-bass)
  playReset() {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // Primary descending melodic tone: A4 (440 Hz) -> D4 (293.66 Hz) -> A2 (110 Hz)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, t);
    osc1.frequency.exponentialRampToValueAtTime(293.66, t + 0.10);
    osc1.frequency.exponentialRampToValueAtTime(110, t + 0.38);

    gain1.gain.setValueAtTime(0.55, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.39);

    // Deep sub-body tone: gives it a grounded, serious, resonant presence
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(220, t + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(73.4, t + 0.40);

    gain2.gain.setValueAtTime(0.001, t);
    gain2.gain.setValueAtTime(0.38, t + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.40);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.06);
    osc2.stop(t + 0.41);
  }

  playCelebration() {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    // Triumphant fanfare chord progression: C5 - E5 - G5 - C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + index * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.7, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.48);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }

  playTimerComplete() {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    // Distinct triple chime alarm for timer expiration
    const times = [0, 0.2, 0.4];
    times.forEach((offset) => {
      const t = this.ctx.currentTime + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t); // A5 chime
      osc.frequency.exponentialRampToValueAtTime(1760, t + 0.12);

      gain.gain.setValueAtTime(0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }
}
