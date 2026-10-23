// Printing a scene (r196): turns an episode's 3D object into pieces for an FDM printer (0.4 mm
// nozzle, Simon 21 Oct: « standard 3D printer »), at board-game scale (figures about 6 cm, a castle
// about 15 cm). One three.js mesh = one printed piece. Works on plain arrays only (matrixWorld
// .elements, attribute .array), so it reads objects built in another window (the episode's iframe
// in lab/print/) as well as its own. No three.js import.
//   pieces(root)            every visible mesh under root, in root's frame, scene units
//   fit(pieces, size)       mm per unit for { h: 60 } (height), { max: 150 } (longest side) or { mm: 5 }
//   check(piece, k)         what stops it printing as is, at k mm a unit
//   floating(pieces, k)     the pieces that touch nothing: neither the bed nor another piece (r450: its triangles, not its box)
//   repair(pieces, k, o)    the same pieces fixed for printing (capped, thickened, pinned, cut at the ground) and a log
//   stl(pieces, k)          binary STL, Z up, base on the bed, centred
//   zip(files)              a stored (uncompressed) .zip of { name, data: Uint8Array }

export const NOZZLE = .4, THIN = 1, FLAT = .05;   // mm: a wall under THIN is one or two lines; under FLAT it has no thickness

const mul = (e, x, y, z) => [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]];
function mat4(a, b) {   // a * b, column-major like three.js
  const r = new Array(16);
  for (let c = 0; c < 4; c++) for (let rr = 0; rr < 4; rr++) {
    let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + rr] * b[c * 4 + k]; r[c * 4 + rr] = s;
  }
  return r;
}
function invert(m) {   // general 4x4 inverse (three.js Matrix4.invert, on an array)
  const [n11, n21, n31, n41, n12, n22, n32, n42, n13, n23, n33, n43, n14, n24, n34, n44] = m;
  const t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
    t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
    t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
    t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;
  const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14, d = 1 / det;
  return [t11 * d, (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * d,
    (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * d,
    (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * d,
    t12 * d, (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * d,
    (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * d,
    (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * d,
    t13 * d, (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * d,
    (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * d,
    (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * d,
    t14 * d, (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * d,
    (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * d,
    (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * d];
}
const shown = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };

// Every visible mesh under root as triangles in root's frame. An InstancedMesh gives one piece per
// instance (opts.instances: how many, default all). Sprites, points, lines and lights are skipped and
// counted: they have no volume. opts.omit: objects whose subtree is not part of the print (a light
// beam, a glow on the ground), named by the episode's list.
export function pieces(root, { instances = Infinity, omit = [] } = {}) {
  root.updateMatrixWorld(true);
  const toRoot = invert(root.matrixWorld.elements), out = [], skipped = {};
  root.traverse(o => {
    if (!shown(o)) return;
    for (let u = o; u; u = u.parent) if (omit.includes(u)) { skipped.omitted = (skipped.omitted ?? 0) + (o.isMesh ? 1 : 0); return; }
    if (!o.isMesh) { if (o.isSprite || o.isPoints || o.isLine || o.isLight) skipped[o.type] = (skipped[o.type] ?? 0) + 1; return; }
    const g = o.geometry, pos = g.attributes.position, idx = g.index?.array, a = pos.array, st = pos.data ? pos.data.stride : 3, off = pos.offset ?? 0;
    const local = mat4(toRoot, o.matrixWorld.elements), n = o.isInstancedMesh ? Math.min(o.count, instances) : 1;
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    for (let k = 0; k < n; k++) {
      const m = o.isInstancedMesh ? mat4(local, Array.from(o.instanceMatrix.array.slice(16 * k, 16 * k + 16))) : local;
      const nv = idx ? idx.length : pos.count, tris = new Float32Array(nv * 3);
      // a mirroring matrix (negative determinant: scale -1, a flipped castle) turns the faces inside
      // out; three.js flips its front face to draw it, the STL swaps two corners of each triangle
      const det = m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2]);
      for (let i = 0; i < nv; i++) {
        const j = det < 0 && i % 3 ? i + (i % 3 === 1 ? 1 : -1) : i, v = (idx ? idx[j] : j) * (pos.data ? st : 3) + off;
        tris.set(mul(m, a[v], a[v + 1], a[v + 2]), 3 * i);
      }
      let color = mat?.color?.getHex?.() ?? 0xcccccc;
      if (o.isInstancedMesh && o.instanceColor) { const c = o.instanceColor.array; color = (c[3 * k] * 255 << 16) | (c[3 * k + 1] * 255 << 8) | (c[3 * k + 2] * 255); }
      out.push({ name: o.name || g.type.replace('Geometry', '') || 'mesh', type: g.type, color, tris, glow: mat?.type === 'MeshBasicMaterial' });
    }
  });
  out.skipped = skipped;
  return out;
}

export function bounds(ps) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of ps) for (let i = 0; i < p.tris.length; i += 3) for (let c = 0; c < 3; c++) {
    const v = p.tris[i + c]; if (v < lo[c]) lo[c] = v; if (v > hi[c]) hi[c] = v;
  }
  return { lo, hi, size: hi.map((h, c) => h - lo[c]) };
}

// mm per scene unit for a size rule: { h } the height, { max } the longest side, { mm } as given
// (ground: the asset's ground, when it is cut there, so the size is the size printed)
export function fit(ps, size, ground) {
  const { lo, hi } = bounds(ps), s = hi.map((h, c) => h - (c === 1 && ground !== undefined ? Math.max(lo[1], ground) : lo[c]));
  return size.mm ?? (size.h ? size.h / s[1] : size.max / Math.max(...s));
}

// what keeps a piece from printing as is: open edges (not a closed solid), flat (no thickness), thin
export function check(p, k) {
  const b = bounds([p]), mm = b.size.map(x => x * k), keys = new Map(), q = x => Math.round(x * 1e4);
  const t = p.tris, key = i => q(t[i]) + ',' + q(t[i + 1]) + ',' + q(t[i + 2]), edges = new Map();
  for (let i = 0; i < t.length; i += 9) for (let e = 0; e < 3; e++) {
    const a = key(i + 3 * e), c = key(i + 3 * ((e + 1) % 3)); if (a === c) continue;
    const id = a < c ? a + '|' + c : c + '|' + a; edges.set(id, (edges.get(id) ?? 0) + 1);
  }
  let open = 0; for (const n of edges.values()) if (n !== 2) open++;
  const thinnest = Math.min(...mm);
  return { mm: mm.map(x => +x.toFixed(1)), thinnest: +thinnest.toFixed(2), open, flat: thinnest < FLAT, thin: thinnest >= FLAT && thinnest < THIN };
}

// a piece that touches nothing, neither the bed nor another piece, floats in the air once printed (the
// messenger's beacon above his head): it needs a pin or a stand. Two pieces touch (r450) when some
// triangle of one comes within half a nozzle of a triangle of the other, or one lies inside the other.
// Boxes alone are not enough: a hoop's box holds the castle it rings, touching or not. The boxes stay
// the first filter, then each triangle's box, so a 600-piece castle stays a few ms.
export function floating(ps, k) {
  const g = NOZZLE / 2 / k, qs = ps.map(solid), floor = Math.min(...qs.map(q => q.box.lo[1]));
  return qs.map((q, i) => q.box.lo[1] - floor > g && !qs.some((o, j) => j !== i && touch(q, o, g)));
}
// a piece with its box and its triangles' boxes ([lo x y z, hi x y z] per triangle)
function solid(p) {
  const t = p.tris, n = t.length / 9, tb = new Float32Array(6 * n);
  for (let f = 0; f < n; f++) for (let c = 0; c < 3; c++) {
    const a = t[9 * f + c], b = t[9 * f + 3 + c], d = t[9 * f + 6 + c];
    tb[6 * f + c] = Math.min(a, b, d); tb[6 * f + 3 + c] = Math.max(a, b, d);
  }
  return { tris: t, box: bounds([p]), tb };
}
const meets = (a, b, g) => [0, 1, 2].every(c => a.lo[c] - g <= b.hi[c] && b.lo[c] - g <= a.hi[c]);
const holds = (a, b) => [0, 1, 2].every(c => a.lo[c] <= b.lo[c] && b.hi[c] <= a.hi[c]);   // box a holds box b
export function touch(a, b, g) {
  if (!meets(a.box, b.box, g)) return false;
  // only the triangles near the other piece: inside the meeting of the two boxes, grown by g
  const lo = [0, 1, 2].map(c => Math.max(a.box.lo[c], b.box.lo[c]) - g), hi = [0, 1, 2].map(c => Math.min(a.box.hi[c], b.box.hi[c]) + g);
  const near = q => { const out = []; for (let f = 0; f < q.tb.length / 6; f++) if ([0, 1, 2].every(c => q.tb[6 * f + c] <= hi[c] && lo[c] <= q.tb[6 * f + 3 + c])) out.push(f); return out; };
  const fa = near(a), fb = fa.length ? near(b) : [], g2 = g * g, T = (q, f) => q.tris.subarray(9 * f, 9 * f + 9);
  for (const i of fa) for (const j of fb) {
    if (![0, 1, 2].every(c => a.tb[6 * i + c] - g <= b.tb[6 * j + 3 + c] && b.tb[6 * j + c] - g <= a.tb[6 * i + 3 + c])) continue;
    if (triTri2(T(a, i), T(b, j), g2)) return true;
  }
  // no surface near the other's: still one, when one lies wholly inside the other (a pin buried in a wall)
  return (holds(a.box, b.box) && inside(b.tris, a.tris)) || (holds(b.box, a.box) && inside(a.tris, b.tris));
}
// does point p (the first vertex of soup v) lie inside the closed soup t? A ray's crossings, counted
function inside(v, t) {
  const o = [v[0], v[1], v[2]], d = [.5773, .5774, .5775];   // off every axis, so it misses edges
  let n = 0; for (let f = 0; f < t.length; f += 9) { const s = rayTri(o, d, t.subarray(f, f + 9)); if (s > 0) n++; }
  return n % 2 === 1;
}
// Möller-Trumbore: the ray's parameter where it crosses triangle t, or -1
function rayTri(o, d, t) {
  const e1 = [t[3] - t[0], t[4] - t[1], t[5] - t[2]], e2 = [t[6] - t[0], t[7] - t[1], t[8] - t[2]], p = cross(d, e2), det = dot(e1, p);
  if (Math.abs(det) < 1e-12) return -1;
  const s = [o[0] - t[0], o[1] - t[1], o[2] - t[2]], u = dot(s, p) / det; if (u < 0 || u > 1) return -1;
  const q = cross(s, e1), w = dot(d, q) / det; if (w < 0 || u + w > 1) return -1;
  return dot(e2, q) / det;
}
// two triangles within sqrt(g2) of each other: an edge of one within it of the other (the distance
// between two triangles is always reached on an edge of one of them, and is 0 when an edge crosses)
function triTri2(a, b, g2) {
  for (let e = 0; e < 3; e++) {
    const f = (e + 1) % 3;
    if (segTri2([a[3 * e], a[3 * e + 1], a[3 * e + 2]], [a[3 * f], a[3 * f + 1], a[3 * f + 2]], b) <= g2) return true;
    if (segTri2([b[3 * e], b[3 * e + 1], b[3 * e + 2]], [b[3 * f], b[3 * f + 1], b[3 * f + 2]], a) <= g2) return true;
  }
  return false;
}
// squared distance from segment pq to triangle t: 0 when it crosses, else an end to the triangle or
// the segment to one of the triangle's edges
function segTri2(p, q, t) {
  const d = sub(q, p), s = rayTri(p, d, t);
  if (s >= 0 && s <= 1) return 0;
  const A = [t[0], t[1], t[2]], B = [t[3], t[4], t[5]], C = [t[6], t[7], t[8]];
  return Math.min(ptTri2(p, A, B, C), ptTri2(q, A, B, C), segSeg2(p, q, A, B), segSeg2(p, q, B, C), segSeg2(p, q, C, A));
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], d2 = (a, b) => { const v = sub(a, b); return dot(v, v); };
// squared distance from p to triangle abc (Ericson, Real-Time Collision Detection 5.1.5)
function ptTri2(p, a, b, c) {
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a), d1 = dot(ab, ap), e1 = dot(ac, ap);
  if (d1 <= 0 && e1 <= 0) return d2(p, a);
  const bp = sub(p, b), d3 = dot(ab, bp), e3 = dot(ac, bp);
  if (d3 >= 0 && e3 <= d3) return d2(p, b);
  const vc = d1 * e3 - d3 * e1;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return d2(p, [a[0] + v * ab[0], a[1] + v * ab[1], a[2] + v * ab[2]]); }
  const cp = sub(p, c), d6 = dot(ab, cp), e6 = dot(ac, cp);
  if (e6 >= 0 && d6 <= e6) return d2(p, c);
  const vb = d6 * e1 - d1 * e6;
  if (vb <= 0 && e1 >= 0 && e6 <= 0) { const w = e1 / (e1 - e6); return d2(p, [a[0] + w * ac[0], a[1] + w * ac[1], a[2] + w * ac[2]]); }
  const va = d3 * e6 - d6 * e3;
  if (va <= 0 && e3 - d3 >= 0 && d6 - e6 >= 0) { const w = (e3 - d3) / ((e3 - d3) + (d6 - e6)); return d2(p, [b[0] + w * (c[0] - b[0]), b[1] + w * (c[1] - b[1]), b[2] + w * (c[2] - b[2])]); }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den;
  return d2(p, [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w]);
}
// squared distance between segments p1q1 and p2q2 (Ericson 5.1.9)
function segSeg2(p1, q1, p2, q2) {
  const d1 = sub(q1, p1), d2v = sub(q2, p2), r = sub(p1, p2), a = dot(d1, d1), e = dot(d2v, d2v), f = dot(d2v, r), E = 1e-18;
  let s, t;
  if (a <= E && e <= E) return dot(r, r);
  if (a <= E) { s = 0; t = Math.min(Math.max(f / e, 0), 1); }
  else {
    const c = dot(d1, r);
    if (e <= E) { t = 0; s = Math.min(Math.max(-c / a, 0), 1); }
    else {
      const b = dot(d1, d2v), den = a * e - b * b;
      s = den > E ? Math.min(Math.max((b * f - c * e) / den, 0), 1) : 0;
      t = (b * s + f) / e;
      if (t < 0) { t = 0; s = Math.min(Math.max(-c / a, 0), 1); } else if (t > 1) { t = 1; s = Math.min(Math.max((b - c) / a, 0), 1); }
    }
  }
  return d2([p1[0] + d1[0] * s, p1[1] + d1[1] * s, p1[2] + d1[2] * s], [p2[0] + d2v[0] * t, p2[1] + d2v[1] * t, p2[2] + d2v[2] * t]);
}

// ---------- repair (r394): what check() and floating() flag, fixed in the pieces the STL is written from ----------
// repair(ps, k, { ground }) returns { ps, log }: new pieces (the input is untouched) and one line per fix,
// for PRINT.txt. In order:
//   ground   (when given, the asset's y of its ground) a piece wholly under it is dropped, the vertices of
//            one that crosses it are squashed onto it: the asset stands flat on the bed, and a closed piece
//            stays closed (the squashed faces lie flat on the bed)
//   open     its holes are capped (a tube's end, a lathe's top); when capping encloses no volume the piece
//            was a sheet (a flag, a cape): it is thickened to THIN instead, half on each side
//   thin     a piece under THIN on a side is widened to THIN about its centre, along each such side
//   floating a pin (a closed 8-sided post, 3 nozzle lines across, in the piece's colour) runs from its
//            vertex nearest another piece to that piece's vertex (a lantern to the ring it hangs from),
//            or from its lowest vertex straight down to the bed when that is shorter
// Faces are turned outwards (positive volume) after a fix.
const weld = t => {   // a triangle soup as indexed vertices, same position = same vertex
  const q = x => Math.round(x * 1e4), map = new Map(), v = [], f = [];
  for (let i = 0; i < t.length; i += 3) {
    const key = q(t[i]) + ',' + q(t[i + 1]) + ',' + q(t[i + 2]);
    let n = map.get(key); if (n === undefined) { n = v.length / 3; map.set(key, n); v.push(t[i], t[i + 1], t[i + 2]); }
    f.push(n);
  }
  const faces = []; for (let i = 0; i < f.length; i += 3) if (f[i] !== f[i + 1] && f[i + 1] !== f[i + 2] && f[i] !== f[i + 2]) faces.push([f[i], f[i + 1], f[i + 2]]);
  return { v, faces };
};
const soup = (v, faces) => { const t = new Float32Array(faces.length * 9); faces.forEach((f, i) => f.forEach((n, j) => t.set([v[3 * n], v[3 * n + 1], v[3 * n + 2]], 9 * i + 3 * j))); return t; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const at = (v, n) => [v[3 * n], v[3 * n + 1], v[3 * n + 2]];
function volume(t) {
  let s = 0; for (let i = 0; i < t.length; i += 9)
    s += t[i] * (t[i + 4] * t[i + 8] - t[i + 5] * t[i + 7]) - t[i + 1] * (t[i + 3] * t[i + 8] - t[i + 5] * t[i + 6]) + t[i + 2] * (t[i + 3] * t[i + 7] - t[i + 4] * t[i + 6]);
  return s / 6;
}
function area(t) { let s = 0; for (let i = 0; i < t.length; i += 9) s += Math.hypot(...cross(sub([t[i + 3], t[i + 4], t[i + 5]], [t[i], t[i + 1], t[i + 2]]), sub([t[i + 6], t[i + 7], t[i + 8]], [t[i], t[i + 1], t[i + 2]]))) / 2; return s; }
const outward = t => { if (volume(t) >= 0) return t; for (let i = 0; i < t.length; i += 9) for (let c = 0; c < 3; c++) { const x = t[i + 3 + c]; t[i + 3 + c] = t[i + 6 + c]; t[i + 6 + c] = x; } return t; };
// the edges used by one face only, as that face runs them (a -> b)
function rims(faces) {
  const count = new Map();
  for (const f of faces) for (let e = 0; e < 3; e++) { const a = f[e], b = f[(e + 1) % 3], id = a < b ? a + ',' + b : b + ',' + a; count.set(id, (count.get(id) ?? 0) + 1); }
  const out = [];
  for (const f of faces) for (let e = 0; e < 3; e++) { const a = f[e], b = f[(e + 1) % 3]; if (count.get(a < b ? a + ',' + b : b + ',' + a) === 1) out.push([a, b]); }
  return out;
}
function cap(t) {   // each hole closed by a fan from its centre
  const { v, faces } = weld(t), next = new Map();
  for (const [a, b] of rims(faces)) next.set(b, a);   // the cap runs the rim the other way
  const seen = new Set(), out = [...faces];
  for (const s of next.keys()) {
    if (seen.has(s)) continue;
    const loop = []; let n = s;
    while (n !== undefined && !seen.has(n)) { seen.add(n); loop.push(n); n = next.get(n); }
    if (n !== s || loop.length < 3) return null;   // a rim that does not close on itself: not a hole
    const c = [0, 0, 0]; for (const m of loop) at(v, m).forEach((x, i) => c[i] += x / loop.length);
    const ci = v.length / 3; v.push(...c);
    loop.forEach((m, i) => out.push([m, loop[(i + 1) % loop.length], ci]));
  }
  return soup(v, out);
}
function thicken(t, d) {   // a sheet made a solid d thick: two offset copies and a wall along its rim
  const { v, faces } = weld(t), nv = v.length / 3, nrm = new Float32Array(v.length);
  for (const f of faces) { const n = cross(sub(at(v, f[1]), at(v, f[0])), sub(at(v, f[2]), at(v, f[0]))); for (const m of f) for (let c = 0; c < 3; c++) nrm[3 * m + c] += n[c]; }
  const w = v.slice();
  for (let m = 0; m < nv; m++) {
    let n = [nrm[3 * m], nrm[3 * m + 1], nrm[3 * m + 2]], l = Math.hypot(...n);
    if (l < 1e-12) { n = [0, 1, 0]; l = 1; }
    for (let c = 0; c < 3; c++) { const o = n[c] / l * d / 2; w[3 * m + c] = v[3 * m + c] + o; w.push(v[3 * m + c] - o); }
  }
  // w holds the top copy at m and the bottom copy at nv + m (pushed in order after the top)
  const B = m => nv + m, out = faces.map(f => [...f]);
  for (const f of faces) out.push([B(f[0]), B(f[2]), B(f[1])]);
  for (const [a, b] of rims(faces)) out.push([b, a, B(a)], [b, B(a), B(b)]);
  return soup(w, out);
}
function strut(a, b, r) {   // an 8-sided post from point a to point b, closed
  const d = sub(b, a), l = Math.hypot(...d), u = d.map(x => x / l), h = Math.abs(u[1]) < .9 ? [0, 1, 0] : [1, 0, 0];
  const e1 = cross(u, h), l1 = Math.hypot(...e1), x1 = e1.map(x => x / l1), y1 = cross(u, x1), n = 8, t = [];
  const ring = (c, i) => { const q = i / n * 2 * Math.PI; return [0, 1, 2].map(k => c[k] + r * (Math.cos(q) * x1[k] + Math.sin(q) * y1[k])); };
  for (let i = 0; i < n; i++) t.push(...ring(a, i), ...ring(a, i + 1), ...ring(b, i), ...ring(b, i), ...ring(a, i + 1), ...ring(b, i + 1),
    ...a, ...ring(a, i + 1), ...ring(a, i), ...b, ...ring(b, i), ...ring(b, i + 1));
  return outward(new Float32Array(t));
}
// the closest pair of vertices between piece i and any other: { from, to, d } or null (r450: from the
// piece's own surface, never its box's centre, which for a hoop is in its hole)
function nearest(ps, i) {
  const own = weld(ps[i].tris).v; let best = null;
  ps.forEach((q, j) => {
    if (j === i) return;
    const b = q.box, t = q.tris;
    for (let n = 0; n < own.length; n += 3) {
      const c = [own[n], own[n + 1], own[n + 2]], gap = Math.hypot(...[0, 1, 2].map(k => Math.max(b.lo[k] - c[k], 0, c[k] - b.hi[k])));
      if (best && gap >= best.d) continue;
      for (let m = 0; m < t.length; m += 3) { const d = Math.hypot(t[m] - c[0], t[m + 1] - c[1], t[m + 2] - c[2]); if (!best || d < best.d) best = { from: c, to: [t[m], t[m + 1], t[m + 2]], d }; }
    }
  });
  return best;
}
export function repair(ps, k, { ground } = {}) {
  const log = [], out = [], T = THIN * 1.01 / k;   // a hair over THIN, so rounding never reads it as thin
  const say = (p, what) => log.push(`${p.name}: ${what}`);
  for (const p0 of ps) {
    let p = { ...p0, tris: Float32Array.from(p0.tris) }, fixed = [];
    if (ground !== undefined) {
      const b = bounds([p]);
      if (b.hi[1] <= ground + 1e-9) { say(p, 'under the ground, left out'); continue; }
      if (b.lo[1] < ground - 1e-9) { for (let i = 1; i < p.tris.length; i += 3) if (p.tris[i] < ground) p.tris[i] = ground; fixed.push('cut at the ground'); }
    }
    const c = check(p, k);
    if (c.open || c.flat) {
      const capped = !c.flat && cap(p.tris), a = area(p.tris);
      if (capped && Math.abs(volume(capped)) > a * T / 20) { p.tris = outward(capped); fixed.push(`${c.open} open edges capped`); }
      else { p.tris = outward(thicken(p.tris, T)); fixed.push(`${c.flat ? 'flat' : 'open sheet'}: thickened to ${THIN} mm`); }
    }
    const b = bounds([p]), thin = [0, 1, 2].filter(axis => b.size[axis] * k < THIN);   // a pole is thin on two sides
    for (const axis of thin) {
      const mid = (b.lo[axis] + b.hi[axis]) / 2, s = T / Math.max(b.size[axis], 1e-9);
      for (let i = axis; i < p.tris.length; i += 3) p.tris[i] = mid + (p.tris[i] - mid) * s;
    }
    if (thin.length) fixed.push(`thin (${thin.map(a => (b.size[a] * k).toFixed(2)).join(' x ')} mm): widened to ${THIN} mm`);
    if (fixed.length) { p.fixed = fixed; say(p, fixed.join(', ')); }
    out.push(p);
  }
  // floating pieces, once the rest is fixed: a strut from its vertex nearest another piece to that
  // piece, or a post straight down to the bed from its lowest vertex when that is shorter
  for (const p of out) p.box = bounds([p]);
  const fl = floating(out, k), floor = ground ?? Math.min(...out.map(p => p.box.lo[1])), pins = [], r = 1.5 * NOZZLE / k;
  out.forEach((p, i) => {
    if (!fl[i]) return;
    const hit = nearest(out, i), t = p.tris; let low = 1;
    for (let n = 4; n < t.length; n += 3) if (t[n] < t[low]) low = n;
    const toBed = t[low] - floor, bed = !hit || toBed < hit.d;
    const c = bed ? [t[low - 1], t[low], t[low + 1]] : hit.from, end = bed ? [c[0], floor, c[2]] : hit.to;
    const d = sub(end, c), l = Math.hypot(...d), u = l ? d.map(x => x / l) : [0, -1, 0], far = bed ? end : end.map((x, k) => x + u[k] * r);   // a little into what it holds on to
    const back = Math.max(0, T - Math.hypot(...sub(far, c))), from = c.map((x, k) => x - u[k] * back);   // never shorter than THIN: backed into the piece
    pins.push({ name: `pin-${p.name}`, type: 'Pin', color: p.color, tris: strut(from, far, r), fixed: ['pin'] });
    (p.fixed ??= []).push(`floating: pinned to ${bed ? 'the bed' : 'the nearest piece'} (${(l * k).toFixed(1)} mm)`);
    say(p, p.fixed.at(-1));
  });
  for (const p of out) delete p.box;
  return { ps: [...out, ...pins], log };
}

// binary STL in mm: three.js Y up becomes Z up as (x, -z, y), a rotation (never a mirror); the whole
// set is centred on x and y and stands on z = 0
export function stl(ps, k) {
  const { lo, hi } = bounds(ps), cx = (lo[0] + hi[0]) / 2, cz = (lo[2] + hi[2]) / 2;
  const n = ps.reduce((s, p) => s + p.tris.length / 9, 0), buf = new ArrayBuffer(84 + 50 * n), dv = new DataView(buf);
  dv.setUint32(80, n, true);
  let o = 84;
  for (const p of ps) for (let i = 0; i < p.tris.length; i += 9) {
    const v = [0, 1, 2].map(j => { const t = p.tris; return [(t[i + 3 * j] - cx) * k, -(t[i + 3 * j + 2] - cz) * k, (t[i + 3 * j + 1] - lo[1]) * k]; });
    const u = v[1].map((x, c) => x - v[0][c]), w = v[2].map((x, c) => x - v[0][c]);
    const nn = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], l = Math.hypot(...nn) || 1;
    for (const x of [nn.map(x => x / l), ...v]) { for (const c of x) { dv.setFloat32(o, c, true); o += 4; } }
    o += 2;
  }
  return new Uint8Array(buf);
}

const CRC = Array.from({ length: 256 }, (_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
const crc32 = d => { let c = ~0; for (const b of d) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return ~c >>> 0; };
export function zip(files) {
  const enc = new TextEncoder(), parts = [], dir = [];
  let at = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(8, 0, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, at, true);
    parts.push(new Uint8Array(h.buffer), name, data); dir.push(new Uint8Array(c.buffer), name);
    at += 30 + name.length + data.length;
  }
  const size = dir.reduce((s, d) => s + d.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, at, true);
  return new Blob([...parts, ...dir, new Uint8Array(e.buffer)], { type: 'application/zip' });
}
