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
