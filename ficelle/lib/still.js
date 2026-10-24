// r546 (Simon, 24 Oct, having tried the ?still=30 test: 'Go for 30, and make it a settings'): a still scene is drawn
// at 30 frames a second, a moving one at the screen's rate. Still: the camera is not flying, chasing a rider or
// gliding into a room, and nobody touched the page in the last half second (the saga's slow idle orbit and a room's
// sway count as still). A page with neither rig nor room: any camera move counts as moving.
// The choice is kept in localStorage 'dg-still' across the series, like 'dg-quality': '30' (the default) or '60'
// (every frame, as before); ?still=60 or ?still=30 overrides it for a shot. setStill() is for a settings page.
// Every episode's loop() asks first, and on a skipped frame does nothing at all, so the CPU is saved with the GPU:
//     function loop() { if (composer.idle()) return requestAnimationFrame(loop); ... }
// (its clock is not read on a skipped frame, so the next dt covers both). lib/quality.js gives every composer idle().
const KEY = 'dg-still', HOLD = 500;
export const STILL_RATES = [30, 60];

export function getStill() {
  const q = +(new URLSearchParams(location.search).get('still') || localStorage.getItem(KEY));
  return STILL_RATES.includes(q) ? q : 30;
}
export function setStill(fps) { localStorage.setItem(KEY, String(fps)); }

// a room (lib/room.js Inside, aes-interieur's Room) moving its camera on purpose: a slide, a zoom, or the glide
// to a new framing (its view lerps to its want)
function roomMoving(r) {
  if (!r?.view || !(r.room || r.m)) return false;   // Inside: .room when entered; aes-interieur's Room: .m once built
  if (r.sliding || r.arrival || r.zooming) return true;
  const v = r.view, w = r.want;
  return !!(v && w?.center && (v.center.distanceTo(w.center) > .002 * v.d || Math.abs(v.d - w.d) > .002 * v.d));
}

export function stillCap(composer, fps = getStill()) {
  const last = new Float32Array(16), gap = 1000 / fps - 4;   // -4 ms: a 60 Hz frame lands a little early
  let drawn = 0, touched = 0;   // touched: the last input or camera move; every frame for HOLD ms after
  composer.stillFrames = { drawn: 0, skipped: 0, fps };
  if (fps >= 60) { composer.idle = () => (composer.stillFrames.drawn++, false); return composer; }
  for (const e of ['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchmove']) addEventListener(e, () => { touched = performance.now(); }, { passive: true, capture: true });
  const cameraMoved = () => {
    const d = window.demo || {}, rig = d.rig, room = d.inside || d.room;
    if (roomMoving(room)) return true;
    if (rig && 'flight' in rig) return !!(rig.flight || rig.follow);
    if (room?.view) return false;   // a room page without the rig (aes-interieur): its sway counts as still
    const cam = composer.passes.find(p => p.camera)?.camera;
    if (!cam) return true;
    cam.updateMatrixWorld(); const m = cam.matrixWorld.elements; let moved = false;
    for (let i = 0; i < 16; i++) if (Math.abs(m[i] - last[i]) > 1e-5) { moved = true; last[i] = m[i]; }
    return moved;
  };
  composer.idle = () => {
    const now = performance.now();
    if (cameraMoved()) touched = now;
    if (now - touched < HOLD || now - drawn >= gap) { drawn = now; composer.stillFrames.drawn++; return false; }
    composer.stillFrames.skipped++; return true;
  };
  return composer;
}
