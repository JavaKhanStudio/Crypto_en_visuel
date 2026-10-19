// The corner card: what the step is about, drawn from the real bytes (aes.js). One view per step:
// the order in the clear, the key, AES on one block, the blocks and their padding, the CBC chain,
// what travels, Eve's notebook, the project's packet. The sandbox shows its own send and the notebook.
import { t, raw } from './i18n.js';
import * as A from './aes.js';

const el = document.getElementById('card');
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const lines = (b, cls) => A.blocksOf16(b).map(r => `<div class="hex ${cls}">${A.hex(r)}</div>`).join('');
// a block as a row of 16 cells: letters for the order, hex for padding and ciphertext
function row(name, b, { cipher = false, padFrom = 16 } = {}) {
  const cells = [...b].map((x, i) => i >= padFrom ? `<span class="pad">${hx(x)}</span>`
    : cipher ? `<span class="c">${hx(x)}</span>` : `<span>${x === 32 ? '␣' : esc(String.fromCharCode(x))}</span>`);
  return `<div class="bytes"><b>${name}</b>${cells.join('')}</div>`;
}
const hx = x => x.toString(16).padStart(2, '0');
const lbl = s => `<span class="lbl">${s}</span>`;

function blocksView(s) {
  return s.P.map((p, i) => row('P' + (i + 1), p, { padFrom: i === s.P.length - 1 ? 16 - s.padN : 16 })).join('')
    + `<p class="note">${t(s.padN === 1 ? 'card.padNote1' : 'card.padNote', { n: s.n, k: s.padN, h: hx(s.padN) })}</p>`;
}
function cipherView(s) {
  return lbl(t('card.iv')) + `<div class="hex iv">${A.hex(s.iv)}</div>` + s.C.map((c, i) => row('C' + (i + 1), c, { cipher: true })).join('');
}
function book(list) {
  return `<ul class="book">${list.map(d => `<li class="${d.seen ? 'seen' : ''}"><b>${t('card.day', { n: d.day })}</b>
    <span><span class="hex">${d.plain ? esc(d.plain) : A.hex(d.c, 8) + ' …'}</span>${d.tag ? `<span class="tag">${t('card.' + d.tag)}</span>` : ''}</span></li>`).join('')}</ul>`;
}
function packet(have) {
  const B = raw('card.bricks'), later = { k: '1.4', mac: '1.3' };
  return `<div class="packet">${['k', 'iv', 'ct', 'mac'].map(k => have.includes(k) ? `<span class="${k}">${B[k]}</span>`
    : `<span class="off">${B[k]} <em>· ${t('card.later', { n: later[k] })}</em></span>`).join('')}</div>`;
}

export function renderCard(st) {
  if (!st) { el.innerHTML = ''; return; }
  const s = st.send, C = raw('card');
  const v = {
    order: () => `<h3>${C.order}</h3><div class="order">${esc(s.order)}</div><p class="note">${C.plainNote}</p>`,
    key: () => `<h3>${C.key}</h3>${lines(s.key, 'key')}<p class="note">${C.keyNote}</p>`,
    aes: () => `<h3>${C.aes}</h3>${row('P1', s.P[0])}<div class="hex key arrow">↓ AES-256, ${C.withKey}</div>${row('', A.encryptBlock(s.key, s.P[0]), { cipher: true })}<p class="note">${C.aesNote}</p>`,
    pad: () => `<h3>${C.blocks}</h3>${blocksView(s)}`,
    cbc: () => `<h3>${C.cbc}</h3>${lbl(C.iv)}<div class="hex iv">${A.hex(s.iv)}</div>${row('P1', s.P[0])}${row('P1⊕IV', s.X[0], { cipher: true })}${row('C1', s.C[0], { cipher: true })}`
      + `<div class="chain"><b>${C.step1}</b><span></span><b>${C.step2}</b><span></span></div>`,
    cipher: () => `<h3>${C.cipher}</h3>${cipherView(s)}<p class="note">${C.cipherNote}</p>`,
    book: () => `<h3>${C.notebook}</h3>${book(st.book)}`,
    packet: () => `<h3>${C.packet}</h3>${packet(['iv', 'ct'])}${cipherView(s)}`,
    sandbox: () => `<h3>${st.how === 'plain' ? C.order : C.cipher}</h3>`
      + (st.how === 'plain' ? `<div class="order">${esc(s.order)}</div>` : lbl(C.keyShort) + lines(s.key, 'key') + blocksView(s) + cipherView(s))
      + (st.book.length ? lbl(C.notebook) + book(st.book.slice(-4)) : ''),
  }[st.view];
  el.innerHTML = v();
}
