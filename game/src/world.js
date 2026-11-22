// world.js — the three floors of THE SCARLET VAULT and the geometry the
// guards, cameras and lasers all share: walls block movement and sight,
// felt tables block movement only, carpet and shadow zones are floor paint.

import { PLAY } from './config.js';

// ---- geometry helpers -------------------------------------------------
export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}
export function circleHitsRect(cx, cy, rad, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < rad * rad;
}
function segHitsRect(x1, y1, x2, y2, r) {
  // segment vs axis-aligned rect: test the 4 edges + containment.
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y], [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h], [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    const d = (x2 - x1) * (by - ay) - (y2 - y1) * (bx - ax);
    if (Math.abs(d) < 1e-9) continue;
    const t = ((ax - x1) * (by - ay) - (ay - y1) * (bx - ax)) / d;
    const u = ((ax - x1) * (y2 - y1) - (ay - y1) * (x2 - x1)) / d;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}
export function losClear(x1, y1, x2, y2, walls) {
  for (const w of walls) if (segHitsRect(x1, y1, x2, y2, w)) return false;
  return true;
}
export function moveCircle(x, y, dx, dy, rad, solids) {
  // Axis-separated slide so the thief glides along walls instead of sticking.
  let nx = x + dx;
  for (const s of solids) if (circleHitsRect(nx, y, rad, s)) { nx = x; break; }
  let ny = y + dy;
  for (const s of solids) if (circleHitsRect(nx, ny, rad, s)) { ny = y; break; }
  nx = Math.max(PLAY.x + rad + 8, Math.min(PLAY.x + PLAY.w - rad - 8, nx));
  ny = Math.max(PLAY.y + rad + 8, Math.min(PLAY.y + PLAY.h - rad - 8, ny));
  return { x: nx, y: ny };
}

// ---- shared shell -----------------------------------------------------
function borderWalls() {
  const t = 14;
  return [
    { x: 0, y: PLAY.y, w: PLAY.w, h: t },
    { x: 0, y: PLAY.y + PLAY.h - t, w: PLAY.w, h: t },
    { x: 0, y: PLAY.y, w: t, h: PLAY.h },
    { x: PLAY.w - t, y: PLAY.y, w: t, h: PLAY.h },
  ];
}

// ---- the floors -------------------------------------------------------
// All coordinates are absolute canvas pixels (HUD occupies y < 84).
export const FLOORS = [
  {
    name: 'CASINO FLOOR', lootNeeded: 3,
    intro: 'Lift the GOLD BARS, the CHIP STACK and the DIAMOND — then reach the GETAWAY VAN.',
    walls: [
      ...borderWalls(),
      { x: 300, y: 300, w: 16, h: 180 },
      { x: 640, y: 150, w: 16, h: 150 },
      { x: 900, y: 420, w: 16, h: 180 },
    ],
    tables: [
      { x: 150, y: 180, w: 150, h: 90, label: 'ROULETTE' },
      { x: 420, y: 480, w: 170, h: 96, label: 'BLACKJACK' },
      { x: 760, y: 170, w: 150, h: 90, label: 'POKER' },
      { x: 1010, y: 480, w: 150, h: 96, label: 'BACCARAT' },
    ],
    carpets: [
      { x: 0, y: 380, w: 1280, h: 64 },
      { x: 0, y: 640, w: 1280, h: 40 },
    ],
    shadows: [
      { x: 330, y: 520, w: 150, h: 90 },
      { x: 960, y: 170, w: 130, h: 90 },
    ],
    vents: [{ x: 30, y: 430, w: 62, h: 46 }],
    loot: [
      { x: 225, y: 330, kind: 'bars', label: 'GOLD BARS' },
      { x: 505, y: 625, kind: 'chips', label: 'CHIP STACK' },
      { x: 1200, y: 150, kind: 'diamond', label: 'DIAMOND' },
    ],
    guards: [
      { wp: [[380, 220], [560, 220], [560, 380], [380, 380]], speed: 62 },
      { wp: [[700, 560], [880, 560], [880, 660], [700, 660]], speed: 62 },
      { wp: [[150, 560], [150, 700], [300, 700], [300, 560]], speed: 56 },
      { wp: [[1000, 300], [1150, 300], [1150, 420], [1000, 420]], speed: 66 },
    ],
    cameras: [
      { x: 640, y: 100, base: Math.PI / 2, sweep: 0.9 },
      { x: 1200, y: 620, base: Math.PI, sweep: 0.8 },
    ],
    lasers: [
      { x1: 1060, y1: 150, x2: 1060, y2: 330, label: 'VAULT LASER' },
    ],
    exit: { x: 1196, y: 700, w: 70, h: 86 },
    van: { x: 1090, y: 706, w: 96, h: 62 },
    start: { x: 90, y: 720 },
  },
  {
    name: 'VAULT FLOOR', lootNeeded: 4,
    intro: 'The vault is wired: LASERS guard the gold. EMP kills cameras, smoke kills sight.',
    walls: [
      ...borderWalls(),
      { x: 260, y: 180, w: 16, h: 220 },
      { x: 620, y: 480, w: 16, h: 200 },
      { x: 940, y: 180, w: 16, h: 220 },
      { x: 420, y: 380, w: 220, h: 16 },
    ],
    tables: [
      { x: 120, y: 200, w: 120, h: 220, label: 'SAFE ROW' },
      { x: 1060, y: 480, w: 130, h: 200, label: 'SAFE ROW' },
    ],
    carpets: [{ x: 0, y: 430, w: 1280, h: 56 }],
    shadows: [
      { x: 300, y: 560, w: 150, h: 90 },
      { x: 700, y: 150, w: 150, h: 90 },
    ],
    vents: [{ x: 30, y: 200, w: 62, h: 46 }],
    loot: [
      { x: 180, y: 480, kind: 'bars', label: 'GOLD BARS' },
      { x: 500, y: 220, kind: 'bars', label: 'GOLD BARS' },
      { x: 830, y: 640, kind: 'chips', label: 'CHIP STACK' },
      { x: 1130, y: 300, kind: 'diamond', label: 'VAULT DIAMOND' },
    ],
    guards: [
      { wp: [[340, 180], [560, 180], [560, 340], [340, 340]], speed: 68 },
      { wp: [[700, 600], [900, 600], [900, 700], [700, 700]], speed: 68 },
      { wp: [[100, y0(560)], [220, 560], [220, 700], [100, 700]], speed: 60 },
      { wp: [[980, 480], [1140, 480], [1140, 640], [980, 640]], speed: 70 },
      { wp: [[480, 520], [580, 520], [580, 660], [480, 660]], speed: 64 },
    ],
    cameras: [
      { x: 640, y: 100, base: Math.PI / 2, sweep: 1.0 },
      { x: 60, y: 430, base: 0, sweep: 0.9 },
      { x: 1220, y: 430, base: Math.PI, sweep: 0.9 },
    ],
    lasers: [
      { x1: 420, y1: 150, x2: 700, y2: 150, label: 'LASER' },
      { x1: 820, y1: 470, x2: 820, y2: 700, label: 'LASER' },
      { x1: 1060, y1: 150, x2: 1060, y2: 400, label: 'LASER' },
    ],
    exit: { x: 1196, y: 700, w: 70, h: 86 },
    van: { x: 1090, y: 706, w: 96, h: 62 },
    start: { x: 90, y: 720 },
  },
  {
    name: 'PENTHOUSE', lootNeeded: 4,
    intro: 'Top floor. A GUARD DOG hears running feet — SNEAK past it. The big score is here.',
    walls: [
      ...borderWalls(),
      { x: 330, y: 200, w: 16, h: 200 },
      { x: 700, y: 480, w: 16, h: 200 },
      { x: 980, y: 200, w: 16, h: 180 },
    ],
    tables: [
      { x: 180, y: 160, w: 170, h: 96, label: 'PENTHOUSE BAR' },
      { x: 760, y: 620, w: 170, h: 96, label: 'PENTHOUSE BAR' },
      { x: 1080, y: 160, w: 140, h: 200, label: 'SAFE' },
    ],
    carpets: [
      { x: 0, y: 380, w: 1280, h: 64 },
      { x: 420, y: 84, w: 60, h: 716 },
    ],
    shadows: [
      { x: 380, y: 560, w: 150, h: 90 },
      { x: 1020, y: 500, w: 130, h: 90 },
    ],
    vents: [{ x: 30, y: 620, w: 62, h: 46 }],
    loot: [
      { x: 265, y: 330, kind: 'bars', label: 'GOLD BARS' },
      { x: 560, y: 640, kind: 'chips', label: 'CHIP STACK' },
      { x: 900, y: 240, kind: 'diamond', label: 'PENTHOUSE DIAMOND' },
      { x: 1150, y: 430, kind: 'bars', label: 'GOLD BARS' },
    ],
    guards: [
      { wp: [[420, 220], [620, 220], [620, 380], [420, 380]], speed: 72 },
      { wp: [[760, 560], [960, 560], [960, 680], [760, 680]], speed: 72 },
      { wp: [[120, y0(480)], [260, 480], [260, 640], [120, 640]], speed: 64 },
      { wp: [[1040, 420], [1180, 420], [1180, 580], [1040, 580]], speed: 74 },
      { wp: [[500, 480], [640, 480], [640, 620], [500, 620]], speed: 68 },
    ],
    cameras: [
      { x: 640, y: 100, base: Math.PI / 2, sweep: 1.0 },
      { x: 60, y: 430, base: 0, sweep: 0.9 },
      { x: 1220, y: 640, base: Math.PI, sweep: 0.9 },
    ],
    lasers: [
      { x1: 480, y1: 150, x2: 760, y2: 150, label: 'LASER' },
      { x1: 900, y1: 470, x2: 900, y2: 700, label: 'LASER' },
    ],
    dog: { wp: [[640, 430], [860, 430], [860, 560], [640, 560]], speed: 96 },
    exit: { x: 1196, y: 700, w: 70, h: 86 },
    van: { x: 1090, y: 706, w: 96, h: 62 },
    start: { x: 90, y: 720 },
  },
];

function y0(v) { return v; } // waypoints are already absolute canvas pixels.
