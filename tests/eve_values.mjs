// Episode 1.2 « Eve lit tout »: eve-lit-tout/js/aes.js against the FIPS-197 AES-256 vector, openssl
// (aes-256-cbc, PKCS#7 by default) and the browser's AES-CBC (WebCrypto, node's crypto.subtle).
//     node tests/eve_values.mjs
import { execFileSync } from 'node:child_process';
import * as A from '../eve-lit-tout/js/aes.js';
let bad = 0;
const check = (name, got, want) => { const ok = got === want; ok || bad++; console.log(ok ? 'ok  ' : 'FAIL', name, got, ok ? '' : `(want ${want})`); };
const plain = b => A.hex(b).replace(/ /g, '');
// FIPS-197 appendix C.3, AES-256
const k = A.fromHex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'), p = A.fromHex('00112233445566778899aabbccddeeff');
check('FIPS-197 C.3 enc', A.hex(A.encryptBlock(k, p)), '8e a2 b7 ca 51 67 45 bf ea fc 49 90 4b 49 60 89');
check('FIPS-197 C.3 dec', A.hex(A.decryptBlock(k, A.encryptBlock(k, p))), A.hex(p));
const openssl = (msg, key, iv) => execFileSync('openssl', ['enc', '-aes-256-cbc', '-K', plain(key), '-iv', plain(iv)], { input: msg }).toString('hex');
const subtle = async (msg, key, iv) => {
  const kk = await crypto.subtle.importKey('raw', key, 'AES-CBC', false, ['encrypt']);
  return Buffer.from(await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, kk, A.bytes(msg))).toString('hex');
};
for (const lang of ['fr', 'en']) {
  const msg = A.ORDER[lang];
  check(`${lang} order is 23 bytes, 2 blocks, 9 of padding`, `${A.bytes(msg).length} ${A.send(msg, A.KEY1, A.IV1).P.length} ${A.send(msg, A.KEY1, A.IV1).padN}`, '23 2 9');
  for (const [name, key, iv] of [['key1/iv1', A.KEY1, A.IV1], ['key2/iv2', A.KEY2, A.IV2]]) {
    const s = A.send(msg, key, iv), mine = plain(A.concat(s.C));
    check(`${lang} ${name} = openssl`, mine, openssl(msg, key, iv));
    check(`${lang} ${name} = WebCrypto`, mine, await subtle(msg, key, iv));
    check(`${lang} ${name} decrypts back`, s.back, msg);
  }
  check(`${lang} same key and IV: same cipher`, A.same(A.concat(A.send(msg, A.KEY1, A.IV1).C), A.concat(A.send(msg, A.KEY1, A.IV1).C)), true);
  check(`${lang} fresh key and IV: other cipher`, A.same(A.send(msg, A.KEY1, A.IV1).C[0], A.send(msg, A.KEY2, A.IV2).C[0]), false);
  check(`${lang} fresh IV alone: other cipher`, A.same(A.send(msg, A.KEY1, A.IV1).C[0], A.send(msg, A.KEY1, A.IV2).C[0]), false);
}
// a message that falls right on a block gets a whole block of padding
const full = A.send('0123456789abcdef', A.KEY1, A.IV1);
check('16 bytes -> a 2nd block of 16 x 10', `${full.P.length} ${A.hex(full.P[1], 3)}`, '2 10 10 10');
check('16 bytes = openssl', plain(A.concat(full.C)), openssl('0123456789abcdef', A.KEY1, A.IV1));
// the values the story prints (first bytes), so a change to the key or the order shows here
const s1 = A.send(A.ORDER.fr, A.KEY1, A.IV1), s2 = A.send(A.ORDER.fr, A.KEY2, A.IV2);
console.log('     fr C1 C2 (key1)', A.hex(s1.C[0]), '|', A.hex(s1.C[1]));
console.log('     fr C1 C2 (key2)', A.hex(s2.C[0]), '|', A.hex(s2.C[1]));
process.exit(bad ? 1 : 0);
