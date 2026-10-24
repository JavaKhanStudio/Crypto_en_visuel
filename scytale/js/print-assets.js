// What of episode 4 can be printed (r461, r196): every asset of the scene, for lab/print/?ep=scytale.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; strip the decoration
// a print does without; ground is the asset's y where it meets the ground, cut there on export so it
// stands flat (lib/print.js repair). An asset that cannot be printed says why. A new asset in the scene
// gets its line here. The Greek village is this episode's own (js/world.js), not the saga's valley.
// The sticks and their cradles are sized together: a printed stick rests in its printed cradles.
import { stick, stylus } from './props.js';
import { person } from '../../lib/cast.js';
import { table, TABLE_SIZE } from './world.js';
import { STICKS } from './stage.js';

const kids = (o, test) => o.children.find(test);
const width = (c, w) => c.isMesh && c.geometry.type === 'BoxGeometry' && c.geometry.parameters.width === w;
// a scytale as the story lays it on a table: k letters a turn, its own wood
const rod = id => stick(STICKS[id][2], STICKS[id][3]);
// the three dark grooves along a stick (0.04 square bars on the wood): painted lines, not shapes
const grooves = (d, o) => ({ grooves: o.children[0].children.filter(c => c.geometry?.type === 'BoxGeometry') });

// the cradles printed deeper (r553): in the scene a fork is 0.32 wide, narrower than the sticks it shows
// holding (0.56 across at 4 a turn, 0.70 at 5), its prongs float beside a post 0.18 x 0.3. Printed, the
// prongs spread 3 times as far (the fork 0.96 wide, the thickest stick fits) and each post is 4.4 times
// as deep, so the prongs stand on its ends and it stands on the bed. The scene keeps its own.
const depth = (o, dd) => o.children.filter(c => c.geometry.parameters.depth === dd);
export const deep = (d, o) => ({ posts: [depth(o, .3), [1, 1, 4.4]], prongs: [depth(o, .08), [1, 1, 3]] });

export const ASSETS = [
  { id: 'alice', label: 'Alice, the cast figure (lib/cast.js) in Rome: blue robe, white veil over her bun, toga, a scytale in her fist', kind: 'figure', size: { h: 60 },
    get: () => person('a', { disguise: 'roman' }) },
  { id: 'bob', label: 'Bob, the cast figure in Rome: yellow robe, laurel wreath, toga, a scytale in his fist', kind: 'figure', size: { h: 60 },
    get: () => person('b', { disguise: 'roman' }) },
  { id: 'eve', label: 'Eve, the cast figure in Rome: the spy, black galea helmet, cape, eye mask', kind: 'figure', size: { h: 60 },
    get: () => person('e', { disguise: 'roman' }) },
  { id: 'courier', label: 'The messenger, the cast figure: broad hat, satchel, a scroll (he carries the strip rolled on his head)', kind: 'figure', size: { h: 60 },
    get: () => person('n', { disguise: 'roman' }) },
  { id: 'scytale-4', label: "Alice's and Bob's scytale, 4 letters a turn", kind: 'prop', size: { max: 70 },
    get: () => rod('a'), strip: grooves },
  { id: 'scytale-3', label: "Eve's thinner stick, 3 letters a turn", kind: 'prop', size: { max: 70 },
    get: () => rod('eT'), strip: grooves },
  { id: 'scytale-5', label: "Eve's thicker stick, 5 letters a turn", kind: 'prop', size: { max: 70 },
    get: () => rod('eG'), strip: grooves },
  { id: 'cradles', label: 'The two forked stands a stick rests in (one pair under each stick)', kind: 'prop', size: { max: 56 },
    get: d => d.stage.sticks.a.userData.cradles, scale: deep },
  { id: 'stylus', label: "Alice's bronze stylus", kind: 'prop', size: { h: 30 }, get: () => stylus() },
  { id: 'table', label: 'A long table, the sticks at its back, the strip at its front (one each for Alice, Eve, Bob)', kind: 'prop', size: { max: 100 },
    get: () => table(...TABLE_SIZE.a) },
  { id: 'cottage', label: "Alice's cottage (blue roof)", kind: 'landmark', size: { max: 110 }, ground: 0,
    get: d => d.world.houseA },
  { id: 'tower', label: "Eve's watchtower by the road, red slits and roof", kind: 'landmark', size: { h: 150 }, ground: 0,
    get: d => d.world.eveTower },
  { id: 'workshop', label: "Bob's workshop: chimney and forge (the forge's glow is a light, left out)", kind: 'landmark', size: { max: 120 }, ground: 0,
    get: d => d.world.shop },
  { id: 'house', label: 'A house of the village (6 around, white walls, terracotta roofs)', kind: 'landmark', size: { max: 90 }, ground: 0,
    get: d => kids(d.scene, c => c.isGroup && width(c.children[0], 5.5)) },
  { id: 'temple', label: 'The small Doric temple on the hill', kind: 'landmark', size: { max: 120 }, ground: 0,
    get: d => kids(d.scene, c => c.isGroup && c.children.length > 20 && c.children.some(m => m.geometry?.type === 'ExtrudeGeometry')) },
  { id: 'tree', label: 'An olive tree of the groves', kind: 'tree', size: { h: 70 }, instances: 1,
    get: d => kids(d.scene, c => c.children.length === 2 && c.children.every(m => m.isInstancedMesh)) },
  { id: 'strip', label: 'The leather strip and its letters', kind: 'prop', printable: false,
    why: 'a ribbon 0.42 wide whose letters are its texture, its shape set each frame: cut it from paper and wind it on a printed stick' },
  { id: 'terrain', label: 'The meadow, the hills, the mountains and the road', kind: 'ground', printable: false,
    why: 'the ground the pieces stand on, 440 units across with the road painted on it: print a mat or a board, not a piece' },
  { id: 'sky', label: 'The golden-hour sky and its clouds', kind: 'sky', printable: false,
    why: 'a dome around the whole scene with clouds hung 90 units up: nothing to stand on a table' },
  { id: 'smoke', label: "The smoke of Bob's chimney", kind: 'light', printable: false,
    why: 'see-through puffs that rise and fade, not matter' },
  { id: 'labels', label: 'The tags over the sticks and the strip (« 4 lettres par tour », « ATTAQ »)', kind: 'text', printable: false,
    why: 'screen text: sprites that face the camera' },
  { id: 'bursts', label: 'The sparks, rings, icons and fireworks over a stick or a person', kind: 'light', printable: false,
    why: 'light, not matter: particles that burst and fade' },
];
