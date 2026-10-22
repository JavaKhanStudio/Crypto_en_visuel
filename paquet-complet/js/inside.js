// Inside a castle (r103, r161): steps 7 and 10 of episode 1.5 zoom the camera through a lit window of
// Bob's keep, and a second scene, a room, shows his three moves on the story's real packet (packet.js):
// open the keys with RSA, check the seal with HMAC, and only then decrypt with AES-CBC. Step 7 'open'
// plays Alice's packet; step 10 'why' plays Eve's, where the seal is wrong and AES stays shut, then
// shows what decrypting first would have run through AES. The two steps are in two chapters, so each
// is a room of one beat with its own zoom; the camera comes out at the next step ('eve', 'files').
// Steps 2-5 (r369) zoom through a window of ALICE's keep into her room: one room, four beats, her four
// moves on the same packet (draw, encrypt, seal, lock), out at step 6 'ride'.
// Copied from cle-vallee/js/inside.js (r160), itself from octet-change's (r159) and eve-lit-tout's
// (r158, the reference room); the zoom itself is lib/zoom.js.
//
// The API, as in the reference: the room part (ROOMS) is this episode's own:
//   const inside = new Inside({ renderer, renderPass, camera, rig, bubbles, instant });   // main.js
//   ROOMS[name] = (scene, send, portrait) => ({   // send: here story.js packets(), { s, twice, ... }
//     beats: { <step id>: { end } },     // the room's steps; end = seconds its animation lasts
//     pose(beat, time),                   // sets EVERY part for that beat at that time, so any beat
//                                         //   can follow any other (back as well as forward)
//     frame(beat, time) → [Vector3, ...], // the points the camera must hold in the free band now
//                                         //   (a phone can follow the action: P1 in, then out)
//     anchor(beat) → Vector3 })           // optional: where the speaker's bubble points; by default
//                                         //   the top of the frame, where the band keeps room for it
//   portrait: the screen is upright (a phone): here the same machine, framed closer as it works.
//   await inside.enter(name, beat, send, live)   flies in from where the camera is; false if cancelled
//   inside.beat(id)          the next step in the same room: no flight, its animation from 0
//   await inside.leave(shot) out through the window, then the valley camera flies to shot
//   inside.rebuild(send)     same room and beat, new words or bytes (language) or a turned phone
//   inside.update(dt)        every frame; main.js skips rig.update while inside.active
// The free band is the screen between the top bar and the story panel, left of the open corner
// card: each beat's frame is fitted into it (camera distance + setViewOffset), so a phone sees the
// machine large in the strip it has, not a far view of the whole room.
import * as THREE from 'three';
import { t, raw } from './i18n.js';
import { CASTLE_A, CASTLE_B, COLORS } from './world.js';
import { SHOTS } from './camera.js';
import { ZOOM, windowPath, roomArrival, setVeil } from '../../lib/zoom.js';
import { key, padlock, packet } from './props.js';
import * as A from '../../lib/saga-aes.js';
import * as P from './packet.js';

const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const clamp01 = k => Math.max(0, Math.min(1, k));
const span = (time, a, b) => ease(clamp01((time - a) / (b - a)));
const hx = x => x.toString(16).padStart(2, '0');

// the upper lit window of Bob's keep on the valley side (+z), y 9 above the plateau: the way in, the
// mirror of Alice's (DOORS.a in cle-vallee); the keep has a window on each side, so Bob's castle,
// turned half a turn to face the road, still has one towards the valley.
// focus: the point behind the glass the zoom closes on (lib/zoom.js); normal: out through the window,
// the line the camera ends on; near: where a mode switch leaves the camera, in front of the keep.
const WINDOW = () => v(CASTLE_B.x, CASTLE_B.y + 9, 3.52);
// Alice's keep (r369) is the same: its window on the valley side (+z), as DOORS.a in cle-vallee.
export const DOORS = {
  a: () => ({ focus: v(CASTLE_A.x, CASTLE_A.y + 9, 0), normal: v(0, 0, 1),
              near: { pos: v(CASTLE_A.x + 3, CASTLE_A.y + 12.5, 16), target: v(CASTLE_A.x, CASTLE_A.y + 9, 3.52) } }),
  b: () => ({ focus: v(CASTLE_B.x, CASTLE_B.y + 9, 0), normal: v(0, 0, 1),
              near: { pos: v(CASTLE_B.x - 3, CASTLE_B.y + 12.5, 16), target: WINDOW() } }),
};

// ---------- what a room is made of ----------
// a square tile with a byte on it: two hex digits, or a letter of the order. One material per face
// and colour, shared, and one box, so the room builds and uploads in the zoom's time
const faces = new Map();
function face(text, { fg, bg, size = 74 }) {
  const id = [text, fg, bg, size].join('|');
  if (faces.has(id)) return faces.get(id);
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = fg; g.globalAlpha = .55; g.lineWidth = 6; g.strokeRect(5, 5, 118, 118); g.globalAlpha = 1;
  g.fillStyle = fg; g.font = `700 ${size}px ui-monospace, Menlo, Consolas, monospace`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 64, 68);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  // unlit, so a byte keeps the card's colour under the torches (a zero dim, a masked byte orange)
  const m = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }); m.userData.shared = true;
  faces.set(id, m); return m;
}
const side = new THREE.MeshStandardMaterial({ color: 0x1a120c }); side.userData.shared = true;
const BOX = new THREE.BoxGeometry(1, 1, .22); BOX.userData.shared = true;
function tile(b, ink, text = hx(b)) {
  const m = new THREE.Mesh(BOX, [side, side, side, side, face(text, ink), side]);
  m.visible = false; m.userData.b = b; return m;
}
// the colours of the corner card: the locked keys and the AES key violet, the HMAC key and the seals
// green, the IV blue, the ciphertext yellow, the order cream, its padding gold; a pair of seal bytes
// that match bright green, what Eve changed (and what differs) red, the byte she meant to change orange
const INK = { key: { fg: '#e3b8ff', bg: '#2a1838', size: 62 }, mac: { fg: '#8fd18a', bg: '#12301a', size: 62 },
  iv: { fg: '#9fd3f0', bg: '#12283a', size: 62 }, c: { fg: '#ffd84d', bg: '#2a2008', size: 62 },
  seal: { fg: '#8fd18a', bg: '#12301a', size: 62 }, p: { fg: '#fff3dc', bg: '#3a2b1a', size: 80 },
  pad: { fg: '#ffd27a', bg: '#5a3c10', size: 62 }, ok: { fg: '#eaffe6', bg: '#1f6a2a', size: 62 },
  bad: { fg: '#ffd0d4', bg: '#6a1420', size: 62 }, x: { fg: '#ffb070', bg: '#3a1e0c', size: 62 } };

// a word floating in the room, always facing the camera; plate: on a dark ground (over the tiles);
// align: 0 its left end at its position, .5 its middle, 1 its right end
function label(text, color, h = .8, { plate = false, align = .5 } = {}) {
  const c = document.createElement('canvas'), g = c.getContext('2d'), font = '600 56px system-ui, sans-serif';
  g.font = font; c.width = Math.ceil(g.measureText(text).width) + 40; c.height = 84;
  if (plate) { g.fillStyle = 'rgba(14,10,7,.86)'; g.beginPath(); g.roundRect(2, 4, c.width - 4, c.height - 8, 18); g.fill(); }
  g.font = font; g.fillStyle = color; g.textBaseline = 'middle'; g.fillText(text, 20, 44);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: !plate }));
  s.scale.set(h * c.width / c.height, h, 1); s.center.set(align, .5); s.userData = { h, plate, text }; s.visible = false;
  if (plate) s.renderOrder = 30;
  return s;
}
function relabel(s, text, color) {
  if (s.userData.text === text) return;
  const n = label(text, color, s.userData.h, { plate: s.userData.plate }); s.material.map?.dispose(); s.material.map = n.material.map; s.scale.copy(n.scale);
  s.userData.text = text;
}
const show = (o, k, opacity = 1) => { o.visible = k > .001; if (o.material?.opacity !== undefined && o.isSprite) o.material.opacity = k * opacity; };

// the stone room, lit by two torches; rows: how high its back wall goes (a phone's upright machine is tall)
function buildRoom(scene, portrait, rows, cols = 36, cx = 0) {
  scene.background = new THREE.Color(0x120c08);
  scene.fog = new THREE.Fog(0x120c08, 60, 130);
  scene.add(new THREE.HemisphereLight(0xffe0b0, 0x2a1a10, .9));
  const stone = new THREE.MeshStandardMaterial({ color: 0x8a7c68, roughness: .95, flatShading: true });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(cols * 2 + 8, 40, 30, 20), new THREE.MeshStandardMaterial({ color: 0x4a3e32, roughness: 1, flatShading: true }));
  { const p = floor.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (Math.sin(i * 12.9898) * 43758.5453 % 1) * .08); floor.geometry.computeVertexNormals(); }
  floor.rotation.x = -Math.PI / 2; floor.position.x = cx; floor.receiveShadow = true; scene.add(floor);
  const wall = new THREE.InstancedMesh(new THREE.BoxGeometry(1.95, 1.45, 1), stone, rows * cols), m4 = new THREE.Matrix4();
  for (let y = 0, i = 0; y < rows; y++) for (let x = -cols / 2; x < cols / 2; x++, i++)
    wall.setMatrixAt(i, m4.makeTranslation(cx + x * 2 + (y % 2), y * 1.5 + .75, -9 - Math.abs(Math.sin(x * 7 + y)) * .15));
  wall.receiveShadow = true; scene.add(wall);
  const tx = portrait ? 14 : 30, ty = portrait ? rows * 1.5 - 6 : 14;
  for (const x of [-tx, tx]) {
    const light = new THREE.PointLight(0xffa040, portrait ? 35 : 60, 40, 1.6); light.position.set(x, ty, -7.6); scene.add(light);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(.32, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc070 }));
    flame.position.copy(light.position); scene.add(flame);
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(.1, .16, 1, 6), new THREE.MeshStandardMaterial({ color: 0x2a1c12 }));
    holder.position.set(x, ty - .7, -8); scene.add(holder);
    scene.userData.flames = [...(scene.userData.flames || []), { light, flame }];
  }
  for (const y of portrait ? [rows * 1.5 - 8, rows * .6] : [16]) {
    const over = new THREE.PointLight(0xffb060, portrait ? 45 : 90, 60, 1.4); over.position.set(0, y, 10); scene.add(over);
  }
  const key = new THREE.DirectionalLight(0xfff0dd, 1.2); key.position.set(6, 30, 14); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -30, right: 30, top: 50, bottom: -6 }); scene.add(key);
}

// ---------- Bob's room of episode 1.5: 'open' (step 7) and 'why' (step 10) ----------
// The machine, three stations one above the other, each read left to right:
//   1. the locked keys (256 bytes, a 16x16 wall) go into the RSA-2048 box, where Bob's private key
//      turns; the 64 bytes come out, the AES key (violet) over the HMAC key (green);
//   2. a copy of IV ‖ ciphertext (3 blocks) and the HMAC key go into the HMAC-SHA256 box; Bob's seal
//      comes out under the packet's, and each pair of bytes lights, green if equal, red if not; a lamp;
//   3. only then the AES key and another copy of IV ‖ ciphertext go into the AES-256-CBC box; the
//      plaintext comes out, its padding drops away, the order is read.
// 'why' plays it on Eve's packet (the first byte of the ciphertext changed): the seals differ, the
// lamp goes red and the AES box stays shut; then the mistake, decrypt first: AES works on Eve's bytes
// and what it gives is shown. Every tile is a byte of the card's (packet.js receive).
// A block is 16 bytes as a 4x4 square (cell), read left to right, top to bottom, like a card row.
function bobRoom(scene, pkt, portrait, evil) {
  buildRoom(scene, portrait, 28); scene.fog.far = 260;   // the whole machine, seen once, is further than 1.4's wall
  const r = P.receive(pkt), late = evil ? P.receive(pkt, false) : r;
  const ct = A.concat(pkt.C), msg = A.concat([pkt.iv, ct]), out = A.concat(A.cbcDec(r.keys.slice(0, 32), pkt.iv, pkt.C));
  const pad = out[out.length - 1], keep = out.length - pad, eq = [...r.mine].map((x, i) => x === pkt.tag[i]);
  const Y1 = 32.4, Y2 = 18.6, Y3 = 5.6, Q = .62, BP = 5.1;
  const cell = (c, j) => v(c.x + (j % 4 - 1.5) * 1.12, c.y - (Math.floor(j / 4) - 1.5) * 1.12);
  const at = blocks => i => cell(blocks[Math.floor(i / 16)], i % 16);
  const EK = v(-13, Y1), ekAt = i => v(EK.x + (i % 16 - 7.5) * Q, EK.y + (7.5 - Math.floor(i / 16)) * Q);
  const KB = [v(8.5, Y1 + 2.55), v(8.5 + BP, Y1 + 2.55), v(8.5, Y1 - 2.55), v(8.5 + BP, Y1 - 2.55)];   // AES key, then HMAC key
  const MB = [v(-17.2, Y2), v(-17.2 + BP, Y2), v(-17.2 + 2 * BP, Y2)];                           // IV, C1, C2
  const TB = [v(11, Y2 + 2.55), v(11 + BP, Y2 + 2.55)], SB = [v(11, Y2 - 2.55), v(11 + BP, Y2 - 2.55)];   // the packet's seal, Bob's
  const OB = [v(11, Y3), v(11 + BP, Y3)];                                                        // what AES gives
  const kAt = at(KB), mAt = at(MB), tAt = at(TB), sAt = at(SB), oAt = at(OB);
  const RSA = v(0, Y1), MAC = v(2, Y2), AES = v(2, Y3), LAMP = v(21.2, Y2);

  // the tiles: the packet as it came, the copies that go into the boxes, what comes out
  const mk = (bytes, ink, text = hx) => [...bytes].map((b, i) => { const m = tile(b, typeof ink === 'function' ? ink(i) : ink, text(b, i)); scene.add(m); return m; });
  const msgInk = i => i < 16 ? INK.iv : evil && i === 16 + P.EVE.i ? INK.bad : INK.c;
  const plainInk = i => i >= keep ? INK.pad : !evil ? INK.p : i < 16 ? INK.bad : i === 16 + P.EVE.i ? INK.x : INK.p;
  const plainText = (b, i) => (plainInk(i) === INK.p || plainInk(i) === INK.x) && b >= 32 && b < 127 ? (b === 32 ? '␣' : String.fromCharCode(b)) : hx(b);
  const T = { ek: mk(pkt.ek, INK.key), keys: mk(r.keys, i => i < 32 ? INK.key : INK.mac), msg: mk(msg, msgInk), tag: mk(pkt.tag, INK.seal),
    macIn: mk(r.keys.slice(32), INK.mac), msgIn: mk(msg, msgInk), mine: mk(r.mine, INK.seal),
    aesIn: mk(r.keys.slice(0, 32), INK.key), msgIn2: mk(msg, msgInk), out: mk(out, plainInk, plainText) };
  T.ek.forEach(m => m.userData.s = .55);
  // a pair of seal bytes compared: both tiles take the colour of the verdict
  const judged = [...T.tag, ...T.mine].map((m, i) => tile(m.userData.b, eq[i % 32] ? INK.ok : INK.bad));
  judged.forEach(m => scene.add(m));

  // the boxes: a dark metal block with gold edges, its name on the front, and a slot on top for a key
  const metal = new THREE.MeshStandardMaterial({ color: 0x3a3440, emissive: 0x1a1420, roughness: .45, metalness: .5 });
  const machine = (c, w, name) => {
    const riser = new THREE.Group(); riser.position.copy(c); scene.add(riser);
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, 5.4, 4.4), metal); box.castShadow = box.receiveShadow = true; riser.add(box);
    const gold = new THREE.LineBasicMaterial({ color: 0xffc24d }); riser.add(new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), gold));
    const slot = new THREE.Mesh(new THREE.BoxGeometry(2.2, .2, .7), new THREE.MeshStandardMaterial({ color: 0x0a0a10, metalness: .8 })); slot.position.y = 2.75; riser.add(slot);
    const l = label(name, '#ffd27a', 1.0); l.position.set(c.x, c.y + .4, 2.4); scene.add(l);
    return { riser, gold, l, c, inM: v(c.x - w / 2, c.y), outM: v(c.x + w / 2, c.y), top: v(c.x, c.y + 2.7) };
  };
  const BX = { rsa: machine(RSA, 6, 'RSA-2048'), mac: machine(MAC, 6, 'HMAC-SHA256'), aes: machine(AES, 6, 'AES-256-CBC') };
  const work = (b, time, a, z) => { const on = time > a && time < z; b.riser.position.x = b.c.x + (on ? Math.sin(time * 60) * .03 : 0); b.gold.color.setHex(on ? 0xffe9a8 : 0xffc24d); };
  // Bob's private key, gold, over the RSA box: it goes into the slot and turns
  const priv = key(COLORS.b, .7); priv.scale.setScalar(2.6); scene.add(priv);
  const privHome = v(RSA.x - 4.6, Y1 + 4.4), privIn = v(RSA.x, Y1 + 4.0);
  // AES's shutter, on 'why': two red bars across the box's front while the seal is wrong
  const shut = new THREE.Group(), red = new THREE.MeshBasicMaterial({ color: 0xff4d5e, transparent: true });
  for (const s of [1, -1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(7.4, .5, .2), red); b.rotation.z = s * .62; shut.add(b); }
  shut.position.set(AES.x, AES.y, 2.5); scene.add(shut);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.0, 24, 16), new THREE.MeshBasicMaterial({ color: 0x3a3226 }));
  lamp.position.copy(LAMP); scene.add(lamp);

  // the words, each on a dark plate (over the stone and the tiles), in the card's colours
  const word = (text, color, pos, h = .85, align = .5) => { const l = label(text, color, h, { plate: true, align }); l.position.copy(pos); l.position.z = 1.2; scene.add(l); return l; };
  const mid = bs => v((bs[0].x + bs[bs.length - 1].x) / 2, (bs[0].y + bs[bs.length - 1].y) / 2);
  const L = { ek: word(t('in.ek'), '#e3b8ff', v(EK.x, Y1 + 5.7)), priv: word(t('in.priv'), '#ffd27a', v(RSA.x - 4.6, Y1 + 6.6)),
    unlock: word(t('in.unlock'), '#ffd27a', v(RSA.x, Y1 - 3.5), .75),
    aes: word(t('in.aes'), '#e3b8ff', v(mid(KB.slice(0, 2)).x, Y1 + 5.6)), mac: word(t('in.mac'), '#8fd18a', v(mid(KB.slice(2)).x, Y1 - 5.5)),
    msg: word(t('in.msg'), '#9fd3f0', v(mid(MB).x, Y2 + 3.1)), tag: word(t('in.tag'), '#8fd18a', v(mid(TB).x, Y2 + 5.55)),
    mine: word(t('in.mine'), '#8fd18a', v(mid(SB).x, Y2 - 5.5)),
    verdict: word(r.sealOk ? t('in.sealOk') : t('in.sealBad', { n: eq.filter(Boolean).length }), r.sealOk ? '#8fd18a' : '#ff8f9a', v(mid(SB).x, Y2 - 5.5)),
    dec: word(t('in.dec'), '#ffd27a', v(AES.x, Y3 + 3.6), .75),
    unpad: word(t(evil ? 'in.pad' : 'in.unpad', { n: pad, pad: raw(late.padGood ? 'card.padYes' : 'card.padNo') }), '#ffd27a', v(mid(OB).x, Y3 + 3.1), .75),
    order: word(evil ? `« ${A.printable(late.back)} »` : `« ${A.text(r.back)} »`, evil ? '#ff8f9a' : '#fff3dc', v(mid(OB).x, Y3 - 3.3), 1.1) };
  if (evil) Object.assign(L, { flip: word(t('in.flip'), '#ff8f9a', v(MB[1].x, Y2 - 3.1), .75),
    shut: word(t('in.shut'), '#ff8f9a', v(AES.x, Y3 + 3.6), .8), first: word(t('in.first'), '#ff8f9a', v(AES.x, Y3 + 3.6), .8) });

  // tiles pop up where they sit; stream into a point, shrinking; and out of one, growing
  const hide = list => list.forEach(m => { m.visible = false; });
  const pop = (list, pos, time, a, gap) => list.forEach((m, i) => {
    const q = span(time, a + i * gap, a + i * gap + .4), s = m.userData.s ?? 1; m.position.copy(pos(i)); m.scale.setScalar(q * s); m.rotation.x = 0; m.visible = q > .02;
  });
  const lag = (i, row = 16) => (i % row) * .02 + Math.floor(i / row) * .07;
  const into = (list, pos, p, time, a, b, row) => list.forEach((m, i) => {
    const q = span(time, a + lag(i, row), b - 1.2 + lag(i, row)), s = m.userData.s ?? 1;
    m.position.lerpVectors(pos(i), p, q); m.position.z = .3 + Math.sin(Math.PI * q) * 2.5; m.scale.setScalar(s * (1 - .7 * q)); m.rotation.x = 0; m.visible = time > a && q < .999;
  });
  const outOf = (list, p, pos, time, a, b) => list.forEach((m, i) => {
    const q = span(time, a + lag(i), b - 1.2 + lag(i));
    m.position.lerpVectors(p, pos(i), q); m.position.z = 0; m.scale.setScalar(.3 + .7 * q); m.rotation.x = (1 - q) * Math.PI; m.visible = q > .001;
  });

  // the times. 'open': the packet; the keys; the seal; the order. 'why' goes on: AES stays shut, then the mistake
  const S = { ek: .1, msg: .7, tag: 1.0, priv: 1.9, turn: 2.5, ekIn: 2.9, rsa: 4.5, keys: 5.6, macIn: 7.4, msgIn: 8.4, mac: 9.9, mine: 10.8,
    cmp: 12.6, lamp: 13.8, aesIn: 14.6, msgIn2: 15.4, aes: 16.9, out: 17.8, drop: 19.8, order: 20.4, end: 21.6 };
  if (evil) Object.assign(S, { shut: 14.4, first: 17.0, aesIn: 17.6, msgIn2: 18.4, aes: 19.9, out: 20.8, drop: 99, order: 22.6, end: 24.4 });
  let now = 0;
  const seen = (l, a, b = 99) => show(l, span(now, a, a + .5) * (1 - span(now, b, b + .4)));
  function pose(beat, time) {
    now = time;
    for (const list of Object.values(T)) hide(list);
    hide(judged);
    // the packet: the locked keys' wall, IV ‖ ciphertext, the seal
    pop(T.ek, ekAt, time, S.ek, .0025); pop(T.msg, mAt, time, S.msg, .012); pop(T.tag, tAt, time, S.tag, .012);
    seen(L.ek, S.ek); seen(L.msg, S.msg); seen(L.tag, S.tag); for (const b of Object.values(BX)) seen(b.l, 0);
    if (evil) seen(L.flip, S.msg + .6, S.msgIn);
    // 1. Bob's key goes in and turns; the wall streams into the box; the two keys come out
    const kin = span(time, S.priv, S.turn), turn = span(time, S.turn, S.turn + .4);
    priv.position.lerpVectors(privHome, privIn, kin); priv.rotation.set(0, turn * Math.PI / 2, -Math.PI / 2 * kin);
    seen(L.priv, .3, S.turn);
    if (time > S.ekIn) into(T.ek, ekAt, BX.rsa.inM, time, S.ekIn, S.rsa + .6);
    work(BX.rsa, time, S.rsa, S.keys + .4); seen(L.unlock, S.rsa - .3, S.macIn);
    outOf(T.keys, BX.rsa.outM, kAt, time, S.keys, S.keys + 1.6); seen(L.aes, S.keys + 1); seen(L.mac, S.keys + 1);
    // 2. the HMAC key and a copy of IV ‖ ciphertext into the HMAC box; Bob's seal out, under the packet's
    if (time > S.macIn) into(T.macIn, i => kAt(32 + i), BX.mac.top, time, S.macIn, S.macIn + 1.6);
    if (time > S.msgIn) into(T.msgIn, mAt, BX.mac.inM, time, S.msgIn, S.mac + .3);
    work(BX.mac, time, S.mac, S.mine + .3);
    outOf(T.mine, BX.mac.outM, sAt, time, S.mine, S.mine + 1.6); seen(L.mine, S.mine + 1, S.lamp);
    // the pairs, column by column: both tiles of a pair take the verdict's colour
    for (let i = 0; i < 32; i++) {
      if (time < S.cmp + (i % 16) * .05 + Math.floor(i / 16) * .2 || !T.mine[i].visible) continue;
      for (const [m, j] of [[T.tag[i], i], [T.mine[i], 32 + i]]) { const n = judged[j]; n.position.copy(m.position); n.scale.copy(m.scale); n.visible = true; m.visible = false; }
    }
    const lit = span(time, S.lamp, S.lamp + .4);
    lamp.material.color.setHex(lit < .5 ? 0x3a3226 : r.sealOk ? 0x5fe39a : 0xff4d5e); lamp.scale.setScalar(1 + .25 * Math.sin(Math.PI * lit));
    seen(L.verdict, S.lamp);
    // 3. the AES box: on 'why' it stays shut while the seal is wrong; then (the mistake) it runs anyway
    if (evil) { const k = span(time, S.shut, S.shut + .4) * (1 - span(time, S.first, S.first + .5)); shut.visible = k > .01; shut.scale.setScalar(Math.max(.01, k)); red.opacity = k;
      seen(L.shut, S.shut + .2, S.first - .3); seen(L.first, S.first + .2); } else shut.visible = false;
    if (time > S.aesIn) into(T.aesIn, kAt, BX.aes.top, time, S.aesIn, S.aesIn + 1.6);
    if (time > S.msgIn2) into(T.msgIn2, mAt, BX.aes.inM, time, S.msgIn2, S.aes + .3);
    work(BX.aes, time, S.aes, S.out + .3); if (!evil) seen(L.dec, S.aesIn, S.drop + .4);
    outOf(T.out, BX.aes.outM, oAt, time, S.out, S.out + 1.6);
    // the padding drops away (the right order), and the order is read; on 'why', what AES made of Eve's bytes
    for (let i = keep; i < out.length && !evil; i++) { const m = T.out[i], q = span(time, S.drop + (i - keep) * .03, S.drop + .5 + (i - keep) * .03);
      if (q > 0) { m.position.y -= q * 3; m.scale.multiplyScalar(1 - q); m.visible = q < .98; } }
    seen(L.unpad, evil ? S.order + .5 : S.drop); seen(L.order, S.order);
  }

  // what the camera holds. Landscape: everything as the packet comes in, then the station at work
  // with the one before it. A phone's band is a short strip: it follows the action, one station half
  // at a time, the tiles large
  const pts = (x0, y0, x1, y1) => [v(x0, y0), v(x1, y1)];
  const desk = time => time < S.priv ? pts(-19.6, Y2 - 3.6, 23, Y1 + 6.4)   // the packet as it comes in: the third row waits empty : time < S.macIn ? pts(-18.4, Y1 - 4.4, 17, Y1 + 7.2)
    : time < S.msgIn ? pts(-19.6, Y2 - 3, 17, Y1 + 1) : time < S.lamp + 1.2 ? pts(-19.6, Y2 - 6.2, 23, Y2 + 6.4)
    : time < S.out ? pts(-19.6, Y3 - 4.6, 23, Y2 + 3.4) : pts(-7.4, Y3 - 4.6, 23, Y3 + 5.2);
  const phone = time => time < S.priv ? pts(-18.4, Y1 - 5.2, 3.4, Y1 + 7.2)
    : time < S.rsa ? pts(-18.4, Y1 - 5.2, 3.4, Y1 + 7.2)
    : time < S.macIn ? pts(-3.4, Y1 - 6, 16.4, Y1 + 6.2)
    : time < S.msgIn ? pts(-1.4, Y2 - 3, 16.4, Y1 - 1)
    : time < S.mine ? pts(-19.6, Y2 - 3.6, 5.4, Y2 + 3.8)
    : time < S.cmp ? pts(-1.4, Y2 - 5.4, 18.6, Y2 + 5.2) : time < S.lamp + 1.6 ? pts(8.2, Y2 - 6.0, 22.4, Y2 + 5.9)
    : evil && time < S.first + .8 ? pts(-6.6, Y3 - 3.4, 10.6, Y3 + 4.6)
    : time < S.out ? pts(-6.6, Y3 - 3.4, 10.6, Y3 + 4.6)
    : time < S.out + 1.4 ? pts(-1.4, Y3 - 3.2, 19.4, Y3 + 3.2) : pts(6.4, Y3 - 4.4, 20.8, Y3 + 4.2);
  const id = evil ? 'why' : 'open';
  return { beats: { [id]: { end: S.end } }, pose, frame: (b, time) => portrait ? phone(time) : desk(time), tiles: T, r, late };
}
// ---------- Alice's room of episode 1.5: 'draw', 'encrypt', 'seal', 'lock' (steps 2-5, r369) ----------
// The mirror of Bob's: four rows, one per move, top to bottom, each read left to right:
//   0. os.urandom: three fresh draws pop out, the AES key (violet), the HMAC key (green), the IV (blue);
//   1. the order and its PKCS7 padding go into AES-256-CBC with a copy of the AES key and the IV; the
//      ciphertext (yellow) comes out;
//   2. a copy of the IV and of the ciphertext, side by side, go into HMAC-SHA256 with the HMAC key;
//      the seal comes out;
//   3. both keys, 64 bytes, go into RSA-2048-OAEP with Bob's padlock, open, his public key; 256 bytes
//      come out and the padlock snaps shut on them.
// The packet (props.js, the valley's) stands at the right of the row at work and gets each brick as it
// is made. One room, four beats on ONE clock (OFF): a beat starts where the one before ended, so any
// step straight in shows the moves before it done. Every tile is a byte of the card's (packet.js send).
function aliceRoom(scene, s, portrait) {
  buildRoom(scene, portrait, 40, 80, 7); scene.fog.far = 260;   // wide: the packet stands at the right of the rows
  const plain = A.pad(s.raw), ct = A.concat(s.C), keys = s.keys;
  const Y0 = 39, Y1 = 28.5, Y2 = 18, Y3 = 6.4, Q = .62, BP = 5.1, PX = 26.6;
  const cell = (c, j) => v(c.x + (j % 4 - 1.5) * 1.12, c.y - (Math.floor(j / 4) - 1.5) * 1.12);
  const at = blocks => i => cell(blocks[Math.floor(i / 16)], i % 16);
  const KA = [v(-4, Y0), v(-4 + BP, Y0)], KM = [v(8, Y0), v(8 + BP, Y0)], KI = [v(20.4, Y0)];             // the draws
  const PB = [v(-17.2, Y1), v(-17.2 + BP, Y1)], CB = [v(11, Y1), v(11 + BP, Y1)];                     // the order in, the ciphertext out
  const MB = [v(-17.2, Y2), v(-17.2 + BP, Y2), v(-17.2 + 2 * BP, Y2)], TB = [v(11, Y2), v(11 + BP, Y2)];   // IV ‖ ciphertext in, the seal out
  const KB = [v(-17.2, Y3 + 2.55), v(-17.2 + BP, Y3 + 2.55), v(-17.2, Y3 - 2.55), v(-17.2 + BP, Y3 - 2.55)];   // AES key, then HMAC key
  const EK = v(12.2, Y3), ekAt = i => v(EK.x + (i % 16 - 7.5) * Q, EK.y + (7.5 - Math.floor(i / 16)) * Q);
  const kaAt = at(KA), kmAt = at(KM), ivAt = at(KI), pAt = at(PB), cAt = at(CB), mAt = at(MB), tAt = at(TB), kAt = at(KB);
  const srcMsg = i => i < 16 ? ivAt(i) : cAt(i - 16), srcKeys = i => i < 32 ? kaAt(i) : kmAt(i - 32);

  const mk = (bytes, ink, text = hx) => [...bytes].map((b, i) => { const m = tile(b, typeof ink === 'function' ? ink(i) : ink, text(b, i)); scene.add(m); return m; });
  const plainInk = i => i >= s.n ? INK.pad : INK.p;
  const plainText = (b, i) => i < s.n && b >= 32 && b < 127 ? (b === 32 ? '␣' : String.fromCharCode(b)) : hx(b);
  const T = { key: mk(s.key, INK.key), macKey: mk(s.macKey, INK.mac), iv: mk(s.iv, INK.iv),
    plain: mk(plain, plainInk, plainText), aesIn: mk(s.key, INK.key), ivIn: mk(s.iv, INK.iv), ct: mk(ct, INK.c),
    msg: mk(A.concat([s.iv, ct]), i => i < 16 ? INK.iv : INK.c), macIn: mk(s.macKey, INK.mac), tag: mk(s.tag, INK.seal),
    keys: mk(keys, i => i < 32 ? INK.key : INK.mac), ek: mk(s.ek, INK.key) };
  T.ek.forEach(m => m.userData.s = .55);

  const metal = new THREE.MeshStandardMaterial({ color: 0x3a3440, emissive: 0x1a1420, roughness: .45, metalness: .5 });
  const machine = (c, w, name) => {
    const riser = new THREE.Group(); riser.position.copy(c); scene.add(riser);
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, 5.4, 4.4), metal); box.castShadow = box.receiveShadow = true; riser.add(box);
    const gold = new THREE.LineBasicMaterial({ color: 0xffc24d }); riser.add(new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), gold));
    const slot = new THREE.Mesh(new THREE.BoxGeometry(2.2, .2, .7), new THREE.MeshStandardMaterial({ color: 0x0a0a10, metalness: .8 })); slot.position.y = 2.75; riser.add(slot);
    const l = label(name, '#ffd27a', 1.0); l.position.set(c.x, c.y + .4, 2.4); scene.add(l);
    return { riser, gold, l, c, inM: v(c.x - w / 2, c.y), outM: v(c.x + w / 2, c.y), top: v(c.x, c.y + 2.7) };
  };
  const BX = { rand: machine(v(-15.4, Y0), 6.4, 'os.urandom'), aes: machine(v(2, Y1), 6, 'AES-256-CBC'),
    mac: machine(v(2, Y2), 6, 'HMAC-SHA256'), rsa: machine(v(2, Y3), 6.6, 'RSA-2048-OAEP') };
  const work = (b, time, a, z) => { const on = time > a && time < z; b.riser.position.x = b.c.x + (on ? Math.sin(time * 60) * .03 : 0); b.gold.color.setHex(on ? 0xffe9a8 : 0xffc24d); };
  // Bob's padlock, open: his public key. It sinks into the RSA box's slot, then snaps shut on what comes out
  const lock = padlock(COLORS.b); lock.scale.setScalar(2.4); scene.add(lock);
  const lockHome = v(-6.5, Y3 + 6.2), lockIn = v(2, Y3 + 3.4), lockOn = v(EK.x, Y3 + 5.6, 1.2);
  // the packet, the valley's, at the right of the row at work
  const pk = packet(); pk.scale.setScalar(3); scene.add(pk);
  const ROW = [Y0, Y1, Y2, Y3];

  const word = (text, color, pos, h = .85, align = .5) => { const l = label(text, color, h, { plate: true, align }); l.position.copy(pos); l.position.z = 1.2; scene.add(l); return l; };
  const mid = bs => v((bs[0].x + bs[bs.length - 1].x) / 2, (bs[0].y + bs[bs.length - 1].y) / 2);
  const L = { aes: word(t('in.aes'), '#e3b8ff', v(mid(KA).x, Y0 + 3.4)), mac: word(t('in.mac'), '#8fd18a', v(mid(KM).x, Y0 + 3.4)),
    iv: word(t('al.iv'), '#9fd3f0', v(KI[0].x, Y0 + 3.4)),
    plain: word(t('al.plain', { n: s.n, p: s.padN }), '#fff3dc', v(mid(PB).x, Y1 + 3.4)), enc: word(t('in.dec'), '#ffd27a', v(2, Y1 + 3.6), .75),
    ct: word(t('al.ct', { n: ct.length }), '#ffd84d', v(mid(CB).x, Y1 + 3.4)),
    msg: word(t('in.msg'), '#9fd3f0', v(mid(MB).x, Y2 + 3.4)), hk: word(t('al.hk'), '#8fd18a', v(2, Y2 + 3.6), .75),
    tag: word(t('al.tag'), '#8fd18a', v(mid(TB).x, Y2 + 3.4)),
    keys: word(t('al.keys'), '#e3b8ff', v(mid(KB).x, Y3 + 5.6)), pub: word(t('al.pub'), '#ffd27a', v(lockHome.x, Y3 + 8.4), .75),
    oaep: word(t('al.oaep'), '#ffd27a', v(2, Y3 - 3.6), .75), ek: word(t('in.ek'), '#e3b8ff', v(EK.x, Y3 - 5.8)),
    packet: word(t('al.packet'), '#fff3dc', v(PX, Y0 + 2.6)) };

  const hide = list => list.forEach(m => { m.visible = false; });
  const lag = (i, row = 16) => (i % row) * .02 + Math.floor(i / row) * .07;
  const pop = (list, pos, time, a, gap) => list.forEach((m, i) => {
    const q = span(time, a + i * gap, a + i * gap + .4), sc = m.userData.s ?? 1; m.position.copy(pos(i)); m.scale.setScalar(q * sc); m.rotation.x = 0; m.visible = q > .02;
  });
  // copies: they fly from where the bytes are to where they wait, full size
  const move = (list, from, to, time, a, b) => list.forEach((m, i) => {
    const q = span(time, a + lag(i), b - 1.2 + lag(i)); m.position.lerpVectors(from(i), to(i), q); m.position.z = .3 + Math.sin(Math.PI * q) * 2;
    m.scale.setScalar(m.userData.s ?? 1); m.rotation.x = 0; m.visible = time > a;
  });
  const into = (list, pos, p, time, a, b, row) => list.forEach((m, i) => {
    const q = span(time, a + lag(i, row), b - 1.2 + lag(i, row)), sc = m.userData.s ?? 1;
    m.position.lerpVectors(pos(i), p, q); m.position.z = .3 + Math.sin(Math.PI * q) * 2.5; m.scale.setScalar(sc * (1 - .7 * q)); m.rotation.x = 0; m.visible = time > a && q < .999;
  });
  const outOf = (list, p, pos, time, a, b) => list.forEach((m, i) => {
    const q = span(time, a + lag(i), b - 1.2 + lag(i)), sc = m.userData.s ?? 1;
    m.position.lerpVectors(p, pos(i), q); m.position.z = 0; m.scale.setScalar(sc * (.3 + .7 * q)); m.rotation.x = (1 - q) * Math.PI; m.visible = q > .001;
  });

  // the beats and their times, each from its own 0; OFF: where each starts on the room's one clock
  const S = {
    draw: { rand: .4, key: .8, mac: 2.2, iv: 3.6, brick: 5.0, end: 5.8 },
    encrypt: { plain: .2, pad: 1.2, keyIn: 2.4, ivIn: 3.0, in: 4.4, aes: 6.0, out: 7.0, brick: 9.0, end: 9.8 },
    seal: { keyIn: .2, gather: .4, in: 3.4, mac: 5.0, out: 6.0, brick: 8.0, end: 8.8 },
    lock: { gather: .2, pub: 1.6, in: 3.4, sink: 3.6, rsa: 5.2, out: 6.2, shut: 8.4, brick: 9.4, end: 10.4 },
  };
  const ORDER = ['draw', 'encrypt', 'seal', 'lock'], OFF = {};
  ORDER.reduce((o, b) => { OFF[b] = o; return o + S[b].end; }, 0);
  const G = (b, k) => OFF[b] + S[b][k];   // a time of beat b on the one clock
  let now = 0;
  const seen = (l, a, b = 999) => show(l, span(now, a, a + .5) * (1 - span(now, b, b + .4)));
  function pose(beat, time) {
    const g = now = OFF[beat] + Math.min(time, S[beat].end);
    for (const list of Object.values(T)) hide(list);
    for (const b of Object.values(BX)) seen(b.l, 0);
    // 0. the draws
    work(BX.rand, g, G('draw', 'rand'), G('draw', 'iv') + 1.2);
    outOf(T.key, BX.rand.outM, kaAt, g, G('draw', 'key'), G('draw', 'key') + 1.8);
    outOf(T.macKey, BX.rand.outM, kmAt, g, G('draw', 'mac'), G('draw', 'mac') + 1.8);
    outOf(T.iv, BX.rand.outM, ivAt, g, G('draw', 'iv'), G('draw', 'iv') + 1.6);
    seen(L.aes, G('draw', 'key') + 1); seen(L.mac, G('draw', 'mac') + 1); seen(L.iv, G('draw', 'iv') + 1);
    // 1. the order, then its padding; the AES key and the IV into the box's slot, the order into it; the ciphertext out
    pop(T.plain.slice(0, s.n), pAt, g, G('encrypt', 'plain'), .03);
    pop(T.plain.slice(s.n), i => pAt(s.n + i), g, G('encrypt', 'pad'), .03);
    seen(L.plain, G('encrypt', 'plain'));
    if (g > G('encrypt', 'keyIn')) into(T.aesIn, kaAt, BX.aes.top, g, G('encrypt', 'keyIn'), G('encrypt', 'keyIn') + 2);
    if (g > G('encrypt', 'ivIn')) into(T.ivIn, ivAt, BX.aes.top, g, G('encrypt', 'ivIn'), G('encrypt', 'ivIn') + 2);
    seen(L.enc, G('encrypt', 'keyIn'), G('encrypt', 'out') + 1);
    if (g > G('encrypt', 'in')) { into(T.plain, pAt, BX.aes.inM, g, G('encrypt', 'in'), G('encrypt', 'aes') + .3); seen(L.plain, G('encrypt', 'plain'), G('encrypt', 'aes')); }
    work(BX.aes, g, G('encrypt', 'aes'), G('encrypt', 'out') + .3);
    outOf(T.ct, BX.aes.outM, cAt, g, G('encrypt', 'out'), G('encrypt', 'out') + 1.6); seen(L.ct, G('encrypt', 'out') + 1);
    // 2. a copy of the IV and of the ciphertext side by side; the HMAC key into the slot, the copies in; the seal out
    if (g > G('seal', 'gather')) move(T.msg, srcMsg, mAt, g, G('seal', 'gather'), G('seal', 'gather') + 2.6);
    seen(L.msg, G('seal', 'gather') + 1.2, G('seal', 'mac'));
    if (g > G('seal', 'keyIn')) into(T.macIn, kmAt, BX.mac.top, g, G('seal', 'keyIn'), G('seal', 'keyIn') + 2.6);
    seen(L.hk, G('seal', 'keyIn'), G('seal', 'out') + 1);
    if (g > G('seal', 'in')) into(T.msg, mAt, BX.mac.inM, g, G('seal', 'in'), G('seal', 'mac') + .3);
    work(BX.mac, g, G('seal', 'mac'), G('seal', 'out') + .3);
    outOf(T.tag, BX.mac.outM, tAt, g, G('seal', 'out'), G('seal', 'out') + 1.6); seen(L.tag, G('seal', 'out') + 1);
    // 3. both keys side by side, Bob's open padlock; it sinks into the slot, the keys in; 256 bytes out, the padlock shut on them
    if (g > G('lock', 'gather')) move(T.keys, srcKeys, kAt, g, G('lock', 'gather'), G('lock', 'gather') + 3);
    seen(L.keys, G('lock', 'gather') + 1.2, G('lock', 'rsa'));
    const lp = span(g, G('lock', 'pub'), G('lock', 'pub') + .5), sink = span(g, G('lock', 'sink'), G('lock', 'sink') + 1.2), up = span(g, G('lock', 'shut') - .8, G('lock', 'shut'));
    lock.visible = lp > .01 && (sink < .99 || up > .01);
    lock.position.copy(up > 0 ? lockOn : lockHome); if (up === 0) lock.position.lerp(lockIn, sink);
    lock.scale.setScalar(2.4 * (up > 0 ? up : lp * (1 - .6 * sink)));
    lock.userData.setOpen(1 - span(g, G('lock', 'shut'), G('lock', 'shut') + .5));
    seen(L.pub, G('lock', 'pub') + .3, G('lock', 'sink'));
    if (g > G('lock', 'in')) into(T.keys, kAt, BX.rsa.inM, g, G('lock', 'in'), G('lock', 'rsa') + .3);
    work(BX.rsa, g, G('lock', 'rsa'), G('lock', 'out') + .4); seen(L.oaep, G('lock', 'rsa') - .3);
    outOf(T.ek, BX.rsa.outM, ekAt, g, G('lock', 'out'), G('lock', 'out') + 1.6); seen(L.ek, G('lock', 'out') + 1.6);
    // the packet: at the right of the row at work, a brick more at the end of each move
    const k = ORDER.indexOf(beat), row = ROW[k], from = ROW[Math.max(0, k - 1)], go = span(time, 0, 1.2);
    pk.position.set(PX, from + (row - from) * go - 1, 0);
    pk.userData.show(['iv', 'ct', 'tag', 'ek'].filter((b, i) => g >= G(ORDER[i], 'brick')));
    L.packet.position.set(PX, pk.position.y + 2.9, 1.2); seen(L.packet, 0);
    // the packet's padlock is the one on the 256 bytes: it shows once that one has shut
    pk.userData.parts.ek.children.forEach(c => { c.visible = g >= G('lock', 'brick'); });
  }

  // what the camera holds, per beat, on the beat's own clock. Landscape: the row at work, with the
  // draws above it while copies of them fly down. A phone follows the action, half a row at a time
  const pts = (x0, y0, x1, y1) => [v(x0, y0), v(x1, y1)];
  const L0 = -19.6, R0 = PX + 7.6, top = Y0 + 4.6, rows = (a, b) => pts(L0, b - 3.6, R0, a + 4.4);   // rows a (higher) to b
  const desk = {
    draw: () => pts(L0, Y0 - 3.6, R0, top),
    encrypt: time => time < S.encrypt.keyIn - .4 || time > S.encrypt.in ? rows(Y1, Y1) : rows(Y0, Y1),
    seal: time => time < 1.4 ? rows(Y0, Y1) : time < S.seal.in ? rows(Y1, Y2) : rows(Y2, Y2),
    lock: time => time < 1.2 ? rows(Y0, Y1) : time < 2.2 ? rows(Y1, Y2) : pts(L0, Y3 - 6.4, R0, Y3 + 9.8),
  };
  const phone = {
    draw: time => time < S.draw.mac ? pts(-19, Y0 - 3.4, 1.6, top) : time < S.draw.iv ? pts(-6.6, Y0 - 3.4, 15.6, top)
      : time < S.draw.brick ? pts(5.6, Y0 - 3.4, 23, top) : pts(12, Y0 - 3.4, R0, top),
    encrypt: time => time < S.encrypt.keyIn ? pts(-19.6, Y1 - 3.4, 5.4, Y1 + 4.4) : time < S.encrypt.in ? pts(-1.4, Y1 - 3.4, 23, top)
      : time < S.encrypt.out ? pts(-19.6, Y1 - 3.4, 5.4, Y1 + 4.4) : time < S.encrypt.brick ? pts(-1.4, Y1 - 3.4, 18.6, Y1 + 4.4) : pts(8.6, Y1 - 3.4, R0, Y1 + 4.4),
    seal: time => time < 1.4 ? pts(-1.4, Y1 - 3, 23, top) : time < S.seal.in ? pts(-19.6, Y2 - 3.4, 5.4, Y1 + 3.4)
      : time < S.seal.out ? pts(-19.6, Y2 - 3.4, 5.4, Y2 + 4.4) : time < S.seal.brick ? pts(-1.4, Y2 - 3.4, 18.6, Y2 + 4.4) : pts(8.6, Y2 - 3.4, R0, Y2 + 4.4),
    lock: time => time < 1.2 ? pts(-6.6, Y0 - 3.4, 15.6, top) : time < 2.2 ? pts(-14, Y2 - 3, 10, Y1 + 3) : time < S.lock.out ? pts(-19.6, Y3 - 4.4, 6, Y3 + 9.6)
      : time < S.lock.brick ? pts(1, Y3 - 6.4, 18.6, Y3 + 6.8) : pts(6, Y3 - 6.4, R0, Y3 + 6.8),
  };
  return { beats: Object.fromEntries(ORDER.map(b => [b, { end: S[b].end }])), pose, frame: (b, time) => (portrait ? phone : desk)[b](time), tiles: T };
}
// whose keep each room is in: its window is the way in and out
const DOOR = { alice: 'a', open: 'b', why: 'b' };
const ROOMS = { alice: (scene, pk, portrait) => aliceRoom(scene, pk.s, portrait), open: (scene, pk, portrait) => bobRoom(scene, pk.s, portrait, false), why: (scene, pk, portrait) => bobRoom(scene, pk.evil, portrait, true) };

// ---------- the switch between the valley and a room ----------
const SMOOTH = .04, BUBBLE = 84;   // the room camera closes 96% of the way to its framing every second
export class Inside {
  constructor({ renderer, renderPass, camera, rig, bubbles, instant }) {
    Object.assign(this, { renderer, renderPass, outer: { scene: renderPass.scene, camera }, rig, bubbles, instant });
    this.camera = new THREE.PerspectiveCamera(45, 1, .3, 300);
    this.veil = document.getElementById('veil');
    this.room = null; this.time = 0; this.token = 0; this.log = [];
    this.view = { center: v(0, 5, 0), d: 30 };
  }
  get active() { return !!this.room; }
  get portrait() { return innerWidth < innerHeight; }
  resize(aspect, fov) {
    this.camera.aspect = aspect; this.camera.fov = fov; this.camera.updateProjectionMatrix();
    if (this.room && this.room.portrait !== this.portrait) this.rebuild();
  }
  build(name, send) {
    const scene = new THREE.Scene(), machine = ROOMS[name](scene, send, this.portrait);
    return { name, send, scene, machine, portrait: this.portrait };
  }
  swap(room) {
    const old = this.room; this.room = room;
    const s = room ? room.scene : this.outer.scene, c = room ? this.camera : this.outer.camera;
    this.renderPass.scene = s; this.renderPass.camera = c; this.bubbles.camera = c;
    // the tiles' faces and box are shared by every build of the room (r160): they stay
    const own = x => x && !x.userData?.shared;
    if (old && old !== room) old.scene.traverse(o => { own(o.geometry) && o.geometry.dispose(); [o.material].flat().filter(own).forEach(m => { m.map?.dispose(); m.dispose(); }); });
  }
  // r103 (Simon 21 Oct: « keep zooming while the veil appears »): one move from wherever the camera
  // is to the glass, faster and faster in proportion, the veil on the same clock; the room camera
  // then goes on closing in at the rate the valley camera had (lib/zoom.js)
  async enter(name, beat, send, live = () => true) {
    const tok = ++this.token, door = DOORS[DOOR[name]](); this.focus = door.focus;   // focus: what tools/zoom_trace.py measures to
    // the room is built and its shaders compiled during the flight, so the swap does not stall
    const room = this.build(name, send); room.machine.pose(beat, 0);
    const ready = this.renderer.compileAsync(room.scene, this.camera).catch(() => {});
    // and its textures (the tiles' letters) go to the GPU during the flight too: uploaded at the swap,
    // they froze the first room frame for a quarter second under the veil (tools/zoom_trace.py)
    const maps = new Set(); room.scene.traverse(o => [o.material].flat().forEach(m => m?.map && maps.add(m.map)));
    [...maps].forEach((m, i) => setTimeout(() => { if (tok === this.token) this.renderer.initTexture(m); }, 100 + i * 8));
    const cam = this.outer.camera, from = { pos: cam.position.clone(), target: this.rig.controls.target.clone() };
    const path = windowPath({ from, focus: door.focus, normal: door.normal });
    this.zooming = { tok, live };
    await this.rig.fly({ pos: door.focus, target: door.focus }, this.instant ? .001 : ZOOM.T,
      { path: k => { setVeil(this.veil, ZOOM.veil(k)); return path(k); } });
    await ready;
    this.zooming = null;
    if (tok !== this.token || !live()) { setVeil(this.veil, 0); return false; }
    this.swap(room); this.log.push(['in', performance.now()]);
    this.beat(beat); this.fit(true);
    if (this.instant) setVeil(this.veil, 0);
    else this.arrival = { ...roomArrival(path.rate), tau: 0, out: false };
    this.update(0);
    return true;
  }
  beat(id) { if (!this.room) return; this.room.beat = id; this.time = this.instant ? this.room.machine.beats[id].end : 0; }
  // out the way it came, the same move backwards: the room camera backs off faster and faster as the
  // veil rises, then the valley camera pulls out of the window at that rate and slows onto shot
  async leave(shot) {
    if (!this.room) return;
    const tok = ++this.token, door = DOORS[DOOR[this.room.name]](); this.focus = door.focus;   // focus: what tools/zoom_trace.py measures to
    this.arrival = null;
    if (!shot) { this.swap(null); setVeil(this.veil, 0); this.rig.jump(door.near); return; }   // a mode switch: a cut
    const to = typeof shot === 'string' ? SHOTS[shot] : shot;
    const path = windowPath({ from: to, focus: door.focus, normal: door.normal });
    if (!this.instant) await new Promise(res => { this.arrival = { ...roomArrival(path.rate), tau: 0, out: true, res }; });
    if (tok !== this.token) return;
    this.swap(null); this.log.push(['out', performance.now()]);
    return this.rig.fly(to, this.instant ? .001 : ZOOM.T,
      { path: k => { setVeil(this.veil, ZOOM.veil(1 - k)); return path(1 - k); } });
  }
  rebuild(send = this.room?.send) {
    if (!this.room) return;
    const room = this.build(this.room.name, send), beat = this.room.beat;
    room.beat = beat; this.swap(room); this.room.machine.pose(beat, this.time); this.fit(true);
  }
  play() { if (this.room) this.time = 0; }
  // the speaker's bubble: the room's anchor, or the top of what the camera holds, a third in
  anchor() {
    if (!this.room) return;
    const own = this.room.machine.anchor?.(this.room.beat), b = this.want?.box;
    return own || (b ? v(b.min.x + (b.max.x - b.min.x) * .3, b.max.y + .3) : v(0, 8));
  }

  // the free band: below the top bar, above the story panel, left of an open corner card
  band() {
    const W = innerWidth, H = innerHeight, r = id => document.getElementById(id)?.getBoundingClientRect();
    const bar = [r('topbar'), r('modes'), r('lang')].filter(b => b && b.height).reduce((m, b) => Math.max(m, b.bottom), 0);
    const story = r('story'), card = document.getElementById('card'), cr = r('card');
    let top = bar + 8, bottom = story && story.height ? story.top - 8 : H, left = 0, right = W;
    if (cr && cr.height && !card.classList.contains('hidden')) {
      if (card.classList.contains('folded') && W < 900) bottom = Math.min(bottom, cr.top - 4);   // a phone's card is folded to a line (r84)
      else if (cr.left > W * .55) right = cr.left - 8;
    }
    if (bottom - top < H * .2) { top = 0; bottom = H; }
    return { W, H, left, top, w: right - left, h: bottom - top };
  }
  // where the camera should be to hold the beat's frame in the band
  fit(now = false) {
    const pts = this.room.machine.frame(this.room.beat, this.time), box = new THREE.Box3().setFromPoints(pts);
    const c = box.getCenter(v(0, 0)), size = box.getSize(v(0, 0)), b = this.band();
    // the top of the band is kept for the speaker's bubble, which points at the top of the frame
    const room = Math.min(BUBBLE, b.h * .25); b.top += room; b.h -= room;
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2) * 2, m = .9;
    const d = Math.max(size.y * b.H / (m * b.h), size.x * b.H / (m * b.w)) / tan + 2.2;
    this.want = { center: c, d, b, box };
    if (now) { this.view.center.copy(c); this.view.d = d; }
  }
  update(dt) {
    // a zoom in cut short (another step, another mode): its veil goes
    if (this.zooming && (this.zooming.tok !== this.token || !this.zooming.live())) { this.zooming = null; setVeil(this.veil, 0); }
    if (!this.room) return;
    this.time = this.hold ?? this.time + dt;   // hold: a still at that second (tools/room_stills.py)
    const m = this.room.machine;
    m.pose(this.room.beat, this.time);
    this.fit();
    const k = this.instant ? 1 : 1 - Math.pow(SMOOTH, dt), w = this.want;
    this.view.center.lerp(w.center, k);
    const a = this.arrival;
    if (a) {   // the zoom's room side (lib/zoom.js): in, closing on the framing; out, backing off it
      a.tau += dt / a.T;
      this.view.d = w.d * (a.out ? a.back(a.tau) : a.factor(a.tau));
      setVeil(this.veil, a.out ? a.backVeil(a.tau) : a.veil(a.tau));
      if (a.tau >= 1) { this.arrival = null; a.res?.(); }
    } else this.view.d += (w.d - this.view.d) * k;
    const c = this.view.center, d = this.view.d;
    this.camera.position.set(c.x + Math.sin(this.time * .25) * .02 * d, c.y + d * .14, c.z + d);
    this.camera.lookAt(c);
    // the look-at point lands in the middle of the free band, not of the screen
    const b = w.b; this.camera.setViewOffset(b.W, b.H, b.W / 2 - (b.left + b.w / 2), b.H / 2 - (b.top + b.h / 2), b.W, b.H);
    for (const f of this.room.scene.userData.flames || []) f.light.intensity = 55 + Math.sin(this.time * 13 + f.light.position.x) * 6 + Math.sin(this.time * 7.3) * 4;
  }
}
