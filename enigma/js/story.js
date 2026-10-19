// The guided story: 13 steps in 6 chapters, on the course's slide « Enigma - À la main ». Each
// step puts the machines where the story has reached (so Back, Next and the chapter chips always
// land somewhere consistent), flies the camera, pins its bubbles, and offers buttons.
// auto: the step's action plays by itself once the camera has landed (its button replays it).
import { t, raw, lang, onLang } from './i18n.js';
import { press, type } from './enigma.js';
import { SEGS } from './stage.js';

// the slide's presses: O at AAA, O at AAB; OUI and TVG from AAA
const O1 = press('O', 'AAA'), O2 = press('O', 'AAB'), OUI = type('OUI', 'AAA'), TVG = type('TVG', 'AAA');
const full = recs => recs.map(rec => ({ rec, n: SEGS }));
const MSG_A = { plain: 'OUI', cipher: 'TVG', from: 'AAA' }, MSG_B = { plain: 'TVG', cipher: 'OUI', from: 'AAA' };

const CLOSED = {};
const OPEN = { apart: { a: 1 } };
const PRESSED = { apart: { a: 1 }, pos: { a: 'AAB', b: 'AAA' }, down: { a: 'O' }, shown: [{ m: 'a', rec: O1, n: 0 }], rows: [{ rec: O1, n: 0 }] };
const HALF = { ...PRESSED, shown: [{ m: 'a', rec: O1, n: 4 }], rows: [{ rec: O1, n: 4 }] };
const ONE = { apart: { a: 1 }, pos: { a: 'AAB', b: 'AAA' }, ghost: [{ m: 'a', rec: O1 }], rows: full([O1]) };
const TWO = { apart: { a: 1 }, pos: { a: 'AAC', b: 'AAA' }, down: { a: 'O' }, lit: { a: 'I' }, ghost: [{ m: 'a', rec: O1 }], shown: [{ m: 'a', rec: O2, n: SEGS }], rows: full([O1, O2]) };
const TYPED = { apart: { a: 1 }, pos: { a: 'AAD', b: 'AAA' }, rows: full(OUI), msg: MSG_A, pads: { a: 'TVG' } };
const HEARD = { ...TYPED, apart: { a: 1, b: 1 }, pads: { a: 'TVG', e: 'TVG' } };
const AT_BOB = { ...HEARD, rows: [], msg: null, card: 'b' };
const READ = { ...HEARD, pos: { a: 'AAD', b: 'AAD' }, rows: full(TVG), msg: MSG_B, card: 'b', pads: { a: 'TVG', e: 'TVG', b: 'OUI' } };

export const STEPS = [
  { id: 's1', ch: 0, shot: 'intro', orbit: .02, state: CLOSED, say: ['a', 'b', 'e'] },
  { id: 's2', ch: 0, shot: 'aliceMachine', state: CLOSED, say: ['a'], go: async x => {
      x.apply(); x.fly('aliceDrum'); await x.stage.apart('a', 1, 2.6);
    } },
  { id: 's3', ch: 0, shot: 'aliceDrum', state: OPEN, say: ['a'], go: async x => {
      x.apply(); await x.stage.tour('a');
    } },
  { id: 's4', ch: 1, shot: 'aliceDrum', state: OPEN, go: async x => {
      x.apply(); await x.stage.pressKey('a', 'O'); x.say('a');
    } },
  { id: 's5', ch: 1, shot: 'aliceDrum', state: PRESSED, go: async x => {
      x.apply(); await x.stage.current('a', 4); x.say('a');
    } },
  { id: 's6', ch: 1, shot: 'aliceDrum', state: HALF, go: async x => {
      x.apply(); await x.stage.current('a', SEGS); x.say('a');
    } },
  { id: 's7', ch: 2, shot: 'aliceDrum', state: ONE, go: async x => {
      x.apply(); if (!await x.stage.pressKey('a', 'O')) return; await x.stage.current('a', SEGS); x.say('a');
    } },
  { id: 's8', ch: 2, shot: 'aliceDrum', state: TWO, say: ['a'], go: async x => {
      x.apply(); await x.stage.replay('a', [O1, O2]);
    } },
  { id: 's9', ch: 3, shot: 'aliceDrum', state: OPEN, go: async x => {
      x.apply(); if (!await x.stage.type('a', 'OUI', 1.6)) return;
      x.stage.st.msg = MSG_A; x.stage.relabel(); x.say('a');
    } },
  { id: 's10', ch: 3, shot: 'radio', state: TYPED, auto: true, go: async x => {
      x.apply(); if (!await x.stage.radio('TVG')) return; await x.fly('eve'); x.say('e');
    } },
  { id: 's11', ch: 4, shot: 'bobDrum', state: AT_BOB, go: async x => {
      x.apply(); if (!await x.stage.type('b', 'TVG', 1.6)) return;
      x.stage.st.msg = MSG_B; x.stage.relabel(); x.say('b'); x.celebrate();
    } },
  { id: 's12', ch: 5, shot: 'wide', state: READ, say: ['a', 'e'] },
  // r105/r121: the last step is the doors out, each with its picture; the next episode is last, at the right
  { id: 's13', ch: 5, shot: 'wide', orbit: .02, state: READ, doors: [
      { k: 'sandbox', img: 'img/door-sandbox.jpg', go: x => x.mode('sandbox') },
      { k: 'quiz', img: 'img/door-quiz.jpg', go: x => x.mode('quiz') },
      { k: 'home', img: 'img/door-home.jpg', href: '../' },
      { k: 'next', img: '../enigma-reglage/vignette.jpg', href: '../enigma-reglage/' }] },
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
    this.el.actions.classList.toggle('doors', !!step.doors);
    for (const d of step.doors || []) {
      const [name, what] = s.doors[d.k], a = document.createElement('a');
      a.className = 'door' + (d.k === 'next' ? ' next' : '');
      a.innerHTML = `<span class="pic"><img src="${d.img}" alt=""></span><b>${name}</b><span>${what}</span>`;
      if (d.href) a.href = d.href + '?lang=' + lang; else { a.href = '#'; a.onclick = e => { e.preventDefault(); d.go({ mode: m => this.ctx.setMode(m) }); }; }
      this.el.actions.appendChild(a);
    }
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
