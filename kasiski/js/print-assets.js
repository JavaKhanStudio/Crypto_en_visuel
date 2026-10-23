// What of the Kasiski episode can be printed (r468, r196): every asset of the scene, for lab/print/?ep=kasiski.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; strip the decoration
// a print does without; ground is the asset's y where it meets the ground, cut there on export so it
// stands flat (lib/print.js repair). An asset that cannot be printed says why. A new asset in the scene
// gets its line here. The road, the farm and the cast are this episode's own (js/props.js, js/world.js):
// nothing here comes from the saga. The cart is built fresh, not read from the page: the story hides it
// once the lane is out, and a hidden mesh is not printed. Its stone sits 2 cm into the road at rest
// (wedged under the tyre): ground: 0 cuts it there, so the cart stands on its wheels, not on the stone.
import { car, keyWheel, person } from './props.js';

const kids = (o, test) => o.children.find(test);
// a house of the farm (world.js house()): a group whose first child is its walls, w wide
const house = w => c => c.isGroup && c.children[0]?.geometry?.type === 'BoxGeometry' && c.children[0].geometry.parameters.width === w;
// the key letters: textured planes on the five faces and on the drum's front, painted, not shapes
const letters = (d, o) => ({ plates: o.userData.plates, 'side letters': o.userData.sides });

export const ASSETS = [
  { id: 'alice', label: 'Alice, blue scarf and a bun', kind: 'figure', size: { h: 60 }, get: () => person('a') },
  { id: 'eve', label: 'Eve, the spy: fedora with a red band, eye mask', kind: 'figure', size: { h: 60 }, get: () => person('e') },
  { id: 'cart', label: "Alice's farm cart and its horse, Alice and Bob on the bench, the stone under the near front wheel", kind: 'prop',
    size: { max: 150 }, ground: 0, get: () => car() },
  { id: 'key-wheel', label: 'The key wheel LEMON: a five-sided drum, one key letter a face', kind: 'prop', size: { max: 55 },
    get: () => keyWheel(), strip: letters },
  { id: 'farmhouse', label: 'The farmhouse, white walls, lit windows', kind: 'landmark', size: { max: 120 }, ground: 0,
    get: d => kids(d.scene, house(9)) },
  { id: 'barn', label: 'The red barn', kind: 'landmark', size: { max: 140 }, ground: 0,
    get: d => kids(d.scene, house(11)) },
  { id: 'tree', label: 'A poplar of the row behind the lane (the scattered oaks share its mesh)', kind: 'tree', size: { h: 100 }, instances: 1,
    get: d => kids(d.scene, c => c.children.length === 2 && c.children.every(m => m.isInstancedMesh)) },
  { id: 'tiles', label: 'The 96 letter tiles of the lane, plain, then stamped gold', kind: 'prop', printable: false,
    why: 'flat squares whose letter is their texture: a blank tile says nothing; cut them from card' },
  { id: 'lane', label: 'The paved lane and its kerbs, 100 units long', kind: 'ground', printable: false,
    why: 'a strip of ground the length of the scene that the tiles lie on: print a mat, not a piece' },
  { id: 'fence', label: 'The fence between the road and the lane, and the hedge on the near side', kind: 'ground', printable: false,
    why: 'scenery running 118 units along the road, posts 0.12 thick: a board, or model-railway fencing' },
  { id: 'terrain', label: 'The fields, the hills, the dirt road and its ruts', kind: 'ground', printable: false,
    why: 'the ground the pieces stand on, 460 units across with the road painted on it: print a mat or a board, not a piece' },
  { id: 'marks', label: 'The puddles, the dents the stone leaves in them and the tread across them', kind: 'ground', printable: false,
    why: 'marks painted on the road, a few centimetres high at most: draw them on the board' },
  { id: 'sky', label: 'The washed sky and its clouds', kind: 'sky', printable: false,
    why: 'a dome around the whole scene with clouds hung 85 units up: nothing to stand on a table' },
  { id: 'bars', label: "Eve's bar chart of the candidate lengths, and the counts over each bar", kind: 'text', printable: false,
    why: 'a chart that grows with the counts the story computes: data on the screen, not a piece' },
  { id: 'arcs', label: "Eve's tape between the marks and the arcs between repeated groups on the lane", kind: 'light', printable: false,
    why: 'glowing tubes drawn over the ground to show a distance: a diagram, not matter' },
  { id: 'labels', label: 'The tags over the road and the lane (« 4 m », « 2 m divise 10 écarts »)', kind: 'text', printable: false,
    why: 'screen text: sprites that face the camera' },
  { id: 'bursts', label: 'The dust puffs, mud splashes, red rings and gold sparks', kind: 'light', printable: false,
    why: 'light, not matter: particles that burst and fade' },
];
