// The guided story: 12 steps in 5 chapters, on the course's slides « Kasiski - La roue » to « Kasiski -
// Les 5 colonnes ». Each step puts the car, the marks, the tape, the bars, the lane and the key wheel
// where the story has reached (so Back, Next and the chapter chips always land somewhere consistent),
// flies the camera, pins its bubbles, and offers buttons. auto: the step's action plays by itself once
// the camera has landed (its button replays it).
import * as THREE from 'three';
import { t, raw, onLang } from './i18n.js';
import { START_X, LANE_N } from './stage.js';

const END = 86;                                   // the car at the end of the road: its stone wheel at x = 46
const DRIVEN = { car: END, printed: START_X + END };
const MEASURED = { ...DRIVEN, tape: 14, card: 'trace' };
const COUNTED = { ...MEASURED, red: true, bars: 'wheel', grown: true, card: 'count' };
const LANE = { car: null, lane: true, card: 'vig' };
const ROLLED = { ...LANE, stamped: LANE_N, kw: LANE_N - 1, hot: true, card: 'repeat' };
const EVE = { ...ROLLED, eve: true, hot: false, card: 'tri' };

export const STEPS = [
  { id: 's1', ch: 0, shot: 'intro', orbit: .02, state: {}, say: ['a', 'e'] },
  { id: 's2', ch: 0, shot: 'wheel', state: {}, go: async x => {
      x.apply(); await x.stage.drive(5, .8); x.say('a');   // three turns: stone in mud, on dry ground, in mud
    } },
  { id: 's3', ch: 0, shot: 'start', state: DRIVEN, auto: true, go: async x => {
      x.apply({}); x.chase(x.stage.car, new THREE.Vector3(-3, 3.4, 8.5));
      if (!await x.stage.drive(END, 7)) return;
      await x.fly('track'); x.say('e');
    } },
  { id: 's4', ch: 1, shot: 'track', state: { ...DRIVEN, card: 'trace' }, go: async x => {
      x.apply(); x.chase(x.stage.focus, new THREE.Vector3(0, 9, 14));
      if (!await x.stage.measure()) return;
      await x.fly('track'); x.say('e');
    } },
  { id: 's5', ch: 1, shot: 'mid', state: MEASURED, go: async x => {
      x.apply(); await x.stage.redden(); x.say('e');
    } },
  { id: 's6', ch: 1, shot: 'bars', state: { ...COUNTED, grown: false }, go: async x => {
      x.apply(); await x.stage.grow(); x.say('e');
    } },
  { id: 's7', ch: 2, shot: 'lane', state: LANE, go: async x => {
      x.apply(); x.chase(x.stage.kwheel, new THREE.Vector3(-2.5, 3.2, 7.5));
      if (!await x.stage.roll(15, .5)) return;
      await x.fly('lane2'); x.say('a');
    } },
  { id: 's8', ch: 2, shot: 'lane2', state: { ...LANE, stamped: 16, kw: 15 }, go: async x => {
      x.apply(); x.chase(x.stage.kwheel, new THREE.Vector3(-3, 4, 10));
      if (!await x.stage.roll(LANE_N - 1, .09)) return;
      await x.fly('repeat'); await x.stage.light(); x.say('a');
    } },
  { id: 's9', ch: 3, shot: 'laneAll', state: EVE, go: async x => {
      x.apply(); await x.stage.showArcs(); await x.stage.light(); x.say('e');
    } },
  { id: 's10', ch: 3, shot: 'barsLane', state: { ...EVE, arcs: true, hot: true, bars: 'cipher', card: 'ccount' }, go: async x => {
      x.apply(); await x.stage.grow(); x.say('e');
    } },
  { id: 's11', ch: 4, shot: 'wheelKey', state: { ...EVE, kw: 0, key: '?????', card: 'cols' }, go: async x => {
      x.apply(); await x.stage.findKey('LEMON'); x.say('e');
    } },
  { id: 's12', ch: 4, shot: 'laneAll', orbit: .02, state: { ...EVE, kw: 0, key: 'LEMON', lit: [1, 1, 1, 1, 1], card: 'cols' },
    go: x => x.mode('sandbox'), go2: x => x.mode('quiz') },
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
    onLang(() => { this.ctx.stage.apply({ ...this.ctx.stage.st }); this.render(true); });
  }

  state(i = this.i) { return { ...STEPS[i].state }; }

  go(i) {
    i = Math.max(0, Math.min(STEPS.length - 1, i));
    this.i = i; this.seen = false; const tok = ++this.token, step = STEPS[i], c = this.ctx;
    location.hash = 'story=' + (i + 1);
    c.bubbles.clear(); this.said.clear();
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
    // on the lane, Alice speaks from her key wheel; Eve from where she stands
    const st = this.ctx.stage, anchor = () => st.head(who === 'a' && st.st.lane ? 'kw' : who);
    this.ctx.bubbles.show('story-' + who, who, raw('steps')[step.id][key], anchor);
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
      b.onclick = () => this.run(step[key], key === 'go2');
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

  // keep: a small action on top of where the stage is, no reset, bubbles stay
  async run(fn, keep = false) {
    const tok = this.token, c = this.ctx, st = c.stage;
    const live = () => tok === this.token;
    const buttons = [...this.el.actions.children, this.el.play].filter(Boolean);
    buttons.forEach(b => b.disabled = true);
    if (!keep) { c.bubbles.clear(); this.said.clear(); }
    c.rig.setOrbit(0);
    const x = {
      stage: st, rig: c.rig, live,
      // back to the step's own state (or another), unless the visitor has moved on
      apply: s => { if (live()) st.apply(s ?? this.state()); },
      fly: shot => live() ? c.rig.fly(shot) : null,
      say: (who, key) => live() && this.say(who, key),
      clear: () => { if (live()) { c.bubbles.clear(); this.said.clear(); } },
      // the camera rides beside the car, the key wheel, or Eve's tape
      chase: (obj, off) => live() && c.rig.chase(obj, off),
      celebrate: () => live() && c.celebrate(),
      mode: m => c.setMode(m),
    };
    try { await fn(x); } finally { if (live()) { buttons.forEach(b => b.disabled = false); this.lit(); } }
  }
}
