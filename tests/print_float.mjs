// r450: lib/print.js floating() tests the pieces' triangles, not their boxes. A hoop 0.3 mm over the bed
// around a box touches nothing (its box holds the box's, which fooled the old test): flagged, and
// repair() pins it so nothing floats after. And the cases that DO touch stay unflagged: a hoop that
// grazes the box's corners, a beam laid across another, a piece buried in another. Units are mm (k = 1).
//   node tests/print_float.mjs
import { floating, repair, bounds, NOZZLE } from '../lib/print.js';

let bad = 0;
const report = (name, ok, note = '') => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (note ? '  ' + note : '')); if (!ok) bad++; };
const piece = (name, t) => ({ name, type: 'Test', color: 0xcccccc, tris: new Float32Array(t) });
function box(name, [x0, y0, z0], [x1, y1, z1]) {   // 12 triangles
  const v = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
  const q = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 4, 7, 3]], t = [];
  for (const [a, b, c, d] of q) t.push(...v[a], ...v[b], ...v[c], ...v[a], ...v[c], ...v[d]);
  return piece(name, t);
}
function hoop(name, R, r, y, n = 48, m = 8) {   // a torus about the y axis, its ring R, its tube r, centred at height y
  const p = (i, j) => { const a = i / n * 2 * Math.PI, b = j / m * 2 * Math.PI, s = R + r * Math.cos(b); return [s * Math.cos(a), y + r * Math.sin(b), s * Math.sin(a)]; };
  const t = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) t.push(...p(i, j), ...p(i + 1, j), ...p(i + 1, j + 1), ...p(i, j), ...p(i + 1, j + 1), ...p(i, j + 1));
  return piece(name, t);
}
const oldFloating = ps => {   // the box test r450 replaced, to show each case is one it got wrong or right
  const g = NOZZLE / 2, bs = ps.map(p => bounds([p])), floor = Math.min(...bs.map(b => b.lo[1]));
  const meet = (a, b) => [0, 1, 2].every(c => a.lo[c] - g <= b.hi[c] && b.lo[c] - g <= a.hi[c]);
  return ps.map((p, i) => bs[i].lo[1] - floor > g && !bs.some((b, j) => j !== i && meet(bs[i], b)));
};

// a 20 x 30 x 20 keep on the bed (corners 14.14 mm from its axis), a hoop of tube 0.5 mm, its foot 0.3 mm up
const keep = box('keep', [-10, 0, -10], [10, 30, 10]);
const ring = hoop('ring', 15, .5, .8);   // inner edge at 14.5 mm: 0.36 mm clear of the corners
let ps = [keep, ring], f = floating(ps, 1);
report('a hoop 0.3 mm over the bed, clear of the keep: floating', f[1] && !f[0], `old box test said ${oldFloating(ps)[1]}`);
let fx = repair(ps, 1), after = floating(fx.ps, 1);
report('repaired: a pin, and nothing floats', fx.ps.length === 3 && !after.some(Boolean), fx.log.join('; '));
const pin = bounds([fx.ps[2]]);
report('the pin stands on the bed, into the hoop, at least 1 mm long', Math.abs(pin.lo[1]) < 1e-6 && pin.hi[1] >= 1 && pin.hi[1] < bounds([fx.ps[1]]).hi[1], `pin y ${pin.lo[1].toFixed(2)}..${pin.hi[1].toFixed(2)}`);

// the same hoop at the keep's top, 29.5 mm up: nearer the keep's top corners than the bed, pinned to the keep
ps = [keep, hoop('ring', 15, .5, 29.5)]; fx = repair(ps, 1); after = floating(fx.ps, 1);
report('a hoop at the top: pinned to the keep, nothing floats', floating(ps, 1)[1] && !after.some(Boolean) && /nearest piece/.test(fx.log[0]), fx.log.join('; '));

ps = [keep, hoop('ring', 14.5, .5, 5)];   // inner edge at 14.0: through the keep's corners
report('a hoop through the keep\'s corners: touches', !floating(ps, 1)[1]);
ps = [keep, hoop('ring', 14.8, .5, 5)];   // inner edge at 14.3: 0.16 mm from the corners, within half a nozzle
report('a hoop 0.16 mm from the corners: touches', !floating(ps, 1)[1]);

// a beam laid across another at right angles: no vertex of either near a face of the other, only edges
const low = box('low', [-10, 0, -1], [10, 2, 1]);
ps = [low, box('high', [-1, 2, -10], [1, 4, 10])];
report('a beam laid across another: touches', !floating(ps, 1)[1]);
ps = [low, box('high', [-1, 3, -10], [1, 5, 10])];
report('the same beam 1 mm above it: floating', floating(ps, 1)[1], `old box test said ${oldFloating(ps)[1]}`);

// a piece wholly inside another, far from its walls (a pin buried in a wall)
ps = [keep, box('core', [-2, 10, -2], [2, 14, 2])];
report('a piece buried in another: touches', !floating(ps, 1)[1]);

// a beacon above a head: floating, pinned
ps = [keep, box('beacon', [-1, 40, -1], [1, 42, 1])]; fx = repair(ps, 1);
report('a beacon 10 mm above the keep: floating, pinned', floating(ps, 1)[1] && !floating(fx.ps, 1).some(Boolean), fx.log.join('; '));
// r510: the pin ends on the keep's top face, straight down 10 mm, not slanted 16.2 mm to its corner
const post = bounds([fx.ps[2]]);
report('the beacon\'s pin runs 10 mm straight down onto the keep\'s top', /\(10\.0 mm\)/.test(fx.log[0]) && post.size[0] < 2 && post.size[2] < 2 && post.lo[1] <= 30 && post.lo[1] > 29 && post.hi[1] >= 40 - 1e-6, `pin x ${post.size[0].toFixed(2)} z ${post.size[2].toFixed(2)} y ${post.lo[1].toFixed(2)}..${post.hi[1].toFixed(2)}`);

console.log(bad ? `${bad} FAIL` : 'all ok');
process.exit(bad ? 1 : 0);
