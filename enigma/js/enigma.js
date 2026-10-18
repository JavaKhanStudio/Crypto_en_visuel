// The arithmetic of the machine, apart from any drawing: Enigma I with rotors I II III (left to
// right), reflector B, rings at A, no cable on the plugboard, as on the course's slide
// « Enigma - À la main ». A position is three letters, left to right (« AAB »: rotor III shows B).
// press() steps the rotors first, then follows the current, and gives every contact it passes:
// the letter in the fixed frame after III, II, I, the reflector, I, II, III (the slide's table).

export const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const ROTORS = {
  I: { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' },
  II: { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' },
  III: { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' },
};
export const REFLECTOR = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';
export const ORDER = ['I', 'II', 'III'];   // left, middle, right
export const KEYBOARD = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'];   // the German layout, as on the machine

const ix = c => A.indexOf(c), mod = n => ((n % 26) + 26) % 26;

// Where a letter entering rotor `name` at position p (fixed frame) comes out, right to left or back.
export const through = (name, p, x) => mod(ix(ROTORS[name].wiring[mod(x + p)]) - p);
export const back = (name, p, x) => mod(ROTORS[name].wiring.indexOf(A[mod(x + p)]) - p);
export const reflect = x => ix(REFLECTOR[x]);

// The step before the current passes: the right rotor always; the middle one when the right one
// leaves its notch, or when it sits on its own (the double step); the left one with it.
export function step(pos) {
  const [l, m, r] = [...pos].map(ix), N = ORDER.map(n => ix(ROTORS[n].notch));
  const midTurns = r === N[2] || m === N[1], leftTurns = m === N[1];
  return [leftTurns ? l + 1 : l, midTurns ? m + 1 : m, r + 1].map(n => A[mod(n)]).join('');
}

// One key press from position `pos`: { key, from, pos (after the step), path: 7 letters, lamp }.
export function press(key, pos) {
  const now = step(pos), p = [...now].map(ix), path = [];
  let x = ix(key);
  for (const i of [2, 1, 0]) { x = through(ORDER[i], p[i], x); path.push(A[x]); }
  x = reflect(x); path.push(A[x]);
  for (const i of [0, 1, 2]) { x = back(ORDER[i], p[i], x); path.push(A[x]); }
  return { key, from: pos, pos: now, path, lamp: A[x] };
}

// A whole message: one press per letter, each starting where the last one left the rotors.
export function type(text, pos) {
  const out = [];
  for (const c of text) { const r = press(c, pos); out.push(r); pos = r.pos; }
  return out;
}
