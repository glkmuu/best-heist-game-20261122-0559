// lasers.js — tripwire laser beams (floors 2 and 3, plus the vault gate on
// floor 1). Crossing a live beam trips the alarm and flashes a warning.
// EMP does not kill lasers; only patience and the gap between beams do.

import { TUNING } from './config.js';

export function makeLaser(def) {
  return { x1: def.x1, y1: def.y1, x2: def.x2, y2: def.y2, label: def.label || 'LASER', trippedT: 0, coolT: 0 };
}

function distToSegment(px, py, l) {
  const dx = l.x2 - l.x1, dy = l.y2 - l.y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - l.x1) * dx + (py - l.y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = l.x1 + t * dx, cy = l.y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export function updateLaser(laser, dt, game) {
  if (laser.trippedT > 0) laser.trippedT -= dt;
  if (laser.coolT > 0) { laser.coolT -= dt; return; }
  const p = game.player;
  if (distToSegment(p.x, p.y, laser) < p.r + 3) {
    laser.trippedT = 0.9;
    laser.coolT = 1.2;
    game.alarm = Math.min(100, game.alarm + TUNING.laserAlarm);
    game.ghost = false;
    game.flash = 'LASER TRIPPED — ALARM RISING';
    game.flashT = 1.8;
  }
}

export function drawLaser(ctx, laser, time) {
  const blink = laser.trippedT > 0 ? (Math.sin(time * 30) > 0 ? '#ff2d55' : '#ffffff') : '#ff2d55';
  ctx.strokeStyle = blink;
  ctx.lineWidth = laser.trippedT > 0 ? 5 : 3;
  ctx.beginPath();
  ctx.moveTo(laser.x1, laser.y1);
  ctx.lineTo(laser.x2, laser.y2);
  ctx.stroke();
  // Emitter boxes at both ends.
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(laser.x1 - 6, laser.y1 - 6, 12, 12);
  ctx.fillRect(laser.x2 - 6, laser.y2 - 6, 12, 12);
  ctx.fillStyle = '#ff2d55';
  ctx.beginPath(); ctx.arc(laser.x1, laser.y1, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(laser.x2, laser.y2, 3, 0, Math.PI * 2); ctx.fill();
  const mx = (laser.x1 + laser.x2) / 2, my = Math.max(laser.y1, laser.y2);
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#b3122e';
  ctx.fillText(laser.label, mx, my + 16);
}
