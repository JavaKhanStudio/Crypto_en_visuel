// The corner card: what the step is about, drawn from the real bytes (aes.js). The state is drawn as
// the room draws it, a 4 × 4 grid filled column by column, each byte in its cube's colour.
import { t, raw, lang } from './i18n.js';
import { linkify } from '../../xref.js';
import { byteCss } from './room.js';
import * as A from './values.js';

const el = document.getElementById('card');
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const lbl = s => `<span class="lbl">${s}</span>`;
const hexRows = (b, cls) => Array.from({ length: Math.ceil(b.length / 16) }, (_, i) => `<div class="hex ${cls}">${A.hex(b.slice(i * 16, i * 16 + 16))}</div>`).join('');
// a block as a row of 16 cells: letters for the order, hex otherwise
function row(name, b, cls = '') {
  const cells = [...b].map(x => cls ? `<span class="${cls}">${A.hx(x)}</span>` : `<span>${x === 32 ? '␣' : esc(String.fromCharCode(x))}</span>`);
  return `<div class="bytes"><b>${name}</b>${cells.join('')}</div>`;
}
// the state: row r, column c holds byte 4c + r; mark: the bytes to outline (they differ)
function grid(s, name, { key = false, mark = null } = {}) {
  let h = '<table class="grid' + (key ? ' key' : '') + '">';
  for (let r = 0; r < 4; r++) {
    h += '<tr>';
    for (let c = 0; c < 4; c++) { const i = c * 4 + r, b = s[i]; h += `<td${key ? '' : ` style="background:${byteCss(b, 32)}"`}${mark?.[i] ? ' class="diff"' : ''}>${A.hx(b)}</td>`; }
    h += '</tr>';
  }
  return `<figure>${h}</table><figcaption>${name}</figcaption></figure>`;
}
const grids = (...g) => `<div class="grids">${g.join('')}</div>`;
const sign = s => `<span class="op">${s}</span>`;

export function renderCard(st) {
  if (!st || !st.st) { el.innerHTML = ''; return; }
  const C = raw('card'), s = st.st, tr = s.tr, o = tr.ops, after = r => A.afterRound(tr, r);
  const opCard = (n, extra = '') => {
    const x = o[n], name = { ark: C.ark, sub: C.sub, shift: C.shift, mix: C.mix }[x.op];
    const parts = x.op === 'ark' ? [grid(x.from, C.before), sign('⊕'), grid(x.key, t('card.roundKey', { r: x.round }), { key: true }), sign('='), grid(x.to, C.after)]
      : [grid(x.from, C.before), sign('→'), grid(x.to, C.after)];
    const note = x.op === 'ark' ? t('card.arkNote', { a: A.hx(x.from[0]), b: A.hx(x.key[0]), c: A.hx(x.to[0]) })
      : x.op === 'sub' ? t('card.subNote', { a: A.hx(x.from[0]), b: A.hx(x.to[0]) }) : x.op === 'shift' ? C.shiftNote : C.mixNote;
    return `<h3>${x.round === 0 ? name : `${t('in.round', { n: x.round })} · ${name}`}</h3><div class="grids">${parts.join('')}</div><p class="note">${note}</p>${extra}`;
  };
  const v = {
    intro: () => `<h3>${C.box}</h3>${lbl(C.in + ' · P1 ⊕ IV')}${hexRows(s.X1, 'x')}${lbl(C.key)}${hexRows(s.key, 'key')}${lbl(C.out + ' · C1')}${hexRows(s.C1, 'c')}<p class="note">${C.boxNote}</p>`,
    block: () => `<h3>${C.block}</h3>${row('P1', s.P1)}${row('IV', s.iv, 'iv')}${row('P1⊕IV', s.X1, 'x')}<p class="note">${C.blockNote}</p>`,
    state: () => `<h3>${C.state}</h3>${row('P1⊕IV', s.X1, 'x')}<div class="grids">${grid(s.X1, '')}</div><p class="note">${C.stateNote}</p>`,
    key: () => `<h3>${C.keys}</h3>${lbl(C.key)}${hexRows(s.key, 'key')}<ol class="keys" start="0">${tr.K.map((k, r) => `<li><b>${r}</b><span class="hex key">${A.hex(k, 6)} …</span></li>`).join('')}</ol><p class="note">${C.keysNote}</p>`,
    ark0: () => opCard(0), sub1: () => opCard(1), shift1: () => opCard(2), mix1: () => opCard(3), ark1: () => opCard(4),
    fast: () => `<h3>${C.fast}</h3>${grids(grid(after(1), C.after1), grid(after(13), C.after13))}<p class="note">${C.fastNote}</p>`,
    last: () => `<h3>${C.last}</h3><div class="grids">${grid(tr.out, 'C1')}</div>${row('C1', s.C1, 'c')}${lbl(C.c1)}<div class="hex c">${A.hex(s.C1)}</div><p class="note ok">${C.same}</p>`,
    spread: () => spreadCard(C, s, st.ref, C.spread),
    end: () => `<h3>${C.sum}</h3><ol class="sum">${C.sumList.map(x => `<li>${x}</li>`).join('')}</ol>`,
    sandbox: () => spreadCard(C, s, st.ref, C.sb, true),
  }[st.view];
  el.innerHTML = v(); linkify(el, lang, { '1.2': 5 });
}

// a run against Alice's: the two blocks, the bytes that differ after each round, the two outputs
function spreadCard(C, s, ref, title, sandbox = false) {
  const d = Array.from({ length: 15 }, (_, r) => A.diff(A.afterRound(s.tr, r), A.afterRound(ref, r)));
  const mark = [...s.tr.out].map((x, i) => x !== ref.out[i]);
  const d0 = A.diff(s.X1, ref.ops[0].from) + (sandbox ? A.diff(s.key, ref.key) : 0);
  const head = sandbox ? '' : row('P1′', s.P1) + row('P1', A.story(lang).P1);
  return `<h3>${title}</h3>${head}<p class="note">${C.spreadNote}</p><div class="spread"><span><b>${C.r0}</b>${d0}</span>${d.map((n, r) => `<span class="${n ? 'on' : ''}"><b>${r}</b>${n}</span>`).join('')}</div>`
    + grids(grid(s.tr.out, sandbox ? C.sbOut : 'C1′', { mark }), grid(ref.out, C.sbRef + ' · C1'));
}
