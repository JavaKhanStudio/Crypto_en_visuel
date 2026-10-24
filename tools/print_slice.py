#!/usr/bin/env python3
"""r651: slices a cast figure's shoulder as exported (tools/print_joint_shot.mjs: the body with its socket and groove cut,
the right arm with its peg's key, r395) with OrcaSlicer at 0.2 mm layers and a 0.4 mm nozzle (tools/print_slice/*.json,
an Ender-3 V2 profile), reads the G-code back into the figure's frame and checks the joint as the printer will lay it:
  key     the arm printed peg up (fdm-joints: a peg prints standing): in every layer through the peg the key's rib is
          there, reaches its full depth, and a chord across it meets at least 3 extruded lines
  roof    the body as it stands: the socket's horizontal cavity at three cuts along the peg, layer by layer, against the
          cut drawn in the STL; the roof's covering layer, its type (Bridge, Overhang) and the span it crosses unsupported
  play    the socket's sliced edges and the peg's sliced edges, against the play drawn (0.225 mm a side for a turn)
Writes <out>/report.txt and <out>/slice.png (the layers at the shoulder: the body cut down the peg, the body's layers
through the socket seen from above, the arm's layers through its peg). Orca: OrcaSlicer 2.4.2's AppImage extracted
(--appimage-extract) to ~/.local/opt/orcaslicer, or --orca <AppRun>.
    python3 tools/print_slice.py [kind, default a] [--out out/print_slice] [--orca path]"""
import argparse, json, math, os, re, struct, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser(); ap.add_argument("kind", nargs="?", default="a"); ap.add_argument("--out", default=str(ROOT / "out/print_slice"))
ap.add_argument("--orca", default=os.path.expanduser("~/.local/opt/orcaslicer/squashfs-root/AppRun"))
a = ap.parse_args(); out = Path(a.out).resolve(); pj = out / "export"; out.mkdir(parents=True, exist_ok=True)
subprocess.run(["node", str(ROOT / "tools/print_joint_shot.mjs"), a.kind, str(pj) + "/"], check=True)
ax = json.load(open(pj / "axis.json")); A, B, R = ax["a"], ax["b"], ax["r"]
inner, outer = (A, B) if abs(A[0]) < abs(B[0]) else (B, A)
U = [(i - o) for i, o in zip(inner, outer)]; L = math.hypot(*U); U = [c / L for c in U]   # the peg's axis, out of the arm into the body

def stl(p):
    b = open(p, "rb").read(); n = struct.unpack("<I", b[80:84])[0]
    return [[struct.unpack("<3f", b[84 + 50 * i + 12 + 12 * j: 84 + 50 * i + 24 + 12 * j]) for j in range(3)] for i in range(n)]
def write(p, tris):
    with open(p, "wb") as f:
        f.write(b"\0" * 80 + struct.pack("<I", len(tris)))
        for t in tris: f.write(struct.pack("<3f", 0, 0, 0) + b"".join(struct.pack("<3f", *v) for v in t) + b"\0\0")
# the arm stands on its outer face, peg up: U turned onto +Z (Rodrigues), then both parts set on the bed's centre
def onto_z(u):
    k = [u[1], -u[0], 0]; s = math.hypot(*k); c = u[2]
    if s < 1e-9: return lambda v: list(v)
    k = [x / s for x in k]
    def f(v):
        d = sum(k[i] * v[i] for i in range(3)); cr = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]]
        return [v[i] * c + cr[i] * s + k[i] * d * (1 - c) for i in range(3)]
    return f
rot = onto_z(U)
body = stl(pj / "body.stl"); arm = [[rot(v) for v in t] for t in stl(pj / "arm-rest.stl") + stl(pj / "key-rest.stl")]
def place(tris):   # centre on (110, 110), foot on the bed; returns the tris and the shift
    xs = [v[0] for t in tris for v in t]; ys = [v[1] for t in tris for v in t]; zs = [v[2] for t in tris for v in t]
    d = [110 - (min(xs) + max(xs)) / 2, 110 - (min(ys) + max(ys)) / 2, -min(zs)]
    return [[[v[i] + d[i] for i in range(3)] for v in t] for t in tris], d
body_p, db = place(body); arm_p, da = place(arm)
write(out / "body.stl", body_p); write(out / "arm.stl", arm_p)
cfg = ROOT / "tools/print_slice"
def slice_(name):
    d = out / name; d.mkdir(exist_ok=True)
    r = subprocess.run([a.orca, "--load-settings", f"{cfg}/machine.json;{cfg}/process.json", "--load-filaments", f"{cfg}/filament.json",
                        "--slice", "0", "--arrange", "0", "--outputdir", str(d), str(out / f"{name}.stl")], capture_output=True, text=True)
    g = d / "plate_1.gcode"
    if not g.exists(): sys.exit(f"orca did not slice {name}: {r.returncode}\n{r.stdout[-2000:]}{r.stderr[-2000:]}")
    return g
def gcode(p):   # extruded segments by layer: {z: [(x0, y0, x1, y1, width, type)]}
    layers, z, x, y, w, ty, cfg = {}, 0, 0, 0, .42, "", {}
    for ln in open(p):
        if ln.startswith(";Z:"): z = round(float(ln[3:]), 3)
        elif ln.startswith(";WIDTH:"): w = float(ln[7:])
        elif ln.startswith(";TYPE:"): ty = ln[6:].strip()
        elif ln.startswith("; ") and " = " in ln: k, v = ln[2:].split(" = ", 1); cfg[k.strip()] = v.strip()
        elif ln.startswith(("G1 ", "G0 ")):
            f = {t[0]: float(t[1:]) for t in ln.split(";")[0].split()[1:] if t[0] in "XYZE"}
            nx, ny = f.get("X", x), f.get("Y", y)
            if "Z" in f and not layers.get(z): pass
            if f.get("E", 0) > 0 and ln.startswith("G1"): layers.setdefault(z, []).append((x, y, nx, ny, w, ty))
            x, y = nx, ny
    return layers, cfg
gb, cb = gcode(slice_("body")); ga, ca = gcode(slice_("arm"))
rep = []; say = lambda s: (rep.append(s), print(s))
say(f"OrcaSlicer: layer {cb.get('layer_height')} mm, nozzle {cb.get('nozzle_diameter')} mm, outer wall {cb.get('outer_wall_line_width')} mm, "
    f"inner wall {cb.get('inner_wall_line_width')} mm, {cb.get('wall_loops')} walls, support {cb.get('enable_support')}")
# where Orca put each part: the extruded box against the STL's (a wall's edge sits on the model's surface)
def box(layers):
    xs = [c for s in layers.values() for t in s for c in ((t[0] - t[4] / 2, t[2] + t[4] / 2))]; ys = [c for s in layers.values() for t in s for c in ((t[1] - t[4] / 2, t[3] + t[4] / 2))]
    return min(xs), max(xs), min(ys), max(ys)
for n, g, tris in (("body", gb, body_p), ("arm", ga, arm_p)):
    bx = box(g); xs = [v[0] for t in tris for v in t]; ys = [v[1] for t in tris for v in t]
    say(f"{n}: sliced box x {bx[0]:.2f}..{bx[1]:.2f} y {bx[2]:.2f}..{bx[3]:.2f}, STL x {min(xs):.2f}..{max(xs):.2f} y {min(ys):.2f}..{max(ys):.2f} (placed as written)")

def cross(segs, along, at):   # where segments cross the line {along}=at: [(other coordinate, width, type)]
    o = 1 - along; r = []
    for s in segs:
        p, q = (s[0], s[1]), (s[2], s[3])
        if (p[along] - at) * (q[along] - at) < 0:
            t = (at - p[along]) / (q[along] - p[along]); r.append((p[o] + t * (q[o] - p[o]), s[4], s[5]))
    return sorted(r)
def mesh_cut(tris, x0, zc):   # the STL cut by the plane x = x0 and the line z = zc: the y where the surface crosses, sorted
    ys = []
    for t in tris:
        pts = []
        for i in range(3):
            p, q = t[i], t[(i + 1) % 3]
            if (p[0] - x0) * (q[0] - x0) < 0: u = (x0 - p[0]) / (q[0] - p[0]); pts.append([p[c] + u * (q[c] - p[c]) for c in range(3)])
        if len(pts) == 2 and (pts[0][2] - zc) * (pts[1][2] - zc) < 0:
            u = (zc - pts[0][2]) / (pts[1][2] - pts[0][2]); ys.append(pts[0][1] + u * (pts[1][1] - pts[0][1]))
    return sorted(ys)
def ray_z(tris, x0, y0):   # the heights where the vertical line at (x0, y0) crosses the STL
    zs = []
    for t in tris:
        (x1, y1, z1), (x2, y2, z2), (x3, y3, z3) = t; d = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3)
        if abs(d) < 1e-12: continue
        l1 = ((y2 - y3) * (x0 - x3) + (x3 - x2) * (y0 - y3)) / d; l2 = ((y3 - y1) * (x0 - x3) + (x1 - x3) * (y0 - y3)) / d; l3 = 1 - l1 - l2
        if min(l1, l2, l3) >= 0: zs.append(l1 * z1 + l2 * z2 + l3 * z3)
    return sorted(zs)
def gaps(cr):   # the empty intervals between extruded lines (each line its width wide)
    iv = sorted((c - w / 2, c + w / 2) for c, w, _ in cr); g = []
    for (l0, h0), (l1, h1) in zip(iv, iv[1:]):
        if l1 > h0 + 1e-3: g.append((h0, l1))
    return g
# ---- roof and the socket's play: the body, cut at three places along the peg inside the robe
ay, az = 0 + db[1], A[2] + db[2]; inx = inner[0] + db[0]; outx = outer[0] + db[0]
H = float(cb.get("layer_height", .2))
zs = sorted(z for z in gb if az - R - 1.5 < z < az + 6)
cuts = []
for f in (.25, .5, .75):   # between the peg's inner end and where the robe's surface meets the axis
    x0 = inx + (outx - inx) * f * .5
    rows = []
    for z in zs:
        zc = z - H / 2   # Orca cuts mid-layer
        ys = mesh_cut(body_p, x0, zc); dg = [(ys[i], ys[i + 1]) for i in range(1, len(ys) - 1, 2)]   # the STL's empty intervals inside the robe
        dg = [g for g in dg if abs((g[0] + g[1]) / 2 - ay) < 6]
        mg = [g for g in gaps(cross(gb[z], 0, x0)) if any(g[0] < d[1] and d[0] < g[1] for d in dg)]
        rows.append((z, dg, mg, cross(gb[z], 0, x0)))
    cuts.append((x0, rows))
say("")
say(f"ROOF: the body's socket, axis at z {az - db[2]:.2f} mm (figure frame), cavity drawn vs sliced at three cuts along the peg")
roof = []
for x0, rows in cuts:
    say(f"  cut at {x0 - db[0]:.2f} mm along x (figure frame):")
    open_ = [r for r in rows if r[1]]; top = max(open_, key=lambda r: r[0]) if open_ else None
    for z, dg, mg, cr in rows:
        if not dg and not (top and z <= top[0] + 2 * H): continue
        dz = z - H / 2 - az
        say(f"    z {dz:+.2f}  drawn {' '.join(f'[{g[0] - ay:+.2f} {g[1] - ay:+.2f}]' for g in dg) or '-':30s} sliced {' '.join(f'[{g[0] - ay:+.2f} {g[1] - ay:+.2f}]' for g in mg) or 'closed'}"
            + ("" if dg else "  closed"))
    if top:
        cover = next((r for r in rows if r[0] > top[0] and not r[1]), None)
        span = max(g[1] - g[0] for g in top[1])
        def near(s, px, py):   # a segment within its half-width of a point
            dx, dy = s[2] - s[0], s[3] - s[1]; l2 = dx * dx + dy * dy or 1e-9; t = max(0, min(1, ((px - s[0]) * dx + (py - s[1]) * dy) / l2))
            return math.hypot(s[0] + t * dx - px, s[1] + t * dy - py) < s[4] / 2 + .05
        g0 = max(top[1], key=lambda g: g[1] - g[0]); pts = [g0[0] + (g0[1] - g0[0]) * f for f in (.25, .5, .75)]
        types = sorted({s[5] for s in gb[cover[0]] for py in pts if near(s, x0, py)}) if cover else []
        hits = sorted(h for h in ray_z(body_p, x0, pts[1]) if h > top[0] - H)   # the robe over the roof, from the STL: up to the next surface
        zr = (hits[1] if len(hits) > 1 else top[0]) - H / 2 if hits else top[0]
        up = [r for r in rows if r[2] and r[0] - H / 2 > az]; steep, zst = 0, 0   # above the axis: how far each layer's cavity edge steps in over the one below
        for lo_, hi_ in zip(up, up[1:]):
            g0, g1 = max(lo_[2], key=lambda g: g[1] - g[0]), max(hi_[2], key=lambda g: g[1] - g[0]); st_ = max(g1[0] - g0[0], g0[1] - g1[1])
            if st_ > steep: steep, zst = st_, hi_[0] - H / 2 - az
        roof.append((x0, top[0] - H / 2 - az, span, types, zr - top[0], steep, zst))
        say(f"    roof: the cavity's last layer at {top[0] - H / 2 - az:+.2f} mm over the axis spans {span:.2f} mm; the layer over it lays {', '.join(types) or 'nothing'} across it; {zr - top[0]:.1f} mm of robe over it")
# play: under the axis the cavity is the socket's round hole alone, radius R + play
say("")
say("PLAY: the socket's sliced half-width under the axis, against the hole drawn (STL) and the peg")
pl = []
for x0, rows in cuts:
    for z, dg, mg, cr in rows:
        dz = z - H / 2 - az
        if -R * .8 < dz < -.2 and dg and mg:
            d = min(dg, key=lambda g: abs((g[0] + g[1]) / 2 - ay)); m = min(mg, key=lambda g: abs((g[0] + g[1]) / 2 - ay))
            pl.append((x0, dz, math.hypot((d[1] - d[0]) / 2, dz), math.hypot((m[1] - m[0]) / 2, dz)))   # the hole's radius at that layer
for x0, dz, d, m in pl:
    say(f"  cut {x0 - db[0]:.1f}, z {dz:+.2f}: the hole's radius drawn {d:.3f}, sliced {m:.3f}; the peg's {R:.3f}: play drawn {d - R:.3f}, sliced {m - R:.3f} mm a side")
# ---- key: the arm, peg up; the peg's axis and the key's direction after the turn
ca_ = [inner[i] for i in range(3)]; c = rot(ca_); cx, cy = c[0] + da[0], c[1] + da[1]
kd = rot([0, 0, 1]); kn = math.hypot(kd[0], kd[1]); kx, ky = kd[0] / kn, kd[1] / kn   # the key sits on the peg's top at rest (+Z, figure frame)
po = rot(outer); zlo, zhi = min(po[2], c[2]) + da[2], max(po[2], c[2]) + da[2]
say("")
KEY = float(re.search(r"export const KEY = ([0-9.]+)", open(ROOT / "ficelle/lib/print.js").read())[1])
say(f"KEY: the arm printed peg up; the peg (r {R:.2f} mm) from z {zlo:.2f} to {zhi:.2f} on the bed, the key a {KEY} mm rib to {R + KEY:.2f} mm from its axis")
keyrows = []
for z in sorted(ga):
    if not (zlo + .1 < z < zhi + .2): continue
    segs = [s for s in ga[z] if math.hypot((s[0] + s[2]) / 2 - cx, (s[1] + s[3]) / 2 - cy) < R + 2.2]
    if not segs: continue
    def reach(dx, dy, side=.3):   # the furthest an extruded edge reaches along a direction, within side mm of it
        return max([(s[i] - cx) * dx + (s[i + 1] - cy) * dy + s[4] / 2 for s in segs for i in (0, 2) if abs(-(s[i] - cx) * dy + (s[i + 1] - cy) * dx) < side] or [0])
    kr = reach(kx, ky, .8); sr = [reach(math.cos(t), math.sin(t)) for t in (math.atan2(ky, kx) + math.pi / 2, math.atan2(ky, kx) + math.pi, math.atan2(ky, kx) - math.pi / 2)]
    def chord(f):   # a chord across the rib, f of the way out from the peg's surface: the lines it meets, and the widest void between them
        mx, my = cx + kx * (R + KEY * f), cy + ky * (R + KEY * f); ty, iv = [], []
        for s in segs:
            p0 = ((s[0] - mx) * kx + (s[1] - my) * ky, -(s[0] - mx) * ky + (s[1] - my) * kx); p1 = ((s[2] - mx) * kx + (s[3] - my) * ky, -(s[2] - mx) * ky + (s[3] - my) * kx)
            if p0[0] * p1[0] < 0:
                t = -p0[0] / (p1[0] - p0[0]); w = p0[1] + t * (p1[1] - p0[1])
                if abs(w) < KEY: ty.append(s[5]); iv.append((w - s[4] / 2, w + s[4] / 2))
        iv.sort(); void = max([b[0] - a[1] for a, b in zip(iv, iv[1:])] + [0])
        return ty, void
    ch = [chord(f) for f in (.25, .5, .75)]; ty = [t for c in ch for t in c[0]]
    iv = []   # down the rib's centre line, from the peg's surface to the key's tip: the stretches a line covers (a line's end is round, half its width)
    for s in segs:
        p0 = ((s[0] - cx) * kx + (s[1] - cy) * ky, -(s[0] - cx) * ky + (s[1] - cy) * kx); p1 = ((s[2] - cx) * kx + (s[3] - cy) * ky, -(s[2] - cx) * ky + (s[3] - cy) * kx)
        if abs(p0[1]) < .05 and abs(p1[1]) < .05: iv.append((min(p0[0], p1[0]) - s[4] / 2, max(p0[0], p1[0]) + s[4] / 2))
        elif p0[1] * p1[1] < 0: t = -p0[1] / (p1[1] - p0[1]); r_ = p0[0] + t * (p1[0] - p0[0]); iv.append((r_ - s[4] / 2, r_ + s[4] / 2))
    iv = sorted(v for v in iv if v[1] > R and v[0] < R + KEY); reach_, void = R, 0
    for lo_, hi_ in iv: void = max(void, lo_ - reach_); reach_ = max(reach_, hi_)
    void = max(void, R + KEY - reach_); n = len(ch[0][0])
    keyrows.append((z, kr, sr, n, ty, [len(c[0]) for c in ch], void))
for z, kr, sr, n, ty, cs, void in keyrows:
    say(f"  z {z:5.2f}: key reaches {kr:.2f} mm (drawn {R + KEY:.2f}), peg elsewhere {min(sr):.2f}-{max(sr):.2f} mm (drawn {R:.2f}); lines across the rib at 1/4, 1/2, 3/4 out: {cs}, unfilled down its centre {void:.2f} mm ({', '.join(sorted(set(ty)))})")
# ---- verdicts
say("")
klines = [r for r in keyrows if r[1] > R + KEY * .75]   # the layers the key is drawn in (it runs only inside the robe)
k_ok = klines and min(r[5][0] for r in klines) >= 3 and max(r[6] for r in klines) < .1
say(f"CHECK key: {'ok' if k_ok else 'FAIL'}: {len(klines)} of the peg's {len(keyrows)} layers carry the rib, out to {min((r[1] for r in klines), default=0):.2f}+ mm, {min((r[5][0] for r in klines), default=0)} or more lines across it a quarter out (wanted 3: wall, bead, wall), at most {max((r[6] for r in klines), default=0):.2f} mm of its centre line unfilled (wanted under 0.1: the bead runs to the tip's wall)")
say(f"CHECK roof: " + "; ".join(f"cut {x0 - db[0]:.1f}: top {t:+.2f} mm, steepest step {st:.2f} mm a layer ({math.degrees(math.atan2(st, H)):.0f} degrees, at {zs:+.2f}), {s:.2f} mm bridged by {', '.join(ty) or '?'}, {wr:.1f} mm of robe over it" for x0, t, s, ty, wr, st, zs in roof))
dp = [d - R for _, _, d, m in pl]; mp = [m - R for _, _, d, m in pl]
say(f"CHECK play: drawn {min(dp, default=0):.3f}-{max(dp, default=0):.3f}, sliced {min(mp, default=0):.3f}-{max(mp, default=0):.3f} mm a side under the axis")
open(out / "report.txt", "w").write("\n".join(rep) + "\n")

# ---- the picture
from PIL import Image, ImageDraw, ImageFont
COL = {"Outer wall": (200, 40, 40), "Inner wall": (230, 150, 40), "Overhang wall": (150, 40, 200), "Sparse infill": (120, 120, 120), "Internal solid infill": (60, 120, 200),
       "Bridge": (20, 170, 90), "Top surface": (230, 60, 160), "Bottom surface": (60, 60, 200), "Gap infill": (40, 40, 40)}
col = lambda t: COL.get(t, (90, 90, 90))
try: font = ImageFont.truetype(os.popen("fc-match -f %{file} DejaVuSans").read() or "DejaVuSans.ttf", 18)
except OSError: font = ImageFont.load_default()
S = 60   # px a mm
def panel_cut(x0, rows, title):   # the body cut down the peg: each layer a band, the extruded lines crossing x0, the STL's edges in black
    S2 = 2 * S; w, h = int(9 * S2), int(8.5 * S2); im = Image.new("RGB", (w, h + 30), (245, 242, 235)); d = ImageDraw.Draw(im); d.text((8, 4), title, fill=(20, 20, 20), font=font)
    P = lambda y, z: (w / 2 + (y - ay) * S2, 30 + h * .6 - (z - az) * S2)
    for z, dg, mg, cr in rows:
        for cc, lw, ty in cr:
            if abs(cc - ay) < 6: x_, y_ = P(cc - lw / 2, z); x2, y2 = P(cc + lw / 2, z - H); d.rectangle([x_, y_, x2, y2], fill=col(ty))
        for q in gb[z]:   # lines lying in the cut (a bridge runs across the socket, along the plane): drawn over their length
            if abs(q[0] - x0) < q[4] / 2 and abs(q[2] - x0) < q[4] / 2:
                y0_, y1_ = sorted((q[1], q[3])); x_, y_ = P(y0_ - q[4] / 2, z); x2, y2 = P(y1_ + q[4] / 2, z - H); d.rectangle([x_, y_, x2, y2], fill=col(q[5]))
        for ys in [mesh_cut(body_p, x0, z - H / 2)]:
            for yy in ys:
                if abs(yy - ay) < 6: px, pz = P(yy, z - H / 2); d.ellipse([px - 4, pz - 4, px + 4, pz + 4], fill=(0, 0, 0))
    cx_, cz_ = P(ay, az); d.ellipse([cx_ - R * S2, cz_ - R * S2, cx_ + R * S2, cz_ + R * S2], outline=(0, 90, 255), width=3)   # the peg at rest
    kx0, kz0 = P(ay - KEY / 2, az + R + KEY); kx1, kz1 = P(ay + KEY / 2, az + R - .2); d.rectangle([kx0, kz0, kx1, kz1], outline=(0, 90, 255), width=3)
    return im
def panel_top(layers, zsel, cxy, title, rad=5.5, mark=None):   # layers seen from above, around a point, side by side
    n = len(zsel); w = int(2 * rad * S); im = Image.new("RGB", (w * n, w + 60), (245, 242, 235)); d = ImageDraw.Draw(im); d.text((8, 4), title, fill=(20, 20, 20), font=font)
    for i, z in enumerate(zsel):
        P = lambda x, y: (i * w + w / 2 + (x - cxy[0]) * S, 60 + w / 2 - (y - cxy[1]) * S)
        d.text((i * w + 8, 32), f"z {z:.2f}", fill=(20, 20, 20), font=font)
        for s in layers.get(z, []):
            if math.hypot(s[0] - cxy[0], s[1] - cxy[1]) < rad * 1.5: d.line([P(s[0], s[1]), P(s[2], s[3])], fill=col(s[5]), width=max(1, int(s[4] * S)))
        if mark: mark(d, P)
        d.line([(i * w, 60), (i * w, 60 + w)], fill=(180, 180, 180))
    return im
ims = [panel_cut(x0, rows, f"Body cut across the peg at x {x0 - db[0]:.1f} mm: each layer's lines (bands), the STL's surface (dots), the peg and key at rest (blue)") for x0, rows in cuts[1:2]]
zb = [z for z in sorted(gb) if az - .4 < z < az + 3.6][::3][:6]
ims.append(panel_top(gb, zb, ((inx + outx) / 2, ay), "Body, layers through the socket and groove, from above (peg axis left-right)", rad=5))
zk = [r[0] for r in keyrows][1::max(1, len(keyrows) // 5)][:5]
def ring(d, P):
    x0, y0 = P(cx - R, cy + R); x1, y1 = P(cx + R, cy - R); d.ellipse([x0, y0, x1, y1], outline=(0, 90, 255), width=1)
ims.append(panel_top(ga, zk, (cx, cy), "Arm printed peg up, layers through the peg: the key is the rib (blue: the peg drawn)", rad=3.5, mark=ring))
leg = Image.new("RGB", (max(i.width for i in ims), 40), (245, 242, 235)); dl = ImageDraw.Draw(leg); x = 8
for k, v in COL.items(): dl.rectangle([x, 12, x + 20, 30], fill=v); dl.text((x + 26, 10), k, fill=(20, 20, 20), font=font); x += 40 + int(font.getlength(k))
W = max(i.width for i in ims); sheet = Image.new("RGB", (W, sum(i.height for i in ims) + leg.height), (245, 242, 235)); y = 0
for i in ims + [leg]: sheet.paste(i, (0, y)); y += i.height
sheet.save(out / "slice.png"); print(out / "slice.png")
