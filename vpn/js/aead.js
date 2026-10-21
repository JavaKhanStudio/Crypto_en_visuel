// ChaCha20-Poly1305 (RFC 8439): how WireGuard seals each packet. ChaCha20 stretches the 32-byte key
// and a 12-byte nonce into a keystream that is XORed onto the packet (counter 1 onwards); block 0's
// first 32 bytes are a one-time Poly1305 key, which signs the ciphertext into a 16-byte tag. Change
// one byte on the way and the tag no longer matches: the packet is thrown away.
const rotl = (v, c) => (v << c) | (v >>> (32 - c));
function quarter(s, a, b, c, d) {
  s[a] = (s[a] + s[b]) | 0; s[d] = rotl(s[d] ^ s[a], 16);
  s[c] = (s[c] + s[d]) | 0; s[b] = rotl(s[b] ^ s[c], 12);
  s[a] = (s[a] + s[b]) | 0; s[d] = rotl(s[d] ^ s[a], 8);
  s[c] = (s[c] + s[d]) | 0; s[b] = rotl(s[b] ^ s[c], 7);
}
const word = (b, i) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24);

// one 64-byte block of keystream (RFC 8439 §2.3)
export function chachaBlock(key, counter, nonce) {
  const s = new Int32Array(16);
  s.set([0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]);   // "expand 32-byte k"
  for (let i = 0; i < 8; i++) s[4 + i] = word(key, 4 * i);
  s[12] = counter; for (let i = 0; i < 3; i++) s[13 + i] = word(nonce, 4 * i);
  const w = Int32Array.from(s);
  for (let r = 0; r < 10; r++) {
    quarter(w, 0, 4, 8, 12); quarter(w, 1, 5, 9, 13); quarter(w, 2, 6, 10, 14); quarter(w, 3, 7, 11, 15);
    quarter(w, 0, 5, 10, 15); quarter(w, 1, 6, 11, 12); quarter(w, 2, 7, 8, 13); quarter(w, 3, 4, 9, 14);
  }
  const out = new Uint8Array(64);
  for (let i = 0; i < 16; i++) { const v = (w[i] + s[i]) | 0; out.set([v & 255, (v >>> 8) & 255, (v >>> 16) & 255, v >>> 24], 4 * i); }
  return out;
}

export function chacha20(key, counter, nonce, data) {
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 64) {
    const ks = chachaBlock(key, counter + i / 64, nonce);
    for (let j = 0; j < 64 && i + j < data.length; j++) out[i + j] = data[i + j] ^ ks[j];
  }
  return out;
}

// Poly1305 (RFC 8439 §2.5): the message in 16-byte pieces, each read as a number with a 1 on top,
// accumulated and multiplied by r modulo 2^130 - 5; s is added at the end. BigInt: clear, not fast.
const P1305 = (1n << 130n) - 5n;
const le = b => b.reduceRight((n, x) => (n << 8n) | BigInt(x), 0n);
export function poly1305(key, msg) {
  const r = le(key.subarray(0, 16)) & 0x0ffffffc0ffffffc0ffffffc0fffffffn, s = le(key.subarray(16, 32));
  let acc = 0n;
  for (let i = 0; i < msg.length; i += 16) {
    const piece = msg.subarray(i, i + 16);
    acc = (acc + le(piece) + (1n << BigInt(8 * piece.length))) * r % P1305;
  }
  acc = (acc + s) & ((1n << 128n) - 1n);
  const tag = new Uint8Array(16); for (let i = 0; i < 16; i++) { tag[i] = Number(acc & 255n); acc >>= 8n; }
  return tag;
}

// what Poly1305 signs (RFC 8439 §2.8): aad, ciphertext, each padded to 16, then both lengths on 8 bytes
function macData(aad, ct) {
  const pad = n => (16 - n % 16) % 16, m = new Uint8Array(aad.length + pad(aad.length) + ct.length + pad(ct.length) + 16);
  m.set(aad, 0); m.set(ct, aad.length + pad(aad.length));
  const dv = new DataView(m.buffer), end = m.length - 16;
  dv.setBigUint64(end, BigInt(aad.length), true); dv.setBigUint64(end + 8, BigInt(ct.length), true);
  return m;
}

export function seal(key, nonce, plain, aad = new Uint8Array(0)) {
  const otk = chachaBlock(key, 0, nonce).subarray(0, 32), ct = chacha20(key, 1, nonce, plain);
  return { ct, tag: poly1305(otk, macData(aad, ct)) };
}

// null when the tag does not match: the packet was changed on the way, or sealed with another key
export function open(key, nonce, ct, tag, aad = new Uint8Array(0)) {
  const want = poly1305(chachaBlock(key, 0, nonce).subarray(0, 32), macData(aad, ct));
  let diff = 0; for (let i = 0; i < 16; i++) diff |= want[i] ^ tag[i];
  return diff ? null : chacha20(key, 1, nonce, ct);
}
