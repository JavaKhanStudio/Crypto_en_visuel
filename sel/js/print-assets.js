// What of episode 7 can be printed (r466, r196): every asset of the scene, for lab/print/?ep=sel.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; strip the decoration
// a print does without; ground is the asset's y where it meets the ground, cut there on export so it
// stands flat (lib/print.js repair). An asset that cannot be printed says why. A new asset in the scene
// gets its line here. The site's back room is this episode's own (js/world.js): one unit is 10 cm, so
// a person (about 17 units) at 60 mm puts the room at about 3.5 mm a unit.
import * as THREE from 'three';
import { card, terminal, shaker, machine, cabinet, eveDesk, rig, stopwatch, COLORS } from './props.js';
import { person } from '../../ficelle/lib/cast.js';

const plane = c => c.isMesh && (c.geometry.type === 'PlaneGeometry' || c.geometry.type === 'CircleGeometry');
const flats = o => { const out = []; o.traverse(c => { if (plane(c)) out.push(c); }); return out; };
// the room's loose racks (room() adds them to the scene one by one): a copy of the one at x, at the origin
function rack(scene, x) {
  const g = new THREE.Group();
  for (const c of scene.children) if (c.isMesh && c.geometry.type === 'BoxGeometry' && c.geometry.parameters.height === 42
    && Math.abs(c.position.x - x) < 1) { const m = c.clone(); m.position.x -= x; m.position.z = 0; g.add(m); }
  return g;
}
// a flying card with a password on it: the box takes the width of its text
function token() {
  const c = card(); c.userData.paint({ kind: 'pw', text: 'password' }); return c;
}

export const ASSETS = [
  { id: 'alice', label: 'Alice, the cast figure (lib/cast.js): blue robe, a bun, the blue scarf ring', kind: 'figure', size: { h: 60 },
    get: () => person('a', { scale: 5.3 }) },
  { id: 'bob', label: 'Bob, the cast figure: yellow robe, flat cap, leather belt with a gold buckle', kind: 'figure', size: { h: 60 },
    get: () => person('b', { scale: 5.3 }) },
  { id: 'eve', label: 'Eve, the cast figure: the spy, black fedora with a red band, eye mask', kind: 'figure', size: { h: 60 },
    get: () => person('e', { scale: 5.3 }) },
  { id: 'card', label: 'A card that flies between the machines (a password, a salt, a fingerprint: paint its text)', kind: 'prop',
    size: { max: 40 }, get: token,
    // the text is a picture on a sheet over the front
    strip: (d, o) => ({ text: flats(o) }) },
  { id: 'terminal', label: "A desk and its terminal, where Alice and Bob sign up (one each: Alice's lit blue, Bob's gold)", kind: 'prop',
    size: { max: 50 }, get: () => terminal(COLORS.a),
    // the login box is a picture on the screen; the coloured glow is a point light, skipped
    strip: (d, o) => ({ screen: flats(o) }) },
  { id: 'shaker', label: 'The salt shaker on its stand', kind: 'prop', size: { h: 65 }, get: () => shaker(),
    // the SEL sign and the cap's holes are paint on the surface
    strip: (d, o) => ({ 'sign and holes': flats(o) }) },
  { id: 'machine', label: 'The hash machine, its bcrypt gear on top (MD5 shows no gear)', kind: 'landmark', size: { h: 80 }, ground: 0,
    get: () => { const m = machine(); m.userData.gear.visible = true; return m; },
    // the glowing mouth is light; the MD5 / bcrypt sign is text on a sheet
    omit: (d, o) => [o.children.find(c => c.material === o.userData.glowM)],
    strip: (d, o) => ({ sign: [o.userData.sign] }) },
  { id: 'base', label: "The site's base: a server cabinet (its table of users is a screen: paint or glue it)", kind: 'landmark',
    size: { h: 150 }, ground: 0, get: () => cabinet(),
    // the table on the front and the rack lights are pictures and lights on sheets
    strip: (d, o) => ({ 'table and lights': flats(o) }) },
  { id: 'eve-desk', label: "Eve's desk: her book of precomputed fingerprints on its stand, her copy of the base on an easel", kind: 'prop',
    size: { max: 90 }, get: () => eveDesk(),
    // the book's pages and the copy are pictures on sheets; the lamp is a light
    strip: (d, o) => ({ 'page and copy': flats(o) }) },
  { id: 'rig', label: "Eve's rig: a box of graphics cards, four fans in front", kind: 'prop', size: { h: 45 }, get: () => rig(),
    // the counter hangs on the wall above the rig, a screen of its own (its line is 'counter')
    strip: (d, o) => ({ counter: [o.userData.screen, o.children.find(c => c.geometry?.parameters?.width === 31.5)] }) },
  { id: 'stopwatch', label: 'The stopwatch by the machine while bcrypt works (paint its face)', kind: 'prop', size: { h: 25 },
    get: () => stopwatch(), strip: (d, o) => ({ face: flats(o) }) },
  { id: 'rack', label: 'A server rack of the back wall (the room has 26 along it)', kind: 'landmark', size: { h: 140 }, ground: 0,
    get: d => rack(d.scene, -190) },
  { id: 'room', label: 'The back room: raised floor and its tiles, walls, cable trays under the ceiling', kind: 'ground', printable: false,
    why: 'the room the pieces stand in, 420 units across: print a mat or a board, not a piece' },
  { id: 'counter', label: "The counter on the wall over Eve's rig (hashes a second)", kind: 'text', printable: false,
    why: 'screen text on a panel that hangs on the wall, 30 units across: nothing to stand on a table' },
  { id: 'lamps', label: 'The five strip lights under the ceiling, the rack lights', kind: 'light', printable: false,
    why: 'glowing tubes and lights 60 units up: nothing to stand on a table' },
  { id: 'bubbles', label: 'The speech bubbles over Alice, Bob and Eve', kind: 'text', printable: false,
    why: 'screen text: HTML over the scene, not in it' },
  { id: 'bursts', label: 'The sparks, rings, icons and fireworks over a card or a person', kind: 'light', printable: false,
    why: 'light, not matter: particles that burst and fade' },
];
