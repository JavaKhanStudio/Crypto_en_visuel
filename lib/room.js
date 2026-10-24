// The keep rooms of the saga (r103, r158-r162, r424): a step that explains a mechanism zooms into a
// castle, where a room shows the machine at work on the story's real bytes. This is the switch
// between the valley and a room, once for episodes 1.2-1.6 (it was five drifted copies of
// <ep>/js/inside.js); each episode's js/inside.js keeps only its rooms and passes them in.
// The zoom itself is lib/zoom.js.
//
//   import { Inside } from '../../lib/room.js';
//   import { ROOM } from './inside.js';        // ROOM = { rooms, ...options below }
//   const inside = new Inside({ renderer, renderPass, camera, rig, bubbles, instant,
//     castles: { a: world.castleA, b: world.castleB }, composer, ...ROOM });   // composer: with slide (warmUp, r597)
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
//   with slide, enter() from another room slides across to it instead (r496): no valley
//   inside.ahead(name, send)  the next step's room built and drawn once ahead, so the slide starts at once (r591)
//                            and the zoom or cut into it does not hold the veil at the glass (r602): call it on
//                            the step before, while the student reads; enter(), cut() and the slide take it
//   inside.update(dt)        every frame; main.js skips rig.update while inside.active
//   inside.hold = s          a still at second s of the beat (tools/room_stills.py)
// Options, each what one episode's copy did: far (the room camera's far plane, 300), flame (the
// torches' light around which they flicker, 55), said (the top of the band grows to the bubble
// shown, 1.3), deep (fog and far plane follow a camera that backs far off a big wall, 1.4),
// shell(scene, portrait, machine, owner) (the stone room built around every machine, 1.6), slide (from
// one room to another, the picture slides sideways, the new room coming in from the side its castle is
// on: Alice west, Bob east; Simon on r496, 1.5), lights (point lights padded with dark ones up to a
// multiple of it, so rooms with a torch more or less share their shaders, r601, 1.6).
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
import { LEVELS, getQuality } from './quality.js';

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

// the same bytes: four episodes' packets() build a new object at each call (r602), so taken() compares what is in it
function same(a, b, depth = 8) {
  if (a === b) return true;
  if (!depth || !a || !b || typeof a !== 'object' || typeof b !== 'object' || a.constructor !== b.constructor) return false;
  if (ArrayBuffer.isView(a)) return a.length === b.length && a.every((x, i) => x === b[i]);
  const k = Object.keys(a);
  return k.length === Object.keys(b).length && k.every(x => same(a[x], b[x], depth - 1));
}

// FADE: px of the phone's top gradient under the controls (r531)
const FADE = 60;
// SMOOTH: the room camera closes 96% of the way to its framing every second; SLIDE: seconds from one room to the other (r496)
const SMOOTH = .04, BUBBLE = 84, SLIDE = 1.4;
export class Inside {
  constructor({ renderer, renderPass, camera, rig, bubbles, instant, castles, rooms,
    far = 300, flame = 55, said = false, deep = false, shell = null, slide = false, composer = null, lights = 0 }) {
    Object.assign(this, { renderer, renderPass, outer: { scene: renderPass.scene, camera }, rig, bubbles, instant,
      castles, rooms, flame, said, deep, shell, slide, composer, lights });
    this.camera = new THREE.PerspectiveCamera(45, 1, .3, far);
    this.veil = document.getElementById('veil');
    this.room = null; this.time = 0; this.token = 0; this.log = [];
    this.view = { center: v(0, 5, 0), d: 30 };
    // r531 (Simon's pick B on r474): on a phone, a dark gradient over the room's top, under the top
    // controls, so a piece the followed frame leaves above it fades out instead of showing cut. Laid
    // right after the canvas: the bubbles, the bar and its tab stay above it
    this.fade = document.createElement('div'); this.fade.id = 'room-fade';
    this.fade.style.cssText = 'position: fixed; left: 0; right: 0; top: 0; pointer-events: none; display: none';
    renderer.domElement.after(this.fade);
  }
  // the gradient follows the controls' foot every frame: lib/topbar.js moves the bar by a transform
  topFade() {
    const f = this.fade, on = !!this.room && innerWidth < 900;
    f.style.display = on ? '' : 'none';
    if (!on) return;
    const r = id => { const e = document.getElementById(id); return e?.offsetHeight ? e.getBoundingClientRect().bottom : 0; };
    const top = Math.round(Math.max(0, ...['topbar', 'modes', 'lang', 'topbar-tab'].map(r)));
    if (top === f.top) return;
    f.top = top; f.style.height = `${top + FADE}px`;
    f.style.background = `linear-gradient(to bottom, #0b0806 ${top}px, rgba(11, 8, 6, 0) ${top + FADE}px)`;
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
    // r601: three builds a program for each number of point lights: 1.6's sign room (6 torches) and
    // verify (7) shared none, so the room built ahead set every one up again (tools/warm_cost.py).
    // Dark lights (intensity 0, no change in the picture) round the count up, 5, 6, 7 -> 8
    if (this.lights) {
      let n = 0; scene.traverse(o => { if (o.isPointLight) n++; });
      for (; n % this.lights; n++) scene.add(new THREE.PointLight(0, 0, 1));
    }
    return { name, send, scene, machine, door, portrait: this.portrait };
  }
  swap(room, keep = false) {
    this.endSlide();
    const old = this.room; this.room = room;
    const s = room ? room.scene : this.outer.scene, c = room ? this.camera : this.outer.camera;
    this.renderPass.scene = s; this.renderPass.camera = c; this.bubbles.camera = c;
    if (old && old !== room && !keep) this.dispose(old);
    this.topFade();
  }
  dispose(old) {
    // the tiles' faces and box are shared by every build of a room (r160): they stay
    const own = x => x && !x.userData?.shared;
    old.scene.traverse(o => { own(o.geometry) && o.geometry.dispose(); [o.material].flat().filter(own).forEach(m => { m.map?.dispose(); m.dispose(); }); });
  }
  // a room built, its shaders compiled and its textures uploaded while the camera moves, so the swap
  // does not stall: uploaded at the swap, the tiles' letters froze the first room frame for a quarter
  // second under the veil (tools/zoom_trace.py)
  prepare(name, beat, send, tok, door) {
    const room = this.build(name, send, door); room.machine.pose(beat, 0);
    return { room, ready: this.upload(room, tok, this.compile(room.scene)) };
  }
  // its textures uploaded a few at a time while the camera moves, as long as tok is the move's; with span (ms),
  // 8 at a time spread evenly over it: a room taken cold (r614) had none uploaded, and at 8 ms each 1.6's ~740
  // outlast the flight, the rest uploaded at once by warmUp() at the glass (tools/taken_cold.py); 30 at a
  // time jolted the flight (tools/zoom_trace.py: 56-64% of the rate it had reached)
  upload(room, tok, ready, span = 0) {
    const maps = new Set(); room.scene.traverse(o => [o.material].flat().forEach(m => m?.map && maps.add(m.map)));
    const tex = [...maps], each = span ? 8 : 1, gap = span ? span / Math.ceil(tex.length / 8) : 8;
    for (let i = 0; i < tex.length; i += each)
      setTimeout(() => { if (tok === this.token) tex.slice(i, i + each).forEach(m => this.renderer.initTexture(m)); }, 100 + i / each * gap);
    return ready;
  }
  // r103 (Simon 21 Oct: « keep zooming while the veil appears »): one move from wherever the camera
  // is to the glass, faster and faster in proportion, the veil on the same clock; the room camera
  // then goes on closing in at the rate the valley camera had (lib/zoom.js). From another room
  // (r363), it first cuts out of that room's window.
  async enter(name, beat, send, live = () => true, door = this.rooms[name].door) {
    if (this.room && this.slide && !this.instant) return this.across(name, beat, send, live, door);
    if (this.room) { setVeil(this.veil, 1); const out = this.door(this.room.door); this.swap(null); this.rig.jump(out.near); }
    const tok = ++this.token, way = this.door(door); this.focus = way.focus;   // focus: what tools/zoom_trace.py measures to
    const got = this.taken(name, send, door, ZOOM.T * 1000 - 500), { room, ready } = got || this.prepare(name, beat, send, tok, door);
    if (got) room.machine.pose(beat, 0);
    const cam = this.outer.camera, from = { pos: cam.position.clone(), target: this.rig.controls.target.clone() };
    const path = windowPath({ from, focus: way.focus, normal: way.normal });
    this.zooming = { tok, live };
    await this.rig.fly({ pos: way.focus, target: way.focus }, this.instant ? .001 : ZOOM.T,
      { path: k => { setVeil(this.veil, ZOOM.veil(k)); return path(k); } });
    await ready;
    this.zooming = null;
    if (tok !== this.token || !live()) { setVeil(this.veil, 0); return false; }
    // drawn once off screen at the glass, under the whole veil (r492): drawn first after the swap, its
    // objects hidden at pose 0 met their programs there, 100-250 ms frames that ate the arrival's
    // first fifth, the room side starting at half the pace (tools/zoom_trace.py). Built ahead (r602), it
    // was drawn while the student read the step before: 1.6's draw here held the veil 0.5-1 s
    if (!this.instant && !got?.warm) this.warmUp(room, true);
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
  // r566 (Simon's pick A): an episode whose ROOM has slide: true slides across instead (1.5, 1.6).
  async cut(name, beat, send, live = () => true) {
    if (this.room && this.slide && !this.instant) return this.across(name, beat, send, live, this.rooms[name].door);
    const tok = ++this.token, got = this.taken(name, send, this.rooms[name].door, 1000);
    const { room, ready } = got || this.prepare(name, beat, send, tok);
    if (got) room.machine.pose(beat, 0);
    const rate = 2.2, arrive = roomArrival(rate);
    if (!this.instant) await new Promise(res => { this.arrival = { ...arrive, push: true, tau: 0, out: true, res }; });
    await ready;
    if (tok !== this.token || !live()) { if (tok === this.token) setVeil(this.veil, 0); return false; }
    if (!this.instant && !got?.warm) this.warmUp(room, true);   // under the whole veil, as in enter()
    this.swap(room); this.log.push(['cut', performance.now()]);
    this.beat(beat); this.fit(true);
    if (this.instant) setVeil(this.veil, 0);
    else this.arrival = { ...arrive, tau: 0, out: false };
    this.update(0);
    return true;
  }
  // r496 (Simon: « a simple slide to the right »): from one room to another, the picture slides
  // sideways, both rooms drawn side by side, each by its own camera, the new one coming in from the
  // side its castle is on (Alice's west, Bob's east), eased in and out over SLIDE seconds. The new
  // room is built, compiled and drawn once before anything moves, so the slide never stalls.
  async across(name, beat, send, live, door) {
    const tok = ++this.token, got = this.taken(name, send, door);
    const { room, ready } = got || this.prepare(name, beat, send, tok, door);
    if (got) room.machine.pose(beat, 0);
    await ready;
    if (tok !== this.token || !live()) return false;
    // drawn once off screen first, on the still picture: its first draw (the shadows' shaders and map,
    // a texture not yet uploaded) took 86 ms, a jolt three frames into the slide
    if (!got?.warm) this.warmUp(room);
    const from = { room: this.room, camera: this.camera.clone() };   // the old room, held as it was
    const east = d => this.door(d).focus.x, dir = Math.sign(east(door) - east(from.room.door)) || 1;
    this.arrival = null; this.swap(room, true); this.log.push(['slide', performance.now()]);
    this.beat(beat); this.fit(true); this.update(0);
    return new Promise(res => {
      const pass = this.renderPass, render = pass.render;
      this.sliding = { k: 0, dir, from, res, tok, render, s: 0 };
      // the render pass draws both rooms, each into its share of the screen, shifted by the slide
      pass.render = (renderer, writeBuffer, readBuffer) => {
        const t = pass.renderToScreen ? null : readBuffer, sl = this.sliding;
        if (!t || !sl) return render.call(pass, renderer, writeBuffer, readBuffer);
        const W = t.width, H = t.height, x = Math.round(sl.s * W), auto = renderer.autoClear;
        renderer.autoClear = true;
        // dir 1: the new room is east, it comes in from the right and the old one leaves to the left
        const parts = dir > 0 ? [[from.room.scene, from.camera, -x, 0, W - x], [pass.scene, pass.camera, W - x, W - x, x]]
          : [[from.room.scene, from.camera, x, x, W - x], [pass.scene, pass.camera, x - W, 0, x]];
        for (const [scene, camera, at, cut, w] of parts) {
          if (w <= 0) continue;
          t.viewport.set(at, 0, W, H); t.scissor.set(cut, 0, w, H); t.scissorTest = true;
          // the old room stands still: its shadows, drawn on its last frame, stay as they are
          renderer.shadowMap.autoUpdate = scene !== from.room.scene;
          renderer.setRenderTarget(t); renderer.render(scene, camera);
        }
        renderer.shadowMap.autoUpdate = true;
        t.viewport.set(0, 0, W, H); t.scissor.set(0, 0, W, H); t.scissorTest = false;
        renderer.autoClear = auto;
      };
    });
  }
  // drawn once off screen. all (ahead() only, r596): every object shown and none culled for that draw,
  // then each put back as it was: three sets up a program (its info logs, its uniforms) at its first
  // draw, not at compileAsync, and Bob's tiles, hidden at pose 0, met theirs mid-slide, a 110-150 ms
  // frame (tools/slide_frames.py). It costs ~300 ms instead of ~200, fine while the student reads,
  // not on a click: 1.5's warm at the click went 3 -> 100-300 ms with it (tools/slide_prep.py).
  // r597: into a target of the composer's kind (half float, its MSAA samples, which the quality button
  // changes): drawn into a plain RGBA8 one, the driver set each shader up again at its first draw into
  // the composer's, a 140-180 ms frame four frames into the slide, on a browser's first page
  // (tools/slide_bisect.py).
  // only (r601): with all, the drawables drawn, the rest hidden (their parents stay shown)
  warmUp(room, all = false, only = null) {
    const r = this.renderer, was = r.getRenderTarget(), held = [], keep = new Set();
    for (const o of only || []) { keep.add(o); o.traverseAncestors(p => keep.add(p)); }
    const drawable = o => o.isMesh || o.isSprite || o.isLine || o.isPoints;
    if (all) room.scene.traverse(o => { held.push([o, o.visible, o.frustumCulled]); o.visible = !only || !drawable(o) || keep.has(o); o.frustumCulled = false; });
    r.setRenderTarget(this.target()); r.render(room.scene, this.camera); r.setRenderTarget(was);
    for (const [o, visible, culled] of held) { o.visible = visible; o.frustumCulled = culled; }
  }
  // r602: an episode that passes no composer gets one made as lib/quality.js makes its composer's (half
  // float, the level's samples), not a plain RGBA8 one
  target() {
    const like = this.composer?.readBuffer || (this.like ||= new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }));
    if (!this.composer) like.samples = Math.min(LEVELS[getQuality()].samples, this.renderer.capabilities.maxSamples || 0);
    if (!this.warm || this.warm.samples !== like.samples || this.warm.texture.type !== like.texture.type) {
      this.warm?.dispose(); this.warm = like.clone(); this.warm.setSize(64, 64);
    }
    return this.warm;
  }
  // r601: compiled for a render target, as it is drawn: three keys each program on the target it draws
  // into (the canvas: sRGB and tone mapped; a target: linear, none), and the composer draws a room into
  // its buffer, never the canvas. Compiled with none bound, every program was built again, at once, at
  // the room's first draw: 1.6's warm ahead froze 0.4-0.8 s (tools/warm_cost.py --keys).
  compile(scene) {
    const r = this.renderer, was = r.getRenderTarget();
    r.setRenderTarget(this.target());
    const ready = r.compileAsync(scene, this.camera).catch(() => {});
    r.setRenderTarget(was);
    return ready;
  }
  // r603: compile() in slices, each while the page is idle: r170's compileAsync sets up the program of
  // every drawable's every material (its parameters, its cache key) in the one task, ~110 ms for 1.6's
  // verify room (1774 drawables, six materials a tile), even with every program already built; the build
  // itself is ~20 ms (tools/build_cost.py). A slice takes drawables until 8 ms are spent; lights come
  // from the whole scene, as compile(scene) took them, so the programs are the same
  compileIdle(scene, live) {
    const r = this.renderer, list = [], mats = new Set(), idle = window.requestIdleCallback || setTimeout;
    scene.traverse(o => { if (o.isMesh || o.isSprite || o.isLine || o.isPoints) list.push(o); });
    let i = 0;
    return new Promise(res => {
      const step = () => idle(() => {
        if (!live()) return res();
        const was = r.getRenderTarget(), end = performance.now() + 8;
        const part = { traverse: f => { do f(list[i++]); while (i < list.length && performance.now() < end); }, traverseVisible() {} };
        r.setRenderTarget(this.target());
        if (list.length) r.compile(part, this.camera, scene).forEach(m => mats.add(m));
        r.setRenderTarget(was);
        if (i < list.length) return step();
        // as compileAsync waits: every program finished by the driver (KHR_parallel_shader_compile)
        const done = () => { mats.forEach(m => { const p = r.properties.get(m).currentProgram; (!p || p.isReady()) && mats.delete(m); });
          mats.size && live() ? setTimeout(done, 10) : res(); };
        done();
      }, { timeout: 300 });
      step();
    });
  }
  // r591: the next room of a slide built ahead, while the student is still in this one: 1.6's rooms
  // (1750 meshes, a torch every 24 along the machine, so other shaders) took 0.4 to 1 s to compile and
  // draw a first time, the old room frozen after the click. Built, compiled, its textures uploaded,
  // then drawn once off screen; across() takes it if it is the same room on the same bytes and screen
  // shape, else drops it. The cost moves to a moment the student is reading, not one they clicked:
  // tools/slide_prep.py times the click, --hitch the frames while it is built.
  // r602: from the valley too, and with no slide: enter() and cut() take it, so the zoom's draw at the
  // glass (1.6: 0.5-1 s under the veil, tools/zoom_frames.py --ahead) happens while the step before is read
  ahead(name, send, door = this.rooms[name].door) {
    if (this.instant || this.room?.name === name || this.next?.name === name && same(this.next.send, send)) return;
    this.drop();
    const room = this.build(name, send, door), next = this.next = { name, send, door, room, warm: false };
    const r = this.renderer, idle = window.requestIdleCallback || setTimeout;
    next.ready = this.compileIdle(room.scene, () => this.next === next).then(() => new Promise(res => {
      if (this.next !== next) return res();
      // r601, each a slice of its own each time the page is idle (tools/slide_prep.py --hitch): the
      // textures uploaded 60 at a time (740 at once held the GPU ~115 ms); then one drawable of each
      // program drawn alone (the driver finishes a program at its first draw, up to 120 ms, tools/
      // warm_cost.py --per-program); then the whole room (~20 ms once each program has been drawn)
      const maps = new Set(), one = new Map();
      room.scene.traverse(o => [o.material].flat().forEach(m => {
        if (m?.map) maps.add(m.map);
        const p = m && r.properties.get(m).currentProgram; if (p && !one.has(p)) one.set(p, o);
      }));
      const tex = [...maps], parts = [];
      for (let i = 0; i < tex.length; i += 60) parts.push(() => tex.slice(i, i + 60).forEach(m => r.initTexture(m)));
      for (const o of one.values()) parts.push(() => this.warmUp(room, true, [o]));
      parts.push(() => this.warmUp(room, true));
      const step = () => idle(() => {
        if (this.next !== next) return res();
        parts.shift()();
        if (parts.length) step(); else { next.warm = true; res(); }
      }, { timeout: 300 });
      step();
    }));
  }
  taken(name, send, door, span = 0) {
    const n = this.next; this.next = null;
    if (n && n.name === name && same(n.send, send) && n.door === door && n.room.portrait === this.portrait) {
      // r614: taken before it is warm (every caller has its token already), its idle compile stops here and none
      // of its textures is uploaded: warmUp() at the glass uploaded them all at once, 1.6's glass held 1.5 s, not 1
      // (tools/taken_cold.py). Compiled as prepare() does, its textures spread over span, the flight's ms; a slide
      // passes none: across() uploads them on the still picture, uploads while sliding jolted it (slide_trace.py)
      if (!n.warm) n.ready = span ? this.upload(n.room, this.token, this.compile(n.room.scene), span) : this.compile(n.room.scene);
      return n;
    }
    if (n) this.dispose(n.room);
    return null;
  }
  drop() { if (this.next) { this.dispose(this.next.room); this.next = null; } }
  // the slide's end (or its cut short by another step): the old room goes
  endSlide() {
    const sl = this.sliding; if (!sl) return;
    this.sliding = null; delete this.renderPass.render;   // the pass's own render again
    this.dispose(sl.from.room); sl.res(sl.tok === this.token);
  }
  beat(id) { if (!this.room) return; this.room.beat = id; this.time = this.instant ? this.room.machine.beats[id].end : 0; }
  // out the way it came, the same move backwards: the room camera backs off faster and faster as the
  // veil rises, then the valley camera pulls out of the room's window at that rate and slows onto shot
  async leave(shot) {
    if (!this.room) return;
    this.drop();
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
    this.drop();
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
    const room = this.said ? Math.min(Math.max(BUBBLE, said), b.h * .4) : Math.min(BUBBLE, b.h * .25), h0 = b.h; b.top += room; b.h -= room;
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2) * 2, m = .9;
    const dist = () => Math.max(size.y * b.H / (m * b.h), size.x * b.H / (m * b.w)) / tan + 2.2;
    let d = dist();
    // said, on a phone: #topbar-tab pushes the bubble down, so in a short band (the text open) the
    // frame's top would run under it; the band's top then comes down to the bubble's foot, up to
    // half the band (r474). Where the frame already sits lower nothing moves.
    const tab = this.said && document.getElementById('topbar-tab');
    if (tab?.offsetHeight) {
      // the bubble starts 6 px under the tab, its tail wants 10 px more: said (height + 16)
      const need = tab.getBoundingClientRect().bottom + said, more = Math.min(need - this.topPx(c, d, b, box), h0 * .5 - room);
      if (more > 0) { b.top += more; b.h -= more; d = dist(); }
    }
    this.want = { center: c, d, b, box };
    if (now) { this.view.center.copy(c); this.view.d = d; }
  }
  // where the top of the frame lands on screen, px, for a camera placed as update() places it
  topPx(c, d, b, box) {
    const k = this.probe ||= this.camera.clone();
    k.fov = this.camera.fov; k.aspect = this.camera.aspect;
    k.position.set(c.x, c.y + d * .14, c.z + d); k.lookAt(c);
    k.setViewOffset(b.W, b.H, b.W / 2 - (b.left + b.w / 2), b.H / 2 - (b.top + b.h / 2), b.W, b.H);
    k.updateMatrixWorld();
    const p = v(c.x, box.max.y, box.max.z).project(k);
    return (1 - p.y) / 2 * b.H;
  }
  update(dt) {
    // a zoom in cut short (another step, another mode): its veil goes
    if (this.zooming && (this.zooming.tok !== this.token || !this.zooming.live())) { this.zooming = null; setVeil(this.veil, 0); }
    if (!this.room) return;
    const sl = this.sliding;
    if (sl) {   // eased in and out: no jolt at either end
      sl.k = Math.min(1, sl.k + dt / SLIDE); sl.s = sl.k < .5 ? 4 * sl.k ** 3 : 1 - (2 - 2 * sl.k) ** 3 / 2;
      if (sl.k >= 1 || sl.tok !== this.token) this.endSlide();
    }
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
    this.topFade();
    for (const f of this.room.scene.userData.flames || []) f.light.intensity = this.flame + Math.sin(this.time * 13 + f.light.position.x) * 6 + Math.sin(this.time * 7.3) * 4;
  }
}
