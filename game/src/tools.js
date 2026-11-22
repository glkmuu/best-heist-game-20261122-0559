// tools.js — the Fox's kit: coin toss, smoke bomb and EMP, all with a cost.
// One job: tools. Nothing here draws anything.
import { TUNING } from './config.js';

export function throwCoin(state) {
  const p = state.player;
  if (state.coins <= 0) {
    state.events.push({ type: 'denied', what: 'NO COINS LEFT' });
    return false;
  }
  state.coins -= 1;
  const tx = p.x + p.dirX * TUNING.coinThrowDistance;
  const ty = p.y + p.dirY * TUNING.coinThrowDistance;
  const cx = Math.max(24, Math.min(1256, tx));
  const cy = Math.max(100, Math.min(776, ty));
  state.coinFx.push({ x: cx, y: cy, t: 0.9 });
  state.noises.push({ x: cx, y: cy, radius: TUNING.coinHearRadius, t: 0.6, kind: 'coin' });
  state.events.push({ type: 'coin', x: cx, y: cy });
  return true;
}

export function dropSmoke(state) {
  if (state.smokesLeft <= 0) {
    state.events.push({ type: 'denied', what: 'NO SMOKE LEFT' });
    return false;
  }
  if (state.score < TUNING.smokeCost) {
    state.events.push({ type: 'denied', what: 'NEED 150 PTS FOR SMOKE' });
    return false;
  }
  state.score -= TUNING.smokeCost;
  state.smokesLeft -= 1;
  const p = state.player;
  state.smokes.push({ x: p.x, y: p.y, r: TUNING.smokeRadius, t: TUNING.smokeSeconds });
  state.events.push({ type: 'smoke' });
  return true;
}

export function triggerEMP(state) {
  if (state.empsLeft <= 0) {
    state.events.push({ type: 'denied', what: 'NO EMP LEFT' });
    return false;
  }
  if (state.score < TUNING.empCost) {
    state.events.push({ type: 'denied', what: 'NEED 300 PTS FOR EMP' });
    return false;
  }
  state.score -= TUNING.empCost;
  state.empsLeft -= 1;
  state.empUntil = state.time + TUNING.empSeconds;
  for (const cam of state.cameras) cam.disabledUntil = state.empUntil;
  state.events.push({ type: 'emp' });
  return true;
}

// Decay smoke clouds, coin sparkles and one-shot noise events.
export function updateTools(state, dt) {
  for (const s of state.smokes) s.t -= dt;
  state.smokes = state.smokes.filter((s) => s.t > 0);
  for (const c of state.coinFx) c.t -= dt;
  state.coinFx = state.coinFx.filter((c) => c.t > 0);
  for (const n of state.noises) n.t -= dt;
  state.noises = state.noises.filter((n) => n.t > 0);
}
