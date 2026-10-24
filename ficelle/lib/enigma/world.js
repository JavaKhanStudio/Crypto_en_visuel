// A winter night in a pine forest, 1940s: Alice's post (west) and Bob's (east), each a desk
// with an Enigma under a desk lamp, a radio set, an aerial; between them, set back, Eve's
// listening hut with its tall aerial and red light. Built from primitives in code: no model
// files to load. One unit is 10 cm. The one copy of 5.1, 5.2 and 5.3 (r489, r579): what an episode
// has more on Eve's side (5.3: her machine, the slate, the bombe) comes in through buildWorld's options.
import * as THREE from 'three';
import { desk, DESK_TOP } from './desk.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
// Where things stand. Alice and Bob stand behind the left end of their desk, Eve at the left of hers.
export const PLACES = {
  a: { desk: v(-70, 0, 0), person: v(-87, 0, -12), mast: v(-88, 0, -16), hut: v(-100, 0, -30) },
  e: { desk: v(0, 0, -34), person: v(-12, 0, -34), mast: v(16, 0, -50), hut: v(0, 0, -52) },
  b: { desk: v(70, 0, 0), person: v(53, 0, -12), mast: v(88, 0, -16), hut: v(100, 0, -30) },
};
export const MAST_H = 64, FLOOR = .6, TOP_Y = FLOOR + DESK_TOP;   // the floor boards, the desk tops

// ---------- ground ----------
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
function fbm(x, z) { let v = 0, amp = .5, f = 1; for (let i = 0; i < 5; i++) { v += amp * noise(x * f, z * f); f *= 2; amp *= .5; } return v; }
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

// Flat clearing in the middle, rolling snow, hills at the rim.
export function heightAt(x, z) {
  const r = Math.hypot(x * .7, z * 1.1);
  let h = (fbm(x * .02, z * .02) - .5) * 14 * smooth(120, 200, r);
  if (r > 260) { const k = r - 260; h += Math.min(k * k * .01, 160) * (.55 + fbm(x * .015 + 9, z * .015 - 3) * 1.3); }
  return h;
}

const M = {
  wood: new THREE.MeshStandardMaterial({ color: 0x5b3b22, roughness: .9, flatShading: true }),
  plank: new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: .95, flatShading: true }),
  stone: new THREE.MeshStandardMaterial({ color: 0x6d6a66, roughness: .95, flatShading: true }),
  evil: new THREE.MeshStandardMaterial({ color: 0x2e2830, roughness: .85, flatShading: true }),
  metal: new THREE.MeshStandardMaterial({ color: 0x4a4d52, roughness: .5, metalness: .7, flatShading: true }),
  radio: new THREE.MeshStandardMaterial({ color: 0x3e4a3a, roughness: .7, flatShading: true }),
  window: new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffb347, emissiveIntensity: 1.4 }),
  evilWindow: new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff2a18, emissiveIntensity: 2.4 }),
  snowRoof: new THREE.MeshStandardMaterial({ color: 0xe8eef6, roughness: .9, flatShading: true }),
};

function buildTerrain() {
  const size = 1400, seg = 180, g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, colors = [];
  const snow = new THREE.Color(0xc9d3e2), snow2 = new THREE.Color(0xa9b6ca), rock = new THREE.Color(0x5d6070), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = heightAt(x, z);
    pos.setY(i, y);
    const slope = Math.abs(heightAt(x + 4, z) - y) + Math.abs(heightAt(x, z + 4) - y);
    c.copy(snow).lerp(snow2, fbm(x * .03, z * .03));
    if (slope > 5) c.lerp(rock, Math.min(1, (slope - 5) * .2));
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95 }));
  mesh.receiveShadow = true;
  return mesh;
}

// A wooden floor under each post, so the desk does not stand in the snow.
function floor(w, d) {
  const g = new THREE.Group();
  const f = new THREE.Mesh(new THREE.BoxGeometry(w, .6, d), M.plank); f.position.y = .3; f.receiveShadow = true; g.add(f);
  for (let i = 1; i < 8; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(.15, .62, d), M.wood); l.position.set(-w / 2 + i * w / 8, .31, 0); g.add(l); }
  return g;
}

// A little log hut: walls, a snowy pitched roof, a lit window. Faces +z.
function hut(w = 22, d = 14, h = 16, lit = M.window, wall = M.wood) {
  const g = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wall); walls.position.y = h / 2; g.add(walls);
  const roofShape = new THREE.Shape([new THREE.Vector2(-w / 2 - 2, 0), new THREE.Vector2(w / 2 + 2, 0), new THREE.Vector2(0, h * .6)]);
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: d + 3, bevelEnabled: false }), M.snowRoof);
  roof.position.set(0, h, -d / 2 - 1.5); g.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(5, 10, .6), M.plank); door.position.set(-w / 4, 5, d / 2); g.add(door);
  const win = new THREE.Mesh(new THREE.BoxGeometry(5, 4, .6), lit); win.position.set(w / 4, h * .55, d / 2); g.add(win);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// An aerial: a lattice mast with a red light on top (it blinks).
function mast(lightColor = 0xff3a2a) {
  const g = new THREE.Group();
  for (const [x, z] of [[-.8, -.8], [.8, -.8], [0, .8]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.18, .3, MAST_H, 5), M.metal); p.position.set(x, MAST_H / 2, z); p.castShadow = true; g.add(p); }
  for (let y = 6; y < MAST_H; y += 6) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, .12, 4, 3), M.metal); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(14, .3, .3), M.metal); bar.position.set(0, MAST_H - 2, -.8); g.add(bar);   // through the two back posts (r599: at z 0 it touched none)
  const lm = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: lightColor, emissiveIntensity: 3 });
  const light = new THREE.Mesh(new THREE.SphereGeometry(.9, 10, 8), lm); light.position.y = MAST_H + .6; g.add(light);
  g.userData.light = lm;
  return g;
}

// The things on a desk besides the machine: a lamp, a radio set, a notepad.
function deskLamp() {
  const g = new THREE.Group(), green = new THREE.MeshStandardMaterial({ color: 0x1f5a3a, roughness: .35, metalness: .3 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.2, .3, 16), M.metal); g.add(base);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 4.2, 6), M.metal); arm.position.y = 2.1; g.add(arm);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.6, 1.6, 1.2, 16, 1, true), green); shade.position.set(0, 4.2, .6); shade.rotation.x = .5; shade.material.side = THREE.DoubleSide; g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.35, 10, 8), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffd9a0, emissiveIntensity: 3 })); bulb.position.set(0, 3.9, .8); g.add(bulb);
  const light = new THREE.PointLight(0xffc98a, 60, 30, 1.6); light.position.set(0, 3.6, 1.2); g.add(light);
  g.traverse(o => o.isMesh && (o.castShadow = true));
  return g;
}
function radioSet() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(4, 2.6, 2.4), M.radio); box.position.y = 1.3; box.castShadow = true; g.add(box);
  const dialM = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x9cffb0, emissiveIntensity: 1.2 });
  for (const x of [-1, .3]) { const d = new THREE.Mesh(new THREE.CircleGeometry(.45, 16), dialM); d.position.set(x, 1.5, 1.21); g.add(d); }
  for (const x of [1.3, 1.6]) { const k = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .3, 10), M.metal); k.rotation.x = Math.PI / 2; k.position.set(x, .7, 1.3); g.add(k); }
  return g;
}
function notepad() {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.BoxGeometry(2.4, .08, 3), new THREE.MeshStandardMaterial({ color: 0xefe6d0, roughness: .9 })); p.position.y = .04; g.add(p);
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.2, 6), M.metal); pen.rotation.z = Math.PI / 2; pen.rotation.y = .5; pen.position.set(.4, .14, .3); g.add(pen);
  return g;
}

function buildTrees() {
  const n = 700, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.8, 1.2, 1, 5), M.wood, n);
  const crown = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: .9 }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  const clear = Object.values(PLACES).flatMap(p => [p.desk, p.hut, p.mast]);
  let placed = 0, seed = 7, tries = 0;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  while (placed < n && tries++ < 30000) {
    const x = (rnd() - .5) * 900, z = (rnd() - .5) * 700, y = heightAt(x, z);
    if (Math.abs(x) < 130 && z > -70 && z < 200) continue;                 // keep the stage and the camera's side clear
    if (clear.some(p => Math.hypot(p.x - x, p.z - z) < 24)) continue;
    if (fbm(x * .012 + 3, z * .012) < .42) continue;                       // stands, not a carpet
    const s = 9 + rnd() * 9;
    m.compose(v(x, y + 1.5 * s * .4, z), q, v(s * .2, s * .8, s * .2)); trunk.setMatrixAt(placed, m);
    for (let k = 0; k < 1; k++) { m.compose(v(x, y + s * 3, z), q, v(s * 1.1, s * 4.2, s * 1.1)); crown.setMatrixAt(placed, m); }
    crown.setColorAt(placed, col.setHSL(.38 + rnd() * .05, .35, .12 + rnd() * .08));   // dark pine
    placed++;
  }
  trunk.count = crown.count = placed;
  crown.castShadow = true;
  const g = new THREE.Group(); g.add(trunk, crown); return g;
}

// A clear winter night: deep blue at the top, a pale horizon, a moon, stars.
function buildSky() {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec3 vP;
      void main(){ float h = clamp(vP.y, -.1, 1.); vec3 c = mix(vec3(.16, .2, .32), vec3(.015, .025, .07), pow(smoothstep(-.05, .55, h), .7));
        vec3 m = normalize(vec3(.5, .42, -1.)); c += vec3(.5, .6, .8) * pow(max(dot(vP, m), 0.), 30.) * .25;
        gl_FragColor = vec4(c, 1.); }`,
  }));
  const g = new THREE.Group(); g.add(sky);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(40, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf3f0e2, fog: false }));
  moon.position.copy(v(.5, .42, -1).normalize().multiplyScalar(1500)); g.add(moon);
  const n = 1400, p = new Float32Array(n * 3);
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, y = .08 + rnd() * .92, r = Math.sqrt(1 - y * y);
    p.set([Math.cos(a) * r * 1600, y * 1600, Math.sin(a) * r * 1600], i * 3);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: .8 })));
  return g;
}

// Where Eve's lamp, notepad and receiver sit on her desk, from its centre (5.3 moves them aside
// for the machine it puts there).
const EVE_DESK = { lamp: v(5.2, 0, -2), pad: v(1, 0, 1.6), radio: v(-2.5, 0, -1) };

// opts.eveDesk: other spots for EVE_DESK's things; opts.eve(scene, { floor, extras }): builds what
// the episode adds on Eve's side, with this forest's wooden floor, and keeps it in extras.
export function buildWorld(scene, { eveDesk = {}, eve } = {}) {
  const ED = { ...EVE_DESK, ...eveDesk }, onEve = o => PLACES.e.desk.clone().add(o).add(v(0, TOP_Y, 0));
  scene.fog = new THREE.FogExp2(0x101626, .0016);
  scene.add(buildSky());
  scene.add(new THREE.HemisphereLight(0x6a80b8, 0x1a1c26, 1.1));
  const moon = new THREE.DirectionalLight(0xa8bfff, 1.6);
  moon.position.set(80, 160, -60); moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -130, right: 130, top: 90, bottom: -90, near: 10, far: 500 });
  moon.shadow.bias = -.0008; scene.add(moon);

  scene.add(buildTerrain());
  const masts = {}, extras = {};
  for (const k of ['a', 'e', 'b']) {
    const P = PLACES[k];
    const f = floor(k === 'e' ? 34 : 38, 22); f.position.copy(P.desk).add(v(-4, 0, 0)); scene.add(f);
    const d = desk(); d.position.copy(P.desk).setY(FLOOR); scene.add(d);
    // Eve reads under a desk lamp; Alice and Bob work under a lantern hung high, out of the drum's way
    if (k === 'e') { const lamp = deskLamp(); lamp.position.copy(onEve(ED.lamp)); lamp.rotation.y = -.5; scene.add(lamp); }
    else { const l = new THREE.PointLight(0xffc98a, 260, 60, 1.4); l.position.copy(P.desk).add(v(-4, 26, 8)); scene.add(l); }
    const pad = notepad(); pad.position.copy(k === 'e' ? onEve(ED.pad) : P.desk.clone().add(v(-4.6, TOP_Y, 1.6))); pad.rotation.y = .2; scene.add(pad);
    const m = mast(k === 'e' ? 0xff2a18 : 0xffb347); m.position.copy(P.mast); scene.add(m); masts[k] = m;
    const h = k === 'e' ? hut(26, 16, 18, M.evilWindow, M.evil) : hut(); h.position.copy(P.hut); h.rotation.y = k === 'a' ? .6 : k === 'b' ? -.6 : 0; scene.add(h);
    extras[k] = { pad };
  }
  // Eve has no Enigma: a big receiver on her desk, its dials glowing
  const rx = radioSet(); rx.scale.setScalar(1.6); rx.position.copy(onEve(ED.radio)); scene.add(rx);
  eve?.(scene, { floor, extras });
  scene.add(buildTrees());

  const world = { scene, moon, masts, extras };
  world.update = (dt, t) => {
    for (const [k, m] of Object.entries(masts)) m.userData.light.emissiveIntensity = (Math.sin(t * 2.4 + k.charCodeAt(0)) > .2 ? 3.4 : .3);
  };
  return world;
}
