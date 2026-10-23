#!/usr/bin/env python3
"""r478 probe: on one step, scroll the card to its end and log its scroll box and classes every 100 ms."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from browser import launch
from playwright.sync_api import sync_playwright
lang, step = sys.argv[1], int(sys.argv[2])
with sync_playwright() as p:
    b = launch(p); pg = b.new_page(viewport={"width": 1440, "height": 860})
    pg.goto(f"http://localhost:8793/paquet-complet/?instant=1&lang={lang}#story=1", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.evaluate(f"demo.story.go({step - 1})"); pg.wait_for_timeout(1200)
    S = "(() => { const c = document.getElementById('card'); return [c.scrollTop, c.clientHeight, c.scrollHeight, c.style.maxHeight, c.className, Math.round(c.getBoundingClientRect().top)]; })()"
    print("before", pg.evaluate(S))
    pg.evaluate("(() => { const c = document.getElementById('card'); c.scrollTop = c.scrollHeight; })()")
    for k in range(12): print(k * 100, pg.evaluate(S)); pg.wait_for_timeout(100)
    b.close()
