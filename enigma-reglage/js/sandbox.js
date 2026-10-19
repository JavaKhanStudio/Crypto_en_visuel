// The sandbox: set the machine like a sheet of the day (three rotors out of five in an order, the
// three rings, the cables, the start position), then type, on the on-screen keyboard or one's own.
// Every key steps the rotors and runs the current to its lamp on Alice's machine, taken apart,
// cables included; the card fills the table row by row. « Back to the start and type the cipher »
// shows the message coming back, as for Bob.
import { t, onLang } from './i18n.js';
import { A, KEYBOARD, NAMES, BARE } from './enigma.js';
import { SEGS } from './stage.js';
import { DAY, START } from './story.js';
import { sfx } from './sound.js';

const $ = id => document.getElementById(id);

// 'bs  cz' -> 'BS CZ', or null when a pair is not two different letters or a letter is used twice
export function parseCables(text) {
  const list = text.toUpperCase().split(/[^A-Z]+/).filter(Boolean), seen = new Set();
  for (const p of list) {
    if (p.length !== 2 || p[0] === p[1] || seen.has(p[0]) || seen.has(p[1])) return null;
    seen.add(p[0]); seen.add(p[1]);
  }
  return list.join(' ');
}

export function initSandbox(ctx) {
  const { stage, rig, instant } = ctx;
  let set = { ...DAY }, start = START, typed = '', lit = '', busy = false, active = false, back = false, bad = false;

  // three columns of letters with ▲ ▼, for the rings or the start
  function letterColumns(id, get, put) {
    const el = $(id); el.innerHTML = '';
    set.rotors.forEach((name, i) => {
      const col = document.createElement('div'); col.className = 'rotor';
      const turn = d => () => { if (busy) return; const s = [...get()]; s[i] = A[(A.indexOf(s[i]) + d + 26) % 26]; put(s.join('')); sfx.click(); reset(); };
      col.innerHTML = `<span class="name">${name}</span>`;
      const up = document.createElement('button'); up.textContent = '▲'; up.onclick = turn(1); up.disabled = busy;
      const letter = document.createElement('b'); letter.textContent = get()[i];
      const down = document.createElement('button'); down.textContent = '▼'; down.onclick = turn(-1); down.disabled = busy;
      col.append(up, letter, down); el.appendChild(col);
    });
  }
  // a rotor picked for one slot that another slot holds: the two swap, so the three stay different
  function rotorPickers() {
    const el = $('sb-rotors'); el.innerHTML = '';
    set.rotors.forEach((name, i) => {
      const s = document.createElement('select'); s.disabled = busy;
      for (const n of NAMES) { const o = document.createElement('option'); o.value = o.textContent = n; o.selected = n === name; s.appendChild(o); }
      s.onchange = () => {
        const r = [...set.rotors], j = r.indexOf(s.value);
        if (j >= 0) r[j] = r[i];
        r[i] = s.value; set = { ...set, rotors: r }; sfx.click(); reset();
      };
      el.appendChild(s);
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
    rotorPickers();
    letterColumns('sb-rings', () => set.rings, r => set = { ...set, rings: r });
    letterColumns('sb-start', () => start, s => start = s);
    keyButtons();
    const input = $('sb-cables');
    if (document.activeElement !== input) input.value = set.plugs;
    input.disabled = busy;
    $('sb-cables-bad').classList.toggle('hidden', !bad);
    for (const id of ['sb-reset', 'sb-day', 'sb-bare']) $(id).disabled = busy;
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
    stage.apply({ apart: { a: 1 }, set: { a: set, b: set }, pos: { a: start, b: start }, card: 'a' });
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

  // the cables, typed as pairs: applied when they make sense, refused (and said so) when not
  function cables(text) {
    if (busy) return;
    const p = parseCables(text);
    bad = p === null;
    if (!bad && p !== set.plugs) { set = { ...set, plugs: p }; sfx.lock(); reset(); } else render();
  }

  $('sb-reset').onclick = () => { if (!busy) { sfx.click(); reset(); } };
  $('sb-replay').onclick = replay;
  $('sb-day').onclick = () => { if (!busy) { set = { ...DAY }; start = START; bad = false; sfx.click(); reset(); } };
  $('sb-bare').onclick = () => { if (!busy) { set = { ...BARE }; start = 'AAA'; bad = false; sfx.click(); reset(); } };
  $('sb-cables').addEventListener('change', e => cables(e.target.value));
  addEventListener('keydown', e => {
    if (!active || e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input, select')) return;
    const c = e.key.toUpperCase();
    if (c.length === 1 && A.includes(c)) { e.preventDefault(); key(c); }
  });
  onLang(() => { if (active) render(); });

  return {
    enter: () => { active = true; reset(); rig.fly('sandbox'); },
    leave: () => { active = false; stage.speed = instant ? 50 : 1; },
    key, replay, cables, state: () => ({ set, start, typed, lit, busy, back, bad }),
    configure: (s, st) => { if (!busy) { set = { ...set, ...s }; if (st) start = st; reset(); } },
  };
}
