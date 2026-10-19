#!/usr/bin/env python3
"""Where each shown speech bubble sits, step by step: run before and after a bubbles.js change and diff (r84).

Serve the repo first (python3 -m http.server 8793).
    tools/bubble_spots.py diffie-hellman:14:1440x860 garde:8:1200x720 ...   (episode:step:size)
BASE=http://localhost:8795/ tools/bubble_spots.py ...   reads another server (a worktree of HEAD, to diff against)."""
import os, sys
from playwright.sync_api import sync_playwright

JS = """() => [...document.querySelectorAll('#bubbles .bubble.show')].map(e => e.querySelector('.who').textContent + ' ' + e.style.transform)"""
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    for case in sys.argv[1:]:
        ep, step, size = case.split(":"); w, h = map(int, size.split("x"))
        pg = b.new_page(viewport={"width": w, "height": h})
        pg.goto(f"{os.environ.get('BASE', 'http://localhost:8793/')}{ep}/?instant=1#story={step}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.wait_for_timeout(1500)
        print(case, *pg.evaluate(JS), sep="\n   ")
        pg.close()
    b.close()
