// The actors and the props, and everything they do: a key goes down, the rotors step, the
// current runs through the drum leg by leg (each contact it reaches gets its letter), a lamp
// lights; the drum is taken out of the machine and spread apart so the current can be seen;
// the cipher goes out by radio, past Eve's aerial, to Bob. Each machine carries its setting of the
// day (rotors, rings, cables): the current runs through a cable on its way in and out, the core of
// a rotor sits turned against its letters by its ring. apply(state) puts everything where a story
// step says, instantly; the async actions animate from there and write back into st.
// Episode 5.3 adds Eve's side: her copy of the machine (machine 'e'), the slate where the crib slides
// under the intercepted cipher and the menu is drawn, and the bombe that runs a menu through the
// 17 576 positions of one rotor order (enigma.js does the arithmetic; this draws it).
import * as THREE from 'three';
import { PLACES, TOP_Y, FLOOR, MAST_H } from './world.js';
import { machine, person, rack, COLORS, STEP, R, RC, wirePoints, loopPoints, at, DRUM, SLOTS, socketAt, cablePoints, FRONT, APART_C } from './props.js';
import { A, ROTORS, NAMES, BARE, STARTS, press, clashes, menuLetters, bombe as runBombe, check, scrambler, posOf } from './enigma.js';
import { burst, ring } from '../../lib/fx.js';
import { sfx } from '../../lib/sound.js';
import { raw } from './i18n.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z), X = v(1, 0, 0);
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const GOLD = 0xffd84d, BACK = 0xff7a3d;
// a press is drawn in 8 segments: key through its cable to the right rotor, across the right, middle
// and left rotors, the reflector, the left, middle and right rotors, and through a cable to the lamp
export const SEGS = 8;

// A polyline as a curve, by length: the tube follows it and the spark rides it at an even pace.
class Poly extends THREE.Curve {
  constructor(pts) {
    super(); this.pts = pts; this.acc = [0];
    for (let i = 1; i < pts.length; i++) this.acc.push(this.acc[i - 1] + pts[i].distanceTo(pts[i - 1]));
    this.len = this.acc.at(-1) || 1e-6;
  }
  getPoint(u, out = new THREE.Vector3()) {
    const d = u * this.len; let i = 1;
    while (i < this.acc.length - 1 && this.acc[i] < d) i++;
    const a = this.acc[i - 1], b = this.acc[i], k = b > a ? (d - a) / (b - a) : 0;
    return out.lerpVectors(this.pts[i - 1], this.pts[Math.min(i, this.pts.length - 1)], Math.min(1, Math.max(0, k)));
  }
}
const bez = (p0, p1, p2, p3, n = 24) => new THREE.CubicBezierCurve3(p0, p1, p2, p3).getPoints(n);

// where a guess's tag sits beside each letter of the story's loop, as [first, middle, last] offsets:
// clear of the link numbers round E (11 on E-H, 19 on T-E) and of 9 on T-R
const TRACE_AT = { E: [[-2.5, 1.3], [1.9, 1], [-0.2, -1.5]], T: [[-1.9, 1.2], [2.1, -0.85], [-1.9, -1.2]] };
// on a phone held upright E's first tag keeps inside the screen and B's sits level with B, under the top controls rather than behind them (r354)
const TRACE_AT_UPRIGHT = { ...TRACE_AT, E: [[-1.6, 1.5], ...TRACE_AT.E.slice(1)], B: [[1.9, 1], [2.3, 0], [-1.9, -1.2]] };

export class Stage {
  constructor(world, tickers) {
    this.world = world; this.scene = world.scene; this.tickers = tickers; this.speed = 1; this.token = 0;
    const S = this.scene;
    this.people = {};
    for (const k of ['a', 'e', 'b']) { const p = person(k); p.position.copy(PLACES[k].person).setY(FLOOR); p.rotation.y = k === 'e' ? 1.25 : .8; S.add(p); this.people[k] = p; }
    this.machines = {}; this.names = {};
    for (const k of ['a', 'b', 'e']) {
      const m = machine(); m.position.copy(PLACES[k].desk).add(v(k === 'e' ? 2.4 : 0, TOP_Y, .5)); S.add(m); this.machines[k] = m;
      this.names[k] = Object.fromEntries(DRUM.map(id => { const l = label(); S.add(l); return [id, l]; }));
      const light = new THREE.PointLight(0xffc04a, 0, 6, 1.5); S.add(light); m.userData.lampLight = light;
    }
    // the box of five rotors, spread above Alice's machine when the story counts the orders
    this.rack = rack(); this.rack.position.copy(this.machines.a.position).add(APART_C).add(v(0, 4.6, -.6)); S.add(this.rack);
    this.rackTags = Object.fromEntries(NAMES.map(n => { const l = label(); S.add(l); return [n, l]; }));
    this.rackSum = label(); S.add(this.rackSum);
    this.pads = Object.fromEntries(['a', 'e', 'b'].map(k => { const l = label(); S.add(l); return [k, l]; }));
    this.paths = new THREE.Group(); S.add(this.paths);
    this.tags = new THREE.Group(); S.add(this.tags);
    this.spark = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
    this.spark.add(new THREE.PointLight(0xffe08a, 6, 5, 1.6)); this.spark.visible = false; S.add(this.spark);
    this.onChange = () => {};   // set by main: the card in the corner follows the stage
    this.idle = (dt, time) => {
      for (const [k, p] of Object.entries(this.people)) p.position.y = FLOOR + Math.abs(Math.sin(time * 1.3 + k.charCodeAt(0))) * .25;
      for (const k of Object.keys(this.machines)) this.placeNames(k);
    };
    this.slateG = new THREE.Group(); S.add(this.slateG);
    this.bombe = world.extras.bombe;
    tickers.add(this.idle);
  }

  // ---------- where things are ----------
  head(k) { return this.people[k].position.clone().add(v(0, 19.5, 0)); }
  padSpot(k) { return this.world.extras[k].pad.position.clone().add(v(0, 2.2, 0)); }
  // steps 13-14 on a phone held upright (camera.js's eveCheckPhone): Eve's notepad tag sits just above
  // her drum, whose part tags are hidden, so the drum can be framed close (r351, Simon's pick C)
  closeCheck() { return this.st.check && innerWidth < innerHeight; }
  checkSpot() { const d = this.machines.e.userData.drum; return d.entry.getWorldPosition(v(0, 0, 0)).lerp(d.ref.getWorldPosition(v(0, 0, 0)), .5).add(v(0, R * d.R.scale.x + .9, 0)); }
  mastTop(k) { return this.world.masts[k].position.clone().add(v(0, MAST_H + 1, 0)); }
  drumTop(k) { const m = this.machines[k]; return m.localToWorld(v(0, 4.4 + 2.6, -.3)); }

  // ---------- the state of a story step ----------
  // set: the setting of each machine, { rotors, rings, plugs } (BARE: 5.1's, no cable) · rack: the five rotors shown
  // count: the rack's counting so far ({ n: slots counted, taken: names }) · pos: rotor positions per machine · apart: drum taken out (0..1) · down: the key held · lit: the lamp
  // shown: paths drawn, [{ m, rec, n }] (n of SEGS segments) · ghost: paths drawn faint, [{ m, rec }]
  // rows: the card's table, [{ rec, n }] · card: whose machine the card follows · pads: what each wrote
  // msg: { plain, cipher, from } under the table, once a whole message is typed
  // check: Eve checks a stop on her drum (steps 13-14), framed close on a phone (closeCheck)
  apply(st) {
    this.token++;
    this.st = { set: {}, rack: 0, count: null, pos: {}, apart: {}, down: {}, lit: {}, shown: [], ghost: [], rows: [], card: 'a', pads: {}, msg: null, hot: -1, tally: null,
      panel: null, slate: null, menu: null, run: null, check: false, ...st };
    st = this.st;
    for (const key of ['set', 'pos', 'apart', 'down', 'lit', 'pads']) st[key] = { ...st[key] };
    for (const k of Object.keys(this.machines)) { st.set[k] = { ...BARE, ...st.set[k] }; st.pos[k] ??= 'AAA'; st.apart[k] ??= 0; }
    if (st.slate) st.slate = { ...st.slate };
    if (st.menu) st.menu = { ...st.menu };
    if (st.run) st.run = { ...st.run, stops: [...st.run.stops], done: [...st.run.done] };
    st.shown = st.shown.map(s => ({ ...s })); st.rows = st.rows.map(r => ({ ...r })); st.ghost = [...st.ghost];
    for (const [k, m] of Object.entries(this.machines)) {
      m.userData.setApart(st.apart[k] ?? 0);
      this.setSetting(k, st.set[k]);
      this.setRotors(k, st.pos[k]);
      for (const [ch, key] of Object.entries(m.userData.keys)) key.position.y = 1 - (st.down[k] === ch ? .08 : 0);
      this.light(k, st.lit[k] || null);
    }
    for (const p of Object.values(this.people)) p.userData.arms.rotation.x = 0;
    this.spark.visible = false;
    this.rack.userData.setShow(st.rack);
    this.showCount(st.count);
    this.redrawPaths();
    this.drawSlate();
    this.setBombe();
    this.relabel();
  }

  // the rotors, rings and cables of machine k
  setSetting(k, set) {
    const m = this.machines[k].userData, d = m.drum;
    SLOTS.forEach((slot, i) => {
      const u = d[slot].userData;
      if (u.name !== set.rotors[i]) u.setName(set.rotors[i]);
      u.setRing(A.indexOf(set.rings[i]));
    });
    if (m.plugs !== set.plugs) m.setCables(set.plugs);
  }

  setRotors(k, pos) {
    const d = this.machines[k].userData.drum;
    SLOTS.forEach((slot, i) => d[slot].userData.setPos(A.indexOf(pos[i])));
    this.highlightWindows(k);
  }
  // the letter on top of each rotor (the one in the window) glows
  highlightWindows(k) {
    const d = this.machines[k].userData.drum;
    for (const slot of SLOTS) {
      const r = d[slot].userData, top = ((Math.round(-r.spin.rotation.x / STEP) % 26) + 26) % 26;
      r.letters.userData.letters.forEach((l, j) => l.material.color.set(j === top ? 0xffd84d : 0xbfb6a0));
    }
  }
  light(k, ch) {
    const m = this.machines[k].userData;
    for (const [c, lamp] of Object.entries(m.lamps)) {
      const on = c === ch;
      lamp.userData.glow.emissiveIntensity = on ? 5 : 0;
      lamp.userData.face.material.color.set(on ? 0x2a1a00 : 0x8a8070);
    }
    m.lampLight.intensity = ch ? 3 : 0;
    if (ch) m.lampLight.position.copy(this.machines[k].localToWorld(m.lamps[ch].position.clone().add(v(0, .4, 0))));
  }

  // the tags: over each component of a machine taken apart, its name and the letter in its window;
  // over each notepad, what was written on it
  relabel() {
    const st = this.st;
    for (const k of Object.keys(this.machines)) {
      for (const id of DRUM) {
        const tag = this.names[k][id], i = SLOTS.indexOf(id);
        const text = i >= 0 ? `${this.machines[k].userData.drum[id].userData.name} · ${this.windowLetter(k, id)}` : raw('part')[id];
        if (text !== tag.userData.text) setLabel(tag, text, i >= 0 ? '#ffd84d' : '#c9b48a', .5);
      }
    }
    for (const [n, tag] of Object.entries(this.rackTags)) {
      const r = this.rack.userData.rotors[n];
      tag.visible = this.st.rack > 0;
      if (tag.visible) { tag.position.copy(r.getWorldPosition(v(0, 0, 0))).add(v(0, R * 3 + .8, 0)); const text = `${n}, ${raw('notchWord')} ${ROTORS[n].notch}`; if (text !== tag.userData.text) setLabel(tag, text, '#5fe39a', .42); }
    }
    for (const [k, tag] of Object.entries(this.pads)) {
      const text = st.pads[k] || '';
      tag.visible = !!text;
      tag.position.copy(k === 'e' && this.closeCheck() ? this.checkSpot() : this.padSpot(k));
      if (text && text !== tag.userData.text) setLabel(tag, text, '#' + COLORS[k].toString(16).padStart(6, '0'), 1.1);
    }
    this.onChange();
  }
  windowLetter(k, id) { const r = this.machines[k].userData.drum[id].userData; return A[((Math.round(-r.spin.rotation.x / STEP) % 26) + 26) % 26]; }
  placeNames(k) {
    const m = this.machines[k], d = m.userData.drum, s = d.R.scale.x;
    for (const id of DRUM) {
      const tag = this.names[k][id], f = Math.min(1, Math.max(0, (m.userData.out[id] - .6) / .4));   // a part's tag fades in as it settles
      tag.position.copy(d[id].getWorldPosition(new THREE.Vector3())).add(v(0, R * s + (SLOTS.includes(id) ? .75 : 1.25), 0));
      tag.material.opacity = f; tag.visible = f > 0 && !(k === 'e' && this.closeCheck());
    }
  }

  // ---------- the path of the current ----------
  // The polyline of segment i (0..7) of a press on machine k, in world space, with the rotors where
  // they are now. Segment 0 runs from the key down to its socket, along the cable if one is plugged
  // there, up to the entry plate and on to the right rotor; 1..3 cross the right, middle and left
  // rotors to the next component, 4 is the reflector's loop, 5..7 cross the left, middle and right
  // rotors back, and 7 ends through the entry plate, a socket, its cable, and up to the lamp.
  segment(k, rec, i) {
    const m = this.machines[k], d = m.userData.drum; m.updateMatrixWorld(true);
    const p = [...rec.pos].map(c => A.indexOf(c)), rg = [...rec.rings].map(c => A.indexOf(c));
    const P = { L: p[0], M: p[1], R: p[2] }, RG = { L: rg[0], M: rg[1], R: rg[2] }, NM = { L: rec.rotors[0], M: rec.rotors[1], R: rec.rotors[2] };
    const x = [A.indexOf(rec.in), ...rec.path.map(c => A.indexOf(c))];   // the fixed-frame contact before and after each crossing
    // a point of a core, drawn where that core stood for this press (window rec.pos, ring rec.rings),
    // whatever the rotor shows now: so a faint earlier path stays on its own wires
    const W = (id, pt) => d[id].localToWorld(pt.clone().applyAxisAngle(X, (RG[id] - P[id]) * STEP));
    const face = (id, side, xi) => d[id].localToWorld(at(side * d[id].userData.half, RC, xi * STEP));
    const L = q => m.localToWorld(q.clone());
    const out = [];
    // in the core's own frame the wire from fixed contact xin starts at (xin + p - ring)
    const wire = (id, xin, back) => {
      const u = d[id].userData, w = ROTORS[NM[id]].wiring, h = u.half, off = P[id] - RG[id];
      if (!back) { const j = (((xin + off) % 26) + 26) % 26; return wirePoints(j, A.indexOf(w[j]), h).map(q => W(id, q)); }
      const kk = (((xin + off) % 26) + 26) % 26, j = w.indexOf(A[kk]);
      return wirePoints(j, kk, h).reverse().map(q => W(id, q));
    };
    // from a socket on the front face (machine frame) to the entry plate's contact xi, or back
    const toPlate = (sock, xi) => {
      const e = face('entry', 1, xi), e2 = e.clone().add(v(1.4, 0, 0)), s0 = L(sock.clone().setZ(FRONT + .06));
      return [...bez(s0, L(sock.clone().add(v(.3, .9, 1.4))), e2.clone().add(v(1.6, -.8, 0)), e2), e];
    };
    // from the key's top, over the front edge, down to its socket
    const keyDown = key => {
      const top = L(m.userData.keys[key].position.clone().add(v(0, .19, 0))), sock = socketAt(key);
      return bez(top, top.clone().add(v(0, .6, .5)), L(sock.clone().add(v(0, .5, .45))), L(sock.clone().setZ(FRONT + .06)));
    };
    const lampUp = lamp => {
      const sock = socketAt(lamp), top = L(m.userData.lamps[lamp].position.clone().add(v(0, .05, 0)));
      return bez(L(sock.clone().setZ(FRONT + .06)), L(sock.clone().add(v(0, .5, .45))), top.clone().add(v(0, 1.2, .2)), top);
    };
    const cable = (a, b) => a === b ? [] : cablePoints(a, b).map(L);
    // forward: right to left; the component to the left of each
    const NEXT = { R: 'M', M: 'L', L: 'ref' }, PREV = { L: 'M', M: 'R', R: 'entry' };
    if (i === 0) {
      out.push(...keyDown(rec.key), ...cable(rec.key, rec.in), ...toPlate(socketAt(rec.in), x[0]), face('entry', -1, x[0]), face('R', 1, x[0]));
    } else if (i <= 3) {
      const id = ['R', 'M', 'L'][i - 1];
      out.push(...wire(id, x[i - 1], false), face(NEXT[id], 1, x[i]));
    } else if (i === 4) {
      const h = d.ref.userData.half;
      out.push(...loopPoints(x[3], x[4], h).map(q => d.ref.localToWorld(q)), face('L', -1, x[4]));
    } else {
      const id = ['L', 'M', 'R'][i - 5];
      out.push(...wire(id, x[i - 1], true), face(PREV[id], -1, x[i]));
      if (i === 7) {
        const back = toPlate(socketAt(rec.path[6]), x[7]).reverse();
        out.push(face('entry', -1, x[7]), ...back, ...cable(rec.path[6], rec.lamp), ...lampUp(rec.lamp));
      }
    }
    return out;
  }
  // where segment i's letter is shown: in the gap it ends in, a little outside the contacts
  tagSpot(k, rec, i) {
    const m = this.machines[k], d = m.userData.drum;
    const pair = [null, ['R', 'M'], ['M', 'L'], ['L', 'ref'], ['ref', 'L'], ['L', 'M'], ['M', 'R'], ['R', 'entry']][i];
    const xi = A.indexOf(rec.path[i - 1]);
    const a = d[pair[0]].getWorldPosition(v(0, 0, 0)), b = d[pair[1]].getWorldPosition(v(0, 0, 0)), s = d.R.scale.x;
    // forward letters on the left half of the gap, the way back on the right half
    const mid = a.lerp(b, .5).add(v(i >= 4 ? .42 : -.42, 0, 0));
    return mid.add(at(0, RC * s, xi * STEP));
  }
  // over a socket of the plugboard, a little in front: where the cable's letter is shown; higher in
  // the close check on a phone, where the plugboard's foot is under the step panel (r351)
  socketSpot(k, ch) { return this.machines[k].localToWorld(socketAt(ch).add(v(0, k === 'e' && this.closeCheck() ? 1.6 : .42, .5))); }

  tube(pts, color, faint) {
    const curve = new Poly(pts), n = Math.max(8, Math.round(curve.len * 10));
    const g = new THREE.TubeGeometry(curve, n, faint ? .03 : .05, 6, false);
    const m = new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: faint, opacity: faint ? .3 : 1, depthWrite: !faint });
    const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 5; mesh.userData.curve = curve;
    this.paths.add(mesh);
    return mesh;
  }
  // over a lit lamp, its letter, big
  lampTag(k, ch) {
    const m = this.machines[k];
    return this.tag(m.localToWorld(m.userData.lamps[ch].position.clone().add(v(0, 1.1, 0))), ch, '#ffffff', .9);
  }
  tag(spot, letter, color, h = .62, bg) {
    const l = label(); setLabel(l, letter, color, h, bg); l.position.copy(spot); l.visible = true; this.tags.add(l); return l;
  }
  clearPaths() {
    for (const g of [this.paths, this.tags]) for (const o of [...g.children]) { g.remove(o); o.geometry?.dispose(); o.material.map?.dispose(); o.material.dispose(); }
  }
  // every path in st.shown and st.ghost, drawn whole
  redrawPaths() {
    this.clearPaths();
    for (const gh of this.st.ghost) for (let i = 0; i < SEGS; i++) this.tube(this.segment(gh.m, gh.rec, i), i < 4 ? GOLD : BACK, true);
    for (const s of this.st.shown) { for (let i = 0; i < s.n; i++) this.drawSeg(s.m, s.rec, i); if (s.n >= SEGS) this.lampTag(s.m, s.rec.lamp); }
  }
  drawSeg(k, rec, i) {
    const tube = this.tube(this.segment(k, rec, i), i < 4 ? GOLD : BACK, false);
    this.segTags(k, rec, i);
    return tube;
  }
  // the letters a finished segment writes: the contact it reached, and a cable's other end
  segTags(k, rec, i) {
    const sh = k === 'e' && this.closeCheck() ? .62 : .5;   // a cable's tag, as big as a contact's in the close check (r351)
    if (i >= 1) this.tag(this.tagSpot(k, rec, i), rec.path[i - 1], i < 4 ? '#ffd84d' : '#ff9a5c');
    if (i === 0 && rec.in !== rec.key) this.tag(this.socketSpot(k, rec.in), `${rec.key}→${rec.in}`, '#ffd84d', sh);
    if (i === 7 && rec.lamp !== rec.path[6]) this.tag(this.socketSpot(k, rec.lamp), `${rec.path[6]}→${rec.lamp}`, '#ff9a5c', sh);
  }

  // ---------- animation helpers ----------
  tween(dur, f) {
    const tok = this.token;
    return new Promise(res => {
      let x = 0;
      const tick = dt => {
        if (tok !== this.token) { this.tickers.delete(tick); return res(false); }   // a new step took over
        x = Math.min(1, x + dt * this.speed / dur); f(x);
        if (x >= 1) { this.tickers.delete(tick); res(true); }
      };
      this.tickers.add(tick);
    });
  }
  wait(s) { return this.tween(s, () => {}); }
  // the card's count, up to line n of `kind`, then a pause
  async tallyTo(kind, n, gap = 1) { this.st.tally = { kind, n }; this.onChange(); sfx.tick(); return this.wait(gap); }
  live(tok) { return tok === this.token; }
  async arm(k, up = 1, dur = .3) { const a = this.people[k].userData.arms; const r0 = a.rotation.x; await this.tween(dur, x => a.rotation.x = r0 + (-up - r0) * ease(x)); }

  // ---------- the actions ----------
  // Take the drum out of the machine and spread it (e = 1), or put it back (e = 0).
  async apart(k, e = 1, dur = 2.4) {
    const m = this.machines[k].userData, e0 = m.apart ?? 0;
    sfx.wind();
    // on the camera's own ease, so the drum grows no faster than the camera backs away from it
    const ok = await this.tween(dur, x => m.setApart(e0 + (e - e0) * ease(x)));
    if (!ok) return false;
    this.st.apart[k] = e; this.relabel();
    return true;
  }

  // Turn rotor `name` of machine k by one notch.
  async notch(k, name, dur = .5) {
    const r = this.machines[k].userData.drum[name].userData, p0 = r.pos;
    sfx.click();
    const ok = await this.tween(dur, x => r.spin.rotation.x = -(p0 + ease(x)) * STEP);
    r.setPos((p0 + 1) % 26); this.highlightWindows(k); this.relabel();
    return ok;
  }

  // Let go of the key held, the lamp goes out.
  async release(k) {
    const m = this.machines[k].userData, ch = this.st.down[k];
    if (ch) await this.tween(.15, x => m.keys[ch].position.y = .92 + .08 * x);
    this.st.down[k] = null; this.st.lit[k] = null; this.light(k, null);
  }

  // Press a key: it goes down, and before any current passes the rotors step. Starts a row of
  // the card and a path, both empty; current() fills them.
  async pressKey(k, key) {
    const m = this.machines[k].userData, from = this.st.pos[k], rec = press(key, from, this.st.set[k]);
    if (this.st.down[k]) await this.release(k);
    this.arm(k, .9);
    sfx.tick();
    if (!await this.tween(.25, x => m.keys[key].position.y = 1 - .08 * ease(x))) return false;
    this.st.down[k] = key;
    // the right rotor always, the others when the stepping says so: a rotor carried by its
    // right neighbour's notch, or the middle one by its own, flashes the notch that pushed it
    const turns = SLOTS.filter((slot, i) => rec.pos[i] !== from[i]);
    const d = m.drum;
    if (from[2] === ROTORS[d.R.userData.name].notch) this.flashNotch(k, 'R');
    if (from[1] === ROTORS[d.M.userData.name].notch) this.flashNotch(k, 'M');
    const results = await Promise.all(turns.reverse().map(slot => this.notch(k, slot)));
    if (results.includes(false)) return false;
    this.st.pos[k] = rec.pos;
    this.st.shown = this.st.shown.filter(s => s.m !== k);   // the last path of this machine goes
    this.redrawPaths();
    this.st.shown.push({ m: k, rec, n: 0 });
    this.st.rows.push({ rec, n: 0 }); this.st.card = k;
    this.relabel();
    return true;
  }

  // Run the current of the last key pressed on k up to segment `upto` (SEGS: all the way, the lamp lights).
  async current(k, upto = SEGS, pace = 1) {
    const s = this.st.shown.find(x => x.m === k), row = this.st.rows.at(-1);
    if (!s) return false;
    while (s.n < upto) {
      const i = s.n, tube = this.tube(this.segment(k, s.rec, i), i < 4 ? GOLD : BACK, false), g = tube.geometry, total = g.index.count, curve = tube.userData.curve;
      g.setDrawRange(0, 0); this.spark.visible = true;
      if (i === 0 || i === 4) sfx.tick();
      const dur = (.45 + curve.len * .16) / pace;
      const ok = await this.tween(dur, x => { g.setDrawRange(0, Math.floor(total * x / 6) * 6); curve.getPoint(x, this.spark.position); });
      if (!ok) return false;
      g.setDrawRange(0, Infinity);
      s.n++; row.n = s.n; this.st.hot = s.n - 2;
      this.segTags(k, s.rec, i); if (i >= 1) sfx.scratch();
      this.onChange();
      if (i === 3 && upto > 4) await this.wait(.25 / pace);
    }
    this.spark.visible = false; this.st.hot = -1;
    if (s.n >= SEGS) {
      this.st.lit[k] = s.rec.lamp; this.light(k, s.rec.lamp); sfx.lamp();
      const lamp = this.machines[k].localToWorld(this.machines[k].userData.lamps[s.rec.lamp].position.clone().add(v(0, .2, 0)));
      this.lampTag(k, s.rec.lamp);
      burst(lamp, 0xffd84d, { count: 40, speed: 2, up: 2, size: .12, life: .9, gravity: 3 });
      this.arm(k, 0);
    }
    this.onChange();
    return true;
  }

  // A whole key: press, then the current all the way to the lamp. Each lamp is written down.
  async type(k, text, pace = 1) {
    for (const c of text) {
      if (!await this.pressKey(k, c)) return false;
      if (!await this.current(k, SEGS, pace)) return false;
      this.st.pads[k] = (this.st.pads[k] || '') + this.st.lit[k]; this.relabel();
      if (!await this.wait(.6 / pace)) return false;
    }
    return true;
  }

  // Replay paths one after the other, each with the rotors where they stood when it ran.
  async replay(k, recs) {
    this.clearPaths(); this.st.shown = []; this.st.ghost = [];
    for (const rec of recs) {
      this.light(k, null);
      this.setRotors(k, rec.pos); this.relabel();
      this.st.shown = [{ m: k, rec, n: 0 }];
      // draw the earlier ones faint again
      const s = this.st.shown[0];
      while (s.n < SEGS) {
        const i = s.n, tube = this.tube(this.segment(k, rec, i), i < 4 ? GOLD : BACK, false), g = tube.geometry, total = g.index.count, curve = tube.userData.curve;
        this.spark.visible = true;
        const ok = await this.tween(.3 + curve.len * .08, x => { g.setDrawRange(0, Math.floor(total * x / 6) * 6); curve.getPoint(x, this.spark.position); });
        if (!ok) return false;
        this.segTags(k, rec, i);
        s.n++;
      }
      this.spark.visible = false; this.light(k, rec.lamp); this.lampTag(k, rec.lamp); sfx.lamp();
      if (!await this.wait(1.4)) return false;
      if (rec !== recs.at(-1)) { this.st.ghost.push({ m: k, rec }); this.st.shown = []; this.redrawPaths(); }
    }
    this.st.lit[k] = recs.at(-1).lamp;
    return true;
  }

  // Light every part of the drum in turn, right to left, the way the current goes.
  async tour(k) {
    const d = this.machines[k].userData.drum;
    for (const id of ['entry', 'R', 'M', 'L', 'ref']) {
      const u = d[id].userData, wm = u.wireMat, tag = this.names[k][id];
      const o0 = wm?.opacity, c0 = wm?.color.getHex();
      if (wm) { wm.opacity = 1; wm.color.set(0xffe9a8); }
      tag.scale.multiplyScalar(1.35); sfx.tick();
      const ok = await this.wait(1.3);
      if (wm) { wm.opacity = o0; wm.color.set(c0); }
      tag.scale.multiplyScalar(1 / 1.35);
      if (!ok) return false;
    }
    return true;
  }

  // The notch of slot `slot` glows a moment: it has just carried its left neighbour.
  flashNotch(k, slot) {
    const n = this.machines[k].userData.drum[slot].userData.notch, mt = n.material, tok = this.token;
    n.scale.setScalar(1.8); mt.emissiveIntensity = 4;
    this.wait(.9).then(() => { n.scale.setScalar(1); mt.emissiveIntensity = .6; });
    if (tok === this.token) burst(n.getWorldPosition(v(0, 0, 0)), 0x5fe39a, { count: 18, speed: 1.2, up: 1, size: .08, life: .6, gravity: 2 });
  }

  // Plug the cables of `plugs` one after the other into machine k's board.
  async plug(k, plugs) {
    const m = this.machines[k].userData, list = plugs.split(/\s+/).filter(Boolean), done = [];
    for (const p of list) {
      done.push(p); m.setCables(done.join(' ')); sfx.lock();
      for (const c of p) burst(this.machines[k].localToWorld(socketAt(c).add(v(0, 0, .1))), 0xffd84d, { count: 10, speed: .8, up: .6, size: .06, life: .5, gravity: 1 });
      if (!await this.wait(.32)) return false;
    }
    this.st.set[k] = { ...this.st.set[k], plugs }; this.relabel();
    return true;
  }

  // Turn the ring of slot `slot` to letter `to`: the core and its wires turn against the letters,
  // and the letter in the window does not move.
  async turnRing(k, slot, to, dur = 2.4) {
    const u = this.machines[k].userData.drum[slot].userData, r0 = u.ring, r1 = A.indexOf(to);
    sfx.wind();
    const ok = await this.tween(dur, x => u.core.rotation.x = (r0 + (r1 - r0) * ease(x)) * STEP);
    if (!ok) return false;
    u.setRing(r1);
    const s = this.st.set[k], rings = [...s.rings]; rings[SLOTS.indexOf(slot)] = to;
    this.st.set[k] = { ...s, rings: rings.join('') }; this.relabel();
    return true;
  }

  // Turn the three rotors of machine k by hand to `pos`, each the short way round.
  async turnTo(k, pos, dur = 1.6) {
    const d = this.machines[k].userData.drum;
    const from = SLOTS.map(slot => d[slot].userData.pos), to = [...pos].map(c => A.indexOf(c));
    const delta = from.map((f, i) => { let x = (to[i] - f) % 26; if (x > 13) x -= 26; if (x < -13) x += 26; return x; });
    sfx.wind();
    const ok = await this.tween(dur, x => SLOTS.forEach((slot, i) => d[slot].userData.spin.rotation.x = -(from[i] + delta[i] * ease(x)) * STEP));
    if (!ok) return false;
    this.st.pos[k] = pos; this.setRotors(k, pos); this.relabel();
    return true;
  }

  // The five rotors: how many orders. For each slot, left to right, the rotors still free glow, and
  // the one the day's sheet takes for it (I, II, III) dims: 5, then 4, then 3 to choose from.
  showCount(c) {
    const u = this.rack.userData, taken = c?.taken || [];
    for (const n of NAMES) {
      const r = u.rotors[n].userData, used = taken.includes(n), lit = c?.lit?.includes(n);
      r.wireMat.opacity = used ? .1 : lit ? 1 : .45; r.wireMat.color.set(lit ? 0xffe9a8 : 0xb08a50);
      r.body.material.opacity = used ? .05 : .15;
    }
    const txt = c ? c.sum : '';
    this.rackSum.visible = !!txt && this.st.rack > 0;
    if (txt) { setLabel(this.rackSum, txt, '#ffd84d', 1.1); this.rackSum.position.copy(this.rack.position).add(v(0, 3.4, 0)); }
  }
  async count(k = 'a') {
    const names = ['I', 'II', 'III'], parts = [];
    for (let i = 0; i < 3; i++) {
      const free = NAMES.filter(n => !names.slice(0, i).includes(n));
      parts.push(String(free.length));
      this.st.count = { taken: names.slice(0, i), lit: free, sum: parts.join(' × ') };
      this.showCount(this.st.count); sfx.tick();
      if (!await this.wait(1.4)) return false;
    }
    this.st.count = { taken: names, lit: [], sum: '5 × 4 × 3 = 60' }; this.showCount(this.st.count); sfx.lamp();
    return true;
  }

  // The cipher goes out by radio: each letter flies from Alice's aerial to Bob's, over Eve's,
  // and Eve writes it down as it passes. A long message goes out letter after letter, `every`
  // seconds apart, several in the air at once.
  async radio(text, from = 'a', to = 'b', every = .45) {
    const A0 = this.mastTop(from), B0 = this.mastTop(to), E0 = this.mastTop('e'), ctrl = E0.clone().add(v(0, 40, 0));
    const curve = new THREE.QuadraticBezierCurve3(A0, ctrl, B0);
    this.st.pads.e = ''; this.st.pads[to] = this.st.pads[to] || ''; this.relabel();
    const fly = async c => {
      const l = label(); setLabel(l, c, '#ffd84d', 4); l.visible = true; this.scene.add(l);
      ring(A0.clone().setY(A0.y - 1), COLORS[from], { radius: 10, life: 1 }); sfx.send();
      let heard = false;
      const ok = await this.tween(2.2, x => {
        curve.getPoint(x, l.position);
        if (!heard && x > .5) { heard = true; ring(E0.clone().setY(E0.y - 1), COLORS.e, { radius: 12, life: 1.2 }); sfx.capture(); this.st.pads.e += c; this.relabel(); }
      });
      this.scene.remove(l); l.material.map?.dispose(); l.material.dispose();
      if (ok) { ring(B0.clone().setY(B0.y - 1), COLORS[to], { radius: 10, life: 1 }); sfx.arrive(); }
      return ok;
    };
    const flights = [];
    for (const c of text) { flights.push(fly(c)); if (!await this.wait(every)) return false; }
    return !(await Promise.all(flights)).includes(false);
  }
  // ---------- Eve's slate: the crib under the cipher, then the menu ----------
  // st.slate: { cipher, crib, k: the place the crib sits at (0-based, its first letter under
  // cipher letter k), marks: { place: 'out' | 'ok' } } · st.menu: { links, n: links drawn,
  // trace: { letters, vals, upto } } (a guess followed round a loop: vals[j] is letters[j]'s cable)
  slateAt(x, y) { return PLACES.e.slate.clone().add(v(x, y, .4)); }
  colX(i, len) { return (i - (len - 1) / 2) * 1.6; }
  drawSlate() {
    const g = this.slateG;
    for (const o of [...g.children]) { g.remove(o); o.geometry?.dispose(); o.material.map?.dispose(); o.material.dispose(); }
    const sl = this.st.slate;
    // on a phone held upright the menu's steps (8-9) frame the loop close, and the rows above it
    // (places, cipher, crib) could only peek half-cut between the top controls: they are left out (r355)
    const rows = !(innerWidth < innerHeight && this.st.panel === 'menu' && this.st.menu);
    if (sl && rows) {
      const L = sl.cipher.length, k = sl.k, whole = Number.isInteger(k), hit = whole ? clashes(sl.cipher, sl.crib, k) : [];
      for (let i = 0; i < L; i++) {
        const mark = sl.marks?.[i], num = this.tag(this.slateAt(this.colX(i, L), 13.6), String(i + 1), mark === 'out' ? '#ff4d5e' : mark === 'ok' ? '#5fe39a' : '#6d7a74', .62, mark === 'out' ? 'rgba(120,20,30,.9)' : mark === 'ok' ? 'rgba(20,90,50,.9)' : undefined);
        g.add(num);
        const on = whole && hit.includes(i - k);
        g.add(this.tag(this.slateAt(this.colX(i, L), 11.5), sl.cipher[i], on ? '#ff4d5e' : '#ffd84d', 1.15));
      }
      [...sl.crib].forEach((c, j) => {
        const on = hit.includes(j);
        g.add(this.tag(this.slateAt(this.colX(k + j, L), 9.6), c, on ? '#ff4d5e' : '#ff8a9a', 1.15, on ? 'rgba(150,20,35,.95)' : undefined));
      });
    }
    const mn = this.st.menu;
    if (mn) {
      const pos = this.menuLayout(mn.links), n = mn.n ?? mn.links.length, L = sl?.cipher.length ?? 23;
      // on a phone held upright (camera.js's menuPhone shots) the link numbers and the trace's tags,
      // which step 9's text reads out, are drawn bigger: at desktop size they were ~6 px there (r354)
      const upright = innerWidth < innerHeight, numH = upright ? 1 : .58, traceH = upright ? 1.2 : .72;
      // two links between the same letters (E-B 8 and B-E 13) bow apart, one each side, so their numbers part
      const key = l => [l.a, l.b].sort().join(''), count = {}, pairs = {};
      for (const l of mn.links) count[key(l)] = (count[key(l)] ?? 0) + 1;
      mn.links.slice(0, n).forEach((l, li) => {
        const twin = pairs[key(l)] = (pairs[key(l)] ?? -1) + 1, [p, q] = [l.a, l.b].sort();
        const a = this.slateAt(...pos[l.a]), b = this.slateAt(...pos[l.b]), mid = a.clone().lerp(b, .5);
        const pa = this.slateAt(...pos[p]), pb = this.slateAt(...pos[q]);
        const off = new THREE.Vector3(-(pb.y - pa.y), pb.x - pa.x, 0).normalize().multiplyScalar(count[key(l)] > 1 ? (twin ? -1.3 : 1.3) : 0);
        const ctrl = mid.clone().add(off), hot = mn.loop?.includes(li);
        const curve = new THREE.QuadraticBezierCurve3(a, ctrl, b);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, hot ? .12 : .07, 6, false), new THREE.MeshBasicMaterial({ color: hot ? 0xffd84d : 0x9fb4c8, toneMapped: false }));
        g.add(tube);
        g.add(this.tag(curve.getPoint(.5).add(v(0, 0, .05)), String(l.i + 1), hot ? '#ffd84d' : '#9fb4c8', numH));
        // the link's column on the cipher, when the crib is shown: a faint thread up to it
        if (sl && rows && Number.isInteger(sl.k) && li === n - 1 && mn.n != null && mn.n < mn.links.length + 1) {
          const top = this.slateAt(this.colX(l.i, L), 8.8);
          g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(top, curve.getPoint(.5)), 4, .04, 4, false), new THREE.MeshBasicMaterial({ color: 0xffd84d, transparent: true, opacity: .5, toneMapped: false })));
        }
      });
      for (const c of menuLetters(mn.links.slice(0, Math.max(1, n)))) g.add(this.tag(this.slateAt(...pos[c]).add(v(0, 0, .1)), c, '#ff8a9a', 1.1));
      const tr = mn.trace, AT = upright ? TRACE_AT_UPRIGHT : TRACE_AT;
      if (tr) tr.letters.slice(0, tr.upto).forEach((c, j) => {
        const last = j === tr.letters.length - 1, bad = last && tr.vals[j] !== tr.vals[0];
        const off = j === 0 ? v(...(AT[c]?.[0] ?? [-1.9, 1.2]), .2) : last ? v(...(AT[c]?.[2] ?? [-1.9, -1.2]), .2) : v(...(AT[c]?.[1] ?? [1.9, 1]), .2);
        g.add(this.tag(this.slateAt(...pos[c]).add(off), `${c}→${tr.vals[j]}${last ? (bad ? ' ✗' : ' ✓') : ''}`, last ? (bad ? '#ff4d5e' : '#5fe39a') : '#ffd84d', traceH));
      });
    }
  }
  // where each letter of a menu sits on the slate: the story's menu by hand (its loop E B R T a
  // square), any other one around an ellipse
  menuLayout(links) {
    const HAND = { E: [-6, 4.4], B: [-1, 7.2], R: [4, 4.4], T: [-1, 1.6], H: [-11, 4.4], X: [-16, 4.4], F: [-10.5, 1.4], M: [7, 1.4], C: [9.5, 4.4], I: [12, 1.4], W: [12.5, 7.2], S: [17, 7.2] };
    const ls = menuLetters(links);
    if (ls.every(c => HAND[c])) return HAND;
    return Object.fromEntries(ls.map((c, i) => { const a = Math.PI / 2 - i / ls.length * Math.PI * 2; return [c, [Math.cos(a) * 16, 4.3 + Math.sin(a) * 3.1]]; }));
  }
  // slide the crib from where it is to place `to`, a place at a time; at each place its columns are
  // checked, and the place marked ruled out (a letter over itself) or kept
  async slide(to, gap = .55) {
    const sl = this.st.slate;
    for (let k = Math.ceil(sl.k); ; k += Math.sign(to - k) || 1) {
      if (k !== sl.k) {
        const k0 = sl.k;
        if (!await this.tween(.35, x => { sl.k = k0 + (k - k0) * ease(x); this.drawSlate(); })) return false;
        sl.k = k;
      }
      const out = clashes(sl.cipher, sl.crib, k).length > 0;
      sl.marks = { ...sl.marks, [k]: out ? 'out' : 'ok' }; this.drawSlate(); this.onChange();
      out ? sfx.reject() : sfx.tick();
      if (!await this.wait(gap)) return false;
      if (k === to) return true;
    }
  }
  // draw the menu's links one after the other
  async drawMenu(gap = .45) {
    const mn = this.st.menu;
    for (let n = 1; n <= mn.links.length; n++) { mn.n = n; this.drawSlate(); this.onChange(); sfx.tick(); if (!await this.wait(gap)) return false; }
    mn.n = null; this.drawSlate();
    return true;
  }
  // a guess followed round the menu's loop at one position: letters[0]'s cable is guess, then each
  // link of the loop carries it on through the rotors as they stood at that link's letter
  async trace(guess, gap = 1) {
    const mn = this.st.menu, lp = mn.loop.map(i => mn.links[i]), letters = [lp[0].a === lp[1].a || lp[0].a === lp[1].b ? lp[0].b : lp[0].a];
    const vals = [guess];
    for (const l of lp) {
      const from = letters.at(-1), to = l.a === from ? l.b : l.a, P = scrambler(mn.rotors, mn.pos, l.i);
      letters.push(to); vals.push(A[P[A.indexOf(vals.at(-1))]]);
    }
    mn.trace = { letters, vals, upto: 0 };
    for (let j = 1; j <= letters.length; j++) { mn.trace.upto = j; this.drawSlate(); this.onChange(); j === letters.length ? (vals.at(-1) === guess ? sfx.lamp() : sfx.reject()) : sfx.tick(); if (!await this.wait(gap)) return false; }
    return true;
  }

  // ---------- the bombe ----------
  // st.run: { menus: [{ k, links }], test, rotors, m: the menu running, n: positions done in it,
  // done: positions done per menu, stops: [{ k, pos, guess }], checks: [{ ...stop, pairs, bad }] | null }
  setBombe() {
    const r = this.st.run, u = this.bombe.userData;
    if (!r) { u.setRun(0, 0); u.lampM.emissiveIntensity = 0; return; }
    const links = r.menus[Math.min(r.m, r.menus.length - 1)]?.links || [];
    u.setRun(Math.min(r.n, STARTS - 1), links.length, links.map(l => l.i + 1));
  }
  async runBombe(secs = 2.4) {
    const r = this.st.run, u = this.bombe.userData;
    sfx.wind();
    for (; r.m < r.menus.length; r.m++) {
      const { k, links } = r.menus[r.m];
      let done = r.n = 0, last = 0;
      const ok = await this.tween(secs, x => {
        const to = Math.floor(x * STARTS);
        if (to > done) {
          for (const st of runBombe(links, r.rotors, r.test, done, to)) {
            r.stops.push({ k, ...st }); sfx.lamp();
            burst(this.bombe.localToWorld(v(0, 20, 3.5)), 0xffd84d, { count: 20, speed: 2, up: 2, size: .3, life: .8, gravity: 2 });
          }
          done = r.n = to; r.done[r.m] = to;
        }
        u.lampM.emissiveIntensity = 1 + Math.sin(x * 90);
        this.setBombe();
        if (x - last > .05 || x >= 1) { last = x; this.onChange(); }
      });
      if (!ok) return false;
    }
    u.lampM.emissiveIntensity = 0; this.onChange();
    return true;
  }
  // the clerk follows each stop's guess through its menu: a letter with two cables throws it out
  async checkStops(gap = .5) {
    const r = this.st.run; r.checks = [];
    for (const s of r.stops) {
      const menu = r.menus.find(m => m.k === s.k), c = check(menu.links, r.rotors, s, r.test);
      r.checks.push({ ...s, pairs: c.pairs, bad: c.bad });
      c.bad.length ? sfx.tick() : sfx.lamp(); this.onChange();
      if (!await this.wait(gap)) return false;
    }
    return true;
  }

  // Type a whole text fast on machine k: each key steps the rotors, its whole path is drawn at once,
  // its lamp lights and is written down.
  async typeQuick(k, text, gap = .45) {
    for (const c of text) {
      const rec = press(c, this.st.pos[k], this.st.set[k]);
      this.st.pos[k] = rec.pos; this.setRotors(k, rec.pos); sfx.click();
      this.st.shown = this.st.shown.filter(s => s.m !== k); this.st.shown.push({ m: k, rec, n: SEGS });
      this.st.rows.push({ rec, n: SEGS }); this.st.card = k;
      this.st.lit[k] = rec.lamp; this.light(k, rec.lamp); this.redrawPaths();
      this.st.pads[k] = (this.st.pads[k] || '') + rec.lamp; this.relabel();
      if (!await this.wait(gap)) return false;
    }
    return true;
  }
}

// A floating tag (« III · A », « TVG »): a sprite with its text drawn on a canvas.
function label() {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
  s.renderOrder = 20; s.visible = false; s.userData.text = '';
  return s;
}
function setLabel(s, text, color, h = .34, bg = 'rgba(16,18,28,.86)') {
  const c = document.createElement('canvas'), x = c.getContext('2d'), font = '700 40px "Courier New", Courier, monospace';
  x.font = font; const w = Math.ceil(x.measureText(text).width) + 40;
  c.width = Math.max(72, w); c.height = 72;
  x.font = font; x.fillStyle = bg; x.strokeStyle = color; x.lineWidth = 5;
  x.beginPath(); x.roundRect(3, 3, c.width - 6, 66, 30); x.fill(); x.stroke();
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, 38);
  s.material.map?.dispose(); s.material.map = new THREE.CanvasTexture(c); s.material.map.colorSpace = THREE.SRGBColorSpace; s.material.needsUpdate = true;
  s.scale.set(c.width / 72 * h, h, 1); s.userData.text = text;
}
