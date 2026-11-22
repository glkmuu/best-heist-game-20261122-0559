// config.js — level data and tuning for THE GILDED FOX.
// One job: every number that defines the three museum floors lives here.
export const VIEW_W = 1280;
export const VIEW_H = 800;
export const HUD_H = 100;

export const TUNING = {
  walkSpeed: 155,
  sneakSpeed: 82,
  runSpeed: 238,
  playerRadius: 17,
  guardRadius: 15,
  guardConeRange: 178,
  guardConeHalfAngle: 0.56, // ~32 degrees each side
  cameraConeRange: 205,
  cameraConeHalfAngle: 0.42,
  detectFillSeconds: 2.5, // fair caught moment: ~2.5s of being seen
  alarmDecayPerSecond: 2.2,
  alarmOnSpotted: 22,
  alarmOnCameraSpot: 25,
  alarmOnLaserTrip: 15,
  alarmOnChase: 6,
  noiseRunRadius: 265,
  coinThrowDistance: 135,
  coinHearRadius: 330,
  smokeRadius: 96,
  smokeSeconds: 4,
  empSeconds: 6,
  smokeCost: 150,
  empCost: 300,
  ghostBonus: 400,
  timeBonusPerSecond: 10,
  maxLives: 3,
};

// A rect is { x, y, w, h }. Solids block movement AND line of sight.
export const LEVELS = [
  {
    name: 'THE MARBLE HALL',
    floor: 1,
    parSeconds: 75,
    intro: 'Slip past the night guards. Steal the SUNBURST DIAMOND.',
    walls: [
      { x: 300, y: 178, w: 220, h: 46, kind: 'case' },
      { x: 760, y: 178, w: 220, h: 46, kind: 'case' },
      { x: 300, y: 636, w: 220, h: 46, kind: 'case' },
      { x: 760, y: 636, w: 220, h: 46, kind: 'case' },
      { x: 596, y: 372, w: 88, h: 88, kind: 'pillar' },
      { x: 196, y: 500, w: 60, h: 60, kind: 'pillar' },
      { x: 1024, y: 500, w: 60, h: 60, kind: 'pillar' },
      { x: 116, y: 196, w: 38, h: 38, kind: 'plant' },
      { x: 1126, y: 196, w: 38, h: 38, kind: 'plant' },
      { x: 116, y: 700, w: 38, h: 38, kind: 'plant' },
      { x: 1126, y: 700, w: 38, h: 38, kind: 'plant' },
    ],
    shadows: [
      { x: 56, y: 300, w: 190, h: 130 },
      { x: 1034, y: 556, w: 190, h: 130 },
    ],
    vents: [
      { x: 36, y: 340, w: 62, h: 170, dir: 'down' },
      { x: 1182, y: 340, w: 62, h: 170, dir: 'down' },
    ],
    guards: [
      { waypoints: [[300, 300], [980, 300]], speed: 56 },
      { waypoints: [[180, 620], [180, 340], [700, 340], [700, 620]], speed: 56 },
      { waypoints: [[1110, 300], [1110, 620]], speed: 62 },
    ],
    cameras: [
      { x: 640, y: 122, baseAngle: Math.PI / 2, sweep: 0.85, speed: 0.55 },
    ],
    lasers: [],
    loot: [
      { x: 980, y: 430, kind: 'diamond', name: 'SUNBURST DIAMOND', value: 500 },
      { x: 300, y: 470, kind: 'idol', name: 'GOLD IDOL', value: 300 },
    ],
    exit: { x: 640, y: 762, w: 96, h: 26 },
    playerStart: { x: 110, y: 130 },
  },
  {
    name: 'THE VAULT FLOOR',
    floor: 2,
    parSeconds: 95,
    intro: 'Lasers guard the vault. Crawl under them — sneak, do not run.',
    walls: [
      { x: 220, y: 170, w: 260, h: 46, kind: 'case' },
      { x: 800, y: 170, w: 260, h: 46, kind: 'case' },
      { x: 220, y: 640, w: 260, h: 46, kind: 'case' },
      { x: 800, y: 640, w: 260, h: 46, kind: 'case' },
      { x: 596, y: 250, w: 88, h: 60, kind: 'shelf' },
      { x: 596, y: 520, w: 88, h: 60, kind: 'shelf' },
      { x: 150, y: 400, w: 60, h: 60, kind: 'pillar' },
      { x: 1070, y: 400, w: 60, h: 60, kind: 'pillar' },
      { x: 380, y: 400, w: 60, h: 60, kind: 'pillar' },
      { x: 840, y: 400, w: 60, h: 60, kind: 'pillar' },
      { x: 116, y: 196, w: 38, h: 38, kind: 'plant' },
      { x: 1126, y: 700, w: 38, h: 38, kind: 'plant' },
    ],
    shadows: [
      { x: 56, y: 560, w: 190, h: 130 },
      { x: 1034, y: 110, w: 190, h: 130 },
      { x: 545, y: 330, w: 190, h: 90 },
    ],
    vents: [
      { x: 36, y: 300, w: 62, h: 200, dir: 'down' },
      { x: 1182, y: 300, w: 62, h: 200, dir: 'down' },
      { x: 560, y: 740, w: 160, h: 40, dir: 'right' },
    ],
    guards: [
      { waypoints: [[260, 330], [1020, 330]], speed: 72 },
      { waypoints: [[260, 600], [1020, 600]], speed: 72 },
      { waypoints: [[260, 260], [260, 620]], speed: 78 },
      { waypoints: [[1150, 260], [1150, 620]], speed: 78 },
    ],
    cameras: [
      { x: 340, y: 122, baseAngle: Math.PI / 2, sweep: 0.7, speed: 0.7 },
      { x: 940, y: 122, baseAngle: Math.PI / 2, sweep: 0.7, speed: 0.7 },
    ],
    lasers: [
      { x1: 200, y1: 452, x2: 1080, y2: 452 },
      { x1: 700, y1: 200, x2: 700, y2: 372 },
    ],
    loot: [
      { x: 1000, y: 300, kind: 'diamond', name: 'SUNBURST DIAMOND', value: 500 },
      { x: 280, y: 600, kind: 'idol', name: 'GOLD IDOL', value: 300 },
      { x: 640, y: 160, kind: 'vase', name: 'JADE VASE', value: 200 },
    ],
    exit: { x: 640, y: 762, w: 96, h: 26 },
    playerStart: { x: 110, y: 130 },
  },
  {
    name: 'THE PENTHOUSE',
    floor: 3,
    parSeconds: 120,
    intro: 'Six guards, three cameras, and a hound that hears running.',
    walls: [
      { x: 200, y: 170, w: 200, h: 46, kind: 'case' },
      { x: 520, y: 170, w: 240, h: 46, kind: 'case' },
      { x: 880, y: 170, w: 200, h: 46, kind: 'case' },
      { x: 200, y: 640, w: 200, h: 46, kind: 'case' },
      { x: 520, y: 640, w: 240, h: 46, kind: 'case' },
      { x: 880, y: 640, w: 200, h: 46, kind: 'case' },
      { x: 300, y: 380, w: 70, h: 70, kind: 'pillar' },
      { x: 910, y: 380, w: 70, h: 70, kind: 'pillar' },
      { x: 600, y: 470, w: 80, h: 80, kind: 'shelf' },
      { x: 116, y: 196, w: 38, h: 38, kind: 'plant' },
      { x: 1126, y: 196, w: 38, h: 38, kind: 'plant' },
      { x: 116, y: 700, w: 38, h: 38, kind: 'plant' },
      { x: 1126, y: 700, w: 38, h: 38, kind: 'plant' },
    ],
    shadows: [
      { x: 56, y: 300, w: 180, h: 130 },
      { x: 1044, y: 300, w: 180, h: 130 },
      { x: 545, y: 560, w: 190, h: 110 },
    ],
    vents: [
      { x: 36, y: 300, w: 62, h: 200, dir: 'down' },
      { x: 1182, y: 300, w: 62, h: 200, dir: 'down' },
      { x: 560, y: 740, w: 160, h: 40, dir: 'right' },
    ],
    guards: [
      { waypoints: [[240, 280], [1040, 280]], speed: 88 },
      { waypoints: [[240, 580], [1040, 580]], speed: 88 },
      { waypoints: [[180, 260], [180, 620]], speed: 92 },
      { waypoints: [[1100, 260], [1100, 620]], speed: 92 },
      { waypoints: [[560, 300], [720, 300], [720, 440], [560, 440]], speed: 84 },
      { waypoints: [[420, 440], [860, 440]], speed: 118, dog: true },
    ],
    cameras: [
      { x: 300, y: 122, baseAngle: Math.PI / 2, sweep: 0.75, speed: 0.8 },
      { x: 640, y: 122, baseAngle: Math.PI / 2, sweep: 0.6, speed: 0.9 },
      { x: 980, y: 122, baseAngle: Math.PI / 2, sweep: 0.75, speed: 0.8 },
    ],
    lasers: [
      { x1: 180, y1: 452, x2: 1100, y2: 452 },
      { x1: 480, y1: 200, x2: 480, y2: 372 },
      { x1: 800, y1: 200, x2: 800, y2: 372 },
    ],
    loot: [
      { x: 1000, y: 300, kind: 'diamond', name: 'SUNBURST DIAMOND', value: 500 },
      { x: 280, y: 300, kind: 'idol', name: 'GOLD IDOL', value: 300 },
      { x: 280, y: 600, kind: 'vase', name: 'JADE VASE', value: 200 },
      { x: 1000, y: 600, kind: 'crown', name: 'MARLOWE CROWN', value: 400 },
    ],
    exit: { x: 640, y: 762, w: 96, h: 26 },
    playerStart: { x: 110, y: 130 },
  },
];

export function levelByIndex(i) {
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, i))];
}
