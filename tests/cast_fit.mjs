// r330: every figure of lib/cast.js, in every setting, goes together and prints (lib/fit.js at 60 mm, the
// figures' board-game size of r196 (the guard's in garde/js/print-assets.js):
// no two parts in the same space, every ring, head and hat comes down onto the pin unhindered, no part
// in loose pieces, nothing under 1 mm; round 6: every joint one straight peg in one hole with the play of
// lib/fit.js's JOINT table (no snap, no hub), each arm swings its whole
// range without meeting anything; round 5: with no slot in the robe, 0 to 60 degrees forward, the robe
// included; the left arm straight too), and a known clip and a known swing are found.
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
  // round 6: one peg in one hole per joint, the neck, the hat and both arms at least, the arms turning
  const want = ['neck', 'hat', 'arm right', 'arm left'], names = r.joints.map(j => j.name);
  if (!want.every(w => names.includes(w)) || r.joints.filter(j => j.kind === 'turn' && j.male.startsWith('arm')).length !== 2) {
    r.ok = false; console.log('       joints: only ' + names.join(', ') + ' (wants the neck, the hat and both arms turning)'); }
  r.ok || bad++;
  console.log(r.ok ? 'ok  ' : 'FAIL', `${CAST[kind].name}, ${d}`, `(${r.parts.map(p => p.name).join(', ')}; ${Date.now() - t} ms)`);
  if (!r.ok || !quiet) for (const l of describe(r)) if (l !== 'ok') console.log('       ' + l);
}
// round 5: both arms are kept, so the left one straight too (the right one holds the item, through a bent fist)
if (only < 0) for (const kind of kinds.length ? kinds : Object.keys(DISGUISES.today)) {
  const r = check(person(kind, { arms: ['bent', 'straight'] }), { h: mm }); r.ok || bad++;
  console.log(r.ok ? 'ok  ' : 'FAIL', `${CAST[kind].name}, today, left arm straight`);
  if (!r.ok) for (const l of describe(r)) console.log('       ' + l);
}
// and the check sees a clip when there is one: round 2's straight arm, its scytale through the fist
if (!kinds.length && only < 0) {
  const r = check(person('a', { disguise: 'roman', arms: 'straight' }), { h: mm }), seen = r.clips.some(c => [c.a, c.b].includes('hand') && [c.a, c.b].includes('arm right'));
  seen || bad++; console.log(seen ? 'ok  ' : 'FAIL', 'the straight arm\'s scytale is seen cutting into the fist');
}
// and a swing too far is seen: arms raised right over the head (180 degrees) meet Alice's scarf ring
if (!kinds.length && only < 0) {
  const f = person('a', { disguise: 'wartime' }); f.userData.pieces.arms.forEach(a => a.userData.swing = [-180, 0]);
  const r = check(f, { h: mm }), seen = r.swings.some(s => s.into === 'ring scarf');
  seen || bad++; console.log(seen ? 'ok  ' : 'FAIL', 'arms raised over the head are seen meeting Alice\'s scarf ring');
}
console.log(bad ? `${bad} figure(s) do not fit` : 'all ok');
process.exit(bad ? 1 : 0);
