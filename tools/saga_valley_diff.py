#!/usr/bin/env python3
"""r423: the saga's valley before and after a move of its code, pixel by pixel.

Serve the two trees (the old one from a worktree), then:

    tools/saga_valley_diff.py out/r423 http://localhost:8821/ http://localhost:8822/

For each episode of the saga and three of its steps, at 1440x860 and 390x844, both trees are shot
with the same seeded Math.random and a frozen clock (Playwright's clock, run for the same time), so
the same code draws the same pixels. Prints the share of pixels that differ (any channel > 24) and
writes <out>/<ep>-<step>-<w>.png: before | after | the differing pixels in red.
"""
import argparse, io, os, sys
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from browser import launch

STEPS = {'deux-generaux': [1, 6, 12], 'eve-lit-tout': [1, 3, 9], 'octet-change': [1, 3, 9],
         'cle-vallee': [1, 3, 9], 'paquet-complet': [1, 6, 11], 'encore-des-tours': [1, 3, 9]}
SEED = """(() => { let s = 423; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s);
  t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();"""

ap = argparse.ArgumentParser()
ap.add_argument("out"); ap.add_argument("before"); ap.add_argument("after")
ap.add_argument("--eps", nargs="*", default=list(STEPS))
ap.add_argument("--run", type=int, default=9000, help="ms of frozen clock run before the shot")
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)

def shot(b, base, ep, step, w, h):
    pg = b.new_page(viewport={"width": w, "height": h})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.add_init_script(SEED)
    pg.clock.install(time=0)
    pg.goto(f"{base}{ep}/?instant=1#story={step}", wait_until="load")
    for _ in range(60):
        pg.clock.run_for(500)
        if pg.evaluate("!!(window.demo && window.demo.ready)"): break
    pg.clock.run_for(a.run)
    png = pg.screenshot()
    pg.close()
    return Image.open(io.BytesIO(png)).convert("RGB"), errors

with sync_playwright() as p:
    b = launch(p)
    for ep in a.eps:
        for step in STEPS[ep]:
            for w, h in ((1440, 860), (390, 844)):
                im0, e0 = shot(b, a.before, ep, step, w, h)
                im1, e1 = shot(b, a.after, ep, step, w, h)
                d = ImageChops.difference(im0, im1).convert("L").point(lambda v: 255 if v > 24 else 0)
                share = d.histogram()[255] / (w * h)
                red = Image.new("RGB", (w, h), (200, 0, 0))
                mask = Image.composite(red, im1.point(lambda v: v // 3), d)
                sheet = Image.new("RGB", (w * 3, h)); sheet.paste(im0, (0, 0)); sheet.paste(im1, (w, 0)); sheet.paste(mask, (2 * w, 0))
                name = f"{a.out}/{ep}-{step}-{w}.png"; sheet.save(name)
                print(f"{share * 100:6.2f}%  {name}", "errors:", (e0 + e1) or "none")
    b.close()
