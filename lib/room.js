// The keep rooms of the saga (r103, r158-r162, r424): a step that explains a mechanism zooms into a
// castle, where a room shows the machine at work on the story's real bytes. This is the switch
// between the valley and a room, once for episodes 1.2-1.6 (it was five drifted copies of
// <ep>/js/inside.js); each episode's js/inside.js keeps only its rooms and passes them in.
// The zoom itself is lib/zoom.js.
//
//   import { Inside } from '../../lib/room.js';
//   import { ROOM } from './inside.js';        // ROOM = { rooms, ...options below }
//   const inside = new Inside({ renderer, renderPass, camera, rig, bubbles, instant,
//     castles: { a: world.castleA, b: world.castleB }, ...ROOM });
//   rooms[name] = { door, build: (scene, send, portrait) => ({   // send: what story.js passes in
//     beats: { <step id>: { end } },     // the room's steps; end = seconds its animation lasts
//     pose(beat, time),                   // sets EVERY part for that beat at that time
//     frame(beat, time) → [Vector3, ...], // the points the camera must hold in the free band now
//     anchor?(beat) → Vector3,            // where the speaker's bubble points, if not the frame's top
//     size?, tiles? }) }                  // size: for shell(); tiles: what the episode's tests read
//   portrait: the screen is upright (a phone): the machine runs top to bottom, not left to right.
//   await inside.enter(name, beat, send, live, door)   flies in from where the camera is; false if cancelled
//   inside.beat(id)          the next step in the same room: no flight, its animation from 0
//   await inside.cut(name, beat, send, live)     through to another room (the other keep), no valley
//   await inside.leave(shot) out through the room's window, then the valley camera flies to shot
//   inside.rebuild(send)     same room and beat, new words or bytes (language) or a turned phone
//   inside.update(dt)        every frame; main.js skips rig.update while inside.active
//   inside.hold = s          a still at second s of the beat (tools/room_stills.py)
// Options, each what one episode's copy did: far (the room camera's far plane, 300), flame (the
// torches' light around which they flicker, 55), said (the top of the band grows to the bubble
// shown, 1.3), deep (fog and far plane follow a camera that backs far off a big wall, 1.4),
// shell(scene, portrait, machine, owner) (the stone room built around every machine, 1.6).
//
// DOORS (r424): a room is entered by a window of a castle, and the castle says where its windows are:
// each castle builder of lib/saga/ sets userData.doors = { <window>: { focus, normal, near } } in its
// own space (focus: the point behind the glass the zoom closes on; normal: out through the window,
// the line the camera ends on; near: { pos, target }, where a mode switch leaves the camera). A door
// is 'a' or 'b' (that castle's 'valley' window) or 'a:<window>'; doorOf() turns it into world space,
// so a new castle moves every room's window with it.
import * as THREE from 'three';
import { held } from './saga/camera.js';
import { freeBand } from './band.js';
import { ZOOM, windowPath, roomArrival, setVeil } from './zoom.js';

const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);

// a castle's window in world space: door 'a', 'b' or 'a:<window>' (default window 'valley')
export function doorOf(castles, door) {
  const [team, name = 'valley'] = door.split(':'), castle = castles[team];
  const d = castle?.userData.doors?.[name];
  if (!d) throw new Error(`no window '${name}' on castle '${team}'`);
  castle.updateWorldMatrix(true, false);
  const m = castle.matrixWorld, at = p => p.clone().applyMatrix4(m);
  return { focus: at(d.focus), normal: d.normal.clone().transformDirection(m), near: { pos: at(d.near.pos), target: at(d.near.target) } };
}

const SMOOTH = .04, BUBBLE = 84;   // the room camera closes 96% of the way to its framing every second
export class Inside {
  constructor({ renderer, renderPass, camera, rig, bubbles, instant, castles, rooms,
    far = 300, flame = 55, said = false, deep = false, shell = null }) {
    Object.assign(this, { renderer, renderPass, outer: { scene: renderPass.scene, camera }, rig, bubbles, instant,
      castles, rooms, flame, said, deep, shell });
    this.camera = new THREE.PerspectiveCamera(45, 1, .3, far);
    this.veil = document.getElementById('veil');
    this.room = null; this.time = 0; this.token = 0; this.log = [];
    this.view = { center: v(0, 5, 0), d: 30 };
  }
  get active() { return !!this.room; }
  get portrait() { return innerWidth < innerHeight; }
  door(d) { return doorOf(this.castles, d); }
  resize(aspect, fov) {
    this.camera.aspect = aspect; this.camera.fov = fov; this.camera.updateProjectionMatrix();
    if (this.room && this.room.portrait !== this.portrait) this.rebuild();
  }
  // door: the window it is entered by; by default the room's own
  build(name, send, door = this.rooms[name].door) {
    const scene = new THREE.Scene(), machine = this.rooms[name].build(scene, send, this.portrait);
    this.shell?.(scene, this.portrait, machine, this.rooms[name].door.split(':')[0]);   // the owner: 'a' or 'b'
    return { name, send, scene, machine, door, portrait: this.portrait };
  }
  swap(room) {
    const old = this.room; this.room = room;
    const s = room ? room.scene : this.outer.scene, c = room ? this.camera : this.outer.camera;
    this.renderPass.scene = s; this.renderPass.camera = c; this.bubbles.camera = c;
    // the tiles' faces and box are shared by every build of a room (r160): they stay
    const own = x => x && !x.userData?.shared;
    if (old && old !== room) old.scene.traverse(o => { own(o.geometry) && o.geometry.dispose(); [o.material].flat().filter(own).forEach(m => { m.map?.dispose(); m.dispose(); }); });
  }
  // a room built, its shaders compiled and its textures uploaded while the camera moves, so the swap
  // does not stall: uploaded at the swap, the tiles' letters froze the first room frame for a quarter
  // second under the veil (tools/zoom_trace.py)
  prepare(name, beat, send, tok, door) {
    const room = this.build(name, send, door); room.machine.pose(beat, 0);
    const ready = this.renderer.compileAsync(room.scene, this.camera).catch(() => {});
    const maps = new Set(); room.scene.traverse(o => [o.material].flat().forEach(m => m?.map && maps.add(m.map)));
    [...maps].forEach((m, i) => setTimeout(() => { if (tok === this.token) this.renderer.initTexture(m); }, 100 + i * 8));
    return { room, ready };
  }
  // r103 (Simon 21 Oct: « keep zooming while the veil appears »): one move from wherever the camera
  // is to the glass, faster and faster in proportion, the veil on the same clock; the room camera
  // then goes on closing in at the rate the valley camera had (lib/zoom.js). From another room
  // (r363), it first cuts out of that room's window.
  async enter(name, beat, send, live = () => true, door = this.rooms[name].door) {
    if (this.room) { setVeil(this.veil, 1); const out = this.door(this.room.door); this.swap(null); this.rig.jump(out.near); }
    const tok = ++this.token, way = this.door(door); this.focus = way.focus;   // focus: what tools/zoom_trace.py measures to
    const { room, ready } = this.prepare(name, beat, send, tok, door);
    const cam = this.outer.camera, from = { pos: cam.position.clone(), target: this.rig.controls.target.clone() };
    const path = windowPath({ from, focus: way.focus, normal: way.normal });
    this.zooming = { tok, live };
    await this.rig.fly({ pos: way.focus, target: way.focus }, this.instant ? .001 : ZOOM.T,
      { path: k => { setVeil(this.veil, ZOOM.veil(k)); return path(k); } });
    await ready;
    this.zooming = null;
    if (tok !== this.token || !live()) { setVeil(this.veil, 0); return false; }
    this.swap(room); this.log.push(['in', performance.now()]);
    this.beat(beat); this.fit(true);
    if (this.instant) setVeil(this.veil, 0);
    else this.arrival = { ...roomArrival(path.rate), tau: 0, out: false };
    this.update(0);
    return true;
  }
  // r162: from one keep to the other within a chapter, without the valley. The room camera keeps
  // closing in on its framing, faster and faster, as the veil rises (the way out of a room, played
  // forwards); under the veil the other keep's room takes its place and arrives as after a zoom.
  async cut(name, beat, send, live = () => true) {
    const tok = ++this.token, { room, ready } = this.prepare(name, beat, send, tok);
    const rate = 2.2, arrive = roomArrival(rate);
    if (!this.instant) await new Promise(res => { this.arrival = { ...arrive, push: true, tau: 0, out: true, res }; });
    await ready;
    if (tok !== this.token || !live()) { if (tok === this.token) setVeil(this.veil, 0); return false; }
    this.swap(room); this.log.push(['cut', performance.now()]);
    this.beat(beat); this.fit(true);
    if (this.instant) setVeil(this.veil, 0);
    else this.arrival = { ...arrive, tau: 0, out: false };
    this.update(0);
    return true;
  }
  beat(id) { if (!this.room) return; this.room.beat = id; this.time = this.instant ? this.room.machine.beats[id].end : 0; }
  // out the way it came, the same move backwards: the room camera backs off faster and faster as the
  // veil rises, then the valley camera pulls out of the room's window at that rate and slows onto shot
  async leave(shot) {
    if (!this.room) return;
    const tok = ++this.token, door = this.door(this.room.door); this.focus = door.focus;   // focus: what tools/zoom_trace.py measures to
    this.arrival = null;
    if (!shot) { this.swap(null); setVeil(this.veil, 0); this.rig.jump(door.near); return; }   // a mode switch: a cut
    const to = held(shot, this.outer.camera);   // a castle shot held whole on a phone (r516)
    const path = windowPath({ from: to, focus: door.focus, normal: door.normal });
    if (!this.instant) await new Promise(res => { this.arrival = { ...roomArrival(path.rate), tau: 0, out: true, res }; });
    if (tok !== this.token) return;
    this.swap(null); this.log.push(['out', performance.now()]);
    return this.rig.fly(to, this.instant ? .001 : ZOOM.T,
      { path: k => { setVeil(this.veil, ZOOM.veil(1 - k)); return path(1 - k); } });
  }
  rebuild(send = this.room?.send) {
    if (!this.room) return;
    const room = this.build(this.room.name, send, this.room.door), beat = this.room.beat;
    room.beat = beat; this.swap(room); this.room.machine.pose(beat, this.time); this.fit(true);
  }
  play() { if (this.room) this.time = 0; }
  // the speaker's bubble: the room's anchor, or the top of what the camera holds, a third in
  anchor() {
    if (!this.room) return;
    const own = this.room.machine.anchor?.(this.room.beat), b = this.want?.box;
    return own || (b ? v(b.min.x + (b.max.x - b.min.x) * .3, b.max.y + .3) : v(0, 8));
  }

  // the free band: below the top bar, above the story panel, left of an open corner card
  band() { return freeBand(); }   // lib/band.js (r516: shared with the valley camera)
  // where the camera should be to hold the moment's frame in the band
  fit(now = false) {
    const pts = this.room.machine.frame(this.room.beat, this.time), box = new THREE.Box3().setFromPoints(pts);
    const c = box.getCenter(v(0, 0)), size = box.getSize(v(0, 0)), b = this.band();
    // the top of the band is kept for the speaker's bubble, which points at the top of the frame
    // (said: as tall as the bubble shown, up to 40% of the band)
    const said = this.said ? [...document.querySelectorAll('.bubble.show')].reduce((m, e) => Math.max(m, e.offsetHeight + 16), 0) : 0;
    const room = this.said ? Math.min(Math.max(BUBBLE, said), b.h * .4) : Math.min(BUBBLE, b.h * .25); b.top += room; b.h -= room;
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2) * 2, m = .9;
    const d = Math.max(size.y * b.H / (m * b.h), size.x * b.H / (m * b.w)) / tan + 2.2;
    this.want = { center: c, d, b, box };
    if (now) { this.view.center.copy(c); this.view.d = d; }
  }
  update(dt) {
    // a zoom in cut short (another step, another mode): its veil goes
    if (this.zooming && (this.zooming.tok !== this.token || !this.zooming.live())) { this.zooming = null; setVeil(this.veil, 0); }
    if (!this.room) return;
    this.time = this.hold ?? this.time + dt;   // hold: a still at that second (tools/room_stills.py)
    const m = this.room.machine;
    m.pose(this.room.beat, this.time);
    this.fit();
    const k = this.instant ? 1 : 1 - Math.pow(SMOOTH, dt), w = this.want;
    this.view.center.lerp(w.center, k);
    const a = this.arrival;
    if (a) {   // the zoom's room side (lib/zoom.js): in, closing on the framing; out, backing off it (a cut: closing on past it)
      a.tau += dt / a.T;
      this.view.d = w.d * (a.push ? 1 / a.back(a.tau) : a.out ? a.back(a.tau) : a.factor(a.tau));
      setVeil(this.veil, a.out ? a.backVeil(a.tau) : a.veil(a.tau));
      if (a.tau >= 1) { this.arrival = null; a.res?.(); }
    } else this.view.d += (w.d - this.view.d) * k;
    const c = this.view.center, d = this.view.d;
    // deep: a tall frame in a short band (a phone with its text open) backs the camera off past the fog:
    // it moves with the camera then, so the room stays seen (r446); closer than 70 nothing changes
    if (this.deep) {
      const fog = this.room.scene.fog;
      if (fog) { fog.near = Math.max(60, d - 10); fog.far = Math.max(130, d + 70); }
      if (this.camera.far < d + 100) { this.camera.far = d + 100; this.camera.updateProjectionMatrix(); }
    }
    this.camera.position.set(c.x + Math.sin(this.time * .25) * .02 * d, c.y + d * .14, c.z + d);
    this.camera.lookAt(c);
    // the look-at point lands in the middle of the free band, not of the screen
    const b = w.b; this.camera.setViewOffset(b.W, b.H, b.W / 2 - (b.left + b.w / 2), b.H / 2 - (b.top + b.h / 2), b.W, b.H);
    for (const f of this.room.scene.userData.flames || []) f.light.intensity = this.flame + Math.sin(this.time * 13 + f.light.position.x) * 6 + Math.sin(this.time * 7.3) * 4;
  }
}
