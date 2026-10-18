#!/usr/bin/env python3
"""Search a camera for garde/'s 'chart' shot (r57): Eve's chart whole, above the story panel and left
of the corner card, and the board's title either off screen or clear of the top bar, at 1200x720
and 1440x860. A pinhole model of the page's camera (fov 45, lookAt); prints the best candidates.

    python3 tools/garde_chart_shot.py
"""
import itertools, math

def sub(a, b): return [a[i] - b[i] for i in range(3)]
def cross(a, b): return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
def dot(a, b): return sum(a[i]*b[i] for i in range(3))
def norm(a): l = math.sqrt(dot(a, a)); return [x / l for x in a]

def project(pos, tgt, p, W, H):
    f = norm(sub(tgt, pos)); r = norm(cross(f, [0, 1, 0])); u = cross(r, f)
    d = sub(p, pos); z = dot(d, f)
    if z <= 0: return None
    k = 1 / math.tan(math.radians(22.5))
    return (W / 2 + dot(d, r) / z * k * H / 2, H / 2 - dot(d, u) / z * k * H / 2)

# the chart face: 24 x 14 at (-36, 23, -6.15), turned .12 rad about y (world.js, props.js)
cx, cz, a = -36, -6 + .35, .12
chart = [(cx + s * 12 * math.cos(a), y, cz - s * 12 * math.sin(a)) for s in (-1, 1) for y in (16, 30)]
# the board's title: from the board's left edge 2 % in, about 26 units long, 2 tall (board 80 x 25 at y 36)
title = [(x, y, -23.6) for x in (-38.4, -12) for y in (45.7, 47.8)]
SIZES = {(1200, 720): (422, 805), (1440, 860): (562, 1045)}   # story panel top, corner card left

def score(pos, tgt):
    worst = 1e9
    for (W, H), (panel, card) in SIZES.items():
        c = [project(pos, tgt, p, W, H) for p in chart]
        if None in c: return None
        xs, ys = [q[0] for q in c], [q[1] for q in c]
        if min(xs) < 12 or max(xs) > card - 12 or min(ys) < 100 or max(ys) > panel - 8: return None
        t = [project(pos, tgt, p, W, H) for p in title]
        if None not in t:
            ty = [q[1] for q in t]
            if max(ty) > 0 and min(ty) < 96: return None          # the title would sit under the top bar
        worst = min(worst, max(xs) - min(xs))
    return worst

best = []
for px, py, pz, tx, ty in itertools.product(range(-50, -19, 2), range(18, 61, 2), range(20, 81, 2), range(-44, -27, 2), range(10, 41, 2)):
    pos, tgt = (px, py, pz), (tx, ty, -6)
    if (py - ty) > .36 * (pz + 6): continue                         # no steeper than ~20° down: the chart stands upright
    s = score(pos, tgt)
    if s: best.append((s, pos, tgt))
best.sort(reverse=True)
for s, pos, tgt in best[:12]: print(f"{s:6.0f}px wide  pos {pos}  target {tgt}")
