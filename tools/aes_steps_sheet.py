#!/usr/bin/env python3
"""Every story step of « AES de l'intérieur » (r335) at one size, ?instant=1, as one contact sheet:
out/aes-sheet-<w>x<h>-<lang>.png (and each step as out/aes-step-<n>.png). Serve the repo first.
    tools/aes_steps_sheet.py [390x844] [fr|en] [first-last]"""
import sys
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
from PIL import Image

size = sys.argv[1] if len(sys.argv) > 1 else "390x844"; lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
a, z = map(int, (sys.argv[3] if len(sys.argv) > 3 else "1-13").split("-"))
w, h = map(int, size.split("x"))
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": w, "height": h}); errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"http://localhost:8793/aes-interieur/?instant=1&lang={lang}#story={a}", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    shots = []
    for i in range(a, z + 1):
        pg.evaluate(f"demo.story.go({i - 1})"); pg.wait_for_timeout(1200)
        path = f"out/aes-step-{i}.png"; pg.screenshot(path=path); shots.append(path)
    k = 1.5 if w < 900 else 3.5
    ims = [Image.open(s).resize((int(w / k), int(h / k))) for s in shots]
    cols = min(7, len(ims)); sheet = Image.new("RGB", (ims[0].width * cols, ims[0].height * ((len(ims) + cols - 1) // cols)))
    for n, im in enumerate(ims): sheet.paste(im, (im.width * (n % cols), im.height * (n // cols)))
    out = f"out/aes-sheet-{w}x{h}-{lang}.png"; sheet.save(out); print(out, "errors:", errors or "none")
    b.close()
