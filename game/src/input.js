// input.js — keyboard state and edge-triggered action keys.
// One job: keys. Nothing here knows about the game.
export function createInput() {
  const keys = new Set();
  const pressed = new Set(); // keys pressed since last poll, for one-shot actions
  let onKeyDown = null;

  const CODE = {
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
  };

  function handle(e, down) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (down) {
      if (!keys.has(e.code)) pressed.add(e.code);
      keys.add(e.code);
      if (onKeyDown) onKeyDown(e.code);
    } else {
      keys.delete(e.code);
    }
  }

  window.addEventListener('keydown', (e) => handle(e, true));
  window.addEventListener('keyup', (e) => handle(e, false));
  window.addEventListener('blur', () => keys.clear());

  return {
    axisX() {
      let x = 0;
      if (CODE.left.some((c) => keys.has(c))) x -= 1;
      if (CODE.right.some((c) => keys.has(c))) x += 1;
      return x;
    },
    axisY() {
      let y = 0;
      if (CODE.up.some((c) => keys.has(c))) y -= 1;
      if (CODE.down.some((c) => keys.has(c))) y += 1;
      return y;
    },
    sneak() { return keys.has('ShiftLeft') || keys.has('ShiftRight'); },
    run() { return keys.has('Space'); },
    wasPressed(code) { return pressed.has(code); },
    endFrame() { pressed.clear(); },
    setKeyHandler(fn) { onKeyDown = fn; },
    has(code) { return keys.has(code); },
  };
}
