// The leather strip: one ribbon mesh whose every point is placed each frame by a shape
// (lying flat on a table, wound on a stick as a helix, rolled into a coil on the messenger's
// head) or by a blend of two shapes while it winds, unwinds or is picked up. The letters are
// painted on its canvas texture, so they bend with the leather.
//
// Along the strip, u runs from 0 to len: a short lead, then one S per letter, then a tail.
// Letter j is centred at u = LEAD + (j + .5) * S. On a stick of k letters per turn one turn
// takes k * S, so letter j comes round to the same side every k letters, one W further along:
// that is the whole trick, and the shapes below place it exactly so.
import * as THREE from 'three';
import { S, W } from './props.js';

const LEAD = .3, STEP = .04, PXU = 100, PXV = 160, TILT = .38;
const v3 = () => new THREE.Vector3();
const ease = t => t * t * (3 - 2 * t);
export { TILT };

export class Strip {
  constructor(scene) {
    this.canvas = document.createElement('canvas');
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ map: this.tex, roughness: .85, side: THREE.DoubleSide }));
    this.mesh.castShadow = true; this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.shape = null; this.morph = null; this.cells = [];
    this.setCells([]);
  }

  // the letters it carries (strip order, '' = blank leather); rebuilds the ribbon to their length
  setCells(cells) {
    this.cells = cells; this.len = LEAD * 2 + cells.length * S;
    const n = Math.ceil(this.len / STEP) + 1, pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), idx = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      uv.set([u, 0, u, 1], i * 4);
      if (i) { const k = i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); }
    }
    const g = this.mesh.geometry;
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    this.n = n;
    this.canvas.width = Math.ceil(this.len * PXU); this.canvas.height = Math.ceil(W * PXV);
    this.draw();
  }

  // paint the leather and the letters: shown(j) says which are written yet, hot is lit in gold
  draw(shown = () => false, hot = -1) {
    const c = this.canvas, x = c.getContext('2d'), H = c.height;
    x.fillStyle = '#c99a5b'; x.fillRect(0, 0, c.width, H);
    for (let i = 0; i < c.width; i += 3) { x.fillStyle = `rgba(90,50,20,${.04 + .06 * Math.abs(Math.sin(i * 12.9898) * 43758 % 1)})`; x.fillRect(i, 0, 3, H); }
    x.fillStyle = 'rgba(70,38,14,.55)'; x.fillRect(0, 0, c.width, 4); x.fillRect(0, H - 4, c.width, 4);
    this.cells.forEach((ch, j) => {
      if (!ch || !shown(j)) return;
      const cx = (LEAD + (j + .5) * S) * PXU;
      x.save(); x.translate(cx, H / 2); x.rotate(Math.PI / 2); x.scale(PXV / PXU, 1);
      if (j === hot) { x.shadowColor = '#ffd66b'; x.shadowBlur = 18; x.fillStyle = '#7a2a00'; } else x.fillStyle = '#2a170a';
      x.font = `700 ${Math.round(S * PXU * .78)}px Georgia, "Times New Roman", serif`;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(ch, 0, S * PXU * .04);
      x.restore();
    });
    this.tex.needsUpdate = true;
  }

  // where letter j's centre is now
  letterAt(j) { return this.pose(LEAD + (j + .5) * S).p; }

  // ---------- shapes: u -> { p: centre point, b: unit vector across the strip } ----------
  flat(spot) { return u => ({ p: v3().set(spot.x - this.len / 2 + u, spot.y + .012, spot.z), b: new THREE.Vector3(0, 0, -1) }); }
  // wound on a stick (an Object3D with userData r, k, phi), its letters centred along it
  helix(stick) {
    return u => {
      const { r, k, phi } = stick.userData, turn = k * S, d = u - LEAD - S / 2, c = stick.position;
      const x0 = c.x - W * (this.cells.length - 1) / k / 2;
      const th = TILT + phi + 2 * Math.PI * d / turn, rho = r + .014;
      return { p: v3().set(x0 + W * d / turn, c.y + rho * Math.sin(th), c.z + rho * Math.cos(th)), b: new THREE.Vector3(-1, 0, 0) };
    };
  }
  // rolled up tight around nothing, as a messenger carries it; at() gives the roll's centre
  coil(at) {
    return u => {
      const c = at(), rho = .08 + .16 * u / this.len, th = u / .16;
      return { p: v3().set(c.x, c.y + .26 + rho * Math.sin(th), c.z + rho * Math.cos(th)), b: new THREE.Vector3(-1, 0, 0) };
    };
  }

  set(shape) { this.shape = shape; this.morph = null; this.update(); }
  // blend from shape a to shape b, t from 0 to 1; the start of the strip goes first
  blend(a, b, t) { this.morph = { a, b, t }; this.update(); }

  pose(u) {
    if (!this.morph) return this.shape(u);
    const { a, b, t } = this.morph, win = .3;
    const e = ease(Math.min(1, Math.max(0, (t * (1 + win) - u / this.len) / win)));
    if (e <= 0) return a(u);
    if (e >= 1) return b(u);
    const A = a(u), B = b(u), mid = A.p.clone().lerp(B.p, .5); mid.y += .4 + .15 * A.p.distanceTo(B.p);
    const p = A.p.clone().multiplyScalar((1 - e) ** 2).addScaledVector(mid, 2 * e * (1 - e)).addScaledVector(B.p, e * e);
    return { p, b: A.b.clone().lerp(B.b, e).normalize() };
  }

  update() {
    if (!this.shape && !this.morph) return;
    const pos = this.mesh.geometry.attributes.position, half = W * .49;
    for (let i = 0; i < this.n; i++) {
      const { p, b } = this.pose(i / (this.n - 1) * this.len);
      pos.setXYZ(i * 2, p.x - b.x * half, p.y - b.y * half, p.z - b.z * half);
      pos.setXYZ(i * 2 + 1, p.x + b.x * half, p.y + b.y * half, p.z + b.z * half);
    }
    pos.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
    this.mesh.geometry.computeBoundingSphere();
  }
}
