// What of episode 8 can be printed (r467, r196): every asset of the scene, for lab/print/?ep=garde.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; strip the decoration
// a print does without; ground is the asset's y where it meets the ground, cut there on export so it
// stands flat (lib/print.js repair). An asset that cannot be printed says why. A new asset in the scene
// gets its line here. Bob's bank is this episode's own (js/world.js): one unit is 10 cm, so a person
// (about 17 units) at 60 mm puts the hall at about 3.5 mm a unit.
import { badge, booth, gate, bobDesk, chart, stopwatch } from './props.js';
import { person } from '../../ficelle/lib/cast.js';
import { MSG_A, MAC_A } from './data.js';

const plane = c => c.isMesh && (c.geometry.type === 'PlaneGeometry' || c.geometry.type === 'CircleGeometry');
const flats = o => { const out = []; o.traverse(c => { if (plane(c)) out.push(c); }); return out; };
// Alice's badge, her order and its HMAC painted on its face
function aliceBadge() {
  const b = badge(); b.userData.paint({ who: 'a', msg: MSG_A, recu: MAC_A }, { badge: 'BADGE' }); return b;
}

export const ASSETS = [
  { id: 'alice', label: 'Alice, the cast figure (lib/cast.js): blue robe, a bun, the blue scarf ring', kind: 'figure', size: { h: 60 },
    get: () => person('a', { scale: 5.3 }) },
  { id: 'bob', label: 'Bob, the cast figure: yellow robe, flat cap, leather belt with a gold buckle', kind: 'figure', size: { h: 60 },
    get: () => person('b', { scale: 5.3 }) },
  { id: 'eve', label: 'Eve, the cast figure: the spy, black fedora with a red band, eye mask', kind: 'figure', size: { h: 60 },
    get: () => person('e', { scale: 5.3 }) },
  { id: 'guard', label: 'The guard, the cast figure: peaked cap with a gold band, a star half sunk in the chest, a moustache', kind: 'figure',
    size: { h: 62 }, get: () => person('g', { scale: 5.3 }) },
  { id: 'badge', label: 'A badge: an order and its HMAC (Alice\'s blue, Eve\'s red: paint its face)', kind: 'prop',
    size: { max: 40 }, get: aliceBadge,
    // the order and the HMAC are a picture on a sheet over the front
    strip: (d, o) => ({ face: flats(o) }) },
  { id: 'booth', label: "The guard's booth: counter, two posts, the sign 'if mac == recu:' and its lamp", kind: 'landmark',
    size: { h: 105 }, ground: 0, get: () => booth(),
    // the lamp's bulb glows green or red: light; the sign is text on a sheet
    omit: (d, o) => [o.userData.bulb],
    strip: (d, o) => ({ sign: [o.userData.sign] }) },
  { id: 'gate', label: "The gate to Bob's office: two posts and a barred gold leaf", kind: 'landmark', size: { h: 90 }, ground: 0,
    get: () => gate() },
  { id: 'bob-desk', label: "Bob's desk and his ledger of the orders let through, on its stand", kind: 'prop', size: { max: 63 },
    get: () => bobDesk(),
    // the ledger's page is a picture on a sheet; the desk lamp is a light, skipped
    strip: (d, o) => ({ ledger: [o.userData.ledger] }) },
  { id: 'chart', label: "Eve's chart on its stand: how long the guard took for each letter (paint or glue its face)", kind: 'prop',
    size: { h: 105 }, ground: 0, get: () => chart(),
    strip: (d, o) => ({ face: [o.userData.face] }) },
  { id: 'stopwatch', label: 'The stopwatch that floats by Eve while she times the guard (paint its face)', kind: 'prop',
    size: { h: 25 }, get: () => stopwatch(), strip: (d, o) => ({ face: [o.userData.face] }) },
  { id: 'board', label: 'The board on the wall behind the guard: mac over recu, 64 hex letters', kind: 'text', printable: false,
    why: 'screen text on a panel that hangs on the wall, 80 units across (280 mm): print it as a card, not a piece' },
  { id: 'hall', label: "Bob's bank: marble floor and its tiles, walls, columns, the gold cornice, the low wall of Bob's office", kind: 'ground',
    printable: false, why: 'the hall the pieces stand in, 420 units across: print a mat or a board, not a piece' },
  { id: 'lamps', label: 'The four hanging globes', kind: 'light', printable: false,
    why: 'glowing globes 56 units up on rods from the ceiling: nothing to stand on a table' },
  { id: 'bubbles', label: 'The speech bubbles over Alice, Bob, Eve and the guard', kind: 'text', printable: false,
    why: 'screen text: HTML over the scene, not in it' },
  { id: 'bursts', label: 'The sparks, icons and fireworks over a badge or a person', kind: 'light', printable: false,
    why: 'light, not matter: particles that burst and fade' },
];
