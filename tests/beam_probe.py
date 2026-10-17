#!/usr/bin/env python3
"""Where the searchlight can catch a rider: for each point along the road, the share of
one sweep during which world.inBeam() holds at torso height. Serve the repo first
(python3 -m http.server 8793). Prints a strip, '#' = lit at some angle, and the overall share."""
from playwright.sync_api import sync_playwright
JS = """() => {
  const w = demo.world, piv = w.city.userData.pivot, out = [];
  const saved = piv.rotation.y;
  for (let i = 0; i <= 60; i++) {
    const p = w.road.path.getPointAt(i / 60).clone(); p.y += 3;
    let hit = 0;
    for (let k = 0; k < 360; k++) { piv.rotation.y = k / 360 * Math.PI * 2; if (w.inBeam(p)) hit++; }
    out.push(hit / 360);
  }
  piv.rotation.y = saved;
  return out;
}"""
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page()
    pg.goto("http://localhost:8793/index.html#story=4", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    r = pg.evaluate(JS)
    print("".join("#" if x > 0 else "." for x in r))
    print(" ".join(f"{x:.2f}" for x in r))
    b.close()
