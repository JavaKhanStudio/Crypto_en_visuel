// Camera moves: eased flights between shots and a slow idle orbit. OrbitControls is only live when nothing is flying.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLACES, TOP_Y } from '../../lib/enigma/world.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
// Named shots: where the camera sits, what it looks at. M: a machine, on its desk; its drum, taken
// apart, floats 4.4 above it, about 10 wide; the plugboard is on its front face, 1.5 toward us.
const M = k => PLACES[k].desk.clone().add(v(k === 'e' ? 2.4 : 0, TOP_Y, .5));
const machineShot = k => { const m = M(k); return { pos: v(m.x + 2.6, m.y + 5.6, m.z + 7.2), target: v(m.x, m.y + .4, m.z - .4) }; };
const drumShot = (k, dx = 0) => { const m = M(k); return { pos: v(m.x + 4.6 + dx, m.y + 10, m.z + 18), target: v(m.x + 1.3 + dx, m.y + 2.1, m.z - .5) }; };
export const SHOTS = {
  overview: { pos: v(0, 60, 160), target: v(0, 12, -15) },
  intro:    { pos: v(-50, 62, 175), target: v(0, 14, -20) },
  wide:     { pos: v(0, 60, 160), target: v(0, 12, -15) },
  radio:    { pos: v(0, 34, 175), target: v(0, 44, -20) },
  aliceMachine: machineShot('a'),
  aliceDrum: drumShot('a'),
  // the plugboard on the front face, close; the drum with the plugboard under it; the box of rotors above the drum
  plugboard: { pos: M('a').add(v(.5, 1.7, 5.6)), target: M('a').add(v(0, .45, 1.5)) },
  plugDrum: { pos: M('a').add(v(6, 8.4, 17)), target: M('a').add(v(1.8, 2.5, .2)) },
  ring:     { pos: M('a').add(v(4.4, 9.6, 7.4)), target: M('a').add(v(2.2, 4.8, -.3)) },
  rack:     { pos: M('a').add(v(1, 10.5, 24)), target: M('a').add(v(0, 6.6, -.5)) },
  sandbox:  { pos: M('a').add(v(1.2, 6.4, 17)), target: M('a').add(v(-2, 2.6, .4)) },   // the drum to the right of the sandbox panel
  eve:      { pos: v(PLACES.e.desk.x + 8, 32, PLACES.e.desk.z + 52), target: v(PLACES.e.desk.x - 4, 14, PLACES.e.desk.z - 2) },
  // Eve's side: her machine on her desk, its drum taken out; the slate behind; the bombe at her right
  eveMachine: machineShot('e'),
  eveDrum:  drumShot('e'),
  // the check (steps 13-14): the drum further left, the entry wheel's tag clear of the corner card's path table (r151)
  eveCheck: drumShot('e', 1),
  slate:    { pos: v(7, 25, 4), target: v(7, 17.4, -42) },
  bombe:    { pos: v(18, 17, 6), target: v(30, 11, -38) },
  eveWide:  { pos: v(6, 30, 34), target: v(8, 14, -40) },
  menu:     { pos: v(7, 25, 4), target: v(7, 17.4, -42) },   // the slate again, for the menu: drawn (step 8), its loop (9)
  menuDraw: { pos: v(7, 25, 4), target: v(7, 17.4, -42) },
  // on a phone held upright (narrow view, the step panel over the lower half): shot + 'Phone'
  // replaces the shot there. The slate close, its three rows of tiles ~20 px, panned along x with
  // the crib's place (follow: rig.follow); the menu's loop E-B-R-T high in the frame, its outer letters (H X F, C M I W S) off it (r147)
  slatePhone: { pos: v(0, 17, -4), target: v(0, 13.5, -42), follow: true },
  menuPhone: { pos: v(-1, 16, -12), target: v(-1, 8.4, -42) },   // the trace's tags (B→S) clear of the top controls
  menuDrawPhone: { pos: v(-1, 16, -10), target: v(-1, 7.3, -42) },   // a little higher: Eve's bubble fits under T
  // steps 13-14 (r351): the drum close and from higher, Eve's notepad tag just above it and its part tags hidden
  // (stage.js closeCheck), the plugboard's cable tag lifted: all between Eve's bubble and the step panel
  eveCheckPhone: { pos: M('e').add(v(-.3, 20, 18)), target: M('e').add(v(-.3, -3, -.5)) },
  bombePhone: { pos: v(22, 22, 30), target: v(32, 2, -38) },
  bobMachine: machineShot('b'),
  bobDrum:  drumShot('b'),
};

const pick = shot => typeof shot !== 'string' ? shot : (innerWidth < innerHeight && SHOTS[shot + 'Phone']) || SHOTS[shot];
// a follow shot moved along x by the rig's follow() (null: where it is)
const along = (s, dx) => !s.follow || dx == null ? s : { ...s, pos: s.pos.clone().setX(s.pos.x + dx), target: s.target.clone().setX(s.target.x + dx) };
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export class CameraRig {
  constructor(camera, dom) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, dom);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: .07, maxPolarAngle: Math.PI * .47, minDistance: 2, maxDistance: 600 });
    this.flight = null; this.orbit = 0;
    // follow: () => x or null, set by the story; a shot with follow: true keeps its x on it
    this.follow = null; this.tracking = false; this.fx = 0;
    camera.position.copy(SHOTS.wide.pos); this.controls.target.copy(SHOTS.wide.target);
  }

  // Fly to a shot (name or {pos,target}). The path arcs upward a little so long
  // moves read as a swoop rather than a slide. Resolves when it lands.
  fly(shot, duration = 2.2) {
    const s = this.aim(pick(shot));
    return new Promise(res => {
      const from = { pos: this.camera.position.clone(), target: this.controls.target.clone() };
      const lift = Math.min(40, from.pos.distanceTo(s.pos) * .18);
      this.flight = { from, to: s, t: 0, duration, lift, res };
    });
  }

  // Cut straight to a shot, no flight (used by screenshots and reduced motion).
  jump(shot) {
    const s = this.aim(pick(shot));
    this.flight = null;
    this.camera.position.copy(s.pos); this.controls.target.copy(s.target); this.camera.lookAt(s.target);
  }

  aim(s) {
    this.tracking = !!s.follow && !!this.follow;
    this.fx = this.tracking ? this.follow() ?? 0 : 0;
    return along(s, this.tracking ? this.fx : null);
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
    const want = this.tracking ? this.follow() : null;
    if (want != null && Math.abs(want - this.fx) > .01) {   // the crib moved: pan with it
      const d = (want - this.fx) * Math.min(1, dt * 5);
      this.camera.position.x += d; c.target.x += d; this.fx += d;
    }
    if (this.orbit) {
      const off = this.camera.position.clone().sub(c.target);
      off.applyAxisAngle(v(0, 1, 0), this.orbit * dt);
      this.camera.position.copy(c.target).add(off);
    }
    c.update();
  }
}
