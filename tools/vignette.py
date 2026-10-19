#!/usr/bin/env python3
"""The card image for an episode on the series home: a clean canvas-only frame (the DOM panels
hidden), 640×360, saved as <slug>/vignette.jpg. Serve the repo root first
(python3 -m http.server 8793), or pass --base.

    tools/vignette.py garde --hash '#story=2' --click '#play' \
        --pos 2,42,78 --target 2,30,-14 --wait 7000

--pos / --target place the camera (a named shot name also works via --shot); --click presses a
button after load (e.g. to let a story action play) before the frame is taken.
"""
import argparse
from playwright.sync_api import sync_playwright
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("slug")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--hash", default="")
ap.add_argument("--click", default="")
ap.add_argument("--shot", default="")
ap.add_argument("--pos", default="")
ap.add_argument("--target", default="")
ap.add_argument("--wait", type=int, default=6000)
ap.add_argument("--out", default="")
ap.add_argument("--real-speed", action="store_true", help="no ?instant=1, so a story ride plays at its own pace (eve-lit-tout: the rider held at the gate)")
a = ap.parse_args()
out = a.out or f"{a.slug}/vignette.jpg"
W, H = 1280, 720
hide = "for(const s of ['#topbar','#story','#sandbox','#quiz','#card','#bubbles','#toast','#loading'])" \
       "{const e=document.querySelector(s); if(e) e.style.display='none';}"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": W, "height": H})
    errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{a.base}{a.slug}/{'' if a.real_speed else '?instant=1'}{a.hash}", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    if a.click:
        pg.wait_for_timeout(800); pg.click(a.click)
    pg.wait_for_timeout(a.wait)
    if a.shot:
        pg.evaluate(f"demo.rig.jump('{a.shot}')")
    elif a.pos and a.target:
        px, py, pz = a.pos.split(","); tx, ty, tz = a.target.split(",")
        pg.evaluate(f"demo.rig.jump({{pos:new demo.THREE.Vector3({px},{py},{pz}),"
                    f"target:new demo.THREE.Vector3({tx},{ty},{tz})}})")
    pg.evaluate(hide)
    pg.wait_for_timeout(400)
    pg.screenshot(path="/tmp/_vignette.png")
    Image.open("/tmp/_vignette.png").resize((640, 360), Image.LANCZOS).save(out, quality=86)
    print(out, "errors:", errors or "none")
    b.close()
