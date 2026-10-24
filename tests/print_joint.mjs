// r395: a cast figure's arms turn through their range and stop at both ends, as exported. Each figure (lib/cast.js)
// is read, sized to 60 mm, repaired and cut as lab/print/ does (tests/print/toy.mjs); each arm, as printed (its
// peg's KEY included), is turned about its peg's axis against the body as printed (the socket and its groove cut):
//   play    at every 5 degrees of its range the arm stays JOINT.turn[0] mm clear of the body (nothing rubs), and at
//           each end of the range it comes within JOINT.turn[1] mm of it (the groove's end is the stop, not far off)
//   stop    past either end it meets the body within STOP degrees (the key on the groove's end)
//   range   a per-asset range (print-assets.js swing: { 'arm right': [-30, 0] }) moves the stop; null leaves a plain
//           peg that nothing stops (so the stops above are the key's)
// Units in the report are mm and degrees.
//     node tests/print_joint.mjs [kind ...] [--setting today]
import { register } from 'node:module';
register('../ficelle/tools/three_hooks.mjs', import.meta.url);
const { person, CAST } = await import('../ficelle/lib/cast.js');
const { solid, touch, check } = await import('../ficelle/lib/print.js');
const { JOINT } = await import('../ficelle/lib/fit.js');
const { printed } = await import('./print/toy.mjs');
const args = process.argv.slice(2), set = args.indexOf('--setting'), setting = set >= 0 ? args[set + 1] : 'today', kinds = args.filter(a => a in CAST);
const STOP = 10;
let bad = 0;
const report = (name, ok, note = '') => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (note ? '  ' + note : '')); if (!ok) bad++; };
// the pieces ps turned by deg degrees about the line through o along unit x (right-handed, as three.js rotation.x)
function turned(ps, o, x, deg) {
  const q = deg * Math.PI / 180, c = Math.cos(q), s = Math.sin(q);
  return ps.map(p => {
    const t = new Float32Array(p.tris.length);
    for (let i = 0; i < t.length; i += 3) {
      const v = [p.tris[i] - o[0], p.tris[i + 1] - o[1], p.tris[i + 2] - o[2]], d = v[0] * x[0] + v[1] * x[1] + v[2] * x[2];
      const w = [x[1] * v[2] - x[2] * v[1], x[2] * v[0] - x[0] * v[2], x[0] * v[1] - x[1] * v[0]];
      for (let j = 0; j < 3; j++) t[i + j] = o[j] + v[j] * c + w[j] * s + x[j] * d * (1 - c);
    }
    return solid({ tris: t });
  });
}
const meets = (arm, body, g) => arm.some(a => body.some(b => touch(a, b, g)));
function joint(fig, who, opts = {}) {
  const { raw, k, ps, log } = printed(fig, 60, opts), body = ps.filter(p => p.piece === 'body').map(solid), [lo, hi] = JOINT.turn;
  for (const pin of raw.filter(p => p.pin?.swing)) {
    const part = pin.piece, range = opts.swing && part in opts.swing ? opts.swing[part] : pin.pin.swing, arm = ps.filter(p => p.piece === part);
    const key = arm.find(p => p.key), at = deg => turned(arm, pin.pin.a, pin.pin.x, deg);
    if (!range) {   // a range of null: a plain peg, no key, no groove, so nothing stops it (the stops below are the key's)
      const free = [5, 10, 15].filter(d => !meets(at(d), body, 0) && !meets(at(-60 - d), body, 0));
      report(`${who}: ${part}: no range, no key: it turns past both ends freely`, !key && free.length === 3, key ? 'keyed' : `free ${free.join(', ')} degrees past 0 and -60`); continue;
    }
    report(`${who}: ${part}: its peg carries a closed key`, !!key && !check(key, k).open, log.find(l => l.startsWith(part + ' turns')) ?? 'no key');
    if (!key) continue;
    const inside = []; for (let a = range[0]; a <= range[1] + 1e-9; a += 5) if (meets(at(a), body, lo / k)) inside.push(a);
    report(`${who}: ${part}: ${lo} mm clear of the body at every 5 degrees from ${range[0]} to ${range[1]}`, !inside.length, inside.length ? `rubs at ${inside.join(', ')} degrees` : '');
    const ends = range.map(a => meets(at(a), body, hi / k));
    report(`${who}: ${part}: within ${hi} mm of its stop at both ends`, ends.every(Boolean), ends.map((e, i) => `${range[i]}: ${e ? 'yes' : 'no'}`).join(', '));
    const past = [-1, 1].map(sd => { const from = sd < 0 ? range[0] : range[1]; for (let d = .5; d <= 15; d += .5) if (meets(at(from + sd * d), body, 0)) return d; return null; });
    report(`${who}: ${part}: stops within ${STOP} degrees past ${range[0]} and past ${range[1]}`, past.every(d => d != null && d <= STOP), past.map((d, i) => `${d ?? '>15'} past ${range[i]}`).join(', '));
  }
}
for (const kind of kinds.length ? kinds : ['a', 'b']) joint(person(kind, { disguise: setting }), `${CAST[kind].name}, ${setting}`);
joint(person('a', { disguise: setting }), `${CAST.a.name}, ${setting}, range from print-assets`, { swing: { 'arm right': [-30, 0], 'arm left': null } });
console.log(bad ? `${bad} FAILED` : 'all ok');
