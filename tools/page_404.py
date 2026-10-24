#!/usr/bin/env python3
"""Every URL a page asks for that answers 400 or more (r333: after the switch to ficelle/, a path left
pointing at the old root lib/ or assets/ shows only as 'Failed to load resource' in shoot.py).

    python3 tools/page_404.py lab/cast/ deux-generaux/ [--base http://localhost:8793/] [--wait 6000]
"""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
import browser

ap = argparse.ArgumentParser()
ap.add_argument("pages", nargs="+")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--wait", type=int, default=6000)
a = ap.parse_args()
bad_pages = 0
with sync_playwright() as p:
    b = browser.launch(p)
    for path in a.pages:
        pg, bad = b.new_page(), set()
        pg.on("response", lambda r: r.status >= 400 and bad.add(f"{r.status} {r.url}"))
        pg.goto(a.base + path, wait_until="domcontentloaded"); pg.wait_for_timeout(a.wait)
        print(("FAIL " if bad else "ok   ") + path + "".join("\n       " + u for u in sorted(bad)))
        bad_pages += bool(bad); pg.close()
    b.close()
sys.exit(1 if bad_pages else 0)
