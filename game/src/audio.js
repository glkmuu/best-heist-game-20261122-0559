// audio.js — tiny WebAudio bleeps, synthesised at run time, no audio files.
// Created lazily on the first keypress so browsers never block it.

export function makeAudio() {
  let ctx = null;
  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function blip(freq, dur, type, vol) {
    const c = ac();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  }
  return {
    pickup() { blip(880, 0.12, 'sine', 0.09); setTimeout(() => blip(1320, 0.15, 'sine', 0.09), 70); },
    coin() { blip(1560, 0.08, 'triangle', 0.07); },
    tool() { blip(440, 0.15, 'square', 0.05); setTimeout(() => blip(660, 0.15, 'square', 0.05), 90); },
    alarm() { blip(220, 0.25, 'sawtooth', 0.07); },
    caught() { blip(180, 0.4, 'sawtooth', 0.09); setTimeout(() => blip(120, 0.5, 'sawtooth', 0.09), 200); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'sine', 0.09), i * 120)); },
  };
}
