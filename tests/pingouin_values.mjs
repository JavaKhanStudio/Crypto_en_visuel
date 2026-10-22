// The slides of the modes chapter (cryptographie r57: « ECB - Un exemple », « CBC - Un exemple »,
// « CBC - L'IV - Un exemple », « Bit-flip - Un exemple », « L'attaque bit-flip - En Python »)
// against pingouin/js/aes.js, plus the FIPS-197 test vector. node tests/pingouin_values.mjs
// The header block is VIREMENT URGENT! where the slides have the school's name (r78), so every value
// that depends on P1 or P3 differs from the slides; each one was recomputed apart with openssl enc
// -aes-128-ecb / -aes-128-cbc and Python's hmac (r78), the rest (C2, C4 in ECB, the flip mask) is the slides'.
import * as A from '../pingouin/js/values.js';
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
check('ECB C1', A.hex(A.E[0], 8), 'ac b5 67 95 2d 53 86 c6');
check('ECB C2', h6(A.E[1]), '0c 5d f9 69 8d 10');
check('ECB C3 == C1', A.same(A.E[2], A.E[0]), true);
check('ECB C4', h6(A.E[3]), '30 84 22 c2 be a0');
// CBC - Un exemple
check('IV', h6(A.IV1), '7e fa 5a 79 fc d3');
check('P1 xor IV', h6(A.CBC1.X[0]), '28 b3 08 3c b1 96');
check('CBC C1', h6(A.CBC1.C[0]), '01 a1 da 22 42 92');
check('CBC C2', h6(A.CBC1.C[1]), 'b4 14 96 c5 47 f1');
check('P3 xor C2', h6(A.CBC1.X[2]), 'e2 5d c4 80 0a b4');
check('CBC C3', h6(A.CBC1.C[2]), '17 b9 3f 60 61 e0');
// CBC - L'IV - Un exemple
check('CBC C4', h6(A.CBC1.C[3]), 'f8 e2 ce 0c 41 31');
check('IV2', h6(A.IV2), '1a 2f 1c 3c c6 a8');
check('IV2 C1', h6(A.CBC2.C[0]), '20 02 b8 b5 d4 db');
check('IV2 C4', h6(A.CBC2.C[3]), 'e8 61 d4 ab a8 bf');
// Bit-flip - Un exemple, and the Python slide
check('mask', A.FLIP.mask.toString(16).padStart(2, '0'), '09');
check('C1[8]', `${A.CBC1.C[0][8].toString(16)} -> ${A.C1F[0][8].toString(16)}`, 'ff -> f6');
check('dec(C2)[8]', A.BOB.D[1][8].toString(16), 'cf');
check('P2 after flip', new TextDecoder().decode(A.BOB.P[1]), 'montant=90100EUR');
check('P1 destroyed', A.hex(A.BOB.P[0], 6), '08 ac 4a a9 16 5e');
check('P3 P4 intact', A.same(A.BOB.P[2], A.P[2]) && A.same(A.BOB.P[3], A.P[3]), true);
check('decrypt untouched', A.cbcDec(A.KEY, A.IV1, A.CBC1.C).P.every((b, i) => A.same(b, A.P[i])), true);
// HMAC over IV + cipher: the flipped one no longer matches
const tag = await A.hmac(A.MAC_KEY, A.concat([A.IV1, ...A.CBC1.C])), tagF = await A.hmac(A.MAC_KEY, A.concat([A.IV1, ...A.C1F]));
console.log('     HMAC', A.hex(tag, 8), '| after the flip', A.hex(tagF, 8));
check('HMAC differs after the flip', A.same(tag, tagF), false);
// computed apart with Python's hmac module (key b'cle-hmac-secrete', recomputed for r78)
check('HMAC', A.hex(tag, 8), 'c1 58 3b 57 e2 c9 c8 b4');
check('TAG export', A.hex(A.TAG, 8), 'c1 58 3b 57 e2 c9 c8 b4');
process.exit(bad ? 1 : 0);
