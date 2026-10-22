// r209: the VPN episode's crypto, checked. vpn/js/x25519.js and vpn/js/aead.js against the RFC
// vectors (RFC 7748 §5.2 and §6.1, RFC 8439 §2.4.2, §2.5.2 and §2.8.2), against node:crypto on random
// inputs, and the episode's demo values (vpn/js/net.js), written out so the story can quote them; then
// who sees what, and every figure the story, the tags and the quiz write. node tests/vpn_values.mjs
import crypto from 'node:crypto';
import { x25519, publicKey, shared } from '../vpn/js/x25519.js';
import { chacha20, poly1305, seal, open } from '../vpn/js/aead.js';
// the demo's bytes, for the story to quote; the same values are recomputed by node:crypto below
const EXPECT = {
  pa: '1c92aa0d76e6a22a5dbec1c61bee6304d144e71f36409ee5e87c0585ce288d11',
  pv: '6fa2577284e724745477fbc0867651d3c35215ef7e2716aae2410128657e6d1d',
  k: 'c9f819a03b476ba12d235eaa0b4fb3b25b60c8cfa6c573a6b398291b8821d357',
  sealed: '411859143a3ec62d7b58d468dd 10a635ffb0be9ed5d34621c57d8159b7' };

let bad = 0;
const hex = b => Buffer.from(b).toString('hex');
const unhex = h => Uint8Array.from(Buffer.from(h.replace(/\s/g, ''), 'hex'));
const check = (name, got, want) => {
  const ok = got === want; if (!ok) bad++;
  console.log(ok ? 'ok ' : 'BAD', name, ok ? '' : `\n    got  ${got}\n    want ${want}`);
};

// RFC 7748 §5.2
check('x25519 §5.2 #1', hex(x25519(unhex('a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4'),
  unhex('e6db6867583030db3594c1a424b15f7c726624ec26b3353b10a903a6d0ab1c4c'))), 'c3da55379de9c6908e94ea4df28d084f32eccf03491c71f754b4075577a28552');
check('x25519 §5.2 #2', hex(x25519(unhex('4b66e9d4d1b4673c5ad22691957d6af5c11b6421e0ea01d42ca4169e7918ba0d'),
  unhex('e5210f12786811d3f4b7959d0538ae2c31dbe7106fc03c3efc4cd549c715a493'))), '95cbde9476e8907d7aade45cb4b873f88b595a68799fa152e6f8f7647aac7957');
// RFC 7748 §6.1: Alice and Bob
const aS = unhex('77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a'), bS = unhex('5dab087e624a8a4b79e17f8b83800ee66f3bb1292618b6fd1c2f8b27ff88e0eb');
check('x25519 §6.1 Alice public', hex(publicKey(aS)), '8520f0098930a754748b7ddcb43ef75a0dbf3a0d26381af4eba4a98eaa9b4e6a');
check('x25519 §6.1 Bob public', hex(publicKey(bS)), 'de9edb7d7b7dc1b4d35b61c2ece435373f8343c85b78674dadfc7e146f882b4f');
check('x25519 §6.1 shared', hex(shared(aS, publicKey(bS))), '4a5d9d5ba4ce2de1728e3bf480350f25e07e21c947d19e3376f09b3c1e161742');

// RFC 8439 §2.4.2: the sunscreen
const k8439 = unhex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
const sun = new TextEncoder().encode("Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.");
check('chacha20 §2.4.2', hex(chacha20(k8439, 1, unhex('000000000000004a00000000'), sun)).slice(0, 32), '6e2e359a2568f98041ba0728dd0d6981');
// RFC 8439 §2.5.2
check('poly1305 §2.5.2', hex(poly1305(unhex('85d6be7857556d337f4452fe42d506a80103808afb0db2fd4abff6af4149f51b'),
  new TextEncoder().encode('Cryptographic Forum Research Group'))), 'a8061dc1305136c6c22b8baf0c0127a9');
// RFC 8439 §2.8.2
const k82 = unhex('808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f'), n82 = unhex('070000004041424344454647'), aad82 = unhex('50515253c0c1c2c3c4c5c6c7');
const s82 = seal(k82, n82, sun, aad82);
check('aead §2.8.2 ciphertext', hex(s82.ct).slice(0, 32), 'd31a8d34648e60db7b86afbc53ef7ec2');
check('aead §2.8.2 tag', hex(s82.tag), '1ae10b594f09e26a7e902ecbd0600691');

// against node:crypto, random inputs
const jwk = (d) => crypto.createPrivateKey({ key: { kty: 'OKP', crv: 'X25519', d: Buffer.from(d).toString('base64url'),
  x: Buffer.from(publicKey(d)).toString('base64url') }, format: 'jwk' });
let same = 0;
for (let i = 0; i < 20; i++) {
  const a = crypto.randomBytes(32), b = crypto.randomBytes(32);
  const pubB = crypto.createPublicKey({ key: { kty: 'OKP', crv: 'X25519', x: Buffer.from(publicKey(b)).toString('base64url') }, format: 'jwk' });
  const node = crypto.diffieHellman({ privateKey: jwk(a), publicKey: pubB });
  const pubFromNode = crypto.createPublicKey(jwk(a)).export({ format: 'jwk' }).x;
  if (hex(node) === hex(shared(a, publicKey(b))) && pubFromNode === Buffer.from(publicKey(a)).toString('base64url')) same++;
  const key = crypto.randomBytes(32), nonce = crypto.randomBytes(12), msg = crypto.randomBytes(1 + i * 7), aad = crypto.randomBytes(i % 3 * 5);
  const c = crypto.createCipheriv('chacha20-poly1305', key, nonce, { authTagLength: 16 }); if (aad.length) c.setAAD(aad);
  const ct = Buffer.concat([c.update(msg), c.final()]), mine = seal(key, nonce, msg, aad);
  if (hex(ct) === hex(mine.ct) && hex(c.getAuthTag()) === hex(mine.tag)) same++;
}
check('20 random X25519 + 20 random seals match node:crypto', same, 40);

// the deck's ChaCha20 example (D4): its stream is block 0; in the AEAD the packet starts at counter 1
const dk = new TextEncoder().encode('une-cle-de-32-octets-pour-chacha'), dn = new TextEncoder().encode('nonce-unique');
check('deck stream, counter 0', hex(chacha20(dk, 0, dn, new Uint8Array(8))), 'e5a8527eb645e3a1');
const v = seal(dk, dn, new TextEncoder().encode('VIREMENT'));
check('deck key, VIREMENT sealed', hex(v.ct) + ' ' + hex(v.tag), '14d122a55d2739a0 a86cf41c4308b56e66ca9d2958d99814');

// THE EPISODE'S DEMO (r197): the page's own values, from vpn/js/net.js (Alice's and the VPN server's
// secrets, the shared secret, the inner envelope's address line sealed under it), each redone here by
// node:crypto. The episode uses the shared secret directly as the packet key; its story says WireGuard
// first mixes several such secrets through a hash.
globalThis.location = { search: '' };
globalThis.localStorage = { getItem: () => null, setItem() {} };
const N = await import('../vpn/js/net.js');
const { DICTS } = await import('../vpn/js/i18n.js');
const { plain } = await import('../lib/md.js');
const { QUIZ } = await import('../vpn/js/quiz-data.js');
const enc = s => new TextEncoder().encode(s);
check('demo secrets are 32 bytes', `${N.SECRET.a.length} ${N.SECRET.v.length}`, '32 32');
check('demo: alice public', hex(N.PUBLIC.a), EXPECT.pa);
check('demo: vpn public', hex(N.PUBLIC.v), EXPECT.pv);
check('demo: both sides find the same secret', hex(N.KEY.a) + ' ' + hex(N.KEY.v), EXPECT.k + ' ' + EXPECT.k);
check('demo: the packet is the inner envelope\'s address line, Bob\'s', new TextDecoder().decode(N.PACKET), N.ADDR.bob);
check('demo: sealed packet', hex(N.SEALED.ct) + ' ' + hex(N.SEALED.tag), EXPECT.sealed);
const nodeK = crypto.diffieHellman({ privateKey: jwk(N.SECRET.a), publicKey: crypto.createPublicKey(jwk(N.SECRET.v)) });
const nc = crypto.createCipheriv('chacha20-poly1305', nodeK, N.NONCE, { authTagLength: 16 });
const nct = Buffer.concat([nc.update(N.PACKET), nc.final()]);
check('demo: node:crypto finds the same secret and sealed packet', hex(nodeK) + ' ' + hex(nct) + ' ' + hex(nc.getAuthTag()), EXPECT.k + ' ' + EXPECT.sealed);
check('demo: the VPN server opens it', new TextDecoder().decode(N.opened(N.SEALED.ct) ?? new Uint8Array()), N.ADDR.bob);
check('demo: tagOf() is the seal the server recomputes', hex(N.tagOf(N.SEALED.ct)), hex(N.SEALED.tag));
// one bit flipped on the way (the story's): the recomputed seal differs, the packet is thrown away
const f = N.flipped();
check(`demo: byte ${N.FLIP} flipped is 3a -> 3b`, hex(N.SEALED.ct.slice(N.FLIP, N.FLIP + 1)) + ' ' + hex(f.slice(N.FLIP, N.FLIP + 1)), '3a 3b');
check('demo: flipped -> rejected', N.opened(f), null);
const dn2 = crypto.createDecipheriv('chacha20-poly1305', nodeK, N.NONCE, { authTagLength: 16 }); dn2.setAuthTag(Buffer.from(N.SEALED.tag)); dn2.update(f);
let nodeRejects = false; try { dn2.final(); } catch { nodeRejects = true; }
check('demo: node:crypto rejects the flipped packet too', nodeRejects, true);
check('demo: recomputed seal differs from the one sent', hex(N.tagOf(f)) !== hex(N.SEALED.tag), true);
for (const at of [0, 9, N.PACKET.length - 1]) {
  const t = Uint8Array.from(N.SEALED.ct); t[at] ^= 1;
  check(`demo: byte ${at} flipped -> rejected`, N.opened(t), null);
}
check('demo: another key -> rejected', open(shared(enc('eve-essaie-avec-sa-propre-cle!!!'), N.PUBLIC.v), N.NONCE, N.SEALED.ct, N.SEALED.tag), null);
check('demo: sealed size', N.SIZE.sealed, 29);

// WHO SEES WHAT (sees()): the story's claims, place by place
const S = (w, p) => JSON.stringify(N.sees(w, p));
check('no tunnel, HTTP: Eve reads the content', N.sees('e', { https: false }).content, 'clear');
check('no tunnel, HTTPS: Eve and the provider see Bob\'s address and the name, not the content', S('e', {}) === S('i', {}) && N.sees('e', {}).to === 'bob' && N.sees('e', {}).name && N.sees('e', {}).content === 'locked', true);
check('tunnel: Eve and the provider see only the VPN\'s address', ['e', 'i'].map(w => N.sees(w, { tunnel: true })).every(s => s.to === 'vpn' && !s.name && s.content === 'sealed'), true);
check('tunnel: Victor sees what the provider saw (the trust moves)', S('v', { tunnel: true }), S('i', {}));
check('tunnel: Bob sees the VPN\'s address, not the café\'s', N.sees('b', { tunnel: true }).from + ' ' + N.sees('b', {}).from, 'vpn cafe');
check('no tunnel: nothing passes through the VPN', N.sees('v', {}).content, null);
check('route through the tunnel', N.route(true).join(''), 'awivb');
// Victor's other customers (step 12): documentation addresses (RFC 5737), example names (RFC 2606)
// each has its own source and destination, all distinct, so Victor's tag reads every line as from → to name (r366)
check('other customers: RFC 5737 addresses, .example names', N.OTHERS.every(o => [o.from, o.to].every(a => /^(192\.0\.2|198\.51\.100|203\.0\.113)\.\d{1,3}$/.test(a)) && o.name.endsWith('.example'))
  && new Set(N.OTHERS.flatMap(o => [o.from, o.to]).concat(Object.values(N.ADDR))).size === 2 * N.OTHERS.length + 3, true);
// Victor's crowd tag on a phone (step 12) has room for lines as long as Alice's, not more (r366)
check('other customers: no tag line longer than Alice\'s', N.OTHERS.every(o => `${o.from} → ${o.to} ${o.name}`.length <= `${N.ADDR.cafe} → ${N.ADDR.bob} ${N.NAME}`.length), true);

// THE WORDS: every address, byte group and count the story, the tags and the quiz write is the page's
for (const [l, d] of Object.entries(DICTS)) {
  const text = Object.values(d.steps).map(s => plain(s.p) + ' ' + Object.entries(s).filter(([k]) => k.length === 1).map(([, x]) => x).join(' ')).join(' ');
  const addrs = new Set(text.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g));
  check(`${l}: every address written is one of the map's`, [...addrs].every(a => Object.values(N.ADDR).includes(a)), true);
  check(`${l}: the shared key quoted (c9 f8 19 a0) is the computed one`, text.includes('c9 f8 19 a0') && hex(N.KEY.a).startsWith('c9f819a0'), true);
  check(`${l}: the flipped byte quoted (3a, 3b) is the computed one`, text.includes('3a') && text.includes('3b') && f[N.FLIP] === 0x3b, true);
  check(`${l}: the seal is 16 bytes and the secrets 32`, /16[ -](octets|bytes?)/.test(text) && /32[ -](octets|bytes?)/.test(text) && N.SEALED.tag.length === 16, true);
  check(`${l}: the name is bob.example`, text.includes(N.NAME), true);
  check(`${l}: 14 steps, 5 chapters`, `${Object.keys(d.steps).length} ${d.ch.length}`, '14 5');
  check(`${l}: the quiz has 7 questions, each with its right answers inside the options`, QUIZ.length === 7 && QUIZ.every(q => q[l].o.length === 4 && q.correct.every(c => c < 4)), true);
}
// an episode cited by its name ({@3|« Les couleurs de Diffie-Hellman »}, r360) is spelled as the home page names it
const { EPISODES } = await import('../xref.js');
const fs = await import('node:fs');
const home = fs.readFileSync(new URL('../home.js', import.meta.url), 'utf8');
for (const [l, d] of Object.entries(DICTS)) {
  let part = l === 'en' ? home.slice(home.indexOf('const en = {')) : home.slice(0, home.indexOf('const en = {'));
  part = part.slice(part.indexOf('ep: {'));   // the episodes' titles, not the topic lists above them
  for (const s of Object.values(d.steps)) for (const [, n, name] of s.p.matchAll(/\{@([\d.]+)\|[«‘]\s*(.+?)\s*[»’]\}/g)) {
    const slug = EPISODES[n]?.[0], m = slug && part.match(new RegExp(`'?${slug}'?: \\[(['"])(.*?)\\1`));
    check(`${l}: episode ${n} cited as « ${name} »`, name, m?.[2]);
  }
}

// every key of the French dicts exists in English (a missing one would show French on the EN page)
const keys = (o, p = '') => Object.entries(o).flatMap(([k, x]) => typeof x === 'object' && !Array.isArray(x) ? keys(x, p + k + '.') : [p + k]);
const missing = keys(DICTS.fr).filter(k => !keys(DICTS.en).includes(k));
check('every French key has its English', missing.join(', '), '');

console.log(bad ? `${bad} BAD` : 'all ok');
process.exit(bad ? 1 : 0);
