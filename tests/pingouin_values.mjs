// The slides of the modes chapter (cryptographie r57: « ECB - Un exemple », « CBC - Un exemple »,
// « CBC - L'IV - Un exemple », « Bit-flip - Un exemple », « L'attaque bit-flip - En Python »)
// against pingouin/js/aes.js, plus the FIPS-197 test vector. node tests/pingouin_values.mjs
import * as A from '../pingouin/js/aes.js';
let bad = 0;
const check = (name, got, want) => { const ok = got === want; ok || bad++; console.log(ok ? 'ok  ' : 'FAIL', name, got, ok ? '' : `(want ${want})`); };
const h6 = b => A.hex(b, 6);
// FIPS-197 appendix C.1
const k = A.fromHex('000102030405060708090a0b0c0d0e0f'), p = A.fromHex('00112233445566778899aabbccddeeff');
check('FIPS-197 enc', A.hex(A.encryptBlock(k, p)), '69 c4 e0 d8 6a 7b 04 30 d8 cd b7 80 70 b4 c5 5a');
check('FIPS-197 dec', A.hex(A.decryptBlock(k, A.encryptBlock(k, p))), A.hex(p));
check('53 bytes, 4 blocks', `${A.MSG.length} ${A.P.length}`, '53 4');
check('P4 padded', A.hex(A.P[3]), '41 6c 69 63 65 0b 0b 0b 0b 0b 0b 0b 0b 0b 0b 0b');
// ECB - Un exemple
check('ECB C1', A.hex(A.E[0], 8), '97 a7 33 44 8a 3e 16 42');
check('ECB C2', h6(A.E[1]), '0c 5d f9 69 8d 10');
check('ECB C3 == C1', A.same(A.E[2], A.E[0]), true);
check('ECB C4', h6(A.E[3]), '30 84 22 c2 be a0');
// CBC - Un exemple
check('IV', h6(A.IV1), '7e fa 5a 79 fc d3');
check('P1 xor IV', h6(A.CBC1.X[0]), '39 af 1b 2b b8 9a');
check('CBC C1', h6(A.CBC1.C[0]), '6a ff ea 7c 81 0e');
check('CBC C2', h6(A.CBC1.C[1]), 'ff 1b ec f8 13 3e');
check('P3 xor C2', h6(A.CBC1.X[2]), 'b8 4e ad aa 57 77');
check('CBC C3', h6(A.CBC1.C[2]), 'f9 55 8a c1 45 e2');
// CBC - L'IV - Un exemple
check('CBC C4', h6(A.CBC1.C[3]), '75 31 18 8e a2 b8');
check('IV2', h6(A.IV2), '1a 2f 1c 3c c6 a8');
check('IV2 C1', h6(A.CBC2.C[0]), 'aa 8a 94 c6 ff 58');
check('IV2 C4', h6(A.CBC2.C[3]), '07 79 9d ae ce 16');
// Bit-flip - Un exemple, and the Python slide
check('mask', A.FLIP.mask.toString(16).padStart(2, '0'), '09');
check('C1[8]', `${A.CBC1.C[0][8].toString(16)} -> ${A.C1F[0][8].toString(16)}`, 'ea -> e3');
check('dec(C2)[8]', A.BOB.D[1][8].toString(16), 'da');
check('P2 after flip', new TextDecoder().decode(A.BOB.P[1]), 'montant=90100EUR');
check('P1 destroyed', A.hex(A.BOB.P[0], 6), 'd6 5a 4a cb b8 4c');
check('P3 P4 intact', A.same(A.BOB.P[2], A.P[2]) && A.same(A.BOB.P[3], A.P[3]), true);
check('decrypt untouched', A.cbcDec(A.KEY, A.IV1, A.CBC1.C).P.every((b, i) => A.same(b, A.P[i])), true);
// HMAC over IV + cipher: the flipped one no longer matches
const tag = await A.hmac(A.MAC_KEY, A.concat([A.IV1, ...A.CBC1.C])), tagF = await A.hmac(A.MAC_KEY, A.concat([A.IV1, ...A.C1F]));
console.log('     HMAC', A.hex(tag, 8), '| after the flip', A.hex(tagF, 8));
check('HMAC differs after the flip', A.same(tag, tagF), false);
// computed apart with Python's hmac module (cryptographie verif/r57 values, key b'cle-hmac-secrete')
check('HMAC', A.hex(tag, 8), '0a 79 67 b7 db f4 ee 47');
check('TAG export', A.hex(A.TAG, 8), '0a 79 67 b7 db f4 ee 47');
process.exit(bad ? 1 : 0);
