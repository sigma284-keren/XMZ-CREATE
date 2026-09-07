const SPEED = 200;

function _ready() {
  console.log(this.name + ' — player_move_2d ready');
}

function _process(delta) {
  if (!this.position) return;

  let dx = 0;
  let dy = 0;

  if (typeof input !== 'undefined') {

    if (input.getAxis) {
      const axis = input.getAxis();
      dx = axis.x;
      dy = axis.y;
    } else {
      if (input.isKeyPressed('KeyA') || input.isKeyPressed('ArrowLeft'))  dx -= 1;
      if (input.isKeyPressed('KeyD') || input.isKeyPressed('ArrowRight')) dx += 1;
      if (input.isKeyPressed('KeyW') || input.isKeyPressed('ArrowUp'))    dy -= 1;
      if (input.isKeyPressed('KeyS') || input.isKeyPressed('ArrowDown'))  dy += 1;
      if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
    }
  }

  this.position.x += dx * SPEED * delta;
  this.position.y += dy * SPEED * delta;
}
