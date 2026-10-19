#!/usr/bin/env python3
"""Step 12, both armies take the city (r71): Eve's spire crumbles into the ground and the
victory is celebrated. Raises the sun at full speed and films the fall to out/spire-<n>.png,
reading the spire's fall (0 standing, 1 gone). Passes when it goes from 0 to 1 and the next
step stands it back up. Serve the repo first (python3 -m http.server 8793); --base elsewhere."""
import argparse, sys
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser(); ap.add_argument("--base", default="http://localhost:8793/"); a = ap.parse_args()
FALL = "demo.world.city.userData.fall"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(a.base + "deux-generaux/index.html#story=12", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(3000)
    before = pg.evaluate(FALL)
    pg.locator("#play, #step-actions .primary").first.click()   # 'Lever le soleil'
    pg.wait_for_function(f"{FALL} > 0", timeout=120000)
    film = []
    for n in range(6):
        film.append(pg.evaluate(FALL)); pg.screenshot(path=f"out/spire-{n}.png")
        if film[-1] >= 1: break
        pg.wait_for_timeout(400)
    pg.wait_for_function(f"{FALL} >= 1", timeout=60000)
    pg.wait_for_timeout(1500); pg.screenshot(path="out/spire-down.png")
    pg.click("#next"); pg.wait_for_function(f"{FALL} === 0", timeout=60000)
    visible = pg.evaluate("demo.world.city.userData.spire.visible")
    b.close()
print(f"fall before: {before}, filmed: {', '.join(f'{v:.2f}' for v in film)}, next step: spire visible {visible}, errors: {errors or 'none'}")
sys.exit(0 if (before == 0 and visible and not errors) else 1)
