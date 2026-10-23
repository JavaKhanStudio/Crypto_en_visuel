// What of episode 5 can be printed (r462, r196): every asset of the scene, for lab/print/?ep=enigma.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; strip the decoration
// a print does without; ground is the asset's y where it meets the ground, cut there on export so it
// stands flat (lib/print.js repair). An asset that cannot be printed says why. A new asset in the scene
// gets its line here. The winter forest is this episode's own (lib/enigma/world.js, shared with 5.1/5.2), not the saga's valley.
// The wires inside the rotors are lines, and lines are not printed (lib/print.js skips them).
import { machine, rotor, reflector, desk, person } from './props.js';

const kids = (o, test) => o.children.find(test);
const all = (o, test) => { const r = []; o.traverse(c => c !== o && test(c) && r.push(c)); return r; };
const box = (c, w) => c?.isMesh && c.geometry.type === 'BoxGeometry' && c.geometry.parameters.width === w;
const glowing = c => c.isMesh && c.material.emissive?.getHex() > 0;
// the letters on the rims, the key caps and the lamps: flat discs and squares with a letter for a
// texture, painted on the print, not shapes (a sheet would be thickened to 1 mm)
const flat = c => c.isMesh && (c.geometry.type === 'PlaneGeometry' || c.geometry.type === 'CircleGeometry');
const letters = (d, o) => ({ letters: all(o, flat) });
// the machine as the story opens it: the drum packed in its well, the lid up behind
const enigma = () => { const m = machine(); m.userData.setApart(0); return m; };

export const ASSETS = [
  { id: 'alice', label: 'Alice, blue scarf and a bun', kind: 'figure', size: { h: 60 }, get: () => person('a') },
  { id: 'bob', label: 'Bob, flat cap and a gold belt', kind: 'figure', size: { h: 60 }, get: () => person('b') },
  { id: 'eve', label: 'Eve, the spy: fedora with a red band, eye mask, headphones', kind: 'figure', size: { h: 60 }, get: () => person('e') },
  { id: 'enigma', label: 'The Enigma machine, its lid up, the three rotors packed in their well (larger than at the desk: it is the piece the story is about)',
    kind: 'prop', size: { max: 60 }, get: enigma, strip: letters },
  { id: 'rotor', label: 'A rotor taken out, its thumbwheel on the left (I, II and III print alike: their wiring is lines inside)',
    kind: 'prop', size: { max: 30 }, get: () => rotor('I'), strip: letters },
  { id: 'reflector', label: 'The reflector B, the disc that sends the current back', kind: 'prop', size: { max: 30 },
    get: () => reflector(), strip: letters },
  { id: 'desk', label: 'A desk on four legs (one each for Alice, Eve, Bob)', kind: 'prop', size: { max: 60 }, ground: 0,
    get: () => desk() },
  { id: 'radio', label: "Eve's big receiver (its dials are a glow: paint them)", kind: 'prop', size: { max: 30 },
    get: d => kids(d.scene, c => c.isGroup && box(c.children[0], 4)), strip: letters },
  { id: 'lamp', label: "Eve's desk lamp, green shade (the bulb is a light, left out)", kind: 'prop', size: { h: 30 },
    get: d => kids(d.scene, c => c.isGroup && c.children.some(m => m.isPointLight) && c.children.some(m => m.geometry?.type === 'CylinderGeometry')),
    omit: (d, o) => all(o, glowing) },
  { id: 'notepad', label: 'A notepad and its pen (one on each desk)', kind: 'prop', size: { max: 20 },
    get: d => d.world.extras.a.pad },
  { id: 'floor', label: 'The wooden floor under a post, so the desk does not stand in the snow', kind: 'landmark', size: { max: 120 }, ground: 0,
    get: d => kids(d.scene, c => c.isGroup && box(c.children[0], 38)) },
  { id: 'hut', label: "Alice's and Bob's log hut, its snowy roof (the lit window is a box: paint it)", kind: 'landmark', size: { max: 100 }, ground: 0,
    get: d => kids(d.scene, c => c.isGroup && box(c.children[0], 22)) },
  { id: 'eve-hut', label: "Eve's dark listening hut, its red window", kind: 'landmark', size: { max: 110 }, ground: 0,
    get: d => kids(d.scene, c => c.isGroup && box(c.children[0], 26)) },
  { id: 'mast', label: 'An aerial: a lattice mast and its cross-bar (the blinking light on top is left out)', kind: 'landmark', size: { h: 150 }, ground: 0,
    get: d => d.world.masts.a, omit: (d, o) => all(o, glowing) },
  { id: 'tree', label: 'A pine of the forest', kind: 'tree', size: { h: 70 }, instances: 1,
    get: d => kids(d.scene, c => c.children.length === 2 && c.children.every(m => m.isInstancedMesh)) },
  { id: 'terrain', label: 'The snowy clearing and the hills around it', kind: 'ground', printable: false,
    why: 'the ground the pieces stand on, 1400 units across: print a mat or a board, not a piece' },
  { id: 'sky', label: 'The night sky, its moon and its stars', kind: 'sky', printable: false,
    why: 'a dome around the whole scene, the moon 1500 units away, the stars points: nothing to stand on a table' },
  { id: 'current', label: 'The current through the drum, gold going out, orange coming back', kind: 'light', printable: false,
    why: 'light, not matter: tubes drawn while a key is held, and the spark that runs along them' },
  { id: 'labels', label: 'The tags over the drum and the notepads (« III · A », « TVG »)', kind: 'text', printable: false,
    why: 'screen text: sprites that face the camera' },
];
