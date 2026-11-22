// config.js — every tunable number for THE SCARLET VAULT in one place.
// Palette: bright ivory casino floor, crimson carpet, gold trim, emerald felt.
// The look must read at 768x480, so shapes are big and colours are few.

export const VIEW = { W: 1280, H: 800, HUD: 84 };
export const PLAY = { x: 0, y: VIEW.HUD, w: 1280, h: 716 };

export const PALETTE = {
  ivory: '#f5eeda', ivoryDark: '#e9dfc2', crimson: '#a3122e', crimsonDark: '#7c0d22',
  gold: '#c9a227', goldBright: '#f2d060', emerald: '#0e6b4a', emeraldDark: '#084a33',
  ink: '#221408', wall: '#5b2333', wallTop: '#7a2f45', shadow: '#3a2a4d',
  cone: 'rgba(255, 214, 64, 0.34)', coneEdge: 'rgba(255, 214, 64, 0.85)',
  camCone: 'rgba(255, 80, 80, 0.30)', camEdge: 'rgba(255, 60, 60, 0.85)',
  laser: '#ff2d55', loot: '#ffd94a', smoke: 'rgba(220, 220, 220, 0.55)',
};

export const TOOLS = {
  coin:     { key: 'KeyQ', label: 'Q COIN',     cost: 0,   note: 'FREE — toss to distract' },
  smoke:    { key: 'KeyF', label: 'F SMOKE',    cost: 150, note: '150 — blocks vision 6s' },
  emp:      { key: 'KeyE', label: 'E EMP',      cost: 300, note: '300 — cameras OFF 8s' },
  disguise: { key: 'KeyG', label: 'G DISGUISE', cost: 250, note: '250 — ignored 8s' },
};

export const TUNING = {
  runSpeed: 205, sneakSpeed: 105, playerRadius: 19,
  guardSpeed: 62, guardChaseSpeed: 132, guardConeRange: 185, guardConeHalf: 0.62,
  camRange: 215, camHalf: 0.5, camSweepSpeed: 0.55,
  // Detection: ~2.5 s of full exposure fills suspicion; sneak halves the rate.
  detectRate: 0.42, sneakDetectRate: 0.20, decayRate: 0.55,
  alarmPerSpot: 34, laserAlarm: 18, alarmDecay: 1.6,
  dogHearRange: 230, dogConeRange: 150,
  lootScore: 500, floorBonus: 400, ghostBonus: 1000, timeBonusPerSec: 6,
  smokeSecs: 6, empSecs: 8, disguiseSecs: 8, coinLureSecs: 5,
};

export const FLOOR_NAMES = ['CASINO FLOOR', 'VAULT FLOOR', 'PENTHOUSE'];
export const GAME_TITLE = 'THE SCARLET VAULT';
export const GAME_SUBTITLE = 'a casino heist in three floors';
