// Episode 1.3 « L'octet changé »: octet-change/js/aes.js and hmac.js against the FIPS-197 AES-256
// vector, RFC 4231 (HMAC-SHA256), openssl (aes-256-cbc), Python's hmac, and the browser's AES-CBC
// and HMAC (WebCrypto, node's crypto.subtle); then what the story claims of Eve's changed bytes.
//     node tests/octet_values.mjs
import { execFileSync } from 'node:child_process';
import * as A from '../ficelle/lib/saga-aes.js';
import { hmac, sha256, equal } from '../ficelle/lib/hmac.js';
let bad = 0;
const check = (name, got, want) => { const ok = got === want; ok || bad++; console.log(ok ? 'ok  ' : 'FAIL', name, got, ok ? '' : `(want ${want})`); };
const plain = b => A.hex(b).replace(/ /g, '');
const k = A.fromHex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'), p = A.fromHex('00112233445566778899aabbccddeeff');
check('FIPS-197 C.3 enc', A.hex(A.encryptBlock(k, p)), '8e a2 b7 ca 51 67 45 bf ea fc 49 90 4b 49 60 89');
check('SHA-256("abc")', plain(sha256(A.bytes('abc'))), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
check('RFC 4231 case 2', plain(hmac(A.bytes('Jefe'), A.bytes('what do ya want for nothing?'))), '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');
check('RFC 4231 case 6 (131-byte key)', plain(hmac(new Uint8Array(131).fill(0xaa), A.bytes('Test Using Larger Than Block-Size Key - Hash Key First'))), '60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54');
const openssl = (msg, key, iv) => execFileSync('openssl', ['enc', '-aes-256-cbc', '-K', plain(key), '-iv', plain(iv)], { input: msg }).toString('hex');
const python = (key, msg) => execFileSync('python3', ['-I', '-c', 'import hmac,hashlib,sys; k,m=map(bytes.fromhex,sys.argv[1:]); print(hmac.new(k,m,hashlib.sha256).hexdigest())', plain(key), plain(msg)]).toString().trim();
const subtleAes = async (msg, key, iv) => Buffer.from(await crypto.subtle.encrypt({ name: 'AES-CBC', iv },
  await crypto.subtle.importKey('raw', key, 'AES-CBC', false, ['encrypt']), A.bytes(msg))).toString('hex');
const subtleMac = async (key, msg) => Buffer.from(await crypto.subtle.sign('HMAC',
  await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), msg)).toString('hex');
for (const lang of ['fr', 'en']) {
  for (const [name, msg, key, iv, mk] of [['order', A.ORDER[lang], A.KEY, A.IV, A.MACKEY], ['forged', A.FORGED[lang], A.EVE_KEY, A.EVE_IV, A.EVE_MACKEY]]) {
    const s = A.send(msg, key, iv, mk), ct = plain(A.concat(s.C)), signed = A.concat([s.iv, ...s.C]);
    check(`${lang} ${name} AES = openssl`, ct, openssl(msg, key, iv));
    check(`${lang} ${name} AES = WebCrypto`, ct, await subtleAes(msg, key, iv));
    check(`${lang} ${name} seal = Python hmac`, plain(s.tag), python(mk, signed));
    check(`${lang} ${name} seal = WebCrypto`, plain(s.tag), await subtleMac(mk, signed));
  }
  const s = A.send(A.ORDER[lang], A.KEY, A.IV, A.MACKEY);
  check(`${lang} the hour is byte 11, a 6`, String.fromCharCode(s.raw[A.HOUR]), '6');
  check(`${lang} untouched: Bob reads the order`, A.text(A.receive(s, A.KEY, A.MACKEY).back), A.ORDER[lang]);
  const iv = A.tamper(s, 'iv', A.HOUR), r = A.receive(iv, A.KEY, A.MACKEY, false);
  check(`${lang} IV byte 11 xor 0f, no seal check: 6 -> 9, padding fine`, `${A.text(r.back)} ${r.padGood}`, `${A.ORDER[lang].replace('6', '9')} true`);
  check(`${lang} IV byte 11 xor 0f, seal checked: rejected`, A.receive(iv, A.KEY, A.MACKEY).rejected, true);
  const ct = A.tamper(s, 'ct', 0), rc = A.receive(ct, A.KEY, A.MACKEY, false);
  check(`${lang} ciphertext byte 1: P2 byte 1 xor 0f, the rest of P2 intact`, A.hex(rc.P[1]), A.hex(A.xor(s.P[1], Uint8Array.of(A.FLIP, ...Array(15).fill(0)))));
  check(`${lang} ciphertext byte 1, seal checked: rejected`, A.receive(ct, A.KEY, A.MACKEY).rejected, true);
  const f = A.send(A.FORGED[lang], A.EVE_KEY, A.EVE_IV, A.EVE_MACKEY);
  check(`${lang} Eve's forged packet: rejected by Bob's key`, A.receive(f, A.KEY, A.MACKEY).rejected, true);
  const mine = hmac(A.MACKEY, A.concat([iv.iv, ...iv.C]));
  console.log(`     ${lang} seal differs in`, [...mine].filter((x, i) => x !== s.tag[i]).length, 'bytes of 32; first at', [...mine].findIndex((x, i) => x !== s.tag[i]) + 1);
}
check('equal: same', equal(A.MACKEY, Uint8Array.from(A.MACKEY)), true);
check('equal: last byte differs', equal(A.MACKEY, Uint8Array.from(A.MACKEY, (x, i) => i === 31 ? x ^ 1 : x)), false);
check('equal: lengths differ', equal(A.MACKEY, A.MACKEY.slice(1)), false);
process.exit(bad ? 1 : 0);
