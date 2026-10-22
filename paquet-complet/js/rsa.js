// Bob's padlock, in numbers: RSA (Rivest, Shamir, Adleman, 1977) on BigInt, and OAEP (RFC 8017,
// EME-OAEP with SHA-256 and MGF1-SHA-256, no label), the padding the project asks for. Alice locks
// her two keys (AES ‖ HMAC, 64 bytes) with Bob's public key (n, e); Bob opens them with his private
// key d. Everything on screen is computed here, in the page; tests/cle_values.mjs checks it against
// openssl and the browser's own RSA-OAEP (WebCrypto).
import { sha256 } from '../../lib/hmac.js';
import { fromHex, hex, concat, xor, random, same } from '../../lib/saga-aes.js';

// ---------- numbers ----------
export const big = b => BigInt('0x' + (hex(b).replace(/ /g, '') || '0'));
export const bytesOf = (x, len) => fromHex(x.toString(16).padStart(len * 2, '0'));
// b^e mod m, square and multiply: one squaring per bit of e, one multiplication per 1 bit
export function modpow(b, e, m) {
  let r = 1n; b %= m;
  for (; e > 0n; e >>= 1n) { if (e & 1n) r = r * b % m; b = b * b % m; }
  return r;
}
// a^-1 mod m, by Euclid's algorithm extended
export function inverse(a, m) {
  let [r0, r1, s0, s1] = [a % m, m, 1n, 0n];
  while (r1) { const k = r0 / r1; [r0, r1] = [r1, r0 - k * r1]; [s0, s1] = [s1, s0 - k * s1]; }
  return (s0 % m + m) % m;
}

// ---------- a key pair ----------
// From two primes p and q: n = p × q goes in the public key with e; d, with e × d = 1 mod
// (p-1)(q-1), is the private key, and only someone who knows p and q can compute it.
export function keyPair(p, q, e) {
  const n = p * q, phi = (p - 1n) * (q - 1n), d = inverse(e, phi);
  return { p, q, n, e, phi, d, dp: d % (p - 1n), dq: d % (q - 1n), qinv: inverse(q, p), k: (n.toString(16).length + 1) >> 1 };
}
// The by-hand pair: 5 × 11 = 55, e = 3, d = 27 (3 × 27 = 81 = 2 × 40 + 1). 7 locks to 13.
export const TOY = { ...keyPair(5n, 11n, 3n), m: 7n };
// Bob's real pair, RSA-2048: two primes of 1024 bits drawn once (openssl genpkey), so the story's
// numbers never move. The page shows p and q nowhere: in the story, only Bob knows them.
export const BOB = keyPair(
  0xdbdca5a25c2c4f8940f48b86750282a9b318ca4cb2ff2de65d4684d9f124d6213789dabd1fecdce6a87efa3dc8a7b4c9fa2441c87b69713a7b74bd7e86c525bc06f5bf6381e3bf30c8a8984487ad7771434b646847c6bbc887d719d3b56041d3296d44527b8f5218faf755164def41506e26a4ee83d756febbe02a9c686aa00dn,
  0xcac64d9d75c662f20a5530dd51cd5b715d57017b3902bca48815b113925131d043fea848280034e3994df6370754cb6d85581442e9fbbba755447f4e4f1a789a2cda58a047e74d59b7a7a5654ce57016a1f813e7a8e793c1c7b8d2d0ac2f1e0ad9391f0ded9018c16d2695f0d7a8116c576cd06ec142a7281393147f2f0b01d3n,
  65537n);

// raw RSA: c = m^e mod n with the public key; m = c^d mod n with the private one, computed the
// quick way through p and q (the Chinese remainder theorem: two half-size powers instead of one)
export const lock = (key, m) => modpow(m, key.e, key.n);
export function unlock(key, c) {
  const m1 = modpow(c, key.dp, key.p), m2 = modpow(c, key.dq, key.q);
  return m2 + (key.qinv * ((m1 - m2 + key.p) % key.p) % key.p) * key.q;
}

// ---------- OAEP, SHA-256 ----------
export const H = 32;                                   // SHA-256 output, in bytes
export const max = key => key.k - 2 * H - 2;           // the most OAEP lets RSA carry: 190 bytes for RSA-2048
const L_HASH = sha256(new Uint8Array(0));              // the hash of the empty label
// MGF1: SHA-256 of the seed followed by a 4-byte counter, 0, 1, 2…, end to end, cut to len bytes
export function mgf1(seed, len) {
  const out = [];
  for (let i = 0, n = 0; n < len; i++, n += H) out.push(sha256(concat([seed, Uint8Array.of(i >>> 24, i >>> 16 & 255, i >>> 8 & 255, i & 255)])));
  return concat(out).slice(0, len);
}
// EM = 00 ‖ maskedSeed ‖ maskedDB, with DB = lHash ‖ 00…00 ‖ 01 ‖ M. The 32 random bytes of the seed
// are spread over the whole block: the same M with another seed gives another EM.
export function encode(key, M, seed) {
  if (M.length > max(key)) throw new RangeError(`OAEP: ${M.length} bytes, ${max(key)} at most`);
  const DB = concat([L_HASH, new Uint8Array(key.k - M.length - 2 * H - 2), Uint8Array.of(1), M]);
  const maskedDB = xor(DB, mgf1(seed, DB.length)), maskedSeed = xor(seed, mgf1(maskedDB, H));
  return { DB, seed, maskedSeed, maskedDB, EM: concat([Uint8Array.of(0), maskedSeed, maskedDB]) };
}
// back from EM to M, or null when EM is not a valid OAEP block (a wrong key, a changed byte)
export function decode(key, EM) {
  const maskedSeed = EM.slice(1, 1 + H), maskedDB = EM.slice(1 + H);
  const seed = xor(maskedSeed, mgf1(maskedDB, H)), DB = xor(maskedDB, mgf1(seed, maskedDB.length));
  const one = DB.indexOf(1, H);
  if (EM[0] !== 0 || !same(DB.slice(0, H), L_HASH) || one < 0 || DB.slice(H, one).some(x => x)) return null;
  return DB.slice(one + 1);
}
// RSA-OAEP, all the way: M (at most 190 bytes) -> 256 bytes, and back
export function encrypt(key, M, seed = random(H)) {
  const o = encode(key, M, seed);
  return { ...o, c: bytesOf(lock(key, big(o.EM)), key.k) };
}
export function decrypt(key, c) {
  const EM = bytesOf(unlock(key, big(c)), key.k);
  return { EM, M: decode(key, EM) };
}

// ---------- the story's values ----------
// two OAEP seeds drawn once (openssl rand): the same two keys locked twice, two unrelated blocks
export const SEED = fromHex('38719881f91851e118631cfc540b7d49d31306473584b08aa6b5961fb0698d73');
export const SEED2 = fromHex('4b668ccf4fb37c14886b6e1ca3b20f3512f6d49776cf95e0721933913a4a19ac');
// the next order's fresh keys and IV, and its seed (step « Des clés neuves »)
export const NEXT = { key: fromHex('bac68a420d5b7c29bf2785bbf8a55104328d5b43ebfe21a7c57f9310b7357424'),
  macKey: fromHex('cb89e63ead162f975d474c9336859ec2000f8837c74c1f30843a861ac8243003'),
  iv: fromHex('db764efb3cbae73b4788e0a020a81e79'), seed: fromHex('db2002878327915e5b65f7e11190084e8aa143ae3f58d97b9ca77c0669344a99') };
