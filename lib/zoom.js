// The zoom into a room (r103, Simon 21 Oct: « keep zooming while the veil appears… standardized »):
// one move for every episode that goes inside a castle. What the eye reads as zoom is how fast the
// distance to what you look at shrinks in proportion (speed / distance), so the path is written in
// log-distance: from where the camera is, it closes on a point behind the glass at a rate that only
// ever grows, the veil rises on the last part of that same clock (no CSS timer to drift from it), and
// the room camera, after the swap, starts at the rate the valley camera had and only then settles.
// Leaving is the same move played backwards. Nothing here stops, so nothing reads as « arrive, stop,
// fade ». tools/zoom_trace.py measures it frame by frame.
//
//   import { ZOOM, windowPath, setVeil, roomArrival } from '../../lib/zoom.js';
//   const path = windowPath({ from: { pos, target }, focus, normal });   // k in 0..1 -> { pos, target }
//   rig.fly(focusShot, ZOOM.T, { path: k => { setVeil(veil, ZOOM.veil(k)); return path(k); } });
//   const arrive = roomArrival(path.rate);   // tau in 0..1 over arrive.T -> distance factor, veil
import * as THREE from 'three';

const clamp01 = k => Math.max(0, Math.min(1, k));
const smooth = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };

export const ZOOM = {
  T: 2.4,          // seconds from the valley shot to the glass
  near: 3.45,      // distance to the focus at the end: just through the glass, all veil
  far: 2,          // the room camera starts this many times further back than its framing (3 shows the room's edge)
  // the veil: nothing for the first 60% of the way, all of it at the glass, the camera at full speed
  veil: k => smooth(.6, 1, k),
};

// log-distance eased in: its derivative grows from 0 and never falls, so the zoom only speeds up
const gather = k => (k * k + k * k * k) / 2, GATHER_END = 2.5;   // gather'(1)

// from: { pos, target } where the camera is; focus: a point behind the glass, inside the keep;
// normal: the unit vector from the focus out through the window (the camera ends on that line).
// The camera swings round the focus onto the window's line during the first 70% and turns its eyes
// to the focus during the first half.
export function windowPath({ from, focus, normal, near = ZOOM.near, T = ZOOM.T }) {
  const d0 = Math.max(near * 1.01, from.pos.distanceTo(focus)), L = Math.log(d0 / near);
  const u0 = from.pos.clone().sub(focus).normalize(), turn = new THREE.Quaternion().setFromUnitVectors(u0, normal);
  const q = new THREE.Quaternion(), target0 = from.target.clone();
  const path = k => {
    q.identity().slerp(turn, smooth(0, .7, k));
    const pos = u0.clone().applyQuaternion(q).multiplyScalar(d0 * Math.exp(-L * gather(k))).add(focus);
    return { pos, target: target0.clone().lerp(focus, smooth(0, .5, k)) };
  };
  path.rate = L * GATHER_END / T;   // the zoom rate (1/s) at the glass
  return path;
}

// the room side: the distance factor over its framing falls from ZOOM.far to 1 as far^((1-tau)^p),
// whose starting rate p*ln(far)/T is matched to the valley's last rate by the duration; a glass
// faster than the shortest arrival allows (2.3/s, a far valley shot) steepens p instead (r492)
export function roomArrival(rate, far = ZOOM.far) {
  const A = Math.log(far), T = Math.min(1.4, Math.max(.6, 2 * A / rate)), p = Math.max(2, rate * T / A);
  return { T, factor: tau => Math.exp(A * (1 - clamp01(tau)) ** p), veil: tau => 1 - smooth(0, .7, tau),
           // and backwards, for the way out: speeding up, the veil rising on the last part
           back: tau => Math.exp(A * clamp01(tau) ** p), backVeil: tau => smooth(.3, 1, tau) };
}

// the veil is driven frame by frame: no CSS transition
export function setVeil(el, opacity) { el.style.transition = 'none'; el.style.opacity = opacity; }
