// What of episode 2 can be printed (r459, r196): every asset of the scene, for lab/print/?ep=cadenas.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; strip the decoration
// a print does without; ground is the asset's y where it meets the ground, cut there on export so it
// stands flat (lib/print.js repair). An asset that cannot be printed says why. A new asset in the scene
// gets its line here. The village is this episode's own (js/world.js, js/props.js): a person is 3.2 units,
// so at 60 mm one unit is about 19 mm; the houses and Eve's tower are scaled down to landmark size.
// The props the story hides and shows (the courier, the padlocks, the keys) are built fresh: a hidden
// mesh is not printed (lib/print.js pieces).
import * as THREE from 'three';
import { padlock, key, chest, COLORS } from './props.js';
import { person } from '../../lib/cast.js';
import { table } from './world.js';

const kids = (o, test) => o.children.find(test);
const all = (o, test) => { const m = []; o.traverse(c => test(c) && m.push(c)); return m; };
const isBox = (w, h) => c => c.isMesh && c.geometry.type === 'BoxGeometry' && c.geometry.parameters.width === w && c.geometry.parameters.height === h;
// the padlock's keyhole and slot are a dark disc and a dark square laid on its front: paint them on the print
const holes = o => all(o, c => c.isMesh && ['CircleGeometry', 'PlaneGeometry'].includes(c.geometry.type));
// the letter is a cylinder of radius .14, its ribbon a ring of radius .15 (the hasp's staple is a ring of .1)
const isLetter = m => m.isMesh && (m.geometry.parameters.radiusTop === .14 || m.geometry.parameters.radius === .15);
const shut = color => { const l = padlock(color); l.userData.setOpen(0); return l; };
// the chest's letter and its ribbon, taken out of a fresh chest: they lie inside it, under the lid
function letter() {
  const c = chest(), g = new THREE.Group();
  for (const m of c.children.filter(isLetter)) g.add(m);
  return g;
}

export const ASSETS = [
  { id: 'alice', label: 'Alice, the cast figure (lib/cast.js): blue robe, scarf and a bun', kind: 'figure', size: { h: 60 }, get: () => person('a') },
  { id: 'bob', label: 'Bob, the locksmith, the cast figure: yellow robe, flat cap, belt with a gold buckle', kind: 'figure', size: { h: 60 }, get: () => person('b') },
  { id: 'eve', label: 'Eve, the cast figure: the spy, black fedora with a red band, eye mask', kind: 'figure', size: { h: 60 }, get: () => person('e') },
  { id: 'courier', label: 'The courier who carries the chest on his head, the cast messenger with a postman\'s cap and his satchel', kind: 'figure', size: { h: 60 },
    get: () => person('n', { hat: 'postCap' }) },
  { id: 'chest', label: "Alice's chest: wooden base, round lid, two iron bands, the hasp and its staple", kind: 'prop', size: { max: 40 },
    get: () => chest(),
    // the lid's underside is a sheet seen only when the chest is open; the letter lies inside (its own line)
    strip: (d, o) => ({ underside: o.children.find(h => h.isGroup).children.filter(m => m.geometry.type === 'PlaneGeometry'),
      letter: o.children.filter(isLetter) }) },
  { id: 'letter', label: 'The letter in the chest, rolled and tied with a red ribbon', kind: 'prop', size: { max: 20 }, get: letter },
  { id: 'padlock-open', label: "Bob's open padlock, his public key (nine are handed out)", kind: 'prop', size: { h: 30 },
    get: () => padlock(COLORS.b), strip: (d, o) => ({ keyhole: holes(o) }) },
  { id: 'padlock-locked', label: "Bob's padlock snapped shut on the chest", kind: 'prop', size: { h: 25 },
    get: () => shut(COLORS.b), strip: (d, o) => ({ keyhole: holes(o) }) },
  { id: 'padlock-alice', label: "Alice's own padlock, blue, snapped shut (chapter 1)", kind: 'prop', size: { h: 25 },
    get: () => shut(COLORS.a), strip: (d, o) => ({ keyhole: holes(o) }) },
  { id: 'key-bob', label: "Bob's one key, his private key (gold; it glows on his belt)", kind: 'prop', size: { max: 25 },
    get: () => key(COLORS.b) },
  { id: 'key-alice', label: "Alice's key to her own padlock (blue)", kind: 'prop', size: { max: 25 },
    get: () => key(COLORS.a) },
  { id: 'table', label: 'A table: Alice\'s, Eve\'s and Bob\'s, and Bob\'s workbench where the padlocks are made', kind: 'prop',
    size: { max: 55 }, ground: 0, get: () => table() },
  { id: 'post', label: 'A post by a house door, where a padlock hangs (seven in the village)', kind: 'prop', size: { h: 45 },
    ground: 0, get: d => d.world.posts[0] },
  { id: 'cottage-a', label: "Alice's cottage, blue roof, two lit windows", kind: 'landmark', size: { h: 100 }, ground: 0,
    get: d => d.world.houseA },
  { id: 'tower', label: "Eve's watchtower: dark stone, red-lit slits, a red pointed roof", kind: 'landmark', size: { h: 150 },
    ground: 0, get: d => d.world.eveTower },
  { id: 'workshop', label: "Bob's workshop: gold roof, a chimney, the forge by the door", kind: 'landmark', size: { h: 110 },
    ground: 0, get: d => d.world.shop,
    // the forge's glow is a point light, not matter (its coals are a box: paint them)
    omit: d => [d.world.shop.userData.forgeLight] },
  { id: 'house', label: 'A house of the village (seven, each with its own roof colour)', kind: 'landmark', size: { h: 80 },
    ground: 0, get: d => kids(d.scene, c => c.isGroup && c.children.some(isBox(5.5, 3.4))) },
  { id: 'tree', label: 'A tree of the groves around the village', kind: 'tree', size: { h: 50 }, instances: 1,
    get: d => kids(d.scene, c => c.children.length === 2 && c.children.every(m => m.isInstancedMesh)) },
  { id: 'terrain', label: 'The meadow, its hills and the road from Alice to Bob', kind: 'ground', printable: false,
    why: 'the ground the pieces stand on, with the road laid over it: print a mat or a board, not a piece' },
  { id: 'sky', label: 'The golden-hour sky, the sun and the clouds', kind: 'sky', printable: false,
    why: 'a dome around the whole scene, clouds 90 units up: nothing to stand on a table' },
  { id: 'smoke', label: "The smoke from Bob's chimney", kind: 'light', printable: false,
    why: 'see-through puffs that rise and fade: not matter' },
  { id: 'tags', label: 'The floating tags « public key » over the padlocks and « private key » over Bob\'s key', kind: 'text',
    printable: false, why: 'screen text: sprites drawn on a canvas' },
  { id: 'bubbles', label: 'The speech bubbles over Alice, Bob and Eve', kind: 'text', printable: false,
    why: 'screen text: HTML over the scene, not in it' },
  { id: 'bursts', label: 'The sparks, rings and icons (🔒 🔑 ✋ ✖) over a padlock or a person', kind: 'light', printable: false,
    why: 'light, not matter: particles that burst and fade' },
];
