// The objects of the story, built from primitives: the Enigma machine (case, keyboard, lamps,
// plugboard and its cables, and its drum of rotors), the box of five rotors, and the characters.
// One unit is 10 cm: the machine is 34 cm wide, a rotor 10 cm across, as on the real one.
//
// The drum: from right to left, the entry plate (fixed, its rim lettered A to Z: the letters of
// the card's table are these, the fixed frame), the right, middle and left rotors (slots R, M, L,
// each holding one of the five, I to V), and the reflector B. Each rotor has 26 contacts on each
// face and a wire inside from each contact on the right to one on the left. A rotor is two parts:
// the letter ring (letters, notch) and the wiring core (wires, contacts, a red dot at its contact
// A); the ring setting turns the core against the letters, and the whole rotor turns as it steps.
// Inside a component, a point at angle phi and radius rho is (x, rho cos phi, rho sin phi):
// phi = 0 on top (the window), growing toward the front. Contact i of the fixed frame sits at
// phi = i * STEP.
import * as THREE from 'three';
import { A, ROTORS, REFLECTOR, KEYBOARD, NAMES, pairs } from './enigma.js';

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
const plugGeo = new THREE.CylinderGeometry(.045, .045, .09, 10);
const lineOf = (pts, m) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m);

// A disc along x: glass when the drum is apart, dark bakelite when it is packed (setGlass).
function disc(thick, color) {
  const m = new THREE.MeshPhysicalMaterial({ color, roughness: .25, metalness: .1, transparent: true, opacity: .95, side: THREE.DoubleSide, clearcoat: .6 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, thick, 52, 1), m); body.rotation.z = Math.PI / 2;
  body.renderOrder = 2;
  return body;
}

// A rotor: name 'I' to 'V'. userData.spin holds what turns as it steps (the letter ring, its
// notch, and the core); userData.core the wiring (contacts, wires, the red dot), turned against the
// letters by the ring setting. setPos(p) turns it so letter p is in the window; setRing(r) puts
// the dot under letter r; setName(n) rewires it as rotor n.
export function rotor(name) {
  const g = new THREE.Group(), spin = new THREE.Group(), core = new THREE.Group(), h = THICK.rotor / 2; g.add(spin); spin.add(core);
  const body = disc(THICK.rotor, 0x2a2420); spin.add(body);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.005, R * 1.005, THICK.rotor * .7, 52, 1, true), new THREE.MeshStandardMaterial({ color: 0x3b3329, roughness: .5, transparent: true, opacity: .9, side: THREE.DoubleSide }));
  band.rotation.z = Math.PI / 2; spin.add(band);
  const letters = rimLetters(R * 1.03, .13); spin.add(letters);
  // the serrated thumbwheel on the left, the one the operator turns through the lid
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.12, R * 1.12, .05, 26, 1), mat(0x6d6658, { metalness: .6, roughness: .4, transparent: true }));
  wheel.rotation.z = Math.PI / 2; wheel.position.x = -h - .03; spin.add(wheel);
  // the notch: a green tooth on the left of the letter ring, at its notch letter
  const notch = new THREE.Mesh(new THREE.BoxGeometry(.07, .1, .07), new THREE.MeshStandardMaterial({ color: 0x5fe39a, emissive: 0x2fd07a, emissiveIntensity: .6 }));
  spin.add(notch);
  core.add(studs(h), studs(-h, .022));
  // the dot on the core, at its contact A, just inside the letters: the letter above it is the ring setting
  const dot = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff3347, toneMapped: false }));
  dot.position.copy(at(h + .02, R * .86, 0)); core.add(dot);
  const wm = new THREE.LineBasicMaterial({ color: 0xb08a50, transparent: true, opacity: .35, depthWrite: false });
  Object.assign(g.userData, { spin, core, body, band, wheel, letters, notch, dot, wires: [], wireMat: wm, half: h, kind: 'rotor', ring: 0 });
  g.userData.setName = n => {
    const u = g.userData; u.name = n;
    for (const l of u.wires) { core.remove(l); l.geometry.dispose(); }
    const W = ROTORS[n].wiring;
    u.wires = [...A].map((c, j) => { const l = lineOf(wirePoints(j, A.indexOf(W[j]), h), wm); core.add(l); return l; });
    const k = A.indexOf(ROTORS[n].notch);
    notch.position.copy(at(-h - .07, R * 1.08, k * STEP)); notch.rotation.x = k * STEP;
  };
  g.userData.setPos = p => { g.userData.pos = p; spin.rotation.x = -p * STEP; };
  g.userData.setRing = r => { g.userData.ring = r; core.rotation.x = r * STEP; };
  g.userData.setName(name); g.userData.setPos(0); g.userData.setRing(0);
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
// at the front, the lamps behind it, the drum at the back; on the front face, the plugboard: 26
// sockets lettered as the keyboard is laid out, and the cables of the day (setCables).
export const KEY_ROWS = [1.06, .79, .52], LAMP_ROWS = [.14, -.13, -.4], TOP = 1;
export const rowX = (row, i) => (i - (KEYBOARD[row].length - 1) / 2) * .34;
// where each component of the drum sits, packed in its well or taken out above the machine
export const SLOTS = ['L', 'M', 'R'];   // left, middle, right
export const DRUM = ['ref', 'L', 'M', 'R', 'entry'];
export const PACKED = { ref: -.66, L: -.34, M: -.04, R: .26, entry: .58 };
export const APART = { ref: -4.8, L: -2.4, M: 0, R: 2.4, entry: 4.6 };
// the plugboard's sockets, in the machine's frame: three rows on the front face, like the keys
export const SOCKET_Y = [.64, .43, .22], FRONT = 1.52;
export const socketAt = ch => { const r = KEYBOARD.findIndex(row => row.includes(ch)); return new THREE.Vector3(rowX(r, KEYBOARD[r].indexOf(ch)), SOCKET_Y[r], FRONT); };
// A cable between sockets a and b: out of the board, a sag below them, back in. Machine frame.
export function cablePoints(a, b, n = 28) {
  const p = socketAt(a), q = socketAt(b), out = .32 + .12 * Math.abs(p.x - q.x), drop = .12 + .05 * Math.abs(p.x - q.x);
  return new THREE.CubicBezierCurve3(p.clone().setZ(FRONT + .04), p.clone().add(new THREE.Vector3(0, -drop, out)),
    q.clone().add(new THREE.Vector3(0, -drop, out)), q.clone().setZ(FRONT + .04)).getPoints(n);
}
export const PACKED_C = new THREE.Vector3(0, .9, -.95), APART_C = new THREE.Vector3(0, 4.4, -.3), APART_S = 3;

export function machine() {
  const g = new THREE.Group(), wood = mat(0x6b4426, { roughness: .8 }), black = mat(0x1c1b1a, { roughness: .55, metalness: .35 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(3.5, TOP - .02, 3), wood); box.position.y = (TOP - .02) / 2; g.add(box);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(3.3, .04, 2.8), black); plate.position.y = TOP; g.add(plate);
  // the lid, open, standing behind
  const lid = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.5, .1), wood); lid.position.set(0, TOP + .7, -1.62); lid.rotation.x = -.12; g.add(lid);
  // the well the rotors sit in, and their three little windows' frame
  const well = new THREE.Mesh(new THREE.BoxGeometry(1.6, .06, .9), mat(0x2c2a27, { metalness: .5 })); well.position.set(0, TOP + .01, PACKED_C.z); g.add(well);
  // plugboard: 26 sockets on the front face, each with its letter above it
  const panel = new THREE.Mesh(new THREE.BoxGeometry(3.3, .72, .02), black); panel.position.set(0, .45, 1.505); g.add(panel);
  const sock = new THREE.InstancedMesh(new THREE.CylinderGeometry(.05, .05, .04, 12), dark, 26), M4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  const sockLetter = new THREE.PlaneGeometry(.085, .085);
  [...A].forEach((ch, i) => {
    const p = socketAt(ch); sock.setMatrixAt(i, M4.compose(p.clone().setZ(FRONT - .01), q, new THREE.Vector3(1, 1, 1)));
    const l = new THREE.Mesh(sockLetter, new THREE.MeshBasicMaterial({ map: letterTex(ch), transparent: true, depthWrite: false, color: 0xd9d0bb }));
    l.position.copy(p).add(new THREE.Vector3(0, .1, .005)); g.add(l);
  });
  g.add(sock);
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
  const drum = { ref: reflector(), L: rotor('I'), M: rotor('II'), R: rotor('III'), entry: entry() };
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1, 8), mat(0xb9b2a3, { metalness: .8, roughness: .3 }));
  axle.rotation.z = Math.PI / 2; g.add(axle);
  for (const c of Object.values(drum)) g.add(c);
  // the cables: a plug at each end, the lead sagging in front of the board
  const cables = new THREE.Group(); g.add(cables);
  const leadM = mat(0x6e1f1a, { roughness: .5, flatShading: false }), plugM = mat(0x1a1a1a, { metalness: .4, roughness: .4, flatShading: false });
  const setCables = plugs => {
    for (const o of [...cables.children]) { cables.remove(o); if (o.geometry !== plugGeo) o.geometry.dispose(); }
    for (const [a, b] of pairs(plugs)) {
      cables.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePoints(a, b)), 40, .022, 6, false), leadM));
      for (const c of [a, b]) { const h = new THREE.Mesh(plugGeo, plugM); h.rotation.x = Math.PI / 2; h.position.copy(socketAt(c)).setZ(FRONT + .05); cables.add(h); }
    }
    g.userData.plugs = plugs;
  };
  Object.assign(g.userData, { keys, lamps, drum, axle, cables, setCables });
  setCables('');
  // e = 0: packed in the well; 1: taken out above the machine, spread and three times bigger.
  // In two movements that overlap: the stack is lifted out whole and grows (e 0 → .55), then its
  // parts slide apart and turn see-through (e .3 → 1), the entry plate first, the reflector last,
  // the way the current goes. out[id]: how far part id has spread (0..1), for its tag.
  const smooth = (a, b, e) => { const x = Math.min(1, Math.max(0, (e - a) / (b - a))); return x * x * (3 - 2 * x); };
  const LAG = { entry: 0, R: .04, M: .08, L: .12, ref: .16 };
  const out = {};
  g.userData.setApart = e => {
    g.userData.apart = e;
    const lift = smooth(0, .55, e), s = 1 + (APART_S - 1) * lift, c = PACKED_C.clone().lerp(APART_C, lift);
    for (const id of DRUM) {
      const u = out[id] = smooth(.3 + LAG[id], .84 + LAG[id], e);
      const o = drum[id]; o.position.copy(c).setX(PACKED[id] * s + (APART[id] - PACKED[id] * s) * u); o.scale.setScalar(s);
      const b = o.userData.body.material; b.opacity = .95 - .8 * u; b.depthWrite = u === 0;
      if (o.userData.band) o.userData.band.material.opacity = .9 - .75 * u;
      if (o.userData.wheel) { o.userData.wheel.material.opacity = 1 - .8 * u; o.userData.wheel.material.depthWrite = u === 0; }
      if (o.userData.wireMat) o.userData.wireMat.opacity = .15 + .3 * u;
    }
    const x0 = drum.ref.position.x, x1 = drum.entry.position.x;
    axle.position.copy(c).setX((x0 + x1) / 2); axle.scale.set(.6 + lift, (x1 - x0) * 1.05, .6 + lift);
  };
  g.userData.out = out;
  g.userData.setApart(0);
  return g;
}

// The box of the five rotors, I to V, shown spread out in a row above the machine (the drum's
// size, see-through like it). userData.rotors[name]; setShow(e) fades it in (e 0..1).
export function rack() {
  const g = new THREE.Group(), rotors = {};
  NAMES.forEach((n, i) => {
    const r = rotor(n); r.position.set((i - 2) * 3.2, 0, 0); r.scale.setScalar(APART_S); g.add(r); rotors[n] = r;
    const u = r.userData; u.body.material.opacity = .15; u.body.material.depthWrite = false; u.band.material.opacity = .15;
    u.wheel.material.opacity = .2; u.wheel.material.depthWrite = false; u.wireMat.opacity = .45;
  });
  g.userData.rotors = rotors;
  g.userData.setShow = e => { g.visible = e > 0; g.scale.setScalar(.6 + .4 * e); };
  g.userData.setShow(0);
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
  } else {                     // Eve: a spy's dark fedora with a red band, a black eye mask (r65: not a pointed hood), and headphones over it
    const felt = mat(0x2a2a30), hat = new THREE.Group(); hat.position.y = 2.86; hat.rotation.x = .12; g.add(hat);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(.74, .74, .05, 24), felt); brim.castShadow = true; hat.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(.31, .41, .36, 16), felt); crown.position.y = .19; crown.castShadow = true; hat.add(crown);
    const hatband = new THREE.Mesh(new THREE.CylinderGeometry(.415, .42, .1, 16), mat(0x9e1b2e)); hatband.position.y = .08; hat.add(hatband);
    const mask = new THREE.Mesh(new THREE.TorusGeometry(.42, .075, 6, 20, Math.PI), dark); mask.rotation.x = Math.PI / 2; mask.position.y = 2.6; g.add(mask);
    for (const x of [-.14, .14]) { const white = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), mat(0xfaf6ee)); white.position.set(x, 2.6, .45); g.add(white);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), dark); pupil.position.set(x, 2.6, .51); g.add(pupil); }
    const band = new THREE.Mesh(new THREE.TorusGeometry(.5, .04, 6, 20, Math.PI), mat(0x222222, { metalness: .6 })); band.position.y = 2.6; band.rotation.x = -Math.PI / 2 - .5; g.add(band);   // behind the neck, under the hat
    for (const s of [-1, 1]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .12, 14), mat(0x333333, { metalness: .5 })); cup.rotation.z = Math.PI / 2; cup.position.set(s * .5, 2.6, 0); g.add(cup); }
  }
  outer.userData.head = head; outer.userData.arms = arms;
  return outer;
}
