// The desk of the Enigma family's posts (5.1, 5.2): one copy, read by lib/enigma/world.js and
// re-exported by each episode's js/props.js (its print assets list it).
import * as THREE from 'three';

// A desk on four legs, its top at TOP_DESK.
export const DESK_TOP = 7.5;
export function desk(w = 14, d = 7) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: .85, flatShading: true });
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, .4, d), wood); top.position.y = DESK_TOP - .2; top.castShadow = top.receiveShadow = true; g.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.5, DESK_TOP - .4, .5), wood);
    leg.position.set(sx * (w / 2 - .5), (DESK_TOP - .4) / 2, sz * (d / 2 - .5)); leg.castShadow = true; g.add(leg);
  }
  return g;
}
