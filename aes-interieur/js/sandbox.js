// The sandbox: Alice's block (P1 ⊕ IV) and her key, one input per byte. The reader changes any byte,
// runs the 14 rounds, and watches the change spread: the room outlines in red every cube that
// differs from Alice's own run at the same moment, and the card counts them after each round.
// The inputs are made once and never re-rendered (a cursor in one stays where it is).
import { t, onLang, lang } from './i18n.js';
import * as A from './aes.js';

const $ = id => document.getElementById(id);

export function initSandbox(ctx) {
  const sb = { token: 0 };
  const ins = { block: [], key: [] };
  // the block's 16 inputs laid out like the state: row r, column c is byte 4c + r
  const blockEl = $('sb-block'), keyEl = $('sb-key');
  for (let i = 0; i < 16; i++) { const e = input(); e.style.gridRow = i % 4 + 1; e.style.gridColumn = Math.floor(i / 4) + 1; blockEl.append(e); ins.block.push(e); }
  for (let i = 0; i < 32; i++) { const e = input(); keyEl.append(e); ins.key.push(e); }
  function input() {
    const e = document.createElement('input');
    Object.assign(e, { type: 'text', maxLength: 2, spellcheck: false, autocomplete: 'off' }); e.setAttribute('inputmode', 'latin');
    e.addEventListener('input', changed);
    e.addEventListener('focus', () => e.select());
    return e;
  }
  const alice = () => A.story(lang);
  function fill() {
    const s = alice();
    ins.block.forEach((e, i) => { e.value = A.hx(s.X1[i]); });
    ins.key.forEach((e, i) => { e.value = A.hx(s.key[i]); });
    changed();
  }
  const read = list => list.map(e => /^[0-9a-f]{2}$/i.test(e.value.trim()) ? parseInt(e.value, 16) : null);
  // the run the inputs describe, against Alice's; null while a byte is not two hex digits
  function data() {
    const b = read(ins.block), k = read(ins.key), s = alice();
    if (b.includes(null) || k.includes(null)) return null;
    const X1 = Uint8Array.from(b), key = Uint8Array.from(k), tr = A.trace(key, X1);
    return { st: { P1: A.xor(X1, s.iv), iv: s.iv, X1, key, tr, C1: tr.out }, ref: s.tr };
  }
  function changed() {
    const s = alice(), b = read(ins.block), k = read(ins.key);
    ins.block.forEach((e, i) => { e.classList.toggle('changed', b[i] !== null && b[i] !== s.X1[i]); e.classList.toggle('bad', b[i] === null); });
    ins.key.forEach((e, i) => { e.classList.toggle('changed', k[i] !== null && k[i] !== s.key[i]); e.classList.toggle('bad', k[i] === null); });
    const d = data();
    $('sb-run').disabled = !d;
    if (!d) { $('sb-stats').textContent = t('sb.bad'); return; }
    stats(d);
    if (ctx.mode() === 'sandbox') { sb.token++; ctx.room.run = 'sandbox'; ctx.room.build(d); ctx.room.beat('idle'); ctx.renderCard({ view: 'sandbox', ...d }); }
  }
  const stats = d => {
    const n = A.diff(d.st.X1, d.ref.ops[0].from) + A.diff(d.st.key, d.ref.key);
    $('sb-stats').innerHTML = t('sb.stats', { n, d: A.diff(d.st.tr.out, d.ref.out) });
  };
  $('sb-run').onclick = () => {
    const d = data(); if (!d) return ctx.toast(t('sb.bad'));
    ctx.room.run = 'sandbox'; ctx.room.build(d); ctx.room.beat('spread'); ctx.renderCard({ view: 'sandbox', ...d });
  };
  $('sb-reset').onclick = fill;
  onLang(() => { if (ctx.mode() === 'sandbox' && ins.block[0].value) changed(); });   // the reader's bytes stay; the labels and Alice's run follow the language
  sb.enter = () => { if (!ins.block[0].value) fill(); else changed(); };
  return sb;
}
