// The episode's values, the slides' own (« Mots de passe - Dictionnaire », « - Le sel », « - SHA-256
// est trop rapide », « - bcrypt », « - bcrypt - La lenteur »), and the fingerprints computed from
// them by sel/js/hash.js. tests/sel_values.mjs checks every one against the slides.
import { md5 } from './hash.js';

export const PASSWORD = 'password';
// the slide writes password+x7k2m: the salt is glued to the end of the password, nothing in between
export const USERS = [
  { u: 'alice', salt: 'x7k2m', who: 'a' },
  { u: 'bob', salt: 'r3n8q', who: 'b' },
];
// Eve's book: the most common passwords, hashed before any leak. The first three are the slide's.
export const LIST = ['password', '123456', 'admin', 'azerty', 'qwerty', 'soleil', '123456789', 'motdepasse'].map(w => [w, md5(w)]);
export const short = h => h.slice(0, 8);

// bcrypt rounds=12, for the chapter on slowness: one salt per user, drawn by bcrypt itself and
// kept in the string. Computed with Python's bcrypt; the test recomputes them with hash.js.
export const BCRYPT = {
  alice: '$2b$12$dKaaqYwSN8okAs5Go2BrA.wYccexvrHkTX7kasypzX9Jlw/2lfRkm',
  bob: '$2b$12$WNGj4Yc4Q/yBYsZjedfZYOeR6.sHQlXSSRGV3zGqeWJNLGQZRVLtq',
};
// Eve's guesses against Alice's bcrypt string: the guess with Alice's salt, at the same cost
export const BCRYPT_TRY = {
  '123456': '$2b$12$dKaaqYwSN8okAs5Go2BrA.LSbyNaXfYzjICSadxWL/.HJBTTB5sUS',
  password: BCRYPT.alice,
};
// how a bcrypt string fits a cell: the cost, the start of the salt, the end of the fingerprint
export const bshort = s => s.slice(0, 7) + s.slice(7, 13) + '…' + s.slice(-6);
export const bsalt = s => s.slice(7, 29);

// The speeds. « SHA-256 est trop rapide »: a graphics card computes more than ten billion a second,
// and every 8-character alphanumeric password falls in about six hours (MD5 is faster still).
// « bcrypt - La lenteur »: 0.24 s for one hash on Simon's machine; the attacker drops from
// billions of tries a second to a few thousand (2 000 here: the order of magnitude of one big
// graphics card at cost 12).
export const RATE = { md5: 1e10, bcrypt: 2000 };
export const WATCH = 0.24;
export const SPACE8 = 62 ** 8;                       // a-z, A-Z, 0-9, 8 characters
export const seconds = (space, fn) => space / RATE[fn];
