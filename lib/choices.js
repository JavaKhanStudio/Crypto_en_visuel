// r505 (r420, Simon: « a story told step by step, where the user can make choices »): the choice
// engine of a recap, one for the whole series (episode 1.7 « À toi de jouer » first; a later recap on
// another subject imports it too). A step offers 3 choices; the one picked plays its animation and
// its consequence; a wrong one ends with the three shown again, the played ones marked red; a right
// one offers to continue OR to try another, and the three then come back with the right one green.
// The marks stay with their step for the visit, so going back to a step shows what was played there.
//
// An episode keeps only its data and its scenes:
//     import { Choices } from '../../lib/choices.js';
//     const choices = new Choices(el, { t, render, play: (choice, live) => ..., onSolve, onContinue });
//     choices.show(step, words, { last });
// step = { id, choices: [3 × { k, right, icon? }] }; words = { q, choices: { <k>: [name, line, outcome] } },
// from the episode's i18n. play(choice, live) is the episode's animation, a promise; live() turns false
// when the reader has left the step. t(key) reads the engine's words: choices.wrong, choices.right,
// choices.continue, choices.again (the episode's i18n, fr and en). render(el, text) writes an outcome
// (lib/md.js and the episode's linkify); without it, plain text.
// Its look is this file's (the lib/doors.js pattern), injected once.
// Hooks for tests: .choices[data-state=pick|playing|wrong|right], .choice[data-k][data-mark=wrong|right],
// #choice-verdict[data-verdict=wrong|right], #choice-continue, #choice-again.

const CSS = `
.choices { margin-top: 10px; }
.choices .q { margin: 0 0 6px; font: 600 14px var(--sans); color: var(--b); }
.choice-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.choice { display: grid; gap: 2px; align-content: start; text-align: left; padding: 8px 10px; border-radius: 12px; font-size: 12.5px; line-height: 1.3; }
.choice .icon { font-size: 20px; } .choice b { font-size: 14px; color: var(--ink); } .choice span:last-child { color: var(--muted); }
.choice[data-mark] { position: relative; }
.choice[data-mark]::after { position: absolute; top: 6px; right: 9px; font: 700 15px var(--sans); }
.choice[data-mark=wrong] { background: rgba(255, 77, 94, .16); border-color: #ff4d5e; }
.choice[data-mark=wrong]::after { content: '✗'; color: #ff8f9a; }
.choice[data-mark=right] { background: rgba(95, 227, 154, .14); border-color: var(--ok); }
.choice[data-mark=right]::after { content: '✓'; color: var(--ok); }
.choice.playing { border-color: var(--b); box-shadow: 0 0 0 2px rgba(255, 194, 77, .5); opacity: 1; }
.choices[data-state=playing] .choice:disabled:not(.playing) { opacity: .35; }
.choices[data-state=right] .choice-row, .choices[data-state=right] .q { display: none; }
#choice-verdict { margin: 0 0 8px; padding: 7px 10px; border-radius: 10px; font-size: 13.5px; border-left: 3px solid; }
#choice-verdict:empty { display: none; }
#choice-verdict[data-verdict=wrong] { background: rgba(255, 77, 94, .1); border-color: #ff4d5e; }
#choice-verdict[data-verdict=right] { background: rgba(95, 227, 154, .09); border-color: var(--ok); }
#choice-verdict > b { display: block; margin-bottom: 2px; font: 700 14px var(--sans); }
#choice-verdict[data-verdict=wrong] > b { color: #ff8f9a; } #choice-verdict[data-verdict=right] > b { color: var(--ok); }
#choice-verdict p { margin: 0; } #choice-verdict p + p { margin-top: 4px; }
.choice-next { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
.choice-next:empty { display: none; }
@media (max-width: 720px) {
  .choice-row { gap: 5px; } .choice { padding: 6px 7px; font-size: 11.5px; }
  .choice .icon { font-size: 16px; } .choice b { font-size: 12.5px; }
  .choice span:last-child { display: none; }
  #choice-verdict { font-size: 12.5px; padding: 6px 8px; } }`;

if (!document.getElementById('choices-style')) {
  const style = document.createElement('style');
  style.id = 'choices-style'; style.textContent = CSS; document.head.append(style);
}

export class Choices {
  constructor(el, { t, render = (to, text) => { to.textContent = text; }, play, onSolve = () => {}, onContinue = () => {}, onPick = () => {} }) {
    Object.assign(this, { el, t, render, play, onSolve, onContinue, onPick });
    this.marks = {}; this.token = 0; this.step = null; this.state = null;
  }

  // what the reader has played on a step: { <k>: 'wrong' | 'right' }
  played(id = this.step?.id) { return this.marks[id] ??= {}; }
  solved(id = this.step?.id) { return Object.values(this.played(id)).includes('right'); }

  // a step's three choices, with the marks already played there; last: no step after it (no « continue »)
  show(step, words, { last = false } = {}) {
    this.step = step; this.words = words; this.last = last; this.token++;
    this.state = 'pick'; this.verdict = null; this.draw();
  }
  // the reader left the step: a running animation is cancelled
  stop() { this.token++; this.el.replaceChildren(); this.step = null; }
  // the language changed: the same state, in the other words
  reword(words) { if (!this.step) return; this.words = words; this.draw(); }

  draw() {
    const { step, words, t } = this, marks = this.played(), box = document.createElement('div');
    box.className = 'choices'; box.dataset.state = this.state;
    const verdict = document.createElement('div'); verdict.id = 'choice-verdict';
    if (this.verdict) {
      const c = this.verdict, b = document.createElement('b'), p = document.createElement('div');
      verdict.dataset.verdict = c.right ? 'right' : 'wrong';   // never a class: the shell's .right is a flex row
      b.textContent = t(c.right ? 'choices.right' : 'choices.wrong'); this.render(p, words.choices[c.k][2]);
      verdict.append(b, ...p.childNodes);
    }
    const q = document.createElement('p'); q.className = 'q'; q.textContent = words.q;
    const row = document.createElement('div'); row.className = 'choice-row';
    for (const c of step.choices) {
      const [name, line] = words.choices[c.k], b = document.createElement('button');
      b.className = 'choice'; b.dataset.k = c.k;
      if (marks[c.k]) b.dataset.mark = marks[c.k];
      b.classList.toggle('playing', this.state === 'playing' && this.picked === c.k);
      b.disabled = this.state === 'playing';
      b.innerHTML = `${c.icon ? '<span class="icon"></span>' : ''}<b></b><span></span>`;
      if (c.icon) b.querySelector('.icon').textContent = c.icon;
      b.querySelector('b').textContent = name; b.querySelector('span:last-child').textContent = line;
      b.onclick = () => this.pick(c);
      row.append(b);
    }
    const next = document.createElement('div'); next.className = 'choice-next';
    if (this.state === 'right') {
      const again = document.createElement('button'); again.id = 'choice-again'; again.textContent = t('choices.again');
      again.onclick = () => { this.state = 'pick'; this.verdict = null; this.draw(); };
      next.append(again);
      if (!this.last) {
        const go = document.createElement('button'); go.id = 'choice-continue'; go.className = 'primary'; go.textContent = t('choices.continue');
        go.onclick = () => this.onContinue(step);
        next.append(go);
      }
    }
    box.append(verdict, q, row, next);
    this.el.replaceChildren(box);
  }

  async pick(c) {
    const tok = ++this.token, live = () => tok === this.token;
    this.state = 'playing'; this.picked = c.k; this.verdict = null; this.draw(); this.onPick(c);
    try { await this.play(c, live); } catch (e) { if (live()) throw e; }
    if (!live()) return;
    this.played()[c.k] = c.right ? 'right' : 'wrong';
    this.state = c.right ? 'right' : 'wrong'; this.verdict = c; this.draw();
    if (c.right) this.onSolve(this.step);
  }
}
