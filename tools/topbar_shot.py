#!/usr/bin/env python3
"""r406: the top bar prototype (lib/topbar.js, ?topbar=auto) in its states, one PNG each.
    tools/topbar_shot.py out/r406 [--page deux-generaux/] [--hash '#story=3'] [--base URL]
Desktop 1440x860 (a mouse): arrival, faded (pointer down in the scene), back (pointer near the bar).
Phone 390x844 (a finger, no hover): tucked, then opened with the tab."""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from browser import launch
ap = argparse.ArgumentParser(); ap.add_argument("out")
ap.add_argument("--page", default="deux-generaux/"); ap.add_argument("--hash", default="#story=3")
ap.add_argument("--base", default="http://localhost:8793/"); ap.add_argument("--lang", default="fr")
a = ap.parse_args(); os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
url = f"{a.base}{a.page}?topbar=auto&instant=1&lang={a.lang}{a.hash}"
slug = a.page.strip("/") or "home"
with sync_playwright() as p:
    b = launch(p)
    errors = []
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(url); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.mouse.move(700, 40); pg.wait_for_timeout(800); pg.screenshot(path=f"{a.out}-{slug}-desk-near.png")
    pg.mouse.move(700, 500); pg.wait_for_timeout(3000); pg.screenshot(path=f"{a.out}-{slug}-desk-faded.png")
    print("desktop faded:", pg.evaluate("document.getElementById('topbar').classList.contains('faded')"))
    pg.mouse.move(700, 150); pg.wait_for_timeout(900)
    print("desktop near again:", not pg.evaluate("document.getElementById('topbar').classList.contains('faded')"))
    pg.close()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True, device_scale_factor=2)
    pg = ctx.new_page(); pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(url); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000); pg.wait_for_timeout(2500)
    pg.screenshot(path=f"{a.out}-{slug}-phone-tucked.png")
    pg.tap("#topbar-tab"); pg.wait_for_timeout(900); pg.screenshot(path=f"{a.out}-{slug}-phone-open.png")
    print("phone opened:", not pg.evaluate("document.getElementById('topbar').classList.contains('tucked')"))
    b.close()
print("errors:", errors or "none")
