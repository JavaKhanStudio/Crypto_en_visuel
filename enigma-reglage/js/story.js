// The guided story: 18 steps in 7 chapters. It starts from 5.1's machine (rotors I II III,
// reflector B, rings at A, no cable, start AAA) and adds the rest of the setting of the day one
// piece at a time: ten cables, the ring of the right rotor on B, the start ADU (so the message
// itself shows the notch and the double step); then counts the settings. Each step puts the
// machines where the story has reached (so Back, Next and the chapter chips always land somewhere
// consistent), flies the camera, pins its bubbles, and offers buttons.
// auto: the step's action plays by itself once the camera has landed (its button replays it).
import { t, raw, onLang } from './i18n.js';
import { press, type, BARE } from './enigma.js';
import { SEGS } from './stage.js';

// the setting of the day, built up chapter by chapter
export const CABLES = 'BS CZ DN ER FI GU HO KW LM QY';
export const CABLED = { ...BARE, plugs: CABLES };            // 5.1's machine and the cables
export const DAY = { ...CABLED, rings: 'AAB' };              // and the right rotor's ring on B
export const START = 'ADU', PLAIN = 'OUI';
const NEW_WIRE = 0x7fd8ff;
const O_BARE = press('O', 'AAA'), O_CAB = press('O', 'AAA', CABLED), F_BACK = press('F', 'AAA', CABLED), O_RING = press('O', 'AAA', DAY);
const MSG = type(PLAIN, START, DAY), CIPHER = MSG.map(r => r.lamp).join(''), BOB = type(CIPHER, START, DAY);
const full = recs => recs.map(rec => ({ rec, n: SEGS }));
const MSG_A = { plain: PLAIN, cipher: CIPHER, from: START }, MSG_B = { plain: CIPHER, cipher: PLAIN, from: START };

const CLOSED = {};
const OPEN = { apart: { a: 1 } };
const BARED = { ...OPEN, pos: { a: 'AAB' } };   // after the bare press: its path has faded (r202)
const CAB = { apart: { a: 1 }, set: { a: CABLED } };
const CAB_PRESSED = { ...CAB, pos: { a: 'AAB' }, down: { a: 'O' }, shown: [{ m: 'a', rec: O_CAB, n: 4 }], rows: [{ rec: O_CAB, n: 4 }] };
const CAB_DONE = { ...CAB, pos: { a: 'AAB' }, lit: { a: 'F' }, shown: [{ m: 'a', rec: O_CAB, n: SEGS }], rows: full([O_CAB]) };
const RING = { ...CAB, flat: { a: 1 }, rows: full([O_CAB]) };   // the three rotors out, face on (r202)
const RINGED = { apart: { a: 1 }, set: { a: DAY }, ghost: [{ m: 'a', rec: O_CAB }], rows: full([O_CAB]) };
const DAY_SET = { apart: { a: 1 }, set: { a: DAY } };
const AFTER = n => ({ apart: { a: 1 }, set: { a: DAY }, pos: { a: MSG[n - 1].pos }, ghost: [], shown: [{ m: 'a', rec: MSG[n - 1], n: SEGS }],
  lit: { a: MSG[n - 1].lamp }, rows: full(MSG.slice(0, n)), pads: { a: CIPHER.slice(0, n) } });
const TYPED = { apart: { a: 1 }, set: { a: DAY, b: DAY }, pos: { a: MSG[2].pos, b: START }, rows: full(MSG), msg: MSG_A, pads: { a: CIPHER } };
const HEARD = { ...TYPED, apart: { a: 1, b: 1 }, pads: { a: CIPHER, e: CIPHER } };
const AT_BOB = { ...HEARD, rows: [], msg: null, card: 'b' };
const READ = { ...HEARD, pos: { a: MSG[2].pos, b: BOB[2].pos }, rows: full(BOB), msg: MSG_B, card: 'b', pads: { a: CIPHER, e: CIPHER, b: PLAIN } };
const RACK = { apart: { a: 1 }, set: { a: DAY, b: DAY }, pos: { a: START, b: START }, rack: 1, tally: { kind: 'orders', n: 0 }, pads: READ.pads };
const RACK_DONE = { ...RACK, count: { taken: ['I', 'II', 'III'], lit: [], sum: '5 × 4 × 3 = 60' } };
const BOARD = { ...RACK_DONE, rack: 0, count: null, tally: { kind: 'cables', n: 0 } };
const TOTAL = { ...RACK_DONE, tally: { kind: 'total', n: 0 } };
const END = READ;

export const STEPS = [
  { id: 's1', ch: 0, shot: 'intro', orbit: .02, state: CLOSED, say: ['a', 'b', 'e'] },
  { id: 's2', ch: 0, shot: 'plugDrum', state: OPEN, go: async x => {
      x.apply(); if (!await x.stage.pressKey('a', 'O')) return; await x.stage.current('a', SEGS, 2.2); x.say('a');
    } },
  { id: 's3', ch: 1, shot: 'plugboard', state: BARED, fade: true, go: async x => {
      x.apply(); if (!await x.stage.plug('a', CABLES)) return; x.say('a');
    } },
  { id: 's4', ch: 1, shot: 'plugDrum', state: CAB, go: async x => {
      x.apply(); if (!await x.stage.pressKey('a', 'O')) return; await x.stage.current('a', 4, 1.3); x.say('a');
    } },
  { id: 's5', ch: 1, shot: 'plugDrum', state: CAB_PRESSED, go: async x => {
      x.apply(); await x.stage.current('a', SEGS); x.say('a');
    } },
  { id: 's6', ch: 1, shot: 'plugDrum', state: CAB_DONE, go: async x => {
      x.apply(); await x.stage.release('a'); x.stage.fadePaths(.6);
      if (!await x.stage.turnTo('a', 'AAA', .8)) return;
      if (!await x.stage.pressKey('a', 'F')) return; await x.stage.current('a', SEGS, 1.8); x.say('a');
    } },
  { id: 's7', ch: 2, shot: 'flat', state: RING, go: async x => {
      // the left and middle rings stay on A; the right one turns, and the wire facing H goes with
      // its core, leaving its trace (r202)
      x.apply(); const H = 7;
      if (!await x.stage.showDot('a', 'L') || !await x.stage.showDot('a', 'M') || !await x.stage.showDot('a', 'R')) return;
      x.stage.markWire('a', 'R', H); if (!await x.stage.wait(.8)) return;
      x.stage.markWire('a', 'R', H, true);
      if (!await x.stage.turnRing('a', 'R', 'B')) return;
      x.stage.markWire('a', 'R', H, false, NEW_WIRE); x.say('a');   // the wire now facing H, in its own colour
    } },
  { id: 's8', ch: 2, shot: 'plugDrum', state: RINGED, go: async x => {
      x.apply(); if (!await x.stage.pressKey('a', 'O')) return; await x.stage.current('a', SEGS); x.say('a');
    } },
  { id: 's9', ch: 3, shot: 'plugDrum', state: DAY_SET, go: async x => {
      x.apply(); if (!await x.stage.turnTo('a', START)) return;
      if (!await x.stage.type('a', PLAIN[0], 1.4)) return; x.say('a');
    } },
  { id: 's10', ch: 3, shot: 'plugDrum', state: AFTER(1), go: async x => {
      x.apply(); if (!await x.stage.type('a', PLAIN[1], 1.4)) return; x.say('a');
    } },
  { id: 's11', ch: 3, shot: 'plugDrum', state: AFTER(2), go: async x => {
      x.apply(); if (!await x.stage.type('a', PLAIN[2], 1.4)) return;
      x.stage.st.msg = MSG_A; x.stage.relabel(); x.say('a');
    } },
  { id: 's12', ch: 4, shot: 'radio', state: TYPED, auto: true, go: async x => {
      x.apply(); if (!await x.stage.radio(CIPHER)) return; await x.fly('eve'); x.say('e');
    } },
  { id: 's13', ch: 4, shot: 'bobDrum', state: AT_BOB, go: async x => {
      x.apply(); if (!await x.stage.type('b', CIPHER, 1.6)) return;
      x.stage.st.msg = MSG_B; x.stage.relabel(); x.say('b'); x.celebrate();
    } },
  { id: 's14', ch: 5, shot: 'rack', state: RACK, go: async x => {
      x.apply(); if (!await x.stage.count()) return;
      for (let n = 1; n <= 3; n++) if (!await x.stage.tallyTo('orders', n, 1.2)) return;
      x.say('a');
    } },
  { id: 's15', ch: 5, shot: 'plugboard', state: BOARD, go: async x => {
      x.apply(); const list = CABLES.split(' ');
      x.stage.machines.a.userData.setCables('');
      for (let n = 1; n <= list.length; n++) {
        x.stage.machines.a.userData.setCables(list.slice(0, n).join(' '));
        if (!await x.stage.tallyTo('cables', n, .7)) return;
      }
      x.say('e');
    } },
  { id: 's16', ch: 5, shot: 'rack', state: TOTAL, go: async x => {
      x.apply(); for (let n = 1; n <= 4; n++) if (!await x.stage.tallyTo('total', n, 1.1)) return;
      x.say('e');
    } },
  { id: 's17', ch: 6, shot: 'wide', state: END, say: ['a', 'e'] },
  { id: 's18', ch: 6, shot: 'wide', orbit: .02, state: END, go: x => x.mode('sandbox'), go2: x => x.mode('quiz') },
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
    const from = this.i;
    this.i = i; this.seen = false; const tok = ++this.token, step = STEPS[i], c = this.ctx;
    location.hash = 'story=' + (i + 1);
    c.bubbles.clear(); this.said.clear();
    c.stage.speed = c.instant ? 50 : 1;
    // a drum that opens or closes between two steps does it during the flight, never in one frame;
    // so do rotors taken out flat or put back (r202)
    const was = Object.fromEntries(Object.entries(c.stage.machines).map(([k, m]) => [k, m.userData.apart]));
    const wasFlat = Object.fromEntries(Object.entries(c.stage.machines).map(([k, m]) => [k, m.userData.flat]));
    // a step marked fade, reached by Suivant, lets the last step's paths fade out instead of cutting them (r202)
    if (step.fade && from === i - 1 && c.stage.st) c.stage.fadePaths();
    c.stage.apply(this.state());
    if (!c.instant) for (const [k, m] of Object.entries(c.stage.machines)) {
      const e = m.userData.apart;
      if (Math.abs(was[k] - e) > .01) { m.userData.setApart(was[k]); c.stage.apart(k, e, 2.2); }
      const f = m.userData.flat;
      if (Math.abs(wasFlat[k] - f) > .01) { m.userData.setFlat(wasFlat[k]); c.stage.flat(k, f, 2.2); }
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
    this.el.title.textContent = s.t; this.el.text.textContent = s.p;
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
