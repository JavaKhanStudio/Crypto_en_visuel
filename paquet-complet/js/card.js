// The corner card: what the step is about, drawn from the real bytes (aes.js, hmac.js, rsa.js,
// packet.js). One view per step: the whole packet, Alice's four moves (draw, encrypt, seal, lock),
// Bob's three, Eve's byte, a byte in each brick, the order of Bob's moves, the four files, main.py's
// output, the choices the README justifies. The sandbox shows its own send.
import { t, raw, lang } from './i18n.js';
import { linkify } from '../../xref.js';
import * as A from '../../ficelle/lib/saga-aes.js';
import * as P from './packet.js';

const el = document.getElementById('card');
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const hx = x => x.toString(16).padStart(2, '0');
const lbl = s => `<span class="lbl">${s}</span>`;
const code = s => `<div class="code">${s}</div>`;
// bytes as rows of 16 in hex; rows: how many to show before « ⋮ N more rows »; against: bytes whose
// differences are marked; pad: how many bytes at the end are PKCS#7 padding
function lines(b, cls, { rows = Infinity, against, pad = 0 } = {}) {
  const all = A.blocksOf16(b), shown = all.slice(0, rows);
  return shown.map((r, k) => `<div class="hex ${cls}">${[...r].map((x, i) => {
    const j = k * 16 + i;
    return against && against[j] !== x ? `<b class="diff">${hx(x)}</b>` : j >= b.length - pad ? `<u>${hx(x)}</u>` : hx(x);
  }).join(' ')}</div>`).join('')
    + (all.length > rows ? `<div class="hex more">${t('card.more', { n: all.length - rows })}</div>` : '');
}
const verdict = (ok, text) => `<p class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '✔' : '✖'} ${text}</p>`;
const CLS = { ek: 'key', iv: 'iv', ct: 'ct', tag: 'seal' }, CHIP = { ek: 'k', iv: 'iv', ct: 'ct', tag: 'mac' };
function bar(have, mark) {
  const F = raw('card.fields');
  return `<div class="packet">${P.BRICKS.map(b => `<span class="${have.includes(b) ? CHIP[b] : 'off'}${b === mark ? ' marked' : ''}">${F[b]}</span>`).join('')}</div>`;
}
const arrow = s => `<div class="hex key arrow">↓ ${s}</div>`;
const same = (a, b) => [...a].filter((x, i) => x === b[i]).length;

export function renderCard(st) {
  if (!st) { el.innerHTML = ''; return; }
  const s = st.s, C = raw('card'), F = C.fields;
  const v = {
    whole: () => `<h3>${C.whole}</h3><div class="sizes">`
      + P.BRICKS.map(b => `<span class="${CHIP[b]}">${F[b]}</span><b>${t('card.bytes', { n: P.field(s, b).length })}</b><em>${C.role[b]}</em>`).join('')
      + `</div>${lbl(F.ek)}${lines(s.ek, 'key', { rows: 1 })}${lbl(F.iv)}${lines(s.iv, 'iv')}${lbl(F.ct)}${lines(P.field(s, 'ct'), 'ct')}${lbl(F.tag)}${lines(s.tag, 'seal')}`,
    draw: () => `<h3>${C.draw}</h3>${code('aes_key = os.urandom(32)')}${lines(s.key, 'key')}${code('hmac_key = os.urandom(32)')}${lines(s.macKey, 'mac')}`
      + `${code('iv = os.urandom(16)  # ' + C.ivWhere)}${lines(s.iv, 'iv')}<p class="note">${C.drawNote}</p>`,
    encrypt: () => `<h3>${C.encrypt}</h3>${code('iv, ciphertext = aes_cbc_encrypt(plaintext, aes_key)')}<div class="order">${esc(s.order)}</div>`
      + `${lbl(t('card.padded', { n: s.n, p: s.padN }))}${lines(A.pad(s.raw), 'plain', { pad: s.padN })}${arrow(C.cbcArrow)}`
      + `${lbl(t('card.ctL', { n: s.C.length * 16 }))}${lines(P.field(s, 'ct'), 'ct')}<p class="note">${C.encNote}</p>`,
    seal: () => `<h3>${C.seal}</h3>${code('mac = compute_hmac(hmac_key, iv + ciphertext)')}${lbl(C.ivct)}${lines(s.iv, 'iv')}${lines(P.field(s, 'ct'), 'ct')}`
      + `${arrow(C.hmacArrow)}${lbl(C.tagL)}${lines(s.tag, 'seal')}<p class="note">${C.sealNote}</p>`,
    lock: () => `<h3>${C.lock}</h3>${code('cles_chiffrees = rsa_chiffrer_cle(aes_key + hmac_key, bob_public_key)')}${lbl(C.keysL)}${lines(s.keys, 'key')}`
      + `${arrow(C.oaepArrow)}${lbl(C.ekL)}${lines(s.ek, 'key', { rows: 2 })}<p class="note">${C.lockNote}</p>`,
    bob: () => {
      const r = P.receive(s);
      return `<h3>${C.bob}</h3><ol class="ops">`
        + `<li>${code('keys = rsa_dechiffrer_cle(cles_chiffrees, bob_private_key)')}${lines(r.keys, 'key', { rows: 1 })}${verdict(r.keysOk, C.keysOk)}</li>`
        + `<li>${code('verify_hmac(hmac_key, iv + ciphertext, mac)')}${lbl(C.mine)}${lines(r.mine, 'seal')}${verdict(r.sealOk, C.sealOk)}</li>`
        + `<li>${code('aes_cbc_decrypt(iv, ciphertext, aes_key)')}<div class="order">${esc(A.text(r.back))}</div>${verdict(true, C.readOk)}</li></ol>`;
    },
    evil: () => {
      const e = st.evil, r = P.receive(e);
      return `<h3>${C.evil}</h3>${bar(P.BRICKS, 'ct')}${lbl(C.ctSent)}${lines(P.field(s, 'ct'), 'ct')}${lbl(C.ctGot)}${lines(P.field(e, 'ct'), 'ct', { against: P.field(s, 'ct') })}`
        + `${lbl(C.tagGot)}${lines(e.tag, 'seal')}${lbl(C.mine)}${lines(r.mine, 'seal', { against: e.tag })}`
        + `<p class="note">${t('card.sealSame', { n: same(r.mine, e.tag) })}</p>${verdict(false, C.verdict.reject)}`;
    },
    anywhere: () => `<h3>${C.anywhere}</h3><div class="sizes">` + P.BRICKS.map(b => {
      const r = P.receive(P.tamper(s, b, P.ANYWHERE[b]));
      const what = r.rejected === 'keys' ? C.noKeys : t('card.sealSame', { n: same(r.mine, P.tamper(s, b, P.ANYWHERE[b]).tag) });
      return `<span class="${CHIP[b]}">${F[b]}</span><b>${t('ord', { n: P.ANYWHERE[b] + 1 })}</b><em>${what}</em>`;
    }).join('') + `</div>${verdict(false, C.allRejected)}<p class="note">${C.anyNote}</p>`,
    order: () => {
      const e = st.evil, late = P.receive(e, false);
      return `<h3>${C.order}</h3>${lbl(C.right)}${verdict(false, C.verdict.reject)}<p class="note">${C.rightNote}</p>`
        + `${lbl(C.wrong)}<div class="order bad">${esc(A.printable(late.back))}</div><p class="note">${t('card.wrongNote', { pad: late.padGood ? C.padYes : C.padNo })}</p>`
        + `${lbl(C.cmp)}${code('hmac.compare_digest(mine, mac)  ✔')}${code('mine == mac  ✖')}<p class="note">${C.cmpNote}</p>`;
    },
    files: () => `<h3>${C.files}</h3><div class="tree">` + raw('files').map(([f, role, fns]) =>
      `<div class="file"><b>${f}</b><em>${role}</em>${fns.map(x => `<code>${esc(x)}</code>`).join('')}</div>`).join('') + `</div><p class="note">${C.filesNote}</p>`,
    term: () => {
      const L = raw('term.lines'), n = st.lines ?? L.length, m = A.text(P.receive(st.hello).back);
      return `<h3>${C.term}</h3><pre class="term"><i>$ python main.py</i>\n`
        + L.slice(0, n).map(l => esc(l.replace('{m}', m)).replace(/^(\[\w+\])/, '<b>$1</b>')).join('\n') + (n < L.length ? '\n<span class="caret">▌</span>' : '') + '</pre>'
        + `<p class="note">${C.termNote}</p>`;
    },
    readme: () => `<h3>${C.readme}</h3><div class="why">` + raw('choices').map(([a, b]) => `<b>${a}</b><span>${b}</span>`).join('') + '</div>',
    sandbox: () => {
      const e = st.eve, r = st.r, bob = st.checkFirst ? C.sbRight : C.sbWrong;
      const shown = P.BRICKS.map(b => lbl(F[b]) + lines(P.field(e, b), CLS[b], { rows: b === 'ek' ? 1 : 2, against: P.field(s, b) })).join('');
      const steps = [`<li>${C.op1} ${r.keysOk ? '✔' : '✖'}</li>`];
      const seal = `<li>${C.op2} ${r.keysOk ? (r.sealOk ? '✔' : '✖') : '—'}</li>`, dec = `<li>${C.op3} ${r.decrypted ? `« ${esc(A.printable(r.back))} »` : '—'}</li>`;
      if (r.keysOk) steps.push(...(st.checkFirst ? [seal, dec] : [dec, seal]));
      const out = r.rejected ? verdict(false, r.decrypted ? C.verdict.late : C.verdict.reject) : verdict(true, C.verdict.ok);
      return `<h3>${e.eve ? t('card.sbEve', { b: raw('m.of')[e.eve.brick], n: e.eve.i + 1 }) : C.sbPass}</h3><div class="order">${esc(s.order)}</div>`
        + bar(P.BRICKS, e.eve?.brick) + shown + lbl(bob) + `<ol class="ops">${steps.join('')}</ol>` + out;
    },
  }[st.view];
  el.innerHTML = v(); linkify(el, lang);
}
