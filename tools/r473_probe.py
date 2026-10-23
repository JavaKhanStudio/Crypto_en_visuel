#!/usr/bin/env python3
"""r473 probe: cle-vallee step 5 at rest on a phone: the bubble, the top-bar tab, the room's band and
the frame's top (the RSA-250 plate) on screen; fails when the bubble runs into it. python3 tools/r473_probe.py [base] [lang]"""
import sys, json
from playwright.sync_api import sync_playwright
from browser import launch
base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    pg.goto(f"{base}cle-vallee/?instant=1&lang={lang}#story=5")
    pg.wait_for_function("window.demo && demo.ready && demo.inside.active", timeout=60000)
    pg.add_style_tag(content=".bubble { transition: none !important; }")
    pg.wait_for_timeout(2500)
    pg.evaluate("demo.inside.hold = 16"); pg.wait_for_timeout(2500)
    m = pg.evaluate("""() => {
      const r = id => { const b = document.getElementById(id)?.getBoundingClientRect(); return b && [Math.round(b.top), Math.round(b.bottom)]; };
      const bub = [...document.querySelectorAll('.bubble.show')].map(e => { const b = e.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; });
      const R = demo.inside, band = R.band?.(), w = R.want;
      let top = null;
      if (w) { const v = w.box.max.clone(); v.x = (w.box.min.x + w.box.max.x) / 2; v.project(R.camera || demo.camera); top = Math.round((1 - v.y) / 2 * innerHeight); }
      return { topbar: r('topbar'), tab: r('topbar-tab'), modes: r('modes'), bubbles: bub, band: band && [Math.round(band.top), Math.round(band.top + band.h)], wantBand: w && [Math.round(w.b.top), Math.round(w.b.top + w.b.h)], frameTop: top };
    }""")
    b.close()
print(json.dumps(m))
ok = all(bot <= m["frameTop"] for _, bot in m["bubbles"])
print("ok: the bubble ends above the frame's top" if ok else "FAIL: a bubble runs into the frame's top")
sys.exit(0 if ok else 1)
