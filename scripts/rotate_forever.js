const SPEED = 1.5;

function _ready() {
  console.log(this.name + ' — rotate_forever ready');
}

function _process(delta) {
  if (typeof this.rotation === 'number') {

    this.rotation += SPEED * delta;
  } else if (this.rotation && this.rotation.y !== undefined) {

    this.rotation.y += SPEED * delta;
  }
}
