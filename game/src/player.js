// player.js — the thief: a burglar in a black suit and a red scarf.
// Runs fast and loud, sneaks slow and quiet. Loot is picked up by walking
// over it; the exit stays locked until every loot target is taken.

import { TUNING } from './config.js';
import { moveCircle, pointInRect } from './world.js';

export function makePlayer(start) {
  return {
    x: start.x, y: start.y, r: TUNING.playerRadius,
    dir: -Math.PI / 2, sneaking: false, moving: false,
    lives: 3, lootGot: 0, score: 0,
  };
}

export function updatePlayer(p, dt, input, game) {
  let mx = 0, my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  p.moving = mx !== 0 || my !== 0;
  p.sneaking = !!input.sneak && p.moving;
  if (p.moving) {
    const len = Math.hypot(mx, my);
    const speed = p.sneaking ? TUNING.sneakSpeed : TUNING.runSpeed;
    const dx = (mx / len) * speed * dt;
    const dy = (my / len) * speed * dt;
    p.dir = Math.atan2(dy, dx);
    const solids = [...game.floor.walls, ...game.floor.tables];
    const moved = moveCircle(p.x, p.y, dx, dy, p.r, solids);
    p.x = moved.x; p.y = moved.y;
  }
  // Loot pickup.
  for (const loot of game.loot) {
    if (!loot.taken && Math.hypot(loot.x - p.x, loot.y - p.y) < p.r + 22) {
      loot.taken = true;
      p.lootGot += 1;
      p.score += TUNING.lootScore;
      game.flash = `LOOT! ${loot.label}  +${TUNING.lootScore}`;
      game.flashT = 1.6;
      game.audio.pickup();
    }
  }
}

export function playerAtExit(p, floor) {
  return pointInRect(p.x, p.y, floor.exit);
}

export function drawPlayer(ctx, p, time) {
  const bob = p.moving ? Math.sin(time * 12) * 2 : 0;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 15, p.r + 1, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Black suit body.
  ctx.fillStyle = '#141414';
  ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Red scarf — the thief's signature, bright against the ivory floor.
  ctx.strokeStyle = '#d21f3c';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(0, 0, 12, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(-16, 20); ctx.moveTo(-6, 10); ctx.lineTo(-8, 22); ctx.stroke();
  // Face + mask.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath(); ctx.arc(0, -2, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#141414';
  ctx.fillRect(-9, -5, 18, 5);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-3.5, -2.5, 1.6, 0, Math.PI * 2); ctx.arc(3.5, -2.5, 1.6, 0, Math.PI * 2); ctx.fill();
  // Direction tick.
  ctx.rotate(p.dir);
  ctx.fillStyle = '#f2d060';
  ctx.beginPath(); ctx.moveTo(14, -4); ctx.lineTo(24, 0); ctx.lineTo(14, 4); ctx.closePath(); ctx.fill();
  ctx.restore();
  if (p.sneaking) {
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3a2a4d';
    ctx.fillText('SNEAKING', p.x, p.y - 26);
  }
}
