// guards.js — patrol, vision cone and the CALM -> SUSPICIOUS -> ALERTED brain.
// One job: guard AI. Nothing here draws anything.
import { TUNING } from './config.js';
import { lineOfSight, segmentHitsCircle, inShadow, inVent, angleDiff } from './world.js';

export function createGuards(def) {
  return def.guards.map((g, i) => {
    const start = g.waypoints[0];
    return {
      id: i,
      x: start[0],
      y: start[1],
      r: TUNING.guardRadius,
      waypoints: g.waypoints,
      wpIndex: 1 % g.waypoints.length,
      speed: g.speed,
      dog: !!g.dog,
      state: 'CALM', // CALM | SUSPICIOUS | ALERTED
      dir: 0,
      detect: 0, // 0..1 detection meter; 1 = spotted the Fox
      investigate: null, // { x, y } point to walk to and look around
      waitT: 0,
      lostT: 0,
      chaseT: 0,
      hearT: 0,
    };
  });
}

function guardSeesPlayer(guard, player, world, state) {
  if (player.dead) return { seen: false, rate: 0 };
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const d = Math.hypot(dx, dy);
  const range = guard.dog ? TUNING.guardConeRange * 0.9 : TUNING.guardConeRange;
  if (d > range) return { seen: false, rate: 0 };
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, guard.dir)) > TUNING.guardConeHalfAngle) {
    return { seen: false, rate: 0 };
  }
  if (!lineOfSight(world, guard.x, guard.y, player.x, player.y)) {
    return { seen: false, rate: 0 };
  }
  // Smoke blocks sight: a cloud between guard and player hides the Fox.
  for (const c of state.smokes) {
    if (segmentHitsCircle(guard.x, guard.y, player.x, player.y, c.x, c.y, c.r)) {
      return { seen: false, rate: 0 };
    }
  }
  // Inside a vent the Fox is out of every cone.
  if (inVent(world, player.x, player.y)) return { seen: false, rate: 0 };
  // Detection fills in ~2.5s at point blank, slower far away / sneaking / in shadow.
  let rate = 1 / TUNING.detectFillSeconds;
  rate *= 1 + (1 - d / range) * 1.0;
  if (player.mode === 'run') rate *= 1.6;
  else if (player.mode === 'sneak') rate *= 0.55;
  rate *= inShadow(world, player.x, player.y) ? 0.7 : 1.3;
  if (guard.dog && player.mode === 'run') rate *= 1.5; // the hound hears running
  return { seen: true, rate };
}

function walkToward(guard, tx, ty, speed, dt, world) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const d = Math.hypot(dx, dy);
  if (d < 4) return true;
  const step = Math.min(d, speed * dt);
  guard.dir = Math.atan2(dy, dx);
  guard.x += (dx / d) * step;
  guard.y += (dy / d) * step;
  return d - step < 4;
}

export function updateGuards(state, dt, world) {
  const player = state.player;
  for (const g of state.guards) {
    const see = guardSeesPlayer(g, player, world, state);

    if (see.seen) {
      g.detect = Math.min(1, g.detect + see.rate * dt);
      g.lastSeen = { x: player.x, y: player.y };
      g.lostT = 0;
      if (g.detect >= 1 && g.state !== 'ALERTED') {
        g.state = 'ALERTED';
        g.chaseT = 0;
        state.alarm = Math.min(100, state.alarm + TUNING.alarmOnSpotted);
        state.ghost = false;
        state.events.push({ type: 'spotted', guard: g.id });
      }
    } else {
      g.detect = Math.max(0, g.detect - dt * 0.45);
      g.lostT += dt;
    }

    // Hearing: running feet and coin clinks pull guards over to look.
    for (const n of state.noises) {
      const d = Math.hypot(n.x - g.x, n.y - g.y);
      if (d < n.radius && g.state === 'CALM') {
        g.state = 'SUSPICIOUS';
        g.investigate = { x: n.x, y: n.y };
        g.waitT = 0;
      }
    }

    if (g.state === 'CALM') {
      const wp = g.waypoints[g.wpIndex];
      if (walkToward(g, wp[0], wp[1], g.speed, dt, world)) {
        g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
      }
    } else if (g.state === 'SUSPICIOUS') {
      if (g.investigate) {
        const arrived = walkToward(g, g.investigate.x, g.investigate.y, g.speed * 1.15, dt, world);
        if (arrived) {
          g.waitT += dt;
          g.dir += dt * 1.8; // scan the room
          if (g.waitT > 2.2) {
            g.state = 'CALM';
            g.investigate = null;
            g.waitT = 0;
          }
        }
      } else {
        g.state = 'CALM';
      }
    } else if (g.state === 'ALERTED') {
      g.chaseT += dt;
      const target = see.seen ? { x: player.x, y: player.y } : g.lastSeen;
      if (target) walkToward(g, target.x, target.y, g.speed * 1.55, dt, world);
      if (see.seen) {
        state.alarm = Math.min(100, state.alarm + TUNING.alarmOnChase * dt);
      }
      // Lost the Fox for a while: fall back to searching the last seen spot.
      if (!see.seen && g.lostT > 2.5) {
        g.state = 'SUSPICIOUS';
        g.investigate = g.lastSeen ? { x: g.lastSeen.x, y: g.lastSeen.y } : { x: g.x, y: g.y };
        g.waitT = 0;
      }
      // Caught by touch.
      if (Math.hypot(player.x - g.x, player.y - g.y) < player.r + g.r - 2) {
        state.alarm = 100;
      }
    }
  }
}
