// What of episode 11 can be printed (r470, r196): every asset of the scene, for lab/print/?ep=aes-interieur.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; strip the decoration
// a print does without; ground is the asset's y where it meets the ground, cut there on export so it
// stands flat (lib/print.js repair). An asset that cannot be printed says why. A new asset in the scene
// gets its line here. The room is 1.2's keep (lib/room-parts.js buildRoom) and the cubes, tiles and box
// are js/room.js's machine(): there is no figure in this episode. The story shows and hides every cube,
// tile and the box by beat, and a hidden mesh is not printed (lib/print.js pieces), so each is a clone
// of the page's own, shown: same geometry and material, nothing rebuilt here. A byte cube is 1.15
// units, printed as a 16 mm die (about 14 mm a unit); its value and a tile's are painted on the face.
import * as THREE from 'three';

const kids = (o, test) => o.children.find(test);
const box = (w, d) => c => c.isMesh && c.geometry.type === 'BoxGeometry' && c.geometry.parameters.width === w && c.geometry.parameters.depth === d;
const shownCopy = o => { const c = o.clone(); c.visible = true; c.scale.setScalar(1); return c; };
// a torch of the wall: its iron holder and its flame (the flame is a ball before the holder's top,
// struck to it on export); the point light that flickers with it is not a mesh
function torch(scene) {
  const holder = kids(scene, c => c.isMesh && c.geometry.type === 'CylinderGeometry' && c.geometry.parameters.radiusTop === .1);
  const flame = kids(scene, c => c.isMesh && c.geometry.type === 'SphereGeometry' && c.geometry.parameters.radius === .32
    && c.position.x === holder.position.x);
  const g = new THREE.Group(); g.add(holder.clone(), flame.clone()); return g;
}

export const ASSETS = [
  { id: 'cube', label: 'A byte of the state: a cube coloured by its value, its hex on the front (16 float in the grid)', kind: 'prop',
    size: { max: 16 }, get: d => shownCopy(kids(d.scene, c => c.isMesh && c.userData.outline)) },
  { id: 'tile', label: "A byte tile: the order's letters, the IV, P1 ⊕ IV, the round keys and C1 (the face painted in its colour)",
    kind: 'prop', size: { max: 14 }, get: d => shownCopy(kids(d.scene, box(1, .22))) },
  { id: 'box', label: 'The closed AES box of episode 1.2, dark metal with gold edges, that the first step opens', kind: 'prop',
    size: { max: 100 }, get: d => shownCopy(kids(d.scene, box(7, 4.4))) },
  { id: 'torch', label: 'A torch on the wall of the keep, its holder and its flame (two)', kind: 'prop', size: { h: 30 },
    get: d => torch(d.scene) },
  { id: 'wall', label: "The keep's back wall of stone blocks (28 across)", kind: 'ground', printable: false,
    why: 'the backdrop behind the cubes, 56 units wide (about 780 mm at the cubes\' scale): print a card or a board, not a piece' },
  { id: 'floor', label: 'The stone floor of the keep', kind: 'ground', printable: false,
    why: 'the ground the pieces stand on: print a mat or a board, not a piece' },
  { id: 'lights', label: 'The torches\' flicker, the light over the machine and the key light', kind: 'light', printable: false,
    why: 'light, not matter' },
  { id: 'leader', label: 'The white leader from the S-box label down to the turning cube, and its frame', kind: 'text', printable: false,
    why: 'a screen mark drawn over everything (no depth test), a pointer, not part of the room' },
  { id: 'outlines', label: 'The red outlines round the bytes that differ from Alice\'s run', kind: 'text', printable: false,
    why: 'screen marks: lines, no volume' },
  { id: 'labels', label: 'The floating words: AES-256, the step at work, the round, P1, IV, ⊕, =, K0-K14, C1', kind: 'text',
    printable: false, why: 'screen text: sprites drawn on a canvas' },
  { id: 'bubbles', label: "Alice's speech bubbles", kind: 'text', printable: false,
    why: 'screen text: HTML over the scene, not in it' },
  { id: 'bursts', label: "The fireworks of a right quiz answer and of the quiz's end", kind: 'light', printable: false,
    why: 'light, not matter: particles that burst and fade' },
];
