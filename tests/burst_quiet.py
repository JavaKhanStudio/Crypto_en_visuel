#!/usr/bin/env python3
"""Step 10 (« Doubler les messagers », s11): ten messengers at once, and Eve says nothing when she
takes one (r417: ten « Capturé ! » bubbles hid the valley). A lone rider still gets her bubble.
No bubble shown during the burst goes under the « Qui sait quoi ? » panel (r486: Bob's « Déjà reçu »
did), at 1440x860 and on a phone.
Serve the repo first (python3 -m http.server 8793)."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tools'))
from playwright.sync_api import sync_playwright
from browser import launch

WATCH = """() => { window._eve = 0; window._lost = 0;
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes)
    if (n.classList && n.classList.contains('bubble') && n.classList.contains('e')) window._eve++; })
    .observe(document.body, { childList: true, subtree: true });
  const s = demo.sim, h = s.hooks.onMessenger; s.hooks.onMessenger = (m, ev) => { if (ev === 'captured') window._lost++; h(m, ev); };
  // every 100 ms, the shown bubbles that overlap #ladder
  window._under = new Set(); const L = document.getElementById('ladder');
  setInterval(() => { if (!L.offsetHeight) return; const l = L.getBoundingClientRect();
    for (const el of document.querySelectorAll('#bubbles .bubble.show')) { const r = el.getBoundingClientRect();
      if (Math.min(r.right, l.right) - Math.max(r.left, l.left) > 1 && Math.min(r.bottom, l.bottom) - Math.max(r.top, l.top) > 1)
        window._under.add(el.querySelector('.who').textContent); } }, 100); }"""
fails = []
errors = []
with sync_playwright() as p:
    b = launch(p)
    for w, h in [(390, 844), (1440, 860)]:
        pg = b.new_page(viewport={"width": w, "height": h})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto("http://localhost:8793/deux-generaux/?instant=1#story=10", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.add_style_tag(content=".bubble { transition: opacity .35s !important; }")   # where a bubble goes, not its glide
        pg.evaluate(WATCH)
        pg.evaluate("demo.sim.p = .7; document.getElementById('play').click()")
        pg.wait_for_function("!document.getElementById('play').disabled", timeout=120000)
        eve, lost, under = pg.evaluate("[window._eve, window._lost, [...window._under]]")
        print(f"{w}px burst: {lost} captured, {eve} Eve bubbles, under the ladder: {under or 'none'}")
        if not lost or eve: fails.append(f"burst {w}px")
        if under: fails.append(f"ladder {w}px")
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
