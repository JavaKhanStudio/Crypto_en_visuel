// r209: the VPN episode's crypto, checked. vpn/js/x25519.js and vpn/js/aead.js against the RFC
// vectors (RFC 7748 §5.2 and §6.1, RFC 8439 §2.4.2, §2.5.2 and §2.8.2), against node:crypto on random
// inputs, and the episode's demo values, written out so the story can quote them. node tests/vpn_values.mjs
import crypto from 'node:crypto';
import { x25519, publicKey, shared } from '../vpn/js/x25519.js';
import { chacha20, poly1305, seal, open } from '../vpn/js/aead.js';
// the demo's bytes, for the story to quote; the same values are recomputed by node:crypto below
const EXPECT = {
  pa: '1c92aa0d76e6a22a5dbec1c61bee6304d144e71f36409ee5e87c0585ce288d11',
  pv: '6fa2577284e724745477fbc0867651d3c35215ef7e2716aae2410128657e6d1d',
  k: 'c9f819a03b476ba12d235eaa0b4fb3b25b60c8cfa6c573a6b398291b8821d357',
  sealed: '064413492f6d877e650d823b80e28acc806126ae084ebfea 0d1c53a7b1c738e3ae9ed1e131707964' };

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

// THE EPISODE'S DEMO (r197): Alice's and the VPN server's secrets, 32 bytes each, the shared secret,
// and one packet for Bob sealed under it. The episode uses the shared secret directly as the
// packet key; its story says WireGuard first mixes several such secrets through a hash.
const enc = s => new TextEncoder().encode(s);
const ALICE = enc('alice-garde-ce-secret-pour-elle!'), VPN = enc('le-serveur-vpn-garde-le-sien-!!!');
check('demo secrets are 32 bytes', `${ALICE.length} ${VPN.length}`, '32 32');
const pa = publicKey(ALICE), pv = publicKey(VPN), k1 = shared(ALICE, pv), k2 = shared(VPN, pa);
check('demo: both sides find the same secret', hex(k1), hex(k2));
const NONCE = new Uint8Array(12);   // WireGuard's nonce is a packet counter: 4 zero bytes, then the counter on 8 bytes (0 for the first)
const PACKET = enc('vers bob.example : GET /');
const sealed = seal(k1, NONCE, PACKET);
console.log('    alice public ', hex(pa), '\n    vpn public   ', hex(pv), '\n    shared       ', hex(k1),
  '\n    packet ct    ', hex(sealed.ct), '\n    packet tag   ', hex(sealed.tag));
check('demo: alice public', hex(pa), EXPECT.pa);
check('demo: vpn public', hex(pv), EXPECT.pv);
check('demo: shared secret', hex(k1), EXPECT.k);
check('demo: sealed packet', hex(sealed.ct) + ' ' + hex(sealed.tag), EXPECT.sealed);
const nodeK = crypto.diffieHellman({ privateKey: jwk(ALICE), publicKey: crypto.createPublicKey(jwk(VPN)) });
const nc = crypto.createCipheriv('chacha20-poly1305', nodeK, NONCE, { authTagLength: 16 });
const nct = Buffer.concat([nc.update(PACKET), nc.final()]);
check('demo: node:crypto finds the same secret and sealed packet', hex(nodeK) + ' ' + hex(nct) + ' ' + hex(nc.getAuthTag()), EXPECT.k + ' ' + EXPECT.sealed);
check('demo: the VPN server opens it', new TextDecoder().decode(open(k2, NONCE, sealed.ct, sealed.tag) ?? new Uint8Array()), 'vers bob.example : GET /');
// one byte flipped on the way: the tag no longer matches, the packet is thrown away
for (const at of [0, 9, PACKET.length - 1]) {
  const t = Uint8Array.from(sealed.ct); t[at] ^= 1;
  check(`demo: byte ${at} flipped -> rejected`, open(k2, NONCE, t, sealed.tag), null);
}
const t2 = Uint8Array.from(sealed.tag); t2[0] ^= 0x80;
check('demo: tag changed -> rejected', open(k2, NONCE, sealed.ct, t2), null);
check('demo: another key -> rejected', open(shared(enc('eve-essaie-avec-sa-propre-cle!!!'), pv), NONCE, sealed.ct, sealed.tag), null);

console.log(bad ? `${bad} BAD` : 'all ok');
process.exit(bad ? 1 : 0);
