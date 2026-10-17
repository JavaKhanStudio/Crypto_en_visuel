#!/usr/bin/env python3
"""The odds that the Eye catches a rider, as a real browser at 60 fps plays it
(headless runs slow, so beam_ride.py over-counts captures). For 360 launch moments
across one swing of the gaze, steps a rider along the road at the demo's speed and
checks world.inBeam() at torso height. An optional JSON argument overrides BEAM,
e.g. '{"radius": 4}'. Serve the repo first (python3 -m http.server 8793)."""
import json, sys
from playwright.sync_api import sync_playwright
JS = """(opts) => {
  const w = demo.world, B = w.BEAM, saved = { ...B }; Object.assign(B, opts);
  const path = w.road.path, len = path.getLength(), speed = demo.sim.speed, dt = 1 / 60, period = 2 * Math.PI / B.swing;
  const res = {};
  for (const dir of [1, -1]) {
    let caught = 0;
    for (let k = 0; k < 360; k++) {
      let u = dir > 0 ? 0 : 1, t = k / 360 * period;
      while (dir > 0 ? u < 1 : u > 0) {
        w.aimBeam(w.gaze(t));
        const p = path.getPointAt(Math.min(1, Math.max(0, u))).clone(); p.y += 3;
        if (w.inBeam(p)) { caught++; break; }
        u += dir * speed * dt / len; t += dt;
      }
    }
    res[dir > 0 ? 'Arnaud -> Bastien' : 'Bastien -> Arnaud'] = caught / 360;
  }
  Object.assign(B, saved);
  return res;
}"""
opts = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page()
    pg.goto("http://localhost:8793/index.html#story=4", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    print(opts or "as shipped", {k: f"{v:.0%}" for k, v in pg.evaluate(JS, opts).items()})
    b.close()
