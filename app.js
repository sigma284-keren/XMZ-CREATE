import { Engine, NODE_TYPES } from './engine/core.js';

const state = {
  engine: null,
  selectedNode: null,
  mode: '2d',
  isLandscapeFS: false,
  mobileControls: {
    enabled: true,
    always: false,
    preset: 'platformer'
  }
};

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

const canvas = $('#viewport');
const canvas3d = $('#viewport3d');
const sceneTree = $('#scene-tree');
const assetList = $('#asset-list');
const inspector = $('#inspector');
const scriptEditor = $('#script-editor');
const consoleOut = $('#console-output');
const fpsCounter = $('#fps-counter');
const modeLabel = $('#mode-label');
const playOverlay = $('#play-overlay');
const modalAddNode = $('#modal-add-node');
const rotateBtn = $('#rotate-btn');
const floatRotateBtn = $('#float-rotate-btn');
const orientLabel = $('#orient-label');
const mobileControlsEl = $('#mobile-controls');
const mcJoystick = $('#mc-joystick');
const mcJoyStick = $('#mc-joy-stick');
const mcDpad = $('#mc-dpad');

function log(msg, type = 'info') {
  try {
    console.log('[XMZ]', msg);
    if (!consoleOut) return;
    const line = document.createElement('div');
    line.className = 'log-line ' + type;
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    line.textContent = '[' + time + '] ' + msg;
    consoleOut.appendChild(line);
    consoleOut.scrollTop = consoleOut.scrollHeight;
  } catch (_) {}
}

async function init() {
  try {
    if (!canvas) throw new Error('Canvas #viewport tidak ditemukan');
    state.engine = new Engine(canvas, canvas3d);
    state.engine.onLog = log;
    state.engine.onNodePicked = (node) => selectNode(node);
    state.engine.onNodeTransformed = (node) => {
      if (state.selectedNode === node) renderInspector(node);
    };
    state.engine.start();

    createDefaultScene();
    bindUI();
    renderSceneTree();

    setInterval(() => {
      if (fpsCounter && state.engine) {
        fpsCounter.textContent = 'FPS: ' + (state.engine.fps || 0);
      }
    }, 250);

    try {
      await restoreAssetsFromLocalStorage();
      renderAssets();
    } catch (e) {
      log('Restore assets gagal: ' + (e.message || e), 'warn');
    }

    updateMemoryUI();
    log('XMZ CREATE ready', 'success');
    log('Upload asset = Memory', 'info');
  } catch (err) {
    console.error(err);
    const msg = 'INIT ERROR: ' + (err && err.message ? err.message : err);
    log(msg, 'error');
    if (fpsCounter) fpsCounter.textContent = 'FPS: ERR';
    alert(msg);
  }
}

function createDefaultScene() {
  const eng = state.engine;

  eng.scene.root.children = [];

  if (state.mode === '2d') {
    const cam = eng.createNode('Camera2D', 'Camera2D');
    cam.position = { x: 0, y: 0 };
    eng.scene.root.addChild(cam);

    const label = eng.createNode('Label', 'Welcome');
    label.text = 'XMZ CREATE';
    label.position = { x: -60, y: -20 };
    label.fontSize = 28;
    eng.scene.root.addChild(label);

    const btn = eng.createNode('Button', 'StartBtn');
    btn.text = 'Hello World';
    btn.position = { x: -60, y: 30 };
    eng.scene.root.addChild(btn);
  } else {
    const cam = eng.createNode('Camera3D', 'Camera3D');
    cam.position = { x: 0, y: 2, z: 5 };
    eng.scene.root.addChild(cam);

    const mesh = eng.createNode('MeshInstance3D', 'Cube');
    mesh.position = { x: 0, y: 0.5, z: 0 };
    eng.scene.root.addChild(mesh);

    const light = eng.createNode('Light3D', 'Sun');
    light.position = { x: 3, y: 5, z: 2 };
    eng.scene.root.addChild(light);
  }
}

function renderSceneTree() {
  sceneTree.innerHTML = '';
  const root = state.engine.scene.root;
  sceneTree.appendChild(createTreeItem(root, true));
}

function createTreeItem(node, isRoot = false) {
  const item = document.createElement('div');
  item.className = 'tree-item' + (state.selectedNode === node ? ' selected' : '');
  item.dataset.id = node.id;

  const icons = {
    Node: 'fa-circle-nodes', Node2D: 'fa-square', Sprite2D: 'fa-image', Camera2D: 'fa-camera',
    Label: 'fa-font', Button: 'fa-square-check', Node3D: 'fa-cube', MeshInstance3D: 'fa-boxes-stacked',
    Camera3D: 'fa-video', Light3D: 'fa-lightbulb', Script: 'fa-code'
  };
  const icon = icons[node.type] || 'fa-circle';

  item.innerHTML = `<span class="icon"><i class="fa-solid ${icon}"></i></span><span>${node.name}</span>`;
  item.addEventListener('click', e => {
    e.stopPropagation();
    selectNode(node);
  });

  const wrapper = document.createElement('div');
  wrapper.appendChild(item);

  if (node.children.length) {
    const children = document.createElement('div');
    children.className = 'tree-children';
    node.children.forEach(c => children.appendChild(createTreeItem(c)));
    wrapper.appendChild(children);
  }
  return wrapper;
}

function selectNode(node) {
  state.selectedNode = node;
  renderSceneTree();
  renderInspector(node);
  if (node && node.script) {
    scriptEditor.value = node.script;
  } else if (node) {
    scriptEditor.value = 'function _ready() {\n  console.log(\'' + node.name + ' ready\');\n}\n\nfunction _process(delta) {\n}';
  }
  if (state.engine && state.engine.mode === '3d') {
    state.engine.attachEditorNode(node);
  }
}

function renderInspector(node) {
  if (!node) {
    inspector.innerHTML = '<p class="placeholder">Select a node to inspect</p>';
    return;
  }

  let html = `<div class="prop-row"><label>Name</label><input type="text" data-prop="name" value="${node.name}" /></div>`;
  html += `<div class="prop-row"><label>Type</label><input type="text" value="${node.type}" disabled /></div>`;
  html += `<div class="prop-row"><label>Visible</label><input type="checkbox" data-prop="visible" ${node.visible ? 'checked' : ''} /></div>`;

  if (node.position) {
    if (node.position.z !== undefined) {
      html += `<div class="prop-row"><label>Position</label><div class="prop-vec">
        <input type="number" step="0.1" data-prop="position.x" value="${node.position.x}" placeholder="X"/>
        <input type="number" step="0.1" data-prop="position.y" value="${node.position.y}" placeholder="Y"/>
        <input type="number" step="0.1" data-prop="position.z" value="${node.position.z}" placeholder="Z"/>
      </div></div>`;
    } else {
      html += `<div class="prop-row"><label>Position</label><div class="prop-vec">
        <input type="number" step="1" data-prop="position.x" value="${node.position.x}" placeholder="X"/>
        <input type="number" step="1" data-prop="position.y" value="${node.position.y}" placeholder="Y"/>
      </div></div>`;
    }
  }

  if (node.rotation !== undefined && typeof node.rotation === 'number') {
    html += '<div class="prop-row"><label>Rotation</label><input type="number" step="0.01" data-prop="rotation" value="' + node.rotation + '" /></div>';
  } else if (node.rotation && typeof node.rotation === 'object' && node.rotation.z !== undefined) {
    html += '<div class="prop-row"><label>Rotation</label><div class="prop-vec">' +
      '<input type="number" step="0.05" data-prop="rotation.x" value="' + node.rotation.x + '" placeholder="X"/>' +
      '<input type="number" step="0.05" data-prop="rotation.y" value="' + node.rotation.y + '" placeholder="Y"/>' +
      '<input type="number" step="0.05" data-prop="rotation.z" value="' + node.rotation.z + '" placeholder="Z"/>' +
      '</div></div>';
  }
  if (node.scale) {
    if (node.scale.z !== undefined) {
      html += `<div class="prop-row"><label>Scale</label><div class="prop-vec">
        <input type="number" step="0.1" data-prop="scale.x" value="${node.scale.x}"/>
        <input type="number" step="0.1" data-prop="scale.y" value="${node.scale.y}"/>
        <input type="number" step="0.1" data-prop="scale.z" value="${node.scale.z}"/>
      </div></div>`;
    } else {
      html += `<div class="prop-row"><label>Scale</label><div class="prop-vec">
        <input type="number" step="0.1" data-prop="scale.x" value="${node.scale.x}"/>
        <input type="number" step="0.1" data-prop="scale.y" value="${node.scale.y}"/>
      </div></div>`;
    }
  }

  if (node.type === 'Sprite2D') {
    html += `<div class="prop-row"><label>Texture</label><input type="text" data-prop="texturePath" value="${node.texturePath || ''}" placeholder="asset name" /></div>`;
  }
  if (node.type === 'Label') {
    html += `<div class="prop-row"><label>Text</label><input type="text" data-prop="text" value="${node.text}" /></div>`;
    html += `<div class="prop-row"><label>Font Size</label><input type="number" data-prop="fontSize" value="${node.fontSize}" /></div>`;
  }
  if (node.type === 'Button') {
    html += `<div class="prop-row"><label>Text</label><input type="text" data-prop="text" value="${node.text}" /></div>`;
  }
  if (node.type === 'MeshInstance3D') {
    const hex = rgbToHex(node.color || { r: 0.4, g: 0.5, b: 0.9 });
    html += '<div class="prop-row"><label>Mesh</label><select data-prop="meshType">' +
      '<option value="box"' + (node.meshType==='box'?' selected':'') + '>Box</option>' +
      '<option value="sphere"' + (node.meshType==='sphere'?' selected':'') + '>Sphere</option>' +
      '<option value="plane"' + (node.meshType==='plane'?' selected':'') + '>Plane</option>' +
      '<option value="cylinder"' + (node.meshType==='cylinder'?' selected':'') + '>Cylinder</option>' +
      '</select></div>';
    html += '<div class="prop-row"><label>Color</label><input type="color" data-prop="colorHex" value="' + hex + '" /></div>';
  }
  if (node.type === 'Camera2D') {
    html += `<div class="prop-row"><label>Current</label><input type="checkbox" data-prop="current" ${node.current?'checked':''} /></div>`;
  }
  if (node.type === 'Camera3D') {
    html += `<div class="prop-row"><label>FOV</label><input type="number" data-prop="fov" value="${node.fov}" /></div>`;
    html += `<div class="prop-row"><label>Current</label><input type="checkbox" data-prop="current" ${node.current?'checked':''} /></div>`;
  }

  inspector.innerHTML = html;

  inspector.querySelectorAll('[data-prop]').forEach(el => {
    const prop = el.dataset.prop;
    const handler = () => {
      applyProp(node, prop, el.type === 'checkbox' ? el.checked : (el.type === 'number' ? parseFloat(el.value) : el.value));
    };
    el.addEventListener('change', handler);
    el.addEventListener('input', handler);
  });
}

function applyProp(node, prop, value) {
  if (prop.includes('.')) {
    const [obj, key] = prop.split('.');
    node[obj][key] = value;
  } else {
    node[prop] = value;
  }

  if (prop === 'texturePath' && node.type === 'Sprite2D') {
    const asset = state.engine.getAsset(value);
    if (asset) node.texture = asset;
  }
  if (prop === 'meshType' && node.type === 'MeshInstance3D') {
    node._rebuildMesh();
  }
  if (prop === 'name') {
    renderSceneTree();
  }
  if (prop === 'fov' && node.type === 'Camera3D' && node.threeObject) {
    node.threeObject.fov = value;
    node.threeObject.updateProjectionMatrix();
  }
  if (prop === 'colorHex' && node.type === 'MeshInstance3D') {
    const rgb = hexToRgb(value);
    if (node.setColor) node.setColor(rgb.r, rgb.g, rgb.b);
    else {
      node.color = rgb;
      if (node._rebuildMesh) node._rebuildMesh();
    }
  }
  if (state.engine && state.engine.mode === '3d' && node && node._update3D) {
    node._update3D();
  }
}

function rgbToHex(c) {
  const r = Math.round((c.r || 0) * 255);
  const g = Math.round((c.g || 0) * 255);
  const b = Math.round((c.b || 0) * 255);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
    a: 1
  };
}

const LS_ASSETS_KEY = 'xmz_create_assets';
const LS_MAX_BYTES = 4.5 * 1024 * 1024;

function formatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

function estimateAssetBytes(asset) {
  const dataUrl = asset.dataUrl || (asset.url && String(asset.url).startsWith('data:') ? asset.url : '');
  return dataUrl ? dataUrl.length : 0;
}

function getMemoryUsed() {
  let used = 0;
  for (const asset of state.engine.assets.values()) {
    used += estimateAssetBytes(asset);
  }
  try {
    const raw = localStorage.getItem(LS_ASSETS_KEY);
    if (raw && raw.length > used) used = raw.length;
  } catch (_) {}
  return used;
}

function getMemoryInfo() {
  const used = getMemoryUsed();
  const max = LS_MAX_BYTES;
  const ratio = Math.min(1, used / max);
  return { used, max, ratio, free: Math.max(0, max - used) };
}

function updateMemoryUI() {
  const info = getMemoryInfo();
  const text = document.getElementById('memory-text');
  const fill = document.getElementById('memory-fill');
  if (text) text.textContent = formatBytes(info.used) + ' / ' + formatBytes(info.max);
  if (fill) {
    fill.style.width = (info.ratio * 100).toFixed(1) + '%';
    fill.classList.remove('warn', 'full');
    if (info.ratio >= 0.95) fill.classList.add('full');
    else if (info.ratio >= 0.75) fill.classList.add('warn');
  }
  return info;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, b64] = dataUrl.split(',');
  const mime = (header.match(/:(.*?);/) || [])[1] || 'application/octet-stream';
  const bin = atob(b64 || '');
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function buildAssetsPayload() {
  const items = [];
  for (const [path, asset] of state.engine.assets) {
    const dataUrl = asset.dataUrl || (asset.url && String(asset.url).startsWith('data:') ? asset.url : null);
    if (!dataUrl) continue;
    items.push({
      path,
      type: asset.type,
      mime: asset.mime || 'application/octet-stream',
      dataUrl
    });
  }
  return JSON.stringify({ version: 1, savedAt: Date.now(), items });
}

async function saveAssetsToLocalStorage() {
  try {
    const payload = buildAssetsPayload();
    if (payload.length > LS_MAX_BYTES) {
      const msg = 'Memory penuh (' + formatBytes(payload.length) + ' / ' + formatBytes(LS_MAX_BYTES) + '). Hapus asset dulu.';
      log(msg, 'error');
      alert(msg);
      updateMemoryUI();
      return false;
    }
    localStorage.setItem(LS_ASSETS_KEY, payload);
    log('Assets disimpan (' + state.engine.assets.size + ' file, ' + formatBytes(payload.length) + ')', 'info');
    updateMemoryUI();
    return true;
  } catch (err) {
    const full = err && (err.name === 'QuotaExceededError' || /quota/i.test(err.message || ''));
    const msg = full
      ? 'Memory penuh! Hapus beberapa asset lalu coba lagi.'
      : ('Gagal simpan Memory: ' + (err.message || err));
    log(msg, 'error');
    alert(msg);
    updateMemoryUI();
    return false;
  }
}

async function restoreAssetsFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_ASSETS_KEY);
    if (!raw) {
      updateMemoryUI();
      return 0;
    }
    const parsed = JSON.parse(raw);
    const items = parsed.items || [];
    let n = 0;
    for (const item of items) {
      if (!item.path || !item.dataUrl) continue;
      await state.engine.loadAssetFromDataUrl(item.path, item.type, item.mime, item.dataUrl);
      n++;
    }
    if (n > 0) log('Restore ' + n + ' asset dari Memory', 'success');
    updateMemoryUI();
    return n;
  } catch (err) {
    log('Gagal restore Memory: ' + (err.message || err), 'warn');
    updateMemoryUI();
    return 0;
  }
}

function clearAssetsLocalStorage() {
  try {
    localStorage.removeItem(LS_ASSETS_KEY);
    log('Memory dibersihkan', 'success');
  } catch (_) {}
  updateMemoryUI();
}

async function removeAsset(path) {
  const asset = state.engine.assets.get(path);
  if (!asset) return;
  state.engine.assets.delete(path);
  const ok = await saveAssetsToLocalStorage();
  renderAssets();
  if (ok) log('Asset dihapus: ' + path, 'success');
}

function renderAssets() {
  assetList.innerHTML = '';
  for (const [path, asset] of state.engine.assets) {
    const item = document.createElement('div');
    item.className = 'asset-item';
    const sizeLabel = formatBytes(estimateAssetBytes(asset));

    const del = document.createElement('button');
    del.className = 'asset-del';
    del.type = 'button';
    del.title = 'Hapus asset';
    del.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Hapus asset "' + path + '" dari Memory?')) {
        removeAsset(path);
      }
    });

    if (asset.type === 'image') {
      item.innerHTML = '<img src="' + asset.url + '" alt="' + path + '" /><div class="name">' + path + '</div><div class="asset-size">' + sizeLabel + '</div>';
      item.title = 'Klik: assign Sprite2D | Tombol BG: background';
      const bgBtn = document.createElement('button');
      bgBtn.type = 'button';
      bgBtn.className = 'asset-bg-btn';
      bgBtn.title = 'Set as background';
      bgBtn.innerHTML = '<i class="fa-solid fa-image"></i>';
      bgBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fitEl = document.getElementById('bg-fit');
        const fit = fitEl ? fitEl.value : 'cover';
        state.engine.setBackgroundImage(path, fit);
        refreshBgSelect();
        const sel = document.getElementById('bg-image-select');
        if (sel) sel.value = path;
        log('Background: ' + path, 'success');
      });
      item.appendChild(bgBtn);
      item.addEventListener('click', () => {
        if (state.selectedNode && state.selectedNode.type === 'Sprite2D') {
          state.selectedNode.texture = asset.data;
          state.selectedNode.texturePath = path;
          renderInspector(state.selectedNode);
          log('Assigned ' + path + ' to ' + state.selectedNode.name, 'success');
        } else {
          state.engine.setBackgroundImage(path, (document.getElementById('bg-fit') || {}).value || 'cover');
          refreshBgSelect();
          log('Background set: ' + path + ' (atau pilih Sprite2D untuk texture)', 'info');
        }
      });
    } else if (asset.type === 'audio') {
      item.innerHTML = '<div class="asset-icon"><i class="fa-solid fa-music"></i></div><div class="name">' + path + '</div><div class="asset-size">' + sizeLabel + '</div>';
      item.title = 'Klik preview SFX';
      item.addEventListener('click', () => {
        state.engine.playSFX(path);
        log('Play SFX: ' + path, 'info');
      });
    } else {
      item.innerHTML = '<div class="asset-icon"><i class="fa-solid fa-file-code"></i></div><div class="name">' + path + '</div><div class="asset-size">' + sizeLabel + '</div>';
      item.title = path;
    }

    item.appendChild(del);
    assetList.appendChild(item);
  }
  updateMemoryUI();
  refreshBgSelect();
}

function applyMobilePreset(preset) {
  state.mobileControls.preset = preset;
  if (!mobileControlsEl) return;
  mobileControlsEl.classList.remove('preset-platformer', 'preset-leftright', 'preset-joystick', 'preset-full');
  mobileControlsEl.classList.add('preset-' + preset);

  const showJoy = preset === 'joystick' || preset === 'full' || preset === 'platformer';
  const showDpad = preset === 'leftright' || preset === 'full';

  mcJoystick?.classList.toggle('hidden', !showJoy);
  mcDpad?.classList.toggle('hidden', !showDpad);

  if (preset === 'platformer') {
    mcJoystick?.classList.remove('hidden');
    mcDpad?.classList.add('hidden');
  }
}

function updateMobileControlsVisibility() {
  if (!mobileControlsEl) return;
  const mc = state.mobileControls;
  const show = mc.always || (mc.enabled && state.engine?.playing);
  mobileControlsEl.classList.toggle('hidden', !show);
}

function bindMobileControls() {
  if (!mobileControlsEl) return;

  const en = $('#mc-enabled');
  const al = $('#mc-always');
  const pr = $('#mc-preset');
  if (en) {
    en.checked = state.mobileControls.enabled;
    en.addEventListener('change', () => {
      state.mobileControls.enabled = en.checked;
      updateMobileControlsVisibility();
    });
  }
  if (al) {
    al.checked = state.mobileControls.always;
    al.addEventListener('change', () => {
      state.mobileControls.always = al.checked;
      updateMobileControlsVisibility();
    });
  }
  if (pr) {
    pr.value = state.mobileControls.preset;
    pr.addEventListener('change', () => applyMobilePreset(pr.value));
  }

  $('#mobile-controls-toggle')?.addEventListener('click', () => {
    state.mobileControls.always = !state.mobileControls.always;
    if (al) al.checked = state.mobileControls.always;
    updateMobileControlsVisibility();
    log(state.mobileControls.always ? 'Mobile controls shown' : 'Mobile controls hidden', 'info');
  });

  applyMobilePreset(state.mobileControls.preset);

  mobileControlsEl.querySelectorAll('.mc-btn[data-action]').forEach(btn => {
    const action = btn.dataset.action;

    const press = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add('pressed');
      state.engine?.input.setAction(action, true);
    };
    const release = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.remove('pressed');
      state.engine?.input.setAction(action, false);
    };

    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('pointercancel', release);
  });

  const base = mcJoystick?.querySelector('.mc-joy-base');
  if (base && mcJoyStick) {
    let active = false;
    let pointerId = null;
    const maxRadius = 40;

    const setStick = (clientX, clientY) => {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }
      mcJoyStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      const nx = dx / maxRadius;
      const ny = dy / maxRadius;
      state.engine?.input.setAxis(nx, ny);
    };

    const resetStick = () => {
      active = false;
      pointerId = null;
      base.classList.remove('active');
      mcJoyStick.style.transform = 'translate(-50%, -50%)';
      state.engine?.input.setAxis(0, 0);
    };

    base.addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      active = true;
      pointerId = e.pointerId;
      base.setPointerCapture?.(e.pointerId);
      base.classList.add('active');
      setStick(e.clientX, e.clientY);
    });
    base.addEventListener('pointermove', e => {
      if (!active || e.pointerId !== pointerId) return;
      e.preventDefault();
      setStick(e.clientX, e.clientY);
    });
    base.addEventListener('pointerup', e => {
      if (e.pointerId !== pointerId) return;
      resetStick();
    });
    base.addEventListener('pointercancel', resetStick);
    base.addEventListener('pointerleave', e => {
      if (active && e.pointerId === pointerId) resetStick();
    });
  }

  updateMobileControlsVisibility();
}

async function toggleRotateFullscreen() {
  if (state.isLandscapeFS) {
    await exitLandscapeFullscreen();
  } else {
    await enterLandscapeFullscreen();
  }
}

async function enterLandscapeFullscreen() {
  try {

    const el = document.documentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
    }

    if (screen.orientation && screen.orientation.lock) {
      try {
        await screen.orientation.lock('landscape');
      } catch (orientErr) {

        log('Orientation lock not supported on this device (fullscreen only)', 'warn');
      }
    }

    state.isLandscapeFS = true;
    updateRotateUI(true);

    setTimeout(() => {
      if (state.engine) state.engine._resize();
    }, 100);
    log('Landscape + Fullscreen ON', 'success');
  } catch (err) {
    log('Gagal masuk fullscreen: ' + (err.message || err), 'error');

    state.isLandscapeFS = false;
    updateRotateUI(false);
  }
}

async function exitLandscapeFullscreen() {
  try {

    if (screen.orientation && screen.orientation.unlock) {
      try {
        screen.orientation.unlock();
      } catch (_) {  }
    }

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    }

    state.isLandscapeFS = false;
    updateRotateUI(false);
    setTimeout(() => {
      if (state.engine) state.engine._resize();
    }, 100);
    log('Kembali ke Portrait (fullscreen off)', 'info');
  } catch (err) {
    log('Gagal keluar fullscreen: ' + (err.message || err), 'error');
  }
}

function updateRotateUI(active) {
  rotateBtn?.classList.toggle('active', active);
  floatRotateBtn?.classList.toggle('active', active);
  document.body.classList.toggle('is-landscape-fs', active);
  if (orientLabel) {
    orientLabel.textContent = active ? 'Landscape FS' : 'Portrait';
  }
}

function syncFullscreenState() {
  const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
  if (!isFS && state.isLandscapeFS) {

    state.isLandscapeFS = false;
    if (screen.orientation?.unlock) {
      try { screen.orientation.unlock(); } catch (_) {}
    }
    updateRotateUI(false);
    if (state.engine) state.engine._resize();
    log('Fullscreen exited by system', 'info');
  }
}


function refreshBgSelect() {
  const sel = document.getElementById('bg-image-select');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">(none)</option>';
  for (const [path, asset] of state.engine.assets) {
    if (asset.type !== 'image') continue;
    const opt = document.createElement('option');
    opt.value = path;
    opt.textContent = path;
    sel.appendChild(opt);
  }
  if (state.engine.bgImagePath) sel.value = state.engine.bgImagePath;
  else sel.value = cur || '';
}

function applyBackgroundFromUI() {
  if (!state.engine) return;
  const colorEl = document.getElementById('bg-color');
  const fitEl = document.getElementById('bg-fit');
  const imgEl = document.getElementById('bg-image-select');
  if (colorEl) {
    const hex = colorEl.value;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    state.engine.setBackgroundColor(r, g, b);
  }
  const fit = fitEl ? fitEl.value : 'cover';
  const path = imgEl ? imgEl.value : '';
  if (path) state.engine.setBackgroundImage(path, fit);
  else {
    state.engine.bgFit = fit;
    if (!path) state.engine.clearBackgroundImage();
  }
  log('Background updated', 'success');
}

function closeMobilePanels() {
  document.body.classList.remove('show-left-panel', 'show-right-panel', 'show-console');
  document.querySelectorAll('#mobile-nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.panel === 'none');
  });
}

function openMobilePanel(panel) {
  document.body.classList.remove('show-left-panel', 'show-right-panel', 'show-console');
  document.querySelectorAll('#mobile-nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.panel === panel);
  });
  if (panel === 'left') document.body.classList.add('show-left-panel');
  if (panel === 'right') document.body.classList.add('show-right-panel');
  if (panel === 'console') document.body.classList.add('show-console');
}


function bindUI() {

  $$('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'new') newProject();
      if (action === 'save') saveProject();
      if (action === 'export') exportZip();
      if (action === 'play') playScene();
      if (action === 'stop') stopScene();
      if (action === 'open') openProject();
    });
  });

  rotateBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleRotateFullscreen();
  });
  floatRotateBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleRotateFullscreen();
  });

  document.addEventListener('fullscreenchange', syncFullscreenState);
  document.addEventListener('webkitfullscreenchange', syncFullscreenState);

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      if (state.engine) state.engine._resize();
      const type = screen.orientation?.type || '';
      if (orientLabel && !state.isLandscapeFS) {
        orientLabel.textContent = type.includes('landscape') ? 'Landscape' : 'Portrait';
      }
    }, 150);
  });
  window.addEventListener('resize', () => {
    if (state.engine) state.engine._resize();
  });

  $$('.mode-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mode = btn.dataset.mode;
      const ok = await state.engine.setMode(mode);
      if (!ok && mode === '3d') {
        log('Mode 3D gagal dimuat', 'error');
        return;
      }
      $$('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = state.engine.mode;
      if (modeLabel) modeLabel.textContent = 'Mode: ' + state.mode.toUpperCase();
      const tools = document.getElementById('tools-3d');
      if (tools) tools.classList.toggle('hidden', state.mode !== '3d');
      createDefaultScene();
      state.selectedNode = null;
      renderSceneTree();
      renderInspector(null);
      if (state.mode === '3d') {
        const cube = state.engine.scene.root.getChild('Cube');
        if (cube) selectNode(cube);
      }
      log('Switched to ' + state.mode.toUpperCase() + ' mode', 'info');
    });
  });

  document.querySelectorAll('.tool-3d').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-3d').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (state.engine) state.engine.setEditMode3D(btn.dataset.tool);
      log('3D tool: ' + btn.dataset.tool, 'info');
    });
  });

  window.addEventListener('keydown', (e) => {
    if (state.engine && state.engine.mode === '3d' && !e.target.matches('input,textarea')) {
      if (e.code === 'KeyG') {
        state.engine.setEditMode3D('translate');
        document.querySelectorAll('.tool-3d').forEach(b => b.classList.toggle('active', b.dataset.tool === 'translate'));
      }
      if (e.code === 'KeyR') {
        state.engine.setEditMode3D('rotate');
        document.querySelectorAll('.tool-3d').forEach(b => b.classList.toggle('active', b.dataset.tool === 'rotate'));
      }
      if (e.code === 'KeyS' && !e.ctrlKey) {
        state.engine.setEditMode3D('scale');
        document.querySelectorAll('.tool-3d').forEach(b => b.classList.toggle('active', b.dataset.tool === 'scale'));
      }
    }
  });

  const addNodeBtn = $('#add-node-btn');
  if (addNodeBtn) addNodeBtn.addEventListener('click', () => {
    if (modalAddNode) modalAddNode.classList.remove('hidden');
  });
  if (modalAddNode) {
    const closeBtn = modalAddNode.querySelector('.close-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => modalAddNode.classList.add('hidden'));
    modalAddNode.querySelectorAll('.node-types button').forEach(btn => {
      btn.addEventListener('click', () => {
        addNode(btn.dataset.type);
        modalAddNode.classList.add('hidden');
      });
    });
  }

  const assetUpload = $('#asset-upload');
  if (assetUpload) assetUpload.addEventListener('change', async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    log('Mengunggah ' + files.length + ' file ke Memory...', 'info');
    for (const f of files) {
      try {
        const info = getMemoryInfo();
        const estimated = Math.ceil(f.size * 1.37);
        if (info.used + estimated > LS_MAX_BYTES) {
          const msg = 'Memory tidak cukup untuk "' + f.name + '".\nDipakai: ' + formatBytes(info.used) + ' / ' + formatBytes(LS_MAX_BYTES) + '\nFile ~' + formatBytes(estimated) + '\n\nHapus asset lain dulu.';
          log(msg.replace(/\n/g, ' '), 'error');
          alert(msg);
          continue;
        }
        if (f.size > 3 * 1024 * 1024) {
          log(f.name + ' besar (>3MB). Bisa bikin Memory cepat penuh.', 'warn');
        }
        await state.engine.loadAsset(f);
        const ok = await saveAssetsToLocalStorage();
        if (!ok) {
          state.engine.assets.delete(f.name);
          renderAssets();
          break;
        }
      } catch (err) {
        log('Gagal load ' + f.name + ': ' + (err.message || err), 'error');
      }
    }
    renderAssets();
    e.target.value = '';
  });

  const runScriptBtn = $('#run-script-btn');
  if (runScriptBtn) runScriptBtn.addEventListener('click', () => {
    if (!state.selectedNode) {
      log('Select a node first', 'warn');
      return;
    }
    state.engine.attachScript(state.selectedNode, scriptEditor.value);
  });

  const clearConsole = $('#clear-console');
  if (clearConsole) clearConsole.addEventListener('click', () => {
    if (consoleOut) consoleOut.innerHTML = '';
  });

  window.addEventListener('keydown', e => {
    if (e.code === 'Escape' && state.engine.playing) {
      stopScene();
    }
  });


  const leftToggle = $('#toggle-left-panel');
  const rightToggle = $('#toggle-right-panel');
  leftToggle?.addEventListener('click', () => {
    document.body.classList.toggle('show-left-panel');
    document.body.classList.remove('show-right-panel');
  });
  rightToggle?.addEventListener('click', () => {
    document.body.classList.toggle('show-right-panel');
    document.body.classList.remove('show-left-panel');
  });


  const bgColor = document.getElementById('bg-color');
  const bgFit = document.getElementById('bg-fit');
  const bgImg = document.getElementById('bg-image-select');
  const bgClear = document.getElementById('bg-clear');
  if (bgColor) bgColor.addEventListener('input', applyBackgroundFromUI);
  if (bgFit) bgFit.addEventListener('change', applyBackgroundFromUI);
  if (bgImg) bgImg.addEventListener('change', applyBackgroundFromUI);
  if (bgClear) bgClear.addEventListener('click', () => {
    if (bgImg) bgImg.value = '';
    state.engine.clearBackgroundImage();
    log('Background image cleared', 'info');
  });

  document.querySelectorAll('#mobile-nav button').forEach(btn => {
    btn.addEventListener('click', () => openMobilePanel(btn.dataset.panel || 'none'));
  });
  const backdrop = document.getElementById('panel-backdrop');
  if (backdrop) backdrop.addEventListener('click', closeMobilePanels);

  bindMobileControls();
}

function addNode(type) {
  const parent = state.selectedNode || state.engine.scene.root;
  const node = state.engine.createNode(type, type);
  parent.addChild(node);

  if (type === 'Sprite2D') {

    const firstImg = [...state.engine.assets.values()].find(a => a.type === 'image');
    if (firstImg) {
      node.texture = firstImg.data;
      node.texturePath = [...state.engine.assets.entries()].find(([,a]) => a === firstImg)?.[0] || '';
    }
  }
  if (type === 'MeshInstance3D') {
    node._rebuildMesh();
  }

  selectNode(node);
  renderSceneTree();
  log(`Added ${type} under ${parent.name}`, 'success');
}

function playScene() {

  if (state.selectedNode && scriptEditor.value.trim()) {
    state.engine.attachScript(state.selectedNode, scriptEditor.value);
  }
  state.engine.play();
  playOverlay.classList.remove('hidden');
  updateMobileControlsVisibility();
}

function stopScene() {
  state.engine.stop();
  playOverlay.classList.add('hidden');
  state.engine.input.resetVirtual();
  updateMobileControlsVisibility();
}

function newProject() {
  if (!confirm('Buat project baru? Assets di localStorage juga akan dihapus.')) return;
  state.engine.assets.clear();
  clearAssetsLocalStorage();
  createDefaultScene();
  state.selectedNode = null;
  renderSceneTree();
  renderAssets();
  renderInspector(null);
  log('New project created', 'success');
}

function saveProject() {
  const data = state.engine.serializeProject();

  if (state.selectedNode) {
    state.selectedNode.script = scriptEditor.value;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'xmz-project.json';
  a.click();
  log('Project saved as JSON', 'success');
}

function openProject() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      state.mode = data.mode || '2d';
      await state.engine.setMode(state.mode);
      state.mode = state.engine.mode;
      $$('.mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === state.mode);
      });
      if (modeLabel) modeLabel.textContent = 'Mode: ' + state.mode.toUpperCase();

      createDefaultScene();
      log('Project metadata loaded (full scene restore coming soon)', 'info');
    } catch (err) {
      log('Failed to open project: ' + err.message, 'error');
    }
  };
  input.click();
}

async function exportZip() {
  log('Preparing export...', 'info');
  let exportOk = false;

  if (state.selectedNode) {
    state.selectedNode.script = scriptEditor.value;
  }

  const project = state.engine.serializeProject();
  const gameHtml = generateStandaloneGame(project);

  try {
    const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
    const zip = new JSZip();

    zip.file('index.html', gameHtml);
    zip.file('project.json', JSON.stringify(project, null, 2));
    zip.file('README.md', `# XMZ CREATE Export

Game exported from XMZ CREATE engine.

## How to run
Just open index.html in a browser (or serve with any static server).

## Structure
- index.html — playable game
- project.json — project data
- assets/ — images & SFX

Generated by XMZ CREATE
`);

    const assetsFolder = zip.folder('assets');
    for (const [path, asset] of state.engine.assets) {
      const dataUrl = asset.dataUrl || (asset.url && String(asset.url).startsWith('data:') ? asset.url : null);
      if (dataUrl) {
        assetsFolder.file(path, dataUrlToBlob(dataUrl));
      } else if (asset.file) {
        assetsFolder.file(path, asset.file);
      }
    }

    zip.file('engine/runtime.js', await fetch('./engine/core.js').then(r => r.text()).catch(() => 'runtime embedded in index.html'));

    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `xmz-game-${Date.now()}.zip`;
    a.click();
    exportOk = true;
    log('Export ZIP berhasil di-download!', 'success');
  } catch (err) {
    log('JSZip gagal, fallback ke HTML download: ' + err.message, 'warn');
    try {
      const blob = new Blob([gameHtml], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'xmz-game.html';
      a.click();
      exportOk = true;
      log('Fallback HTML berhasil di-download', 'success');
    } catch (err2) {
      log('Export gagal total: ' + (err2.message || err2), 'error');
      exportOk = false;
    }
  }

  if (exportOk) {
    clearAssetsLocalStorage();

  } else {
    log('localStorage assets tetap disimpan (export gagal)', 'warn');
  }
}

function generateStandaloneGame(project) {

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>XMZ Game — ${project.name || 'Exported'}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#000; overflow:hidden; }
    canvas { display:block; width:100vw; height:100vh; }
    #ui { position:fixed; top:10px; left:10px; color:#0f0; font:12px monospace; z-index:5; }
    #rotate-btn {
      position:fixed; bottom:20px; right:20px; width:52px; height:52px;
      border-radius:50%; background:#6c5ce7; color:#fff; border:none;
      font-size:24px; cursor:pointer; z-index:10;
      box-shadow:0 4px 16px rgba(108,92,231,0.5);
      display:flex; align-items:center; justify-content:center;
      -webkit-tap-highlight-color:transparent;
    }
    #rotate-btn.active { background:#00b894; }
    #rotate-btn.active span { display:inline-block; transform:rotate(90deg); }
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <div id="ui">XMZ CREATE Export | Tap ↻ for Landscape+FS</div>
  <button id="rotate-btn" title="Rotate + Fullscreen"><span>↻</span></button>
  <script type="importmap">
  { "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js" } }
  </script>
  <script type="module">
    import * as THREE from 'three';
    const project = ${JSON.stringify(project)};
    const canvas = document.getElementById('c');
    const mode = project.mode || '2d';
    let isLandscapeFS = false;
    const rotBtn = document.getElementById('rotate-btn');

    async function toggleRotateFS() {
      if (isLandscapeFS) {
        try { screen.orientation?.unlock?.(); } catch(e){}
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          await (document.exitFullscreen?.() || document.webkitExitFullscreen?.());
        }
        isLandscapeFS = false;
        rotBtn.classList.remove('active');
      } else {
        const el = document.documentElement;
        try {
          if (el.requestFullscreen) await el.requestFullscreen();
          else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        } catch(e){}
        try { await screen.orientation?.lock?.('landscape'); } catch(e){}
        isLandscapeFS = true;
        rotBtn.classList.add('active');
      }
      setTimeout(() => window.dispatchEvent(new Event('resize')), 120);
    }
    rotBtn.addEventListener('click', toggleRotateFS);
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && isLandscapeFS) {
        isLandscapeFS = false;
        rotBtn.classList.remove('active');
        try { screen.orientation?.unlock?.(); } catch(e){}
      }
    });

    if (mode === '2d') {
      const ctx = canvas.getContext('2d');
      function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      window.addEventListener('resize', resize);
      resize();

      function loop() {
        ctx.fillStyle = '#111';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = '#6c5ce7';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('XMZ CREATE Game', canvas.width/2, canvas.height/2 - 20);
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Mode: 2D | Tap ↻ for Landscape + Fullscreen', canvas.width/2, canvas.height/2 + 20);
        requestAnimationFrame(loop);
      }
      loop();
    } else {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x111111);
      const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
      camera.position.set(0, 2, 5);
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 10, 7);
      scene.add(light);
      scene.add(new THREE.AmbientLight(0x404040));
      scene.add(new THREE.GridHelper(20, 20));
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshStandardMaterial({ color: 0x6c5ce7 })
      );
      cube.position.y = 0.5;
      scene.add(cube);

      window.addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
      });

      function loop() {
        cube.rotation.y += 0.01;
        cube.rotation.x += 0.005;
        renderer.render(scene, camera);
        requestAnimationFrame(loop);
      }
      loop();
    }
  </script>
</body>
</html>`;
}

init().catch(err => {
  console.error(err);
  alert('Gagal start XMZ: ' + (err.message || err));
});
