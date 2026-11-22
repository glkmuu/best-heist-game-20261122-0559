// main.js — game loop and state machine for THE GILDED FOX.
// One job: wire every module together and own the screens.
import { VIEW_W, VIEW_H, TUNING, levelByIndex } from './config.js';
import { buildWorld } from './world.js';
import { createGuards, updateGuards } from './guards.js';
import { createCameras, createLasers, updateCameras, updateLasers } from './cameras.js';
import { createPlayer, updatePlayer } from './player.js';
import { throwCoin, dropSmoke, triggerEMP, updateTools } from './tools.js';
import { drawGame } from './render.js';
import {
  drawHUD, drawTitle, drawLevelComplete, drawGameComplete, drawGameOver,
  drawCaughtFlash, drawPaused,
} from './hud.js';
import { createInput } from './input.js';
import { sfx } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const g = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seed = parseInt(params.get('seed') || '1', 10) || 1;
const shot = params.get('shot');
const live = params.get('live') === '1';

const input = createInput();

function freshState(levelIndex) {
  const def = levelByIndex(levelIndex);
  return {
    screen: 'title', // title | play | levelComplete | gameComplete | gameOver
    levelIndex,
    levelDef: def,
    world: buildWorld(def),
    guards: createGuards(def),
    cameras: createCameras(def),
    lasers: createLasers(def),
    loot: def.loot.map((l) => ({ ...l, taken: false })),
    player: createPlayer(def),
    time: 0,
    levelTime: 0,
    score: 0,
    scoreAtLevelStart: 0,
    lives: TUNING.maxLives,
    alarm: 0,
    lootGot: 0,
    exitOpen: false,
    coins: 3,
    smokesLeft: 2,
    empsLeft: 1,
    hints: 3,
    hintT: 0,
    empUntil: 0,
    smokes: [],
    coinFx: [],
    noises: [],
    events: [],
    message: '',
    messageT: 0,
    ghost: true,
    ghostFloors: 0,
    totalLoot: 0,
    paused: false,
    caughtT: 0,
    levelResult: null,
    demo: false,
    seed,
  };
}

let state = freshState(0);

function startLevel(levelIndex, keepScore) {
  const score = keepScore ? state.score : 0;
  const lives = state.lives;
  const ghostFloors = state.ghostFloors;
  const totalLoot = state.totalLoot;
  state = freshState(levelIndex);
  state.score = score;
  state.scoreAtLevelStart = score;
  state.lives = lives;
  state.ghostFloors = ghostFloors;
  state.totalLoot = totalLoot;
  state.screen = 'play';
}

function restartLevelAfterCaught() {
  state.lives -= 1;
  if (state.lives <= 0) {
    state.screen = 'gameOver';
    sfx.caught();
    return;
  }
  const idx = state.levelIndex;
  const score = state.scoreAtLevelStart;
  const ghostFloors = state.ghostFloors;
  const totalLoot = state.totalLoot;
  const lives = state.lives;
  state = freshState(idx);
  state.score = score;
  state.scoreAtLevelStart = score;
  state.lives = lives;
  state.ghostFloors = ghostFloors;
  state.totalLoot = totalLoot;
  state.screen = 'play';
  state.message = 'CAUGHT — FLOOR RESET, ' + lives + (lives === 1 ? ' FOX' : ' FOXES') + ' LEFT';
  state.messageT = 2.5;
}

function finishLevel() {
  const timeBonus = Math.max(0, Math.round((state.levelDef.parSeconds - state.levelTime) * TUNING.timeBonusPerSecond));
  const ghostBonus = state.ghost ? TUNING.ghostBonus : 0;
  const lootScore = state.loot.reduce((s, l) => s + l.value, 0);
  const total = lootScore + timeBonus + ghostBonus;
  const stars = state.ghost && state.levelTime < state.levelDef.parSeconds ? 3
    : state.ghost || state.levelTime < state.levelDef.parSeconds * 1.3 ? 2 : 1;
  state.levelResult = { stars, lootScore, time: state.levelTime, timeBonus, ghostBonus, ghost: state.ghost, total };
  state.score += timeBonus + ghostBonus;
  if (state.ghost) state.ghostFloors += 1;
  state.totalLoot += state.loot.length;
  state.screen = 'levelComplete';
  sfx.win();
}

function handleEvents() {
  for (const ev of state.events) {
    if (ev.type === 'pickup') sfx.pickup();
    else if (ev.type === 'coin') sfx.coin();
    else if (ev.type === 'spotted' || ev.type === 'cameraSpot') sfx.alert();
    else if (ev.type === 'laserTrip') sfx.laser();
    else if (ev.type === 'smoke') sfx.smoke();
    else if (ev.type === 'emp') sfx.emp();
    else if (ev.type === 'denied') { sfx.denied(); state.message = ev.what; state.messageT = 1.6; }
    else if (ev.type === 'step') sfx.step();
    else if (ev.type === 'exitOpen') { state.message = 'EXIT OPEN — REACH THE GETAWAY VAN!'; state.messageT = 2.5; }
  }
  state.events.length = 0;
}

function update(dt) {
  if (state.demo) return; // frozen demo frame: time never advances, pixels are identical
  state.time += dt;
  if (state.caughtT > 0) {
    state.caughtT -= dt;
    if (state.caughtT <= 0) restartLevelAfterCaught();
    return;
  }
  if (state.screen !== 'play' || state.paused || state.demo) return;
  state.levelTime += dt;
  state.messageT = Math.max(0, state.messageT - dt);
  state.hintT = Math.max(0, state.hintT - dt);

  updatePlayer(state, dt, state.world, input);
  updateGuards(state, dt, state.world);
  updateCameras(state, dt, state.world);
  updateLasers(state, dt, state.world);
  updateTools(state, dt);

  // Alarm decays slowly while nobody sees the Fox.
  const anyoneSees = state.guards.some((gd) => gd.detect > 0.05)
    || state.cameras.some((c) => c.spot > 0.05);
  if (!anyoneSees && state.alarm > 0) {
    state.alarm = Math.max(0, state.alarm - TUNING.alarmDecayPerSecond * dt);
  }

  // Exit: reach the van once every loot is pocketed.
  if (state.exitOpen) {
    const e = state.world.exit;
    const p = state.player;
    if (Math.hypot(p.x - e.x, p.y - e.y) < 52) finishLevel();
  }

  // Alarm full = caught. Fair: the meter fills over seconds, never instantly.
  if (state.alarm >= 100) {
    state.alarm = 100;
    state.caughtT = 1.6;
    sfx.caught();
  }
  handleEvents();
}

function render() {
  g.clearRect(0, 0, VIEW_W, VIEW_H);
  if (state.screen === 'title') {
    // Title over a live view of floor 1 so the game shows through.
    drawGame(g, state);
    drawTitle(g, state);
    return;
  }
  drawGame(g, state);
  if (state.screen === 'play') {
    drawHUD(g, state);
    drawCaughtFlash(g, state);
    if (state.paused) drawPaused(g);
  } else if (state.screen === 'levelComplete') {
    drawLevelComplete(g, state);
  } else if (state.screen === 'gameComplete') {
    drawGameComplete(g, state);
  } else if (state.screen === 'gameOver') {
    drawGameOver(g, state);
  }
}

function onAction(code) {
  sfx.unlock();
  if (code === 'KeyM') {
    const m = sfx.toggleMute();
    state.message = m ? 'SOUND OFF' : 'SOUND ON';
    state.messageT = 1.2;
    return;
  }
  if (state.screen === 'title') {
    if (code === 'Enter' || code === 'Space') startLevel(0, false);
    return;
  }
  if (state.screen === 'levelComplete') {
    if (code === 'Enter' || code === 'Space') {
      if (state.levelIndex + 1 < 3) startLevel(state.levelIndex + 1, true);
      else state.screen = 'gameComplete';
    }
    return;
  }
  if (state.screen === 'gameComplete' || state.screen === 'gameOver') {
    if (code === 'Enter' || code === 'Space') {
      state.lives = TUNING.maxLives;
      state.ghostFloors = 0;
      state.totalLoot = 0;
      startLevel(0, false);
    }
    return;
  }
  // In play.
  if (code === 'KeyP') { state.paused = !state.paused; return; }
  if (state.paused) return;
  if (code === 'KeyR') { startLevel(state.levelIndex, true); state.score = state.scoreAtLevelStart; return; }
  if (code === 'KeyQ') throwCoin(state);
  else if (code === 'KeyF') dropSmoke(state);
  else if (code === 'KeyE') triggerEMP(state);
  else if (code === 'KeyH') {
    if (state.hints > 0) { state.hints -= 1; state.hintT = 3; }
    else { state.message = 'NO HINTS LEFT'; state.messageT = 1.4; }
  }
}

input.setKeyHandler(onAction);
canvas.addEventListener('click', () => {
  sfx.unlock();
  if (state.screen === 'title') startLevel(0, false);
  else if (state.screen === 'levelComplete') {
    if (state.levelIndex + 1 < 3) startLevel(state.levelIndex + 1, true);
    else state.screen = 'gameComplete';
  } else if (state.screen === 'gameComplete' || state.screen === 'gameOver') {
    state.lives = TUNING.maxLives;
    startLevel(0, false);
  }
});

// Demo screenshot states: frozen, deterministic, rendered by the real game.
if (shot) {
  applyShot(state, shot, seed);
  if (live) state.demo = false;
  if (shot === 'play' || shot === 'play2') state.screen = 'play';
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Test hook: the play-test reads live state through this, nothing else uses it.
window.__fox = {
  get state() { return state; },
  startLevel(i) { startLevel(i, false); },
  get screen() { return state.screen; },
};
