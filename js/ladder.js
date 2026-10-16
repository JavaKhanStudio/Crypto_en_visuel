// The "who knows what" ladder: one rung per message that arrived, the top rung
// always grey, since the sender of the last message never knows it arrived.
// Mirrored in 3D by glowing blocks stacking above each castle.
import * as THREE from 'three';
import { t, raw } from './i18n.js';
import { COLORS, CASTLE_A, CASTLE_B } from './world.js';

const rungsEl = document.getElementById('ladder-rungs'), verdictEl = document.getElementById('ladder-verdict');

export function sentence(n) {
  const knows = raw('knows'), who = raw('who');
  // level 1 is Bob's; level n belongs to Bob when n is odd, Alice when even
  const owner = k => (k % 2 ? who.b : who.a);
  if (n <= 4) { let s = null; for (let k = 1; k <= n; k++) s = knows(owner(k), s); return s; }
  // too long to print in full: the two outermost levels, an ellipsis, the plan
  const inner = knows(owner(1), null);
  return knows(owner(n), knows(owner(n - 1), raw('ellipsis')(n - 3) + ' ' + inner));
}

export function renderLadder(sim) {
  const n = sim.level;
  rungsEl.innerHTML = '';
  if (!n) { const li = document.createElement('li'); li.className = 'a'; li.textContent = t('ladder.empty'); rungsEl.appendChild(li); }
  for (let k = 1; k <= n; k++) {
    const li = document.createElement('li'); li.className = k % 2 ? 'b' : 'a';
    li.textContent = `${k}. ${sentence(k)}`; rungsEl.appendChild(li);
  }
  const unk = document.createElement('li'); unk.className = 'unknown';
  unk.textContent = t('ladder.unknown', { n: n + 1 }); rungsEl.appendChild(unk);
  // whoever sent the last messenger is the one left in doubt
  let v = n ? t('ladder.verdict', { who: raw('who')[sim.lastFrom || (n % 2 ? 'a' : 'b')] }) : t('ladder.verdict0');
  if (sim.forgedBelief) v += ' ' + t('ladder.forged');
  verdictEl.textContent = v;
  towers.set(n);
}

// --- 3D: knowledge blocks above the castles ---
const towers = {
  blocks: [], scene: null,
  init(scene) { this.scene = scene; this.q = this.makeQ(); scene.add(this.q); },
  makeQ() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.font = 'bold 100px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', 64, 70);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), color: 0xff8090, transparent: true, depthTest: false }));
    s.scale.setScalar(4); s.renderOrder = 9; return s;
  },
  set(n) {
    while (this.blocks.length > n) this.scene.remove(this.blocks.pop().mesh);
    while (this.blocks.length < n) {
      const k = this.blocks.length + 1, team = k % 2 ? 'b' : 'a', base = team === 'a' ? CASTLE_A : CASTLE_B;
      const height = Math.ceil(k / 2);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.5, 3.2), new THREE.MeshStandardMaterial({ color: COLORS[team], emissive: COLORS[team], emissiveIntensity: 1.2, transparent: true, opacity: .9 }));
      mesh.position.set(base.x, base.y + 14 + height * 2.1, base.z - 17);   // a column behind the castle
      mesh.scale.setScalar(.01);
      mesh.visible = !this.hidden; this.scene.add(mesh); this.blocks.push({ mesh, born: performance.now() });
    }
    // the "?" floats over whoever would receive the next message
    const next = (n + 1) % 2 ? 'b' : 'a', base = next === 'a' ? CASTLE_A : CASTLE_B;
    this.qTarget = new THREE.Vector3(base.x, base.y + 14 + (Math.ceil((n + 1) / 2)) * 2.1 + .6, base.z - 17);
    if (!this.q.position.lengthSq()) this.q.position.copy(this.qTarget);
  },
  setVisible(v) { this.q.visible = v; for (const b of this.blocks) b.mesh.visible = v; this.hidden = !v; },
  update(dt, time) {
    for (const b of this.blocks) {
      const age = (performance.now() - b.born) / 1000, s = age < .6 ? 1 - Math.pow(1 - age / .6, 3) * Math.cos(age * 12) : 1;
      b.mesh.scale.setScalar(Math.max(.01, s)); b.mesh.rotation.y += dt * .6;
    }
    if (this.qTarget) { this.q.position.lerp(this.qTarget, 1 - Math.pow(.03, dt)); this.q.position.y += Math.sin(time * 3) * .02; this.q.material.opacity = .6 + Math.sin(time * 5) * .35; }
  },
};
export const ladder3d = towers;
