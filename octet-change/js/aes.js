// The arithmetic of the episode, alone: AES-256 on one block (FIPS-197), CBC, PKCS#7, the packet
// Alice sends (IV, ciphertext, seal), what Eve changes in it, and what Bob gets back. Everything on
// screen is computed here, in the page (the seal by hmac.js); tests/octet_values.mjs checks it
// against openssl, Python's hmac and the browser's own AES and HMAC (WebCrypto).
import { hmac, equal } from './hmac.js';

// ---------- AES-256, one 16-byte block ----------
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

const ROUNDS = 14;   // a 32-byte key: 14 rounds, 15 round keys
function expand(key) {
  const w = new Uint8Array(16 * (ROUNDS + 1)); w.set(key);
  let rcon = 1;
  for (let i = 32; i < w.length; i += 4) {
    let t = w.slice(i - 4, i);
    if (i % 32 === 0) { t = [SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]]; rcon = xt(rcon); }
    else if (i % 32 === 16) t = t.map(x => SBOX[x]);
    for (let j = 0; j < 4; j++) w[i + j] = w[i - 32 + j] ^ t[j];
  }
  return w;
}
const keys = new Map();
const roundKeys = key => { const k = hex(key); if (!keys.has(k)) keys.set(k, expand(key)); return keys.get(k); };

export function encryptBlock(key, block) {
  const w = roundKeys(key), s = Uint8Array.from(block);
  for (let i = 0; i < 16; i++) s[i] ^= w[i];
  for (let r = 1; r <= ROUNDS; r++) {
    for (let i = 0; i < 16; i++) s[i] = SBOX[s[i]];
    const t = Uint8Array.from(s);                                       // ShiftRows: row j moves j columns left
    for (let c = 0; c < 4; c++) for (let j = 0; j < 4; j++) s[c * 4 + j] = t[((c + j) % 4) * 4 + j];
    if (r < ROUNDS) for (let c = 0; c < 4; c++) {                       // MixColumns
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
  for (let r = ROUNDS; r >= 1; r--) {
    for (let i = 0; i < 16; i++) s[i] ^= w[r * 16 + i];
    if (r < ROUNDS) for (let c = 0; c < 4; c++) {
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
export function hex(b, n = b.length) { return [...b.slice(0, n)].map(x => x.toString(16).padStart(2, '0')).join(' '); }
export const xor = (a, b) => a.map((x, i) => x ^ b[i]);
export const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
export const concat = list => { const out = new Uint8Array(list.reduce((n, b) => n + b.length, 0)); let i = 0; for (const b of list) { out.set(b, i); i += b.length; } return out; };
export const random = n => crypto.getRandomValues(new Uint8Array(n));

// PKCS#7: N bytes of value N, a whole block of 16 × 10 if the message falls right on a block
export function pad(m) { const n = 16 - m.length % 16, out = new Uint8Array(m.length + n); out.set(m); out.fill(n, m.length); return out; }
export function unpad(m) { const n = m[m.length - 1]; return m.slice(0, m.length - n); }
export const blocks = b => Array.from({ length: b.length / 16 }, (_, i) => b.slice(i * 16, i * 16 + 16));

// CBC: C0 = IV, Ci = AES(Pi xor Ci-1). Also returns what AES was given, Pi xor Ci-1.
export function cbc(key, iv, P) {
  let prev = iv; const C = [], X = [];
  for (const p of P) { const x = xor(p, prev); X.push(x); prev = encryptBlock(key, x); C.push(prev); }
  return { C, X };
}
export function cbcDec(key, iv, C) { return C.map((c, i) => xor(decryptBlock(key, c), i ? C[i - 1] : iv)); }

// PKCS#7 checked: Bob refuses a last block whose padding is not N bytes of value N
export function padOk(m) { const n = m[m.length - 1]; return n >= 1 && n <= 16 && m.slice(m.length - n).every(x => x === n); }

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
// rows of 16 bytes, for printing a long key or a seal
export const blocksOf16 = b => Array.from({ length: Math.ceil(b.length / 16) }, (_, i) => b.slice(i * 16, i * 16 + 16));
// bytes as text for a bubble: printable ASCII as is, anything else (noise) as ·
export const printable = b => [...b].map(x => x >= 32 && x < 127 ? String.fromCharCode(x) : '·').join('');
