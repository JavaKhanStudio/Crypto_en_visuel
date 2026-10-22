#!/usr/bin/env python3
"""Stills of a castle room (r103) at chosen seconds of a beat, and a contact sheet: the room's clock is
held (demo.inside.hold) so each shot is the pose at that second and the camera on its framing, the
way a reader sees it once the camera has caught up. Needs the episode's inside.js to honour `hold`
(cle-vallee, r160). Serve the repo first (python3 -m http.server 8793).

    tools/room_stills.py out/r160/fr-390 --page cle-vallee/ --step 7 --at 1,3,5,8,10.5,12,14,17,19 --size 390x844
"""
import argparse, time
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="cle-vallee/")
ap.add_argument("--step", type=int, required=True, help="1-based, a step inside the room")
ap.add_argument("--at", default="1,4,8,12,16,20")
ap.add_argument("--lang", default="fr")
ap.add_argument("--size", default="1440x860")
ap.add_argument("--settle", type=int, default=1800)
a = ap.parse_args()
w, h = map(int, a.size.split("x"))
errors, shots = [], []
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": w, "height": h}, is_mobile=w < 900, has_touch=w < 900)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{a.base}{a.page}?instant=1&lang={a.lang}#story={a.step}")
    pg.wait_for_function("window.demo && demo.ready && demo.inside.active", timeout=60000)
    pg.add_style_tag(content=".bubble { transition: none !important; }")
    pg.wait_for_timeout(2500)
    for s in [float(x) for x in a.at.split(",")]:
        pg.evaluate(f"demo.inside.hold = {s}")
        pg.wait_for_timeout(a.settle)
        f = f"{a.out}-{s:05.1f}s.png"; pg.screenshot(path=f); shots.append((f, s))
    b.close()
cols = 3 if w < h else 2
tw = w // 2 if w < h else w // 2
th = round(tw * h / w)
sheet = Image.new("RGB", (cols * tw, -(-len(shots) // cols) * th))
for i, (f, s) in enumerate(shots):
    x, y = i % cols * tw, i // cols * th
    sheet.paste(Image.open(f).convert("RGB").resize((tw, th)), (x, y))
    ImageDraw.Draw(sheet).text((x + 6, y + 4), f"{s:.1f} s", fill="yellow")
sheet.save(a.out + ".png")
print(a.out + ".png", "errors:", errors or "none")
