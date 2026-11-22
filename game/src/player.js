// player.js — the thief: movement, sneak/run, noise, coin toss, loot.
// WASD/arrows move. Shift = sneak (slow, quiet, small detection radius).
// Full speed is loud: guards hear running footsteps. Q tosses a coin ahead
// of the thief; the clink pulls the nearest guard to investigate the spot.

import { TUNE } from './config.js';
import { clamp, moveWithCollision } from './world.js';

export function makePlayer(start) {
  return {
    x: start.x, y: start.y,
    angle: -Math.PI / 2,
    sneaking: false,
    running: false,
    moving: false,
    speed: 0,
    coins: TUNE.coinsPerLevel,
    hints: TUNE.hintsPerLevel,
    inLight: false,
    stepTimer: 0,
    faceX: 0, faceY: -1,
  };
}

export function updatePlayer(p, dt, input, solids) {
  let dx = 0, dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  const len = Math.hypot(dx, dy);
  p.moving = len > 0;
  if (!p.moving) { p.speed = 0; p.running = false; return; }
  dx /= len; dy /= len;
  p.faceX = dx; p.faceY = dy;
  p.angle = Math.atan2(dy, dx);
  p.sneaking = !!input.sneak;
  // Sneak is slow; otherwise the thief moves at full (loud) speed.
  const speed = p.sneaking ? TUNE.sneakSpeed : TUNE.runSpeed;
  p.speed = speed;
  p.running = !p.sneaking;
  const pos = moveWithCollision(p.x, p.y, TUNE.playerRadius, dx * speed * dt, dy * speed * dt, solids);
  p.x = pos.x; p.y = pos.y;
  p.stepTimer += dt * (p.sneaking ? 0.5 : 1);
}

export function noiseRadius(p) {
  if (!p.moving) return 0;
  if (p.sneaking) return TUNE.sneakNoiseRadius;
  return TUNE.runNoiseRadius;
}

// Toss a coin to (tx,ty). Returns the coin object or null when out of coins.
export function tossCoin(p, tx, ty) {
  if (p.coins <= 0) return null;
  p.coins -= 1;
  const d = Math.hypot(tx - p.x, ty - p.y);
  const maxThrow = 190;
  const k = d > maxThrow ? maxThrow / d : 1;
  return {
    x: p.x + (tx - p.x) * k,
    y: p.y + (ty - p.y) * k,
    t: 0,       // flight time
    landed: false,
    ring: 0,    // expanding sound ring after landing
  };
}

export function updateCoin(coin, dt) {
  if (!coin) return null;
  coin.t += dt;
  if (coin.t >= 0.45 && !coin.landed) {
    coin.landed = true;
    coin.ring = 1;
  }
  if (coin.landed) {
    coin.ring += dt * 90;
    if (coin.ring > 130) return null; // ring fades, coin spent
  }
  return coin;
}

export function clampToWorld(p, w, h) {
  p.x = clamp(p.x, 20 + TUNE.playerRadius, w - 20 - TUNE.playerRadius);
  p.y = clamp(p.y, 20 + TUNE.playerRadius, h - 20 - TUNE.playerRadius);
}
