export function getMoveAxis(input) {
  let x = 0;
  let y = 0;
  if (input.isKeyPressed('KeyA') || input.isKeyPressed('ArrowLeft'))  x -= 1;
  if (input.isKeyPressed('KeyD') || input.isKeyPressed('ArrowRight')) x += 1;
  if (input.isKeyPressed('KeyW') || input.isKeyPressed('ArrowUp'))    y -= 1;
  if (input.isKeyPressed('KeyS') || input.isKeyPressed('ArrowDown'))  y += 1;

  if (x !== 0 && y !== 0) {
    const inv = 1 / Math.SQRT2;
    x *= inv;
    y *= inv;
  }
  return { x, y };
}

export function justPressed(input, code, prevKeys) {
  const now = input.isKeyPressed(code);
  const was = !!prevKeys[code];
  prevKeys[code] = now;
  return now && !was;
}

export function applyDeadzone(x, y, zone = 0.15) {
  const mag = Math.sqrt(x * x + y * y);
  if (mag < zone) return { x: 0, y: 0 };
  const scale = (mag - zone) / (1 - zone);
  return { x: (x / mag) * scale, y: (y / mag) * scale };
}
