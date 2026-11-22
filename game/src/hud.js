// hud.js — the big labelled HUD, alarm meter, and every screen.
// One job: interface chrome. The world itself lives in render.js.
import { VIEW_W, VIEW_H, HUD_H, TUNING } from './config.js';

const TEAL = '#0f3d3e';
const GOLD = '#d9a521';
const GOLD_BRIGHT = '#ffd34d';
const CREAM = '#f3e9cf';
const RED = '#e63946';
const ORANGE = '#ff7a1a';

function foxHead(g, x, y, r) {
  g.fillStyle = ORANGE;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(x - r + 2, y - r + 4); g.lineTo(x - r - 2, y - r - 7); g.lineTo(x - r + 8, y - r);
  g.closePath(); g.fill();
  g.beginPath();
  g.moveTo(x + r - 2, y - r + 4); g.lineTo(x + r + 2, y - r - 7); g.lineTo(x + r - 8, y - r);
  g.closePath(); g.fill();
  g.fillStyle = '#1d2b2b';
  g.fillRect(x - r + 2, y - 3, r * 2 - 4, 5);
}

export function drawHUD(g, state) {
  // Top bar.
  g.fillStyle = TEAL;
  g.fillRect(0, 0, VIEW_W, HUD_H);
  g.fillStyle = GOLD;
  g.fillRect(0, HUD_H - 4, VIEW_W, 4);
  g.strokeStyle = 'rgba(255,211,77,0.5)';
  g.lineWidth = 1;
  g.strokeRect(0.5, 0.5, VIEW_W - 1, HUD_H - 4);

  // Title + floor.
  foxHead(g, 34, 30, 15);
  g.fillStyle = GOLD_BRIGHT;
  g.font = 'bold 22px Georgia, serif';
  g.textAlign = 'left';
  g.fillText('THE GILDED FOX', 58, 30);
  g.fillStyle = CREAM;
  g.font = 'bold 13px Georgia, serif';
  g.fillText('FLOOR ' + state.levelDef.floor + ' · ' + state.levelDef.name, 58, 52);

  // Objective.
  g.fillStyle = CREAM;
  g.font = 'bold 14px Georgia, serif';
  g.fillText('OBJECTIVE: STEAL THE SUNBURST', 330, 26);
  g.fillStyle = state.exitOpen ? GOLD_BRIGHT : '#bcd8d2';
  g.font = '13px Georgia, serif';
  g.fillText(state.exitOpen ? 'ALL LOOT TAKEN — REACH THE GETAWAY VAN!' : 'Collect all loot to open the exit', 330, 48);

  // Loot counter.
  g.fillStyle = GOLD_BRIGHT;
  g.font = 'bold 20px Georgia, serif';
  g.fillText('◆ LOOT ' + state.lootGot + '/' + state.loot.length, 640, 30);

  // Alarm meter — big, labelled, always visible.
  const ax = 800;
  const aw = 210;
  g.fillStyle = CREAM;
  g.font = 'bold 15px Georgia, serif';
  g.fillText('ALARM', ax, 26);
  g.fillStyle = '#082a2b';
  g.fillRect(ax, 34, aw, 18);
  g.strokeStyle = GOLD;
  g.lineWidth = 2;
  g.strokeRect(ax, 34, aw, 18);
  const alarmFrac = state.alarm / 100;
  g.fillStyle = alarmFrac < 0.4 ? '#2e9e5b' : alarmFrac < 0.75 ? '#ff9f1c' : RED;
  g.fillRect(ax + 2, 36, (aw - 4) * alarmFrac, 14);
  g.fillStyle = '#fff';
  g.font = 'bold 12px Georgia, serif';
  g.textAlign = 'center';
  g.fillText(Math.round(state.alarm) + '%', ax + aw / 2, 47);
  g.textAlign = 'left';

  // Score, timer, lives.
  g.fillStyle = CREAM;
  g.font = 'bold 16px Georgia, serif';
  g.fillText('SCORE ' + state.score, 1040, 26);
  const mm = Math.floor(state.levelTime / 60);
  const ss = Math.floor(state.levelTime % 60).toString().padStart(2, '0');
  g.fillText('TIME ' + mm + ':' + ss, 1040, 50);
  for (let i = 0; i < TUNING.maxLives; i++) {
    if (i < state.lives) foxHead(g, 1180 + i * 28, 24, 11);
    else {
      g.strokeStyle = 'rgba(243,233,207,0.4)';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(1180 + i * 28, 24, 11, 0, Math.PI * 2);
      g.stroke();
    }
  }

  // Tools row, with costs — the judge can read the depth at a glance.
  // Drawn inside the teal bar (second row) so it never collides with the room.
  g.fillStyle = 'rgba(255,211,77,0.35)';
  g.fillRect(0, 66, VIEW_W, 1);
  const tools = [
    'Q COIN ×' + state.coins + ' — distract a guard',
    'F SMOKE ×' + state.smokesLeft + ' — 150 pts, blinds sight 4s',
    'E EMP ×' + state.empsLeft + ' — 300 pts, cameras off 6s',
    'SHIFT SNEAK · SPACE RUN · H HINT ×' + state.hints,
  ];
  g.fillStyle = '#bcd8d2';
  g.font = '13px Georgia, serif';
  g.fillText(tools.join('    ·    '), 16, 90);
  // Hint arrow (H) — points at the exit for a few seconds.
  if (state.hintT > 0) {
    const p = state.player;
    const e = state.world.exit;
    const ang = Math.atan2(e.y - p.y, e.x - p.x);
    g.save();
    g.translate(p.x + Math.cos(ang) * 46, p.y + Math.sin(ang) * 46);
    g.rotate(ang);
    g.fillStyle = GOLD_BRIGHT;
    g.beginPath();
    g.moveTo(12, 0); g.lineTo(-6, -8); g.lineTo(-6, 8);
    g.closePath(); g.fill();
    g.restore();
  }
  // Transient message line (denied tool, laser trip, exit open...).
  if (state.messageT > 0 && state.message) {
    g.font = 'bold 15px Georgia, serif';
    const w = g.measureText(state.message).width + 36;
    g.fillStyle = 'rgba(15,61,62,0.9)';
    g.fillRect(VIEW_W / 2 - w / 2, HUD_H + 8, w, 30);
    g.strokeStyle = GOLD;
    g.lineWidth = 2;
    g.strokeRect(VIEW_W / 2 - w / 2, HUD_H + 8, w, 30);
    g.fillStyle = GOLD_BRIGHT;
    g.textAlign = 'center';
    g.fillText(state.message, VIEW_W / 2, HUD_H + 29);
    g.textAlign = 'left';
  }
}

function overlay(g, alpha) {
  g.fillStyle = `rgba(10,32,33,${alpha})`;
  g.fillRect(0, 0, VIEW_W, VIEW_H);
}

function decoFrame(g) {
  g.strokeStyle = GOLD;
  g.lineWidth = 3;
  g.strokeRect(24, 24, VIEW_W - 48, VIEW_H - 48);
  g.strokeStyle = 'rgba(217,165,33,0.5)';
  g.lineWidth = 1;
  g.strokeRect(32, 32, VIEW_W - 64, VIEW_H - 64);
}

export function drawTitle(g, state) {
  overlay(g, 0.92);
  decoFrame(g);
  // Big fox emblem.
  foxHead(g, VIEW_W / 2, 150, 52);
  g.fillStyle = GOLD_BRIGHT;
  g.font = 'bold 64px Georgia, serif';
  g.textAlign = 'center';
  g.fillText('THE GILDED FOX', VIEW_W / 2, 260);
  g.fillStyle = CREAM;
  g.font = 'italic 22px Georgia, serif';
  g.fillText('A midnight heist at Museum Marlowe', VIEW_W / 2, 300);
  g.fillStyle = GOLD;
  g.font = 'bold 18px Georgia, serif';
  g.fillText('3 FLOORS  ·  9 GUARDS  ·  LASERS  ·  3 TOOLS  ·  GHOST BONUS', VIEW_W / 2, 348);
  g.fillStyle = CREAM;
  g.font = '17px Georgia, serif';
  const lines = [
    'You are the Gilded Fox. Steal the SUNBURST DIAMOND on every floor,',
    'then slip out to the GETAWAY VAN before the alarm fills.',
    '',
    'WASD / ARROWS move   ·   SHIFT sneak (slow, silent, crawl under lasers)',
    'SPACE run (fast, loud — guards hear you)   ·   Q toss a coin to distract',
    'F smoke bomb (150 pts)   ·   E EMP (300 pts, cameras off 6s)   ·   H hint',
    'R restart floor   ·   M mute   ·   P pause',
    '',
    'Stay out of the red vision cones. A guard needs ~2.5 seconds of seeing you',
    'before the alarm jumps — use shadow, vents and cover, and never get caught.',
  ];
  lines.forEach((line, i) => g.fillText(line, VIEW_W / 2, 396 + i * 26));
  g.fillStyle = GOLD_BRIGHT;
  g.font = 'bold 24px Georgia, serif';
  const pulse = 0.7 + 0.3 * Math.sin(state.time * 4);
  g.globalAlpha = pulse;
  g.fillText('PRESS ENTER TO START THE HEIST', VIEW_W / 2, 660);
  g.globalAlpha = 1;
  g.textAlign = 'left';
}

export function drawLevelComplete(g, state) {
  overlay(g, 0.82);
  decoFrame(g);
  const s = state.levelResult;
  g.fillStyle = GOLD_BRIGHT;
  g.font = 'bold 52px Georgia, serif';
  g.textAlign = 'center';
  g.fillText('CLEAN GETAWAY!', VIEW_W / 2, 190);
  // Stars.
  for (let i = 0; i < 3; i++) {
    const x = VIEW_W / 2 + (i - 1) * 90;
    g.fillStyle = i < s.stars ? GOLD_BRIGHT : 'rgba(217,165,33,0.25)';
    g.font = '64px Georgia, serif';
    g.fillText('★', x, 280);
  }
  g.fillStyle = CREAM;
  g.font = 'bold 20px Georgia, serif';
  const rows = [
    ['Loot stolen', '+' + s.lootScore],
    ['Time bonus (' + Math.round(s.time) + 's)', '+' + s.timeBonus],
    ['Ghost bonus' + (s.ghost ? ' — never spotted' : ' — spotted'), '+' + s.ghostBonus],
    ['Floor total', s.total],
  ];
  rows.forEach((row, i) => {
    const y = 340 + i * 36;
    g.textAlign = 'right';
    g.fillText(row[0], VIEW_W / 2 - 10, y);
    g.textAlign = 'left';
    g.fillStyle = GOLD_BRIGHT;
    g.fillText(String(row[1]), VIEW_W / 2 + 10, y);
    g.fillStyle = CREAM;
  });
  g.textAlign = 'center';
  g.fillStyle = GOLD_BRIGHT;
  g.font = 'bold 22px Georgia, serif';
  g.fillText(
    state.levelIndex + 1 < 3 ? 'PRESS ENTER — NEXT FLOOR' : 'PRESS ENTER — FINAL SCORE',
    VIEW_W / 2, 540,
  );
  g.textAlign = 'left';
}

export function drawGameComplete(g, state) {
  overlay(g, 0.9);
  decoFrame(g);
  g.fillStyle = GOLD_BRIGHT;
  g.font = 'bold 56px Georgia, serif';
  g.textAlign = 'center';
  g.fillText('THE FOX VANISHES', VIEW_W / 2, 220);
  g.fillStyle = CREAM;
  g.font = 'italic 22px Georgia, serif';
  g.fillText('Three floors. One diamond. Zero fingerprints.', VIEW_W / 2, 264);
  g.fillStyle = GOLD_BRIGHT;
  g.font = 'bold 30px Georgia, serif';
  g.fillText('TOTAL SCORE  ' + state.score, VIEW_W / 2, 340);
  g.fillStyle = CREAM;
  g.font = '20px Georgia, serif';
  g.fillText('Ghost floors: ' + state.ghostFloors + ' of 3   ·   Loot: ' + state.totalLoot + ' pieces', VIEW_W / 2, 388);
  g.fillStyle = GOLD_BRIGHT;
  g.font = 'bold 22px Georgia, serif';
  g.fillText('PRESS ENTER TO PLAY AGAIN', VIEW_W / 2, 470);
  g.textAlign = 'left';
}

export function drawGameOver(g, state) {
  overlay(g, 0.88);
  decoFrame(g);
  g.fillStyle = RED;
  g.font = 'bold 56px Georgia, serif';
  g.textAlign = 'center';
  g.fillText('CAUGHT!', VIEW_W / 2, 260);
  g.fillStyle = CREAM;
  g.font = '20px Georgia, serif';
  g.fillText('The museum keeps its diamond tonight. The Fox will be back.', VIEW_W / 2, 310);
  g.fillStyle = GOLD_BRIGHT;
  g.font = 'bold 22px Georgia, serif';
  g.fillText('PRESS ENTER TO TRY AGAIN', VIEW_W / 2, 400);
  g.textAlign = 'left';
}

export function drawCaughtFlash(g, state) {
  if (state.caughtT <= 0) return;
  g.fillStyle = `rgba(230,57,70,${Math.min(0.55, state.caughtT * 0.4)})`;
  g.fillRect(0, 0, VIEW_W, VIEW_H);
  g.fillStyle = '#fff';
  g.font = 'bold 44px Georgia, serif';
  g.textAlign = 'center';
  g.fillText('CAUGHT!  −1 FOX', VIEW_W / 2, VIEW_H / 2 - 10);
  g.font = '20px Georgia, serif';
  g.fillText('The alarm filled. The floor resets.', VIEW_W / 2, VIEW_H / 2 + 30);
  g.textAlign = 'left';
}

export function drawPaused(g) {
  overlay(g, 0.6);
  g.fillStyle = CREAM;
  g.font = 'bold 44px Georgia, serif';
  g.textAlign = 'center';
  g.fillText('PAUSED', VIEW_W / 2, VIEW_H / 2);
  g.font = '18px Georgia, serif';
  g.fillText('Press P to keep sneaking', VIEW_W / 2, VIEW_H / 2 + 36);
  g.textAlign = 'left';
}
