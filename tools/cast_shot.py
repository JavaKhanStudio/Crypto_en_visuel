#!/usr/bin/env python3
"""r330: shoots lab/cast/ (lib/cast.js, one row per disguise, today's copies on top) full page.
    tools/cast_shot.py out/cast.png [--turn 0.45] [--width 1440] [--base http://localhost:8793/]"""
import argparse
from playwright.sync_api import sync_playwright
ap = argparse.ArgumentParser(); ap.add_argument("out"); ap.add_argument("--turn", default=".45")
ap.add_argument("--width", type=int, default=1440); ap.add_argument("--base", default="http://localhost:8793/")
a = ap.parse_args()
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": a.width, "height": 900})
    errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{a.base}lab/cast/?turn={a.turn}", wait_until="load")
    pg.wait_for_function("window.labReady === true", timeout=60000); pg.wait_for_timeout(500)
    pg.screenshot(path=a.out, full_page=True)
    print(a.out, "errors:", errors or "none")
    b.close()
