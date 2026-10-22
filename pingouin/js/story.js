// The guided story: 13 steps in 6 chapters, on the course's slides about the modes of operation.
// Each step puts the hall where the story has reached (so Back, Next and the chapter chips always
// land somewhere consistent), flies the camera, pins its bubbles, and offers buttons.
// auto: the step's action plays by itself once the camera has landed (its button replays it).
import { t, raw, lang, onLang } from './i18n.js';
import { render } from '../../lib/md.js';
import * as A from './values.js';
import { SLOT, CRATE_Y } from './world.js';
import { CRATE } from './props.js';
import { ROWS } from './stage.js';
import { renderDoors } from '../../lib/doors.js';

const ids = [0, 1, 2, 3];
const crates = (bytes, look, label, slot, extra = {}) => ids.map(i => ({ id: 'P' + (i + 1), label: label + (i + 1), bytes: bytes[i], look, x: slot[i], ...(extra[i] || {}) }));
const ivCrate = (iv, x, label = 'IV') => ({ id: 'IV', label, bytes: iv, look: 'hex', x });
const tbl = (kind, rows) => ({ kind, rows });
const IN = crates(A.P, 'text', 'P', SLOT.inA);
const at = (list, dx) => list.map(c => ({ ...c, x: c.x + dx }));
const F = A.FLIP, flipRows = [ROWS.c(0, A.CBC1.C[0]), ROWS.flip(F, A.CBC1.C[0][8]), ROWS.c(0, A.C1F[0], '′')];
const toEve = SLOT.eve - SLOT.outA[0], toBob = SLOT.inB[0] - SLOT.outA[0];
const FLIPPED = { 0: { bytes: A.C1F[0], hi: [8] } };

const EMPTY = { table: tbl('msg', []) };
const SPLIT = { crates: IN, table: tbl('msg', ids.map(i => ROWS.msg(i))) };
const ECB = { crates: crates(A.E, 'hex', 'C', SLOT.outA), table: tbl('ecb', ids.map(i => ROWS.ecb(i))) };
const SAME = { ...ECB, crates: crates(A.E, 'hex', 'C', SLOT.outA, { 0: { mark: 'same' }, 2: { mark: 'same' } }), wall: { plain: 1 } };
const PENGUIN = { ...SAME, wall: { plain: 1, ecb: 1 } };
const CBC_IN = { crates: IN, rings: true, wall: { plain: 1, ecb: 1 }, table: tbl('cbc', []) };
const cbcDone = (iv, r, name = 'IV') => ({ crates: [...crates(r.C, 'hex', 'C', SLOT.outA), ivCrate(iv, SLOT.ivA, name)], rings: true,
  table: tbl('cbc', [ROWS.iv(name, iv), ...ids.map(i => ROWS.cbc(r, i, name))]) });
const CBC = { ...cbcDone(A.IV1, A.CBC1), wall: { plain: 1, ecb: 1 } };
const CBC_W = { ...CBC, wall: { plain: 1, ecb: 1, cbc: 1 } };
const ALL = { plain: 1, ecb: 1, cbc: 1 };
const AT_EVE = { ...cbcDone(A.IV1, A.CBC1), wall: ALL, crates: at(cbcDone(A.IV1, A.CBC1).crates, toEve).map(c => c.id === 'P1' ? { ...c, ...FLIPPED[0] } : c),
  table: tbl('flip', flipRows), flipped: { ...F, before: 0xea, after: 0xe3 } };
const REFUSED = { ...AT_EVE, crates: [...at(cbcDone(A.IV1, A.CBC1).crates, toBob).map(c => c.id === 'P1' ? { ...c, ...FLIPPED[0] } : c).map(c => c.id === 'IV' ? c : { ...c, mark: 'bad' }),
  { id: 'T', label: 'HMAC', bytes: A.TAG.slice(0, 16), look: 'seal', x: SLOT.ivB, y: CRATE_Y + CRATE }], verdict: 'bad',
  table: tbl('mac', [ROWS.mac(A.TAG), ROWS.flip(F, A.CBC1.C[0][8]), ROWS.check(A.TAGF, false)]) };

// the slide « Modes d'opération - Récapitulatif »
const RECAP = tbl('recap', ['ecb', 'cbc', 'gcm'].map(k => [k.toUpperCase(), '@recap.' + k]));

export const STEPS = [
  { id: 's1', ch: 0, shot: 'intro', orbit: .02, state: EMPTY, say: ['a', 'b', 'e'] },
  { id: 's2', ch: 0, shot: 'aliceIn', state: EMPTY, go: async x => {
      x.apply(); if (!await x.stage.split()) return; x.say('a');
    } },
  { id: 's3', ch: 1, shot: 'alice', state: SPLIT, go: async x => {
      x.apply(); x.fly('chain'); if (!await x.stage.ecb()) return; await x.fly('outA'); x.say('a');
    } },
  { id: 's4', ch: 1, shot: 'outA', state: ECB, auto: true, go: async x => {
      x.apply(); if (!await x.stage.same()) return; x.say('e');
    } },
  { id: 's5', ch: 1, shot: 'wall', state: SAME, go: async x => {
      x.apply(); if (!await x.stage.wall('ecb')) return; x.say('e');
    } },
  { id: 's6', ch: 2, shot: 'chain', state: CBC_IN, go: async x => {
      x.apply(); if (!await x.stage.cbc()) return; await x.fly('outA'); x.say('a');
    } },
  { id: 's7', ch: 2, shot: 'outA', state: CBC, go: async x => {
      x.apply(); await x.fly('wall'); if (!await x.stage.wall('cbc')) return; x.say('e');
    } },
  { id: 's8', ch: 2, shot: 'chain', state: { ...CBC_IN, wall: ALL }, go: async x => {
      x.apply(); if (!await x.stage.cbc(A.IV2)) return; await x.fly('outA'); x.say('a');
    } },
  { id: 's9', ch: 3, shot: 'belt', state: { ...CBC_W }, go: async x => {
      x.apply(); if (!await x.stage.send(0)) return; await x.fly('eve'); if (!await x.stage.flip()) return; x.say('e');
    } },
  { id: 's10', ch: 3, shot: 'belt', state: AT_EVE, go: async x => {
      x.apply(); if (!await x.stage.send()) return; await x.fly('bob'); if (!await x.stage.decrypt()) return; await x.fly('bobOut'); x.say('b'); x.say('e');
    } },
  { id: 's11', ch: 4, shot: 'outA', state: { ...CBC_W, table: tbl('mac', []) }, go: async x => {
      x.apply(); x.stage.st.table = { kind: 'mac', rows: [] };
      if (!await x.stage.seal()) return; await x.fly('belt');
      if (!await x.stage.send(0)) return; await x.fly('eve'); if (!await x.stage.flip(A.FLIP, 1, false)) return;
      x.fly('bobIn'); if (!await x.stage.send()) return; if (!await x.stage.check()) return; x.say('b'); x.say('e');
    } },
  { id: 's12', ch: 4, shot: 'wide', state: { ...REFUSED, table: RECAP }, say: ['a', 'e'] },
  { id: 's13', ch: 5, shot: 'wide', orbit: .02, state: { ...REFUSED, table: RECAP },
    // r105/r135: the last step is the doors out, each with its picture; the next episode is last, at the right
    doors: [
      { k: 'sandbox', img: 'img/door-sandbox.jpg', clip: 'img/door-sandbox.mp4', go: x => x.mode('sandbox') },
      { k: 'quiz', img: 'img/door-quiz.jpg', clip: 'img/door-quiz.mp4', go: x => x.mode('quiz') },
      { k: 'home', img: 'img/door-home.jpg', clip: 'img/door-home.mp4', href: '../' },
      { k: 'next', img: '../sel/vignette.jpg', clip: 'img/door-next.mp4', href: '../sel/' }] },
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
