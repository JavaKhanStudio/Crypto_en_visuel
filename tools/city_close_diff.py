#!/usr/bin/env python3
"""r544: Eve's city close up, before and after a change to its build, pixel by pixel.

Serve the two trees, then:

    tools/city_close_diff.py out/r544 http://localhost:8841/ http://localhost:8842/

deux-generaux's sandbox, Math.random seeded and the clock frozen (as tools/saga_valley_diff.py), the
camera rig stopped and the camera held at three fixed places round the city (the gate, above, the
back), at 1440x860 and 390x844, the panels hidden; or --story N, that step as the page frames it.
--after-eval runs JS on the after page first, to show what a change of look would be on one tree. Prints the share of pixels that differ (any
channel > 24) and writes <out>/city-<view>-<w>.png: before | after | the differing pixels in red.
"""
import argparse, io, os, sys
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from browser import launch  # noqa: E402

# the seeded Math.random of tools/saga_valley_diff.py
SEED = """(() => { let s = 423; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s);
  t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();"""
VIEWS = {'gate': ([0, 14, 52], [0, 8, 0]), 'above': ([24, 60, 30], [0, 4, 0]), 'back': ([-30, 20, -40], [0, 10, 0])}
ap = argparse.ArgumentParser()
ap.add_argument("out"); ap.add_argument("before"); ap.add_argument("after")
ap.add_argument("--after-eval", default="", help="JS run on the after page before its shot, e.g. 'demo.world.city.userData.fireLight.visible = false'")
ap.add_argument("--story", type=int, help="a story step (its own camera, panels kept) instead of the three fixed views")
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
HOLD = """([p, t]) => { demo.rig.update = () => {};
  document.querySelectorAll('.panel, #card, .bubble, #topbar, header, .tools, #modes, #lang').forEach(e => e.style.visibility = 'hidden');
  demo.camera.position.set(...p); demo.camera.lookAt(...t); }"""

def shot(b, base, view, w, h, js=""):
    pg = b.new_page(viewport={"width": w, "height": h}); errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.add_init_script(SEED); pg.clock.install(time=0)
    pg.goto(f"{base}deux-generaux/" + (f"?instant=1#story={a.story}" if a.story else "#sandbox"), wait_until="load")
    for _ in range(60):
        pg.clock.run_for(500)
        if pg.evaluate("!!(window.demo && window.demo.ready)"): break
    pg.clock.run_for(3000 if not a.story else 9000)
    if not a.story: pg.evaluate(HOLD, list(VIEWS[view]))
    if js: pg.evaluate(js)
    pg.clock.run_for(1000)
    png = pg.screenshot(); pg.close()
    return Image.open(io.BytesIO(png)).convert("RGB"), errors

with sync_playwright() as p:
    b = launch(p)
    for view in ([f"story{a.story}"] if a.story else VIEWS):
        for w, h in ((1440, 860), (390, 844)):
            im0, e0 = shot(b, a.before, view, w, h); im1, e1 = shot(b, a.after, view, w, h, a.after_eval)
            d = ImageChops.difference(im0, im1).convert("L").point(lambda v: 255 if v > 24 else 0)
            mask = Image.composite(Image.new("RGB", (w, h), (200, 0, 0)), im1.point(lambda v: v // 3), d)
            sheet = Image.new("RGB", (w * 3, h)); sheet.paste(im0, (0, 0)); sheet.paste(im1, (w, 0)); sheet.paste(mask, (2 * w, 0))
            name = f"{a.out}/city-{view}-{w}.png"; sheet.save(name)
            print(f"{d.histogram()[255] / (w * h) * 100:6.2f}%  {name}", "errors:", (e0 + e1) or "none")
    b.close()
