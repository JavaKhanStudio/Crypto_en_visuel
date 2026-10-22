// Inside a castle (r103, r158): a chapter that explains a mechanism zooms the camera through a lit
// window of the keep, and a second scene, a room, shows the machine at work on the story's real
// bytes. One zoom per chapter: the chapter's steps are BEATS of the same room, the machine grows a
// step at a time, and the camera only drifts inside the room between them.
//
// The engine (enter, beat, cut, leave, the free band, the doors) is lib/room.js (r424), as is its API;
// this file keeps only the rooms (ROOM.rooms) and the engine options this episode needs.
import * as THREE from 'three';
import { t } from './i18n.js';
import * as A from './values.js';

const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const clamp01 = k => Math.max(0, Math.min(1, k));
const span = (time, a, b) => ease(clamp01((time - a) / (b - a)));
const hx = x => x.toString(16).padStart(2, '0');

// ---------- what a room is made of ----------
// a square tile with a byte on it: a letter of the order, or two hex digits
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
const side = new THREE.MeshStandardMaterial({ color: 0x1a120c });
function tile(text, ink) {
  const front = new THREE.MeshStandardMaterial({ map: tileTex(text, ink), roughness: .6 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, .22), [side, side, side, side, front, side]);
  m.castShadow = true; m.visible = false; return m;
}
// the colours of the corner card: the order cream, padding gold, key violet, IV blue, ciphertext yellow
const INK = { p: { fg: '#fff3dc', bg: '#3a2b1a', size: 80 }, pad: { fg: '#ffd27a', bg: '#5a3c10', size: 62 },
  key: { fg: '#e3b8ff', bg: '#2a1838', size: 62 }, iv: { fg: '#9fd3f0', bg: '#12283a', size: 62 },
  x: { fg: '#ffb070', bg: '#3a1e0c', size: 62 }, c: { fg: '#ffd84d', bg: '#2a2008', size: 62 } };
const byteTile = (b, ink) => tile(ink === INK.p ? (b === 32 ? '␣' : String.fromCharCode(b)) : hx(b), ink);

// a word floating in the room, always facing the camera
function label(text, color, h = .8) {
  const c = document.createElement('canvas'), g = c.getContext('2d'), font = '600 56px system-ui, sans-serif';
  g.font = font; c.width = Math.ceil(g.measureText(text).width) + 40; c.height = 84;
  g.font = font; g.fillStyle = color; g.textBaseline = 'middle'; g.fillText(text, 20, 44);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(h * c.width / c.height, h, 1); s.userData.h = h; s.visible = false;
  return s;
}
function relabel(s, text, color) {
  if (s.userData.text === text) return;
  const n = label(text, color, s.userData.h); s.material.map?.dispose(); s.material.map = n.material.map; s.scale.copy(n.scale);
  s.userData.text = text;
}
const show = (o, k, opacity = 1) => { o.visible = k > .001; if (o.material?.opacity !== undefined && o.isSprite) o.material.opacity = k * opacity; };

// the stone room, lit by two torches; tall enough for a phone's upright frame
function buildRoom(scene, portrait) {
  scene.background = new THREE.Color(0x120c08);
  scene.fog = new THREE.Fog(0x120c08, 40, 90);
  scene.add(new THREE.HemisphereLight(0xffe0b0, 0x2a1a10, .9));
  const stone = new THREE.MeshStandardMaterial({ color: 0x8a7c68, roughness: .95, flatShading: true });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40, 30, 20), new THREE.MeshStandardMaterial({ color: 0x4a3e32, roughness: 1, flatShading: true }));
  { const p = floor.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (Math.sin(i * 12.9898) * 43758.5453 % 1) * .08); floor.geometry.computeVertexNormals(); }
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const rows = portrait ? 20 : 10;
  const wall = new THREE.InstancedMesh(new THREE.BoxGeometry(1.95, 1.45, 1), stone, rows * 28), m4 = new THREE.Matrix4();
  for (let y = 0, i = 0; y < rows; y++) for (let x = -14; x < 14; x++, i++)
    wall.setMatrixAt(i, m4.makeTranslation(x * 2 + (y % 2), y * 1.5 + .75, -9 - Math.abs(Math.sin(x * 7 + y)) * .15));
  wall.receiveShadow = true; scene.add(wall);
  const tx = portrait ? 9 : 22, ty = portrait ? 16 : 6.5;
  for (const x of [-tx, tx]) {
    const light = new THREE.PointLight(0xffa040, 60, 34, 1.6); light.position.set(x, ty, -7.6); scene.add(light);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(.32, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc070 }));
    flame.position.copy(light.position); scene.add(flame);
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(.1, .16, 1, 6), new THREE.MeshStandardMaterial({ color: 0x2a1c12 }));
    holder.position.set(x, ty - .7, -8); scene.add(holder);
    scene.userData.flames = [...(scene.userData.flames || []), { light, flame }];
  }
  const over = new THREE.PointLight(0xffb060, 80, 50, 1.4); over.position.set(0, portrait ? 22 : 13, 8); scene.add(over);
  const key = new THREE.DirectionalLight(0xfff0dd, 1.2); key.position.set(6, 24, 14); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -18, right: 18, top: 28, bottom: -6 }); scene.add(key);
}

// ---------- the AES room of episode 1.2: four beats, key → aes → pad → cbc ----------
// The machine is laid out along a flow axis u (the order goes in at -u, the ciphertext comes out at
// +u) and a cross axis w (+w: where the key and the IV come from). Landscape: u runs left to right.
// Portrait: u runs top to bottom, so the blocks sit above and below the box. P() places a (u, w)
// point; blocks of 4 × 4 tiles always read left to right, top to bottom, like the card's rows.
function aesRoom(scene, send, portrait) {
  buildRoom(scene, portrait);
  const Y0 = portrait ? 12.2 : 4.9, bs = portrait ? .8 : 1, colU = portrait ? 8.2 : 10.5, gateU = portrait ? 4.6 : 6;
  const P = (u, w, z = 0) => portrait ? v(-w, Y0 - u, z) : v(u, Y0 + w, z);
  const cell = (c, i, s = 1.12) => v(c.x + (i % 4 - 1.5) * s, c.y - (Math.floor(i / 4) - 1.5) * s, c.z);
  const at = { P1: P(-colU, 2.4), P2: P(-colU, -2.4), C1: P(colU, 2.4), C2: P(colU, -2.4), gate: P(-gateU, 0),
    inn: P(-3.5 * bs, 0), out: P(3.5 * bs, 0), IV: P(-gateU, 6.1), over: P(0, 4.6) };
  const top = c => v(c.x, c.y + 2.75, c.z);   // a block's label, above it

  // the key: 32 bytes on a rack (16 × 2, a phone 8 × 4), and the key itself, violet like the card's
  const cols = portrait ? 8 : 16, rackC = portrait ? P(-colU, 0) : P(0, 6.1);
  const rackAt = i => v(rackC.x + (i % cols - (cols - 1) / 2) * .8, rackC.y - (Math.floor(i / cols) - (32 / cols - 1) / 2) * .8, 0);
  const R = [...send.key].map(b => byteTile(b, INK.key)); R.forEach(m => scene.add(m));
  const violet = new THREE.MeshStandardMaterial({ color: 0xb77ff0, emissive: 0xb77ff0, emissiveIntensity: .6, metalness: .5, roughness: .3 });
  const keyObj = new THREE.Group(), keyTurn = new THREE.Group(); keyObj.add(keyTurn);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(.75, .2, 10, 24), violet); bow.position.y = 2.1; keyTurn.add(bow);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 2.6, 8), violet); shaft.position.y = .25; keyTurn.add(shaft);
  for (const [y, w] of [[-.5, .55], [-.85, .4]]) { const tooth = new THREE.Mesh(new THREE.BoxGeometry(w, .2, .2), violet); tooth.position.set(w / 2, y, 0); keyTurn.add(tooth); }
  keyObj.rotation.z = portrait ? Math.PI / 2 : 0; scene.add(keyObj);
  const keyHome = portrait ? v(rackC.x, rackC.y + 3.4) : v(rackC.x - 8.6, rackC.y - 1);
  const lockOut = P(0, 2.7 * bs + 2.8), lockIn = P(0, 2.7 * bs + 1.25);
  const keyLbl = label(t('in.key'), '#e3b8ff'); scene.add(keyLbl);

  // the box: AES-256 with its lock and 14 lamps, one per round; built along u/w, then placed
  const boxRoot = new THREE.Group(), riser = new THREE.Group(); boxRoot.add(riser); scene.add(boxRoot);
  boxRoot.matrixAutoUpdate = false;
  boxRoot.matrix.makeTranslation(P(0, 0).x, P(0, 0).y, 0).multiply(portrait ? new THREE.Matrix4().set(0, -1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1) : new THREE.Matrix4())
    .multiply(new THREE.Matrix4().makeScale(bs, bs, 1));
  const metal = new THREE.MeshStandardMaterial({ color: 0x24202a, roughness: .45, metalness: .6 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(7, 5.4, 4.4), metal); box.castShadow = box.receiveShadow = true; riser.add(box);
  const gold = new THREE.LineBasicMaterial({ color: 0xffc24d });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), gold); riser.add(edges);
  const lock = new THREE.Mesh(new THREE.CylinderGeometry(.5, .6, .3, 16), new THREE.MeshStandardMaterial({ color: 0x0a0a10, metalness: .8 }));
  lock.position.y = 2.85; riser.add(lock);
  const lamps = [];
  for (let i = 0; i < 14; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(.17, 10, 8), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffc24d, emissiveIntensity: .05 }));
    l.position.set(-2.92 + i * .45, -2.05, 2.24); riser.add(l); lamps.push(l);
  }
  const name = label('AES-256', '#ffd27a', portrait ? .85 : 1.25); name.position.copy(P(0, portrait ? .4 : 1.1, 2.4)); scene.add(name);
  const round = label(t('in.round', { n: 0 }), '#ffd27a', .7); round.position.copy(P(0, -2.7 * bs - (portrait ? 1.7 : .75), 2.6)); scene.add(round);

  // the gate where CBC mixes a block with the one before (⊕, XOR)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.95, .11, 10, 32), new THREE.MeshStandardMaterial({ color: 0xffc24d, emissive: 0xffc24d, emissiveIntensity: .4, metalness: .6, roughness: .3 }));
  ring.position.copy(at.gate); scene.add(ring);
  const xorLbl = label('⊕', '#ffd27a', 1.3); xorLbl.position.copy(at.gate); scene.add(xorLbl);

  // the blocks: the order (P1, P2 with its padding), what AES makes of P1 alone, the IV, the mixed
  // blocks (P1 ⊕ IV, P2 ⊕ C1), the ciphertext C1, C2 and the copy of C1 carried back to the gate
  const pn = 16 - send.padN, c1Alone = A.encryptBlock(send.key, send.P[0]);
  const blk = (bytes, ink) => { const list = [...bytes].map(b => byteTile(b, ink)); list.forEach(m => scene.add(m)); return list; };
  const T = { P1: blk(send.P[0], INK.p), P2: [...send.P[1]].map((b, i) => byteTile(b, i < pn ? INK.p : INK.pad)), OUT: blk(c1Alone, INK.c),
    IV: blk(send.iv, INK.iv), P1m: blk(send.P[0], INK.p), IVm: blk(send.iv, INK.iv), X1: blk(send.X[0], INK.x), X2: blk(send.X[1], INK.x), C1: blk(send.C[0], INK.c), C2: blk(send.C[1], INK.c), back: blk(send.C[0], INK.c) };
  T.P2m = [...send.P[1]].map((b, i) => byteTile(b, i < pn ? INK.p : INK.pad));
  for (const m of [...T.P2, ...T.P2m]) scene.add(m);
  const L = { P1: label('P1', '#fff3dc'), P2: label('P2', '#fff3dc'), OUT: label(t('in.out'), '#ffd84d'), IV: label(t('in.iv'), '#9fd3f0'),
    C1: label('C1', '#ffd84d'), C2: label('C2', '#ffd84d') };
  // labels above a block; in landscape P1/P2 and C1/C2 are stacked, so theirs go beside, outward
  const beside = { P1: -1, P2: -1, C1: 1, C2: 1 };
  for (const [k, s] of Object.entries(L)) { s.position.copy(!portrait && beside[k] ? v(at[k].x + beside[k] * 3.3, at[k].y) : top(k === 'OUT' ? at.C1 : at[k])); scene.add(s); }

  // tiles: k 0 → 1 from a to b, shrinking into a mouth or growing out of one
  const move = (list, a, b, k, { s0 = 1, s1 = 1, flip = 0, arc = 0 } = {}) => list.forEach((m, i) => {
    const pa = a.isVector3 ? a : cell(a.c, i, a.s), pb = b.isVector3 ? b : cell(b.c, i, b.s);
    m.position.lerpVectors(pa, pb, k); m.position.y += Math.sin(Math.PI * k) * arc;
    m.scale.setScalar((s0 + (s1 - s0) * k) * (a.scale || 1)); m.rotation.x = flip * (1 - k) * Math.PI; m.visible = m.scale.x > .02;
  });
  const sit = (list, c, s = 1.12, scale = Math.min(1, s / 1.12)) => move(list, { c, s, scale }, { c, s, scale }, 1);
  const hide = list => list.forEach(m => { m.visible = false; });
  // a block pops up where it sits, tile after tile, from time a
  const pop = (list, c, time, a, gap = .03, s = 1) => list.forEach((m, i) => {
    const k = span(time, a + i * gap, a + i * gap + .45); m.position.copy(cell(c, i, s)); m.scale.setScalar(k * Math.min(1, s / 1.12)); m.rotation.x = 0; m.visible = k > .02;
  });
  // a block goes in a stream into a point (a mouth or the gate): row by row, shrinking
  const into = (list, c, p, time, a, b, { s = 1.12, s0 = Math.min(1, s / 1.12), s1 = .35 } = {}) => list.forEach((m, i) => {
    const d = (i % 4) * .06 + Math.floor(i / 4) * .1, k = span(time, a + d, b - .4 + d);
    m.position.lerpVectors(cell(c, i, s), p, k); m.scale.setScalar(s0 + (s1 - s0) * k); m.rotation.x = 0; m.visible = k < .999;
  });
  const outOf = (list, p, c, time, a, b) => list.forEach((m, i) => {
    const d = (i % 4) * .06 + Math.floor(i / 4) * .1, k = span(time, a + d, b - .4 + d);
    m.position.lerpVectors(p, cell(c, i), k); m.scale.setScalar(.35 + .65 * k); m.rotation.x = (1 - k) * Math.PI; m.visible = k > .001;
  });
  const lampsAt = (lit, busy, time) => {
    lamps.forEach((l, i) => { l.material.emissiveIntensity = i < lit ? 1.5 : .05; });
    riser.position.x = busy ? Math.sin(time * 60) * .025 : 0; gold.color.setHex(busy ? 0xffe9a8 : 0xffc24d);
    relabel(round, t('in.round', { n: Math.min(14, lit) }), '#ffd27a');
  };
  const rounds = (time, a, b) => Math.floor(clamp01((time - a) / (b - a)) * 14 + 1e-6);
  const B = { key: 0, aes: 1, pad: 2, cbc: 3 };

  function pose(beat, time) {
    const b = B[beat];
    for (const list of Object.values(T)) hide(list);
    // the key: drawn byte by byte on its rack, the key forms; then the bytes stream into it and it turns in the lock
    R.forEach((m, i) => {
      if (b === 0) { const k = span(time, .3 + i * .05, .8 + i * .05); m.position.copy(rackAt(i)); m.scale.setScalar(.7 * k); m.rotation.x = (1 - k) * Math.PI * 3; m.visible = k > .02; }
      else if (b === 1) { const k = span(time, .5 + i * .025, 1.3 + i * .025); m.position.lerpVectors(rackAt(i), keyHome, k); m.scale.setScalar(.7 * (1 - k)); m.rotation.x = 0; m.visible = k < .98; }
      else m.visible = false;
    });
    const kf = b === 0 ? span(time, 2.0, 2.6) : 1;
    keyObj.scale.setScalar(kf); keyObj.visible = kf > .01;
    const kMove = b === 0 ? 0 : b === 1 ? span(time, 2.0, 2.7) : 1, kIn = b === 0 ? 0 : b === 1 ? span(time, 2.7, 3.2) : 1, kTurn = b === 1 ? span(time, 3.2, 3.6) : b > 1 ? 1 : 0;
    keyObj.position.lerpVectors(keyHome, lockOut, kMove).lerp(lockIn, kIn);
    keyTurn.rotation.y = (b === 0 ? (1 - kf) * Math.PI : 0) + kTurn * Math.PI / 2;
    violet.emissiveIntensity = b === 1 && time > .5 && time < 1.9 ? 1.4 : .6;
    keyLbl.position.copy(keyObj.position).add(portrait ? v(0, 1.4) : v(0, 3.1)); show(keyLbl, b === 0 ? kf : b === 1 ? 1 - kMove : 0);

    const rise = b === 0 ? 0 : b === 1 ? span(time, 0, .9) : 1;
    boxRoot.visible = rise > .01; riser.scale.setScalar(Math.max(.001, rise)); show(name, rise); show(round, b === 1 ? span(time, 4.4, 4.8) : b > 1 ? 1 : 0);
    show(ring, b === 3 ? span(time, .3, .9) : 0); show(xorLbl, b === 3 ? span(time, .3, .9) : 0);
    ring.material.emissiveIntensity = b === 3 && ((time > 2.1 && time < 2.8) || (time > 7.6 && time < 8.3)) ? 2 : .4;
    for (const k of Object.keys(L)) show(L[k], 0);

    if (b === 1) {
      // P1 in, 14 rounds, 16 unreadable bytes out
      pop(T.P1, at.P1, time, .3); show(L.P1, span(time, .3, .9));
      if (time > 3.8) into(T.P1m, at.P1, at.inn, time, 3.8, 5.2);   // the block stays, a copy goes in
      const lit = rounds(time, 5.2, 7.2); lampsAt(lit, time > 5.2 && time < 7.2, time);
      outOf(T.OUT, at.out, at.C1, time, 7.2, 8.6); show(L.OUT, span(time, 7.2, 8.6));
    } else if (b === 2) {
      // the whole order: P1 again, P2's letters, then nine bytes of 09 drop into its empty cells
      lampsAt(14, false, time);
      sit(T.P1, at.P1); show(L.P1, 1);
      T.OUT.forEach((m, i) => { const k = span(time, 0, .5); m.position.copy(cell(at.C1, i)); m.scale.setScalar(1 - k); m.visible = k < .98; }); show(L.OUT, 1 - span(time, 0, .5));
      T.P2.forEach((m, i) => {
        const a = i < pn ? .6 + i * .12 : 1.9 + (i - pn) * .22, k = span(time, a, a + .45), c = cell(at.P2, i);
        m.position.set(c.x, c.y + (i < pn ? 0 : (1 - k) * 3), c.z); m.scale.setScalar(i < pn ? k : Math.min(1, k * 1.5)); m.rotation.x = 0; m.visible = k > .02;
      });
      show(L.P2, span(time, .6, 1));
    } else if (b === 3) {
      // CBC: P1 ⊕ IV → AES → C1; C1 is carried back to the gate, P2 ⊕ C1 → AES → C2
      show(L.P1, 1); show(L.P2, 1); show(L.IV, span(time, 0, .7));
      pop(T.IV, at.IV, time, 0, .02, .9);
      // the blocks stay where they are; a copy of each goes to the gate
      sit(T.P1, at.P1); sit(T.P2, at.P2); if (time > .9) sit(T.IV, at.IV, .9);
      if (time > 1.2) { into(T.P1m, at.P1, at.gate, time, 1.2, 2.6); into(T.IVm, at.IV, at.gate, time, 1.2, 2.6, { s: .9 }); }
      // at the gate the two blocks become one, P1 ⊕ IV, small in the ring, then it goes into AES
      if (time > 2.4 && time < 3.4) pop(T.X1, at.gate, time, 2.4, 0, .5); else if (time >= 3.4) into(T.X1, at.gate, at.inn, time, 3.4, 4.4, { s: .5, s1: .3 });
      const pass2 = time > 7.0, lit = pass2 ? rounds(time, 8.9, 10.5) : rounds(time, 4.4, 6.0);
      lampsAt(lit, (time > 4.4 && time < 6.0) || (time > 8.9 && time < 10.5), time);
      outOf(T.C1, at.out, at.C1, time, 6.0, 7.0); show(L.C1, span(time, 6.0, 7.0));
      // the copy of C1 arcs over the box to the gate, where P2 is waiting
      if (time > 7.0 && time < 8.3) T.back.forEach((m, i) => { const k = span(time, 7.0, 8.1); m.position.lerpVectors(cell(at.C1, i), at.gate, k); m.position.y += Math.sin(Math.PI * k) * (portrait ? 0 : 4); if (portrait) m.position.x -= Math.sin(Math.PI * k) * 5; m.scale.setScalar(1 - .65 * k); m.rotation.x = 0; m.visible = true; });
      if (time > 7.0) into(T.P2m, at.P2, at.gate, time, 7.0, 8.3);
      if (time > 8.1 && time < 8.9) pop(T.X2, at.gate, time, 8.1, 0, .5); else if (time >= 8.9) into(T.X2, at.gate, at.inn, time, 8.9, 9.9, { s: .5, s1: .3 });
      outOf(T.C2, at.out, at.C2, time, 10.5, 11.5); show(L.C2, span(time, 10.5, 11.5));
    } else lampsAt(0, false, time);
  }

  // what the camera holds at each beat: the rack; then the flow from P1 to the output; the order's
  // two blocks and the box; everything, the IV included. A phone holds less at a time and follows
  // the action: the key into the lock, P1 into the box, the output; the gate, the box, C1, C2.
  const corners = (c, h = 2.3, up = 3.2) => [v(c.x - h - (portrait ? 0 : .9), c.y - h), v(c.x + h + (portrait ? 0 : .9), c.y + up)];
  const boxC = [P(-3.5 * bs, -2.7 * bs - (portrait ? 0 : 1.2)), P(3.5 * bs, 2.7 * bs)];
  const mouth = [P(3.5 * bs - 1, -2.7 * bs), P(3.5 * bs - 1, 2.7 * bs)];   // the box's way out, where a phone watches the output
  const rackF = [rackAt(0), rackAt(31), keyHome, v(keyHome.x, keyHome.y + 3.4), v(keyHome.x - (portrait ? 2 : 3), keyHome.y + 3.4)];
  const frames = {
    key: () => rackF,
    aes: time => !portrait ? [...corners(at.P1), ...corners(at.C1), ...boxC, rackAt(0), rackAt(31)]
      : time < 3.6 ? [...rackF, ...boxC] : time < 7.2 ? [...corners(at.P1), ...boxC] : [...mouth, ...corners(at.C1)],
    pad: () => [...corners(at.P1), ...corners(at.P2), ...(portrait ? [] : boxC)],
    cbc: time => !portrait ? [...corners(at.P1), ...corners(at.P2), ...corners(at.C1), ...corners(at.C2), ...corners(at.IV, 2.1, 2.9), ...boxC]
      : time < 4.4 ? [...corners(at.P1), ...corners(at.P2), ...corners(at.IV, 2.1, 2.9), at.gate, P(-3.5 * bs, 0)]
      : time < 4.4 || (time > 7.0 && time < 8.9) ? [...corners(at.P2), ...corners(at.C1), ...boxC] : [...mouth, ...corners(at.C1), ...corners(at.C2)],
  };
  return { beats: { key: { end: 3.0 }, aes: { end: 8.6 }, pad: { end: 4.3 }, cbc: { end: 11.5 } }, pose, frame: (k, time) => frames[k](time) };
}
// the room, entered by Alice's keep's valley window; the engine's options (lib/room.js)
export const ROOM = { rooms: { aes: { build: aesRoom, door: 'a' } } };
