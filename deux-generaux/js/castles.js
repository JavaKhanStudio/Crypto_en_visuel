// r192 PROTOTYPE, not wired into the episode: two castles in Middle-earth's manner, tried in
// lab/castles.html in place of buildCastle()'s twin keeps. Humans: a white city of tiers on its
// hill, a rock spur splitting it, a citadel tower and a white tree on top. Elves: no walls,
// slender towers with leaf spires, arches between them, a golden mallorn in the middle.
// Same contract as buildCastle(team, facing): the gate faces local +x, about 9 m out, where the
// road ends; userData { team, flag, glow }; the team colour sits on the flag, the roofs or spires
// and the ring of light at the foot, so the story's colour code (Alice blue, Bob gold) holds.
import * as THREE from 'three';
import { COLORS, M, flag } from './world.js';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .85, flatShading: true, ...o });
const glowMat = (color, k = 2.4) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: k });
const add = (g, geo, m, x = 0, y = 0, z = 0, shadow = true) => {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z);
  if (shadow) o.castShadow = o.receiveShadow = true;
  g.add(o); return o;
};
// count copies of geo, each placed by placer(i) -> [x, y, z, rotY, sx, sy, sz]
function many(g, geo, m, count, placer, shadow = true) {
  const im = new THREE.InstancedMesh(geo, m, count), o = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const [x, y, z, ry = 0, sx = 1, sy = 1, sz = 1] = placer(i);
    o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.set(sx, sy, sz); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
  }
  im.castShadow = shadow; im.receiveShadow = true; g.add(im); return im;
}
function ring(g, color, r) {
  const glow = new THREE.Mesh(new THREE.TorusGeometry(r, .12, 6, 64), new THREE.MeshBasicMaterial({ color }));
  glow.rotation.x = Math.PI / 2; glow.position.y = .15; g.add(glow); return glow;
}

// ---------- humans: the white city ----------
const WHITE = mat(0xece7dc), WHITE_TRIM = mat(0xc4beb1), SLATE = mat(0x4b5463, { roughness: .7 });
const SILVER = mat(0xdfe5ee, { metalness: .8, roughness: .3 });
const ROCK = mat(0xa8a398, { roughness: 1 });
const TIERS = [{ r: 9.2, top: 3.4 }, { r: 7.2, top: 6.2 }, { r: 5.3, top: 9 }, { r: 3.5, top: 11.8 }];

export function buildHumanCastle(team, facing) {
  const color = COLORS[team], g = new THREE.Group(), roof = M.roof(color);
  // the tiers, each a ring wall with its merlons; the first one reaches down so the slope never shows under it
  TIERS.forEach(({ r, top }, i) => {
    const base = i ? TIERS[i - 1].top : -4;
    add(g, new THREE.CylinderGeometry(r, r * 1.02, top - base, 36), WHITE, 0, (top + base) / 2, 0);
    add(g, new THREE.CylinderGeometry(r * 1.03, r * 1.03, .35, 36), WHITE_TRIM, 0, top - .2, 0);
    const n = Math.round(r * 5.4);
    many(g, new THREE.BoxGeometry(.5, .7, .4), WHITE_TRIM, n, k => { const a = k / n * Math.PI * 2; return [Math.cos(a) * r * 1.02, top + .3, Math.sin(a) * r * 1.02, -a]; });
    // lit windows on the wall face, none behind the spur
    const w = Math.round(r * 2.2);
    many(g, new THREE.BoxGeometry(.12, .55, .3), M.window, w, k => { const a = (k + .5) / w * Math.PI * 2 + .3; return [Math.cos(a) * r * 1.005, top - 1.3, Math.sin(a) * r * 1.005, -a]; }, false);
    // houses on the terrace inside this wall, slate roofs
    if (i < TIERS.length - 1) {
      const rr = (r + TIERS[i + 1].r) / 2, h = 22 - i * 5, sp = [];
      for (let k = 0; k < h; k++) { const a = k / h * Math.PI * 2 + i * .4; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) > .32) sp.push(a); }
      many(g, new THREE.BoxGeometry(1, 1.1, .9), WHITE, sp.length, k => [Math.cos(sp[k]) * rr, top + .55, Math.sin(sp[k]) * rr, -sp[k], 1, .8 + (k % 3) * .25, 1]);
      many(g, new THREE.ConeGeometry(.78, .7, 4), SLATE, sp.length, k => [Math.cos(sp[k]) * rr, top + 1.1 + (.8 + (k % 3) * .25) * 1.1 / 2 + .05, Math.sin(sp[k]) * rr, -sp[k] + Math.PI / 4]);
    }
  });
  // the spur: a prow of rock from the top tier down to the gate, splitting the tiers
  const prow = new THREE.Shape([[-1, -4], [8.6, -4], [8.6, 4.6], [5.6, 11.9], [-1, 11.9]].map(([x, y]) => new THREE.Vector2(x, y)));
  add(g, new THREE.ExtrudeGeometry(prow, { depth: 1.5, bevelEnabled: true, bevelThickness: .25, bevelSize: .25, bevelSegments: 1 }), ROCK, 0, 0, -.75);
  const cap = add(g, new THREE.BoxGeometry(6.9, .3, 2.1), WHITE_TRIM, 2.4, 12, 0);
  many(g, new THREE.BoxGeometry(.4, .6, .4), WHITE_TRIM, 10, k => [-.6 + (k >> 1) * 1.45, 12.45, (k % 2 ? 1 : -1) * .9]);
  // the gate in the first wall, under the prow, team banners either side
  add(g, new THREE.BoxGeometry(.5, 2.4, 2.2), M.gate, 9.15, 1.2, 0);
  const arch = add(g, new THREE.CylinderGeometry(1.1, 1.1, .52, 14, 1, false, 0, Math.PI), M.gate, 9.15, 2.4, 0);
  arch.rotation.z = Math.PI / 2; arch.rotation.y = Math.PI / 2;
  for (const z of [-1.9, 1.9]) {
    const b = add(g, new THREE.PlaneGeometry(.9, 2.2), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .25, side: THREE.DoubleSide }), 9.3, 2.1, z);
    b.rotation.y = Math.PI / 2;
  }
  // the citadel: a hall and the tall white tower, silver cap, team band, the flag on top
  const top = TIERS.at(-1).top;
  add(g, new THREE.BoxGeometry(2.6, 2, 1.8), WHITE, -1.2, top + 1, 1.3);
  add(g, new THREE.ConeGeometry(1.85, 1, 4), roof, -1.2, top + 2.5, 1.3).rotation.y = Math.PI / 4;
  const T = 10;
  add(g, new THREE.CylinderGeometry(.62, .85, T, 12), WHITE, -.6, top + T / 2, -1);
  add(g, new THREE.CylinderGeometry(.82, .82, .45, 12), roof, -.6, top + T * .72, -1);
  many(g, new THREE.BoxGeometry(.1, .7, .25), M.window, 4, k => { const a = k * Math.PI / 2; return [-.6 + Math.cos(a) * .7, top + T * .5 + (k % 2) * 1.6, -1 + Math.sin(a) * .7, -a]; }, false);
  add(g, new THREE.CylinderGeometry(.9, .9, .3, 12), WHITE_TRIM, -.6, top + T, -1);
  add(g, new THREE.ConeGeometry(.75, 3.2, 12), SILVER, -.6, top + T + 1.75, -1);
  const f = flag(color); f.position.set(-.6, top + T + 3.1, -1); f.scale.setScalar(.6); g.add(f);
  // the white tree in the court before the tower
  add(g, new THREE.CylinderGeometry(.08, .16, 1.6, 6), mat(0x5d5650), 1.6, top + .8, -.4);
  const bloom = new THREE.MeshStandardMaterial({ color: 0xf4f6ff, emissive: 0xdfe6ff, emissiveIntensity: .5, flatShading: true, roughness: .6 });
  many(g, new THREE.IcosahedronGeometry(.45, 0), bloom, 5, k => [1.6 + Math.cos(k * 1.3) * .35, top + 1.7 + (k % 2) * .3, -.4 + Math.sin(k * 1.3) * .35]);
  const glow = ring(g, color, 10.4);
  g.rotation.y = facing;
  g.userData = { team, flag: f, glow };
  return g;
}

// ---------- elves: towers in a wood ----------
const IVORY = mat(0xeee6d2, { roughness: .6 }), IVORY_TRIM = mat(0xcfc5ad, { roughness: .6 });
const BARK = mat(0xc9c8c0, { roughness: .9 }), GOLD_LEAF = new THREE.MeshStandardMaterial({ color: 0xf0c45a, emissive: 0x7a5410, emissiveIntensity: .45, roughness: .8, flatShading: true });
const STAR = glowMat(0xcfe8ff, 2.6);

// a leaf-shaped spire: swells, then draws to a long point
function spire(r, h, m) {
  const pts = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new THREE.Vector2(r * (.55 + .45 * Math.sin(Math.PI * Math.min(1, t * 2.2))) * Math.pow(1 - t, .9) + .001, t * h)); }
  pts.push(new THREE.Vector2(0, h));
  const o = new THREE.Mesh(new THREE.LatheGeometry(pts, 14), m); o.castShadow = true; return o;
}

function elfTower(g, x, z, h, r, roof) {
  const t = new THREE.Group(); t.position.set(x, 0, z); g.add(t);
  add(t, new THREE.CylinderGeometry(r * .8, r, h, 12), IVORY, 0, h / 2 - 1, 0);
  for (const y of [h * .55, h - 1]) add(t, new THREE.CylinderGeometry(r * 1.45, r * 1.1, .25, 16), IVORY_TRIM, 0, y, 0);
  many(t, new THREE.BoxGeometry(.08, .9, .22), STAR, 3, k => { const a = k / 3 * Math.PI * 2 + .5; return [Math.cos(a) * r * .86, h * .35 + k * h * .12, Math.sin(a) * r * .86, -a]; }, false);
  const s = spire(r * 1.05, r * 8, roof); s.position.y = h - .9; t.add(s);
  t.userData.tip = h - .9 + r * 8;
  return t;
}

export function buildElfCastle(team, facing) {
  const color = COLORS[team], g = new THREE.Group();
  const roof = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), .3), metalness: .55, roughness: .35, emissive: color, emissiveIntensity: .12, flatShading: true });
  // two low terraces, the upper one toward the back, a carved rim
  add(g, new THREE.CylinderGeometry(9.3, 9.6, 5.2, 40), IVORY_TRIM, 0, -2.6 + .9, 0);
  add(g, new THREE.CylinderGeometry(6.2, 6.4, 1.2, 36), IVORY, -2.4, 1.5, 0);
  many(g, new THREE.CylinderGeometry(.1, .1, .7, 6), IVORY, 48, k => { const a = k / 48 * Math.PI * 2; return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < .2 ? [0, -9, 0] : [Math.cos(a) * 9.1, 1.25, Math.sin(a) * 9.1]; });
  add(g, new THREE.TorusGeometry(9.1, .08, 4, 64, Math.PI * 2 - .5), IVORY, 0, 1.62, 0).rotation.set(Math.PI / 2, 0, .25);
  // the mallorn: silver trunk, a talan with lanterns, three storeys of golden leaves
  const tx = -2.4;
  add(g, new THREE.CylinderGeometry(.6, 1.5, 21, 10), BARK, tx, 10.5, 0);
  for (const [y, r] of [[8, 3.4], [13.5, 2.6]]) {
    add(g, new THREE.CylinderGeometry(r, r, .22, 24), IVORY_TRIM, tx, y, 0);
    many(g, new THREE.SphereGeometry(.13, 8, 6), STAR, 10, k => { const a = k / 10 * Math.PI * 2; return [tx + Math.cos(a) * r, y + .3, Math.sin(a) * r]; }, false);
  }
  // the crown in three flat storeys, as a mallorn holds its leaves, wide at the bottom
  const crown = [];
  for (const [y, R, n] of [[15.2, 5.2, 22], [18, 4, 16], [20.6, 2.6, 10]])
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + y, rr = R * (.45 + .55 * ((k * 7) % 5) / 4); crown.push([tx + Math.cos(a) * rr, y + ((k * 3) % 4) * .3, Math.sin(a) * rr, a, 1, .45, 1]); }
  many(g, new THREE.IcosahedronGeometry(1.25, 0), GOLD_LEAF, crown.length, k => crown[k]);
  for (const a of [.6, 2.5, 4.4]) {
    const b = add(g, new THREE.CylinderGeometry(.12, .3, 5, 6), BARK, tx + Math.cos(a) * 2, 15, Math.sin(a) * 2);
    b.rotation.set(Math.sin(a) * .9, 0, -Math.cos(a) * .9);
  }
  // five towers in a crescent toward the gate, arches between them
  const TW = [[ 1.2, 5.3, 9, .7], [ .55, 6.8, 12, .8], [0, 7.1, 14, .9], [-.55, 6.8, 12, .8], [-1.2, 5.3, 9, .7]]
    .map(([a, r, h, w]) => ({ x: Math.cos(a) * r + .4, z: Math.sin(a) * r * 1.15, h, w }));
  TW.forEach(t => { t.tip = elfTower(g, t.x, t.z, t.h, t.w, roof).userData.tip; });
  for (let i = 0; i < TW.length - 1; i++) {
    const p = TW[i], q = TW[i + 1], d = Math.hypot(q.x - p.x, q.z - p.z);
    const a = add(g, new THREE.TorusGeometry(d / 2, .14, 6, 20, Math.PI), IVORY_TRIM, (p.x + q.x) / 2, 4.2, (p.z + q.z) / 2);
    a.rotation.y = -Math.atan2(q.z - p.z, q.x - p.x);
  }
  // the gate: two slim pillars and a pointed arch, open, a lantern under its point
  const W = 1.7, SPRING = 4.9;
  for (const z of [-W, W]) add(g, new THREE.CylinderGeometry(.2, .26, 4, 8), IVORY, 9.2, SPRING - 2, z);
  for (const s of [-1, 1]) {
    // each half is an arc of radius 2W centred on the other pillar's top
    const arc = add(g, new THREE.TorusGeometry(2 * W, .13, 6, 10, Math.PI / 3), IVORY_TRIM, 9.2, SPRING, -s * W);
    arc.rotation.set(0, -Math.PI / 2, s > 0 ? 0 : Math.PI * 2 / 3);
  }
  add(g, new THREE.SphereGeometry(.22, 10, 8), STAR, 9.2, SPRING + 1.73 * W - .7, 0, false);
  // the flag on the tallest tower
  const top = TW[2], f = flag(color); f.position.set(top.x, top.tip - .4, top.z); f.scale.setScalar(.55); g.add(f);
  const glow = ring(g, color, 10.2);
  g.rotation.y = facing;
  g.userData = { team, flag: f, glow };
  return g;
}
