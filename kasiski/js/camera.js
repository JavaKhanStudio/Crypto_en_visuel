// Camera moves: eased flights between shots, a slow idle orbit, and a chase mode
// that rides beside the car or the key wheel. OrbitControls is only live when nothing is flying.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LANE_Z, BARS_AT, BARS_NEAR } from './world.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const X0 = -40, LZ = LANE_Z;          // the stone's first mark; the letter lane's depth

// Named shots: where the camera sits, what it looks at. The road runs along x at z = 0, the
// near wheels at z = .78 (the camera side), the letter lane at z = -7.5 behind a fence.
export const SHOTS = {
  overview: { pos: v(-6, 30, 40), target: v(0, 0, -3) },
  intro:    { pos: v(-62, 7, 16), target: v(-36, .8, -1) },
  wheel:    { pos: v(X0 + 1.6, 1.4, 7.4), target: v(X0 + 1.8, .45, .5) },
  start:    { pos: v(X0 + 5, 4.5, 9.5), target: v(X0 + 4, .2, 0) },
  track:    { pos: v(3, 38, 40), target: v(3, 0, -1) },
  near:     { pos: v(X0 + 12, 6, 10), target: v(X0 + 12, 0, 0) },
  mid:      { pos: v(5, 19, 30), target: v(5, 0, -.5) },
  bars:     { pos: v(BARS_AT.x, 5.8, BARS_AT.z + 11.5), target: v(BARS_AT.x, 1.5, BARS_AT.z) },
  lane:     { pos: v(-44, 4.2, LZ + 6.5), target: v(-43, .3, LZ) },
  lane2:    { pos: v(-38, 7, LZ + 11), target: v(-38, .3, LZ) },
  // on a phone the lane's letters stay close; at 51 and 81 the tags, drawn bigger, carry the twelve letters
  lane2Phone: { pos: v(-34.5, 5.5, LZ + 10), target: v(-34.5, -1.6, LZ) },
  repeatPhone: { pos: v(24, 30, LZ + 86), target: v(24, -15, LZ) },
  laneAllPhone: { pos: v(24, 30, LZ + 86), target: v(24, -15, LZ) },
  // step 12: the whole lane on a desktop; on a phone the LEMON wheel and Eve, as in step 11 (laneAll from that far is grass)
  finale:   { pos: v(20, 17, LZ + 27), target: v(20, 1, LZ) },
  repeat:   { pos: v(24, 17, LZ + 25), target: v(24, 0, LZ) },
  laneAll:  { pos: v(20, 17, LZ + 27), target: v(20, 1, LZ) },
  // step 10: the bars on the near verge, the lane and its repeats behind and above them
  barsLane: { pos: v(BARS_NEAR.x, 11, 19), target: v(BARS_NEAR.x, .8, -2.5) },
  barsLanePhone: { pos: v(BARS_NEAR.x + 1.4, 9, 25), target: v(BARS_NEAR.x + 1.4, -5.5, -3) },
  // the sandbox's bars, shifted right on screen: its panel covers the left of a desktop screen
  sbBars:   { pos: v(BARS_AT.x - 3.4, 6, BARS_AT.z + 12.5), target: v(BARS_AT.x - 3.4, 1.5, BARS_AT.z) },
  wheelKey: { pos: v(-45, 3.4, LZ + 6), target: v(-47, .9, LZ) },
};

// On a phone held upright the step panel covers the lower half and the view is narrow: every shot
// is taken from further back and aimed lower, so what it frames sits in the upper half, above the
// panel. A shot named <shot>Phone, when there is one, replaces this rule.
export const portrait = () => innerWidth < innerHeight;
export function forPhone(s, back = 1.6, low = .24) {
  const dir = s.pos.clone().sub(s.target).multiplyScalar(back), d = dir.length();
  return { pos: s.target.clone().add(dir), target: s.target.clone().add(v(0, -low * d, 0)) };
}
const pick = shot => {
  const s = typeof shot === 'string' ? SHOTS[shot] : shot;
  if (!portrait()) return s;
  return (typeof shot === 'string' && SHOTS[shot + 'Phone']) || forPhone(s);
};

SHOTS.finalePhone = forPhone(SHOTS.wheelKey);

const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export class CameraRig {
  constructor(camera, dom) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, dom);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: .07, maxPolarAngle: Math.PI * .47, minDistance: 1.5, maxDistance: 260 });
    this.flight = null; this.follow = null; this.orbit = 0;
    camera.position.copy(SHOTS.overview.pos); this.controls.target.copy(SHOTS.overview.target);
  }

  // Fly to a shot (name or {pos,target}). The path arcs upward a little so long
  // moves read as a swoop rather than a slide. Resolves when it lands.
  fly(shot, duration = 2.2) {
    const s = pick(shot);
    this.follow = null;
    return new Promise(res => {
      const from = { pos: this.camera.position.clone(), target: this.controls.target.clone() };
      const lift = Math.min(40, from.pos.distanceTo(s.pos) * .18);
      this.flight = { from, to: s, t: 0, duration, lift, res };
    });
  }

  // Cut straight to a shot, no flight (used by screenshots and reduced motion).
  jump(shot) {
    const s = pick(shot);
    this.flight = null; this.follow = null;
    this.camera.position.copy(s.pos); this.controls.target.copy(s.target); this.camera.lookAt(s.target);
  }

  // Ride behind an object (a messenger) until stopFollow() or another fly().
  // back: how much further a phone held upright stands (the lane's letters need it close: 1)
  chase(obj, off, back = 1.6) { this.flight = null; this.follow = { obj, off, back }; }
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
      // beside the moving thing, a little behind, on the camera side: the car on the road, the drum on the lane
      const p = this.follow.obj.position, o = this.follow.off || v(-4, 3.2, 7.5);
      let want = { pos: p.clone().add(o), target: p.clone().add(v(2.5, .2, -1)) };
      if (portrait()) want = forPhone(want, this.follow.back);
      this.camera.position.lerp(want.pos, 1 - Math.pow(.02, dt));
      c.target.lerp(want.target, 1 - Math.pow(.005, dt));
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
