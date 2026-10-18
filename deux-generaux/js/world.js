// The valley: terrain, sky, the two castles, Eve's city, the road between them.
// Everything is built from primitives in code: no model files to load.
import * as THREE from 'three';

export const CASTLE_A = new THREE.Vector3(-70, 0, 0);
export const CASTLE_B = new THREE.Vector3(70, 0, 0);
export const CITY = new THREE.Vector3(0, 0, 0);
export const COLORS = { a: 0x4da3ff, b: 0xffc24d, e: 0xff3347 };

// ---------- noise and height ----------
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
function fbm(x, z) { let v = 0, amp = .5, f = 1; for (let i = 0; i < 5; i++) { v += amp * noise(x * f, z * f); f *= 2; amp *= .5; } return v; }
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

function rawHeight(x, z) {
  let h = (fbm(x * .03, z * .03) - .5) * 4;
  for (const cx of [CASTLE_A.x, CASTLE_B.x]) h += 17 * Math.exp(-((x - cx) ** 2 + z * z * 1.3) / (2 * 19 * 19));
  const r = Math.hypot(x * .75, z * 1.25);
  if (r > 92) { const k = r - 92; h += Math.min(k * k * .014, 46) * (.55 + fbm(x * .04 + 9, z * .04 - 3) * 1.3); }
  return h;
}
const PLATEAU = { a: rawHeight(CASTLE_A.x, 0) + .5, b: rawHeight(CASTLE_B.x, 0) + .5 };
CASTLE_A.y = PLATEAU.a; CASTLE_B.y = PLATEAU.b; CITY.y = 1.2;

export function heightAt(x, z) {
  let h = rawHeight(x, z);
  const da = Math.hypot(x - CASTLE_A.x, z), db = Math.hypot(x - CASTLE_B.x, z), dc = Math.hypot(x, z);
  let w = smooth(15, 10, da); h = h * (1 - w) + PLATEAU.a * w;
  w = smooth(15, 10, db); h = h * (1 - w) + PLATEAU.b * w;
  w = smooth(28, 22, dc); h = h * (1 - w) + CITY.y * w;
  return h;
}

// ---------- materials ----------
const M = {
  stone: new THREE.MeshStandardMaterial({ color: 0xc9c0ad, roughness: .92, flatShading: true }),
  darkStone: new THREE.MeshStandardMaterial({ color: 0x7a7468, roughness: .95, flatShading: true }),
  wood: new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: .9, flatShading: true }),
  window: new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffb347, emissiveIntensity: 2.4 }),
  gate: new THREE.MeshStandardMaterial({ color: 0x1b120b, roughness: 1 }),
  roof: c => new THREE.MeshStandardMaterial({ color: c, roughness: .6, metalness: .1, flatShading: true }),
  // Étienne's city: black basalt, blood-red windows
  evilStone: new THREE.MeshStandardMaterial({ color: 0x3b3239, roughness: .85, flatShading: true }),
  evilTrim: new THREE.MeshStandardMaterial({ color: 0x1c1519, roughness: .9, flatShading: true }),
  evilWindow: new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff2a18, emissiveIntensity: 3 }),
};
const EVIL = { stone: M.evilStone, trim: M.evilTrim, win: M.evilWindow, spiky: true };

// ---------- terrain ----------
function buildTerrain() {
  const size = 420, seg = 180;
  const g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, colors = [];
  const grass = new THREE.Color(0x3f5f34), grass2 = new THREE.Color(0x5b7a3c), rock = new THREE.Color(0x6f6a62),
    snow = new THREE.Color(0xe8eef5), dirt = new THREE.Color(0x7a6448), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = heightAt(x, z);
    pos.setY(i, y);
    const slope = Math.abs(heightAt(x + 1, z) - y) + Math.abs(heightAt(x, z + 1) - y);
    c.copy(grass).lerp(grass2, fbm(x * .08, z * .08));
    if (Math.hypot(x, z) < 26) c.lerp(dirt, .55);
    if (slope > 1.1) c.lerp(rock, Math.min(1, (slope - 1.1) * 1.4));
    if (y > 34) c.lerp(snow, smooth(34, 46, y));
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95 }));
  mesh.receiveShadow = true;
  return mesh;
}

// ---------- road ----------
export function buildRoad() {
  const xz = [[-61, 0], [-50, 3], [-38, 10], [-24, 21], [-10, 28], [0, 29.5], [10, 28], [24, 21], [38, 10], [50, 3], [61, 0]];
  const curve = new THREE.CatmullRomCurve3(xz.map(([x, z]) => new THREE.Vector3(x, heightAt(x, z), z)));
  // re-sample densely so the road hugs the ground
  const dense = curve.getSpacedPoints(240).map(p => new THREE.Vector3(p.x, heightAt(p.x, p.z) + .25, p.z));
  const path = new THREE.CatmullRomCurve3(dense);
  const pts = path.getSpacedPoints(400), half = 1.7, verts = [], idx = [];
  for (let i = 0; i < pts.length; i++) {
    const t = path.getTangentAt(i / (pts.length - 1)), n = new THREE.Vector3(-t.z, 0, t.x).normalize();
    for (const s of [-1, 1]) {
      const p = pts[i].clone().addScaledVector(n, half * s);
      p.y = heightAt(p.x, p.z) + .18;
      verts.push(p.x, p.y, p.z);
    }
    if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x8c7356, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
  mesh.receiveShadow = true;
  return { mesh, path };
}

// ---------- building blocks ----------
function merlons(group, count, placer, size = [.7, .9, .7], { stone = M.stone, spiky = false } = {}) {
  const geo = spiky ? new THREE.ConeGeometry(size[0] * .55, size[1] * 1.8, 4) : new THREE.BoxGeometry(...size);
  const im = new THREE.InstancedMesh(geo, stone, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  for (let i = 0; i < count; i++) { const [x, y, z, ry] = placer(i); q.setFromEuler(new THREE.Euler(0, ry || 0, 0)); p.set(x, y, z); m.compose(p, q, s); im.setMatrixAt(i, m); }
  im.castShadow = true; group.add(im);
}

function tower(r, h, roofColor, { roof = true, windows = 2, stone = M.stone, trim = M.darkStone, win = M.window, spiky = false } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, h, 12), stone);
  body.position.y = h / 2; body.castShadow = body.receiveShadow = true; g.add(body);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.18, r * 1.18, .6, 12), trim);
  ring.position.y = h; g.add(ring);
  merlons(g, 10, i => { const a = i / 10 * Math.PI * 2; return [Math.cos(a) * r * 1.1, h + .75, Math.sin(a) * r * 1.1, -a]; }, [.6, .9, .5], { stone: trim, spiky });
  if (roof) {
    // spiky: a tall needle instead of a cone roof
    const rh = spiky ? h * 1.1 : h * .55, cone = new THREE.Mesh(new THREE.ConeGeometry(r * (spiky ? 1.05 : 1.35), rh, spiky ? 6 : 12), M.roof(roofColor));
    cone.position.y = h + 1.25 + rh / 2; cone.castShadow = true; g.add(cone);
  }
  for (let i = 0; i < windows; i++) {
    const a = i / windows * Math.PI * 2 + .4, w = new THREE.Mesh(new THREE.BoxGeometry(.35, .7, .2), win);
    w.position.set(Math.cos(a) * r * 1.01, h * (.45 + .25 * (i % 2)), Math.sin(a) * r * 1.01); w.rotation.y = -a + Math.PI / 2; g.add(w);
  }
  return g;
}

function wall(len, h, t, { stone = M.stone, trim = M.stone, spiky = false } = {}) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(len, h, t), stone);
  b.position.y = h / 2; b.castShadow = b.receiveShadow = true; g.add(b);
  const n = Math.floor(len / 1.4);
  merlons(g, n, i => [-len / 2 + .7 + i * (len - 1.4) / (n - 1), h + .45, 0], undefined, { stone: trim, spiky });
  return g;
}

// A flag whose vertices are waved every frame in update().
const flags = [];
function flag(color, w = 4, h = 2.4) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 6, 6), M.wood);
  pole.position.y = 3; g.add(pole);
  const geo = new THREE.PlaneGeometry(w, h, 16, 6); geo.translate(w / 2, 0, 0);
  const mat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: .7, emissive: color, emissiveIntensity: .25 });
  const cloth = new THREE.Mesh(geo, mat); cloth.position.y = 6 - h / 2; cloth.castShadow = true; g.add(cloth);
  flags.push({ geo, base: Float32Array.from(geo.attributes.position.array), w, phase: Math.random() * 6 });
  g.userData.cloth = cloth;
  return g;
}

// ---------- castles ----------
function buildCastle(team, facing) {
  const color = COLORS[team], g = new THREE.Group();
  const S = 17, H = 5.5;
  const sides = [[0, -S / 2, 0], [0, S / 2, 0], [-S / 2, 0, Math.PI / 2], [S / 2, 0, Math.PI / 2]];
  for (const [x, z, ry] of sides) { const w = wall(S, H, 1.4); w.position.set(x, 0, z); w.rotation.y = ry; g.add(w); }
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const t = tower(2.3, 10, color); t.position.set(x * S / 2, 0, z * S / 2); g.add(t); }
  // gate, on the wall facing +x (the group is rotated so it faces the road)
  const gate = new THREE.Mesh(new THREE.BoxGeometry(.6, 3.6, 3.2), M.gate); gate.position.set(S / 2 + .5, 1.8, 0); g.add(gate);
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, .62, 12, 1, false, 0, Math.PI), M.gate);
  arch.rotation.z = Math.PI / 2; arch.rotation.y = Math.PI / 2; arch.position.set(S / 2 + .5, 3.6, 0); g.add(arch);
  for (const z of [-2.4, 2.4]) { const gt = tower(1.4, 8, color, { windows: 1 }); gt.position.set(S / 2 + .6, 0, z); g.add(gt); }
  // keep
  const keep = new THREE.Mesh(new THREE.BoxGeometry(7, 13, 7), M.stone); keep.position.y = 6.5; keep.castShadow = keep.receiveShadow = true; g.add(keep);
  merlons(g, 16, i => { const side = i >> 2, k = (i % 4) / 3 * 6 - 3; const p = [[k, -3.4], [k, 3.4], [-3.4, k], [3.4, k]][side]; return [p[0], 13.45, p[1]]; });
  for (let i = 0; i < 8; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(.25, 1, .6), M.window); const side = i % 4, y = 5 + (i >> 2) * 4;
    const p = [[3.52, 0], [-3.52, 0], [0, 3.52], [0, -3.52]][side]; w.position.set(p[0], y, p[1]); if (side > 1) w.rotation.y = Math.PI / 2; g.add(w); }
  const top = tower(2.2, 7, color, { windows: 2 }); top.position.y = 13; g.add(top);
  const f = flag(color); f.position.set(0, 13 + 7 + 4.5, 0); f.scale.setScalar(.9); g.add(f);
  // courtyard ground
  const yard = new THREE.Mesh(new THREE.CylinderGeometry(S * .72, S * .78, .6, 24), M.darkStone); yard.position.y = -.25; yard.receiveShadow = true; g.add(yard);
  // team glow: a ring of light at the foot, picked up by bloom
  const glow = new THREE.Mesh(new THREE.TorusGeometry(S * .78, .12, 6, 64), new THREE.MeshBasicMaterial({ color }));
  glow.rotation.x = Math.PI / 2; glow.position.y = .15; g.add(glow);
  g.rotation.y = facing;
  g.userData = { team, flag: f, glow };
  return g;
}

// ---------- Eve's city ----------
function buildCity() {
  const g = new THREE.Group(), R = 19, segs = 22;
  for (let i = 0; i < segs; i++) {
    const a0 = i / segs * Math.PI * 2, a1 = (i + 1) / segs * Math.PI * 2, am = (a0 + a1) / 2;
    if (Math.abs(am - Math.PI / 2) < .1) continue; // gate gap, facing the road (+z)
    const len = 2 * R * Math.sin(Math.PI / segs) + .2, w = wall(len, 4.5, 1.2, EVIL);
    w.position.set(Math.cos(am) * R, 0, Math.sin(am) * R); w.rotation.y = -am + Math.PI / 2; g.add(w);
  }
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2 + Math.PI / 2 + Math.PI / 7, t = tower(1.9, 8.5, 0x3a0a10, { windows: 1, ...EVIL });
    t.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); g.add(t);
  }
  for (const s of [-1, 1]) { const t = tower(1.5, 7.5, 0x3a0a10, { windows: 1, ...EVIL }); t.position.set(s * 2.6, 0, R); g.add(t); }
  // houses
  const n = 70, houses = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x5e5052, flatShading: true, roughness: .9 }), n);
  const roofs = new THREE.InstancedMesh(new THREE.ConeGeometry(.78, 1, 4), M.roof(0x3a1418), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  let placed = 0, seed = 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  while (placed < n) {
    const a = rnd() * Math.PI * 2, d = 5.5 + rnd() * 10.5, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.abs(x) < 2.5 && z > 4) continue; // the street from the gate
    const w = 1.8 + rnd() * 1.8, h = 1.6 + rnd() * 2.2, dd = 1.8 + rnd() * 1.6, ry = rnd() * Math.PI;
    e.set(0, ry, 0); q.setFromEuler(e);
    m.compose(new THREE.Vector3(x, h / 2, z), q, new THREE.Vector3(w, h, dd)); houses.setMatrixAt(placed, m);
    e.set(0, ry + Math.PI / 4, 0); q.setFromEuler(e);
    m.compose(new THREE.Vector3(x, h + .7, z), q, new THREE.Vector3(Math.max(w, dd) * 1.05, 1.4, Math.max(w, dd) * 1.05)); roofs.setMatrixAt(placed, m);
    placed++;
  }
  houses.castShadow = houses.receiveShadow = roofs.castShadow = true; g.add(houses, roofs);
  // the watchtower: two black horns, and between them the Eye
  const wt = tower(2.6, 22, 0x2a0d12, { roof: false, windows: 4, ...EVIL }); g.add(wt);
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(.75, 7.5, 6), M.evilTrim);
    horn.position.set(s * 2.1, 26, 0); horn.rotation.z = s * -.32; horn.castShadow = true; g.add(horn);
  }
  const eye = buildEye(); eye.position.y = BEAM.eyeY; g.add(eye);
  const fireLight = new THREE.PointLight(0xff4422, 60, 70, 1.6); fireLight.position.y = BEAM.eyeY; g.add(fireLight);
  // the Eye's gaze: a cone from the pupil down to the ground, and the lit patch where it lands.
  // pivot.rotation.y is the sweep angle; update() aims the cone and lays the patch on the terrain.
  const beamGeo = new THREE.ConeGeometry(1, 1, 32, 1, true); beamGeo.translate(0, -.5, 0); beamGeo.rotateX(-Math.PI / 2);   // apex at 0, base at z = 1
  const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xff4455, transparent: true, opacity: .11, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  const pivot = new THREE.Group(); pivot.position.y = BEAM.eyeY; pivot.add(beam); g.add(pivot);
  const spotGeo = new THREE.CircleGeometry(BEAM.radius, 40, 0, Math.PI * 2); spotGeo.rotateX(-Math.PI / 2);
  const spot = new THREE.Mesh(spotGeo, new THREE.MeshBasicMaterial({ color: 0xff3a30, transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false }));
  spot.userData.base = Float32Array.from(spotGeo.attributes.position.array); spot.renderOrder = 2; g.add(spot);
  // on the needle of the west gate tower (h 7.5, needle tip at 7.5 + 1.25 + 7.5 * 1.1), flying over the gate
  const f = flag(COLORS.e, 5, 3); f.position.set(-2.6, 16.6, R); g.add(f);
  g.position.copy(CITY);
  g.userData = { eye, fireLight, pivot, beam, spot, flag: f, target: new THREE.Vector3() };
  return g;
}

// The Eye: a slit-pupilled ball of fire, its halo always facing the camera.
function buildEye() {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
  ball.scale.set(1.25, 1.9, 1.1); g.add(ball);
  const iris = new THREE.Mesh(new THREE.SphereGeometry(1.02, 24, 16, 0, Math.PI * 2, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffd040, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
  iris.scale.set(1.05, 1.75, .9); iris.position.z = .25; g.add(iris);
  const pupil = new THREE.Mesh(new THREE.BoxGeometry(.28, 2.9, .3), new THREE.MeshBasicMaterial({ color: 0x050102 }));
  pupil.position.z = 1.05; g.add(pupil);
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 8, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,140,40,1)'); gr.addColorStop(.45, 'rgba(255,60,20,.55)'); gr.addColorStop(1, 'rgba(255,20,0,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  halo.scale.set(9, 11, 1); g.add(halo);
  g.userData = { ball, halo };
  return g;
}

// The gaze lands on the ground at `reach` from the city's centre (it crosses the road
// on both sides of the gate); `radius` is the lit patch.
// The Eye swings its gaze all the way round and back (quickest over the road, in
// front): a one-way spin caught riders riding against it twice as often as the others.
const BEAM = { eyeY: 27, reach: 36, radius: 6, swing: .175 };
const gaze = t => Math.PI * Math.sin(t * BEAM.swing);
const _apex = new THREE.Vector3(), _axis = new THREE.Vector3(), _v = new THREE.Vector3();

// Aim the cone and lay the patch on the terrain for sweep angle a (radians about +y, 0 = +z).
function aimBeam(c, a) {
  const city = c.pivot.parent.position, tx = Math.sin(a) * BEAM.reach, tz = Math.cos(a) * BEAM.reach;
  const ty = heightAt(city.x + tx, city.z + tz) - city.y;
  c.target.set(city.x + tx, city.y + ty, city.z + tz);
  const drop = BEAM.eyeY - ty, len = Math.hypot(drop, BEAM.reach);
  c.pivot.rotation.y = a;
  c.beam.rotation.x = Math.atan2(drop, BEAM.reach);
  c.beam.scale.set(BEAM.radius, BEAM.radius, len);
  c.eye.rotation.y = a;
  const pos = c.spot.geometry.attributes.position, b = c.spot.userData.base;
  for (let i = 0; i < pos.count; i++) {
    const x = tx + b[i * 3], z = tz + b[i * 3 + 2];
    pos.setXYZ(i, x, heightAt(city.x + x, city.z + z) - city.y + .3, z);
  }
  pos.needsUpdate = true; c.spot.geometry.computeBoundingSphere();
}

// Is the point p (world space) inside the Eye's cone right now?
function inBeam(w, p) {
  const c = w.city.userData;
  if (!c.pivot.visible) return false;
  _apex.set(0, BEAM.eyeY, 0).add(w.city.position);
  _axis.subVectors(c.target, _apex);
  const len = _axis.length(); _axis.divideScalar(len);
  _v.subVectors(p, _apex);
  const along = _v.dot(_axis);
  if (along <= 0 || along > len) return false;
  return _v.addScaledVector(_axis, -along).length() <= BEAM.radius * along / len;
}

// ---------- trees ----------
function buildTrees(road) {
  const n = 650, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.15, .2, 1, 5), M.wood, n);
  const crown = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: .9 }), n);
  const roadPts = road.path.getSpacedPoints(80), m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  let placed = 0, seed = 7, tries = 0;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  while (placed < n && tries++ < 20000) {
    const x = (rnd() - .5) * 300, z = (rnd() - .5) * 220, y = heightAt(x, z);
    if (y > 30 || Math.hypot(x, z) < 27 || Math.hypot(x - CASTLE_A.x, z) < 16 || Math.hypot(x - CASTLE_B.x, z) < 16) continue;
    if (roadPts.some(p => Math.hypot(p.x - x, p.z - z) < 4.5)) continue;
    if (fbm(x * .05 + 3, z * .05) < .42) continue; // forests come in clumps
    const s = .8 + rnd() * 1.1;
    m.compose(new THREE.Vector3(x, y + .5 * s, z), q, new THREE.Vector3(s, s, s)); trunk.setMatrixAt(placed, m);
    m.compose(new THREE.Vector3(x, y + s * 2.4, z), q, new THREE.Vector3(1.4 * s, 3.4 * s, 1.4 * s)); crown.setMatrixAt(placed, m);
    crown.setColorAt(placed, col.setHSL(.28 + rnd() * .08, .4, .3 + rnd() * .14));
    placed++;
  }
  trunk.count = crown.count = placed;
  crown.castShadow = true;
  const g = new THREE.Group(); g.add(trunk, crown); return g;
}

// ---------- sky ----------
function buildSky() {
  const uniforms = { top: { value: new THREE.Color(0x0a0f2c) }, horizon: { value: new THREE.Color(0xd9734f) }, glow: { value: 0 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform float glow; varying vec3 vP;
      void main(){ float h = clamp(vP.y, -.1, 1.); vec3 c = mix(horizon, top, pow(smoothstep(-.05, .55, h), .7));
        float sun = pow(max(dot(vP, normalize(vec3(.2,.05,-1.))), 0.), 40.) * glow; c += vec3(1.,.6,.3) * sun;
        gl_FragColor = vec4(c, 1.); }`,
  }));
  const n = 1800, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, y = Math.abs(u) * .95 + .05, r = Math.sqrt(1 - y * y);
    p.set([Math.cos(a) * r * 500, y * 500, Math.sin(a) * r * 500], i * 3);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: .85, fog: false }));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(14, 32, 16), new THREE.MeshBasicMaterial({ color: 0xfff3d6, fog: false }));
  moon.position.set(-160, 190, -380);
  const g = new THREE.Group(); g.add(sky, stars, moon);
  g.userData = { uniforms, stars, moon };
  return g;
}

// ---------- torches along the road ----------
const flames = [];
function buildTorches(road) {
  const g = new THREE.Group(), flameMat = new THREE.MeshBasicMaterial({ color: 0xffa040 });
  for (const t of [.07, .2, .33, .45, .55, .67, .8, .93]) {
    const p = road.path.getPointAt(t), tan = road.path.getTangentAt(t), side = new THREE.Vector3(-tan.z, 0, tan.x).normalize().multiplyScalar(2.6);
    const base = p.clone().add(side); base.y = heightAt(base.x, base.z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.1, .14, 2.4, 5), M.wood); post.position.copy(base).y += 1.2; g.add(post);
    const fl = new THREE.Mesh(new THREE.ConeGeometry(.28, .8, 6), flameMat); fl.position.copy(base).y += 2.7; g.add(fl);
    flames.push(fl);
  }
  return g;
}

// ---------- the whole world ----------
export function buildWorld(scene) {
  scene.fog = new THREE.FogExp2(0x3a3150, .0036);
  const sky = buildSky(); scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xa9b8ff, 0x3a2e22, 1.5); scene.add(hemi);
  const moonLight = new THREE.DirectionalLight(0xc8d6ff, 2.4);
  moonLight.position.set(-50, 130, 90); moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  Object.assign(moonLight.shadow.camera, { left: -110, right: 110, top: 70, bottom: -70, near: 10, far: 400 });
  moonLight.shadow.bias = -.0008; scene.add(moonLight);

  scene.add(buildTerrain());
  const road = buildRoad(); scene.add(road.mesh);
  const castleA = buildCastle('a', 0); castleA.position.copy(CASTLE_A); scene.add(castleA);
  const castleB = buildCastle('b', Math.PI); castleB.position.copy(CASTLE_B); scene.add(castleB);
  const city = buildCity(); scene.add(city);
  scene.add(buildTrees(road));
  scene.add(buildTorches(road));

  const world = { scene, sky, hemi, moonLight, road, castleA, castleB, city, time: 0, dawn: 0 };
  world.update = (dt, t) => update(world, dt, t);
  world.setDawn = v => setDawn(world, v);
  world.inBeam = p => inBeam(world, p);
  world.setBeam = on => { city.userData.pivot.visible = city.userData.spot.visible = on; };
  world.aimBeam = a => aimBeam(city.userData, a);
  world.BEAM = BEAM; world.gaze = gaze;   // for tests/beam_odds.py
  world.aimBeam(0);
  return world;
}

const nightTop = new THREE.Color(0x0a0f2c), nightHor = new THREE.Color(0xd9734f), dayTop = new THREE.Color(0x2f6cc0), dayHor = new THREE.Color(0xff9a5c);
const nightFog = new THREE.Color(0x3a3150), dayFog = new THREE.Color(0x8d93a8);
function setDawn(w, v) {
  w.dawn = v;
  const u = w.sky.userData.uniforms;
  u.top.value.copy(nightTop).lerp(dayTop, v); u.horizon.value.copy(nightHor).lerp(dayHor, v); u.glow.value = v * 2.5;
  w.sky.userData.stars.material.opacity = .85 * (1 - v);
  w.scene.fog.color.copy(nightFog).lerp(dayFog, v);
  w.moonLight.color.set(0xbfd0ff).lerp(new THREE.Color(0xffd7a8), v);
  w.moonLight.intensity = 2.4 + v * .5;
  w.moonLight.position.set(-50 + v * 110, 130 - v * 60, 90 - v * 20);
  w.hemi.intensity = 1.5 + v * .2;
}

function update(w, dt, t) {
  for (const f of flags) {
    const pos = f.geo.attributes.position, b = f.base;
    for (let i = 0; i < pos.count; i++) {
      const x = b[i * 3], y = b[i * 3 + 1], k = x / f.w;
      pos.setZ(i, Math.sin(x * 1.6 - t * 4.5 + f.phase) * .45 * k + Math.sin(y * 2 + t * 3) * .08 * k);
      pos.setY(i, y - k * k * .25);
    }
    pos.needsUpdate = true; f.geo.computeVertexNormals();
  }
  for (let i = 0; i < flames.length; i++) {
    const s = 1 + Math.sin(t * 13 + i * 2.1) * .15 + Math.sin(t * 7.3 + i) * .1;
    flames[i].scale.set(1, s, 1);
  }
  const c = w.city.userData;
  aimBeam(c, gaze(t));
  c.fireLight.intensity = 55 + Math.sin(t * 11) * 8 + Math.sin(t * 17.3) * 6;
  c.eye.userData.halo.material.rotation = Math.sin(t * 2) * .1;
  c.eye.userData.halo.scale.set(9 + Math.sin(t * 9) * .6, 11 + Math.sin(t * 7.3) * .8, 1);
}
