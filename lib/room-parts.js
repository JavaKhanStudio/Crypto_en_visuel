// What the saga's keep rooms are made of (r485): the byte tiles, the floating words and the stone
// room around a machine, once for episodes 1.2-1.6 (they were five drifted copies in <ep>/js/inside.js).
// The engine that zooms in and out of a room is lib/room.js; an episode's js/inside.js keeps its INK
// palette and its rooms, and imports these. What the copies did differently is an option, never a fork:
//
//   litTile(text, ink)        1.2, 1.3: a tile lit by the torches, its own face and box, casts a shadow
//   tile(b, ink, text?)       1.4-1.6: an unlit tile on the shared box and face (face(): one material per
//                             text and colour, so 768 tiles build in the zoom's time); userData.b = b
//   paint(m, b, ink, text?)   repaint a tile() with another byte
//   glyph(b, ink)             what a byte shows: ink.blank '' , ink.letter its letter (␣ a space), or hex
//   ink = { fg, bg, size = 74, letter?, blank? }
//   label(text, color, h, { plate, align })   a word facing the camera ('\n' starts a line);
//   relabel(s, text, color); show(o, k, opacity)
//   buildRoom(scene, portrait, opts)   the stone room, lit by torches; opts picks the layout:
//     { tall }                1.2, 1.3: 28 stones wide, two torches (tall: a machine with keys above it)
//     { rows, cols, cx }      1.4, 1.5: a back wall rows high and cols wide, centred on cx
//                             (high: the wall that many rows high instead, its torches and lights where
//                             rows puts them; r571, Bob's room in 1.5 showed the dark above it)
//     { size, owner }         1.6: as wide and high as the machine (size { w, h }), torches along it
//                             and banners in the owner's colour ('a' or 'b') between them
//   The torches' flicker is lib/room.js's (option flame), around the light they are built with here.
import * as THREE from 'three';
import { COLORS } from './saga/world.js';

const hx = x => x.toString(16).padStart(2, '0');

// ---------- tiles ----------
function tileTex(text, { fg, bg, size = 74 }) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = fg; g.globalAlpha = .55; g.lineWidth = 6; g.strokeRect(5, 5, 118, 118); g.globalAlpha = 1;
  g.fillStyle = fg; g.font = `700 ${size}px ui-monospace, Menlo, Consolas, monospace`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 64, 68);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}
export const glyph = (b, ink) => ink.blank ? '' : ink.letter ? (b === 32 ? '␣' : String.fromCharCode(b)) : hx(b);

// 1.2, 1.3: lit, so the torches play on it
const litSide = new THREE.MeshStandardMaterial({ color: 0x1a120c });
export function litTile(text, ink) {
  const front = new THREE.MeshStandardMaterial({ map: tileTex(text, ink), roughness: .6 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, .22), [litSide, litSide, litSide, litSide, front, litSide]);
  m.castShadow = true; m.visible = false; return m;
}

// 1.4-1.6: unlit, so a byte keeps the card's colour under the torches; shared by every build of a
// room (userData.shared: lib/room.js never disposes them)
const faces = new Map();
export function face(text, ink) {
  const id = [text, ink.fg, ink.bg, ink.size ?? 74].join('|');
  if (faces.has(id)) return faces.get(id);
  const m = new THREE.MeshBasicMaterial({ map: tileTex(text, ink), toneMapped: false }); m.userData.shared = true;
  faces.set(id, m); return m;
}
export const side = new THREE.MeshStandardMaterial({ color: 0x1a120c }); side.userData.shared = true;
export const BOX = new THREE.BoxGeometry(1, 1, .22); BOX.userData.shared = true;
export function tile(b, ink, text = glyph(b, ink)) {
  const m = new THREE.Mesh(BOX, [side, side, side, side, face(text, ink), side]);
  m.visible = false; m.userData.b = b; return m;
}
export const paint = (m, b, ink, text = glyph(b, ink)) => { m.material[4] = face(text, ink); m.userData.b = b; };   // b: what the tests read

// ---------- words ----------
// a word floating in the room, always facing the camera; plate: on a dark ground (over the tiles);
// align: 0 its left end at its position, .5 its middle, 1 its right end; h: the height of a line,
// a '\n' in text starts another (r363)
export function label(text, color, h = .8, { plate = false, align = .5 } = {}) {
  const c = document.createElement('canvas'), g = c.getContext('2d'), font = '600 56px system-ui, sans-serif', lines = text.split('\n');
  g.font = font; c.width = Math.ceil(Math.max(...lines.map(l => g.measureText(l).width))) + 40; c.height = 84 * lines.length;
  if (plate) { g.fillStyle = 'rgba(14,10,7,.86)'; g.beginPath(); g.roundRect(2, 4, c.width - 4, c.height - 8, 18); g.fill(); }
  g.font = font; g.fillStyle = color; g.textBaseline = 'middle'; lines.forEach((l, i) => g.fillText(l, 20, 44 + 84 * i));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: !plate }));
  s.scale.set(h * c.width / 84, h * lines.length, 1); s.center.set(align, .5); s.userData = { h, plate, text }; s.visible = false;
  if (plate) s.renderOrder = 30;
  return s;
}
export function relabel(s, text, color) {
  if (s.userData.text === text) return;
  const n = label(text, color, s.userData.h, { plate: s.userData.plate }); s.material.map?.dispose(); s.material.map = n.material.map; s.scale.copy(n.scale);
  s.userData.text = text;
}
export const show = (o, k, opacity = 1) => { o.visible = k > .001; if (o.material?.opacity !== undefined && o.isSprite) o.material.opacity = k * opacity; };

// ---------- the stone room ----------
function torch(scene, x, y, [intensity, distance, decay]) {
  const light = new THREE.PointLight(0xffa040, intensity, distance, decay); light.position.set(x, y, -7.6); scene.add(light);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(.32, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc070 }));
  flame.position.copy(light.position); scene.add(flame);
  // the holder leans out of the wall (face at z -8.5) to the flame (r586: it stood upright 0.4 behind it, the ball floated):
  // its foot on the stones, its top .22 under the flame's centre, inside the ball
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(.1, .16, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x2a1c12 }));
  const lean = Math.asin(.75 / 1.2); holder.rotation.x = lean;
  holder.position.set(x, y - .22 - .6 * Math.cos(lean), -7.6 - .6 * Math.sin(lean)); scene.add(holder);
  scene.userData.flames = [...(scene.userData.flames || []), { light, flame }];
}

// r496 (Simon: « both interior will need to be different enough »): with rows and an owner, the room
// wears its keep: Alice's is the white city's pale stone, Bob's the great mallorn's wooden planks
// (no hangings in the owners' colours: Bob's gold is the ciphertext's in the rooms, and they hung behind
// the machines). unit: one block's width and height, step: its pitch.
const LOOK = { a: { wall: 0xcfc8b8, floor: 0x6e675c, unit: [1.95, 1.45], step: [2, 1.5], vary: .06 },
  b: { wall: 0x8a5a34, floor: 0x4a3220, unit: [5.9, .6], step: [6, .68], vary: .16 } };
export function buildRoom(scene, portrait, { tall = false, rows, cols, cx = 0, size, owner, high } = {}) {
  // the layouts: what each episode's copy built
  let L;
  if (size) {
    const W = Math.ceil(size.w / 2) + 40;
    L = { fog: [70, 160], hemi: .45, floor: W * 4 + 20, rows: Math.ceil((size.h + 16) / 1.5), cols: W, cx: 0, floorX: false,
      over: [[0, size.h * .6 + 4, 14, 40, 70, 1.5]], key: [.8, size.h + 20, 70, size.h + 10] };
  } else if (rows) {
    cols ??= 36;
    const tx = portrait ? 14 : 30, ty = portrait ? rows * 1.5 - 6 : 14, i = portrait ? 35 : 60;
    L = { fog: [60, 130], hemi: .9, floor: cols * 2 + 8, rows, cols, cx, floorX: true,
      torches: [[-tx, ty], [tx, ty]].map(([x, y]) => [x, y, [i, 40, 1.6]]),
      over: (portrait ? [rows * 1.5 - 8, rows * .6] : [16]).map(y => [0, y, 10, portrait ? 45 : 90, 60, 1.4]), key: [1.2, 30, 30, 50] };
  } else {
    const tx = portrait ? 9 : 22, ty = portrait ? 16 : tall ? 9 : 6.5;
    L = { fog: [40, 90], hemi: .9, floor: 60, rows: portrait ? 20 : tall ? 14 : 10, cols: 28, cx: 0, floorX: false,
      torches: [[-tx, ty], [tx, ty]].map(([x, y]) => [x, y, [60, 34, 1.6]]),
      over: [[0, portrait ? 22 : tall ? 17 : 13, 8, 80, 50, 1.4]], key: [1.2, 24, 18, 28] };
  }
  scene.background = new THREE.Color(0x120c08);
  scene.fog = new THREE.Fog(0x120c08, ...L.fog);
  scene.add(new THREE.HemisphereLight(0xffe0b0, 0x2a1a10, L.hemi));
  const look = rows && LOOK[owner], plain = { unit: [1.95, 1.45], step: [2, 1.5] }, { unit, step: [sx, sy] } = look || plain;
  const stone = new THREE.MeshStandardMaterial({ color: look ? 0xffffff : 0x8a7c68, roughness: .95, flatShading: true });
  // a keep's room (1.5) reaches past the camera: 40 deep, the wide screen saw the dark under the floor's edge (r571)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(L.floor, look ? 120 : 40, 30, 20), new THREE.MeshStandardMaterial({ color: look ? look.floor : 0x4a3e32, roughness: 1, flatShading: true }));
  { const p = floor.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (Math.sin(i * 12.9898) * 43758.5453 % 1) * .08); floor.geometry.computeVertexNormals(); }
  floor.rotation.x = -Math.PI / 2; if (L.floorX) floor.position.x = L.cx; floor.receiveShadow = true; scene.add(floor);
  // r503: on a phone with the top bar tucked (r406) the room takes the screen's top too: the stone layouts' wall,
  // built for the band under the bar, stopped 45-70 px short of it, black above. Half again as high upright
  const nr = Math.ceil((high ?? L.rows) * (portrait && !size ? 1.5 : 1) * 1.5 / sy), nc = Math.ceil(L.cols * 2 / sx), c = new THREE.Color();
  const wall = new THREE.InstancedMesh(new THREE.BoxGeometry(...unit, 1), stone, nr * nc), m4 = new THREE.Matrix4();
  for (let y = 0, i = 0; y < nr; y++) for (let x = -nc / 2; x < nc / 2; x++, i++) {
    wall.setMatrixAt(i, m4.makeTranslation(L.cx + x * sx + (y % 2) * sx / 2, y * sy + sy / 2, -9 - Math.abs(Math.sin(x * 7 + y)) * .15));
    if (look) wall.setColorAt(i, c.set(look.wall).multiplyScalar(1 - look.vary * Math.abs(Math.sin(x * 12.9 + y * 78.2) * 43758.5 % 1)));   // each block a shade
  }
  wall.receiveShadow = true; scene.add(wall);
  if (size) {
    // torches every 24 along the machine (landscape) or up its height (portrait), a banner between two
    const cloth = new THREE.MeshStandardMaterial({ color: COLORS[owner], emissive: COLORS[owner], emissiveIntensity: .18, roughness: .8, side: THREE.DoubleSide });
    const n = Math.max(2, Math.round((portrait ? size.h : size.w) / 24) + 1);
    for (let j = 0; j < n; j++) {
      const along = (j / (n - 1) - .5) * (portrait ? size.h : size.w + 8);
      for (const s of portrait ? [-1, 1] : [0]) {
        const x = portrait ? s * 12 : along, y = portrait ? size.h / 2 + 3 + along : size.h - 1;
        torch(scene, x, y, [30, 30, 1.7]);
        if (j === n - 1) continue;
        const banner = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 7), cloth);
        banner.position.set(portrait ? s * 12 : along + (size.w + 8) / (n - 1) / 2, portrait ? y - size.h / (n - 1) / 2 : y - 3, -8.4); scene.add(banner);
      }
    }
  } else for (const [x, y, light] of L.torches) torch(scene, x, y, light);
  for (const [x, y, z, i, d, decay] of L.over) {
    const over = new THREE.PointLight(0xffb060, i, d, decay); over.position.set(x, y, z); scene.add(over);
  }
  const [ki, ky, kw, ktop] = L.key;
  const key = new THREE.DirectionalLight(0xfff0dd, ki); key.position.set(6, ky, 14); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -kw, right: kw, top: ktop, bottom: -6 }); scene.add(key);
}
