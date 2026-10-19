// The objects of the story, built from primitives: Alice's car (a stone wedged in the tread of its
// near front tyre), the key wheel (a five-sided drum, one key letter on each face, that tumbles face
// after face along the lane), the letter tiles, the floating tags, and the characters.
import * as THREE from 'three';

export const COLORS = { a: 0x4da3ff, b: 0xffc24d, e: 0xff3347 };

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, flatShading: true, ...o });
const dark = mat(0x15110c, { roughness: 1 });

// ---------- the car ----------
// Wheel radius from the circumference: 2 m around (a 205/55 R16 is 1.99 m) -> r = 2 / 2π = 0.318 m.
export const WHEEL_R = 2 / (2 * Math.PI);
export const AXLES = { front: 1.32, back: -1.28 };   // along the car, from its centre
export const TRACK_Z = .78;                          // half the distance between the left and right wheels

// A tyre and its rim, turning about z. The near front one carries the stone: userData.stone.
function wheel(withStone) {
  const g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, .21, 28), mat(0x1c1c1f, { roughness: .95 }));
  tyre.rotation.x = Math.PI / 2; tyre.castShadow = true; spin.add(tyre);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL_R * .62, WHEEL_R * .62, .225, 10), mat(0xb8bcc4, { metalness: .6, roughness: .35 }));
  rim.rotation.x = Math.PI / 2; spin.add(rim);
  // spokes, so the turning shows
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(WHEEL_R * 1.1, .05, .235), mat(0x8a8f98, { metalness: .5 }));
    s.rotation.z = i / 5 * Math.PI; spin.add(s);
  }
  // tread blocks around the tyre
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(.035, .02, .2), dark);
    b.position.set(Math.cos(a) * WHEEL_R, Math.sin(a) * WHEEL_R, 0); b.rotation.z = a; spin.add(b);
  }
  if (withStone) {
    // the stone, at the bottom of the tread when the wheel's angle is 0; a little larger than life, and pale, to be seen
    const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(.095, 0), mat(0xf4ecd8, { roughness: .8, emissive: 0x6a5a30, emissiveIntensity: .8 }));
    stone.position.set(0, -WHEEL_R - .02, .08); stone.castShadow = true; spin.add(stone);   // on the outer edge of the tread, seen from the road side
    g.userData.stone = stone;
  }
  g.userData.spin = spin;
  return g;
}

// A small hatchback, facing +x, its wheels on the ground at y = 0. userData.roll(d): the car has
// moved d metres from where its stone touched the ground, so the wheels turn by d / r.
export function car() {
  const g = new THREE.Group(), paint = mat(0x2f6fd1, { roughness: .35, metalness: .3, flatShading: false });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.9, .62, 1.7), paint); body.position.y = .62; body.castShadow = true; g.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1, .2, 1.6), paint); hood.position.set(1.45, .98, 0); hood.rotation.z = -.12; g.add(hood);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, .62, 1.5), paint); cabin.position.set(-.35, 1.22, 0); cabin.castShadow = true; g.add(cabin);
  const glass = mat(0x3a5068, { roughness: .12, metalness: .5, flatShading: false });
  const wind = new THREE.Mesh(new THREE.BoxGeometry(.06, .5, 1.36), glass); wind.position.set(.72, 1.24, 0); wind.rotation.z = -.5; g.add(wind);
  for (const z of [-.76, .76]) for (const [x, w] of [[.05, .8], [-.85, .8]]) { const side = new THREE.Mesh(new THREE.BoxGeometry(w, .36, .03), glass); side.position.set(x, 1.27, z); g.add(side); }
  const lamp = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xfff2c8, emissiveIntensity: 2 });
  for (const z of [-.58, .58]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.06, .14, .3), lamp); l.position.set(1.96, .7, z); g.add(l); }
  const red = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff2a2a, emissiveIntensity: 1.5 });
  for (const z of [-.6, .6]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.06, .14, .26), red); l.position.set(-1.96, .72, z); g.add(l); }
  const bumper = mat(0x26282e);
  for (const x of [-1.98, 1.98]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.1, .18, 1.72), bumper); b.position.set(x, .38, 0); g.add(b); }
  const wheels = [];
  for (const [ax, x] of Object.entries(AXLES)) for (const z of [-TRACK_Z, TRACK_Z]) {
    const w = wheel(ax === 'front' && z > 0); w.position.set(x, WHEEL_R, z); g.add(w); wheels.push(w);
  }
  g.userData.wheels = wheels;
  g.userData.stoneWheel = wheels.find(w => w.userData.stone);
  g.userData.roll = d => { for (const w of wheels) w.userData.spin.rotation.z = -d / WHEEL_R; };
  // Alice at the wheel
  const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 10), mat(0xf0c8a0)); head.position.set(-.1, 1.3, .32); g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 8, 0, Math.PI * 2, 0, Math.PI * .55), mat(0x6b3d1f)); hair.position.set(-.13, 1.34, .32); g.add(hair);
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
