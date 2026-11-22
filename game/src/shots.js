// shots.js — deterministic demo states for the four screenshots.
// One job: compose a frozen, reproducible frame from the real game state.
// ?shot=start | play | play2 | end  (always with &seed=1 for screenshots)
import { TUNING, levelByIndex } from './config.js';
import { buildWorld } from './world.js';
import { createGuards } from './guards.js';
import { createCameras, createLasers } from './cameras.js';
import { createPlayer } from './player.js';

function baseLevelState(state, levelIndex, seed) {
  state.levelIndex = levelIndex;
  state.levelDef = levelByIndex(levelIndex);
  const def = state.levelDef;
  state.world = buildWorld(def);
  state.guards = createGuards(def);
  state.cameras = createCameras(def);
  state.lasers = createLasers(def);
  state.loot = def.loot.map((l) => ({ ...l, taken: false }));
  state.player = createPlayer(def);
  state.time = 47.3;
  state.levelTime = 47.3;
  state.alarm = 0;
  state.lootGot = 0;
  state.exitOpen = false;
  state.coins = 3;
  state.smokesLeft = 2;
  state.empsLeft = 1;
  state.smokes = [];
  state.coinFx = [];
  state.noises = [];
  state.hintT = 0;
  state.message = '';
  state.messageT = 0;
  state.ghost = true;
  state.demo = true; // frozen: the loop renders but never advances the world
  state.seed = seed;
}

function placeGuard(g, x, y, dirDeg, detect, guardState) {
  g.x = x;
  g.y = y;
  g.dir = (dirDeg * Math.PI) / 180;
  g.detect = detect;
  g.state = guardState;
  if (guardState === 'SUSPICIOUS') g.investigate = { x, y };
}

// Cover shot: the Fox BIG in the middle of a bright room, three red cones,
// one camera cone, the glowing Sunburst, alarm meter and patrol lines all in
// one frame. Positions are fixed constants, never simulated.
export function applyShot(state, shot, seed) {
  state.demo = true;
  if (shot === 'start') {
    state.screen = 'title';
    state.time = 2.0;
    return;
  }
  if (shot === 'play') {
    baseLevelState(state, 0, seed);
    state.screen = 'play';
    state.levelIndex = 0;
    state.score = 320;
    state.alarm = 34;
    // The Fox, big and orange, centre of the room, in the open.
    state.player.x = 640;
    state.player.y = 500;
    state.player.dirX = 0;
    state.player.dirY = -1;
    state.player.mode = 'walk';
    // Three guards mid-patrol, cones sweeping across the room.
    placeGuard(state.guards[0], 420, 300, 90, 0, 'CALM'); // cone down
    placeGuard(state.guards[1], 760, 620, -90, 0.55, 'SUSPICIOUS'); // cone up, half-seen
    placeGuard(state.guards[2], 1090, 430, 180, 0, 'CALM'); // cone left
    // Camera cone from the top wall.
    state.cameras[0].angle = Math.PI / 2 + 0.45;
    state.cameras[0].spot = 0.3;
    // A smoke cloud left of the Fox shows a tool in use.
    state.smokes = [{ x: 480, y: 470, r: TUNING.smokeRadius, t: 2.5 }];
    return;
  }
  if (shot === 'play2') {
    baseLevelState(state, 1, seed);
    state.screen = 'play';
    state.levelIndex = 1;
    state.score = 860;
    state.alarm = 52;
    state.lootGot = 1;
    state.loot[0].taken = true; // diamond already pocketed
    state.player.x = 640;
    state.player.y = 620;
    state.player.dirX = 0;
    state.player.dirY = -1;
    state.player.mode = 'sneak';
    placeGuard(state.guards[0], 420, 280, 90, 0, 'CALM');
    placeGuard(state.guards[1], 900, 600, -90, 0.7, 'SUSPICIOUS');
    state.cameras[0].angle = Math.PI / 2 - 0.5;
    state.cameras[1].angle = Math.PI / 2 + 0.5;
    state.cameras[1].spot = 0.45;
    state.lasers[0].flash = 0.4; // freshly tripped beam, mid-flash
    state.hintT = 0;
    state.message = 'LASER TRIPPED — ALARM RISING';
    state.messageT = 99;
    return;
  }
  if (shot === 'end') {
    baseLevelState(state, 0, seed);
    state.screen = 'levelComplete';
    state.levelIndex = 0;
    state.score = 1420;
    state.levelResult = {
      stars: 3,
      lootScore: 800,
      time: 47.3,
      timeBonus: 277,
      ghostBonus: 400,
      ghost: true,
      total: 1477,
    };
    return;
  }
  state.demo = false;
}
