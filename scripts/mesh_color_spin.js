const SPEED = 1.2;

function _ready() {
  if (this.setColor) this.setColor(0.9, 0.3, 0.5);
  console.log(this.name + ' mesh_color_spin ready');
}

function _process(delta) {
  if (this.rotation && this.rotation.y !== undefined) {
    this.rotation.y += SPEED * delta;
  }
  if (this.scale && this.scale.x !== undefined) {
    const s = 1 + Math.sin(this.rotation.y) * 0.15;
    this.scale.x = s;
    this.scale.y = s;
    this.scale.z = s;
  }
}
