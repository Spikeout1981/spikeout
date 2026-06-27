// 音效系统 - 使用 Web Audio API 生成简单音效，无需外部音频文件
const AudioManager = {
  ctx: null,
  synth: null,
  voices: [],
  voicesReady: false,
  pendingUtterance: null,
  currentUtterance: null,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.synth = window.speechSynthesis;
      this.loadVoices();
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  },

  loadVoices() {
    if (!this.synth) return;

    this.voices = this.synth.getVoices();
    if (this.voices.length > 0) {
      this.voicesReady = true;
      this.processPending();
    }

    this.synth.onvoiceschanged = () => {
      this.voices = this.synth.getVoices();
      this.voicesReady = true;
      this.processPending();
    };
  },

  processPending() {
    if (this.pendingUtterance && this.synth) {
      this.synth.speak(this.pendingUtterance);
      this.pendingUtterance = null;
    }
  },

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  },

  speakEnglish(text) {
    if (!this.synth) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
    }
    if (!this.synth) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = GAME_CONFIG.speechRate || 1.0;
    utterance.pitch = 1;
    utterance.volume = GAME_CONFIG.speechVolume || 1.0;

    const voice = this.voices.find((v) => v.lang.startsWith("en"));
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      this.currentUtterance = null;
    };

    if (this.voicesReady || this.voices.length > 0) {
      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    } else {
      this.pendingUtterance = utterance;
    }
  },

  playTone(frequency, duration, type = "sine", volume = 0.3) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  },

  playSelect() {
    this.playTone(520, 0.12, "sine", 0.2);
  },

  playMatch() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.25, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.15);
    });
  },

  playFail() {
    this.playTone(200, 0.3, "square", 0.15);
    setTimeout(() => this.playTone(150, 0.2, "square", 0.1), 150);
  },

  playTick() {
    this.playTone(800, 0.05, "sine", 0.1);
  },

  playTimeUp() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [400, 350, 300, 200].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      gain.gain.setValueAtTime(0.2, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.2);
    });
  },

  playLevelComplete() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const melody = [523, 587, 659, 698, 784, 880, 988, 1047];
    melody.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.2, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.25);
    });
  },
};
