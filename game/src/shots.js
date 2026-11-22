// shots.js — deterministic staging for the four screenshots.
// ?shot=cover | start | laser | end sets the game into a real, playable
// state (the same code paths the player uses) so each screenshot is a true
// render of the game, not a mock-up.

export function stageShot(game, name, loadFloor) {
  if (name === 'start') {
    loadFloor(0);
    game.screen = 'title';
    game.flash = ''; game.flashT = 0;
    return;
  }
  if (name === 'cover') {
    loadFloor(0);
    game.screen = 'play';
    const p = game.player;
    p.x = 640; p.y = 430; p.dir = -Math.PI / 2;
    p.lootGot = 0; p.score = 0;
    game.alarm = 34;
    game.flash = ''; game.flashT = 0;
    // Four guards, cones sweeping toward the middle of the room.
    const spots = [
      { x: 500, y: 290, dir: 0.5 },
      { x: 790, y: 560, dir: -2.2 },
      { x: 300, y: 620, dir: -1.2 },
      { x: 1010, y: 330, dir: 2.6 },
    ];
    game.guards.forEach((g, i) => {
      const s = spots[i];
      g.x = s.x; g.y = s.y; g.dir = s.dir;
      g.wp = [[s.x - 50, s.y - 30], [s.x + 50, s.y - 30], [s.x + 50, s.y + 30], [s.x - 50, s.y + 30]];
      g.wpIndex = 1; g.state = 'patrol'; g.suspicion = i === 1 ? 0.45 : 0;
    });
    return;
  }
  if (name === 'laser') {
    loadFloor(1);
    game.screen = 'play';
    const p = game.player;
    p.x = 560; p.y = 178; p.dir = Math.PI / 2;
    p.lootGot = 2; p.score = 1150;
    game.loot[0].taken = true; game.loot[1].taken = true;
    game.alarm = 58;
    game.lasers[0].trippedT = 60;
    game.flash = 'LASER TRIPPED — ALARM RISING';
    game.flashT = 60;
    // Keep the frame quiet: cameras EMP'd, guards far from the thief so no
    // fresh spotting overwrites the laser banner before the screenshot.
    for (const c of game.cameras) c.offlineT = 60;
    game.guards[0].x = 340; game.guards[0].y = 180; game.guards[0].dir = Math.PI / 2;
    game.guards[0].suspicion = 0; game.guards[0].state = 'patrol';
    game.guards[1].suspicion = 0;
    return;
  }
  if (name === 'end') {
    loadFloor(2);
    game.screen = 'win';
    const p = game.player;
    p.lootGot = 4; p.score = 3850;
    game.loot.forEach((l) => { l.taken = true; });
    game.alarm = 12;
    game.time = 247;
    game.ghost = true;
    game.stars = 3;
    game.flash = ''; game.flashT = 0;
    game.winBreakdown = { loot: 5500, time: 1482, ghost: 1000, total: 7982 };
    return;
  }
}
