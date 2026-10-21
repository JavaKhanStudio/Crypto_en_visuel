// The guided story: 10 steps in 5 chapters, on the course's slides about HMAC (« HMAC »,
// « HMAC - La timing attack »). Alice's badge passes; Eve cannot forge one; but the hasty guard's
// == leaks the answer time, so Eve finds the HMAC letter by letter; a compare_digest guard does not.
// Each step puts the room where the story has reached (so Back, Next and the chapter chips always
// land somewhere consistent), flies the camera, pins its bubbles, and offers buttons.
import { t, raw, lang, onLang } from './i18n.js';
import { KEY, MSG_A, MSG_E, MAC_A, guess } from './data.js';
import { portrait } from './camera.js';

// A story step's state for the stage (see Stage.apply): the guard on duty, the message Eve is
// after, the prefix she has recovered so far, and which corner card to show.
const code = { guard: 'eq', msg: MSG_A, table: { kind: 'code' } };
const hunt = (prefix = '') => ({ guard: 'eq', msg: MSG_E, prefix, table: { kind: 'hunt' } });
const safe = { guard: 'cd', msg: MSG_E, table: { kind: 'safe' } };
const recap = { guard: 'cd', msg: MSG_E, table: { kind: 'recap' } };

export const STEPS = [
  // r219 (Simon's pick B): a phone has room above the panel for one bubble, so there the three
  // speak in turns, each bubble replacing the one before; the desktop keeps all three at once
  { id: 's1', ch: 0, shot: 'intro', orbit: .02, state: code, say: ['a', 'g', 'e'], turns: ['a', 'e', 'g'] },
  { id: 's2', ch: 0, shot: 'booth', state: code, go: async x => {
      x.apply(); const r = await x.stage.present('a', MSG_A, MAC_A); if (!r) return;
      await x.fly('gate'); if (!await x.stage.answer(r)) return; x.say('a');
    } },
  { id: 's3', ch: 1, shot: 'booth', state: { ...hunt(), table: { kind: 'code' } }, go: async x => {
      x.apply(); const r = await x.stage.present('e', MSG_E, guess('')); if (!r) return;
      if (!await x.stage.answer(r)) return; x.say('e');
    } },
  { id: 's4', ch: 1, shot: 'eve', state: hunt(), go: async x => {
      x.apply();
      let r = await x.stage.present('e', MSG_E, guess('', '0')); if (!r) return;         // wrong first letter: the shortest "no"
      if (!await x.stage.answer(r)) return; if (!await x.stage.wait(.4)) return;
      r = await x.stage.present('e', MSG_E, guess('', 'b')); if (!r) return;             // right first letter: one letter longer
      if (!await x.stage.answer(r)) return; x.say('e');
    } },
  { id: 's5', ch: 2, shot: 'chart', state: hunt(), go: async x => {
      x.apply(); if (!await x.stage.round({ full: 5 })) return; x.say('e');
    } },
  { id: 's6', ch: 2, shot: 'chart', state: hunt('b'), go: async x => {
      x.apply(); if (!await x.stage.round({ full: 3 })) return; x.say('e');
    } },
  { id: 's7', ch: 2, shot: 'wide', state: hunt('b2'), go: async x => {
      x.apply(); if (!await x.stage.finish()) return; await x.fly('gate'); x.say('e');
    } },
  { id: 's8', ch: 3, shot: 'chart', state: safe, go: async x => {
      x.apply(); if (!await x.stage.noise()) return; x.say('e');
    } },
  { id: 's9', ch: 3, shot: 'wide', orbit: .02, state: recap, say: ['a', 'e'] },
  // r105/r137: the last step is the doors out, each with its picture; the next episode is last, at the right
  { id: 's10', ch: 4, shot: 'wide', orbit: .02, state: recap, doors: [
      { k: 'sandbox', img: 'img/door-sandbox.jpg', clip: 'img/door-sandbox.mp4', go: x => x.mode('sandbox') },
      { k: 'quiz', img: 'img/door-quiz.jpg', clip: 'img/door-quiz.mp4', go: x => x.mode('quiz') },
      { k: 'home', img: 'img/door-home.jpg', clip: 'img/door-home.mp4', href: '../' },
      { k: 'next', img: '../kasiski/vignette.jpg', clip: 'img/door-next.mp4', href: '../kasiski/' }] },
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
    setTimeout(() => {
      if (tok !== this.token) return;
      if (step.turns && portrait()) this.turns(step.turns, tok); else for (const s of step.say || []) this.say(s);
    }, c.instant ? 0 : 1300);
  }

  // one bubble at a time: each stays long enough to be typed in and read, then gives way to the next;
  // the last one stays
  turns(list, tok, k = 0) {
    if (tok !== this.token) return;
    this.say(list[k]);
    if (k === list.length - 1) return;
    const hold = 1500 + raw('steps')[STEPS[this.i].id][list[k]].length * 50;
    setTimeout(() => {
      if (tok !== this.token) return;
      this.ctx.bubbles.hide('story-' + list[k]); this.said.delete(list[k]);
      setTimeout(() => this.turns(list, tok, k + 1), 400);   // the old bubble fades out first
    }, hold);
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
      // r105 (Simon): on hover, a 4 s clip of where the door leads loops; it stops where it is when the
      // pointer leaves and goes on from there. A phone has no hover: it keeps the picture.
      if (d.clip && matchMedia('(hover: hover)').matches) {
        const v = document.createElement('video');
        Object.assign(v, { src: d.clip, muted: true, loop: true, playsInline: true, preload: 'none' });
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
