// What a rider carries in episode 1.4, built from primitives: Alice's two keys (AES in violet, HMAC
// in green, the card's colours), Bob's padlock, open or snapped shut. padlock() and key() are
// episode 2's (cadenas/js/props.js), copied so each episode stands alone.
import * as THREE from 'three';
import { COLORS } from './world.js';

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
// so it hangs from a hasp. setOpen(0..1): 0 = snapped shut, 1 = lifted and swung half a turn,
// its free leg out beside the body, so it reads as open from the front.
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
  g.userData.setOpen = v => { pivot.position.y = .28 * Math.min(1, v * 2); pivot.rotation.y = Math.max(0, v * 2 - 1) * Math.PI; g.userData.open = v; };
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

// The cargo, held up above the rider's hand: 'keys' (two keys, the AES one and the HMAC one), 'open'
// (Bob's open padlock, his public key), 'locked' (the padlock snapped shut on the keys)
export function cargo(kind) {
  const g = new THREE.Group();
  if (kind === 'keys') {
    const a = key(0xc9a0f0, .6), b = key(0x8fd18a, .6); a.position.y = .25; b.position.y = -.25; g.add(a, b);
  } else {
    const p = padlock(COLORS.b); p.userData.setOpen(kind === 'open' ? 1 : 0); p.position.y = .4; g.add(p);
    if (kind === 'locked') { const k = key(0xc9a0f0, .5); k.scale.setScalar(.6); k.position.set(0, -.75, .3); g.add(k); }
  }
  return g;
}
