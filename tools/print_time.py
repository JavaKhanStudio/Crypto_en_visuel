#!/usr/bin/env python3
"""r450: how long lab/print/ takes to load an episode (page open to printLab.ready), and what
floating() and repair() cost on each asset of its list, timed again in the page. Serve the repo first.

    python3 tools/print_time.py [base] [ep]
"""
import sys, time, os
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from browser import launch

base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/"
ep = sys.argv[2] if len(sys.argv) > 2 else "deux-generaux"
with sync_playwright() as p:
    br = launch(p); pg = br.new_page(viewport={"width": 1400, "height": 860})
    t0 = time.time(); pg.goto(f"{base}lab/print/?ep={ep}")
    pg.wait_for_function("window.printLab && window.printLab.ready", timeout=120000, polling=50)
    print(f"lab ready in {time.time() - t0:.2f} s")
    for r in pg.evaluate("""async () => { const P = await import('../../lib/print.js');
        return printLab.rows.filter(r => r.parts).map(r => { const t = performance.now(); const f = P.floating(r.parts, r.k);
          const t1 = performance.now(); const fx = P.repair(r.parts, r.k, { ground: r.a.ground }); const t2 = performance.now();
          return { id: r.a.id, n: r.parts.length, tris: r.parts.reduce((s, p) => s + p.tris.length / 9, 0), floats: f.filter(Boolean).length,
            after: P.floating(fx.ps, r.k).filter(Boolean).length, fl: t1 - t, rep: t2 - t1 }; }); }"""):
        print(f"{r['id']:12} {r['n']:4} pieces {r['tris']:7} tris  floating {r['floats']:2} -> {r['after']}  floating() {r['fl']:7.1f} ms  repair() {r['rep']:7.1f} ms")
    br.close()
