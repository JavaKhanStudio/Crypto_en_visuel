#!/usr/bin/env python3
"""r329: the HD and sound pair (lib/quality.js's .tools span) wears the same glass chip as #lang in
every episode that adopted lib/quality.js, and at every width it stays clear of the other top-bar
chips and inside the screen. Serve the repo first (8793).
    tools/tools_chip.py                 # every episode whose js/main.js imports qualityComposer
    tools/tools_chip.py scytale pingouin
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

eps = sys.argv[1:] or sorted(p.parent.parent.name for p in Path(".").glob("*/js/main.js") if "qualityComposer" in p.read_text())
SIZES = [(360, 780), (375, 812), (390, 844), (400, 844), (401, 844), (420, 844), (900, 800), (1100, 800), (1440, 860)]
PROBE = """() => {
  const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
  const st = s => { const c = getComputedStyle(document.querySelector(s)); return [c.backgroundColor, c.borderTopColor, c.borderRadius, c.backdropFilter]; };
  return { tools: r('#topbar .tools'), others: { modes: r('#modes'), lang: r('#lang'), brand: r('.brand') },
           look: st('#topbar .tools'), lang: st('#lang'), w: innerWidth };
}"""
bad = 0
with sync_playwright() as p:
    b = launch(p)
    for ep in eps:
        for w, h in SIZES:
            pg = b.new_page(viewport={"width": w, "height": h})
            pg.goto(f"http://localhost:8793/{ep}/?instant=1&quality=normal", wait_until="load")
            pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
            d = pg.evaluate(PROBE)
            t, why = d["tools"], []
            if not t: why.append("no .tools")
            else:
                if d["look"] != d["lang"]: why.append(f"chip {d['look']} != #lang {d['lang']}")
                if t[0] < 0 or t[2] > d["w"]: why.append(f"off screen {t}")
                for k, o in d["others"].items():
                    if o and o[2] > 0 and t[0] < o[2] and o[0] < t[2] and t[1] < o[3] and o[1] < t[3]:
                        why.append(f"overlaps {k} by {min(t[2], o[2]) - max(t[0], o[0]):.1f}px")
            print(f"{ep:14} {w:4}  {'ok' if not why else 'BAD ' + '; '.join(why)}")
            bad += bool(why)
            pg.close()
    b.close()
print("all ok" if not bad else f"{bad} bad")
sys.exit(bool(bad))
