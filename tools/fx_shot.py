#!/usr/bin/env python3
"""r318: shoot an episode's end-of-quiz fireworks, fired on the page's own fx module, in front of
the camera (the real call's centre is often above the frame). --mod picks the module: ./js/fx.js
for a page from before r318 (--base the live site at an older commit), ../lib/fx.js after.
  tools/fx_shot.py out/r318/enigma-after enigma/ --n 14 --spread 120
  tools/fx_shot.py out/r318/enigma-before enigma/ --n 14 --spread 120 --mod ./js/fx.js --base https://javakhanstudio.github.io/Crypto_en_visuel/
Prints page errors, which must be none."""
import argparse
from playwright.sync_api import sync_playwright
ap = argparse.ArgumentParser()
ap.add_argument("out"); ap.add_argument("page")
ap.add_argument("--n", type=int, default=14); ap.add_argument("--spread", type=float)
ap.add_argument("--mod", default="../lib/fx.js")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--wait", type=int, default=1800)
ap.add_argument("--settle", type=int, default=2500)   # the live site loads slower: give it 6000
a = ap.parse_args()
spread = "undefined" if a.spread is None else a.spread
# the bursts go off spread*.7 (saga: 42) above the centre: aim them 60% of the way from the camera to
# where its view ray meets the ground, so they are in frame and above it
JS = f"""Promise.all([import('{a.mod}'), import('three')]).then(([fx, T]) => {{
  const c = demo.camera, d = c.getWorldDirection(new T.Vector3()), s = {spread};
  const reach = .6 * (d.y < -.05 ? c.position.y / -d.y : 60), rise = s === undefined ? 42 : s * .7;
  fx.fireworks(c.position.clone().addScaledVector(d, reach).add(new T.Vector3(0, -rise, 0)),
    [0xffd66b, 0xff8a5c, 0x5fd1ff, 0xffd84d, 0x9be37a], {a.n}, s);
}})"""
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(a.base + a.page + "#sandbox", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(a.settle)   # the sandbox flight settles
    pg.evaluate(JS)
    pg.wait_for_timeout(a.wait)
    pg.screenshot(path=a.out + ".png")
    print(a.out + ".png", "errors:", errors or "none")
