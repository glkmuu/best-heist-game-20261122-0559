// render.js — canvas drawing: floor, walls, cover, vision cones (clipped by
// real line-of-sight), cameras, lasers, loot, exit, guards, dog and thief.
// Safe cover, danger and loot are readable at a glance: gold glows, cones
// are yellow, cameras red, lasers red, cover dark wood.

import { WORLD_W, WORLD_H } from './config.js';
import { angleDiff, dist, pointInRect } from './world.js';
import { laserIsLive } from './cameras.js';

// Ray-march from (x,y) along angle until a blocker or maxLen; returns length.
export function rayLength(x, y, angle, maxLen, blockers) {
  const step = 6;
  const cx = Math.cos(angle), sy = Math.sin(angle);
  for (let d = step; d <= maxLen; d += step) {
    const px = x + cx * d, py = y + sy * d;
    for (const b of blockers) {
      if (pointInRect(px, py, b)) return d - step;
    }
    if (px < 0 || px > WORLD_W || py < 0 || py > WORLD_H) return d;
  }
  return maxLen;
}

// Fill a vision cone clipped by walls/cover: fan of short rays.
export function drawCone(ctx, x, y, angle, range, fov, blockers, color) {
  const steps = 26;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= steps; i++) {
    const a = angle - fov + (2 * fov * i) / steps;
    const len = rayLength(x, y, a, range, blockers);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawFloor(ctx, time) {
  ctx.fillStyle = '#1b1a26';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  // Marble tiles.
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= WORLD_W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_H); ctx.stroke();
  }
  for (let y = 0; y <= WORLD_H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); ctx.stroke();
  }
  // Red carpet runner down the middle.
  ctx.fillStyle = 'rgba(122,22,38,0.55)';
  ctx.fillRect(430, 20, 100, 560);
  ctx.fillStyle = 'rgba(212,175,55,0.35)';
  ctx.fillRect(430, 20, 4, 560);
  ctx.fillRect(526, 20, 4, 560);
  // Moonlight pools from the windows.
  const pulse = 0.10 + Math.sin(time * 0.8) * 0.02;
  ctx.fillStyle = `rgba(140,170,255,${pulse})`;
  ctx.beginPath(); ctx.ellipse(240, 150, 110, 70, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(720, 430, 110, 70, 0, 0, Math.PI * 2); ctx.fill();
}

function drawWalls(ctx, walls) {
  for (const w of walls) {
    ctx.fillStyle = '#3a3348';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#554a6b';
    ctx.fillRect(w.x, w.y, w.w, 3);
  }
}

function drawCover(ctx, cover, time) {
  for (const c of cover) {
    if (c.kind === 'case') {
      ctx.fillStyle = '#2c2118';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = 'rgba(150,200,255,0.28)';
      ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
    } else if (c.kind === 'crate') {
      ctx.fillStyle = '#5a4023';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#7d5c33';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + c.w, c.y + c.h);
      ctx.moveTo(c.x + c.w, c.y); ctx.lineTo(c.x, c.y + c.h);
      ctx.stroke();
    } else if (c.kind === 'pillar') {
      ctx.fillStyle = '#6b5d7a';
      ctx.beginPath(); ctx.arc(c.x + 14, c.y + 14, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8d7fa3';
      ctx.beginPath(); ctx.arc(c.x + 14, c.y + 14, 9, 0, Math.PI * 2); ctx.fill();
    } else { // plant
      ctx.fillStyle = '#274d2d';
      ctx.beginPath(); ctx.arc(c.x + 12, c.y + 12, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3f7a44';
      ctx.beginPath(); ctx.arc(c.x + 12, c.y + 12, 7, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawLoot(ctx, loot, time) {
  for (const l of loot) {
    if (l.taken) continue;
    const glow = 0.55 + Math.sin(time * 3 + l.x) * 0.25;
    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 22 * glow;
    ctx.fillStyle = l.kind === 'sapphire' ? '#5ec8ff' : l.kind === 'crown' ? '#ffe066' : l.kind === 'vault' ? '#ff9d5c' : '#ffd700';
    ctx.beginPath();
    ctx.arc(l.x, l.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Diamond sparkle.
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(l.x - 8, l.y); ctx.lineTo(l.x + 8, l.y);
    ctx.moveTo(l.x, l.y - 8); ctx.lineTo(l.x, l.y + 8);
    ctx.stroke();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOOT', l.x, l.y - 20);
  }
}

function drawExit(ctx, exit, unlocked, time) {
  const glow = unlocked ? 0.5 + Math.sin(time * 4) * 0.3 : 0.12;
  ctx.save();
  ctx.shadowColor = unlocked ? '#4dff88' : '#888888';
  ctx.shadowBlur = unlocked ? 20 * glow + 8 : 4;
  ctx.fillStyle = unlocked ? '#1f7a3d' : '#555a63';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.restore();
  ctx.strokeStyle = unlocked ? '#4dff88' : '#999';
  ctx.lineWidth = 2;
  ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = unlocked ? '#b6ffcf' : '#cccccc';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(unlocked ? 'EXIT OPEN' : 'EXIT LOCKED', exit.x + exit.w / 2, exit.y - 6);
}

function drawLasers(ctx, lasers, time) {
  for (const l of lasers) {
    const live = laserIsLive(l, time);
    const alpha = live ? 0.85 : 0.18;
    ctx.save();
    ctx.shadowColor = '#ff2d2d';
    ctx.shadowBlur = live ? 12 : 2;
    ctx.strokeStyle = `rgba(255,45,45,${alpha})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash(live ? [] : [6, 6]);
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    // Emitter posts.
    ctx.fillStyle = '#a33';
    ctx.fillRect(l.x1 - 4, l.y1 - 4, 8, 8);
    ctx.fillRect(l.x2 - 4, l.y2 - 4, 8, 8);
  }
}

function drawGuard(ctx, g, blockers, time) {
  const coneColor = g.state === 'alerted' ? 'rgba(255,60,60,0.30)'
    : g.state === 'suspicious' ? 'rgba(255,170,40,0.30)' : 'rgba(255,230,90,0.22)';
  drawCone(ctx, g.x, g.y, g.angle, g.range, g.fov, blockers, coneColor);
  // Body.
  ctx.save();
  ctx.shadowColor = g.state === 'alerted' ? '#ff4040' : '#000';
  ctx.shadowBlur = g.state === 'alerted' ? 12 : 4;
  ctx.fillStyle = g.kind === 'dog' ? '#8a6b3f' : (g.state === 'alerted' ? '#b03030' : '#2f4d8a');
  ctx.beginPath();
  ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Facing tick + eyes.
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.angle) * 18, g.y + Math.sin(g.angle) * 18);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.kind === 'dog' ? 'DOG' : 'GUARD', g.x, g.y - 20);
  // Detection arc above the guard.
  if (g.detection > 2) {
    ctx.strokeStyle = g.detection >= 100 ? '#ff4040' : '#ffb020';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 20, -Math.PI / 2, -Math.PI / 2 + (g.detection / 100) * Math.PI * 2);
    ctx.stroke();
  }
  if (g.state === 'suspicious') {
    ctx.fillStyle = '#ffb020';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('?', g.x + 20, g.y - 16);
  }
  if (g.state === 'alerted') {
    ctx.fillStyle = '#ff4040';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('!', g.x + 20, g.y - 16);
  }
}

function drawCamera(ctx, cam, blockers) {
  drawCone(ctx, cam.x, cam.y, cam.angle, cam.range, cam.fov, blockers, 'rgba(255,80,80,0.20)');
  ctx.fillStyle = '#7a2020';
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff5040';
  ctx.beginPath();
  ctx.arc(cam.x + Math.cos(cam.angle) * 6, cam.y + Math.sin(cam.angle) * 6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff9080';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CAM', cam.x, cam.y - 14);
}

function drawPlayer(ctx, p, time) {
  // Noise ring while running.
  if (p.moving && !p.sneaking) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 26 + Math.sin(time * 6) * 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.save();
  ctx.shadowColor = '#7fd4ff';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#101418';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Hood + face direction.
  ctx.fillStyle = '#2b3a4a';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd9a0';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.angle) * 4, p.y + Math.sin(p.angle) * 4, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7fd4ff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(p.sneaking ? 'SNEAK' : 'THIEF', p.x, p.y - 19);
}

function drawCoin(ctx, coin) {
  if (!coin) return;
  if (coin.landed) {
    ctx.strokeStyle = `rgba(255,215,0,${Math.max(0, 1 - coin.ring / 130)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.ring, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a67c00';
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function render(ctx, state, time) {
  const level = state.level;
  const blockers = [...level.walls, ...level.cover];
  drawFloor(ctx, time);
  drawLoot(ctx, level.loot, time);
  drawExit(ctx, level.exit, state.lootGot >= level.loot.length, time);
  drawCover(ctx, level.cover, time);
  drawWalls(ctx, level.walls);
  drawLasers(ctx, state.lasers, time);
  for (const cam of state.cameras) drawCamera(ctx, cam, blockers);
  for (const g of state.guards) drawGuard(ctx, g, blockers, time);
  drawCoin(ctx, state.coin);
  drawPlayer(ctx, state.player, time);
  // Hint arrow toward the exit when a hint is active.
  if (state.hintTimer > 0 && state.player) {
    const p = state.player;
    const a = Math.atan2(level.exit.y + 15 - p.y, level.exit.x + 22 - p.x);
    ctx.save();
    ctx.translate(p.x + Math.cos(a) * 34, p.y + Math.sin(a) * 34);
    ctx.rotate(a);
    ctx.fillStyle = '#4dff88';
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // Vignette: night tension at the edges.
  const grad = ctx.createRadialGradient(480, 300, 260, 480, 300, 560);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
}
