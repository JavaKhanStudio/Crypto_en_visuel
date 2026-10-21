// Bob's bank at night: Alice and Eve at the west end, where orders are handed in; the guard's
// booth in the middle, under the board where he compares letter by letter; the gate, and Bob's
// office behind it at the east end. Eve's chart and her stopwatch stand by her. Built from
// primitives in code: no model files to load. One unit is 10 cm.
import * as THREE from 'three';
import { booth, board, gate, bobDesk, chart, stopwatch, person, DESK_Y, BOARD_H } from './props.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
// Where things stand, along x. The booth's counter is at z = 4, the guard just behind it.
export const X = { alice: -82, eve: -58, chart: -36, booth: 0, gate: 26, bob: 46, desk: 50 };
export const BOARD_Y = 36, BOARD_Z = -24;
// where the badges wait: in a sender's hand, on the guard's counter, on Bob's desk
export const AT = {
  a: v(X.alice + 5, 15, 6), e: v(X.eve + 5, 15, 8),
  slot: v(X.booth - 2, DESK_Y + 4, 6), desk: v(X.desk, DESK_Y + 3, 4),
};

const M = {
  floor: new THREE.MeshStandardMaterial({ color: 0x3a2e26, roughness: .8 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x3b3446, roughness: .95, flatShading: true }),
  marble: new THREE.MeshStandardMaterial({ color: 0x5a5260, roughness: .4, flatShading: true }),
  gold: new THREE.MeshStandardMaterial({ color: 0xb8913a, roughness: .3, metalness: .8 }),
};

function room(scene) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(420, 220), M.floor); f.rotation.x = -Math.PI / 2; f.position.z = 40; f.receiveShadow = true; scene.add(f);
  // a checkerboard of marble tiles
  const tile = new THREE.MeshStandardMaterial({ color: 0x2a221c, roughness: .5 });
  for (let x = -200; x < 200; x += 16) for (let z = -32; z < 140; z += 16) if (((x + z) / 16) % 2 === 0) {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), tile); t.rotation.x = -Math.PI / 2; t.position.set(x + 8, .02, z + 8); t.receiveShadow = true; scene.add(t);
  }
  const back = new THREE.Mesh(new THREE.BoxGeometry(420, 90, 2), M.wall); back.position.set(0, 45, -33); back.receiveShadow = true; scene.add(back);
  for (const s of [-1, 1]) { const side = new THREE.Mesh(new THREE.BoxGeometry(2, 90, 140), M.wall); side.position.set(s * 200, 45, 36); scene.add(side); }
  // columns along the back wall, and a gold cornice
  for (let x = -180; x <= 180; x += 30) {
    if (Math.abs(x) < 50) continue;                        // the board hangs there
    const c = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 60, 12), M.marble); c.position.set(x, 30, -28); c.castShadow = true; scene.add(c);
  }
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(400, 2, 3), M.gold); cornice.position.set(0, 60, -31); scene.add(cornice);
  // the low wall that closes Bob's office, from the gate to the back
  const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 22, 22), M.marble); wall.position.set(X.gate, 11, -13); wall.castShadow = true; scene.add(wall);
}

// A hanging lamp: a warm globe.
function globe(x, z, color = 0xffd8a0, power = 800) {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 12), new THREE.MeshStandardMaterial({ color: 0, emissive: color, emissiveIntensity: 2 })); g.add(ball);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 20), M.gold); rod.position.y = 11; g.add(rod);
  const light = new THREE.PointLight(color, power, 120, 1.5); light.position.y = -2; g.add(light);
  g.position.set(x, 56, z);
  return g;
}

export function buildWorld(scene) {
  scene.background = new THREE.Color(0x0a0810);
  scene.fog = new THREE.FogExp2(0x0a0810, .0022);
  scene.add(new THREE.HemisphereLight(0x9088b0, 0x2a2018, 1.3));
  const key = new THREE.DirectionalLight(0xfff0e0, 1.2);
  key.position.set(40, 160, 120); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -150, right: 150, top: 80, bottom: -60, near: 10, far: 400 });
  key.shadow.bias = -.0006; scene.add(key);
  room(scene);
  for (const x of [-70, -20, 20, 60]) scene.add(globe(x, 6));

  const bth = booth(); bth.position.set(X.booth, 0, 2);
  const brd = board(); brd.position.set(X.booth, BOARD_Y, BOARD_Z);
  const gt = gate(); gt.position.set(X.gate, 0, -2);
  const desk = bobDesk(); desk.position.set(X.desk, 0, 0); desk.rotation.y = -.25;
  const ch = chart(); ch.position.set(X.chart, 0, -6); ch.rotation.y = .12;
  const watch = stopwatch(); watch.position.set(X.eve - 6, 27, 6); watch.scale.setScalar(2.2); watch.visible = false;
  for (const o of [bth, brd, gt, desk, ch, watch]) scene.add(o);

  const people = { a: person('a'), b: person('b'), e: person('e'), g: person('g') };
  people.a.position.set(X.alice, 0, 2); people.a.rotation.y = .5;
  people.e.position.set(X.eve, 0, 4); people.e.rotation.y = .45;
  people.g.position.set(X.booth + 3, 0, -6); people.g.rotation.y = 0;
  // r188: beside his desk, not behind the ledger's stand, which hid him
  people.b.position.set(X.desk + 15, 0, -1); people.b.rotation.y = -.7;
  for (const p of Object.values(people)) scene.add(p);

  const world = { scene, booth: bth, board: brd, gate: gt, desk, chart: ch, watch, people };
  world.update = () => {};
  return world;
}
