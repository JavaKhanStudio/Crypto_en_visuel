#!/usr/bin/env python3
"""« AES de l'intérieur » on short phones (r481): for every story step, the folded corner card's box
against the modes row and the panel, and whether dock() hid it (class cramped); shoots #story=<shot>
to out/aes-card-<w>x<h>-<lang>.png. Serve the repo first.
    tools/aes_card_room.py [360x640] [en] [13]"""
import sys
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

W, H = map(int, (sys.argv[1] if len(sys.argv) > 1 else "360x640").split("x"))
lang = sys.argv[2] if len(sys.argv) > 2 else "en"
shot = int(sys.argv[3]) if len(sys.argv) > 3 else 13
probe = """() => { const q = id => document.getElementById(id).getBoundingClientRect(), c = document.getElementById('card');
  const bar = Math.max(...['topbar', 'modes', 'lang'].map(id => q(id).bottom)), card = q('card'), panel = q('story');
  const shown = getComputedStyle(c).display !== 'none' && card.height > 0;
  return { bar: Math.round(bar), card: shown ? [Math.round(card.top), Math.round(card.bottom)] : 'hidden',
    panel: Math.round(panel.top), clear: !shown || (card.top >= bar && card.bottom <= panel.top) }; }"""
bad = 0
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": W, "height": H}); errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"http://localhost:8793/aes-interieur/?instant=1&lang={lang}#story=1", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    for i in range(13):
        pg.evaluate(f"demo.story.go({i})"); pg.wait_for_timeout(600)
        m = pg.evaluate(probe); bad += not m["clear"]
        print("ok  " if m["clear"] else "FAIL", i + 1, m)
        if i + 1 == shot: pg.screenshot(path=f"out/aes-card-{W}x{H}-{lang}.png")
    b.close()
print("page errors:", errors or "none"); print("all ok" if not bad and not errors else f"{bad} step(s) with the card over a control")
