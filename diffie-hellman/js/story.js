// The guided story: 15 steps in 6 chapters, on the values of the course's slides
// « Diffie-Hellman - Les couleurs », « - Les calculs », « - Au milieu », « - La parade ».
// Each step puts the pots where the story has reached (so Back, Next and the chapter chips
// always land somewhere consistent), flies the camera, pins its bubbles, and offers buttons.
// auto: the step's action plays by itself once the camera has landed (its button replays it).
import { t, raw, lang, onLang } from './i18n.js';
import { render } from '../../lib/md.js';
import { renderDoors } from '../../lib/doors.js';

// The pots, by id: [table, slot (0 1 2 front, 3 4 5 back), recipe, options]. a = Alice, e = Eve, b = Bob.
const PUB = { aJ: ['a', 0, 'J'], eJ: ['e', 0, 'J'], bJ: ['b', 0, 'J'] };
const SEC = { aR: ['a', 2, 'R', { secret: true }], bB: ['b', 2, 'B', { secret: true }] };
const MIXED = { ...PUB, ...SEC, aM: ['a', 1, 'JR'], bM: ['b', 1, 'BJ'] };
const SEEN = { ...PUB, ...SEC, aM: ['b', 1, 'JR'], bM: ['a', 1, 'BJ'], eO: ['e', 3, 'JR', { level: .6 }], eV: ['e', 5, 'BJ', { level: .6 }] };
const SHARED = { ...SEEN, aM: ['b', 1, 'BJR'], bM: ['a', 1, 'BJR'] };
const EVE_N = { eN: ['e', 2, 'N', { secret: true }] };
const CAUGHT = { ...PUB, ...SEC, ...EVE_N, aM: ['e', 3, 'JR'], bM: ['e', 5, 'BJ'] };
const SWAPPED = { ...CAUGHT, eK1: ['b', 1, 'JN'], eK2: ['a', 1, 'JN'] };
const TWO = { ...CAUGHT, aM: ['e', 3, 'JNR'], bM: ['e', 5, 'BJN'], eK1: ['b', 1, 'BJN'], eK2: ['a', 1, 'JNR'] };
// the message chest takes the JAUNE pot's place on the tables
const { aJ: _a, bJ: _b, ...TWO_CHEST } = TWO;
const PARADE = { ...PUB, ...SEC, ...EVE_N, aM: ['a', 3, 'JR'], bM: ['b', 1, 'BJ', { seal: 'bob' }], eK2: ['e', 1, 'JN', { seal: 'fake' }] };

export const STEPS = [
  { id: 's1', ch: 0, shot: 'intro', orbit: .03, state: {}, say: ['a', 'b', 'e'] },
  { id: 's2', ch: 1, shot: 'wide', state: {}, auto: true, go: async x => {
      x.apply({ pots: PUB }); await x.stage.appear(['aJ', 'eJ', 'bJ']); if (!x.live()) return;
      await x.fly('eve'); x.say('e');
    } },
  { id: 's3', ch: 1, shot: 'wide', state: { pots: PUB }, auto: true, go: async x => {
      x.apply({ pots: { ...PUB, ...SEC } }); await x.fly('alice'); await x.stage.appear(['aR']); x.say('a'); if (!x.live()) return;
      await x.stage.wait(1.6); await x.fly('bob'); await x.stage.appear(['bB']); x.clear(); x.say('b');
    } },
  { id: 's4', ch: 1, shot: 'aliceClose', state: { pots: { ...PUB, ...SEC, aM: ['a', 1, ''] } }, go: async x => {
      x.apply(); await x.stage.pour('aJ', 'aM', 'a'); await x.stage.pour('aR', 'aM', 'a'); x.say('a');
    } },
  { id: 's5', ch: 1, shot: 'bobClose', state: { pots: { ...PUB, ...SEC, aM: ['a', 1, 'JR'], bM: ['b', 1, ''] } }, go: async x => {
      x.apply(); await x.stage.pour('bJ', 'bM', 'b'); await x.stage.pour('bB', 'bM', 'b'); x.say('b');
    } },
  { id: 's6', ch: 2, shot: 'road', state: { pots: MIXED }, go: async x => {
      x.apply();
      await Promise.all([
        x.carry('aM', 'a', 'b', { courier: 0, slot: 1, peek: () => x.stage.copy('aM', 'eO', 3) }),
        x.carry('bM', 'b', 'a', { courier: 1, slot: 1, peek: () => x.stage.copy('bM', 'eV', 5) }),
      ]);
      if (!x.live()) return;
      await x.fly('eveClose'); x.say('e');
    } },
  { id: 's7', ch: 2, shot: 'eveClose', state: { pots: SEEN }, go: async x => {
      x.apply(); await x.stage.empty('eU1', 'e', 1); await x.stage.empty('eU2', 'e', 4);
      await x.stage.pour('eO', 'eU1', 'e'); await x.stage.pour('eO', 'eU2', 'e'); x.say('e');
    }, go2: async x => {
      x.apply(); await x.stage.empty('eX', 'e', 1);
      await x.stage.pour('eO', 'eX', 'e'); await x.stage.pour('eV', 'eX', 'e'); x.say('e', 'e2');
    } },
  { id: 's8', ch: 3, shot: 'aliceClose', state: { pots: SEEN }, go: async x => {
      x.apply(); await x.stage.pour('aR', 'bM', 'a'); x.say('a'); if (!x.live()) return;
      await x.stage.wait(1.2); x.clear(); await x.fly('bobClose');
      await x.stage.pour('bB', 'aM', 'b'); x.say('b'); x.celebrate();
    } },
  { id: 's9', ch: 3, shot: 'aliceClose', state: { pots: SHARED, numbers: true }, auto: true, go: async x => {
      x.apply(); x.say('a'); await x.stage.wait(4.5); if (!x.live()) return;
      x.clear(); await x.fly('eveClose'); x.say('e'); await x.stage.wait(4.5); if (!x.live()) return;
      x.clear(); await x.fly('bobClose'); x.say('b');
    } },
  { id: 's10', ch: 4, shot: 'road', state: { pots: { ...MIXED, ...EVE_N } }, go: async x => {
      x.apply();
      await Promise.all([x.carry('aM', 'a', 'e', { courier: 0, slot: 3 }), x.carry('bM', 'b', 'e', { courier: 1, slot: 5 })]);
      if (!x.live()) return;
      await x.fly('eveClose'); x.say('e');
    } },
  { id: 's11', ch: 4, shot: 'eveClose', state: { pots: CAUGHT }, go: async x => {
      x.apply(); await x.stage.empty('eK1', 'e', 1); await x.stage.empty('eK2', 'e', 4);
      for (const [src, dst] of [['eJ', 'eK1'], ['eJ', 'eK2'], ['eN', 'eK1'], ['eN', 'eK2']]) await x.stage.pour(src, dst, 'e');
      if (!x.live()) return;
      await x.fly('road');
      await Promise.all([x.carry('eK1', 'e', 'b', { courier: 0, slot: 1 }), x.carry('eK2', 'e', 'a', { courier: 1, slot: 1 })]);
      if (!x.live()) return;
      await x.fly('wide'); x.say('a'); x.say('b');
    } },
  { id: 's12', ch: 4, shot: 'aliceClose', state: { pots: SWAPPED }, go: async x => {
      x.apply(); await x.stage.pour('aR', 'eK2', 'a'); x.say('a'); if (!x.live()) return;
      await x.stage.wait(1); x.clear(); await x.fly('bobClose'); await x.stage.pour('bB', 'eK1', 'b'); x.say('b'); if (!x.live()) return;
      await x.stage.wait(1); x.clear(); await x.fly('eveClose');
      await x.stage.pour('eN', 'aM', 'e'); await x.stage.pour('eN', 'bM', 'e'); x.say('e');
    } },
  { id: 's13', ch: 4, shot: 'aliceClose', state: { pots: TWO_CHEST, chest: ['a', 0, 'JNR'] }, go: async x => {
      x.apply(); await x.carry(x.stage.chest, 'a', 'e', { slot: 1 }); if (!x.live()) return;
      await x.fly('eveClose'); await x.stage.openChest('e'); x.say('e'); await x.stage.tamper('BJN'); if (!x.live()) return;
      await x.carry(x.stage.chest, 'e', 'b', { slot: 0 }); if (!x.live()) return;
      await x.fly('bobClose'); await x.stage.openChest('b'); x.stage.st.chest[3] = 1; x.say('b');
    } },
  { id: 's14', ch: 5, shot: 'alice', state: { pots: PARADE, cert: true }, go: async x => {
      x.apply(); await x.fly('road');
      await x.carry('bM', 'b', 'e', { courier: 0, slot: 5 }); if (!x.live()) return;
      await x.carry('eK2', 'e', 'a', { courier: 1, slot: 1 }); if (!x.live()) return;
      await x.fly('aliceClose'); await x.stage.check('eK2', 'a'); x.say('a'); x.say('e');
    }, go2: async x => {
      x.apply(); await x.fly('road');
      await x.carry('bM', 'b', 'a', { courier: 0, slot: 1, peek: () => x.stage.copy('bM', 'eV', 5) }); if (!x.live()) return;
      await x.fly('aliceClose'); await x.stage.check('bM', 'a'); x.say('a', 'a2'); x.say('e', 'e2');
    } },
  // the wide shot is too far to read a pot's tag: a card over each table says what is on it
  { id: 's15', ch: 5, shot: 'wide', orbit: .02, state: { pots: SHARED }, recap: {
      a: [['J', 'pub'], ['R', 'secret'], ['BJR', 'never']],
      e: [['J', 'pub'], ['JR', 'seen'], ['BJ', 'seen']],
      b: [['J', 'pub'], ['B', 'secret'], ['BJR', 'never']] },
    // r105/r132: the last step is the doors out, each with its picture; the next episode is last, at the right
    doors: [
      { k: 'sandbox', img: 'img/door-sandbox.jpg', clip: 'img/door-sandbox.mp4', go: x => x.mode('sandbox') },
      { k: 'quiz', img: 'img/door-quiz.jpg', clip: 'img/door-quiz.mp4', go: x => x.mode('quiz') },
      { k: 'home', img: 'img/door-home.jpg', clip: 'img/door-home.mp4', href: '../' },
      { k: 'next', img: '../scytale/vignette.jpg', clip: 'img/door-next.mp4', href: '../scytale/' }] },
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
    onLang(() => this.render(true));
  }

  go(i) {
    i = Math.max(0, Math.min(STEPS.length - 1, i));
    this.i = i; this.seen = false; const tok = ++this.token, step = STEPS[i], c = this.ctx;
    location.hash = 'story=' + (i + 1);
    c.bubbles.clear(); this.said.clear();
    c.stage.apply(step.state);
    c.rig.setOrbit(0);
    c.rig.fly(step.shot, c.instant ? 0.001 : 2.2).then(() => {
      if (tok !== this.token) return;
      if (step.orbit) c.rig.setOrbit(step.orbit);
      if (step.auto) this.run(step.go);
    });
    this.render();
    // bubbles appear once the camera has mostly arrived
    setTimeout(() => { if (tok === this.token) { for (const s of step.say || []) this.say(s); this.cards(); } }, c.instant ? 0 : 1300);
  }

  say(who, key = who) {
    const step = STEPS[this.i];
    this.said.set(who, key);
    this.ctx.bubbles.show('story-' + who, who, raw('steps')[step.id][key], () => this.ctx.stage.head(who),
      // everyone stands left of their table and speaks from that side: above the head, the bubble
      // would cover the tags of the table's back row
      { side: 'left' });
  }

  // the step's recap cards, one over each table (re-made after a language switch)
  cards() {
    for (const [k, rows] of Object.entries(STEPS[this.i].recap || {}))
      this.ctx.bubbles.card('recap-' + k, k, rows, () => this.ctx.stage.slotSpot(k, 4).setY(3.4));
  }

  render(langOnly = false) {
    const step = STEPS[this.i], s = raw('steps')[step.id];
    this.el.title.textContent = s.t; render(this.el.text, s.p);
    this.el.count.textContent = t('nav.count', { i: this.i + 1, n: STEPS.length });
    this.el.prev.disabled = this.i === 0; this.el.next.disabled = this.i === STEPS.length - 1;
    this.ctx.stage.relabel();
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
    if (langOnly && this.ctx.bubbles.items.has('recap-a')) this.cards();
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
    c.bubbles.clear(); this.said.clear(); c.rig.setOrbit(0);
    const x = {
      stage: st, rig: c.rig, live,
      // back to the step's own state (or another one), unless the visitor has moved on
      apply: state => { if (live()) st.apply(state ?? STEPS[this.i].state); },
      fly: shot => live() ? c.rig.fly(shot) : null,
      say: (who, key) => live() && this.say(who, key),
      clear: () => { if (live()) { c.bubbles.clear(); this.said.clear(); } },
      // one courier: the camera rides behind him; two at once: the caller has framed the road
      carry: async (obj, from, to, o = {}) => {
        if (typeof obj === 'string') obj = st.pot(obj);
        if (o.courier === undefined) c.rig.chase(st.couriers[0]);
        return st.carry(obj, from, to, o);
      },
      celebrate: () => live() && c.celebrate(),
      mode: m => c.setMode(m),
    };
    try { await fn(x); } finally { if (live()) { buttons.forEach(b => b.disabled = false); this.lit(); } }
  }
}
