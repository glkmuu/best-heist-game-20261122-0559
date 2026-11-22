// player.js — the Gilded Fox: movement, sneak/run, noise and loot pickup.
// One job: the thief. Nothing here draws anything.
import { TUNING } from './config.js';
import { moveCircle, inVent } from './world.js';

export function createPlayer(def) {
  return {
    x: def.playerStart.x,
    y: def.playerStart.y,
    r: TUNING.playerRadius,
    dirX: 0,
    dirY: 1,
    mode: 'walk', // walk | sneak | run
    moving: false,
    dead: false,
    stepT: 0,
  };
}

export function updatePlayer(state, dt, world, input) {
  const p = state.player;
  if (p.dead) return;

  const ax = input.axisX();
  const ay = input.axisY();
  const len = Math.hypot(ax, ay);
  p.moving = len > 0;

  let mode = 'walk';
  if (input.sneak()) mode = 'sneak';
  else if (input.run()) mode = 'run';
  if (inVent(world, p.x, p.y)) mode = 'sneak'; // vents are a slow crawl
  p.mode = mode;

  const speed = mode === 'sneak' ? TUNING.sneakSpeed
    : mode === 'run' ? TUNING.runSpeed : TUNING.walkSpeed;
  if (len > 0) {
    const nx = ax / len;
    const ny = ay / len;
    p.dirX = nx;
    p.dirY = ny;
    moveCircle(world, p, nx * speed * dt, ny * speed * dt);
  }

  // Running is loud: a noise ring guards can hear.
  if (mode === 'run' && p.moving) {
    state.noises.push({ x: p.x, y: p.y, radius: TUNING.noiseRunRadius, t: 0.25, kind: 'steps' });
    p.stepT -= dt;
    if (p.stepT <= 0) {
      p.stepT = 0.28;
      state.events.push({ type: 'step' });
    }
  }

  // Loot auto-pickup on touch — no button, so it can never misfire.
  for (const loot of state.loot) {
    if (loot.taken) continue;
    if (Math.hypot(loot.x - p.x, loot.y - p.y) < p.r + 22) {
      loot.taken = true;
      state.score += loot.value;
      state.lootGot += 1;
      state.events.push({ type: 'pickup', loot });
      if (state.lootGot === state.loot.length) {
        state.exitOpen = true;
        state.events.push({ type: 'exitOpen' });
      }
    }
  }
}
