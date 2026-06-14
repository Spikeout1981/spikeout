// 音效系统 - 使用 Web Audio API 生成简单音效，无需外部音频文件
const AudioManager = {
    ctx: null,

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    },

    // 确保 AudioContext 被激活（需要用户交互后才能使用）
    ensureContext() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    },

    // 播放一个简单的音调
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
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

    // 选择卡片音效
    playSelect() {
        this.playTone(520, 0.12, 'sine', 0.2);
    },

    // 配对成功音效（上升的欢快旋律）
    playMatch() {
        const ctx = this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        [523, 659, 784].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            gain.gain.setValueAtTime(0.25, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.15);
        });
    },

    // 配对失败音效（低沉）
    playFail() {
        this.playTone(200, 0.3, 'square', 0.15);
        setTimeout(() => this.playTone(150, 0.2, 'square', 0.1), 150);
    },

    // 倒计时警告音效
    playTick() {
        this.playTone(800, 0.05, 'sine', 0.1);
    },

    // 时间耗尽音效
    playTimeUp() {
        const ctx = this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        [400, 350, 300, 200].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + i * 0.15);
            gain.gain.setValueAtTime(0.2, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.2);
        });
    },

    // 关卡完成音效
    playLevelComplete() {
        const ctx = this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const melody = [523, 587, 659, 698, 784, 880, 988, 1047];
        melody.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            gain.gain.setValueAtTime(0.2, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.25);
        });
    }
};