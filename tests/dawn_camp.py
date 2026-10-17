#!/usr/bin/env python3
"""The dawn step (r25): the searchlight is off, the winning armies stay camped at the
walls once the march is over, and both come back to normal on the next step. Shoots
out/dawn-camp.png long after the march. Serve the repo first (python3 -m http.server 8793)."""
import sys
from playwright.sync_api import sync_playwright

COUNT = "demo.scene.children.filter(o => o.isInstancedMesh && o.count === 48).length"
BEAM = "demo.world.city.userData.pivot.visible"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto("http://localhost:8793/deux-generaux/index.html?instant=1#story=12", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    beam_step = pg.evaluate(BEAM)
    pg.click("#step-actions .primary")
    pg.wait_for_selector("#step-actions .primary:not([disabled])", timeout=120000)
    pg.wait_for_timeout(8000)
    camped = pg.evaluate(COUNT)
    pg.screenshot(path="out/dawn-camp.png")
    pg.click("#next"); pg.wait_for_timeout(500)
    after, beam_next = pg.evaluate(COUNT), pg.evaluate(BEAM)
    b.close()
print(f"beam on dawn step: {beam_step}, armies camped after the march: {camped}, "
      f"next step: armies {after}, beam {beam_next}, errors: {errors or 'none'}")
sys.exit(0 if (not beam_step and camped == 2 and after == 0 and beam_next and not errors) else 1)
