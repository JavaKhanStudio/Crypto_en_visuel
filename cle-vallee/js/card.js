// The corner card: what the step is about, drawn from the real bytes and numbers (aes.js, hmac.js,
// rsa.js). One view per step: Alice's two keys, what Eve copies when they travel in the clear, what
// she does with them, RSA by hand, Bob's public key, OAEP, two seeds, Bob opening the padlock, who
// carries what, two sends of the same order, the whole packet. The sandbox shows its own send.
import { t, raw } from './i18n.js';
import * as A from './aes.js';
import * as R from './rsa.js';
import * as P from './packet.js';

const el = document.getElementById('card');
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const hx = x => x.toString(16).padStart(2, '0');
const lbl = s => `<span class="lbl">${s}</span>`;
// bytes as rows of 16 in hex; rows: how many to show before « ⋮ N more rows »; against: bytes whose
// differences are marked
function lines(b, cls, { rows = Infinity, against } = {}) {
  const all = A.blocksOf16(b), shown = all.slice(0, rows);
  return shown.map((r, k) => `<div class="hex ${cls}">${[...r].map((x, i) =>
    against && against[k * 16 + i] !== x ? `<b class="diff">${hx(x)}</b>` : hx(x)).join(' ')}</div>`).join('')
    + (all.length > rows ? `<div class="hex more">${t('card.more', { n: all.length - rows })}</div>` : '');
}
const verdict = (ok, text) => `<p class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '✔' : '✖'} ${text}</p>`;
function packet(have) {
  const B = raw('card.bricks');
  return `<div class="packet">${['k', 'iv', 'ct', 'mac'].map(k => `<span class="${have.includes(k) ? k : 'off'}">${B[k]}</span>`).join('')}</div>`;
}
const keys = k => lbl(raw('card').aes) + lines(k.slice(0, 32), 'key') + lbl(raw('card').mac) + lines(k.slice(32), 'mac');
const pow = (b, e, m) => `${b}<sup>${e}</sup> mod ${m}`;

export function renderCard(st) {
  if (!st) { el.innerHTML = ''; return; }
  const s = st.s, C = raw('card');
  const v = {
    keys: () => `<h3>${C.keys}</h3>${keys(s.keys)}<p class="note">${C.keysNote}</p>`,
    clear: () => `<h3>${C.clear}</h3>${keys(st.clear.sent)}<p class="note">${C.clearNote}</p>`,
    fall: () => {
      const e = st.fall, r = P.receive(e.pkt);
      return `<h3>${C.fall}</h3>${lbl(C.reads)}<div class="order">${esc(e.m)}</div>${lbl(C.writes)}<div class="order bad">${esc(e.w)}</div>`
        + lines(A.concat(e.pkt.C), 'ct') + lbl(C.tag) + lines(e.pkt.tag, 'seal')
        + lbl(C.bobCheck) + verdict(r.sealOk, C.sealOk) + verdict(false, `${C.verdict.wrong} « ${esc(A.text(r.back))} »`);
    },
    toy: () => {
      const k = R.TOY, c = R.lock(k, k.m);
      return `<h3>${C.toy}</h3><div class="chain">`
        + `<b>p, q</b><span>${k.p}, ${k.q}</span>`
        + `<b>n</b><span>${k.p} × ${k.q} = ${k.n}</span>`
        + `<b>(p−1)(q−1)</b><span>${k.p - 1n} × ${k.q - 1n} = ${k.phi}</span>`
        + `<b>e, d</b><span>${k.e}, ${k.d} &nbsp;(${k.e} × ${k.d} = ${k.e * k.d} = ${k.e * k.d / k.phi} × ${k.phi} + ${k.e * k.d % k.phi})</span>`
        + `<b>${C.pub}</b><span>(${k.n}, ${k.e})</span><b>${C.priv}</b><span>(${k.n}, ${k.d})</span>`
        + `<b>${C.lockL}</b><span>${pow(k.m, k.e, k.n)} = ${k.m ** k.e} mod ${k.n} = <em class="c">${c}</em></span>`
        + `<b>${C.openL}</b><span>${pow(c, k.d, k.n)} = <em class="ok">${R.unlock(k, c)}</em></span>`
        + `</div><p class="note">${C.toyNote}</p>`;
    },
    pubkey: () => `<h3>${C.pubkey}</h3>${lbl(C.nL)}${lines(R.bytesOf(R.BOB.n, R.BOB.k), 'key', { rows: 4 })}`
      + `<div class="chain"><b>${C.eL}</b><span>${R.BOB.e} (${A.hex(R.bytesOf(R.BOB.e, 3))})</span></div>`
      + `<p class="note">${t('card.pubNote', { d: R.BOB.n.toString().length })}</p>`,
    oaep: () => {
      const o = s.locked;
      return `<h3>${C.oaep}</h3>${lbl(C.mL)}${lines(s.keys, 'key', { rows: 2 })}${lbl(C.seedL)}${lines(o.seed, 'iv')}`
        + `${lbl(C.emL)}${lines(o.EM, 'iv', { rows: 2 })}<div class="hex key arrow">↓ ${C.lockArrow}</div>${lbl(C.cL)}${lines(o.c, 'ct', { rows: 2 })}`
        + `<p class="note">${t('card.oaepNote', { z: R.BOB.k - 64 - 2 * R.H - 2 })}</p>`;
    },
    seed: () => {
      const a = s.locked.c, b = st.twice.locked.c, d = [...a].filter((x, i) => x !== b[i]).length;
      return `<h3>${C.seed}</h3>${lbl(C.mL)}${lines(s.keys, 'key', { rows: 1 })}${lbl(C.c1)}${lines(a, 'ct', { rows: 3 })}`
        + `${lbl(C.c2)}${lines(b, 'ct', { rows: 3, against: a })}<p class="note">${t('card.diff', { d })}</p>`;
    },
    open: () => {
      const o = R.decrypt(R.BOB, s.ek);
      return `<h3>${C.open}</h3>${lbl(C.cL)}${lines(s.ek, 'ct', { rows: 2 })}<div class="hex key arrow">↓ ${C.openArrow}</div>`
        + `${lbl(C.got)}${lines(o.M, 'key')}` + verdict(A.same(o.M, s.keys), C.same);
    },
    hybrid: () => `<h3>${C.hybrid}</h3><p class="note">${t('card.limit', { max: R.max(R.BOB) })}</p><div class="sizes">`
      + C.rows.map(([a, b, c], i) => `<span class="${['k', 'iv', 'ct', 'mac'][i]}">${a}</span><b>${t('card.rows.' + i + '.1', { k: s.ek.length, c: s.C.length * 16 })}</b><em>${t('card.rows.' + i + '.2', { n: s.n })}</em>`).join('')
      + '</div>',
    fresh: () => {
      const b = st.next, F = C.fields, field = (k, x) => ({ ek: x.ek, iv: x.iv, ct: A.concat(x.C), tag: x.tag })[k];
      const same = ['ek', 'iv', 'ct', 'tag'].map(k => { const p = field(k, s), q = field(k, b); return [...p].filter((x, i) => x === q[i]).length; }),
        total = ['ek', 'iv', 'ct', 'tag'].reduce((n, k) => n + field(k, s).length, 0);
      return `<h3>${C.fresh}</h3><div class="order">${esc(s.order)}</div>`
        + ['ek', 'iv', 'ct', 'tag'].map(k => lbl(F[k]) + `<div class="hex pair"><i>${C.send1}</i> ${A.hex(field(k, s), 8)} …</div><div class="hex pair"><i>${C.send2}</i> <b class="diff">${A.hex(field(k, b), 8)}</b> …</div>`).join('')
        + `<p class="note">${t('card.freshNote', { t: total, n: same.reduce((a, b) => a + b) })}</p>`;
    },
    packet: () => `<h3>${C.packet}</h3>${packet(['k', 'iv', 'ct', 'mac'])}${lbl(C.bricks.k)}${lines(s.ek, 'key', { rows: 2 })}`
      + `${lbl(C.bricks.iv)}${lines(s.iv, 'iv')}${lbl(C.bricks.ct)}${lines(A.concat(s.C), 'ct')}${lbl(C.bricks.mac)}${lines(s.tag, 'seal')}`,
    sandbox: () => {
      const e = st.eve, r = P.receive(e.pkt), changed = !r.rejected && !A.same(r.back, s.raw);
      const gets = e.keys ? t('card.eveKeys', { m: esc(e.m) }) : C.eveNothing;
      const bob = r.rejected ? verdict(false, C.verdict.reject)
        : `<div class="order${changed ? ' bad' : ''}">${esc(A.text(r.back))}</div>` + verdict(!changed, changed ? C.verdict.wrong : C.verdict.ok);
      return `<h3>${C.keysHow[s.how]}</h3><div class="order">${esc(s.order)}</div>`
        + lbl(s.how === 'clear' ? C.mL : C.cL) + lines(s.sent, s.how === 'clear' ? 'key' : 'ct', { rows: 2 })
        + lbl(C.eveGets) + `<p class="note">${gets}</p>` + lbl(C.bobGets) + bob;
    },
  }[st.view];
  el.innerHTML = v();
}
