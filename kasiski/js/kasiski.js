// The arithmetic of the episode, apart from the 3D: Vigenère, Kasiski's distances and counts, the
// columns, and the wheel's track. Values from the course deck (slides « Kasiski - Le chiffré » to
// « Les 5 colonnes », computed by cryptographie verif/r24/calc/kas2.py): key LEMON, the 399-letter
// text below, 48 trigram distances, 5 divides 44 of them. tests/kasiski_values.mjs checks them.

// Letters only, upper case, accents dropped: « À l’aube » -> ALAUBE.
export const clean = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '');

// The paragraph Alice encrypts (the deck's): it explains, as it happens, how to break Vigenère.
export const TEXT = clean("LE CHIFFREMENT DE VIGENERE A RESISTE TROIS SIECLES PARCE QUE LA MEME LETTRE NE DONNE PAS " +
  "TOUJOURS LA MEME LETTRE CHIFFREE. POURTANT LA CLE SE REPETE, ET QUAND UN MOT DU MESSAGE REVIENT " +
  "AU MEME ENDROIT DE LA CLE, IL REVIENT CHIFFRE DE LA MEME FACON. IL SUFFIT DONC DE CHERCHER LES " +
  "GROUPES DE LETTRES QUI SE REPETENT DANS LE CHIFFRE ET DE MESURER LA DISTANCE ENTRE EUX. CETTE " +
  "DISTANCE EST UN MULTIPLE DE LA LONGUEUR DE LA CLE, ET LA LONGUEUR DE LA CLE EST LE NOMBRE QUI " +
  "DIVISE LE PLUS DE CES DISTANCES.");
export const KEY = 'LEMON';

const A = 65;
export const shift = (c, k) => String.fromCharCode((c.charCodeAt(0) - A + k.charCodeAt(0) - A) % 26 + A);
export const unshift = (c, k) => String.fromCharCode((c.charCodeAt(0) - k.charCodeAt(0) + 26) % 26 + A);
// letter i is shifted by the key letter i % key.length: the key turns like a wheel
export const vigenere = (text, key) => [...text].map((c, i) => shift(c, key[i % key.length])).join('');

// Every group of 3 letters that comes back in the ciphertext, and the gap from each sighting to the next.
export function repeats(cipher) {
  const at = new Map();
  for (let i = 0; i + 3 <= cipher.length; i++) { const g = cipher.slice(i, i + 3); at.set(g, [...(at.get(g) || []), i]); }
  const out = [];
  for (const [tri, pos] of at) for (let j = 0; j + 1 < pos.length; j++) out.push({ tri, a: pos[j], b: pos[j + 1], d: pos[j + 1] - pos[j] });
  return out;
}
// For each length L from lo to hi, how many of the distances L divides.
export const counts = (ds, lo = 2, hi = 8) => Array.from({ length: hi - lo + 1 }, (_, i) => ({ L: lo + i, n: ds.filter(d => d % (lo + i) === 0).length }));
// The length to keep. A divisor of the key length divides every distance the key length divides, and
// some more by chance (2 beats 4 for a 4-letter key): so keep the longest length that divides almost
// as many as the best one, here at least 80 % of its count.
export function best(cs, ratio = .8) { const top = Math.max(...cs.map(c => c.n)); return cs.filter(c => c.n >= ratio * top).at(-1); }

// Once the length is known: column j holds the letters shifted by key letter j, a plain Caesar.
// Its most frequent letter is taken for E, which gives the key letter.
export function columns(cipher, L) {
  return Array.from({ length: L }, (_, j) => {
    const col = [...cipher].filter((_, i) => i % L === j), n = {};
    for (const c of col) n[c] = (n[c] || 0) + 1;
    const top = Object.keys(n).sort((x, y) => n[y] - n[x] || x.localeCompare(y))[0];
    return { col, top, n: n[top], key: unshift(top, 'E') };
  });
}

export const CIPHER = vigenere(TEXT, KEY);

// ---------- the wheel ----------
// Lengths in centimetres, so every division is exact. A car tyre of 2 m around (a 205/55 R16: 1.99 m)
// with a stone in its tread prints a mark every 200 cm, but the road shows it only where it is muddy.
// MUD: the turns whose mark lands in mud; GRAVEL: marks left by loose gravel, in their own puddles.
export const WHEEL = { C: 200, start: -4000, turns: 40,
  mud: [0, 2, 5, 7, 12, 15, 17, 22, 25, 27, 32, 35, 37], gravel: [-1230, 2160] };   // 3.7 m after turn 12, 7.6 m after turn 27
// the candidates: a car tyre is 1.5 m to 4 m around, by half metres
export const CANDIDATES = [150, 200, 250, 300, 350, 400];

// The marks Eve finds on the road, in order: { x (cm), kind: 'stone' | 'gravel' }, for a wheel of
// circumference C cm, its stone marks seen at the turns in `mud`, plus the gravel marks.
export function track({ C, start, mud, gravel }) {
  return [...mud.map(n => ({ x: start + n * C, kind: 'stone' })), ...gravel.map(x => ({ x, kind: 'gravel' }))].sort((p, q) => p.x - q.x);
}
// the gap from each mark to the next, in cm
export const gaps = marks => marks.slice(1).map((m, i) => ({ from: marks[i].x, to: m.x, d: m.x - marks[i].x, gravel: m.kind === 'gravel' || marks[i].kind === 'gravel' }));
export const wheelCounts = (ds, cands = CANDIDATES) => cands.map(L => ({ L, n: ds.filter(d => d % L === 0).length }));

// The sandbox's wheel: circumference C, a mud puddle at random turns, g gravel marks at random places.
// seeded, so the same choices give the same road
export function randomRoad(C, g, seed = 7) {
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const turns = Math.floor(8000 / C), mud = [];
  for (let n = 0; n <= turns; n++) if (rnd() < .38) mud.push(n);
  const gravel = [];
  for (let i = 0; i < g; i++) gravel.push(Math.round(-4000 + 100 + rnd() * 7800) + 7);   // + 7 cm: never on a whole step
  return { C, start: -4000, turns, mud, gravel };
}
// how a length reads: 200 -> « 2 m », 250 -> « 2,5 m », 370 -> « 3,7 m »
export const metres = (cm, sep = ',') => (cm % 100 === 0 ? String(cm / 100) : (cm / 100).toFixed(cm % 10 ? 2 : 1).replace('.', sep)) + ' m';
