// r207: lib/shapes.js rebuilds each Shadow item exported by tools/godot_bridge/export.gd with the
// right parts: as many meshes as Godot built (counted by the r197 probe: 103 for the rack), the
// names Shadow animates, every triangle facing out (counter-clockwise, as three draws it), and the
// item standing on the floor at the size Godot gave it.
//     node tests/shapes_roundtrip.mjs
import { readFileSync } from 'node:fs';
import * as THREE from '../vendor/three/three.module.min.js';
import { buildShape, countParts } from '../lib/shapes.js';
let bad = 0;
const check = (name, ok, got) => { ok || bad++; console.log(ok ? 'ok  ' : 'FAIL', name, got ?? ''); };
const WANT = {
  server_rack: { parts: 103, names: ['Fan', 'RackStatus', 'RackActivity'], h: 1.534 },
  tower: { parts: 26, names: ['PowerLED'], h: 1.007 },
  laptop: { parts: 6, names: ['Screen'], h: 0.449 },
};
for (const [item, w] of Object.entries(WANT)) {
  const doc = JSON.parse(readFileSync(new URL(`../assets/shapes/${item}.json`, import.meta.url)));
  const g = buildShape(doc);
  check(`${item}: ${w.parts} parts`, countParts(g) === w.parts && doc.parts === w.parts, countParts(g));
  for (const n of w.names) check(`${item}: ${n} is there`, !!g.getObjectByName(n));
  g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3());
  check(`${item}: stands on the floor, ${w.h} m tall`, Math.abs(box.min.y) < .002 && Math.abs(box.max.y - w.h) < .002,
    `y ${box.min.y.toFixed(3)}..${box.max.y.toFixed(3)}`);
  // every non-box triangle faces away from its mesh's centre (a closed convex part: the cylinders)
  let inward = 0, tris = 0;
  g.traverse(o => {
    if (!o.isMesh || o.geometry.type === 'BoxGeometry') return;
    const p = o.geometry.attributes.position, ix = o.geometry.index.array, c = new THREE.Vector3();
    o.geometry.computeBoundingBox(); o.geometry.boundingBox.getCenter(c);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < ix.length; i += 3) {
      a.fromBufferAttribute(p, ix[i]); b.fromBufferAttribute(p, ix[i + 1]); d.fromBufferAttribute(p, ix[i + 2]);
      n.crossVectors(b.clone().sub(a), d.clone().sub(a));
      if (n.lengthSq() < 1e-14) continue;
      tris++; if (n.dot(a.clone().add(b).add(d).divideScalar(3).sub(c)) < 0) inward++;
    }
  });
  check(`${item}: ${tris} mesh triangles face out`, inward === 0, inward ? `${inward} inward` : '');
}
console.log(bad ? `${bad} failed` : 'all ok'); process.exit(bad ? 1 : 0);
