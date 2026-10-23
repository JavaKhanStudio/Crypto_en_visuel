#!/usr/bin/env python3
"""r542: the same frame with lib/bloom.js at full size and at --scale of the canvas, side by side, cropped on a
glowing part, to show Simon what a lower-resolution bloom does to the glow. Both pictures come from one task
(canvas.toDataURL right after composer.render), so the flames cannot move between them.

    tools/bloom_shots.py out/r542/eye --page deux-generaux/ --hash '#story=1' --dpr 2 --crop 400,130,560,380

--crop x,y,w,h is in CSS px. Writes <out>.png (left: today, right: scaled) and prints page errors (must be none)."""
import argparse
import base64
import io
import os
import sys
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from browser import launch  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="deux-generaux/")
ap.add_argument("--hash", default="#story=1")
ap.add_argument("--query", default="?instant=1&quality=normal")
ap.add_argument("--size", default="1440x860")
ap.add_argument("--dpr", type=float, default=1)
ap.add_argument("--scale", type=float, default=.5)
ap.add_argument("--crop", default="")
ap.add_argument("--settle", type=int, default=8000)
a = ap.parse_args()

GRAB = """(S) => {
  const C = demo.composer, R = demo.renderer, b = C.passes.find(p => p.isBloom);
  const W = R.domElement.width, H = R.domElement.height, shot = () => { C.render(); return R.domElement.toDataURL('image/png'); };
  const A = shot(); b.setSize(Math.round(W * S), Math.round(H * S)); const B = shot(); b.setSize(W, H);
  return [A, B];
}"""

w, h = map(int, a.size.split("x"))
with sync_playwright() as p:
    br = launch(p)
    ctx = br.new_context(viewport={"width": w, "height": h}, device_scale_factor=a.dpr, has_touch=w < 900, is_mobile=w < 900)
    pg = ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(a.base + a.page + a.query + a.hash, wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(a.settle)
    pics = [Image.open(io.BytesIO(base64.b64decode(u.split(",")[1]))).convert("RGB") for u in pg.evaluate(GRAB, a.scale)]
    br.close()
if a.crop:
    x, y, cw, ch = (int(v * a.dpr) for v in map(float, a.crop.split(",")))
    pics = [im.crop((x, y, x + cw, y + ch)) for im in pics]
gap = 12
out = Image.new("RGB", (pics[0].width * 2 + gap, pics[0].height + 34), (20, 22, 28))
d = ImageDraw.Draw(out)
for i, (im, label) in enumerate(zip(pics, ["today (bloom at the canvas size)", f"bloom at {a.scale} of the canvas"])):
    out.paste(im, (i * (im.width + gap), 34)); d.text((i * (im.width + gap) + 8, 10), label, fill=(240, 240, 240))
os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
out.save(a.out + ".png")
print(f"{a.out}.png errors: {'none' if not errors else errors}")
