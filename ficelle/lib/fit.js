// Does a toy fit together, and does each of its pieces print (r330, Simon 22 Oct: « We still have a few
// clipping problems. check if we could add a lib to calculate if something clips, or is properly 3D
// printable »). An asset made of PARTS printed apart and put together (a figure: body, rings, head, hat,
// item) is turned into voxels, at the size it prints, from what lib/print.js would print (its repair:
// open pieces capped, sheets thickened), and checked:
//   clips    two parts filling the same space once assembled: one cannot go where it is drawn
//   slides   a part put on from above (a ring over the neck pin, the head, the hat) whose way down is
//            blocked by a part already on (a ring's tail under an arm)
//   islands  a part that falls apart in several pieces once printed (a feather that touches nothing)
//   thin     the volume of a part narrower than THIN mm (lib/print.js): one or two nozzle lines
// A part is the nearest ancestor with userData.piece (a string); the meshes outside any part are the
// part 'body'. Sockets are cut, never modelled: a mesh with userData.pin (the neck pin, a hat's peg, an
// arm's shoulder pin, an item's pin) cuts its own shape, grown by CLEAR, out of every other part it goes
// into; a part with userData.seat = ['head'] has those parts, grown by CLEAR, cut out of it, all but its
// own pins (a hat is hollowed by the head it sits on, the robe by the arms that swing against it). A
// part with userData.swing = [a0, a1] turns on its own x axis from a0 to a1 degrees (an arm on its shoulder
// pin, positive swings back): what it is seated in is cut by every place it passes through, SWING degrees
// apart (the slot it swings in), so it never meets them inside its range. JOINTS (round 6, Simon 23 Oct: « A
// single male female slot would work WAY better »): userData.joints lists every joint of the asset, { name, male,
// female, r (the peg's radius), bore (the hole's, when the female draws it: a ring, a fist) or none (the peg cuts
// it), deep (how far the peg goes in), kind 'press' (stays put, comes off by hand) or 'turn' (turns on it), gap
// (a turning part's clearance to the part it turns against) }, in the asset's units; each must be a peg at least
// PEG_MIN mm across with JOINT[kind] mm of play a side, a turning part GAP_MIN mm clear (r.joints). The numbers,
// and why, are in .claude/skills/fdm-joints/SKILL.md. Every userData.pin mesh must be a straight cylinder. A mesh with userData.hole is drawn, not printed: its volume is cut out of its part (the
// dark socket at the neck). What is cut here the export has to cut too (lib/print.js cut() does since r501: sockets, seats, drawn holes). The asset says
// what is put on from above, in order, in userData.assembly: ['body', 'ring scarf', 'head', 'hat'];
// userData.side names the parts put on sideways right after the first (the arms, onto their shoulder
// pins): they block what comes down after them but are not slid; the parts named nowhere (a held item)
// are checked for clips only. No three.js import: like
// lib/print.js it reads plain arrays, so it checks an object built in another window.
//     import { check } from '../../lib/fit.js';
//     const r = check(person('a'), { h: 40 });   // r.ok, r.clips, r.slides, r.parts, r.voxels(name)
import { pieces, repair, fit, bounds, THIN } from './print.js';

export const VOXEL = .2, MIN = .05, CLEAR = .2, EDGE = 1, SWING = 2;   // mm: the voxel's side; under MIN mm³ is two parts touching; a
// socket's play in the voxels (one voxel: the JOINT play below is finer than the grid, so it is checked from the numbers);
// a thin patch under EDGE mm³ is an edge (where a hole meets a round face), not a wall; SWING: degrees between two poses
// a joint's play a side in mm, by kind; the narrowest peg; a hole's depth past the peg's end; a turning part's gap
export const JOINT = { press: [.08, .15], turn: [.15, .3] }, PEG_MIN = 2.5, DEPTH = .5, GAP_MIN = .3;

const partOf = o => { for (let u = o; u; u = u.parent) if (typeof u.userData?.piece === 'string') return u.userData.piece; return 'body'; };
const isHole = o => { for (let u = o; u; u = u.parent) if (u.userData?.hole) return true; return false; };
const seatOf = o => { for (let u = o; u; u = u.parent) if (typeof u.userData?.piece === 'string') return u.userData.seat ?? []; return []; };

// every column (x, z) a vertical line crosses the closed triangle soup t at, the inside between pairs
function fill(t, grid, lo, n, h) {
  const cols = new Map(), J = 1e-4 * h;   // the lines go a hair off the voxel centres, never through an edge
  for (let i = 0; i < t.length; i += 9) {
    const ax = t[i], az = t[i + 2], bx = t[i + 3], bz = t[i + 5], cx = t[i + 6], cz = t[i + 8];
    const d = (bx - ax) * (cz - az) - (cx - ax) * (bz - az); if (Math.abs(d) < 1e-15) continue;   // seen edge on
    const i0 = Math.max(0, Math.ceil((Math.min(ax, bx, cx) - lo[0]) / h - .5)), i1 = Math.min(n[0] - 1, Math.floor((Math.max(ax, bx, cx) - lo[0]) / h - .5));
    const k0 = Math.max(0, Math.ceil((Math.min(az, bz, cz) - lo[2]) / h - .5)), k1 = Math.min(n[2] - 1, Math.floor((Math.max(az, bz, cz) - lo[2]) / h - .5));
    for (let xi = i0; xi <= i1; xi++) for (let zk = k0; zk <= k1; zk++) {
      const x = lo[0] + (xi + .5) * h + J, z = lo[2] + (zk + .5) * h + 2 * J;
      const u = ((bx - x) * (cz - z) - (cx - x) * (bz - z)) / d, v = ((cx - x) * (az - z) - (ax - x) * (cz - z)) / d, w = 1 - u - v;
      if (u < 0 || v < 0 || w < 0) continue;
      const y = u * t[i + 1] + v * t[i + 4] + w * t[i + 7], key = xi * n[2] + zk;
      (cols.get(key) ?? cols.set(key, []).get(key)).push(y);
    }
  }
  for (const [key, ys] of cols) {
    if (ys.length < 2) continue;
    ys.sort((a, b) => a - b);
    const xi = Math.floor(key / n[2]), zk = key % n[2];
    for (let j = 0; j + 1 < ys.length; j += 2) {
      const y0 = Math.max(0, Math.ceil((ys[j] - lo[1]) / h - .5)), y1 = Math.min(n[1] - 1, Math.floor((ys[j + 1] - lo[1]) / h - .5));
      for (let yj = y0; yj <= y1; yj++) grid[(xi * n[1] + yj) * n[2] + zk] = 1;
    }
  }
}

// grid (x, y, z) -> min (erode) or max (dilate) over a cube of side 2r + 1, one axis at a time
function morph(g, n, r, max) {
  let a = g, b = new Uint8Array(g.length), spare = new Uint8Array(g.length);   // never write into g
  const st = [n[1] * n[2], n[2], 1];
  for (let ax = 0; ax < 3; ax++) {
    for (let i = 0; i < a.length; i++) {
      const c = Math.floor(i / st[ax]) % n[ax]; let v = max ? 0 : 1;
      for (let d = -r; d <= r; d++) {
        const e = c + d; const x = e < 0 || e >= n[ax] ? 0 : a[i + d * st[ax]];
        if (max ? x : !x) { v = max ? 1 : 0; break; }
      }
      b[i] = v;
    }
    [a, b] = [b, a === g ? spare : a];
  }
  return a;
}

// the same over its 6 face neighbours (a cross)
function cross(g, n, max) {
  const b = new Uint8Array(g.length), st = [n[1] * n[2], n[2], 1];
  for (let i = 0; i < g.length; i++) {
    let v = g[i];
    for (let ax = 0; ax < 3 && (max ? !v : v); ax++) {
      const c = Math.floor(i / st[ax]) % n[ax];
      for (const d of [-1, 1]) { const x = c + d < 0 || c + d >= n[ax] ? 0 : g[i + d * st[ax]]; if (max ? x : !x) v = max ? 1 : 0; }
    }
    b[i] = v;
  }
  return b;
}
// over a ball of radius r voxels, near enough: cubes and crosses in turn (a cube alone eats a slanted wall's edges)
const ball = (g, n, r, max) => { for (let j = 0; j < r; j++) g = j % 2 ? cross(g, n, max) : morph(g, n, 1, max); return g; };

// the pieces of a part that hold together face to face, biggest first: { size, cells } (cells: its voxels)
function islands(g, n) {
  const seen = new Uint8Array(g.length), st = [n[1] * n[2], n[2], 1], out = [], stack = new Int32Array(g.length);
  for (let s = 0; s < g.length; s++) {
    if (!g[s] || seen[s]) continue;
    let top = 0; const cells = []; stack[top++] = s; seen[s] = 1;
    while (top) {
      const i = stack[--top]; cells.push(i);
      for (let ax = 0; ax < 3; ax++) {
        const c = Math.floor(i / st[ax]) % n[ax];
        for (const d of [-1, 1]) { if (c + d < 0 || c + d >= n[ax]) continue; const j = i + d * st[ax]; if (g[j] && !seen[j]) { seen[j] = 1; stack[top++] = j; } }
      }
    }
    out.push({ size: cells.length, cells });
  }
  return out.sort((a, b) => b.size - a.size);
}

// check(asset, size): size as lib/print.js fit() takes it ({ h: 40 }: 40 mm tall); opts.voxel in mm
export function check(root, size = { h: 40 }, { voxel = VOXEL, omit = [] } = {}) {
  // which mesh each piece came from: lib/print.js keeps its name, so each mesh is named by its index while it reads them
  const meshes = [], names0 = [];
  root.traverse(o => { if (o.isMesh) { names0.push(o.name); o.name = `\u0000fit${meshes.length}`; meshes.push(o); } });
  let raw; try { raw = pieces(root, { omit }); } finally { meshes.forEach((o, i) => o.name = names0[i]); }
  const k = fit(raw, size);   // mm per unit
  const { ps } = repair(raw, k), printed = [];
  for (const p of ps) { const i = /^\u0000fit(\d+)$/.exec(p.name)?.[1]; if (i !== undefined) printed.push({ ...p, obj: meshes[+i] }); }   // repair's own pins are not ours
  const h = voxel / k, B = bounds(printed), lo = B.lo.map(x => x - 2 * h), n = B.size.map(s => Math.ceil(s / h) + 4), N = n[0] * n[1] * n[2];
  const solid = new Map(), holes = new Map(), pins = new Map(), seats = new Map(), crooked = [];
  const grid = (m, name) => (m.get(name) ?? m.set(name, new Uint8Array(N)).get(name));
  for (const p of printed) {
    const name = partOf(p.obj);
    if (isHole(p.obj)) { fill(p.tris, grid(holes, name), lo, n, h); continue; }
    fill(p.tris, grid(solid, name), lo, n, h);
    if (p.obj.userData?.pin) {
      fill(p.tris, grid(pins, name), lo, n, h);
      const G = p.obj.geometry; if (G.type !== 'CylinderGeometry' || G.parameters.radiusTop !== G.parameters.radiusBottom) crooked.push(name);   // one straight peg
    }
    if (seatOf(p.obj).length) seats.set(name, seatOf(p.obj));
  }
  const seats0 = new Map(seats), held = new Map();   // seats0: who is hollowed for whom; held: the parts inside a part's object (an arm's item)
  root.traverse(o => { const name = o.userData?.piece; if (typeof name !== 'string') return; const s = new Set(); o.traverse(m => { if (m !== o && typeof m.userData?.piece === 'string') s.add(m.userData.piece); }); held.set(name, s); });
  const partsIn = name => held.get(name) ?? new Set();
  const c = Math.max(1, Math.round(CLEAR / voxel)), cut = (name, g, keep) => { const s = solid.get(name); if (s) for (let i = 0; i < N; i++) if (g[i] && !keep?.[i]) s[i] = 0; };
  for (const [name, g] of holes) cut(name, g);
  const grown = new Map([...pins].map(([name, g]) => [name, morph(g, n, c, true)]));
  // a part that swings fills every place it passes through, from what lib/print.js would print of it there
  const swept = new Map(), sweeps = new Map();   // swept: the part alone, rest included (what is seated on it is cut by it); sweeps: off its rest, the part and what it holds
  root.traverse(o => {
    const name = o.userData?.piece, range = o.userData?.swing;
    if (typeof name !== 'string' || !range || !solid.has(name)) return;
    const g = solid.get(name).slice(), moved = new Uint8Array(N), items = new Uint8Array(N), rest = o.rotation.x, mine = new Set(); o.traverse(m => { if (m.isMesh) mine.add(m); });
    const ids = new Map(); meshes.forEach((m, i) => { if (mine.has(m)) ids.set(`\u0000fit${i}`, m); });
    try {
      for (let a = range[0]; a <= range[1] + 1e-9; a += SWING) {
        o.rotation.x = rest + a * Math.PI / 180;
        meshes.forEach((m, i) => m.name = `\u0000fit${i}`);
        let raw; try { raw = pieces(root, { omit }).filter(p => ids.has(p.name)); } finally { meshes.forEach((m, i) => m.name = names0[i]); }
        for (const p of repair(raw, k).ps) {
          const m = ids.get(p.name); if (!m || isHole(m) || m.userData?.pin || a === 0) continue;
          if (partOf(m) !== name) { fill(p.tris, items, lo, n, h); continue; }   // the slot is cut for the part, not what it holds: an item changes, the slot cannot
          fill(p.tris, g, lo, n, h); fill(p.tris, moved, lo, n, h);
        }
      }
    } finally { o.rotation.x = rest; root.updateMatrixWorld(true); }
    swept.set(name, g); sweeps.set(name, { moved, items });
  });
  for (const [name, on] of seats) { const g = new Uint8Array(N); for (const s of on) if (solid.has(s)) (swept.get(s) ?? solid.get(s)).forEach((x, i) => { if (x) g[i] = 1; }); seats.set(name, morph(g, n, c, true)); }
  const slots = new Map();   // what a swinging part's slot takes out of the part it swings against, to draw it
  for (const [name, g] of seats) {
    const S = solid.get(name), keep = pins.get(name);
    if (S && seats0.get(name).some(x => swept.has(x))) { const idx = []; for (let i = 0; i < N; i++) if (g[i] && S[i] && !keep?.[i]) idx.push(i); slots.set(name, idx); }
    cut(name, g, keep);   // never its own pins
  }
  for (const [from, g] of grown) for (const name of solid.keys()) if (name !== from) cut(name, g);
  const names = [...solid.keys()].filter(x => solid.get(x).some(Boolean)), v3 = voxel ** 3, mm3 = c => +(c * v3).toFixed(2);
  const at = i => { const x = Math.floor(i / (n[1] * n[2])), y = Math.floor(i / n[2]) % n[1], z = i % n[2]; return [x, y, z].map((c, a) => +((lo[a] + (c + .5) * h) * k).toFixed(1)); };
  const centre = idx => { const s = [0, 0, 0]; for (const i of idx) at(i).forEach((c, a) => s[a] += c); return s.map(c => +(c / idx.length).toFixed(1)); };
  // the parts, each printed alone
  const marks = new Map(), r = Math.max(1, Math.round((THIN / voxel - 1) / 2)), parts = names.map(name => {
    const g = solid.get(name), count = g.reduce((s, x) => s + x, 0), opened = morph(ball(ball(g, n, r, false), n, r, true), n, r, true);
    // what no ball of THIN fits in, less what lies within r of one that fits (an edge's corners, rounded off
    // by any ball, are not thin walls): a wall too thin to print, a sliver, a spike
    const all = new Uint8Array(N); for (let i = 0; i < N; i++) if (g[i] && !opened[i]) all[i] = 1;
    const thin = islands(all, n).filter(x => x.size * v3 >= EDGE).flatMap(x => x.cells);   // a knife edge round a hole is not a wall
    const big = islands(g, n).filter(x => x.size * v3 >= MIN), loose = big.slice(1).flatMap(x => x.cells);   // a voxel or two alone is the grid's grain
    if (loose.length) marks.set(`${name} loose`, loose);
    if (thin.length * v3 >= MIN) marks.set(`${name} thin`, thin);
    return { name, mm3: mm3(count), islands: Math.max(1, big.length), loose: big.slice(1).map(x => ({ mm3: mm3(x.size), at: centre(x.cells) })),
      thin: thin.length * v3 >= MIN ? mm3(thin.length) : 0, thinAt: thin.length ? centre(thin) : null };
  });
  for (const [name, idx] of slots) if (idx.length) marks.set(`${name} slot`, idx);   // not a fault: where it is hollowed for a swing
  // clips: two parts in the same voxels
  const clips = [];
  for (let a = 0; a < names.length; a++) for (let b = a + 1; b < names.length; b++) {
    const A = solid.get(names[a]), Bg = solid.get(names[b]), idx = [];
    for (let i = 0; i < N; i++) if (A[i] && Bg[i]) idx.push(i);
    if (idx.length * v3 >= MIN) { clips.push({ a: names[a], b: names[b], mm3: mm3(idx.length), at: centre(idx) }); marks.set(`${names[a]} x ${names[b]}`, idx); }
  }
  // swings: a swinging part, with what it holds, passing through a part not hollowed for it, anywhere in its range
  const swings = [];
  for (const [from, { moved, items }] of sweeps) for (const name of names) {
    if (name === from || partsIn(from).has(name)) continue;
    const S = solid.get(name), own = !(seats0.get(name) ?? []).includes(from);   // what is hollowed for the part only meets what it holds
    for (const [what, g] of [[from, own && moved], [`${from}'s ${[...partsIn(from)].join(', ')}`, items]]) {
      if (!g) continue;
      const idx = []; for (let i = 0; i < N; i++) if (g[i] && S[i]) idx.push(i);
      if (idx.length * v3 >= MIN) { swings.push({ part: what, into: name, mm3: mm3(idx.length), at: centre(idx) }); marks.set(`${what} swings into ${name}`, idx); }
    }
  }
  // slides: a part comes down onto what is already on; in a column, nothing already on may sit above it
  const slides = [], on = new Uint8Array(N), order = (root.userData?.assembly ?? []).filter(x => solid.has(x));
  const side = (root.userData?.side ?? []).filter(x => solid.has(x));
  order.forEach((name, j) => {
    const g = solid.get(name);
    if (j) {
      const idx = [];
      for (let xi = 0; xi < n[0]; xi++) for (let zk = 0; zk < n[2]; zk++) {
        let top = -1, low = -1; const base = xi * n[1] * n[2] + zk;
        for (let yj = 0; yj < n[1]; yj++) { const i = base + yj * n[2]; if (on[i]) top = yj; if (g[i] && low < 0) low = yj; }
        if (low >= 0 && top > low) for (let yj = low; yj < top; yj++) { const i = base + yj * n[2]; if (g[i]) idx.push(i); }
      }
      if (idx.length * v3 >= MIN) { slides.push({ part: name, onto: order.slice(0, j).join(' + '), mm3: mm3(idx.length), at: centre(idx) }); marks.set(`${name} slides`, idx); }
    }
    for (let i = 0; i < N; i++) if (g[i]) on[i] = 1;
    if (!j) for (const s of side) solid.get(s).forEach((x, i) => { if (x) on[i] = 1; });
  });
  // joints: each one peg in one hole, its numbers against the table (finer than the voxels, so read, not voxelised)
  const mmOf = x => x == null ? null : +(x * k).toFixed(2), joints = (root.userData?.joints ?? []).map(j => {
    const play = JOINT[j.kind] ?? JOINT.press, d = mmOf(2 * j.r), clear = j.bore != null ? mmOf(j.bore - j.r) : +((play[0] + play[1]) / 2).toFixed(2);
    const gap = mmOf(j.gap), why = [];
    if (d < PEG_MIN) why.push(`peg ${d} mm across, under ${PEG_MIN}`);
    if (clear < play[0] - .005 || clear > play[1] + .005) why.push(`${clear} mm of play a side, wants ${play.join(' to ')} for ${j.kind}`);
    if (gap != null && gap < GAP_MIN) why.push(`${gap} mm clear of ${j.female}, wants ${GAP_MIN}`);
    return { name: j.name, male: j.male, female: j.female, kind: j.kind, d, clear, cut: j.bore == null, deep: mmOf(j.deep), hole: j.deep == null ? null : +(mmOf(j.deep) + DEPTH).toFixed(2), gap, ok: !why.length, why };
  });
  for (const name of new Set(crooked)) joints.push({ name: `${name}'s peg`, male: name, ok: false, why: ['a peg that is not one straight cylinder'] });
  const ok = !clips.length && !slides.length && !swings.length && joints.every(j => j.ok) && parts.every(p => p.islands <= 1 && !p.thin);
  // voxels(key): where a clip ('a x b'), a slide ('<part> slides'), a loose island ('<part> loose'), a thin wall ('<part> thin'),
  // a swing ('<part> swings into <part>') or a slot hollowed for one ('<part> slot', not a fault) is, in the asset's units, to draw it
  const voxels = key => (marks.get(key) ?? []).map(i => at(i).map(c => c / k));
  return { ok, k, voxel, parts, clips, slides, joints, swings, swinging: [...swept.keys()], voxels, keys: [...marks.keys()] };
}

// one line per finding, for a log or a lab's caption
export function describe(r) {
  const out = [];
  for (const c of r.clips) out.push(`clip: ${c.a} and ${c.b} share ${c.mm3} mm³ at ${c.at.join(', ')} mm`);
  for (const s of r.slides) out.push(`slide: ${s.part} cannot come down onto ${s.onto} (${s.mm3} mm³ in the way, at ${s.at.join(', ')} mm)`);
  for (const s of r.swings ?? []) out.push(`swing: ${s.part} passes through ${s.into} (${s.mm3} mm³, around ${s.at.join(', ')} mm)`);
  for (const j of r.joints ?? []) if (!j.ok) out.push(`joint: ${j.name}: ${j.why.join('; ')}`);
  for (const p of r.parts) {
    if (p.islands > 1) out.push(`islands: ${p.name} prints as ${p.islands} pieces (loose ${p.loose.map(l => `${l.mm3} mm³ at ${l.at.join(', ')}`).join('; ')})`);
    if (p.thin) out.push(`thin: ${p.name} has ${p.thin} mm³ under ${THIN} mm, around ${p.thinAt.join(', ')} mm`);
  }
  return out.length ? out : ['ok'];
}
