// The objects of the story, built from primitives: the sticks (each scytale's diameter is
// set by how many letters fit around it), the cradles they rest on, the stylus, and the characters.
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

// A character, about 3.2 tall, facing +z. kind: 'a' Alice, 'b' Bob, 'e' Eve, 'n' the courier.
export function person(kind) {
  const g = new THREE.Group(), c = COLORS[kind];
  const cloth = mat({ a: 0x2a5ea8, b: 0x6b4a2b, e: 0x7a1424, n: 0x8a6a3a }[kind]), skin = mat(0xf0c8a0);
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(.45, .85, 2.1, 10), cloth); robe.position.y = 1.05; robe.castShadow = true; g.add(robe);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.42, 16, 12), skin); head.position.y = 2.55; head.castShadow = true; g.add(head);
  for (const x of [-.14, .14]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), dark); eye.position.set(x, 2.6, .38); g.add(eye); }
  const arms = new THREE.Group(); arms.position.y = 1.8; g.add(arms);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .8, 4, 8), cloth);
    arm.position.set(s * .55, -.3, .15); arm.rotation.z = s * .35; arm.rotation.x = -.5; arms.add(arm);
  }
  if (kind === 'a') {          // Alice: blue scarf and a bun
    const hair = mat(0x6b3d1f);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.45, 16, 10, 0, Math.PI * 2, 0, Math.PI * .55), hair); cap.position.y = 2.6; cap.rotation.x = -.35; g.add(cap);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), hair); bun.position.set(0, 2.95, -.3); g.add(bun);
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(.4, .1, 8, 16), mat(c)); scarf.rotation.x = Math.PI / 2; scarf.position.y = 2.12; g.add(scarf);
  } else if (kind === 'b') {   // Bob: flat cap, a leather apron
    const capM = mat(0x3d2c1c);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .16, 16), capM); cap.position.y = 2.88; g.add(cap);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(.5, .05, .35), capM); brim.position.set(0, 2.82, .4); g.add(brim);
    const apron = new THREE.Mesh(new THREE.CylinderGeometry(.5, .86, 1.7, 10, 1, true, -.9, 1.8), mat(0x9b6a3a, { side: THREE.DoubleSide })); apron.position.y = .9; apron.scale.set(1.04, 1, 1.04); g.add(apron);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(.62, .06, 6, 20), mat(c, { metalness: .5 })); belt.rotation.x = Math.PI / 2; belt.position.y = 1.55; g.add(belt);
  } else if (kind === 'n') {   // the messenger: a traveller's broad hat
    const hat = mat(0x6b5330), crown = new THREE.Mesh(new THREE.CylinderGeometry(.3, .38, .28, 14), hat); crown.position.y = 2.98; g.add(crown);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, .05, 18), hat); brim.position.y = 2.86; g.add(brim);
  } else {                     // Eve: a spy's dark fedora with a red band, a black eye mask (r65: not a pointed hood)
    const felt = mat(0x2a2a30), hat = new THREE.Group(); hat.position.y = 2.86; hat.rotation.x = .12; g.add(hat);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(.74, .74, .05, 24), felt); brim.castShadow = true; hat.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(.31, .41, .36, 16), felt); crown.position.y = .19; crown.castShadow = true; hat.add(crown);
    const hatband = new THREE.Mesh(new THREE.CylinderGeometry(.415, .42, .1, 16), mat(0x9e1b2e)); hatband.position.y = .08; hat.add(hatband);
    const mask = new THREE.Mesh(new THREE.TorusGeometry(.42, .075, 6, 20, Math.PI), dark); mask.rotation.x = Math.PI / 2; mask.position.y = 2.6; g.add(mask);
    for (const x of [-.14, .14]) { const white = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), mat(0xfaf6ee)); white.position.set(x, 2.6, .45); g.add(white);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), dark); pupil.position.set(x, 2.6, .51); g.add(pupil); }
  }
  g.userData.head = head; g.userData.arms = arms;
  return g;
}
