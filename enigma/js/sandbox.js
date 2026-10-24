// The sandbox: set the start position of the three rotors, then type, on the on-screen keyboard
// or one's own. Every key steps the rotors and runs the current to its lamp on Alice's machine,
// taken apart; the card fills the table row by row. « Back to the start and type the cipher »
// shows the message coming back, as for Bob.
import { t, onLang } from './i18n.js';
import { A, KEYBOARD } from './enigma.js';
import { SEGS } from './stage.js';
import { sfx } from '../../ficelle/lib/sound.js';

const $ = id => document.getElementById(id);

export function initSandbox(ctx) {
  const { stage, rig, instant } = ctx;
  let start = 'AAA', typed = '', lit = '', busy = false, active = false, back = false;

  function startButtons() {
    const el = $('sb-start'); el.innerHTML = '';
    ['I', 'II', 'III'].forEach((name, i) => {
      const col = document.createElement('div'); col.className = 'rotor';
      const turn = d => () => { if (busy) return; const s = [...start]; s[i] = A[(A.indexOf(s[i]) + d + 26) % 26]; start = s.join(''); sfx.click(); reset(); };
      col.innerHTML = `<span class="name">${name}</span>`;
      const up = document.createElement('button'); up.textContent = '▲'; up.onclick = turn(1); up.disabled = busy;
      const letter = document.createElement('b'); letter.textContent = start[i];
      const down = document.createElement('button'); down.textContent = '▼'; down.onclick = turn(-1); down.disabled = busy;
      col.append(up, letter, down); el.appendChild(col);
    });
  }
  function keyButtons() {
    const el = $('sb-keys'); el.innerHTML = '';
    for (const row of KEYBOARD) {
      const r = document.createElement('div'); r.className = 'krow';
      for (const c of row) { const b = document.createElement('button'); b.textContent = c; b.disabled = busy; b.onclick = () => key(c); r.appendChild(b); }
      el.appendChild(r);
    }
  }

  function render() {
    startButtons(); keyButtons();
    for (const id of ['sb-reset', 'sb-replay']) $(id).disabled = busy;
    $('sb-replay').disabled = busy || !lit;
    const rows = [
      `${t('sb.typed')} : <b>${typed || '—'}</b>`,
      `${t('sb.lit')} : <b>${lit || '—'}</b>`,
      t('sb.pos', { p: stage.st.pos.a }),
    ];
    if (back && !busy) rows.push(`<b>${t('sb.back')}</b>`);
    if (!typed && !busy) rows.push(t('sb.ready'));
    $('sb-status').innerHTML = rows.join('<br>');
  }

  function reset() {
    typed = ''; lit = ''; back = false;
    stage.speed = instant ? 50 : 1;
    stage.apply({ apart: { a: 1 }, pos: { a: start, b: 'AAA' }, card: 'a' });
    render();
  }

  async function key(c) {
    if (busy || !active) return;
    busy = true; render();
    try {
      if (!await stage.pressKey('a', c)) return;
      if (!await stage.current('a', SEGS, $('sb-slow').checked ? 1 : 4)) return;
      typed += c; lit += stage.st.lit.a;
    } finally { busy = false; render(); }
  }

  // set the start again and type what lit up: the message comes back
  async function replay() {
    if (busy || !lit) return;
    const cipher = lit, plain = typed;
    reset(); busy = true; render();
    try {
      for (const c of cipher) {
        if (!await stage.pressKey('a', c) || !await stage.current('a', SEGS, $('sb-slow').checked ? 1 : 4)) return;
        typed += c; lit += stage.st.lit.a; render(); busy = true;
      }
      back = lit === plain;
      stage.st.msg = { plain: typed, cipher: lit, from: start }; stage.relabel();
      if (back) sfx.win();
    } finally { busy = false; render(); }
  }

  $('sb-reset').onclick = () => { if (!busy) { sfx.click(); reset(); } };
  $('sb-replay').onclick = replay;
  addEventListener('keydown', e => {
    if (!active || e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input, select')) return;
    const c = e.key.toUpperCase();
    if (c.length === 1 && A.includes(c)) { e.preventDefault(); key(c); }
  });
  onLang(() => { if (active) render(); });

  return {
    enter: () => { active = true; reset(); rig.fly('sandbox'); },
    leave: () => { active = false; stage.speed = instant ? 50 : 1; },
    key, replay, state: () => ({ start, typed, lit, busy, back }),
  };
}
