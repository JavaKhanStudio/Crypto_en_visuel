#!/usr/bin/env python3
"""A room step's folded text on a phone (r368, Simon's pick A): the step folded, then opened by
« Lire la suite ▾ », side by side, with page errors. Serve the repo first (python3 -m http.server 8793).

    tools/fold_shot.py out/r368/fold-en --page paquet-complet/ --step 10 --lang en
"""
import argparse
from playwright.sync_api import sync_playwright
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="paquet-complet/")
ap.add_argument("--step", type=int, required=True)
ap.add_argument("--lang", default="fr")
ap.add_argument("--size", default="390x844")
a = ap.parse_args()
w, h = map(int, a.size.split("x"))
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": w, "height": h}, is_mobile=True, has_touch=True)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{a.base}{a.page}?instant=1&lang={a.lang}#story={a.step}")
    pg.wait_for_function("window.demo && demo.ready && demo.inside.active", timeout=60000)
    pg.wait_for_timeout(5000)
    pg.screenshot(path=a.out + "-folded.png")
    pg.click("#step-more"); pg.wait_for_timeout(3000)
    pg.screenshot(path=a.out + "-open.png")
    b.close()
sheet = Image.new("RGB", (2 * w, h))
for i, s in enumerate(["folded", "open"]):
    sheet.paste(Image.open(f"{a.out}-{s}.png").convert("RGB"), (i * w, 0))
sheet.save(a.out + ".png")
print(a.out + ".png", "errors:", errors or "none")
