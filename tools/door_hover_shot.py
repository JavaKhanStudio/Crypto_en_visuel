#!/usr/bin/env python3
"""r105: shoots an episode's last step with one door hovered, its clip playing (desktop, the GPU as in
tools/door_clips.py): out/<slug>-door-<n>.png. Serve the repo root on 8793 first.
    tools/door_hover_shot.py deux-generaux 14 [door index, default 3 = next] [lang, default fr]"""
import sys
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

slug, step = sys.argv[1], sys.argv[2]
k = int(sys.argv[3]) if len(sys.argv) > 3 else 3
lang = sys.argv[4] if len(sys.argv) > 4 else "fr"
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": 1440, "height": 860}); errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("response", lambda r: r.status >= 400 and errors.append(f"{r.status} {r.url}"))   # r290: a missing clip is a 404
    pg.goto(f"http://localhost:8793/{slug}/?instant=1&lang={lang}#story={step}"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(1500); pg.locator("#step-actions .door").nth(k).hover(); pg.wait_for_timeout(2600)
    out = f"out/{slug}-door-{k}" + ("" if lang == "fr" else f"-{lang}") + ".png"; pg.screenshot(path=out); print(out, "errors:", errors or "none")
    b.close()
