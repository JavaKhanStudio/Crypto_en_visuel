// The actors and the props, and everything they do: a key goes down, the rotors step, the
// current runs through the drum leg by leg (each contact it reaches gets its letter), a lamp
// lights; the drum is taken out of the machine and spread apart so the current can be seen;
// the cipher goes out by radio, past Eve's aerial, to Bob. apply(state) puts everything where a
// story step says, instantly; the async actions animate from there and write back into st.
import * as THREE from 'three';
import { PLACES, TOP_Y, FLOOR, MAST_H } from './world.js';
import { machine, person, COLORS, STEP, R, RC, wirePoints, loopPoints, at, DRUM } from './props.js';
import { A, ROTORS, ORDER, press } from './enigma.js';
import { burst, ring } from '../../lib/fx.js';
import { sfx } from './sound.js';
import { raw } from './i18n.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const GOLD = 0xffd84d, BACK = 0xff7a3d;
// a press is drawn in 8 segments: key to III, across III, II, I, the reflector, I, II, III to the lamp
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

export class Stage {
  constructor(world, tickers) {
    this.world = world; this.scene = world.scene; this.tickers = tickers; this.speed = 1; this.token = 0;
    const S = this.scene;
    this.people = {};
    for (const k of ['a', 'e', 'b']) { const p = person(k); p.position.copy(PLACES[k].person).setY(FLOOR); p.rotation.y = k === 'e' ? 1.25 : .8; S.add(p); this.people[k] = p; }
    this.machines = {}; this.names = {};
    for (const k of ['a', 'b']) {
      const m = machine(); m.position.copy(PLACES[k].desk).add(v(0, TOP_Y, .5)); S.add(m); this.machines[k] = m;
      this.names[k] = Object.fromEntries(DRUM.map(id => { const l = label(); S.add(l); return [id, l]; }));
      const light = new THREE.PointLight(0xffc04a, 0, 6, 1.5); S.add(light); m.userData.lampLight = light;
    }
    this.pads = Object.fromEntries(['a', 'e', 'b'].map(k => { const l = label(); S.add(l); return [k, l]; }));
    this.paths = new THREE.Group(); S.add(this.paths);
    this.tags = new THREE.Group(); S.add(this.tags);
    this.spark = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
    this.spark.add(new THREE.PointLight(0xffe08a, 6, 5, 1.6)); this.spark.visible = false; S.add(this.spark);
    this.onChange = () => {};   // set by main: the card in the corner follows the stage
    this.idle = (dt, time) => {
      for (const [k, p] of Object.entries(this.people)) p.position.y = FLOOR + Math.abs(Math.sin(time * 1.3 + k.charCodeAt(0))) * .25;
      for (const k of ['a', 'b']) this.placeNames(k);
    };
    tickers.add(this.idle);
  }

  // ---------- where things are ----------
  head(k) { return this.people[k].position.clone().add(v(0, 19.5, 0)); }
  padSpot(k) { return this.world.extras[k].pad.position.clone().add(v(0, 2.2, 0)); }
  mastTop(k) { return this.world.masts[k].position.clone().add(v(0, MAST_H + 1, 0)); }
  drumTop(k) { const m = this.machines[k]; return m.localToWorld(v(0, 4.4 + 2.6, -.3)); }

  // ---------- the state of a story step ----------
  // pos: rotor positions per machine · apart: drum taken out (0..1) · down: the key held · lit: the lamp
  // shown: paths drawn, [{ m, rec, n }] (n of SEGS segments) · ghost: paths drawn faint, [{ m, rec }]
  // rows: the card's table, [{ rec, n }] · card: whose machine the card follows · pads: what each wrote
  // msg: { plain, cipher, from } under the table, once a whole message is typed
  apply(st) {
    this.token++;
    this.st = { pos: { a: 'AAA', b: 'AAA' }, apart: { a: 0, b: 0 }, down: {}, lit: {}, shown: [], ghost: [], rows: [], card: 'a', pads: {}, msg: null, hot: -1, ...st };
    st = this.st;
    for (const key of ['pos', 'apart', 'down', 'lit', 'pads']) st[key] = { ...st[key] };
    st.shown = st.shown.map(s => ({ ...s })); st.rows = st.rows.map(r => ({ ...r })); st.ghost = [...st.ghost];
    for (const [k, m] of Object.entries(this.machines)) {
      m.userData.setApart(st.apart[k] ?? 0);
      this.setRotors(k, st.pos[k]);
      for (const [ch, key] of Object.entries(m.userData.keys)) key.position.y = 1 - (st.down[k] === ch ? .08 : 0);
      this.light(k, st.lit[k] || null);
    }
    for (const p of Object.values(this.people)) p.userData.arms.rotation.x = 0;
    this.spark.visible = false;
    this.redrawPaths();
    this.relabel();
  }

  setRotors(k, pos) {
    const d = this.machines[k].userData.drum;
    ORDER.forEach((name, i) => d[name].userData.setPos(A.indexOf(pos[i])));
    this.highlightWindows(k);
  }
  // the letter on top of each rotor (the one in the window) glows
  highlightWindows(k) {
    const d = this.machines[k].userData.drum;
    for (const name of ORDER) {
      const r = d[name].userData, top = ((Math.round(-r.spin.rotation.x / STEP) % 26) + 26) % 26;
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
    for (const k of ['a', 'b']) {
      for (const id of DRUM) {
        const tag = this.names[k][id], name = raw('part')[id];
        const i = ORDER.indexOf(id), text = i >= 0 ? `${name} · ${this.windowLetter(k, id)}` : name;
        if (text !== tag.userData.text) setLabel(tag, text, i >= 0 ? '#ffd84d' : '#c9b48a', .5);
      }
    }
    for (const [k, tag] of Object.entries(this.pads)) {
      const text = st.pads[k] || '';
      tag.visible = !!text;
      tag.position.copy(this.padSpot(k));
      if (text && text !== tag.userData.text) setLabel(tag, text, '#' + COLORS[k].toString(16).padStart(6, '0'), 1.1);
    }
    this.onChange();
  }
  windowLetter(k, id) { const r = this.machines[k].userData.drum[id].userData; return A[((Math.round(-r.spin.rotation.x / STEP) % 26) + 26) % 26]; }
  placeNames(k) {
    const m = this.machines[k], d = m.userData.drum, s = d.III.scale.x;
    for (const id of DRUM) {
      const tag = this.names[k][id], f = Math.min(1, Math.max(0, (m.userData.out[id] - .6) / .4));   // a part's tag fades in as it settles
      tag.position.copy(d[id].getWorldPosition(new THREE.Vector3())).add(v(0, R * s + (ORDER.includes(id) ? .75 : 1.25), 0));
      tag.material.opacity = f; tag.visible = f > 0;
    }
  }

  // ---------- the path of the current ----------
  // The polyline of segment i (0..7) of a press on machine k, in world space, with the rotors where
  // they are now. Segment 0 runs from the key to rotor III, 1..3 cross III, II, I to the next
  // component, 4 is the reflector's loop, 5..7 cross I, II, III back, 7 ends on the lamp.
  segment(k, rec, i) {
    const m = this.machines[k], d = m.userData.drum; m.updateMatrixWorld(true);
    const p = [...rec.pos].map(c => A.indexOf(c));
    const P = { I: p[0], II: p[1], III: p[2] };
    const x = [A.indexOf(rec.key), ...rec.path.map(c => A.indexOf(c))];   // the fixed-frame contact before and after each crossing
    const W = (id, pt) => (d[id].userData.spin || d[id]).localToWorld(pt.clone());
    const face = (id, side, xi) => d[id].localToWorld(at(side * d[id].userData.half, RC, xi * STEP));
    const out = [];
    const wire = (id, xin, back) => {
      const name = id, w = ROTORS[name].wiring, h = d[id].userData.half;
      if (!back) { const j = (xin + P[name]) % 26; return wirePoints(j, A.indexOf(w[j]), h).map(q => W(id, q)); }
      const kk = (xin + P[name]) % 26, j = w.indexOf(A[kk]);
      return wirePoints(j, kk, h).reverse().map(q => W(id, q));
    };
    // forward: right to left; the component to the left of each
    const NEXT = { III: 'II', II: 'I', I: 'ref' }, PREV = { I: 'II', II: 'III', III: 'entry' };
    if (i === 0) {
      const top = m.localToWorld(m.userData.keys[rec.key].position.clone().add(v(0, .19, 0)));
      const eIn = face('entry', 1, x[0]), out2 = eIn.clone().add(v(1.4, 0, 0));
      out.push(...bez(top, top.clone().add(v(0, 2.2, .4)), out2.clone().add(v(1.6, -.6, 0)), out2), eIn, face('entry', -1, x[0]), face('III', 1, x[0]));
    } else if (i <= 3) {
      const id = ['III', 'II', 'I'][i - 1];
      out.push(...wire(id, x[i - 1], false), face(NEXT[id], 1, x[i]));
    } else if (i === 4) {
      const h = d.ref.userData.half;
      out.push(...loopPoints(x[3], x[4], h).map(q => d.ref.localToWorld(q)), face('I', -1, x[4]));
    } else {
      const id = ['I', 'II', 'III'][i - 5];
      out.push(...wire(id, x[i - 1], true), face(PREV[id], -1, x[i]));
      if (i === 7) {
        const eOut = face('entry', 1, x[7]), out2 = eOut.clone().add(v(1.4, 0, 0));
        const lamp = m.localToWorld(m.userData.lamps[rec.lamp].position.clone().add(v(0, .05, 0)));
        out.push(eOut, ...bez(out2, out2.clone().add(v(1.6, -.6, 0)), lamp.clone().add(v(0, 2.2, -.4)), lamp));
      }
    }
    return out;
  }
  // where segment i's letter is shown: in the gap it ends in, a little outside the contacts
  tagSpot(k, rec, i) {
    const m = this.machines[k], d = m.userData.drum;
    const pair = [null, ['III', 'II'], ['II', 'I'], ['I', 'ref'], ['ref', 'I'], ['I', 'II'], ['II', 'III'], ['III', 'entry']][i];
    const xi = A.indexOf(rec.path[i - 1]);
    const a = d[pair[0]].getWorldPosition(v(0, 0, 0)), b = d[pair[1]].getWorldPosition(v(0, 0, 0)), s = d.III.scale.x;
    // forward letters on the left half of the gap, the way back on the right half
    const mid = a.lerp(b, .5).add(v(i >= 4 ? .42 : -.42, 0, 0));
    return mid.add(at(0, RC * s, xi * STEP));
  }

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
  tag(spot, letter, color, h = .62) {
    const l = label(); setLabel(l, letter, color, h); l.position.copy(spot); l.visible = true; this.tags.add(l); return l;
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
    if (i >= 1) this.tag(this.tagSpot(k, rec, i), rec.path[i - 1], i < 4 ? '#ffd84d' : '#ff9a5c');
    return tube;
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
    const m = this.machines[k].userData, from = this.st.pos[k], rec = press(key, from);
    if (this.st.down[k]) await this.release(k);
    this.arm(k, .9);
    sfx.tick();
    if (!await this.tween(.25, x => m.keys[key].position.y = 1 - .08 * ease(x))) return false;
    this.st.down[k] = key;
    // the right rotor always, the others when the stepping says so
    const turns = ORDER.filter((name, i) => rec.pos[i] !== from[i]);
    const results = await Promise.all(turns.reverse().map(name => this.notch(k, name)));
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
      if (i >= 1) { this.tag(this.tagSpot(k, s.rec, i), s.rec.path[i - 1], i < 4 ? '#ffd84d' : '#ff9a5c'); sfx.scratch(); }
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
        if (i >= 1) this.tag(this.tagSpot(k, rec, i), rec.path[i - 1], i < 4 ? '#ffd84d' : '#ff9a5c');
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
    for (const id of ['entry', 'III', 'II', 'I', 'ref']) {
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

  // The cipher goes out by radio: each letter flies from Alice's aerial to Bob's, over Eve's,
  // and Eve writes it down as it passes.
  async radio(text, from = 'a', to = 'b') {
    const A0 = this.mastTop(from), B0 = this.mastTop(to), E0 = this.mastTop('e'), ctrl = E0.clone().add(v(0, 40, 0));
    const curve = new THREE.QuadraticBezierCurve3(A0, ctrl, B0);
    this.st.pads.e = ''; this.st.pads[to] = this.st.pads[to] || ''; this.relabel();
    for (const c of text) {
      const l = label(); setLabel(l, c, '#ffd84d', 4); l.visible = true; this.scene.add(l);
      ring(A0.clone().setY(A0.y - 1), COLORS[from], { radius: 10, life: 1 }); sfx.send();
      let heard = false;
      const ok = await this.tween(2.2, x => {
        curve.getPoint(x, l.position);
        if (!heard && x > .5) { heard = true; ring(E0.clone().setY(E0.y - 1), COLORS.e, { radius: 12, life: 1.2 }); sfx.capture(); this.st.pads.e += c; this.relabel(); }
      });
      this.scene.remove(l); l.material.map?.dispose(); l.material.dispose();
      if (!ok) return false;
      ring(B0.clone().setY(B0.y - 1), COLORS[to], { radius: 10, life: 1 }); sfx.arrive();
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
function setLabel(s, text, color, h = .34) {
  const c = document.createElement('canvas'), x = c.getContext('2d'), font = '700 40px "Courier New", Courier, monospace';
  x.font = font; const w = Math.ceil(x.measureText(text).width) + 40;
  c.width = Math.max(72, w); c.height = 72;
  x.font = font; x.fillStyle = 'rgba(16,18,28,.86)'; x.strokeStyle = color; x.lineWidth = 5;
  x.beginPath(); x.roundRect(3, 3, c.width - 6, 66, 30); x.fill(); x.stroke();
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, 38);
  s.material.map?.dispose(); s.material.map = new THREE.CanvasTexture(c); s.material.map.colorSpace = THREE.SRGBColorSpace; s.material.needsUpdate = true;
  s.scale.set(c.width / 72 * h, h, 1); s.userData.text = text;
}
