// r323: lib/aes.js against FIPS-197 Appendix C: C.1 (AES-128) and C.3 (AES-256), plaintext
// 00112233..ff under the key 000102..; the fast cipher, the step-by-step trace and the way back.
//     node tests/aes_lib.mjs
import * as A from '../lib/aes.js';

const P = A.fromHex('00112233445566778899aabbccddeeff');
const CASES = [
  ['AES-128 (C.1)', '000102030405060708090a0b0c0d0e0f', '69c4e0d86a7b0430d8cdb78070b4c55a', 10],
  ['AES-256 (C.3)', '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f', '8ea2b7ca516745bfeafc49904b496089', 14],
];
let bad = 0;
const check = (name, ok) => { console.log((ok ? 'ok   ' : 'BAD  ') + name); bad += !ok; };
for (const [name, k, c, R] of CASES) {
  const key = A.fromHex(k), C = A.fromHex(c), tr = A.trace(key, P);
  check(`${name}: ${A.rounds(key)} rounds`, A.rounds(key) === R && A.expand(key).length === R + 1);
  check(`${name}: encryptBlock gives ${c}`, A.same(A.encryptBlock(key, P), C));
  check(`${name}: trace ends on the same block`, A.same(tr.out, C) && A.same(A.afterRound(tr, R), C));
  check(`${name}: decryptBlock comes back`, A.same(A.decryptBlock(key, C), P));
}
const key = A.fromHex(CASES[0][1]), iv = A.fromHex('0f0e0d0c0b0a09080706050403020100'), m = A.bytes('ATTAQUE A 6H DEMAIN');
const { C } = A.cbc(key, iv, A.blocks(A.pad(m)));
check('CBC + PKCS#7 there and back', A.padOk(A.concat(A.cbcDec(key, iv, C))) && A.text(A.unpad(A.concat(A.cbcDec(key, iv, C)))) === 'ATTAQUE A 6H DEMAIN');
console.log(bad ? `${bad} failed` : 'all ok'); process.exit(bad ? 1 : 0);
