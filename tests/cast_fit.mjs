// r330: every figure of lib/cast.js, in every setting, goes together and prints (lib/fit.js at 60 mm, the
// figures' board-game size of r196 (the guard's in garde/js/print-assets.js):
// no two parts in the same space, every ring, head and hat comes down onto the pin unhindered, no part
// in loose pieces, nothing under 1 mm), and a known clip is found.
//     node tests/cast_fit.mjs [kind ...] [--setting roman] [--mm 60] [--quiet]
import { register } from 'node:module';
register('../tools/print_probe/hooks.mjs', import.meta.url);
const { person, DISGUISES, CAST } = await import('../lib/cast.js');
const { check, describe } = await import('../lib/fit.js');
const args = process.argv.slice(2), quiet = args.includes('--quiet'), only = args.indexOf('--setting');
const mm = args.includes('--mm') ? +args[args.indexOf('--mm') + 1] : 60;
const kinds = args.filter(a => a in CAST);
const settings = only >= 0 ? [args[only + 1]] : Object.keys(DISGUISES);
let bad = 0;
for (const d of settings) for (const kind of kinds.length ? kinds : Object.keys(DISGUISES[d])) {
  const t = Date.now(), r = check(person(kind, { disguise: d }), { h: mm });
  r.ok || bad++;
  console.log(r.ok ? 'ok  ' : 'FAIL', `${CAST[kind].name}, ${d}`, `(${r.parts.map(p => p.name).join(', ')}; ${Date.now() - t} ms)`);
  if (!r.ok || !quiet) for (const l of describe(r)) if (l !== 'ok') console.log('       ' + l);
}
// and the check sees a clip when there is one: round 2's straight arm, its scytale through the fist
if (!kinds.length && only < 0) {
  const r = check(person('a', { disguise: 'roman', pose: 'straight' }), { h: mm }), seen = r.clips.some(c => c.a === 'body' && c.b === 'hand');
  seen || bad++; console.log(seen ? 'ok  ' : 'FAIL', 'the straight arm\'s scytale is seen cutting into the fist');
}
console.log(bad ? `${bad} figure(s) do not fit` : 'all ok');
process.exit(bad ? 1 : 0);
