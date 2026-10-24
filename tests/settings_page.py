#!/usr/bin/env python3
"""r646: the settings page (reglages/) writes the keys the episodes read: pick HD+ and English there, open an
episode, its #quality button says HD+ and its page is in English; 'dg-still' is checked once r546's lib/still.js
is in (composer.stillFrames.fps, as tools/still_probe.py reads it).
    python3 tests/settings_page.py [base]   (default http://127.0.0.1:8793/)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tools"))
from playwright.sync_api import sync_playwright
from browser import launch
base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8793/"
ok = True
def check(cond, what, got):
    global ok; ok &= bool(cond); print("ok  " if cond else "FAIL", what, got)
with sync_playwright() as p:
    b = launch(p); pg = b.new_page(viewport={"width": 1440, "height": 900})
    errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(base + "reglages/"); pg.wait_for_function("window.demo && window.demo.ready")
    pg.click('[data-key="dg-quality"] [data-v="fine"]'); pg.click('[data-key="dg-lang"] [data-v="en"]'); pg.click('[data-key="dg-still"] [data-v="60"]')
    check(pg.evaluate("document.documentElement.lang") == "en", "the page turns English", pg.title())
    keys = pg.evaluate("({ q: localStorage['dg-quality'], l: localStorage['dg-lang'], s: localStorage['dg-still'] })")
    check(keys == {"q": "fine", "l": "en", "s": "60"}, "keys written", keys)
    pg.goto(base + "deux-generaux/"); pg.wait_for_function("window.demo && window.demo.ready", timeout=90000)
    q = pg.evaluate("document.getElementById('quality')?.textContent")
    check(q == "HD+", "episode's quality button", q)
    check(pg.evaluate("document.documentElement.lang") == "en", "episode in English", pg.evaluate("document.documentElement.lang"))
    if os.path.exists(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "lib", "still.js")):
        fps = pg.evaluate("window.demo.composer?.stillFrames?.fps")
        check(fps == 60, "episode's still frame rate", fps)
    else: print("skip  dg-still: lib/still.js (r546) not in this tree")
    pg.goto(base + "reglages/"); pg.wait_for_function("window.demo && window.demo.ready"); pg.click("#reset")
    check(pg.evaluate("localStorage['dg-quality'] === undefined && localStorage['dg-still'] === undefined"), "reset drops quality and still", "")
    check(not errors, "no page errors", errors or "")
    b.close()
print("all ok" if ok else "FAILED"); sys.exit(0 if ok else 1)
