// r651: does a cast figure's key (r395) stay inside its robe at rest? Each key's vertices against the body as drawn
// (repaired, before cut() opens the socket), and how far along the peg the furthest one is out. Before r651 the key ran
// to .3 mm inside the robe on the peg's axis, and Alice's robe narrows above it: 10 of 48 out, 0.22 mm. A tree other
// than this one (a worktree at an older commit) is read with --tree, to compare.
//     node tools/print_probe/key_inside.mjs [kind, default a] [--tree <repo root>]
const args = process.argv.slice(2), at = args.indexOf('--tree'), T = at >= 0 ? args.splice(at, 2)[1] : new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
const kind = args[0] ?? 'a';
const { register } = await import('node:module'); register(T + '/ficelle/tools/three_hooks.mjs', import.meta.url);
const { person } = await import(T + '/ficelle/lib/cast.js');
const { repair } = await import(T + '/ficelle/lib/print.js');
function inside(p, t) {   // parity of a ray along a skewed direction
  const d = [.577, .5771, .5779]; let c = 0;
  for (let i = 0; i < t.length; i += 9) {
    const a = [t[i], t[i+1], t[i+2]], e1 = [t[i+3]-a[0], t[i+4]-a[1], t[i+5]-a[2]], e2 = [t[i+6]-a[0], t[i+7]-a[1], t[i+8]-a[2]];
    const h = [d[1]*e2[2]-d[2]*e2[1], d[2]*e2[0]-d[0]*e2[2], d[0]*e2[1]-d[1]*e2[0]], det = e1[0]*h[0]+e1[1]*h[1]+e1[2]*h[2];
    if (Math.abs(det) < 1e-12) continue; const f = 1/det, s = [p[0]-a[0], p[1]-a[1], p[2]-a[2]], u = f*(s[0]*h[0]+s[1]*h[1]+s[2]*h[2]);
    if (u < 0 || u > 1) continue; const q = [s[1]*e1[2]-s[2]*e1[1], s[2]*e1[0]-s[0]*e1[2], s[0]*e1[1]-s[1]*e1[0]], v = f*(d[0]*q[0]+d[1]*q[1]+d[2]*q[2]);
    if (v < 0 || u + v > 1) continue; if (f*(e2[0]*q[0]+e2[1]*q[1]+e2[2]*q[2]) > 0) c++;
  }
  return c % 2 === 1;
}
const { printed } = await import(T + '/tests/print/toy.mjs');
const fig = person(kind), r = printed(fig, 60), raw = r.raw, k = r.k;
const body = repair(raw.filter(p => p.body === 'body' && !p.hole), k).ps;
let bad = 0;
for (const side of r.ps.filter(p => p.key).map(p => p.piece)) {
  const t = r.ps.find(p => p.piece === side && p.key).tris; let out = 0, n = 0, far = 0;
  const pin = raw.find(p => p.pin?.swing && p.piece === side).pin;
  let worst = 0;
  for (let i = 0; i < t.length; i += 3) { const v = [t[i], t[i + 1], t[i + 2]]; n++; if (!body.some(q => inside(v, q.tris))) {
    out++; // how far out: step back along the peg's axis into the robe
    const u = pin.b.map((x, c) => x - pin.a[c]), L = Math.hypot(...u), w = u.map(x => x / L);
    for (let d = 0; d < 3 / k; d += .02 / k) { if ([1, -1].some(sg => body.some(q => inside(v.map((x, c) => x + sg * w[c] * d), q.tris)))) { worst = Math.max(worst, d * k); break; } }
  } }
  if (out) bad++;
  console.log((out ? 'FAIL ' : 'ok   ') + side, `key vertices outside the uncut robe at rest: ${out} of ${n}, the furthest ${worst.toFixed(2)} mm out`);
}
console.log(bad ? `${bad} FAILED` : 'all ok');
