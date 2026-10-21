// Camera moves: eased flights between shots, a slow idle orbit, and a chase mode
// that rides beside an envelope on its way. OrbitControls is only live when nothing is flying.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);

// Named shots: where the camera sits, what it looks at. The main street runs along x at z = 3; the
// café's terrace at x ≈ -36, the provider at x ≈ -6, Bob's site at x ≈ 33, the VPN's town up the
// valley at (-14, -38). The camera stays on the street side (+z).
export const SHOTS = {
  overview: { pos: v(-2, 74, 30), target: v(-2, 0, -12) },
  map:      { pos: v(-4, 72, 32), target: v(-3, 0, -12) },
  cafe:     { pos: v(-35.2, 4.4, 9.5), target: v(-36, 1.9, -2) },
  envelope: { pos: v(-36.9, 2.7, 3.2), target: v(-38.4, 1.75, -1.2) },
  street:   { pos: v(-16, 18, 26), target: v(-14, 1, -6) },
  isp:      { pos: v(-4, 6, 10), target: v(-6, 2.6, -6.5) },
  keys:     { pos: v(-16, 52, 20), target: v(-25, 0, -17) },
  vpn:      { pos: v(-8.5, 4.6, -22.5), target: v(-13.2, 1.9, -32) },
  bob:      { pos: v(36.5, 4.6, 10.5), target: v(33, 2, 0) },
  tunnel:   { pos: v(-20, 20, 20), target: v(-12, 2, -12) },
  // on a phone held upright the VPN's racks from further down the street, not through the house behind
  vpnPhone: { pos: v(-11.5, 4.2, -15), target: v(-13.5, 1, -32) },
  // who sees what (steps 11, 13, 14): the map whole, left of the corner card and above the step card, so every
  // watcher's tag reads in full (r225)
  seen:     { pos: v(20, 74, 84), target: v(20, 0, 2) },
  // the sandbox: its panel covers the left of a desktop screen, so the map sits right of centre
  sandbox:  { pos: v(-16, 60, 36), target: v(-14, 0, -19) },
};
// On a phone held upright the step panel covers the lower half and the view is narrow: every shot
// is taken from further back and aimed lower, so what it frames sits in the upper half, above the
// panel. A shot named <shot>Phone, when there is one, replaces this rule.
export const portrait = () => innerWidth < innerHeight;
export function forPhone(s, back = 1.6, low = .24) {
  const dir = s.pos.clone().sub(s.target).multiplyScalar(back), d = dir.length();
  return { pos: s.target.clone().add(dir), target: s.target.clone().add(v(0, -low * d, 0)) };
}
// on a phone, 'seen' is framed as the overview was: no corner card to keep clear there
SHOTS.seenPhone = forPhone(SHOTS.overview);
const pick = shot => {
  const s = typeof shot === 'string' ? SHOTS[shot] : shot;
  if (!portrait()) return s;
  return (typeof shot === 'string' && SHOTS[shot + 'Phone']) || forPhone(s);
};

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
  // back: how much further a phone held upright stands
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
      // beside the envelope, a little behind, on the street side
      const p = this.follow.obj.position, o = this.follow.off || v(-3, 4, 9);
      let want = { pos: p.clone().add(o), target: p.clone() };
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
