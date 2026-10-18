// The slides of the passwords chapter (« Mots de passe - Dictionnaire », « - Le sel », « - bcrypt »,
// « - bcrypt - La lenteur ») against sel/js/hash.js, plus RFC 1321's MD5 vectors and bcrypt
// strings computed by Python's bcrypt 5.0 (the OpenBSD U*U vector, and the episode's own).
// node tests/sel_values.mjs
import * as H from '../sel/js/hash.js';
import * as D from '../sel/js/data.js';
let bad = 0;
const check = (name, got, want) => { const ok = got === want; ok || bad++; console.log(ok ? 'ok  ' : 'FAIL', name, got, ok ? '' : `(want ${want})`); };
// RFC 1321, appendix A.5
check('MD5 ""', H.md5(''), 'd41d8cd98f00b204e9800998ecf8427e');
check('MD5 "abc"', H.md5('abc'), '900150983cd24fb0d6963f7d28e17f72');
check('MD5 80 digits', H.md5('1234567890'.repeat(8)), '57edf4a22be3c955ac49da2e2107b67a');
// « Mots de passe - Dictionnaire »
check('password', D.short(H.md5('password')), '5f4dcc3b');
check('123456', D.short(H.md5('123456')), 'e10adc39');
check('admin', D.short(H.md5('admin')), '21232f29');
check('book = slide, first three', D.LIST.slice(0, 3).map(([w, h]) => w + ':' + h.slice(0, 8)).join(' '), 'password:5f4dcc3b 123456:e10adc39 admin:21232f29');
// « Mots de passe - Le sel »: the + is glued, nothing in between
check('alice password+x7k2m', D.short(H.md5('password' + D.USERS[0].salt)), 'cffbee8f');
check('bob password+r3n8q', D.short(H.md5('password' + D.USERS[1].salt)), '648c5237');
check('a literal + would not match', D.short(H.md5('password+x7k2m')) !== 'cffbee8f', true);
// bcrypt: the OpenBSD vector, then the episode's strings (Python's bcrypt gave them)
check('bcrypt U*U', H.bcrypt('U*U', '$2a$05$CCCCCCCCCCCCCCCCCCCCC.'), '$2a$05$CCCCCCCCCCCCCCCCCCCCC.E5YPO9kmyuRGyh0XouQYb4YMJKvyOeW');
const t0 = performance.now();
check('bcrypt alice', H.bcrypt('password', D.BCRYPT.alice.slice(0, 29)), D.BCRYPT.alice);
const ms = performance.now() - t0;
check('bcrypt bob', H.bcrypt('password', D.BCRYPT.bob.slice(0, 29)), D.BCRYPT.bob);
check('bcrypt 123456 with alice salt', H.bcrypt('123456', D.BCRYPT.alice.slice(0, 29)), D.BCRYPT_TRY['123456']);
check('salt string round trip', H.saltString(new Uint8Array(16)).length, 29);
console.log(`     (one bcrypt rounds=12 took ${(ms / 1000).toFixed(2)} s here; the slide says 0.24 s on Simon's machine)`);
// « SHA-256 est trop rapide »: 8 alphanumeric characters at ten billion a second, about six hours
check('62^8 / 1e10 in hours', Math.round(D.seconds(D.SPACE8, 'md5') / 3600), 6);
check('62^8 / 2000 over a thousand years', D.seconds(D.SPACE8, 'bcrypt') / (365.25 * 86400) > 1000, true);
process.exit(bad ? 1 : 0);
