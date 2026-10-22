#!/usr/bin/env python3
"""Shoot tools/assets.html headless: a grid of the riders and guard at several gallop
times and yaws, so a part that misbehaves shows up frame by frame. Serve the repo root
first (python3 -m http.server 8793).

    tools/shoot_assets.py out/assets            # -> out/assets.png
    tools/shoot_assets.py out/rider --only 'rider A'
"""
import argparse
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("out"); ap.add_argument("--only", default="")
ap.add_argument("--times", default="0,0.065,0.13,0.2"); ap.add_argument("--yaws", default="0,1.57,0.6")
a = ap.parse_args()
times, yaws = [float(x) for x in a.times.split(",")], [float(x) for x in a.yaws.split(",")]
W, H = 900, 420
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": W, "height": H})
    errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
    grid = Image.new("RGB", (W * len(times), H * len(yaws)))
    for j, yaw in enumerate(yaws):
        for i, tm in enumerate(times):
            only = f"&only={a.only}" if a.only else ""
            pg.goto(f"http://localhost:8793/tools/assets.html?freeze={tm}&yaw={yaw}{only}", wait_until="load")
            pg.wait_for_function("window.lab && window.lab.ready", timeout=60000); pg.wait_for_timeout(400)
            pg.screenshot(path="/tmp/_asset.png"); grid.paste(Image.open("/tmp/_asset.png"), (i * W, j * H))
    grid.save(a.out + ".png")
    print(a.out + ".png", "errors:", errors or "none")
    b.close()
