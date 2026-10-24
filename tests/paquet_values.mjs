// Episode 1.5 « Le paquet complet »: paquet-complet/js/packet.js, the whole packet, against openssl
// (enc -aes-256-cbc, pkeyutl RSA-OAEP SHA-256), Python's hmac (compare_digest) and the browser's own
// AES-CBC, HMAC and RSA-OAEP (WebCrypto, node's crypto.subtle): Bob's receive_message replayed outside
// the page, on the page's packet. Then what the story claims: 336 bytes, Eve's byte rejected undecrypted
// in every brick, what decrypt-first would have computed, main.py's scene.
//     node tests/paquet_values.mjs
import { execFileSync } from 'node:child_process';
import { createPrivateKey } from 'node:crypto';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as A from '../ficelle/lib/saga-aes.js';
import * as R from '../ficelle/lib/rsa.js';
import * as P from '../paquet-complet/js/packet.js';
let bad = 0;
const check = (name, got, want) => { const ok = got === want; ok || bad++; console.log(ok ? 'ok  ' : 'FAIL', name, String(got).slice(0, 80), ok ? '' : `(want ${want})`); };
const plain = b => A.hex(b).replace(/ /g, '');
const b64u = x => Buffer.from(R.bytesOf(x, (x.toString(16).length + 1) >> 1)).toString('base64url');
const K = R.BOB;
const jwk = { kty: 'RSA', n: b64u(K.n), e: b64u(K.e), d: b64u(K.d), p: b64u(K.p), q: b64u(K.q), dp: b64u(K.dp), dq: b64u(K.dq), qi: b64u(K.qinv) };
const dir = mkdtempSync(tmpdir() + '/paquet-'), bob = `${dir}/bob.pem`;
writeFileSync(bob, createPrivateKey({ key: jwk, format: 'jwk' }).export({ type: 'pkcs8', format: 'pem' }));
const openKeys = c => execFileSync('openssl', ['pkeyutl', '-decrypt', '-inkey', bob, '-pkeyopt', 'rsa_padding_mode:oaep', '-pkeyopt', 'rsa_oaep_md:sha256', '-pkeyopt', 'rsa_mgf1_md:sha256'],
  { input: Buffer.from(c), stdio: ['pipe', 'pipe', 'ignore'] });
const aesOpenssl = (m, key, iv, dec = false) => execFileSync('openssl', ['enc', '-aes-256-cbc', ...(dec ? ['-d'] : []), '-K', plain(key), '-iv', plain(iv)], { input: Buffer.from(m), stdio: ['pipe', 'pipe', 'ignore'] });
const pyHmac = (key, data, mac) => execFileSync('python3', ['-I', '-c',
  'import hmac,hashlib,sys; k,d,m=(bytes.fromhex(x) for x in sys.argv[1:]); h=hmac.new(k,d,hashlib.sha256).digest(); print(h.hex(), hmac.compare_digest(h,m))',
  plain(key), plain(data), plain(mac)]).toString().trim().split(' ');
const subtle = crypto.subtle;
const rsaKey = await subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);

// receive_message, outside the page: openssl opens the keys, Python checks the seal, openssl decrypts.
// Returns the order, or what stopped Bob ('keys' or 'seal'), never decrypting a packet with a wrong seal.
function receiveOutside(pkt) {
  let keys; try { keys = new Uint8Array(openKeys(pkt.ek)); } catch { return 'keys'; }
  const data = A.concat([pkt.iv, ...pkt.C]), [, ok] = pyHmac(keys.slice(32), data, pkt.tag);
  if (ok !== 'True') return 'seal';
  return aesOpenssl(A.concat(pkt.C), keys.slice(0, 32), pkt.iv, true).toString();
}

for (const lang of ['fr', 'en']) {
  const order = A.ORDER[lang], s = P.send(order, P.STORY);
  check(`${lang} ciphertext = openssl enc -aes-256-cbc`, plain(A.concat(s.C)), aesOpenssl(order, A.KEY, A.IV).toString('hex'));
  const [h, ok] = pyHmac(A.MACKEY, A.concat([s.iv, ...s.C]), s.tag);
  check(`${lang} seal = Python hmac(IV ‖ ciphertext), compare_digest`, `${plain(s.tag)} ${ok}`, `${h} True`);
  const wc = await subtle.sign('HMAC', await subtle.importKey('raw', A.MACKEY, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), A.concat([s.iv, ...s.C]));
  check(`${lang} seal = WebCrypto HMAC`, plain(s.tag), Buffer.from(wc).toString('hex'));
  check(`${lang} locked keys: WebCrypto RSA-OAEP opens AES ‖ HMAC`, Buffer.from(await subtle.decrypt({ name: 'RSA-OAEP' }, rsaKey, s.ek)).toString('hex'), plain(A.concat([A.KEY, A.MACKEY])));
  check(`${lang} packet: 256 + 16 + 32 + 32 = 336 bytes`, P.BRICKS.reduce((n, b) => n + P.field(s, b).length, 0), 336);
  check(`${lang} padding: ${order.length} bytes + ${s.padN} of value ${s.padN}`, A.hex(A.pad(s.raw).slice(-s.padN)), A.hex(new Uint8Array(s.padN).fill(s.padN)));
  check(`${lang} receive_message outside the page reads the order`, receiveOutside(s), order);
  check(`${lang} page: Bob reads the order`, A.text(P.receive(s).back), order);

  // Eve's byte: the first byte of the ciphertext, one bit
  const e = P.tamper(s), r = P.receive(e);
  check(`${lang} Eve's byte: one bit of ciphertext byte 1 flipped`, plain(A.concat(s.C)) !== plain(A.concat(e.C)) && s.C[0][0] ^ e.C[0][0], 1);
  check(`${lang} Eve's byte: page rejects at the seal, nothing decrypted`, `${r.rejected} ${r.decrypted}`, 'seal false');
  check(`${lang} Eve's byte: outside rejects at the seal`, receiveOutside(e), 'seal');
  console.log(`     ${lang} seal recomputed vs packet's: ${[...r.mine].filter((x, i) => x === e.tag[i]).length} of 32 bytes equal`);
  for (const b of P.BRICKS) {
    const x = P.tamper(s, b, P.ANYWHERE[b]), rx = P.receive(x);
    check(`${lang} a byte of ${b} (#${P.ANYWHERE[b] + 1}): rejected undecrypted, page = outside`, `${rx.rejected} ${rx.decrypted} ${receiveOutside(x)}`, `${b === 'ek' ? 'keys' : 'seal'} false ${b === 'ek' ? 'keys' : 'seal'}`);
  }
  // decrypt first: block 1 scrambled, block 2 byte 1 flipped by Eve's bit, padding still right
  const late = P.receive(e, false), want = A.bytes(order); want[16] ^= 1;
  check(`${lang} decrypt-first: Bob decrypts, then rejects`, `${late.decrypted} ${late.rejected}`, 'true seal');
  check(`${lang} decrypt-first: 2nd block = Alice's with byte 1 flipped, padding right`, `${plain(late.back.slice(16))} ${late.padGood}`, `${plain(want.slice(16))} true`);
  check(`${lang} decrypt-first: 1st block scrambled`, plain(late.back.slice(0, 16)) !== plain(want.slice(0, 16)), true);

  // main.py's scene: the next send, fresh keys
  const hello = P.send(P.HELLO[lang], P.SCENE);
  check(`${lang} scene: Bob reads « ${P.HELLO[lang]} » (page, outside)`, `${A.text(P.receive(hello).back)}|${receiveOutside(hello)}`, `${P.HELLO[lang]}|${P.HELLO[lang]}`);
  check(`${lang} scene: Eve's byte, rejected (page, outside)`, `${P.receive(P.tamper(hello)).rejected} ${receiveOutside(P.tamper(hello))}`, 'seal seal');
}
// the sandbox's fresh draws: a whole round trip with random keys
const f = P.send('RETRAITE A MIDI', P.fresh());
check('fresh keys: outside reads the sandbox packet', receiveOutside(f), 'RETRAITE A MIDI');
process.exit(bad ? 1 : 0);
