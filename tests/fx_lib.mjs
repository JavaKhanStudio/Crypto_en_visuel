// r318: lib/fx.js replaced 17 <ep>/js/fx.js in 3 drifted versions (the saga's burst({ glow }), the
// enigma family's fireworks(..., spread), and the plain one). Every call the episodes make must draw
// exactly what their old copy drew: same Math.random sequence, same particles frame by frame, same
// blending, size and opacity. The old copies are read from 9dcc55a, the last commit that had them.
//     node tests/fx_lib.mjs
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const root = new URL('..', import.meta.url).pathname;
const three = pathToFileURL(root + 'vendor/three/three.module.min.js').href;
const THREE = await import(three);
// a module from source, with its bare 'three' pointed at vendor/ (the episodes' importmap)
const load = src => import('data:text/javascript,' + encodeURIComponent(src.replaceAll("from 'three'", `from '${three}'`)));
const OLD = '9dcc55a';
const old = ep => execSync(`git show ${OLD}:${ep}/js/fx.js`, { cwd: root }).toString();
const lib = readFileSync(root + 'lib/fx.js', 'utf8');

// seeded Math.random and an immediate setTimeout, so both copies see the same draws in the same order
let seed;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
// run a call against a fresh module, return what it put in the scene over 12 frames
async function trace(src, call) {
  const fx = await load(src + `\n//${Math.random()}`);   // a fresh module each time: its `live` list starts empty
  const objs = [], log = [];
  fx.initFx({ add: o => objs.push(o), remove: () => {} });
  const R = Math.random, T = globalThis.setTimeout;
  seed = 42; Math.random = rand; globalThis.setTimeout = f => f();
  try { call(fx, THREE); } finally { Math.random = R; globalThis.setTimeout = T; }
  for (let f = 0; f < 12; f++) {
    fx.updateFx(1 / 30);
    for (const o of objs) log.push([o.material.blending, o.material.size, o.material.opacity.toFixed(6),
      Array.from(o.geometry.attributes.position.array, v => v.toFixed(5)).join(',')].join('|'));
  }
  return { n: objs.length, sig: log.join('\n') };
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const COLS = [0xffd66b, 0xff8a5c, 0x5fd1ff, 0x9be37a];
// [episode whose old copy is the reference, label, the call as the episodes make it]
const CASES = [
  ['deux-generaux', 'saga fireworks n=3', fx => fx.fireworks(V(0, 0, 0), COLS, 3)],
  ['deux-generaux', 'saga fireworks n=16', fx => fx.fireworks(V(0, 0, 0), COLS, 16)],
  ['deux-generaux', 'saga burst', fx => fx.burst(V(1, 2, 3), 0xffd27a)],
  ['deux-generaux', 'saga dust burst glow:false', fx => fx.burst(V(1, 2, 3), 0x8a7a5a, { count: 140, speed: 6, up: 3, size: 2.2, life: 2.2, gravity: 2, glow: false })],
  ['enigma', 'enigma fireworks spread 16', fx => fx.fireworks(V(70, 6, -12), COLS, 8, 16)],
  ['enigma', 'enigma fireworks spread 120', fx => fx.fireworks(V(0, 40, -30), COLS, 14, 120)],
  ['enigma', 'enigma burst', fx => fx.burst(V(1, 2, 3), 0xffd66b, { count: 30, speed: 5 })],
  ['scytale', 'plain fireworks n=8', fx => fx.fireworks(V(30, -4, -2), COLS, 8)],
  ['scytale', 'plain fireworks n=14', fx => fx.fireworks(V(0, -6, -4), COLS, 14)],
  ['scytale', 'plain burst', fx => fx.burst(V(1, 2, 3), 0xff4444, { count: 40, life: 1 })],
];
let bad = 0;
for (const [ep, name, call] of CASES) {
  const a = await trace(old(ep), call), b = await trace(lib, call);
  const ok = a.n > 0 && a.n === b.n && a.sig === b.sig;
  ok || bad++;
  console.log(ok ? 'ok  ' : 'FAIL', name, `(${ep} copy: ${a.n} objects, lib: ${b.n})`);
}
// the rest of the file (ring, icon, arc, initFx, updateFx) is the same text in all three versions
const body = s => s.replace(/^[\s\S]*?\nimport/, 'import').replace(/\/\/ Fireworks[\s\S]*?\n}\n/, '').replace(/export function burst[\s\S]*?\n}\n/, '');
for (const ep of ['deux-generaux', 'enigma', 'scytale']) {
  const ok = body(old(ep)) === body(lib); ok || bad++;
  console.log(ok ? 'ok  ' : 'FAIL', `ring, icon, arc, initFx, updateFx as in ${ep}'s copy`);
}
// a test that bites: the enigma call drawn by the saga copy (no spread) must differ
const x = await trace(old('deux-generaux'), CASES[4][2]), y = await trace(lib, CASES[4][2]);
const bites = x.sig !== y.sig; bites || bad++;
console.log(bites ? 'ok  ' : 'FAIL', 'the test tells the saga show from the spread show');
console.log(bad ? `${bad} FAIL` : 'all ok');
process.exit(bad ? 1 : 0);
