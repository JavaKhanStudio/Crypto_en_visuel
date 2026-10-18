// A sorting hall at night: a long conveyor from Alice (west) to Bob (east), Alice's AES press
// and XOR ring near her end, Bob's near his, Eve's bench at the middle, behind the belt; on the
// back wall, three screens for the penguin. Built from primitives in code: no model files to
// load. One unit is 10 cm.
import * as THREE from 'three';
import { belt, press, xorRing, screen, person, BELT_Y, CRATE } from './props.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
// Where things stand, along x. The crates ride at z = 0; the people stand behind the belt.
export const X = {
  alice: -114, bob: 114, eve: 0,
  xorA: -61, pressA: -50,            // Alice: the block goes through the ring, then the press
  pressB: 56, xorB: 67,              // Bob: through the press, then the ring
};
const S = CRATE + 2;                 // a crate and its gap
// slots: Alice's blocks waiting (P1 nearest the press), what comes out of her press (C1 furthest),
// the IV ahead of them; the same at Bob's, waiting for his press, then what he reads
export const SLOT = {
  inA: [0, 1, 2, 3].map(i => -70 - i * S),
  outA: [0, 1, 2, 3].map(i => -12 - i * S), ivA: -3,
  inB: [0, 1, 2, 3].map(i => 36 - i * S), ivB: 45,
  outB: [0, 1, 2, 3].map(i => 100 - i * S),
  eve: 0,
};
export const CRATE_Y = BELT_Y + CRATE / 2;
// the chained block (the IV, then the last cipher block) hovers over each ring
export const HOLD = { a: v(X.xorA, CRATE_Y + 15, 0), b: v(X.xorB, CRATE_Y + 15, 0) };
export const WALL_Z = -46;
export const SCREENS = { plain: v(-44, 40, WALL_Z + 3), ecb: v(0, 40, WALL_Z + 3), cbc: v(44, 40, WALL_Z + 3) };   // in front of the brick piers

const M = {
  floor: new THREE.MeshStandardMaterial({ color: 0x3a3c42, roughness: .9 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x4b4038, roughness: .95, flatShading: true }),
  brick: new THREE.MeshStandardMaterial({ color: 0x5a4436, roughness: .95, flatShading: true }),
  steel: new THREE.MeshStandardMaterial({ color: 0x4a4f58, roughness: .5, metalness: .6, flatShading: true }),
  wood: new THREE.MeshStandardMaterial({ color: 0x7a5530, roughness: .9, flatShading: true }),
  bench: new THREE.MeshStandardMaterial({ color: 0x3b2a30, roughness: .8, flatShading: true }),
  window: new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x1a3050, emissiveIntensity: .9 }),
  paint: new THREE.MeshBasicMaterial({ color: 0xd8b13a }),
};

function floorAndWalls(scene) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(420, 220), M.floor); f.rotation.x = -Math.PI / 2; f.position.z = 40; f.receiveShadow = true; scene.add(f);
  // yellow safety lines on each side of the belt
  for (const z of [-9, 9]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(250, .6), M.paint); l.rotation.x = -Math.PI / 2; l.position.set(0, .03, z); scene.add(l); }
  const back = new THREE.Mesh(new THREE.BoxGeometry(420, 90, 2), M.wall); back.position.set(0, 45, WALL_Z - 1); back.receiveShadow = true; scene.add(back);
  // brick piers and tall windows with the night behind them
  for (let x = -190; x <= 190; x += 38) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(5, 90, 3), M.brick); pier.position.set(x, 45, WALL_Z); scene.add(pier);
    if (Math.abs(x) > 70) { const w = new THREE.Mesh(new THREE.PlaneGeometry(22, 34), M.window); w.position.set(x + 19, 50, WALL_Z + .05); scene.add(w); }
  }
  for (const s of [-1, 1]) { const side = new THREE.Mesh(new THREE.BoxGeometry(2, 90, 140), M.wall); side.position.set(s * 200, 45, 24); scene.add(side); }
  // roof trusses
  for (let x = -180; x <= 180; x += 45) { const t = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 140), M.steel); t.position.set(x, 86, 24); scene.add(t); }
}

// A hanging lamp: a shade, a bulb, a warm light.
function hanging(x, z, power = 900) {
  const g = new THREE.Group();
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 30, 4), M.steel); cord.position.y = 15; g.add(cord);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(4, 3, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x2f4a3a, side: THREE.DoubleSide, metalness: .4 })); g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffd9a0, emissiveIntensity: 4 })); bulb.position.y = -1; g.add(bulb);
  const light = new THREE.PointLight(0xffd2a0, power, 120, 1.5); light.position.y = -2; g.add(light);
  g.position.set(x, 62, z);
  return g;
}

// Stacks of pallets and sacks at the ends, so the hall looks used.
function clutter(scene) {
  const box = (w, h, d, x, y, z, m = M.wood) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; scene.add(b); return b; };
  for (const [x, z, n] of [[-150, -26, 3], [-168, -10, 2], [150, -26, 3], [168, -8, 2], [-140, 30, 1], [142, 28, 2]])
    for (let k = 0; k < n; k++) { box(16, 1.4, 12, x, .7 + k * 9, z); box(14, 7.4, 10, x + (k % 2) * .8, 5.1 + k * 9, z); }
  // Eve's bench behind the belt: a work table, a lamp, a magnifier
  box(16, 1, 7, X.eve + 10, 8.5, -14, M.bench);
  for (const [dx, dz] of [[-7, -3], [7, -3], [-7, 3], [7, 3]]) box(.8, 8, .8, X.eve + 10 + dx, 4, -14 + dz, M.steel);
}

export function buildWorld(scene) {
  scene.background = new THREE.Color(0x0a0c12);
  scene.fog = new THREE.FogExp2(0x0a0c12, .0022);
  scene.add(new THREE.HemisphereLight(0x8090b8, 0x2a2420, 1.4));
  const key = new THREE.DirectionalLight(0xfff0dd, 1.4);
  key.position.set(40, 160, 120); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -150, right: 150, top: 80, bottom: -60, near: 10, far: 400 });
  key.shadow.bias = -.0006; scene.add(key);
  floorAndWalls(scene); clutter(scene);
  for (const x of [-112, -76, -22, 22, 76, 112]) scene.add(hanging(x, 4, 800));

  const conveyor = belt(-122, 122); scene.add(conveyor);
  const presses = { a: press('enc'), b: press('dec') }, rings = { a: xorRing(), b: xorRing() };
  presses.a.position.x = X.pressA; presses.b.position.x = X.pressB;
  rings.a.position.set(X.xorA, BELT_Y, 0); rings.b.position.set(X.xorB, BELT_Y, 0);
  for (const o of [...Object.values(presses), ...Object.values(rings)]) scene.add(o);

  const screens = { plain: screen(30, 35, 'image'), ecb: screen(30, 35, 'ECB'), cbc: screen(30, 35, 'CBC') };
  for (const [k, s] of Object.entries(screens)) { s.position.copy(SCREENS[k]); scene.add(s); }

  const people = { a: person('a'), e: person('e'), b: person('b') };
  people.a.position.set(X.alice, 0, -10); people.a.rotation.y = .9;
  people.b.position.set(X.bob, 0, -10); people.b.rotation.y = -.9;
  people.e.position.set(X.eve - 6, 0, -13); people.e.rotation.y = .3;
  for (const p of Object.values(people)) scene.add(p);

  const world = { scene, conveyor, presses, rings, screens, people };
  world.update = () => {};
  return world;
}
