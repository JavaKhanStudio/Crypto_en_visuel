#!/usr/bin/env python3
"""Steps 4 and 6 (r19): a rider the red searchlight touches is captured. Clicks the
step's button until one rider is caught and one gets through, prints each outcome,
and shoots the caught moment to out/beam-s<N>.png. Serve the repo first
(python3 -m http.server 8793). Exit 1 if either outcome never happens."""
import sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

ok = True
with sync_playwright() as p:
    b = launch(p)
    for step in (4, 6):
        pg = b.new_page(viewport={"width": 1440, "height": 860})
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"http://localhost:8793/deux-generaux/index.html?instant=1#story={step}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.evaluate("""() => { window.__ev = []; const h = demo.sim.hooks, f = h.onMessenger;
          h.onMessenger = (m, ev) => { if (ev !== 'sent') window.__ev.push([ev, m.u]); f(m, ev); }; }""")
        seen, shot = [], False
        for k in range(16):
            pg.wait_for_timeout(int(k * 1700) % 7000)   # vary the launch time against the sweep
            pg.click("#play")
            pg.wait_for_function("window.__ev.length > %d" % len(seen), timeout=60000)
            ev, u = pg.evaluate("window.__ev[window.__ev.length - 1]")
            seen.append(ev); print(f"step {step} try {k + 1}: {ev} at u={u:.2f}")
            if ev == "captured" and not shot:
                pg.wait_for_selector("#play:not([disabled])", timeout=60000)
                pg.wait_for_timeout(1500)
                pg.screenshot(path=f"out/beam-s{step}.png"); shot = True
            else:
                pg.wait_for_selector("#play:not([disabled])", timeout=60000)
            if "captured" in seen and "delivered" in seen: break
        print(f"step {step}: {seen}, errors: {errors or 'none'}")
        ok &= "captured" in seen and "delivered" in seen and not errors
        pg.close()
    b.close()
sys.exit(0 if ok else 1)
