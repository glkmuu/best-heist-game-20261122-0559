// cameras.js — sweeping security cameras and laser tripwires.
// A camera sweeps its cone back and forth; standing in a lit cone raises
// the alarm. A laser beam trips the alarm when the thief crosses it upright;
// sneaking (crawling) passes underneath. Beams blink on a timer so timing
// a crossing matters.

import { angleDiff, angleTo, clamp, dist, hasLineOfSight, pointSegmentDist } from './world.js';

export function makeCamera(def) {
  return {
    x: def.x, y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    range: def.range,
    fov: def.fov,
    angle: def.baseAngle,
    phase: Math.random() * 6.28,
  };
}

export function updateCamera(cam, dt, time) {
  cam.angle = cam.baseAngle + Math.sin(time * cam.speed + cam.phase) * cam.sweep;
}

// 0..1: how strongly the camera sees the player (0 = unseen).
export function cameraSeesPlayer(cam, player, blockers) {
  const d = dist(cam.x, cam.y, player.x, player.y);
  if (d > cam.range) return 0;
  const diff = Math.abs(angleDiff(angleTo(cam.x, cam.y, player.x, player.y), cam.angle));
  if (diff > cam.fov) return 0;
  if (!hasLineOfSight(cam.x, cam.y, player.x, player.y, blockers)) return 0;
  let vis = 1 - (d / cam.range) * 0.5;
  if (player.sneaking) vis *= 0.4;
  return clamp(vis, 0.1, 1);
}

export function makeLaser(def) {
  return {
    x1: def.x1, y1: def.y1, x2: def.x2, y2: def.y2,
    axis: def.axis,
    tripped: false,
    cooldown: 0,
  };
}

// Lasers blink: on for 2.2s, off for 1.1s. Returns true while the beam is live.
export function laserIsLive(laser, time) {
  return (time % 3.3) < 2.2;
}

// True when the player crosses a live beam upright (not sneaking).
export function laserTripsPlayer(laser, player, time) {
  if (!laserIsLive(laser, time)) return false;
  if (player.sneaking) return false; // crawl under the beam
  const d = pointSegmentDist(player.x, player.y, laser.x1, laser.y1, laser.x2, laser.y2);
  return d < 12;
}
