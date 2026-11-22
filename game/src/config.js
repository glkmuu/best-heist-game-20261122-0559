// config.js — level data and tuning for "The Gilded Hour".
// Three original top-down heist levels. World is 960 x 600 units.
// walls: solid rects (block movement + sight). cover: solid rects that also
// block sight (crates, cases, pillars, plants). guards patrol waypoint loops.
// cameras sweep a vision cone from a fixed mount. lasers are tripwire beams
// (levels 2-3) that the player must sneak (crawl) under.

export const WORLD_W = 960;
export const WORLD_H = 600;

export const TUNE = {
  walkSpeed: 150,      // px per second, normal movement
  sneakSpeed: 78,      // Shift: slow + quiet + harder to spot
  runSpeed: 215,       // hold nothing extra: moving at full speed is loud
  runNoiseRadius: 170, // guards hear running inside this radius
  sneakNoiseRadius: 26,
  walkNoiseRadius: 70,
  playerRadius: 13,
  guardRadius: 14,
  detectBase: 55,      // detection points per second at point blank
  detectFalloff: 0.55, // detection scales down with distance
  alarmOnSpot: 26,     // alarm points per second while fully seen
  alarmDecay: 4,       // alarm falls while hidden
  alarmLaser: 34,      // alarm jump when a laser beam is tripped
  alarmCamera: 16,     // alarm per second while in a camera cone
  guardChaseSpeed: 132,
  guardSearchSpeed: 95,
  coinsPerLevel: 3,
  hintsPerLevel: 3,
  lives: 3,
};

export const LEVELS = [
  {
    name: 'Level 1 — The Gallery',
    sub: 'Two guards, one camera, slow patrols. Learn the cones.',
    par: 150,
    start: { x: 480, y: 540 },
    exit: { x: 52, y: 540, w: 44, h: 30 },
    walls: [
      { x: 0, y: 0, w: 960, h: 20 }, { x: 0, y: 580, w: 960, h: 20 },
      { x: 0, y: 0, w: 20, h: 600 }, { x: 940, y: 0, w: 20, h: 600 },
      { x: 300, y: 20, w: 20, h: 170 },
      { x: 640, y: 410, w: 20, h: 170 },
      { x: 420, y: 280, w: 220, h: 20 },
      { x: 120, y: 380, w: 160, h: 20 },
    ],
    cover: [
      { x: 90, y: 90, w: 64, h: 38, kind: 'case' },
      { x: 210, y: 90, w: 44, h: 44, kind: 'crate' },
      { x: 420, y: 90, w: 64, h: 38, kind: 'case' },
      { x: 560, y: 120, w: 44, h: 44, kind: 'crate' },
      { x: 760, y: 200, w: 28, h: 28, kind: 'pillar' },
      { x: 380, y: 200, w: 28, h: 28, kind: 'pillar' },
      { x: 150, y: 250, w: 24, h: 24, kind: 'plant' },
      { x: 700, y: 330, w: 64, h: 38, kind: 'case' },
      { x: 500, y: 420, w: 44, h: 44, kind: 'crate' },
      { x: 240, y: 470, w: 28, h: 28, kind: 'pillar' },
      { x: 830, y: 470, w: 24, h: 24, kind: 'plant' },
      { x: 330, y: 480, w: 64, h: 38, kind: 'case' },
    ],
    guards: [
      { x: 150, y: 120, waypoints: [[150, 120], [520, 120], [520, 240], [150, 240]], speed: 62, range: 210, fov: 0.62 },
      { x: 700, y: 470, waypoints: [[700, 470], [860, 470], [860, 240], [700, 240]], speed: 58, range: 200, fov: 0.62 },
    ],
    cameras: [
      { x: 480, y: 34, baseAngle: Math.PI / 2, sweep: 0.85, speed: 0.55, range: 250, fov: 0.42 },
    ],
    lasers: [],
    loot: [
      { x: 828, y: 110, kind: 'sapphire', label: 'Star Sapphire' },
      { x: 140, y: 500, kind: 'gold', label: 'Gold Bars' },
    ],
    dog: null,
  },
  {
    name: 'Level 2 — The Vault Floor',
    sub: 'Four guards, two cameras, laser tripwires. Crawl under the beams.',
    par: 180,
    start: { x: 480, y: 545 },
    exit: { x: 52, y: 60, w: 44, h: 30 },
    walls: [
      { x: 0, y: 0, w: 960, h: 20 }, { x: 0, y: 580, w: 960, h: 20 },
      { x: 0, y: 0, w: 20, h: 600 }, { x: 940, y: 0, w: 20, h: 600 },
      { x: 220, y: 20, w: 20, h: 150 },
      { x: 720, y: 430, w: 20, h: 150 },
      { x: 340, y: 200, w: 280, h: 20 },
      { x: 340, y: 400, w: 280, h: 20 },
      { x: 480, y: 220, w: 20, h: 180 },
      { x: 100, y: 300, w: 140, h: 20 },
    ],
    cover: [
      { x: 80, y: 80, w: 64, h: 38, kind: 'case' },
      { x: 300, y: 80, w: 44, h: 44, kind: 'crate' },
      { x: 620, y: 70, w: 64, h: 38, kind: 'case' },
      { x: 820, y: 90, w: 28, h: 28, kind: 'pillar' },
      { x: 120, y: 180, w: 44, h: 44, kind: 'crate' },
      { x: 560, y: 250, w: 28, h: 28, kind: 'pillar' },
      { x: 700, y: 250, w: 64, h: 38, kind: 'case' },
      { x: 250, y: 330, w: 24, h: 24, kind: 'plant' },
      { x: 820, y: 330, w: 44, h: 44, kind: 'crate' },
      { x: 120, y: 470, w: 64, h: 38, kind: 'case' },
      { x: 420, y: 480, w: 28, h: 28, kind: 'pillar' },
      { x: 660, y: 480, w: 64, h: 38, kind: 'case' },
      { x: 830, y: 500, w: 24, h: 24, kind: 'plant' },
    ],
    guards: [
      { x: 120, y: 120, waypoints: [[120, 120], [420, 120], [420, 170], [120, 170]], speed: 74, range: 215, fov: 0.62 },
      { x: 840, y: 120, waypoints: [[840, 120], [600, 120], [600, 170], [840, 170]], speed: 74, range: 215, fov: 0.62 },
      { x: 140, y: 460, waypoints: [[140, 460], [420, 460], [420, 500], [140, 500]], speed: 70, range: 210, fov: 0.62 },
      { x: 820, y: 460, waypoints: [[820, 460], [560, 460], [560, 500], [820, 500]], speed: 70, range: 210, fov: 0.62 },
    ],
    cameras: [
      { x: 320, y: 34, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.7, range: 250, fov: 0.42 },
      { x: 640, y: 566, baseAngle: -Math.PI / 2, sweep: 0.9, speed: 0.7, range: 250, fov: 0.42 },
    ],
    lasers: [
      { x1: 340, y1: 300, x2: 620, y2: 300, axis: 'h' },
      { x1: 700, y1: 120, x2: 700, y2: 300, axis: 'v' },
    ],
    loot: [
      { x: 480, y: 300, kind: 'vault', label: 'Vault Core' },
      { x: 120, y: 120, kind: 'sapphire', label: 'Star Sapphire' },
      { x: 850, y: 500, kind: 'gold', label: 'Gold Bars' },
    ],
    dog: null,
  },
  {
    name: 'Level 3 — The Penthouse',
    sub: 'Six guards, three cameras, lasers, and a dog that hears running.',
    par: 210,
    start: { x: 480, y: 545 },
    exit: { x: 890, y: 60, w: 44, h: 30 },
    walls: [
      { x: 0, y: 0, w: 960, h: 20 }, { x: 0, y: 580, w: 960, h: 20 },
      { x: 0, y: 0, w: 20, h: 600 }, { x: 940, y: 0, w: 20, h: 600 },
      { x: 260, y: 20, w: 20, h: 140 },
      { x: 680, y: 440, w: 20, h: 140 },
      { x: 360, y: 180, w: 240, h: 20 },
      { x: 360, y: 380, w: 240, h: 20 },
      { x: 120, y: 280, w: 180, h: 20 },
      { x: 660, y: 280, w: 180, h: 20 },
    ],
    cover: [
      { x: 80, y: 70, w: 64, h: 38, kind: 'case' },
      { x: 330, y: 70, w: 44, h: 44, kind: 'crate' },
      { x: 580, y: 70, w: 64, h: 38, kind: 'case' },
      { x: 800, y: 120, w: 28, h: 28, kind: 'pillar' },
      { x: 120, y: 160, w: 44, h: 44, kind: 'crate' },
      { x: 480, y: 230, w: 28, h: 28, kind: 'pillar' },
      { x: 700, y: 230, w: 64, h: 38, kind: 'case' },
      { x: 200, y: 330, w: 24, h: 24, kind: 'plant' },
      { x: 480, y: 330, w: 64, h: 38, kind: 'case' },
      { x: 830, y: 330, w: 44, h: 44, kind: 'crate' },
      { x: 120, y: 470, w: 64, h: 38, kind: 'case' },
      { x: 380, y: 480, w: 28, h: 28, kind: 'pillar' },
      { x: 580, y: 480, w: 64, h: 38, kind: 'case' },
      { x: 830, y: 500, w: 24, h: 24, kind: 'plant' },
    ],
    guards: [
      { x: 120, y: 110, waypoints: [[120, 110], [400, 110], [400, 150], [120, 150]], speed: 86, range: 225, fov: 0.62 },
      { x: 560, y: 110, waypoints: [[560, 110], [860, 110], [860, 150], [560, 150]], speed: 86, range: 225, fov: 0.62 },
      { x: 120, y: 240, waypoints: [[120, 240], [320, 240], [320, 260], [120, 260]], speed: 82, range: 220, fov: 0.62 },
      { x: 640, y: 240, waypoints: [[640, 240], [880, 240], [880, 260], [640, 260]], speed: 82, range: 220, fov: 0.62 },
      { x: 140, y: 460, waypoints: [[140, 460], [420, 460], [420, 520], [140, 520]], speed: 84, range: 220, fov: 0.62 },
      { x: 560, y: 460, waypoints: [[560, 460], [860, 460], [860, 520], [560, 520]], speed: 84, range: 220, fov: 0.62 },
    ],
    cameras: [
      { x: 480, y: 34, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.85, range: 260, fov: 0.42 },
      { x: 250, y: 566, baseAngle: -Math.PI / 2, sweep: 0.9, speed: 0.8, range: 250, fov: 0.42 },
      { x: 710, y: 566, baseAngle: -Math.PI / 2, sweep: 0.9, speed: 0.8, range: 250, fov: 0.42 },
    ],
    lasers: [
      { x1: 360, y1: 280, x2: 600, y2: 280, axis: 'h' },
      { x1: 360, y1: 480, x2: 600, y2: 480, axis: 'h' },
      { x1: 760, y1: 180, x2: 760, y2: 380, axis: 'v' },
    ],
    loot: [
      { x: 480, y: 130, kind: 'crown', label: 'Gilded Crown' },
      { x: 120, y: 500, kind: 'gold', label: 'Gold Bars' },
      { x: 850, y: 500, kind: 'sapphire', label: 'Star Sapphire' },
      { x: 480, y: 280, kind: 'vault', label: 'Vault Core' },
    ],
    dog: { x: 700, y: 520, waypoints: [[700, 520], [880, 520], [880, 460], [700, 460]], speed: 120, hearRadius: 190, range: 150, fov: 0.7 },
  },
];
