#!/usr/bin/env python3
"""r207: shoots lab/shapes/ (three.js beside Godot) and writes, per item, a side-by-side PNG of the two
600×600 pictures and the mean colour difference over the pixels both draw as the item (not background).
Serve the repo root on 8793 first.    tools/godot_bridge/lab_shot.py out/r207"""
import io, sys
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

out = sys.argv[1] if len(sys.argv) > 1 else "out/r207"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=angle", "--use-angle=gl-egl", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1300, "height": 900}); errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto("http://localhost:8793/lab/shapes/"); pg.wait_for_function("window.labReady === 3", timeout=30000)
    for item in pg.evaluate("[...document.querySelectorAll('figcaption')].filter(f => f.textContent.startsWith('Godot')).map(f => f.textContent.split(' · ')[1])"):
        k = pg.evaluate(f"[...document.querySelectorAll('img')].findIndex(i => i.getAttribute('src') === '{item}-godot.png')")
        url = pg.evaluate(f"document.querySelectorAll('canvas')[{k}].toDataURL('image/png')")
        import base64
        three = Image.open(io.BytesIO(base64.b64decode(url.split(",")[1]))).convert("RGB")
        godot = Image.open(f"lab/shapes/{item}-godot.png").convert("RGB")
        bg = godot.getpixel((2, 2))
        diff = ImageChops.difference(three, godot)
        mask = [i for i, px in enumerate(godot.get_flattened_data()) if sum(abs(a - c) for a, c in zip(px, bg)) > 12]
        d = list(diff.get_flattened_data()); mean = sum(sum(d[i]) / 3 for i in mask) / max(len(mask), 1)
        side = Image.new("RGB", (1210, 600), (11, 13, 18)); side.paste(three, (0, 0)); side.paste(godot, (610, 0))
        side.save(f"{out}/{item}-side.png")
        print(f"{item}: mean |three - godot| over the item = {mean:.1f}/255 ({len(mask)} px)  {out}/{item}-side.png")
    pg.screenshot(path=f"{out}/lab-page.png", full_page=True)
    print("errors:", errors or "none")
    b.close()
