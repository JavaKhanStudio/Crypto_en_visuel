#!/usr/bin/env python3
"""r645: shoots lab/riders/ (the saga's riders and guards today vs built from lib/cast.js) at each distance.
    tools/riders_shot.py <out-dir> [--base http://127.0.0.1:8793/] [--width 1440] [--height 900]"""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from browser import launch
ap = argparse.ArgumentParser(); ap.add_argument("out"); ap.add_argument("--base", default="http://127.0.0.1:8793/")
ap.add_argument("--width", type=int, default=1440); ap.add_argument("--height", type=int, default=900)
a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
with sync_playwright() as p:
    b = launch(p); pg = b.new_page(viewport={"width": a.width, "height": a.height})
    errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
    for name, d, turn, x in [("all", 15, 0, 0), ("today", 4, .5, -22), ("messenger", 4, .5, 0), ("general", 4, .5, 22), ("valley", 70, .3, 0), ("both", 140, .3, 0)]:
        pg.goto(f"{a.base}lab/riders/?d={d}&turn={turn}&x={x}&still=1"); pg.wait_for_function("window.labReady === true"); pg.wait_for_timeout(800)
        out = os.path.join(a.out, f"riders-{name}-{a.width}.png"); pg.screenshot(path=out); print(out)
    print("errors:", errors or "none"); b.close()
