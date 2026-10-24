#!/usr/bin/env python3
"""r572: evaluates a JS expression in lab/print/ once its rows are measured, prints the JSON it returns.
Served through tools/serve_review.py like the tests. For probing what lib/print.js made of an asset.
    tools/print_probe.py "<js returning JSON>" [--ep deux-generaux] [--assets tests/print/shape-assets.js]"""
import argparse, json, tempfile
from playwright.sync_api import sync_playwright
from browser import launch
from serve_review import serve
ap = argparse.ArgumentParser(); ap.add_argument("js"); ap.add_argument("--ep", default="deux-generaux"); ap.add_argument("--assets")
a = ap.parse_args()
base = serve(0, review_dir=tempfile.mkdtemp(prefix="print_probe-"))[0]
with sync_playwright() as p:
    pg = launch(p).new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"{base}lab/print/?ep={a.ep}" + (f"&assets={a.assets}" if a.assets else ""))
    pg.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
    print(json.dumps(pg.evaluate(a.js)))
    if errs: print("page errors:", errs)
