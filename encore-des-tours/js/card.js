// The corner card: what the step is about, drawn from the real bytes (aes.js, hmac.js, rsa.js,
// sign.js, gcm.js, packet.js). One view per step: Eve's four tricks, her forged packet and what Bob
// makes of it, why the seal says nothing of who, Alice's signature and Bob's check, Eve's own
// signature, the replay, the number, AES-GCM, the final packet, the attack-defense questions.
// The sandbox shows its own send.
import { t, raw } from './i18n.js';
import * as A from './aes.js';
import * as S from './sign.js';
import * as P from './packet.js';
import { LAST, bobSays } from './story.js';

const el = document.getElementById('card');
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const hx = x => x.toString(16).padStart(2, '0');
const lbl = s => `<span class="lbl">${s}</span>`;
const code = s => `<div class="code">${esc(s)}</div>`;
// bytes as rows of 16 in hex; rows: how many to show before « ⋮ N more rows »; against: bytes whose
// differences are marked
function lines(b, cls, { rows = Infinity, against } = {}) {
  const all = A.blocksOf16(b), shown = all.slice(0, rows);
  return shown.map((r, k) => `<div class="hex ${cls}">${[...r].map((x, i) => {
    const j = k * 16 + i;
    return against && against[j] !== x ? `<b class="diff">${hx(x)}</b>` : hx(x);
  }).join(' ')}</div>`).join('')
    + (all.length > rows ? `<div class="hex more">${t('card.more', { k: all.length - rows })}</div>` : '');
}
const verdict = (ok, text) => `<p class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '✔' : '✖'} ${text}</p>`;
const CLS = { num: 'num', ek: 'key', iv: 'iv', ct: 'ct', tag: 'seal', sig: 'sig' }, CHIP = { num: 'num', ek: 'k', iv: 'iv', ct: 'ct', tag: 'mac', sig: 'sig' };
// the packet as a bar of chips: the bricks it has, those that are Eve's in red
function bar(pkt, marked = [], F = raw('card.fields')) {
  return `<div class="packet">${P.has(pkt).map(b => `<span class="${CHIP[b]}${marked.includes(b) ? ' marked' : ''}">${F[b]}</span>`).join('')}</div>`;
}
const arrow = s => `<div class="hex key arrow">↓ ${s}</div>`;
const mark = ok => ok === undefined ? '—' : ok ? '✔' : '✖';
// Bob's moves on a packet, in the order he makes them, each with its outcome
function moves(r, checks) {
  const C = raw('card');
  const out = [];
  if (checks.sig) out.push(`${C.opSig} ${mark(r.sigOk)}`);
  if (checks.last !== undefined && checks.last !== null) out.push(`${t('card.opNum', { k: checks.last })} ${r.n === undefined ? '—' : r.n === null ? '✖' : `n° ${r.n} ${mark(r.numOk)}`}`);
  out.push(`${C.op1} ${mark(r.keysOk)}`, `${C.op2} ${mark(r.sealOk)}`, `${C.op3} ${r.decrypted ? `« ${esc(A.printable(r.back))} »` : '—'}`);
  return `<ol class="ops">${out.map(x => `<li>${x}</li>`).join('')}</ol>`;
}

export function renderCard(st) {
  if (!st) { el.innerHTML = ''; return; }
  const C = raw('card'), F = C.fields;
  const v = {
    tricks: () => `<h3>${C.tricks}</h3><div class="tricks">` + raw('tricks').map(([what, how, ok]) =>
      `<b>${what}</b><em>${how}</em><span class="${ok ? 'ok' : 'bad'}">${ok ? C.stopped : C.notYet}</span>`).join('') + `</div><p class="note">${C.tricksNote}</p>`,
    forge: () => {
      const f = st.forged;
      return `<h3>${C.forge}</h3>${bar(f, P.has(f))}${code('aes_key, hmac_key = os.urandom(32), os.urandom(32)  # ' + C.hers)}${lines(f.key, 'key')}${lines(f.macKey, 'mac')}`
        + `<div class="order bad">${esc(f.order)}</div>${arrow(C.cbcArrow)}${lbl(t('card.ctL', { k: f.C.length * 16 }))}${lines(P.field(f, 'ct'), 'ct')}`
        + `${lbl(C.tagL)}${lines(f.tag, 'seal')}${code('rsa_chiffrer_cle(aes_key + hmac_key, bob_public_key)')}${lines(f.ek, 'key', { rows: 1 })}<p class="note">${C.forgeNote}</p>`;
    },
    bobForged: () => {
      const r = P.receive(st.forged);
      return `<h3>${C.bobForged}</h3>${bar(st.forged, P.has(st.forged))}${moves(r, {})}${lbl(C.mine)}${lines(r.mine, 'seal')}${verdict(r.sealOk, C.sealOk)}`
        + `${verdict(false, C.fooled)}`;
    },
    who: () => `<h3>${C.who}</h3><div class="duo"><div class="a"><b>${C.whoThen}</b>${C.whoThenText}</div><div><b>${C.whoNow}</b>${C.whoNowText}</div></div>`
      + `<p class="note">${C.whoNote}</p>`,
    sign: () => {
      const s = st.signed, g = s.signature;
      return `<h3>${C.sign}</h3>${bar(s)}${lbl(C.signedL)}${lines(P.signed(s), 'ct', { rows: 2 })}`
        + `${arrow('SHA-256')}${lbl(C.digest)}${lines(g.mHash, 'plain')}${arrow(C.pssArrow)}${lbl(C.emL)}${lines(g.EM, 'plain', { rows: 1 })}`
        + `${arrow(C.dArrow)}${lbl(C.sigL)}${lines(s.sig, 'sig', { rows: 2 })}`
        + code('signature = alice_private_key.sign(paquet, padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.DIGEST_LENGTH), hashes.SHA256())');
    },
    verify: () => {
      const s = st.signed, c = S.verify(S.ALICE, P.signed(s), s.sig);
      return `<h3>${C.verify}</h3>${lbl(C.sigL)}${lines(s.sig, 'sig', { rows: 1 })}${arrow(C.eArrow)}${lbl(C.emBack)}${lines(c.EM, 'plain', { rows: 1 })}`
        + `${lbl(C.hIn)}${lines(c.h, 'plain')}${lbl(C.hMine)}${lines(c.want, 'plain', { against: c.h })}${verdict(c.ok, C.sigOk)}`
        + `<div class="duo"><div><b>${C.padlock}</b>${C.padlockText}</div><div class="a"><b>${C.signature}</b>${C.signatureText}</div></div>`
        + code('alice_public_key.verify(signature, paquet, padding.PSS(...), hashes.SHA256())');
    },
    evilSig: () => {
      const f = st.forgedSig, c = S.verify(S.ALICE, P.signed(f), f.sig), r = P.receive(f, { sig: true });
      const back = c.range ? `${arrow(C.eArrow)}${lbl(C.emBack)}${lines(c.EM, 'plain', { rows: 1 })}${lbl(C.hIn)}${lines(c.h, 'plain')}${lbl(C.hMine)}${lines(c.want, 'plain', { against: c.h })}`
        : `<p class="note">${C.tooBig}</p>`;
      return `<h3>${C.evilSig}</h3>${bar(f, P.has(f))}${lbl(C.sigEve)}${lines(f.sig, 'sig', { rows: 1 })}${back}${verdict(false, C.sigBad)}${moves(r, { sig: true })}`;
    },
    replay: () => {
      const s = st.signed, r1 = P.receive(s, { sig: true }), r2 = P.receive(P.replay(s), { sig: true });
      return `<h3>${C.replay}</h3>${bar(s)}${lbl(C.day1)}${lines(s.sig, 'sig', { rows: 1 })}${verdict(true, bobSays(r1))}`
        + `${lbl(C.day2)}${lines(s.sig, 'sig', { rows: 1, against: s.sig })}${verdict(false, `${C.again} ${bobSays(r2)}`)}<p class="note">${C.replayNote}</p>`;
    },
    num: () => {
      const n = st.numbered, b = st.bumped;
      const cases = [[n, LAST, C.numFirst], [P.replay(n), P.NUM, C.numAgain], [b, LAST, C.numBumped]];
      return `<h3>${C.num}</h3>${bar(n)}${lbl(C.numL)}${lines(n.num, 'num')}${lbl(C.signedL)}${lines(P.signed(n), 'ct', { rows: 1 })}`
        + cases.map(([p, last, what]) => { const r = P.receive(p, { sig: true, last }); return `${lbl(what)}${lines(p.num, 'num', { against: n.num })}${verdict(!r.rejected, bobSays(r))}`; }).join('')
        + `<p class="note">${C.numNote}</p>`;
    },
    replayNum: () => {
      const n = st.numbered, r1 = P.receive(n, { sig: true, last: LAST }), r2 = P.receive(P.replay(n), { sig: true, last: P.NUM });
      return `<h3>${C.replayNum}</h3>${bar(n)}${lbl(t('card.day1n', { k: LAST }))}${moves(r1, { sig: true, last: LAST })}`
        + `${lbl(t('card.day2n', { k: P.NUM }))}${moves(r2, { sig: true, last: P.NUM })}${verdict(false, bobSays(r2))}`;
    },
    gcm: () => {
      const g = st.g;
      return `<h3>${C.gcm}</h3>${code('ciphertext = AESGCM(aes_key).encrypt(nonce, plaintext, None)')}${lbl(C.keyL)}${lines(g.key, 'key')}${lbl(C.nonceL)}${lines(g.nonce, 'iv')}`
        + `<div class="order">${esc(g.order)}</div>${arrow(C.ctrArrow)}${lbl(t('card.gctL', { k: g.C.length }))}${lines(g.C, 'ct')}`
        + `${arrow(C.ghashArrow)}${lbl(C.gtagL)}${lines(g.tag, 'seal')}`
        + `<div class="duo"><div><b>${C.before}</b>${C.beforeText}</div><div class="a"><b>${C.after}</b>${C.afterText}</div></div>`;
    },
    gcmEve: () => {
      const g = st.g, e = st.gEvil, r = P.gcmOpen(e);
      return `<h3>${C.gcmEve}</h3>${lbl(C.ctSent)}${lines(g.C, 'ct')}${lbl(C.ctGot)}${lines(e.C, 'ct', { against: g.C })}`
        + `${lbl(C.gtagGot)}${lines(e.tag, 'seal')}${lbl(C.mine)}${lines(r.mine, 'seal', { against: e.tag })}`
        + `${code('AESGCM(aes_key).decrypt(nonce, ciphertext, None)')}${verdict(false, C.invalidTag)}<p class="note">${C.nonceNote}</p>`;
    },
    final: () => {
      const f = st.fin, o = P.finalOpen(f), FF = C.finalFields;
      return `<h3>${C.final}</h3>${bar(f, [], FF)}<div class="sizes">`
        + P.has(f).map(b => `<span class="${CHIP[b]}">${FF[b]}</span><b>${t('card.bytes', { k: P.field(f, b).length })}</b><em>${C.finalRole[b]}</em>`).join('')
        + `</div>${lbl(C.bobFinal)}<ol class="ops"><li>${C.opSig} ${mark(o.sigOk)}</li><li>${t('card.opNum', { k: P.NUM })} n° ${P.numOf(f.num)} ✔</li>`
        + `<li>${C.op1one} ${mark(o.keysOk)}</li><li>${C.opGcm} ${o.tagOk ? `« ${esc(A.text(o.back))} »` : '✖'}</li></ol><p class="note">${C.finalNote}</p>`;
    },
    play: () => `<h3>${C.play}</h3><ul class="play">` + raw('play').map(([trick, q]) => `<li><b>${trick}</b>${q}</li>`).join('') + '</ul>',
    sandbox: () => {
      const e = st.pkt, r = st.r;
      return `<h3>${st.title}</h3>${e.order && !e.copy ? `<div class="order${st.evil ? ' bad' : ''}">${esc(e.order)}</div>` : ''}`
        + bar(e, st.evil ? P.has(e) : e.eve ? [e.eve.brick] : [])
        + (e.num ? lbl(F.num) + lines(e.num, 'num') : '') + lbl(F.ct) + lines(P.field(e, 'ct'), 'ct', { rows: 2, against: e.eve ? P.field(st.sent, 'ct') : undefined })
        + lbl(bobSaysTitle(st)) + moves(r, st.checks)
        + (r.rejected ? verdict(false, C.verdict.reject) : verdict(!st.evil, st.evil ? C.verdict.fooled : C.verdict.ok));
    },
  }[st.view];
  el.innerHTML = v();
}
const bobSaysTitle = st => [st.checks.sig && raw('card.sbSig'), st.checks.last !== null && raw('card.sbNum')].filter(Boolean).join(' · ') || raw('card.sbNone');
