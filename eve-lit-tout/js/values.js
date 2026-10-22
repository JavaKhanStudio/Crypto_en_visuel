// The values the story shows, alone: Alice's order, the key and IV of the first sends, the fresh
// pair of the last one, and one send all the way. AES-256, CBC and PKCS#7 are lib/aes.js (r323),
// re-exported here so the episode reads both as A.<name>. Everything on screen is computed in the
// page; tests/eve_values.mjs checks it against openssl and the browser's own AES (WebCrypto).
import { bytes, text, fromHex, concat, pad, unpad, blocks, cbc, cbcDec } from '../../lib/aes.js';
export * from '../../lib/aes.js';

// One send, all the way: the order's bytes, padded, cut into blocks, chained, and back at Bob's.
export function send(order, key, iv) {
  const raw = bytes(order), P = blocks(pad(raw)), { C, X } = cbc(key, iv, P);
  return { order, raw, P, X, C, key, iv, n: raw.length, padN: 16 - raw.length % 16, back: text(unpad(concat(cbcDec(key, iv, C)))) };
}

// ---------- the story's values ----------
// Alice's order, in capitals with no accent like a telegram: 23 bytes, so 2 blocks and 9 bytes of padding
export const ORDER = { fr: "ATTAQUE DEMAIN A L'AUBE", en: 'ATTACK AT DAWN TOMORROW' };
// drawn once (openssl rand) so the story's numbers never move; the sandbox draws its own
export const KEY1 = fromHex('3a27feff04d3603fa3a9ba52f9a93038850de5d29fe48fcffc1221230184e4d0');
export const IV1 = fromHex('fdf229e6898fbb99f12acac52313b592');
export const KEY2 = fromHex('5de67281c83195c32b65618254fc4a8bb3cd1e5188713b03eba2443a07178d5d');
export const IV2 = fromHex('72275df3b412aac4709677965a659be2');
