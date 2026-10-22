// Alice's signature, in numbers: RSA-PSS (RFC 8017, EMSA-PSS with SHA-256, MGF1-SHA-256 and a
// 32-byte salt), on rsa.js's BigInt RSA. RSA used the other way round from Bob's padlock: Alice
// computes with her PRIVATE key (only she can), anyone checks with her PUBLIC key. Everything on
// screen is computed here, in the page; tests/tours_values.mjs checks it against openssl and the
// browser's own RSA-PSS (WebCrypto), both ways.
import { sha256 } from '../../lib/hmac.js';
import { fromHex, concat, xor, random, same } from '../../lib/saga-aes.js';
import { keyPair, lock, unlock, big, bytesOf, mgf1, H } from './rsa.js';

// Alice's pair, RSA-2048: two primes of 1024 bits drawn once (openssl genpkey), so the story's
// signature never moves. Her public key (n, e) is Bob's, as Bob's padlock is Alice's.
export const ALICE = keyPair(
  0xbeea76c1bda834c5c1e01320c6b2f8bc8de3e47b843b43e6bfd25fd8bbc4829523c7cc7683d80de536826ddedb966d0718864183fcc88f8fc1c580abd8a6aefbf45e7decd9f054c5175bc459742bbfdb8a9c4476fa1a8f53275b4883242ada5af011e1ddbb12fe37eb4827fce294d6d93292ca688b91ae18651894461fe28c43n,
  0xb6e61f675800da2f5283f7bbf48b572303303f2a8fdc5ba01808989a3a3a72c1e3d674854e9333f224e17eabf1c0cba8ae8fa9242d6383602a881c67e6be69716be1acf1a2d7c1cdfa9bb59692f580196e338769b5ce48bf664bd580425f376b58b1cf4f7e3ad4bf684082dbd2d310fd6795976b5cb315e4d25c50d83c5ad903n,
  65537n);
// Eve's own pair: she signs too, a real signature, but hers (drawn once, openssl genpkey)
export const EVE = keyPair(
  0xd90ba8a023a18e73f59ce7694f4f82052e8068d149a55aa398150193bc98dd056b1da5c04244f8c903e6dadd707ca3e65a7ebd1488186126738df6a1c5071c5d15d6766019c3e9e7dac87fce62275d32bddf7cd2bcf06d8352eb377475ef11ee9656e917e504f8149d605ff037bd8dc97c128fe5329290f0fda8be245dd1204fn,
  0xd7b9c7ce5e0dda05adbc866276627f6b98bb2f9764177dad631900fd3b533399d81dfa492e6c2e58bb0f2acad8dec8581069ed6ba3d3c46d23ec340451147acf54dc08ed28d686e365854f4c33b50711d2f63009ce64b0ddc7a0d43d52bc7dfc6fa690d3471ab7830d7ebe777a87d073263ef5f536372949a85bd7c6e5dbc3bbn,
  65537n);

const S = 32;                     // the salt, as long as the hash
const ZEROS = new Uint8Array(8);
// EMSA-PSS-ENCODE: H = SHA-256(8 zero bytes ‖ SHA-256(M) ‖ salt); EM = maskedDB ‖ H ‖ bc, with
// DB = 00…00 ‖ 01 ‖ salt masked by MGF1(H). The top bit is cleared, so EM < n.
export function encode(key, M, salt) {
  const len = key.k, mHash = sha256(M), h = sha256(concat([ZEROS, mHash, salt]));
  const DB = concat([new Uint8Array(len - S - H - 2), Uint8Array.of(1), salt]);
  const maskedDB = xor(DB, mgf1(h, DB.length)); maskedDB[0] &= 0x7f;
  return { mHash, salt, h, EM: concat([maskedDB, h, Uint8Array.of(0xbc)]) };
}
// sign: EM raised to Alice's private exponent d. 256 bytes. A fresh salt each time.
export function sign(key, M, salt = random(S)) {
  const o = encode(key, M, salt);
  return { ...o, sig: bytesOf(unlock(key, big(o.EM)), key.k) };
}
// verify: the signature raised to the public exponent e gives EM back; its salt and SHA-256(M)
// must give the H it carries. ok is false for anything else (another key, a changed byte); range is
// false when the signature is not even below n (a signature made with another, larger key).
export function verify(key, M, sig) {
  const s = big(sig), EM = bytesOf(s < key.n ? lock(key, s) : 0n, key.k);
  const mHash = sha256(M), h = EM.slice(key.k - H - 1, key.k - 1), maskedDB = EM.slice(0, key.k - H - 1);
  const DB = xor(maskedDB, mgf1(h, maskedDB.length)); DB[0] &= 0x7f;
  const one = DB.length - S - 1, salt = DB.slice(one + 1);
  const shape = s < key.n && !(EM[0] & 0x80) && EM[key.k - 1] === 0xbc && DB[one] === 1 && !DB.slice(0, one).some(x => x);
  const want = sha256(concat([ZEROS, mHash, salt]));
  return { EM, mHash, h, want, range: s < key.n, ok: shape && same(h, want) };
}

// ---------- the story's values ----------
// salts drawn once (openssl rand): Alice's signature, Alice's numbered one, Eve's (drawn until Eve's
// signature, in both languages, is below Alice's n, so the card shows a block and not « out of range »)
export const SALT = fromHex('d5cfb0978ca547ac1a2f1084cc49c45b2907d692a3743d462a1afd986f7b10e6');
export const SALT_N = fromHex('504d218bbce78ea2150d2c65336a6be104935f9680a5300fa3b677d71c57a1d1');
export const SALT_EVE = fromHex('58d622ef35147eb8ef640ec17f65801e93bfc26c7257da18fd4168242d9546b9');
