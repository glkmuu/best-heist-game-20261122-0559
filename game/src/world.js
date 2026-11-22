// world.js — the museum floor: walls, cover, line of sight, shadow and vents.
// One job: geometry. Nothing here knows about guards, cameras or the player.
import { VIEW_W, VIEW_H, HUD_H } from './config.js';

export const PLAY = { x: 8, y: HUD_H + 8, w: VIEW_W - 16, h: VIEW_H - HUD_H - 16 };

export function buildWorld(def) {
  return {
    def,
    solids: def.walls.slice(),
    shadows: (def.shadows || []).slice(),
    vents: (def.vents || []).slice(),
    exit: def.exit,
  };
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// Push a circle out of every solid it overlaps. Returns true when it moved.
export function resolveCircle(world, ent) {
  let moved = false;
  for (const s of world.solids) {
    if (!circleHitsRect(ent.x, ent.y, ent.r, s)) continue;
    const nx = Math.max(s.x, Math.min(ent.x, s.x + s.w));
    const ny = Math.max(s.y, Math.min(ent.y, s.y + s.h));
    let dx = ent.x - nx;
    let dy = ent.y - ny;
    let d = Math.hypot(dx, dy);
    if (d < 0.001) {
      // Centre inside the rect: push out along the smallest penetration axis.
      const left = ent.x - s.x;
      const right = s.x + s.w - ent.x;
      const top = ent.y - s.y;
      const bottom = s.y + s.h - ent.y;
      const m = Math.min(left, right, top, bottom);
      if (m === left) { ent.x = s.x - ent.r; }
      else if (m === right) { ent.x = s.x + s.w + ent.r; }
      else if (m === top) { ent.y = s.y - ent.r; }
      else { ent.y = s.y + s.h + ent.r; }
    } else {
      dx /= d; dy /= d;
      ent.x = nx + dx * ent.r;
      ent.y = ny + dy * ent.r;
    }
    moved = true;
  }
  const p = PLAY;
  if (ent.x < p.x + ent.r) { ent.x = p.x + ent.r; moved = true; }
  if (ent.x > p.x + p.w - ent.r) { ent.x = p.x + p.w - ent.r; moved = true; }
  if (ent.y < p.y + ent.r) { ent.y = p.y + ent.r; moved = true; }
  if (ent.y > p.y + p.h - ent.r) { ent.y = p.y + p.h - ent.r; moved = true; }
  return moved;
}

// Move a circle with axis separation so it slides along walls.
export function moveCircle(world, ent, dx, dy) {
  ent.x += dx;
  resolveCircle(world, ent);
  ent.y += dy;
  resolveCircle(world, ent);
}

// Liang-Barsky: does segment (x1,y1)-(x2,y2) cross rect r?
export function segmentHitsRect(x1, y1, x2, y2, r) {
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

// True when nothing solid stands between the two points.
export function lineOfSight(world, x1, y1, x2, y2) {
  for (const s of world.solids) {
    if (segmentHitsRect(x1, y1, x2, y2, s)) return false;
  }
  return true;
}

// Does segment (x1,y1)-(x2,y2) pass through circle (cx,cy,r)?
export function segmentHitsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  const ddx = px - cx;
  const ddy = py - cy;
  return ddx * ddx + ddy * ddy < r * r;
}

export function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const qx = x1 + t * dx;
  const qy = y1 + t * dy;
  return Math.hypot(px - qx, py - qy);
}

export function inShadow(world, x, y) {
  for (const s of world.shadows) if (pointInRect(x, y, s)) return true;
  return false;
}

export function inVent(world, x, y) {
  for (const v of world.vents) if (pointInRect(x, y, v)) return true;
  return false;
}

// Deterministic PRNG so a seed always rebuilds the same floor dressing.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
