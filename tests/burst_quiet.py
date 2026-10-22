#!/usr/bin/env python3
"""Step 10 (« Doubler les messagers », s11): ten messengers at once, and Eve says nothing when she
takes one (r417: ten « Capturé ! » bubbles hid the valley). A lone rider still gets her bubble.
Serve the repo first (python3 -m http.server 8793)."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tools'))
from playwright.sync_api import sync_playwright
from browser import launch

WATCH = """() => { window._eve = 0; window._lost = 0;
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes)
    if (n.classList && n.classList.contains('bubble') && n.classList.contains('e')) window._eve++; })
    .observe(document.body, { childList: true, subtree: true });
  const s = demo.sim, h = s.hooks.onMessenger; s.hooks.onMessenger = (m, ev) => { if (ev === 'captured') window._lost++; h(m, ev); }; }"""
fails = []
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto("http://localhost:8793/deux-generaux/?instant=1#story=10", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.evaluate(WATCH)
    pg.evaluate("demo.sim.p = .7; document.getElementById('play').click()")
    pg.wait_for_function("!document.getElementById('play').disabled", timeout=120000)
    eve, lost = pg.evaluate("[window._eve, window._lost]")
    print(f"burst: {lost} captured, {eve} Eve bubbles")
    if not lost or eve: fails.append("burst")
    # a lone rider, out of a burst, still gets Eve's line
    pg.evaluate("window._eve = 0; window._lost = 0; demo.sim.send('a', { fate: 'capture' })")
    pg.wait_for_function("window._lost > 0", timeout=120000); pg.wait_for_timeout(300)
    eve = pg.evaluate("window._eve")
    print(f"lone rider: {eve} Eve bubble")
    if eve != 1: fails.append("lone")
    b.close()
print("errors:", errors or "none")
print("FAIL " + ", ".join(fails) if fails or errors else "all ok")
sys.exit(1 if fails or errors else 0)
