// main.js — THE SCARLET VAULT: game state, loop, screens, scoring.
// Screens: title → play → (caught → play) → floorclear → play → win / gameover.
// The whole game is one screen per floor: no scrolling, so every screenshot
// shows the complete heist in a single frame.

import { VIEW, TUNING, FLOOR_NAMES, GAME_TITLE, GAME_SUBTITLE } from './config.js';
import { FLOORS } from './world.js';
import { makeGuard, makeDog, updateGuard } from './guards.js';
import { makeCamera, updateCamera } from './cameras.js';
import { makeLaser, updateLaser } from './lasers.js';
import { makePlayer, updatePlayer, playerAtExit } from './player.js';
import { useTool, updateTools } from './tools.js';
import { drawWorld } from './render.js';
import { drawHUD } from './hud.js';
import { makeInput, attachInput } from './input.js';
import { makeAudio } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const game = {
  screen: 'title', floorIndex: 0, floor: FLOORS[0],
  player: null, guards: [], cameras: [], lasers: [], loot: [],
  coins: [], smokes: [], disguiseT: 0,
  alarm: 0, ghost: true, ghostFloors: [true, true, true],
  time: 0, floorTime: 0, flash: '', flashT: 0,
  stars: 0, winBreakdown: null, audio: makeAudio(),
};

function loadFloor(i) {
  const def = FLOORS[i];
  game.floorIndex = i;
  game.floor = def;
  game.player = makePlayer(def.start);
  // Keep score and lives across floors.
  if (game.kept) {
    game.player.score = game.kept.score;
    game.player.lives = game.kept.lives;
  }
  game.guards = def.guards.map(makeGuard);
  if (def.dog) game.guards.push(makeDog(def.dog));
  game.cameras = def.cameras.map(makeCamera);
  game.lasers = def.lasers.map(makeLaser);
  game.loot = def.loot.map((l) => ({ ...l, taken: false }));
  game.coins = [];
  game.smokes = [];
  game.disguiseT = 0;
  game.alarm = 0;
  game.ghost = true;
  game.floorTime = 0;
  game.flash = def.intro;
  game.flashT = 3;
}

function keepProgress() {
  game.kept = { score: game.player.score, lives: game.player.lives };
}

function startGame() {
  game.kept = null;
  game.time = 0;
  game.ghostFloors = [true, true, true];
  loadFloor(0);
  game.screen = 'play';
}

function floorComplete() {
  const p = game.player;
  const timeBonus = Math.max(0, Math.round((300 - game.floorTime) * TUNING.timeBonusPerSec));
  p.score += TUNING.floorBonus + timeBonus;
  game.ghostFloors[game.floorIndex] = game.ghost;
  game.flash = `FLOOR CLEAR! +${TUNING.floorBonus} floor bonus, +${timeBonus} time bonus`;
  game.flashT = 2.2;
  game.audio.win();
  if (game.floorIndex >= 2) {
    finishRun();
    return;
  }
  keepProgress();
  game.screen = 'floorclear';
}

function finishRun() {
  const p = game.player;
  const ghostAll = game.ghostFloors.every(Boolean);
  const timeBonus = Math.max(0, Math.round((900 - game.time) * TUNING.timeBonusPerSec));
  const ghostBonus = ghostAll ? TUNING.ghostBonus : 0;
  const lootTotal = p.score;
  p.score += timeBonus + ghostBonus;
  game.stars = ghostAll ? 3 : (game.ghostFloors.filter(Boolean).length >= 2 ? 2 : 1);
  game.winBreakdown = { loot: lootTotal, time: timeBonus, ghost: ghostBonus, total: p.score };
  game.screen = 'win';
  game.audio.win();
}

function loseLife() {
  const p = game.player;
  p.lives -= 1;
  game.audio.caught();
  if (p.lives <= 0) {
    game.screen = 'gameover';
    return;
  }
  keepProgress();
  game.screen = 'caught';
}

const input = makeInput();
attachInput(input, (code) => {
  if (code === 'Enter') {
    if (game.screen === 'title') startGame();
    else if (game.screen === 'caught') { loadFloor(game.floorIndex); game.screen = 'play'; }
    else if (game.screen === 'floorclear') { loadFloor(game.floorIndex + 1); game.screen = 'play'; }
    else if (game.screen === 'win' || game.screen === 'gameover') startGame();
  }
  if (code === 'KeyR' && (game.screen === 'play' || game.screen === 'caught')) {
    keepProgress();
    loadFloor(game.floorIndex);
    game.screen = 'play';
  }
  if (game.screen !== 'play') return;
  if (code === 'KeyQ') useTool(game, 'coin');
  if (code === 'KeyF') useTool(game, 'smoke');
  if (code === 'KeyE') useTool(game, 'emp');
  if (code === 'KeyG') useTool(game, 'disguise');
});

function update(dt) {
  if (game.screen !== 'play') return;
  game.time += dt;
  game.floorTime += dt;
  if (game.flashT > 0) game.flashT -= dt;
  updatePlayer(game.player, dt, input, game);
  for (const g of game.guards) updateGuard(g, dt, game);
  for (const c of game.cameras) updateCamera(c, dt, game);
  for (const l of game.lasers) updateLaser(l, dt, game);
  updateTools(game, dt);
  // Alarm cools slowly when nobody is actively spotting the thief.
  const spotting = game.guards.some((g) => g.suspicion > 0.05)
    || game.cameras.some((c) => c.suspicion > 0.05);
  if (!spotting) game.alarm = Math.max(0, game.alarm - TUNING.alarmDecay * dt);
  if (game.alarm >= 100) { game.alarm = 100; loseLife(); return; }
  if (game.player.lootGot >= game.floor.lootNeeded && playerAtExit(game.player, game.floor)) {
    floorComplete();
  }
}

// ---- screens ----------------------------------------------------------
function overlayPanel(title, lines, accent) {
  ctx.fillStyle = 'rgba(26, 11, 18, 0.82)';
  ctx.fillRect(0, 0, VIEW.W, VIEW.H);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 4;
  ctx.strokeRect(90, 110, VIEW.W - 180, VIEW.H - 220);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent || '#f2d060';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText(title, VIEW.W / 2, 210);
  ctx.font = '20px Georgia, serif';
  ctx.fillStyle = '#f5eeda';
  lines.forEach((line, i) => ctx.fillText(line, VIEW.W / 2, 280 + i * 38));
}

function render(time) {
  ctx.clearRect(0, 0, VIEW.W, VIEW.H);
  drawWorld(ctx, game, time);
  drawHUD(ctx, game);
  if (game.screen === 'title') {
    overlayPanel(GAME_TITLE, [
      GAME_SUBTITLE,
      '',
      'Steal every glowing loot target, dodge guard vision cones and',
      'sweeping cameras, slip past lasers — then reach the GETAWAY VAN.',
      '',
      'WASD / arrows — move      SHIFT — sneak (slow, quiet, hard to see)',
      'Q coin FREE — distract a guard      F smoke 150      E EMP 300      G disguise 250',
      '3 floors: CASINO FLOOR · VAULT FLOOR · PENTHOUSE (watch for the guard dog)',
      'Alarm 100% costs a life. Never spotted at all earns the GHOST bonus.',
      '',
      '— press ENTER to start the heist —',
    ]);
  } else if (game.screen === 'caught') {
    overlayPanel('CAUGHT!', [
      `The alarm hit 100%. You lost a life — ${game.player.lives} left.`,
      'The floor resets. The guards forget. Steal it all again.',
      '',
      '— press ENTER to try the floor again —',
    ], '#ff5b7a');
  } else if (game.screen === 'floorclear') {
    overlayPanel('FLOOR CLEAR!', [
      `Floor ${game.floorIndex + 1} done — score ${game.player.score}.`,
      game.ghost ? 'GHOST so far: nobody spotted you on this floor.' : 'You were spotted on this floor — ghost bonus lost.',
      `Next: ${FLOOR_NAMES[game.floorIndex + 1]}.`,
      '',
      '— press ENTER for the next floor —',
    ], '#7be495');
  } else if (game.screen === 'win') {
    const b = game.winBreakdown || { loot: 0, time: 0, ghost: 0, total: game.player.score };
    overlayPanel('CLEAN GETAWAY!', [
      '★'.repeat(game.stars) + '☆'.repeat(3 - game.stars),
      '',
      `LOOT score ......... ${b.loot}`,
      `TIME bonus ......... ${b.time}`,
      `GHOST bonus ........ ${b.ghost}`,
      `TOTAL SCORE ........ ${b.total}`,
      '',
      'The van is gone before the sirens arrive. The Scarlet Vault is yours.',
      '',
      '— press ENTER to run it again —',
    ], '#7be495');
  } else if (game.screen === 'gameover') {
    overlayPanel('BUSTED!', [
      'Three lives, three alarms. The house always wins — this time.',
      `Final score: ${game.player.score}.`,
      '',
      '— press ENTER to try again —',
    ], '#ff5b7a');
  }
}

// ---- debug handle for play-testing ------------------------------------
window.__game = {
  state() {
    return {
      screen: game.screen, floor: game.floorIndex + 1, floorName: game.floor.name,
      x: Math.round(game.player.x), y: Math.round(game.player.y),
      sneaking: game.player.sneaking, moving: game.player.moving,
      alarm: Math.round(game.alarm * 10) / 10, loot: game.player.lootGot,
      lootNeeded: game.floor.lootNeeded, score: game.player.score,
      lives: game.player.lives, ghost: game.ghost, time: Math.round(game.time),
      guards: game.guards.map((g) => ({ kind: g.kind, state: g.state, suspicion: Math.round(g.suspicion * 100) / 100 })),
      cameras: game.cameras.map((c) => ({ offline: Math.round(c.offlineT * 10) / 10 })),
      lasers: game.lasers.map((l) => ({ tripped: Math.round(l.trippedT * 10) / 10 })),
      coins: game.coins.length, smokes: game.smokes.length,
      disguise: Math.round(game.disguiseT * 10) / 10, stars: game.stars,
    };
  },
};

// ---- boot ---------------------------------------------------------------
loadFloor(0);
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) stageShot(game, shot, loadFloor);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render(now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
