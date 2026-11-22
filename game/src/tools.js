// tools.js — the thief's kit. The coin is free; smoke, EMP and disguise
// cost points, and the price is printed on the HUD so the trade-off is
// visible before every use. A tool that cannot be afforded does nothing.

import { TUNING, TOOLS } from './config.js';

export function useTool(game, name) {
  const tool = TOOLS[name];
  if (!tool || game.screen !== 'play') return false;
  const p = game.player;
  if (p.score < tool.cost) {
    game.flash = `NOT ENOUGH POINTS — ${tool.label} costs ${tool.cost}`;
    game.flashT = 1.4;
    return false;
  }
  if (name === 'coin') {
    // Toss ahead of the thief; every nearby guard walks over to look.
    const cx = p.x + Math.cos(p.dir) * 120;
    const cy = p.y + Math.sin(p.dir) * 120;
    game.coins.push({ x: cx, y: cy, t: TUNING.coinLureSecs });
    for (const g of game.guards) {
      if (Math.hypot(g.x - cx, g.y - cy) < 420) {
        g.investigate = { x: cx, y: cy };
        g.state = 'suspect';
      }
    }
    game.flash = 'COIN TOSSED — guards investigate';
    game.flashT = 1.2;
    game.audio.coin();
    return true;
  }
  p.score -= tool.cost;
  if (name === 'smoke') {
    game.smokes.push({ x: p.x, y: p.y, r: 95, t: TUNING.smokeSecs });
    game.flash = 'SMOKE! Vision blocked — move!';
    game.flashT = 1.4;
  } else if (name === 'emp') {
    for (const c of game.cameras) c.offlineT = TUNING.empSecs;
    game.flash = 'EMP! Cameras OFFLINE 8s';
    game.flashT = 1.6;
  } else if (name === 'disguise') {
    game.disguiseT = TUNING.disguiseSecs;
    game.flash = 'DISGUISE! Guards ignore you 8s';
    game.flashT = 1.6;
  }
  game.audio.tool();
  return true;
}

export function updateTools(game, dt) {
  for (const c of game.coins) c.t -= dt;
  game.coins = game.coins.filter((c) => c.t > 0);
  for (const s of game.smokes) s.t -= dt;
  game.smokes = game.smokes.filter((s) => s.t > 0);
  if (game.disguiseT > 0) game.disguiseT -= dt;
}

export function drawTools(ctx, game) {
  for (const c of game.coins) {
    ctx.fillStyle = '#f2d060';
    ctx.beginPath(); ctx.arc(c.x, c.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a6d1a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = 'bold 10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8a6d1a';
    ctx.fillText('COIN', c.x, c.y - 12);
  }
  for (const s of game.smokes) {
    ctx.fillStyle = 'rgba(225,225,225,0.5)';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath(); ctx.arc(s.x - 30, s.y - 15, s.r * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s.x + 28, s.y + 18, s.r * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#555';
    ctx.fillText('SMOKE', s.x, s.y - s.r - 6);
  }
}
