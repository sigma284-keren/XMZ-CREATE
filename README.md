# XMZ-CREATE

**Web-based game engine** (Godot-like) — editor di browser, support **2D + 3D**, mobile controls, asset di localStorage, siap deploy **Vercel**.

Gratis untuk dipelajari, dimodifikasi, dan dibagikan.

---

## Fitur

| Area | Isi |
|------|-----|
| **Editor** | Scene Tree, Inspector, Viewport, Script Editor, Console |
| **2D** | Node2D, Sprite2D, Camera2D, Label, Button (Canvas) |
| **3D** | Node3D, MeshInstance3D, Camera3D, Light3D (Three.js) |
| **Edit 3D** | Orbit kamera, gizmo Move / Rotate / Scale, color picker, tap select (desktop + touch) |
| **Mobile** | Bottom nav, bottom sheet, joystick, D-Pad, tombol aksi |
| **Assets** | Upload gambar & SFX → **Memory (localStorage)**, hapus per-file, progress bar |
| **Background** | Warna solid atau gambar (cover / contain / stretch) |
| **Script** | `_ready()` / `_process(delta)` mirip Godot (JavaScript) |
| **Export** | Download ZIP (HTML playable + project + assets dari Memory) |
| **Rotate** | Landscape + fullscreen |
| **API** | Serverless `/api/health`, `/api/export`, `/api/upload` (metadata only) |

> **Penting:** file gambar/SFX **tidak** disimpan di server. Semua lewat **localStorage browser** (batas ~4.5 MB "Memory").
> Folder `assets/` di repo **opsional** — deploy **tanpa** folder itu **tetap work**.

---

## Yang wajib deploy

```
index.html
app.js
style.css
engine/core.js
lib/
api/
vercel.json
package.json   (opsional)
```

**Tidak wajib:** `assets/`, `scenes/`, `scripts/`, `README.md`

---

## Struktur lengkap (kalau ikut source penuh)

```
XMZ-CREATE/
├── index.html
├── style.css
├── app.js
├── engine/
│   └── core.js
├── lib/
│   ├── math.js
│   ├── input-helpers.js
│   └── tween.js
├── scripts/            # contoh (opsional)
├── api/
│   ├── health.js
│   ├── export.js
│   └── upload.js
├── assets/             # opsional, boleh dihapus
├── scenes/             # opsional
├── vercel.json
├── package.json
└── README.md
```

---

## Cara jalanin lokal

```bash
npx serve .
# atau
npm start
```

Buka URL yang muncul (mis. `http://localhost:3000`).

---

## Deploy Vercel

```bash
cd XMZ-CREATE
vercel --prod
```

Atau push ke GitHub → import di [vercel.com](https://vercel.com).

Root project = folder yang berisi `index.html` + `api/`.

---

## Cara pakai editor

1. **New** — project baru
2. **2D / 3D** — ganti mode
3. **+** — tambah node
4. **Upload** di Assets — gambar / audio (masuk Memory)
5. Assign texture ke **Sprite2D**, atau set **Background**
6. Tulis script → Run Script → **Play**
7. **Export ZIP** — download game (Memory dibersihkan jika export sukses)

### Mobile

- Bottom nav: **Scene · View · Edit · Log**
- Controls virtual saat Play
- 3D: 1 jari orbit, 2 jari pinch zoom, tap object + gizmo

### Script

```js
function _ready() {
  console.log(this.name + ' ready');
}

function _process(delta) {
  const axis = input.getAxis();
  this.position.x += axis.x * 200 * delta;

  if (input.isActionPressed('jump')) {
    // lompat
  }
}
```

**Actions:** `left`, `right`, `up`, `down`, `jump`, `dash`, `attack`, `skill`, `action`

```js
this.setColor(0.9, 0.3, 0.5);
this.rotation.y += delta;
engine.setBackgroundImage('sky.png', 'cover');
engine.playSFX('jump.mp3');
```

---

## Memory (localStorage)

- Soft limit **~4.5 MB**
- Penuh → alert; hapus asset lewat tombol X
- Export ZIP sukses → cache Memory dihapus

---

## API (opsional)

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/health` | Health check |
| GET/POST | `/api/export` | Validasi project JSON |
| GET/POST | `/api/upload` | Metadata only (bukan storage file) |

---

## Tech

Vanilla JS (ES modules) · Three.js · Font Awesome 6 · JSZip · Vercel static + serverless

---

## Lisensi

**MIT** — bebas pakai, fork, dan share.

---

**XMZ-CREATE** — bikin game di browser, tanpa install engine berat.
