// The packet of episode 1.5, all four bricks in order. Alice: two fresh keys and a fresh IV, the order
// encrypted (AES-256-CBC, PKCS#7), IV ‖ ciphertext sealed (HMAC-SHA256), the two keys locked with Bob's
// padlock (RSA-2048-OAEP, rsa.js). Bob: the keys opened, the seal checked, and only then the order
// decrypted. Eve, at her gate, changes one byte of one brick, or lets the packet through.
import * as A from './aes.js';
import * as R from './rsa.js';
import { hmac, equal } from './hmac.js';

// The story's keys, IV and OAEP seed are 1.4's; main.py's scene is the next send, with fresh ones
export const STORY = { key: A.KEY, macKey: A.MACKEY, iv: A.IV, seed: R.SEED };
export const SCENE = R.NEXT;
export const HELLO = { fr: 'Bonjour Bob !', en: 'Hello Bob!' };
// the four bricks, in the order they travel, and their bytes in a packet
export const BRICKS = ['ek', 'iv', 'ct', 'tag'];
export const field = (pkt, b) => b === 'ct' ? A.concat(pkt.C) : pkt[b];
// Eve's byte in the story: the first byte of the ciphertext, one bit flipped (main.py's test)
export const EVE = { brick: 'ct', i: 0, d: 0x01 };
// the byte Eve changes in each brick, on the card « Un octet, n'importe où »
export const ANYWHERE = { ek: 100, iv: 10, ct: 0, tag: 31 };

// send_message: Alice's four moves. keys: { key, macKey, iv, seed }, drawn fresh for every send.
export function send(order, { key, macKey, iv, seed }) {
  const s = A.send(order, key, iv, macKey), keys = A.concat([key, macKey]), locked = R.encrypt(R.BOB, keys, seed);
  return { ...s, keys, locked, ek: locked.c };
}
// Eve's hand: byte i of one brick, XORed with d. The packet is copied; Alice's stays as it was.
export function tamper(pkt, brick = EVE.brick, i = EVE.i, d = EVE.d) {
  const out = { ...pkt, ek: Uint8Array.from(pkt.ek), iv: Uint8Array.from(pkt.iv), tag: Uint8Array.from(pkt.tag), C: pkt.C.map(c => Uint8Array.from(c)) };
  if (brick === 'ct') out.C[Math.floor(i / 16)][i % 16] ^= d; else out[brick][i] ^= d;
  return { ...out, eve: { brick, i, d } };
}
// receive_message: Bob's three moves. checkFirst (the right way): the keys, the seal, then the order,
// and nothing decrypted when the seal is wrong. Without it (the common mistake), he decrypts first,
// working on bytes Eve chose, and checks the seal after. Every move is returned, for the card.
export function receive(pkt, checkFirst = true) {
  const keys = R.decrypt(R.BOB, pkt.ek).M;
  if (!keys) return { keysOk: false, rejected: 'keys', decrypted: false };
  const key = keys.slice(0, 32), macKey = keys.slice(32);
  const mine = hmac(macKey, A.concat([pkt.iv, ...pkt.C])), sealOk = equal(mine, pkt.tag);
  const out = { keysOk: true, keys, mine, sealOk, decrypted: false };
  if (checkFirst && !sealOk) return { ...out, rejected: 'seal' };
  const all = A.concat(A.cbcDec(key, pkt.iv, pkt.C)), padGood = A.padOk(all);
  return { ...out, decrypted: true, padGood, back: padGood ? A.unpad(all) : all, rejected: sealOk ? false : 'seal' };
}
// a fresh AES key, HMAC key, IV and OAEP seed: os.urandom(32), os.urandom(32), os.urandom(16)
export const fresh = () => ({ key: A.random(32), macKey: A.random(32), iv: A.random(16), seed: A.random(R.H) });
