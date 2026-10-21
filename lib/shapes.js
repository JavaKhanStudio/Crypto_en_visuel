// r207: Shadow's code-built items (server_rack, tower, laptop…) in three.js. tools/godot_bridge/export.gd
// builds them in Godot and writes assets/shapes/<item>.json; this rebuilds a Group from it, part for
// part. Any episode can load one:
//     import { loadShape } from '../lib/shapes.js';
//     const rack = await loadShape('../assets/shapes/server_rack.json');   // a THREE.Group, 1 unit = 1 m
//     rack.getObjectByName('Fan')   // the parts Shadow animates keep their Godot names
// Shadow's retro shader becomes a MeshStandardMaterial: tint → color, emission colour and amount →
// emissive and emissiveIntensity, glossiness g → roughness 1 - 0.6 g (the shader's own mix(1, .4, g)).
// The import is the file the episodes' importmap maps 'three' to, so a page gets one three.js, and
// node can load this file too (tests/shapes_roundtrip.mjs).
import * as THREE from '../vendor/three/three.module.min.js';

const geoms = new Map();   // one geometry per box size, shared by every part of that size

function geometry(m) {
  if (m.kind === 'box') {
    const k = m.size.join(',');
    if (!geoms.has(k)) geoms.set(k, new THREE.BoxGeometry(...m.size));
    return geoms.get(k);
  }
  // every other mesh came as Godot's own vertex arrays (already wound counter-clockwise)
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(m.pos, 3));
  if (m.nor) g.setAttribute('normal', new THREE.Float32BufferAttribute(m.nor, 3)); else g.computeVertexNormals();
  if (m.col) g.setAttribute('color', new THREE.Float32BufferAttribute(m.col, 3));
  g.setIndex(m.idx);
  return g;
}

function material(s = {}) {
  const gloss = s.glossiness ?? 0.35, vcol = (s.use_vcol ?? 0) > 0.5;
  return new THREE.MeshStandardMaterial({
    color: vcol ? 0xffffff : new THREE.Color().setRGB(...(s.tint ?? [0.7, 0.7, 0.75]), THREE.LinearSRGBColorSpace),
    vertexColors: vcol,
    emissive: new THREE.Color().setRGB(...(s.emission_color ?? [0, 0, 0]), THREE.LinearSRGBColorSpace),
    emissiveIntensity: s.emission_amount ?? 0,
    roughness: 1 - 0.6 * gloss, metalness: 0, flatShading: false,
  });
}

function node(d) {
  const o = d.mesh ? new THREE.Mesh(geometry(d.mesh), material(d.mat)) : new THREE.Group();
  if (d.name) o.name = d.name;
  if (d.m) { o.matrix.fromArray(d.m); o.matrix.decompose(o.position, o.quaternion, o.scale); }
  for (const c of d.children || []) o.add(node(c));
  return o;
}

// a Group from the JSON's object (assets/shapes/<item>.json, parsed)
export function buildShape(doc) {
  const g = new THREE.Group();
  g.name = doc.item;
  for (const n of doc.nodes) g.add(node(n));
  return g;
}

export async function loadShape(url) {
  return buildShape(await (await fetch(url)).json());
}

export function countParts(obj) {
  let n = 0;
  obj.traverse(o => { if (o.isMesh) n++; });
  return n;
}
