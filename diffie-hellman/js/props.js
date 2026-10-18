// The objects of the story, built from primitives: a paint pot whose paint can be poured,
// a wax seal, Bob's certificate, a chest with a hinged lid and a letter inside, and the characters.
import * as THREE from 'three';
import { colorOf } from './paint.js';

export const COLORS = { a: 0x4da3ff, b: 0xffc24d, e: 0xff3347 };

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, flatShading: true, ...o });
const steel = mat(0xc9ced8, { metalness: .9, roughness: .25, flatShading: false });
const gold = mat(0xffc24d, { metalness: .8, roughness: .3, flatShading: false, emissive: 0x8a5a00, emissiveIntensity: .5 });
const dark = mat(0x15110c, { roughness: 1 });

export const POT_H = 1.0, POT_R = .42;
// A paint pot, origin on its base. setPaint(recipe, level 0..1) fills it ('' = empty).
// userData.lip: the pouring edge, in the pot's frame. setSeal(null | 'bob' | 'fake').
export function pot() {
  const g = new THREE.Group();
  const tin = new THREE.Mesh(new THREE.CylinderGeometry(POT_R, POT_R * .92, POT_H, 24, 1, true), mat(0xd8dde6, { metalness: .6, roughness: .35, flatShading: false, side: THREE.DoubleSide }));
  tin.position.y = POT_H / 2; tin.castShadow = true; g.add(tin);
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(POT_R * .92, 24), steel); bottom.rotation.x = -Math.PI / 2; bottom.position.y = .02; g.add(bottom);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(POT_R, .035, 6, 28), steel); rim.rotation.x = Math.PI / 2; rim.position.y = POT_H; g.add(rim);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(POT_R * 1.02, .025, 6, 20, Math.PI), steel); handle.position.y = POT_H; handle.rotation.y = Math.PI / 2; g.add(handle);
  // a painted band around the tin shows the colour from afar, the paint surface from above
  const band = new THREE.Mesh(new THREE.CylinderGeometry(POT_R + .012, POT_R * .95 + .012, POT_H * .42, 24, 1, true), mat(0xffffff, { roughness: .5, flatShading: false }));
  band.position.y = POT_H * .45; g.add(band);
  const paintM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .25, metalness: 0 });
  const paint = new THREE.Mesh(new THREE.CircleGeometry(POT_R * .96, 24), paintM); paint.rotation.x = -Math.PI / 2; g.add(paint);
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .06, 20), gold); seal.rotation.x = Math.PI / 2; seal.position.set(0, POT_H * .5, POT_R + .04); g.add(seal);
  const star = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .03, 5), gold); star.rotation.x = Math.PI / 2; star.position.set(0, POT_H * .5, POT_R + .08); g.add(star);
  const fakeM = mat(0xb01828, { roughness: .5, flatShading: false });
  g.userData.lip = new THREE.Vector3(0, POT_H, POT_R);
  g.userData.setPaint = (recipe, level = g.userData.level ?? .8) => {
    g.userData.recipe = recipe; g.userData.level = recipe ? level : 0;
    const c = colorOf(recipe);
    paint.visible = band.visible = !!recipe;
    if (recipe) { paintM.color.copy(c); band.material.color.copy(c); }
    paint.position.y = .04 + (POT_H - .1) * g.userData.level;
  };
  // while paint is poured: show a passing colour and level without changing the recipe
  g.userData.showColor = c => { paintM.color.copy(c); band.material.color.copy(c); paint.visible = band.visible = true; };
  g.userData.showLevel = l => { paint.position.y = .04 + (POT_H - .1) * l; };
  g.userData.setSeal = kind => {
    seal.visible = star.visible = !!kind; seal.material = star.material = kind === 'fake' ? fakeM : gold; g.userData.seal = kind || null;
  };
  g.userData.setPaint('', 0); g.userData.setSeal(null);
  return g;
}

// Bob's certificate, as Alice's browser keeps it: a small framed plaque with his gold seal.
export function certificate() {
  const g = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.BoxGeometry(.9, 1.1, .08), mat(0xf3e6c4)); stand.position.y = .62; stand.rotation.x = -.18; g.add(stand);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.22, .05), mat(0x6b4426)); frame.position.set(0, .62, -.04); frame.rotation.x = -.18; g.add(frame);
  const s = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .05, 20), gold); s.rotation.x = Math.PI / 2 - .18; s.position.set(0, .5, .07); g.add(s);
  for (const y of [.95, .85, .75]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.6, .03, .01), dark); l.position.set(0, y, .06 - (y - .62) * .18); l.rotation.x = -.18; g.add(l); }
  g.traverse(o => o.isMesh && (o.castShadow = true));
  return g;
}

// A small chest that carries a message, its bands glowing with the colour that locks it.
// Origin on its base. setLid(0..1), setBand(recipe).
export function chest() {
  const g = new THREE.Group();
  const wood = mat(0x8a5a32), bandM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .4, emissive: 0xffffff, emissiveIntensity: .35 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(2, .9, 1.3), wood); base.position.y = .45; base.castShadow = base.receiveShadow = true; g.add(base);
  for (const x of [-.75, .75]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.14, .92, 1.34), bandM); b.position.set(x, .45, 0); g.add(b); }
  const hinge = new THREE.Group(); hinge.position.set(0, .9, -.65); g.add(hinge);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(.65, .65, 2, 16, 1, false, 0, Math.PI), wood);
  lid.rotation.z = Math.PI / 2; lid.position.z = .65; lid.castShadow = true; hinge.add(lid);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.3), mat(0x5b3a20, { side: THREE.DoubleSide })); under.rotation.x = Math.PI / 2; under.position.z = .65; hinge.add(under);
  for (const x of [-.75, .75]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.67, .67, .14, 16, 1, false, 0, Math.PI), bandM);
    b.rotation.z = Math.PI / 2; b.position.set(x, 0, .65); hinge.add(b);
  }
  const letter = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0xfff2d0, emissive: 0xffd88a, emissiveIntensity: 0 }));
  letter.rotation.z = Math.PI / 2; letter.position.y = .75; g.add(letter);
  const ribbon = new THREE.Mesh(new THREE.TorusGeometry(.15, .03, 6, 14), mat(0xd11f35)); ribbon.rotation.y = Math.PI / 2; ribbon.position.y = .75; g.add(ribbon);
  g.userData.setLid = v => { hinge.rotation.x = -v * 1.9; letter.material.emissiveIntensity = v * .5; letter.position.y = .75 + v * .55; ribbon.position.y = letter.position.y; g.userData.lid = v; };
  g.userData.setBand = recipe => { const c = colorOf(recipe); bandM.color.copy(c); bandM.emissive.copy(c); g.userData.band = recipe; };
  g.userData.setLid(0); g.userData.setBand('J');
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
  } else if (kind === 'b') {   // Bob: flat cap, painter's apron
    const capM = mat(0x3d2c1c);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .16, 16), capM); cap.position.y = 2.88; g.add(cap);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(.5, .05, .35), capM); brim.position.set(0, 2.82, .4); g.add(brim);
    const apron = new THREE.Mesh(new THREE.CylinderGeometry(.5, .86, 1.7, 10, 1, true, -.9, 1.8), mat(0x9b6a3a, { side: THREE.DoubleSide })); apron.position.y = .9; apron.scale.set(1.04, 1, 1.04); g.add(apron);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(.62, .06, 6, 20), mat(c, { metalness: .5 })); belt.rotation.x = Math.PI / 2; belt.position.y = 1.55; g.add(belt);
  } else if (kind === 'n') {   // the courier: a postman's cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.4, .44, .3, 14), mat(0x2f3a2e)); cap.position.y = 2.9; g.add(cap);
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
