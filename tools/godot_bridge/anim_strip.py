#!/usr/bin/env python3
"""r218: a filmstrip of lab/shapes/ animated by lib/shapes.js animate(), frames at exact times (window.labAt),
to set beside Shadow's own tools/filmstrip.sh of ItemView (same times). Serve the repo root on 8793 first.
    tools/godot_bridge/anim_strip.py out/r218 [item=server_rack] [cycle=1.2] [count=8] [crop=x0,y0,x1,y1]
crop (in the 600x600 picture) zooms on the moving parts; each frame's mean change from the one before,
over the crop, is printed: all zero would mean nothing moves."""
import base64, io, sys
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

out, item = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else "server_rack")
crop = tuple(int(v) for v in sys.argv[5].split(',')) if len(sys.argv) > 5 else (0, 0, 600, 600)
cycle, count = float(sys.argv[3]) if len(sys.argv) > 3 else 1.2, int(sys.argv[4]) if len(sys.argv) > 4 else 8
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=angle", "--use-angle=gl-egl", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1300, "height": 900}); errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto("http://localhost:8793/lab/shapes/?t=0"); pg.wait_for_function("window.labReady === 3", timeout=30000)
    k = pg.evaluate(f"[...document.querySelectorAll('img')].findIndex(i => i.getAttribute('src') === '{item}-godot.png')")
    tiles, prev = [], None
    from PIL import ImageChops, ImageStat
    for i in range(count):
        t = i * cycle / count
        url = pg.evaluate(f"(window.labAt({t}), document.querySelectorAll('canvas')[{k}].toDataURL('image/png'))")
        im = Image.open(io.BytesIO(base64.b64decode(url.split(",")[1]))).convert("RGB").crop(crop).resize((360, 360))
        if prev: print(f"  t={t:.3f}: mean change {sum(ImageStat.Stat(ImageChops.difference(im, prev)).mean) / 3:.2f}/255")
        prev = im
        tile = Image.new("RGB", (360, 382), "black"); tile.paste(im, (0, 0))
        ImageDraw.Draw(tile).text((150, 364), f"t={t:.4f}", fill=(153, 204, 255)); tiles.append(tile)
    strip = Image.new("RGB", (366 * count, 388), (17, 17, 17))
    for i, t in enumerate(tiles): strip.paste(t, (3 + 366 * i, 3))
    strip.save(f"{out}/three-{item}.png")
    print(f"{out}/three-{item}.png  ({count} frames over {cycle}s)  errors:", errors or "none")
    b.close()
