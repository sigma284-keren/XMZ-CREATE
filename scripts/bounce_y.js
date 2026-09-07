const AMPLITUDE = 40;
const FREQUENCY = 2;

let _t = 0;
let _baseY = 0;

function _ready() {
  _t = 0;
  if (this.position) _baseY = this.position.y;
  console.log(this.name + ' — bounce_y ready');
}

function _process(delta) {
  if (!this.position) return;
  _t += delta;
  this.position.y = _baseY + Math.sin(_t * FREQUENCY * Math.PI * 2) * AMPLITUDE;
}
