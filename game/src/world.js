// world.js — map geometry: collision and real line-of-sight.
// Walls and cover are axis-aligned rects. A sight line is blocked if the
// segment between two points touches any wall or cover rect.

export function rectsCollide(ax, ay, r, rect) {
  return ax + r > rect.x && ax - r < rect.x + rect.w &&
    ay + r > rect.y && ay - r < rect.y + rect.h;
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// Move a circle (x,y,r) by (dx,dy), sliding along solid rects. Returns new pos.
export function moveWithCollision(x, y, r, dx, dy, solids) {
  let nx = x + dx;
  for (const s of solids) {
    if (rectsCollide(nx, y, r, s)) {
      nx = dx > 0 ? s.x - r : dx < 0 ? s.x + s.w + r : nx;
      if (rectsCollide(nx, y, r, s)) nx = x;
    }
  }
  let ny = y + dy;
  for (const s of solids) {
    if (rectsCollide(nx, ny, r, s)) {
      ny = dy > 0 ? s.y - r : dy < 0 ? s.y + s.h + r : ny;
      if (rectsCollide(nx, ny, r, s)) ny = y;
    }
  }
  return { x: nx, y: ny };
}

// Segment (x1,y1)-(x2,y2) vs rect: true when the segment touches the rect.
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) return true;
  const edges = [
    [rect.x, rect.y, rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
    [rect.x, rect.y + rect.h, rect.x, rect.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    if (segmentsIntersect(x1, y1, x2, y2, ax, ay, bx, by)) return true;
  }
  return false;
}

export function segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  const d2 = (x4 - x3) * (y2 - y3) - (y4 - y3) * (x2 - x3);
  const d3 = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
  const d4 = (x2 - x1) * (y4 - y1) - (y2 - y1) * (x4 - x1);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// True line of sight: no wall or cover rect between (x1,y1) and (x2,y2).
export function hasLineOfSight(x1, y1, x2, y2, blockers) {
  for (const b of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, b)) return false;
  }
  return true;
}

// Angle from (x1,y1) to (x2,y2), and angular difference wrapped to [-PI, PI].
export function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// Distance from point (px,py) to segment (x1,y1)-(x2,y2).
export function pointSegmentDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
