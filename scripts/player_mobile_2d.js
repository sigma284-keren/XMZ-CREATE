const SPEED = 220;
const JUMP_FORCE = 380;
const GRAVITY = 900;
const DASH_SPEED = 480;
const DASH_TIME = 0.18;

let velY = 0;
let onGround = true;
let dashTimer = 0;
let facing = 1;

function _ready() {
  velY = 0;
  onGround = true;
  dashTimer = 0;
  console.log(this.name + ' — player_mobile_2d ready');
}

function _process(delta) {
  if (!this.position) return;

  const axis = (typeof input !== 'undefined' && input.getAxis) ? input.getAxis() : { x: 0, y: 0 };

  if (dashTimer > 0) {
    dashTimer -= delta;
    this.position.x += facing * DASH_SPEED * delta;
  } else {
    this.position.x += axis.x * SPEED * delta;
    if (axis.x !== 0) facing = axis.x > 0 ? 1 : -1;
  }

  const jump = typeof input !== 'undefined' && input.isActionPressed
    ? input.isActionPressed('jump')
    : false;

  if (jump && onGround) {
    velY = -JUMP_FORCE;
    onGround = false;
  }

  const dash = typeof input !== 'undefined' && input.isActionPressed
    ? input.isActionPressed('dash')
    : false;
  if (dash && dashTimer <= 0) {
    dashTimer = DASH_TIME;
  }

  velY += GRAVITY * delta;
  this.position.y += velY * delta;
  if (this.position.y >= 0) {
    this.position.y = 0;
    velY = 0;
    onGround = true;
  }
}
