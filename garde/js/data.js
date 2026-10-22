// The episode's values. The anchor slide, « HMAC - La timing attack », shows only the code
// (mac == recu, then hmac.compare_digest(mac, recu)); the key and Alice's message are those of
// the slide just before it, « HMAC » (key = b"cle_secrete_partagee", message = b"Transfert 1000
// euros a Bob"). Eve's message changes only the beneficiary. tests/garde_values.mjs checks the
// macs against Python's hmac and node:crypto.
import { hmacHex } from '../../lib/hmac.js';

export const KEY = 'cle_secrete_partagee';
export const MSG_A = 'Transfert 1000 euros a Bob';
export const MSG_E = 'Transfert 1000 euros a Eve';
export const MAC_A = hmacHex(KEY, MSG_A);       // 1598e59f08a4faec…
export const MAC_E = hmacHex(KEY, MSG_E);       // b2ef092277667582…
export const HEX = '0123456789abcdef';
export const N = 64;                            // hex characters in a SHA-256 HMAC
// Eve's badge for a guess: what she knows, then the letter she tries, then zeros
export const guess = (prefix, c = '') => (prefix + c).padEnd(N, '0');
// how many letters the guards look at before answering
export const looks = (mac, recu, guard) => {
  if (guard === 'cd') return N;                                   // compare_digest: always all of them
  let i = 0; while (i < N && mac[i] === recu[i]) i++;
  return Math.min(N, i + 1);                                      // ==: up to the first difference
};
