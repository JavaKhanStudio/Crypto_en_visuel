#!/usr/bin/env python3
"""Leaving the dawn step (r69): night falls back over a short dusk instead of in one frame.
Raises the sun on step 12 at full speed, clicks Suivant, and films the transition to
out/dusk-<ms>.png, reading the world's dawn value on each frame. Passes when the first
frames after the click are still partly lit, it ends at 0 and the armies are gone.
Serve the repo first (python3 -m http.server 8793); --base to point elsewhere."""
import argparse, sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

ap = argparse.ArgumentParser(); ap.add_argument("--base", default="http://localhost:8793/"); a = ap.parse_args()
COUNT = "demo.scene.children.filter(o => o.isInstancedMesh && o.count === 48).length"
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(a.base + "deux-generaux/index.html#story=12", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(3000)
    pg.locator("#play, #step-actions .primary").first.click()   # 'Lever le soleil'
    pg.wait_for_function("demo.world.dawn >= 1", timeout=120000)
    pg.wait_for_timeout(9000)   # the march, its verdict, the camp
    pg.click("#next")
    film = []
    for ms in (0, 300, 700, 1200, 2000, 3500):
        pg.wait_for_timeout(ms - (film[-1][0] if film else 0))
        film.append((ms, pg.evaluate("demo.world.dawn")))
        pg.screenshot(path=f"out/dusk-{ms}.png")
    armies = pg.evaluate(COUNT)
    b.close()
print("dawn after Suivant:", ", ".join(f"{ms} ms {v:.2f}" for ms, v in film), f"| armies at the end: {armies}, errors: {errors or 'none'}")
sys.exit(0 if (film[0][1] > .5 and film[-1][1] == 0 and armies == 0 and not errors) else 1)
