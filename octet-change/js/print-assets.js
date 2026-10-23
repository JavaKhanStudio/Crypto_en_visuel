// What of episode 1.3 can be printed (r455, r196): every asset of the scene, for lab/print/?ep=octet-change.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; strip the decoration
// a print does without; ground is the asset's y where it meets the ground, cut there on export so it
// stands flat (lib/print.js repair). An asset that cannot be printed says why. A new asset in the scene
// gets its line here. The valley is 1.1's (lib/saga/world.js), so its lines are 1.1's.
import * as THREE from 'three';
import { buildRider, guard } from '../../lib/messenger.js';
import { ROOM } from './inside.js';
import { packets } from './story.js';

const kids = (o, test) => o.children.find(test);
const find = (o, test) => { let m; o.traverse(c => { if (!m && test(c)) m = c; }); return m; };
// the HMAC room of chapter 2, built by inside.js's own hmacRoom on the story's packets, landscape
const room = () => { const scene = new THREE.Scene(); ROOM.rooms.hmac.build(scene, packets(), false); return scene; };
const isBox = c => c.isMesh && c.geometry.type === 'BoxGeometry' && c.geometry.parameters.width === 7;
const isBow = c => c.isMesh && c.geometry.type === 'TorusGeometry' && c.geometry.parameters.radius === .75;

export const ASSETS = [
  { id: 'castle-a', label: "Alice's castle (the humans' white city)", kind: 'landmark', size: { max: 150 }, ground: 0,
    get: d => d.world.castleA, omit: d => [d.world.castleA.userData.glow] },   // the team ring at its foot is a glow
  { id: 'castle-b', label: "Bob's castle (the elves' towers)", kind: 'landmark', size: { max: 150 }, ground: 0,
    get: d => d.world.castleB, omit: d => [d.world.castleB.userData.glow] },   // the team ring at its foot is a glow
  { id: 'city', label: "Eve's city and her tower with the Eye", kind: 'landmark', size: { max: 150 }, ground: 0,
    get: d => d.world.city, omit: d => [d.world.city.userData.pivot, d.world.city.userData.spot] },
  { id: 'rider-a', label: "Alice's messenger on his horse (the one Eve's guards stop)", kind: 'figure', size: { h: 90 },
    // the gem above his head is a glow (a beacon to spot him from far), not matter
    get: () => buildRider('a'), omit: (d, o) => [o.userData.beacon] },
  { id: 'rider-forged', label: "Eve's forged rider: Alice's colours on a dark horse", kind: 'figure', size: { h: 90 },
    get: () => buildRider('a', true), omit: (d, o) => [o.userData.beacon] },
  { id: 'guard', label: "Eve's guard with his spear", kind: 'figure', size: { h: 60 },
    get: () => guard() },
  { id: 'tree', label: 'A pine of the forests', kind: 'tree', size: { h: 70 }, instances: 1,
    get: d => kids(d.scene, c => c.children.length === 2 && c.children.every(m => m.isInstancedMesh)) },
  { id: 'torch', label: 'A torch of the road (8 along it)', kind: 'prop', size: { h: 45 },
    get: d => {
      const all = kids(d.scene, c => c.children.length === 16 && c.children.every(m => m.isMesh && m.geometry.type !== 'PlaneGeometry'));
      const g = new d.THREE.Group(); g.add(all.children[0].clone(), all.children[1].clone()); return g;
    } },
  { id: 'hmac-box', label: 'The HMAC-SHA256 machine: its lock and the two SHA-256 dials', kind: 'prop', size: { max: 60 },
    get: () => find(room(), isBox).parent,
    // the four bars on each dial are painted on it, 0.04 deep
    strip: (d, o) => ({ spokes: o.children.filter(g => g.isGroup).map(g => g.children.find(c => c.isGroup)) }) },
  { id: 'hmac-key', label: 'The HMAC key (the AES key beside it is the same key, dim)', kind: 'prop', size: { h: 40 },
    get: () => find(room(), isBow).parent.parent },
  { id: 'terrain', label: 'The valley (hills and the road)', kind: 'ground', printable: false,
    why: 'the ground the pieces stand on, 400 units across with the road painted on it: print a mat or a board, not a piece' },
  { id: 'sky', label: 'The sky, the stars and the moon', kind: 'sky', printable: false,
    why: 'a dome around the whole scene, stars are points: nothing to stand on a table' },
  { id: 'beam', label: "The Eye's beam and its spot on the ground", kind: 'light', printable: false,
    why: 'light, not matter: a see-through cone and a glow (left out of the city)' },
  { id: 'room', label: "Alice's room: brick walls, floor and lamp", kind: 'ground', printable: false,
    why: 'the inside of the castle the camera stands in, a backdrop around the machine: a diorama, not a piece' },
  { id: 'tiles', label: 'The byte tiles and their labels (key, IV, C1, C2, the seals)', kind: 'text', printable: false,
    why: 'screen text: each tile is a lit square showing a byte, the labels are sprites' },
  { id: 'bursts', label: 'The fireworks, sparks and icons over a rider', kind: 'light', printable: false,
    why: 'light, not matter: particles that burst and fade' },
];
