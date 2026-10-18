// The arithmetic of the episode, alone: AES-128 on one block, ECB and CBC, PKCS#7, the bit-flip,
// and the values of the course's slides (« Modes - L'exemple suivi », « ECB - Un exemple »,
// « CBC - Un exemple », « CBC - L'IV - Un exemple », « Bit-flip - Un exemple »): the key
// cle-de-16-octets, the 53-byte message, the IVs drawn once for the slides.
// tests/pingouin_values.mjs checks every value the slides show.

// ---------- AES-128, one 16-byte block (FIPS-197) ----------
const SBOX = new Uint8Array(256), INV = new Uint8Array(256);
{
  // the S-box from its definition: the inverse in GF(2^8), then the affine map
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
const xt = x => ((x << 1) ^ (x & 0x80 ? 0x1b : 0)) & 0xff;
const mul = (a, b) => { let r = 0; while (b) { if (b & 1) r ^= a; a = xt(a); b >>= 1; } return r; };

function expand(key) {
  const w = new Uint8Array(176); w.set(key);
  let rcon = 1;
  for (let i = 16; i < 176; i += 4) {
    let t = w.slice(i - 4, i);
    if (i % 16 === 0) { t = [SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]]; rcon = xt(rcon); }
    for (let j = 0; j < 4; j++) w[i + j] = w[i - 16 + j] ^ t[j];
  }
  return w;
}
const keys = new Map();
const roundKeys = key => { const k = hex(key); if (!keys.has(k)) keys.set(k, expand(key)); return keys.get(k); };

export function encryptBlock(key, block) {
  const w = roundKeys(key), s = Uint8Array.from(block);
  for (let i = 0; i < 16; i++) s[i] ^= w[i];
  for (let r = 1; r <= 10; r++) {
    for (let i = 0; i < 16; i++) s[i] = SBOX[s[i]];
    const t = Uint8Array.from(s);                                       // ShiftRows: row j moves j columns left
    for (let c = 0; c < 4; c++) for (let j = 0; j < 4; j++) s[c * 4 + j] = t[((c + j) % 4) * 4 + j];
    if (r < 10) for (let c = 0; c < 4; c++) {                           // MixColumns
      const [a, b, d, e] = s.slice(c * 4, c * 4 + 4);
      s[c * 4] = xt(a) ^ xt(b) ^ b ^ d ^ e; s[c * 4 + 1] = a ^ xt(b) ^ xt(d) ^ d ^ e;
      s[c * 4 + 2] = a ^ b ^ xt(d) ^ xt(e) ^ e; s[c * 4 + 3] = xt(a) ^ a ^ b ^ d ^ xt(e);
    }
    for (let i = 0; i < 16; i++) s[i] ^= w[r * 16 + i];
  }
  return s;
}
export function decryptBlock(key, block) {
  const w = roundKeys(key), s = Uint8Array.from(block);
  for (let r = 10; r >= 1; r--) {
    for (let i = 0; i < 16; i++) s[i] ^= w[r * 16 + i];
    if (r < 10) for (let c = 0; c < 4; c++) {
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
export const fromHex = h => Uint8Array.from(h.replace(/\s+/g, '').match(/../g), x => parseInt(x, 16));
export function hex(b, n = b.length) { return [...b.slice(0, n)].map(x => x.toString(16).padStart(2, '0')).join(' '); }
export const xor = (a, b) => a.map((x, i) => x ^ b[i]);
export const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
// what a byte reads as on a crate: its letter if it is printable, else its hex
export const glyph = x => x >= 0x20 && x < 0x7f ? String.fromCharCode(x) : x.toString(16).padStart(2, '0');

// PKCS#7: N bytes of value N, a whole block of 10 if the message falls right
export function pad(m) { const n = 16 - m.length % 16, out = new Uint8Array(m.length + n); out.set(m); out.fill(n, m.length); return out; }
export const blocks = b => Array.from({ length: b.length / 16 }, (_, i) => b.slice(i * 16, i * 16 + 16));

export const ecb = (key, P) => P.map(p => encryptBlock(key, p));
// CBC: C0 = IV, Ci = AES(Pi xor Ci-1). Also returns what AES was given, Pi xor Ci-1.
export function cbc(key, iv, P) {
  let prev = iv; const C = [], X = [];
  for (const p of P) { const x = xor(p, prev); X.push(x); prev = encryptBlock(key, x); C.push(prev); }
  return { C, X };
}
// Back: Pi = AESdec(Ci) xor Ci-1. Also returns what AES gave back, AESdec(Ci).
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
export const concat = list => { const out = new Uint8Array(list.reduce((n, b) => n + b.length, 0)); let i = 0; for (const b of list) { out.set(b, i); i += b.length; } return out; };

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
