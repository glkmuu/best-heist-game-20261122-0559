// audio.js — tiny WebAudio synth: no audio files, everything is an oscillator.
// One job: sounds. Safe to call before any user gesture; it stays silent until one.
let ctx = null;
let muted = false;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch (err) {
    ctx = null;
  }
  return ctx;
}

function blip(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac || ac.state === 'suspended') return;
  try {
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
  } catch (err) {
    // Audio is decoration; a failure must never break the game.
  }
}

export const sfx = {
  unlock() { ensureCtx(); },
  toggleMute() { muted = !muted; return muted; },
  isMuted() { return muted; },
  step() { blip(140, 0.05, 'triangle', 0.03); },
  pickup() { blip(880, 0.12, 'sine', 0.14, 1320); },
  coin() { blip(1900, 0.09, 'square', 0.06, 1500); setTimeout(() => blip(2400, 0.1, 'square', 0.05), 70); },
  alert() { blip(220, 0.35, 'sawtooth', 0.12, 440); },
  cameraSpot() { blip(660, 0.15, 'square', 0.08, 330); },
  laser() { blip(1200, 0.2, 'sawtooth', 0.09, 300); },
  smoke() { blip(300, 0.3, 'sine', 0.08, 90); },
  emp() { blip(900, 0.4, 'sawtooth', 0.08, 80); },
  denied() { blip(160, 0.12, 'square', 0.08); },
  caught() { blip(330, 0.5, 'sawtooth', 0.14, 110); },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'sine', 0.12), i * 110));
  },
};
