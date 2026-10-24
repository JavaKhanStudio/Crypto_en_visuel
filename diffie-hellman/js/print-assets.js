// What of episode 3 can be printed (r460, r196): every asset of the scene, for lab/print/?ep=diffie-hellman.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; strip the decoration
// a print does without; ground is the asset's y where it meets the ground, cut there on export so it
// stands flat (lib/print.js repair). An asset that cannot be printed says why. A new asset in the scene
// gets its line here. The village is this episode's own (js/world.js), not the saga's valley.
import { pot, chest, certificate } from './props.js';
import { person } from '../../lib/cast.js';
import { table, TABLE_SIZE } from './world.js';

const kids = (o, test) => o.children.find(test);
const width = (c, w) => c.isMesh && c.geometry.type === 'BoxGeometry' && c.geometry.parameters.width === w;
// a pot as the story shows it: empty (a pot's paint is a disc at its level and a band round the tin)
const tin = seal => { const p = pot(); p.userData.setSeal(seal); return p; };

export const ASSETS = [
  { id: 'alice', label: 'Alice, the cast figure (lib/cast.js): blue robe, scarf and a bun', kind: 'figure', size: { h: 60 }, get: () => person('a') },
  { id: 'bob', label: 'Bob, the cast figure: yellow robe, flat cap, belt with a gold buckle', kind: 'figure', size: { h: 60 }, get: () => person('b') },
  { id: 'eve', label: 'Eve, the cast figure: the spy, black fedora with a red band, eye mask', kind: 'figure', size: { h: 60 }, get: () => person('e') },
  { id: 'courier', label: 'A courier, the cast messenger with a postman\'s cap and his satchel (two carry the pots along the road)', kind: 'figure', size: { h: 56 },
    get: () => person('n', { hat: 'postCap' }) },
  { id: 'pot', label: 'A paint pot, its handle up (the paint is a colour, not a shape: paint the print)', kind: 'prop', size: { h: 25 },
    get: () => tin(null) },
  { id: 'pot-sealed', label: "A pot with Bob's gold seal on its side (the parade)", kind: 'prop', size: { h: 25 },
    get: () => tin('bob') },
  { id: 'chest', label: 'The chest that carries the message, its two bands the colour that locks it', kind: 'prop', size: { max: 30 },
    get: () => chest(),
    // the letter, its ribbon and the lid's underside are inside the shut chest: only seen when it opens
    strip: (d, o) => ({ letter: kids(o, c => c.geometry?.type === 'CylinderGeometry' && c.geometry.parameters.height === 1.2),
      ribbon: kids(o, c => c.geometry?.type === 'TorusGeometry'),
      underside: kids(kids(o, c => c.isGroup), c => c.geometry?.type === 'PlaneGeometry') }) },
  { id: 'certificate', label: "Bob's certificate: a framed plaque with his gold seal", kind: 'prop', size: { h: 25 },
    get: () => certificate() },
  { id: 'table', label: 'A table with its shelf for the back row of pots (one each for Alice, Eve, Bob)', kind: 'prop', size: { max: 70 },
    get: () => table(...TABLE_SIZE.a) },
  { id: 'cottage', label: "Alice's cottage (blue roof)", kind: 'landmark', size: { max: 110 }, ground: 0,
    get: d => d.world.houseA },
  { id: 'tower', label: "Eve's watchtower by the road, red slits and roof", kind: 'landmark', size: { h: 150 }, ground: 0,
    get: d => d.world.eveTower },
  { id: 'workshop', label: "Bob's workshop: chimney and forge (the forge's glow is a light, left out)", kind: 'landmark', size: { max: 120 }, ground: 0,
    get: d => d.world.shop },
  { id: 'house', label: 'A house of the village (7 around, each roof its own colour)', kind: 'landmark', size: { max: 90 }, ground: 0,
    get: d => kids(d.scene, c => c.isGroup && width(c.children[0], 5.5)) },
  { id: 'tree', label: 'A tree of the groves', kind: 'tree', size: { h: 70 }, instances: 1,
    get: d => kids(d.scene, c => c.children.length === 2 && c.children.every(m => m.isInstancedMesh)) },
  { id: 'terrain', label: 'The meadow, the hills and the road', kind: 'ground', printable: false,
    why: 'the ground the pieces stand on, 440 units across with the road painted on it: print a mat or a board, not a piece' },
  { id: 'sky', label: 'The golden-hour sky and its clouds', kind: 'sky', printable: false,
    why: 'a dome around the whole scene with clouds hung 90 units up: nothing to stand on a table' },
  { id: 'smoke', label: "The smoke of Bob's chimney", kind: 'light', printable: false,
    why: 'see-through puffs that rise and fade, not matter' },
  { id: 'stream', label: 'The ribbon of paint while one pot is poured into another', kind: 'light', printable: false,
    why: 'paint in motion: an open tube shown only while pouring' },
  { id: 'labels', label: 'The tags over the pots (colour, number) and their stems', kind: 'text', printable: false,
    why: 'screen text: sprites that face the camera' },
  { id: 'bursts', label: 'The sparks, rings and icons (eye, tick) over a pot or a person', kind: 'light', printable: false,
    why: 'light, not matter: particles that burst and fade' },
];
