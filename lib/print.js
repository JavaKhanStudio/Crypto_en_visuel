// Printing a scene (r196): turns an episode's 3D object into pieces for an FDM printer (0.4 mm
// nozzle, Simon 21 Oct: « standard 3D printer »), at board-game scale (figures about 6 cm, a castle
// about 15 cm). One three.js mesh = one printed piece. Works on plain arrays only (matrixWorld
// .elements, attribute .array), so it reads objects built in another window (the episode's iframe
// in lab/print/) as well as its own. No three.js import.
//   pieces(root, o)         every visible mesh under root, in root's frame, scene units (o: omit, strip, scale, bodies)
//   fit(pieces, size)       mm per unit for { h: 60 } (height), { max: 150 } (longest side) or { mm: 5 }
//   check(piece, k)         what stops it printing as is, at k mm a unit
//   floating(pieces, k)     the pieces that touch nothing: neither the bed nor another piece (r450: its triangles, not its box)
//   repair(pieces, k, o)    the same pieces fixed for printing (capped, thickened, pinned, cut at the ground) and a log
//   cut(ps, raw, k, o)      a toy's (lib/cast.js) sockets cut as lib/fit.js checks them: pin holes, seats, drawn holes (r501),
//                           and a turning peg's key and the one-way groove it stops in (r395)
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
// beam, a glow on the ground), named by the episode's list. r451, each { <name>: object or [objects] }
// as the list gives it (an array is named by its objects' names):
//   strip   decoration left out of the PRINTED version only (a flag, a cape): its pieces go to
//           out.stripped, each with .part = its name, for PRINT.txt and a ghost in the preview
//   scale   { <name>: [object(s), [sx, sy, sz]] } (factors > 0): that part's pieces scaled in root's axes about the
//           centre of its foot (the middle of its box's bottom), so a base shrinks in place and
//           stays on the ground; each scaled piece has .scaled = its name
//   bodies  parts printed as separate bodies to glue or peg: each piece has .body = the name of the
//           body it is under, 'main' for the rest
// r501: when root is a toy (lib/cast.js: userData.joints) and the list names no bodies, each part
// (userData.piece) is a body, and each piece carries what cut() needs: .piece, .hole (drawn, not printed),
// .pin { a, b, r } (a peg's axis ends and radius, in root's frame), .seat (the parts its part sits on);
// r395: a peg whose part turns (userData.swing [a0, a1], degrees on the part's x axis) also has .pin.swing
// and the part's .x (the axis it turns on) and .y (up at rest), unit vectors in root's frame.
export function pieces(root, { instances = Infinity, omit = [], strip = {}, scale = {}, bodies = {} } = {}) {
  const tags = m => { const t = new Map(); for (const [n, v] of Object.entries(named(m))) for (const o of [v].flat()) if (o) t.set(o, n); return t; };
  const sk = tags(strip), sc = tags(Object.fromEntries(Object.entries(scale).map(([n, [o]]) => [n, o]))), bd = tags(bodies);
  const under = (o, t) => { for (let u = o; u; u = u.parent) if (t.has(u)) return t.get(u); };
  const stripped = [], toy = !!root.userData?.joints && !Object.keys(bodies).length;   // r501: a toy (lib/cast.js) prints one body per part
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
      const p = { name: o.name || g.type.replace('Geometry', '') || 'mesh', type: g.type, color, tris, glow: mat?.type === 'MeshBasicMaterial', body: under(o, bd) ?? (toy ? partOf(o) : 'main') };
      if (toy) {   // r501: what cut() needs of a toy's mesh: its part, a drawn hole, a peg's axis and radius, what its part sits on
        p.piece = partOf(o); if (holeOf(o)) p.hole = true;
        const seat = seatOf(o); if (seat.length) p.seat = seat;
        if (o.userData.pin && g.type === 'CylinderGeometry') {
          const { radiusTop: r, height: hh } = g.parameters, s = Math.hypot(m[0], m[1], m[2]);
          p.pin = { a: mul(m, 0, -hh / 2, 0), b: mul(m, 0, hh / 2, 0), r: r * s };
          const sw = swingOf(o);   // r395: a part that turns on its peg (userData.swing) turns on its own x axis, the peg's
          if (sw) { const e = mat4(toRoot, sw.matrixWorld.elements), unit = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
            p.pin.swing = [...sw.userData.swing]; p.pin.x = unit([e[0], e[1], e[2]]); p.pin.y = unit([e[4], e[5], e[6]]); }
        }
      }
      const part = under(o, sk), sn = under(o, sc);
      if (sn) p.scaled = sn;
      if (part) stripped.push({ ...p, part }); else out.push(p);
    }
  });
  for (const [n, [, f]] of Object.entries(scale)) {   // about the foot of the part as a whole
    const ps = out.filter(p => p.scaled === n); if (!ps.length) continue;
    const { lo, hi } = bounds(ps), c = [(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2];
    for (const p of ps) for (let i = 0; i < p.tris.length; i++) p.tris[i] = c[i % 3] + (p.tris[i] - c[i % 3]) * f[i % 3];
  }
  out.skipped = skipped; out.stripped = stripped;
  return out;
}
// a toy's part (lib/cast.js, as lib/fit.js reads it): the nearest userData.piece, 'body' outside any
const partOf = o => { for (let u = o; u; u = u.parent) if (typeof u.userData?.piece === 'string') return u.userData.piece; return 'body'; };
const holeOf = o => { for (let u = o; u; u = u.parent) if (u.userData?.hole) return true; return false; };
const swingOf = o => { for (let u = o; u; u = u.parent) if (typeof u.userData?.piece === 'string') return u.userData.swing ? u : null; return null; };
const seatOf = o => { for (let u = o; u; u = u.parent) if (typeof u.userData?.piece === 'string') return u.userData.seat ?? []; return []; };
// a list's { name: part } as given, or an array of parts named by their own names (part 1, 2... when unnamed)
export const named = m => !m ? {} : Array.isArray(m) ? Object.fromEntries(m.map((o, i) => [o?.name || `part ${i + 1}`, o])) : m;

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
  // r501: open is an edge on an odd number of faces (a rim); one on four is two surfaces touching along it (a cut that
  // reaches a face, a pinch), closed for a slicer
  let open = 0; for (const n of edges.values()) if (n % 2) open++;
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
export function solid(p) {
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
// the point of triangle abc closest to p (Ericson, Real-Time Collision Detection 5.1.5)
function ptTri(p, a, b, c) {
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a), d1 = dot(ab, ap), e1 = dot(ac, ap);
  if (d1 <= 0 && e1 <= 0) return a;
  const bp = sub(p, b), d3 = dot(ab, bp), e3 = dot(ac, bp);
  if (d3 >= 0 && e3 <= d3) return b;
  const vc = d1 * e3 - d3 * e1;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return [a[0] + v * ab[0], a[1] + v * ab[1], a[2] + v * ab[2]]; }
  const cp = sub(p, c), d6 = dot(ab, cp), e6 = dot(ac, cp);
  if (e6 >= 0 && d6 <= e6) return c;
  const vb = d6 * e1 - d1 * e6;
  if (vb <= 0 && e1 >= 0 && e6 <= 0) { const w = e1 / (e1 - e6); return [a[0] + w * ac[0], a[1] + w * ac[1], a[2] + w * ac[2]]; }
  const va = d3 * e6 - d6 * e3;
  if (va <= 0 && e3 - d3 >= 0 && d6 - e6 >= 0) { const w = (e3 - d3) / ((e3 - d3) + (d6 - e6)); return [b[0] + w * (c[0] - b[0]), b[1] + w * (c[1] - b[1]), b[2] + w * (c[2] - b[2])]; }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den;
  return [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w];
}
const ptTri2 = (p, a, b, c) => d2(p, ptTri(p, a, b, c));
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
//            vertex nearest another piece to the closest point of that piece's faces (a lantern to the ring it hangs from),
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
function nearest(ps, i) {   // r510: from a vertex of ps[i] to the closest point of another piece's faces
  const own = weld(ps[i].tris).v; let best = null;
  ps.forEach((q, j) => {
    if (j === i) return;
    const b = q.box, t = q.tris, tb = q.triBox ??= triBoxes(t);
    for (let n = 0; n < own.length; n += 3) {
      const c = [own[n], own[n + 1], own[n + 2]], gap = (lo, hi) => Math.hypot(...[0, 1, 2].map(k => Math.max(lo[k] - c[k], 0, c[k] - hi[k])));
      if (best && gap(b.lo, b.hi) >= best.d) continue;
      for (let m = 0, f = 0; m < t.length; m += 9, f += 6) {
        if (best && gap([tb[f], tb[f + 1], tb[f + 2]], [tb[f + 3], tb[f + 4], tb[f + 5]]) >= best.d) continue;
        const to = ptTri(c, [t[m], t[m + 1], t[m + 2]], [t[m + 3], t[m + 4], t[m + 5]], [t[m + 6], t[m + 7], t[m + 8]]), d = Math.sqrt(d2(c, to));
        if (!best || d < best.d) best = { from: c, to, d };
      }
    }
  });
  return best;
}
const triBoxes = t => {   // lo xyz, hi xyz of each triangle, the filter nearest() skips faces with
  const b = new Float32Array(t.length / 9 * 6);
  for (let m = 0, f = 0; m < t.length; m += 9, f += 6) for (let k = 0; k < 3; k++) { b[f + k] = Math.min(t[m + k], t[m + 3 + k], t[m + 6 + k]); b[f + 3 + k] = Math.max(t[m + k], t[m + 3 + k], t[m + 6 + k]); }
  return b;
};
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
  const fl = floating(out, k), floor = Math.min(...out.map(p => p.box.lo[1])), pins = [], r = 1.5 * NOZZLE / k;
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
  for (const p of out) { delete p.box; delete p.triBox; }
  return { ps: [...out, ...pins], log };
}

// ---------- cut (r501): a toy's sockets, cut in the pieces the STL is written from ----------
// lib/fit.js checks a toy (lib/cast.js) as if its sockets were cut; cut() cuts them, exactly, for the export:
//   holes  a mesh with userData.hole is drawn, not printed: it is cut out of its own part, and dropped
//   pins   each userData.pin cylinder cuts a hole out of every other part it goes into: the joint's play
//          (o.play(male, female), mm a side) wider, DEPTH mm longer at each end; none where the female
//          draws its own bore (a ring, a fist) or the pin misses it
//   seats  a part with userData.seat = ['head'] is hollowed by those parts' meshes grown CLEAR mm (a hat
//          by the head it sits on), all but its own pins
// cut(ps, raw, k, o): ps as repair() left them (closed), raw as pieces() read them (the holes as drawn);
// returns { ps, log }. Each cut piece is A minus every cutter that meets it, (A u B) - C being (A - C) u
// (B - C): the pieces stay separate shells, as the STL already writes them. The CSG is a BSP tree's
// (Evan Wallace's csg.js, MIT), on convex polygons; its output is welded and its T-junctions split, so
// a cut piece is closed (check(p, k).open is 0) with its faces out.
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const before = (a, b) => a[0] !== b[0] ? a[0] < b[0] : a[1] !== b[1] ? a[1] < b[1] : a[2] < b[2];
function plane3(a, b, c) { const n = cross(sub(b, a), sub(c, a)), l = Math.hypot(...n); if (l < 1e-18) return null; const u = n.map(x => x / l); return { n: u, w: dot(u, a) }; }
const flip = q => ({ vs: q.vs.slice().reverse(), pl: { n: q.pl.n.map(x => -x), w: -q.pl.w } });
function split(pl, q, cf, cb, f, b, eps) {
  let all = 0; const ty = q.vs.map(v => { const t = dot(pl.n, v) - pl.w, k = t < -eps ? 2 : t > eps ? 1 : 0; all |= k; return k; });
  if (all === 0) (dot(pl.n, q.pl.n) > 0 ? cf : cb).push(q);
  else if (all === 1) f.push(q);
  else if (all === 2) b.push(q);
  else {
    const F = [], B = [];
    for (let i = 0; i < q.vs.length; i++) {
      const j = (i + 1) % q.vs.length, ti = ty[i], tj = ty[j], vi = q.vs[i], vj = q.vs[j];
      if (ti !== 2) F.push(vi); if (ti !== 1) B.push(vi);
      if ((ti | tj) === 3) {   // the same edge split from either side gives the same point: always from its first end
        const [p, r] = before(vi, vj) ? [vi, vj] : [vj, vi], t = (pl.w - dot(pl.n, p)) / dot(pl.n, sub(r, p)), v = lerp(p, r, t);
        F.push(v); B.push(v);
      }
    }
    if (F.length >= 3) f.push({ vs: F, pl: q.pl }); if (B.length >= 3) b.push({ vs: B, pl: q.pl });
  }
}
class Bsp {
  constructor(qs, eps) { this.eps = eps; this.pl = null; this.f = null; this.b = null; this.qs = []; if (qs) this.build(qs); }
  invert() { this.qs = this.qs.map(flip); if (this.pl) this.pl = { n: this.pl.n.map(x => -x), w: -this.pl.w }; this.f?.invert(); this.b?.invert(); [this.f, this.b] = [this.b, this.f]; }
  clip(qs) {
    if (!this.pl) return qs.slice();
    let f = [], b = []; for (const q of qs) split(this.pl, q, f, b, f, b, this.eps);
    if (this.f) f = this.f.clip(f); b = this.b ? this.b.clip(b) : [];
    return f.concat(b);
  }
  clipTo(t) { this.qs = t.clip(this.qs); this.f?.clipTo(t); this.b?.clipTo(t); }
  all() { return this.qs.concat(this.f ? this.f.all() : [], this.b ? this.b.all() : []); }
  build(qs) {
    if (!qs.length) return;
    this.pl ??= qs[0].pl;
    const f = [], b = []; for (const q of qs) split(this.pl, q, this.qs, this.qs, f, b, this.eps);
    if (f.length) (this.f ??= new Bsp(null, this.eps)).build(f);
    if (b.length) (this.b ??= new Bsp(null, this.eps)).build(b);
  }
}
const polys = t => { const out = []; for (let i = 0; i < t.length; i += 9) { const vs = [0, 3, 6].map(j => [t[i + j], t[i + j + 1], t[i + j + 2]]), pl = plane3(...vs); if (pl) out.push({ vs, pl }); } return out; };
function minus(qs, c, eps) {   // convex polygons qs (a closed solid) minus the closed soup c, or null when c takes nothing from it
  const A = new Bsp(qs, eps), B = new Bsp(polys(c), eps);
  A.invert(); A.clipTo(B); B.clipTo(A); B.invert(); B.clipTo(A); B.invert();
  const inner = B.all(); if (!inner.length) return null;
  A.build(inner); A.invert();
  return A.all();
}
// convex polygons as a closed triangle soup: points within eps made one (minus() passes 0.01 mm, over
// check()'s 1e-4 unit grid, so two points it keeps apart are never one key there), each edge split at the points
// lying on it (the T-junctions the BSP leaves), slivers dropped, each polygon fanned from its centre
function seal(qs, eps) {
  const pts = [], cell = new Map(), h = eps * 4, key = (x, y, z) => `${Math.floor(x / h)},${Math.floor(y / h)},${Math.floor(z / h)}`;
  const id = v => {
    const cx = Math.floor(v[0] / h), cy = Math.floor(v[1] / h), cz = Math.floor(v[2] / h);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++)
      for (const n of cell.get(`${cx + dx},${cy + dy},${cz + dz}`) ?? []) if (d2(pts[n], v) <= eps * eps) return n;
    const n = pts.length; pts.push(v); const kk = key(...v); (cell.get(kk) ?? cell.set(kk, []).get(kk)).push(n); return n;
  };
  const loops = qs.map(q => { const l = []; for (const v of q.vs) { const n = id(v); if (l.at(-1) !== n) l.push(n); } if (l.length > 1 && l[0] === l.at(-1)) l.pop(); return l; }).filter(l => l.length >= 3);
  const order = pts.map((_, i) => i).sort((a, b) => pts[a][0] - pts[b][0]), xs = order.map(i => pts[i][0]);
  const lower = x => { let lo = 0, hi = xs.length; while (lo < hi) { const m = (lo + hi) >> 1; if (xs[m] < x) lo = m + 1; else hi = m; } return lo; };
  const out = [];
  for (const l of loops) {
    const ring = [];
    for (let i = 0; i < l.length; i++) {
      const a = pts[l[i]], b = pts[l[(i + 1) % l.length]], d = sub(b, a), dd = dot(d, d), on = [];
      ring.push(l[i]);
      for (let j = lower(Math.min(a[0], b[0]) - eps); j < xs.length && xs[j] <= Math.max(a[0], b[0]) + eps; j++) {
        const n = order[j]; if (n === l[i] || n === l[(i + 1) % l.length]) continue;
        const p = pts[n], t = dot(sub(p, a), d) / dd; if (t <= 0 || t >= 1) continue;
        if (d2(p, lerp(a, b, t)) <= eps * eps) on.push([t, n]);
      }
      on.sort((x, y) => x[0] - y[0]); for (const [, n] of on) ring.push(n);
    }
    // a sliver the merge flattened runs back along itself (x, y, x): its two sides cancel, as they do in its neighbours
    for (let i = 0, n = ring.length; n >= 3 && i < 2 * n + 4; i++, n = ring.length) {
      const j = i % n;
      if (ring[j] === ring[(j + 1) % n]) { ring.splice(j, 1); i = -1; }
      else if (ring[(j + n - 1) % n] === ring[(j + 1) % n]) { ring.splice(j, 1); ring.splice(j % ring.length, 1); i = -1; }
    }
    // a polygon the merge pinched (one point twice: a, b, c, a, d, e) is two loops, each fanned on its own
    const todo = [ring];
    while (todo.length) {
      const r = todo.pop(); if (r.length < 3) continue;
      const seen = new Map(); let cut = null;
      for (let i = 0; i < r.length && !cut; i++) { if (seen.has(r[i])) cut = [seen.get(r[i]), i]; else seen.set(r[i], i); }
      if (cut) { const [i, j] = cut; todo.push(r.slice(i, j), r.slice(j).concat(r.slice(0, i))); continue; }
      if (r.length === 3) { out.push(r); continue; }
      const c = [0, 0, 0]; for (const n of r) for (let k = 0; k < 3; k++) c[k] += pts[n][k] / r.length;
      const ci = pts.length; pts.push(c);
      for (let i = 0; i < r.length; i++) out.push([r[i], r[(i + 1) % r.length], ci]);
    }
  }
  const t = new Float32Array(out.length * 9); out.forEach((f, i) => f.forEach((n, j) => t.set(pts[n], 9 * i + 3 * j)));
  return t;
}
function cylinder(a, b, r, n = 32) {   // a closed n-sided post from a to b, its flats r from the axis (circumscribed)
  const R = r / Math.cos(Math.PI / n), d = sub(b, a), l = Math.hypot(...d), u = d.map(x => x / l), hh = Math.abs(u[1]) < .9 ? [0, 1, 0] : [1, 0, 0];
  const e = cross(u, hh), x1 = e.map(x => x / Math.hypot(...e)), y1 = cross(u, x1), t = [];
  const ring = (c, i) => { const q = i / n * 2 * Math.PI; return [0, 1, 2].map(k => c[k] + R * (Math.cos(q) * x1[k] + Math.sin(q) * y1[k])); };
  for (let i = 0; i < n; i++) t.push(...ring(a, i), ...ring(a, i + 1), ...ring(b, i), ...ring(b, i), ...ring(a, i + 1), ...ring(b, i + 1),
    ...a, ...ring(a, i + 1), ...ring(a, i), ...b, ...ring(b, i), ...ring(b, i + 1));
  return outward(new Float32Array(t));
}
function grow(t, d) {   // a closed soup pushed out d along its vertex normals, every face at least d out
  const { v, faces } = weld(t), nv = v.length / 3, nrm = new Float32Array(v.length), fn = faces.map(f => { const n = cross(sub(at(v, f[1]), at(v, f[0])), sub(at(v, f[2]), at(v, f[0]))), l = Math.hypot(...n) || 1; return n.map(x => x / l); });
  faces.forEach((f, i) => f.forEach((m, j) => {   // each face's normal weighted by its angle at the vertex: a flat top's rim leans 45 degrees, not towards the bigger face
    const e1 = sub(at(v, f[(j + 1) % 3]), at(v, m)), e2 = sub(at(v, f[(j + 2) % 3]), at(v, m)), a = Math.acos(Math.max(-1, Math.min(1, dot(e1, e2) / (Math.hypot(...e1) * Math.hypot(...e2) || 1))));
    for (let c = 0; c < 3; c++) nrm[3 * m + c] += fn[i][c] * a;
  }));
  const least = new Float32Array(nv).fill(1), w = v.slice();
  for (let m = 0; m < nv; m++) { const l = Math.hypot(nrm[3 * m], nrm[3 * m + 1], nrm[3 * m + 2]) || 1; for (let c = 0; c < 3; c++) nrm[3 * m + c] /= l; }
  faces.forEach((f, i) => { for (const m of f) least[m] = Math.min(least[m], dot(fn[i], [nrm[3 * m], nrm[3 * m + 1], nrm[3 * m + 2]])); });
  for (let m = 0; m < nv; m++) for (let c = 0; c < 3; c++) w[3 * m + c] += nrm[3 * m + c] * d / Math.max(least[m], .33);
  return soup(w, faces);
}
// r395 (Simon on r196: an arm that swings by a set amount, « through a sliding hole cut only that way »): a peg whose
// part turns through .pin.swing [a0, a1] (o.swing[part] overrides it: a range, or null for none) gets a KEY, a rib
// KEY mm square along its top at rest, from .3 mm inside the female's surface to .3 mm short of its end; the female
// gets a groove, the key grown by the play swept from a0 to a1 about the peg, open to the surface so the key slides
// in, as deep as the socket: the part turns freely inside the range and its key meets the groove's ends outside it (the stops)
export const KEY = 1.2;   // mm: three nozzle lines, clear of THIN
function prism(o, u, e1, e2, poly, s0, s1) {   // poly ([x, y] on e1, e2, counter-clockwise about u, star-shaped about o) from s0 to s1 along u, closed
  const P = (q, s) => [0, 1, 2].map(c => o[c] + u[c] * s + e1[c] * q[0] + e2[c] * q[1]), t = [], n = poly.length, z = [0, 0];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    t.push(...P(z, s0), ...P(poly[j], s0), ...P(poly[i], s0), ...P(z, s1), ...P(poly[i], s1), ...P(poly[j], s1));
    t.push(...P(poly[i], s0), ...P(poly[j], s0), ...P(poly[j], s1), ...P(poly[i], s0), ...P(poly[j], s1), ...P(poly[i], s1));
  }
  return outward(new Float32Array(t));
}
// the key of peg p (a raw piece with .pin.swing) going into the pieces fs, and its socket with the groove, one cutter:
// the hole (radius rh) and the key grown by mm swept through range, as one star-shaped section (cut apart, the two
// walls cross at the female's surface and leave slivers), from s0 to s1 along the peg. Null when the peg goes into
// fs less than 1.6 mm. Units are the toy's; mm the play a side.
function keyed(p, fs, k, mm, range, s0, s1) {
  const { a, b, r, x, y } = p.pin, L = Math.hypot(...sub(b, a)), u = sub(b, a).map(v => v / L), at = s => a.map((v, c) => v + u[c] * s);
  const within = s => fs.some(q => inside(at(s), q.tris)), sIn = within(L) ? L : within(0) ? 0 : null;
  if (sIn === null) return null;
  const dir = sIn ? -1 : 1, step = .05 / k; let sOut = sIn; while (sOut * dir < (sIn ? 0 : L) * dir && within(sOut)) sOut += dir * step;
  if (Math.abs(sOut - sIn) * k < 1.6) return null;
  const yu = dot(y, u), e1 = (v => v.map(c => c / Math.hypot(...v)))(y.map((c, i) => c - u[i] * yu)), e2 = cross(u, e1), sg = dot(x, u) > 0 ? 1 : -1;
  const [k0, k1] = [sOut - dir * .3 / k, sIn + dir * .3 / k].sort((m, n) => m - n), W = KEY / 2 / k, D = r + KEY / k;
  const key = prism(a, u, e1, e2, [[r / 2, -W], [D, -W], [D, W], [r / 2, W]], k0, k1);
  const rh = r + mm / k, Wg = W + mm / k, Dg = D + mm / k, rho = Math.hypot(Dg, Wg), al = Math.atan2(Wg, Dg), rad = Math.PI / 180;
  const [t0, t1] = [sg * range[0] * rad, sg * range[1] * rad].sort((m, n) => m - n), dj = Math.sqrt(rh * rh - Wg * Wg), bj = Math.atan2(Wg, dj);
  const pt = (th, d, t) => [d * Math.cos(th) - t * Math.sin(th), d * Math.sin(th) + t * Math.cos(th)], N = 32, R = rh / Math.cos(Math.PI / N), poly = [pt(t1, dj, Wg)];
  for (let j = Math.floor((t1 + bj) / (2 * Math.PI / N)) + 1, th; (th = j * 2 * Math.PI / N) < t0 - bj + 2 * Math.PI; j++) poly.push([R * Math.cos(th), R * Math.sin(th)]);
  poly.push(pt(t0, dj, -Wg), pt(t0, Dg, -Wg));
  const m = Math.max(2, Math.ceil((t1 - t0 + 2 * al) / (6 * rad)));   // 6 degrees: 0.3 mm a side, over the seal's welds
  for (let j = 1; j < m; j++) { const th = t0 - al + (t1 - t0 + 2 * al) * j / m; poly.push([rho * Math.cos(th), rho * Math.sin(th)]); }
  poly.push(pt(t1, Dg, Wg));
  return { key, socket: prism(a, u, e1, e2, poly, s0, s1), mm: +((k1 - k0) * k).toFixed(1) };
}
export function cut(ps, raw, k, { play = () => null, bore = () => false, depth = .5, clear = .2, swing = {} } = {}) {
  const log = [], eps = 1e-3 / k, boxes = new Map(), box = t => boxes.get(t) ?? boxes.set(t, bounds([{ tris: t }])).get(t);
  const meet = (a, b) => [0, 1, 2].every(c => a.lo[c] - eps <= b.hi[c] && b.lo[c] - eps <= a.hi[c]);
  const cutters = [], keys = [];   // { into: part name, keepPins, tris, what }; r395: the keys added to turning pegs
  for (const h of raw.filter(p => p.hole)) cutters.push({ into: h.piece, tris: outward(cap(h.tris) ?? Float32Array.from(h.tris)), what: `hole drawn in ${h.piece}` });
  const parts = [...new Set(ps.filter(p => !p.hole).map(p => p.piece))];
  for (const p of raw.filter(p => p.pin)) for (const f of parts) {
    if (f === p.piece || bore(p.piece, f)) continue;
    const mm = play(p.piece, f) ?? clear, u = sub(p.pin.b, p.pin.a), l = Math.hypot(...u), e = u.map(x => x / l * depth / k);
    const t = cylinder(sub(p.pin.a, e), p.pin.b.map((x, c) => x + e[c]), p.pin.r + mm / k);
    const fs = ps.filter(q => q.piece === f && !q.hole); if (!fs.some(q => meet(box(q.tris), box(t)))) continue;
    const range = p.pin.swing && (p.piece in swing ? swing[p.piece] : p.pin.swing), kd = range && keyed(p, fs, k, mm, range, -depth / k, l + depth / k);
    cutters.push({ into: f, tris: kd ? kd.socket : t, what: `socket for ${p.piece}'s peg (${(2 * p.pin.r * k).toFixed(1)} mm) in ${f}, ${mm} mm a side` });
    if (!kd) continue;
    if (!keys.some(q => q.of === p)) keys.push({ of: p, name: 'key', piece: p.piece, body: ps.find(q => q.piece === p.piece)?.body ?? p.piece, color: p.color, tris: kd.key, key: true });
    log.push(`${p.piece} turns ${range[0]} to ${range[1]} degrees: a ${KEY} mm key along its peg (${kd.mm} mm) in a groove of ${f}, ${mm} mm a side, stops at both ends`);
  }
  for (const s of parts) {
    const on = ps.find(p => p.piece === s && p.seat)?.seat ?? [];
    for (const h of on) for (const q of ps.filter(p => p.piece === h && !p.hole))
      cutters.push({ into: s, keepPins: true, tris: grow(q.tris, clear / k), what: `${s} hollowed by ${h} (${clear} mm clear)` });
  }
  const said = new Set(), out = [];
  for (const p0 of ps) {
    if (p0.hole) continue;
    const b0 = box(p0.tris), mine = cutters.filter(c => c.into === p0.piece && !(c.keepPins && p0.pin) && meet(b0, box(c.tris)));
    // sealed at the first weld (0.01 to 0.08 mm) that leaves no edge open, which depends on how close the cut came
    // to the piece's own vertices: the polygons kept between cuts and sealed once, or else sealed after each cut
    const sealed = qs => { let best = null; for (const w of [10, 20, 40, 5, 80]) { const t = seal(qs, eps * w), o = check({ tris: t }, k).open; if (!best || o < best.o) best = { t, o }; if (!o) break; } return best; };
    let qs = null, used = [];
    for (const c of mine) { const r = minus(qs ?? polys(p0.tris), c.tris, eps); if (r) { qs = r; used.push(c); } }
    if (!used.length) { out.push(p0); continue; }
    let best = sealed(qs);
    if (best.o) { let t = p0.tris; for (const c of used) { const r = minus(polys(t), c.tris, eps); if (r) t = sealed(r).t; } const o = check({ tris: t }, k).open; if (o < best.o) best = { t, o }; }
    for (const c of used) if (!said.has(c.what)) { said.add(c.what); log.push(c.what); }
    if (best.o) log.push(`${p0.piece}/${p0.name}: ${best.o} edges left open by the cut`);
    out.push({ ...p0, tris: outward(best.t), cut: used.length });
  }
  return { ps: [...out, ...keys], log };
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
