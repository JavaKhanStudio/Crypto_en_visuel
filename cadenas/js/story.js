// The guided story: 10 steps in 5 chapters. Each step puts the props where the story
// has reached (so Back, Next and the chapter chips always land somewhere consistent),
// flies the camera, pins its bubbles, and offers buttons. auto: the step's action
// plays by itself once the camera has landed (its button replays it).
import { t, raw, lang, onLang } from './i18n.js';
import { render } from '../../ficelle/lib/md.js';
import { renderDoors } from '../../ficelle/lib/doors.js';

export const STEPS = [
  { id: 's1', ch: 0, shot: 'intro', orbit: .03, state: {}, say: ['a', 'e'] },
  { id: 's2', ch: 0, shot: 'alice', state: { lock: 'alice', locked: true }, go: async x => {
      x.apply(); await x.carry('a', 'b'); if (!x.live()) return;
      await x.fly('bob'); x.say('b');
    }, go2: async x => {
      x.apply({ keyWith: true }); await x.carry('a', 'e'); if (!x.live()) return;
      await x.fly('eveClose'); await x.stage.openWith(x.stage.aliceKey, 'e'); x.say('e');
    } },
  { id: 's3', ch: 1, shot: 'bench', state: {}, auto: true, go: async x => {
      x.apply(); await x.stage.makeLocks(); x.say('b');
    } },
  { id: 's4', ch: 1, shot: 'wide', state: { made: 9 }, auto: true, go: async x => {
      x.apply(); await x.stage.distribute(); if (!x.live()) return;
      await x.fly('eve'); x.say('e');
    } },
  { id: 's5', ch: 2, shot: 'aliceClose', state: { dist: true }, go: async x => {
      x.apply(); await x.stage.lockBox(); x.say('a');
    } },
  { id: 's6', ch: 2, shot: 'aliceClose', state: { dist: true, lock: 'bob', locked: true }, go: async x => {
      x.apply(); await x.stage.tryFail('a'); x.say('a');
    } },
  { id: 's7', ch: 3, shot: 'road', state: { dist: true, lock: 'bob', locked: true }, go: async x => {
      x.apply(); await x.carry('a', 'e'); if (!x.live()) return;
      await x.fly('eveClose'); x.say('e');
    } },
  { id: 's8', ch: 3, shot: 'eveClose', state: { dist: true, lock: 'bob', locked: true, box: 'e' }, go: async x => {
      x.apply(); await x.stage.tryFail('e', { withLock: true }); x.say('e');
    } },
  { id: 's9', ch: 4, shot: 'eve', state: { dist: true, lock: 'bob', locked: true, box: 'e' }, go: async x => {
      x.apply(); await x.carry('e', 'b'); if (!x.live()) return;
      await x.fly('bobClose'); await x.stage.openWith(x.stage.bobKey, 'b'); if (!x.live()) return;
      x.say('b'); x.celebrate();
    } },
  // r105/r131: the last step is the doors out, each with its picture; the next episode is last, at the right
  { id: 's10', ch: 4, shot: 'bob', orbit: .02, state: { made: 9, labels: true }, doors: [
      { k: 'sandbox', img: 'img/door-sandbox.jpg', clip: 'img/door-sandbox.mp4', go: x => x.mode('sandbox') },
      { k: 'quiz', img: 'img/door-quiz.jpg', clip: 'img/door-quiz.mp4', go: x => x.mode('quiz') },
      { k: 'home', img: '../ficelle/assets/doors/home.jpg', clip: 'img/door-home.mp4', href: '../' },
      { k: 'next', img: '../diffie-hellman/vignette.jpg', clip: 'img/door-next.mp4', href: '../diffie-hellman/' }] },
];

export class Story {
  constructor(ctx) {
    this.ctx = ctx; this.i = 0; this.token = 0;
    this.el = { title: document.getElementById('step-title'), text: document.getElementById('step-text'),
      actions: document.getElementById('step-actions'), count: document.getElementById('step-count'),
      chapters: document.getElementById('chapters'), prev: document.getElementById('prev'), next: document.getElementById('next') };
    this.el.prev.onclick = () => this.go(this.i - 1);
    this.el.next.onclick = () => this.go(this.i + 1);
    onLang(() => this.render(true));
  }

  go(i) {
    i = Math.max(0, Math.min(STEPS.length - 1, i));
    this.i = i; this.seen = false; const tok = ++this.token, step = STEPS[i], c = this.ctx;
    location.hash = 'story=' + (i + 1);
    c.bubbles.clear();
    c.stage.apply(step.state);
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

  say(who, text) {
    const step = STEPS[this.i];
    this.ctx.bubbles.show('story-' + who, who, text || raw('steps')[step.id][who], () => this.ctx.stage.head(who));
  }

  render(langOnly = false) {
    const step = STEPS[this.i], s = raw('steps')[step.id];
    this.el.title.textContent = s.t; render(this.el.text, s.p);
    this.el.count.textContent = t('nav.count', { i: this.i + 1, n: STEPS.length });
    this.el.prev.disabled = this.i === 0; this.el.next.disabled = this.i === STEPS.length - 1;
    this.ctx.stage.setLabels(this.ctx.stage.st?.labels ?? false, raw('label'));
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
    renderDoors(this.el.actions, step.doors, s.doors, { lang, setMode: m => this.ctx.setMode(m) });
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
    if (langOnly) for (const id of this.ctx.bubbles.items.keys()) { const who = id.replace('story-', ''); if (s[who]) this.say(who); }
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
    c.bubbles.clear(); c.rig.setOrbit(0);
    const x = {
      stage: st, rig: c.rig, live,
      // back to the step's own state (plus a tweak), unless the visitor has moved on
      apply: extra => { if (live()) st.apply({ ...STEPS[this.i].state, ...extra }); },
      fly: shot => live() ? c.rig.fly(shot) : null,
      say: (who, text) => live() && this.say(who, text),
      carry: async (from, to) => { c.rig.chase(st.courier); await st.carry(from, to); },
      celebrate: () => live() && c.celebrate(),
      mode: m => c.setMode(m),
    };
    try { await fn(x); } finally { if (live()) { buttons.forEach(b => b.disabled = false); this.lit(); } }
  }
}
