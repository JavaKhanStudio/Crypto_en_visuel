// The guided story: 16 steps in 7 chapters. Alice sends the morning weather report under the
// setting of the day of 5.2 (rotors I II III, right ring on B, ten cables), from IXX; Eve has the
// 23 cipher letters. A letter never encrypts to itself (the reflector); the crib WETTERBERICHT slid
// along the cipher rules out six places of eleven; the menu of place 7 and a guess followed round
// its loop; the bombe runs the five menus through the 17 576 positions of rotor order I II III
// (the shortcut, said on screen: the real one ran all 60 orders); the clerk checks the 9 stops, one
// holds, and Eve's copy of the machine reads the message once a last cable is found by reading.
// Each step puts the stage where the story has reached (so Back, Next and the chapter chips always
// land somewhere consistent), flies the camera, pins its bubbles, and offers buttons.
// auto: the step's action plays by itself once the camera has landed (its button replays it).
import { t, raw, onLang } from './i18n.js';
import { render } from '../../lib/md.js';
import { press, type, lamps, places, menu, check, STARTS } from './enigma.js';
import { SEGS } from './stage.js';

export const CABLES = 'BS CZ DN ER FI GU HO KW LM QY';
export const DAY = { rotors: ['I', 'II', 'III'], rings: 'AAB', plugs: CABLES };   // 5.2's sheet of the day
export const START = 'IXX', PLAIN = 'HEUTEXWETTERBERICHTXEIS', CRIB = 'WETTERBERICHT';
export const CIPHER = lamps(PLAIN, START, DAY);                     // EBOWTASBRMHCEFBMMXEFFPA
export const LEFT = places(CIPHER, CRIB);                           // places 5, 7, 8, 10, 11 (0-based 4 6 7 9 10)
export const PLACE = 6, LINKS = menu(CIPHER, CRIB, PLACE);          // the menu the story draws: place 7
export const LOOP = [1, 8, 2, 12];                                  // its links 8 E–B, 15 B–R, 9 R–T, 19 T–E
export const ROT = ['I', 'II', 'III'], TEST = 'E', STOP = 'IXW';
export const MENUS = LEFT.map(k => ({ k, links: menu(CIPHER, CRIB, k) }));
// what the bombe finds over the five menus (computed again by the run in step 11, and checked
// against bombe() by tests/enigma-casse_values.mjs)
export const STOPS = [['DDO', 4, 'U'], ['IXW', 6, 'R'], ['AKT', 9, 'J'], ['CRK', 9, 'K'], ['BEC', 10, 'Z'], ['EFM', 10, 'J'], ['OFS', 10, 'K'], ['UEA', 10, 'U'], ['WHR', 10, 'E']]
  .map(([pos, k, guess]) => ({ k, pos, guess }));
const CHECKS = STOPS.map(s => { const c = check(MENUS.find(m => m.k === s.k).links, ROT, s, TEST); return { ...s, pairs: c.pairs, bad: c.bad }; });
export const FOUND = { rotors: ROT, rings: 'AAA', plugs: CHECKS.find(c => !c.bad.length).pairs.filter(p => p[0] !== p[1]).join(' ') };   // BS CZ ER FI HO KW LM
export const FIXED = { ...FOUND, plugs: [...FOUND.plugs.split(' '), 'GU'].sort().join(' ') };
const READ1 = type(CIPHER, STOP, FOUND), READ2 = type(CIPHER, STOP, FIXED);
const H_REC = press(PLAIN[0], START, DAY);
const full = recs => recs.map(rec => ({ rec, n: SEGS }));

const SENT = { set: { a: DAY, b: DAY }, pos: { a: type(PLAIN, START, DAY).at(-1).pos, b: START }, pads: { a: CIPHER } };
const HEARD = { ...SENT, pads: { a: CIPHER, e: CIPHER } };
const ALICE = { ...HEARD, apart: { a: 1 }, pos: { a: START, b: START } };
const H_DONE = { ...ALICE, pos: { a: H_REC.pos, b: START }, lit: { a: H_REC.lamp }, shown: [{ m: 'a', rec: H_REC, n: SEGS }], rows: full([H_REC]), panel: 'ref' };
const SLATE = (k, marks) => ({ ...HEARD, slate: { cipher: CIPHER, crib: CRIB, k, marks }, panel: 'crib' });
const ALL = Object.fromEntries([...Array(CIPHER.length - CRIB.length + 1).keys()].map(k => [k, LEFT.includes(k) ? 'ok' : 'out']));
const MENU0 = { ...SLATE(PLACE, ALL), menu: { links: LINKS, n: 0, rotors: ROT, pos: STOP }, panel: 'menu' };
const MENU = { ...MENU0, menu: { ...MENU0.menu, n: null, loop: LOOP } };
const RUN = done => ({ ...MENU, menu: { ...MENU.menu, loop: null }, panel: 'bombe',
  run: { menus: MENUS, test: TEST, rotors: ROT, m: done ? MENUS.length : 0, n: done ? STARTS : 0, done: done ? MENUS.map(() => STARTS) : [], stops: done ? STOPS : [], checks: done === 2 ? CHECKS : null } });
const CLERK = { ...RUN(2), slate: null, menu: null, panel: null, apart: { e: 1 }, set: { ...HEARD.set, e: FOUND }, pos: { ...HEARD.pos, e: STOP }, card: 'e', pads: { a: CIPHER, e: '' }, check: true };
const MSG1 = { plain: CIPHER, cipher: READ1.map(r => r.lamp).join(''), from: STOP }, MSG2 = { plain: CIPHER, cipher: PLAIN, from: STOP };
const READ = { ...CLERK, pos: { ...CLERK.pos, e: READ1.at(-1).pos }, rows: full(READ1.slice(-4)), lit: { e: READ1.at(-1).lamp }, shown: [{ m: 'e', rec: READ1.at(-1), n: SEGS }], msg: MSG1, pads: { a: CIPHER, e: MSG1.cipher } };
const DONE = { ...READ, set: { ...READ.set, e: FIXED }, rows: full(READ2.slice(-4)), lit: { e: READ2.at(-1).lamp }, shown: [{ m: 'e', rec: READ2.at(-1), n: SEGS }], msg: MSG2, pads: { a: CIPHER, e: PLAIN } };
const END = { ...DONE, apart: {}, shown: [], lit: {}, check: false };

export const STEPS = [
  { id: 's1', ch: 0, shot: 'intro', orbit: .02, state: SENT, say: ['a', 'b', 'e'] },
  { id: 's2', ch: 0, shot: 'radio', state: SENT, auto: true, go: async x => {
      x.apply(); if (!await x.stage.radio(CIPHER, 'a', 'b', .4)) return; await x.fly('eve'); x.say('e');
    } },
  { id: 's3', ch: 1, shot: 'plugDrum', state: ALICE, go: async x => {
      x.apply(); if (!await x.stage.pressKey('a', PLAIN[0])) return; await x.stage.current('a', SEGS); x.say('a');
    } },
  { id: 's4', ch: 1, shot: 'plugDrum', state: H_DONE, say: ['e'] },
  { id: 's5', ch: 2, shot: 'slate', state: SLATE(0, {}), say: ['e'] },
  { id: 's6', ch: 2, shot: 'slate', state: SLATE(0, {}), go: async x => {
      x.apply(); if (!await x.stage.slide(0, 1)) return; x.say('e');
    } },
  { id: 's7', ch: 2, shot: 'slate', state: SLATE(0, { 0: 'out' }), go: async x => {
      x.apply(); if (!await x.stage.slide(CIPHER.length - CRIB.length, .7)) return; x.say('e');
    } },
  { id: 's8', ch: 3, shot: 'menuDraw', state: MENU0, go: async x => {
      x.apply(); if (!await x.stage.drawMenu(.5)) return; x.say('e');
    } },
  { id: 's9', ch: 3, shot: 'menu', state: MENU, go: async x => {
      x.apply(); if (!await x.stage.trace('A', 1.1)) return;
      if (!await x.stage.wait(1.6)) return;
      if (!await x.stage.trace('R', 1.1)) return; x.say('e');
    } },
  { id: 's10', ch: 4, shot: 'bombe', state: RUN(0), say: ['e'] },
  { id: 's11', ch: 4, shot: 'bombe', state: RUN(0), go: async x => {
      x.apply(); if (!await x.stage.runBombe(2.6)) return; x.say('e');
    } },
  { id: 's12', ch: 4, shot: 'bombe', state: RUN(1), go: async x => {
      x.apply(); if (!await x.stage.checkStops(.6)) return; x.say('e');
    } },
  { id: 's13', ch: 5, shot: 'eveCheck', state: CLERK, go: async x => {
      x.apply(); if (!await x.stage.typeQuick('e', CIPHER, .45)) return;
      x.stage.st.msg = MSG1; x.stage.relabel(); x.say('e');
    } },
  { id: 's14', ch: 5, shot: 'eveCheck', state: READ, go: async x => {
      x.apply(); const st = x.stage.st;
      if (!await x.stage.plug('e', FIXED.plugs)) return;
      st.rows = []; st.msg = null; st.pads.e = '';
      if (!await x.stage.turnTo('e', STOP)) return;
      if (!await x.stage.typeQuick('e', CIPHER, .4)) return;
      st.msg = MSG2; x.stage.relabel(); x.say('e'); x.celebrate();
    } },
  { id: 's15', ch: 6, shot: 'eveWide', state: END, say: ['e'] },
  { id: 's16', ch: 6, shot: 'wide', orbit: .02, state: END, go: x => x.mode('sandbox'), go2: x => x.mode('quiz') },
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
    // on a phone the slate shot pans with the crib: the x of its middle column (r147)
    // Eve's tags, her notepad's and the slate's tiles are walls for the bubbles (r147, r351)
    ctx.bubbles.avoid = () => [...Object.values(ctx.stage.names.e), ctx.stage.pads.e, ...ctx.stage.slateG.children.filter(o => o.isSprite)];
    ctx.rig.follow = () => { const sl = ctx.stage.st.slate; return sl && Number.isFinite(sl.k) ? ctx.stage.colX(sl.k + (sl.crib.length - 1) / 2, sl.cipher.length) : null; };
  }

  state(i = this.i) { return STEPS[i].state; }

  go(i) {
    i = Math.max(0, Math.min(STEPS.length - 1, i));
    this.i = i; this.seen = false; const tok = ++this.token, step = STEPS[i], c = this.ctx;
    location.hash = 'story=' + (i + 1);
    c.bubbles.clear(); this.said.clear();
    c.stage.speed = c.instant ? 50 : 1;
    // a drum that opens or closes between two steps does it during the flight, never in one frame
    const was = Object.fromEntries(Object.entries(c.stage.machines).map(([k, m]) => [k, m.userData.apart]));
    c.stage.apply(this.state());
    if (!c.instant) for (const [k, m] of Object.entries(c.stage.machines)) {
      const e = m.userData.apart;
      if (Math.abs(was[k] - e) > .01) { m.userData.setApart(was[k]); c.stage.apart(k, e, 2.2); }
    }
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
