// Camera moves: eased flights between shots, a slow idle orbit, and a chase mode
// that rides behind a messenger. OrbitControls is only live when nothing is flying.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CASTLE_A, CASTLE_B, CITY, BUILT, heightAt } from './world.js';
import { freeBand } from '../band.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);

// Named shots: where the camera sits, what it looks at.
export const SHOTS = {
  overview:  { pos: v(0, 95, 150), target: v(0, 4, 0) },
  intro:     { pos: v(-78, 46, 74), target: v(8, 4, -4) },
  castleA:   { pos: v(-36, 34, 48), target: v(CASTLE_A.x, CASTLE_A.y + 7, 0), hold: 'castleA' },
  castleB:   { pos: v(36, 34, 48), target: v(CASTLE_B.x, CASTLE_B.y + 7, 0), hold: 'castleB' },
  city:      { pos: v(18, 34, 62), target: v(0, 8, 14) },
  valley:    { pos: v(0, 22, 70), target: v(0, 4, 18) },
  both:      { pos: v(12, 70, 136), target: v(12, 6, 2) },
  gateB:     { pos: v(52, 16, 18), target: v(CASTLE_B.x - 8, CASTLE_B.y + 3, 0) },
  high:      { pos: v(0, 190, 30), target: v(0, 0, 0) },
  eye:       { pos: v(14, 33, 30), target: v(0, 25, 0) },
  gate:      { pos: v(5, 30, 50), target: v(0, -3, 27) },     // episode 1.2: the rider held under Eve's walls
};

// A castle shot on a phone (r516). Under 900 px the story panel takes the lower half of the screen,
// and the Middle-earth castles are tall: the mallorn stood half under the panel. A shot with hold
// keeps that castle whole in the free band (lib/band.js, read from the DOM now), under room for the
// speaker's bubble: it backs off along its own line of sight and aims lower until the castle fits.
// Desktop, and a castle that already fits, keep the shot as written.
const BUBBLE = 84;
// what of a castle can be seen: each mesh's own box (the whole castle's box, seen from above, stood
// as tall as its footprint is deep), cut at the ground (roots and foundations go under it); once a castle
const outlines = new WeakMap();
function outline(castle) {
  if (!outlines.has(castle)) {
    castle.updateMatrixWorld(true);
    const ground = heightAt(castle.position.x, castle.position.z), pts = [], box = new THREE.Box3();
    castle.traverse(o => {
      if (!o.isMesh || o === castle.userData.glow || !o.visible) return;
      box.setFromObject(o);
      for (let i = 0; i < 8; i++) pts.push(v(i & 1 ? box.max.x : box.min.x, Math.max(ground, i & 2 ? box.max.y : box.min.y), i & 4 ? box.max.z : box.min.z));
    });
    outlines.set(castle, pts);
  }
  return outlines.get(castle);
}
export function held(shot, camera) {
  const s = typeof shot === 'string' ? SHOTS[shot] : shot, castle = s?.hold && BUILT[s.hold];
  if (!castle || innerWidth >= 900) return s;
  const b = freeBand(), top = b.top + Math.min(BUBBLE, b.h * .25), bottom = b.top + b.h;
  const corners = outline(castle), box = new THREE.Box3().setFromPoints(corners), c = box.getCenter(v(0, 0, 0));
  const cam = camera.clone(); cam.clearViewOffset(); cam.aspect = b.W / b.H; cam.updateProjectionMatrix();
  const fits = sh => {
    cam.position.copy(sh.pos); cam.lookAt(sh.target); cam.updateMatrixWorld();
    const ys = corners.map(p => (1 - p.clone().project(cam).y) / 2 * b.H);
    return Math.min(...ys) >= top && Math.max(...ys) <= bottom;
  };
  if (fits(s)) return s;
  const back = s.pos.clone().sub(s.target), d0 = back.length(); back.normalize();
  const look = back.clone().negate(), up = new THREE.Vector3().crossVectors(new THREE.Vector3().crossVectors(look, v(0, 1, 0)), look).normalize();
  // the castle's centre lands in the middle of the band: aim that far below it, along the camera's up
  const ndc = 1 - (top + bottom) / b.H, tan = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
  let sh = s;
  for (let k = 1; k <= 3; k += .04) {
    const d = d0 * k, target = c.clone().addScaledVector(up, -ndc * d * tan);
    sh = { pos: target.clone().addScaledVector(back, d), target, hold: s.hold };
    if (fits(sh)) break;
  }
  return sh;
}

const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export class CameraRig {
  constructor(camera, dom) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, dom);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: .07, maxPolarAngle: Math.PI * .47, minDistance: 8, maxDistance: 320 });
    this.flight = null; this.follow = null; this.orbit = 0;
    camera.position.copy(SHOTS.high.pos); this.controls.target.copy(SHOTS.high.target);
  }

  // Fly to a shot (name or {pos,target}). The path arcs upward a little so long
  // moves read as a swoop rather than a slide. Resolves when it lands.
  // opts.ease: another curve (r158: the push into a castle window speeds up, the way out slows down);
  // opts.lift: the arc's height (0: a straight push).
  // opts.path: k (0..1, linear in time) -> { pos, target }, a move of its own (r103: lib/zoom.js windowPath).
  fly(shot, duration = 2.2, opts = {}) {
    const s = held(shot, this.camera);
    this.follow = null;
    return new Promise(res => {
      const from = { pos: this.camera.position.clone(), target: this.controls.target.clone() };
      const lift = opts.lift ?? Math.min(40, from.pos.distanceTo(s.pos) * .18);
      this.flight = { from, to: s, t: 0, duration, lift, res, ease: opts.ease || ease, path: opts.path };
    });
  }

  // Cut straight to a shot, no flight (used by screenshots and reduced motion).
  jump(shot) {
    const s = held(shot, this.camera);
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
      if (f.path) { const p = f.path(f.t); this.camera.position.copy(p.pos); c.target.copy(p.target); }   // r103: lib/zoom.js
      else {
        const k = f.ease(f.t);
        this.camera.position.lerpVectors(f.from.pos, f.to.pos, k);
        this.camera.position.y += Math.sin(Math.PI * k) * f.lift;
        c.target.lerpVectors(f.from.target, f.to.target, k);
      }
      this.camera.lookAt(c.target);
      if (f.t >= 1) { this.flight = null; f.res(); }
      return;
    }
    if (this.follow) {
      // behind the rider, a little to the valley side, so the city stays in frame
      const p = this.follow.obj.position, dir = this.follow.obj.userData.dir || v(1, 0, 0);
      const want = p.clone().addScaledVector(dir, -20).add(v(0, 13, 15));
      this.camera.position.lerp(want, 1 - Math.pow(.02, dt));
      c.target.lerp(p.clone().addScaledVector(dir, 8).add(v(0, 2, 0)), 1 - Math.pow(.005, dt));
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
