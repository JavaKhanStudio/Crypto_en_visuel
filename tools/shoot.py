#!/usr/bin/env python3
"""Headless screenshots of the demo (playwright, WebGL on SwiftShader). Never opens a window.

Serve the repo first:  python3 -m http.server 8793   (from the repo root)

    tools/shoot.py out/dg                         # -> out/dg.png, Two Generals' first screen
    tools/shoot.py out/home --page ''             # the series home page
    tools/shoot.py out/s5 --hash '#story=5' --wait 6000
    tools/shoot.py out/sb --hash '#sandbox' --eval "demo.sim.send('a')" --wait 4000

--eval runs JS after load (window.demo is the debug handle). Prints page errors.
"""
import argparse
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="deux-generaux/", help="the episode folder; '' for the home page")
ap.add_argument("--hash", default="")
ap.add_argument("--query", default="")
ap.add_argument("--size", default="1440x860")
ap.add_argument("--wait", type=int, default=3500)
ap.add_argument("--eval", action="append", default=[])
a = ap.parse_args()
w, h = map(int, a.size.split("x"))
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": w, "height": h})
    errors, logs = [], []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: logs.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    pg.goto(a.base + a.page + a.query + a.hash, wait_until="load")
    try:
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    except Exception:
        print("page never ready; errors:", errors or "none", *logs[:10], sep="\n  ")
        raise SystemExit(1)
    for js in a.eval:
        pg.evaluate(js)
        pg.wait_for_timeout(300)
    pg.wait_for_timeout(a.wait)
    pg.screenshot(path=a.out + ".png")
    print(a.out + ".png", "errors:", errors or "none")
    for l in logs[:10]:
        print("  ", l)
    b.close()
