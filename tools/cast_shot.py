#!/usr/bin/env python3
"""r330: shoots lab/cast/ (lib/cast.js, one row per disguise, today's copies on top) full page, or another
page of it (--page fit.html: lib/fit.js's findings drawn on the figures; --query 'setting=roman&apart=1').
    tools/cast_shot.py out/cast.png [--turn 0.45] [--width 1440] [--page fit.html] [--query ...] [--base http://localhost:8793/]"""
import argparse, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
ap = argparse.ArgumentParser(); ap.add_argument("out"); ap.add_argument("--turn", default=".45")
ap.add_argument("--width", type=int, default=1440); ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default=""); ap.add_argument("--query", default="")
a = ap.parse_args()
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": a.width, "height": 900})
    errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{a.base}lab/cast/{a.page}?turn={a.turn}&{a.query}", wait_until="commit")   # fit.html checks every figure before load fires
    pg.wait_for_function("window.labReady === true", timeout=300000); pg.wait_for_timeout(500)
    pg.screenshot(path=a.out, full_page=True)
    rep = pg.evaluate("window.fitReport || null")
    if rep: print(json.dumps(rep, indent=1, ensure_ascii=False))
    print(a.out, "errors:", errors or "none")
    b.close()
