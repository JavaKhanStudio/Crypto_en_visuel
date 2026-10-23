// What of episode 5.3 can be printed (r464, r196): every asset of the scene, for lab/print/?ep=enigma-casse.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; strip the decoration
// a print does without; ground is the asset's y where it meets the ground, cut there on export so it
// stands flat (lib/print.js repair). An asset that cannot be printed says why. A new asset in the scene
// gets its line here. The winter forest is lib/enigma/world.js (shared with 5.1/5.2, Eve's slate and bombe added by props.js evePost), not the saga's valley;
// one unit is 10 cm, so a person (17 units) at 60 mm puts the posts at about 3.5 mm a unit.
// The wires inside the rotors are lines, and lines are not printed (lib/print.js skips them).
import * as THREE from 'three';
import { machine, rotor, reflector, desk, person, EVE, SLATE_H } from './props.js';

const kids = (o, test) => o.children.find(test);
const all = (o, test) => { const r = []; o.traverse(c => c !== o && test(c) && r.push(c)); return r; };
const box = (c, w) => c?.isMesh && c.geometry.type === 'BoxGeometry' && c.geometry.parameters.width === w;
const glowing = c => c.isMesh && c.material.emissive?.getHex() > 0;
// the letters on the rims, the key caps, the lamps and the bombe's drums: flat discs and squares
// with a letter for a texture, painted on the print, not shapes (a sheet would be thickened to 1 mm)
const flat = c => c.isMesh && (c.geometry.type === 'PlaneGeometry' || c.geometry.type === 'CircleGeometry');
const letters = (d, o) => ({ letters: all(o, flat) });
// the machine as the story opens it: the drum packed in its well, the lid up behind, the ten cables
// of the day's sheet plugged in front (read from Alice's machine, which the page sets to it)
// print-only feet (r580): the slate is 4 mm deep and the mast stands on three 5 mm posts, so on the
// table both fall over; the printed version is the scene's own, cloned (the scene is never touched),
// with a wood foot under each of the slate's legs and a metal disc under the mast, each as wide as
// the piece needs to stand (about 27 mm deep at the slate's feet, 33 mm across under the mast)
const footed = (o, add) => { const c = o.clone(); for (const m of add(o)) c.add(m); return c; };
const slateFeet = s => {
  const leg = s.children.filter(c => box(c, .7) && c.geometry.parameters.height > SLATE_H), y = leg[0].position.y - leg[0].geometry.parameters.height / 2;
  return leg.map(l => { const f = new THREE.Mesh(new THREE.BoxGeometry(2.4, .8, 8), l.material); f.name = 'foot'; f.position.set(l.position.x, y + .4, -.3); return f; });
};
const mastBase = m => { const b = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, .8, 32), m.children[0].material); b.name = 'base'; b.position.y = .401; return [b]; };   // a hair up: at .4 rounding puts its foot under the ground, a needless cut
const enigma = d => { const m = machine(); m.userData.setApart(0); m.userData.setCables(d.stage.machines.a.userData.plugs ?? ''); return m; };

export const ASSETS = [
  { id: 'alice', label: 'Alice, blue scarf and a bun', kind: 'figure', size: { h: 60 }, get: () => person('a') },
  { id: 'bob', label: 'Bob, flat cap and a gold belt', kind: 'figure', size: { h: 60 }, get: () => person('b') },
  { id: 'eve', label: 'Eve, the spy: fedora with a red band, eye mask, headphones', kind: 'figure', size: { h: 60 }, get: () => person('e') },
  { id: 'enigma', label: "The Enigma machine, its lid up, the three rotors packed in their well, the day's ten cables in front (one each for Alice, Bob and Eve; larger than at the desk: it is the piece the story is about)",
    kind: 'prop', size: { max: 60 }, get: enigma, strip: letters },
  { id: 'rotor', label: 'A rotor taken out, its thumbwheel on the left (I to V print alike: their wiring is lines inside)',
    kind: 'prop', size: { max: 30 }, get: () => rotor('I'), strip: letters },
  { id: 'reflector', label: 'The reflector B, the disc that sends the current back (the reason no letter becomes itself)', kind: 'prop', size: { max: 30 },
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
  { id: 'slate', label: "Eve's slate on its two legs, where she moves the crib along the cipher and draws the menu (the chalk is screen text: write it on); a wide foot under each leg, added for print, so it stands",
    kind: 'landmark', size: { max: 140 }, ground: -EVE.slate.y, get: d => footed(d.world.extras.slate, slateFeet) },
  { id: 'bombe', label: 'The bombe, a cabinet as tall as a man: three banks of twelve drum sets, the relay lamps along its foot (the drums\' letters are painted)',
    kind: 'landmark', size: { h: 70 }, ground: 0, get: d => d.world.extras.bombe, strip: letters },
  { id: 'floor', label: 'The wooden floor under a post (and the smaller one under the bombe), so nothing stands in the snow', kind: 'landmark', size: { max: 120 }, ground: 0,
    get: d => kids(d.scene, c => c.isGroup && box(c.children[0], 38)) },
  { id: 'hut', label: "Alice's and Bob's log hut, its snowy roof (the lit window is a box: paint it)", kind: 'landmark', size: { max: 100 }, ground: 0,
    get: d => kids(d.scene, c => c.isGroup && box(c.children[0], 22)) },
  { id: 'eve-hut', label: "Eve's dark listening hut, its red window", kind: 'landmark', size: { max: 110 }, ground: 0,
    get: d => kids(d.scene, c => c.isGroup && box(c.children[0], 26)) },
  { id: 'mast', label: 'An aerial: a lattice mast and its cross-bar (the blinking light on top is left out); a round base under its three posts, added for print, so it stands', kind: 'landmark', size: { h: 150 }, ground: 0,
    get: d => footed(d.world.masts.a, mastBase), omit: (d, o) => all(o, glowing) },
  { id: 'tree', label: 'A pine of the forest', kind: 'tree', size: { h: 70 }, instances: 1,
    get: d => kids(d.scene, c => c.children.length === 2 && c.children.every(m => m.isInstancedMesh)) },
  { id: 'rack', label: 'The box of the five rotors, I to V, spread above Alice\'s machine while the story counts the orders', kind: 'prop', printable: false,
    why: 'five see-through ghosts of the rotor: print the rotor line five times' },
  { id: 'terrain', label: 'The snowy clearing and the hills around it', kind: 'ground', printable: false,
    why: 'the ground the pieces stand on, 1400 units across: print a mat or a board, not a piece' },
  { id: 'sky', label: 'The night sky, its moon and its stars', kind: 'sky', printable: false,
    why: 'a dome around the whole scene, the moon 1500 units away, the stars points: nothing to stand on a table' },
  { id: 'current', label: 'The current through the drum, gold going out, orange coming back', kind: 'light', printable: false,
    why: 'light, not matter: tubes drawn while a key is held, and the spark that runs along them' },
  { id: 'chalk', label: 'The chalk on the slate: the places, the cipher, the crib, the menu and its loop', kind: 'text', printable: false,
    why: 'screen text: sprites the stage draws on the slate as the story moves the crib' },
  { id: 'labels', label: 'The tags over the drums, the notepads and the bombe (« III · A », « IXW »)', kind: 'text', printable: false,
    why: 'screen text: sprites that face the camera' },
];
