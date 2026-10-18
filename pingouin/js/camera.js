// Camera moves: eased flights between shots and a slow idle orbit. OrbitControls is only live when nothing is flying.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { X, SLOT, SCREENS } from './world.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
// Named shots: where the camera sits, what it looks at. The crates ride at z = 0, 6 to 13 high.
const near = (x, w = 1, dx = 0) => ({ pos: v(x + dx, 16 + 9 * w, 30 + 22 * w), target: v(x, 12, 0) });
export const SHOTS = {
  overview: { pos: v(0, 62, 205), target: v(0, 18, -12) },
  intro:    { pos: v(-70, 58, 190), target: v(-10, 16, -12) },
  wide:     { pos: v(0, 62, 205), target: v(0, 18, -12) },
  aliceIn:  near((SLOT.inA[0] + SLOT.inA[3]) / 2, 1.1, 6),      // her four blocks waiting
  alice:    near(-62, 1.6, 4),                                   // her blocks, the ring, the press
  outA:     near((SLOT.outA[0] + SLOT.outA[3]) / 2, 1.1, 4),     // what came out of the press
  chain:    { pos: v(-50, 30, 70), target: v(-45, 13, 0) },     // ring, press, the block over the ring
  wall:     { pos: v(-4, 38, 58), target: v(4, 40, SCREENS.ecb.z) },
  eve:      { pos: v(8, 31, 50), target: v(-1, 3, -4) },
  belt:     near(0, 2.2),                                        // the whole middle of the belt
  bob:      { pos: v(70, 30, 70), target: v(66, 12, 0) },       // his press, his ring
  bobIn:    { pos: v(SLOT.inB[1] + 2, 30, 64), target: v(SLOT.inB[1] + 6, 17, 0) },
  bobOut:   { pos: v(98, 27, 60), target: v(105, 12, 0) },
  // the sandbox panel covers the left quarter: each shot looks a little left of what it shows
  sbA:      { pos: v(-72, 44, 88), target: v(-72, 9, -2) },
  sbMid:    { pos: v(-12, 44, 92), target: v(-12, 9, -2) },
  sbB:      { pos: v(70, 44, 92), target: v(70, 9, -2) },
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
