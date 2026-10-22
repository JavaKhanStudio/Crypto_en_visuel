// Le garde trop pressé (r41): garde/js/hmac.js against node:crypto and Python's hmac (values
// computed with hmac.new(b"cle_secrete_partagee", m, hashlib.sha256).hexdigest(), the slide « HMAC »).
//     node tests/garde_values.mjs
import { createHmac, createHash } from 'node:crypto';
import { hmacHex, sha256Hex } from '../lib/hmac.js';
import { KEY, MSG_A, MSG_E, MAC_A, MAC_E, looks, guess } from '../garde/js/data.js';

let bad = 0;
const eq = (name, got, want) => { const ok = got === want; if (!ok) bad++; console.log(ok ? 'ok  ' : 'FAIL', name, ok ? '' : `${got} != ${want}`); };
eq('sha256 empty', sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
eq('sha256 abc', sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
eq('mac Alice (Python)', MAC_A, '1598e59f08a4faece61ec9a67944304e66e5e5fe4f15936c989686d29f78027d');
eq('mac Eve (Python)', MAC_E, 'b2ef092277667582010f50460c54b1abdce90f00c645db5998776feb817a24c6');
// a spread of keys and messages: long keys (hashed first), accents, 55/56/64-byte edges
for (const k of [KEY, '', 'k'.repeat(64), 'k'.repeat(65), 'clé'])
  for (const m of [MSG_A, '', 'é€😀', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'y'.repeat(200)]) {
    eq(`hmac ${k.length}/${m.length}`, hmacHex(k, m), createHmac('sha256', k).update(m).digest('hex'));
    eq(`sha ${m.length}`, sha256Hex(m), createHash('sha256').update(m).digest('hex'));
  }
// the guards: == looks up to the first wrong letter, compare_digest at all 64
eq('== on 0…', looks(MAC_E, guess('', '0'), 'eq'), 1);
eq('== on b…', looks(MAC_E, guess('', 'b'), 'eq'), 2);
eq('== on b2…', looks(MAC_E, guess('b', '2'), 'eq'), 3);
eq('== on the right one', looks(MAC_E, MAC_E, 'eq'), 64);
eq('compare_digest on 0…', looks(MAC_E, guess('', '0'), 'cd'), 64);
console.log(bad ? `${bad} FAILED` : 'all ok');
process.exit(bad ? 1 : 0);
