// The values of episode 11 « AES de l'intérieur », alone: episode 1.2's order, key and IV, and the
// two runs the room shows. AES-256 with every step kept (trace) is lib/aes.js (r323), re-exported
// here so the episode reads both as A.<name>. Everything on screen is computed in the page;
// tests/aes_interieur_values.mjs checks it against FIPS-197 Appendix C.3 (every round printed) and
// against episode 1.2's C1.
//
// The state: AES lays its 16 bytes out in a 4 × 4 grid COLUMN by column: byte i sits in row i % 4,
// column i / 4 (the first four bytes are the first column).
import { bytes, fromHex, xor, trace } from '../../ficelle/lib/aes.js';
export * from '../../ficelle/lib/aes.js';

// ---------- the story's values: episode 1.2's, copied (tests/aes_interieur_values.mjs checks they match) ----------
// Alice's order, 23 bytes: its first block is « ATTAQUE DEMAIN A » (fr) or « ATTACK AT DAWN T » (en)
export const ORDER = { fr: "ATTAQUE DEMAIN A L'AUBE", en: 'ATTACK AT DAWN TOMORROW' };
export const KEY1 = fromHex('3a27feff04d3603fa3a9ba52f9a93038850de5d29fe48fcffc1221230184e4d0');
export const IV1 = fromHex('fdf229e6898fbb99f12acac52313b592');
// in CBC, AES never sees P1 raw: it is given P1 ⊕ IV, and what comes out is C1
export function story(lang) {
  const P1 = bytes(ORDER[lang]).slice(0, 16), X1 = xor(P1, IV1), tr = trace(KEY1, X1);
  return { order: ORDER[lang], P1, iv: IV1, X1, key: KEY1, tr, C1: tr.out };
}
// the story's last chapter: the same order with its first letter A (41) turned into C (43), one bit,
// run through the same key; ref: Alice's own run, to compare with byte for byte
export function changed(lang) {
  const s = story(lang), P1 = Uint8Array.from(s.P1); P1[0] = 0x43;
  const X1 = xor(P1, IV1);
  return { ...s, P1, X1, tr: trace(KEY1, X1), ref: s.tr };
}
