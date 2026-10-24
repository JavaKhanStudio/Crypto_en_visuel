// r501: lib/print.js cut() cuts a toy's sockets in the export, as lib/fit.js checks them. A cast figure
// (lib/cast.js) at 60 mm, read and repaired as lab/print/ does, then cut: one body per part; every cut
// piece closed with its faces out (positive volume); the drawn holes gone from the files; and measured:
// the neck socket in the robe as wide as the neck peg plus the press play, DEPTH past the peg's end; each
// arm's shoulder hole as wide as its peg plus the turn play; the hat hollowed by the head CLEAR clear;
// the right fist's hole through. Units in the test are mm.
//     node tests/print_cut.mjs [kind ...] [--setting today] [--quiet]
import { register } from 'node:module';
register('../tools/print_probe/hooks.mjs', import.meta.url);
const { person, CAST, DISGUISES } = await import('../lib/cast.js');
const { repair, check } = await import('../lib/print.js');
const { JOINT, DEPTH } = await import('../lib/fit.js');
const args = process.argv.slice(2), quiet = args.includes('--quiet'), only = args.indexOf('--setting'), kinds = args.filter(a => a in CAST);
let bad = 0;
const report = (name, ok, note = '') => {
  const known = !ok && Object.keys(KNOWN).find(w => name.startsWith(w + ':'));
  console.log((ok ? 'ok   ' : known ? 'KNOWN ' : 'FAIL ') + name + (note ? '  ' + note : '') + (known ? `  (${KNOWN[known]})` : '')); if (!ok && !known) bad++; };
const { printed } = await import('./print/toy.mjs');
const volume = t => { let s = 0; for (let i = 0; i < t.length; i += 9) s += t[i] * (t[i + 4] * t[i + 8] - t[i + 5] * t[i + 7]) - t[i + 1] * (t[i + 3] * t[i + 8] - t[i + 5] * t[i + 6]) + t[i + 2] * (t[i + 3] * t[i + 7] - t[i + 4] * t[i + 6]); return s / 6; };
// is point p inside the closed soup t (a ray's crossings, counted)
function inside(p, t) {
  const d = [.5773, .5774, .5775]; let n = 0;
  for (let i = 0; i < t.length; i += 9) {
    const a = [t[i], t[i + 1], t[i + 2]], e1 = [t[i + 3] - a[0], t[i + 4] - a[1], t[i + 5] - a[2]], e2 = [t[i + 6] - a[0], t[i + 7] - a[1], t[i + 8] - a[2]];
    const pv = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]], det = e1[0] * pv[0] + e1[1] * pv[1] + e1[2] * pv[2];
    if (Math.abs(det) < 1e-14) continue;
    const s = [p[0] - a[0], p[1] - a[1], p[2] - a[2]], u = (s[0] * pv[0] + s[1] * pv[1] + s[2] * pv[2]) / det; if (u < 0 || u > 1) continue;
    const q = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]], w = (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) / det;
    if (w < 0 || u + w > 1) continue; if ((e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) / det > 0) n++;
  }
  return n % 2 === 1;
}
const solidAt = (ps, part, p) => ps.some(q => q.piece === part && inside(p, q.tris));
// the radius of the hole about a peg's axis in a part, at a fraction f of the way from a to b: the first
// radius (mm, 0.01 steps) where the part is solid, looking out in 8 directions; null when solid at the axis
function hole(ps, part, a, b, f, k) {
  const u = b.map((x, c) => x - a[c]), l = Math.hypot(...u), ax = u.map(x => x / l), h = Math.abs(ax[1]) < .9 ? [0, 1, 0] : [1, 0, 0];
  const x1 = [ax[1] * h[2] - ax[2] * h[1], ax[2] * h[0] - ax[0] * h[2], ax[0] * h[1] - ax[1] * h[0]], n1 = Math.hypot(...x1), X = x1.map(x => x / n1);
  const Y = [ax[1] * X[2] - ax[2] * X[1], ax[2] * X[0] - ax[0] * X[2], ax[0] * X[1] - ax[1] * X[0]], o = a.map((x, c) => x + u[c] * f);
  let least = Infinity;
  for (let i = 0; i < 8; i++) {
    const q = (i + .5) / 8 * 2 * Math.PI, dir = [0, 1, 2].map(c => Math.cos(q) * X[c] + Math.sin(q) * Y[c]);
    for (let r = 0; r <= 4; r += .01) { if (solidAt(ps, part, o.map((x, c) => x + dir[c] * r / k))) { least = Math.min(least, r); break; } }
  }
  return least === Infinity ? null : +least.toFixed(2);
}
const settings = only >= 0 ? [args[only + 1]] : Object.keys(DISGUISES);
// known, each with its ticket: reported, not counted (remove the line with the fix)
const KNOWN = { 'Bob, wartime': 'r647: the roll-neck ring is drawn from an open profile (lib/cast.js), two discs over its bore' };
for (const d of settings) for (const kind of kinds.length ? kinds : Object.keys(DISGUISES[d])) {
  const fig = person(kind, { disguise: d }), { raw, k, ps, log, ms } = printed(fig), who = `${CAST[kind].name}, ${d}`;
  const parts = [...new Set(ps.map(p => p.body))], open = ps.filter(p => check(p, k).open), neg = ps.filter(p => volume(p.tris) <= 0);
  report(`${who}: ${parts.length} bodies, every piece closed, faces out (cut in ${ms} ms)`, !open.length && !neg.length && parts.includes('body') && parts.includes('head'),
    [open.length && `open: ${open.map(p => `${p.body}/${p.name} ${check(p, k).open}`).join(', ')}`, neg.length && `inside out: ${neg.map(p => p.name).join(', ')}`].filter(Boolean).join('; ') || parts.join(', '));
  report(`${who}: no drawn hole is printed`, !ps.some(p => p.hole));
  const J = name => fig.userData.joints.find(j => j.name === name), mid = kd => (JOINT[kd][0] + JOINT[kd][1]) / 2;
  for (const [jn, part] of [['neck', 'head'], ['arm right', 'arm right'], ['arm left', 'arm left'], ['hat', 'hat']]) {
    const j = J(jn), pin = raw.find(p => p.pin && p.piece === part); if (!j || !pin) continue;
    // measured 1 mm short of the peg's end inside the female (the end the uncut female holds), and DEPTH past that end
    const whole = raw.filter(p => p.piece === j.female && !p.hole), [a, b] = [pin.pin.a, pin.pin.b], inA = whole.some(p => inside(a, p.tris));
    const [end, from] = inA ? [a, b] : [b, a], l = Math.hypot(...end.map((x, c) => x - from[c])) * k;
    const want = pin.pin.r * k + mid(j.kind), got = hole(ps, j.female, from, end, 1 - 1 / l, k), deep = hole(ps, j.female, from, end, 1 + (DEPTH - .1) / l, k);
    report(`${who}: ${jn}: the hole in ${j.female} is ${want.toFixed(2)} mm about the ${(2 * pin.pin.r * k).toFixed(1)} mm peg, ${DEPTH} mm past its end`,
      got != null && Math.abs(got - want) <= .06 && deep != null && deep > pin.pin.r * k, `measured ${got} mm, ${deep} mm ${DEPTH - .1} mm past the end`);
  }
  if (ps.some(p => p.body === 'hat')) {
    const a = raw.filter(p => p.piece === 'hat' && !p.pin), b = ps.filter(p => p.piece === 'hat' && !p.pin), va = a.reduce((s, p) => s + volume(repair([p], k).ps[0].tris), 0) * k ** 3, vb = b.reduce((s, p) => s + volume(p.tris), 0) * k ** 3;
    report(`${who}: the hat is hollowed by the head`, vb < va - 1, `${va.toFixed(0)} -> ${vb.toFixed(0)} mm³`);
  }
  if (!quiet) for (const l of log) console.log('       ' + l);
}
console.log(bad ? `${bad} FAILED` : 'all ok');
process.exit(bad ? 1 : 0);
