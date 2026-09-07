let THREE = null;

export async function ensureTHREE() {
  if (THREE) return THREE;
  THREE = await import('three');
  return THREE;
}

function T() {
  if (!THREE) throw new Error('THREE not loaded');
  return THREE;
}

export const Vector2 = (x = 0, y = 0) => ({ x, y });
export const Vector3 = (x = 0, y = 0, z = 0) => ({ x, y, z });
export const Color = (r = 1, g = 1, b = 1, a = 1) => ({ r, g, b, a });

export function uid() {
  return 'n_' + Math.random().toString(36).slice(2, 10);
}

export class Node {
  constructor(name = 'Node') {
    this.id = uid();
    this.name = name;
    this.type = 'Node';
    this.children = [];
    this.parent = null;
    this.visible = true;
    this.script = null;
    this._scriptInstance = null;
    this.engine = null;
  }

  addChild(node) {
    node.parent = this;
    node.engine = this.engine;
    this.children.push(node);
    if (node._ready && typeof node._ready === 'function') {

    }
    return node;
  }

  removeChild(node) {
    const i = this.children.indexOf(node);
    if (i !== -1) {
      this.children.splice(i, 1);
      node.parent = null;
    }
  }

  getChild(name) {
    return this.children.find(c => c.name === name) || null;
  }

  getNode(path) {

    const parts = path.split('/');
    let current = this;
    for (const p of parts) {
      current = current.getChild(p);
      if (!current) return null;
    }
    return current;
  }

  _ready() {}
  _process(delta) {}
  _draw(ctx) {}
  _update3D() {}

  serialize() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      visible: this.visible,
      script: this.script,
      children: this.children.map(c => c.serialize())
    };
  }
}

export class Node2D extends Node {
  constructor(name = 'Node2D') {
    super(name);
    this.type = 'Node2D';
    this.position = Vector2();
    this.rotation = 0;
    this.scale = Vector2(1, 1);
    this.zIndex = 0;
  }

  serialize() {
    return {
      ...super.serialize(),
      position: this.position,
      rotation: this.rotation,
      scale: this.scale,
      zIndex: this.zIndex
    };
  }
}

export class Sprite2D extends Node2D {
  constructor(name = 'Sprite2D') {
    super(name);
    this.type = 'Sprite2D';
    this.texture = null;
    this.texturePath = '';
    this.modulate = Color(1, 1, 1, 1);
    this.centered = true;
    this.offset = Vector2();
  }

  _draw(ctx) {
    if (!this.visible || !this.texture) return;
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale.x, this.scale.y);
    ctx.globalAlpha = this.modulate.a;
    const w = this.texture.width;
    const h = this.texture.height;
    const ox = this.centered ? -w / 2 : this.offset.x;
    const oy = this.centered ? -h / 2 : this.offset.y;
    ctx.drawImage(this.texture, ox, oy);
    ctx.restore();
  }

  serialize() {
    return {
      ...super.serialize(),
      texturePath: this.texturePath,
      modulate: this.modulate,
      centered: this.centered,
      offset: this.offset
    };
  }
}

export class Camera2D extends Node2D {
  constructor(name = 'Camera2D') {
    super(name);
    this.type = 'Camera2D';
    this.current = true;
    this.zoom = Vector2(1, 1);
    this.offset = Vector2();
  }

  serialize() {
    return {
      ...super.serialize(),
      current: this.current,
      zoom: this.zoom,
      offset: this.offset
    };
  }
}

export class Label extends Node2D {
  constructor(name = 'Label') {
    super(name);
    this.type = 'Label';
    this.text = 'Label';
    this.fontSize = 16;
    this.color = Color(1, 1, 1, 1);
    this.fontFamily = 'Inter, sans-serif';
  }

  _draw(ctx) {
    if (!this.visible) return;
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale.x, this.scale.y);
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.fillStyle = `rgba(${this.color.r * 255},${this.color.g * 255},${this.color.b * 255},${this.color.a})`;
    ctx.fillText(this.text, 0, 0);
    ctx.restore();
  }

  serialize() {
    return {
      ...super.serialize(),
      text: this.text,
      fontSize: this.fontSize,
      color: this.color,
      fontFamily: this.fontFamily
    };
  }
}

export class Button extends Node2D {
  constructor(name = 'Button') {
    super(name);
    this.type = 'Button';
    this.text = 'Button';
    this.size = Vector2(120, 36);
    this.bgColor = Color(0.4, 0.35, 0.9, 1);
    this.textColor = Color(1, 1, 1, 1);
    this.hovered = false;
    this.pressed = false;
    this.onPressed = null;
  }

  _draw(ctx) {
    if (!this.visible) return;
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    const alpha = this.hovered ? 1 : 0.85;
    ctx.fillStyle = `rgba(${this.bgColor.r * 255},${this.bgColor.g * 255},${this.bgColor.b * 255},${alpha})`;
    ctx.beginPath();
    ctx.roundRect(0, 0, this.size.x, this.size.y, 6);
    ctx.fill();
    ctx.fillStyle = `rgb(${this.textColor.r * 255},${this.textColor.g * 255},${this.textColor.b * 255})`;
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.size.x / 2, this.size.y / 2);
    ctx.restore();
  }

  serialize() {
    return {
      ...super.serialize(),
      text: this.text,
      size: this.size,
      bgColor: this.bgColor,
      textColor: this.textColor
    };
  }
}

export class Node3D extends Node {
  constructor(name = 'Node3D') {
    super(name);
    this.type = 'Node3D';
    this.position = Vector3();
    this.rotation = Vector3();
    this.scale = Vector3(1, 1, 1);
    this.threeObject = null;
    if (THREE) this.threeObject = new THREE.Object3D();
  }

  ensureObject() {
    if (!this.threeObject && THREE) this.threeObject = new THREE.Object3D();
    return this.threeObject;
  }

  _update3D() {
    const obj = this.ensureObject();
    if (!obj) return;
    obj.position.set(this.position.x, this.position.y, this.position.z);
    obj.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
    obj.scale.set(this.scale.x, this.scale.y, this.scale.z);
    obj.visible = this.visible;
  }

  serialize() {
    return {
      ...super.serialize(),
      position: this.position,
      rotation: this.rotation,
      scale: this.scale
    };
  }
}

export class MeshInstance3D extends Node3D {
  constructor(name = 'MeshInstance3D') {
    super(name);
    this.type = 'MeshInstance3D';
    this.meshType = 'box';
    this.color = Color(0.4, 0.5, 0.9, 1);
    this._rebuildMesh();
  }

  _rebuildMesh() {
    if (!THREE) return;
    let geometry;
    switch (this.meshType) {
      case 'sphere': geometry = new THREE.SphereGeometry(0.5, 32, 32); break;
      case 'plane': geometry = new THREE.PlaneGeometry(1, 1); break;
      case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32); break;
      default: geometry = new THREE.BoxGeometry(1, 1, 1);
    }
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.color.r, this.color.g, this.color.b)
    });
    if (this.threeObject && this.threeObject.isMesh) {
      this.threeObject.geometry.dispose();
      this.threeObject.material.dispose();
    }
    this.threeObject = new THREE.Mesh(geometry, material);
    this.threeObject.userData.nodeId = this.id;
  }

  setColor(r, g, b, a) {
    if (typeof r === 'object') {
      this.color = { r: r.r, g: r.g, b: r.b, a: r.a != null ? r.a : 1 };
    } else {
      this.color = { r, g, b, a: a != null ? a : 1 };
    }
    if (this.threeObject && this.threeObject.material) {
      this.threeObject.material.color.setRGB(this.color.r, this.color.g, this.color.b);
    }
  }

  serialize() {
    return {
      ...super.serialize(),
      meshType: this.meshType,
      color: this.color
    };
  }
}

export class Camera3D extends Node3D {
  constructor(name = 'Camera3D') {
    super(name);
    this.type = 'Camera3D';
    this.fov = 75;
    this.near = 0.1;
    this.far = 1000;
    this.current = true;
    this.threeObject = THREE ? new THREE.PerspectiveCamera(this.fov, 1, this.near, this.far) : null;
  }

  serialize() {
    return {
      ...super.serialize(),
      fov: this.fov,
      near: this.near,
      far: this.far,
      current: this.current
    };
  }
}

export class Light3D extends Node3D {
  constructor(name = 'Light3D') {
    super(name);
    this.type = 'Light3D';
    this.lightType = 'directional';
    this.color = Color(1, 1, 1, 1);
    this.intensity = 1;
    this._rebuildLight();
  }

  _rebuildLight() {
    if (!THREE) return;
    const col = new THREE.Color(this.color.r, this.color.g, this.color.b);
    if (this.lightType === 'point') {
      this.threeObject = new THREE.PointLight(col, this.intensity, 100);
    } else if (this.lightType === 'ambient') {
      this.threeObject = new THREE.AmbientLight(col, this.intensity);
    } else {
      this.threeObject = new THREE.DirectionalLight(col, this.intensity);
    }
  }

  serialize() {
    return {
      ...super.serialize(),
      lightType: this.lightType,
      color: this.color,
      intensity: this.intensity
    };
  }
}

export class Scene {
  constructor(name = 'Main') {
    this.name = name;
    this.root = new Node('Root');
    this.root.engine = null;
  }

  serialize() {
    return {
      name: this.name,
      root: this.root.serialize()
    };
  }
}

export class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0, buttons: {} };
    this.actions = {};
    this.axis = { x: 0, y: 0 };
    this._bound = false;

    this._actionKeyMap = {
      left:   ['ArrowLeft', 'KeyA'],
      right:  ['ArrowRight', 'KeyD'],
      up:     ['ArrowUp', 'KeyW'],
      down:   ['ArrowDown', 'KeyS'],
      jump:   ['Space', 'KeyZ'],
      dash:   ['ShiftLeft', 'ShiftRight', 'KeyX'],
      action: ['KeyE', 'Enter'],
      attack: ['KeyF', 'KeyJ'],
      skill:  ['KeyQ', 'KeyK']
    };
  }

  bind(canvas) {
    if (this._bound) return;
    this._bound = true;
    window.addEventListener('keydown', e => { this.keys[e.code] = true; });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mousedown', e => { this.mouse.buttons[e.button] = true; });
    canvas.addEventListener('mouseup', e => { this.mouse.buttons[e.button] = false; });
  }

  isKeyPressed(code) {
    return !!this.keys[code];
  }

  isMousePressed(button = 0) {
    return !!this.mouse.buttons[button];
  }

  setAction(name, pressed) {
    this.actions[name] = !!pressed;

    const codes = this._actionKeyMap[name];
    if (codes) {
      for (const c of codes) this.keys[c] = !!pressed;
    }
  }

  isActionPressed(name) {
    if (this.actions[name]) return true;
    const codes = this._actionKeyMap[name];
    if (codes) return codes.some(c => this.keys[c]);
    return false;
  }

  setAxis(x, y) {
    this.axis.x = Math.max(-1, Math.min(1, x));
    this.axis.y = Math.max(-1, Math.min(1, y));

    this.keys['ArrowLeft']  = this.axis.x < -0.3;
    this.keys['ArrowRight'] = this.axis.x >  0.3;
    this.keys['ArrowUp']    = this.axis.y < -0.3;
    this.keys['ArrowDown']  = this.axis.y >  0.3;
    this.keys['KeyA'] = this.keys['ArrowLeft'];
    this.keys['KeyD'] = this.keys['ArrowRight'];
    this.keys['KeyW'] = this.keys['ArrowUp'];
    this.keys['KeyS'] = this.keys['ArrowDown'];
  }

  getAxis() {
    let x = this.axis.x;
    let y = this.axis.y;

    if (Math.abs(x) < 0.05 && Math.abs(y) < 0.05) {
      x = 0; y = 0;
      if (this.isKeyPressed('ArrowLeft')  || this.isKeyPressed('KeyA')) x -= 1;
      if (this.isKeyPressed('ArrowRight') || this.isKeyPressed('KeyD')) x += 1;
      if (this.isKeyPressed('ArrowUp')    || this.isKeyPressed('KeyW')) y -= 1;
      if (this.isKeyPressed('ArrowDown')  || this.isKeyPressed('KeyS')) y += 1;
      if (x !== 0 && y !== 0) { x *= 0.7071; y *= 0.7071; }
    }
    return { x, y };
  }

  resetVirtual() {
    this.axis = { x: 0, y: 0 };
    for (const k of Object.keys(this.actions)) this.actions[k] = false;
  }
}

export class Engine {
  constructor(canvas2d, canvas3d) {
    this.canvas = canvas2d;
    this.canvas2d = canvas2d;
    this.canvas3d = canvas3d || null;
    this.ctx = canvas2d.getContext('2d', { alpha: false });
    this.mode = '2d';
    this.scene = new Scene();
    this.scene.root.engine = this;
    this.input = new InputManager();
    this.input.bind(canvas2d);
    if (canvas3d) this.input.bind(canvas3d);
    this.running = false;
    this.playing = false;
    this.lastTime = 0;
    this.fps = 0;
    this.assets = new Map();
    this.onLog = null;
    this.bgColor = { r: 0.067, g: 0.067, b: 0.067, a: 1 };
    this.bgImage = null;
    this.bgImagePath = '';
    this.bgFit = 'cover';

    this.renderer3D = null;
    this.scene3D = null;
    this.camera3D = null;
    this._threeReady = false;
    this._showCanvas('2d');
  }

  _showCanvas(mode) {
    if (this.canvas2d) this.canvas2d.style.display = mode === '2d' ? 'block' : 'none';
    if (this.canvas3d) this.canvas3d.style.display = mode === '3d' ? 'block' : 'none';
  }

  async _init3D() {
    if (this._threeReady) return true;
    try {
      if (!this.canvas3d) throw new Error('Canvas 3D tidak ada');
      await ensureTHREE();
      this.renderer3D = new THREE.WebGLRenderer({
        canvas: this.canvas3d,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
      this.renderer3D.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.scene3D = new THREE.Scene();
      this.scene3D.background = new THREE.Color(0x111111);
      this.camera3D = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      this.camera3D.position.set(0, 2, 5);
      this.camera3D.lookAt(0, 0, 0);
      const amb = new THREE.AmbientLight(0x404040, 0.6);
      this.scene3D.add(amb);
      const dir = new THREE.DirectionalLight(0xffffff, 0.8);
      dir.position.set(5, 10, 7);
      this.scene3D.add(dir);
      const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
      this.scene3D.add(grid);

      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
      const { TransformControls } = await import('three/addons/controls/TransformControls.js');

      this.canvas3d.style.touchAction = 'none';
      this.canvas3d.style.userSelect = 'none';
      this.canvas3d.style.webkitUserSelect = 'none';

      this.orbitControls = new OrbitControls(this.camera3D, this.canvas3d);
      this.orbitControls.enableDamping = true;
      this.orbitControls.dampingFactor = 0.08;
      this.orbitControls.target.set(0, 0.5, 0);
      this.orbitControls.enablePan = true;
      this.orbitControls.enableZoom = true;
      this.orbitControls.enableRotate = true;
      this.orbitControls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
      this.orbitControls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      };
      this.orbitControls.update();

      const isTouch = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
      this.transformControls = new TransformControls(this.camera3D, this.canvas3d);
      this.transformControls.setMode('translate');
      this.transformControls.setSize(isTouch ? 1.35 : 0.9);
      try {
        this.scene3D.add(this.transformControls.getHelper());
      } catch (_) {
        this.scene3D.add(this.transformControls);
      }

      this.transformControls.addEventListener('dragging-changed', (e) => {
        if (this.orbitControls) this.orbitControls.enabled = !e.value;
      });
      this.transformControls.addEventListener('objectChange', () => {
        this._syncNodeFromObject();
      });

      this._raycaster = new THREE.Raycaster();
      this._pointer = new THREE.Vector2();
      this._onCanvas3DPointer = (ev) => this._onPointer3D(ev);
      this.canvas3d.addEventListener('pointerdown', this._onCanvas3DPointer);

      this.editMode3D = 'translate';
      this._selectedNode3D = null;
      this._threeReady = true;
      this.log('3D engine ready (orbit + transform)', 'success');
      return true;
    } catch (err) {
      this.log('Gagal load 3D: ' + (err.message || err), 'error');
      this._threeReady = false;
      this.renderer3D = null;
      return false;
    }
  }

  setEditMode3D(mode) {
    this.editMode3D = mode;
    if (!this.transformControls) return;
    if (mode === 'orbit') {
      this.transformControls.detach();
      if (this.orbitControls) this.orbitControls.enabled = true;
    } else {
      this.transformControls.setMode(mode);
      if (this._selectedNode3D && this._selectedNode3D.threeObject) {
        this.transformControls.attach(this._selectedNode3D.threeObject);
      }
    }
  }

  attachEditorNode(node) {
    this._selectedNode3D = node;
    if (!this.transformControls) return;
    if (node && node.threeObject && this.editMode3D !== 'orbit') {
      this.transformControls.attach(node.threeObject);
    } else {
      this.transformControls.detach();
    }
  }

  _syncNodeFromObject() {
    const node = this._selectedNode3D;
    if (!node || !node.threeObject) return;
    const o = node.threeObject;
    if (node.position) {
      node.position.x = o.position.x;
      node.position.y = o.position.y;
      node.position.z = o.position.z;
    }
    if (node.rotation && typeof node.rotation === 'object') {
      node.rotation.x = o.rotation.x;
      node.rotation.y = o.rotation.y;
      node.rotation.z = o.rotation.z;
    }
    if (node.scale && typeof node.scale === 'object') {
      node.scale.x = o.scale.x;
      node.scale.y = o.scale.y;
      node.scale.z = o.scale.z;
    }
    if (this.onNodeTransformed) this.onNodeTransformed(node);
  }

  _onPointer3D(ev) {
    if (this.mode !== '3d' || !this._raycaster || !this.camera3D) return;
    if (this.transformControls && this.transformControls.dragging) return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    if (typeof ev.buttons === 'number' && ev.buttons > 1) return;

    const rect = this.canvas3d.getBoundingClientRect();
    this._pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    this._pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    this._raycaster.setFromCamera(this._pointer, this.camera3D);

    const meshes = [];
    this.getAllNodes().forEach(n => {
      if (n.threeObject && n.threeObject.isMesh) meshes.push(n.threeObject);
    });
    const hits = this._raycaster.intersectObjects(meshes, false);
    if (hits.length) {
      const obj = hits[0].object;
      const node = this.getAllNodes().find(n => n.threeObject === obj || n.id === obj.userData.nodeId);
      if (node && this.onNodePicked) this.onNodePicked(node);
    }
  }

  async setMode(mode) {
    if (mode === '3d') {
      const ok = await this._init3D();
      if (!ok) {
        this.mode = '2d';
        this._showCanvas('2d');
        return false;
      }
      this.mode = '3d';
      this._showCanvas('3d');
    } else {
      this.mode = '2d';
      this._showCanvas('2d');
      if (!this.ctx && this.canvas2d) {
        this.ctx = this.canvas2d.getContext('2d', { alpha: false });
      }
    }
    this.canvas = this.mode === '3d' ? this.canvas3d : this.canvas2d;
    this._resize();
    return true;
  }

  _resize() {
    const stage = (this.canvas2d && this.canvas2d.parentElement) || (this.canvas3d && this.canvas3d.parentElement);
    if (!stage) return;
    const w = stage.clientWidth || 800;
    const h = Math.max(100, stage.clientHeight || 400);

    if (this.canvas2d) {
      this.canvas2d.width = w;
      this.canvas2d.height = h;
    }
    if (this.mode === '3d' && this.renderer3D && this.camera3D && this.canvas3d) {
      this.renderer3D.setSize(w, h, false);
      this.camera3D.aspect = w / h;
      this.camera3D.updateProjectionMatrix();
    }
  }

  log(msg, type = 'info') {
    if (this.onLog) this.onLog(msg, type);
    console.log(`[XMZ] ${msg}`);
  }

  _fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
      reader.readAsDataURL(file);
    });
  }

  async loadAsset(file) {
    const path = file.name;
    const mime = file.type || '';
    const dataUrl = await this._fileToDataUrl(file);

    if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(path)) {
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = () => rej(new Error('Image decode failed: ' + path));
        img.src = dataUrl;
      });
      const entry = {
        type: 'image',
        data: img,
        url: dataUrl,
        dataUrl,
        file,
        mime: mime || 'image/png',
        path,
        fromStorage: false
      };
      this.assets.set(path, entry);
      this.log('Loaded image: ' + path, 'success');
      return entry;
    }

    if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(path)) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = dataUrl;
      await new Promise((res) => {
        audio.oncanplaythrough = res;
        audio.onerror = res;
        setTimeout(res, 600);
      });
      const entry = {
        type: 'audio',
        data: audio,
        url: dataUrl,
        dataUrl,
        file,
        mime: mime || 'audio/mpeg',
        path,
        fromStorage: false
      };
      this.assets.set(path, entry);
      this.log('Loaded SFX/audio: ' + path, 'success');
      return entry;
    }

    const text = await file.text();
    const entry = {
      type: 'text',
      data: text,
      url: dataUrl,
      dataUrl,
      file,
      mime: mime || 'text/plain',
      path,
      fromStorage: false
    };
    this.assets.set(path, entry);
    this.log('Loaded file: ' + path, 'success');
    return entry;
  }

  async loadAssetFromDataUrl(path, type, mime, dataUrl) {
    if (type === 'image') {
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = dataUrl;
      });
      const entry = { type: 'image', data: img, url: dataUrl, dataUrl, file: null, mime, path, fromStorage: true };
      this.assets.set(path, entry);
      return entry;
    }
    if (type === 'audio') {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = dataUrl;
      const entry = { type: 'audio', data: audio, url: dataUrl, dataUrl, file: null, mime, path, fromStorage: true };
      this.assets.set(path, entry);
      return entry;
    }

    let text = dataUrl;
    if (dataUrl.startsWith('data:')) {
      try {
        const b64 = dataUrl.split(',')[1] || '';
        text = atob(b64);
      } catch (_) {}
    }
    const entry = { type: 'text', data: text, url: dataUrl, dataUrl, file: null, mime, path, fromStorage: true };
    this.assets.set(path, entry);
    return entry;
  }

  getAsset(path) {
    return this.assets.get(path)?.data || null;
  }

  playSFX(path, { volume = 1, loop = false } = {}) {
    const asset = this.assets.get(path);
    if (!asset || asset.type !== 'audio') {
      this.log(`SFX not found: ${path}`, 'warn');
      return null;
    }

    const a = asset.data.cloneNode ? asset.data.cloneNode() : new Audio(asset.url);
    a.volume = Math.max(0, Math.min(1, volume));
    a.loop = loop;
    a.play().catch(() => {});
    return a;
  }

  setBackgroundColor(r, g, b, a = 1) {
    if (typeof r === 'object') {
      this.bgColor = { r: r.r, g: r.g, b: r.b, a: r.a != null ? r.a : 1 };
    } else {
      this.bgColor = { r, g, b, a };
    }
    if (this.scene3D && THREE) {
      this.scene3D.background = new THREE.Color(this.bgColor.r, this.bgColor.g, this.bgColor.b);
    }
  }

  setBackgroundImage(pathOrImg, fit = 'cover') {
    this.bgFit = fit || 'cover';
    if (!pathOrImg) {
      this.bgImage = null;
      this.bgImagePath = '';
      if (this.scene3D && THREE) {
        this.scene3D.background = new THREE.Color(this.bgColor.r, this.bgColor.g, this.bgColor.b);
      }
      return;
    }
    if (typeof pathOrImg === 'string') {
      const asset = this.assets.get(pathOrImg);
      if (asset && asset.type === 'image') {
        this.bgImage = asset.data;
        this.bgImagePath = pathOrImg;
      } else if (pathOrImg.startsWith('data:') || pathOrImg.startsWith('http')) {
        const img = new Image();
        img.src = pathOrImg;
        this.bgImage = img;
        this.bgImagePath = pathOrImg.slice(0, 40);
      }
    } else {
      this.bgImage = pathOrImg;
      this.bgImagePath = pathOrImg.src || 'image';
    }
    if (this.scene3D && THREE && this.bgImage) {
      try {
        const tex = new THREE.Texture(this.bgImage);
        tex.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
        tex.needsUpdate = true;
        this.scene3D.background = tex;
      } catch (_) {
        this.scene3D.background = new THREE.Color(this.bgColor.r, this.bgColor.g, this.bgColor.b);
      }
    }
  }

  clearBackgroundImage() {
    this.setBackgroundImage(null);
  }

  createNode(type, name) {
    const map = {
      Node2D, Sprite2D, Camera2D, Label, Button,
      Node3D, MeshInstance3D, Camera3D, Light3D,
      Node
    };
    const Cls = map[type] || Node;
    const node = new Cls(name || type);
    node.engine = this;
    return node;
  }

  getAllNodes(node = this.scene.root, list = []) {
    list.push(node);
    for (const c of node.children) this.getAllNodes(c, list);
    return list;
  }

  findCurrentCamera2D() {
    return this.getAllNodes().find(n => n.type === 'Camera2D' && n.current) || null;
  }

  findCurrentCamera3D() {
    return this.getAllNodes().find(n => n.type === 'Camera3D' && n.current) || null;
  }

  attachScript(node, code) {
    node.script = code;
    try {

      const fn = new Function('engine', 'input', 'time', 'node', `
        ${code}
        return { _ready: typeof _ready === 'function' ? _ready : null, _process: typeof _process === 'function' ? _process : null };
      `);
      const instance = fn(this, this.input, { delta: 0 }, node);
      node._scriptInstance = instance;
      if (instance._ready) instance._ready.call(node);
      this.log(`Script attached to ${node.name}`, 'success');
    } catch (e) {
      this.log(`Script error on ${node.name}: ${e.message}`, 'error');
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this._resize();
    window.addEventListener('resize', () => this._resize());
    requestAnimationFrame(t => this._loop(t));
    this.log('Engine started', 'success');
  }

  play() {
    this.playing = true;

    this.getAllNodes().forEach(n => {
      if (n._scriptInstance?._ready) n._scriptInstance._ready.call(n);
      if (typeof n._ready === 'function') n._ready();
    });
    this.log('Playing scene', 'success');
  }

  stop() {
    this.playing = false;
    this.log('Stopped', 'info');
  }

  _loop(now) {
    if (!this.running) return;
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.fps = Math.round(1 / delta);

    if (this.playing) {
      this.getAllNodes().forEach(n => {
        if (n._scriptInstance?._process) n._scriptInstance._process.call(n, delta);
        if (typeof n._process === 'function') n._process(delta);
      });
    }

    this._render();
    requestAnimationFrame(t => this._loop(t));
  }

  _render() {
    if (this.mode === '2d') {
      this._render2D();
    } else {
      this._render3D();
    }
  }

  _render2D() {
    if (!this.ctx && this.canvas2d) this.ctx = this.canvas2d.getContext('2d', { alpha: false });
    const ctx = this.ctx;
    if (!ctx || !this.canvas2d) return;
    const w = this.canvas2d.width;
    const h = this.canvas2d.height;
    ctx.clearRect(0, 0, w, h);
    const br = Math.round(this.bgColor.r * 255);
    const bg = Math.round(this.bgColor.g * 255);
    const bb = Math.round(this.bgColor.b * 255);
    ctx.fillStyle = 'rgb(' + br + ',' + bg + ',' + bb + ')';
    ctx.fillRect(0, 0, w, h);
    if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth) {
      const iw = this.bgImage.naturalWidth;
      const ih = this.bgImage.naturalHeight;
      const fit = this.bgFit || 'cover';
      if (fit === 'stretch') {
        ctx.drawImage(this.bgImage, 0, 0, w, h);
      } else if (fit === 'contain') {
        const s = Math.min(w / iw, h / ih);
        const dw = iw * s, dh = ih * s;
        ctx.drawImage(this.bgImage, (w - dw) / 2, (h - dh) / 2, dw, dh);
      } else {
        const s = Math.max(w / iw, h / ih);
        const dw = iw * s, dh = ih * s;
        ctx.drawImage(this.bgImage, (w - dw) / 2, (h - dh) / 2, dw, dh);
      }
    }

    const cam = this.findCurrentCamera2D();
    ctx.save();
    if (cam) {
      ctx.translate(w / 2, h / 2);
      ctx.scale(cam.zoom.x, cam.zoom.y);
      ctx.translate(-cam.position.x - cam.offset.x, -cam.position.y - cam.offset.y);
    }

    const nodes = this.getAllNodes().filter(n => n._draw).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    for (const n of nodes) {
      if (n.visible) n._draw(ctx);
    }
    ctx.restore();
  }

  _render3D() {
    if (!this.renderer3D || !this.scene3D) return;
    this.getAllNodes().forEach(n => {
      if (n._update3D) n._update3D();
      if (n.threeObject && !n.threeObject.parent && n.type !== 'Camera3D' && n.threeObject.type !== 'TransformControlsPlane') {
        if (!this.transformControls || n.threeObject !== this.transformControls.getHelper()) {
          this.scene3D.add(n.threeObject);
        }
      }
    });
    if (this.orbitControls) this.orbitControls.update();
    const cam = this.camera3D;
    if (!cam) return;
    this.renderer3D.render(this.scene3D, cam);
  }

  serializeProject() {
    return {
      name: 'XMZ Project',
      version: '1.0',
      mode: this.mode,
      background: {
        color: this.bgColor,
        imagePath: this.bgImagePath || '',
        fit: this.bgFit || 'cover'
      },
      scene: this.scene.serialize(),
      assets: Array.from(this.assets.keys())
    };
  }
}

export const NODE_TYPES = {
  '2d': ['Node2D', 'Sprite2D', 'Camera2D', 'Label', 'Button'],
  '3d': ['Node3D', 'MeshInstance3D', 'Camera3D', 'Light3D'],
  common: ['Node', 'Script']
};
