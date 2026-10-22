// The room of episode 11 (r335): Alice's keep, the very room of episode 1.2 (eve-lit-tout/js/inside.js:
// the same stone wall, floor, torches and light), where the AES box is opened. The state is a 4 × 4
// grid of floating cubes, one per byte, each coloured by its value, so a byte that changes changes
// colour. The story's steps are BEATS of this one room, as in 1.2: each sets every part for its time
// (pose), so any beat can follow any other, back as well as forward.
//
//   const room = new Room({ camera, instant });   room.scene goes to the render pass
//   room.build(data)       data: { st: aes.story(lang) }, or the sandbox's { st, ref } (a run of its
//                          own, compared byte by byte with Alice's)
//   room.beat(id)          a beat of BEATS, its animation from 0 (at its end under ?instant=1)
//   room.update(dt)        every frame; room.anchor() is where the speaker's bubble points
//
// There is no valley in this episode (the pack: « inside Alice's keep, not the valley »), so no zoom
// in: the page opens in the room. The free band and the framing are 1.2's (Inside.band, Inside.fit).
import * as THREE from 'three';
import { t } from './i18n.js';
import * as A from './values.js';

const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const clamp01 = k => Math.max(0, Math.min(1, k));
const span = (time, a, b) => ease(clamp01((time - a) / (b - a)));
const hx = A.hx;

// ---------- what the room is made of ----------
// a byte's colour: its value round the colour wheel (0 red, 128 cyan, 255 back near violet)
export const hue = b => b / 256 * 300;
export const byteCss = (b, l = 46) => `hsl(${hue(b).toFixed(0)}, 62%, ${l}%)`;
function faceTex(text, { fg, bg, size = 64, border = true }) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 128, 128);
  if (border) { g.strokeStyle = fg; g.globalAlpha = .45; g.lineWidth = 6; g.strokeRect(5, 5, 118, 118); g.globalAlpha = 1; }
  g.fillStyle = fg; g.font = `700 ${size}px ui-monospace, Menlo, Consolas, monospace`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 64, 68);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}
// one set of materials per byte value, shared by every cube that holds it (a cube that changes value
// only swaps its material array); made once a page, never disposed
const cubeMats = new Map(), tileMats = new Map();
function cubeMat(b) {
  if (!cubeMats.has(b)) {
    const col = new THREE.Color().setHSL(hue(b) / 360, .62, .42);
    const side = new THREE.MeshStandardMaterial({ color: col, roughness: .5, metalness: .1, emissive: col, emissiveIntensity: .12 });
    const front = new THREE.MeshStandardMaterial({ map: faceTex(hx(b), { fg: '#ffffff', bg: `hsl(${hue(b).toFixed(0)}, 62%, 30%)`, size: 66 }), roughness: .5,
      emissive: 0xffffff, emissiveIntensity: 0 });
    cubeMats.set(b, [side, side, side, side, front, side]);
  }
  return cubeMats.get(b);
}
// 1.2's tiles: the order cream, the IV blue, P1 ⊕ IV orange, the round keys violet, C1 yellow
const INK = { p: { fg: '#fff3dc', bg: '#3a2b1a', size: 80 }, iv: { fg: '#9fd3f0', bg: '#12283a', size: 62 },
  x: { fg: '#ffb070', bg: '#3a1e0c', size: 62 }, key: { fg: '#e3b8ff', bg: '#2a1838', size: 62 }, c: { fg: '#ffd84d', bg: '#2a2008', size: 62 } };
const tileSide = new THREE.MeshStandardMaterial({ color: 0x1a120c });
function tileMat(text, ink) {
  const k = ink.fg + text;
  if (!tileMats.has(k)) tileMats.set(k, [tileSide, tileSide, tileSide, tileSide, new THREE.MeshStandardMaterial({ map: faceTex(text, ink), roughness: .6 }), tileSide]);
  return tileMats.get(k);
}
const tileGeo = new THREE.BoxGeometry(1, 1, .22), cubeGeo = new THREE.BoxGeometry(1, 1, 1);
const letter = b => b === 32 ? '␣' : String.fromCharCode(b);

// a word floating in the room, always facing the camera (1.2's)
function label(text, color, h = .8) {
  const c = document.createElement('canvas'), g = c.getContext('2d'), font = '600 56px system-ui, sans-serif';
  g.font = font; c.width = Math.ceil(g.measureText(text).width) + 40; c.height = 84;
  g.font = font; g.fillStyle = color; g.textBaseline = 'middle'; g.fillText(text, 20, 44);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
  s.scale.set(h * c.width / c.height, h, 1); s.userData = { h, text, color }; s.visible = false; s.renderOrder = 10;
  return s;
}
function relabel(s, text, color = s.userData.color) {
  if (s.userData.text === text && s.userData.color === color) return;
  const n = label(text, color, s.userData.h); s.material.map?.dispose(); s.material.map = n.material.map; s.scale.copy(n.scale);
  Object.assign(s.userData, { text, color });
}
const show = (o, k) => { o.visible = k > .001; if (o.isSprite) o.material.opacity = k; };

// the stone room of 1.2, lit by two torches; tall enough for a phone's upright frame
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

// ---------- the beats ----------
// the story's steps in the room, in order; ops: which steps of the cipher the beat plays, and how
// long each takes (round 1 slowly, rounds 2-13 fast, round 14 between)
const SLOW = { ark: 3.2, sub: 6.4, shift: 3.6, mix: 5.2 }, FAST = .3, LAST = { sub: 1.6, shift: 1.4, ark: 1.6 };
export const BEATS = {
  intro: { end: 3.6 }, block: { end: 4.6 }, state: { end: 3.6 }, key: { end: 6.4 },
  ark0: { ops: o => o.round === 0, dur: o => SLOW[o.op] }, sub1: { ops: o => o.round === 1 && o.op === 'sub', dur: o => SLOW[o.op] },
  shift1: { ops: o => o.round === 1 && o.op === 'shift', dur: o => SLOW[o.op] }, mix1: { ops: o => o.round === 1 && o.op === 'mix', dur: o => SLOW[o.op] },
  ark1: { ops: o => o.round === 1 && o.op === 'ark', dur: o => SLOW[o.op] },
  fast: { ops: o => o.round >= 2 && o.round <= 13, dur: () => FAST },
  last: { ops: o => o.round === 14, dur: o => LAST[o.op], tail: 3.0 },
  // a changed byte, every step of every round, fast, the bytes that differ from Alice's run outlined
  spread: { ops: () => true, dur: o => o.round === 0 ? 1.4 : FAST, lead: 1.6, cmp: true },
  end: { end: 1 },
  idle: { end: 1 },   // the sandbox before a run: its block, the bytes changed from Alice's outlined
};
const LEAD = .5;

function machine(scene, data, portrait) {
  buildRoom(scene, portrait);
  const { st } = data, run = data.run || st.tr, ref = data.ref || null;
  // one layout for every screen, side by side: on a phone the free band above the step text is wider
  // than it is tall too, so the frames follow the action there instead (frames below)
  const Y0 = portrait ? 9.4 : 5.6, S = 1.45, C = 1.15;   // S: the cubes' pitch, C: their size
  // where the blocks sit: P1, IV and P1 ⊕ IV (whose place becomes the state's), the round key's slot
  const at = { P1: v(-11.6, Y0), IV: v(-5.8, Y0), X: v(0, Y0), op1: v(-8.7, Y0), op2: v(-2.9, Y0) };
  const G = at.X, KS = v(G.x + 7.2, G.y);
  // the state: byte i in row i % 4, column i / 4; a block of 1.2 reads left to right, top to bottom
  const cell = i => v(G.x + (Math.floor(i / 4) - 1.5) * S, G.y - (i % 4 - 1.5) * S);
  const tileAt = (c, i, p = 1.12) => v(c.x + (i % 4 - 1.5) * p, c.y - (Math.floor(i / 4) - 1.5) * p, c.z);
  const keyCell = i => v(KS.x + (Math.floor(i / 4) - 1.5) * S, KS.y - (i % 4 - 1.5) * S);

  // the 16 cubes, each with an outline for « differs from Alice's run »
  const red = new THREE.LineBasicMaterial({ color: 0xff4d5e }), edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.14, 1.14, 1.14));
  const cubes = Array.from({ length: 16 }, () => {
    const m = new THREE.Mesh(cubeGeo, cubeMat(0)); m.castShadow = true; m.visible = false;
    const o = new THREE.LineSegments(edges, red); o.visible = false; m.add(o); m.userData.outline = o; scene.add(m); return m;
  });
  const setCube = (m, b) => { if (m.userData.b !== b) { m.material = cubeMat(b); m.userData.b = b; } };
  const flash = (m, k) => { m.material[4].emissiveIntensity = k * .5; };
  // the round key: 16 violet tiles, column by column like the state
  const keyT = Array.from({ length: 16 }, () => { const m = new THREE.Mesh(tileGeo, tileMat('00', INK.key)); m.visible = false; scene.add(m); return m; });
  const setKey = k => keyT.forEach((m, i) => { m.material = tileMat(hx(k[i]), INK.key); });
  // the blocks of the first steps: P1 (letters), the IV, P1 ⊕ IV, and 1.2's C1 for the last
  const blk = (b, ink, txt = hx) => [...b].map(x => { const m = new THREE.Mesh(tileGeo, tileMat(txt(x), ink)); m.visible = false; scene.add(m); return m; });
  const T = { P1: blk(st.P1, INK.p, letter), IV: blk(st.iv, INK.iv), X: blk(st.X1, INK.x), C1: blk(st.C1, INK.c) };
  // the 15 round keys, small, five to a row (three to a row on a phone)
  const kc = 5, kp = 3.0, KA = v(G.x + 12.6, G.y);
  const kBlock = r => v(KA.x + (r % kc - (kc - 1) / 2) * kp, KA.y - (Math.floor(r / kc) - (15 / kc - 1) / 2) * kp);
  const RK = st.tr.K.map(k => blk(k, INK.key));
  const RKL = st.tr.K.map((_, r) => { const s = label(t('in.k', { r }), '#e3b8ff', .5); s.position.copy(kBlock(r)).add(v(0, 1.45)); scene.add(s); return s; });

  // the closed box of 1.2 (its gold edges and its name), which the intro opens
  const metal = new THREE.MeshStandardMaterial({ color: 0x24202a, roughness: .45, metalness: .6, transparent: true });
  const box = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 4.4), metal); box.position.copy(G); scene.add(box);
  const gold = new THREE.LineBasicMaterial({ color: 0xffc24d, transparent: true });
  box.add(new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), gold));

  // the words: the step at work, the round, the blocks' names, the S-box lookup, the ⊕ and = signs
  const L = {
    name: label('AES-256', '#ffd27a', 1.1), op: label('', '#ffd27a', .9), round: label('', '#e6dfcf', .7),
    P1: label('P1', '#fff3dc', .7), IV: label('IV', '#9fd3f0', .7), X: label('P1 ⊕ IV', '#ffb070', .7), key: label('', '#e3b8ff', .62),
    C1: label(t('in.c1'), '#ffd84d', .62), eq: label('= C1', '#5fe39a', .9), note: label('', '#ffffff', .62), diff: label('', '#ff8f9a', .7),
    xor: label('⊕', '#ffd27a', 1.3), is: label('=', '#ffd27a', 1.3),
  };
  for (const s of Object.values(L)) scene.add(s);
  const top = c => v(c.x, c.y + 2.95);
  L.name.position.copy(v(G.x, G.y + 3.55)); L.op.position.copy(v(G.x, G.y + 3.45)); L.round.position.copy(v(G.x, G.y - 3.45));
  L.P1.position.copy(top(at.P1)); L.IV.position.copy(top(at.IV)); L.X.position.copy(top(at.X));
  L.xor.position.copy(at.op1); L.is.position.copy(at.op2);
  L.key.position.copy(v(KS.x, KS.y + 3.3)); L.C1.position.copy(v(KS.x, KS.y + 2.95));
  L.eq.position.copy(v((G.x + KS.x) / 2, G.y + .1)); L.diff.position.copy(v(G.x, G.y - 3.45));

  const narrow = () => innerWidth < 600;   // a phone: its free band is short and wide
  const OP = { ark: 'AddRoundKey', sub: 'SubBytes', shift: 'ShiftRows', mix: 'MixColumns' };
  // the timeline of a beat that plays the cipher's steps
  const plan = {};
  for (const [id, b] of Object.entries(BEATS)) if (b.ops) {
    const ops = run.ops.map((o, n) => ({ ...o, n })).filter(b.ops);
    let at0 = b.lead ?? LEAD; for (const o of ops) { o.t0 = at0; o.d = b.dur(o); at0 += o.d; }
    plan[id] = { ops, end: at0 + (b.tail ?? .4) };
  }

  // the cubes during one step of the cipher, k from 0 to 1; returns the value each cube shows
  function opPose(o, k, slow) {
    const shown = new Array(16);
    cubes.forEach((m, i) => {
      let p = cell(i), b = o.to[i], f = 0, s = C;
      if (o.op === 'ark') {
        // the round key slides over the state, sinks into it, and every byte is XORed with its key byte
        b = k < .62 ? o.from[i] : o.to[i]; f = Math.max(0, 1 - Math.abs(k - .62) * 6);
      } else if (o.op === 'sub') {
        // each byte in turn goes through the S-box: a turn, and it comes out another value, another colour
        const w = slow ? .5 : .55, a = (1 - w) * i / 15, ki = clamp01((k - a) / w);
        b = ki < .5 ? o.from[i] : o.to[i]; m.rotation.y = ease(ki) * Math.PI * 2; p = p.clone().add(v(0, 0, Math.sin(Math.PI * ki) * 1.2));
        f = Math.max(0, 1 - Math.abs(ki - .5) * 5);
      } else if (o.op === 'shift') {
        // row j slides j places to the left, like a ring: a cube that goes off the left edge shrinks
        // there and comes back in on the right
        const from = A.shiftFrom(i), j = i % 4, left = cell(0).x - S / 2;
        let x = cell(from).x - j * S * ease(k);
        if (x < left) x += 4 * S;
        p = v(x, cell(i).y); s = C * Math.min(1, Math.abs(x - left) / (S / 2), Math.abs(left + 4 * S - x) / (S / 2));
        b = o.to[i];
      } else if (o.op === 'mix') {
        // a column at a time, its four bytes press together and come apart as four new ones
        const c = Math.floor(i / 4), w = slow ? .34 : .4, a = (1 - w) * c / 3, ki = clamp01((k - a) / w), sq = Math.sin(Math.PI * ki);
        b = ki < .5 ? o.from[i] : o.to[i]; p = p.clone(); p.y += (G.y - p.y) * sq * .42; s = C * (1 - .12 * sq);
        f = Math.max(0, 1 - Math.abs(ki - .5) * 4);
      }
      if (o.op !== 'sub') m.rotation.y = 0;
      m.position.copy(p); m.scale.setScalar(s); setCube(m, b); flash(m, f); m.visible = true; shown[i] = b;
    });
    // the round key's tiles, for an AddRoundKey
    if (o.op === 'ark') {
      setKey(o.key);
      keyT.forEach((m, i) => {
        const a = .08 + (i % 4) * .03 + Math.floor(i / 4) * .02, kk = span(k, a, a + .38);
        const p = keyCell(i).lerp(cell(i).add(v(0, 0, 1.0)), kk); p.z -= span(k, .5, .64) * 1.0;
        m.position.copy(p); m.scale.set(C, C, 1); m.rotation.set(0, 0, 0); m.visible = k < .63 && k > 0;
      });
      relabel(L.key, t('in.k', { r: o.round })); show(L.key, k < .62 ? 1 : 0);
    }
    return shown;
  }
  // the value a run shows at step n, k (for the outlines: the same moment of Alice's run)
  const valueAt = (o, k, i) => o.op === 'ark' ? (k < .62 ? o.from[i] : o.to[i])
    : o.op === 'sub' ? (clamp01((k - .45 * i / 15) / .55) < .5 ? o.from[i] : o.to[i])
    : o.op === 'mix' ? (clamp01((k - .6 * Math.floor(i / 4) / 3) / .4) < .5 ? o.from[i] : o.to[i]) : o.to[i];

  const still = (state, s = C) => cubes.forEach((m, i) => { m.position.copy(cell(i)); m.scale.setScalar(s); m.rotation.set(0, 0, 0); setCube(m, state[i]); flash(m, 0); m.visible = s > .01; });
  const hideAll = () => {
    for (const m of [...cubes, ...keyT, ...Object.values(T).flat(), ...RK.flat()]) { m.visible = false; m.userData.outline && (m.userData.outline.visible = false); }
    for (const s of [...Object.values(L), ...RKL]) show(s, 0);
    box.visible = false;
  };
  const pop = (list, c, time, a, gap = .03, p = 1.12, sc = 1) => list.forEach((m, i) => {
    const k = span(time, a + i * gap, a + i * gap + .45); m.position.copy(tileAt(c, i, p)); m.scale.set(k * sc, k * sc, sc); m.rotation.set(0, 0, 0); m.visible = k > .02;
  });

  function pose(beat, time) {
    hideAll();
    const P = plan[beat];
    if (beat === 'intro') {
      // the closed box of 1.2, then its walls fade and the 16 bytes AES is given float inside
      const o = span(time, 1.2, 2.6);
      box.visible = o < .999; metal.opacity = 1 - o; gold.opacity = 1 - o * .9; box.scale.setScalar(1 + o * .25);
      show(L.name, 1);
      cubes.forEach((m, i) => { const k = span(time, 1.6 + i * .04, 2.4 + i * .04); m.position.copy(cell(i)); m.scale.setScalar(C * k); m.rotation.set(0, (1 - k) * Math.PI, 0); setCube(m, st.X1[i]); flash(m, 0); m.visible = k > .01; });
    } else if (beat === 'block') {
      // the first 16 bytes of the order, XOR the IV: in CBC, that is what AES is given
      pop(T.P1, at.P1, time, .2); show(L.P1, span(time, .2, .7));
      show(L.xor, span(time, 1.2, 1.6)); pop(T.IV, at.IV, time, 1.3); show(L.IV, span(time, 1.3, 1.8));
      show(L.is, span(time, 2.6, 3.0)); pop(T.X, at.X, time, 2.8); show(L.X, span(time, 2.8, 3.3));
    } else if (beat === 'state') {
      // P1 ⊕ IV becomes the state: its bytes, read left to right, are laid out column by column
      cubes.forEach((m, i) => {
        const k = span(time, .4 + (i % 4) * .12 + Math.floor(i / 4) * .3, 1.6 + (i % 4) * .12 + Math.floor(i / 4) * .3);
        m.position.copy(tileAt(at.X, i).lerp(cell(i), k)); m.position.z += Math.sin(Math.PI * k) * 1.4;
        m.scale.set(.97 + (C - .97) * k, .97 + (C - .97) * k, .22 + (C - .22) * k); m.rotation.set(0, 0, 0);
        setCube(m, st.X1[i]); flash(m, 0); m.visible = true;
      });
      show(L.name, span(time, 2.6, 3.2));
    } else if (beat === 'key') {
      // the 32 bytes of the key are round keys 0 and 1; the 13 others are drawn from them, one by one
      still(st.X1);
      for (let r = 0; r < 15; r++) {
        const a = r < 2 ? .3 + r * .35 : 1.4 + (r - 2) * .36;
        pop(RK[r], kBlock(r), time, a, .012, .6, .55); show(RKL[r], span(time, a, a + .4));
      }
    } else if (P) {
      // a beat that plays steps of the cipher
      const slow = beat !== 'fast' && beat !== 'spread';
      let o = P.ops.find(o => time < o.t0 + o.d) || P.ops.at(-1);
      const k = clamp01((time - o.t0) / o.d);
      let shown;
      if (time < P.ops[0].t0) { o = P.ops[0]; still(o.from); shown = [...o.from]; }
      else shown = opPose(o, k, slow);
      // the step's name where AES-256 was, the round under the grid; a phone's short band has them on one line
      const rnd = o.round === 0 ? t('in.round0') : t('in.round', { n: o.round }), one = narrow();
      relabel(L.op, one ? `${rnd} · ${OP[o.op]}` : OP[o.op]); show(L.op, 1);
      relabel(L.round, rnd); show(L.round, beat === 'spread' || one ? 0 : 1);
      // round 1's SubBytes, slowly: the lookup of the byte going through, S(bc) = 65
      if (beat === 'sub1' && time >= o.t0 && k < .97) {
        const i = Math.max(0, Math.min(15, Math.round((k - .25) * 30)));   // cube i is mid-turn at k = .5 i / 15 + .25
        relabel(L.note, `S(${hx(o.from[i])}) = ${hx(o.to[i])}`); L.note.position.copy(cell(i)).add(v(0, 1.25, 1.6)); show(L.note, 1);
      }
      // the changed run: outline every byte that differs from Alice's at the same moment
      if (P && BEATS[beat].cmp && ref) {
        const ro = ref.ops[o.n];
        let n = 0;
        cubes.forEach((m, i) => { const d = shown[i] !== (time < P.ops[0].t0 ? ro.from[i] : valueAt(ro, k, i)); m.userData.outline.visible = d; n += d; });
        relabel(L.diff, t(n === 1 ? 'in.diff1' : 'in.diff', { n, r: o.round })); show(L.diff, 1);
        L.round.visible = false;
        if (one) { L.diff.position.y = G.y + 3.45; show(L.op, 0); } else L.diff.position.y = G.y - 3.45;   // a phone: the count in the step's place
      }
      // the last round: the state is C1, byte for byte the C1 of episode 1.2
      // read out column by column, the cubes line up in 1.2's order (left to right, top to bottom)
      if (beat === 'last') {
        const a = P.ops.at(-1).t0 + P.ops.at(-1).d + .2;
        pop(T.C1, KS, time, a, .02); show(L.C1, span(time, a, a + .5));
        cubes.forEach((m, i) => { const k = span(time, a + .6 + i * .04, a + 1.4 + i * .04); m.position.copy(cell(i).lerp(tileAt(G, i, S), k)); m.position.z += Math.sin(Math.PI * k) * 1.2; });
        show(L.eq, span(time, a + 2.1, a + 2.5));
      }
    } else if (beat === 'end') {
      still(run.out); show(L.name, 1);
    } else if (beat === 'idle') {
      still(run.ops[0].from); show(L.name, 1);
      if (ref) cubes.forEach((m, i) => { m.userData.outline.visible = run.ops[0].from[i] !== ref.ops[0].from[i]; });
    }
  }

  // what the camera holds: the blocks, the state, the state and the round key's slot, the key's array
  // a narrow band (a phone) holds less at a time and follows the action: P1 and the IV, then the IV
  // and P1 ⊕ IV; the round keys without the state
  const box3 = (c, w, h) => [v(c.x - w, c.y - h), v(c.x + w, c.y + h)];
  const grid = narrow() ? [v(G.x - 3, G.y - 3.0), v(G.x + 3, G.y + 4.0)] : box3(G, 3.0, 4.0), withKey = [...grid, ...box3(KS, 3.0, 3.6)];
  const frames = {
    intro: () => box3(G, 3.6, 4.2),
    block: time => !narrow() ? [...box3(at.P1, 2.4, 3.3), ...box3(at.X, 2.4, 3.3)] : time < 2.6 ? [...box3(at.P1, 2.4, 3.3), ...box3(at.IV, 2.4, 3.3)] : [...box3(at.IV, 2.4, 3.3), ...box3(at.X, 2.4, 3.3)],
    state: time => time < 1.6 ? [...box3(at.IV, 2.4, 2.4), ...grid] : grid,
    key: () => narrow() ? box3(KA, 7.6, 4.7) : [...grid, ...box3(KA, 7.6, 4.7)],
    ark: () => withKey, last: time => time > plan.last.ops.at(-1).t0 - .1 ? withKey : grid,
  };
  const frame = (beat, time) => (frames[beat] || (BEATS[beat].ops && beat.startsWith('ark') ? frames.ark : frames[beat]) || (() => grid))(time);
  const end = id => plan[id]?.end ?? BEATS[id].end;
  // what the cubes show now, and which are outlined: what tests/aes_interieur_story.py reads
  const read = () => ({ bytes: cubes.map(m => m.visible ? m.userData.b : null), red: cubes.filter(m => m.visible && m.userData.outline.visible).length,
    words: Object.values(L).filter(s => s.visible).map(s => s.userData.text) });
  return { pose, frame, end, G, plan, read };
}

// ---------- the room, its camera and its framing ----------
const SMOOTH = .04, BUBBLE = 84;   // the camera closes 96% of the way to its framing every second
export class Room {
  constructor({ camera, instant }) {
    Object.assign(this, { camera, instant });
    this.scene = new THREE.Scene(); this.time = 0; this.id = 'intro';
    this.view = { center: v(0, 5, 0), d: 30 }; this.speed = 1;
  }
  get portrait() { return innerWidth < innerHeight; }
  build(data = this.data) {
    this.data = data;
    this.scene.clear(); this.scene.userData = {};
    this.m = machine(this.scene, data, this.portrait); this.built = this.portrait;
    this.m.pose(this.id, this.time); this.fit(true);
    this.onBuild?.(this.scene);
  }
  resize() { if (this.m && this.built !== this.portrait) this.build(); }
  beat(id) { this.id = id; this.time = this.instant ? this.m.end(id) : 0; this.m.pose(id, this.time); this.fit(true); }
  get end() { return this.m.end(this.id); }
  get done() { return this.time >= this.end; }
  play() { this.time = 0; }
  // the speaker's bubble: the top of what the camera holds, a third in
  anchor() { const b = this.want?.box; return b ? v(b.min.x + (b.max.x - b.min.x) * .3, b.max.y + .3) : v(0, 8); }

  // the free band: below the top bar, above the story panel, left of an open corner card (1.2's)
  band() {
    const W = innerWidth, H = innerHeight, r = id => document.getElementById(id)?.getBoundingClientRect();
    const bar = [r('topbar'), r('modes'), r('lang')].filter(b => b && b.height).reduce((m, b) => Math.max(m, b.bottom), 0);
    const panel = ['story', 'sandbox'].map(id => document.getElementById(id)).find(p => p && !p.classList.contains('hidden') && p.offsetHeight);
    const card = document.getElementById('card'), cr = r('card');
    let top = bar + 8, bottom = H, left = 0, right = W;
    if (panel) {
      const pr = panel.getBoundingClientRect();
      if (panel.id === 'story' || W < 900) bottom = pr.top - 8; else left = pr.right + 8;   // the sandbox is a side panel on a wide screen
    }
    if (cr && cr.height && !card.classList.contains('hidden')) {
      if (card.classList.contains('folded') && W < 900) bottom = Math.min(bottom, cr.top - 4);   // a phone's card is folded to a line (r84)
      else if (cr.left > W * .55) right = cr.left - 8;
    }
    if (bottom - top < 110) { top = 0; bottom = H; }   // a band under 110 px holds nothing: the whole screen
    return { W, H, left, top, w: right - left, h: bottom - top };
  }
  fit(now = false) {
    const pts = this.m.frame(this.id, this.time), box = new THREE.Box3().setFromPoints(pts);
    const c = box.getCenter(v(0, 0)), size = box.getSize(v(0, 0)), b = this.band();
    const room = Math.min(BUBBLE, b.h * (b.W < 600 ? .42 : .25)); b.top += room; b.h -= room;   // the top of the band is kept for the bubble (a phone's is taller for its width)
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2) * 2, m = .9;
    const d = Math.max(size.y * b.H / (m * b.h), size.x * b.H / (m * b.w)) / tan + 2.2;
    this.want = { center: c, d, b, box };
    if (now) { this.view.center.copy(c); this.view.d = d; }
  }
  update(dt) {
    if (!this.m) return;
    this.time += dt * this.speed;
    this.m.pose(this.id, this.time);
    this.fit();
    const k = this.instant ? 1 : 1 - Math.pow(SMOOTH, dt), w = this.want;
    this.view.center.lerp(w.center, k); this.view.d += (w.d - this.view.d) * k;
    const c = this.view.center, d = this.view.d;
    this.camera.position.set(c.x + Math.sin(this.time * .25) * .02 * d, c.y + d * .14, c.z + d);
    this.camera.lookAt(c);
    // the look-at point lands in the middle of the free band, not of the screen
    const b = w.b; this.camera.setViewOffset(b.W, b.H, b.W / 2 - (b.left + b.w / 2), b.H / 2 - (b.top + b.h / 2), b.W, b.H);
    for (const f of this.scene.userData.flames || []) f.light.intensity = 55 + Math.sin(this.time * 13 + f.light.position.x) * 6 + Math.sin(this.time * 7.3) * 4;
  }
}
