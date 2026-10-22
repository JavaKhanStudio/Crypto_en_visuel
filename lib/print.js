// Printing a scene (r196): turns an episode's 3D object into pieces for an FDM printer (0.4 mm
// nozzle, Simon 21 Oct: « standard 3D printer »), at board-game scale (figures about 6 cm, a castle
// about 15 cm). One three.js mesh = one printed piece. Works on plain arrays only (matrixWorld
// .elements, attribute .array), so it reads objects built in another window (the episode's iframe
// in lab/print/) as well as its own. No three.js import.
//   pieces(root)            every visible mesh under root, in root's frame, scene units
//   fit(pieces, size)       mm per unit for { h: 60 } (height), { max: 150 } (longest side) or { mm: 5 }
//   check(piece, k)         what stops it printing as is, at k mm a unit
//   floating(pieces, k)     the pieces that touch nothing: neither the bed nor another piece's box
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
export function fit(ps, size) {
  const s = bounds(ps).size;
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

// a piece whose box, grown by half a nozzle, meets no other piece's box and does not reach the bed
// floats in the air once printed (the messenger's beacon above his head): it needs a pin or a stand
export function floating(ps, k) {
  const g = NOZZLE / 2 / k, bs = ps.map(p => bounds([p])), floor = Math.min(...bs.map(b => b.lo[1]));
  const meet = (a, b) => [0, 1, 2].every(c => a.lo[c] - g <= b.hi[c] && b.lo[c] - g <= a.hi[c]);
  return ps.map((p, i) => bs[i].lo[1] - floor > g && !bs.some((b, j) => j !== i && meet(bs[i], b)));
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
