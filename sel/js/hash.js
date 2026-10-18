// The two hash functions of the episode, for real, in plain JavaScript: MD5 (RFC 1321), the one
// the slide « Mots de passe - Le sel » uses, and bcrypt ($2b$, the slide « Mots de passe -
// bcrypt »). Both run in the page and in the measuring worker; tests/sel_values.mjs checks them
// against the slides, RFC 1321 and Python's bcrypt.
export const bytes = s => new TextEncoder().encode(s);
const hex = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('');

// ---------- MD5 ----------
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);
const R = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
export function md5(input) {
  const m = typeof input === 'string' ? bytes(input) : input, n = ((m.length + 8 >> 6) + 1) * 64;
  const b = new Uint8Array(n); b.set(m); b[m.length] = 0x80;
  const bits = m.length * 8; for (let i = 0; i < 4; i++) b[n - 8 + i] = bits >>> 8 * i & 255; b[n - 4] = Math.floor(bits / 2 ** 32) & 255;
  const dv = new DataView(b.buffer), h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  for (let o = 0; o < n; o += 64) {
    let [a, bb, c, d] = h;
    for (let i = 0; i < 64; i++) {
      const r = i >> 4;
      const f = r === 0 ? (bb & c) | (~bb & d) : r === 1 ? (d & bb) | (~d & c) : r === 2 ? bb ^ c ^ d : c ^ (bb | ~d);
      const g = r === 0 ? i : r === 1 ? (5 * i + 1) % 16 : r === 2 ? (3 * i + 5) % 16 : 7 * i % 16;
      const x = (a + f + K[i] + dv.getUint32(o + g * 4, true)) | 0, s = R[r * 4 + i % 4];
      a = d; d = c; c = bb; bb = (bb + (x << s | x >>> 32 - s)) | 0;
    }
    h[0] = h[0] + a | 0; h[1] = h[1] + bb | 0; h[2] = h[2] + c | 0; h[3] = h[3] + d | 0;
  }
  const out = new Uint8Array(16), ov = new DataView(out.buffer);
  h.forEach((w, i) => ov.setUint32(i * 4, w, true));
  return hex(out);
}

// ---------- bcrypt ----------
// Blowfish's tables are the hexadecimal digits of pi after the point: 18 + 4 x 256 words.
// Computed once here (Machin's formula on big integers) rather than shipped as a table.
let PI = null;
function piWords() {
  if (PI) return PI;
  const words = 18 + 1024, bits = BigInt(words * 32), S = 1n << (bits + 64n);
  const atan = x => { let sum = 0n, term = S / x, k = 1n, sign = 1n; const x2 = x * x;
    while (term) { sum += sign * term / k; term /= x2; k += 2n; sign = -sign; } return sum; };
  let frac = (16n * atan(5n) - 4n * atan(239n) - 3n * S) >> 64n;
  PI = new Uint32Array(words);
  for (let i = words - 1; i >= 0; i--) { PI[i] = Number(frac & 0xffffffffn); frac >>= 32n; }
  return PI;
}

function encipher(P, Sb, lr, o) {
  let l = lr[o], r = lr[o + 1];
  l ^= P[0];
  for (let i = 1; i <= 16; i += 2) {
    r ^= (((Sb[l >>> 24] + Sb[256 | l >>> 16 & 255]) ^ Sb[512 | l >>> 8 & 255]) + Sb[768 | l & 255]) ^ P[i];
    l ^= (((Sb[r >>> 24] + Sb[256 | r >>> 16 & 255]) ^ Sb[512 | r >>> 8 & 255]) + Sb[768 | r & 255]) ^ P[i + 1];
  }
  lr[o] = r ^ P[17]; lr[o + 1] = l;
}
function word(data, at) { let w = 0; for (let i = 0; i < 4; i++) { w = w << 8 | data[at.j]; at.j = (at.j + 1) % data.length; } return w; }
function expand(P, Sb, key, salt) {
  const k = { j: 0 }, s = { j: 0 }, lr = new Uint32Array(2);
  for (let i = 0; i < 18; i++) P[i] ^= word(key, k);
  const fill = (T, n) => { for (let i = 0; i < n; i += 2) {
    if (salt) { lr[0] ^= word(salt, s); lr[1] ^= word(salt, s); }
    encipher(P, Sb, lr, 0); T[i] = lr[0]; T[i + 1] = lr[1]; } };
  fill(P, 18); fill(Sb, 1024);
}

const B64 = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function b64(b, n) {
  let s = '';
  for (let i = 0; i < n;) {
    let c = b[i++]; s += B64[c >> 2]; c = (c & 3) << 4;
    if (i >= n) { s += B64[c]; break; }
    let d = b[i++]; s += B64[c | d >> 4]; c = (d & 15) << 2;
    if (i >= n) { s += B64[c]; break; }
    d = b[i++]; s += B64[c | d >> 6] + B64[d & 63];
  }
  return s;
}
function unb64(s, n) {
  const out = [], v = [...s].map(c => B64.indexOf(c));
  for (let i = 0; out.length < n; i += 4) {
    out.push(v[i] << 2 | v[i + 1] >> 4);
    if (out.length < n) out.push((v[i + 1] & 15) << 4 | v[i + 2] >> 2);
    if (out.length < n) out.push((v[i + 2] & 3) << 6 | v[i + 3]);
  }
  return Uint8Array.from(out);
}
export const saltString = (raw, cost = 12) => `$2b$${String(cost).padStart(2, '0')}$` + b64(raw, 16);

// bcrypt(password, '$2b$12$<22 characters of salt>') -> the 60-character string the slide shows
// ($2a$ and $2b$ compute the same for a password shorter than 72 bytes).
// onRound(i, n) is called every so often, for a progress bar.
export function bcrypt(password, setting, onRound) {
  const [, version, cost, salt22] = setting.split('$'), n = 2 ** +cost, salt = unb64(salt22.slice(0, 22), 16);
  const key = bytes(password + '\0').slice(0, 72);
  const pi = piWords(), P = pi.slice(0, 18), Sb = pi.slice(18);
  expand(P, Sb, key, salt);
  for (let i = 0; i < n; i++) { expand(P, Sb, key, null); expand(P, Sb, salt, null); if (onRound && i % 256 === 255) onRound(i + 1, n); }
  const text = bytes('OrpheanBeholderScryDoubt'), lr = new Uint32Array(6);
  for (let i = 0; i < 6; i++) lr[i] = text[i * 4] << 24 | text[i * 4 + 1] << 16 | text[i * 4 + 2] << 8 | text[i * 4 + 3];
  for (let r = 0; r < 64; r++) for (let o = 0; o < 6; o += 2) encipher(P, Sb, lr, o);
  const out = new Uint8Array(24);
  for (let i = 0; i < 6; i++) for (let k = 0; k < 4; k++) out[i * 4 + k] = lr[i] >>> 24 - 8 * k & 255;
  return `$${version}$${cost}$${salt22.slice(0, 22)}${b64(out, 23)}`;
}
