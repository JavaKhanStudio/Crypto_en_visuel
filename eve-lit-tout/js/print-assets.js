// What of episode 1.2 can be printed (r454, r196): every asset of the scene, for lab/print/?ep=eve-lit-tout.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; strip the decoration
// a print does without; ground is the asset's y where it meets the ground, cut there on export so it
// stands flat (lib/print.js repair). An asset that cannot be printed says why. A new asset in the scene
// gets its line here. The valley is 1.1's (lib/saga/world.js), so its lines are 1.1's, flags and capes
// stripped as Simon asked there (r453).
import * as THREE from 'three';
import { buildRider, guard } from '../../lib/messenger.js';
import { ROOM } from './inside.js';
import * as A from './values.js';

const kids = (o, test) => o.children.find(test);
const find = (o, test) => { let m; o.traverse(c => { if (!m && test(c)) m = c; }); return m; };
// the AES room of chapter 2, built by inside.js's own aesRoom on the story's first send, landscape
const room = () => { const scene = new THREE.Scene(); ROOM.rooms.aes.build(scene, A.send(A.ORDER.fr, A.KEY1, A.IV1), false); return scene; };
const isBox = c => c.isMesh && c.geometry.type === 'BoxGeometry' && c.geometry.parameters.width === 7;
const isBow = c => c.isMesh && c.geometry.type === 'TorusGeometry' && c.geometry.parameters.radius === .75;
const isRing = c => c.isMesh && c.geometry.type === 'TorusGeometry' && c.geometry.parameters.radius === .95;

export const ASSETS = [
  { id: 'castle-a', label: "Alice's castle (the humans' white city), where the AES room is", kind: 'landmark', size: { max: 150 }, ground: 0,
    get: d => d.world.castleA, omit: d => [d.world.castleA.userData.glow],   // the team ring at its foot is a glow
    strip: d => ({ flag: d.world.castleA.userData.flag }) },
  { id: 'castle-b', label: "Bob's castle (the elves' towers)", kind: 'landmark', size: { max: 150 }, ground: 0,
    get: d => d.world.castleB, omit: d => [d.world.castleB.userData.glow],   // the team ring at its foot is a glow
    strip: d => ({ flag: d.world.castleB.userData.flag }) },
  { id: 'city', label: "Eve's city and her tower with the Eye", kind: 'landmark', size: { max: 150 }, ground: 0,
    get: d => d.world.city, omit: d => [d.world.city.userData.pivot, d.world.city.userData.spot] },
  { id: 'rider-a', label: "Alice's messenger on his horse, the scroll Eve reads at his side", kind: 'figure', size: { h: 90 },
    // the gem above his head is a glow (a beacon to spot him from far), not matter
    get: () => buildRider('a'), omit: (d, o) => [o.userData.beacon], strip: (d, o) => ({ cape: o.userData.cape }) },
  { id: 'guard', label: "Eve's guard with his spear (three stop the rider under her walls)", kind: 'figure', size: { h: 60 },
    get: () => guard() },
  { id: 'tree', label: 'A pine of the forests', kind: 'tree', size: { h: 70 }, instances: 1,
    get: d => kids(d.scene, c => c.children.length === 2 && c.children.every(m => m.isInstancedMesh)) },
  { id: 'torch', label: 'A torch of the road (8 along it)', kind: 'prop', size: { h: 45 },
    get: d => {
      const all = kids(d.scene, c => c.children.length === 16 && c.children.every(m => m.isMesh && m.geometry.type !== 'PlaneGeometry'));
      const g = new d.THREE.Group(); g.add(all.children[0].clone(), all.children[1].clone()); return g;
    } },
  { id: 'aes-box', label: 'The AES-256 machine: its lock on top and its 14 round lamps', kind: 'prop', size: { max: 60 },
    get: () => find(room(), isBox).parent },   // the gold edges are lines, not matter: the lab skips them
  { id: 'aes-key', label: 'The AES key, violet, that turns in the lock', kind: 'prop', size: { h: 40 },
    get: () => find(room(), isBow).parent.parent },
  { id: 'xor-ring', label: 'The CBC gate: the gold ring where a block meets the one before (⊕)', kind: 'prop', size: { max: 30 },
    get: () => find(room(), isRing) },
  { id: 'terrain', label: 'The valley (hills and the road)', kind: 'ground', printable: false,
    why: 'the ground the pieces stand on, 400 units across with the road painted on it: print a mat or a board, not a piece' },
  { id: 'sky', label: 'The sky, the stars and the moon', kind: 'sky', printable: false,
    why: 'a dome around the whole scene, stars are points: nothing to stand on a table' },
  { id: 'beam', label: "The Eye's beam and its spot on the ground", kind: 'light', printable: false,
    why: 'light, not matter: a see-through cone and a glow (left out of the city)' },
  { id: 'room', label: "Alice's room: brick walls, floor, torches", kind: 'ground', printable: false,
    why: 'the inside of the castle the camera stands in, a backdrop around the machine: a diorama, not a piece' },
  { id: 'tiles', label: 'The byte tiles and their labels (the key rack, P1, P2, IV, C1, C2, the round count)', kind: 'text', printable: false,
    why: 'screen text: each tile is a lit square showing a byte, the labels are sprites' },
  { id: 'bursts', label: 'The fireworks over the valley when a quiz answer is right', kind: 'light', printable: false,
    why: 'light, not matter: particles that burst and fade' },
];
