// The actors and the props, and everything they do: Alice and Bob sign up, their password (with
// its salt glued on, or not) goes through the hash machine and the fingerprint lands in the
// site's base; Eve steals a copy and looks the fingerprints up in her book; then she tries
// passwords one by one on her rig, as fast as MD5 lets her, or as slowly as bcrypt makes her.
// apply(state) puts everything where a story step says, instantly; the async actions animate
// from there and write back into st.
import * as THREE from 'three';
import { X, AT, CARD_Y } from './world.js';
import { card, drawTable, drawBook, drawCounter, DESK_Y } from './props.js';
import { md5 } from './hash.js';
import { USERS, LIST, BCRYPT, BCRYPT_TRY, short, bshort, bsalt, RATE, SPACE8, WATCH, seconds } from './data.js';
import { burst, ring, icon } from '../../lib/fx.js';
import { sfx } from '../../lib/sound.js';
import { t, raw, num, dec } from './i18n.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const dots = s => '•'.repeat(Math.min(12, s.length));

// a row of the base, as drawn: the user, the salt, the fingerprint
// for bcrypt, bstr is the whole $2b$ string (the story's are in data.js); the salt is inside it
export function baseRow(u, pw, salt, fn, bstr = BCRYPT[u]) {
  if (fn === 'bcrypt') return { u, salt: bsalt(bstr).slice(0, 6) + '…', hash: bshort(bstr) };
  return { u, salt: salt || '', hash: short(md5(pw + (salt || ''))) };
}

export class Stage {
  constructor(world, tickers) {
    this.world = world; this.scene = world.scene; this.tickers = tickers; this.speed = 1; this.token = 0;
    this.people = world.people;
    this.cards = new Map();                       // card id -> mesh
    this.onChange = () => {};                     // set by main: the corner card follows the stage
    this.spin = 0;                                // how fast Eve's fans turn
    this.idle = (dt, time) => {
      for (const [k, p] of Object.entries(this.people)) p.position.y = Math.abs(Math.sin(time * 1.3 + k.charCodeAt(0))) * .25;
      for (const [id, m] of this.cards) if (!m.userData.moving) m.position.y = m.userData.y0 + Math.sin(time * 1.6 + id.length) * .3;
      for (const f of this.world.rig.userData.fans) f.rotation.z -= dt * (1 + this.spin * 30);
      const g = this.world.machine.userData.gear; if (g.visible) g.rotation.z -= dt * (.3 + (this.grinding ? 9 : 0));
    };
    tickers.add(this.idle);
  }

  // ---------- where things are ----------
  head(k) { return this.people[k].position.clone().add(v(0, 19.5, 0)); }

  // ---------- the state of a story step ----------
  // cards: [{ id, kind, text, salt?, at: [x, y, z], mark? }] (kind: pw | salt | join | hash | try)
  // base: { fn: md5 | bcrypt, rows: [{ u, salt, hash, mark? }] } · copy: null | { rows: [... found?] }
  // book: { hi, miss } · machine: md5 | bcrypt · counter: null | md5 | bcrypt · watch: null | seconds
  // screens: { a, b } the terminals' [title, dots, line] · table: { kind, rows } the corner card
  apply(st) {
    this.token++;
    this.st = { cards: [], base: { fn: 'md5', rows: [] }, copy: null, book: { hi: -1, miss: false }, machine: 'md5', counter: null,
      watch: null, screens: {}, table: { kind: 'sel', rows: [] }, ...st };
    st = this.st;
    st.cards = st.cards.map(c => ({ ...c, at: [...c.at] }));
    st.base = { fn: st.base.fn, rows: st.base.rows.map(r => ({ ...r })) };
    st.copy = st.copy && { rows: st.copy.rows.map(r => ({ ...r })) };
    st.book = { ...st.book }; st.screens = { ...st.screens };
    st.table = { kind: st.table.kind, rows: st.table.rows.map(r => [...r]) };
    for (const id of [...this.cards.keys()]) if (!st.cards.some(c => c.id === id)) this.drop(id);
    for (const c of st.cards) this.place(c);
    this.world.machine.userData.setKind(st.machine); this.world.machine.userData.setHot(0); this.grinding = false;
    this.world.salt.rotation.set(0, 0, 0); this.world.salt.position.y = 0;
    this.spin = st.counter ? 1 : 0; this.world.rig.userData.glow.intensity = st.counter ? 40 : 0;
    for (const p of Object.values(this.people)) p.userData.arms.rotation.x = 0;
    this.setWatch(st.watch);
    this.relabel();
  }

  // ---------- drawing what the state says ----------
  relabel() {
    const st = this.st, L = raw('scene');
    drawTable(this.world.base.userData.board, L.base[st.base.fn], L.cols, st.base.rows);
    const sheet = this.world.desk.userData.sheet;
    if (st.copy) drawTable(sheet, L.copy, L.cols, st.copy.rows, { bg: '#1a0d12', edge: '#7a2a3a', ink: '#ff8f9a', xs: [.03, .22, .4] });
    else sheet.userData.paint((x, W, H) => { x.fillStyle = '#1a0d12'; x.fillRect(0, 0, W, H); x.fillStyle = '#5a3440'; x.font = `600 ${H * .09}px system-ui`; x.textAlign = 'center'; x.fillText(L.empty, W / 2, H / 2); });
    drawBook(this.world.desk.userData.page, L.book, LIST, st.book.hi, st.book.miss);
    drawCounter(this.world.rig.userData.screen, st.counter && this.counterLines(st.counter, st.counterRate));
    for (const k of ['a', 'b']) this.world.terms[k].userData.show(...(st.screens[k] || [L.site, '', '']));
    for (const c of st.cards) this.cards.get(c.id)?.userData.paint(c);
    this.onChange();
  }
  counterLines(fn, rate = RATE[fn]) {
    const L = raw('scene').counter;
    return { head: L.head[fn], rate: num(rate), unit: L.unit, all: t('scene.counter.all', { d: dur(seconds(SPACE8, fn)) }), slow: fn === 'bcrypt' };
  }
  setWatch(s) {
    const w = this.world.watch; this.st.watch = s;
    w.visible = s != null; if (s == null) return;
    w.userData.show(s / WATCH, t('sec', { s: dec(s) }));
  }

  // a card of the state, made or moved to where it says
  place(c) {
    let m = this.cards.get(c.id);
    if (!m) { m = card(); this.scene.add(m); this.cards.set(c.id, m); }
    m.position.set(...c.at); m.userData.y0 = c.at[1]; m.scale.setScalar(1); m.visible = true; m.userData.moving = false;
    m.userData.paint(c);
    return m;
  }
  drop(id) { const m = this.cards.get(id); if (!m) return; this.scene.remove(m); this.cards.delete(id); this.st.cards = this.st.cards.filter(c => c.id !== id); }
  card(id) { return this.st.cards.find(c => c.id === id); }
  addCard(c) { c = { ...c, at: [...c.at] }; this.st.cards.push(c); const m = this.place(c); return m; }

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

  // a card flies to a point along an arc
  async fly(id, to, dur = .9, lift = 6) {
    const c = this.card(id), m = this.cards.get(id), from = m.position.clone(); to = to.clone ? to.clone() : v(...to);
    m.userData.moving = true;
    const ok = await this.tween(dur, x => { const k = ease(x); m.position.lerpVectors(from, to, k); m.position.y += Math.sin(Math.PI * k) * lift; });
    if (ok) { m.position.copy(to); c.at = to.toArray(); m.userData.y0 = to.y; m.userData.moving = false; }
    return ok;
  }
  // a card shrinks into a point and goes (into the base, into the rig)
  async swallow(id, to, dur = .7) {
    const m = this.cards.get(id); if (!await this.fly(id, to, dur, 4)) return false;
    if (!await this.tween(.25, x => m.scale.setScalar(1 - .95 * x))) return false;
    this.drop(id); return true;
  }
  row(...cells) { this.st.table.rows.push(cells); this.onChange(); }
  type(k, title, pw, line = '') { this.st.screens[k] = [title, dots(pw), line]; this.relabel(); }

  // ---------- the actions ----------
  // The machine works on a card: in, it glows (for bcrypt, the gear grinds and the stopwatch
  // runs to its time), the card comes out as a fingerprint.
  async hash(id, out, fn, watch = null) {
    const m = this.world.machine.userData;
    if (!await this.fly(id, AT.machine, .8, 5)) return false;
    sfx.press();
    if (fn === 'bcrypt') {
      this.grinding = true; this.setWatch(0); sfx.wind();
      const ok = await this.tween(2.4, x => { m.setHot(.5 + .5 * Math.sin(x * 30) ** 2); this.setWatch(watch * x); });
      this.grinding = false; if (!ok) return false; this.setWatch(watch);
    } else if (!await this.tween(.4, x => m.setHot(Math.sin(Math.PI * x)))) return false;
    const c = this.card(id); Object.assign(c, { kind: 'hash', text: out, salt: '' }); this.cards.get(id).userData.paint(c);
    burst(AT.machine.clone().add(v(0, 3, 3)), 0xc070ff, { count: 30, speed: 4, up: 3, size: .35, life: .7, gravity: 6 });
    if (!await this.tween(.3, x => m.setHot(.6 * (1 - x)))) return false;
    m.setHot(0);
    return this.fly(id, AT.out, .7, 3);
  }

  // Someone signs up (or logs in, for bcrypt): the password on a card over the terminal; with a
  // salt, the shaker draws one and it is glued to the end; the machine; the row in the base.
  // fn: md5 | bcrypt. salt: the user's salt for MD5, or null. Returns false if cut short.
  // For bcrypt, bstr is the string already computed (the sandbox computes it in a worker) and
  // watch the time it took.
  async signup(user, pw, salt, fn = 'md5', { watch = WATCH, bstr = BCRYPT[user] } = {}) {
    const L = raw('scene'), k = USERS.find(x => x.u === user)?.who || 'a', id = 'C' + user;
    this.st.base.fn = fn;
    this.arm(k, .9);
    const title = fn === 'bcrypt' ? L.site : L.signup;      // with bcrypt, Alice logs in
    for (let i = 1; i <= pw.length; i++) { this.type(k, title, pw.slice(0, i)); sfx.tick(); if (!await this.wait(.05)) return false; }
    this.addCard({ id, kind: 'pw', text: pw, at: AT[k].toArray() }); sfx.thud();
    if (!await this.wait(.5)) return false;
    this.arm(k, 0);
    if (salt) {
      // the shaker tips and shakes, a salt card pops out of it
      const s = this.world.salt;
      sfx.pour();
      if (!await this.tween(.8, x => { s.rotation.z = Math.sin(x * Math.PI) * .5; s.position.y = Math.abs(Math.sin(x * Math.PI * 6)) * .8; })) return false;
      this.addCard({ id: 'S' + user, kind: 'salt', text: salt, at: AT.salt.toArray() });
      burst(AT.salt.clone(), 0xffffff, { count: 40, speed: 3, up: 4, size: .3, life: .9, gravity: 8 });
      const fs = this.fly('S' + user, AT.join.clone().add(v(10, 4, 0)), .8, 3);
      if (!await this.fly(id, AT.join, 1, 5) || !await fs) return false;
      if (!await this.wait(.4)) return false;
      // the two cards meet: password + salt, one card
      const sm = this.cards.get('S' + user), pm = this.cards.get(id), y0 = sm.position.y;
      if (!await this.tween(.5, x => { sm.position.y = y0 + (pm.position.y - y0) * ease(x); sm.position.x = pm.position.x + 3 + 4 * ease(x); })) return false;
      this.drop('S' + user);
      const c = this.card(id); Object.assign(c, { kind: 'join', salt }); pm.userData.paint(c); sfx.mix();
      ring(pm.position.clone().setY(DESK_Y), 0x7fb6ff, { radius: 6, life: .8 });
      if (!await this.wait(.6)) return false;
    }
    const out = fn === 'bcrypt' ? bshort(bstr) : short(md5(pw + (salt || '')));
    if (!await this.hash(id, out, fn, watch)) return false;
    if (!await this.wait(.3)) return false;
    // the fingerprint goes into the base; its row appears
    if (!await this.swallow(id, v(X.base, 30, -6), .8)) return false;
    const r = baseRow(user, pw, salt, fn, bstr), old = this.st.base.rows.findIndex(x => x.u === user);
    if (old >= 0) this.st.base.rows[old] = r; else this.st.base.rows.push(r);
    sfx.lock(); this.type(k, title, pw, L.saved);
    this.row(...(fn === 'bcrypt' ? ROWS.bcrypt(user, bstr, watch) : ROWS.sel(user, pw, salt)));
    return true;
  }

  // the two rows with the same fingerprint, marked
  async same() {
    const rows = this.st.base.rows, h = rows.map(r => r.hash);
    for (const r of rows) if (h.filter(x => x === r.hash).length > 1) r.mark = 'same';
    this.relabel(); sfx.capture();
    ring(v(X.base, 18, -6), 0xff4d5e, { radius: 10, life: 1.2 });
    return this.wait(.8);
  }

  // Eve copies the base: a sheet flies from the cabinet to her easel.
  async steal() {
    this.arm('e', 1);
    this.addCard({ id: 'leak', kind: 'hash', text: raw('scene').leak, at: [X.base, 30, -5] }); sfx.send();
    const easel = this.world.desk.localToWorld(v(7.5, 14, 0));
    if (!await this.fly('leak', easel, 1.4, 14)) return false;
    this.drop('leak');
    this.st.copy = { rows: this.st.base.rows.map(r => ({ u: r.u, salt: r.salt, hash: r.hash })) };
    burst(easel, 0xff3347, { count: 40, speed: 4, up: 2, size: .35, life: .8, gravity: 4 }); sfx.capture();
    this.relabel(); this.arm('e', 0);
    return this.wait(.4);
  }

  // Eve looks each fingerprint of her copy up in her book.
  async lookup() {
    const rows = this.st.copy.rows;
    this.st.table = { kind: 'book', rows: [] };
    for (const r of rows) {
      const i = LIST.findIndex(([, h]) => short(h) === r.hash && !r.salt);
      sfx.scratch();
      for (let k = 0; k < LIST.length; k++) { this.st.book.hi = k; this.relabel(); sfx.tick(); if (!await this.wait(.09)) return false; if (k === i) break; }
      r.found = i >= 0 ? LIST[i][0] : ''; r.mark = i >= 0 ? 'ok' : 'bad';
      this.st.book.hi = i; this.st.book.miss = i < 0;
      this.row(...ROWS.look(r));
      this.relabel(); i >= 0 ? sfx.win() : sfx.reject();
      const spot = this.world.desk.localToWorld(v(7.5, 22, 0));
      icon(spot, i >= 0 ? '✔' : '✖', i >= 0 ? '#5fe39a' : '#ff4d5e', { life: 1.6, size: 4, rise: 4 });
      if (!await this.wait(.8)) return false;
    }
    return true;
  }

  // Eve tries guesses one by one for one user: guess + salt through her own machine (the rig),
  // compared with the fingerprint of her copy. fn decides how fast the counter goes.
  async tries(user, guesses, fn = 'md5') {
    const r = this.st.copy.rows.find(x => x.u === user), salt = fn === 'md5' ? r.salt : '';
    this.st.counter = fn; this.spin = 1; this.world.rig.userData.glow.intensity = 40;
    this.st.table = { kind: 'speed', rows: [] };
    this.arm('e', .9);
    // the counter climbs to its rate
    const rate = RATE[fn];
    sfx.wind();
    if (!await this.tween(1.6, x => { this.st.counterRate = rate * ease(x); drawCounter(this.world.rig.userData.screen, this.counterLines(fn, this.st.counterRate)); })) return false;
    this.st.counterRate = rate; this.relabel();
    for (const g of guesses) {
      const id = 'T' + g, out = fn === 'bcrypt' ? bshort(BCRYPT_TRY[g]) : short(md5(g + salt));
      this.addCard({ id, kind: 'try', text: g, salt, at: this.world.desk.localToWorld(v(-6, 16, 2)).toArray() }); sfx.thud();
      if (!await this.fly(id, AT.rigIn, .7, 4)) return false;
      if (!await this.tween(fn === 'bcrypt' ? 1.2 : .3, x => this.world.rig.userData.glow.intensity = 40 + 60 * Math.sin(Math.PI * x))) return false;
      const hit = out === r.hash, c = this.card(id);
      Object.assign(c, { kind: 'hash', text: out, salt: '', mark: hit ? 'ok' : 'bad' }); this.cards.get(id).userData.paint(c);
      if (!await this.fly(id, AT.rigOut, .5, 2)) return false;
      icon(AT.rigOut.clone().add(v(0, 4, 0)), hit ? '✔' : '✖', hit ? '#5fe39a' : '#ff4d5e', { life: 1.2, size: 3.5, rise: 3 });
      hit ? sfx.win() : sfx.reject();
      this.row(...ROWS.try(g, salt, out, hit));
      if (!await this.wait(.6)) return false;
      this.drop(id);
      if (hit) { r.found = g; r.mark = 'ok'; this.relabel(); break; }
    }
    this.row(...ROWS.speed(fn));
    this.arm('e', 0);
    return true;
  }

  // the counter alone: the site has switched, Eve's rig slows down (or speeds up)
  async counter(fn) {
    const from = this.st.counterRate || RATE[this.st.counter || 'md5'], to = RATE[fn];
    this.st.counter = fn; this.spin = 1; this.world.rig.userData.glow.intensity = 40;
    sfx.wind();
    const ok = await this.tween(2.2, x => { this.st.counterRate = Math.exp(Math.log(from) + (Math.log(to) - Math.log(from)) * ease(x)); drawCounter(this.world.rig.userData.screen, this.counterLines(fn, this.st.counterRate)); });
    if (ok) { this.st.counterRate = to; this.relabel(); }
    return ok;
  }
}

// a duration, in words: « 6 h », « 3 460 ans »
export function dur(s) {
  if (s < 1) return t('sec', { s: s < .01 ? '< ' + dec(.01) : dec(s) });
  if (s < 120) return t('sec', { s: Math.round(s) });
  if (s < 7200) return t('min', { n: Math.round(s / 60) });
  if (s < 3 * 86400) return t('hours', { n: Math.round(s / 3600) });
  if (s < 2 * 365 * 86400) return t('days', { n: Math.round(s / 86400) });
  return t('years', { n: num(s / (365.25 * 86400)) });
}

// the corner card's rows, the same whether an action writes them or a story step starts with them
export const ROWS = {
  // « Mots de passe - Le sel »: alice password -> 5f4dcc3b, alice password+x7k2m -> cffbee8f
  sel: (u, pw, salt) => [u, salt ? `${pw}+${salt}` : pw, '→', short(md5(pw + (salt || '')))],
  head: key => ['@head.' + key],
  look: r => [r.u, r.hash, r.found ? '=' : '≠', r.found || '@card.notIn'],
  try: (g, salt, out, hit) => [salt ? `${g}+${salt}` : g, '→', out, hit ? '=' : '≠'],
  bcrypt: (u, s, w) => [u, bshort(s), '@card.took', w.toFixed(2) + ' s'],      // the card writes 0,24 in French
  speed: fn => [fn === 'md5' ? 'MD5' : 'bcrypt (12)', '@speed.' + fn],
};
