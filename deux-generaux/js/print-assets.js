// What of episode 1.1 can be printed (r196): every asset of the scene, for lab/print/?ep=deux-generaux.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; ground is the asset's
// y where it meets the ground, cut there on export so it stands flat (lib/print.js repair). An asset that
// cannot be printed says why. A new asset in the scene gets its line here. strip names the decoration left
// out of the printed piece only (Simon on r396, r453: the castles' flags, the riders' capes); the scene keeps it.
import { buildRider, guard } from '../../lib/messenger.js';

const kids = (o, test) => o.children.find(test);

export const ASSETS = [
  { id: 'castle-a', label: "Alice's castle (the humans' white city)", kind: 'landmark', size: { max: 150 }, ground: 0,
    get: d => d.world.castleA, omit: d => [d.world.castleA.userData.glow],   // the team ring at its foot is a glow
    strip: d => ({ flag: d.world.castleA.userData.flag }) },
  { id: 'castle-b', label: "Bob's castle (the elves' towers)", kind: 'landmark', size: { max: 150 }, ground: 0,
    get: d => d.world.castleB, omit: d => [d.world.castleB.userData.glow],   // the team ring at its foot is a glow
    strip: d => ({ flag: d.world.castleB.userData.flag }) },
  { id: 'city', label: "Eve's city and her tower with the Eye", kind: 'landmark', size: { max: 150 }, ground: 0,
    get: d => d.world.city, omit: d => [d.world.city.userData.pivot, d.world.city.userData.spot] },
  { id: 'rider-a', label: "Alice's messenger on his horse", kind: 'figure', size: { h: 90 },
    // the gem above his head is a glow (a beacon to spot him from far), not matter
    get: () => buildRider('a'), omit: (d, o) => [o.userData.beacon], strip: (d, o) => ({ cape: o.userData.cape }) },
  { id: 'rider-b', label: "Bob's messenger on his horse", kind: 'figure', size: { h: 90 },
    // the gem above his head is a glow (a beacon to spot him from far), not matter
    get: () => buildRider('b'), omit: (d, o) => [o.userData.beacon], strip: (d, o) => ({ cape: o.userData.cape }) },
  { id: 'guard', label: "Eve's guard with his spear", kind: 'figure', size: { h: 60 },
    get: () => guard() },
  { id: 'soldier', label: 'A soldier of the armies (each army is 48 of them)', kind: 'figure', size: { h: 25 },
    // army.js troop(): a cone of radius .6 and height 2; built only while an army marches
    get: d => new d.THREE.Mesh(new d.THREE.ConeGeometry(.6, 2, 6), new d.THREE.MeshStandardMaterial({ color: 0x4da3ff })) },
  { id: 'tree', label: 'A pine of the forests (650 in the valley)', kind: 'tree', size: { h: 70 }, instances: 1,
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
];
