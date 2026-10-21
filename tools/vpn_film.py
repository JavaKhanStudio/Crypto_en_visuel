#!/usr/bin/env python3
"""r360: film one story step of Le tunnel (vpn/) while its animation plays, as a contact sheet.

Serve the repo first (python3 -m http.server 8793), then:
    tools/vpn_film.py out/r360/s8 --step 8                  # -> out/r360/s8.png, 8 frames after Play
    tools/vpn_film.py out/r360/s12 --step 12 --frames 12 --every 700 --size 390x844 --lang en
Runs headless on the real GPU (ANGLE over EGL), so the animation plays near true speed; no window opens.
"""
import argparse, pathlib
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--step", type=int, required=True)
ap.add_argument("--lang", default="fr")
ap.add_argument("--size", default="1440x860")
ap.add_argument("--frames", type=int, default=8)
ap.add_argument("--every", type=int, default=600, help="ms between frames")
ap.add_argument("--settle", type=int, default=2600, help="ms after load before Play (the camera's flight)")
ap.add_argument("--cols", type=int, default=4)
a = ap.parse_args()
w, h = map(int, a.size.split("x"))
out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
shots = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": w, "height": h})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{a.base}vpn/?lang={a.lang}#story={a.step}", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(a.settle)
    shot = lambda i: (pg.screenshot(path=f"{a.out}-{i:02d}.png"), shots.append(f"{a.out}-{i:02d}.png"))
    shot(0)
    if pg.query_selector("#play"):
        pg.click("#play")
    for i in range(1, a.frames):
        pg.wait_for_timeout(a.every)
        shot(i)
    b.close()
ims = [Image.open(s).convert("RGB") for s in shots]
tw = 720 if w > h else 300
th = round(tw * h / w)
rows = -(-len(ims) // a.cols)
sheet = Image.new("RGB", (a.cols * tw, rows * th), "black")
for i, im in enumerate(ims):
    x, y = i % a.cols * tw, i // a.cols * th
    sheet.paste(im.resize((tw, th)), (x, y))
    ImageDraw.Draw(sheet).text((x + 6, y + 4), f"step {a.step} +{i * a.every if i else 0} ms" if i else f"step {a.step} before Play", fill="yellow")
sheet.save(f"{a.out}.png")
print(f"{a.out}.png", "errors:", errors or "none")
