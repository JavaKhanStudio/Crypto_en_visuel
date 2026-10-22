#!/usr/bin/env python3
"""The Eye's gaze held still where it crosses the road (r415): shoots the red spot on the road,
close and from the valley, so a spot under the road or in the wrong place shows.
Serve the repo first (python3 -m http.server 8793).

    tools/beam_shot.py out/r415/after            # -> out/r415/after-<view>.png
    tools/beam_shot.py out/r415/x --base http://localhost:8794/
"""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from browser import launch

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--size", default="1440x860")
a = ap.parse_args()
W, H = map(int, a.size.split("x"))

# hold the gaze at angle A (radians about +y, 0 = toward the gate) and the camera at a shot
HOLD = """([A, pos, target]) => {
  const w = demo.world, up = w.update;
  if (!w._held) { w._held = true; w.update = (dt, t) => { up(dt, t); w.aimBeam(w._A); }; }
  w._A = A; w.aimBeam(A);
  demo.rig.jump({ pos: new demo.THREE.Vector3(...pos), target: new demo.THREE.Vector3(...target) });
}"""
# where the gaze's centre circle crosses the road: angles a with |road(a)| = reach
CROSS = """() => {
  const w = demo.world, R = w.BEAM.reach, pts = w.road.path.getSpacedPoints(800), out = [];
  for (let i = 1; i < pts.length; i++) {
    const d0 = Math.hypot(pts[i - 1].x, pts[i - 1].z) - R, d1 = Math.hypot(pts[i].x, pts[i].z) - R;
    if (d0 * d1 <= 0) out.push([pts[i].x, pts[i].y, pts[i].z, Math.atan2(pts[i].x, pts[i].z)]);
  }
  return out;
}"""
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": W, "height": H})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(a.base + "deux-generaux/?instant=1#story=4", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(1500)
    cross = pg.evaluate(CROSS)
    print("gaze centre crosses the road at", [(round(x, 1), round(z, 1)) for x, _, z, _ in cross])
    x, y, z, ang = cross[-1] if cross else (0, 0, 36, 0)
    views = {
        "close": ([x + 10, y + 12, z + 16], [x, y, z]),
        "valley": ([0, 22, 70], [x * .6, 4, z * .7]),
        "front": ([0, 14, 52], [0, 2, 33]),
    }
    for name, (pos, tgt) in views.items():
        A = 0 if name == "front" else ang
        pg.evaluate(HOLD, [A, pos, tgt])
        pg.wait_for_timeout(1200)
        pg.screenshot(path=f"{a.out}-{name}.png")
        print(f"{a.out}-{name}.png")
    print("errors:", errors or "none")
    b.close()
