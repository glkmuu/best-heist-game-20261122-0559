// shots.js — deterministic demo states for screenshots (?shot= + &seed=).
// These are a dev affordance inside the game itself: each shot stages a real
// game state (title, mid-play, level 2 with lasers, level complete) so the
// screenshots are true renders of the game's own code, reproducible by seed.

import { LEVELS } from './config.js';

// Tiny seeded PRNG so shot layouts are identical every run.
export function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function applyShot(state, shot, seed) {
  const rnd = seededRandom(seed || 1);
  if (shot === 'start') {
    state.screen = 'title';
    return;
  }
  if (shot === 'play') {
    // Cover: level 1, thief mid-room behind a display case, guard cones
    // sweeping nearby, a camera cone, glowing loot, alarm part-filled.
    state.screen = 'playing';
    state.levelIndex = 0;
    state.loadLevel(0);
    const p = state.player;
    p.x = 470; p.y = 340; p.sneaking = true; p.faceX = 0.6; p.faceY = -0.8;
    state.guards[0].x = 420; state.guards[0].y = 150;
    state.guards[0].angle = 1.1;
    state.guards[1].x = 700; state.guards[1].y = 400;
    state.guards[1].angle = -2.2;
    state.guards[1].state = 'suspicious';
    state.guards[1].detection = 52;
    state.guards[0].detection = 30;
    state.cameras[0].angle = 1.35;
    state.alarm = 34;
    state.maxDetection = 52;
    state.lootGot = 1;
    state.level.loot[0].taken = true;
    state.time = 42;
    state.score = 350;
    state.banner = 'Stay low — the guard by the vault is suspicious.';
    return;
  }
  if (shot === 'play2') {
    // Level 2: laser beams live, two guards, a camera, thief crawling.
    state.screen = 'playing';
    state.levelIndex = 1;
    state.loadLevel(1);
    const p = state.player;
    p.x = 470; p.y = 330; p.sneaking = true; p.faceX = 0; p.faceY = -1;
    state.guards[0].x = 300; state.guards[0].y = 130; state.guards[0].angle = 0.9;
    state.guards[1].x = 660; state.guards[1].y = 130; state.guards[1].angle = 2.2;
    state.guards[2].x = 300; state.guards[2].y = 470; state.guards[2].angle = -0.6;
    state.guards[3].x = 660; state.guards[3].y = 470; state.guards[3].angle = 3.4;
    state.cameras[0].angle = 1.2;
    state.cameras[1].angle = -1.2;
    state.alarm = 58;
    state.maxDetection = 70;
    state.lootGot = 1;
    state.level.loot[0].taken = true;
    state.time = 96;
    state.score = 900;
    state.banner = 'Lasers live! Crawl (Shift) under the red beams.';
    return;
  }
  if (shot === 'end') {
    state.screen = 'leveldone';
    state.levelIndex = 0;
    state.loadLevel(0);
    state.lootGot = state.level.loot.length;
    for (const l of state.level.loot) l.taken = true;
    state.time = 118;
    state.score = 1450;
    state.ui.showLevelComplete(0, {
      stars: 3, time: 118, par: LEVELS[0].par,
      timeBonus: 320, ghostBonus: 500, lootBonus: 400, levelScore: 1450,
    });
    return;
  }
  void rnd;
}
