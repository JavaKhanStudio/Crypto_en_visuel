// The guided story: 13 steps in 6 chapters, on the course's slides about storing passwords
// (« Mots de passe - Dictionnaire », « - Le sel », « - SHA-256 est trop rapide », « - bcrypt -
// La lenteur », « Ce que l'attaquant manipule - La base volée »).
// Each step puts the room where the story has reached (so Back, Next and the chapter chips always
// land somewhere consistent), flies the camera, pins its bubbles, and offers buttons.
// auto: the step's action plays by itself once the camera has landed (its button replays it).
import { t, raw, lang, onLang } from './i18n.js';
import { USERS, BCRYPT, PASSWORD } from './data.js';
import { baseRow, ROWS } from './stage.js';
import { render } from '../../lib/md.js';
import { renderDoors } from '../../lib/doors.js';

const [A, B] = USERS, pw = PASSWORD;
const tbl = (kind, rows) => ({ kind, rows });
const md5Row = (u, salt = null, mark) => ({ ...baseRow(u.u, pw, salt, 'md5'), ...(mark ? { mark } : {}) });
const bRow = u => baseRow(u.u, pw, null, 'bcrypt');
const copy = (rows, found) => ({ rows: rows.map((r, i) => ({ ...r, ...(found ? { found: found[i], mark: found[i] ? 'ok' : 'bad' } : {}) })) });

// the corner card, « Mots de passe - Le sel », filled in as the story goes
const NOSALT = [ROWS.head('nosalt'), ROWS.sel(A.u, pw), ROWS.sel(B.u, pw)];
const SALTED = [...NOSALT, ROWS.head('salt'), ROWS.sel(A.u, pw, A.salt), ROWS.sel(B.u, pw, B.salt)];

const EMPTY = { table: tbl('sel', [ROWS.head('nosalt')]) };
const ONE = { base: { fn: 'md5', rows: [md5Row(A)] }, table: tbl('sel', NOSALT.slice(0, 2)) };
const TWO = { base: { fn: 'md5', rows: [md5Row(A, null, 'same'), md5Row(B, null, 'same')] }, table: tbl('sel', NOSALT) };
const STOLEN = { ...TWO, copy: copy([md5Row(A), md5Row(B)]) };
const FOUND = { ...STOLEN, copy: copy([md5Row(A), md5Row(B)], [pw, pw]), book: { hi: 0 },
  table: tbl('book', [md5Row(A), md5Row(B)].map(r => ROWS.look({ ...r, found: pw }))) };
const SALT0 = { base: { fn: 'md5', rows: [] }, table: tbl('sel', [...NOSALT, ROWS.head('salt')]) };
const SALT1 = { base: { fn: 'md5', rows: [md5Row(A, A.salt)] }, table: tbl('sel', SALTED.slice(0, 5)) };
const SALT2 = { base: { fn: 'md5', rows: [md5Row(A, A.salt), md5Row(B, B.salt)] }, table: tbl('sel', SALTED) };
const SALT_MISS = { ...SALT2, copy: copy([md5Row(A, A.salt), md5Row(B, B.salt)], ['', '']), book: { hi: -1, miss: true },
  table: tbl('book', [md5Row(A, A.salt), md5Row(B, B.salt)].map(r => ROWS.look({ ...r, found: '' }))) };
const BC0 = { machine: 'bcrypt', base: { fn: 'bcrypt', rows: [] }, counter: 'md5', table: tbl('slow', [ROWS.speed('md5')]) };
const BC2 = { ...BC0, base: { fn: 'bcrypt', rows: [bRow(A), bRow(B)] }, watch: .24,
  table: tbl('slow', [ROWS.speed('md5'), ROWS.bcrypt(A.u, BCRYPT.alice, .24)]) };
const BC_STOLEN = { ...BC2, watch: null, copy: copy([bRow(A), bRow(B)]) };
const BC_END = { ...BC_STOLEN, counter: 'bcrypt', copy: copy([bRow(A), bRow(B)], [pw, '']),
  table: tbl('speed', [ROWS.speed('md5'), ROWS.speed('bcrypt')]) };
// the slide « Ce que l'attaquant manipule - La base volée »
const RECAP = { ...BC_END, table: tbl('recap', ['salt', 'slow', 'weak', 'order'].map(k => ['@recap.' + k + '.k', '@recap.' + k + '.v'])) };

export const STEPS = [
  { id: 's1', ch: 0, shot: 'intro', orbit: .02, state: EMPTY, say: ['a', 'b', 'e'] },
  { id: 's2', ch: 0, shot: 'users', state: EMPTY, go: async x => {
      x.apply(); if (!await x.stage.signup(A.u, pw, null)) return; await x.fly('base'); x.say('a');
    } },
  { id: 's3', ch: 0, shot: 'users', state: ONE, go: async x => {
      x.apply(); if (!await x.stage.signup(B.u, pw, null)) return; await x.fly('base'); if (!await x.stage.same()) return; x.say('b');
    } },
  { id: 's4', ch: 1, shot: 'base', state: TWO, go: async x => {
      x.apply(); x.fly('steal'); if (!await x.stage.steal()) return; await x.fly('eve'); x.say('e');
    } },
  { id: 's5', ch: 1, shot: 'eve', state: STOLEN, go: async x => {
      x.apply(); if (!await x.stage.lookup()) return; x.say('e');
    } },
  { id: 's6', ch: 2, shot: 'users', state: SALT0, go: async x => {
      x.apply(); if (!await x.stage.signup(A.u, pw, A.salt)) return; await x.fly('base'); x.say('a');
    } },
  { id: 's7', ch: 2, shot: 'salt', state: SALT1, go: async x => {
      x.apply(); if (!await x.stage.signup(B.u, pw, B.salt)) return; await x.fly('base'); x.say('b');
    } },
  { id: 's8', ch: 2, shot: 'base', state: SALT2, go: async x => {
      x.apply(); x.fly('steal'); if (!await x.stage.steal()) return; await x.fly('eve'); if (!await x.stage.lookup()) return; x.say('e');
    } },
  { id: 's9', ch: 3, shot: 'rig', state: SALT_MISS, go: async x => {
      x.apply(); if (!await x.stage.tries(A.u, ['123456', pw], 'md5')) return; x.say('e');
    } },
  { id: 's10', ch: 4, shot: 'users', state: BC0, go: async x => {
      x.apply(); const done = x.stage.signup(A.u, pw, null, 'bcrypt');
      if (await x.stage.wait(2.6)) x.fly('salt');                     // closer, for the stopwatch
      if (!await done) return;
      x.stage.st.base.rows.push(bRow(B)); x.stage.relabel(); await x.fly('base'); x.say('a');
    } },
  { id: 's11', ch: 4, shot: 'rig', state: BC_STOLEN, go: async x => {
      x.apply(); if (!await x.stage.counter('bcrypt')) return; x.say('e', 'e1');
      if (!await x.stage.tries(A.u, ['123456', pw], 'bcrypt')) return; x.say('e', 'e2');
    } },
  { id: 's12', ch: 4, shot: 'wide', state: RECAP, say: ['a', 'e'] },
  // r105/r136: the last step is the doors out, each with its picture; the next episode is last, at the right
  { id: 's13', ch: 5, shot: 'wide', orbit: .02, state: RECAP, doors: [
      { k: 'sandbox', img: 'img/door-sandbox.jpg', clip: 'img/door-sandbox.mp4', go: x => x.mode('sandbox') },
      { k: 'quiz', img: 'img/door-quiz.jpg', clip: 'img/door-quiz.mp4', go: x => x.mode('quiz') },
      { k: 'home', img: '../assets/doors/home.jpg', clip: 'img/door-home.mp4', href: '../' },
      { k: 'next', img: '../garde/vignette.jpg', clip: 'img/door-next.mp4', href: '../garde/' }] },
];

export class Story {
  constructor(ctx) {
    this.ctx = ctx; this.i = 0; this.token = 0;
    this.el = { title: document.getElementById('step-title'), text: document.getElementById('step-text'),
      actions: document.getElementById('step-actions'), count: document.getElementById('step-count'),
      chapters: document.getElementById('chapters'), prev: document.getElementById('prev'), next: document.getElementById('next') };
    this.el.prev.onclick = () => this.go(this.i - 1);
    this.el.next.onclick = () => this.go(this.i + 1);
    this.said = new Map();   // bubble id -> text key, to re-say them after a language switch
    onLang(() => { this.ctx.stage.relabel(); this.render(true); });
  }

  state(i = this.i) { return STEPS[i].state; }

  go(i) {
    i = Math.max(0, Math.min(STEPS.length - 1, i));
    this.i = i; this.seen = false; const tok = ++this.token, step = STEPS[i], c = this.ctx;
    location.hash = 'story=' + (i + 1);
    c.bubbles.clear(); this.said.clear();
    c.stage.speed = c.instant ? 50 : 1;
    c.stage.apply(this.state());
    c.rig.setOrbit(0);
    c.rig.fly(step.shot, c.instant ? 0.001 : 2.2).then(() => {
      if (tok !== this.token) return;
      if (step.orbit) c.rig.setOrbit(step.orbit);
      if (step.auto) this.run(step.go);
    });
    this.render();
    // bubbles appear once the camera has mostly arrived
    setTimeout(() => { if (tok === this.token) for (const s of step.say || []) this.say(s); }, c.instant ? 0 : 1300);
  }

  say(who, key = who) {
    const step = STEPS[this.i];
    this.said.set(who, key);
    this.ctx.bubbles.show('story-' + who, who, raw('steps')[step.id][key], () => this.ctx.stage.head(who));
  }

  render(langOnly = false) {
    const step = STEPS[this.i], s = raw('steps')[step.id];
    this.el.title.textContent = s.t; render(this.el.text, s.p);
    this.el.count.textContent = t('nav.count', { i: this.i + 1, n: STEPS.length });
    this.el.prev.disabled = this.i === 0; this.el.next.disabled = this.i === STEPS.length - 1;
    this.el.chapters.innerHTML = '';
    raw('ch').forEach((name, k) => {
      const b = document.createElement('button'); b.textContent = `${k + 1}. ${name}`;
      b.classList.toggle('active', step.ch === k);
      b.onclick = () => this.go(STEPS.findIndex(x => x.ch === k));
      this.el.chapters.appendChild(b);
    });
    // a step's animation takes Suivant's place at the right; Suivant waits beside it, grey, until
    // the animation has played (it works all along). The last step's buttons are not animations.
    this.el.actions.innerHTML = ''; this.el.play?.remove(); this.el.play = null;
    renderDoors(this.el.actions, step.doors, s.doors, { lang, setMode: m => this.ctx.setMode(m), phone: 'row' });
    const anim = step.go && this.i < STEPS.length - 1;
    for (const key of ['go', 'go2']) {
      if (!step[key]) continue;
      const b = document.createElement('button'); b.className = key === 'go' && !(anim && this.seen) ? 'primary' : '';
      b.textContent = s[key];
      b.onclick = () => this.run(step[key]);
      if (anim && key === 'go') { b.id = 'play'; this.el.next.after(b); this.el.play = b; } else this.el.actions.appendChild(b);
    }
    this.el.next.classList.toggle('primary', !anim || this.seen);
    if (!this.seen) this.el.next.classList.remove('shine');
    if (langOnly) for (const [who, key] of this.said) if (this.ctx.bubbles.items.has('story-' + who)) this.say(who, key);
  }

  // the step's animation has played: Suivant takes the gold back and shines once to call the eye
  lit() {
    if (this.seen || !this.el.play) return;
    this.seen = true; this.el.play.classList.remove('primary');
    const n = this.el.next; n.classList.add('primary', 'shine');
    n.addEventListener('animationend', () => n.classList.remove('shine'), { once: true });
  }

  async run(fn) {
    const tok = this.token, c = this.ctx, st = c.stage;
    const live = () => tok === this.token;
    const buttons = [...this.el.actions.children, this.el.play].filter(Boolean);
    buttons.forEach(b => b.disabled = true);
    c.bubbles.clear(); this.said.clear();
    c.rig.setOrbit(0);
    const x = {
      stage: st, rig: c.rig, live,
      // back to the step's own state, unless the visitor has moved on
      apply: () => { if (live()) st.apply(this.state()); },
      fly: shot => live() ? c.rig.fly(shot) : null,
      say: (who, key) => live() && this.say(who, key),
      celebrate: () => live() && c.celebrate(),
      mode: m => c.setMode(m),
    };
    try { await fn(x); } finally { if (live()) { buttons.forEach(b => b.disabled = false); this.lit(); } }
  }
}
