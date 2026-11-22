// input.js — keyboard state. WASD and arrows move, Shift sneaks,
// Q/F/E/G fire tools, Enter starts, R restarts the floor.

export function makeInput() {
  return {
    up: false, down: false, left: false, right: false, sneak: false,
    pressed: new Set(),
  };
}

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};

export function attachInput(input, onKey) {
  window.addEventListener('keydown', (e) => {
    const dir = KEYMAP[e.code];
    if (dir) { input[dir] = true; e.preventDefault(); }
    if (!e.repeat) {
      input.pressed.add(e.code);
      if (onKey) onKey(e.code);
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
