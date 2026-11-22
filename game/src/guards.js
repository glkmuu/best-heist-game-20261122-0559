// guards.js — guard patrol, vision cones, and AI states.
// States: calm (patrol waypoints) -> suspicious (walk to last seen spot,
// look around) -> alerted (chase the thief, alarm climbs). A guard only
// sees the thief when the thief is inside its cone AND line of sight is
// clear — walls and cover really block vision. Running is loud: guards
// investigate noise. The level-3 dog hears running from far away.

import { TUNE } from './config.js';
import { angleDiff, angleTo, clamp, dist, hasLineOfSight, moveWithCollision } from './world.js';

export function makeGuard(def) {
  return {
    kind: 'guard',
    x: def.x, y: def.y,
    waypoints: def.waypoints,
    wpIndex: 1,
    speed: def.speed,
    range: def.range,
    fov: def.fov,
    angle: angleTo(def.x, def.y, def.waypoints[1][0], def.waypoints[1][1]),
    state: 'calm',
    detection: 0,          // 0..100, per-guard suspicion of the thief
    lastSeen: null,        // {x,y} where the thief was last spotted
    lookTimer: 0,
    investigate: null,     // {x,y} noise / coin spot to check
    pauseTimer: 0,
    stuckTimer: 0,
  };
}

export function makeDog(def) {
  const g = makeGuard(def);
  g.kind = 'dog';
  g.hearRadius = def.hearRadius;
  g.speed = def.speed;
  return g;
}

// Can this guard see the player right now? Returns 0..1 visibility strength.
export function guardSeesPlayer(g, player, blockers) {
  const d = dist(g.x, g.y, player.x, player.y);
  if (d > g.range) return 0;
  const diff = Math.abs(angleDiff(angleTo(g.x, g.y, player.x, player.y), g.angle));
  if (diff > g.fov) return 0;
  if (!hasLineOfSight(g.x, g.y, player.x, player.y, blockers)) return 0;
  // Closer + running + standing in light = easier to spot. Sneaking shrinks it.
  let vis = 1 - (d / g.range) * TUNE.detectFalloff;
  if (player.sneaking) vis *= 0.45;
  if (player.running) vis *= 1.5;
  if (player.inLight) vis *= 1.3;
  return clamp(vis, 0.08, 1);
}

function walkToward(g, tx, ty, speed, dt, solids) {
  const d = dist(g.x, g.y, tx, ty);
  if (d < 4) return true;
  const step = Math.min(d, speed * dt);
  const nx = g.x + ((tx - g.x) / d) * step;
  const ny = g.y + ((ty - g.y) / d) * step;
  const pos = moveWithCollision(g.x, g.y, TUNE.guardRadius, nx - g.x, ny - g.y, solids);
  g.angle = angleTo(g.x, g.y, pos.x, pos.y);
  g.x = pos.x; g.y = pos.y;
  return dist(g.x, g.y, tx, ty) < 6;
}

export function updateGuard(g, dt, ctx) {
  const { player, solids, blockers, time } = ctx;
  const seen = guardSeesPlayer(g, player, blockers);
  if (seen > 0) {
    g.detection = clamp(g.detection + TUNE.detectBase * seen * dt, 0, 100);
    g.lastSeen = { x: player.x, y: player.y };
    if (g.detection >= 100) g.state = 'alerted';
    else if (g.detection >= 45) g.state = 'suspicious';
  } else {
    g.detection = clamp(g.detection - 14 * dt, 0, 100);
    if (g.state === 'alerted' && g.detection < 25) g.state = 'suspicious';
    else if (g.state === 'suspicious' && g.detection <= 0 && !g.investigate) g.state = 'calm';
  }

  // Hearing: running footsteps and coin clinks pull guards over.
  const pd = dist(g.x, g.y, player.x, player.y);
  const hearR = g.kind === 'dog' ? g.hearRadius : TUNE.runNoiseRadius;
  if (player.running && pd < hearR && g.state === 'calm') {
    g.investigate = { x: player.x, y: player.y };
    g.state = 'suspicious';
  }
  if (ctx.coinSpot && g.state !== 'alerted') {
    const cd = dist(g.x, g.y, ctx.coinSpot.x, ctx.coinSpot.y);
    if (cd < 320) { g.investigate = { x: ctx.coinSpot.x, y: ctx.coinSpot.y }; g.state = 'suspicious'; }
  }

  if (g.state === 'alerted') {
    // Chase the thief. Catching = alarm full (handled by main via alarm).
    walkToward(g, player.x, player.y, TUNE.guardChaseSpeed, dt, solids);
    if (pd < 26) ctx.onCaught && ctx.onCaught(g);
  } else if (g.state === 'suspicious') {
    const target = g.investigate || g.lastSeen;
    if (target) {
      const arrived = walkToward(g, target.x, target.y, TUNE.guardSearchSpeed, dt, solids);
      if (arrived) {
        g.investigate = null;
        g.lookTimer += dt;
        g.angle += Math.sin(time * 1.6) * 1.4 * dt; // scan the area
        if (g.lookTimer > 2.4) { g.lookTimer = 0; g.state = 'calm'; g.lastSeen = null; }
      }
    } else {
      g.state = 'calm';
    }
  } else {
    // Calm: patrol the waypoint loop, pausing briefly at each corner.
    if (g.pauseTimer > 0) {
      g.pauseTimer -= dt;
    } else {
      const [wx, wy] = g.waypoints[g.wpIndex];
      const arrived = walkToward(g, wx, wy, g.speed, dt, solids);
      if (arrived) {
        g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
        g.pauseTimer = 0.7;
      }
    }
  }
}
