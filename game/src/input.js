// input.js — keyboard state for the thief.
// WASD / arrows move, Shift sneaks, E picks up, Q tosses a coin,
// R restarts the level, M mutes, P pauses, H shows the exit direction.

export function makeInput() {
  return {
    up: false, down: false, left: false, right: false,
    sneak: false,
    pressed: {}, // edge-triggered keys, consumed by main
  };
}

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};

export function bindInput(input, onPress) {
  window.addEventListener('keydown', (e) => {
    const dir = KEYMAP[e.code];
    if (dir) {
      input[dir] = true;
      e.preventDefault();
    }
    if (!e.repeat) {
      input.pressed[e.code] = true;
      if (onPress) onPress(e.code);
    }
  });
  window.addEventListener('keyup', (e) => {
    const dir = KEYMAP[e.code];
    if (dir) input[dir] = false;
  });
  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = input.sneak = false;
  });
}

export function consumePress(input, code) {
  if (input.pressed[code]) {
    input.pressed[code] = false;
    return true;
  }
  return false;
}

export function clearPresses(input) {
  input.pressed = {};
}
