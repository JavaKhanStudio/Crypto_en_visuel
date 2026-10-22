// The values of the course's slides, alone (« Modes - L'exemple suivi », « ECB - Un exemple »,
// « CBC - Un exemple », « CBC - L'IV - Un exemple », « Bit-flip - Un exemple »): the key
// cle-de-16-octets (so AES-128), the 53-byte message, the IVs drawn once for the slides, the
// bit-flip. AES, ECB, CBC and PKCS#7 are lib/aes.js (r323), re-exported here so the episode reads
// both as A.<name>. tests/pingouin_values.mjs checks every value the slides show.
import { bytes, fromHex, xor, concat, pad, blocks, ecb, cbc, decryptBlock } from '../../lib/aes.js';
export * from '../../lib/aes.js';

// Back: Pi = AESdec(Ci) xor Ci-1. Also returns what AES gave back, AESdec(Ci): this episode's
// cbcDec, which wins over lib/aes.js's (blocks only).
export function cbcDec(key, iv, C) {
  const D = C.map(c => decryptBlock(key, c));
  return { P: D.map((d, i) => xor(d, i ? C[i - 1] : iv)), D };
}

// HMAC-SHA-256 over the IV and the cipher, by the browser (the episode is served over https or
// localhost, where crypto.subtle exists)
export async function hmac(key, data) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}

// ---------- the slides' values ----------
export const KEY = bytes('cle-de-16-octets');
// the slides' header block is the school's name: a generic one instead, so C1, C3 and the CBC
// chain differ from the slides (r78)
export const MSG = 'VIREMENT URGENT!montant=00100EURVIREMENT URGENT!Alice';
export const IV1 = fromHex('7efa5a79fcd38aca0c1f9f070f9c63ce');   // drawn once for the slides (cryptographie r57)
export const IV2 = fromHex('1a2f1c3cc6a8e4b5adddf8ab667602a3');
// the slides give no HMAC key: a second secret of Alice and Bob, its value only for the episode
export const MAC_KEY = bytes('cle-hmac-secrete');
export const P = blocks(pad(bytes(MSG)));
export const E = ecb(KEY, P);
export const CBC1 = cbc(KEY, IV1, P), CBC2 = cbc(KEY, IV2, P);
// the bit-flip: Eve wants the '0' at byte 8 of P2 to read '9'; 30 xor 39 = 09, flipped in byte 8 of C1
export const FLIP = { block: 0, byte: 8, mask: '0'.charCodeAt(0) ^ '9'.charCodeAt(0) };
export function flip(C, { block, byte, mask }) { const out = C.map(c => Uint8Array.from(c)); out[block][byte] ^= mask; return out; }
export const C1F = flip(CBC1.C, FLIP);
export const BOB = cbcDec(KEY, IV1, C1F);   // P1 destroyed, P2 montant=90100EUR, P3 and P4 intact
// Alice's seal over IV + cipher, and what Bob computes once Eve has flipped her two bits
export const TAG = await hmac(MAC_KEY, concat([IV1, ...CBC1.C])), TAGF = await hmac(MAC_KEY, concat([IV1, ...C1F]));
