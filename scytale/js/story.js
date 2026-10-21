// The guided story: 12 steps in 5 chapters, on the course's slide « Une histoire de casse -
// La scytale ». Each step puts the sticks and the strip where the story has reached (so Back,
// Next and the chapter chips always land somewhere consistent), flies the camera, pins its
// bubbles, and offers buttons. auto: the step's action plays by itself once the camera has
// landed (its button replays it).
import { t, raw, lang, onLang } from './i18n.js';
import { render } from './md.js';

const N = 99;   // « every letter written »: write() stops at the end of the message
const BLANK = { strip: { on: null, at: 'a', written: 0 } };
const WOUND = { strip: { on: 'a', at: 'a', written: 0 } };
const WRITTEN = { strip: { on: 'a', at: 'a', written: N } };
const SENT = { strip: { on: null, at: 'a', written: N } };
const AT_EVE = { strip: { on: null, at: 'e', written: N } };
const AT_BOB = { strip: { on: null, at: 'b', written: N } };
const READ = { strip: { on: 'b', at: 'b', written: N } };

export const STEPS = [
  { id: 's1', ch: 0, shot: 'intro', orbit: .03, state: BLANK, say: ['a', 'b', 'e'] },
  { id: 's2', ch: 1, shot: 'alice', state: BLANK, say: ['a'], go: async x => {
      x.apply(); x.say('a'); await x.stage.wind('a');
    } },
  { id: 's3', ch: 1, shot: 'aliceStick', state: WOUND, auto: true, go: async x => {
      x.apply(); await x.stage.write(); x.say('a');
    } },
  { id: 's4', ch: 1, shot: 'aliceStick', state: WRITTEN, auto: true, go: async x => {
      x.apply(); await x.stage.unwind(); if (!x.live()) return;
      await x.fly('aliceStrip'); x.say('a');
    } },
  { id: 's5', ch: 1, shot: 'aliceStrip', state: SENT, say: ['a'], go: async x => {
      x.apply(); await x.stage.showOrder();
    } },
  { id: 's6', ch: 2, shot: 'road', state: SENT, auto: true, go: async x => {
      x.apply(); await x.carry('a', 'e'); if (!x.live()) return;
      await x.fly('eveStrip'); x.say('e'); x.say('n');
    } },
  { id: 's7', ch: 2, shot: 'eve', state: AT_EVE, go: async x => {
      x.apply(); await x.stage.wind('eT'); if (!x.live()) return;
      await x.fly('eveThin'); await x.stage.readAll('eT'); x.say('e');
    }, go2: x => x.stage.st.strip.on === 'eT' ? x.stage.next('eT') : null },
  { id: 's8', ch: 2, shot: 'eve', state: AT_EVE, go: async x => {
      x.apply(); await x.stage.wind('eG'); if (!x.live()) return;
      await x.fly('eveThick'); await x.stage.readAll('eG'); x.say('e');
    }, go2: x => x.stage.st.strip.on === 'eG' ? x.stage.next('eG') : null },
  { id: 's9', ch: 3, shot: 'road', state: AT_EVE, auto: true, go: async x => {
      x.apply(); await x.carry('e', 'b'); if (!x.live()) return;
      await x.fly('bob'); x.say('b');
    } },
  { id: 's10', ch: 3, shot: 'bob', state: AT_BOB, go: async x => {
      x.apply(); await x.stage.wind('b'); if (!x.live()) return;
      await x.fly('bobStick'); await x.stage.readAll('b', 1.3); if (!x.live()) return;
      x.say('b'); x.celebrate();
    }, go2: x => x.stage.st.strip.on === 'b' ? x.stage.next('b') : null },
  { id: 's11', ch: 4, shot: 'wide', state: READ, say: ['a', 'e'] },
  // r105/r133: the last step is the doors out, each with its picture; the next episode is last, at the right
  { id: 's12', ch: 4, shot: 'wide', orbit: .02, state: READ, doors: [
      { k: 'sandbox', img: 'img/door-sandbox.jpg', clip: 'img/door-sandbox.mp4', go: x => x.mode('sandbox') },
      { k: 'quiz', img: 'img/door-quiz.jpg', clip: 'img/door-quiz.mp4', perLang: true, go: x => x.mode('quiz') },
      { k: 'home', img: 'img/door-home.jpg', clip: 'img/door-home.mp4', href: '../' },
      { k: 'next', img: '../enigma/vignette.jpg', clip: 'img/door-next.mp4', href: '../enigma/' }] },
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
    onLang(() => { this.ctx.stage.apply({ ...this.ctx.stage.st, ...this.base() }); this.render(true); });
  }

  // what every step shares: the message in the current language, Alice's 4 letters per turn
  base() { return { msg: this.ctx.message(), k: 4, hide: [] }; }
  state(i = this.i) { const s = STEPS[i].state; return { ...this.base(), ...s, strip: { ...s.strip } }; }

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
    const anchor = who === 'n' ? () => this.ctx.stage.flatSpot('e').add({ x: 3.5, y: -.4, z: 3 }) : () => this.ctx.stage.head(who);
    this.ctx.bubbles.show('story-' + who, who, raw('steps')[step.id][key], anchor);
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
    this.el.actions.classList.toggle('doors', !!step.doors);
    // r182/r216: a door whose picture is words (the quiz) has one file per language, door-quiz.<lang>.*
    const inLang = (d, f) => d.perLang && lang !== 'fr' ? f.replace(/\.\w+$/, `.${lang}$&`) : f;
    for (const d of step.doors || []) {
      const [name, what] = s.doors[d.k], a = document.createElement('a');
      a.className = 'door' + (d.k === 'next' ? ' next' : '');
      a.innerHTML = `<span class="pic"><img src="${inLang(d, d.img)}" alt=""></span><b>${name}</b><span>${what}</span>`;
      // r105 (Simon): on hover, a 4 s clip of where the door leads loops; it stops where it is when the
      // pointer leaves and goes on from there. A phone has no hover: it keeps the picture.
      if (d.clip && matchMedia('(hover: hover)').matches) {
        const v = document.createElement('video');
        Object.assign(v, { src: inLang(d, d.clip), muted: true, loop: true, playsInline: true, preload: 'none' });
        v.addEventListener('playing', () => v.classList.add('on'), { once: true });
        a.firstChild.appendChild(v);
        a.onmouseenter = () => v.play().catch(() => {}); a.onmouseleave = () => v.pause();
      }
      if (d.href) a.href = d.href + '?lang=' + lang; else { a.href = '#'; a.onclick = e => { e.preventDefault(); d.go({ mode: m => this.ctx.setMode(m) }); }; }
      this.el.actions.appendChild(a);
    }
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

  // keep: a small action on top of where the stage is (turning the stick), no reset, bubbles stay
  async run(fn, keep = false) {
    const tok = this.token, c = this.ctx, st = c.stage;
    const live = () => tok === this.token;
    const buttons = [...this.el.actions.children, this.el.play].filter(Boolean);
    buttons.forEach(b => b.disabled = true);
    if (!keep) { c.bubbles.clear(); this.said.clear(); }
    c.rig.setOrbit(0);
    const x = {
      stage: st, rig: c.rig, live,
      // back to the step's own state, unless the visitor has moved on
      apply: () => { if (live()) st.apply(this.state()); },
      fly: shot => live() ? c.rig.fly(shot) : null,
      say: (who, key) => live() && this.say(who, key),
      clear: () => { if (live()) { c.bubbles.clear(); this.said.clear(); } },
      // the camera rides behind the messenger
      carry: (from, to) => { c.rig.chase(st.couriers[0]); return st.carry(from, to); },
      celebrate: () => live() && c.celebrate(),
      mode: m => c.setMode(m),
    };
    try { await fn(x); } finally { if (live()) { buttons.forEach(b => b.disabled = false); this.lit(); } }
  }
}
