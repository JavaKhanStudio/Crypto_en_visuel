// Episode 1.4 « La clé qui traverse la vallée »: cle-vallee/js/rsa.js and packet.js against openssl
// (pkeyutl, RSA-OAEP with SHA-256 and MGF1-SHA-256, the project's padding) and the browser's own
// RSA-OAEP (WebCrypto, node's crypto.subtle); Python's pow for raw RSA; then what the story claims.
//     node tests/cle_values.mjs
import { execFileSync } from 'node:child_process';
import { createPrivateKey, createPublicKey } from 'node:crypto';
import * as A from '../cle-vallee/js/aes.js';
import * as R from '../cle-vallee/js/rsa.js';
import * as P from '../cle-vallee/js/packet.js';
let bad = 0;
const check = (name, got, want) => { const ok = got === want; ok || bad++; console.log(ok ? 'ok  ' : 'FAIL', name, String(got).slice(0, 80), ok ? '' : `(want ${want})`); };
const plain = b => A.hex(b).replace(/ /g, '');
const b64u = x => Buffer.from(R.bytesOf(x, (x.toString(16).length + 1) >> 1)).toString('base64url');
const K = R.BOB;
const jwk = { kty: 'RSA', n: b64u(K.n), e: b64u(K.e), d: b64u(K.d), p: b64u(K.p), q: b64u(K.q), dp: b64u(K.dp), dq: b64u(K.dq), qi: b64u(K.qinv) };
const priv = createPrivateKey({ key: jwk, format: 'jwk' }), pem = priv.export({ type: 'pkcs8', format: 'pem' });
const pubPem = createPublicKey(priv).export({ type: 'spki', format: 'pem' });
const OAEP = ['-pkeyopt', 'rsa_padding_mode:oaep', '-pkeyopt', 'rsa_oaep_md:sha256', '-pkeyopt', 'rsa_mgf1_md:sha256'];
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
const dir = mkdtempSync(tmpdir() + '/cle-'), f = n => `${dir}/${n}`;
writeFileSync(f('bob.pem'), pem); writeFileSync(f('pub.pem'), pubPem);
const ossl = (args, input) => execFileSync('openssl', ['pkeyutl', ...args, ...OAEP], { input, stdio: ['pipe', 'pipe', 'ignore'] });
const decOpenssl = c => ossl(['-decrypt', '-inkey', f('bob.pem')], Buffer.from(c)).toString('hex');
const encOpenssl = m => new Uint8Array(ossl(['-encrypt', '-pubin', '-inkey', f('pub.pem')], Buffer.from(m)));
const subtleKey = (use) => crypto.subtle.importKey('jwk', use === 'decrypt' ? jwk : { kty: 'RSA', n: jwk.n, e: jwk.e }, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, [use]);
const subtleDec = async c => Buffer.from(await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, await subtleKey('decrypt'), c)).toString('hex');
const subtleEnc = async m => new Uint8Array(await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, await subtleKey('encrypt'), m));
const py = (expr, ...args) => execFileSync('python3', ['-I', '-c', `import sys; a=[int(x,16) for x in sys.argv[1:]]; print(${expr})`, ...args.map(x => x.toString(16))]).toString().trim();

// RSA by hand, and Bob's pair
const T = R.TOY;
check('toy: 7^3 mod 55', R.lock(T, 7n), 13n);
check('toy: 13^27 mod 55', R.modpow(13n, 27n, 55n), 7n);
check('toy: d = 27, 3 × 27 mod 40 = 1', `${T.d} ${T.e * T.d % T.phi}`, '27 1');
check('Bob: n is 2048 bits, 617 digits', `${K.n.toString(2).length} ${K.n.toString().length}`, '2048 617');
check('Bob: p, q prime (openssl prime)', [K.p, K.q].map(x => execFileSync('openssl', ['prime', '-hex', x.toString(16)]).toString().includes('is prime')).join(), 'true,true');
check('Bob: e × d mod (p-1)(q-1) = 1', py('a[0]*a[1] % ((a[2]-1)*(a[3]-1))', K.e, K.d, K.p, K.q), '1');
check('Bob: openssl accepts the key', execFileSync('openssl', ['pkey', '-in', f('bob.pem'), '-check', '-noout']).toString().trim(), 'Key is valid');
check('raw RSA = Python pow', R.lock(K, 123456789n).toString(16), BigInt(py('hex(pow(a[0],a[1],a[2]))', 123456789n, K.e, K.n)).toString(16));
check('OAEP limit: 190 bytes', R.max(K), 190);
check('OAEP: 190 bytes go, 191 refused', `${R.decrypt(K, R.encrypt(K, new Uint8Array(190).fill(9)).c).M.length} ${(() => { try { R.encrypt(K, new Uint8Array(191)); return 'taken'; } catch { return 'refused'; } })()}`, '190 refused');
check('openssl also refuses 191 bytes', (() => { try { encOpenssl(new Uint8Array(191)); return 'taken'; } catch { return 'refused'; } })(), 'refused');

// the story's locked keys, opened by openssl and WebCrypto; theirs opened by rsa.js
const keys = A.concat([A.KEY, A.MACKEY]);
for (const [name, seed] of [['seed 1', R.SEED], ['seed 2', R.SEED2]]) {
  const c = R.encrypt(K, keys, seed).c;
  check(`${name}: openssl opens Alice's keys`, decOpenssl(c), plain(keys));
  check(`${name}: WebCrypto opens Alice's keys`, await subtleDec(c), plain(keys));
}
check('openssl locks, rsa.js opens', plain(R.decrypt(K, encOpenssl(keys)).M), plain(keys));
check('WebCrypto locks, rsa.js opens', plain(R.decrypt(K, await subtleEnc(keys)).M), plain(keys));
const c1 = R.encrypt(K, keys, R.SEED).c, c2 = R.encrypt(K, keys, R.SEED2).c;
console.log('     seeds 1 and 2: c differs in', [...c1].filter((x, i) => x !== c2[i]).length, 'bytes of 256; c starts', A.hex(c1, 6));
const flipped = Uint8Array.from(c1); flipped[100] ^= 1;
check('a changed byte of c: OAEP refuses it', R.decrypt(K, flipped).M, null);

for (const lang of ['fr', 'en']) {
  const s = P.send(A.ORDER[lang], P.STORY), r = P.receive(s);
  check(`${lang} locked: Bob opens the keys and reads the order`, A.text(r.back), A.ORDER[lang]);
  check(`${lang} locked: Eve gets no keys`, P.eve(s, false, lang).keys, undefined);
  check(`${lang} locked, Eve changes a byte: rejected`, P.receive(P.eve(s, true, lang).pkt).rejected, true);
  const clear = P.send(A.ORDER[lang], P.STORY, 'clear'), e = P.eve(clear, true, lang), rc = P.receive(e.pkt);
  check(`${lang} clear: Eve reads the order`, e.m, A.ORDER[lang]);
  check(`${lang} clear: Eve's rewrite passes the seal, Bob reads 9`, `${rc.sealOk} ${A.text(rc.back)}`, `true ${P.EVE_ORDER[lang]}`);
  const n = P.send(A.ORDER[lang], R.NEXT);
  check(`${lang} next send: Bob reads it too`, A.text(P.receive(n).back), A.ORDER[lang]);
  check(`${lang} next send: WebCrypto opens its keys`, await subtleDec(n.ek), plain(A.concat([R.NEXT.key, R.NEXT.macKey])));
}
process.exit(bad ? 1 : 0);
