// Episode 1.6 « Eve a encore des tours »: encore-des-tours/js (sign.js, gcm.js, packet.js) against
// openssl (pkeyutl RSA-OAEP and RSA-PSS, enc -aes-256-cbc), Python's hmac and node's own crypto and
// WebCrypto. What the story claims, replayed outside the page: Eve's forged packet opens and checks
// with Bob's key alone; Alice's RSA-PSS signature verifies, Eve's does not; a copy verifies as well
// as the original; 42 changed to 43 breaks the signature; AES-GCM matches, and a changed byte is
// InvalidTag; the final packet opens.
//     node tests/tours_values.mjs
import { execFileSync } from 'node:child_process';
import { createPrivateKey, createPublicKey, createCipheriv, createDecipheriv, verify, constants } from 'node:crypto';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as A from '../encore-des-tours/js/aes.js';
import * as R from '../encore-des-tours/js/rsa.js';
import * as S from '../encore-des-tours/js/sign.js';
import * as G from '../encore-des-tours/js/gcm.js';
import * as P from '../encore-des-tours/js/packet.js';
let bad = 0;
const check = (name, got, want) => { const ok = got === want; ok || bad++; console.log(ok ? 'ok  ' : 'FAIL', name, String(got).slice(0, 80), ok ? '' : `(want ${want})`); };
const plain = b => A.hex(b).replace(/ /g, '');
const b64u = x => Buffer.from(R.bytesOf(x, (x.toString(16).length + 1) >> 1)).toString('base64url');
const jwkOf = K => ({ kty: 'RSA', n: b64u(K.n), e: b64u(K.e), d: b64u(K.d), p: b64u(K.p), q: b64u(K.q), dp: b64u(K.dp), dq: b64u(K.dq), qi: b64u(K.qinv) });
const dir = mkdtempSync(tmpdir() + '/tours-');
const pem = (K, name) => { const f = `${dir}/${name}.pem`; writeFileSync(f, createPrivateKey({ key: jwkOf(K), format: 'jwk' }).export({ type: 'pkcs8', format: 'pem' })); return f; };
const bob = pem(R.BOB, 'bob'), alice = pem(S.ALICE, 'alice'), alicePub = `${dir}/alice.pub.pem`;
writeFileSync(alicePub, createPublicKey({ key: jwkOf(S.ALICE), format: 'jwk' }).export({ type: 'spki', format: 'pem' }));
const openKeys = c => execFileSync('openssl', ['pkeyutl', '-decrypt', '-inkey', bob, '-pkeyopt', 'rsa_padding_mode:oaep', '-pkeyopt', 'rsa_oaep_md:sha256', '-pkeyopt', 'rsa_mgf1_md:sha256'],
  { input: Buffer.from(c), stdio: ['pipe', 'pipe', 'ignore'] });
// openssl checks an RSA-PSS signature (SHA-256, MGF1-SHA-256, 32-byte salt) with Alice's public key
function pssOutside(data, sig) {
  const d = `${dir}/data`, s = `${dir}/sig`; writeFileSync(d, data); writeFileSync(s, sig);
  try { execFileSync('openssl', ['dgst', '-sha256', '-verify', alicePub, '-sigopt', 'rsa_padding_mode:pss', '-sigopt', 'rsa_pss_saltlen:32', '-sigopt', 'rsa_mgf1_md:sha256', '-signature', s, d], { stdio: 'ignore' }); return true; } catch { return false; }
}
const pyHmac = (key, data, mac) => execFileSync('python3', ['-I', '-c',
  'import hmac,hashlib,sys; k,d,m=(bytes.fromhex(x) for x in sys.argv[1:]); print(hmac.compare_digest(hmac.new(k,d,hashlib.sha256).digest(),m))',
  plain(key), plain(data), plain(mac)]).toString().trim();
const aesOpenssl = (C, key, iv) => execFileSync('openssl', ['enc', '-aes-256-cbc', '-d', '-K', plain(key), '-iv', plain(iv)], { input: Buffer.from(C), stdio: ['pipe', 'pipe', 'ignore'] }).toString();
// receive_message outside the page, with Bob's defenses: signature (openssl), number, keys (openssl), seal (Python), decrypt (openssl)
function receiveOutside(pkt, { sig = false, last = null } = {}) {
  if (sig && !pssOutside(P.signed(pkt), pkt.sig)) return 'sig';
  if (last !== null && !(P.numOf(pkt.num) > last)) return 'num';
  let keys; try { keys = new Uint8Array(openKeys(pkt.ek)); } catch { return 'keys'; }
  if (pyHmac(keys.slice(32), A.concat([pkt.iv, ...pkt.C]), pkt.tag) !== 'True') return 'seal';
  return aesOpenssl(A.concat(pkt.C), keys.slice(0, 32), pkt.iv);
}
const subtle = crypto.subtle;
const wcPss = await subtle.importKey('jwk', { kty: 'RSA', n: b64u(S.ALICE.n), e: b64u(S.ALICE.e) }, { name: 'RSA-PSS', hash: 'SHA-256' }, false, ['verify']);
const pub = createPublicKey({ key: jwkOf(S.ALICE), format: 'jwk' });

// the signature itself, against node's and openssl's own RSA-PSS
const M = A.bytes('ATTAQUE A 6H DEMAIN'), s1 = S.sign(S.ALICE, M, S.SALT);
check('RSA-PSS: node crypto verifies the page signature', verify('sha256', M, { key: pub, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 }, s1.sig), true);
check('RSA-PSS: WebCrypto verifies it', await subtle.verify({ name: 'RSA-PSS', saltLength: 32 }, wcPss, s1.sig, M), true);
const osig = execFileSync('openssl', ['dgst', '-sha256', '-sign', alice, '-sigopt', 'rsa_padding_mode:pss', '-sigopt', 'rsa_pss_saltlen:32', '-sigopt', 'rsa_mgf1_md:sha256'], { input: Buffer.from(M) });
check('RSA-PSS: the page verifies an openssl signature', S.verify(S.ALICE, M, new Uint8Array(osig)).ok, true);
check('RSA-PSS: a byte changed in the message, no longer', S.verify(S.ALICE, A.bytes('ATTAQUE A 9H DEMAIN'), s1.sig).ok, false);
check('Alice and Eve: two RSA-2048 keys, 2048-bit moduli', `${S.ALICE.n.toString(2).length} ${S.EVE.n.toString(2).length}`, '2048 2048');

for (const lang of ['fr', 'en']) {
  const order = A.ORDER[lang];
  // Eve's forgery: Bob's public padlock, her keys, a valid seal
  const f = P.forge(lang);
  check(`${lang} forged packet: outside, Bob's key opens it and reads Eve's order`, receiveOutside(f), P.FORGED[lang]);
  check(`${lang} forged packet: page agrees`, A.text(P.receive(f).back), P.FORGED[lang]);
  const fs = P.forge(lang, S.EVE);
  check(`${lang} Eve's own signature: page and openssl refuse it under Alice's key`, `${P.receive(fs, { sig: true }).rejected} ${receiveOutside(fs, { sig: true })}`, 'sig sig');
  // Alice's signed packet, and Eve's copy of it
  const s = P.alice(order);
  check(`${lang} Alice's signed packet: openssl verifies, Bob reads`, receiveOutside(s, { sig: true }), order);
  check(`${lang} Eve's copy: read again, page and outside`, `${A.text(P.receive(P.replay(s), { sig: true }).back)}|${receiveOutside(P.replay(s), { sig: true })}`, `${order}|${order}`);
  check(`${lang} a byte of the ciphertext changed: rejected at the signature`, `${P.receive(P.tamper(s), { sig: true }).rejected} ${receiveOutside(P.tamper(s), { sig: true })}`, 'sig sig');
  // the number
  const n = P.alice(order, P.NUM);
  check(`${lang} n° 42 on 8 bytes`, plain(n.num), '000000000000002a');
  check(`${lang} n° 42 after 41: read (page, outside)`, `${A.text(P.receive(n, { sig: true, last: 41 }).back)}|${receiveOutside(n, { sig: true, last: 41 })}`, `${order}|${order}`);
  check(`${lang} n° 42 again: rejected at the number`, `${P.receive(P.replay(n), { sig: true, last: 42 }).rejected} ${receiveOutside(P.replay(n), { sig: true, last: 42 })}`, 'num num');
  const bumped = P.tamper(n, 'num', 7, 42 ^ 43);
  check(`${lang} 42 changed to 43: number 43, signature broken (page, outside)`, `${P.numOf(bumped.num)} ${P.receive(bumped, { sig: true, last: 41 }).rejected} ${receiveOutside(bumped, { sig: true, last: 41 })}`, '43 sig sig');
  // AES-GCM
  const g = P.gcm(order), c = createCipheriv('aes-256-gcm', A.KEY, P.NONCE), ct = Buffer.concat([c.update(order), c.final()]);
  check(`${lang} GCM ciphertext = node aes-256-gcm`, plain(g.C), ct.toString('hex'));
  check(`${lang} GCM tag = node aes-256-gcm`, plain(g.tag), c.getAuthTag().toString('hex'));
  const wk = await subtle.importKey('raw', A.KEY, 'AES-GCM', false, ['encrypt']);
  check(`${lang} GCM ciphertext ‖ tag = WebCrypto`, Buffer.from(await subtle.encrypt({ name: 'AES-GCM', iv: P.NONCE }, wk, A.bytes(order))).toString('hex'), plain(g.C) + plain(g.tag));
  check(`${lang} GCM: no padding, as long as the order`, g.C.length, A.bytes(order).length);
  const e = P.gcmTamper(g), d = createDecipheriv('aes-256-gcm', A.KEY, P.NONCE); d.setAuthTag(Buffer.from(e.tag)); d.update(e.C);
  let thrown = false; try { d.final(); } catch { thrown = true; }
  check(`${lang} GCM: Eve's byte, page refuses and node throws`, `${P.gcmOpen(e).ok} ${P.gcmOpen(e).M} ${thrown}`, 'false null true');
  // nonce reused: the XOR of the ciphertexts is the XOR of the orders
  const other = A.bytes(lang === 'fr' ? 'RETRAITE A L AUBE!!' : 'RETREAT AT DAWN!!!!!!!'), g2 = G.encrypt(A.KEY, P.NONCE, other);
  check(`${lang} GCM nonce reused: C1 xor C2 = M1 xor M2`, plain(A.xor(g.C, g2.C)), plain(A.xor(A.bytes(order), other)));
  // the final packet
  const fin = P.final(order), o = P.finalOpen(fin);
  check(`${lang} final packet: openssl verifies Alice's signature`, pssOutside(P.signed(fin), fin.sig), true);
  const key = new Uint8Array(openKeys(fin.ek)), fd = createDecipheriv('aes-256-gcm', key, fin.iv); fd.setAuthTag(Buffer.from(fin.tag));
  check(`${lang} final packet: outside opens the key and GCM gives the order`, Buffer.concat([fd.update(fin.C[0]), fd.final()]).toString(), order);
  check(`${lang} final packet: page reads it, n° 43`, `${A.text(o.back)} ${P.numOf(fin.num)}`, `${order} 43`);
  check(`${lang} final packet sizes: 8 + 256 + 12 + ${order.length} + 16 + 256`, P.has(fin).map(b => P.field(fin, b).length).join(' '), `8 256 12 ${A.bytes(order).length} 16 256`);
}
// the sandbox's fresh draws
const fr = P.send('RETRAITE A MIDI', P.fresh(), { num: 7, signer: S.ALICE });
check('fresh keys, a fresh salt: outside reads the sandbox packet', receiveOutside(fr, { sig: true, last: 6 }), 'RETRAITE A MIDI');
process.exit(bad ? 1 : 0);
