// r395: writes a cast figure's shoulder as printed, for tools/print_joint_render.py to draw: the body (its socket and
// groove cut), the right arm with its peg's key at each end of its range (rest, turned) and pulled 8 mm off its peg. One
// frame for all files (mm, Z up), so they line up in Blender. Also axis.json: the peg's axis, for the camera.
//     node tools/print_joint_shot.mjs [kind] [out dir, default out/print_joint]
import { register } from 'node:module';
register('./print_probe/hooks.mjs', import.meta.url);
const fs = await import('node:fs');
const { person } = await import('../lib/cast.js');
const { printed } = await import('../tests/print/toy.mjs');
const kind = process.argv[2] ?? 'a', out = process.argv[3] ?? new URL('../out/print_joint/', import.meta.url).pathname;
fs.mkdirSync(out, { recursive: true });
const { raw, k, ps } = printed(person(kind), 60), pin = raw.find(p => p.pin?.swing && p.piece === 'arm right');
const zup = v => [v[0] * k, -v[2] * k, v[1] * k];   // three.js Y up to Z up, as lib/print.js stl()
function write(name, list, f = v => v) {
  const n = list.reduce((s, p) => s + p.tris.length / 9, 0), b = Buffer.alloc(84 + 50 * n); b.writeUInt32LE(n, 80); let o = 84;
  for (const p of list) for (let i = 0; i < p.tris.length; i += 9, o += 50) for (let j = 0; j < 3; j++) zup(f([p.tris[i + 3 * j], p.tris[i + 3 * j + 1], p.tris[i + 3 * j + 2]])).forEach((x, c) => b.writeFloatLE(x, o + 12 + 12 * j + 4 * c));
  fs.writeFileSync(out + name + '.stl', b);
}
const turn = deg => v => {   // about the peg's axis, right-handed on the part's x as three.js rotation.x
  const q = deg * Math.PI / 180, c = Math.cos(q), s = Math.sin(q), o = pin.pin.a, x = pin.pin.x, w = v.map((t, i) => t - o[i]), d = w[0] * x[0] + w[1] * x[1] + w[2] * x[2];
  const cr = [x[1] * w[2] - x[2] * w[1], x[2] * w[0] - x[0] * w[2], x[0] * w[1] - x[1] * w[0]];
  return o.map((t, i) => t + w[i] * c + cr[i] * s + x[i] * d * (1 - c));
};
const arm = ps.filter(p => p.piece === 'arm right' && !p.key), key = ps.filter(p => p.piece === 'arm right' && p.key);
write('body', ps.filter(p => p.piece === 'body'));
write('head', ps.filter(p => p.piece === 'head'));
// the inner end is the one inside the body; off pulls the arm 8 mm the other way, out of its socket
const [a0, a1] = pin.pin.swing, [inn, outer] = Math.abs(pin.pin.a[0]) < Math.abs(pin.pin.b[0]) ? [pin.pin.a, pin.pin.b] : [pin.pin.b, pin.pin.a];
const L = Math.hypot(...outer.map((x, c) => x - inn[c])), off = v => v.map((t, i) => t + (outer[i] - inn[i]) / L * 8 / k);
for (const [n, f] of [['rest', turn(a1)], ['turned', turn(a0)], ['off', off]]) { write(`arm-${n}`, arm, f); write(`key-${n}`, key, f); }
fs.writeFileSync(out + 'axis.json', JSON.stringify({ a: zup(pin.pin.a), b: zup(pin.pin.b), swing: pin.pin.swing, k }));
console.log(`wrote ${out}: body, head, arm and key at ${a1} (rest), at ${a0} (turned), 8 mm off`);
