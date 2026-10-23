#!/usr/bin/env python3
"""How far each saga castle step's phone shot backs off (r516, lib/saga/camera.js held()).
Prints, per episode step, the held distance over the written shot's for castleA and castleB, at 390x844:
1 = the castle already fits the free band and keeps its shot.
    tools/castle_hold.py [base] [ep:step ...]   (base: a served repo, default http://localhost:8793/)"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from browser import launch
args = sys.argv[1:]
base = args.pop(0) if args and args[0].startswith("http") else "http://localhost:8793/"
CASES = [a.split(":") for a in args] or [("octet-change", 10), ("octet-change", 11), ("deux-generaux", 7), ("deux-generaux", 2),
  ("cle-vallee", 1), ("encore-des-tours", 4), ("paquet-complet", 1)]
with sync_playwright() as p:
    b = launch(p); pg = b.new_page(viewport={"width": 390, "height": 844})
    for ep, s in CASES:
        pg.goto(f"{base}{ep}/?instant=1#story={s}"); pg.wait_for_timeout(6000)
        print(ep, s, pg.evaluate("""async () => { const m = await import('/lib/saga/camera.js'), out = {};
          for (const n of ['castleA', 'castleB']) { const h = m.held(n, demo.camera), o = m.SHOTS[n];
            out[n] = +(h.pos.distanceTo(h.target) / o.pos.distanceTo(o.target)).toFixed(2); } return out; }"""))
    b.close()
