#!/usr/bin/env python3
"""« AES de l'intérieur » (r335) caught mid-step: round 1's SubBytes, ShiftRows and MixColumns half-way,
and the last round once the cubes have lined up as C1, at 1440x860 and 390x844, to
out/aes-mid-<step>[-phone]-<lang>.png. The beat is held still at a time (demo.room.speed = 0), so
the frame is the same on any machine. Serve the repo first (python3 -m http.server 8793).
    tools/aes_mid_shots.py [fr|en]"""
import sys
from playwright.sync_api import sync_playwright

lang = sys.argv[1] if len(sys.argv) > 1 else "fr"
SHOTS = [("sub1", 6, 3.3), ("shift1", 7, 2.2), ("mix1", 8, 2.75), ("last", 11, 99)]   # (beat, step, time in the beat)
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    errors = []
    for (w, h), tag in [((1440, 860), ""), ((390, 844), "-phone")]:
        pg = b.new_page(viewport={"width": w, "height": h}); pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"http://localhost:8793/aes-interieur/?instant=1&lang={lang}#story=1", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        for beat, step, at in SHOTS:
            pg.evaluate(f"demo.story.go({step - 1})"); pg.wait_for_timeout(400)
            pg.evaluate(f"demo.room.speed = 0; demo.room.time = Math.min({at}, demo.room.end)"); pg.wait_for_timeout(900)
            path = f"out/aes-mid-{beat}{tag}-{lang}.png"; pg.screenshot(path=path); print(path)
        pg.close()
    print("errors:", errors or "none")
    b.close()
