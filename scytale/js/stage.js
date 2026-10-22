// The actors and the props in the village, and everything they do: a strip is wound on a
// stick, a message is written along the stick's length, the strip is unwound and its letters
// come off out of order, a messenger carries it rolled up, Eve winds it on her own sticks,
// Bob on his. apply(state) puts everything where a story step says, instantly; the async
// actions animate from there and write back into st what they changed.
import * as THREE from 'three';
import { PLACES, TABLE_TOP } from './world.js';
import { stick, cradles, stylus, person, COLORS, STICK_L } from './props.js';
import { Strip } from './strip.js';
import { layout, order, lines, show } from './scytale.js';
import { burst, ring, icon } from '../../lib/fx.js';
import { sfx } from '../../lib/sound.js';
import { t } from './i18n.js';
import { ROW_COLORS } from './card.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const TAU = Math.PI * 2, AXIS_Y = TABLE_TOP + .62, ON_HEAD = 3.2;
// the four sticks: whose table, where along it, letters per turn, wood
export const STICKS = { a: ['a', 0, 4, 0x9a6a3c], b: ['b', 0, 4, 0x9a6a3c], eT: ['e', -3.2, 3, 0x6e4a30], eG: ['e', 3.2, 5, 0x6e4a30] };

export class Stage {
  constructor(world, tickers) {
    this.world = world; this.scene = world.scene; this.tickers = tickers; this.speed = 1; this.token = 0;
    const S = this.scene;
    this.people = {};
    for (const k of ['a', 'e', 'b']) { const p = person(k); p.position.copy(PLACES[k].person); if (k === 'e') p.rotation.y = .8; S.add(p); this.people[k] = p; }
    this.couriers = [person('n')]; S.add(...this.couriers);
    this.sticks = {}; this.tags = {};
    for (const [id, [k, dx, n, wood]] of Object.entries(STICKS)) {
      const s = stick(n, wood); s.position.copy(PLACES[k].table).add(v(dx, AXIS_Y, -.55)); s.userData.id = id; S.add(s); this.sticks[id] = s;
      const c = cradles(AXIS_Y - TABLE_TOP - .1); c.position.copy(s.position).setY(TABLE_TOP); S.add(c); s.userData.cradles = c;
      const tag = label(); tag.position.copy(s.position).add(v(0, .82, 0)); S.add(tag); this.tags[id] = tag;
    }
    this.stripTag = label(); S.add(this.stripTag);
    this.strip = new Strip(S);
    this.pen = stylus(); this.pen.visible = false; S.add(this.pen);
    this.onChange = () => {};   // set by main: the card in the corner follows the stage
    this.idle = (dt, time) => {
      for (const [k, p] of Object.entries(this.people)) p.position.y = PLACES[k].person.y + Math.abs(Math.sin(time * 1.3 + k.charCodeAt(0))) * .05;
      this.strip.update();
    };
    tickers.add(this.idle);
  }

  // ---------- where things rest ----------
  flatSpot(k) { return PLACES[k].table.clone().add(v(0, TABLE_TOP, .62)); }
  head(k) { return PLACES[k].person.clone().add(v(0, 4.3, 0)); }
  get lay() { return layout(this.st.msg, this.st.k); }
  shown(j) { const L = this.lay; return order(j, L.k, L.m) < this.st.strip.written; }
  // the line of the stick that faces the viewer
  front(id) { const s = this.sticks[id].userData; return ((Math.round(-s.phi * s.k / TAU) % s.k) + s.k) % s.k; }
  // what each line of a stick shows now, the written letters only
  linesOn(id) { const L = this.lay, kk = this.sticks[id].userData.k; return lines(L.strip.map((c, j) => this.shown(j) ? c : ''), kk); }

  // ---------- the state of a story step ----------
  // msg: the message, letters only · k: letters per turn of Alice's stick (it decides the strip)
  // sticks: letters per turn of each stick · hide: sticks not on the stage
  // strip: { on: stick id or null (then flat on table `at`), at, written: letters Alice has written }
  apply(st) {
    this.token++;
    const prev = this.st || {};
    this.st = { msg: '', k: 4, sticks: {}, hide: [], strip: { on: null, at: 'a', written: 0 }, ...st };
    st = this.st; st.strip = { ...st.strip }; st.sticks = { ...Object.fromEntries(Object.entries(STICKS).map(([id, s]) => [id, s[2]])), ...st.sticks };
    for (const [id, s] of Object.entries(this.sticks)) {
      s.userData.setK(st.sticks[id]); s.userData.setPhi(0);
      s.visible = s.userData.cradles.visible = !st.hide.includes(id);
    }
    const L = this.lay;
    if (prev.msg !== st.msg || prev.k !== st.k || this.strip.cells.length !== L.strip.length) this.strip.setCells(L.strip);
    this.strip.mesh.visible = true;
    this.strip.set(st.strip.on ? this.strip.helix(this.sticks[st.strip.on]) : this.strip.flat(this.flatSpot(st.strip.at)));
    this.pen.visible = false; this.hot = -1;
    for (const c of this.couriers) c.visible = false;
    for (const p of Object.values(this.people)) p.userData.arms.rotation.x = 0;
    this.redraw();
  }

  redraw() {
    this.strip.draw(j => this.shown(j), this.hot, j => ROW_COLORS[(j % this.lay.k) % ROW_COLORS.length]);
    this.relabel();
    this.onChange();
  }
  // the tags: over each stick its letters per turn, or the line in front once the strip is on it;
  // over the strip lying flat, its letters in strip order
  relabel() {
    const st = this.st;
    for (const [id, tag] of Object.entries(this.tags)) {
      const s = this.sticks[id];
      let text = t('stick.per', { k: s.userData.k }), color = '#c9a46a';
      if (st.strip.on === id && st.strip.written) { text = show(this.linesOn(id)[this.front(id)]); color = '#ffd66b'; }
      tag.visible = s.visible;
      if (text !== tag.userData.text) setLabel(tag, text, color);
    }
    const flat = !st.strip.on && st.strip.written && this.strip.mesh.visible && !this.strip.morph;
    this.stripTag.visible = !!flat;
    if (flat) {
      this.stripTag.position.copy(this.flatSpot(st.strip.at)).add(v(0, .75, .2));
      const text = show(this.lay.strip.map((c, j) => this.shown(j) ? c : ''));
      if (text !== this.stripTag.userData.text) setLabel(this.stripTag, text, '#ffd66b');
    }
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
  arc(obj, to, { dur = 1, height = 2 } = {}) {
    const from = obj.position.clone();
    return this.tween(dur, k => { const e = ease(k); obj.position.lerpVectors(from, to, e); obj.position.y += Math.sin(Math.PI * e) * height; });
  }
  async arm(k, up = 1, dur = .3) { const a = this.people[k].userData.arms; const r0 = a.rotation.x; await this.tween(dur, x => a.rotation.x = r0 + (-up - r0) * ease(x)); }
  whose(id) { return STICKS[id][0]; }

  // ---------- the actions ----------
  // Wind the strip lying on the stick's table around the stick: the stick spins and pulls it on.
  async wind(id) {
    const s = this.sticks[id], k = this.whose(id), from = this.strip.flat(this.flatSpot(this.st.strip.at)), to = this.strip.helix(s);
    this.arm(k, .8); sfx.wind();
    const ok = await this.tween(2.4, x => { s.userData.setPhi(-TAU * 2 * (1 - ease(x))); this.strip.blend(from, to, x); });
    if (!ok) return false;
    this.strip.set(to); this.st.strip.on = id; this.redraw();
    ring(s.position.clone().setY(TABLE_TOP + .02), COLORS[k], { radius: 3.2 });
    await this.arm(k, 0);
    return true;
  }

  // Unwind it back onto its table: the letters come off in strip order.
  async unwind() {
    const id = this.st.strip.on, s = this.sticks[id], k = this.whose(id), to = this.strip.flat(this.flatSpot(k)), from = this.strip.helix(s);
    this.arm(k, .8); sfx.wind();
    this.tags[id].visible = false;
    const phi0 = s.userData.phi;
    const ok = await this.tween(2.2, x => { s.userData.setPhi(phi0 + TAU * 2 * ease(x)); this.strip.blend(from, to, x); });
    if (!ok) return false;
    s.userData.setPhi(0);
    this.strip.set(to); Object.assign(this.st.strip, { on: null, at: k }); this.redraw();
    await this.arm(k, 0);
    return true;
  }

  // Turn the stick so that line `row` faces the viewer.
  async turn(id, row, dur = .55) {
    const s = this.sticks[id], kk = s.userData.k, p0 = s.userData.phi;
    let d = ((-TAU * row / kk - p0) % TAU + TAU) % TAU; if (d > Math.PI + 1e-6) d -= TAU;   // the short way round
    const p1 = p0 + d;
    if (Math.abs(p1 - p0) < 1e-4) { this.relabel(); return true; }
    sfx.tick();
    const ok = await this.tween(dur, x => s.userData.setPhi(p0 + (p1 - p0) * ease(x)));
    this.relabel(); this.onChange();
    return ok;
  }
  // One more line: the next one comes to the front.
  next(id) { return this.turn(id, (this.front(id) + 1) % this.sticks[id].userData.k); }

  // Alice writes the message along the stick, line after line, turning it between lines.
  async write() {
    const id = this.st.strip.on, s = this.sticks[id], L = this.lay, who = this.whose(id);
    this.arm(who, .9);
    this.pen.visible = true;
    for (let r = 0; r < L.k; r++) {
      if (!await this.turn(id, r)) return false;
      for (let c = 0; c < L.m; c++) {
        const j = c * L.k + r;
        if (this.st.strip.written > r * L.m + c) continue;
        const at = this.strip.letterAt(j), out = at.clone().sub(s.position).setX(0).normalize();
        const tip = at.clone().addScaledVector(out, .02);
        const ok = await this.arc(this.pen, tip, { dur: .22, height: .12 });
        if (!ok) return false;
        this.pen.lookAt(tip.clone().add(v(0, 1, 1.4))); this.pen.rotateX(Math.PI / 2);
        if (L.grid[r][c]) { this.st.strip.written = r * L.m + c + 1; sfx.scratch(); this.redraw(); }
        else this.st.strip.written = r * L.m + c + 1;
        await this.wait(.08);
      }
    }
    this.st.strip.written = L.n; this.redraw();
    this.pen.visible = false;
    await this.arm(who, 0);
    return true;
  }

  // Read the strip on a stick: every line comes to the front in turn.
  async readAll(id, pause = 1.1) {
    for (let r = 0; r < this.sticks[id].userData.k; r++) {
      if (!await this.turn(id, r)) return false;
      if (!await this.wait(pause)) return false;
    }
    return true;
  }

  // Light the letters one after the other in strip order (on the flat strip and the card).
  async showOrder(step = .32) {
    const L = this.lay;
    for (let j = 0; j < L.strip.length; j++) {
      this.hot = j; this.redraw(); if (L.strip[j]) sfx.tick();
      if (!await this.wait(step)) return false;
    }
    this.hot = -1; this.redraw();
    return true;
  }

  // The messenger rolls the strip up, carries it on his head along the road, lays it out flat.
  // He carries the strip only: the sticks stay home.
  async carry(from, to) {
    const tok = this.token, path = this.world.road.path, c = this.couriers[0];
    const tOf = { a: 0, e: .5, b: 1 }, t0 = tOf[from], t1 = tOf[to], dir = Math.sign(t1 - t0);
    const at = x => path.getPointAt(x).setY(0);
    c.visible = true; c.position.copy(at(t0)).add(v(0, 0, .9)); c.userData.dir = v(dir, 0, 0);
    c.rotation.y = Math.atan2(PLACES[from].table.x - c.position.x, PLACES[from].table.z - c.position.z);
    const headPos = () => c.position.clone().add(v(0, ON_HEAD, 0)), roll = this.strip.coil(headPos);
    const flatFrom = this.strip.flat(this.flatSpot(from));
    this.stripTag.visible = false;
    if (!await this.tween(1, x => this.strip.blend(flatFrom, roll, x))) return false;
    this.strip.set(roll); sfx.send();
    const dur = 3.2 * Math.abs(t1 - t0) / .5;
    const ok = await this.tween(dur, k => {
      const x = t0 + (t1 - t0) * k, tan = path.getTangentAt(x);
      c.position.copy(at(x)).add(v(0, 0, .9)); c.position.y = Math.abs(Math.sin(k * dur * 9)) * .18;
      c.rotation.y = Math.atan2(tan.x * dir, tan.z * dir);
    });
    if (!ok) return false;
    c.position.y = 0;
    c.rotation.y = Math.atan2(PLACES[to].table.x - c.position.x, PLACES[to].table.z - c.position.z);
    const flatTo = this.strip.flat(this.flatSpot(to));
    if (!await this.tween(1, x => this.strip.blend(roll, flatTo, x))) return false;
    this.strip.set(flatTo); this.st.strip.at = to; this.redraw();
    if (to === 'e') { sfx.capture(); icon(this.flatSpot('e').add(v(0, 1.4, 0)), '✋', '#ff4d5e', { size: .6, rise: .8 }); }
    else { sfx.arrive(); ring(this.flatSpot(to).setY(0), COLORS[to], { radius: 3 }); }
    await this.wait(.4);
    if (this.live(tok)) c.visible = false;
    return this.live(tok);
  }
}

// A floating tag (« 4 lettres par tour », « ATTAQ »): a sprite with its text drawn on a canvas.
function label() {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
  s.renderOrder = 20; s.visible = false; s.userData.text = '';
  return s;
}
function setLabel(s, text, color) {
  const c = document.createElement('canvas'), x = c.getContext('2d'), font = '700 40px Georgia, "Times New Roman", serif';
  x.font = font; const w = Math.ceil(x.measureText(text).width) + 48;
  c.width = w; c.height = 72;
  x.font = font; x.fillStyle = 'rgba(16,18,28,.86)'; x.strokeStyle = color; x.lineWidth = 5;
  x.beginPath(); x.roundRect(3, 3, w - 6, 66, 33); x.fill(); x.stroke();
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, 38);
  s.material.map?.dispose(); s.material.map = new THREE.CanvasTexture(c); s.material.map.colorSpace = THREE.SRGBColorSpace; s.material.needsUpdate = true;
  s.scale.set(w / 72 * .34, .34, 1); s.userData.text = text;
}
