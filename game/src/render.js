// render.js — draws one frame of the casino: ivory floor, crimson carpet,
// gold trim, emerald felt tables, labelled VENT and SHADOW zones, glowing
// loot, the exit door and the GETAWAY VAN waiting outside it.

import { PALETTE, VIEW } from './config.js';
import { drawGuardCone, drawGuard } from './guards.js';
import { drawCameraCone, drawCamera } from './cameras.js';
import { drawLaser } from './lasers.js';
import { drawPlayer } from './player.js';
import { drawTools } from './tools.js';

function drawLoot(ctx, loot, time) {
  if (loot.taken) return;
  const pulse = 0.75 + Math.sin(time * 4 + loot.x) * 0.25;
  ctx.save();
  ctx.translate(loot.x, loot.y);
  ctx.globalAlpha = pulse * 0.5;
  ctx.fillStyle = PALETTE.loot;
  ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  if (loot.kind === 'bars') {
    ctx.fillStyle = '#f2c230';
    ctx.fillRect(-16, -8, 32, 16);
    ctx.fillStyle = '#d9a514';
    ctx.fillRect(-16, -8, 32, 5);
    ctx.strokeStyle = '#8a6d1a'; ctx.lineWidth = 2;
    ctx.strokeRect(-16, -8, 32, 16);
  } else if (loot.kind === 'chips') {
    const cols = ['#d21f3c', '#1f5fd2', '#0e6b4a', '#f2d060'];
    cols.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(-12 + i * 8, 4 - i * 3, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    });
  } else {
    ctx.fillStyle = '#9be8ff';
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(14, -4); ctx.lineTo(9, 14); ctx.lineTo(-9, 14); ctx.lineTo(-14, -4);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(14, -4); ctx.moveTo(0, -18); ctx.lineTo(0, 14); ctx.stroke();
  }
  ctx.restore();
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7c5a00';
  ctx.fillText('◆ ' + loot.label + ' ◆', loot.x, loot.y - 42);
}

function drawVan(ctx, van, unlocked) {
  ctx.save();
  ctx.translate(van.x, van.y);
  ctx.fillStyle = '#1f2a5c';
  ctx.fillRect(0, 8, van.w, 40);
  ctx.fillStyle = '#f5eeda';
  ctx.fillRect(6, 14, 26, 18);
  ctx.fillStyle = '#d21f3c';
  ctx.fillRect(0, 8, van.w, 8);
  ctx.fillStyle = '#141414';
  ctx.beginPath(); ctx.arc(22, 50, 9, 0, Math.PI * 2); ctx.arc(van.w - 22, 50, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2d060';
  ctx.beginPath(); ctx.arc(van.w - 6, 28, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = unlocked ? '#0e6b4a' : '#7c0d22';
  ctx.fillText('GETAWAY VAN', van.x + van.w / 2, van.y + van.h + 15);
}

export function drawWorld(ctx, game, time) {
  const f = game.floor;
  // Ivory floor + checker sheen.
  ctx.fillStyle = PALETTE.ivory;
  ctx.fillRect(0, VIEW.HUD, VIEW.W, VIEW.H - VIEW.HUD);
  ctx.fillStyle = PALETTE.ivoryDark;
  for (let x = 40; x < VIEW.W; x += 80) {
    for (let y = VIEW.HUD + 40; y < VIEW.H; y += 80) {
      if (((x + y) / 80) % 2 === 0) ctx.fillRect(x, y, 40, 40);
    }
  }
  // Crimson carpet runners.
  for (const c of f.carpets) {
    ctx.fillStyle = PALETTE.crimson;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
  }
  // SHADOW zones — dark, labelled, safe to hide in while sneaking.
  for (const s of f.shadows) {
    ctx.fillStyle = 'rgba(58, 42, 77, 0.55)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = PALETTE.shadow;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(s.x, s.y, s.w, s.h);
    ctx.setLineDash([]);
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8dcff';
    ctx.fillText('SHADOW', s.x + s.w / 2, s.y + s.h / 2 + 5);
  }
  // VENT — the quiet second route into the room.
  for (const v of f.vents) {
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(v.x + 8, v.y + i * 10); ctx.lineTo(v.x + v.w - 8, v.y + i * 10); ctx.stroke();
    }
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#221408';
    ctx.fillText('VENT', v.x + v.w / 2, v.y + v.h + 18);
  }
  // Emerald felt tables.
  for (const t of f.tables) {
    ctx.fillStyle = PALETTE.emerald;
    ctx.beginPath();
    ctx.roundRect(t.x, t.y, t.w, t.h, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(242, 208, 96, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(t.x + 10, t.y + 10, t.w - 20, t.h - 20, 8);
    ctx.stroke();
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d8f5e6';
    ctx.fillText(t.label, t.x + t.w / 2, t.y + t.h / 2 + 4);
  }
  // Route labels: two visible ways to the loot, on ivory for contrast.
  // (Drawn after the tables so no table can cover them.)
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7c0d22';
  ctx.fillText('VENT ROUTE →', 140, 360);
  ctx.fillStyle = '#3a2a4d';
  ctx.fillText('← SHADOW ROUTE', 470, 700);
  // Walls with gold trim.
  for (const w of f.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, Math.min(4, w.h));
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }
  // Exit door.
  const unlocked = game.player.lootGot >= f.lootNeeded;
  ctx.fillStyle = unlocked ? '#0e6b4a' : '#5b2333';
  ctx.fillRect(f.exit.x, f.exit.y, f.exit.w, f.exit.h);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(f.exit.x, f.exit.y, f.exit.w, f.exit.h);
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f2d060';
  ctx.fillText(unlocked ? 'EXIT OPEN' : 'EXIT LOCKED', 1252, f.exit.y - 10);
  ctx.fillStyle = '#f5eeda';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.fillText(unlocked ? 'GO!' : `${game.player.lootGot}/${f.lootNeeded} LOOT`, f.exit.x + f.exit.w / 2, f.exit.y + f.exit.h / 2 + 4);

  drawVan(ctx, f.van, unlocked);

  // Vision cones under everything that walks.
  for (const c of game.cameras) drawCameraCone(ctx, c);
  for (const g of game.guards) drawGuardCone(ctx, g);
  for (const l of game.lasers) drawLaser(ctx, l, time);
  for (const loot of game.loot) drawLoot(ctx, loot, time);
  drawTools(ctx, game);
  for (const c of game.cameras) drawCamera(ctx, c);
  for (const g of game.guards) drawGuard(ctx, g);
  drawPlayer(ctx, game.player, time);

  // Flash banner for big moments (spotted, laser, loot).
  if (game.flashT > 0) {
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(124, 13, 34, 0.92)';
    const w = ctx.measureText(game.flash).width + 36;
    ctx.fillRect((VIEW.W - w) / 2, 108, w, 40);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect((VIEW.W - w) / 2, 108, w, 40);
    ctx.fillStyle = '#fff';
    ctx.fillText(game.flash, VIEW.W / 2, 136);
  }
}
