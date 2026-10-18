// The objects of the story, built from primitives: the Enigma machine (case, keyboard, lamps,
// and its drum of rotors), and the characters. One unit is 10 cm: the machine is 34 cm wide,
// a rotor 10 cm across, as on the real one.
//
// The drum: from right to left, the entry plate (fixed, its rim lettered A to Z: the letters of
// the slide's table are these, the fixed frame), rotors III, II, I, and the reflector B. Each
// rotor has 26 contacts on each face and a wire inside from each contact on the right to one on
// the left; it turns, its letters and its wires with it. Inside a component, a point at angle
// phi and radius rho is (x, rho cos phi, rho sin phi): phi = 0 on top (the window), growing
// toward the front. Contact i of the fixed frame sits at phi = i * STEP.
import * as THREE from 'three';
import { A, ROTORS, REFLECTOR, KEYBOARD } from './enigma.js';

export const COLORS = { a: 0x4da3ff, b: 0xffc24d, e: 0xff3347 };
export const STEP = Math.PI * 2 / 26;
export const R = .5, RC = .36;              // rotor radius, radius of its contacts
export const THICK = { rotor: .26, ref: .22, entry: .14 };

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, flatShading: true, ...o });
const dark = mat(0x15110c, { roughness: 1 });
export const at = (x, rho, phi) => new THREE.Vector3(x, rho * Math.cos(phi), rho * Math.sin(phi));
const short = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

// ---------- letters drawn on canvases, one texture per letter and style ----------
const texCache = {};
export function letterTex(ch, style = 'rim') {
  const key = style + ch;
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  if (style === 'key') {
    x.fillStyle = '#16140f'; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.fill();
    x.lineWidth = 8; x.strokeStyle = '#c9c2b0'; x.stroke();
    x.fillStyle = '#f4eedf';
  } else if (style === 'lamp') x.fillStyle = '#1b1407';
  else x.fillStyle = '#f6efdc';
  x.font = `700 ${style === 'rim' ? 92 : 78}px "Courier New", Courier, monospace`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(ch, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return texCache[key] = t;
}

// 26 letters around a rim, upright when read from the front and from above.
function rimLetters(radius, size, color = 0xf6efdc) {
  const g = new THREE.Group(), geo = new THREE.PlaneGeometry(size, size);
  g.userData.letters = [];
  for (let j = 0; j < 26; j++) {
    const m = new THREE.MeshBasicMaterial({ map: letterTex(A[j]), transparent: true, color, depthWrite: false, toneMapped: false });
    const p = new THREE.Mesh(geo, m), phi = j * STEP;
    p.position.copy(at(0, radius, phi)); p.rotation.x = phi - Math.PI / 2;
    g.add(p); g.userData.letters.push(p);
  }
  return g;
}

// contacts on a face: small brass studs at the 26 angles
const brass = mat(0xd2a24c, { metalness: .8, roughness: .3, flatShading: false });
function studs(x, size = .028) {
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(size, 8, 6), brass, 26), M4 = new THREE.Matrix4();
  for (let j = 0; j < 26; j++) m.setMatrixAt(j, M4.makeTranslation(at(x, RC, j * STEP)));
  return m;
}

// A wire inside a rotor, in its own frame: from contact j on the right face to contact k on the
// left one, dipping toward the axle in between, so the 26 of them read as a tangle.
export function wirePoints(j, k, half, n = 18) {
  const a = j * STEP, d = short(a, k * STEP), pts = [];
  for (let s = 0; s <= n; s++) { const u = s / n; pts.push(at(half - 2 * half * u, RC - .16 * Math.sin(Math.PI * u), a + d * u)); }
  return pts;
}
// In the reflector: from contact j on its right face, into the disc and back out at contact k.
export function loopPoints(j, k, half, n = 22) {
  const a = j * STEP, d = short(a, k * STEP), pts = [];
  for (let s = 0; s <= n; s++) { const u = s / n; pts.push(at(half - 1.6 * half * Math.sin(Math.PI * u), RC - .2 * Math.sin(Math.PI * u), a + d * u)); }
  return pts;
}
const lineOf = (pts, m) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m);

// A disc along x: glass when the drum is apart, dark bakelite when it is packed (setGlass).
function disc(thick, color) {
  const m = new THREE.MeshPhysicalMaterial({ color, roughness: .25, metalness: .1, transparent: true, opacity: .95, side: THREE.DoubleSide, clearcoat: .6 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, thick, 52, 1), m); body.rotation.z = Math.PI / 2;
  body.renderOrder = 2;
  return body;
}

// A rotor: name 'I' | 'II' | 'III'. userData.spin holds what turns (letters, contacts, wires);
// setPos(p) turns it so letter p is on top; userData.wires[j] is the line from contact j.
export function rotor(name) {
  const g = new THREE.Group(), spin = new THREE.Group(), h = THICK.rotor / 2; g.add(spin);
  const body = disc(THICK.rotor, 0x2a2420); spin.add(body);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.005, R * 1.005, THICK.rotor * .7, 52, 1, true), new THREE.MeshStandardMaterial({ color: 0x3b3329, roughness: .5, transparent: true, opacity: .9, side: THREE.DoubleSide }));
  band.rotation.z = Math.PI / 2; spin.add(band);
  const letters = rimLetters(R * 1.03, .13); spin.add(letters);
  // the serrated thumbwheel on the left, the one the operator turns through the lid
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.12, R * 1.12, .05, 26, 1), mat(0x6d6658, { metalness: .6, roughness: .4, transparent: true }));
  wheel.rotation.z = Math.PI / 2; wheel.position.x = -h - .03; spin.add(wheel);
  spin.add(studs(h), studs(-h, .022));
  const wires = [], wm = new THREE.LineBasicMaterial({ color: 0xb08a50, transparent: true, opacity: .35, depthWrite: false });
  const W = ROTORS[name].wiring;
  for (let j = 0; j < 26; j++) { const l = lineOf(wirePoints(j, A.indexOf(W[j]), h), wm); spin.add(l); wires.push(l); }
  Object.assign(g.userData, { name, spin, body, band, wheel, letters, wires, wireMat: wm, half: h, kind: 'rotor' });
  g.userData.setPos = p => { g.userData.pos = p; spin.rotation.x = -p * STEP; };
  g.userData.setPos(0);
  return g;
}

export function reflector() {
  const g = new THREE.Group(), h = THICK.ref / 2;
  const body = disc(THICK.ref, 0x3a2c22); g.add(body);
  g.add(studs(h));
  const wires = [], wm = new THREE.LineBasicMaterial({ color: 0xb08a50, transparent: true, opacity: .35, depthWrite: false });
  for (let j = 0; j < 26; j++) {
    const k = A.indexOf(REFLECTOR[j]);
    if (j < k) { const l = lineOf(loopPoints(j, k, h), wm); g.add(l); wires[j] = wires[k] = l; }
  }
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(.16, .16), new THREE.MeshBasicMaterial({ map: letterTex('B'), transparent: true, depthWrite: false }));
  tag.position.set(-h - .005, 0, 0); tag.rotation.y = -Math.PI / 2; g.add(tag);
  Object.assign(g.userData, { body, wires, wireMat: wm, half: h, kind: 'ref' });
  return g;
}

// The entry plate: fixed, its rim lettered A to Z. The current comes in from the key at the
// contact of the key's letter, and goes back out to the lamp at the contact of the lamp's.
export function entry() {
  const g = new THREE.Group(), h = THICK.entry / 2;
  const body = disc(THICK.entry, 0x4a4036); g.add(body);
  const letters = rimLetters(R * 1.03, .1, 0xffd88a); g.add(letters);
  g.add(studs(-h, .022));
  Object.assign(g.userData, { body, letters, wires: [], half: h, kind: 'entry' });
  return g;
}

// ---------- the machine ----------
// Machine frame: origin at the bottom centre of the case, +z toward the operator. The keyboard
// at the front, the lamps behind it, the drum at the back; on the front face, the plugboard,
// left empty (no cable: the slide's calculation has none).
export const KEY_ROWS = [1.06, .79, .52], LAMP_ROWS = [.14, -.13, -.4], TOP = 1;
export const rowX = (row, i) => (i - (KEYBOARD[row].length - 1) / 2) * .34;
// where each component of the drum sits, packed in its well or taken out above the machine
export const DRUM = ['ref', 'I', 'II', 'III', 'entry'];
export const PACKED = { ref: -.66, I: -.34, II: -.04, III: .26, entry: .58 };
export const APART = { ref: -4.8, I: -2.4, II: 0, III: 2.4, entry: 4.6 };
export const PACKED_C = new THREE.Vector3(0, .9, -.95), APART_C = new THREE.Vector3(0, 4.4, -.3), APART_S = 3;

export function machine() {
  const g = new THREE.Group(), wood = mat(0x6b4426, { roughness: .8 }), black = mat(0x1c1b1a, { roughness: .55, metalness: .35 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(3.5, TOP - .02, 3), wood); box.position.y = (TOP - .02) / 2; g.add(box);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(3.3, .04, 2.8), black); plate.position.y = TOP; g.add(plate);
  // the lid, open, standing behind
  const lid = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.5, .1), wood); lid.position.set(0, TOP + .7, -1.62); lid.rotation.x = -.12; g.add(lid);
  // the well the rotors sit in, and their three little windows' frame
  const well = new THREE.Mesh(new THREE.BoxGeometry(1.6, .06, .9), mat(0x2c2a27, { metalness: .5 })); well.position.set(0, TOP + .01, PACKED_C.z); g.add(well);
  // plugboard: 26 empty sockets on the front face
  const sock = new THREE.InstancedMesh(new THREE.CylinderGeometry(.045, .045, .04, 10), dark, 26), M4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  for (let i = 0; i < 26; i++) sock.setMatrixAt(i, M4.compose(new THREE.Vector3((i % 13 - 6) * .24, .32 + Math.floor(i / 13) * .3, 1.51), q, new THREE.Vector3(1, 1, 1)));
  g.add(sock);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(3.3, .72, .02), black); panel.position.set(0, .45, 1.505); g.add(panel);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // keys and lamps, by letter
  const keys = {}, lamps = {};
  const capM = mat(0x2a2722, { metalness: .5, roughness: .35, flatShading: false }), stemM = mat(0x8a8478, { metalness: .7 });
  KEYBOARD.forEach((row, r) => [...row].forEach((ch, i) => {
    const k = new THREE.Group(); k.position.set(rowX(r, i), TOP, KEY_ROWS[r]);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .14, 6), stemM); stem.position.y = .07; k.add(stem);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .05, 20), capM); cap.position.y = .16; cap.castShadow = true; k.add(cap);
    const face = new THREE.Mesh(new THREE.CircleGeometry(.12, 20), new THREE.MeshBasicMaterial({ map: letterTex(ch, 'key') }));
    face.rotation.x = -Math.PI / 2; face.position.y = .186; k.add(face);
    k.userData.top = new THREE.Vector3(0, .19, 0);
    g.add(k); keys[ch] = k;
    const lamp = new THREE.Group(); lamp.position.set(rowX(r, i), TOP + .02, LAMP_ROWS[r]);
    const glow = new THREE.MeshStandardMaterial({ color: 0x3a3426, emissive: 0xffc04a, emissiveIntensity: 0, roughness: .3 });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .03, 20), glow); lamp.add(glass);
    const face2 = new THREE.Mesh(new THREE.CircleGeometry(.1, 20), new THREE.MeshBasicMaterial({ map: letterTex(ch, 'lamp'), transparent: true, color: 0x8a8070 }));
    face2.rotation.x = -Math.PI / 2; face2.position.y = .017; lamp.add(face2);
    lamp.userData = { glow, face: face2 };
    g.add(lamp); lamps[ch] = lamp;
  }));

  // the drum
  const drum = { ref: reflector(), I: rotor('I'), II: rotor('II'), III: rotor('III'), entry: entry() };
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1, 8), mat(0xb9b2a3, { metalness: .8, roughness: .3 }));
  axle.rotation.z = Math.PI / 2; g.add(axle);
  for (const c of Object.values(drum)) g.add(c);
  Object.assign(g.userData, { keys, lamps, drum, axle });
  // e = 0: packed in the well; 1: taken out above the machine, spread and three times bigger
  g.userData.setApart = e => {
    g.userData.apart = e;
    const s = 1 + (APART_S - 1) * e, c = PACKED_C.clone().lerp(APART_C, e);
    for (const id of DRUM) {
      const o = drum[id]; o.position.copy(c).setX(PACKED[id] + (APART[id] - PACKED[id]) * e); o.scale.setScalar(s);
      const b = o.userData.body.material; b.opacity = .95 - .8 * e; b.depthWrite = e < .5;
      if (o.userData.band) o.userData.band.material.opacity = .9 - .75 * e;
      if (o.userData.wheel) { o.userData.wheel.material.opacity = 1 - .8 * e; o.userData.wheel.material.depthWrite = e < .5; }
      if (o.userData.wireMat) o.userData.wireMat.opacity = .15 + .3 * e;
    }
    const x0 = PACKED.ref + (APART.ref - PACKED.ref) * e, x1 = PACKED.entry + (APART.entry - PACKED.entry) * e;
    axle.position.copy(c).setX((x0 + x1) / 2); axle.scale.set(.6 + e, (x1 - x0) * 1.05, .6 + e);
  };
  g.userData.setApart(0);
  return g;
}

// A desk on four legs, its top at TOP_DESK.
export const DESK_TOP = 7.5;
export function desk(w = 14, d = 7) {
  const g = new THREE.Group(), wood = mat(0x5a3a22, { roughness: .85 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, .4, d), wood); top.position.y = DESK_TOP - .2; top.castShadow = top.receiveShadow = true; g.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.5, DESK_TOP - .4, .5), wood);
    leg.position.set(sx * (w / 2 - .5), (DESK_TOP - .4) / 2, sz * (d / 2 - .5)); leg.castShadow = true; g.add(leg);
  }
  return g;
}

// A character, facing +z, 17 units tall (1.7 m). kind: 'a' Alice, 'b' Bob, 'e' Eve.
export function person(kind) {
  const outer = new THREE.Group(), g = new THREE.Group(); outer.add(g); g.scale.setScalar(5.3);
  const c = COLORS[kind];
  const cloth = mat({ a: 0x2a5ea8, b: 0x6b4a2b, e: 0x7a1424 }[kind]), skin = mat(0xf0c8a0);
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(.45, .85, 2.1, 10), cloth); robe.position.y = 1.05; robe.castShadow = true; g.add(robe);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.42, 16, 12), skin); head.position.y = 2.55; head.castShadow = true; g.add(head);
  for (const x of [-.14, .14]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), dark); eye.position.set(x, 2.6, .38); g.add(eye); }
  const arms = new THREE.Group(); arms.position.y = 1.8; g.add(arms);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .8, 4, 8), cloth);
    arm.position.set(s * .55, -.3, .15); arm.rotation.z = s * .35; arm.rotation.x = -.5; arms.add(arm);
  }
  if (kind === 'a') {          // Alice: blue scarf and a bun
    const hair = mat(0x6b3d1f);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.45, 16, 10, 0, Math.PI * 2, 0, Math.PI * .55), hair); cap.position.y = 2.6; cap.rotation.x = -.35; g.add(cap);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), hair); bun.position.set(0, 2.95, -.3); g.add(bun);
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(.4, .1, 8, 16), mat(c)); scarf.rotation.x = Math.PI / 2; scarf.position.y = 2.12; g.add(scarf);
  } else if (kind === 'b') {   // Bob: flat cap, a leather apron
    const capM = mat(0x3d2c1c);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .16, 16), capM); cap.position.y = 2.88; g.add(cap);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(.5, .05, .35), capM); brim.position.set(0, 2.82, .4); g.add(brim);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(.62, .06, 6, 20), mat(c, { metalness: .5 })); belt.rotation.x = Math.PI / 2; belt.position.y = 1.55; g.add(belt);
  } else {                     // Eve: a deep red hood, and headphones over it
    const hood = new THREE.Mesh(new THREE.ConeGeometry(.62, 1.3, 12, 1, true), mat(0x9e1b2e, { side: THREE.DoubleSide })); hood.position.y = 2.85; g.add(hood);
    const mask = new THREE.Mesh(new THREE.TorusGeometry(.4, .06, 6, 16, Math.PI), dark); mask.position.set(0, 2.62, .05); g.add(mask);
    const band = new THREE.Mesh(new THREE.TorusGeometry(.5, .04, 6, 20, Math.PI), mat(0x222222, { metalness: .6 })); band.position.y = 2.6; band.rotation.y = Math.PI / 2; g.add(band);
    for (const s of [-1, 1]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .12, 14), mat(0x333333, { metalness: .5 })); cup.rotation.z = Math.PI / 2; cup.position.set(s * .5, 2.6, 0); g.add(cup); }
  }
  outer.userData.head = head; outer.userData.arms = arms;
  return outer;
}
