// render.js — everything the eye sees: gilded art-deco floor, cones, the Fox.
// One job: draw the world. No game logic lives here.
import { VIEW_W, VIEW_H, HUD_H, TUNING } from './config.js';
import { PLAY, mulberry32 } from './world.js';

const CREAM = '#f3e9cf';
const CREAM_DARK = '#e6d7b4';
const TEAL = '#0f3d3e';
const TEAL_WALL = '#14524f';
const GOLD = '#d9a521';
const GOLD_BRIGHT = '#ffd34d';
const ORANGE = '#ff7a1a';
const RED = '#e63946';
const INK = '#1d2b2b';

let floorCache = null;
let floorKey = '';

function buildFloor(levelDef, seed) {
  const key = levelDef.name + ':' + seed;
  if (floorCache && floorKey === key) return floorCache;
  const c = document.createElement('canvas');
  c.width = VIEW_W;
  c.height = VIEW_H;
  const g = c.getContext('2d');
  // Cream marble floor.
  g.fillStyle = CREAM;
  g.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  // Subtle marble veining.
  const rng = mulberry32(seed * 7919 + 13);
  g.strokeStyle = 'rgba(180,150,90,0.16)';
  g.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    g.beginPath();
    let x = rng() * VIEW_W;
    let y = HUD_H + rng() * (VIEW_H - HUD_H);
    g.moveTo(x, y);
    for (let s = 0; s < 5; s++) {
      x += (rng() - 0.5) * 260;
      y += (rng() - 0.5) * 120;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  // Art-deco diamond lattice, faint gold.
  g.strokeStyle = 'rgba(217,165,33,0.20)';
  g.lineWidth = 1.5;
  const step = 96;
  for (let y = HUD_H + step / 2; y < VIEW_H; y += step) {
    for (let x = step / 2; x < VIEW_W; x += step) {
      g.beginPath();
      g.moveTo(x, y - 9); g.lineTo(x + 9, y); g.lineTo(x, y + 9); g.lineTo(x - 9, y);
      g.closePath();
      g.stroke();
    }
  }
  // Gold border around the playfield.
  g.strokeStyle = GOLD;
  g.lineWidth = 4;
  g.strokeRect(PLAY.x - 2, PLAY.y - 2, PLAY.w + 4, PLAY.h + 4);
  floorCache = c;
  floorKey = key;
  return c;
}

function drawCone(g, x, y, angle, range, halfAngle, fill, edge) {
  g.beginPath();
  g.moveTo(x, y);
  g.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = edge;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + Math.cos(angle - halfAngle) * range, y + Math.sin(angle - halfAngle) * range);
  g.moveTo(x, y);
  g.lineTo(x + Math.cos(angle + halfAngle) * range, y + Math.sin(angle + halfAngle) * range);
  g.stroke();
}

function drawShadowZones(g, world) {
  for (const s of world.shadows) {
    g.fillStyle = 'rgba(15,61,62,0.20)';
    g.fillRect(s.x, s.y, s.w, s.h);
    g.strokeStyle = 'rgba(15,61,62,0.45)';
    g.setLineDash([6, 5]);
    g.lineWidth = 1.5;
    g.strokeRect(s.x, s.y, s.w, s.h);
    g.setLineDash([]);
    g.fillStyle = 'rgba(15,61,62,0.75)';
    g.font = 'bold 12px Georgia, serif';
    g.textAlign = 'center';
    g.fillText('S H A D O W', s.x + s.w / 2, s.y + s.h / 2 + 4);
  }
}

function drawVents(g, world) {
  for (const v of world.vents) {
    g.fillStyle = '#b8c4bd';
    g.fillRect(v.x, v.y, v.w, v.h);
    g.strokeStyle = TEAL;
    g.lineWidth = 2;
    g.strokeRect(v.x, v.y, v.w, v.h);
    g.strokeStyle = 'rgba(15,61,62,0.6)';
    g.lineWidth = 1.5;
    const horiz = v.w > v.h;
    const n = horiz ? 6 : 6;
    for (let i = 1; i <= n; i++) {
      if (horiz) {
        const x = v.x + (v.w / (n + 1)) * i;
        g.beginPath(); g.moveTo(x, v.y + 5); g.lineTo(x, v.y + v.h - 5); g.stroke();
      } else {
        const y = v.y + (v.h / (n + 1)) * i;
        g.beginPath(); g.moveTo(v.x + 5, y); g.lineTo(v.x + v.w - 5, y); g.stroke();
      }
    }
    g.fillStyle = TEAL;
    g.font = 'bold 13px Georgia, serif';
    g.textAlign = 'center';
    const cx = v.x + v.w / 2;
    const cy = v.y + v.h / 2;
    g.fillText('VENT', cx, cy - 4);
    g.font = 'bold 15px Georgia, serif';
    g.fillText(horiz ? '→' : '↓', cx, cy + 16);
  }
}

function drawPatrolPaths(g, state) {
  g.strokeStyle = 'rgba(230,57,70,0.55)';
  g.lineWidth = 2;
  g.setLineDash([8, 7]);
  for (const guard of state.guards) {
    const wps = guard.waypoints;
    g.beginPath();
    g.moveTo(wps[0][0], wps[0][1]);
    for (let i = 1; i < wps.length; i++) g.lineTo(wps[i][0], wps[i][1]);
    g.closePath();
    g.stroke();
    for (const wp of wps) {
      g.beginPath();
      g.arc(wp[0], wp[1], 4, 0, Math.PI * 2);
      g.fillStyle = 'rgba(230,57,70,0.8)';
      g.fill();
    }
  }
  g.setLineDash([]);
}

function drawSolids(g, world) {
  for (const s of world.solids) {
    if (s.kind === 'pillar') {
      g.fillStyle = TEAL_WALL;
      g.fillRect(s.x, s.y, s.w, s.h);
      g.fillStyle = GOLD;
      g.fillRect(s.x, s.y, s.w, 5);
      g.fillRect(s.x, s.y + s.h - 5, s.w, 5);
      g.fillStyle = 'rgba(255,255,255,0.12)';
      g.fillRect(s.x + 6, s.y + 6, 8, s.h - 12);
    } else if (s.kind === 'plant') {
      g.fillStyle = '#7a5a34';
      g.fillRect(s.x + s.w / 2 - 8, s.y + s.h - 14, 16, 14);
      g.fillStyle = '#2e7d4f';
      g.beginPath();
      g.arc(s.x + s.w / 2, s.y + s.h / 2 - 4, s.w / 2 + 2, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#3f9d63';
      g.beginPath();
      g.arc(s.x + s.w / 2 - 6, s.y + s.h / 2 - 8, 7, 0, Math.PI * 2);
      g.fill();
    } else {
      // Display case / shelf: teal body, gold trim, glass glint.
      g.fillStyle = TEAL_WALL;
      g.fillRect(s.x, s.y, s.w, s.h);
      g.strokeStyle = GOLD;
      g.lineWidth = 2.5;
      g.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
      g.fillStyle = 'rgba(255,255,255,0.16)';
      g.fillRect(s.x + 8, s.y + 6, s.w - 16, 8);
      g.fillStyle = 'rgba(217,165,33,0.9)';
      g.font = 'bold 10px Georgia, serif';
      g.textAlign = 'center';
      g.fillText(s.kind === 'shelf' ? 'ARCHIVE' : 'EXHIBIT', s.x + s.w / 2, s.y + s.h / 2 + 12);
    }
  }
}

function drawExit(g, state, world) {
  const e = world.exit;
  const open = state.exitOpen;
  g.fillStyle = open ? '#1f7a4d' : '#5a3b2e';
  g.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
  g.strokeStyle = open ? GOLD_BRIGHT : GOLD;
  g.lineWidth = 3;
  g.strokeRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
  g.fillStyle = '#fff';
  g.font = 'bold 13px Georgia, serif';
  g.textAlign = 'center';
  g.fillText(open ? 'EXIT OPEN' : 'LOCKED', e.x, e.y + 5);
  // Dark pill behind the van label so cream text reads on the cream floor.
  g.font = 'bold 15px Georgia, serif';
  const label = 'GETAWAY VAN  →';
  const lw = g.measureText(label).width + 20;
  g.fillStyle = 'rgba(15,61,62,0.92)';
  g.fillRect(e.x + 62, e.y - 13, lw, 26);
  g.strokeStyle = open ? GOLD_BRIGHT : GOLD;
  g.lineWidth = 2;
  g.strokeRect(e.x + 62, e.y - 13, lw, 26);
  g.fillStyle = open ? GOLD_BRIGHT : '#f3e9cf';
  g.fillText(label, e.x + 62 + lw / 2, e.y + 5);
  if (open) {
    // Pulsing gold arrow pointing at the door.
    const pulse = 0.6 + 0.4 * Math.sin(state.time * 5);
    g.fillStyle = `rgba(255,211,77,${pulse})`;
    g.beginPath();
    g.moveTo(e.x - 14, e.y - 34);
    g.lineTo(e.x + 14, e.y - 34);
    g.lineTo(e.x, e.y - 18);
    g.closePath();
    g.fill();
  }
}

function drawLoot(g, state) {
  for (const loot of state.loot) {
    if (loot.taken) continue;
    const bob = Math.sin(state.time * 2.4 + loot.x) * 3;
    const y = loot.y + bob;
    g.save();
    g.shadowColor = GOLD_BRIGHT;
    g.shadowBlur = 22;
    g.fillStyle = GOLD_BRIGHT;
    g.beginPath();
    g.moveTo(loot.x, y - 20);
    g.lineTo(loot.x + 15, y);
    g.lineTo(loot.x, y + 20);
    g.lineTo(loot.x - 15, y);
    g.closePath();
    g.fill();
    g.restore();
    g.fillStyle = '#fff8dc';
    g.beginPath();
    g.moveTo(loot.x, y - 12);
    g.lineTo(loot.x + 7, y - 2);
    g.lineTo(loot.x, y + 6);
    g.lineTo(loot.x - 7, y - 2);
    g.closePath();
    g.fill();
    g.fillStyle = '#7a5a00';
    g.font = 'bold 12px Georgia, serif';
    g.textAlign = 'center';
    g.fillText(loot.name, loot.x, y + 38);
    g.fillStyle = 'rgba(217,165,33,0.9)';
    g.beginPath();
    g.arc(loot.x, y, 26 + Math.sin(state.time * 3) * 3, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(217,165,33,0.35)';
    g.lineWidth = 2;
    g.stroke();
  }
}

function drawLasers(g, state) {
  for (const l of state.lasers) {
    const flashing = l.flash > 0;
    g.save();
    g.shadowColor = RED;
    g.shadowBlur = flashing ? 26 : 12;
    g.strokeStyle = flashing ? '#ff5a6a' : RED;
    g.lineWidth = flashing ? 5 : 3;
    g.beginPath();
    g.moveTo(l.x1, l.y1);
    g.lineTo(l.x2, l.y2);
    g.stroke();
    g.restore();
    // Emitter posts.
    for (const [x, y] of [[l.x1, l.y1], [l.x2, l.y2]]) {
      g.fillStyle = TEAL;
      g.fillRect(x - 5, y - 5, 10, 10);
      g.fillStyle = RED;
      g.beginPath();
      g.arc(x, y, 3, 0, Math.PI * 2);
      g.fill();
    }
    const mx = (l.x1 + l.x2) / 2;
    const my = (l.y1 + l.y2) / 2;
    g.fillStyle = '#8f1d27';
    g.font = 'bold 11px Georgia, serif';
    g.textAlign = 'center';
    g.fillText('LASER — SNEAK UNDER', mx, my - 12);
  }
}

function drawCameras(g, state) {
  for (const cam of state.cameras) {
    const disabled = state.time < cam.disabledUntil;
    const col = disabled ? 'rgba(120,120,120,0.35)' : 'rgba(230,57,70,0.30)';
    const edge = disabled ? 'rgba(120,120,120,0.8)' : 'rgba(230,57,70,0.9)';
    drawCone(g, cam.x, cam.y, cam.angle, TUNING.cameraConeRange, TUNING.cameraConeHalfAngle, col, edge);
    // Wall mount.
    g.fillStyle = TEAL;
    g.beginPath();
    g.arc(cam.x, cam.y, 10, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = disabled ? '#888' : RED;
    g.beginPath();
    g.arc(cam.x, cam.y, 5, 0, Math.PI * 2);
    g.fill();
    if (disabled) {
      g.fillStyle = '#555';
      g.font = 'bold 11px Georgia, serif';
      g.textAlign = 'center';
      g.fillText('OFFLINE', cam.x, cam.y + 26);
    } else if (cam.spot > 0.25) {
      g.fillStyle = RED;
      g.font = 'bold 13px Georgia, serif';
      g.textAlign = 'center';
      g.fillText('SPOTTING!', cam.x, cam.y + 26);
    }
  }
}

function drawGuards(g, state) {
  for (const guard of state.guards) {
    const dog = guard.dog;
    const range = dog ? TUNING.guardConeRange * 0.9 : TUNING.guardConeRange;
    const fill = guard.state === 'ALERTED'
      ? 'rgba(230,57,70,0.42)'
      : guard.state === 'SUSPICIOUS'
        ? 'rgba(255,122,26,0.32)'
        : 'rgba(230,57,70,0.26)';
    const edge = guard.state === 'CALM' ? 'rgba(230,57,70,0.75)' : 'rgba(230,57,70,1)';
    drawCone(g, guard.x, guard.y, guard.dir, range, TUNING.guardConeHalfAngle, fill, edge);
    // Body: navy uniform, gold cap band. The hound is a brown dog.
    g.fillStyle = dog ? '#8a5a2b' : '#22355c';
    g.beginPath();
    g.arc(guard.x, guard.y, guard.r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = GOLD;
    g.lineWidth = 2;
    g.stroke();
    if (dog) {
      g.fillStyle = '#8a5a2b';
      g.beginPath();
      g.arc(guard.x + Math.cos(guard.dir) * 12, guard.y + Math.sin(guard.dir) * 12, 7, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#5a3a1a';
      g.beginPath();
      g.arc(guard.x + Math.cos(guard.dir - 0.5) * 13, guard.y + Math.sin(guard.dir - 0.5) * 13, 3.5, 0, Math.PI * 2);
      g.arc(guard.x + Math.cos(guard.dir + 0.5) * 13, guard.y + Math.sin(guard.dir + 0.5) * 13, 3.5, 0, Math.PI * 2);
      g.fill();
    } else {
      g.fillStyle = '#101c33';
      g.fillRect(guard.x - 9, guard.y - guard.r - 2, 18, 7);
      g.fillStyle = GOLD;
      g.fillRect(guard.x - 9, guard.y - guard.r + 3, 18, 2);
    }
    // State bubble: ? suspicious, ! alerted. Detection arc while filling.
    if (guard.state !== 'CALM' || guard.detect > 0.05) {
      g.fillStyle = guard.state === 'ALERTED' ? RED : '#ff9f1c';
      g.font = 'bold 22px Georgia, serif';
      g.textAlign = 'center';
      g.fillText(guard.state === 'ALERTED' ? '!' : '?', guard.x, guard.y - guard.r - 10);
    }
    if (guard.detect > 0.02 && guard.detect < 1) {
      g.strokeStyle = RED;
      g.lineWidth = 4;
      g.beginPath();
      g.arc(guard.x, guard.y, guard.r + 7, -Math.PI / 2, -Math.PI / 2 + guard.detect * Math.PI * 2);
      g.stroke();
    }
  }
}

function drawPlayer(g, state) {
  const p = state.player;
  if (p.dead) return;
  const x = p.x;
  const y = p.y;
  // Sneak = crouched (smaller), run = stretched. Always big and orange.
  const squash = p.mode === 'sneak' ? 0.85 : 1;
  g.save();
  g.translate(x, y);
  g.scale(1, squash);
  // Tail.
  g.fillStyle = '#e85d04';
  g.beginPath();
  g.ellipse(-p.r - 6, 8, 12, 7, 0.5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.beginPath();
  g.ellipse(-p.r - 13, 11, 5, 3.5, 0.5, 0, Math.PI * 2);
  g.fill();
  // Body.
  g.fillStyle = ORANGE;
  g.beginPath();
  g.arc(0, 0, p.r, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#7a2e00';
  g.lineWidth = 2.5;
  g.stroke();
  // Ears.
  g.fillStyle = ORANGE;
  g.beginPath();
  g.moveTo(-11, -p.r + 4); g.lineTo(-15, -p.r - 11); g.lineTo(-4, -p.r - 2);
  g.closePath(); g.fill();
  g.beginPath();
  g.moveTo(11, -p.r + 4); g.lineTo(15, -p.r - 11); g.lineTo(4, -p.r - 2);
  g.closePath(); g.fill();
  g.fillStyle = '#7a2e00';
  g.beginPath();
  g.moveTo(-11, -p.r + 2); g.lineTo(-13, -p.r - 7); g.lineTo(-6, -p.r - 2);
  g.closePath(); g.fill();
  g.beginPath();
  g.moveTo(11, -p.r + 2); g.lineTo(13, -p.r - 7); g.lineTo(6, -p.r - 2);
  g.closePath(); g.fill();
  // Mask.
  g.fillStyle = '#1d2b2b';
  g.fillRect(-p.r + 2, -7, p.r * 2 - 4, 9);
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(-6, -2.5, 2.6, 0, Math.PI * 2);
  g.arc(6, -2.5, 2.6, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1d2b2b';
  g.beginPath();
  g.arc(-6, -2.5, 1.3, 0, Math.PI * 2);
  g.arc(6, -2.5, 1.3, 0, Math.PI * 2);
  g.fill();
  // Muzzle.
  g.fillStyle = '#fff';
  g.beginPath();
  g.ellipse(0, 9, 8, 5, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1d2b2b';
  g.beginPath();
  g.arc(0, 7, 2, 0, Math.PI * 2);
  g.fill();
  g.restore();
  // Noise ring while running.
  if (p.mode === 'run' && p.moving) {
    const rr = 26 + (state.time * 60) % 26;
    g.strokeStyle = `rgba(230,57,70,${0.7 - rr / 90})`;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(x, y, rr, 0, Math.PI * 2);
    g.stroke();
  }
  // Detection warning ring: someone is filling their meter on the Fox.
  const maxDetect = Math.max(0, ...state.guards.map((gd) => gd.detect));
  if (maxDetect > 0.05) {
    g.strokeStyle = `rgba(230,57,70,${0.5 + maxDetect * 0.5})`;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x, y, p.r + 10, -Math.PI / 2, -Math.PI / 2 + maxDetect * Math.PI * 2);
    g.stroke();
  }
}

function drawEffects(g, state) {
  for (const s of state.smokes) {
    const a = Math.min(0.75, s.t / 2);
    g.fillStyle = `rgba(200,205,200,${a})`;
    g.beginPath();
    g.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = `rgba(160,165,160,${a * 0.8})`;
    g.beginPath();
    g.arc(s.x - 22, s.y + 12, s.r * 0.45, 0, Math.PI * 2);
    g.arc(s.x + 24, s.y - 10, s.r * 0.4, 0, Math.PI * 2);
    g.fill();
  }
  for (const c of state.coinFx) {
    g.strokeStyle = `rgba(255,211,77,${c.t})`;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(c.x, c.y, (0.9 - c.t) * 60 + 8, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = GOLD_BRIGHT;
    g.beginPath();
    g.arc(c.x, c.y, 6, 0, Math.PI * 2);
    g.fill();
  }
  for (const n of state.noises) {
    if (n.kind !== 'coin') continue;
    g.strokeStyle = 'rgba(255,211,77,0.6)';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(n.x, n.y, n.radius * (1 - n.t / 0.6), 0, Math.PI * 2);
    g.stroke();
  }
}

export function drawGame(g, state) {
  const level = state.levelDef;
  g.drawImage(buildFloor(level, state.seed), 0, 0);
  drawShadowZones(g, state.world);
  drawVents(g, state.world);
  drawPatrolPaths(g, state);
  drawExit(g, state, state.world);
  drawLoot(g, state);
  drawLasers(g, state);
  drawCameras(g, state);
  drawGuards(g, state);
  drawSolids(g, state.world);
  drawPlayer(g, state);
  drawEffects(g, state);
  // Room label, bottom-left, small.
  g.fillStyle = 'rgba(15,61,62,0.55)';
  g.font = 'bold 12px Georgia, serif';
  g.textAlign = 'left';
  g.fillText('MUSEUM MARLOWE — ' + level.name, 16, VIEW_H - 10);
}
