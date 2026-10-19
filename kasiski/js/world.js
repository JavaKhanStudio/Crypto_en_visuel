// A country road after the rain: a long straight dirt road (x from -48 to 48 m, 1 unit = 1 m) with
// mud puddles on the near wheels' lane, a paved lane behind it where the letters lie, fields, a farm,
// hedges, poplars, hills. Built from primitives in code: no model files to load.
import * as THREE from 'three';
import { WHEEL } from './kasiski.js';

export const ROAD = { x0: -50, x1: 50, half: 1.9 };
export const LANE_Z = -7.5;          // the letter lane, behind the road
export const NEAR_Z = .78;           // the near wheels run here (the camera side)
export const BARS_AT = new THREE.Vector3(0, 0, -3.6);   // where the bar chart stands, between road and lane
export const BARS_NEAR = new THREE.Vector3(24, 0, .3);   // step 10's bars: on the empty road, under the twelve letters at 51 and 81

// ---------- ground ----------
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
export function fbm(x, z) { let v = 0, amp = .5, f = 1; for (let i = 0; i < 5; i++) { v += amp * noise(x * f, z * f); f *= 2; amp *= .5; } return v; }
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

// Flat around the road and the lane, rolling fields further out, hills at the rim.
export function heightAt(x, z) {
  const off = Math.max(0, Math.abs(z + 3) - 9) + Math.max(0, Math.abs(x) - 70);
  let h = (fbm(x * .03, z * .03) - .5) * 7 * smooth(2, 30, off);
  const r = Math.hypot(x * .7, z);
  if (r > 110) { const k = r - 110; h += Math.min(k * k * .012, 40) * (.5 + fbm(x * .04 + 9, z * .04 - 3) * 1.2); }
  return h;
}

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .9, flatShading: true, ...o });
const M = {
  wall: mat(0xe9e1d0), wood: mat(0x6b4426), barn: mat(0x8e2f25), roof: mat(0x4a4f57), stone: mat(0x8f877a),
  window: new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffc070, emissiveIntensity: 1.2 }),
  door: mat(0x3a2414),
};

function buildTerrain() {
  const size = 460, seg = 170, g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, colors = [];
  const grass = new THREE.Color(0x5f8a3a), grass2 = new THREE.Color(0x86a04a), field = new THREE.Color(0xa59a52), rock = new THREE.Color(0x7d786c), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = heightAt(x, z);
    pos.setY(i, y);
    c.copy(grass).lerp(grass2, fbm(x * .06, z * .06));
    // fields in strips beyond the hedges
    if (Math.abs(z + 3) > 16 && Math.sin(x * .05 + Math.floor(z / 22)) > .3) c.lerp(field, .65);
    const slope = Math.abs(heightAt(x + 1, z) - y) + Math.abs(heightAt(x, z + 1) - y);
    if (slope > 1.2) c.lerp(rock, Math.min(1, (slope - 1.2) * 1.2));
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95 }));
  mesh.receiveShadow = true;
  return mesh;
}

// The dirt road: a straight band with a darker strip where wheels have worn it, and grass verges.
function buildRoad() {
  const g = new THREE.Group();
  const len = ROAD.x1 - ROAD.x0, mid = (ROAD.x0 + ROAD.x1) / 2;
  const dirt = new THREE.Mesh(new THREE.PlaneGeometry(len + 30, ROAD.half * 2, 1, 1), mat(0xb39a74, { roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
  dirt.rotation.x = -Math.PI / 2; dirt.position.set(mid, .03, 0); dirt.receiveShadow = true; g.add(dirt);
  for (const z of [NEAR_Z, -NEAR_Z]) {
    const rut = new THREE.Mesh(new THREE.PlaneGeometry(len + 30, .32), mat(0x9d8460, { roughness: 1, polygonOffset: true, polygonOffsetFactor: -3 }));
    rut.rotation.x = -Math.PI / 2; rut.position.set(mid, .035, z); rut.receiveShadow = true; g.add(rut);
  }
  return g;
}

// A mud puddle: a dark, wet, slightly glossy blot on the near lane, centred on x.
export function puddle(x, seed = 1) {
  const shape = new THREE.Shape(), n = 14;
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2, r = 1 + (hash(seed, i) - .5) * .35;
    const p = [Math.cos(a) * .8 * r, Math.sin(a) * .5 * r];
    i ? shape.lineTo(...p) : shape.moveTo(...p);
  }
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: .28, metalness: .05, polygonOffset: true, polygonOffsetFactor: -4 }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, .045, NEAR_Z); m.receiveShadow = true;
  return m;
}

// The paved lane where the letters lie: a long strip of flagstones with a kerb.
function buildLane() {
  const g = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(100, .14, 1.9), mat(0x8c8a84, { roughness: .95 }));
  slab.position.set(0, .07, LANE_Z); slab.receiveShadow = true; g.add(slab);
  for (const dz of [-1.02, 1.02]) {
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(100, .24, .14), mat(0x6f6c66)); kerb.position.set(0, .12, LANE_Z + dz); kerb.receiveShadow = kerb.castShadow = true; g.add(kerb);
  }
  return g;
}

function house(w, d, h, wallM, roofM) {
  const g = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallM); walls.position.y = h / 2; g.add(walls);
  const roofShape = new THREE.Shape([new THREE.Vector2(-w / 2 - .5, 0), new THREE.Vector2(w / 2 + .5, 0), new THREE.Vector2(0, h * .7)]);
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: d + 1, bevelEnabled: false }), roofM);
  roof.position.set(0, h, -d / 2 - .5); g.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.2, .2), M.door); door.position.set(0, 1.1, d / 2); g.add(door);
  for (const x of [-w / 3.2, w / 3.2]) { const win = new THREE.Mesh(new THREE.BoxGeometry(.9, .9, .2), M.window); win.position.set(x, h * .6, d / 2); g.add(win); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// A poplar (tall, narrow) or a round oak; a hedge along the field edge; a fence post.
function buildTrees() {
  const n = 260, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.16, .26, 1, 5), M.wood, n);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: .9 }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  let placed = 0, seed = 23, tries = 0;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // a row of poplars along the far side of the lane, then trees scattered in the fields
  for (let x = -54; x <= 54 && placed < n; x += 6.5) {
    const s = 1 + rnd() * .3, z = LANE_Z - 4.2 + rnd() * .6, y = heightAt(x, z);
    m.compose(new THREE.Vector3(x, y + 1.2 * s, z), q, new THREE.Vector3(s, 2.4 * s, s)); trunk.setMatrixAt(placed, m);
    m.compose(new THREE.Vector3(x, y + 5.2 * s, z), q, new THREE.Vector3(1.3 * s, 4 * s, 1.3 * s)); crown.setMatrixAt(placed, m);
    crown.setColorAt(placed, col.setHSL(.27 + rnd() * .04, .45, .3 + rnd() * .08)); placed++;
  }
  while (placed < n && tries++ < 20000) {
    const x = (rnd() - .5) * 300, z = (rnd() - .5) * 240, y = heightAt(x, z);
    if (y > 25 || (z > -18 && z < 40 && Math.abs(x) < 80)) continue;    // the stage and the camera's side stay clear
    if (Math.hypot(x - 34, z + 26) < 14 || Math.hypot(x + 40, z + 24) < 10) continue;   // the farm
    if (fbm(x * .05 + 3, z * .05) < .47) continue;
    const s = .9 + rnd() * 1.3;
    m.compose(new THREE.Vector3(x, y + .7 * s, z), q, new THREE.Vector3(s, 1.4 * s, s)); trunk.setMatrixAt(placed, m);
    m.compose(new THREE.Vector3(x, y + 2.6 * s, z), q.setFromEuler(new THREE.Euler(rnd(), rnd(), 0)), new THREE.Vector3(2 * s, 1.7 * s, 2 * s)); crown.setMatrixAt(placed, m);
    q.identity();
    crown.setColorAt(placed, col.setHSL(.25 + rnd() * .07, .4, .26 + rnd() * .1)); placed++;
  }
  trunk.count = crown.count = placed;
  crown.castShadow = true;
  const g = new THREE.Group(); g.add(trunk, crown); return g;
}

function buildHedges() {
  const g = new THREE.Group(), m = mat(0x3f6a2c), posts = mat(0x7a5a3a);
  // a hedge on the near side of the road, low enough to keep the wheels in view, with gaps
  for (let x = -60; x < 60; x += 4.4) {
    if (Math.abs(x - 20) < 5 || x < -30) continue;    // no hedge where the camera watches the wheel up close
    const h = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), m); h.scale.set(2.3, .7, .9); h.position.set(x, .45, 4.6); h.castShadow = true; g.add(h);
  }
  // fence posts between the road and the lane
  for (let x = -58; x <= 58; x += 3) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(.12, .9, .12), posts); p.position.set(x, .45, -5.3); p.castShadow = true; g.add(p);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(118, .08, .06), posts); rail.position.set(0, .75, -5.3); g.add(rail);
  return g;
}

// After the rain: a washed blue sky, broken grey-white clouds, a sun low in the west.
function buildSky() {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec3 vP;
      void main(){ float h = clamp(vP.y, -.1, 1.); vec3 c = mix(vec3(.93, .86, .74), vec3(.32, .55, .86), pow(smoothstep(-.05, .55, h), .7));
        vec3 sd = normalize(vec3(-.7, .22, -.6)); float sun = pow(max(dot(vP, sd), 0.), 260.); c += vec3(1., .9, .7) * sun * 2.;
        c += vec3(1., .75, .45) * pow(max(dot(vP, sd), 0.), 8.) * .22;
        gl_FragColor = vec4(c, 1.); }`,
  }));
  const g = new THREE.Group(); g.add(sky);
  const cm = new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 1, flatShading: true, fog: false, emissive: 0xc8ccd6, emissiveIntensity: .25 });
  for (let i = 0; i < 12; i++) {
    const cloud = new THREE.Group(), a = i / 12 * Math.PI * 2;
    for (let k = 0; k < 6; k++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(7 + (k % 3) * 2.5, 0), cm); p.position.set(k * 8 - 20, Math.sin(k * 1.7) * 2.5, (k % 2) * 4); cloud.add(p); }
    cloud.position.set(Math.cos(a) * 280, 85 + (i % 4) * 16, Math.sin(a) * 280); cloud.lookAt(0, cloud.position.y, 0);
    g.add(cloud);
  }
  return g;
}

export function buildWorld(scene) {
  scene.fog = new THREE.FogExp2(0xcfd8de, .0026);
  scene.add(buildSky());
  scene.add(new THREE.HemisphereLight(0xd8e6ff, 0x5a5a40, 1.6));
  const sun = new THREE.DirectionalLight(0xffe2b8, 3);
  sun.position.set(-50, 60, 40); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -64, right: 64, top: 30, bottom: -30, near: 10, far: 260 });
  sun.shadow.bias = -.0005; scene.add(sun);

  scene.add(buildTerrain(), buildRoad(), buildLane(), buildHedges(), buildTrees());
  // the puddles of the story's road (the sandbox draws its own)
  const puddles = new THREE.Group(); scene.add(puddles);
  const farm = house(9, 7, 4.2, M.wall, M.roof); farm.position.set(-40, heightAt(-40, -24), -24); farm.rotation.y = .2; scene.add(farm);
  const barn = house(11, 9, 5.6, M.barn, M.roof); barn.position.set(34, heightAt(34, -26), -26); barn.rotation.y = -.15; scene.add(barn);

  const world = { scene, sun, puddles };
  // the puddles for a road: one per mark that lands in mud, stone or gravel
  world.setPuddles = road => {
    puddles.clear();
    for (const n of road.mud) puddles.add(puddle((road.start + n * road.C) / 100, n));
    for (const [i, x] of road.gravel.entries()) puddles.add(puddle(x / 100, 50 + i));
  };
  world.setPuddles(WHEEL);
  world.update = () => {};
  return world;
}
