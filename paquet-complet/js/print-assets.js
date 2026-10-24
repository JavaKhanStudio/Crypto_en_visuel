// What of episode 1.5 can be printed (r457, r196): every asset of the scene, for lab/print/?ep=paquet-complet.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; strip the decoration
// a print does without; ground is the asset's y where it meets the ground, cut there on export so it
// stands flat (lib/print.js repair). An asset that cannot be printed says why. A new asset in the scene
// gets its line here. The valley is 1.1's (lib/saga/world.js), so its lines are 1.1's; the rider is
// lib/messenger.js's.
import * as THREE from 'three';
import { buildRider, guard } from '../../ficelle/lib/messenger.js';
import { COLORS } from '../../ficelle/lib/saga/world.js';
import { packet, padlock, key } from './props.js';
import { ROOM } from './inside.js';
import { packets } from './story.js';

const kids = (o, test) => o.children.find(test);
const find = (o, test) => { let m; o.traverse(c => { if (!m && test(c)) m = c; }); return m; };
const all = (o, test) => { const m = []; o.traverse(c => test(c) && m.push(c)); return m; };
// a room of the episode, built by inside.js's own builder on the story's packets, landscape
const room = name => { const scene = new THREE.Scene(); ROOM.rooms[name].build(scene, packets(), false); return scene; };
// a machine of a room (inside.js machine()): its box of width w, with the gold edges and the key slot on top
const isBox = w => c => c.isMesh && c.geometry.type === 'BoxGeometry' && c.geometry.parameters.width === w && c.geometry.parameters.height === 5.4;
const machine = (name, w) => find(room(name), isBox(w)).parent;
// the padlock's keyhole and slot are a dark disc and a dark square laid on its front: paint them on the print
const holes = o => all(o, c => c.isMesh && ['CircleGeometry', 'PlaneGeometry'].includes(c.geometry.type));

export const ASSETS = [
  { id: 'castle-a', label: "Alice's castle (the humans' white city)", kind: 'landmark', size: { max: 150 }, ground: 0,
    get: d => d.world.castleA, omit: d => [d.world.castleA.userData.glow],   // the team ring at its foot is a glow
    bodies: d => ({ flag: d.world.castleA.userData.flag }), flat: ['flag'] },   // r572: the pole is a peg, the flag prints on its cloth
  { id: 'castle-b', label: "Bob's castle (the elves' towers)", kind: 'landmark', size: { max: 150 }, ground: 0,
    get: d => d.world.castleB, omit: d => [d.world.castleB.userData.glow],   // the team ring at its foot is a glow
    bodies: d => ({ flag: d.world.castleB.userData.flag }), flat: ['flag'] },
  { id: 'city', label: "Eve's city and her tower with the Eye", kind: 'landmark', size: { max: 150 }, ground: 0,
    get: d => d.world.city, omit: d => [d.world.city.userData.pivot, d.world.city.userData.spot] },
  { id: 'rider-a', label: "Alice's messenger on his horse (he carries the packet, Alice's and then main.py's)", kind: 'figure', size: { h: 90 },
    // the gem above his head is a glow (a beacon to spot him from far), not matter
    get: () => buildRider('a'), omit: (d, o) => [o.userData.beacon], strip: (d, o) => ({ cape: o.userData.cape }) },
  { id: 'guard', label: "Eve's guard with his spear", kind: 'figure', size: { h: 60 },
    get: () => guard() },
  // the packet that stands turning by a castle (main.js showcase) and rides in the messenger's hand, with its four bricks
  { id: 'packet', label: "The packet: locked keys (Bob's padlock shut on them), IV, ciphertext and seal", kind: 'prop', size: { max: 80 },
    get: () => { const p = packet(); p.userData.show(['ek', 'iv', 'ct', 'tag']); return p; },
    strip: (d, o) => ({ keyhole: holes(o) }) },
  { id: 'padlock', label: "Bob's open padlock, his public key (it sinks into Alice's RSA box and snaps shut on the keys)", kind: 'prop', size: { h: 35 },
    get: () => padlock(COLORS.b), strip: (d, o) => ({ keyhole: holes(o) }) },
  // the scene holds it upright over Bob's RSA box: laid flat on the bed (as 1.4's keys, r558),
  // cut where the bits' flat faces meet the bed so the whole key rests on it
  { id: 'key-bob', label: "Bob's private key (in his gold), the one that opens the locked keys", kind: 'prop', size: { max: 35 }, ground: -.03,
    get: () => { const g = new THREE.Group(), k = key(COLORS.b); k.rotation.x = -Math.PI / 2; g.add(k); return g; } },
  { id: 'machine', label: 'A machine of the rooms, AES-256-CBC, HMAC-SHA256 or RSA-2048 (five of them: two in Alice\'s keep, three in Bob\'s)', kind: 'prop', size: { max: 60 },
    get: () => machine('open', 6) },
  { id: 'urandom-box', label: "The os.urandom machine in Alice's keep (it draws the two keys and the IV)", kind: 'prop', size: { max: 62 },
    get: () => machine('alice', 6.4) },
  { id: 'oaep-box', label: "The RSA-2048-OAEP machine in Alice's keep (Bob's padlock goes into it)", kind: 'prop', size: { max: 64 },
    get: () => machine('alice', 6.6) },
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
  { id: 'lamp', label: "Bob's lamp beside HMAC, green when the seals match, red when they differ", kind: 'light', printable: false,
    why: 'light, not matter: a glowing ball that only changes colour, nothing to stand on a table' },
  { id: 'shutter', label: "The red cross over Bob's AES box when the seal is wrong", kind: 'text', printable: false,
    why: 'a see-through mark drawn over the box for the screen, not part of the machine' },
  { id: 'rooms', label: "The rooms inside Alice's and Bob's keeps: stone walls, floor, torches and the owner's banners", kind: 'ground', printable: false,
    why: 'the inside of a castle the camera stands in, a backdrop around the machines: a diorama, not a piece' },
  { id: 'tiles', label: 'The byte walls (the locked keys, the key bytes, IV and ciphertext, the seals, the plaintext) and their labels', kind: 'text', printable: false,
    why: 'screen text: each tile is a lit square showing a byte or a letter, the labels are sprites' },
  { id: 'bursts', label: 'The fireworks, sparks and icons over a rider', kind: 'light', printable: false,
    why: 'light, not matter: particles that burst and fade' },
];
