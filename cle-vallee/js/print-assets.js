// What of episode 1.4 can be printed (r456, r196): every asset of the scene, for lab/print/?ep=cle-vallee.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; strip the decoration
// a print does without; ground is the asset's y where it meets the ground, cut there on export so it
// stands flat (lib/print.js repair). An asset that cannot be printed says why. A new asset in the scene
// gets its line here. The valley is 1.1's (lib/saga/world.js), so its lines are 1.1's.
import * as THREE from 'three';
import { buildRider, guard } from '../../lib/messenger.js';
import { cargo } from './props.js';
import { ROOM } from './inside.js';
import { packets } from './story.js';

const kids = (o, test) => o.children.find(test);
const find = (o, test) => { let m; o.traverse(c => { if (!m && test(c)) m = c; }); return m; };
const all = (o, test) => { const m = []; o.traverse(c => test(c) && m.push(c)); return m; };
// a room of the episode, built by inside.js's own builder on the story's packets, landscape
const room = name => { const scene = new THREE.Scene(); ROOM.rooms[name].build(scene, packets(), false); return scene; };
const isBox = (w, h) => c => c.isMesh && c.geometry.type === 'BoxGeometry' && c.geometry.parameters.width === w && c.geometry.parameters.height === h;
// the padlock's keyhole and slot are a dark disc and a dark square laid on its front: paint them on the print
const holes = o => all(o, c => c.isMesh && ['CircleGeometry', 'PlaneGeometry'].includes(c.geometry.type));

export const ASSETS = [
  { id: 'castle-a', label: "Alice's castle (the humans' white city)", kind: 'landmark', size: { max: 150 }, ground: 0,
    get: d => d.world.castleA, omit: d => [d.world.castleA.userData.glow],   // the team ring at its foot is a glow
    strip: d => ({ flag: d.world.castleA.userData.flag }) },
  { id: 'castle-b', label: "Bob's castle (the elves' towers)", kind: 'landmark', size: { max: 150 }, ground: 0,
    get: d => d.world.castleB, omit: d => [d.world.castleB.userData.glow],   // the team ring at its foot is a glow
    strip: d => ({ flag: d.world.castleB.userData.flag }) },
  { id: 'city', label: "Eve's city and her tower with the Eye", kind: 'landmark', size: { max: 150 }, ground: 0,
    get: d => d.world.city, omit: d => [d.world.city.userData.pivot, d.world.city.userData.spot] },
  { id: 'rider-a', label: "Alice's messenger on his horse (he carries her keys, then her locked packet)", kind: 'figure', size: { h: 90 },
    // the gem above his head is a glow (a beacon to spot him from far), not matter
    get: () => buildRider('a'), omit: (d, o) => [o.userData.beacon], strip: (d, o) => ({ cape: o.userData.cape }) },
  { id: 'rider-b', label: "Bob's messenger on his horse (he carries the open padlock west)", kind: 'figure', size: { h: 90 },
    get: () => buildRider('b'), omit: (d, o) => [o.userData.beacon], strip: (d, o) => ({ cape: o.userData.cape }) },
  { id: 'guard', label: "Eve's guard with his spear", kind: 'figure', size: { h: 60 },
    get: () => guard() },
  { id: 'keys', label: "Alice's two keys, the AES key (violet) over the HMAC key (green)", kind: 'prop', size: { max: 35 },
    get: () => cargo('keys') },
  { id: 'padlock-open', label: "Bob's open padlock, his public key", kind: 'prop', size: { h: 35 },
    get: () => cargo('open'), strip: (d, o) => ({ keyhole: holes(o) }) },
  { id: 'padlock-locked', label: "The padlock snapped shut on Alice's keys", kind: 'prop', size: { h: 40 },
    get: () => cargo('locked'), strip: (d, o) => ({ keyhole: holes(o) }) },
  { id: 'rsa-box', label: "The RSA-2048 machine in Alice's keep, Bob's padlock on its front", kind: 'prop', size: { max: 60 },
    get: () => find(room('oaep'), isBox(6, 5.4)).parent, strip: (d, o) => ({ keyhole: holes(o) }) },
  { id: 'lock-box', label: "Bob's first machine, his open padlock on its front (it locks)", kind: 'prop', size: { max: 50 },
    get: () => kids(room('rsa'), c => c.isGroup && c.children.some(isBox(4.4, 4)) && c.children.some(k => k.userData.setOpen)),
    strip: (d, o) => ({ keyhole: holes(o) }) },
  { id: 'key-box', label: "Bob's second machine, his private key on its front (it unlocks)", kind: 'prop', size: { max: 50 },
    get: () => kids(room('rsa'), c => c.isGroup && c.children.some(isBox(4.4, 4)) && !c.children.some(k => k.userData.setOpen)) },
  { id: 'tree', label: 'A pine of the forests', kind: 'tree', size: { h: 70 }, instances: 1,
    get: d => kids(d.scene, c => c.children.length === 2 && c.children.every(m => m.isInstancedMesh)) },
  { id: 'torch', label: 'A torch of the road (8 along it)', kind: 'prop', size: { h: 45 },
    get: d => {
      const all = kids(d.scene, c => c.children.length === 16 && c.children.every(m => m.isMesh && m.geometry.type !== 'PlaneGeometry'));
      const g = new d.THREE.Group(); g.add(all.children[0].clone(), all.children[1].clone()); return g;
    } },
  { id: 'terrain', label: 'The valley (hills and the road)', kind: 'ground', printable: false,
    why: 'the ground the pieces stand on, 400 units across with the road painted on it: print a mat or a board, not a piece' },
  { id: 'sky', label: 'The sky, the stars and the moon', kind: 'sky', printable: false,
    why: 'a dome around the whole scene, stars are points: nothing to stand on a table' },
  { id: 'beam', label: "The Eye's beam and its spot on the ground", kind: 'light', printable: false,
    why: 'light, not matter: a see-through cone and a glow (left out of the city)' },
  { id: 'rooms', label: "The rooms inside Alice's and Bob's keeps: brick walls, floor and lamp", kind: 'ground', printable: false,
    why: 'the inside of a castle the camera stands in, a backdrop around the machines: a diorama, not a piece' },
  { id: 'tiles', label: 'The byte walls and number tiles (EM, c, n, p and q, 5 x 11 = 55) and their labels', kind: 'text', printable: false,
    why: 'screen text: each tile is a lit square showing a byte or a number, the labels are sprites' },
  { id: 'bursts', label: 'The fireworks, sparks and icons over a rider', kind: 'light', printable: false,
    why: 'light, not matter: particles that burst and fade' },
];
