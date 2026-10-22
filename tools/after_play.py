#!/usr/bin/env python3
"""Shoots story steps of an episode once their action (#play) has played and every button is free again:
out/<slug>-after-<step>-<lang>-<w>.png. On the machine's GPU (about 50 fps, as tools/door_clips.py), with
?instant=1. Steps without #play are shot at rest. Serve the repo root on 8793 first.

    tools/after_play.py kasiski 2 3 4 [--phone] [--lang en] [--rest]
"""
import sys
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

args = sys.argv[1:]
slug = args[0]
lang = args[args.index("--lang") + 1] if "--lang" in args else "fr"
w, h = (390, 844) if "--phone" in args else (1440, 860)
steps = [a for a in args[1:] if a.isdigit()]
idle = "() => [...document.querySelectorAll('#play, #step-actions button')].every(b => !b.disabled)"
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": w, "height": h}, has_touch=w < 720, is_mobile=w < 720); errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    for step in steps:
        pg.goto("about:blank")
        pg.goto(f"http://localhost:8793/{slug}/?instant=1&lang={lang}#story={step}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.wait_for_timeout(1500); pg.wait_for_function(idle, timeout=180000)
        if "--rest" not in args and pg.locator("#play").count():
            pg.locator("#play").click(); pg.wait_for_timeout(300); pg.wait_for_function(idle, timeout=180000)
        pg.wait_for_timeout(1600)
        out = f"out/{slug}-after-{step}-{lang}-{w}.png"; pg.screenshot(path=out)
        print(out, "errors:", errors or "none")
    b.close()
