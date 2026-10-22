#!/usr/bin/env python3
"""« AES de l'intérieur » on a small phone (r442): for every story step, the free band the room gets
(band()), the bubble's box, the folded card's box and how tall the state's cubes are drawn, in px.
    tools/aes_band.py [WxH] [lang]"""
import sys
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

W, H = map(int, (sys.argv[1] if len(sys.argv) > 1 else "360x780").split("x"))
lang = sys.argv[2] if len(sys.argv) > 2 else "en"
probe = """() => { const r = demo.room, b = r.band(), q = s => document.querySelector(s)?.getBoundingClientRect();
  const bub = [...document.querySelectorAll('.bubble')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect());
  const ndc = p => p.clone().project(demo.camera), h = innerHeight;
  const G = r.m.G, a = ndc(G.clone().setY(G.y + .575)), z = ndc(G.clone().setY(G.y - .575));
  return { band: [Math.round(b.top), Math.round(b.h)], card: q('#card') && [Math.round(q('#card').top), Math.round(q('#card').bottom)],
    panel: Math.round(q('#story').top), bubble: bub.map(x => [Math.round(x.top), Math.round(x.bottom)]),
    cube_px: Math.round((a.y - z.y) / 2 * h) }; }"""
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": W, "height": H})
    pg.goto(f"http://localhost:8793/aes-interieur/?instant=1&lang={lang}#story=1", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    for i in range(13):
        pg.evaluate(f"demo.story.go({i})"); pg.wait_for_timeout(1500)
        pg.evaluate("demo.room.view.center.copy(demo.room.want.center); demo.room.view.d = demo.room.want.d"); pg.wait_for_timeout(300)
        print(i + 1, pg.evaluate("demo.room.id"), pg.evaluate(probe))
    b.close()
