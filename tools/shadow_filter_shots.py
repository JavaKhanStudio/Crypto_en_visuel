#!/usr/bin/env python3
"""r613: the same still frame with the moon's shadow filtered PCFSoft (today), PCF and Basic, side by side, cropped
on a shadow edge and enlarged --zoom times (nearest pixel), to show Simon what a cheaper filter does to the edges.
The three pictures come from one task (canvas.toDataURL right after composer.render, a type swap recompiles every
material); the shadow map is cached (r543), so only the receivers' lookups differ.

    tools/shadow_filter_shots.py out/r613/castle --page deux-generaux/ --hash '#story=1' --crop 600,300,320,220

--crop x,y,w,h is in CSS px. Writes <out>.png and prints page errors (must be none)."""
import argparse
import base64
import io
import os
import sys
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from browser import launch  # noqa: E402
from shadow_bilinear import BILINEAR  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="deux-generaux/")
ap.add_argument("--hash", default="#story=1")
ap.add_argument("--query", default="?instant=1&quality=normal")
ap.add_argument("--size", default="1440x860")
ap.add_argument("--dpr", type=float, default=1)
ap.add_argument("--types", default="PCFSoft,PCF,Basic")
ap.add_argument("--crop", default="")
ap.add_argument("--zoom", type=int, default=2)
ap.add_argument("--settle", type=int, default=8000)
a = ap.parse_args()
TYPE = {"Basic": 0, "PCF": 1, "PCFSoft": 2, "Bilinear": 1}

GRAB = """(types) => {
  const C = demo.composer, R = demo.renderer, T0 = R.shadowMap.type, out = [];
  const set = t => { R.shadowMap.type = t; demo.scene.traverse(o => [].concat(o.material || []).forEach(m => m.needsUpdate = true)); };
  for (const t of types) { set(t); C.render(); out.push(R.domElement.toDataURL('image/png')); }
  set(T0); return out;
}"""

w, h = map(int, a.size.split("x"))
names = a.types.split(",")
with sync_playwright() as p:
    br = launch(p)
    ctx = br.new_context(viewport={"width": w, "height": h}, device_scale_factor=a.dpr, has_touch=w < 900, is_mobile=w < 900)
    pg = ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(a.base + a.page + a.query + a.hash, wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(a.settle)
    if "Bilinear" in names:
        assert "PCF" not in names, "Bilinear replaces PCF's branch: shoot them apart"
        assert pg.evaluate(BILINEAR), "shadowmap_pars_fragment: PCF branch not found"
    pics = [Image.open(io.BytesIO(base64.b64decode(u.split(",")[1]))).convert("RGB") for u in pg.evaluate(GRAB, [TYPE[n] for n in names])]
    br.close()
if a.crop:
    k = pics[0].width / w   # canvas px per CSS px: the level's ratio (Éco draws 1, whatever the screen)
    x, y, cw, ch = (int(v * k) for v in map(float, a.crop.split(",")))
    pics = [im.crop((x, y, x + cw, y + ch)).resize((cw * a.zoom, ch * a.zoom), Image.NEAREST) for im in pics]
gap = 12
out = Image.new("RGB", (pics[0].width * len(pics) + gap * (len(pics) - 1), pics[0].height + 34), (20, 22, 28))
d = ImageDraw.Draw(out)
for i, (im, n) in enumerate(zip(pics, names)):
    out.paste(im, (i * (im.width + gap), 34)); d.text((i * (im.width + gap) + 8, 10), n + (" (today)" if i == 0 else ""), fill=(240, 240, 240))
os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
out.save(a.out + ".png")
print(f"{a.out}.png errors: {'none' if not errors else errors}")
