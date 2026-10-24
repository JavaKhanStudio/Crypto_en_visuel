// The objects of the story, built from primitives: the sticks (each scytale's diameter is
// set by how many letters fit around it), the cradles they rest on, the stylus. The characters are lib/cast.js's (r636), in its Roman disguise.
// The leather strip itself is in strip.js.
import * as THREE from 'three';

export const COLORS = { a: 0x4da3ff, b: 0xffc24d, e: 0xff3347 };

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, flatShading: true, ...o });
const dark = mat(0x15110c, { roughness: 1 });

// The strip's measures: S along the strip per letter, W its width (and so the step along the stick
// from one turn to the next). A stick of k letters per turn has one turn = k * S of strip.
export const S = .45, W = .42, STICK_L = 5.6;
export const radiusFor = k => Math.sqrt(Math.max(.01, (k * S) ** 2 - W * W)) / (2 * Math.PI);

// A scytale: a wooden stick along x, centred on its origin, knobs at both ends, a few dark grooves
// so its turning shows. setK(k) gives it the diameter that takes k letters per turn.
// userData.phi: how far it has turned (the strip wound on it turns with it).
export function stick(k, tint = 0x9a6a3c) {
  const g = new THREE.Group(), wood = mat(tint, { roughness: .75 });
  const body = new THREE.Group(); g.add(body);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, STICK_L, 14), wood); rod.rotation.z = Math.PI / 2; rod.castShadow = true; body.add(rod);
  const grooves = [];
  for (let i = 0; i < 3; i++) {
    const gr = new THREE.Mesh(new THREE.BoxGeometry(STICK_L * .98, .04, .04), dark); body.add(gr); grooves.push([gr, i / 3 * Math.PI * 2 + .5]);
  }
  const knobs = [-1, 1].map(s => { const n = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), wood); n.position.x = s * STICK_L / 2; n.castShadow = true; body.add(n); return n; });
  g.userData.setK = kk => {
    const r = radiusFor(kk); g.userData.k = kk; g.userData.r = r;
    rod.scale.set(r, 1, r);
    for (const [gr, a] of grooves) gr.position.set(0, Math.sin(a) * r, Math.cos(a) * r);
    for (const n of knobs) n.scale.setScalar(r * 1.35);
  };
  g.userData.setPhi = phi => { g.userData.phi = phi; body.rotation.x = -phi; };
  g.userData.setK(k); g.userData.setPhi(0);
  return g;
}

// Two little forked stands that hold a stick above the table, so it can turn.
export function cradles(h) {
  const g = new THREE.Group(), m = mat(0x5a3a20);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(.18, h, .3), m); post.position.set(s * (STICK_L / 2 - .25), h / 2, 0); post.castShadow = true; g.add(post);
    for (const z of [-.2, .2]) { const f = new THREE.Mesh(new THREE.BoxGeometry(.18, .35, .08), m); f.position.set(s * (STICK_L / 2 - .25), h + .1, z); g.add(f); }
  }
  return g;
}

// A bronze stylus, its tip at the origin, its body leaning back toward +y.
export function stylus() {
  const g = new THREE.Group(), bronze = mat(0xc08a3e, { metalness: .7, roughness: .35, flatShading: false });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.035, .05, 1.3, 8), bronze); body.position.y = .75; g.add(body);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(.05, .14, 8), bronze); tip.rotation.x = Math.PI; tip.position.y = .07; g.add(tip);
  const end = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), bronze); end.position.y = 1.42; g.add(end);
  g.traverse(o => o.isMesh && (o.castShadow = true));
  return g;
}
