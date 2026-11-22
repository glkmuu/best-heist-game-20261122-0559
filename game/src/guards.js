// guards.js — patrol guards and the penthouse guard dog.
// A guard walks its waypoints, sweeps a vision cone, and fills suspicion
// when the thief is inside the cone with a clear line of sight. Suspicion
// decays when the thief is hidden; a full suspicion spikes the alarm.
// The dog patrols too, but it HEARS running feet — sneak past it.

import { TUNING, PALETTE } from './config.js';
import { losClear, moveCircle, circleHitsRect, pointInRect } from './world.js';

export function makeGuard(def) {
  const g = {
    kind: 'guard', x: def.wp[0][0], y: def.wp[0][1], wp: def.wp, wpIndex: 1,
    dir: 0, speed: def.speed ?? TUNING.guardSpeed, state: 'patrol',
    suspicion: 0, pauseT: 0, investigate: null, seenX: 0, seenY: 0,
    chaseT: 0, r: 16,
  };
  g.dir = Math.atan2(def.wp[1][1] - g.y, def.wp[1][0] - g.x);
  return g;
}

export function makeDog(def) {
  const d = makeGuard(def);
  d.kind = 'dog'; d.speed = def.speed ?? 96; d.r = 14;
  return d;
}

function inShadow(x, y, floor) {
  return floor.shadows.some((s) => pointInRect(x, y, s));
}
function inSmoke(x, y, smokes) {
  return smokes.some((s) => {
    const dx = x - s.x, dy = y - s.y;
    return dx * dx + dy * dy < s.r * s.r;
  });
}

export function guardCanSee(g, game) {
  const p = game.player;
  if (game.disguiseT > 0) return false;
  if (inSmoke(p.x, p.y, game.smokes)) return false;
  const range = g.kind === 'dog' ? TUNING.dogConeRange : TUNING.guardConeRange;
  const dx = p.x - g.x, dy = p.y - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  let ang = Math.atan2(dy, dx) - g.dir;
  while (ang > Math.PI) ang -= Math.PI * 2;
  while (ang < -Math.PI) ang += Math.PI * 2;
  const half = g.kind === 'dog' ? 0.7 : TUNING.guardConeHalf;
  if (Math.abs(ang) > half) return false;
  // Sneaking in a shadow zone is hard to spot: range effectively halves.
  if (p.sneaking && inShadow(p.x, p.y, game.floor) && dist > range * 0.5) return false;
  return losClear(g.x, g.y, p.x, p.y, game.floor.walls);
}

export function updateGuard(g, dt, game) {
  const p = game.player;
  const sees = guardCanSee(g, game);
  const rate = p.sneaking ? TUNING.sneakDetectRate : TUNING.detectRate;
  if (sees) {
    g.suspicion = Math.min(1, g.suspicion + rate * dt);
    g.seenX = p.x; g.seenY = p.y;
    if (g.suspicion >= 1 && g.state !== 'alert') {
      g.state = 'alert'; g.chaseT = 3.5;
      game.alarm = Math.min(100, game.alarm + TUNING.alarmPerSpot);
      game.ghost = false;
      game.flash = 'SPOTTED! — ALARM RISING';
      game.flashT = 1.6;
    }
  } else {
    g.suspicion = Math.max(0, g.suspicion - TUNING.decayRate * dt);
    if (g.state === 'alert') {
      g.chaseT -= dt;
      if (g.chaseT <= 0) { g.state = 'patrol'; g.investigate = null; }
    }
  }

  // The dog hears running feet: close + running = suspicion, no sight needed.
  if (g.kind === 'dog' && !p.sneaking && p.moving) {
    const d = Math.hypot(p.x - g.x, p.y - g.y);
    if (d < TUNING.dogHearRange) {
      g.suspicion = Math.min(1, g.suspicion + 0.55 * dt);
      g.seenX = p.x; g.seenY = p.y;
      if (g.suspicion >= 1 && g.state !== 'alert') {
        g.state = 'alert'; g.chaseT = 3;
        game.alarm = Math.min(100, game.alarm + TUNING.alarmPerSpot);
        game.ghost = false;
        game.flash = 'THE DOG HEARD YOU!';
        game.flashT = 1.6;
      }
    }
  }

  // Movement: chase the last seen spot, investigate a tossed coin, else patrol.
  let tx, ty, speed = g.speed;
  if (g.state === 'alert') { tx = g.seenX; ty = g.seenY; speed = TUNING.guardChaseSpeed; }
  else if (g.investigate) { tx = g.investigate.x; ty = g.investigate.y; }
  else {
    const wp = g.wp[g.wpIndex];
    tx = wp[0]; ty = wp[1];
    if (Math.hypot(tx - g.x, ty - g.y) < 8) {
      if (g.pauseT <= 0) g.pauseT = 0.9;
      g.pauseT -= dt;
      if (g.pauseT <= 0) g.wpIndex = (g.wpIndex + 1) % g.wp.length;
      return;
    }
  }
  const d = Math.hypot(tx - g.x, ty - g.y);
  if (d > 4) {
    const step = Math.min(speed * dt, d);
    const nx = g.x + ((tx - g.x) / d) * step;
    const ny = g.y + ((ty - g.y) / d) * step;
    const solids = [...game.floor.walls, ...game.floor.tables];
    const moved = moveCircle(g.x, g.y, nx - g.x, ny - g.y, g.r, solids);
    g.dir = Math.atan2(ny - g.y, nx - g.x);
    g.x = moved.x; g.y = moved.y;
    if (g.investigate && Math.hypot(g.investigate.x - g.x, g.investigate.y - g.y) < 14) {
      g.investigate = null; g.state = 'patrol';
    }
  }
}

export function drawGuardCone(ctx, g, game) {
  const range = g.kind === 'dog' ? TUNING.dogConeRange : TUNING.guardConeRange;
  const half = g.kind === 'dog' ? 0.7 : TUNING.guardConeHalf;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.arc(g.x, g.y, range, g.dir - half, g.dir + half);
  ctx.closePath();
  ctx.fillStyle = g.suspicion > 0.05 ? 'rgba(255, 60, 60, 0.42)' : PALETTE.cone;
  ctx.fill();
  ctx.strokeStyle = PALETTE.coneEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Dashed patrol route so the player can read the route before moving.
  ctx.setLineDash([7, 7]);
  ctx.strokeStyle = 'rgba(34, 20, 8, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  g.wp.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawGuard(ctx, g) {
  // Body: navy uniform, gold buttons, cap; the dog is brown with ears.
  ctx.save();
  ctx.translate(g.x, g.y);
  if (g.kind === 'dog') {
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5d3a17';
    ctx.beginPath(); ctx.arc(-10, -8, 5, 0, Math.PI * 2); ctx.arc(10, -8, 5, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(g.dir);
    ctx.fillStyle = '#d9a05b';
    ctx.beginPath(); ctx.moveTo(12, -5); ctx.lineTo(24, 0); ctx.lineTo(12, 5); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = g.state === 'alert' ? '#b3122e' : '#1f2a5c';
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.rotate(g.dir);
    ctx.fillStyle = '#f2d060';
    ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(24, 0); ctx.lineTo(10, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#101736';
    ctx.beginPath(); ctx.arc(-2, -9, 6, 0, Math.PI * 2); ctx.arc(-2, 9, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // Suspicion arc + state word above the guard.
  if (g.suspicion > 0.03) {
    ctx.beginPath();
    ctx.arc(g.x, g.y, 22, -Math.PI / 2, -Math.PI / 2 + g.suspicion * Math.PI * 2);
    ctx.strokeStyle = g.suspicion >= 1 ? '#ff2d55' : '#ff9f1c';
    ctx.lineWidth = 4; ctx.stroke();
  }
  const word = g.state === 'alert' ? 'ALERT!' : g.investigate ? 'SUSPICIOUS' : g.suspicion > 0.3 ? '?' : 'CALM';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = g.state === 'alert' ? '#ff2d55' : '#221408';
  ctx.fillText(word, g.x, g.y - 26);
}
