// The actors and the props, and everything they do: a badge (a message and its HMAC) goes from
// Alice or Eve to the guard's counter; the guard computes mac from the message with Bob's key and
// compares it with recu, the badge's HMAC, letter by letter on the board; with ==, he stops at the
// first wrong letter, with compare_digest he looks at all 64; the lamp, the gate, Bob's ledger.
// Eve's stopwatch times each answer and her chart keeps one bar per letter she tries.
// apply(state) puts everything where a story step says, instantly; the async actions animate
// from there and write back into st.
import * as THREE from 'three';
import { X, AT } from './world.js';
import { badge, drawBoard, drawLedger, drawChart } from './props.js';
import { hmacHex } from '../../lib/hmac.js';
import { KEY, MSG_E, HEX, N, guess, looks } from './data.js';
import { burst, icon } from '../../lib/fx.js';
import { sfx } from '../../lib/sound.js';
import { t, raw, dec, ord } from './i18n.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// The guard's answer time, in the story's slow motion: 0.4 s to compute mac and answer, then
// 0.2 s per letter looked at. A real comparison takes nanoseconds a letter (the story says so).
export const BASE_T = .4, LETTER_T = .2;
export const answerTime = n => BASE_T + LETTER_T * n;
// the slowest bar, if it is the only one: the letter Eve keeps
export const slowest = bars => {
  const ts = bars.map(b => b?.t ?? -1), max = Math.max(...ts);
  return ts.filter(x => x === max).length === 1 ? ts.indexOf(max) : -1;
};

export class Stage {
  constructor(world, tickers) {
    this.world = world; this.scene = world.scene; this.tickers = tickers; this.speed = 1; this.token = 0;
    this.people = world.people;
    this.badgeMesh = null;
    this.onChange = () => {};                     // set by main: the corner card follows the stage
    this.idle = (dt, time) => {
      for (const [k, p] of Object.entries(this.people)) if (!p.userData.hop) p.position.y = Math.abs(Math.sin(time * 1.3 + k.charCodeAt(0))) * .25;
      const m = this.badgeMesh; if (m && !m.userData.moving) m.position.y = m.userData.y0 + Math.sin(time * 1.6) * .3;
    };
    tickers.add(this.idle);
  }

  // ---------- where things are ----------
  head(k) { return this.people[k].position.clone().add(v(0, 19.5, 0)); }

  // ---------- the state of a story step ----------
  // guard: eq (mac == recu) | cd (hmac.compare_digest) · mac, recu, n, cursor: the board
  // badge: null | { who, msg, recu, at, mark } · lamp: null | ok | bad · gate: 0..1
  // ledger: [{ who, msg }] Bob's orders · prefix, tries: Eve's notebook · bars: her chart
  // watch: null | seconds · table: { kind } the corner card (code | eve | recap)
  apply(st) {
    this.token++;
    this.st = { guard: 'eq', mac: '', recu: null, n: 0, cursor: -1, badge: null, lamp: null, gate: 0, ledger: [],
      prefix: '', tries: 0, bars: [], watch: null, table: { kind: 'code' }, msg: MSG_E, ...st };
    st = this.st;
    st.badge = st.badge && { ...st.badge, at: [...st.badge.at] };
    st.ledger = st.ledger.map(r => ({ ...r })); st.bars = st.bars.map(b => b && { ...b }); st.table = { ...st.table };
    this.dropBadge();
    if (st.badge) this.placeBadge(st.badge);
    for (const p of Object.values(this.people)) { p.userData.arms.rotation.x = 0; p.userData.hop = false; }
    this.people.g.rotation.y = 0;
    this.relabel();
  }

  // ---------- drawing what the state says ----------
  relabel() {
    const st = this.st, L = raw('scene'), w = this.world;
    drawBoard(w.board, { title: L.board, looked: L.looked }, { mac: st.mac || '?'.repeat(N), recu: st.recu, n: st.n, cursor: st.cursor });
    w.booth.userData.setSign(st.guard === 'cd' ? 'if hmac.compare_digest(mac, recu):' : 'if mac == recu:');
    w.booth.userData.setLamp(st.lamp);
    w.gate.userData.setOpen(st.gate);
    drawLedger(w.desk, L.ledger, st.ledger.slice(-3));
    this.drawChart();
    this.setWatch(st.watch);
    if (st.badge) this.badgeMesh?.userData.paint(st.badge, L);
    this.onChange();
  }
  drawChart() {
    const st = this.st, L = raw('scene');
    drawChart(this.world.chart, { title: t('scene.chart', { i: Math.min(N, st.prefix.length + 1), o: ord(Math.min(N, st.prefix.length + 1)) }),
      sub: L.known + ' ' + (st.prefix || '—') + (st.prefix.length < N ? '_' : ''), bars: st.bars,
      max: st.guard === 'cd' ? answerTime(N) * 1.1 : Math.max(answerTime(3), ...st.bars.map(b => b?.t || 0)) * 1.1, fmt: x => dec(x, 1) });
  }
  setWatch(s) {
    const w = this.world.watch; this.st.watch = s;
    w.visible = s != null; if (s == null) return;
    w.userData.show(Math.min(1, s / 3), t('sec', { s: dec(s, 1) }));
  }

  placeBadge(b) {
    if (!this.badgeMesh) { this.badgeMesh = badge(); this.scene.add(this.badgeMesh); }
    const m = this.badgeMesh;
    m.position.set(...b.at); m.userData.y0 = b.at[1]; m.scale.setScalar(1); m.visible = true; m.userData.moving = false;
    m.userData.paint(b, raw('scene'));
  }
  dropBadge() { if (this.badgeMesh) this.badgeMesh.visible = false; if (this.st) this.st.badge = null; }

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
  async arm(k, up = 1, dur = .3) { const a = this.people[k].userData.arms; const r0 = a.rotation.x; await this.tween(dur, x => a.rotation.x = r0 + (-up - r0) * ease(x)); }
  turn(k, to, dur = .3) { const p = this.people[k], r0 = p.rotation.y; return this.tween(dur, x => p.rotation.y = r0 + (to - r0) * ease(x)); }

  // the badge flies to a point along an arc
  async fly(to, dur = .9, lift = 6) {
    const m = this.badgeMesh, b = this.st.badge, from = m.position.clone(); to = to.clone();
    m.userData.moving = true;
    const ok = await this.tween(dur, x => { const k = ease(x); m.position.lerpVectors(from, to, k); m.position.y += Math.sin(Math.PI * k) * lift; });
    if (ok) { m.position.copy(to); b.at = to.toArray(); m.userData.y0 = to.y; m.userData.moving = false; }
    return ok;
  }

  // ---------- the actions ----------
  // A badge is handed to the guard: he computes mac from the message with Bob's key, then
  // compares it with recu on the board. Eve's stopwatch runs while he does.
  // quick: no flight, the letters go fast (for the 13 badges after the first ones).
  // Returns { ok, n, t }, or null if cut short.
  async present(who, msg, recu, { quick = false, timed = who === 'e' } = {}) {
    const st = this.st, g = this.people.g;
    st.badge = { who, msg, recu, at: AT[who].toArray() }; this.placeBadge(st.badge);
    st.mac = ''; st.recu = null; st.n = 0; st.cursor = -1; st.lamp = null;
    if (timed) st.watch = 0;
    this.relabel();
    if (!quick) {
      this.arm(who, .9); sfx.send();
      if (!await this.fly(AT.slot, .8, 5)) return null;
      this.arm(who, 0);
    } else { this.badgeMesh.position.copy(AT.slot); st.badge.at = AT.slot.toArray(); this.badgeMesh.userData.y0 = AT.slot.y; }
    // he computes mac with the key, the badge's HMAC goes up on the board
    st.mac = hmacHex(KEY, msg); st.recu = recu; sfx.press();
    if (!quick && !await this.turn('g', Math.PI, .35)) return null;
    if (quick) g.rotation.y = Math.PI;
    const n = looks(st.mac, recu, st.guard);
    if (timed) this.setWatch(BASE_T);
    if (quick) {
      // the many badges after the first few: the guard reads them in one go, no per-letter crawl
      st.n = n; st.cursor = -1; if (timed) st.watch = answerTime(n);
      this.relabel(); sfx.tick();
      if (!await this.wait(.04)) return null;
    } else {
      const per = .22 / (n > 8 ? 4 : 1);
      for (let i = 0; i < n; i++) {
        st.cursor = i; st.n = i + 1; if (timed) st.watch = answerTime(i + 1);
        this.relabel(); sfx.tick();
        if (!await this.wait(per)) return null;
      }
      st.cursor = -1;
    }
    const ok = st.mac === recu;
    st.lamp = ok ? 'ok' : 'bad'; st.badge.mark = ok ? 'ok' : 'bad';
    this.relabel();
    if (quick) g.rotation.y = 0; else if (!await this.turn('g', 0, .25)) return null;
    ok ? sfx.unlock() : sfx.reject();
    return { ok, n, t: answerTime(n) };
  }

  // The answer: through the gate to Bob's ledger, or back to the sender.
  async answer(r, { quick = false } = {}) {
    const st = this.st, who = st.badge.who;
    if (r.ok) {
      icon(AT.slot.clone().add(v(0, 5, 0)), '✔', '#5fe39a', { life: 1.4, size: 4, rise: 4 });
      if (!await this.tween(.6, x => { st.gate = ease(x); this.world.gate.userData.setOpen(st.gate); })) return false;
      if (!await this.fly(AT.desk, 1.2, 8)) return false;
      st.ledger.push({ who, msg: st.badge.msg }); sfx.win();
      burst(AT.desk.clone().add(v(0, 3, 0)), who === 'e' ? 0xff3347 : 0x5fe39a, { count: 40, speed: 4, up: 3, size: .35, life: .9, gravity: 6 });
      this.dropBadge(); this.relabel();
      return this.wait(.5);
    }
    if (quick) { this.dropBadge(); return true; }
    icon(AT.slot.clone().add(v(0, 5, 0)), '✖', '#ff4d5e', { life: 1.2, size: 4, rise: 3 });
    if (!await this.fly(AT[who], .6, 4)) return false;
    this.dropBadge(); this.relabel();
    return this.wait(.2);
  }

  // Eve tries the 16 letters at her next position, prefix + letter + zeros, and times each answer.
  // The first `full` badges travel, the others go quick. Keeps the slowest letter if it is alone.
  // At the last position every wrong badge is read to the end: the gate that opens names the letter.
  async round({ full = 3 } = {}) {
    const st = this.st, prefix = st.prefix;
    st.bars = []; this.relabel();
    for (let i = 0; i < 16; i++) {
      const recu = guess(prefix, HEX[i]), quick = i >= full;
      const r = await this.present('e', st.msg, recu, { quick });
      if (!r) return false;
      st.tries++; st.bars[i] = { c: HEX[i], t: r.t, ok: r.ok }; this.drawChart(); this.onChange();
      if (r.ok) { st.bars[i].hi = true; st.prefix = recu; this.relabel(); return this.answer(r); }
      if (!await this.answer(r, { quick })) return false;
      if (!await this.wait(quick ? .08 : .3)) return false;
    }
    st.watch = null;
    const k = slowest(st.bars);
    if (k >= 0) { st.bars[k].hi = true; st.prefix += HEX[k]; this.arm('e', 1); sfx.lamp(); }
    else sfx.lose();
    this.relabel();
    if (!await this.wait(.6)) return false;
    this.arm('e', 0);
    return true;
  }

  // The rest, fast: every position up to the last, 16 timings each (no badge travels), then the
  // last position until the gate opens. Only for the == guard.
  async finish() {
    const st = this.st;
    while (st.prefix.length < N - 1) {
      const prefix = st.prefix, mac = hmacHex(KEY, st.msg);
      st.bars = [...HEX].map(c => ({ c, t: answerTime(looks(mac, guess(prefix, c), st.guard)) }));
      st.tries += 16;
      const k = slowest(st.bars); if (k < 0) return true;           // nothing to learn: compare_digest
      st.bars[k].hi = true; st.prefix += HEX[k];
      st.mac = mac; st.recu = guess(st.prefix); st.n = st.prefix.length; st.lamp = null;
      this.relabel(); sfx.tick();
      if (!await this.wait(.07)) return false;
    }
    return this.round({ full: 0 });
  }

  // Real timings are noisy: one measure per letter scatters the bars; Eve repeats each one and
  // averages, and the slow letter stands out again. Pseudo-random, the same every time.
  async noise() {
    const st = this.st, mac = hmacHex(KEY, st.msg), prefix = st.prefix;
    const truth = [...HEX].map(c => answerTime(looks(mac, guess(prefix, c), st.guard)));
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - .5; };
    st.watch = null;
    for (const [reps, n] of [[1, 6], [10, 3], [100, 3], [1000, 3]]) {
      for (let k = 0; k < n; k++) {
        st.bars = truth.map((x, i) => ({ c: HEX[i], t: Math.max(.05, x + 2.4 * rnd() / Math.sqrt(reps)) }));
        st.reps = reps; this.relabel(); sfx.tick();
        if (!await this.wait(.25)) return false;
      }
    }
    // highlight only a letter the TRUTH singles out: with ==, the real slow letter; with
    // compare_digest, every truth is equal, so nothing stands out and no bar is marked.
    const k = slowest(truth.map(t => ({ t })));
    if (k >= 0) { st.bars[k].hi = true; sfx.lamp(); } else sfx.lose();
    this.relabel();
    return this.wait(.4);
  }
}
