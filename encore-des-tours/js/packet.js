// The packets of episode 1.6. 1.5's packet (the two keys locked with Bob's padlock, the IV, the
// AES-256-CBC ciphertext, the HMAC seal), now with what stops Eve's last tricks: a number, and
// Alice's signature (RSA-PSS, sign.js) over the number and the four bricks. Eve's forged packet:
// her own keys, locked with Bob's public padlock, an order of hers, a seal that checks. And the
// same order in AES-256-GCM (gcm.js), encrypted and sealed in one move.
import * as A from './aes.js';
import * as R from './rsa.js';
import * as S from './sign.js';
import * as G from './gcm.js';
import { hmac, equal } from './hmac.js';

// The story's keys, IV and OAEP seed are 1.4's and 1.5's
export const STORY = { key: A.KEY, macKey: A.MACKEY, iv: A.IV, seed: R.SEED };
// Eve's own keys and IV (1.3's forged rider) and the OAEP seed she draws to lock them (openssl rand)
export const EVE_KEYS = { key: A.EVE_KEY, macKey: A.EVE_MACKEY, iv: A.EVE_IV, seed: A.fromHex('91711ce4b67c87b49b5628d8e9f0a6e31eb63f8988413eba6bbad6d79ec6cf90') };
// what Eve has a rider say in Alice's name (the « Pour aller plus loin » of the project)
export const FORGED = { fr: 'JE SUIS ALICE, DONNE-MOI LE CODE', en: 'I AM ALICE, GIVE ME THE CODE' };
// the number Alice writes on the story's packet; Bob saw 41 the day before
export const NUM = 42;
// the story's GCM nonces (openssl rand): the order's, and the final packet's
export const NONCE = A.fromHex('79dc030278feee8262524885');
export const NONCE2 = A.fromHex('a3c68ff6783d00d5ed0b5ae8');

// the bricks, in the order they travel; a packet holds those it has
export const BRICKS = ['num', 'ek', 'iv', 'ct', 'tag', 'sig'];
export const has = pkt => BRICKS.filter(b => pkt[b] || (b === 'ct' && pkt.C));
export const field = (pkt, b) => b === 'ct' ? A.concat(pkt.C) : pkt[b];
// the number, on 8 bytes, big-endian
export const numBytes = n => R.bytesOf(BigInt(n), 8);
export const numOf = b => Number(R.big(b));
// what the signature covers: the number (when there is one) and the four bricks, end to end
export const signed = pkt => A.concat(['num', 'ek', 'iv', 'ct', 'tag'].filter(b => pkt[b] || b === 'ct').map(b => field(pkt, b)));

// send_message, 1.5's four moves; then, with num, the number; with signer (S.ALICE, or S.EVE in
// Eve's forgery), the signature over all of it.
export function send(order, { key, macKey, iv, seed }, { num = null, signer = null, salt } = {}) {
  const s = A.send(order, key, iv, macKey), keys = A.concat([key, macKey]), locked = R.encrypt(R.BOB, keys, seed);
  const pkt = { ...s, keys, locked, ek: locked.c, ...(num !== null && { num: numBytes(num) }) };
  if (signer) { pkt.signature = S.sign(signer, signed(pkt), salt); pkt.sig = pkt.signature.sig; pkt.signer = signer; }
  return pkt;
}
// the story's packets: Alice's order signed (and numbered); Eve's forgery, unsigned or signed by her
export const alice = (order, num = null) => send(order, STORY, { num, signer: S.ALICE, salt: num === null ? S.SALT : S.SALT_N });
export const forge = (lang, signer = null) => send(FORGED[lang], EVE_KEYS, { signer, salt: S.SALT_EVE });

// Eve's hand: byte i of one brick XORed with d. The packet is copied; Alice's stays as it was.
export function tamper(pkt, brick = 'ct', i = 0, d = 1) {
  const out = { ...pkt, C: pkt.C.map(c => Uint8Array.from(c)) };
  for (const b of BRICKS) if (b !== 'ct' && pkt[b]) out[b] = Uint8Array.from(pkt[b]);
  if (brick === 'ct') out.C[Math.floor(i / 16)][i % 16] ^= d; else out[brick][i] ^= d;
  return { ...out, eve: { brick, i, d } };
}
// Eve's copy of a packet: the same bytes, sent again later
export const replay = pkt => ({ ...pkt, copy: true });

// receive_message, with Bob's defenses: sig (he checks Alice's signature with her public key, before
// anything else), last (the highest number he has accepted from Alice: a number not above it is refused).
// Then 1.5's three moves: open the keys, check the seal, and only then decrypt. Every move is
// returned, for the card; rejected says where he stopped ('sig', 'num', 'keys', 'seal') or is false.
export function receive(pkt, { sig = false, last = null } = {}) {
  const out = { decrypted: false };
  if (sig) {
    out.check = pkt.sig ? S.verify(S.ALICE, signed(pkt), pkt.sig) : null;
    out.sigOk = !!out.check?.ok;
    if (!out.sigOk) return { ...out, rejected: 'sig' };
  }
  if (last !== null) {
    out.n = pkt.num ? numOf(pkt.num) : null;
    out.numOk = out.n !== null && out.n > last;
    if (!out.numOk) return { ...out, rejected: 'num' };
  }
  const keys = R.decrypt(R.BOB, pkt.ek).M;
  if (!keys) return { ...out, keysOk: false, rejected: 'keys' };
  const key = keys.slice(0, 32), macKey = keys.slice(32), mine = hmac(macKey, A.concat([pkt.iv, ...pkt.C])), sealOk = equal(mine, pkt.tag);
  Object.assign(out, { keysOk: true, keys, mine, sealOk });
  if (!sealOk) return { ...out, rejected: 'seal' };
  const all = A.concat(A.cbcDec(key, pkt.iv, pkt.C));
  return { ...out, decrypted: true, back: A.unpad(all), rejected: false };
}

// The same order in AES-256-GCM: one key (1.4's AES key), a 12-byte nonce; the tag is GCM's own
export const gcm = (order, key = A.KEY, nonce = NONCE) => ({ order, key, nonce, M: A.bytes(order), ...G.encrypt(key, nonce, A.bytes(order)) });
export const gcmOpen = g => G.decrypt(g.key, g.nonce, g.C, g.tag);
export function gcmTamper(g, i = 0, d = 1) { const C = Uint8Array.from(g.C); C[i] ^= d; return { ...g, C, eve: { i, d } }; }

// The final packet: everything at once. The number; one key (32 bytes) locked with Bob's padlock;
// the nonce; the GCM ciphertext and tag; Alice's signature over all of it.
export function final(order, num = NUM + 1) {
  const g = gcm(order, R.NEXT.key, NONCE2), locked = R.encrypt(R.BOB, R.NEXT.key, R.NEXT.seed);
  const pkt = { num: numBytes(num), ek: locked.c, iv: NONCE2, C: [g.C], tag: g.tag, g };
  pkt.sig = S.sign(S.ALICE, signed(pkt), S.SALT_N).sig;
  return pkt;
}
export function finalOpen(pkt) {
  const sigOk = S.verify(S.ALICE, signed(pkt), pkt.sig).ok, key = sigOk && R.decrypt(R.BOB, pkt.ek).M;
  const open = key && G.decrypt(key, pkt.iv, pkt.C[0], pkt.tag);
  return { sigOk, keysOk: !!key, tagOk: !!open?.ok, back: open?.M ?? null };
}

// fresh draws for the sandbox: AES key, HMAC key, IV, OAEP seed
export const fresh = () => ({ key: A.random(32), macKey: A.random(32), iv: A.random(16), seed: A.random(R.H) });
