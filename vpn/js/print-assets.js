// What of episode 10 can be printed (r469, r196): every asset of the scene, for lab/print/?ep=vpn.
// get(demo) returns the asset's 3D object, read from the running page (demo = its window.demo) or
// built by the episode's own builder; size is its board-game size (lib/print.js fit: h = height in
// mm, max = longest side in mm); omit names the parts that are light, not matter; strip the decoration
// a print does without; ground is the asset's y where it meets the ground, cut there on export so it
// stands flat (lib/print.js repair). An asset that cannot be printed says why. A new asset in the scene
// gets its line here. The map is this episode's own (js/world.js): one unit is one metre, a person 1.8 m;
// the servers and the laptops are Shadow's (assets/shapes), read from the page as world.js placed them.
import { envelope, pole } from './props.js';
import { person } from '../../ficelle/lib/cast.js';
import { SPOTS, NODES, HALLS, CABLE_Y } from './world.js';

const flats = o => { const out = []; o.traverse(c => { if (c.isMesh && (c.geometry.type === 'PlaneGeometry' || c.geometry.type === 'CircleGeometry')) out.push(c); }); return out; };
const glow = hex => o => { const out = []; o.traverse(c => { if (c.isMesh && c.material.emissive?.getHex() === hex) out.push(c); }); return out; };
// a building of the map as world.js placed it, by the spot it stands on
const solidAt = (d, x, z) => d.scene.children.find(c => c.userData.solid && c.position.x === x && c.position.z === z);
// a copy of scene objects, moved so that `at` is the copy's origin
function gather(d, at, objs) {
  const g = new d.THREE.Group();
  for (const o of objs) { const c = o.clone(); c.position.sub(at); g.add(c); }
  return g;
}
// the café as the map shows it: the building, its striped awning, the Wi-Fi box on the roof
function cafe(d) {
  const at = SPOTS.cafe, awning = d.scene.children.find(c => c.userData.solid && c.position.y > 0 && c.position.x === at.x);
  return gather(d, at, [solidAt(d, at.x, at.z), awning, d.world.router]);
}
// a copy of one placed object, back at the origin, unturned, at its built size
const at0 = o => { const c = o.clone(); c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); c.scale.setScalar(1); return c; };
// a hall with no roof, empty: its racks print apart (the 'rack' piece), as many as the rows hold
// a key as the stage holds it, hidden until its step: the copy is shown, laid flat on the bed (as r558
// lays episode 1.4's), cut where the bits' flat faces (0.03 deep) meet it, so the whole key rests on the bed
const keyOf = name => d => { const k = at0(d.stage.keys.a[name]), g = new d.THREE.Group(); k.visible = true; k.rotation.x = -Math.PI / 2; g.add(k); return g; };
const hallOf = k => d => at0(solidAt(d, HALLS[k].x, HALLS[k].z));
// Alice's bar table and the cup of coffee on it (her laptop is the 'laptop' piece)
const barTable = d => gather(d, SPOTS.tableA, d.scene.children.filter(c => c.isGroup && c !== d.world.laptops.a
  && Math.hypot(c.position.x - SPOTS.tableA.x, c.position.z - SPOTS.tableA.z) < .4));
// the town's trees: one InstancedMesh of trunks and one of crowns; instances: 1 keeps the first tree
const trees = d => d.scene.children.find(c => c.isGroup && c.children.length === 2 && c.children.every(m => m.isInstancedMesh)
  && c.children[1].geometry.type === 'IcosahedronGeometry');

export const ASSETS = [
  { id: 'alice', label: 'Alice, blue robe, a bun and a blue scarf', kind: 'figure', size: { h: 60 }, get: () => person('a') },
  { id: 'bob', label: 'Bob, yellow robe, a flat cap and a belt with a gold buckle', kind: 'figure', size: { h: 60 }, get: () => person('b') },
  { id: 'eve', label: 'Eve, the spy: red robe, black fedora, black eye mask', kind: 'figure', size: { h: 60 }, get: () => person('e') },
  { id: 'victor', label: 'Victor, who runs the VPN server: green hoodie and a headset', kind: 'figure', size: { h: 60 },
    get: () => person('v') },
  { id: 'customer', label: "One of Victor's other customers, a laptop in hand (three at the doors of his town, in purple, rust and teal)",
    kind: 'figure', size: { h: 60 }, get: d => d.stage.customers[0].p },
  { id: 'laptop', label: "A laptop, open (Shadow's: Alice's and Eve's on their tables; paint its screen)", kind: 'prop', size: { max: 20 },
    get: d => at0(d.world.laptops.a) },
  { id: 'table', label: 'A café bar table on one leg, a cup of coffee on it (Alice and Eve each stand at one)', kind: 'prop',
    size: { h: 35 }, ground: 0, get: barTable,
    // the coffee is a flat disc in the cup: paint it
    strip: (d, o) => ({ coffee: flats(o) }) },
  { id: 'router', label: "The café's open Wi-Fi box, two antennas (its light blinks: paint it)", kind: 'prop', size: { max: 20 },
    get: d => at0(d.world.router), omit: (d, o) => glow(0x5fe39a)(o) },
  { id: 'tower', label: "Bob's server, the tower out front of his office (Shadow's)", kind: 'prop', size: { h: 25 }, ground: 0,
    get: d => at0(d.scene.children.find(c => c.position.x === NODES.b.x && c.position.z === NODES.b.z - .4)) },
  { id: 'rack', label: "A server rack (Shadow's): the provider's hall holds three rows, the VPN's two; print as many as the rows",
    kind: 'prop', size: { h: 30 }, ground: 0, get: d => at0(d.world.items.racks[0]) },
  { id: 'envelope', label: 'A packet: an envelope, the address written on the outside', kind: 'prop', size: { max: 30 },
    get: () => envelope('plain') },
  { id: 'envelope-locked', label: "A packet under HTTPS: the envelope with the site's own lock on it", kind: 'prop', size: { max: 30 },
    get: () => envelope('locked') },
  { id: 'envelope-sealed', label: "A packet in the tunnel: the gold case the VPN seals, its lock on the front", kind: 'prop', size: { max: 40 },
    get: () => envelope('sealed') },
  { id: 'envelope-key', label: 'A public key going out: the light blue envelope', kind: 'prop', size: { max: 30 },
    get: () => envelope('key') },
  { id: 'key-secret', label: "A secret key, red (Alice's and Victor's own halves)", kind: 'prop', size: { max: 30 }, ground: -.015,
    get: keyOf('secret') },
  { id: 'key-public', label: 'A public key, blue', kind: 'prop', size: { max: 30 }, ground: -.015, get: keyOf('pub') },
  { id: 'key-shared', label: 'The shared key, gold: what the X25519 exchange gives both sides', kind: 'prop', size: { max: 30 }, ground: -.015,
    get: keyOf('shared') },
  { id: 'cafe', label: "The café: its striped awning over the terrace, the Wi-Fi box on its roof", kind: 'landmark',
    size: { max: 150 }, ground: 0, get: cafe,
    // the box's light blinks green: light
    omit: (d, o) => glow(0x5fe39a)(o) },
  { id: 'hall-isp', label: "The internet provider's server hall, no roof, its plate by the door (racks: the 'rack' piece)", kind: 'landmark',
    size: { max: 150 }, ground: 0, get: hallOf('i'),
    // the plate's words are a picture on a sheet: paint them
    strip: (d, o) => ({ words: flats(o) }) },
  { id: 'hall-vpn', label: "The VPN's server hall up the valley, no roof, its plate by the door (racks: the 'rack' piece)", kind: 'landmark',
    size: { max: 135 }, ground: 0, get: hallOf('v'), strip: (d, o) => ({ words: flats(o) }) },
  { id: 'office', label: "Bob's site: a small office, a gold band over the door", kind: 'landmark', size: { max: 120 }, ground: 0,
    get: d => at0(solidAt(d, SPOTS.bob.x, SPOTS.bob.z)) },
  { id: 'house', label: 'A town house with a red roof (eight on the map, in both towns)', kind: 'landmark', size: { max: 70 }, ground: 0,
    get: d => at0(d.scene.children.find(c => c.userData.solid && c.children.some(m => m.geometry?.type === 'ExtrudeGeometry'))) },
  { id: 'pole', label: 'A utility pole and its cross-arm, that the cables ride on', kind: 'landmark', size: { h: 90 }, ground: 0,
    get: () => pole(CABLE_Y) },
  { id: 'tree', label: 'A tree of the hills around the towns (160 on the map)', kind: 'landmark', size: { h: 70 },
    get: trees, instances: 1 },
  { id: 'cables', label: 'The four cables, café → provider → Bob and through the VPN', kind: 'ground', printable: false,
    why: 'wires 40 to 70 m long from pole to pole: lay a string over the printed poles' },
  { id: 'ground', label: 'The hills, the streets and the valley road', kind: 'ground', printable: false,
    why: 'the map the pieces stand on, about 240 m across: print a mat or a board, not a piece' },
  { id: 'sky', label: 'The sky dome', kind: 'sky', printable: false, why: 'a shaded sphere around the map: nothing to print' },
  { id: 'waves', label: "The Wi-Fi rings that spread from the café's box", kind: 'light', printable: false,
    why: 'light, not matter: rings that grow and fade' },
  { id: 'tags', label: "The floating tags: what each watcher reads, the packets' addresses, the places' names", kind: 'text',
    printable: false, why: 'screen text: sprites that keep their size on the screen' },
  { id: 'bubbles', label: 'The speech bubbles over Alice, Bob, Eve and Victor', kind: 'text', printable: false,
    why: 'screen text: HTML over the scene, not in it' },
  { id: 'bursts', label: 'The rings and sparks where a packet arrives or a key is made', kind: 'light', printable: false,
    why: 'light, not matter: particles that burst and fade' },
];
