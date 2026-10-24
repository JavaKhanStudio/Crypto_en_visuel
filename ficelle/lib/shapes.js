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

// r218: the moves Shadow's ItemView gives these parts (/home/simon/Shadow/scripts/items/ItemView.gd:1170-1209,
// its numbers as they are), as a pure function of time t in seconds, so a shot at a given t is the same
// every time:  animate(rack, clock.elapsedTime) each frame. Fans turn about their own y (rack 300°/s,
// tower 320°/s); emission_amount is three's emissiveIntensity, as in material() above.
const DEG = Math.PI / 180, clamp01 = x => Math.min(1, Math.max(0, x));
function glow(o, v) { if (o?.material) o.material.emissiveIntensity = v; }
function spin(o, t, degPerSec) {
  if (!o) return;
  o.userData.y0 ??= o.rotation.y;
  o.rotation.y = o.userData.y0 + t * degPerSec * DEG;
}
export function animate(shape, t) {
  const item = shape.name, find = n => shape.getObjectByName(n);
  if (item === 'server_rack') {
    spin(find('Fan'), t, 300);
    (find('RackStatus')?.children ?? []).forEach((c, i) => glow(c, 1.5 + 0.5 * Math.sin(t * 2.0 + i * 0.7)));
    (find('RackActivity')?.children ?? []).forEach((c, i) => {
      const rf = Math.sin(t * 13.0 + i * 2.1) + Math.sin(t * 7.3 + i * 1.1);
      glow(c, 0.25 + 2.0 * clamp01((rf + 1.2) / 3.2));
    });
  } else if (item === 'tower') {
    spin(find('Fan'), t, 320);
    const n = Math.sin(t * 37.0) + Math.sin(t * 53.0) + Math.sin(t * 19.0);
    glow(find('ActivityLED'), 0.4 + 2.4 * clamp01((n + 1.6) / 4.6));
    glow(find('PowerLED'), 1.9 + 0.5 * Math.sin(t * 2.0));
  } else if (item === 'laptop') {
    glow(find('Screen'), 1.2 + 0.45 * Math.sin(t * 3.2));   // ItemView's base for the default style (no iris blades)
  }
}
