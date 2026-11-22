// cameras.js — sweeping security cameras and laser tripwires.
// One job: the museum's electronic eyes. Nothing here draws anything.
import { TUNING } from './config.js';
import { lineOfSight, segmentHitsCircle, inVent, distanceToSegment, angleDiff } from './world.js';

export function createCameras(def) {
  return def.cameras.map((c, i) => ({
    id: i,
    x: c.x,
    y: c.y,
    baseAngle: c.baseAngle,
    sweep: c.sweep,
    speed: c.speed,
    angle: c.baseAngle,
    phase: i * 1.7,
    spot: 0, // 0..1 camera spotting meter
    disabledUntil: 0,
  }));
}

export function createLasers(def) {
  return (def.lasers || []).map((l, i) => ({
    id: i,
    x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2,
    cooldown: 0,
    flash: 0,
  }));
}

function cameraSeesPlayer(cam, player, world, state) {
  if (player.dead) return false;
  const dx = player.x - cam.x;
  const dy = player.y - cam.y;
  const d = Math.hypot(dx, dy);
  if (d > TUNING.cameraConeRange) return false;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, cam.angle)) > TUNING.cameraConeHalfAngle) return false;
  if (!lineOfSight(world, cam.x, cam.y, player.x, player.y)) return false;
  for (const c of state.smokes) {
    if (segmentHitsCircle(cam.x, cam.y, player.x, player.y, c.x, c.y, c.r)) return false;
  }
  if (inVent(world, player.x, player.y)) return false;
  return true;
}

export function updateCameras(state, dt, world) {
  for (const cam of state.cameras) {
    cam.angle = cam.baseAngle + Math.sin(state.time * cam.speed + cam.phase) * cam.sweep;
    if (state.time < cam.disabledUntil) {
      cam.spot = 0;
      continue; // EMP: camera offline, grey cone, no spotting.
    }
    const sees = cameraSeesPlayer(cam, state.player, world, state);
    if (sees) {
      cam.spot = Math.min(1, cam.spot + dt * 0.55);
      if (cam.spot >= 1) {
        cam.spot = 0.35;
        state.alarm = Math.min(100, state.alarm + TUNING.alarmOnCameraSpot);
        state.ghost = false;
        state.events.push({ type: 'cameraSpot', camera: cam.id });
        // The nearest guard walks over to look.
        let best = null;
        let bestD = Infinity;
        for (const g of state.guards) {
          const d = Math.hypot(g.x - state.player.x, g.y - state.player.y);
          if (d < bestD) { bestD = d; best = g; }
        }
        if (best && best.state === 'CALM') {
          best.state = 'SUSPICIOUS';
          best.investigate = { x: state.player.x, y: state.player.y };
          best.waitT = 0;
        }
      }
    } else {
      cam.spot = Math.max(0, cam.spot - dt * 0.4);
    }
  }
}

// A laser trips when the Fox crosses its beam standing up.
// Sneaking crawls under it safely — the beam is drawn at ankle height.
export function updateLasers(state, dt, world) {
  for (const l of state.lasers) {
    l.cooldown = Math.max(0, l.cooldown - dt);
    l.flash = Math.max(0, l.flash - dt);
    const p = state.player;
    if (p.dead || p.mode === 'sneak') continue;
    if (l.cooldown > 0) continue;
    const d = distanceToSegment(p.x, p.y, l.x1, l.y1, l.x2, l.y2);
    if (d < p.r + 2) {
      l.cooldown = 1.2;
      l.flash = 0.6;
      state.alarm = Math.min(100, state.alarm + TUNING.alarmOnLaserTrip);
      state.ghost = false;
      state.events.push({ type: 'laserTrip', laser: l.id });
    }
  }
}
