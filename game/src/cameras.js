// cameras.js — wall cameras that sweep a red cone back and forth.
// EMP (E, 300 pts) knocks every camera OFFLINE for 8 seconds.

import { TUNING, PALETTE } from './config.js';
import { losClear, pointInRect } from './world.js';

export function makeCamera(def) {
  return {
    x: def.x, y: def.y, base: def.base, sweep: def.sweep,
    angle: def.base, t: Math.random() * 6, offlineT: 0, suspicion: 0,
  };
}

export function updateCamera(cam, dt, game) {
  if (cam.offlineT > 0) { cam.offlineT -= dt; cam.suspicion = 0; return; }
  cam.t += dt;
  cam.angle = cam.base + Math.sin(cam.t * TUNING.camSweepSpeed) * cam.sweep;
  const p = game.player;
  if (game.disguiseT > 0) { cam.suspicion = Math.max(0, cam.suspicion - TUNING.decayRate * dt); return; }
  const dx = p.x - cam.x, dy = p.y - cam.y;
  const dist = Math.hypot(dx, dy);
  let sees = false;
  if (dist < TUNING.camRange) {
    let ang = Math.atan2(dy, dx) - cam.angle;
    while (ang > Math.PI) ang -= Math.PI * 2;
    while (ang < -Math.PI) ang += Math.PI * 2;
    const inSmoke = game.smokes.some((s) => {
      const sx = p.x - s.x, sy = p.y - s.y;
      return sx * sx + sy * sy < s.r * s.r;
    });
    sees = Math.abs(ang) < TUNING.camHalf && !inSmoke
      && losClear(cam.x, cam.y, p.x, p.y, game.floor.walls);
  }
  if (sees) {
    cam.suspicion = Math.min(1, cam.suspicion + TUNING.detectRate * dt);
    if (cam.suspicion >= 1) {
      cam.suspicion = 0.4;
      game.alarm = Math.min(100, game.alarm + TUNING.alarmPerSpot);
      game.ghost = false;
      game.flash = 'CAMERA SPOTTED YOU!';
      game.flashT = 1.6;
    }
  } else {
    cam.suspicion = Math.max(0, cam.suspicion - TUNING.decayRate * dt);
  }
}

export function drawCameraCone(ctx, cam) {
  if (cam.offlineT > 0) return;
  ctx.beginPath();
  ctx.moveTo(cam.x, cam.y);
  ctx.arc(cam.x, cam.y, TUNING.camRange, cam.angle - TUNING.camHalf, cam.angle + TUNING.camHalf);
  ctx.closePath();
  ctx.fillStyle = cam.suspicion > 0.05 ? 'rgba(255, 60, 60, 0.45)' : PALETTE.camCone;
  ctx.fill();
  ctx.strokeStyle = PALETTE.camEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawCamera(ctx, cam) {
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.fillStyle = cam.offlineT > 0 ? '#777' : '#2b2b2b';
  ctx.fillRect(-11, -8, 22, 16);
  ctx.rotate(cam.angle);
  ctx.fillStyle = cam.offlineT > 0 ? '#999' : '#ff2d55';
  ctx.beginPath(); ctx.arc(12, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = cam.offlineT > 0 ? '#555' : '#b3122e';
  ctx.fillText(cam.offlineT > 0 ? 'OFFLINE' : 'CAMERA', cam.x, cam.y - 16);
}
