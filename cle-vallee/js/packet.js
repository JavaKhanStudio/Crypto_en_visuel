// The packet of episode 1.4, all the way: Alice's order encrypted (AES-256-CBC) and sealed
// (HMAC-SHA256) as in 1.3, plus her two keys, AES ‖ HMAC, either in the clear or locked with Bob's
// padlock (RSA-2048-OAEP, rsa.js). Bob opens the keys, checks the seal, and only then decrypts.
// Eve, at her gate, reads what she can, or changes the order on the way.
import * as A from '../../ficelle/lib/saga-aes.js';
import * as R from '../../ficelle/lib/rsa.js';

// The story's keys and IV are 1.3's (aes.js); the order Eve writes when she has them
export const STORY = { key: A.KEY, macKey: A.MACKEY, iv: A.IV, seed: R.SEED };
export const EVE_ORDER = { fr: 'ATTAQUE A 9H DEMAIN', en: 'ATTACK AT 9AM TOMORROW' };
const split = keys => [keys.slice(0, 32), keys.slice(32)];

// how: 'rsa' (the keys locked, ek: 256 bytes) or 'clear' (the keys as they are, 64 bytes)
export function send(order, { key, macKey, iv, seed }, how = 'rsa') {
  const s = A.send(order, key, iv, macKey), keys = A.concat([key, macKey]);
  if (how === 'clear') return { ...s, how, keys, sent: keys };
  const locked = R.encrypt(R.BOB, keys, seed);
  return { ...s, how, keys, locked, ek: locked.c, sent: locked.c };
}
// Bob: the keys first (his private key opens ek), then the seal, then the order
export function receive(pkt) {
  const keys = pkt.how === 'clear' ? pkt.sent : R.decrypt(R.BOB, pkt.ek).M;
  if (!keys) return { rejected: true, keys: null };
  const [key, macKey] = split(keys);
  return { ...A.receive(pkt, key, macKey, true), keys };
}
// Eve at her gate. Keys in the clear: she has them, reads the order, and when she rewrites, encrypts
// her own order and redoes the seal with them. Keys locked: she reads nothing, and all she can do to
// the order is change a byte blindly (byte 11 of the IV, as in 1.3), which the seal gives away.
export function eve(pkt, rewrite, lang) {
  if (pkt.how === 'clear') {
    const [key, macKey] = split(pkt.sent), m = A.text(A.receive(pkt, key, macKey).back);
    if (!rewrite) return { pkt, keys: pkt.sent, m };
    const w = A.send(EVE_ORDER[lang], key, pkt.iv, macKey);
    return { pkt: { ...pkt, C: w.C, tag: w.tag }, keys: pkt.sent, m, w: w.order };
  }
  return { pkt: rewrite ? { ...pkt, ...A.tamper(pkt, 'iv', A.HOUR) } : pkt };
}
// a fresh key, HMAC key, IV and OAEP seed, for the sandbox's every send
export const fresh = () => ({ key: A.random(32), macKey: A.random(32), iv: A.random(16), seed: A.random(R.H) });
