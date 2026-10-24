// r196 probe: can a scene of Crypto en visuel be printed? Builds the cast (scytale/js/props.js person)
// and a 1.1 castle in node, writes every mesh as its own binary STL at a print scale, and reports per
// part: size in mm, thinnest dimension, and whether the mesh is closed (every edge shared by exactly
// two faces; an open mesh cannot be sliced as a solid).
// node tools/print_probe/export.mjs [mm per unit, default 20] -> out/print_probe/<model>/<nn>-<name>.stl + report.json
import { register } from 'node:module';
register('../../ficelle/tools/three_hooks.mjs', import.meta.url);
const fs = await import('node:fs');
globalThis.document ??= { createElement: () => ({ getContext: () => null, style: {} }) };
const THREE = await import('three');
const { person } = await import('../../scytale/js/props.js');
const castles = await import('../../ficelle/lib/saga/castles.js').catch(e => ({ err: e.message }));

const MM = +(process.argv[2] ?? 20), out = new URL('../../out/print_probe/', import.meta.url).pathname;
function stl(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, n = p.count / 3;
  const b = Buffer.alloc(84 + 50 * n); b.writeUInt32LE(n, 80);
  const v = [0, 1, 2].map(() => new THREE.Vector3()), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  for (let t = 0; t < n; t++) {
    v.forEach((x, k) => x.fromBufferAttribute(p, 3 * t + k));
    const nn = e1.subVectors(v[1], v[0]).cross(e2.subVectors(v[2], v[0])).normalize(), o = 84 + 50 * t;
    [nn, ...v].forEach((x, k) => { b.writeFloatLE(x.x, o + 12 * k); b.writeFloatLE(x.z, o + 12 * k + 4); b.writeFloatLE(x.y, o + 12 * k + 8); });
  }
  return b;
}
function closed(geo) {      // welded edge count: a closed solid has every edge on exactly 2 triangles
  const p = geo.attributes.position, key = i => [p.getX(i), p.getY(i), p.getZ(i)].map(x => Math.round(x * 1e4)).join(',');
  const g = geo.index ? geo : null, idx = g ? g.index.array : [...Array(p.count).keys()], edges = new Map();
  for (let t = 0; t < idx.length; t += 3) for (let k = 0; k < 3; k++) {
    const a = key(idx[t + k]), c = key(idx[t + (k + 1) % 3]); if (a === c) continue;
    const e = a < c ? a + '|' + c : c + '|' + a; edges.set(e, (edges.get(e) ?? 0) + 1);
  }
  let open = 0; for (const n of edges.values()) if (n !== 2) open++;
  return open;
}
function dump(name, root) {
  root.updateMatrixWorld(true); const dir = out + name + '/'; fs.mkdirSync(dir, { recursive: true });
  const parts = []; let i = 0;
  root.traverse(m => {
    if (!m.isMesh) return;
    const geo = m.geometry.clone().applyMatrix4(m.matrixWorld).scale(MM, MM, MM); geo.computeBoundingBox();
    const s = geo.boundingBox.getSize(new THREE.Vector3()), file = `${String(i++).padStart(2, '0')}-${m.geometry.type.replace('Geometry', '')}.stl`;
    fs.writeFileSync(dir + file, stl(geo));
    parts.push({ file, type: m.geometry.type, mm: [s.x, s.y, s.z].map(x => +x.toFixed(1)), thinnest: +Math.min(s.x, s.y, s.z).toFixed(2), openEdges: closed(geo),
      params: m.geometry.parameters ? Object.fromEntries(Object.entries(m.geometry.parameters).filter(([, v]) => typeof v !== 'object')) : null });
  });
  const box = new THREE.Box3().setFromObject(root), s = box.getSize(new THREE.Vector3()).multiplyScalar(MM);
  return { name, parts: parts.length, mm: [s.x, s.y, s.z].map(x => +x.toFixed(0)), open: parts.filter(p => p.openEdges).length,
    under1mm: parts.filter(p => p.thinnest < 1).length, list: parts };
}
const report = { mmPerUnit: MM, models: [] };
for (const k of ['a', 'b', 'e', 'n']) report.models.push(dump('person-' + k, person(k)));
if (castles.buildHumanCastle) { try { report.models.push(dump('castle-human', castles.buildHumanCastle(0x4da3ff, 1))); } catch (e) { report.castleErr = e.message; } }
else report.castleErr = castles.err;
fs.writeFileSync(out + 'report.json', JSON.stringify(report, null, 1));
for (const m of report.models) console.log(`${m.name}: ${m.parts} parts, ${m.mm.join(' x ')} mm, ${m.open} open meshes, ${m.under1mm} thinner than 1 mm`);
if (report.castleErr) console.log('castle:', report.castleErr);
