#!/usr/bin/env python3
"""r478 probe: load paquet-complet on a step the way a reader does (no ?instant) and log, every 250 ms,
the card's top, max-height and classes against the story panel's top, to see when clip() measured."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from browser import launch
from playwright.sync_api import sync_playwright
step, size = (sys.argv[1] if len(sys.argv) > 1 else "14"), (sys.argv[2] if len(sys.argv) > 2 else "1440x860")
w, h = map(int, size.split("x"))
with sync_playwright() as p:
    b = launch(p); pg = b.new_page(viewport={"width": w, "height": h})
    pg.goto(f"http://localhost:8793/paquet-complet/#story={step}", wait_until="load")
    for k in range(48):
        print(k * 250, pg.evaluate("""() => { const c = document.getElementById('card'), s = document.getElementById('story');
          const r = c.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom), c.style.maxHeight, c.className,
          Math.round(s.getBoundingClientRect().top), s.className, document.documentElement.style.getPropertyValue('--dock')]; }"""))
        pg.wait_for_timeout(250)
    b.close()
