// The quiz modal of every episode (r317, was 17 identical <ep>/js/quiz.js): one question at a time, check,
// feedback, score, and the episode's celebration at the end (ctx.onAnswer, ctx.onEnd).
// new Quiz(ctx, QUIZ, i18n): QUIZ from the episode's quiz-data.js, i18n its i18n.js module namespace
// (import * as i18n), read live so i18n.lang follows setLang().

const $ = id => document.getElementById(id);
let QUIZ, t, I;   // one quiz per page: set by the constructor

export class Quiz {
  constructor(ctx, quiz, i18n) {
    this.ctx = ctx; QUIZ = quiz; t = i18n.t; I = i18n;
    $('quiz-check').onclick = () => this.check();
    $('quiz-next').onclick = () => { this.i++; this.render(); };
    i18n.onLang(() => this.render());
    this.start();
  }

  start() { this.i = 0; this.score = 0; this.answered = false; this.picked = new Set(); }

  render() {
    const card = $('quiz').querySelector('.card');
    if (this.i >= QUIZ.length) return this.end(card);
    const q = QUIZ[this.i], L = q[I.lang], multi = q.correct.length > 1;
    this.answered = false; this.picked = new Set();
    $('quiz-progress').textContent = t('quiz.progress', { i: this.i + 1, n: QUIZ.length });
    $('quiz-score').textContent = t('quiz.score', { s: this.score });
    $('quiz-q').textContent = L.q;
    $('quiz-multi').textContent = multi ? t('quiz.multi') : '';
    $('quiz-feedback').innerHTML = '';
    const ol = $('quiz-options'); ol.innerHTML = ''; ol.classList.remove('locked');
    L.o.forEach((text, k) => {
      const li = document.createElement('li'); li.textContent = text;
      li.onclick = () => {
        if (this.answered) return;
        if (!multi) { this.picked.clear(); ol.querySelectorAll('li').forEach(x => x.classList.remove('picked')); }
        this.picked.has(k) ? this.picked.delete(k) : this.picked.add(k);
        li.classList.toggle('picked', this.picked.has(k));
      };
      ol.appendChild(li);
    });
    $('quiz-check').classList.remove('hidden'); $('quiz-next').classList.add('hidden');
  }

  check() {
    if (this.answered) return;
    const q = QUIZ[this.i], L = q[I.lang];
    if (!this.picked.size) { $('quiz-feedback').innerHTML = `<p class="ko">${t('quiz.pick')}</p>`; return; }
    this.answered = true;
    const right = q.correct.length === this.picked.size && q.correct.every(k => this.picked.has(k));
    if (right) this.score++;
    const lis = $('quiz-options').querySelectorAll('li');
    lis.forEach((li, k) => {
      if (q.correct.includes(k)) li.classList.add('right');
      else if (this.picked.has(k)) li.classList.add('wrong');
    });
    $('quiz-options').classList.add('locked');
    const fb = document.createElement('p'); fb.className = right ? 'ok' : 'ko'; fb.textContent = right ? L.ok : L.ko;
    $('quiz-feedback').replaceChildren(fb);
    $('quiz-score').textContent = t('quiz.score', { s: this.score });
    this.ctx.onAnswer?.(right);
    $('quiz-check').classList.add('hidden'); $('quiz-next').classList.remove('hidden');
    $('quiz-next').textContent = this.i === QUIZ.length - 1 ? t('quiz.end') + ' ▶' : t('quiz.next');
  }

  end(card) {
    if (!this.saved) this.saved = card.innerHTML;
    card.innerHTML = `<div class="quiz-end"><h2>${t('quiz.end')}</h2><div class="big">${this.score} / ${QUIZ.length}</div>
      <p>${t('quiz.endText', { s: this.score, n: QUIZ.length })}</p>
      <div class="nav" style="justify-content:center"><button id="q-again" class="primary">${t('quiz.again')}</button>
      <button id="q-back">${t('quiz.back')}</button></div></div>`;
    this.ctx.onEnd?.(this.score, QUIZ.length);
    card.querySelector('#q-again').onclick = () => this.restore(card);
    card.querySelector('#q-back').onclick = () => { this.restore(card); this.ctx.setMode('story'); };
  }

  restore(card) {
    card.innerHTML = this.saved; this.saved = null;
    $('quiz-check').onclick = () => this.check();
    $('quiz-next').onclick = () => { this.i++; this.render(); };
    for (const el of card.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    this.start(); this.render();
  }
}
