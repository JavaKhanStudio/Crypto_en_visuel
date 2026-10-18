// Camera moves: eased flights between shots and a slow idle orbit. OrbitControls is only live when nothing is flying.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
// Named shots for the bank hall: Alice and Eve at the west end (x ≈ -82, -58), the guard's booth
// and the board at the centre (x = 0, board at y 36, z -24), the gate and Bob's desk at the east
// (x = 26, 50). Eve's chart stands at x = -36, her stopwatch floats near her at y 27.
export const SHOTS = {
  overview: { pos: v(-10, 95, 185), target: v(-10, 24, -12) },
  wide:     { pos: v(-10, 95, 185), target: v(-10, 24, -12) },
  intro:    { pos: v(-95, 72, 150), target: v(-25, 18, -8) },
  booth:    { pos: v(0, 46, 72), target: v(0, 31, -16) },                       // the guard, his booth, the board behind
  eve:      { pos: v(-56, 44, 62), target: v(-56, 22, 2) },                     // Eve and her stopwatch
  chart:    { pos: v(-38, 28, 38), target: v(-34, 18, -6) },                    // Eve's chart of answer times
  gate:     { pos: v(46, 42, 78), target: v(40, 16, -6) },                      // the gate and Bob's ledger
  // the sandbox panel covers the left quarter: each shot sits a little right of what it shows
  sbA:      { pos: v(14, 46, 80), target: v(8, 28, -14) },                      // the booth and the board
  sbMid:    { pos: v(-8, 42, 70), target: v(-20, 24, -6) },                     // the chart and the booth
  sbB:      { pos: v(52, 44, 82), target: v(46, 18, -6) },                      // the gate
};

const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export class CameraRig {
  constructor(camera, dom) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, dom);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: .07, maxPolarAngle: Math.PI * .47, minDistance: 2, maxDistance: 600 });
    this.flight = null; this.orbit = 0;
    camera.position.copy(SHOTS.wide.pos); this.controls.target.copy(SHOTS.wide.target);
  }

  // Fly to a shot (name or {pos,target}). The path arcs upward a little so long
  // moves read as a swoop rather than a slide. Resolves when it lands.
  fly(shot, duration = 2.2) {
    const s = typeof shot === 'string' ? SHOTS[shot] : shot;
    return new Promise(res => {
      const from = { pos: this.camera.position.clone(), target: this.controls.target.clone() };
      const lift = Math.min(40, from.pos.distanceTo(s.pos) * .18);
      this.flight = { from, to: s, t: 0, duration, lift, res };
    });
  }

  // Cut straight to a shot, no flight (used by screenshots and reduced motion).
  jump(shot) {
    const s = typeof shot === 'string' ? SHOTS[shot] : shot;
    this.flight = null;
    this.camera.position.copy(s.pos); this.controls.target.copy(s.target); this.camera.lookAt(s.target);
  }

  setOrbit(speed) { this.orbit = speed; }

  update(dt) {
    const c = this.controls;
    if (this.flight) {
      const f = this.flight; f.t = Math.min(1, f.t + dt / f.duration);
      const k = ease(f.t);
      this.camera.position.lerpVectors(f.from.pos, f.to.pos, k);
      this.camera.position.y += Math.sin(Math.PI * k) * f.lift;
      c.target.lerpVectors(f.from.target, f.to.target, k);
      this.camera.lookAt(c.target);
      if (f.t >= 1) { this.flight = null; f.res(); }
      return;
    }
    if (this.orbit) {
      const off = this.camera.position.clone().sub(c.target);
      off.applyAxisAngle(v(0, 1, 0), this.orbit * dt);
      this.camera.position.copy(c.target).add(off);
    }
    c.update();
  }
}
