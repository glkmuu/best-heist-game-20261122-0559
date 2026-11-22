// main.js — game loop and state machine for "The Gilded Hour".
// Screens: title -> playing -> leveldone -> (next level) -> complete.
// Caught (alarm 100% or touched by an alerted guard) costs a life and
// restarts the level. All loot collected unlocks the exit; reaching it
// completes the level with time + ghost bonuses.

import { LEVELS, TUNE, WORLD_W, WORLD_H } from './config.js';
import { hasLineOfSight, dist, pointInRect } from './world.js';
import { makeGuard, makeDog, updateGuard, guardSeesPlayer } from './guards.js';
import { makeCamera, updateCamera, cameraSeesPlayer, makeLaser, laserTripsPlayer } from './cameras.js';
import { makePlayer, updatePlayer, tossCoin, updateCoin, clampToWorld } from './player.js';
import { render } from './render.js';
import { makeInput, bindInput, consumePress } from './input.js';
import { makeAudio } from './audio.js';
import { makeUI } from './ui.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const state = {
  screen: 'title', // title | playing | paused | leveldone | caught | complete
  levelIndex: 0,
  level: null,
  player: null,
  guards: [],
  cameras: [],
  lasers: [],
  coin: null,
  coinSpot: null,
  alarm: 0,
  maxDetection: 0,
  lootGot: 0,
  score: 0,
  lives: TUNE.lives,
  time: 0,
  totalTime: 0,
  everDetected: false,
  banner: '',
  bannerTimer: 0,
  hintTimer: 0,
  paused: false,
  shotMode: false,
  levelStartScore: 0,
};

const input = makeInput();
const audio = makeAudio();
const ui = makeUI();
state.ui = ui;

function loadLevel(index) {
  const def = LEVELS[index];
  state.levelIndex = index;
  // Deep-copy level data so restarts are clean.
  state.level = JSON.parse(JSON.stringify(def));
  state.level.walls = def.walls.map((w) => ({ ...w }));
  state.level.cover = def.cover.map((c) => ({ ...c }));
  state.level.loot = def.loot.map((l) => ({ ...l, taken: false }));
  state.player = makePlayer(def.start);
  state.guards = def.guards.map(makeGuard);
  if (def.dog) state.guards.push(makeDog(def.dog));
  state.cameras = def.cameras.map(makeCamera);
  state.lasers = def.lasers.map(makeLaser);
  state.coin = null;
  state.coinSpot = null;
  state.alarm = 0;
  state.maxDetection = 0;
  state.lootGot = 0;
  state.time = 0;
  state.everDetected = false;
  state.banner = '';
  state.bannerTimer = 0;
  state.hintTimer = 0;
  state.levelStartScore = state.score;
}
state.loadLevel = loadLevel;

function solids() {
  return [...state.level.walls, ...state.level.cover];
}

function blockers() {
  return solids();
}

function setBanner(text, seconds) {
  state.banner = text;
  state.bannerTimer = seconds || 3;
}

function onCaught() {
  if (state.screen !== 'playing') return;
  state.lives -= 1;
  audio.caught();
  if (state.lives <= 0) {
    state.screen = 'complete';
    ui.showComplete(state.score, state.totalTime + state.time);
    return;
  }
  state.screen = 'caught';
  ui.showCaught(state.lives);
}

function completeLevel() {
  const level = state.level;
  const timeBonus = Math.max(0, Math.round((level.par - state.time) * 10));
  const ghostBonus = state.everDetected ? 0 : 500;
  const lootBonus = state.lootGot * 200;
  const levelScore = timeBonus + ghostBonus + lootBonus;
  const stars = levelScore >= 900 ? 3 : levelScore >= 500 ? 2 : 1;
  state.score += levelScore;
  state.totalTime += state.time;
  audio.win();
  state.screen = 'leveldone';
  ui.showLevelComplete(state.levelIndex, {
    stars, time: state.time, par: level.par,
    timeBonus, ghostBonus, lootBonus, levelScore,
  });
}

function nextLevel() {
  if (state.levelIndex + 1 >= LEVELS.length) {
    state.screen = 'complete';
    ui.showComplete(state.score, state.totalTime);
    return;
  }
  loadLevel(state.levelIndex + 1);
  state.screen = 'playing';
  ui.hideScreens();
  setBanner(state.level.name + ' — ' + state.level.sub, 4);
}

function update(dt) {
  if (state.screen !== 'playing' || state.paused) return;
  const p = state.player;
  const level = state.level;
  state.time += dt;

  // Player movement + footsteps.
  const wasMoving = p.moving;
  updatePlayer(p, dt, input, solids());
  clampToWorld(p, WORLD_W, WORLD_H);
  if (p.moving) {
    p.stepTimer -= dt;
    if (p.stepTimer <= 0) {
      p.stepTimer = p.sneaking ? 0.55 : 0.34;
      audio.step(p.sneaking);
    }
  }
  void wasMoving;

  // Light pools: standing in moonlight makes the thief easier to spot.
  p.inLight = (dist(p.x, p.y, 240, 150) < 80) || (dist(p.x, p.y, 720, 430) < 80);

  // Guards.
  let maxDet = 0;
  let anyAlerted = false;
  for (const g of state.guards) {
    updateGuard(g, dt, {
      player: p, solids: solids(), blockers: blockers(),
      time: state.time, coinSpot: state.coinSpot, onCaught,
    });
    maxDet = Math.max(maxDet, g.detection);
    if (g.state === 'alerted') anyAlerted = true;
    if (g.detection >= 45) state.everDetected = true;
  }
  state.maxDetection = maxDet;

  // Cameras.
  let camSeen = 0;
  for (const cam of state.cameras) {
    updateCamera(cam, dt, state.time);
    camSeen = Math.max(camSeen, cameraSeesPlayer(cam, p, blockers()));
  }
  if (camSeen > 0) {
    state.alarm += TUNE.alarmCamera * camSeen * dt;
    state.everDetected = true;
  }

  // Lasers.
  for (const l of state.lasers) {
    if (laserTripsPlayer(l, p, state.time)) {
      if (!l.tripped) {
        l.tripped = true;
        state.alarm += TUNE.alarmLaser;
        audio.laser();
        setBanner('LASER TRIPPED! Alarm rising!', 2.5);
      }
    } else {
      l.tripped = false;
    }
  }

  // Alarm: climbs while seen/alerted, decays while hidden.
  if (anyAlerted) state.alarm += TUNE.alarmOnSpot * dt;
  else if (maxDet <= 0 && camSeen <= 0) state.alarm -= TUNE.alarmDecay * dt;
  state.alarm = Math.max(0, Math.min(100, state.alarm));
  if (state.alarm >= 100) { onCaught(); return; }

  // Loot pickup: walk over it (or press E near it).
  for (const l of level.loot) {
    if (!l.taken && dist(p.x, p.y, l.x, l.y) < 24) {
      l.taken = true;
      state.lootGot += 1;
      state.score += 200;
      audio.pickup();
      setBanner(`Lifted the ${l.label}! (${state.lootGot}/${level.loot.length})`, 2.5);
      if (state.lootGot >= level.loot.length) {
        audio.unlock();
        setBanner('All loot lifted — the EXIT is open. Get out!', 4);
      }
    }
  }

  // Coin toss.
  if (consumePress(input, 'KeyQ')) {
    const coin = tossCoin(p, p.x + p.faceX * 150, p.y + p.faceY * 150);
    if (coin) {
      state.coin = coin;
      audio.coin();
      setBanner('Coin tossed — a guard will check the clink.', 2);
    } else {
      setBanner('Out of coins!', 1.5);
    }
  }
  if (state.coin) {
    state.coin = updateCoin(state.coin, dt);
    if (state.coin && state.coin.landed && !state.coinSpot) {
      state.coinSpot = { x: state.coin.x, y: state.coin.y };
      setTimeout(() => { state.coinSpot = null; }, 2600);
    }
  }

  // Hint.
  if (consumePress(input, 'KeyH')) {
    if (p.hints > 0) {
      p.hints -= 1;
      state.hintTimer = 3;
      setBanner('Hint: follow the green arrow to the exit.', 2);
    } else setBanner('No hints left.', 1.5);
  }
  if (state.hintTimer > 0) state.hintTimer -= dt;

  // Restart / mute / pause.
  if (consumePress(input, 'KeyR')) {
    loadLevel(state.levelIndex);
    setBanner('Level restarted.', 1.5);
  }
  if (consumePress(input, 'KeyM')) {
    setBanner(audio.toggleMute() ? 'Muted (M to unmute).' : 'Sound on.', 1.5);
  }
  if (consumePress(input, 'KeyP')) {
    state.paused = !state.paused;
    state.screen = state.paused ? 'paused' : 'playing';
    ui.showScreen(state.paused ? 'paused' : null);
    if (!state.paused) ui.hideScreens();
  }

  // Exit: locked until every loot is collected.
  const ex = level.exit;
  if (state.lootGot >= level.loot.length &&
    pointInRect(p.x, p.y, { x: ex.x - 6, y: ex.y - 6, w: ex.w + 12, h: ex.h + 12 })) {
    completeLevel();
    return;
  }

  if (state.bannerTimer > 0) {
    state.bannerTimer -= dt;
    if (state.bannerTimer <= 0) state.banner = '';
  }

  ui.update(state);
}

function loop(t) {
  requestAnimationFrame(loop);
  const now = t / 1000;
  const dt = Math.min(0.05, now - (loop.last || now));
  loop.last = now;
  if (!state.shotMode) update(dt);
  if (state.screen === 'playing' || state.screen === 'paused' || state.screen === 'leveldone' || state.screen === 'caught' || state.screen === 'complete') {
    render(ctx, state, state.time + now * 0.001);
    if (state.screen !== 'playing') ui.update(state);
  }
  // Title screen: draw the level behind the title overlay.
  if (state.screen === 'title') {
    render(ctx, state, now);
  }
}

// Buttons + Enter handling.
function wireButtons() {
  const startBtn = document.getElementById('btn-start');
  const againBtn = document.getElementById('btn-again');
  const nextBtn = document.getElementById('btn-next');
  const retryBtn = document.getElementById('btn-retry');
  const resumeBtn = document.getElementById('btn-resume');
  if (startBtn) startBtn.addEventListener('click', startGame);
  if (againBtn) againBtn.addEventListener('click', () => { resetGame(); startGame(); });
  if (nextBtn) nextBtn.addEventListener('click', nextLevel);
  if (retryBtn) retryBtn.addEventListener('click', () => {
    loadLevel(state.levelIndex);
    state.screen = 'playing';
    ui.hideScreens();
  });
  if (resumeBtn) resumeBtn.addEventListener('click', () => {
    state.paused = false;
    state.screen = 'playing';
    ui.hideScreens();
  });
}

function startGame() {
  audio.ensure();
  loadLevel(state.levelIndex);
  state.screen = 'playing';
  ui.hideScreens();
  setBanner(state.level.name + ' — ' + state.level.sub, 4);
}

function resetGame() {
  state.score = 0;
  state.lives = TUNE.lives;
  state.totalTime = 0;
  state.levelIndex = 0;
}

bindInput(input, (code) => {
  if (code === 'Enter') {
    if (state.screen === 'title') startGame();
    else if (state.screen === 'leveldone') nextLevel();
    else if (state.screen === 'caught') {
      loadLevel(state.levelIndex);
      state.screen = 'playing';
      ui.hideScreens();
    } else if (state.screen === 'complete') {
      resetGame();
      startGame();
    }
  }
});

// Debug / play-test hook: real game state, readable from the browser.
window.__heist = {
  state,
  startGame,
  loadLevel,
  nextLevel,
  resetGame,
};

// Boot: load level 1 behind the title screen, then apply ?shot= states.
loadLevel(0);
state.screen = 'title';
ui.showScreen('title');
wireButtons();
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  state.shotMode = true;
  applyShot(state, shot, parseInt(params.get('seed') || '1', 10));
  ui.hideScreens();
  if (shot === 'end') ui.showScreen('level');
  else if (shot === 'start') ui.showScreen('title');
  ui.update(state);
}
requestAnimationFrame(loop);
