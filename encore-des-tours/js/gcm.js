// AES-256-GCM (NIST SP 800-38D), on aes.js's AES block: encrypt and seal in one move. The order is
// encrypted in counter mode (AES of the nonce and a counter, XORed onto the message: no padding,
// the ciphertext is as long as the order), and GHASH, a polynomial over GF(2^128) keyed by
// AES(key, 0), folds the ciphertext into a 16-byte tag. One key, a 12-byte nonce never used twice
// with it. tests/tours_values.mjs checks it against node's crypto and WebCrypto.
import { encryptBlock, concat, xor } from '../../ficelle/lib/saga-aes.js';
import { equal } from '../../ficelle/lib/hmac.js';

const toBig = b => b.reduce((x, y) => (x << 8n) | BigInt(y), 0n);
const toBytes = x => Uint8Array.from({ length: 16 }, (_, i) => Number((x >> BigInt(8 * (15 - i))) & 0xffn));
const R = 0xe1n << 120n;
// X · Y in GF(2^128), bit 0 the leftmost (SP 800-38D, algorithm 1)
function mul(X, Y) {
  let Z = 0n, V = Y;
  for (let i = 127; i >= 0; i--) {
    if ((X >> BigInt(i)) & 1n) Z ^= V;
    V = V & 1n ? (V >> 1n) ^ R : V >> 1n;
  }
  return Z;
}
// GHASH_H over aad and ciphertext, each zero-padded to 16 bytes, then their lengths in bits
function ghash(h, aad, C) {
  const pad = b => concat([b, new Uint8Array((16 - b.length % 16) % 16)]);
  const len = new Uint8Array(16), dv = new DataView(len.buffer);
  dv.setUint32(4, aad.length * 8); dv.setUint32(12, C.length * 8);
  const all = concat([pad(aad), pad(C), len]), H = toBig(h);
  let Y = 0n;
  for (let i = 0; i < all.length; i += 16) Y = mul(Y ^ toBig(all.slice(i, i + 16)), H);
  return toBytes(Y);
}
// counter block i: the 12-byte nonce, then a 4-byte counter; 1 is kept for the tag, the message starts at 2
const counter = (nonce, i) => concat([nonce, Uint8Array.of(i >>> 24, i >>> 16 & 255, i >>> 8 & 255, i & 255)]);
function ctr(key, nonce, M) {
  const out = new Uint8Array(M.length);
  for (let o = 0; o < M.length; o += 16) {
    const ks = encryptBlock(key, counter(nonce, 2 + o / 16));
    for (let j = 0; j < 16 && o + j < M.length; j++) out[o + j] = M[o + j] ^ ks[j];
  }
  return out;
}
// AESGCM(key).encrypt(nonce, data, aad): the ciphertext and its 16-byte tag
export function encrypt(key, nonce, M, aad = new Uint8Array(0)) {
  const h = encryptBlock(key, new Uint8Array(16)), C = ctr(key, nonce, M);
  return { h, C, tag: xor(encryptBlock(key, counter(nonce, 1)), ghash(h, aad, C)) };
}
// AESGCM(key).decrypt(nonce, data, aad): the tag first; a wrong one gives nothing (InvalidTag)
export function decrypt(key, nonce, C, tag, aad = new Uint8Array(0)) {
  const h = encryptBlock(key, new Uint8Array(16)), mine = xor(encryptBlock(key, counter(nonce, 1)), ghash(h, aad, C));
  return equal(mine, tag) ? { mine, ok: true, M: ctr(key, nonce, C) } : { mine, ok: false, M: null };
}
