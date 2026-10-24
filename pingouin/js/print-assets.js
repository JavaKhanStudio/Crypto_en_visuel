// What of episode 6 can be printed (r465, r196): every asset of the scene, for lab/print/?ep=pingouin.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; strip the decoration
// a print does without; ground is the asset's y where it meets the ground, cut there on export so it
// stands flat (lib/print.js repair). An asset that cannot be printed says why. A new asset in the scene
// gets its line here. The sorting hall is this episode's own (js/world.js): one unit is 10 cm, so a
// person (17 units) at 60 mm puts the hall at about 3.5 mm a unit.
import * as THREE from 'three';
import { crate, press, xorRing, belt, screen } from './props.js';
import { person } from '../../lib/cast.js';

const plane = c => c.isMesh && c.geometry.type === 'PlaneGeometry';
const box = (c, w, h, d) => c.isMesh && c.geometry.type === 'BoxGeometry'
  && [w, h, d].every((v, i) => v === undefined || c.geometry.parameters[['width', 'height', 'depth'][i]] === v);
// the hall's loose meshes (clutter() adds them to the scene one by one): copies of those that
// test() picks, around x, z, in one group standing at the origin
function gather(scene, test, x, z) {
  const g = new THREE.Group();
  for (const c of scene.children) if (test(c)) { const m = c.clone(); m.position.x -= x; m.position.z -= z; g.add(m); }
  return g;
}
const near = (c, x, z, r) => Math.abs(c.position.x - x) < r && Math.abs(c.position.z - z) < r;

export const ASSETS = [
  { id: 'alice', label: 'Alice, the cast figure (lib/cast.js): blue robe, a bun, the blue scarf ring', kind: 'figure', size: { h: 60 },
    get: () => person('a', { scale: 5.3 }) },
  { id: 'bob', label: 'Bob, the cast figure: yellow robe, flat cap, leather belt with a gold buckle', kind: 'figure', size: { h: 60 },
    get: () => person('b', { scale: 5.3 }) },
  { id: 'eve', label: 'Eve, the cast figure: the spy, black fedora with a red band, eye mask', kind: 'figure', size: { h: 60 },
    get: () => person('e', { scale: 5.3 }) },
  { id: 'crate', label: 'A crate: one 16-byte block (its bytes are painted on the front and the lid: paint the print)', kind: 'prop',
    size: { h: 25 }, get: () => crate(),
    // the 4 x 4 grid of bytes is a picture on two sheets laid on the box
    strip: (d, o) => ({ 'byte grid': o.children.filter(plane) }) },
  { id: 'press-enc', label: "Alice's AES press, blue band, the key in its slot (the crates ride through it)", kind: 'landmark',
    size: { h: 70 }, ground: 0, get: () => press('enc'),
    // the glowing mouth is light; the AES sign and the K tag are text on sheets
    omit: (d, o) => o.children.filter(c => c.material === o.userData.glow),
    strip: (d, o) => ({ signs: o.children.filter(c => plane(c) && c.material !== o.userData.glow) }) },
  { id: 'press-dec', label: "Bob's AES⁻¹ press, gold band", kind: 'landmark', size: { h: 70 }, ground: 0, get: () => press('dec'),
    omit: (d, o) => o.children.filter(c => c.material === o.userData.glow),
    strip: (d, o) => ({ signs: o.children.filter(c => plane(c) && c.material !== o.userData.glow) }) },
  { id: 'xor-ring', label: 'The XOR ring: a hoop on two legs across the belt (CBC chains each block through it)', kind: 'landmark',
    size: { h: 50 }, ground: 0, get: () => xorRing(),
    // the ⊕ disc floats over the hoop: a sign, not a part
    strip: (d, o) => ({ 'sign ⊕': o.children.filter(plane) }) },
  { id: 'conveyor', label: "A section of the conveyor, two legs (the hall's runs 244 units: print as many as the table needs)",
    kind: 'landmark', size: { max: 100 }, ground: 0, get: () => belt(0, 28) },
  { id: 'screen', label: 'A screen of the penguin wall (image, ECB, CBC): print it flat, glue or paint the picture', kind: 'prop',
    size: { max: 100 }, get: () => screen(30, 35, 'ECB'),
    // the penguin and the caption are pictures on sheets in front of the frame
    strip: (d, o) => ({ 'picture and caption': o.children.filter(plane) }) },
  { id: 'bench', label: "Eve's bench behind the belt, at the middle", kind: 'prop', size: { max: 55 },
    get: d => gather(d.scene, c => near(c, 10, -14, 9) && (box(c, 16, 1, 7) || box(c, .8, 8, .8)), 10, -14) },
  { id: 'pallets', label: 'A stack of three pallets and their sacks, at an end of the hall', kind: 'prop', size: { h: 90 },
    get: d => gather(d.scene, c => near(c, -150, -26, 9) && (box(c, 16, 1.4, 12) || box(c, 14, 7.4, 10)), -150, -26) },
  { id: 'hall', label: 'The sorting hall: floor, safety lines, brick walls and windows, roof trusses', kind: 'ground', printable: false,
    why: 'the room the pieces stand in, 420 units across: print a mat or a board, not a piece' },
  { id: 'lamps', label: 'The six hanging lamps over the belt', kind: 'light', printable: false,
    why: 'a shade on a 30-unit cord from the roof, its bulb a light: nothing to stand on a table' },
  { id: 'labels', label: 'The tags over the crates (P1, C1, IV...) and the checks', kind: 'text', printable: false,
    why: 'screen text: sprites that face the camera' },
  { id: 'bursts', label: 'The sparks, rings and icons over a crate or a person', kind: 'light', printable: false,
    why: 'light, not matter: particles that burst and fade' },
];
