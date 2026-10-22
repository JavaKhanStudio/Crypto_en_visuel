// Inside a castle (r103, r159): chapter 2 of episode 1.3 zooms the camera through a lit window of
// Alice's keep, and a second scene, a room, shows the HMAC-SHA256 machine at work on the story's real
// bytes (aes.js, hmac.js). One zoom per chapter: the chapter's steps are BEATS of the same room, the
// machine grows a step at a time, and the camera only drifts inside the room between them.
// Copied from eve-lit-tout/js/inside.js (r158, the reference room); the zoom itself is lib/zoom.js.
//
// The engine (enter, beat, cut, leave, the free band, the doors) is lib/room.js (r424), as is its API;
// this file keeps only the rooms (ROOM.rooms) and the engine options this episode needs.
import * as THREE from 'three';
import { litTile, label, relabel, show, buildRoom } from '../../lib/room-parts.js';
import { t } from './i18n.js';
import * as A from '../../lib/saga-aes.js';
import { hmac, hmacInner } from '../../lib/hmac.js';

const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const clamp01 = k => Math.max(0, Math.min(1, k));
const span = (time, a, b) => ease(clamp01((time - a) / (b - a)));
const hx = x => x.toString(16).padStart(2, '0');

// ---------- what a room is made of: lib/room-parts.js (r485); here, the colours ----------
// the colours of the corner card: the order cream, padding gold, key violet, IV blue, ciphertext yellow
const INK = { p: { fg: '#fff3dc', bg: '#3a2b1a', size: 80 }, pad: { fg: '#ffd27a', bg: '#5a3c10', size: 62 },
  key: { fg: '#e3b8ff', bg: '#2a1838', size: 62 }, iv: { fg: '#9fd3f0', bg: '#12283a', size: 62 },
  x: { fg: '#ffb070', bg: '#3a1e0c', size: 62 }, c: { fg: '#ffd84d', bg: '#2a2008', size: 62 },
  seal: { fg: '#8fd18a', bg: '#12301a', size: 62 }, bad: { fg: '#ffd0d4', bg: '#6a1420', size: 62 } };   // 1.3: the seal green, what changed red
const byteTile = (b, ink) => litTile(ink === INK.p ? (b === 32 ? '␣' : String.fromCharCode(b)) : hx(b), ink);

// ---------- the HMAC room of episode 1.3: three beats, key → hmac → avalanche ----------
// The machine: the message (IV ‖ ciphertext, 48 bytes: the blocks IV, C1, C2, each a row of the
// card) goes in on one side, the HMAC key turns in the lock, two passes of SHA-256 run on the box's
// front, and the 32-byte seal comes out on the other side, two blocks of 16 (the card's two rows).
// Landscape: the message a column at the left, the seal at the right, the lock on top. Portrait (a
// phone): the message a row on top, the seal below, the lock on the left side. On 'avalanche' the
// room plays Bob's check: byte 11 of the IV changed by Eve, the same machine, his seal under Alice's,
// the bytes that differ in red.
function hmacRoom(scene, pk, portrait) {
  buildRoom(scene, portrait, { tall: true });
  const s = pk.s, Y0 = portrait ? 17.5 : 7.8;
  const msg = A.concat([s.iv, ...s.C]), msgB = A.concat([pk.iv.iv, ...pk.iv.C]), nb = 1 + s.C.length;
  const tagB = hmac(s.macKey, msgB), inner = hmacInner(s.macKey, msg), innerB = hmacInner(s.macKey, msgB);
  const diff = [...tagB].map((x, i) => x !== s.tag[i]), d = diff.filter(Boolean).length;
  // where the blocks sit; a block's 16 tiles read left to right, top to bottom, like the card's rows
  const cell = (c, j) => v(c.x + (j % 4 - 1.5) * 1.12, c.y - (Math.floor(j / 4) - 1.5) * 1.12);
  const MB = [...Array(nb).keys()].map(k => portrait ? v((k - (nb - 1) / 2) * 5.1, Y0 + 7.4) : v(-11, Y0 + ((nb - 1) / 2 - k) * 5.1));
  const pair = (x, y) => [v(x - 2.55, y), v(x + 2.55, y)];
  const SA = portrait ? pair(0, Y0 - 8) : pair(10.95, Y0), SAup = portrait ? SA : pair(10.95, Y0 + 2.9),
    SB = portrait ? pair(0, Y0 - 13.8) : pair(10.95, Y0 - 2.9);
  const at = blocks => i => cell(blocks[Math.floor(i / 16)], i % 16);
  const mAt = at(MB), aAt = at(SA), aUpAt = at(SAup), bAt = at(SB);
  const inMouth = portrait ? v(0, Y0 + 2.7) : v(-3.5, Y0), outMouth = portrait ? v(0, Y0 - 2.7) : v(3.5, Y0);
  const disc = [v(-1.6, Y0 - .4, 2.25), v(1.6, Y0 - .4, 2.25)];

  // the two keys: the AES key (dim, it does not seal) and the HMAC key, drawn byte by byte on a rack
  const cols = portrait ? 8 : 16, rackC = portrait ? v(0, Y0 + 8) : v(6.5, Y0 + 8.2);
  const rackAt = i => v(rackC.x + (i % cols - (cols - 1) / 2) * .8, rackC.y - (Math.floor(i / cols) - (32 / cols - 1) / 2) * .8, 0);
  const R = [...s.macKey].map(b => byteTile(b, INK.key)); R.forEach(m => scene.add(m));
  const makeKey = mat => {
    const obj = new THREE.Group(), turn = new THREE.Group(); obj.add(turn);
    const bow = new THREE.Mesh(new THREE.TorusGeometry(.75, .2, 10, 24), mat); bow.position.y = 2.1; turn.add(bow);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 2.6, 8), mat); shaft.position.y = .25; turn.add(shaft);
    for (const [y, w] of [[-.5, .55], [-.85, .4]]) { const tooth = new THREE.Mesh(new THREE.BoxGeometry(w, .2, .2), mat); tooth.position.set(w / 2, y, 0); turn.add(tooth); }
    obj.rotation.z = portrait ? Math.PI / 2 : 0; scene.add(obj); return { obj, turn };
  };
  const violet = new THREE.MeshStandardMaterial({ color: 0xb77ff0, emissive: 0xb77ff0, emissiveIntensity: .6, metalness: .5, roughness: .3 });
  const dim = new THREE.MeshStandardMaterial({ color: 0x6a5a78, emissive: 0x6a5a78, emissiveIntensity: .25, metalness: .5, roughness: .5, transparent: true });
  const key = makeKey(violet), aesKey = makeKey(dim);
  const keyHome = portrait ? v(-2.2, Y0 + 11.8) : v(-2.2, Y0 + 7.2), aesHome = portrait ? v(3.6, Y0 + 11.8) : v(-5.8, Y0 + 7.2);
  aesKey.obj.position.copy(aesHome);
  const lockOut = portrait ? v(-3.5 - 2.8, Y0) : v(0, Y0 + 2.7 + 2.8), lockIn = portrait ? v(-3.5 - 1.25, Y0) : v(0, Y0 + 2.7 + 1.25);
  const keyUp = portrait ? v(0, 1.25) : v(0, 3.7);
  const keyLbl = label(t('in.macKey'), '#e3b8ff', .8), aesLbl = label(t('in.aesKey'), '#a99bb8', .7); scene.add(keyLbl, aesLbl);
  aesLbl.position.copy(aesHome).add(portrait ? keyUp : v(0, 2.95));

  // the box: HMAC-SHA256 with its lock and two SHA-256 passes on its front
  const riser = new THREE.Group(); riser.position.set(0, Y0, 0); scene.add(riser);
  const metal = new THREE.MeshStandardMaterial({ color: 0x24202a, roughness: .45, metalness: .6 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(7, 5.4, 4.4), metal); box.castShadow = box.receiveShadow = true; riser.add(box);
  const gold = new THREE.LineBasicMaterial({ color: 0xffc24d });
  riser.add(new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), gold));
  const lock = new THREE.Mesh(new THREE.CylinderGeometry(.5, .6, .3, 16), new THREE.MeshStandardMaterial({ color: 0x0a0a10, metalness: .8 }));
  if (portrait) { lock.rotation.z = Math.PI / 2; lock.position.x = -3.65; } else lock.position.y = 2.85;
  riser.add(lock);
  const discs = disc.map(p => {
    const g = new THREE.Group(); g.position.set(p.x, p.y - Y0, p.z); riser.add(g);
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.05, 40), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffc24d, emissiveIntensity: .05 }));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.1, .09, 8, 40), new THREE.MeshStandardMaterial({ color: 0xffc24d, emissive: 0xb77ff0, emissiveIntensity: 0, metalness: .6, roughness: .3 }));
    const spokes = new THREE.Group();
    for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.7, .08, .04), new THREE.MeshBasicMaterial({ color: 0x5a4320 })); b.rotation.z = k * Math.PI / 4; spokes.add(b); }
    spokes.position.z = .03; g.add(face, rim, spokes);
    return { g, face, rim, spokes };
  });
  const name = label('HMAC-SHA256', '#ffd27a', 1.05); name.position.set(0, Y0 + 1.55, 2.4); scene.add(name);
  const shaLbl = disc.map(p => { const l = label('SHA-256', '#ffd27a', .5); l.position.set(p.x, p.y - 1.5, 2.4); scene.add(l); return l; });
  const pass = label(t('in.pass1'), '#ffd27a', .75); pass.position.set(0, Y0 - 2.7 - .75, 2.6); scene.add(pass);

  // the tiles: the message (IV blue, ciphertext yellow), its copy that goes in, Alice's seal; on
  // 'avalanche', the changed message's copy and Bob's seal; the inner hash between the two passes
  const mk = (bytes, ink) => { const l = [...bytes].map((b, i) => byteTile(b, typeof ink === 'function' ? ink(i) : ink)); l.forEach(m => scene.add(m)); return l; };
  const msgInk = i => i < 16 ? INK.iv : INK.c;
  const T = { M: mk(msg, msgInk), Mc: mk(msg, msgInk), MB: mk(msgB, i => i === A.HOUR ? INK.bad : msgInk(i)),
    S: mk(s.tag, INK.seal), SB: mk(tagB, INK.seal), SBd: mk(tagB, INK.bad), I: mk(inner, INK.seal), IB: mk(innerB, INK.seal) };
  const flipped = byteTile(pk.iv.iv[A.HOUR], INK.bad); scene.add(flipped);
  // the words: the message's name, each block's, the seals'; Eve's byte; how many bytes differ
  const L = { M: label(t('in.msg', { n: msg.length }), '#9fd3f0', .85), S: label(t('in.sealA'), '#8fd18a', .85), SB: label(t('in.sealB'), '#8fd18a', .85),
    flip: label(t('in.flip', { n: A.HOUR + 1 }), '#ff8f9a', .85), diff: label(t('card.diff', { d }), '#ff8f9a', .85) };
  for (const l of Object.values(L)) scene.add(l);
  const blkL = MB.map((c, k) => { const l = label(k ? 'C' + k : 'IV', k ? '#ffd84d' : '#9fd3f0', .85); l.position.copy(portrait ? v(c.x, c.y + 2.75) : v(c.x - 3.15, c.y)); scene.add(l); return l; });
  const mid = list => v((list[0].x + list[list.length - 1].x) / 2, (list[0].y + list[list.length - 1].y) / 2);
  const capM = portrait ? v(0, MB[0].y + 3.75) : v(MB[0].x, MB[0].y + 2.9);
  const capS = up => v(mid(SA).x, (up ? SAup : SA)[0].y + 2.9), capB = portrait ? v(0, SB[0].y + 2.9) : v(mid(SB).x, SB[0].y - 2.9);
  L.M.position.copy(capM); L.flip.position.copy(capM); L.SB.position.copy(capB);
  L.diff.position.copy(portrait ? v(0, SB[0].y - 2.95) : v(capB.x, capB.y - 1.05));

  const hide = list => list.forEach(m => { m.visible = false; });
  const sit = (list, pos) => list.forEach((m, i) => { m.position.copy(pos(i)); m.scale.setScalar(1); m.rotation.x = 0; m.visible = true; });
  // a block of tiles pops up where it sits, tile after tile, from time a
  const pop = (list, pos, time, a, gap = .015) => list.forEach((m, i) => {
    const k = span(time, a + i * gap, a + i * gap + .45); m.position.copy(pos(i)); m.scale.setScalar(k); m.rotation.x = 0; m.visible = k > .02;
  });
  // tiles stream into a point, block after block, shrinking; and out of one, growing
  const into = (list, pos, p, time, a, b) => list.forEach((m, i) => {
    const dl = (i % 16) * .03 + Math.floor(i / 16) * .2, k = span(time, a + dl, b - .9 + dl);
    m.position.lerpVectors(pos(i), p, k); m.scale.setScalar(1 - .7 * k); m.rotation.x = 0; m.visible = k < .999;
  });
  const outOf = (list, p, pos, time, a, b) => list.forEach((m, i) => {
    const dl = (i % 16) * .03 + Math.floor(i / 16) * .2, k = span(time, a + dl, b - .7 + dl);
    m.position.lerpVectors(p, pos(i), k); m.scale.setScalar(.3 + .7 * k); m.rotation.x = (1 - k) * Math.PI; m.visible = k > .001;
  });
  // the two passes: a disc lights and turns while its pass runs; the key's violet in both rims
  const passes = (time, a, b, c, keyIn) => {
    const on1 = time > a && time < b, on2 = time > b + .5 && time < c;
    discs.forEach((q, n) => {
      const on = n ? on2 : on1, done = n ? time >= c : time >= b;
      q.face.material.emissiveIntensity = on ? 1.1 + Math.sin(time * 18) * .25 : done ? .45 : .05;
      q.spokes.rotation.z = on ? -time * 9 : 0; q.rim.material.emissiveIntensity = keyIn ? 1.2 : 0;
    });
    riser.position.x = on1 || on2 ? Math.sin(time * 60) * .025 : 0; gold.color.setHex(on1 || on2 ? 0xffe9a8 : 0xffc24d);
    relabel(pass, t(time > b + .25 ? 'in.pass2' : 'in.pass1'), '#ffd27a');
  };
  // the inner hash, 32 small tiles, hops from the first disc to the second
  const hop = (list, time, a, b) => list.forEach((m, i) => {
    const k = span(time, a + i * .008, b - .25 + i * .008), p = new THREE.Vector3().lerpVectors(disc[0], disc[1], k);
    m.position.set(p.x, p.y + Math.sin(Math.PI * k) * 1.1 + ((i % 4) - 1.5) * .12, p.z + .3); m.scale.setScalar(.22); m.rotation.x = 0; m.visible = k > .001 && k < .999;
  });
  const B = { key: 0, hmac: 1, avalanche: 2 };

  function pose(beat, time) {
    const b = B[beat];
    for (const list of Object.values(T)) hide(list);
    flipped.visible = false;
    for (const l of [...Object.values(L), ...blkL]) show(l, 0);
    // the HMAC key: drawn byte by byte on its rack, the key forms; then the bytes stream into it
    R.forEach((m, i) => {
      if (b === 0) { const k = span(time, .3 + i * .05, .8 + i * .05); m.position.copy(rackAt(i)); m.scale.setScalar(.7 * k); m.rotation.x = (1 - k) * Math.PI * 3; m.visible = k > .02; }
      else if (b === 1) { const k = span(time, .2 + i * .02, 1.0 + i * .02); m.position.lerpVectors(rackAt(i), keyHome, k); m.scale.setScalar(.7 * (1 - k)); m.rotation.x = 0; m.visible = k < .98; }
      else m.visible = false;
    });
    const kf = b === 0 ? span(time, 2.0, 2.6) : 1;
    key.obj.scale.setScalar(kf); key.obj.visible = kf > .01;
    const kMove = b === 0 ? 0 : b === 1 ? span(time, 2.0, 2.7) : 1, kIn = b === 0 ? 0 : b === 1 ? span(time, 2.7, 3.2) : 1, kTurn = b === 1 ? span(time, 3.2, 3.6) : b > 1 ? 1 : 0;
    key.obj.position.lerpVectors(keyHome, lockOut, kMove).lerp(lockIn, kIn);
    key.turn.rotation.y = (b === 0 ? (1 - kf) * Math.PI : 0) + kTurn * Math.PI / 2;
    violet.emissiveIntensity = b === 1 && time > .2 && time < 1.8 ? 1.4 : .6;
    keyLbl.position.copy(key.obj.position).add(keyUp); show(keyLbl, b === 0 ? kf : b === 1 ? 1 - kMove : 0);
    // the AES key is there from the start, and steps back when the sealing starts: it does not seal
    const ak = b === 0 ? span(time, 0, .5) : b === 1 ? 1 - span(time, 0, .8) : 0;
    aesKey.obj.scale.setScalar(.75 * Math.max(.001, ak)); aesKey.obj.visible = ak > .01; dim.opacity = ak; show(aesLbl, ak);

    const rise = b === 0 ? 0 : b === 1 ? span(time, 0, .9) : 1;
    riser.visible = rise > .01; riser.scale.setScalar(Math.max(.001, rise)); show(name, rise); show(shaLbl[0], rise); show(shaLbl[1], rise);
    show(pass, b === 1 ? span(time, 5.0, 5.4) : b === 2 ? 1 : 0);

    if (b === 0) { passes(time, 99, 99, 99, false); return; }
    if (b === 1) {
      // the message pops up, a copy streams in, two passes, the seal comes out
      pop(T.M, mAt, time, .3); show(L.M, span(time, .3, .9)); blkL.forEach(l => show(l, span(time, .3, .9)));
      if (time > 3.8) into(T.Mc, mAt, inMouth, time, 3.8, 5.6);
      passes(time, 5.4, 6.6, 8.1, time > 3.4);
      hop(T.I, time, 6.6, 7.4);
      outOf(T.S, outMouth, aAt, time, 8.1, 9.6); L.S.position.copy(capS(false)); show(L.S, span(time, 8.1, 9.0));
      return;
    }
    // avalanche: Alice's seal moves up (landscape); byte 11 of the IV flips red; the changed message
    // goes in; the same two passes; Bob's seal comes out under Alice's; the bytes that differ turn red
    const up = span(time, 0, .7);
    sit(T.S, i => new THREE.Vector3().lerpVectors(aAt(i), aUpAt(i), up)); L.S.position.lerpVectors(capS(false), capS(true), up); show(L.S, 1);
    sit(T.M, mAt); blkL.forEach(l => show(l, 1));
    const fk = span(time, .8, 1.8);
    T.M[A.HOUR].visible = fk < .5; flipped.visible = fk >= .5;
    for (const m of [T.M[A.HOUR], flipped]) { m.position.copy(mAt(A.HOUR)).add(v(0, 0, .6 * Math.sin(Math.PI * fk))); m.rotation.x = fk * Math.PI * 2; m.scale.setScalar(1 + .3 * Math.sin(Math.PI * fk)); }
    show(L.M, 1 - span(time, .8, 1.2)); show(L.flip, span(time, 1.2, 1.8));
    if (time > 2.0) into(T.MB, mAt, inMouth, time, 2.0, 3.8);
    passes(time, 3.6, 4.6, 5.9, true);
    hop(T.IB, time, 4.6, 5.4);
    // Bob's seal out; then, block by block, each byte that differs from Alice's turns red
    outOf(T.SB, outMouth, bAt, time, 5.9, 7.6); show(L.SB, span(time, 5.9, 6.8));
    T.SB.forEach((m, i) => {
      if (!diff[i] || time < 7.7 + (i % 16) * .04 + Math.floor(i / 16) * .5) return;
      const r = T.SBd[i]; r.position.copy(m.position); r.scale.copy(m.scale); r.rotation.x = 0; r.visible = true; m.visible = false;
    });
    show(L.diff, span(time, 8.9, 9.4));
  }

  // what the camera holds: the two keys and the rack; the whole machine (a phone follows the action:
  // the key into the lock, the message in, the seal out); the message, the box and both seals
  const half = 2.3, around = (cs, up = 0, down = 0) => cs.flatMap(c => [v(c.x - half, c.y - half - down), v(c.x + half, c.y + half + up)]);
  const boxF = [v(-3.5, Y0 - 2.7 - 1.3), v(3.5, Y0 + 2.7)];
  const msgF = portrait ? around(MB, 4.3) : [...around(MB, 1.1), v(MB[0].x - 4.2, Y0)];
  const keysF = [rackAt(0), rackAt(31), keyHome, aesHome, v(keyHome.x, keyHome.y + keyUp.y + .6), v(aesHome.x, aesHome.y + keyUp.y + .6),
    portrait ? v(keyHome.x - 2.4, keyHome.y) : v(aesHome.x - 3.2, aesHome.y - 1.2), portrait ? v(aesHome.x + 3.2, aesHome.y) : v(rackC.x + 6.6, rackC.y)];
  const lockF = portrait ? [lockOut.clone().add(v(-2.4, 0))] : [v(0, lockOut.y + 3)];
  const sealF = (up, withB) => [...around(up ? SAup : SA, 1.1), ...(withB ? [...around(SB, portrait ? 1.1 : 0, portrait ? 0 : 2.6), v(L.diff.position.x, L.diff.position.y - .7)] : [])];
  const frames = {
    key: () => keysF,
    hmac: time => !portrait ? [...msgF, ...boxF, ...sealF(false), ...lockF, ...(time < 3.2 ? [keyHome, v(keyHome.x, keyHome.y + 3.6)] : [])]
      : time < 2.0 ? keysF : time < 3.6 ? [keyHome, v(keyHome.x, keyHome.y + 1.8), ...boxF, ...lockF] : time < 5.6 ? [...msgF, ...boxF] : time < 9.0 ? [...boxF, ...sealF(false)] : [v(-3.5, Y0 + 2.2), v(3.5, Y0 + 2.2), ...sealF(false)],
    avalanche: time => !portrait ? [...msgF, ...boxF, ...lockF, ...sealF(true, true)]
      : time < 2.0 ? msgF : time < 5.9 ? [...msgF, ...boxF] : sealF(false, true),
  };
  return { beats: { key: { end: 3.0 }, hmac: { end: 9.6 }, avalanche: { end: 9.6 } }, pose, frame: (k, time) => frames[k](time) };
}
// the room, entered by Alice's keep's valley window; the engine's options (lib/room.js), said: the top of the band grows to the bubble shown
export const ROOM = { rooms: { hmac: { build: hmacRoom, door: 'a' } }, said: true };
