// X25519 (RFC 7748): the key exchange WireGuard starts from. Alice and the VPN server each keep a
// 32-byte secret and publish secret × the base point 9 on Curve25519; each multiplies the other's
// public point by their own secret and lands on the same 32 bytes. BigInt arithmetic, the
// Montgomery ladder of RFC 7748 §5, in constant shape (not constant time: a teaching page).
const P = (1n << 255n) - 19n, A24 = 121665n;
const mod = a => { a %= P; return a < 0n ? a + P : a; };
function pow(b, e) { let r = 1n; b = mod(b); while (e > 0n) { if (e & 1n) r = r * b % P; b = b * b % P; e >>= 1n; } return r; }

const toInt = bytes => bytes.reduceRight((n, b) => (n << 8n) | BigInt(b), 0n);   // little-endian
function toBytes(n) { const out = new Uint8Array(32); for (let i = 0; i < 32; i++) { out[i] = Number(n & 255n); n >>= 8n; } return out; }

// RFC 7748 §5: clear the low 3 bits, clear the top bit, set bit 254
export function clamp(k) { const c = Uint8Array.from(k); c[0] &= 248; c[31] &= 127; c[31] |= 64; return c; }

export function x25519(scalar, u) {
  const k = toInt(clamp(scalar)), uu = Uint8Array.from(u); uu[31] &= 127;   // the top bit of u is ignored
  const x1 = mod(toInt(uu));
  let x2 = 1n, z2 = 0n, x3 = x1, z3 = 1n, swap = 0n;
  for (let t = 254n; t >= 0n; t--) {
    const kt = (k >> t) & 1n;
    if (swap ^ kt) { [x2, x3] = [x3, x2]; [z2, z3] = [z3, z2]; }
    swap = kt;
    const A = mod(x2 + z2), AA = A * A % P, B = mod(x2 - z2), BB = B * B % P, E = mod(AA - BB);
    const C = mod(x3 + z3), D = mod(x3 - z3), DA = D * A % P, CB = C * B % P;
    x3 = mod((DA + CB) ** 2n); z3 = mod(x1 * mod((DA - CB) ** 2n));
    x2 = AA * BB % P; z2 = E * mod(AA + A24 * E) % P;
  }
  if (swap) { [x2, x3] = [x3, x2]; [z2, z3] = [z3, z2]; }
  return toBytes(x2 * pow(z2, P - 2n) % P);
}

const BASE = (() => { const b = new Uint8Array(32); b[0] = 9; return b; })();
export const publicKey = secret => x25519(secret, BASE);
export const shared = (mySecret, theirPublic) => x25519(mySecret, theirPublic);
