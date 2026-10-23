#!/usr/bin/env python3
"""r406: the top bar out of the way (lib/topbar.js, the default) in its states, one PNG each.
    tools/topbar_shot.py out/r406 [--page deux-generaux/] [--hash '#story=3'] [--base URL] [--phone 360x640]
Desktop 1440x860 (a mouse): arrival, faded (pointer down in the scene), back (pointer near the bar).
Phone 390x844 (a finger, no hover): tucked, then opened with the tab, then mid-way back (the glide).
Prints the bubbles' and the card's top in each state: the scene must take the room back."""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from browser import launch
ap = argparse.ArgumentParser(); ap.add_argument("out")
ap.add_argument("--page", default="deux-generaux/"); ap.add_argument("--hash", default="#story=3")
ap.add_argument("--base", default="http://localhost:8793/"); ap.add_argument("--lang", default="fr")
ap.add_argument("--phone", default="390x844")   # r567: the small phone, 360x640, where the bar matters most
a = ap.parse_args(); os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
url = f"{a.base}{a.page}?instant=1&lang={a.lang}{a.hash}"
slug = a.page.strip("/") or "home"
with sync_playwright() as p:
    b = launch(p)
    errors = []
    TOPS = "JSON.stringify({bar: Math.round(document.getElementById('topbar').getBoundingClientRect().bottom), " \
           "bubbles: [...document.querySelectorAll('.bubble.show')].map(e => Math.round(e.getBoundingClientRect().top)), " \
           "card: Math.round(document.getElementById('card')?.getBoundingClientRect().top ?? -1)})"
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(url); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.mouse.move(700, 40); pg.wait_for_timeout(800); pg.screenshot(path=f"{a.out}-{slug}-desk-near.png")
    print("desktop near:", pg.evaluate(TOPS))
    pg.mouse.move(700, 500); pg.wait_for_timeout(3000); pg.screenshot(path=f"{a.out}-{slug}-desk-faded.png")
    print("desktop faded:", pg.evaluate("document.getElementById('topbar').classList.contains('faded')"), pg.evaluate(TOPS))
    pg.mouse.move(700, 150); pg.wait_for_timeout(900)
    print("desktop near again:", not pg.evaluate("document.getElementById('topbar').classList.contains('faded')"))
    pg.close()
    ctx = b.new_context(viewport=dict(zip(("width", "height"), map(int, a.phone.split("x")))), has_touch=True, is_mobile=True, device_scale_factor=2)
    pg = ctx.new_page(); pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(url); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000); pg.wait_for_timeout(2500)
    pg.screenshot(path=f"{a.out}-{slug}-{a.phone}-tucked.png"); print("phone tucked:", pg.evaluate(TOPS))
    pg.tap("#topbar-tab"); pg.wait_for_timeout(900); pg.screenshot(path=f"{a.out}-{slug}-{a.phone}-open.png")
    print("phone opened:", not pg.evaluate("document.getElementById('topbar').classList.contains('away')"), pg.evaluate(TOPS))
    pg.tap("#topbar-tab"); pg.wait_for_timeout(200); pg.screenshot(path=f"{a.out}-{slug}-{a.phone}-closing.png")
    print("phone closing:", pg.evaluate(TOPS))
    b.close()
print("errors:", errors or "none")
