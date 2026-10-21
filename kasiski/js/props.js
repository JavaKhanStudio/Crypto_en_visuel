// The objects of the story, built from primitives: Alice's cart, drawn by a horse (a stone wedged
// under the iron tyre of its near front wheel), the key wheel (a five-sided drum, one key letter on
// each face, that tumbles face after face along the lane), the letter tiles, the floating tags, and the characters.
import * as THREE from 'three';

export const COLORS = { a: 0x4da3ff, b: 0xffc24d, e: 0xff3347 };

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, flatShading: true, ...o });
const dark = mat(0x15110c, { roughness: 1 });

// ---------- the cart ----------
// r252 (Simon): an old farm cart, drawn by a horse, Alice and Bob on its bench. Its near front wheel
// keeps the stone and the 2 m around: r = 2 / 2π = 0.318 m (the car's 205/55 R16 was 1.99 m).
export const WHEEL_R = 2 / (2 * Math.PI);
export const AXLES = { front: 1.32, back: -1.28 };   // along the cart, from its centre
export const TRACK_Z = .78;                          // half the distance between the left and right wheels
const BACK_R = .46;                                  // the back wheels are the bigger ones, as on a farm wagon

const wood = mat(0x8a5a32, { roughness: .85 }), woodDark = mat(0x5e3b1f, { roughness: .9 }), iron = mat(0x34363b, { metalness: .5, roughness: .5 });

// A wooden wheel with an iron tyre, turning about z. The near front one carries the stone: userData.stone.
function wheel(r, withStone) {
  const g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);
  const tyre = new THREE.Mesh(new THREE.TorusGeometry(r - .022, .03, 6, 32), iron); tyre.castShadow = true; spin.add(tyre);
  const felloe = new THREE.Mesh(new THREE.TorusGeometry(r - .075, .042, 6, 24), wood); spin.add(felloe);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.075, .085, .24, 10), woodDark); hub.rotation.x = Math.PI / 2; spin.add(hub);
  // spokes, so the turning shows
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2, sp = new THREE.Mesh(new THREE.BoxGeometry(r - .1, .035, .035), wood);
    sp.position.set(Math.cos(a) * (r - .02) / 2, Math.sin(a) * (r - .02) / 2, 0); sp.rotation.z = a; spin.add(sp);
  }
  if (withStone) {
    // the stone, wedged under the iron tyre at the bottom when the wheel's angle is 0; a little larger than life, and pale, to be seen
    const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(.095, 0), mat(0xf4ecd8, { roughness: .8, emissive: 0x6a5a30, emissiveIntensity: .8 }));
    stone.position.set(0, -WHEEL_R - .02, .05); stone.castShadow = true; spin.add(stone);   // on the road side of the tyre
    g.userData.stone = stone;
  }
  g.userData.spin = spin;
  return g;
}

// The horse, facing +x, hooves at y = 0, its shoulder at x = 0. userData.walk(d): its legs trot with the distance.
function horse() {
  const g = new THREE.Group(), coat = mat(0x7a4a2a, { roughness: .8 }), hair = mat(0x2a1a10, { roughness: .9 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.36, 1.15, 4, 10), coat); body.rotation.z = Math.PI / 2; body.position.set(-.55, 1.3, 0); body.castShadow = true; g.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.17, .27, .9, 8), coat); neck.position.set(.25, 1.75, 0); neck.rotation.z = -.62; neck.castShadow = true; g.add(neck);
  const head = new THREE.Group(); head.position.set(.62, 2.1, 0); g.add(head);
  const skull = new THREE.Mesh(new THREE.BoxGeometry(.62, .26, .24), coat); skull.position.set(.2, -.08, 0); skull.rotation.z = -.55; skull.castShadow = true; head.add(skull);
  for (const z of [-.07, .07]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(.045, .16, 5), coat); ear.position.set(-.03, .14, z); head.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 5), dark); eye.position.set(.06, .0, z * 1.75); head.add(eye); }
  const mane = new THREE.Mesh(new THREE.BoxGeometry(.1, .85, .07), hair); mane.position.set(.1, 1.86, 0); mane.rotation.z = -.62; g.add(mane);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.09, .75, 6), hair); tail.position.set(-1.33, 1.05, 0); tail.rotation.z = -.35; g.add(tail);
  // the collar the shafts are hitched to
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.27, .055, 6, 14), mat(0x3a2414)); collar.position.set(.08, 1.52, 0);
  collar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(Math.sin(.62), Math.cos(.62), 0)); g.add(collar);   // round the neck
  const legs = [];
  for (const [x, z, ph] of [[-.05, .17, 0], [-.05, -.17, Math.PI], [-1.08, .17, Math.PI], [-1.08, -.17, 0]]) {   // a trot: diagonal pairs together
    const hip = new THREE.Group(); hip.position.set(x, 1.12, z); g.add(hip);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.075, .055, 1.06, 6), coat); leg.position.y = -.53; leg.castShadow = true; hip.add(leg);
    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, .08, 6), hair); hoof.position.y = -1.08; hip.add(hoof);
    legs.push([hip, ph]);
  }
  g.userData.walk = d => { const t = d / 1.1 * Math.PI; for (const [hip, ph] of legs) hip.rotation.z = Math.sin(t + ph) * .35; head.rotation.z = Math.sin(t * 2) * .04; };
  return g;
}

// An old farm cart drawn by a horse, facing +x, its wheels on the ground at y = 0. userData.roll(d):
// the cart has moved d metres from where its stone touched the ground, so each wheel turns by d / its r.
export function car() {
  const g = new THREE.Group(), FLOOR = .95;
  const floor = new THREE.Mesh(new THREE.BoxGeometry(3.4, .08, 1.36), wood); floor.position.set(-.05, FLOOR, 0); floor.castShadow = true; g.add(floor);
  // plank sides, a darker rail on top
  for (const z of [-.66, .66]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(3.4, .42, .05), wood); side.position.set(-.05, FLOOR + .25, z); side.castShadow = true; g.add(side);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(3.45, .06, .08), woodDark); rail.position.set(-.05, FLOOR + .48, z); g.add(rail);
    for (const x of [-1.35, -.45, .45, 1.35]) { const post = new THREE.Mesh(new THREE.BoxGeometry(.07, .46, .07), woodDark); post.position.set(x, FLOOR + .25, z * 1.04); g.add(post); }
  }
  for (const x of [-1.75, 1.65]) { const end = new THREE.Mesh(new THREE.BoxGeometry(.05, .42, 1.36), wood); end.position.set(x, FLOOR + .25, 0); g.add(end); }
  // the axles and the beam under the floor
  for (const [ax, x] of Object.entries(AXLES)) { const r = ax === 'front' ? WHEEL_R : BACK_R;
    const axle = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, TRACK_Z * 2), woodDark); axle.position.set(x, r, 0); g.add(axle);
    const block = new THREE.Mesh(new THREE.BoxGeometry(.18, FLOOR - r, .5), woodDark); block.position.set(x, (FLOOR + r) / 2, 0); g.add(block); }
  // the bench, across the front
  const bench = new THREE.Mesh(new THREE.BoxGeometry(.4, .07, 1.3), woodDark); bench.position.set(.95, FLOOR + .38, 0); g.add(bench);
  const wheels = [];
  for (const [ax, x] of Object.entries(AXLES)) for (const z of [-TRACK_Z, TRACK_Z]) {
    const r = ax === 'front' ? WHEEL_R : BACK_R, w = wheel(r, ax === 'front' && z > 0);
    w.position.set(x, r, z); w.userData.r = r; g.add(w); wheels.push(w);
  }
  // the horse ahead, between two shafts from the front of the cart to its collar
  const h = horse(); h.position.set(3.75, 0, 0); g.add(h);
  for (const z of [-.42, .42]) {
    const a = new THREE.Vector3(1.6, FLOOR - .05, z * 1.3), b = new THREE.Vector3(3.8, 1.42, z), shaft = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, a.distanceTo(b), 6), woodDark);
    shaft.position.copy(a).add(b).multiplyScalar(.5); shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(shaft);
  }
  // Alice (the near side, she holds the reins) and Bob, seated on the bench
  const seated = {};
  for (const [k, z] of [['a', .26], ['b', -.26]]) {
    const p = person(k); p.scale.setScalar(.44); p.position.set(.95, FLOOR + .1, z); p.rotation.y = Math.PI / 2; g.add(p); seated[k] = p;
  }
  g.userData.seated = seated;
  g.userData.wheels = wheels;
  g.userData.stoneWheel = wheels.find(w => w.userData.stone);
  g.userData.roll = d => { for (const w of wheels) w.userData.spin.rotation.z = -d / w.userData.r; h.userData.walk(d); };
  return g;
}

// ---------- the key wheel ----------
// A drum with five flat faces, 1 m wide each: one key letter per face. Rolling over the lane it
// tumbles about its front lower edge, so each face in turn lies flat on one letter tile.
export const SIDE = 1;                                 // a face, and a tile, are 1 m long
export const PENT_R = SIDE / (2 * Math.sin(Math.PI / 5));     // centre to corner
export const PENT_IN = PENT_R * Math.cos(Math.PI / 5);        // centre to face
export function keyWheel() {
  const g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);
  const shape = new THREE.Shape();
  for (let i = 0; i < 5; i++) {
    // corners at angles so that face 0 lies flat at the bottom when spin.rotation.z = 0
    const a = -Math.PI / 2 - Math.PI / 5 + i * 2 * Math.PI / 5;
    const p = [Math.cos(a) * PENT_R, Math.sin(a) * PENT_R];
    i ? shape.lineTo(...p) : shape.moveTo(...p);
  }
  const drum = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 1.1, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 1 }),
    mat(0x8a5a2e, { roughness: .7 }));
  drum.position.z = -.55; drum.castShadow = true; spin.add(drum);
  // a letter on each face, as a plate on the face and a big one on the drum's front side
  const plates = [], sides = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / 5;          // the outward normal of face i
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(.86, .96), new THREE.MeshStandardMaterial({ transparent: true, roughness: .6 }));
    plate.position.set(Math.cos(a) * (PENT_IN + .035), Math.sin(a) * (PENT_IN + .035), 0);
    // the plate faces outward (its normal along the face's), the letter's top toward -z: upright seen from above
    const n = new THREE.Vector3(Math.cos(a), Math.sin(a), 0), up = new THREE.Vector3(0, 0, -1);
    plate.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(up, n), up, n));
    spin.add(plate); plates.push(plate);
    const side = new THREE.Mesh(new THREE.PlaneGeometry(.5, .5), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }));
    side.position.set(Math.cos(a) * PENT_IN * .62, Math.sin(a) * PENT_IN * .62, .59);
    side.rotation.z = a + Math.PI / 2; spin.add(side); sides.push(side);   // its top toward the centre: upright when its face is down
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 1.3, 10), mat(0x3a3a40, { metalness: .6 })); hub.rotation.x = Math.PI / 2; spin.add(hub);
  g.userData = { spin, plates, sides, letters: [] };
  // the letters on the faces ('?' for a face not found yet), each lit or not
  g.userData.setLetters = (letters, lit = []) => {
    g.userData.letters = letters;
    letters.forEach((ch, i) => {
      plates[i].material.map = letterTex(ch, lit[i] ? 'gold' : 'wood'); plates[i].material.needsUpdate = true;
      sides[i].material.map = letterTex(ch, lit[i] ? 'gold' : 'side'); sides[i].material.needsUpdate = true;
    });
  };
  return g;
}

// ---------- letter tiles ----------
const texCache = new Map();
// a square texture with one letter: 'plain' a pale flagstone, 'gold' a stamped cipher letter,
// 'hot' a highlighted cipher letter, 'wood' a key face, 'side' a key letter on the drum's side
export function letterTex(ch, style) {
  const id = ch + style;
  if (texCache.has(id)) return texCache.get(id);
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  const look = { plain: ['#d9d4c7', '#2a2620'], gold: ['#f2c24f', '#2a1a05'], hot: ['#ff7a3d', '#1a0a02'], wood: ['#c8935a', '#2a1608'],
    side: ['rgba(0,0,0,0)', '#fff3d6'], dim: ['#a8a397', '#5a554c'] }[style];
  x.fillStyle = look[0];
  if (style !== 'side') { x.beginPath(); x.roundRect(6, 6, S - 12, S - 12, 14); x.fill(); }
  x.fillStyle = look[1]; x.font = '700 92px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(ch, S / 2, S / 2 + 6);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  texCache.set(id, tex);
  return tex;
}

// ---------- tags ----------
// A floating tag (« 4 m », « 2 m divise 10 écarts »): a sprite with its text drawn on a canvas.
export function label() {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
  s.renderOrder = 20; s.visible = false; s.userData.text = '';
  return s;
}
export function setLabel(s, text, color = '#ffd66b', h = .34) {
  if (s.userData.text === text && s.userData.color === color && s.userData.h === h) return;
  const c = document.createElement('canvas'), x = c.getContext('2d'), font = '700 40px Georgia, "Times New Roman", serif';
  x.font = font; const w = Math.ceil(x.measureText(text).width) + 48;
  c.width = w; c.height = 72;
  x.font = font; x.fillStyle = 'rgba(16,18,28,.86)'; x.strokeStyle = color; x.lineWidth = 5;
  x.beginPath(); x.roundRect(3, 3, w - 6, 66, 33); x.fill(); x.stroke();
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, 38);
  s.material.map?.dispose(); s.material.map = new THREE.CanvasTexture(c); s.material.map.colorSpace = THREE.SRGBColorSpace; s.material.needsUpdate = true;
  s.scale.set(w / 72 * h, h, 1); Object.assign(s.userData, { text, color, h });
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
