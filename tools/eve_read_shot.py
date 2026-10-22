#!/usr/bin/env python3
"""Episode 1.2: shoots the moment Eve reads the scroll at her gate (real speed, not ?instant), for a
story step with a ride: out/eve-read-<lang>-<step>-<w>.png. Serve the repo first (port 8793).
--page shoots another episode with the same rides (octet-change, cle-vallee: out/<page>-read-…).
    tools/eve_read_shot.py [step ...] [--lang en] [--phone] [--page cle-vallee]"""
import sys
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

args = sys.argv[1:]
lang = args[args.index("--lang") + 1] if "--lang" in args else "fr"
page = args[args.index("--page") + 1] if "--page" in args else "eve-lit-tout"
name = "eve" if page == "eve-lit-tout" else page
w, h = (390, 844) if "--phone" in args else (1440, 860)
steps = [a for a in args if a.isdigit() and (args.index(a) == 0 or args[args.index(a) - 1] not in ("--lang", "--page"))] or ["2", "8"]
with sync_playwright() as p:
    b = launch(p)
    for step in steps:
        pg = b.new_page(viewport={"width": w, "height": h}); errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"http://localhost:8793/{page}/?lang={lang}#story={step}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.wait_for_timeout(2600)
        pg.locator("#play").click()
        pg.wait_for_function("demo.said.length >= 1", timeout=120000)
        pg.wait_for_timeout(1400)
        out = f"out/{name}-read-{lang}-{step}-{w}.png"; pg.screenshot(path=out)
        print(out, "errors:", errors or "none")
        pg.close()
    b.close()
