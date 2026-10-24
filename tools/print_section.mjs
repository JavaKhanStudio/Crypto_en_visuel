// r501: a cast figure's exported parts, cut as lab/print/ cuts them (lib/print.js cut()), assembled, and
// sliced front to back through the figure's middle (the plane z = 0, which holds the neck, the hat's peg
// and both arms' shoulder pegs): each part's outline in its own colour, so the sockets, their play and the
// hat's hollow show. Writes an SVG (10 px a mm); magick turns it into a PNG.
//     node tools/print_section.mjs out/x.svg [kind] [setting] [--z 0]
import { register } from 'node:module';
register('../ficelle/tools/three_hooks.mjs', import.meta.url);
const { person } = await import('../ficelle/lib/cast.js');
const { pieces, fit, repair, cut } = await import('../ficelle/lib/print.js');
const { JOINT, DEPTH, CLEAR } = await import('../ficelle/lib/fit.js');
import { writeFileSync } from 'node:fs';
const args = process.argv.slice(2), zi = args.indexOf('--z'), z0 = zi >= 0 ? +args[zi + 1] : 0, pos = args.filter((a, i) => !a.startsWith('--') && i !== zi + 1 || zi < 0 && !a.startsWith('--'));
const [out, kind = 'a', setting = 'today'] = pos;
const fig = person(kind, { disguise: setting }), raw = pieces(fig), k = fit(raw, { h: 60 }), joints = fig.userData.joints, J = (m, f) => joints.find(x => x.male === m && x.female === f);
const ps = [...new Set(raw.map(p => p.body))].flatMap(n => repair(raw.filter(p => p.body === n && !p.hole), k).ps.map(p => ({ ...p, body: n, piece: p.piece ?? n })));
const { ps: cutPs, log } = cut(ps, raw, k, { play: (m, f) => { const x = J(m, f); return x ? +((JOINT[x.kind][0] + JOINT[x.kind][1]) / 2).toFixed(3) : null; },
  bore: (m, f) => J(m, f)?.bore != null, depth: DEPTH, clear: CLEAR });
const PAL = ['#4da3ff', '#ffb020', '#ff5a6a', '#6ad18f', '#c58cff', '#f0f0f0', '#ff8c3a', '#3ad1d1'];
const parts = [...new Set(cutPs.map(p => p.body))], segs = [];
let lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
for (const p of cutPs) {
  const t = p.tris, Z = z0 / k;
  for (let i = 0; i < t.length; i += 9) {
    const v = [0, 1, 2].map(j => [t[i + 3 * j], t[i + 3 * j + 1], t[i + 3 * j + 2]]), d = v.map(x => x[2] - Z), hit = [];
    for (let j = 0; j < 3; j++) { const a = v[j], b = v[(j + 1) % 3], da = d[j], db = d[(j + 1) % 3]; if ((da < 0) !== (db < 0)) { const s = da / (da - db); hit.push([(a[0] + (b[0] - a[0]) * s) * k, (a[1] + (b[1] - a[1]) * s) * k]); } }
    if (hit.length === 2) { segs.push([parts.indexOf(p.body), hit]); for (const h of hit) { lo = lo.map((x, c) => Math.min(x, h[c])); hi = hi.map((x, c) => Math.max(x, h[c])); } }
  }
}
const S = 10, M = 20, W = (hi[0] - lo[0]) * S + 2 * M + 260, H = (hi[1] - lo[1]) * S + 2 * M, X = x => (x - lo[0]) * S + M, Y = y => H - ((y - lo[1]) * S + M);
const lines = segs.map(([c, [a, b]]) => `<line x1="${X(a[0]).toFixed(1)}" y1="${Y(a[1]).toFixed(1)}" x2="${X(b[0]).toFixed(1)}" y2="${Y(b[1]).toFixed(1)}" stroke="${PAL[c % PAL.length]}" stroke-width="1.6"/>`);
const key = parts.map((n, i) => `<text x="${W - 250}" y="${40 + 26 * i}" fill="${PAL[i % PAL.length]}" font-size="20" font-family="sans-serif">${n}</text>`);
const grid = []; for (let x = Math.ceil(lo[0] / 5) * 5; x <= hi[0]; x += 5) grid.push(`<line x1="${X(x)}" y1="0" x2="${X(x)}" y2="${H}" stroke="#232936"/>`);
for (let y = Math.ceil(lo[1] / 5) * 5; y <= hi[1]; y += 5) grid.push(`<line x1="0" y1="${Y(y)}" x2="${W - 260}" y2="${Y(y)}" stroke="#232936"/>`);
writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}"><rect width="100%" height="100%" fill="#10131a"/>${grid.join('')}${lines.join('')}${key.join('')}
<text x="${W - 250}" y="${H - 20}" fill="#8a93a6" font-size="16" font-family="sans-serif">grid 5 mm, slice z = ${z0} mm</text></svg>`);
console.log(out, `${segs.length} segments, ${parts.length} parts;`, log.join('; '));
