// What lab/print/ does with a toy (lib/cast.js), for the node tests: its pieces, sized, each part repaired as
// its own body, then cut (r501), with its turning pegs keyed (r395). Units are the toy's; k is mm a unit.
const { pieces, fit, repair, cut } = await import('../../ficelle/lib/print.js');
const { JOINT, DEPTH, CLEAR } = await import('../../ficelle/lib/fit.js');
export function printed(fig, h = 60, { swing } = {}) {
  const raw = pieces(fig), k = fit(raw, { h }), joints = fig.userData.joints;
  const ps = [...new Set(raw.map(p => p.body))].flatMap(n => repair(raw.filter(p => p.body === n && !p.hole), k).ps.map(p => ({ ...p, body: n, piece: p.piece ?? n })));
  const j = (m, f) => joints.find(x => x.male === m && x.female === f);
  const t = Date.now(), r = cut(ps, raw, k, { play: (m, f) => { const x = j(m, f); return x ? +((JOINT[x.kind][0] + JOINT[x.kind][1]) / 2).toFixed(3) : null; },
    bore: (m, f) => j(m, f)?.bore != null, depth: DEPTH, clear: CLEAR, swing });
  return { raw, k, ps: r.ps, log: r.log, ms: Date.now() - t };
}
