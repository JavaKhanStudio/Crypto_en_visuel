#!/usr/bin/env python3
"""The repair log lib/print.js writes for an episode's print assets (what PRINT.txt says was fixed),
read from lab/print/ in a hidden browser (r580: why the mast's base showed amber).
  python3 tools/print_log.py <ep> [asset ...]"""
import sys, tempfile, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from playwright.sync_api import sync_playwright
from browser import launch
from serve_review import serve

ep, ids = sys.argv[1], sys.argv[2:]
base = serve(0, review_dir=tempfile.mkdtemp(prefix="print_log-"))[0]
with sync_playwright() as p:
    pg = launch(p).new_page(); pg.goto(f"{base}lab/print/?ep={ep}")
    pg.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
    for id, log in pg.evaluate("ids => printLab.rows.filter(r => r.fix && (!ids.length || ids.includes(r.a.id))).map(r => [r.a.id, r.fix.log])", ids):
        print(f"{id}: {len(log)} fixes"); [print("  " + l) for l in log]
