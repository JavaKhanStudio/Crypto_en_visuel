// The corner card: what the step is about, drawn from the real bytes (aes.js, hmac.js). One view per
// step: what travels, the byte Eve changes in the IV and what Bob decrypts, a byte of the ciphertext,
// the HMAC key, the seal, Alice's seal against Bob's, Bob's order of work, the comparison, Eve's
// forged packet, the project's packet. The sandbox shows its own send, what Eve did, and Bob's verdict.
import { t, raw, lang } from './i18n.js';
import { linkify } from '../../xref.js';
import * as A from './aes.js';
import { hmac } from './hmac.js';

const el = document.getElementById('card');
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const hx = x => x.toString(16).padStart(2, '0');
const lbl = s => `<span class="lbl">${s}</span>`;
const lines = (b, cls) => A.blocksOf16(b).map(r => `<div class="hex ${cls}">${A.hex(r)}</div>`).join('');
// a block as a row of 16 cells: letters for printable bytes (text), hex otherwise; mark: cells to
// highlight (Set of indexes), padFrom: where the padding starts
function row(name, b, { cipher = false, padFrom = 16, mark = new Set(), off = 0 } = {}) {
  const cells = [...b].map((x, i) => {
    const m = mark.has(off + i) ? ' mark' : '';
    if (i >= padFrom) return `<span class="pad${m}">${hx(x)}</span>`;
    if (cipher || x < 32 || x > 126) return `<span class="c${m}">${hx(x)}</span>`;
    return `<span class="${m}">${x === 32 ? '␣' : esc(String.fromCharCode(x))}</span>`;
  });
  return `<div class="bytes"><b>${name}</b>${cells.join('')}</div>`;
}
const rows = (name, list, opts = {}) => list.map((b, i) => row(name + (i + 1), b, { ...opts, off: i * 16 })).join('');
// a seal (32 bytes) as two rows of hex; against: another seal, its differing bytes marked
const seal = (tag, against) => A.blocksOf16(tag).map((r, k) => `<div class="hex seal">${[...r].map((x, i) =>
  against && against[k * 16 + i] !== x ? `<b class="diff">${hx(x)}</b>` : hx(x)).join(' ')}</div>`).join('');
// what Bob gets out of a packet: the blocks he decrypts and his verdict
function bob(pkt, s, check, marks) {
  const r = A.receive(pkt, s.key, s.macKey, check), C = raw('card');
  if (r.rejected) return lbl(C.sealB) + seal(r.mine, pkt.tag) + `<p class="verdict bad">✖ ${C.verdict.reject}</p>`;
  const last = r.P.length - 1, padN = r.P[last][15];
  const body = r.P.map((p, i) => row('P' + (i + 1), p, { padFrom: i === last && r.padGood ? 16 - padN : 16, mark: marks, off: i * 16 })).join('');
  const changed = !A.same(A.concat(r.P), A.concat(s.P));
  const v = !r.padGood ? ['bad', C.verdict.pad] : changed ? ['bad', C.verdict.wrong] : ['ok', C.verdict.ok];
  return lbl(C.bobGets) + body + `<p class="verdict ${v[0]}">${v[0] === 'ok' ? '✔' : '✖'} ${v[1]}</p>`;
}
function packet(have) {
  const B = raw('card.bricks'), later = { k: '1.4', mac: '1.3' };
  return `<div class="packet">${['k', 'iv', 'ct', 'mac'].map(k => have.includes(k) ? `<span class="${k}">${B[k]}</span>`
    : `<span class="off">${B[k]} <em>· ${t('card.later', { n: later[k] })}</em></span>`).join('')}</div>`;
}
const sent = s => lbl(raw('card').iv) + `<div class="hex iv">${A.hex(s.iv)}</div>` + rows('C', s.C, { cipher: true });
// which bytes of the decrypted blocks a change lands on: the same byte of P1 for the IV; for the
// ciphertext, all of the block it hits and the same byte of the next one
const landsOn = pkt => pkt.where === 'iv' ? new Set([pkt.i])
  : new Set([...Array(16).keys()].map(k => Math.floor(pkt.i / 16) * 16 + k).concat(pkt.i + 16));

export function renderCard(st) {
  if (!st) { el.innerHTML = ''; return; }
  const s = st.s, C = raw('card');
  const v = {
    sent: () => `<h3>${C.sent}</h3>${lbl(C.order)}<div class="order">${esc(s.order)}</div>${sent(s)}<p class="note">${C.sentNote}</p>`,
    flip: () => {
      const p = st.iv, a = hx(s.iv[p.i]), b = hx(p.iv[p.i]);
      return `<h3>${t('card.flip', { n: p.i + 1 })}</h3>${row(C.before, s.iv, { cipher: true, mark: new Set([p.i]) })}${row(C.after, p.iv, { cipher: true, mark: new Set([p.i]) })}`
        + bob(p, s, false, landsOn(p)) + `<p class="note">${t('card.flipNote', { a: hx(s.P[0][p.i]), b: hx(s.P[0][p.i] ^ A.FLIP) })}</p>`;
    },
    ctflip: () => {
      const p = st.ct, all = A.concat(s.C);
      return `<h3>${t('card.ctFlip', { n: p.i + 1 })}</h3>${row(C.before, all.slice(0, 16), { cipher: true, mark: new Set([p.i]) })}${row(C.after, p.C[0], { cipher: true, mark: new Set([p.i]) })}`
        + bob(p, s, false, landsOn(p)) + `<p class="note">${C.ctNote}</p>`;
    },
    mackey: () => `<h3>${C.macKey}</h3>${lines(s.macKey, 'key')}<p class="note">${C.macKeyNote}</p>`,
    hmac: () => `<h3>${C.hmac}</h3>${lbl(t('card.hmacIn', { n: 16 + s.C.length * 16 }))}${lines(A.concat([s.iv, ...s.C]), 'iv')}`
      + `<div class="hex key arrow">↓ HMAC-SHA256, ${C.withMac}</div>${lbl(C.tag)}${seal(s.tag)}`,
    avalanche: () => {
      const mine = hmac(s.macKey, A.concat([st.iv.iv, ...st.iv.C])), d = [...mine].filter((x, i) => x !== s.tag[i]).length;
      return `<h3>${C.avalanche}</h3>${lbl(C.sealA)}${seal(s.tag)}${lbl(C.sealB)}${seal(mine, s.tag)}<p class="note">${t('card.diff', { d })}</p>`;
    },
    forged: () => { const f = st.forged; return `<h3>${C.forged}</h3><div class="order">${esc(f.order)}</div>${sent(f)}${lbl(C.tag)}${seal(f.tag)}`
      + bob(f, s, true) + `<p class="note">${C.forgedNote}</p>`; },
    ops: () => `<h3>${C.order2}</h3><ol class="ops">${C.ops.map(o => `<li>${o}</li>`).join('')}</ol><p class="note">${C.opsNote}</p>`,
    compare: () => {
      const mine = hmac(s.macKey, A.concat([st.iv.iv, ...st.iv.C])), first = [...mine].findIndex((x, i) => x !== s.tag[i]);
      return `<h3>${C.compare}</h3>${lbl(C.sealA)}${seal(s.tag)}${lbl(C.sealB)}${seal(mine, s.tag)}`
        + `<p class="note">${first < 0 ? C.compareSame : t('card.compareNote', { i: first + 1 })}</p>`;
    },
    packet: () => `<h3>${C.packet}</h3>${packet(['iv', 'ct', 'mac'])}${sent(s)}${lbl(C.tag)}${seal(s.tag)}`,
    sandbox: () => {
      const pkt = st.pkt, did = st.how === 'none' ? C.eveDid.none : t('card.eveDid.' + st.how, { n: (pkt.i ?? 0) + 1 });
      const what = st.how === 'forge' ? `<div class="order">${esc(st.forged.order)}</div>` : `<div class="order">${esc(s.order)}</div>`;
      const shown = st.how === 'forge' ? st.forged : { ...s, iv: pkt.iv, C: pkt.C };
      return `<h3>${did}</h3>${what}${sent(shown)}${lbl(C.tag)}${seal(pkt.tag)}` + bob(pkt, s, st.check, pkt.where ? landsOn(pkt) : new Set());
    },
  }[st.view];
  el.innerHTML = v(); linkify(el, lang);
}
