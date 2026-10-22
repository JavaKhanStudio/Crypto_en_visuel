#!/usr/bin/env python3
"""The story panel's nav row (◀ Précédent · Étape i / n · Suivant ▶) holds on one line on a phone
(r312): at 360 and 390 px wide, fr and en, steps 2 and 12, the counter is one line high and the
two buttons sit on its row. Serve the repo first (python3 -m http.server 8793).
    python3 tests/nav_row.py pingouin [more episodes]"""
import sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

BASE = "http://localhost:8793/"
MEASURE = """() => { const r = id => document.getElementById(id).getBoundingClientRect(), c = r('step-count'), p = r('prev'), n = r('next');
  const line = parseFloat(getComputedStyle(document.getElementById('step-count')).lineHeight) || 19;
  return { h: c.height, line, prevMid: p.top + p.height / 2, nextMid: n.top + n.height / 2, mid: c.top + c.height / 2, text: document.getElementById('step-count').textContent }; }"""
bad = 0
with sync_playwright() as pw:
    b = launch(pw)
    for ep in sys.argv[1:] or ["pingouin"]:
        for w in (360, 390):
            for lang in ("fr", "en"):
                for step in (2, 12):
                    pg = b.new_page(viewport={"width": w, "height": 800})   # a new page each: a hash change alone does not reload
                    pg.goto(f"{BASE}{ep}/?lang={lang}&instant=1#story={step}", wait_until="load")
                    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
                    pg.wait_for_timeout(300)
                    m = pg.evaluate(MEASURE)
                    ok = m["h"] < 1.6 * m["line"] and abs(m["prevMid"] - m["mid"]) < 4 and abs(m["nextMid"] - m["mid"]) < 4
                    bad += not ok
                    print("ok  " if ok else "BAD ", ep, f"{w}px", lang, f"#story={step}", repr(m["text"]), f"h={m['h']:.0f}")
                    pg.close()
    b.close()
print("all ok" if not bad else f"{bad} bad")
sys.exit(1 if bad else 0)
