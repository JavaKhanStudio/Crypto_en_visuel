#!/usr/bin/env python3
"""r394: shoots lab/print/ showing one asset (?show=<id>), the preview pane only, optionally zoomed in.
Before/after a change to lib/print.js: serve the old tree on another port and pass --base.
    tools/print_shot.py out/x.png --asset castle-b [--ep deux-generaux] [--zoom 1] [--base http://localhost:8793/]"""
import argparse
from playwright.sync_api import sync_playwright
ap = argparse.ArgumentParser(); ap.add_argument("out"); ap.add_argument("--asset", required=True)
ap.add_argument("--ep", default="deux-generaux"); ap.add_argument("--zoom", type=float, default=1)
ap.add_argument("--base", default="http://localhost:8793/")
a = ap.parse_args()
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 1400, "height": 860})
    errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{a.base}lab/print/?ep={a.ep}&show={a.asset}")
    pg.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
    if a.zoom != 1:   # the wheel zooms the orbit camera towards its target
        box = pg.locator("#view canvas").bounding_box(); pg.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        for _ in range(int(a.zoom)): pg.mouse.wheel(0, -300); pg.wait_for_timeout(120)
    pg.wait_for_timeout(800)
    pg.locator("#view").screenshot(path=a.out)
    print(a.out, "errors:", errors or "none")
    b.close()
