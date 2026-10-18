// Camera moves: eased flights between shots, a slow idle orbit, and a chase mode
// that rides behind a courier. OrbitControls is only live when nothing is flying.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLACES } from './world.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
// a shot of a table: camera offset (dx, dy, dz), looking a little left of it (where its owner stands) and low,
// so the pots sit above the story panel
const near = (p, dx, dy, dz, ty = 2.2, tx = 0) => ({ pos: v(p.x + dx, dy, p.z + dz), target: v(p.x + tx, ty, p.z) });

// Named shots: where the camera sits, what it looks at.
export const SHOTS = {
  overview: { pos: v(0, 34, 58), target: v(0, 2, -2) },
  intro:    { pos: v(-46, 22, 44), target: v(0, 3, -2) },
  wide:     { pos: v(0, 40, 62), target: v(0, 0, -2) },
  road:     { pos: v(0, 17, 40), target: v(0, 2, 1) },
  alice:    near(PLACES.a.table, 4, 8, 14, .8, -1),
  aliceClose: near(PLACES.a.table, .2, 7.6, 9, 1.4, -.8),
  eve:      near(PLACES.e.table, 3, 9, 16, 2, -1),
  eveClose: near(PLACES.e.table, .3, 8.6, 10.5, 1.4, -.5),
  bob:      near(PLACES.b.table, 2, 8, 14, .8, 0),
  bobClose: near(PLACES.b.table, .2, 7.6, 9, 1.4, -.8),
};

const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export class CameraRig {
  constructor(camera, dom) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, dom);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: .07, maxPolarAngle: Math.PI * .47, minDistance: 3, maxDistance: 260 });
    this.flight = null; this.follow = null; this.orbit = 0;
    camera.position.copy(SHOTS.wide.pos); this.controls.target.copy(SHOTS.wide.target);
  }

  // Fly to a shot (name or {pos,target}). The path arcs upward a little so long
  // moves read as a swoop rather than a slide. Resolves when it lands.
  fly(shot, duration = 2.2) {
    const s = typeof shot === 'string' ? SHOTS[shot] : shot;
    this.follow = null;
    return new Promise(res => {
      const from = { pos: this.camera.position.clone(), target: this.controls.target.clone() };
      const lift = Math.min(40, from.pos.distanceTo(s.pos) * .18);
      this.flight = { from, to: s, t: 0, duration, lift, res };
    });
  }

  // Cut straight to a shot, no flight (used by screenshots and reduced motion).
  jump(shot) {
    const s = typeof shot === 'string' ? SHOTS[shot] : shot;
    this.flight = null; this.follow = null;
    this.camera.position.copy(s.pos); this.controls.target.copy(s.target); this.camera.lookAt(s.target);
  }

  // Ride behind an object (a messenger) until stopFollow() or another fly().
  chase(obj) { this.flight = null; this.follow = { obj }; }
  stopFollow() { this.follow = null; }

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
    if (this.follow) {
      // in front of the road, a little behind the courier, so Eve's tower stays in frame
      const p = this.follow.obj.position, dir = this.follow.obj.userData.dir || v(1, 0, 0);
      const want = p.clone().addScaledVector(dir, -8).add(v(0, 9, 16));
      this.camera.position.lerp(want, 1 - Math.pow(.02, dt));
      c.target.lerp(p.clone().addScaledVector(dir, 4).add(v(0, 2, -2)), 1 - Math.pow(.005, dt));
      this.camera.lookAt(c.target);
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
