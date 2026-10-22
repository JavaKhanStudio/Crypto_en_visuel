// Episode 11 « AES de l'intérieur »: aes-interieur/js/aes.js, step by step, against FIPS-197 Appendix
// C.3 (the AES-256 example, every round state printed: tests/fips197_c3.txt), then the story's block
// against episode 1.2: the same key, IV and order, and the last state equal to 1.2's C1 byte for byte.
//     node tests/aes_interieur_values.mjs
import { readFileSync } from 'node:fs';
import * as A from '../aes-interieur/js/values.js';
import * as E from '../eve-lit-tout/js/values.js';
let bad = 0;
const check = (name, got, want) => { const ok = got === want; ok || bad++; console.log(ok ? 'ok  ' : 'FAIL', name, ok ? '' : `${got} (want ${want})`); };
const flat = b => A.hex(b).replace(/ /g, '');

// FIPS-197 C.3: round[r].start, s_box, s_row, m_col, k_sch, output
const want = {};
for (const l of readFileSync(new URL('./fips197_c3.txt', import.meta.url), 'utf8').split('\n')) {
  const m = l.match(/^round\[(\d+)\]\.(\w+) ([0-9a-f]{32})$/); if (m) want[`${+m[1]}.${m[2]}`] = m[3];
}
check('C.3 has 72 lines', Object.keys(want).length, 72);
const C3KEY = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';   // C.3's key
const tr = A.trace(A.fromHex(C3KEY), A.fromHex(want['0.input']));
const name = { sub: 's_box', shift: 's_row', mix: 'm_col' };
let n = 0;
for (const o of tr.ops) {
  if (o.op === 'ark') { check(`round ${o.round} k_sch`, flat(o.key), want[`${o.round}.k_sch`]); n++; }
  else { if (o.op === 'sub') { check(`round ${o.round} start`, flat(o.from), want[`${o.round}.start`]); n++; }
         check(`round ${o.round} ${name[o.op]}`, flat(o.to), want[`${o.round}.${name[o.op]}`]); n++; }
}
check('round 14 output', flat(tr.out), want['14.output']); n++;
check('every C.3 state compared', n + 1, 72);   // + round[0].input, the block itself
check('afterRound(13) is round 14 start', flat(A.afterRound(tr, 13)), want['14.start']);
check('13 MixColumns, none in round 14', tr.ops.filter(o => o.op === 'mix').length + ' ' + tr.ops.some(o => o.op === 'mix' && o.round === 14), '13 false');

// the story's values are 1.2's
check('KEY1 = 1.2', flat(A.KEY1), flat(E.KEY1));
check('IV1 = 1.2', flat(A.IV1), flat(E.IV1));
for (const lang of ['fr', 'en']) {
  check(`${lang} order = 1.2`, A.ORDER[lang], E.ORDER[lang]);
  const s = A.story(lang), e = E.send(E.ORDER[lang], E.KEY1, E.IV1);
  check(`${lang} P1 = 1.2's first block`, flat(s.P1), flat(e.P[0]));
  check(`${lang} AES is given P1 xor IV, as in 1.2`, flat(s.X1), flat(e.X[0]));
  check(`${lang} last state = 1.2's C1`, flat(s.C1), flat(e.C[0]));
  check(`${lang} = 1.2's encryptBlock`, flat(A.encryptBlock(A.KEY1, s.X1)), flat(E.encryptBlock(E.KEY1, s.X1)));
  console.log(`     ${lang} P1 ${new TextDecoder().decode(s.P1)} | X1 ${A.hex(s.X1)} | C1 ${A.hex(s.C1)}`);
}
// diffusion, which the story's last chapter shows: one byte changed, then how many differ after each round
for (const lang of ['fr', 'en']) {
  const s = A.story(lang), b = Uint8Array.from(s.X1); b[0] ^= 1;
  const t2 = A.trace(A.KEY1, b), d = Array.from({ length: 15 }, (_, r) => A.diff(A.afterRound(s.tr, r), A.afterRound(t2, r)));
  check(`${lang} one bit of byte 0: 1, 4, then 16 bytes differ`, d.slice(0, 3).join(' '), '1 4 16');
  console.log(`     ${lang} bytes that differ after rounds 0-14:`, d.join(' '));
}
// the story's changed letter, A -> C: one bit of the block, then 1, 4, 16 bytes differ after rounds 0, 1, 2
for (const lang of ['fr', 'en']) {
  const c = A.changed(lang), d = Array.from({ length: 15 }, (_, r) => A.diff(A.afterRound(c.tr, r), A.afterRound(c.ref, r)));
  check(`${lang} changed letter: ${new TextDecoder().decode(c.P1).slice(0, 4)}, one bit`, A.diff(c.X1, A.story(lang).X1) + ' ' + (c.P1[0] ^ 0x41).toString(2), '1 10');
  check(`${lang} changed letter: 1, 4, 16 bytes differ after rounds 0-2`, d.slice(0, 3).join(' '), '1 4 16');
  console.log(`     ${lang} changed letter, bytes that differ after rounds 0-14:`, d.join(' '));
}
process.exit(bad ? 1 : 0);
