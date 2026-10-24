// The objects of the story, built from primitives: the crates (one 16-byte block each, its front
// face a 4 x 4 grid of its bytes), the AES press, the XOR ring, the conveyor, the screens of the
// penguin wall (the characters are lib/cast.js's person(), r642). One unit is 10 cm: a crate is 70 cm, a person 1.70 m.
import * as THREE from 'three';
import { glyph } from './values.js';

export const CRATE = 7;                     // a crate's side
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, flatShading: true, ...o });

// A cipher byte's colour: the 256 values spread around the colour wheel, so equal bytes look
// equal and different ones look different. The penguin's encrypted pixels use it too.
export function byteColor(x) {
  const h = ((x * 157) % 256) / 256, l = .36 + ((x >> 3) & 3) * .07;
  return new THREE.Color().setHSL(h, .62, l);
}
export const cssColor = x => '#' + byteColor(x).getHexString();

// ---------- a crate ----------
// look: 'text' (a block in clear: its letters on paper), 'hex' (what AES gives: coloured tiles and
// their hex), 'bad' (decrypted, but garbage: its hex on grey paper), 'seal' (the HMAC tag).
// hi: byte indices drawn with a white ring (Eve's byte 8).
export function drawFace(canvas, bytes, look, hi = []) {
  const x = canvas.getContext('2d'), S = canvas.width, c = S / 4, pad = S * .012;
  x.fillStyle = look === 'text' ? '#efe4c8' : look === 'bad' ? '#8b8580' : look === 'seal' ? '#5a1620' : '#14161f';
  x.fillRect(0, 0, S, S);
  for (let i = 0; i < 16; i++) {
    const b = bytes[i], px = (i % 4) * c, py = Math.floor(i / 4) * c, g = look === 'text' ? glyph(b) : b.toString(16).padStart(2, '0');
    if (look === 'hex' || look === 'seal') { x.fillStyle = look === 'seal' ? '#8e2533' : cssColor(b); x.fillRect(px + pad, py + pad, c - 2 * pad, c - 2 * pad); }
    else { x.strokeStyle = 'rgba(60,40,20,.25)'; x.lineWidth = S * .006; x.strokeRect(px + pad, py + pad, c - 2 * pad, c - 2 * pad); }
    const small = g.length > 1 && look === 'text';                       // a padding byte among letters
    x.font = `700 ${small ? c * .34 : g.length > 1 ? c * .44 : c * .62}px "Courier New", Courier, monospace`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = look === 'text' ? (small ? '#9a7a4a' : '#20170c') : look === 'bad' ? '#f2ece4' : '#ffffff';
    if (look === 'hex') { x.lineWidth = c * .06; x.strokeStyle = 'rgba(0,0,0,.55)'; x.strokeText(g, px + c / 2, py + c * .54); }
    x.fillText(g, px + c / 2, py + c * .54);
    if (hi.includes(i)) { x.lineWidth = c * .08; x.strokeStyle = '#ffffff'; x.strokeRect(px + c * .06, py + c * .06, c * .88, c * .88); }
  }
}

const wood = mat(0x8a6236, { roughness: .85 }), woodDark = mat(0x5e4022, { roughness: .9 });
export function crate() {
  const g = new THREE.Group(), s = CRATE;
  const body = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), wood); body.castShadow = true; body.receiveShadow = true; g.add(body);
  // the slats along the edges
  for (const [w, h, d, x, y, z] of [[s + .1, .5, .5, 0, s / 2 - .25, s / 2 - .2], [s + .1, .5, .5, 0, -s / 2 + .25, s / 2 - .2],
    [.5, s + .1, .5, s / 2 - .25, 0, s / 2 - .2], [.5, s + .1, .5, -s / 2 + .25, 0, s / 2 - .2]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), woodDark); m.position.set(x, y, z); g.add(m);
  }
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const faceMat = new THREE.MeshStandardMaterial({ map: tex, roughness: .8, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .25 });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(s - 1.1, s - 1.1), faceMat); face.position.z = s / 2 + .06; g.add(face);
  // the same bytes on the lid, for the shots from above
  const lid = new THREE.Mesh(new THREE.PlaneGeometry(s - 1.1, s - 1.1), faceMat); lid.rotation.x = -Math.PI / 2; lid.position.y = s / 2 + .06; g.add(lid);
  g.userData = { body, face, canvas, tex, faceMat, key: '' };
  g.userData.paint = (bytes, look, hi = []) => {
    const key = [...bytes].join(',') + look + hi.join(',');
    if (key === g.userData.key) return;
    g.userData.key = key; drawFace(canvas, bytes, look, hi); tex.needsUpdate = true;
  };
  return g;
}

// ---------- the AES press: a housing over the belt, the key in a slot on its front ----------
// Crates go in on one side and come out on the other, changed. kind 'enc' (Alice's) or 'dec' (Bob's).
export function press(kind) {
  const g = new THREE.Group(), steel = mat(0x5a6170, { metalness: .6, roughness: .35 }), trim = mat(kind === 'enc' ? 0x2b6fc2 : 0xc28a1f, { metalness: .4, roughness: .4 });
  const W = 11, H = 13, D = 9;
  for (const z of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(D, H, 1.2), steel); p.position.set(0, H / 2, z * (CRATE / 2 + 1.4)); p.castShadow = true; g.add(p); }
  const top = new THREE.Mesh(new THREE.BoxGeometry(D + 1, 4, W), steel); top.position.y = H + 2; top.castShadow = true; g.add(top);
  const band = new THREE.Mesh(new THREE.BoxGeometry(D + 1.1, 1, W + .1), trim); band.position.y = H + .6; g.add(band);
  // the glowing mouth: lights up while a block is inside
  const glowM = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: kind === 'enc' ? 0x5fb0ff : 0xffc24d, emissiveIntensity: .25, side: THREE.DoubleSide });
  for (const x of [-1, 1]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(CRATE + 1.6, H - 1), glowM); f.rotation.y = Math.PI / 2; f.position.set(x * (D / 2 + .05), (H - 1) / 2 + .5, 0); f.material.transparent = true; f.material.opacity = .28; g.add(f); }
  // the sign, and the key in its slot
  const sign = textPlane(kind === 'enc' ? 'AES' : 'AES⁻¹', '#ffffff', kind === 'enc' ? '#1d3f6e' : '#6e4d12', 7, 2.6); sign.position.set(0, H + 2, W / 2 + .06); g.add(sign);
  const keyM = mat(0xffd84d, { metalness: .8, roughness: .25, emissive: 0x6a4a00, emissiveIntensity: .4 });
  const key = new THREE.Group();
  const bow = new THREE.Mesh(new THREE.TorusGeometry(.8, .28, 8, 16), keyM); key.add(bow);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(2.6, .4, .3), keyM); shaft.position.x = 2; key.add(shaft);
  for (const x of [2.6, 3.1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(.3, .7, .3), keyM); t.position.set(x, -.5, 0); key.add(t); }
  key.position.set(-1.6, H - 2.2, CRATE / 2 + 2.1); g.add(key);
  const kTag = textPlane('K', '#1a1205', '#ffd84d', 1.4, 1.4); kTag.position.set(3.4, H - 2.2, CRATE / 2 + 2.1); g.add(kTag);
  const light = new THREE.PointLight(kind === 'enc' ? 0x7fc0ff : 0xffd27a, 0, 22, 1.6); light.position.set(0, H - 3, 0); g.add(light);
  g.userData = { glow: glowM, light, key, H };
  g.userData.setHot = k => { glowM.emissiveIntensity = .25 + 3 * k; glowM.opacity = .28 + .5 * k; light.intensity = 40 * k; };
  return g;
}

// ---------- the XOR ring: a hoop across the belt, the chained block hovering above it ----------
export function xorRing() {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x2a2030, emissive: 0xc070ff, emissiveIntensity: .8, metalness: .3, roughness: .4 });
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(6.4, .45, 10, 40), m); hoop.rotation.y = Math.PI / 2; hoop.position.y = 6.5; g.add(hoop);
  for (const z of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, 4, 8), mat(0x3a3440, { metalness: .5 })); leg.position.set(0, 1.4, z * 5.6); g.add(leg); }
  const sign = textPlane('⊕', '#f3dcff', '#3a1650', 2.6, 2.6, true); sign.position.set(0, 14, 0); g.add(sign);
  g.userData = { mat: m };
  g.userData.setHot = k => { m.emissiveIntensity = .8 + 3 * k; };
  return g;
}

// ---------- the conveyor ----------
export const BELT_Y = 6;   // the top of the belt
export function belt(x0, x1) {
  const g = new THREE.Group(), L = x1 - x0, cx = (x0 + x1) / 2;
  const frame = mat(0x2f3540, { metalness: .5, roughness: .5 });
  for (const z of [-1, 1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(L, 1.2, .6), frame); rail.position.set(cx, BELT_Y - .2, z * (CRATE / 2 + 1)); g.add(rail); }
  for (let x = x0 + 4; x < x1; x += 14) for (const z of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(.8, BELT_Y, .8), frame); leg.position.set(x, BELT_Y / 2 - .4, z * (CRATE / 2 + .6)); leg.castShadow = true; g.add(leg); }
  // the rubber, striped, its texture scrolls when the belt runs
  const c = document.createElement('canvas'); c.width = 64; c.height = 16; const x = c.getContext('2d');
  x.fillStyle = '#1d1f24'; x.fillRect(0, 0, 64, 16); x.fillStyle = '#2c2f37'; x.fillRect(0, 0, 8, 16);
  const tex = new THREE.CanvasTexture(c); tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(L / 3, 1); tex.colorSpace = THREE.SRGBColorSpace;
  const top = new THREE.Mesh(new THREE.BoxGeometry(L, .6, CRATE + 1.4), new THREE.MeshStandardMaterial({ map: tex, roughness: .9 }));
  top.position.set(cx, BELT_Y - .3, 0); top.receiveShadow = true; g.add(top);
  g.userData = { tex, run: d => { tex.offset.x -= d / 3; } };
  return g;
}

// ---------- a screen on the wall: the penguin, in clear, in ECB, in CBC ----------
export function screen(w, h, caption) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 2, h + 2, 1), mat(0x23262e, { metalness: .4 })); g.add(frame);
  const canvas = document.createElement('canvas');
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter;
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: 0xd8d8d8 }));
  pic.position.z = .52; g.add(pic);
  const cap = textPlane(caption, '#ffffff', '#23262e', 12, 3); cap.position.set(0, -h / 2 - 3.2, .3); g.add(cap);
  g.userData = { canvas, tex, pic, cap };
  return g;
}

// A flat sign with text on it.
export function textPlane(text, color, bg, w, h, round = false) {
  const c = document.createElement('canvas'), k = 128; c.width = Math.round(w / h * k); c.height = k;
  const x = c.getContext('2d');
  x.fillStyle = bg; if (round) { x.beginPath(); x.arc(c.width / 2, k / 2, k / 2 - 2, 0, Math.PI * 2); x.fill(); } else x.fillRect(0, 0, c.width, k);
  x.fillStyle = color; x.font = `700 ${k * .7}px system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, k * .55);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: round, toneMapped: false }));
  m.userData.redraw = (t, col = color, b = bg) => { x.clearRect(0, 0, c.width, k); x.fillStyle = b; if (round) { x.beginPath(); x.arc(c.width / 2, k / 2, k / 2 - 2, 0, Math.PI * 2); x.fill(); } else x.fillRect(0, 0, c.width, k); x.fillStyle = col; x.fillText(t, c.width / 2, k * .55); tex.needsUpdate = true; };
  return m;
}
