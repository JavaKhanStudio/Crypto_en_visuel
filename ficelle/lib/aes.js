// r323: AES and its bytes, one for every episode (was 7 copies in 4 versions: the saga's AES-256,
// pingouin's AES-128, aes-interieur's AES-256 step by step). A real AES (FIPS-197) on one block,
// computed in the page: the key's length sets the rounds (16 bytes: 10, 32 bytes: 14). Then the
// bytes, PKCS#7 and the modes. An episode's values (its keys, its order, its story) stay in the
// episode, in a module that re-exports this one (export * from '../../lib/aes.js'), so its code
// reads them all as A.<name>. tests/*_values.mjs check the results against openssl, Python and
// WebCrypto (tests/aes_lib.mjs: FIPS-197's own vectors, 128 and 256).
//
// The state: AES lays its 16 bytes out in a 4 × 4 grid COLUMN by column: byte i sits in row i % 4,
// column i / 4 (the first four bytes are the first column).

// ---------- the S-box, from its definition: the inverse in GF(2^8), then the affine map ----------
export const SBOX = new Uint8Array(256);
const INV = new Uint8Array(256);
{
  let p = 1, q = 1;
  do {
    p = p ^ (p << 1) ^ (p & 0x80 ? 0x1b : 0); p &= 0xff;            // p * 3
    q ^= q << 1; q ^= q << 2; q ^= q << 4; q &= 0xff; if (q & 0x80) q ^= 0x09;   // q / 3
    const s = q ^ rot(q, 1) ^ rot(q, 2) ^ rot(q, 3) ^ rot(q, 4) ^ 0x63;
    SBOX[p] = s; INV[s] = p;
  } while (p !== 1);
  SBOX[0] = 0x63; INV[0x63] = 0;
}
function rot(x, n) { return ((x << n) | (x >> (8 - n))) & 0xff; }
// × 2 on a byte (the multiplication of MixColumns): shift left, and fold the 9th bit back in as 1b
export const xt = x => ((x << 1) ^ (x & 0x80 ? 0x1b : 0)) & 0xff;
const mul = (a, b) => { let r = 0; while (b) { if (b & 1) r ^= a; a = xt(a); b >>= 1; } return r; };

// rounds for a key: 10 for 16 bytes (AES-128), 14 for 32 bytes (AES-256)
export const rounds = key => key.length / 4 + 6;
// the key schedule: the key's bytes are the first round keys; each next 4 bytes are the 4 bytes one
// key-length before, XOR the 4 just before (rotated, through the S-box and XOR a constant once a key
// length; AES-256 also puts them through the S-box half way)
function schedule(key) {
  const nk = key.length, w = new Uint8Array(16 * (rounds(key) + 1)); w.set(key);
  let rcon = 1;
  for (let i = nk; i < w.length; i += 4) {
    let t = w.slice(i - 4, i);
    if (i % nk === 0) { t = [SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]]; rcon = xt(rcon); }
    else if (nk === 32 && i % 32 === 16) t = t.map(x => SBOX[x]);
    for (let j = 0; j < 4; j++) w[i + j] = w[i - nk + j] ^ t[j];
  }
  return w;
}
// the round keys, one 16-byte array each (rounds + 1 of them)
export function expand(key) {
  const w = schedule(key);
  return Array.from({ length: rounds(key) + 1 }, (_, r) => w.slice(r * 16, r * 16 + 16));
}
const keys = new Map();
const roundKeys = key => { const k = hex(key); if (!keys.has(k)) keys.set(k, schedule(key)); return keys.get(k); };

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

// ---------- the whole cipher, step by step (episode 11 shows each state) ----------
// ops: every step in order, { op: 'ark' | 'sub' | 'shift' | 'mix', round, from, to, key (ark only) }.
// Round 0 is the AddRoundKey before the first round; the last round has no MixColumns.
export function trace(key, block) {
  const K = expand(key), R = rounds(key), ops = [];
  let s = Uint8Array.from(block);
  const step = (op, round, to, extra = {}) => { ops.push({ op, round, from: s, to, ...extra }); s = to; };
  step('ark', 0, addRoundKey(s, K[0]), { key: K[0] });
  for (let r = 1; r <= R; r++) {
    step('sub', r, subBytes(s));
    step('shift', r, shiftRows(s));
    if (r < R) step('mix', r, mixColumns(s));
    step('ark', r, addRoundKey(s, K[r]), { key: K[r] });
  }
  return { key: Uint8Array.from(key), block: Uint8Array.from(block), K, ops, out: s };
}
// the state after round r (0: after the first AddRoundKey)
export const afterRound = (tr, r) => tr.ops.filter(o => o.round === r).at(-1).to;

// ---------- the whole cipher, fast: one 16-byte block ----------
export function encryptBlock(key, block) {
  const w = roundKeys(key), R = rounds(key), s = Uint8Array.from(block);
  for (let i = 0; i < 16; i++) s[i] ^= w[i];
  for (let r = 1; r <= R; r++) {
    for (let i = 0; i < 16; i++) s[i] = SBOX[s[i]];
    const t = Uint8Array.from(s);                                       // ShiftRows: row j moves j columns left
    for (let c = 0; c < 4; c++) for (let j = 0; j < 4; j++) s[c * 4 + j] = t[((c + j) % 4) * 4 + j];
    if (r < R) for (let c = 0; c < 4; c++) {                            // MixColumns
      const [a, b, d, e] = s.slice(c * 4, c * 4 + 4);
      s[c * 4] = xt(a) ^ xt(b) ^ b ^ d ^ e; s[c * 4 + 1] = a ^ xt(b) ^ xt(d) ^ d ^ e;
      s[c * 4 + 2] = a ^ b ^ xt(d) ^ xt(e) ^ e; s[c * 4 + 3] = xt(a) ^ a ^ b ^ d ^ xt(e);
    }
    for (let i = 0; i < 16; i++) s[i] ^= w[r * 16 + i];
  }
  return s;
}
export function decryptBlock(key, block) {
  const w = roundKeys(key), R = rounds(key), s = Uint8Array.from(block);
  for (let r = R; r >= 1; r--) {
    for (let i = 0; i < 16; i++) s[i] ^= w[r * 16 + i];
    if (r < R) for (let c = 0; c < 4; c++) {
      const [a, b, d, e] = s.slice(c * 4, c * 4 + 4);
      s[c * 4] = mul(a, 14) ^ mul(b, 11) ^ mul(d, 13) ^ mul(e, 9); s[c * 4 + 1] = mul(a, 9) ^ mul(b, 14) ^ mul(d, 11) ^ mul(e, 13);
      s[c * 4 + 2] = mul(a, 13) ^ mul(b, 9) ^ mul(d, 14) ^ mul(e, 11); s[c * 4 + 3] = mul(a, 11) ^ mul(b, 13) ^ mul(d, 9) ^ mul(e, 14);
    }
    const t = Uint8Array.from(s);
    for (let c = 0; c < 4; c++) for (let j = 0; j < 4; j++) s[((c + j) % 4) * 4 + j] = t[c * 4 + j];
    for (let i = 0; i < 16; i++) s[i] = INV[s[i]];
  }
  for (let i = 0; i < 16; i++) s[i] ^= w[i];
  return s;
}

// ---------- bytes ----------
export const bytes = s => new TextEncoder().encode(s);
export const text = b => new TextDecoder().decode(b);
export const fromHex = h => Uint8Array.from(h.replace(/\s+/g, '').match(/../g), x => parseInt(x, 16));
export const hx = x => x.toString(16).padStart(2, '0');
export function hex(b, n = b.length) { return [...b.slice(0, n)].map(hx).join(' '); }
export const xor = (a, b) => a.map((x, i) => x ^ b[i]);
export const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
// how many bytes differ (the avalanche of episode 11)
export const diff = (a, b) => [...a].reduce((n, x, i) => n + (x !== b[i]), 0);
export const concat = list => { const out = new Uint8Array(list.reduce((n, b) => n + b.length, 0)); let i = 0; for (const b of list) { out.set(b, i); i += b.length; } return out; };
export const random = n => crypto.getRandomValues(new Uint8Array(n));
// rows of 16 bytes, for printing a long key or a seal
export const blocksOf16 = b => Array.from({ length: Math.ceil(b.length / 16) }, (_, i) => b.slice(i * 16, i * 16 + 16));
// bytes as text for a bubble: printable ASCII as is, anything else (noise) as ·
export const printable = b => [...b].map(x => x >= 32 && x < 127 ? String.fromCharCode(x) : '·').join('');
// what a byte reads as on a crate (pingouin): its letter if it is printable, else its hex
export const glyph = x => x >= 0x20 && x < 0x7f ? String.fromCharCode(x) : x.toString(16).padStart(2, '0');

// PKCS#7: N bytes of value N, a whole block of 16 × 10 if the message falls right on a block
export function pad(m) { const n = 16 - m.length % 16, out = new Uint8Array(m.length + n); out.set(m); out.fill(n, m.length); return out; }
export function unpad(m) { const n = m[m.length - 1]; return m.slice(0, m.length - n); }
// PKCS#7 checked: Bob refuses a last block whose padding is not N bytes of value N
export function padOk(m) { const n = m[m.length - 1]; return n >= 1 && n <= 16 && m.slice(m.length - n).every(x => x === n); }
export const blocks = b => Array.from({ length: b.length / 16 }, (_, i) => b.slice(i * 16, i * 16 + 16));

// ---------- the modes ----------
export const ecb = (key, P) => P.map(p => encryptBlock(key, p));
// CBC: C0 = IV, Ci = AES(Pi xor Ci-1). Also returns what AES was given, Pi xor Ci-1.
export function cbc(key, iv, P) {
  let prev = iv; const C = [], X = [];
  for (const p of P) { const x = xor(p, prev); X.push(x); prev = encryptBlock(key, x); C.push(prev); }
  return { C, X };
}
// back: Pi = AESdec(Ci) xor Ci-1, the blocks
export function cbcDec(key, iv, C) { return C.map((c, i) => xor(decryptBlock(key, c), i ? C[i - 1] : iv)); }
