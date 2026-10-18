#!/usr/bin/env python3
"""A strip of frames of the Enigma step 2 -> 3 transition (headless, never opens a window).

Serve the repo first (python3 -m http.server 8793), then:
    tools/enigma_frames.py out/e23 button   # step 2's button 'Sortir les rotors', then Next
    tools/enigma_frames.py out/e23 next     # Next straight from step 2
Writes out/e23-NN.png and out/e23.png (a contact sheet). Prints page errors.
The clock is driven by hand (demo.step), so the frames are evenly spaced in story time
however slowly SwiftShader draws.
"""
import sys
from playwright.sync_api import sync_playwright
from PIL import Image

out, how = sys.argv[1], sys.argv[2]
base = sys.argv[3] if len(sys.argv) > 3 else "http://localhost:8793/"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 960, "height": 574})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(base + "enigma/#story=2", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_function("!demo.rig.flight", timeout=60000)
    pg.wait_for_timeout(1500)
    pg.evaluate("demo.freeze()")
    frames = []
    def shoot(n, dt=.25):
        for _ in range(n):
            pg.evaluate(f"demo.step({dt})")
            f = f"{out}-{len(frames):02d}.png"; pg.screenshot(path=f); frames.append(f)
    if how == "button":
        pg.click("#step-actions button.primary"); shoot(12)
        pg.click("#next"); shoot(8)
    else:
        pg.click("#next"); shoot(12)
    print("page errors:", errors or "none")
    ims = [Image.open(f).resize((480, 287)) for f in frames]
    cols = 4; rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 480, rows * 287))
    for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * 480, (i // cols) * 287))
    sheet.save(out + ".png")
