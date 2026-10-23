// Inside the castles (r103, r162): two chapters of episode 1.6 happen inside the keeps. Chapter 2:
// Alice signs the packet in her keep (step 5 'sign': SHA-256, PSS, RSA with her private key), then Bob
// checks it in his (step 6 'verify': RSA with her public key, the block back, the digest recomputed).
// Chapter 4: Alice encrypts the order with AES-GCM in her keep (step 11 'gcm': counter blocks, AES,
// XOR, GHASH, the tag), then Bob gets Eve's changed ciphertext in his (step 12 'gcmEve': his tag does
// not match, InvalidTag, not a byte of the order comes out). Every tile is the story's real byte
// (sign.js, gcm.js, packet.js), the ones the corner card shows.
// ONE zoom per chapter: the camera zooms through the window of the first keep; at the second step it
// SLIDES across to the other keep (r566, ROOM slide: true: Inside.cut hands over to the slide, as 1.5)
// and comes out of that one's window at the next step.
// Each room hangs its owner's banners (Alice blue, Bob gold) so the slide reads.
// Copied from cle-vallee/js/inside.js (r160), itself from the reference room of eve-lit-tout (r158);
// the zoom itself is lib/zoom.js.
//
// The engine (enter, beat, cut, leave, the free band, the doors) is lib/room.js (r424), as is its API;
// this file keeps only the rooms (ROOM.rooms), each with its keep, and the stone room around them (shell).
import * as THREE from 'three';
import { tile, paint, label, show, buildRoom } from '../../lib/room-parts.js';
import { t, raw } from './i18n.js';
import { COLORS } from '../../lib/saga/world.js';
import { key as keyProp } from './props.js';
import * as A from '../../lib/saga-aes.js';
import * as R from '../../lib/rsa.js';
import * as S from './sign.js';
import * as P from './packet.js';
import { sha256 } from '../../lib/hmac.js';

const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const clamp01 = k => Math.max(0, Math.min(1, k));
const span = (time, a, b) => ease(clamp01((time - a) / (b - a)));
const hx = x => x.toString(16).padStart(2, '0');
const range = (a, b) => [...Array(Math.max(0, b - a)).keys()].map(x => x + a);

// ---------- what a room is made of: lib/room-parts.js (r485); here, the colours ----------
// the colours of the corner card: the signed packet's bricks (keys violet, IV blue, ciphertext yellow,
// seal green), the digest cream, PSS's fixed bytes gold, its zeros dim, the salt blue, what a mask
// has passed over orange, the signature Alice's blue; the order's letters cream, Eve's byte red
const INK = { key: { fg: '#e3b8ff', bg: '#2a1838' }, iv: { fg: '#9fd3f0', bg: '#12283a' }, c: { fg: '#ffd84d', bg: '#2a2008' },
  seal: { fg: '#8fd18a', bg: '#12301a' }, plain: { fg: '#fff3dc', bg: '#3a2b1a' }, pad: { fg: '#ffd27a', bg: '#5a3c10' },
  zero: { fg: '#8a7c68', bg: '#221a12' }, x: { fg: '#ffb070', bg: '#3a1e0c' }, sig: { fg: '#8cc4ff', bg: '#0f2440' },
  p: { fg: '#fff3dc', bg: '#3a2b1a', size: 80, letter: true }, bad: { fg: '#ffd0d4', bg: '#6a1420' },
  ok: { fg: '#e4ffdc', bg: '#1f6a2a' }, empty: { fg: '#4a3e32', bg: '#120c08', blank: true } };   // a place no byte comes to
for (const ink of Object.values(INK)) ink.size ??= 62;   // 1.6's faces are 62 unless said (lib/room-parts.js: 74)

// ---------- the parts of a machine ----------
const P_ = 1.1;   // the pitch of a wall of bytes; a tile is 1 wide
// a block of tiles: bytes in rows of cols at pitch p, left to right, top to bottom, like the card's
// rows; B.c is its middle, set by the layout; B.at(i) where tile i sits
function block(scene, bytes, ink, { cols = 16, p = P_ } = {}) {
  const n = bytes.length, rows = Math.ceil(n / cols), w0 = Math.min(n, cols);
  const tiles = [...bytes].map((b, i) => { const m = tile(b, typeof ink === 'function' ? ink(i) : ink); scene.add(m); return m; });
  const B = { tiles, n, cols, rows, p, w: w0 * p, h: rows * p, c: v(0, 0), s: p / P_, scene };
  B.at = i => v(B.c.x + (i % cols - (w0 - 1) / 2) * p, B.c.y + ((rows - 1) / 2 - Math.floor(i / cols)) * p);
  return B;
}
// another set of tiles on the same places (what streams out of a block while it stays)
// (bytes and ink: other bytes, other colours; without them, the same tiles)
function twin(scene, B, bytes, ink) {
  const T = bytes ? block(scene, bytes, ink, { cols: B.cols, p: B.p }) : { ...B, tiles: B.tiles.map(m => { const c = m.clone(); scene.add(c); return c; }) };
  T.at = B.at; T.c = B.c; return T;
}
const hide = B => B.tiles.forEach(m => { m.visible = false; });
// tiles pop up where they sit, one after another (order: the indices, in the order they come)
function pop(B, time, a, gap = .015, order = range(0, B.n)) {
  order.forEach((i, n) => { const m = B.tiles[i], q = span(time, a + n * gap, a + n * gap + .4);
    m.position.copy(B.at(i)); m.scale.setScalar(B.s * q); m.rotation.x = 0; m.visible = q > .02; });
}
const sit = B => pop(B, 1e3, 0, 0);
// tiles stream from where they sit into a point between a and b, the first first, shrinking
function into(B, p, time, a, b, list = range(0, B.n)) {
  const d = b - a;
  list.forEach((i, n) => { const m = B.tiles[i], dl = n / list.length * d * .5, q = span(time, a + dl, a + dl + d * .5);
    m.position.lerpVectors(B.at(i), p, q); m.position.z = .3; m.scale.setScalar(B.s * (1 - .75 * q)); m.rotation.x = 0; m.visible = time > a && q < .999; });
}
// and out of a point onto their places, turning over as they land
function outOf(B, p, time, a, b, list = range(0, B.n)) {
  const d = b - a;
  list.forEach((i, n) => { const m = B.tiles[i], dl = n / list.length * d * .5, q = span(time, a + dl, a + dl + d * .5);
    m.position.lerpVectors(p, B.at(i), q); m.scale.setScalar(B.s * (.25 + .75 * q)); m.rotation.x = (1 - q) * Math.PI; m.visible = q > .001; });
}
// tiles fly from one place to another on an arc (a copy of the salt, the digest the block carries)
function fly(B, from, time, a, b, list = range(0, B.n)) {
  const d = b - a;
  list.forEach((i, n) => { const m = B.tiles[i], dl = n / list.length * d * .4, q = span(time, a + dl, a + dl + d * .6);
    m.position.lerpVectors(from(i), B.at(i), q); m.position.z = .4 + Math.sin(Math.PI * q) * 2.5; m.scale.setScalar(B.s); m.rotation.x = 0; m.visible = time > a; });
}
// a captioned block: the caption above it, centred
const CAP = 1.6, CH = 1.15;   // a caption's room above its block, and its height
function captioned(B, cap) { if (cap) B.scene.add(cap); return { B, cap, w: Math.max(B.w, cap ? cap.scale.x * .8 : 0), h: B.h + (cap ? CAP : 0) }; }
// several captioned blocks one above the other, centred on c
function stack(c, parts, gap = .55) {
  const H = parts.reduce((n, q) => n + q.h, 0) + gap * (parts.length - 1);
  let y = c.y + H / 2;
  for (const q of parts) {
    if (q.cap) { q.cap.position.set(c.x, y - CAP / 2 + .05, .3); y -= CAP; }
    q.B.c.set(c.x, y - q.B.h / 2, 0); y -= q.B.h + gap;
  }
}
const stackSize = (parts, gap = .55) => ({ w: Math.max(...parts.map(q => q.w)), h: parts.reduce((n, q) => n + q.h, 0) + gap * (parts.length - 1) });

// a machine: a dark metal box edged in gold, its name above it, a disc on its front that turns
// while it works
function machine(scene, name, w, h) {
  const riser = new THREE.Group(); scene.add(riser);
  const metal = new THREE.MeshStandardMaterial({ color: 0x24202a, roughness: .45, metalness: .6 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3.6), metal); box.castShadow = box.receiveShadow = true; riser.add(box);
  const gold = new THREE.LineBasicMaterial({ color: 0xffc24d });
  riser.add(new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), gold));
  const r = Math.min(w, h) * .26, disc = new THREE.Group(); disc.position.set(0, -h * .1, 1.83); riser.add(disc);
  const faceM = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffc24d, emissiveIntensity: .05 });
  disc.add(new THREE.Mesh(new THREE.CircleGeometry(r, 40), faceM));
  const rim = new THREE.MeshStandardMaterial({ color: 0xffc24d, emissive: 0xffc24d, emissiveIntensity: 0, metalness: .6, roughness: .3 });
  disc.add(new THREE.Mesh(new THREE.TorusGeometry(r * 1.05, .08, 8, 40), rim));
  const spokes = new THREE.Group(); spokes.position.z = .03; disc.add(spokes);
  for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(r * 1.6, .08, .04), new THREE.MeshBasicMaterial({ color: 0x5a4320 })); b.rotation.z = k * Math.PI / 4; spokes.add(b); }
  const nameL = label(name, '#ffd27a', 1.25, { plate: true }); scene.add(nameL);
  const M = { w, h: h + 2, riser, gold, c: v(0, 0), rim, nameL,
    place(c) { M.c.copy(c); riser.position.set(c.x, c.y - .8, 0); nameL.position.set(c.x, c.y - .8 + h / 2 + 1.0, 1.8); },
    // on: it works (the disc lit and turning, the box shaking); done: it has worked (the disc stays lit)
    run(time, on, done = false) {
      faceM.emissiveIntensity = on ? 1.1 + Math.sin(time * 18) * .25 : done ? .45 : .05; spokes.rotation.z = on ? -time * 9 : 0;
      riser.position.x = M.c.x + (on ? Math.sin(time * 60) * .03 : 0); gold.color.setHex(on ? 0xffe9a8 : 0xffc24d);
    },
    // the side of the box that faces p: where tiles go in or come out
    mouth(p) { const d = p.clone().sub(M.c); return Math.abs(d.x) > Math.abs(d.y) ? v(M.c.x + Math.sign(d.x) * w / 2, M.c.y - .8) : v(M.c.x, M.c.y - .8 + Math.sign(d.y) * h / 2); },
    show(k) { riser.visible = k > .01; riser.scale.setScalar(Math.max(.001, k)); show(nameL, k); } };
  return M;
}

// the stations of a machine, in the order the bytes go through them: left to right on a wide screen,
// top to bottom on an upright one. items: [[id, {w, h}]]. Returns each station's middle, and the size.
function lay(portrait, items, gap = 3.2) {
  const out = {}, sum = (f) => items.reduce((n, [, s]) => n + f(s), 0) + gap * (items.length - 1);
  if (!portrait) {
    const Wt = sum(s => s.w), Hm = Math.max(...items.map(([, s]) => s.h));
    let x = -Wt / 2; for (const [id, s] of items) { out[id] = v(x + s.w / 2, Hm / 2 + 3); x += s.w + gap; }
    return { at: out, size: { w: Wt, h: Hm + 6 } };
  }
  const Ht = sum(s => s.h), Wm = Math.max(...items.map(([, s]) => s.w));
  let y = Ht + 3; for (const [id, s] of items) { out[id] = v(0, y - s.h / 2); y -= s.h + gap; }
  return { at: out, size: { w: Wm, h: Ht + 6 } };
}
// what the camera holds: the boxes of the stations named, or of some rows of a block
const around = (c, s, m = .5) => [v(c.x - s.w / 2 - m, c.y - s.h / 2 - m), v(c.x + s.w / 2 + m, c.y + s.h / 2 + m)];
const mbox = M => around(M.c, M, .2);
const rowsOf = (B, a, b, up = 0) => [v(B.c.x - B.w / 2 - .4, B.at(b * B.cols).y - B.p / 2 - .4), v(B.c.x + B.w / 2 + .4, B.at(a * B.cols).y + B.p / 2 + .4 + up)];

// a bar of light that sweeps rows of a wall (a mask passing), and the words riding with it
function sweeper(scene, B, color, text) {
  const bar = new THREE.Mesh(new THREE.BoxGeometry(B.w + .6, .16, .1), new THREE.MeshBasicMaterial({ color, transparent: true }));
  scene.add(bar); bar.visible = false;
  const l = label(text, '#' + color.toString(16).padStart(6, '0'), 1.1, { plate: true }); scene.add(l);
  // r: the bar's row (fractional), from a to b over [ta, tb]
  return (time, ta, tb, a, b) => {
    const on = time > ta && time < tb + .3, r = a + (b - a) * clamp01((time - ta) / (tb - ta));
    bar.visible = l.visible = on;
    if (!on) return r;
    const y = B.c.y + (B.rows / 2 - r) * B.p, o = 1 - span(time, tb, tb + .3);
    bar.position.set(B.c.x, y, .45); bar.material.opacity = o;
    l.position.set(B.c.x, y + (b > a ? -.9 : .9), 1); l.material.opacity = o;
    return r;
  };
}
// the words of a block's part: a plate over the tiles they name, for a while
function plate(scene, text, color, at) { const l = label(text, color, 1.1, { plate: true }); l.position.copy(at); l.position.z = 1; scene.add(l); return l; }
const during = (l, time, a, b = 1e3) => show(l, span(time, a, a + .4) * (1 - span(time, b, b + .4)));

// a packet's bricks, small, one block each (keys, IV, ciphertext, seal), captioned with their names
function packetBlocks(scene, pkt, p = .62, cols = 32) {
  const F = raw('card.fields'), ink = { ek: INK.key, iv: INK.iv, ct: INK.c, tag: INK.seal };
  return ['ek', 'iv', 'ct', 'tag'].map(b => {
    const bytes = P.field(pkt, b);
    return captioned(block(scene, bytes, ink[b], { p, cols }), label(`${F[b]} · ${t('card.bytes', { k: bytes.length })}`, ink[b].fg, CH, { plate: true }));
  });
}
const pkSit = (parts, k) => parts.forEach(q => { if (k > .01) sit(q.B); else hide(q.B); show(q.cap, k); });
const pkPop = (parts, time, a) => parts.forEach((q, j) => { pop(q.B, time, a + j * .35, .004); during(q.cap, time, a + j * .35); });

// ---------- chapter 2, Alice's keep: she signs (step 5 'sign') ----------
// The packet (keys, IV, ciphertext, seal: 336 bytes, what the signature covers) goes into SHA-256:
// its digest, 32 bytes. PSS: 8 bytes of 00, the digest and the salt (32 random bytes) go into SHA-256
// again: H, which goes at the end of a 256-byte block with bc after it; before it, 190 bytes of 00,
// 01 and the salt; a mask made from H (SHA-256 of H, stretched) sweeps over all of that. The block,
// read as one number, goes into RSA-2048, where Alice's private key turns: out comes the signature.
function signRoom(scene, pk, portrait) {
  const s = pk.signed, g = s.signature, k = S.ALICE.k, DBn = k - R.H - 1, ONE = DBn - 33;   // 223, 190
  const msg = P.signed(s);
  const PK = packetBlocks(scene, s);
  const sh1 = machine(scene, 'SHA-256', 4.4, 4.4), sh2 = machine(scene, 'SHA-256', 4.4, 4.4), rsa = machine(scene, 'RSA-2048', 6, 5.4);
  const Z8 = captioned(block(scene, new Uint8Array(8), INK.zero), label(t('in.zeros8'), INK.zero.fg, CH, { plate: true }));
  const DG = captioned(block(scene, g.mHash, INK.plain), label(t('in.digest'), INK.plain.fg, CH, { plate: true }));
  const SL = captioned(block(scene, g.salt, INK.iv), label(t('in.salt'), INK.iv.fg, CH, { plate: true }));
  const plainAt = i => i < ONE ? [0, INK.zero] : i === ONE ? [1, INK.pad] : i < DBn ? [g.salt[i - ONE - 1], INK.iv] : [g.EM[i], INK.pad];
  const EM = block(scene, Uint8Array.from({ length: k }, (_, i) => plainAt(i)[0]), i => plainAt(i)[1]);
  const EMc = captioned(EM, label(t('in.em'), INK.x.fg, CH, { plate: true }));
  const E2 = twin(scene, EM, g.EM, i => i < DBn ? INK.x : INK.pad);
  const SIG = captioned(block(scene, s.sig, INK.sig), label(t('in.sig'), INK.sig.fg, CH, { plate: true }));
  const MSG = block(scene, msg, i => i < 256 ? INK.key : i < 272 ? INK.iv : i < 304 ? INK.c : INK.seal, { p: .62 });   // the packet's copy into SHA-256

  const pkS = stackSize(PK, .4), stS = stackSize([Z8, DG, SL]);
  const L = lay(portrait, [['pk', pkS], ['sh1', sh1], ['st', stS], ['sh2', sh2], ['em', EMc], ['rsa', { w: 6, h: 9 }], ['sig', SIG]]);
  const at = L.at;
  stack(at.pk, PK, .4); stack(at.st, [Z8, DG, SL]); stack(at.em, [EMc]); stack(at.sig, [SIG]);
  const IN2 = [Z8, DG, SL].map(q => twin(scene, q.B));   // their copies, into the second SHA-256
  sh1.place(at.sh1); sh2.place(at.sh2); rsa.place(at.rsa);
  // the packet's copy sits on the packet's bricks, end to end
  { const offs = [0, 256, 272, 304]; MSG.at = i => { const j = offs.findLastIndex(o => i >= o); return PK[j].B.at(i - offs[j]); }; }
  const H2 = range(DBn, k - 1), lastBytes = range(DBn, k);
  // the words over the block's parts, while they come
  const rowY = r => EM.c.y + (7.5 - r) * EM.p;
  const W = { h: plate(scene, t('in.h'), INK.pad.fg, v(EM.c.x, rowY(14.4))), bc: plate(scene, t('in.bc'), INK.pad.fg, v(EM.c.x, rowY(13.2))),
    zeros: plate(scene, t('in.dbZeros', { n: ONE }), '#c8b89c', v(EM.c.x, rowY(5.5))), one: plate(scene, t('in.one'), INK.pad.fg, v(EM.c.x, rowY(10.4))),
    salt: plate(scene, t('in.dbSalt'), INK.iv.fg, v(EM.c.x, rowY(12.4))), masked: plate(scene, t('in.masked', { n: DBn }), INK.x.fg, v(EM.c.x, rowY(6.5))) };
  const mask = sweeper(scene, EM, 0xffb070, t('in.mask', { n: DBn }));
  // Alice's private key: it comes down into the RSA box's lock and turns
  const key = new THREE.Group(), turn = keyProp(COLORS.a, .9); turn.scale.setScalar(3.2); key.add(turn); scene.add(key);
  key.rotation.z = -Math.PI / 2;
  const lockAt = portrait ? v(rsa.c.x + 3 + 2.2, rsa.c.y - .8) : v(rsa.c.x, rsa.c.y - .8 + 2.7 + 2.2);
  if (portrait) key.rotation.z = Math.PI;
  const keyHome = portrait ? lockAt.clone().add(v(4.5, 0)) : lockAt.clone().add(v(0, 3.6));
  const keyL = label(t('in.priv'), '#8cc4ff', CH, { plate: true }); scene.add(keyL);
  const calc = label(t('in.signCalc'), '#ffd27a', CH, { plate: true }); calc.position.set(rsa.c.x, rsa.c.y - .8 - 2.7 - .8, 2); scene.add(calc);

  const T = { pk: .3, h1: 2.2, dg: 4.4, z8: 5.6, salt: 6.1, h2: 7.4, H: 9.2, bc: 10.5, zeros: 10.9, one: 12.0, salt2: 12.3, m: 13.8, me: 16.2,
    em: 16.4, key: 16.6, lock: 17.2, turn: 18.4, out: 19.2, end: 22.6 };
  function pose(beat, time) {
    // the packet; its copy into SHA-256 and the digest out
    pkPop(PK, time, T.pk);
    hide(MSG); if (time > T.h1) into(MSG, sh1.mouth(at.pk), time, T.h1, T.dg);
    sh1.show(span(time, 1.2, 1.8)); sh1.run(time, time > T.h1 + 1 && time < T.dg + .3, time > T.dg);
    hide(DG.B); outOf(DG.B, sh1.mouth(at.st), time, T.dg, T.dg + 1.2); during(DG.cap, time, T.dg + .3);
    // M' = 8 bytes of 00 ‖ digest ‖ salt, into SHA-256 again: H, at the end of the block, then bc
    pop(Z8.B, time, T.z8, .04); during(Z8.cap, time, T.z8);
    pop(SL.B, time, T.salt, .025); during(SL.cap, time, T.salt);
    sh2.show(span(time, T.z8, T.z8 + .6)); sh2.run(time, time > T.h2 + .9 && time < T.H + .2, time > T.H);
    const m2 = sh2.mouth(at.st);
    IN2.forEach(hide); if (time > T.h2 && time < T.H) IN2.forEach(B => into(B, m2, time, T.h2, T.H - .2));
    // the block: H, bc, the zeros, 01, the salt; then the mask over all but H and bc
    hide(EM); hide(E2);
    outOf(EM, sh2.mouth(at.em), time, T.H, T.bc, H2); pop(EM, time, T.bc, 0, [k - 1]);
    pop(EM, time, T.zeros, .005, range(0, ONE)); pop(EM, time, T.one, 0, [ONE]);
    if (time > T.salt2) fly(EM, i => SL.B.at(i - ONE - 1), time, T.salt2, T.salt2 + 1.4, range(ONE + 1, DBn));
    const r = mask(time, T.m, T.me, 0, DBn / 16);
    for (let i = 0; i < DBn; i++) {
      const q = clamp01((r - Math.floor(i / 16)) / .8), m = EM.tiles[i];
      if (!m.visible) continue;
      m.rotation.x = q * Math.PI * 2; m.position.z = Math.sin(Math.PI * q) * .5;
      if (q >= .5) paint(m, g.EM[i], INK.x); else { const [b, ink] = plainAt(i); paint(m, b, ink); }
    }
    during(W.h, time, T.H + .4, T.bc + 1.2); during(W.bc, time, T.bc, T.zeros); during(W.zeros, time, T.zeros + .4, T.one);
    during(W.one, time, T.one, T.salt2 + .2); during(W.salt, time, T.salt2 + .5, T.m); during(W.masked, time, T.me, T.lock);
    during(EMc.cap, time, T.em);
    // a copy of the block into RSA-2048; Alice's private key turns in its lock; the signature comes out
    if (time > T.lock) into(E2, rsa.mouth(at.em), time, T.lock, T.out);
    rsa.show(span(time, T.me - .8, T.me)); rsa.run(time, time > T.turn && time < T.out + 1.2, time > T.out + 1.2);
    const kf = span(time, T.key, T.key + .5), kin = span(time, T.lock, T.turn);
    key.visible = kf > .01; key.scale.setScalar(Math.max(.001, kf));
    key.position.lerpVectors(keyHome, lockAt, kin); turn.rotation.x = span(time, T.turn, T.turn + .5) * Math.PI / 2;
    keyL.position.copy(key.position).add(portrait ? v(0, 1.6) : v(0, 2.8)); during(keyL, time, T.key, T.out);
    during(calc, time, T.turn); during(sh1.nameL, time, 1.2); during(sh2.nameL, time, T.z8); during(rsa.nameL, time, T.me - .8);
    hide(SIG.B); if (time > T.out) outOf(SIG.B, rsa.mouth(at.sig), time, T.out, T.end - .6); during(SIG.cap, time, T.out + .8);
  }

  // what the camera holds: the packet and its hashing; the digest, the salt, the second hash; the block
  // as it is laid out and masked; the block, the box and the signature. A phone follows the action a
  // station or two at a time, and the mask's bar five rows at a time.
  const box = id => around(at[id], { pk: pkS, sh1, st: stS, sh2, em: EMc, rsa: { w: 6, h: 9 }, sig: SIG }[id]);
  const F = (...ids) => ids.flatMap(box);
  const win = r => { const a = Math.max(0, Math.min(11, Math.round(r - 2.5))); return rowsOf(EM, a, a + 4); };
  const frame = time => !portrait
    ? time < T.dg ? F('pk', 'sh1') : time < T.z8 ? F('pk', 'sh1', 'st') : time < T.zeros ? F('st', 'sh2', 'em') : time < T.lock ? F('sh2', 'em', 'rsa') : F('em', 'rsa', 'sig')
    // a phone's strip is short and wide: three to five rows of a wall, or one box, at a time
    : time < T.h1 + .6 ? rowsOf(PK[0].B, 0, 7, CAP) : time < T.dg ? [...rowsOf(PK[3].B, 0, 0), ...mbox(sh1)] : time < T.z8 ? rowsOf(DG.B, 0, 1, CAP)
      : time < T.h2 ? [...rowsOf(Z8.B, 0, 0, CAP), ...rowsOf(SL.B, 0, 1)] : time < T.H ? [...rowsOf(SL.B, 1, 1), ...mbox(sh2)]
      : time < T.zeros ? rowsOf(EM, 12, 15) : time < T.one ? rowsOf(EM, 7, 11) : time < T.m ? rowsOf(EM, 10, 14)
      : time < T.me + .3 ? win(mask(time, T.m, T.me, 0, DBn / 16)) : time < T.lock ? rowsOf(EM, 0, 3, CAP)
      : time < T.out + .8 ? around(at.rsa, { w: 6, h: 9 }) : rowsOf(SIG.B, 0, 4, CAP);
  return { size: L.size, beats: { sign: { end: T.end } }, pose, frame: (b, time) => frame(time), tiles: { em: E2, sig: SIG.B, digest: DG.B } };
}

// ---------- chapter 2, Bob's keep: he checks (step 6 'verify') ----------
// The signature, raised to Alice's public exponent in RSA-2048, gives the block back. Its last bytes
// carry H; the mask (SHA-256 of H, stretched) sweeps back over the rest, and the salt shows again.
// From the other end, the packet he got goes into SHA-256: the digest; with the 8 zeros and the salt,
// SHA-256 again: the H he computes. It lands under the H the block carries: the same 32 bytes.
function verifyRoom(scene, pk, portrait) {
  const s = pk.signed, k = S.ALICE.k, DBn = k - R.H - 1, ONE = DBn - 33, msg = P.signed(s);
  const c = S.verify(S.ALICE, msg, s.sig), DB = A.xor(c.EM.slice(0, DBn), R.mgf1(c.h, DBn)); DB[0] &= 0x7f;
  const salt = DB.slice(ONE + 1);
  const SIG = captioned(block(scene, s.sig, INK.sig), label(t('in.sigGot'), INK.sig.fg, CH, { plate: true }));
  const SG2 = twin(scene, SIG.B, s.sig, INK.sig);
  const rsa = machine(scene, 'RSA-2048', 6, 5.4), sh1 = machine(scene, 'SHA-256', 4.4, 4.4), sh2 = machine(scene, 'SHA-256', 4.4, 4.4);
  const EM = block(scene, c.EM, i => i < DBn ? INK.x : INK.pad), EMc = captioned(EM, label(t('card.emBack'), INK.x.fg, CH, { plate: true }));
  const HIN = captioned(block(scene, c.h, INK.pad), label(t('card.hIn'), INK.pad.fg, CH, { plate: true }));
  const HME = captioned(block(scene, c.want, INK.pad), label(t('card.hMine'), INK.pad.fg, CH, { plate: true }));
  const HOK = twin(scene, HME.B, c.want, i => c.want[i] === c.h[i] ? INK.ok : INK.bad), HOKin = twin(scene, HIN.B, c.h, i => c.want[i] === c.h[i] ? INK.ok : INK.bad);
  const Z8 = captioned(block(scene, new Uint8Array(8), INK.zero), label(t('in.zeros8'), INK.zero.fg, CH, { plate: true }));
  const DG = captioned(block(scene, c.mHash, INK.plain), label(t('in.digest'), INK.plain.fg, CH, { plate: true }));
  const SL = captioned(block(scene, salt, INK.iv), label(t('in.salt'), INK.iv.fg, CH, { plate: true }));
  const PK = packetBlocks(scene, s), MSG = block(scene, msg, i => i < 256 ? INK.key : i < 272 ? INK.iv : i < 304 ? INK.c : INK.seal, { p: .62 });
  const pkS = stackSize(PK, .4), stS = stackSize([Z8, DG, SL]), cmS = stackSize([HIN, HME], 1.2);
  const L = lay(portrait, [['sig', SIG], ['rsa', { w: 6, h: 9 }], ['em', EMc], ['cmp', cmS], ['sh2', sh2], ['st', stS], ['sh1', sh1], ['pk', pkS]]);
  const at = L.at;
  stack(at.sig, [SIG]); stack(at.em, [EMc]); stack(at.cmp, [HIN, HME], 1.2); stack(at.st, [Z8, DG, SL]); stack(at.pk, PK, .4);
  const IN2 = [Z8, DG, SL].map(q => twin(scene, q.B));
  rsa.place(at.rsa); sh1.place(at.sh1); sh2.place(at.sh2);
  { const offs = [0, 256, 272, 304]; MSG.at = i => { const j = offs.findLastIndex(o => i >= o); return PK[j].B.at(i - offs[j]); }; }
  const pub = label(t('in.pub'), '#8cc4ff', CH, { plate: true }); pub.position.set(rsa.c.x, rsa.c.y - .8 + 2.7 + 1.9, 1.8); scene.add(pub);
  const calc = label(t('in.verCalc'), '#ffd27a', CH, { plate: true }); calc.position.set(rsa.c.x, rsa.c.y - .8 - 2.7 - .8, 2); scene.add(calc);
  const mask = sweeper(scene, EM, 0x9fd3f0, t('in.unmask'));
  const rowY = r => EM.c.y + (7.5 - r) * EM.p;
  const W = { h: plate(scene, t('card.hIn'), INK.pad.fg, v(EM.c.x, rowY(13.2))), salt: plate(scene, t('in.dbSalt'), INK.iv.fg, v(EM.c.x, rowY(10.4))),
    zeros: plate(scene, t('in.dbZeros', { n: ONE }), '#c8b89c', v(EM.c.x, rowY(5.5))) };
  const same = label(t('card.sigOk'), '#8fd18a', 1.1, { plate: true }); scene.add(same);
  same.position.set(at.cmp.x, at.cmp.y - cmS.h / 2 - .9, 1);
  const lastH = range(DBn, k - 1);

  const T = { in: .3, rsa: 1.6, em: 3.6, h: 6.0, m: 7.6, me: 9.8, salt: 10.2, pk: 11.4, dg: 13.2, z8: 14.2, h2: 14.8, hm: 16.6, cmp: 18.2, end: 21.4 };
  function pose(beat, time) {
    // the signature that came with the packet; a copy into RSA-2048 with Alice's public key; the block out
    pop(SIG.B, time, T.in, .004); during(SIG.cap, time, T.in);
    hide(SG2); if (time > T.rsa) into(SG2, rsa.mouth(at.sig), time, T.rsa, T.em);
    rsa.show(span(time, .6, 1.2)); rsa.run(time, time > T.rsa + 1 && time < T.em + .8, time > T.em + .8);
    during(rsa.nameL, time, .6); during(pub, time, .8); during(calc, time, T.rsa + .6);
    hide(EM); outOf(EM, rsa.mouth(at.em), time, T.em, T.h - .2); during(EMc.cap, time, T.em + .6);
    // H, the block's last bytes, lifted out to the comparison
    hide(HIN.B); if (time > T.h) fly(HIN.B, i => EM.at(DBn + i), time, T.h, T.h + 1.4); during(HIN.cap, time, T.h + .6); during(W.h, time, T.h - .4, T.m);
    // the mask back over the rest: the zeros, 01 and the salt again
    const r = mask(time, T.m, T.me, DBn / 16, 0);
    for (let i = 0; i < DBn; i++) {
      const q = clamp01((Math.floor(i / 16) + 1 - r) / .8), m = EM.tiles[i];
      if (!m.visible) continue;
      m.rotation.x = q * Math.PI * 2; m.position.z = Math.sin(Math.PI * q) * .5;
      if (q >= .5) paint(m, DB[i], i < ONE ? INK.zero : i === ONE ? INK.pad : INK.iv); else paint(m, c.EM[i], INK.x);
    }
    during(W.salt, time, T.me, T.pk + 1); during(W.zeros, time, T.me, T.pk + 1);
    hide(SL.B); if (time > T.salt) fly(SL.B, i => EM.at(ONE + 1 + i), time, T.salt, T.salt + 1.4); during(SL.cap, time, T.salt + .6);
    // the packet he got: into SHA-256, the digest; with the zeros and the salt, SHA-256 again
    pkPop(PK, time, T.in);
    hide(MSG); if (time > T.pk) into(MSG, sh1.mouth(at.pk), time, T.pk, T.dg);
    sh1.show(span(time, .6, 1.2)); sh1.run(time, time > T.pk + 1 && time < T.dg + .3, time > T.dg); during(sh1.nameL, time, .6);
    hide(DG.B); outOf(DG.B, sh1.mouth(at.st), time, T.dg, T.dg + 1); during(DG.cap, time, T.dg + .3);
    pop(Z8.B, time, T.z8, .04); during(Z8.cap, time, T.z8);
    sh2.show(span(time, .6, 1.2)); sh2.run(time, time > T.h2 + .9 && time < T.hm + .2, time > T.hm); during(sh2.nameL, time, .6);
    IN2.forEach(hide); if (time > T.h2 && time < T.hm) IN2.forEach(B => into(B, sh2.mouth(at.st), time, T.h2, T.hm - .2));
    hide(HME.B); outOf(HME.B, sh2.mouth(at.cmp), time, T.hm, T.cmp - .2); during(HME.cap, time, T.hm + .4);
    // byte against byte: each pair lights green where they are the same
    hide(HOK); hide(HOKin);
    for (let i = 0; i < 32; i++) {
      if (time < T.cmp + i * .05) continue;
      for (const [B, O] of [[HME.B, HOK], [HIN.B, HOKin]]) { const m = O.tiles[i]; m.position.copy(B.at(i)); m.scale.setScalar(1); m.rotation.x = 0; m.visible = true; B.tiles[i].visible = false; }
    }
    during(same, time, T.cmp + 1.8);
  }
  const sizes = { sig: SIG, rsa: { w: 6, h: 9 }, em: EMc, cmp: { w: cmS.w, h: cmS.h + 2.2 }, sh2, st: stS, sh1, pk: pkS };
  const F = (...ids) => ids.flatMap(id => around(id === 'cmp' ? v(at.cmp.x, at.cmp.y - 1.1) : at[id], sizes[id]));
  const win = r => { const a = Math.max(0, Math.min(11, Math.round(r - 2.5))); return rowsOf(EM, a, a + 4); };
  const frame = time => !portrait
    ? time < T.h ? F('sig', 'rsa', 'em') : time < T.salt ? F('em', 'cmp') : time < T.pk ? F('em', 'cmp', 'sh2', 'st') : time < T.z8 ? F('st', 'sh1', 'pk')
      : time < T.cmp ? F('cmp', 'sh2', 'st') : F('em', 'cmp')
    : time < T.rsa + .4 ? rowsOf(SIG.B, 0, 4, CAP) : time < T.em ? mbox(rsa) : time < T.h ? rowsOf(EM, 0, 4, CAP)
      : time < T.m ? rowsOf(EM, 12, 15) : time < T.me + .3 ? win(mask(time, T.m, T.me, DBn / 16, 0))
      : time < T.pk ? rowsOf(SL.B, 0, 1, CAP) : time < T.dg ? mbox(sh1) : time < T.h2 ? [...rowsOf(Z8.B, 0, 0, CAP), ...rowsOf(DG.B, 0, 1)]
      : time < T.hm ? mbox(sh2) : [...rowsOf(HIN.B, 0, 1, CAP), ...rowsOf(HME.B, 0, 1)];
  return { size: L.size, beats: { verify: { end: T.end } }, pose, frame: (b, time) => frame(time), tiles: { em: EM, hIn: HIN.B, hMine: HME.B } };
}

// ---------- chapter 4, Alice's keep: AES-GCM (step 11 'gcm') ----------
// One key, a 12-byte nonce. AES-256 encrypts the counter blocks (the nonce, then 2, then 3): the
// stream, XORed onto the order's letters: the ciphertext, as long as the order. AES of 16 zeros is
// GHASH's key H; GHASH folds the ciphertext into 16 bytes, XORed with AES(nonce ‖ 1): the tag.
const ctrBlock = (nonce, i) => A.concat([nonce, Uint8Array.of(0, 0, 0, i)]);
const ctrInk = i => i % 16 < 12 ? INK.iv : INK.pad;
function gcmParts(g) {
  const ej0 = A.encryptBlock(g.key, ctrBlock(g.nonce, 1)), n = g.M.length, nb = Math.ceil(n / 16);
  const ctr = A.concat(range(0, nb).map(j => ctrBlock(g.nonce, 2 + j))), ks = A.concat(range(0, nb).map(j => A.encryptBlock(g.key, ctrBlock(g.nonce, 2 + j))));
  return { ej0, n, nb, ctr, ks, s: A.xor(g.tag, ej0), h: g.h };
}
function gcmRoom(scene, pk, portrait) {
  const g = pk.g, q = gcmParts(g);
  const KEY = captioned(block(scene, g.key, INK.key), label(t('in.key'), INK.key.fg, CH, { plate: true }));
  const NON = captioned(block(scene, g.nonce, INK.iv), label(t('in.nonce'), INK.iv.fg, CH, { plate: true }));
  const CTR = captioned(block(scene, q.ctr, ctrInk), label(t('in.ctr'), INK.iv.fg, CH, { plate: true }));
  const ZB = captioned(block(scene, new Uint8Array(16), INK.zero), label(t('in.zero'), INK.zero.fg, CH, { plate: true }));
  const J0 = captioned(block(scene, ctrBlock(g.nonce, 1), ctrInk), label(t('in.ctr1'), INK.iv.fg, CH, { plate: true }));
  const aes = machine(scene, 'AES-256', 6, 5.4), gh = machine(scene, 'GHASH', 5, 5);
  const KS = captioned(block(scene, q.ks, INK.x), label(t('in.ks'), INK.x.fg, CH, { plate: true }));
  const KSn = twin(scene, KS.B, q.ks, INK.x);
  const ORD = captioned(block(scene, g.M, INK.p), label(t('in.order', { n: q.n }), INK.plain.fg, CH, { plate: true }));
  const CT = captioned(block(scene, g.C, INK.c), label(t('in.ct', { n: q.n }), INK.c.fg, CH, { plate: true }));
  const CT2 = twin(scene, CT.B, g.C, INK.c);
  const HK = captioned(block(scene, q.h, INK.key), label(t('in.hkey'), INK.key.fg, CH, { plate: true }));
  const SS = captioned(block(scene, q.s, INK.plain), label(t('in.s'), INK.plain.fg, CH, { plate: true }));
  const EJ = captioned(block(scene, q.ej0, INK.x), label(t('in.ej0'), INK.x.fg, CH, { plate: true }));
  const TAG = captioned(block(scene, g.tag, INK.seal), label(t('in.tag'), INK.seal.fg, CH, { plate: true }));
  const KC = twin(scene, KEY.B, g.key, INK.key);
  const inS = stackSize([KEY, NON, CTR, ZB, J0]), xS = stackSize([KS, ORD, CT]), tS = stackSize([HK, SS, EJ, TAG]);
  const L = lay(portrait, [['in', inS], ['aes', { w: 6, h: 7 }], ['x', xS], ['gh', { w: 5, h: 6.6 }], ['tag', tS]]);
  const at = L.at;
  stack(at.in, [KEY, NON, CTR, ZB, J0]); stack(at.x, [KS, ORD, CT]); stack(at.tag, [HK, SS, EJ, TAG]);
  aes.place(at.aes); gh.place(at.gh);
  const xorL = plate(scene, '⊕', '#ffd27a', v(0, 0)), xorT = plate(scene, '⊕', '#ffd27a', v(0, 0));
  const nopad = plate(scene, t('in.nopad'), INK.c.fg, v(0, 0));

  const T = { key: .3, non: 1.0, ctr: 1.8, kin: 2.8, ain: 3.6, ks: 5.0, ord: 6.6, xor: 7.6, xe: 9.0, zb: 9.6, hk: 10.6, gin: 11.6, s: 13.2, j0: 13.8, ej: 14.8, tag: 16.0, end: 17.6 };
  const live = (B, time, a) => { if (time > a) sit(B); else hide(B); };
  function pose(beat, time) {
    pop(KEY.B, time, T.key, .02); during(KEY.cap, time, T.key);
    pop(NON.B, time, T.non, .03); during(NON.cap, time, T.non);
    // the counter blocks: the nonce copied, the counter after it
    hide(CTR.B); if (time > T.ctr) fly(CTR.B, i => i % 16 < 12 ? NON.B.at(i % 16) : CTR.B.at(i), time, T.ctr, T.ctr + 1); during(CTR.cap, time, T.ctr + .4);
    aes.show(span(time, .6, 1.2)); during(aes.nameL, time, .6);
    // the key goes into the box (it glows violet), then the counter blocks; the stream comes out
    hide(KC); if (time > T.kin) into(KC, aes.mouth(at.in), time, T.kin, T.ain);
    aes.rim.emissive.setHex(0xb77ff0); aes.rim.emissiveIntensity = time > T.ain ? 1.2 : 0;
    const busy = (time > T.ain + .6 && time < T.ks + .4) || (time > T.zb + .4 && time < T.hk + .3) || (time > T.j0 + .4 && time < T.ej + .3);
    aes.run(time, busy, time > T.ks);
    const CTc = twin0.CTR; hide(CTc); if (time > T.ain && time < T.ks + 1) into(CTc, aes.mouth(at.in), time, T.ain, T.ks);
    hide(KS.B); outOf(KS.B, aes.mouth(at.x), time, T.ks, T.ord); during(KS.cap, time, T.ks + .4);
    // the order's letters under the stream; XOR, letter by letter: the ciphertext
    pop(ORD.B, time, T.ord, .03); during(ORD.cap, time, T.ord);
    hide(CT.B); hide(KSn);
    if (time > T.xor) for (let i = 0; i < q.n; i++) {
      const k = span(time, T.xor + i * .05, T.xor + i * .05 + .5), m = CT.B.tiles[i];
      m.position.lerpVectors(ORD.B.at(i), CT.B.at(i), k); m.scale.setScalar(k); m.rotation.x = (1 - k) * Math.PI; m.visible = k > .01;
    }
    // the stream's bytes past the order's end are not used: no padding
    for (let i = q.n; i < KS.B.n; i++) KS.B.tiles[i].visible = KS.B.tiles[i].visible && time < T.xe;
    during(CT.cap, time, T.xor + .6); during(nopad, time, T.xe, T.zb + 1);
    nopad.position.set(CT.B.c.x, CT.B.c.y - CT.B.h / 2 - .7, 1);
    xorL.position.set(KS.B.c.x - KS.B.w / 2 - .8, ORD.B.c.y, 1); during(xorL, time, T.ord, T.xe);
    // 16 zeros through AES: H, GHASH's key; GHASH folds the ciphertext; AES(nonce ‖ 1); XOR: the tag
    pop(ZB.B, time, T.zb - .6, .02); during(ZB.cap, time, T.zb - .6);
    const ZBc = twin0.ZB; hide(ZBc); if (time > T.zb && time < T.hk + .5) into(ZBc, aes.mouth(at.in), time, T.zb, T.hk);
    hide(HK.B); if (time > T.hk) fly(HK.B, () => aes.mouth(at.x), time, T.hk, T.hk + 1); during(HK.cap, time, T.hk + .3);
    gh.show(span(time, T.zb - .6, T.zb)); during(gh.nameL, time, T.zb - .6);
    gh.rim.emissive.setHex(0xb77ff0); gh.rim.emissiveIntensity = time > T.gin ? 1.2 : 0;
    gh.run(time, time > T.gin + .5 && time < T.s + .2, time > T.s);
    hide(CT2); if (time > T.gin && time < T.s + .5) into(CT2, gh.mouth(at.x), time, T.gin, T.s);
    if (time > T.gin) { const hm = HK.B; into(hm, gh.mouth(at.tag), time, T.gin, T.gin + 1.2); if (time > T.gin + 1.2) hide(hm); }
    hide(SS.B); outOf(SS.B, gh.mouth(at.tag), time, T.s, T.s + 1); during(SS.cap, time, T.s + .3);
    pop(J0.B, time, T.j0 - .8, .02); during(J0.cap, time, T.j0 - .8);
    const J0c = twin0.J0; hide(J0c); if (time > T.j0 && time < T.ej + .5) into(J0c, aes.mouth(at.in), time, T.j0, T.ej);
    hide(EJ.B); if (time > T.ej) fly(EJ.B, () => aes.mouth(at.x), time, T.ej, T.ej + 1); during(EJ.cap, time, T.ej + .3);
    xorT.position.set(SS.B.c.x - SS.B.w / 2 - .8, EJ.B.c.y, 1); during(xorT, time, T.ej + .6);
    hide(TAG.B); if (time > T.tag) for (let i = 0; i < 16; i++) {
      const k = span(time, T.tag + i * .05, T.tag + i * .05 + .5), m = TAG.B.tiles[i];
      m.position.lerpVectors(EJ.B.at(i), TAG.B.at(i), k); m.scale.setScalar(k); m.rotation.x = (1 - k) * Math.PI; m.visible = k > .01;
    }
    during(TAG.cap, time, T.tag + .5);
  }
  // copies that stream into the boxes while the originals stay
  const twin0 = { CTR: twin(scene, CTR.B, q.ctr, ctrInk), ZB: twin(scene, ZB.B, new Uint8Array(16), INK.zero), J0: twin(scene, J0.B, ctrBlock(g.nonce, 1), ctrInk) };
  const sizes = { in: inS, aes: { w: 6, h: 7 }, x: xS, gh: { w: 5, h: 6.6 }, tag: tS };
  const F = (...ids) => ids.flatMap(id => around(at[id], sizes[id]));
  const rows = (...parts) => parts.flatMap(p => around(p.B.c, { w: p.B.w, h: p.B.h + CAP * 2 }, .3));
  const frame = time => !portrait
    ? time < T.ks ? F('in', 'aes') : time < T.zb ? F('aes', 'x') : time < T.hk + .5 ? [...rows(ZB), ...F('aes')] : time < T.j0 - .8 ? F('x', 'gh', 'tag')
      : time < T.ej + .6 ? [...rows(J0), ...F('aes')] : F('x', 'gh', 'tag')
    : time < T.ctr ? rows(KEY, NON) : time < T.kin ? rows(NON, CTR) : time < T.ks ? mbox(aes) : time < T.ord ? rows(KS)
      : time < T.zb ? rows(KS, ORD, CT) : time < T.hk + .5 ? [...rows(ZB), ...mbox(aes)] : time < T.gin ? rows(HK) : time < T.s + 1 ? mbox(gh)
      : time < T.j0 - .8 ? rows(SS) : time < T.ej + .6 ? [...rows(J0), ...mbox(aes)] : rows(SS, EJ, TAG);
  return { size: L.size, beats: { gcm: { end: T.end } }, pose, frame: (b, time) => frame(time), tiles: { ct: CT.B, tag: TAG.B } };
}

// ---------- chapter 4, Bob's keep: Eve's byte (step 12 'gcmEve') ----------
// The ciphertext comes in with its first byte changed by Eve, and the tag as Alice made it. Bob's
// AESGCM recomputes the tag first: GHASH (with H from the key) over the ciphertext he got, XOR
// AES(nonce ‖ 1). His tag lands under the packet's: the bytes differ, the lamp goes red, InvalidTag;
// the counter side stays shut, and the order's places stay empty: not one byte comes out.
function gcmEveRoom(scene, pk, portrait) {
  const g = pk.g, e = pk.gEvil, q = gcmParts(g), r = P.gcmOpen(e), sP = A.xor(r.mine, q.ej0);
  const NON = captioned(block(scene, e.nonce, INK.iv), label(t('in.nonce'), INK.iv.fg, CH, { plate: true }));
  const CT = captioned(block(scene, e.C, i => i === e.eve.i ? INK.bad : INK.c), label(t('in.ctGot'), INK.c.fg, CH, { plate: true }));
  const CTold = tile(g.C[e.eve.i], INK.c); scene.add(CTold);
  const TAGin = captioned(block(scene, e.tag, INK.seal), label(t('card.gtagGot'), INK.seal.fg, CH, { plate: true }));
  const gh = machine(scene, 'GHASH', 5, 5);
  const HK = captioned(block(scene, q.h, INK.key), label(t('in.hkey'), INK.key.fg, CH, { plate: true }));
  const CT2 = twin(scene, CT.B, e.C, i => i === e.eve.i ? INK.bad : INK.c);
  const SS = captioned(block(scene, sP, INK.plain), label(t('in.s'), INK.plain.fg, CH, { plate: true }));
  const EJ = captioned(block(scene, q.ej0, INK.x), label(t('in.ej0'), INK.x.fg, CH, { plate: true }));
  const MINE = captioned(block(scene, r.mine, INK.seal), label(t('in.mineTag'), INK.seal.fg, CH, { plate: true }));
  const MBAD = twin(scene, MINE.B, r.mine, i => r.mine[i] === e.tag[i] ? INK.seal : INK.bad);
  const TAG2 = captioned(block(scene, e.tag, INK.seal), label(t('card.gtagGot'), INK.seal.fg, CH, { plate: true }));
  const TBAD = twin(scene, TAG2.B, e.tag, i => r.mine[i] === e.tag[i] ? INK.seal : INK.bad);
  const d = [...r.mine].filter((x, i) => x !== e.tag[i]).length;
  const aes = machine(scene, 'AES-256', 6, 5.4);
  const OUT = captioned(block(scene, g.M, INK.empty), label(t('in.nothing'), '#ff8f9a', CH, { plate: true }));
  const inS = stackSize([NON, CT, TAGin]), tS = stackSize([HK, SS, EJ, MINE, TAG2]), oS = { w: Math.max(6, OUT.w), h: 7 + 1.4 + OUT.h };
  const L = lay(portrait, [['in', inS], ['gh', { w: 5, h: 6.6 }], ['tag', tS], ['out', oS]]);
  const at = L.at;
  stack(at.in, [NON, CT, TAGin]); stack(at.tag, [HK, SS, EJ, MINE, TAG2]);
  gh.place(at.gh);
  aes.place(v(at.out.x, at.out.y + oS.h / 2 - 3.5)); stack(v(at.out.x, at.out.y - oS.h / 2 + OUT.h / 2), [OUT]);
  const flipL = plate(scene, t('in.flip'), '#ff8f9a', v(0, 0));
  const diffL = plate(scene, t('in.diff', { d }), '#ff8f9a', v(0, 0));
  // the lamp: red when the tags differ
  const lampM = new THREE.MeshStandardMaterial({ color: 0x3a0a10, emissive: 0xff3347, emissiveIntensity: 0 });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.9, 24, 16), lampM); scene.add(lamp);
  const inval = label(t('in.invalid'), '#ff8f9a', 1.4, { plate: true }); scene.add(inval);
  // the counter side, shut: a red bar across AES's front
  const shut = new THREE.Mesh(new THREE.BoxGeometry(6.6, .5, .3), new THREE.MeshBasicMaterial({ color: 0xff3347 })); shut.rotation.z = -.5; scene.add(shut);
  shut.position.set(aes.c.x, aes.c.y - .8, 2.1);

  const T = { in: .3, flip: 1.4, hk: 2.8, gin: 3.4, s: 5.4, ej: 6.2, x: 7.2, cmp: 8.2, diff: 9.0, lamp: 10.2, out: 11.2, end: 13.6 };
  function pose(beat, time) {
    pop(NON.B, time, T.in, .02); during(NON.cap, time, T.in);
    pop(CT.B, time, T.in + .4, .03); during(CT.cap, time, T.in + .4);
    pop(TAGin.B, time, T.in + .8, .02); during(TAGin.cap, time, T.in + .8);
    // Eve's byte: Alice's turns over into Eve's, red
    const fk = span(time, T.flip, T.flip + .9), e0 = CT.B.tiles[e.eve.i];
    CTold.visible = e0.visible && fk < .5; if (fk < .5) e0.visible = false;
    for (const m of [CTold, e0]) if (m.visible) { m.position.copy(CT.B.at(e.eve.i)).add(v(0, 0, .6 * Math.sin(Math.PI * fk))); m.rotation.x = fk * Math.PI * 2; m.scale.setScalar(1 + .3 * Math.sin(Math.PI * fk)); }
    flipL.position.set(CT.B.c.x, CT.B.c.y + CT.B.h / 2 + 1.0, 1); during(flipL, time, T.flip + .4, T.hk + .6);
    // H, then the ciphertext he got into GHASH; out: S, XOR AES(nonce ‖ 1): his tag
    gh.show(span(time, .6, 1.2)); during(gh.nameL, time, .6);
    gh.rim.emissive.setHex(0xb77ff0); gh.rim.emissiveIntensity = time > T.gin ? 1.2 : 0;
    gh.run(time, time > T.gin + .5 && time < T.s + .2, time > T.s);
    pop(HK.B, time, T.hk, .02); during(HK.cap, time, T.hk, T.s);
    if (time > T.gin) { into(HK.B, gh.mouth(at.tag), time, T.gin, T.gin + 1.2); if (time > T.gin + 1.2) hide(HK.B); }
    hide(CT2); if (time > T.gin && time < T.s + .5) into(CT2, gh.mouth(at.in), time, T.gin, T.s);
    hide(SS.B); outOf(SS.B, gh.mouth(at.tag), time, T.s, T.s + 1); during(SS.cap, time, T.s + .3);
    pop(EJ.B, time, T.ej, .02); during(EJ.cap, time, T.ej);
    hide(MINE.B); if (time > T.x) for (let i = 0; i < 16; i++) {
      const k = span(time, T.x + i * .04, T.x + i * .04 + .5), m = MINE.B.tiles[i];
      m.position.lerpVectors(EJ.B.at(i), MINE.B.at(i), k); m.scale.setScalar(k); m.rotation.x = (1 - k) * Math.PI; m.visible = k > .01;
    }
    during(MINE.cap, time, T.x + .4);
    // the packet's tag comes down under his; every byte that differs turns red
    hide(TAG2.B); if (time > T.cmp) fly(TAG2.B, i => TAGin.B.at(i), time, T.cmp, T.cmp + 1); during(TAG2.cap, time, T.cmp + .5);
    hide(MBAD); hide(TBAD);
    for (let i = 0; i < 16; i++) {
      if (time < T.diff + i * .05) continue;
      for (const [B, O] of [[MINE.B, MBAD], [TAG2.B, TBAD]]) { const m = O.tiles[i]; m.position.copy(B.at(i)); m.scale.setScalar(1); m.rotation.x = 0; m.visible = true; B.tiles[i].visible = false; }
    }
    diffL.position.set(TAG2.B.c.x, TAG2.B.c.y - TAG2.B.h / 2 - .75, 1); during(diffL, time, T.diff + 1);
    // the lamp goes red: InvalidTag; AES stays shut, the order's places stay empty
    const lk = span(time, T.lamp, T.lamp + .4);
    lamp.position.set(at.gh.x, at.gh.y - 3.3 - 1.4, 0); lamp.visible = time > .6;
    lampM.emissiveIntensity = lk * (1.6 + Math.sin(time * 10) * .3); lampM.color.setHex(lk > .5 ? 0xff3347 : 0x3a0a10);
    inval.position.set(lamp.position.x, lamp.position.y - 1.6, 1); during(inval, time, T.lamp + .2);
    aes.show(span(time, T.out - .6, T.out)); during(aes.nameL, time, T.out - .6); aes.run(time, false, false);
    shut.visible = time > T.out + .5; shut.scale.x = span(time, T.out + .5, T.out + 1);
    pop(OUT.B, time, T.out + .6, .02); during(OUT.cap, time, T.out + 1.4);
  }
  const sizes = { in: inS, gh: { w: 5, h: 6.6 }, tag: tS, out: oS };
  const F = (...ids) => ids.flatMap(id => around(at[id], sizes[id]));
  const rows = (...parts) => parts.flatMap(p => around(p.B.c, { w: p.B.w, h: p.B.h + CAP * 2 }, .3));
  const lampF = () => [v(at.gh.x - 3, at.gh.y - 3.3 - 4), v(at.gh.x + 3, at.gh.y - 3.3)];
  const frame = time => !portrait
    ? time < T.out - .6 ? [...F('in', 'gh', 'tag'), ...lampF()] : [...F('gh', 'tag', 'out'), ...lampF()]
    : time < T.hk ? rows(NON, CT, TAGin) : time < T.s ? mbox(gh) : time < T.cmp ? rows(SS, EJ, MINE)
      : time < T.lamp ? rows(MINE, TAG2) : time < T.out ? [...mbox(gh), ...lampF()] : [...mbox(aes), ...rowsOf(OUT.B, 0, 1, CAP)];
  return { size: L.size, beats: { gcmEve: { end: T.end } }, pose, frame: (b, time) => frame(time), tiles: { mine: MINE.B, ct: CT.B } };
}

// each room: its keep (the window it is entered by and left through) and its machine
const ROOMS = { sign: { door: 'a', build: signRoom }, verify: { door: 'b', build: verifyRoom },
  gcm: { door: 'a', build: gcmRoom }, gcmEve: { door: 'b', build: gcmEveRoom } };
// the engine's options (lib/room.js): a farther far plane, dimmer torches, and the stone room with the
// owner's banners built around every machine
export const ROOM = { rooms: ROOMS, far: 400, flame: 28, slide: true,
  shell: (scene, portrait, machine, owner) => buildRoom(scene, portrait, { size: machine.size, owner }) };
