// ui.js — HUD and screens (DOM overlay above the canvas).
// HUD always shows: level name, loot counter, alarm meter, detection eye,
// timer, score, lives, coins and hints. Screens: title, level complete
// (stars + bonuses), caught, game complete, paused.

export function makeUI() {
  const $ = (id) => document.getElementById(id);
  return {
    hud: $('hud'),
    levelName: $('level-name'),
    lootCount: $('loot-count'),
    alarmFill: $('alarm-fill'),
    alarmText: $('alarm-text'),
    eyeFill: $('eye-fill'),
    eyeText: $('eye-text'),
    timer: $('timer'),
    score: $('score'),
    lives: $('lives'),
    coins: $('coins'),
    hints: $('hints'),
    banner: $('banner'),
    screens: {
      title: $('screen-title'),
      level: $('screen-level'),
      caught: $('screen-caught'),
      complete: $('screen-complete'),
      paused: $('screen-paused'),
    },
    levelTitle: $('level-title'),
    levelStats: $('level-stats'),
    caughtText: $('caught-text'),
    finalStats: $('final-stats'),
    showScreen(name) {
      for (const [key, el] of Object.entries(this.screens)) {
        if (el) el.classList.toggle('hidden', key !== name);
      }
      if (!name && this.hud) this.hud.classList.remove('hidden');
    },
    hideScreens() {
      for (const el of Object.values(this.screens)) {
        if (el) el.classList.add('hidden');
      }
    },
    update(state) {
      const level = state.level;
      this.levelName.textContent = level.name;
      this.lootCount.textContent = `Loot ${state.lootGot}/${level.loot.length}`;
      const alarm = Math.round(state.alarm);
      this.alarmFill.style.width = `${alarm}%`;
      this.alarmFill.className = 'fill ' + (alarm > 66 ? 'danger' : alarm > 33 ? 'warn' : 'ok');
      this.alarmText.textContent = `ALARM ${alarm}%`;
      const det = Math.round(state.maxDetection);
      this.eyeFill.style.width = `${det}%`;
      this.eyeText.textContent = det >= 100 ? 'SPOTTED!' : det >= 45 ? 'SUSPICIOUS' : det > 2 ? 'SEEN?' : 'HIDDEN';
      this.timer.textContent = fmtTime(state.time);
      this.score.textContent = `Score ${state.score}`;
      this.lives.textContent = '♥'.repeat(state.lives) + '♡'.repeat(Math.max(0, 3 - state.lives));
      this.coins.textContent = `Coins ${state.player.coins}`;
      this.hints.textContent = `Hints ${state.player.hints} (H)`;
      this.banner.textContent = state.banner || '';
      this.banner.classList.toggle('hidden', !state.banner);
    },
    showLevelComplete(levelIndex, stats) {
      this.levelTitle.textContent = `Level ${levelIndex + 1} complete!`;
      this.levelStats.innerHTML =
        `Stars: ${'★'.repeat(stats.stars)}${'☆'.repeat(3 - stats.stars)}<br>` +
        `Time ${fmtTime(stats.time)} (par ${fmtTime(stats.par)}) — time bonus +${stats.timeBonus}<br>` +
        `Ghost bonus (never detected): +${stats.ghostBonus}<br>` +
        `Loot bonus: +${stats.lootBonus}<br>` +
        `<b>Level score: ${stats.levelScore}</b><br>` +
        `<span class="dim">Press Enter for the next level</span>`;
      this.showScreen('level');
    },
    showCaught(lives) {
      this.caughtText.textContent = lives > 0
        ? `Caught! The alarm hit 100%. ${lives} ${lives === 1 ? 'life' : 'lives'} left — the level restarts.`
        : 'Caught! No lives left.';
      this.showScreen('caught');
    },
    showComplete(totalScore, totalTime) {
      this.finalStats.innerHTML =
        `You lifted every vault in the tower.<br>` +
        `Total score: <b>${totalScore}</b><br>` +
        `Total time: ${fmtTime(totalTime)}<br>` +
        `<span class="dim">Press Enter to play again</span>`;
      this.showScreen('complete');
    },
  };
}

export function fmtTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
