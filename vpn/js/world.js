// A small map, one unit = one metre: a town with its café (Alice and Eve at the terrace, the café's
// Wi-Fi box on the wall) and its internet provider's server hall, Bob's site at the east end, and in
// another town, up the valley to the north-west, the VPN's server hall. The halls have no roof (r360):
// from above, the rows of racks inside show; the packet's stop is the front rack, by the door. Cables on poles join them:
// café → provider, provider → Bob, provider → VPN, VPN → Bob. Built from primitives, except the
// servers and the laptops, which are Shadow's (assets/shapes, through lib/shapes.js).
import * as THREE from 'three';
import { loadShape } from '../../lib/shapes.js';
import { router, table, cup, building, hall, awning, pole, house, TABLE_Y } from './props.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const CABLE_Y = 4.2;
// the two server halls, roofless (r360): centre and size; the packet's stop (NODES.i, NODES.v) is over
// the middle of the front row of racks, just inside the front wall, and Victor stands before that row
export const HALL_H = 2;
export const HALLS = {
  i: { x: -6, z: -11.5, w: 14, d: 12, rows: [-8, -10.4, -12.8, -15.2] },
  v: { x: -14, z: -35.2, w: 12, d: 10.4, rows: [-33, -35.4, -37.8] },
};

// where things stand
export const SPOTS = {
  cafe: v(-36, 0, -8), isp: v(-6, 0, -13), vpn: v(-14, 0, -38), bob: v(34, 0, -4),
  tableA: v(-38.6, 0, -1.6), tableE: v(-33.6, 0, -1.2),
};
// step 12 (r367): three of Victor's other customers, each at the door of a house of his town, a laptop in
// hand; net.js OTHERS[k] is the one at CUSTOMERS[k]
export const CUSTOMERS = [
  { at: v(-25.7, 0, -28.6), cloth: 0x8a5a9e },
  { at: v(-1, 0, -31.6), cloth: 0xb0612e },
  { at: v(-5.6, 0, -39.6), cloth: 0x3f7f8c },
];
// the packet's stops: Alice's laptop, the Wi-Fi box, the provider's racks, the VPN's racks, Bob's server
export const NODES = {
  a: v(-38.6, TABLE_Y + .5, -1.3), w: v(-36, 3.25, -3.85),
  i: v(-6, 2.3, -7.1), v: v(-14, 2.3, -32.1), b: v(32.3, 1.6, 0),
};
// each cable, pole top to pole top; the Wi-Fi hop from the laptop is a curve through the air
const P = (x, z) => v(x, CABLE_Y, z);
const LINES = {
  wi: [NODES.w, v(-35, CABLE_Y, -3.2), P(-28, -3.6), P(-20, -4.4), P(-12, -5.6), v(-6.8, CABLE_Y, -6.8), NODES.i],
  ib: [NODES.i, v(-5.2, CABLE_Y, -6.8), P(2, -5.8), P(10, -4.6), P(18, -3.2), P(26, -2), v(31.4, CABLE_Y, -.6), NODES.b],
  // round the provider's west wall, along the valley road, not through the building
  iv: [NODES.i, v(-6.8, CABLE_Y, -6.4), P(-13.8, -6.6), P(-13.8, -14), P(-13.8, -21), P(-13.8, -27), v(-13.8, CABLE_Y, -31.2), NODES.v],
  vb: [NODES.v, v(-13, CABLE_Y, -31.6), P(-6, -30), P(4, -27), P(14, -22), P(24, -15), P(31, -8), v(33, CABLE_Y, -1), NODES.b],
};
export const EDGES = {};
for (const [k, pts] of Object.entries(LINES)) EDGES[k] = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
EDGES.aw = new THREE.QuadraticBezierCurve3(NODES.a.clone(), v(-37.6, 4.2, -2.2), NODES.w.clone());
// the edge from one stop to the next, and whether it runs backwards
export function edge(from, to) {
  const k = from + to, r = to + from;
  return EDGES[k] ? { curve: EDGES[k], back: false } : { curve: EDGES[r], back: true };
}

// ---------- ground ----------
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
function fbm(x, z) { let s = 0, amp = .5, f = 1; for (let i = 0; i < 5; i++) { s += amp * noise(x * f, z * f); f *= 2; amp *= .5; } return s; }
// flat where the map is, hills beyond it
export function heightAt(x, z) {
  const r = Math.hypot((x - 2) * .8, z + 14);
  return r < 62 ? 0 : Math.min((r - 62) ** 2 * .02, 34) * (.5 + fbm(x * .04, z * .04));
}
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .9, flatShading: true, ...o });

function buildTerrain() {
  const g = new THREE.PlaneGeometry(420, 420, 150, 150); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, colors = [], grass = new THREE.Color(0x5f8a3a), grass2 = new THREE.Color(0x86a04a), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i); pos.setY(i, heightAt(x, z));
    c.copy(grass).lerp(grass2, fbm(x * .05, z * .05)); colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95 }));
  m.receiveShadow = true; return m;
}
// streets: a paved band under each town, a road from one to the other
function buildStreets() {
  const g = new THREE.Group(), asphalt = mat(0x5a5d63, { polygonOffset: true, polygonOffsetFactor: -2 }), pave = mat(0xb9ad98, { polygonOffset: true, polygonOffsetFactor: -3 });
  const strip = (x0, z0, x1, z1, w, m) => {
    const len = Math.hypot(x1 - x0, z1 - z0), s = new THREE.Mesh(new THREE.PlaneGeometry(len, w), m);
    s.rotation.x = -Math.PI / 2; s.rotation.z = -Math.atan2(z1 - z0, x1 - x0); s.position.set((x0 + x1) / 2, .02, (z0 + z1) / 2); s.receiveShadow = true; g.add(s);
  };
  strip(-52, 3.2, 44, 3.2, 5, asphalt);              // the main street, in front of the café, the provider and Bob
  // up the valley to the other town: between the street's houses and the provider's west wall, to the VPN's forecourt (r197)
  strip(-16.6, 1, -16.6, -29.6, 4, asphalt);
  strip(-42, -.4, -30, -.4, 5.8, pave);              // the café's terrace
  return g;
}
function buildSky() {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec3 vP;
      void main(){ float h = clamp(vP.y, -.1, 1.); vec3 c = mix(vec3(.96, .82, .66), vec3(.30, .48, .80), pow(smoothstep(-.05, .6, h), .7));
        vec3 sd = normalize(vec3(-.6, .25, -.75)); c += vec3(1., .85, .6) * pow(max(dot(vP, sd), 0.), 8.) * .3;
        gl_FragColor = vec4(c, 1.); }`,
  }));
  return sky;
}
function buildTrees() {
  const n = 160, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.16, .26, 1, 5), mat(0x6b4426), n);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: .9 }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  let placed = 0, seed = 7, tries = 0;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  while (placed < n && tries++ < 20000) {
    const x = (rnd() - .5) * 240, z = (rnd() - .5) * 200, y = heightAt(x, z);
    if (y > 20) continue;
    if (x > -58 && x < 50 && z > -46 && z < 14) {       // the map stays clear
      continue;
    }
    const s = .9 + rnd() * 1.2;
    m.compose(v(x, y + .7 * s, z), q, v(s, 1.4 * s, s)); trunk.setMatrixAt(placed, m);
    m.compose(v(x, y + 2.6 * s, z), q, v(2 * s, 1.8 * s, 2 * s)); crown.setMatrixAt(placed, m);
    crown.setColorAt(placed, col.setHSL(.26 + rnd() * .06, .42, .26 + rnd() * .1)); placed++;
  }
  trunk.count = crown.count = placed; crown.castShadow = true;
  const g = new THREE.Group(); g.add(trunk, crown); return g;
}

// a cable along a line, with its poles (not at its two ends, where it meets a wall or a rack)
function buildCable(curve, pts) {
  const g = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, .05, 6), new THREE.MeshStandardMaterial({ color: 0x1d2128, roughness: .6, emissive: 0x16304a, emissiveIntensity: .5 }));
  tube.castShadow = true; g.add(tube); g.userData.tube = tube;
  // no pole right in front of a rack or a box: the cable leaves it in the air
  const near = p => Object.values(NODES).some(n => Math.hypot(n.x - p.x, n.z - p.z) < 3);
  for (const p of pts.slice(1, -1)) if (Math.abs(p.y - CABLE_Y) < .01 && !near(p)) { const q = pole(CABLE_Y); q.position.set(p.x, 0, p.z); g.add(q); }
  return g;
}

// the Wi-Fi: rings that leave the box and spread over the terrace
function buildWaves() {
  const g = new THREE.Group(), rings = [];
  for (let i = 0; i < 4; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1, .03, 6, 40, Math.PI * .8), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, depthWrite: false }));
    r.rotation.set(Math.PI / 2 + .5, 0, -Math.PI * .9); r.position.copy(NODES.w); g.add(r); rings.push(r);
  }
  g.userData.update = time => rings.forEach((r, i) => {
    const k = (time * .45 + i / rings.length) % 1; r.scale.setScalar(.4 + k * 6); r.material.opacity = (1 - k) * .55;
  });
  return g;
}

const solid = o => { o.userData.solid = true; return o; };
// many copies of a shape at the given spots: one InstancedMesh per mesh of the shape
function instanced(shape, spots) {
  const g = new THREE.Group(), m = new THREE.Matrix4();
  shape.updateMatrixWorld(true);
  shape.traverse(o => {
    if (!o.isMesh) return;
    const im = new THREE.InstancedMesh(o.geometry, o.material, spots.length);
    spots.forEach((p, k) => im.setMatrixAt(k, m.makeTranslation(p.x, p.y, p.z).multiply(o.matrixWorld)));
    im.castShadow = true; im.receiveShadow = true; g.add(im);
  });
  return g;
}

export async function buildWorld(scene) {
  scene.fog = new THREE.FogExp2(0xd8d2c8, .0042);
  scene.add(buildSky());
  scene.add(new THREE.HemisphereLight(0xdde8ff, 0x5a5a40, 1.5));
  const sun = new THREE.DirectionalLight(0xffe6c0, 2.8);
  sun.position.set(-40, 70, 45); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 50, bottom: -50, near: 10, far: 240 });
  sun.shadow.bias = -.0005; scene.add(sun);
  scene.add(buildTerrain(), buildStreets(), buildTrees());

  // the café: its front at z = -4.5, the terrace before it, the Wi-Fi box over the door
  const cafe = building(11, 4.2, 7, 0xe9dcc4, { sign: 0x7a2e22 }); cafe.position.copy(SPOTS.cafe); scene.add(solid(cafe));
  const aw = awning(10); aw.position.set(SPOTS.cafe.x, 3.1, -3.4); scene.add(solid(aw));
  const box = router(); box.position.copy(NODES.w).add(v(0, -.08, 0)); scene.add(box);
  for (const k of ['tableA', 'tableE']) { const tb = table(); tb.position.copy(SPOTS[k]); scene.add(tb); }
  for (const k of ['tableA', 'tableE']) { const c = cup(); c.position.copy(SPOTS[k]).add(v(.25, TABLE_Y, .12)); scene.add(c); }
  // the provider's server hall, and the VPN's in the other town, with the town around it: no roof (r360)
  for (const [at, w, sign] of [[HALLS.i, 0x8c95a3, 0x2d5f9a], [HALLS.v, 0x7d8a7a, 0x1f5a3c]]) {
    const h = hall(at.w, at.d, HALL_H, w, sign); h.position.set(at.x, 0, at.z); scene.add(solid(h));
  }
  for (const [x, z, w, d, h, wall] of [[-27, -41, 5, 5, 3.4, 0xd9c8a8], [-25, -32, 4.5, 4, 3, 0xcbb894], [-3, -43, 6, 5, 3.6, 0xe0d2b4], [-1, -35, 4, 4, 3, 0xd2c29c]]) {
    const hs = house(w, d, h, wall, 0x8e3f2c); hs.position.set(x, 0, z); hs.rotation.y = (x + z) % 2 * .2; scene.add(solid(hs));
  }
  // Bob's site: a small office, its server out front
  const office = building(9, 4.4, 6, 0xd8cfbf, { sign: 0xb07d00 }); office.position.copy(SPOTS.bob); scene.add(solid(office));
  // houses along the main street, for a town
  for (const [x, z] of [[-50, -8], [-22, -9], [12, -9], [46, -6]]) { const hs = house(5, 5, 3.6, 0xe4d6bc, 0x7a3a2a); hs.position.set(x, 0, z); scene.add(solid(hs)); }

  const cables = {};   // each cable's tube, by edge ('wi', 'ib', 'iv', 'vb'): step 3 lights the one a box picks
  for (const [k, pts] of Object.entries(LINES)) { const c = buildCable(EDGES[k], pts); scene.add(c); cables[k] = c.userData.tube; }
  const waves = buildWaves(); scene.add(waves);

  // Shadow's items: racks at the provider and at the VPN, a tower at Bob's, a laptop on each table
  const [rack, tower, laptop] = await Promise.all(['server_rack', 'tower', 'laptop'].map(n => loadShape(`../assets/shapes/${n}.json`)));
  const shadows = o => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
  const items = { racks: [], fans: [], screens: [] };
  // in each hall, rows of racks across its width: the ones at the packet's stop are whole racks whose
  // fans turn, the rest one instanced mesh per part of Shadow's rack (a few draw calls for the lot)
  const crowd = [];
  for (const [k, n] of [['i', 4], ['v', 3]]) {
    const H = HALLS[k], at = NODES[k], span = H.w / 2 - .9;
    for (const z of H.rows) for (let x = H.x - span; x <= H.x + span + .01; x += .62) {
      const mid = z === H.rows[0] && Math.abs(x - at.x) < n * .31;
      if (Math.abs(x - H.x) < .25 && z !== H.rows[0]) continue;   // an aisle down the middle, from the door
      if (!mid) { crowd.push(v(x, 0, z)); continue; }
      const r = shadows(rack.clone()); r.position.set(x, 0, z); scene.add(r); items.racks.push(r);
      items.fans.push(r.getObjectByName('Fan'));
    }
  }
  scene.add(instanced(rack, crowd));
  const tw = shadows(tower.clone()); tw.position.set(NODES.b.x, 0, NODES.b.z - .4); scene.add(tw);
  const laptops = {};
  for (const [k, spot, turn] of [['a', SPOTS.tableA, .5], ['e', SPOTS.tableE, -.5]]) {
    const l = shadows(laptop.clone()); l.position.copy(spot).add(v(0, TABLE_Y, 0)); l.rotation.y = Math.PI + turn; l.scale.setScalar(.8); scene.add(l);
    laptops[k] = l; items.screens.push(l.getObjectByName('Screen'));
  }

  // the boxes a riding camera must stay over (the buildings, the awning, the halls' walls), r360
  scene.updateMatrixWorld(true);
  const obstacles = scene.children.filter(o => o.userData.solid).map(o => new THREE.Box3().setFromObject(o));
  const world = { scene, sun, laptops, items, router: box, cables, obstacles };
  world.update = (dt, time) => {
    waves.userData.update(time);
    box.userData.led.material.emissiveIntensity = 1.5 + Math.sin(time * 9) * 1.2;
    for (const f of items.fans) if (f) f.rotation.y += dt * 9;
    for (const s of items.screens) if (s) s.material.emissiveIntensity = 1.2 + Math.sin(time * 2) * .15;
  };
  return world;
}
