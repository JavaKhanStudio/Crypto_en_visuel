// The guided story of episode 11: 13 steps in 4 chapters, all in Alice's keep. Each step is a beat
// of the room (room.js), names what the corner card shows, and pins Alice's bubble. A step's text
// takes its numbers from the real bytes ({x}, {k}, … filled by vars()), so it says what the cubes show.
import { t, raw, lang, onLang, fill } from './i18n.js';
import { linkify } from '../../xref.js';
import { render } from '../../lib/md.js';
import * as A from './values.js';
import { renderDoors } from '../../lib/doors.js';

// which run the room plays: Alice's, or the same block with its first letter changed (the last chapter)
export const dataOf = run => run === 'changed' ? (c => ({ st: c, ref: c.ref }))(A.changed(lang)) : { st: A.story(lang) };

export const STEPS = [
  { id: 'intro', ch: 0, say: ['a'], refs: { '1.2': 5 } },
  { id: 'block', ch: 0, say: ['a'] },
  { id: 'state', ch: 0, say: ['a'] },
  { id: 'key', ch: 0, say: ['a'] },
  { id: 'ark0', ch: 1, say: ['a'] },
  { id: 'sub1', ch: 1, say: ['a'] },
  { id: 'shift1', ch: 1, say: ['a'] },
  { id: 'mix1', ch: 1, say: ['a'] },
  { id: 'ark1', ch: 1, say: ['a'] },
  { id: 'fast', ch: 2, say: ['a'] },
  { id: 'last', ch: 2, say: ['a'], refs: { '1.2': 8 } },
  { id: 'spread', ch: 3, say: ['a'], run: 'changed' },
  // the last step is the doors out, each with its picture; the episode it opens, 1.2, is last, at the right
  { id: 'end', ch: 3, refs: { '1.2': 5 }, doors: [
      { k: 'sandbox', img: 'img/door-sandbox.jpg', go: x => x.mode('sandbox') },
      { k: 'quiz', img: 'img/door-quiz.jpg', en: 'img/door-quiz.en.jpg', go: x => x.mode('quiz') },
      { k: 'home', img: 'img/door-home.jpg', href: '../' },
      { k: 'next', img: '../eve-lit-tout/vignette.jpg', href: '../eve-lit-tout/', hash: '#story=5' }] },
];

// the numbers a step's text quotes, from Alice's run
export function vars(st = A.story(lang)) {
  const o = st.tr.ops, col = b => A.hex(b.slice(0, 4));
  return { p1: new TextDecoder().decode(st.P1), x: A.hx(st.X1[0]), k: A.hx(st.tr.K[0][0]), y: A.hx(o[0].to[0]),
    s: A.hx(o[1].from[0]), sy: A.hx(o[1].to[0]), col: col(o[3].from), mcol: col(o[3].to) };
}

export class Story {
  constructor(ctx) {
    this.ctx = ctx; this.i = 0; this.token = 0;
    this.el = { title: document.getElementById('step-title'), text: document.getElementById('step-text'),
      actions: document.getElementById('step-actions'), count: document.getElementById('step-count'),
      chapters: document.getElementById('chapters'), prev: document.getElementById('prev'), next: document.getElementById('next') };
    this.el.prev.onclick = () => this.go(this.i - 1);
    this.el.next.onclick = () => this.go(this.i + 1);
    onLang(() => { if (this.ctx.mode() !== 'story') return; this.load(STEPS[this.i], true); this.render(true); this.card(); });
  }

  card() { if (this.ctx.mode() === 'story') this.ctx.renderCard({ view: STEPS[this.i].id, ...this.ctx.room.data }); }

  // the room holds the run the step needs; a new language rebuilds it (the labels, and P1 in that language)
  load(step, force = false) {
    const room = this.ctx.room, run = step.run || 'alice';
    if (force || room.run !== run || !room.m) { room.run = run; room.build(dataOf(run)); }
  }

  go(i) {
    i = Math.max(0, Math.min(STEPS.length - 1, i));
    this.i = i; const tok = ++this.token, step = STEPS[i], c = this.ctx;
    location.hash = 'story=' + (i + 1);
    c.bubbles.clear();
    this.load(step); c.room.beat(step.id);
    this.card(); this.render();
    setTimeout(() => { if (tok === this.token) for (const s of step.say || []) this.say(s); }, c.instant ? 0 : 900);
  }

  say(who, text) {
    const step = STEPS[this.i];
    this.ctx.bubbles.show('story-' + who, who, text ?? raw('steps')[step.id][who], () => this.ctx.room.anchor());
  }

  render(langOnly = false) {
    const step = STEPS[this.i], s = raw('steps')[step.id];
    this.el.title.textContent = s.t; render(this.el.text, fill(s.p, vars())); linkify(this.el.text, lang, step.refs);   // « épisode 1.2 » links to its step (r119)
    // « Étape 6 / 13 »; on a phone the word hides (style.css) so the nav row holds ↻ as well
    const [, word, num] = t('nav.count', { i: this.i + 1, n: STEPS.length }).match(/^(\D*?)\s*(\d.*)$/);
    this.el.count.innerHTML = `<span class="word">${word} </span>${num}`;
    this.el.prev.disabled = this.i === 0; this.el.next.disabled = this.i === STEPS.length - 1;
    this.el.chapters.innerHTML = '';
    raw('ch').forEach((name, k) => {
      const b = document.createElement('button'); b.textContent = `${k + 1}. ${name}`;
      b.classList.toggle('active', step.ch === k);
      b.onclick = () => this.go(STEPS.findIndex(x => x.ch === k));
      this.el.chapters.appendChild(b);
    });
    // every beat plays on arrival; ↻ plays it again from the start. It sits in the nav row, beside
    // Précédent, so a phone keeps the row an actions line would take (its word hides there, style.css)
    this.el.actions.innerHTML = ''; document.getElementById('replay')?.remove();
    if (!step.doors) {
      const b = document.createElement('button'); b.id = 'replay'; b.title = t('nav.replay');
      b.innerHTML = `↻<span class="word"> ${t('nav.replay')}</span>`;
      b.onclick = () => { this.ctx.room.play(); };
      this.el.prev.after(b);
    }
    renderDoors(this.el.actions, step.doors, s.doors, { lang, setMode: m => this.ctx.setMode(m), phone: 'row' });
    if (langOnly) for (const s2 of step.say || []) this.say(s2);
  }
}
