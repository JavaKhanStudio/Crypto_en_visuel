#!/usr/bin/env python3
"""Shoots the VPN episode's map from above, the UI hidden: where the roads, buildings and houses
stand against each other (r197: a house in the middle of the road). Serve the repo root on 8793.

    tools/vpn_aerial.py out/name [x y z tx ty tz]   (default: straight down over the whole map)
"""
import sys
from playwright.sync_api import sync_playwright

out = sys.argv[1]
cam = [float(a) for a in sys.argv[2:8]] if len(sys.argv) >= 8 else [-6, 95, -14.9, -6, 0, -15]
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=angle", "--use-angle=gl-egl", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1440, "height": 900}); errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto("http://localhost:8793/vpn/?instant=1#story=1", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(2500)
    pg.evaluate("""c => { const d = window.demo, T = d.THREE;
      document.querySelectorAll('body > *:not(canvas)').forEach(e => { if (!e.querySelector('canvas')) e.style.visibility = 'hidden'; });
      d.rig.jump({ pos: new T.Vector3(c[0], c[1], c[2]), target: new T.Vector3(c[3], c[4], c[5]) }); }""", cam)
    pg.wait_for_timeout(800)
    pg.screenshot(path=out + ".png")
    print(out + ".png", "errors:", errors or "none")
    b.close()
