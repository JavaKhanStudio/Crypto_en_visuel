// The village: a meadow at golden hour, Alice's cottage (west), Eve's tower by the
// road (middle), Bob's workshop (east), and a few houses around. Each of the three has a
// table where the paint pots stand. Built from primitives in code: no model files to load.
import * as THREE from 'three';
import { COLORS } from './props.js';

// Where things stand. Tables are where the pots stand; each person stands at the left of theirs.
export const PLACES = {
  a: { table: new THREE.Vector3(-30, 0, 3), person: new THREE.Vector3(-32.7, 0, 2.4), house: new THREE.Vector3(-35, 0, -9) },
  e: { table: new THREE.Vector3(0, 0, -1), person: new THREE.Vector3(-2.7, 0, -1.6), house: new THREE.Vector3(-1, 0, -12) },
  b: { table: new THREE.Vector3(30, 0, 3), person: new THREE.Vector3(27.3, 0, 2.4), house: new THREE.Vector3(35, 0, -9) },
};
export const TABLE_TOP = 1.5;
export const TABLE_SIZE = { a: [3.8, 2.4], e: [4.8, 2.6], b: [3.8, 2.4] };
// The other houses of the village.
export const HOUSES = [[-20, -30, .4], [14, -33, -.3], [52, -20, -.9], [-56, -16, .9], [-48, 26, 2.4], [48, 28, -2.3], [8, 34, 3.1]]
  .map(([x, z, r]) => ({ pos: new THREE.Vector3(x, 0, z), rot: r }));

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

// Flat meadow in the middle, rolling hills, mountains at the rim.
export function heightAt(x, z) {
  const r = Math.hypot(x * .8, z * 1.1);
  let h = (fbm(x * .035, z * .035) - .5) * 5 * smooth(40, 70, r);
  if (r > 95) { const k = r - 95; h += Math.min(k * k * .016, 55) * (.55 + fbm(x * .04 + 9, z * .04 - 3) * 1.3); }
  return h;
}

const M = {
  wall: new THREE.MeshStandardMaterial({ color: 0xeadfc8, roughness: .95, flatShading: true }),
  stone: new THREE.MeshStandardMaterial({ color: 0x8f877a, roughness: .95, flatShading: true }),
  evil: new THREE.MeshStandardMaterial({ color: 0x3b3239, roughness: .85, flatShading: true }),
  wood: new THREE.MeshStandardMaterial({ color: 0x6b4426, roughness: .9, flatShading: true }),
  window: new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffb347, emissiveIntensity: 1.6 }),
  evilWindow: new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff2a18, emissiveIntensity: 2.6 }),
  door: new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 1 }),
  roof: c => new THREE.MeshStandardMaterial({ color: c, roughness: .55, flatShading: true }),
};

function buildTerrain() {
  const size = 440, seg = 160, g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, colors = [];
  const grass = new THREE.Color(0x5f8a3a), grass2 = new THREE.Color(0x86a548), rock = new THREE.Color(0x857d70), snow = new THREE.Color(0xf2f0ea), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = heightAt(x, z);
    pos.setY(i, y);
    const slope = Math.abs(heightAt(x + 1, z) - y) + Math.abs(heightAt(x, z + 1) - y);
    c.copy(grass).lerp(grass2, fbm(x * .07, z * .07));
    if (slope > 1.1) c.lerp(rock, Math.min(1, (slope - 1.1) * 1.4));
    if (y > 36) c.lerp(snow, smooth(36, 48, y));
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95 }));
  mesh.receiveShadow = true;
  return mesh;
}

// The road the pots travel, from Alice's door to Bob's, past Eve's tower.
function buildRoad() {
  const xz = [[-30, 7], [-20, 7.5], [-10, 5.5], [0, 4.5], [10, 5.5], [20, 7.5], [30, 7]];
  const path = new THREE.CatmullRomCurve3(xz.map(([x, z]) => new THREE.Vector3(x, .05, z)));
  const pts = path.getSpacedPoints(200), half = 1.6, verts = [], idx = [];
  // a little past each end, so it reaches the doorsteps
  for (let i = 0; i < pts.length; i++) {
    const t = path.getTangentAt(i / (pts.length - 1)), n = new THREE.Vector3(-t.z, 0, t.x).normalize();
    for (const s of [-1, 1]) { const p = pts[i].clone().addScaledVector(n, half * s); verts.push(p.x, .06, p.z); }
    if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xb59a72, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
  mesh.receiveShadow = true;
  return { mesh, path };
}

// A cottage: walls, pitched roof, door, two lit windows. Faces +z.
function cottage(roofColor, w = 7, d = 6, h = 4) {
  const g = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.wall); walls.position.y = h / 2; g.add(walls);
  const roofShape = new THREE.Shape([new THREE.Vector2(-w / 2 - .5, 0), new THREE.Vector2(w / 2 + .5, 0), new THREE.Vector2(0, h * .75)]);
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: d + 1, bevelEnabled: false }), M.roof(roofColor));
  roof.position.set(0, h, -d / 2 - .5); g.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, .2), M.door); door.position.set(0, 1.1, d / 2); g.add(door);
  for (const x of [-w / 3.2, w / 3.2]) { const win = new THREE.Mesh(new THREE.BoxGeometry(.9, .9, .2), M.window); win.position.set(x, h * .6, d / 2); g.add(win); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// Eve's watchtower: dark stone, red-lit slits, a red pointed roof. She sees the whole road.
function tower() {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.6, 13, 10), M.evil); shaft.position.y = 6.5; g.add(shaft);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(4, 3.2, 1.6, 10), M.evil); top.position.y = 13.6; g.add(top);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.4, 6, 10), M.roof(0x8e1a2a)); roof.position.y = 17.4; g.add(roof);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + .4, slit = new THREE.Mesh(new THREE.BoxGeometry(.5, 1.6, .3), M.evilWindow);
    slit.position.set(Math.sin(a) * 3.2, 9 + (i % 2) * 2.5, Math.cos(a) * 3.2); slit.rotation.y = a; g.add(slit);
  }
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, .3), M.door); door.position.set(0, 1.4, 3.45); g.add(door);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// Bob's workshop: a cottage with a chimney and a forge glowing by the door.
function workshop() {
  const g = cottage(COLORS.b, 8, 6.5, 4.2);
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4, 1.2), M.stone); chimney.position.set(2.4, 6, -1); chimney.castShadow = true; g.add(chimney);
  const forge = new THREE.Mesh(new THREE.BoxGeometry(2, 1.4, 1.4), M.stone); forge.position.set(-5, .7, 2.5); g.add(forge);
  const coals = new THREE.Mesh(new THREE.BoxGeometry(1.5, .2, .9), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff6a1a, emissiveIntensity: 3 }));
  coals.position.set(-5, 1.45, 2.5); g.add(coals);
  const light = new THREE.PointLight(0xff7a2a, 18, 14, 1.6); light.position.set(-5, 2.5, 3); g.add(light);
  g.userData.chimneyTop = new THREE.Vector3(2.4, 8.2, -1); g.userData.forgeLight = light;
  return g;
}

export function table(w = 3.2, d = 2) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, .16, d), M.wood); top.position.y = TABLE_TOP - .08; top.castShadow = top.receiveShadow = true; g.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.16, TABLE_TOP - .16, .16), M.wood);
    leg.position.set(sx * (w / 2 - .2), (TABLE_TOP - .16) / 2, sz * (d / 2 - .2)); leg.castShadow = true; g.add(leg);
  }
  return g;
}

function buildTrees() {
  const n = 420, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.18, .25, 1, 5), M.wood, n);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: .9 }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  const clear = [...Object.values(PLACES).flatMap(p => [p.table, p.house]), ...HOUSES.map(h => h.pos)];
  let placed = 0, seed = 11, tries = 0;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  while (placed < n && tries++ < 20000) {
    const x = (rnd() - .5) * 280, z = (rnd() - .5) * 200, y = heightAt(x, z);
    if (y > 28 || (Math.abs(x) < 62 && z > -6 && z < 60)) continue;          // keep the stage and the camera's side clear
    if (clear.some(p => Math.hypot(p.x - x, p.z - z) < 9)) continue;
    if (fbm(x * .05 + 3, z * .05) < .45) continue;                          // groves, not a carpet
    const s = .8 + rnd() * 1.2;
    m.compose(new THREE.Vector3(x, y + .6 * s, z), q, new THREE.Vector3(s, 1.2 * s, s)); trunk.setMatrixAt(placed, m);
    m.compose(new THREE.Vector3(x, y + 2.2 * s, z), q.setFromEuler(new THREE.Euler(rnd(), rnd(), 0)), new THREE.Vector3(1.6 * s, 1.5 * s, 1.6 * s)); crown.setMatrixAt(placed, m);
    q.identity();
    crown.setColorAt(placed, col.setHSL(.22 + rnd() * .1, .45, .3 + rnd() * .14));
    placed++;
  }
  trunk.count = crown.count = placed;
  crown.castShadow = true;
  const g = new THREE.Group(); g.add(trunk, crown); return g;
}

// Golden-hour sky: a warm horizon, a low sun, a few soft clouds.
function buildSky() {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec3 vP;
      void main(){ float h = clamp(vP.y, -.1, 1.); vec3 c = mix(vec3(1., .72, .45), vec3(.25, .45, .78), pow(smoothstep(-.05, .6, h), .6));
        float sun = pow(max(dot(vP, normalize(vec3(-.55, .18, -1.))), 0.), 220.); c += vec3(1., .85, .6) * sun * 2.;
        c += vec3(1., .6, .3) * pow(max(dot(vP, normalize(vec3(-.55, .18, -1.))), 0.), 6.) * .25;
        gl_FragColor = vec4(c, 1.); }`,
  }));
  const g = new THREE.Group(); g.add(sky);
  const cm = new THREE.MeshStandardMaterial({ color: 0xfff1e0, roughness: 1, flatShading: true, fog: false, emissive: 0xffb380, emissiveIntensity: .25 });
  for (let i = 0; i < 9; i++) {
    const cloud = new THREE.Group(), a = i / 9 * Math.PI * 2;
    for (let k = 0; k < 5; k++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(6 + (k % 3) * 2, 0), cm); p.position.set(k * 7 - 14, Math.sin(k) * 2, (k % 2) * 3); cloud.add(p); }
    cloud.position.set(Math.cos(a) * 260, 90 + (i % 3) * 18, Math.sin(a) * 260); cloud.lookAt(0, cloud.position.y, 0);
    g.add(cloud);
  }
  return g;
}

export function buildWorld(scene) {
  scene.fog = new THREE.FogExp2(0xd9b08a, .0019);
  scene.add(buildSky());
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x6a5a3a, 1.5));
  const sun = new THREE.DirectionalLight(0xffd9a8, 3.2);
  sun.position.set(-60, 70, 50); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 50, bottom: -50, near: 10, far: 300 });
  sun.shadow.bias = -.0006; scene.add(sun);

  scene.add(buildTerrain());
  const road = buildRoad(); scene.add(road.mesh);
  const houseA = cottage(COLORS.a); houseA.position.copy(PLACES.a.house); houseA.rotation.y = .25; scene.add(houseA);
  const eveTower = tower(); eveTower.position.copy(PLACES.e.house); scene.add(eveTower);
  const shop = workshop(); shop.position.copy(PLACES.b.house); shop.rotation.y = -.25; scene.add(shop);
  for (const k of ['a', 'e', 'b']) { const t = table(...TABLE_SIZE[k]); t.position.copy(PLACES[k].table); scene.add(t); }
  HOUSES.forEach((h, i) => {
    const c = cottage([0x6aa36f, 0xc8644a, 0x8a7bd1, 0xd99a3c, 0x5a9ab0, 0xb35d84, 0x7f9a4a][i], 5.5, 5, 3.4);
    c.position.copy(h.pos); c.position.y = heightAt(h.pos.x, h.pos.z); c.rotation.y = h.rot; scene.add(c);
  });
  scene.add(buildTrees());

  // chimney smoke: a few puffs that rise and fade, recycled
  const puffs = [], pm = new THREE.MeshStandardMaterial({ color: 0xd8d2cc, transparent: true, opacity: .5, roughness: 1, flatShading: true });
  const chimney = shop.localToWorld(shop.userData.chimneyTop.clone());
  for (let i = 0; i < 8; i++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.8, 0), pm.clone()); p.userData.t = i / 8; scene.add(p); puffs.push(p); }

  const world = { scene, road, sun, houseA, eveTower, shop };
  world.update = (dt, t) => {
    for (const p of puffs) {
      p.userData.t = (p.userData.t + dt * .12) % 1;
      const k = p.userData.t;
      p.position.copy(chimney).add(new THREE.Vector3(k * 5 + Math.sin(t + k * 6) * .5, k * 9, -k * 2));
      p.scale.setScalar(.6 + k * 2.2); p.material.opacity = .55 * (1 - k);
    }
    shop.userData.forgeLight.intensity = 16 + Math.sin(t * 9) * 3 + Math.sin(t * 15.7) * 2;
  };
  return world;
}
