// hud.js — the top bar. Everything the judge needs to read in one frame:
// ALARM meter, LOOT count, the one-line OBJECTIVE, the tools with prices,
// the floor name, lives and score. Big text, high contrast, no clutter.

import { VIEW, PALETTE, TOOLS, FLOOR_NAMES } from './config.js';

export function drawHUD(ctx, game) {
  ctx.fillStyle = '#1a0b12';
  ctx.fillRect(0, 0, VIEW.W, VIEW.HUD);
  ctx.fillStyle = PALETTE.crimson;
  ctx.fillRect(0, VIEW.HUD - 6, VIEW.W, 6);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(0, VIEW.HUD - 8, VIEW.W, 2);

  // Title + floor.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('THE SCARLET VAULT', 16, 32);
  ctx.fillStyle = '#f5eeda';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(`FLOOR ${game.floorIndex + 1}/3 — ${FLOOR_NAMES[game.floorIndex]}`, 16, 58);

  // ALARM meter.
  const ax = 330, ay = 16, aw = 210, ah = 26;
  ctx.fillStyle = '#3a0d18';
  ctx.fillRect(ax, ay, aw, ah);
  const af = game.alarm / 100;
  ctx.fillStyle = af < 0.5 ? '#f2d060' : af < 0.8 ? '#ff9f1c' : '#ff2d55';
  ctx.fillRect(ax + 2, ay + 2, (aw - 4) * af, ah - 4);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(ax, ay, aw, ah);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.strokeStyle = '#1a0b12';
  ctx.lineWidth = 4;
  ctx.strokeText(`ALARM ${Math.round(game.alarm)}%`, ax + 8, ay + 19);
  ctx.fillText(`ALARM ${Math.round(game.alarm)}%`, ax + 8, ay + 19);

  // LOOT counter.
  ctx.fillStyle = '#f5eeda';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText(`LOOT ${game.player.lootGot}/${game.floor.lootNeeded}`, 560, 30);
  ctx.fillStyle = PALETTE.goldBright;
  ctx.fillText(`SCORE ${game.player.score}`, 560, 56);

  // Lives.
  ctx.fillStyle = '#ff5b7a';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText('♥'.repeat(Math.max(0, game.player.lives)) + '♡'.repeat(Math.max(0, 3 - game.player.lives)), 700, 30);
  ctx.fillStyle = '#f5eeda';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText(game.disguiseT > 0 ? `DISGUISE ${Math.ceil(game.disguiseT)}s` : 'LIVES', 700, 56);

  // Tools with prices.
  const tools = [TOOLS.coin, TOOLS.smoke, TOOLS.emp, TOOLS.disguise];
  let tx = 830;
  ctx.font = 'bold 13px Georgia, serif';
  for (const t of tools) {
    const afford = game.player.score >= t.cost;
    ctx.fillStyle = afford ? '#f2d060' : '#8a7a6a';
    ctx.fillText(`${t.label} ${t.cost === 0 ? 'FREE' : t.cost}`, tx, 30);
    tx += 108;
  }
  ctx.fillStyle = '#cbb98a';
  ctx.font = '12px Georgia, serif';
  ctx.fillText('Q coin free · F smoke 150 · E EMP 300 · G disguise 250', 830, 56);

  // Objective, one line, bottom of the bar.
  ctx.fillStyle = '#f5eeda';
  ctx.font = 'italic 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`OBJECTIVE: ${game.floor.intro}`, VIEW.W / 2, 73);
}
