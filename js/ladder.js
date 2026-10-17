// The "who knows what" ladder: one rung per message that arrived, the top rung
// always grey, since the sender of the last message never knows it arrived.
import * as THREE from 'three';
import { t, raw } from './i18n.js';
import { CASTLE_A, CASTLE_B } from './world.js';

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

// --- 3D: a "?" over whoever would receive the next message ---
// (the glowing blocks that once stacked a copy of the ladder behind each castle
// were removed, r27: from most angles they read as stray cubes)
const towers = {
  init(scene) { this.q = this.makeQ(); scene.add(this.q); },
  makeQ() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.font = 'bold 100px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', 64, 70);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), color: 0xff8090, transparent: true, depthTest: false }));
    s.scale.setScalar(4); s.renderOrder = 9; return s;
  },
  set(n) {
    const base = (n + 1) % 2 ? CASTLE_B : CASTLE_A;
    this.qTarget = new THREE.Vector3(base.x, base.y + 17, base.z - 17);
    if (!this.q.position.lengthSq()) this.q.position.copy(this.qTarget);
  },
  setVisible(v) { this.q.visible = v; },
  update(dt, time) {
    if (this.qTarget) { this.q.position.lerp(this.qTarget, 1 - Math.pow(.03, dt)); this.q.position.y += Math.sin(time * 3) * .02; this.q.material.opacity = .6 + Math.sin(time * 5) * .35; }
  },
};
export const ladder3d = towers;
