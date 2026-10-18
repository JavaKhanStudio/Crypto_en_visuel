// The site's back room at night: Alice's and Bob's terminals at the west end, the salt shaker
// and the hash machine, the site's base (a server cabinet) in the middle, Eve's desk with her
// book and her rig at the east end, under its counter. Built from primitives in code: no model
// files to load. One unit is 10 cm.
import * as THREE from 'three';
import { terminal, shaker, machine, cabinet, eveDesk, rig, stopwatch, person, DESK_Y, COLORS } from './props.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
// Where things stand, along x. The desks are at z = 0, the people just behind and beside them.
export const X = {
  alice: -106, termA: -93, bob: -74, termB: -61,
  shaker: -40, machine: -14, base: 16, eve: 46, desk: 66, rig: 92,
};
export const BASE_Z = -12, RIG_Z = -10;
export const CARD_Y = DESK_Y + 7;                      // the height the cards ride at
// where the cards wait: above each terminal, over the shaker, in the machine, by the base
export const AT = {
  a: v(X.termA, CARD_Y + 4, 3), b: v(X.termB, CARD_Y + 4, 3),
  salt: v(X.shaker, DESK_Y + 13, 0), join: v(X.shaker - 2, DESK_Y + 18, 3),
  machine: v(X.machine, DESK_Y + 5, 0), out: v(X.machine + 13, CARD_Y, 3),
  rigIn: v(X.rig - 13, CARD_Y + 2, 2), rigOut: v(X.rig, DESK_Y + 6, 0),
};

const M = {
  floor: new THREE.MeshStandardMaterial({ color: 0x2c2f36, roughness: .85 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x343846, roughness: .95, flatShading: true }),
  steel: new THREE.MeshStandardMaterial({ color: 0x4a4f58, roughness: .5, metalness: .6, flatShading: true }),
  rack: new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: .5, metalness: .5, flatShading: true }),
  window: new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x1a3050, emissiveIntensity: .9 }),
  tile: new THREE.MeshBasicMaterial({ color: 0x3a4050 }),
};

function room(scene) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(420, 220), M.floor); f.rotation.x = -Math.PI / 2; f.position.z = 40; f.receiveShadow = true; scene.add(f);
  // raised-floor tiles: a grid of thin lines
  for (let x = -200; x <= 200; x += 12) { const l = new THREE.Mesh(new THREE.PlaneGeometry(.25, 200), M.tile); l.rotation.x = -Math.PI / 2; l.position.set(x, .02, 40); scene.add(l); }
  for (let z = -40; z <= 140; z += 12) { const l = new THREE.Mesh(new THREE.PlaneGeometry(400, .25), M.tile); l.rotation.x = -Math.PI / 2; l.position.set(0, .02, z); scene.add(l); }
  const back = new THREE.Mesh(new THREE.BoxGeometry(420, 90, 2), M.wall); back.position.set(0, 45, -41); back.receiveShadow = true; scene.add(back);
  for (const s of [-1, 1]) { const side = new THREE.Mesh(new THREE.BoxGeometry(2, 90, 140), M.wall); side.position.set(s * 200, 45, 24); scene.add(side); }
  // rows of server racks along the back wall, their lights blinking
  const leds = [];
  for (let x = -190; x <= 190; x += 13) {
    if (Math.abs(x - X.base) < 30 || (x > 66 && x < 121)) continue;      // room for the base and Eve's counter
    const r = new THREE.Mesh(new THREE.BoxGeometry(12, 42, 10), M.rack); r.position.set(x, 21, -35); r.castShadow = true; scene.add(r);
    for (let k = 0; k < 6; k++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(.5, .5), new THREE.MeshBasicMaterial({ color: k % 2 ? 0x3cff8a : 0x4da3ff, toneMapped: false }));
      m.position.set(x - 4 + (k % 3) * 1.4, 8 + Math.floor(k / 3) * 9 + (x % 7), -29.9); scene.add(m); leds.push(m);
    }
  }
  // ceiling cable trays
  for (const z of [-20, 10]) { const t = new THREE.Mesh(new THREE.BoxGeometry(400, 1, 6), M.steel); t.position.set(0, 70, z); scene.add(t); }
  return leds;
}

// A ceiling lamp: a cold strip light.
function strip(x, z, color = 0xd8e4ff, power = 700) {
  const g = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.BoxGeometry(14, .8, 2), new THREE.MeshStandardMaterial({ color: 0, emissive: color, emissiveIntensity: 2.2 })); g.add(tube);
  const light = new THREE.PointLight(color, power, 110, 1.5); light.position.y = -2; g.add(light);
  g.position.set(x, 60, z);
  return g;
}

export function buildWorld(scene) {
  scene.background = new THREE.Color(0x080a10);
  scene.fog = new THREE.FogExp2(0x080a10, .0022);
  scene.add(new THREE.HemisphereLight(0x8090b8, 0x2a2420, 1.3));
  const key = new THREE.DirectionalLight(0xe8f0ff, 1.3);
  key.position.set(40, 160, 120); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -150, right: 150, top: 80, bottom: -60, near: 10, far: 400 });
  key.shadow.bias = -.0006; scene.add(key);
  const leds = room(scene);
  for (const x of [-96, -50, 16, 66, 104]) scene.add(strip(x, 4));

  const terms = { a: terminal(COLORS.a), b: terminal(COLORS.b) };
  terms.a.position.x = X.termA; terms.b.position.x = X.termB;
  const salt = shaker(); salt.position.x = X.shaker;
  const mach = machine(); mach.position.x = X.machine;
  const base = cabinet(); base.position.set(X.base, 0, BASE_Z);
  const desk = eveDesk(); desk.position.set(X.desk, 0, 0); desk.rotation.y = -.15;
  const gpu = rig(); gpu.position.set(X.rig, 0, RIG_Z);
  const watch = stopwatch(); watch.position.set(X.machine - 14, DESK_Y + 16, 5); watch.scale.setScalar(1.8); watch.visible = false;   // by the machine, while bcrypt works
  for (const o of [...Object.values(terms), salt, mach, base, desk, gpu, watch]) scene.add(o);

  const people = { a: person('a'), b: person('b'), e: person('e') };
  people.a.position.set(X.alice, 0, -3); people.a.rotation.y = .6;
  people.b.position.set(X.bob, 0, -3); people.b.rotation.y = .6;
  people.e.position.set(X.eve, 0, -4); people.e.rotation.y = .5;
  for (const p of Object.values(people)) scene.add(p);

  const world = { scene, terms, salt, machine: mach, base, desk, rig: gpu, watch, people };
  world.update = (dt, time) => {
    for (let i = 0; i < leds.length; i++) leds[i].visible = Math.sin(time * (1.3 + i % 5) + i * 1.7) > -.6;
    for (let i = 0; i < base.userData.leds.length; i++) base.userData.leds[i].visible = Math.sin(time * (2 + i % 3) + i) > -.5;
  };
  return world;
}
