// r425: the candidate doors of the Middle-earth castles (lib/saga/castles.js), in each castle's own space
// (the gate faces local +x; the valley, where the camera watches from, is local +z for Alice's castle,
// built facing 0, and local -z for Bob's, built facing PI). Each is the glass a room's zoom ends on and
// the way out through it; the picked ones go into the castle builders as userData.doors, the contract
// lib/room.js reads (r424): { focus, normal, near: { pos, target } }, made here by door() as keepDoors
// makes the old keep's (focus 3.52 behind the glass, near 12.48 out, 3.5 up, 3 aside).
// make: a lit opening the castle does not have yet (drawn by openings(), and added to the castle with the pick).
import * as THREE from 'three';
import { M } from '../../lib/saga/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TOP = 11.8, T = 10;                  // the white city's top tier and its tower (castles.js TIERS, T)
const G = .9, Y0 = G + 1, H = 21;          // the elf hill's grass, the mallorns' foot, the great one's height
const trunkR = f => 1.5 - .9 * f;          // the great mallorn's trunk radius at a fraction f of its height
const TIER = 1.48;                         // the top tier's window nearest the valley (castles.js: (k + .5) / 8 * 2PI + .3, k = 1)
// the valley-side gate tower's slit (castles.js elfTower(g, 8, -3, 7, .62): slit k at angle k/3*2PI + .5, radius r*.86, h*.35 + k*h*.12 up)
const SLIT = 2 / 3 * Math.PI * 2 + .5;

export const CANDIDATES = {
  a: [
    { id: 'tower', n: 1, name: 'citadel tower window', about: 'The tall white tower, its window over the valley, 18 m up: the highest, a slit .25 wide.',
      glass: V(-.6, TOP + T * .5 + 1.6, -1 + .7), normal: V(0, 0, 1) },
    { id: 'hall', n: 2, name: 'the hall\'s door', about: 'The hall beside the tower and the white tree, on the top tier: a lit door to add on its valley face.',
      glass: V(-1.2, TOP + .65, 1.3 + .9 + .01), normal: V(0, 0, 1), make: { w: .7, h: 1.3 } },
    { id: 'tier', n: 3, name: 'top tier window', about: 'A lit window of the top tier\'s wall, 10.5 m up, one of the eight it already has.',
      glass: V(Math.cos(TIER) * 3.5 * 1.005, TOP - 1.3, Math.sin(TIER) * 3.5 * 1.005), normal: V(Math.cos(TIER), 0, Math.sin(TIER)) },
  ],
  b: [
    { id: 'talan', n: 1, name: 'great mallorn, lower talan', about: 'A lit door in the great mallorn\'s trunk on its first platform, 10.8 m up (to add).',
      glass: V(-1.4, Y0 + .38 * H + .75, -trunkR(.38 + .75 / H) - .01), normal: V(0, 0, -1), make: { w: .7, h: 1.4 } },
    { id: 'high', n: 2, name: 'great mallorn, high talan', about: 'The same, on its upper platform, 16.2 m up, under the gold crown: the lady\'s hall (to add).',
      glass: V(-1.4, Y0 + .64 * H + .75, -trunkR(.64 + .75 / H) - .01), normal: V(0, 0, -1), make: { w: .7, h: 1.4 } },
    { id: 'gate', n: 3, name: 'gate tower window', about: 'The valley-side gate tower\'s third lit slit, 4.1 m up: low, by the road.',
      glass: V(8 + Math.cos(SLIT) * .62 * .86, 7 * .35 + 2 * 7 * .12, -3 + Math.sin(SLIT) * .62 * .86), normal: V(Math.cos(SLIT), 0, Math.sin(SLIT)) },
  ],
};

// a candidate as the r424 contract wants it, in castle space
export function door(c) {
  const n = c.normal.clone().normalize(), aside = Math.abs(n.x) > Math.abs(n.z) ? V(0, 0, 3) : V(3, 0, 0);
  return { focus: c.glass.clone().addScaledVector(n, -3.52), normal: n,
    near: { pos: c.glass.clone().addScaledVector(n, 12.48).add(V(0, 3.5, 0)).add(aside), target: c.glass.clone() } };
}

// in world space, as lib/room.js doorOf() turns userData.doors; glass too, for the lab's tags
export function doorOf(castle, id) {
  const c = CANDIDATES[castle.userData.team].find(x => x.id === id), d = door(c);
  castle.updateWorldMatrix(true, false);
  const m = castle.matrixWorld, at = p => p.clone().applyMatrix4(m);
  return { focus: at(d.focus), normal: d.normal.clone().transformDirection(m), glass: at(c.glass),
    near: { pos: at(d.near.pos), target: at(d.near.target) } };
}

// the lit openings the candidates need that the castle does not have: a pane of M.window just proud of the wall
export function openings(team) {
  const g = new THREE.Group();
  for (const c of CANDIDATES[team]) if (c.make) {
    const o = new THREE.Mesh(new THREE.PlaneGeometry(c.make.w, c.make.h), M.window);
    o.position.copy(c.glass); o.lookAt(c.glass.clone().add(c.normal)); g.add(o);
  }
  return g;
}
