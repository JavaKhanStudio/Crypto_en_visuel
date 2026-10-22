#!/usr/bin/env python3
"""r425: contact sheets of lab/doors/, the candidate windows of the Middle-earth castles. For each castle a still of
it with its candidates tagged (A1-A3, B1-B3), then for each candidate the zoom held at fixed points of its path
(demo.pose(id, k): 0 the castle shot, 1 the glass; the veil rises from .6), so the sheet is the same on any GPU.
One sheet per size: <out>-<w>.png. Serve the repo first (python3 -m http.server 8793).

    tools/doors_shots.py out/r425/doors [--base URL] [--ks 0,.45,.6,.7,.8]
"""
import argparse, io, os, sys
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from browser import launch

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--ks", default="0,.45,.6,.7,.8")
ap.add_argument("--sizes", default="1440x860,390x844")
a = ap.parse_args()
os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
ks = [float(k) for k in a.ks.split(",")]
errors = []
with sync_playwright() as p:
    b = launch(p)
    for size in a.sizes.split(","):
        w, h = map(int, size.split("x"))
        pg = b.new_page(viewport={"width": w, "height": h})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{a.base}lab/doors/", wait_until="load")
        pg.wait_for_function("window.demo && demo.ready", timeout=60000)
        ids = pg.evaluate("[...document.querySelectorAll('button[data-id]')].map(b => [b.dataset.id, b.textContent])")
        rows = []
        for team in "ab":
            pg.evaluate(f"demo.look('{team}')"); pg.wait_for_timeout(1500)
            rows.append((f"{'Alice' if team == 'a' else 'Bob'}: the candidates", [Image.open(io.BytesIO(pg.screenshot())).convert("RGB")]))
        for id_, label in ids:
            shots = []
            for k in ks:
                pg.evaluate(f"demo.pose('{id_}', {k})"); pg.wait_for_timeout(700)
                shots.append(Image.open(io.BytesIO(pg.screenshot())).convert("RGB"))
            rows.append((f"{'A' if id_[0] == 'a' else 'B'}{label}   (k = {a.ks})", shots))
        pg.close()
        s = 320 / h if w > h else 360 / h
        tw, th = int(w * s), int(h * s)
        n = max(len(r[1]) for r in rows)
        sheet = Image.new("RGB", (tw * n, (th + 24) * len(rows)), (16, 18, 30))
        d = ImageDraw.Draw(sheet)
        for i, (title, shots) in enumerate(rows):
            d.text((6, i * (th + 24) + 6), title, fill=(232, 184, 74))
            for j, im in enumerate(shots): sheet.paste(im.resize((tw, th)), (j * tw, i * (th + 24) + 24))
        name = f"{a.out}-{w}.png"; sheet.save(name); print(name)
    b.close()
print("page errors:", errors or "none")
