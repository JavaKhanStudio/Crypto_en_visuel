// The objects of the story, built from primitives: a padlock whose shackle opens,
// a key, a chest with a hinged lid and a letter inside, and the three characters.
import * as THREE from 'three';

export const COLORS = { a: 0x4da3ff, b: 0xffc24d, e: 0xff3347 };

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, flatShading: true, ...o });
const brass = c => mat(c, { metalness: .75, roughness: .32, flatShading: false });
const steel = mat(0xc9ced8, { metalness: .9, roughness: .25, flatShading: false });
const dark = mat(0x15110c, { roughness: 1 });

// A rounded rectangle, extruded: the padlock's body.
function roundedBlock(w, h, d, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: .05, bevelThickness: .05, bevelSegments: 3, curveSegments: 8 });
  g.translate(0, 0, -d / 2);
  return g;
}

// Padlock, about 1.3 tall. Its origin is the top of the body, where the shackle enters,
// so it hangs from a hasp. setOpen(0..1): 0 = snapped shut, 1 = lifted and swung open.
export function padlock(color = COLORS.b) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(roundedBlock(1, .82, .38, .14), brass(color));
  body.position.y = -.41; body.castShadow = true; g.add(body);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(.09, 16), dark); hole.position.set(0, -.36, .25); g.add(hole);
  const slot = new THREE.Mesh(new THREE.PlaneGeometry(.07, .2), dark); slot.position.set(0, -.5, .25); g.add(slot);
  // the shackle pivots on its left leg
  const pivot = new THREE.Group(); pivot.position.x = -.3; g.add(pivot);
  const r = .3, tube = .075, leg = .34;
  const arch = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 24, Math.PI), steel);
  arch.position.set(r, leg, 0); pivot.add(arch);
  for (const x of [0, 2 * r]) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(tube, tube, leg + .12, 10), steel);
    l.position.set(x, leg / 2 - .06, 0); pivot.add(l);
  }
  g.userData.setOpen = v => { pivot.position.y = .28 * Math.min(1, v * 2); pivot.rotation.y = Math.max(0, v * 2 - 1) * 1.9; g.userData.open = v; };
  g.userData.setOpen(1);
  g.userData.body = body;
  return g;
}

// A key, about 1.2 long, lying along +x. glow makes it shine (Bob's one key).
export function key(color = COLORS.b, glow = 0) {
  const m = brass(color); if (glow) { m.emissive = new THREE.Color(color); m.emissiveIntensity = glow; }
  const g = new THREE.Group();
  const bow = new THREE.Mesh(new THREE.TorusGeometry(.2, .07, 8, 20), m); bow.position.x = -.4; g.add(bow);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .8, 8), m); shaft.rotation.z = Math.PI / 2; shaft.position.x = .2; g.add(shaft);
  for (const [x, h] of [[.42, .18], [.54, .12], [.3, .1]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(.07, h, .06), m); b.position.set(x, -h / 2 - .03, 0); g.add(b);
  }
  g.traverse(o => o.isMesh && (o.castShadow = true));
  return g;
}

// The chest Alice sends. 2 wide; origin on its base. The padlock hangs from the hasp
// (userData.hasp, a point in the chest's frame). setLid(0..1) opens it; the letter glows inside.
export function chest() {
  const g = new THREE.Group();
  const wood = mat(0x8a5a32), band = mat(0x4b3626, { roughness: .8 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(2, .9, 1.3), wood); base.position.y = .45; base.castShadow = base.receiveShadow = true; g.add(base);
  for (const x of [-.75, .75]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.12, .92, 1.34), band); b.position.set(x, .45, 0); g.add(b); }
  const hinge = new THREE.Group(); hinge.position.set(0, .9, -.65); g.add(hinge);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(.65, .65, 2, 16, 1, false, 0, Math.PI), wood);
  lid.rotation.z = Math.PI / 2; lid.position.z = .65; lid.castShadow = true; hinge.add(lid);
  // lid underside, so an open chest is not hollow-looking
  const under = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.3), mat(0x5b3a20, { side: THREE.DoubleSide })); under.rotation.x = Math.PI / 2; under.position.z = .65; hinge.add(under);
  for (const x of [-.75, .75]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.67, .67, .12, 16, 1, false, 0, Math.PI), band);
    b.rotation.z = Math.PI / 2; b.position.set(x, 0, .65); hinge.add(b);
  }
  const plate = new THREE.Mesh(new THREE.BoxGeometry(.3, .32, .06), steel); plate.position.set(0, .2, 1.32); hinge.add(plate);
  const staple = new THREE.Mesh(new THREE.TorusGeometry(.1, .035, 6, 14), steel); staple.position.set(0, .78, .68); g.add(staple);
  // the letter
  const letter = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0xfff2d0, emissive: 0xffd88a, emissiveIntensity: .0 }));
  letter.rotation.z = Math.PI / 2; letter.position.y = .75; g.add(letter);
  const ribbon = new THREE.Mesh(new THREE.TorusGeometry(.15, .03, 6, 14), mat(0xd11f35)); ribbon.rotation.y = Math.PI / 2; ribbon.position.y = .75; g.add(ribbon);
  g.userData.hasp = new THREE.Vector3(0, .9, .72);
  g.userData.setLid = v => { hinge.rotation.x = -v * 1.9; plate.visible = true; letter.material.emissiveIntensity = v * .5; letter.position.y = .75 + v * .35; ribbon.position.y = letter.position.y; g.userData.lid = v; };
  g.userData.setLid(0);
  return g;
}

// A character, about 3.2 tall, facing +z. kind: 'a' Alice, 'b' Bob, 'e' Eve, 'n' the courier.
export function person(kind) {
  const g = new THREE.Group(), c = COLORS[kind];
  const cloth = mat({ a: 0x2a5ea8, b: 0x6b4a2b, e: 0x7a1424, n: 0x5d6b5a }[kind]), skin = mat(0xf0c8a0);
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
  } else if (kind === 'b') {   // Bob: flat cap, leather apron, his key on the belt
    const capM = mat(0x3d2c1c);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .16, 16), capM); cap.position.y = 2.88; g.add(cap);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(.5, .05, .35), capM); brim.position.set(0, 2.82, .4); g.add(brim);
    const apron = new THREE.Mesh(new THREE.CylinderGeometry(.5, .86, 1.7, 10, 1, true, -.9, 1.8), mat(0x9b6a3a, { side: THREE.DoubleSide })); apron.position.y = .9; apron.scale.set(1.04, 1, 1.04); g.add(apron);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(.62, .06, 6, 20), mat(c, { metalness: .5 })); belt.rotation.x = Math.PI / 2; belt.position.y = 1.55; g.add(belt);
  } else if (kind === 'n') {   // the courier: a postman's cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.4, .44, .3, 14), mat(0x2f3a2e)); cap.position.y = 2.9; g.add(cap);
  } else {                     // Eve: a deep red hood
    const hood = new THREE.Mesh(new THREE.ConeGeometry(.62, 1.3, 12, 1, true), mat(0x9e1b2e, { side: THREE.DoubleSide })); hood.position.y = 2.85; g.add(hood);
    const mask = new THREE.Mesh(new THREE.TorusGeometry(.4, .06, 6, 16, Math.PI), dark); mask.position.set(0, 2.62, .05); g.add(mask);
  }
  g.userData.head = head; g.userData.arms = arms;
  return g;
}
