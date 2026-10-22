#!/usr/bin/env python3
"""Where the searchlight can catch a rider: for each point along the road, the share of
one sweep during which world.inBeam() holds at torso height. Serve the repo first
(python3 -m http.server 8793). Prints a strip, '#' = lit at some angle, and the overall share."""
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
JS = """() => {
  const w = demo.world, out = [];
  for (let i = 0; i <= 60; i++) {
    const p = w.road.path.getPointAt(i / 60).clone(); p.y += 3;
    let hit = 0;
    for (let k = 0; k < 360; k++) { w.aimBeam(k / 360 * Math.PI * 2); if (w.inBeam(p)) hit++; }
    out.push(hit / 360);
  }
  return out;
}"""
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page()
    pg.goto("http://localhost:8793/deux-generaux/index.html#story=4", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    r = pg.evaluate(JS)
    print("".join("#" if x > 0 else "." for x in r))
    print(" ".join(f"{x:.2f}" for x in r))
    b.close()
