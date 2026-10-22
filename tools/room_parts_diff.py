#!/usr/bin/env python3
"""r485: the saga's keep rooms before and after a move of their parts (lib/room-parts.js), pixel by pixel.

Serve the two trees (the old one from a worktree), then:

    tools/room_parts_diff.py out/r485 http://localhost:8831/ http://localhost:8832/

For every room step of 1.2-1.6, at 1440x860 and 390x844, both trees are shot with the same seeded
Math.random and a frozen clock, the room's clock held at each second of --at (demo.inside.hold), so
the same code draws the same pixels. Prints the share of pixels that differ (any channel > 24) and
writes <out>/<ep>-<step>-<w>-<s>.png: before | after | the differing pixels in red.
"""
import argparse, io, os, sys
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from browser import launch

# every room: 1.2 aes, 1.3 hmac, 1.4 rsa (two beats) and oaep, 1.5 alice, bob open and why,
# 1.6 sign, verify, gcm, gcmEve
STEPS = {'eve-lit-tout': [5, 7], 'octet-change': [6, 7], 'cle-vallee': [4, 5, 7],
         'paquet-complet': [3, 7, 10], 'encore-des-tours': [5, 6, 11, 12]}
SEED = """(() => { let s = 485; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s);
  t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();"""

ap = argparse.ArgumentParser()
ap.add_argument("out"); ap.add_argument("before"); ap.add_argument("after")
ap.add_argument("--eps", nargs="*", default=list(STEPS))
ap.add_argument("--at", default="3,30", help="held seconds of the beat")
ap.add_argument("--lang", default="fr")
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)

def shots(b, base, ep, step, w, h, at):
    pg = b.new_page(viewport={"width": w, "height": h}, is_mobile=w < 900, has_touch=w < 900)
    errors, out = [], []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.add_init_script(SEED)
    pg.clock.install(time=0)
    pg.goto(f"{base}{ep}/?instant=1&lang={a.lang}#story={step}", wait_until="load")
    for _ in range(120):
        pg.clock.run_for(500)
        if pg.evaluate("!!(window.demo && demo.ready && demo.inside && demo.inside.active)"): break
    else: errors.append("never inside the room")
    pg.add_style_tag(content=".bubble { transition: none !important; }")
    for s in at:
        pg.evaluate(f"demo.inside.hold = {s}")
        pg.clock.run_for(2500)
        out.append(Image.open(io.BytesIO(pg.screenshot())).convert("RGB"))
    pg.close()
    return out, errors

worst = 0
with sync_playwright() as p:
    b = launch(p)
    at = [float(x) for x in a.at.split(",")]
    for ep in a.eps:
        for step in STEPS[ep]:
            for w, h in ((1440, 860), (390, 844)):
                i0, e0 = shots(b, a.before, ep, step, w, h, at)
                i1, e1 = shots(b, a.after, ep, step, w, h, at)
                for s, im0, im1 in zip(at, i0, i1):
                    d = ImageChops.difference(im0, im1).convert("L").point(lambda v: 255 if v > 24 else 0)
                    share = d.histogram()[255] / (w * h); worst = max(worst, share)
                    red = Image.new("RGB", (w, h), (200, 0, 0))
                    mask = Image.composite(red, im1.point(lambda v: v // 3), d)
                    sheet = Image.new("RGB", (w * 3, h)); sheet.paste(im0, (0, 0)); sheet.paste(im1, (w, 0)); sheet.paste(mask, (2 * w, 0))
                    name = f"{a.out}/{ep}-{step}-{w}-{s:g}.png"; sheet.save(name)
                    print(f"{share * 100:6.3f}%  {name}", "errors:", (e0 + e1) or "none", flush=True)
    b.close()
print(f"worst {worst * 100:.3f}%")
