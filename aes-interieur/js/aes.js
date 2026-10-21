// The arithmetic of episode 11 « AES de l'intérieur », alone: AES-256 on one block (FIPS-197), with
// every step kept, so the room can show each state the cipher passes through. Everything on screen
// is computed here, in the page; tests/aes_interieur_values.mjs checks it against FIPS-197
// Appendix C.3 (every round printed) and against episode 1.2's C1.
//
// The state: AES lays its 16 bytes out in a 4 × 4 grid COLUMN by column: byte i sits in row i % 4,
// column i / 4 (the first four bytes are the first column).

// ---------- the S-box, from its definition: the inverse in GF(2^8), then the affine map ----------
export const SBOX = new Uint8Array(256);
{
  let p = 1, q = 1;
  do {
    p = p ^ (p << 1) ^ (p & 0x80 ? 0x1b : 0); p &= 0xff;            // p * 3
    q ^= q << 1; q ^= q << 2; q ^= q << 4; q &= 0xff; if (q & 0x80) q ^= 0x09;   // q / 3
    SBOX[p] = q ^ rot(q, 1) ^ rot(q, 2) ^ rot(q, 3) ^ rot(q, 4) ^ 0x63;
  } while (p !== 1);
  SBOX[0] = 0x63;
}
function rot(x, n) { return ((x << n) | (x >> (8 - n))) & 0xff; }
// × 2 on a byte (the multiplication of MixColumns): shift left, and fold the 9th bit back in as 1b
export const xt = x => ((x << 1) ^ (x & 0x80 ? 0x1b : 0)) & 0xff;

export const ROUNDS = 14;   // a 32-byte key: 14 rounds, 15 round keys
// the key schedule: the 32 bytes of the key are round keys 0 and 1; each next 4 bytes are the 4
// bytes 32 before, XOR the 4 just before (rotated, through the S-box and XOR a constant every 32)
export function expand(key) {
  const w = new Uint8Array(16 * (ROUNDS + 1)); w.set(key);
  let rcon = 1;
  for (let i = 32; i < w.length; i += 4) {
    let t = w.slice(i - 4, i);
    if (i % 32 === 0) { t = [SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]]; rcon = xt(rcon); }
    else if (i % 32 === 16) t = t.map(x => SBOX[x]);
    for (let j = 0; j < 4; j++) w[i + j] = w[i - 32 + j] ^ t[j];
  }
  return Array.from({ length: ROUNDS + 1 }, (_, r) => w.slice(r * 16, r * 16 + 16));
}

// ---------- the four steps, each on a 16-byte state, each returning a new one ----------
export const addRoundKey = (s, k) => s.map((x, i) => x ^ k[i]);
export const subBytes = s => s.map(x => SBOX[x]);
// row j moves j places to the left (the byte in column c comes from column c + j)
export const shiftFrom = i => ((Math.floor(i / 4) + i % 4) % 4) * 4 + i % 4;   // where byte i comes from
export const shiftRows = s => s.map((_, i) => s[shiftFrom(i)]);
// each column (a, b, c, d) becomes (2a⊕3b⊕c⊕d, a⊕2b⊕3c⊕d, a⊕b⊕2c⊕3d, 3a⊕b⊕c⊕2d), 3x = 2x ⊕ x
export function mixColumn([a, b, c, d]) {
  return [xt(a) ^ xt(b) ^ b ^ c ^ d, a ^ xt(b) ^ xt(c) ^ c ^ d, a ^ b ^ xt(c) ^ xt(d) ^ d, xt(a) ^ a ^ b ^ c ^ xt(d)];
}
export function mixColumns(s) {
  const out = new Uint8Array(16);
  for (let c = 0; c < 4; c++) out.set(mixColumn([...s.slice(c * 4, c * 4 + 4)]), c * 4);
  return out;
}

// ---------- the whole cipher, step by step ----------
// ops: every step in order, { op: 'ark' | 'sub' | 'shift' | 'mix', round, from, to, key (ark only) }.
// Round 0 is the AddRoundKey before the first round; round 14 has no MixColumns.
export function trace(key, block) {
  const K = expand(key), ops = [];
  let s = Uint8Array.from(block);
  const step = (op, round, to, extra = {}) => { ops.push({ op, round, from: s, to, ...extra }); s = to; };
  step('ark', 0, addRoundKey(s, K[0]), { key: K[0] });
  for (let r = 1; r <= ROUNDS; r++) {
    step('sub', r, subBytes(s));
    step('shift', r, shiftRows(s));
    if (r < ROUNDS) step('mix', r, mixColumns(s));
    step('ark', r, addRoundKey(s, K[r]), { key: K[r] });
  }
  return { key: Uint8Array.from(key), block: Uint8Array.from(block), K, ops, out: s };
}
export const encryptBlock = (key, block) => trace(key, block).out;
// the state after round r (0: after the first AddRoundKey)
export const afterRound = (tr, r) => tr.ops.filter(o => o.round === r).at(-1).to;

// ---------- bytes ----------
export const bytes = s => new TextEncoder().encode(s);
export const fromHex = h => Uint8Array.from(h.replace(/\s+/g, '').match(/../g), x => parseInt(x, 16));
export const hx = x => x.toString(16).padStart(2, '0');
export const hex = (b, n = b.length) => [...b.slice(0, n)].map(hx).join(' ');
export const xor = (a, b) => a.map((x, i) => x ^ b[i]);
export const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
export const diff = (a, b) => [...a].reduce((n, x, i) => n + (x !== b[i]), 0);

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
