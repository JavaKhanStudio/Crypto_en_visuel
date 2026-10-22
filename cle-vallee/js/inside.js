// Inside a castle (r103, r160, r363): two rooms in episode 1.4. Steps 4 and 5 (« Le cadenas de Bob »,
// « Le vrai cadenas ») zoom through a lit window of Bob's keep into the RSA room: RSA by hand on 5
// and 11, then the 2048-bit n (two beats; out at 'deliver'). Step 7 (« Alice ferme le cadenas ») zooms
// through a window of Alice's keep into the OAEP room, which shows OAEP and RSA at work on the story's
// real bytes (rsa.js): the two keys, the 256-byte block OAEP builds around them, the seed and its two
// masks, then the block locked with Bob's padlock into c (one beat; out at 'seed').
// Copied from octet-change/js/inside.js (r159), itself from eve-lit-tout/js/inside.js (r158, the
// reference room); the zoom itself is lib/zoom.js.
//
// The engine (enter, beat, cut, leave, the free band, the doors) is lib/room.js (r424), as is its API;
// this file keeps only the rooms (ROOM.rooms) and the engine options this episode needs.
import * as THREE from 'three';
import { face, side, tile, paint, label, relabel, show, buildRoom } from '../../lib/room-parts.js';
import { t } from './i18n.js';
import { padlock, key } from './props.js';
import * as R from '../../lib/rsa.js';

const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const clamp01 = k => Math.max(0, Math.min(1, k));
const span = (time, a, b) => ease(clamp01((time - a) / (b - a)));
const hx = x => x.toString(16).padStart(2, '0');

// ---------- what a room is made of: lib/room-parts.js (r485); here, the colours ----------
// the colours of the corner card: the keys violet (AES) and green (HMAC), the seed and EM blue,
// c yellow; OAEP's fixed bytes gold, its zeros dim, what a mask has passed over orange
const INK = { key: { fg: '#e3b8ff', bg: '#2a1838', size: 62 }, mac: { fg: '#8fd18a', bg: '#12301a', size: 62 },
  iv: { fg: '#9fd3f0', bg: '#12283a', size: 62 }, pad: { fg: '#ffd27a', bg: '#5a3c10', size: 62 },
  zero: { fg: '#8a7c68', bg: '#221a12', size: 62 }, x: { fg: '#ffb070', bg: '#3a1e0c', size: 62 },
  c: { fg: '#ffd84d', bg: '#2a2008', size: 62 } };

// ---------- the OAEP room of episode 1.4: one beat, 'close' ----------
// The machine: a wall of 256 tiles, 16 rows of 16 like the card's, the size of n. The two keys fill
// its last 4 rows (64 bytes); OAEP lays 01, 126 bytes of 00 and the SHA-256 of the empty label above
// them, then the seed, 32 random bytes, and the 00 that starts EM. Two masks sweep it: the first, made
// from the seed with SHA-256, over the 223 bytes below the seed; the second, made from that masked
// block, back over the seed. What is left is EM, read as one number: a copy goes into the box where
// Bob's open padlock hangs, the padlock snaps shut (c = EM^65537 mod n), and c comes out, 256 bytes.
// Landscape: wall, box, c from left to right, the words at the wall's left. Portrait (a phone): from
// top to bottom, the words on a dark plate over the part they name, and the camera follows the action.
function oaepRoom(scene, pk, portrait) {
  const o = pk.s.locked, keys = pk.s.keys, H = R.H, k = R.BOB.k, z = k - keys.length - 2 * H - 2;   // z: 126 bytes of 00
  buildRoom(scene, portrait, { rows: portrait ? 34 : 15 });
  const P = 1.1, half = 7.5 * P + .5;   // tile pitch; half the wall's side
  const WC = portrait ? v(0, 41) : v(-12, 10.2), BC = portrait ? v(0, 25.4) : v(4, 10.2), CC = portrait ? v(0, 9.6) : v(20, 10.2);
  const at = c => i => v(c.x + (i % 16 - 7.5) * P, c.y + (7.5 - Math.floor(i / 16)) * P);
  const wAt = at(WC), cAt = at(CC), rowY = r => WC.y + (7.5 - r) * P;
  // EM's bytes: 0 is 00, 1..32 the seed, 33..64 the label's hash, 65..190 the zeros, 191 is 01, 192.. the keys
  const S0 = 1, D0 = 1 + H, ONE = D0 + H + z, M0 = ONE + 1;
  const plain = i => i === 0 ? [0, INK.pad] : i < D0 ? [o.seed[i - S0], INK.iv] : i < ONE ? [o.DB[i - D0], i < D0 + H ? INK.pad : INK.zero]
    : i === ONE ? [1, INK.pad] : [keys[i - M0], i < M0 + 32 ? INK.key : INK.mac];
  const W = [...Array(k).keys()].map(i => { const [b, ink] = plain(i); return tile(b, ink); });
  const E = [...o.EM].map(b => tile(b, INK.x)), C = [...o.c].map(b => tile(b, INK.c));
  E[0] = tile(0, INK.pad);
  [...W, ...E, ...C].forEach(m => scene.add(m));

  // the words. Landscape: at the wall's left, against the rows they name; portrait: on a plate over them
  const side = portrait ? { plate: true } : { plate: true, align: 1 }, lx = WC.x - half - .5;
  const word = (key, color, row, args, h = .8) => {
    const l = label(t(key, args), color, portrait ? h : .95, side); l.userData.row = row;
    l.position.copy(portrait ? v(WC.x, rowY(row), .9) : v(lx, rowY(row))); scene.add(l); return l;
  };
  const L = { seed: word('in.seed', '#9fd3f0', 1), lhash: word('in.lhash', '#ffd27a', 3), zeros: word('in.zeros', '#c8b89c', 7.5, { n: z }),
    one: word('in.one', '#ffd27a', 11), aes: word('in.aes', '#e3b8ff', 12.5), mac: word('in.mac', '#8fd18a', 14.5),
    mseed: word('in.mseed', '#ffb070', 1), mdb: word('in.mdb', '#ffb070', 9, { n: k - 1 - H }) };
  const em = label(t('in.em'), '#9fd3f0', .9, portrait ? { plate: true } : {}); em.position.set(WC.x, WC.y + half + .9, 0); scene.add(em);
  const cL = label(t('in.c'), '#ffd84d', portrait ? 1.1 : .9); cL.position.set(CC.x, CC.y + half + .9, 0); scene.add(cL);

  // the masks: a bar of light that sweeps the rows it masks, its words riding with it
  const bar = new THREE.Mesh(new THREE.BoxGeometry(16 * P + .6, .16, .1), new THREE.MeshBasicMaterial({ color: 0x9fd3f0, transparent: true }));
  bar.position.z = .45; scene.add(bar);
  const mh = portrait ? .8 : .95, m1 = label(t('in.mask1', { n: k - 1 - H }), '#9fd3f0', mh, side), m2 = label(t('in.mask2'), '#ffb070', mh, side); scene.add(m1, m2);

  // the box: RSA-2048, with Bob's open padlock on its front, and what it computes under it
  const riser = new THREE.Group(); riser.position.copy(BC); scene.add(riser);
  const metal = new THREE.MeshStandardMaterial({ color: 0x24202a, roughness: .45, metalness: .6 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(6, 5.4, 4.4), metal); box.castShadow = box.receiveShadow = true; riser.add(box);
  const gold = new THREE.LineBasicMaterial({ color: 0xffc24d });
  riser.add(new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), gold));
  const lock = padlock(); lock.scale.setScalar(2.6); lock.position.set(0, 1.0, 2.5); riser.add(lock);
  const name = label('RSA-2048', '#ffd27a', 1.0); name.position.set(BC.x, BC.y + 2.7 + .8, 2.4); scene.add(name);
  const pad = label(t('in.pad'), '#ffc24d', .7); pad.position.set(BC.x, BC.y - 1.85, 2.6); scene.add(pad);
  const calc = label(t('in.lock'), '#ffd27a', .9); scene.add(calc);
  calc.position.set(BC.x, BC.y - 2.7 - .8, 0);
  const inMouth = portrait ? v(BC.x, BC.y + 2.7) : v(BC.x - 3, BC.y), outMouth = portrait ? v(BC.x, BC.y - 2.7) : v(BC.x + 3, BC.y);

  // tiles pop up where they sit, one after another (order: the indices, in the order they come)
  const pop = (list, order, pos, time, a, gap) => order.forEach((i, n) => {
    const m = list[i], q = span(time, a + n * gap, a + n * gap + .4); m.position.copy(pos(i)); m.scale.setScalar(q); m.rotation.x = 0; m.visible = q > .02;
  });
  const range = (a, b) => [...Array(b - a).keys()].map(x => x + a);
  // a mask passes a tile when the bar crosses its row: the tile turns over and shows its masked byte
  const flip = (i, q) => { const m = W[i]; m.rotation.x = q * Math.PI * 2; m.position.z = Math.sin(Math.PI * q) * .5;
    if (q >= .5) paint(m, o.EM[i], INK.x); else { const [b, ink] = plain(i); paint(m, b, ink); } };
  // a copy of EM streams into the box, row after row; c comes out of it
  const into = (time, a, b) => E.forEach((m, i) => {
    const dl = (i % 16) * .02 + Math.floor(i / 16) * .07, q = span(time, a + dl, b - 1.4 + dl);
    m.position.lerpVectors(wAt(i), inMouth, q); m.position.z = .3; m.scale.setScalar(1 - .75 * q); m.rotation.x = 0; m.visible = time > a && q < .999;
  });
  const outOf = (time, a, b) => C.forEach((m, i) => {
    const dl = (i % 16) * .02 + Math.floor(i / 16) * .07, q = span(time, a + dl, b - 1.4 + dl);
    m.position.lerpVectors(outMouth, cAt(i), q); m.scale.setScalar(.25 + .75 * q); m.rotation.x = (1 - q) * Math.PI; m.visible = q > .001;
  });

  // the times: the keys, 01, the zeros, the hash, the seed; mask 1 down, mask 2 up; EM; the lock; c
  const T = { keys: .3, one: 1.9, zeros: 2.3, lhash: 3.9, seed: 4.9, m1: 6.6, m1e: 9.2, m2: 9.7, m2e: 11.0, em: 11.3, lock: 12.6, shut: 15.0, c: 15.5, end: 18.6 };
  const seen = (l, a, b = 99) => show(l, span(time_, a, a + .5) * (1 - span(time_, b, b + .5)));
  let time_ = 0;
  function pose(beat, time) {
    time_ = time;
    // the wall: the keys, then 01, the zeros from the bottom up, the label's hash, then 00 and the seed
    W.forEach(m => { m.visible = false; });
    pop(W, range(M0, k), wAt, time, T.keys, .012);
    pop(W, [ONE], wAt, time, T.one, 0);
    pop(W, range(D0 + H, ONE).reverse(), wAt, time, T.zeros, .008);
    pop(W, range(D0, D0 + H).reverse(), wAt, time, T.lhash, .02);
    pop(W, range(0, D0).reverse(), wAt, time, T.seed, .025);
    // mask 1: the bar runs down from the seed's last row over rows 2..15; mask 2: back up over rows 0..2
    const r1 = 2 + (15 - 2 + 1) * clamp01((time - T.m1) / (T.m1e - T.m1)), r2 = 2.999 - 3 * clamp01((time - T.m2) / (T.m2e - T.m2));
    for (let i = 0; i < k; i++) {
      const r = Math.floor(i / 16);
      if (i >= D0) flip(i, clamp01((r1 - r) / .8));
      else if (i >= S0) flip(i, clamp01((r + 1 - r2) / .8));
    }
    // on a phone EM's wall goes as the camera settles on the box and c: above them it would show cut
    // under the top bar (r448); a copy of it is in the box, the card holds it
    const rest = portrait ? T.c + 1.2 : 99, gone = 1 - span(time, rest, rest + .5);
    if (gone < 1) W.forEach(m => { m.scale.multiplyScalar(gone); m.visible &&= gone > .02; });
    const sweep1 = time > T.m1 && time < T.m1e + .3, sweep2 = time > T.m2 && time < T.m2e + .3;
    bar.visible = sweep1 || sweep2;
    if (bar.visible) {
      const y = sweep1 ? rowY(Math.min(r1, 16)) + P / 2 : rowY(r2 - 1) - P / 2;
      bar.position.set(WC.x, y, .45); bar.material.color.setHex(sweep1 ? 0x9fd3f0 : 0xffb070);
      bar.material.opacity = sweep1 ? 1 - span(time, T.m1e, T.m1e + .3) : 1 - span(time, T.m2e, T.m2e + .3);
    }
    // the mask's words ride beside the bar (landscape) or on it (portrait)
    for (const [l, on, y] of [[m1, sweep1, bar.position.y], [m2, sweep2, bar.position.y]]) {
      l.visible = on; if (!on) continue;
      l.position.copy(portrait ? v(WC.x, y + (y > WC.y ? -.9 : .9), 1) : v(lx, y)); l.material.opacity = bar.material.opacity;
    }
    // the words of the wall: each comes with its part, the plain ones go when the masks pass (landscape);
    // on a phone, a plate shows for a moment over the part that arrives
    const plateFor = (a, b) => portrait ? Math.min(b, a + 1.9) : b;
    seen(L.aes, T.keys, plateFor(T.keys, T.m1e - 1)); seen(L.mac, T.keys, plateFor(T.keys, T.m1e - .6));
    seen(L.one, T.one, plateFor(T.one, T.m1 + 1.9)); seen(L.zeros, T.zeros, plateFor(T.zeros, T.m1 + .9));
    seen(L.lhash, T.lhash, plateFor(T.lhash, T.m1 + .1)); seen(L.seed, T.seed, plateFor(T.seed, T.m2 + .3));
    seen(L.mdb, T.m1e, portrait ? T.m1e + 1.6 : 99); seen(L.mseed, T.m2e - .2, portrait ? T.m2e + 1.4 : 99);
    seen(em, T.em, rest);
    // the lock: a copy of EM into the box, the padlock snaps shut, the box works, c comes out
    E.forEach(m => { m.visible = false; });
    if (time > T.lock) into(time, T.lock, T.shut);
    const shut = span(time, T.shut - .5, T.shut);
    lock.userData.setOpen(1 - shut);
    const busy = time > T.shut - .6 && time < T.c + 1;
    riser.position.x = BC.x + (busy ? Math.sin(time * 60) * .03 : 0); gold.color.setHex(busy ? 0xffe9a8 : 0xffc24d);
    seen(calc, T.lock + .6); seen(name, 0); seen(pad, 0);
    C.forEach(m => { m.visible = false; });
    if (time > T.c) outOf(time, T.c, T.end);
    seen(cL, T.c + 1);
  }

  // what the camera holds. Landscape: the keys' rows, then the whole wall with its words while OAEP builds it, then the
  // wall and the box while the padlock shuts, then the box and c, the wall's last columns beside. A phone's band is a short strip:
  // it follows the action five rows at a time (the keys, the zeros as they climb, the hash and the
  // seed, the first mask's bar on its way down, the second's on the seed), the whole wall once, as EM,
  // then the box, then the padlock shut over all of c
  const rows = (a, b, up = 0) => [v(WC.x - half, rowY(b) - .6), v(WC.x + half, rowY(a) + .6 + up)];
  const win = r => { const a = Math.max(0, Math.min(11, Math.round(r - 2.5))); return rows(a, a + 4); };
  const wallF = [...rows(0, 15, 1.6), ...(portrait ? [] : [v(lx - 10.5, WC.y)])];
  const boxF = [v(BC.x - 3.2, BC.y - 2.7 - (portrait ? .3 : 1.4)), v(BC.x + 3.2, BC.y + 2.7 + 1.4)];
  const cF = [v(CC.x - half, CC.y - half), v(CC.x + half, CC.y + half + 1.6)];
  const phone = time => {
    if (time < T.one) return rows(12, 15);
    if (time < T.zeros) return rows(11, 15);
    if (time < T.lhash) return win(11 - 7 * clamp01((time - T.zeros) / (T.lhash - T.zeros - .4)));
    if (time < T.seed) return rows(1, 5);
    if (time < T.m1) return rows(0, 4, 1);
    if (time < T.m1e + .3) return win(2 + 14 * clamp01((time - T.m1) / (T.m1e - T.m1)));
    if (time < T.em) return rows(0, 4, 1);
    if (time < T.lock) return rows(0, 15, 1.6);
    if (time < T.c + 1.2) return [...boxF, v(BC.x - 9, BC.y - 1), v(BC.x + 9, BC.y - 1)];
    return [v(BC.x, BC.y + 2.7 + 1.4), ...cF];   // at rest the shut box and all of c (r448: its last rows went under the card)
  };
  const frame = time => portrait ? phone(time)
    : time < T.zeros ? [...rows(10, 15), v(lx - 10.5, rowY(12))] : time < T.lock ? wallF : time < T.c ? [...wallF, ...boxF] : [v(WC.x + half - 4.4, WC.y), ...boxF, ...cF];
  return { beats: { close: { end: T.end } }, pose, frame: (b, time) => frame(time), tiles: { W, C } };
}
// ---------- the RSA room of episode 1.4, in Bob's keep: two beats, 'padlock' and 'rsa2048' (r363) ----------
// Beat 'padlock', RSA by hand on the card's numbers (rsa.js TOY): the primes 5 and 11 multiply into
// n = 55; with e = 3 that is the open padlock, Bob's public key, which goes onto the first box. From
// (5 − 1) × (11 − 1) = 40 comes d = 27 (3 × 27 = 81 = 2 × 40 + 1), Bob's key, onto the second box.
// Then 7 goes into the padlock's box, 7³ = 343 = 6 × 55 + 13, and 13 comes out; 13 goes into the
// key's box, 13²⁷ mod 55, and 7 comes back. Beat 'rsa2048': the 5 and the 11 grow into two primes of
// 1024 bits, 128 tiles each, face down (the page shows Bob's p and q nowhere, rsa.js: only he knows
// them); their product n is laid row by row, the card's 256 bytes, and with e = 65537 (01 00 01) it
// is the padlock. A bracket over n's first 829 bits: the largest number of this kind ever factored
// in public (RSA-250, 2020). Landscape: the key-making at the top, the boxes from left to right below
// (beat 1); p over q, then n, then e (beat 2). Portrait (a phone): top to bottom, the camera following.
const BIG = new THREE.BoxGeometry(2.4, 2.4, .4); BIG.userData.shared = true;
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', sup = x => String(x).replace(/\d/g, c => SUP[c]);
function number(x, ink) {   // a big tile with a number on it; userData.n: what tests/cle_inside.py reads
  const text = String(x), m = new THREE.Mesh(BIG, [side, side, side, side, face(text, { ...ink, size: text.length > 2 ? 52 : 70 }), side]);
  m.visible = false; m.userData.n = text; return m;
}
function rsaRoom(scene, send, portrait) {
  const K = R.TOY, c = R.lock(K, K.m), back = R.unlock(K, c), me = K.m ** K.e, B = R.BOB;
  buildRoom(scene, portrait, { rows: portrait ? 36 : 15 });
  const ink = { p: INK.iv, n: INK.key, e: INK.pad, d: INK.mac, m: INK.x, c: INK.c, ok: INK.mac };
  // ---- beat 1: where each thing sits
  const at = portrait
    ? { p: v(-5.4, 37), q: v(0, 37), n: v(5.4, 37), e: v(-4, 31), d: v(4, 31), phi: v(4, 33.4), dL: v(4, 28.6),
        m: v(0, 24.6), box1: v(0, 19.6), c: v(0, 14.4), box2: v(0, 9.2), back: v(0, 4) }
    : { p: v(-14, 13), q: v(-9, 13), n: v(-4, 13), e: v(1, 13), d: v(6, 13), phi: v(-9, 10.1), dL: v(6, 10.1),
        m: v(-16, 3.4), box1: v(-7.5, 3.6), c: v(1, 3.4), box2: v(9.5, 3.6), back: v(17.5, 3.4) };
  const T1 = { p: .3, q: .8, n: 1.7, e: 2.5, phi: 3.3, d: 4.3, load: 5.3, m: 6.8, into: 7.4, shut: 8.6, c: 8.9, cin: 10.4, turn: 11.6, back: 12.1, end: 13.8 };
  const big = { p: number(K.p, ink.p), q: number(K.q, ink.p), n: number(K.n, ink.n), e: number(K.e, ink.e), d: number(K.d, ink.d),
    m: number(K.m, ink.m), c: number(c, ink.c), back: number(back, ink.ok) };
  // copies of n, e and d fly onto the boxes: the keys are loaded into the machines
  const load = { n1: number(K.n, ink.n), e1: number(K.e, ink.e), n2: number(K.n, ink.n), d2: number(K.d, ink.d) };
  [...Object.values(big), ...Object.values(load)].forEach(m => scene.add(m));
  const letters = Object.fromEntries(['p', 'q', 'n', 'e', 'd'].map(k => { const l = label(k, '#f4e6c8', 1); scene.add(l); return [k, l]; }));
  const sign = (text, a, b) => { const l = label(text, '#f4e6c8', 1.3); l.position.lerpVectors(a, b, .5); scene.add(l); return l; };
  const times = sign('×', at.p, at.q), equals = sign('=', at.q, at.n);
  const lw = portrait ? 1.3 : 1.05;
  const phi = label(t('in.phi', { p: K.p, q: K.q, phi: K.phi }), '#9fd3f0', lw, { plate: true }); phi.position.copy(at.phi); scene.add(phi);
  const dL = label(t('in.dcalc', { e: K.e, d: K.d, ed: K.e * K.d, k: K.e * K.d / K.phi, phi: K.phi }), '#8fd18a', lw, { plate: true }); dL.position.copy(at.dL); scene.add(dL);
  // the boxes: the first wears Bob's open padlock (lock with the public key), the second his key
  const metal = new THREE.MeshStandardMaterial({ color: 0x4a4250, roughness: .45, metalness: .5 });
  const machine = (pos, gold) => {
    const g = new THREE.Group(); g.position.copy(pos); scene.add(g);
    const box = new THREE.Mesh(new THREE.BoxGeometry(4.4, 4, 3.2), metal); box.castShadow = box.receiveShadow = true; g.add(box);
    const edge = new THREE.LineBasicMaterial({ color: gold }); g.add(new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), edge));
    return { g, edge, gold };
  };
  const box1 = machine(at.box1, 0xffc24d), box2 = machine(at.box2, 0x8fd18a);
  const lock = padlock(); lock.scale.setScalar(2.1); lock.position.set(0, .9, 1.8); box1.g.add(lock);
  const bobKey = key(0x8fd18a, .4); bobKey.scale.setScalar(2.6); bobKey.position.set(0, .3, 1.9); box2.g.add(bobKey);
  const pub = label(t('in.pub', { n: K.n, e: K.e }), '#ffd27a', lw, { plate: true }), priv = label(t('in.priv', { n: K.n, d: K.d }), '#8fd18a', lw, { plate: true });
  const capY = portrait ? 2.0 + .6 : 2.0 + .9;
  pub.position.copy(at.box1).add(v(0, capY, 1.7)); priv.position.copy(at.box2).add(v(0, capY, 1.7)); scene.add(pub, priv);
  const calc1 = label(`${K.m}${sup(K.e)} = ${me} = ${me / K.n} × ${K.n} + ${c}`, '#ffd84d', lw, { plate: true });
  const calc2 = label(`${c}${sup(K.d)} mod ${K.n} = ${back}`, '#8fd18a', lw, { plate: true });
  calc1.position.copy(at.box1).add(v(0, -2.0 - .7, 1.7)); calc2.position.copy(at.box2).add(v(0, -2.0 - .7, 1.7)); scene.add(calc1, calc2);
  // a box's mouths: in from the left and out to the right; on a phone in at the top, out at the bottom
  const mouth = (b, out) => b.clone().add(portrait ? v(0, out ? -2 : 2) : v(out ? 2.2 : -2.2, 0));

  // ---- beat 2: p over q, n, e, the padlock
  const Pt = 1.1, HW = 7.5 * Pt + .5;
  const C2 = portrait ? { p: v(0, 46.2), q: v(0, 36), times: v(0, 30.4), n: v(0, 19.6), e: v(-3, 7.4), lock: v(3, 6.6) }
    : { p: v(-15, 14.6), q: v(-15, 4.6), times: v(-4.6, 9.6), n: v(7, 9.6), e: v(21, 6.4), lock: v(21, 2.6) };
  const wall = (cx, cy, cols, i) => v(cx + (i % cols - (cols - 1) / 2) * Pt, cy + ((Math.ceil(B.k / 2 / cols) - 1) / 2 - Math.floor(i / cols)) * Pt);
  const half = B.k / 2, hid = { fg: '#7a6a8a', bg: '#1c1424', size: 62 };
  const Pw = [...Array(half).keys()].map(() => { const m = tile(0, hid); m.material[4] = face('?', { ...hid, size: 70 }); return m; });
  const Qw = [...Array(half).keys()].map(() => { const m = tile(0, hid); m.material[4] = face('?', { ...hid, size: 70 }); return m; });
  const nBytes = R.bytesOf(B.n, B.k), N = [...nBytes].map(b => tile(b, INK.key));
  const eBytes = R.bytesOf(B.e, 3), E = [...eBytes].map(b => tile(b, INK.pad));
  [...Pw, ...Qw, ...N, ...E].forEach(m => scene.add(m));
  const pAt = i => wall(C2.p.x, C2.p.y, 16, i), qAt = i => wall(C2.q.x, C2.q.y, 16, i);
  const nAt = i => v(C2.n.x + (i % 16 - 7.5) * Pt, C2.n.y + (7.5 - Math.floor(i / 16)) * Pt);
  const eAt = i => v(C2.e.x + (i - 1) * Pt, C2.e.y);
  const grow = { p: number(K.p, ink.p), q: number(K.q, ink.p) }; scene.add(grow.p, grow.q);
  const w2 = portrait ? 1.1 : 1.15;
  const pL = label(t('in.p1024', { x: 'p' }), '#c8b0e0', w2, { plate: true }), qL = label(t('in.p1024', { x: 'q' }), '#c8b0e0', w2, { plate: true });
  pL.position.copy(C2.p).setZ(.9); qL.position.copy(C2.q).setZ(.9);
  const times2 = label('×', '#f4e6c8', 2.4); times2.position.copy(C2.times);
  const nL = label(t('in.n2048'), '#e3b8ff', w2, { plate: true }); nL.position.set(C2.n.x, C2.n.y + HW + .9, .9);
  const eL = label(`e = ${B.e}`, '#ffd27a', w2); eL.position.set(C2.e.x, C2.e.y + 1.4, 0);
  const lock2 = padlock(); lock2.scale.setScalar(2.4); lock2.position.copy(C2.lock).add(v(0, 1.2)); scene.add(lock2);
  const pad2 = label(t('in.pad'), '#ffc24d', w2, { plate: true }); pad2.position.copy(C2.lock).add(v(0, -1.2, .9));
  // RSA-250: a bracket down n's right side over its first 829 bits, its words at its right; a phone has
  // no room there, so they go above n, where the × of p × q was (r446: over the rows they hid the bytes)
  const R250 = 829 / 8 / 16, bx = C2.n.x + HW + .35, r250y = C2.n.y + HW + 3.3;
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(.22, 1, .2), new THREE.MeshBasicMaterial({ color: 0xff8f9a, transparent: true }));
  const r250 = label(t('in.rsa250'), '#ff8f9a', portrait ? 1.1 : 1.05, { plate: true, align: portrait ? .5 : 0 });
  scene.add(pL, qL, times2, nL, eL, pad2, bracket, r250);
  const topN = C2.n.y + 8 * Pt;

  const all = [...Object.values(big), ...Object.values(load), ...Object.values(letters), times, equals, phi, dL, box1.g, box2.g, pub, priv, calc1, calc2,
    ...Pw, ...Qw, ...N, ...E, grow.p, grow.q, pL, qL, times2, nL, eL, lock2, pad2, bracket, r250];
  const put = (m, pos, q, s = 1) => { m.position.copy(pos); m.scale.setScalar(s * q); m.visible = q > .02; m.rotation.set(0, 0, 0); };
  const fly = (m, a, b, q, s0 = 1, s1 = 1) => { m.position.lerpVectors(a, b, q); m.position.z += Math.sin(Math.PI * q) * 1.5; m.scale.setScalar(s0 + (s1 - s0) * q); m.visible = true; m.rotation.set(0, 0, 0); };
  let time_ = 0;
  const seen = (l, a, b = 99) => show(l, span(time_, a, a + .5) * (1 - span(time_, b, b + .5)));

  function padlockBeat(time) {
    const T = T1;
    // on a phone the key-making goes as the camera backs out to both boxes, which carry its numbers (r447)
    const rest = portrait ? T.back + 1.2 : 99, gone = 1 - span(time, rest, rest + .5);
    for (const k of ['p', 'q', 'n', 'e', 'd']) {
      put(big[k], at[k], span(time, T[k], T[k] + .5) * gone);
      letters[k].position.copy(at[k]).add(v(0, 2.0)); seen(letters[k], T[k] + .2, rest);
    }
    seen(times, T.q, rest); seen(equals, T.n - .3, rest); seen(phi, T.phi, rest); seen(dL, T.d, rest);
    // n and e onto the first box, n and d onto the second
    for (const [m, from, to, a] of [[load.n1, at.n, at.box1, T.load], [load.e1, at.e, at.box1, T.load + .2],
                                    [load.n2, at.n, at.box2, T.load + .5], [load.d2, at.d, at.box2, T.load + .7]]) {
      const q = span(time, a, a + 1.1);
      if (time > a && q < .999) fly(m, from, to.clone().add(v(0, 0, 1)), q, 1, .3); else m.visible = false;
    }
    box1.g.visible = box2.g.visible = true;
    const loaded1 = span(time, T.load + 1.1, T.load + 1.5), loaded2 = span(time, T.load + 1.6, T.load + 2);
    lock.visible = loaded1 > .02; lock.scale.setScalar(2.1 * Math.max(.02, loaded1)); bobKey.visible = loaded2 > .02; bobKey.scale.setScalar(2.6 * Math.max(.02, loaded2));
    seen(pub, T.load + 1.1); seen(priv, T.load + 1.6);
    // 7 into the padlock's box, the padlock shuts, 13 out; 13 into the key's box, the key turns, 7 out
    put(big.m, at.m, span(time, T.m, T.m + .5));
    if (time > T.into) { const q = span(time, T.into, T.into + 1); if (q < .999) fly(big.m, at.m, mouth(at.box1, false), q, 1, .3); else big.m.visible = false; }
    lock.userData.setOpen(1 - span(time, T.shut - .5, T.shut));
    const busy1 = time > T.shut - .4 && time < T.c + .6, busy2 = time > T.turn - .4 && time < T.back + .6;
    box1.g.position.x = at.box1.x + (busy1 ? Math.sin(time * 60) * .03 : 0); box1.edge.color.setHex(busy1 ? 0xffe9a8 : box1.gold);
    box2.g.position.x = at.box2.x + (busy2 ? Math.sin(time * 60) * .03 : 0); box2.edge.color.setHex(busy2 ? 0xd8ffd0 : box2.gold);
    seen(calc1, T.shut - .3);
    big.c.visible = false;
    if (time > T.c) { const q = span(time, T.c, T.c + 1); fly(big.c, mouth(at.box1, true), at.c, q, .3, 1); }
    if (time > T.cin) { const q = span(time, T.cin, T.cin + 1); if (q < .999) fly(big.c, at.c, mouth(at.box2, false), q, 1, .3); else big.c.visible = false; }
    bobKey.rotation.x = span(time, T.turn - .6, T.turn) * Math.PI / 2;
    seen(calc2, T.turn - .3);
    big.back.visible = false;
    if (time > T.back) { const q = span(time, T.back, T.back + 1); fly(big.back, mouth(at.box2, true), at.back, q, .3, 1); }
  }
  function wallBeat(time) {
    // the 5 and the 11 swell where p's and q's walls will be, and the walls take their place, from the middle out
    for (const [g, c0] of [[grow.p, C2.p], [grow.q, C2.q]]) { const q = span(time, .2, 1.4); put(g, c0, 1 - span(time, 1.2, 1.8), 1 + 1.5 * q); g.position.z = 1; }
    // on a phone p's and q's walls go as the bracket's words take their foot (r446)
    const gone = portrait ? 1 - span(time, 9.8, 10.4) : 1;
    const ring = (list, place) => list.map((m, i) => [m, place(i), place(i).distanceTo(place === pAt ? C2.p : C2.q)]).sort((a, b) => a[2] - b[2])
      .forEach(([m, pos], n) => put(m, pos, span(time, 1 + n * .009, 1.4 + n * .009) * gone));
    ring(Pw, pAt); ring(Qw, qAt);
    seen(pL, 2.6, portrait ? 9.8 : 99); seen(qL, 2.6, portrait ? 9.8 : 99); seen(times2, 3.4, portrait ? 10.1 : 99);
    N.forEach((m, i) => put(m, nAt(i), span(time, 3.8 + i * .012, 4.2 + i * .012)));
    seen(nL, 4);
    E.forEach((m, i) => put(m, eAt(i), span(time, 7.6 + i * .15, 8 + i * .15)));
    seen(eL, 7.8);
    lock2.visible = time > 8.6; lock2.scale.setScalar(2.4 * Math.max(.02, span(time, 8.6, 9.1))); lock2.userData.setOpen(1); seen(pad2, 9);
    const b = span(time, 10, 11.2), h = R250 * Pt * b;
    bracket.visible = b > .01; bracket.scale.y = Math.max(.01, h); bracket.material.opacity = 1;
    bracket.position.set(bx, topN - h / 2, .4);
    r250.position.copy(portrait ? v(C2.n.x, r250y, 1) : v(bx + .6, topN - R250 * Pt / 2));
    seen(r250, 10.6);
  }
  function pose(beat, time) {
    time_ = time;
    all.forEach(o => { o.visible = false; });
    if (beat === 'padlock') padlockBeat(time); else wallBeat(time);
  }

  // what the camera holds. Landscape: all of beat 1; beat 2 p and q, then with n, then with e and the
  // padlock. A phone follows: beat 1 the key-making, then the first box with 7 and 13, then the
  // second box, and at rest both boxes; beat 2 p over q, n as it is laid, its foot with e and the padlock, then all of n, e and the
  // padlock at its foot, the bracket's words above (r446: the whole wall, so the 829 bits read as the share of n they are)
  const wide1 = [v(at.m.x - 1.4, 0.6), v(at.back.x + 1.4, at.p.y + 2.6), v(at.box1.x, at.box1.y - 3.2)];
  const p1 = time => {
    const rows = (a, b) => [v(-7, a), v(7, b)], b1 = at.box1.y, b2 = at.box2.y;
    if (time < T1.e) return rows(at.p.y - 1.4, at.p.y + 2.6);                 // p × q = n
    if (time < T1.load) return rows(at.dL.y - .8, at.e.y + 2.6);              // e, and d from (p − 1)(q − 1)
    if (time < T1.load + 1.3) return rows(b1 - 2.4, b1 + 3.6);                // the padlock onto the first box
    if (time < T1.m - .2) return rows(b2 - 2.4, b2 + 3.6);                    // the key onto the second
    if (time < T1.c + .8) return rows(b1 - 3.2, at.m.y + 1.4);                // 7 in, the padlock shuts
    if (time < T1.cin + 1) return rows(b2 - 2.4, at.c.y + 1.4);               // 13 out, on to the key
    if (time < T1.back + 1.2) return rows(at.back.y - 1.4, b2 + 2.4);          // 7 back
    return rows(at.back.y - 1.4, b1 + capY + 1);                               // at rest: both boxes, the public plate on top (r447)
  };
  const pq = [v(C2.p.x - HW, C2.q.y - 4.4 - .5), v(C2.p.x + HW, C2.p.y + 4.4 + .5)];
  const nF = [v(C2.n.x - HW, C2.n.y - HW), v(C2.n.x + HW, C2.n.y + HW + 1.6)];
  // the end: n with e, the padlock and the bracket's words at its right, p and q's edge at its left
  const w2f = time => time < 3.4 ? pq : time < 7.4 ? [...pq, ...nF] : [v(C2.times.x - 2, C2.n.y), ...nF, v(bx + 13, topN), v(C2.lock.x, C2.lock.y - 2)];
  const p2 = time => time < 3.4 ? pq : time < 7.4 ? nF
    : time < 9.8 ? [v(-7, C2.lock.y - 2.2), v(7, C2.n.y - HW + 4 * Pt)] : [v(C2.n.x - HW, C2.lock.y - 2), v(C2.n.x + HW, r250y + 1.9)];
  const frame = (beat, time) => beat === 'padlock' ? (portrait ? p1(time) : wide1) : (portrait ? p2(time) : w2f(time));
  return { beats: { padlock: { end: T1.end }, rsa2048: { end: 12.2 } }, pose, frame, tiles: { big, N } };
}
// each room and the window it is entered by: 'a' or 'b', that castle's valley window, or 'a:<window>'
// (lib/saga/world.js keepDoors); a step's door: picks another
const ROOMS = { oaep: { build: oaepRoom, door: 'a' }, rsa: { build: rsaRoom, door: 'b' } };
// the engine's options (lib/room.js): deep, the fog and far plane follow the camera off the big walls (r446)
export const ROOM = { rooms: ROOMS, deep: true };
