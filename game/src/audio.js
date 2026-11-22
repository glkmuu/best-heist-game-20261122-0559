// audio.js — WebAudio synth sounds, no audio files.
// Footsteps, pickup chime, alert sting, coin clink, laser buzz, win jingle.

export function makeAudio() {
  return {
    ctx: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AC();
        } catch (e) { this.ctx = null; }
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    },
    tone(freq, dur, type, vol, slideTo) {
      if (this.muted) return;
      const ac = this.ensure();
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
      gain.gain.setValueAtTime(vol || 0.12, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + dur);
    },
    step(sneak) {
      this.tone(sneak ? 140 : 90, 0.06, 'triangle', sneak ? 0.03 : 0.06);
    },
    pickup() {
      this.tone(880, 0.12, 'sine', 0.14);
      setTimeout(() => this.tone(1318, 0.18, 'sine', 0.14), 90);
    },
    alert() {
      this.tone(220, 0.3, 'sawtooth', 0.14, 440);
    },
    coin() {
      this.tone(1900, 0.09, 'square', 0.07);
      setTimeout(() => this.tone(2500, 0.12, 'square', 0.06), 70);
    },
    laser() {
      this.tone(160, 0.25, 'sawtooth', 0.1, 90);
    },
    caught() {
      this.tone(330, 0.5, 'sawtooth', 0.16, 110);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'sine', 0.13), i * 120));
    },
    unlock() {
      this.tone(660, 0.15, 'sine', 0.12);
      setTimeout(() => this.tone(990, 0.2, 'sine', 0.12), 110);
    },
  };
}
