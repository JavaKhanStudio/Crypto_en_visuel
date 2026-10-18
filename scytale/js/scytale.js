// The scytale's arithmetic, apart from the 3D. A stick that takes k letters per turn,
// a message written along its length in k lines of m = ceil(n / k) letters (row by row,
// as the stick is turned), and the strip that comes off it: turn after turn, one letter
// of each line, so strip letter j is grid[j % k][floor(j / k)]. Wound on a stick of k'
// letters per turn, the line in front holds strip letters j with j % k' equal to it.
// A cell past the end of the message stays blank ('').

// Letters only, upper case, accents dropped: « À l’aube » -> ALAUBE.
export const clean = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '');

export function layout(msg, k) {
  const n = msg.length, m = Math.max(1, Math.ceil(n / k));
  const grid = Array.from({ length: k }, (_, r) => Array.from({ length: m }, (_, c) => msg[r * m + c] ?? ''));
  const strip = Array.from({ length: k * m }, (_, j) => grid[j % k][Math.floor(j / k)]);
  return { n, m, k, grid, strip };
}

// strip letter j sits at grid cell (row j % k, column j / k); Alice writes it in turn row * m + col
export const order = (j, k, m) => (j % k) * m + Math.floor(j / k);

// the lines a stick of kk letters per turn shows, each read along the length
export function lines(strip, kk) {
  return Array.from({ length: kk }, (_, r) => strip.filter((_, j) => j % kk === r));
}
export const show = cells => cells.map(c => c || '·').join('');
