// Mouse, touch and keyboard input. A tap lands on the canvas in game
// coordinates; main.js decides what was tapped (a pest, a bed, a seed card,
// the moonphase dial, the well, a draft card). Keys: 1-6 pick a seed,
// F cycles the moonphase, W waters the hovered bed, Space/Enter advances
// screens, R restarts the run, P pauses. Coordinates are scaled from CSS
// pixels to the 1280x720 stage.

import { bedRect, shopRect } from './config.js';

export function attachInput(canvas, handlers) {
  const toGame = (evt) => {
    const r = canvas.getBoundingClientRect();
    const cx = (evt.touches ? evt.touches[0].clientX : evt.clientX);
    const cy = (evt.touches ? evt.touches[0].clientY : evt.clientY);
    return {
      x: (cx - r.left) * (canvas.width / r.width),
      y: (cy - r.top) * (canvas.height / r.height),
    };
  };

  canvas.addEventListener('mousemove', (e) => {
    const p = toGame(e);
    handlers.onMove(p.x, p.y);
  });
  canvas.addEventListener('mousedown', (e) => {
    const p = toGame(e);
    handlers.onTap(p.x, p.y);
  });
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const p = toGame(e);
    handlers.onTap(p.x, p.y);
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    handlers.onKey(e.code);
  });
}

export function bedAt(x, y) {
  for (let i = 0; i < 9; i++) {
    const r = bedRect(i);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

export function seedAt(x, y) {
  for (let i = 0; i < 6; i++) {
    const r = shopRect(i);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

export function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
