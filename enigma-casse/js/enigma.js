// The arithmetic of the machine, apart from any drawing: Enigma I with the whole setting of the
// day. A setting is { rotors: ['I', 'II', 'III'] (left, middle, right, three of the five),
// rings: 'AAA' (Ringstellung, left to right), plugs: 'AB CD …' (the cables, Steckerverbindungen) };
// reflector B. A position is three letters, left to right (« ADU »: the right rotor shows U).
// press() steps the rotors first, then follows the current, and gives every contact it passes:
// the letter after the cable on the way in, then in the fixed frame after the right, middle and
// left rotors, the reflector, the left, middle and right rotors, and the lamp after the cable.

export const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// the five rotors of the army's Enigma I, and the letter in the window when each one carries its
// left neighbour one notch (I: Q→R, II: E→F, III: V→W, IV: J→K, V: Z→A)
export const ROTORS = {
  I: { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' },
  II: { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' },
  III: { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' },
  IV: { wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notch: 'J' },
  V: { wiring: 'VZBRGITYUPSDNHLXAWMJQOFECK', notch: 'Z' },
};
export const NAMES = ['I', 'II', 'III', 'IV', 'V'];
export const REFLECTOR = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';
export const KEYBOARD = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'];   // the German layout, as on the machine
// 5.1's machine: rotors I II III, rings at A, no cable
export const BARE = { rotors: ['I', 'II', 'III'], rings: 'AAA', plugs: '' };

const ix = c => A.indexOf(c), mod = n => ((n % 26) + 26) % 26;

// The cables as a table: plug[x] is the letter x is swapped with (itself when no cable).
export function plugTable(plugs = '') {
  const t = [...A];
  for (const pair of plugs.split(/\s+/).filter(Boolean)) { const [a, b] = pair; t[ix(a)] = b; t[ix(b)] = a; }
  return t;
}
// 'AB CD' -> [['A', 'B'], ['C', 'D']]
export const pairs = plugs => plugs.split(/\s+/).filter(Boolean).map(p => [p[0], p[1]]);

// Where a letter entering rotor `name` (window p, ring r) at contact x of the fixed frame comes out,
// right to left or back. The ring turns the wiring against the letters: the offset is p - r.
export const through = (name, p, r, x) => mod(ix(ROTORS[name].wiring[mod(x + p - r)]) - (p - r));
export const back = (name, p, r, x) => mod(ROTORS[name].wiring.indexOf(A[mod(x + p - r)]) - (p - r));
export const reflect = x => ix(REFLECTOR[x]);

// The step before the current passes: the right rotor always; the middle one when the right one
// shows its notch letter, or when it shows its own (the double step); the left one with it.
export function step(pos, rotors = BARE.rotors) {
  const [l, m, r] = [...pos].map(ix), N = rotors.map(n => ix(ROTORS[n].notch));
  const midTurns = r === N[2] || m === N[1], leftTurns = m === N[1];
  return [leftTurns ? l + 1 : l, midTurns ? m + 1 : m, r + 1].map(n => A[mod(n)]).join('');
}

// One key press from position `pos`: { key, from, pos (after the step), in (after the cable),
// path: 7 letters (III, II, I, ref, I, II, III in the fixed frame), lamp (after the cable),
// rotors and rings (the setting it ran with, so it can be drawn again later) }.
export function press(key, pos, set = BARE) {
  const plug = plugTable(set.plugs), R = set.rotors, ring = [...set.rings].map(ix);
  const now = step(pos, R), p = [...now].map(ix), path = [];
  const inn = plug[ix(key)];
  let x = ix(inn);
  for (const i of [2, 1, 0]) { x = through(R[i], p[i], ring[i], x); path.push(A[x]); }
  x = reflect(x); path.push(A[x]);
  for (const i of [0, 1, 2]) { x = back(R[i], p[i], ring[i], x); path.push(A[x]); }
  return { key, from: pos, pos: now, in: inn, path, lamp: plug[x], rotors: R, rings: set.rings };
}

// A whole message: one press per letter, each starting where the last one left the rotors.
export function type(text, pos, set = BARE) {
  const out = [];
  for (const c of text) { const r = press(c, pos, set); out.push(r); pos = r.pos; }
  return out;
}
export const lamps = (text, pos, set) => type(text, pos, set).map(r => r.lamp).join('');

// ---------- how many settings ----------
// rotor orders: 5 for the left slot, 4 left for the middle, 3 for the right
export const ORDERS = 5 * 4 * 3;
export const STARTS = 26 ** 3;
// ways to plug n cables among 26 letters: 26! / ((26 - 2n)! · n! · 2^n), as a BigInt
export function cableWays(n) {
  let f = k => { let r = 1n; for (let i = 2n; i <= BigInt(k); i++) r *= i; return r; };
  return f(26) / (f(26 - 2 * n) * f(n) * 2n ** BigInt(n));
}
// the same, cable after cable: the k-th cable has (26 - 2(k-1)) choose 2 places, and the n cables
// can be plugged in any of n! orders, so divide by n
export function cableSteps(n) {
  const out = []; let w = 1n;
  for (let k = 1; k <= n; k++) { const free = 26 - 2 * (k - 1); w = w * BigInt(free * (free - 1) / 2) / BigInt(k); out.push({ k, free, ways: w }); }
  return out;
}
export const TOTAL = BigInt(ORDERS) * BigInt(STARTS) * cableWays(10);

// ---------- the break: the crib and the bombe ----------
// A crib laid at place k (0 = under the first cipher letter) is ruled out when one of its letters
// sits over the same cipher letter: the machine never lights the key pressed. The places it may hold:
export const clashes = (cipher, crib, k) => [...crib].map((c, j) => cipher[k + j] === c ? j : -1).filter(j => j >= 0);
export const places = (cipher, crib) => [...Array(Math.max(0, cipher.length - crib.length + 1)).keys()].filter(k => !clashes(cipher, crib, k).length);
// The menu of a crib at place k: one link per letter, { a: crib letter, b: cipher letter, i: its
// place in the message, 0-based }. Its letters, in the order they first appear.
export const menu = (cipher, crib, k) => [...crib].map((a, j) => ({ a, b: cipher[k + j], i: k + j }));
export const menuLetters = links => [...new Set(links.flatMap(l => [l.a, l.b]))];

// What the rotors and the reflector do, cables left out, at the i-th letter of a message whose
// rotors stand at `pos` (rings at A) before it: the right rotor steps i + 1 times and, as the bombe
// assumes over a crib, the other two do not move. scrambler(...)[x] is where contact x comes back.
export function scrambler(rotors, pos, i) {
  const p = [...pos].map(ix); p[2] = mod(p[2] + i + 1);
  const out = [];
  for (let x0 = 0; x0 < 26; x0++) {
    let x = x0;
    for (const k of [2, 1, 0]) x = through(rotors[k], p[k], 0, x);
    x = reflect(x);
    for (const k of [0, 1, 2]) x = back(rotors[k], p[k], 0, x);
    out.push(x);
  }
  return out;
}

// Follow one guess through the menu at one position: « `a`'s cable goes to `b` ». A link a–c at
// place i says: if a's cable goes to x, c's goes to scrambler_i(x), and the other way round; a cable
// goes both ways (Welchman's diagonal board: a–x is x–a). live[a * 26 + x] = 1 for every « a's cable
// goes to x » the guess implies. With the right guess at the right position they stay one per
// letter; a wrong guess spreads.
export function implied(links, rotors, pos, a0, b0, perm = i => scrambler(rotors, pos, i)) {
  const adj = Array.from({ length: 26 }, () => []);
  for (const l of links) { const P = perm(l.i); adj[ix(l.a)].push([ix(l.b), P]); adj[ix(l.b)].push([ix(l.a), P]); }
  const live = new Uint8Array(676), q = [];
  const lite = (a, b) => { if (!live[a * 26 + b]) { live[a * 26 + b] = 1; q.push(a * 26 + b); } };
  lite(ix(a0), ix(b0));
  while (q.length) { const w = q.pop(), a = (w / 26) | 0, b = w % 26; lite(b, a); for (const [c, P] of adj[a]) lite(c, P[b]); }
  return live;
}
// what the live table says about letter a: the letters its cable may go to
export const cablesOf = (live, a) => [...A].filter((_, b) => live[ix(a) * 26 + b]);

// The bombe at one position, the guess « test's cable goes to A »: when every one of the 26 wires
// of the test letter ends up live, the guess and every other one fall (the position is wrong); when
// 25 are, the one left dark is the only guess that holds: the bombe stops, and says it.
export function bombeAt(links, rotors, pos, test, perm) {
  const n = cablesOf(implied(links, rotors, pos, test, 'A', perm), test);
  if (n.length === 26) return null;
  const guess = n.length === 25 ? [...A].find(c => !n.includes(c)) : n.length === 1 ? n[0] : null;
  return { pos, live: n.length, guess };
}
// position number n (0 .. 17 575) as three letters, AAA, AAB, …, ZZZ
export const posOf = n => A[(n / 676) | 0] + A[((n / 26) | 0) % 26] + A[n % 26];
// The bombe over positions [from, to) of one rotor order: its stops. With the left and middle
// rotors still, the scrambler at letter i of position LMr depends on r + i only: 26 per pair LM.
export function bombe(links, rotors, test, from = 0, to = STARTS) {
  const stops = []; let lm = -1, ring = null;
  for (let n = from; n < to; n++) {
    const pos = posOf(n);
    if ((n / 26 | 0) !== lm) { lm = n / 26 | 0; ring = [...A].map((_, r) => scrambler(rotors, pos.slice(0, 2) + 'A', r - 1)); }
    const s = bombeAt(links, rotors, pos, test, i => ring[(n % 26 + i + 1) % 26]);
    if (s) stops.push(s);
  }
  return stops;
}
// The clerk at a stop: the guess followed to its end gives a cable for each letter of the menu. A
// letter given two cables (or one taken twice) is a contradiction: the stop was false.
// { pairs: ['BS', …] (cables, a letter alone means no cable), bad: [letters with two] }
export function check(links, rotors, stop, test) {
  const live = implied(links, rotors, stop.pos, test, stop.guess), pairs = new Set(), bad = [];
  for (const a of A) {
    const c = cablesOf(live, a);
    if (c.length > 1) bad.push(a);
    else if (c.length === 1) pairs.add([a, c[0]].sort().join(''));
  }
  return { pairs: [...pairs].sort(), bad, live };
}
