#!/usr/bin/env python3
"""The story nav row's widths at 360px (r433): the row's inner width, its gap, each child's width and top; a shot to argv[1].
    tools/nav_widths.py out/shot.png [page] [hash] [lang]"""
import sys
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
page = sys.argv[2] if len(sys.argv) > 2 else "aes-interieur/"; hash_ = sys.argv[3] if len(sys.argv) > 3 else "#story=12"; lang = sys.argv[4] if len(sys.argv) > 4 else "fr"
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width":360,"height":780})
    pg.goto(f"http://localhost:8793/{page}?instant=1&lang={lang}{hash_}", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000); pg.wait_for_timeout(1500)
    print(pg.evaluate("""() => { const n = document.querySelector('.nav'); const cs = getComputedStyle(n);
      return [n.clientWidth, cs.gap, cs.paddingLeft, ...[...n.children].map(c => [c.id || c.className, Math.round(c.getBoundingClientRect().width), Math.round(c.getBoundingClientRect().top), getComputedStyle(c).display])] }"""))
    pg.screenshot(path=sys.argv[1])
