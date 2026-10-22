// r323: the saga's packet, episodes 1.3 to 1.6 (was the second half of 4 identical js/aes.js): the
// packet Alice sends (IV, ciphertext, seal), what Eve changes in it, and what Bob gets back, and the
// story's values. AES-256, CBC and PKCS#7 are lib/aes.js, re-exported here, so an episode reads
// both as A.<name>: import * as A from '../../lib/saga-aes.js'. Everything on screen is computed
// in the page (the seal by lib/hmac.js); tests/cle_values.mjs, octet_values.mjs, paquet_values.mjs
// and tours_values.mjs check it against openssl, Python's hmac and WebCrypto.
import { hmac, equal } from './hmac.js';
import { bytes, fromHex, concat, pad, unpad, padOk, blocks, cbc, cbcDec } from './aes.js';
export * from './aes.js';

// One send, all the way: the order's bytes, padded, cut into blocks, chained, sealed.
export function send(order, key, iv, macKey) {
  const raw = bytes(order), P = blocks(pad(raw)), { C, X } = cbc(key, iv, P);
  return { order, raw, P, X, C, key, iv, macKey, n: raw.length, padN: 16 - raw.length % 16, tag: hmac(macKey, concat([iv, ...C])) };
}
// What Bob gets out of a packet (iv, C, tag), with his two keys. check: he verifies the seal first,
// and decrypts nothing when it does not match. Without the check he decrypts whatever arrives.
export function receive({ iv, C, tag }, key, macKey, check = true) {
  const mine = hmac(macKey, concat([iv, ...C])), sealOk = equal(mine, tag);
  if (check && !sealOk) return { mine, sealOk, rejected: true };
  const P = cbcDec(key, iv, C), all = concat(P), padGood = padOk(all);
  return { mine, sealOk, P, padGood, back: padGood ? unpad(all) : null };
}
// Eve's hand on a packet: byte i of the IV, or of the ciphertext, XORed with d. She cannot read,
// but she knows where the hour sits in Alice's orders (she read them in the clear, episode 1.2).
export function tamper(s, where, i, d = FLIP) {
  const iv = Uint8Array.from(s.iv), C = s.C.map(c => Uint8Array.from(c));
  if (where === 'iv') iv[i] ^= d; else C[Math.floor(i / 16)][i % 16] ^= d;
  return { iv, C, tag: s.tag, where, i };
}

// ---------- the story's values ----------
// Alice's order, in capitals with no accent like a telegram. The hour is byte 11 (index 10) in both
// languages, inside the first block, where a byte of the IV lands: '6' xor 0x0f = '9'.
export const ORDER = { fr: 'ATTAQUE A 6H DEMAIN', en: 'ATTACK AT 6AM TOMORROW' };
export const HOUR = 10, FLIP = 0x0f;
// drawn once (openssl rand) so the story's numbers never move; the sandbox draws its own
export const KEY = fromHex('7f6d5b1bf45e02319800a1e38c783912ff7c7167955bebc8faf586aa09c1b436');
export const MACKEY = fromHex('dcbda050a6bbb1f5857ae5d850c4d049e23f9c89d317a4df153279c2d9e6c582');
export const IV = fromHex('471fc1113b4ae3f678faab72b8bfc021');
// Eve's forged rider: her own order, encrypted and sealed with keys of her own (she has not Alice's)
export const FORGED = { fr: 'ATTAQUE A MINUIT', en: 'ATTACK AT MIDNIGHT' };
export const EVE_KEY = fromHex('77d930275989902668eeb57271232fb8dd13e09886d5bc906dedb4d1c50deeda');
export const EVE_MACKEY = fromHex('a17f789c07afc4b363334b41f7fd4ce8d46793ca9440da9cd459accaeaf35eb2');
export const EVE_IV = fromHex('62c9e5e2e2f7614bca5ab07fa02aa139');
