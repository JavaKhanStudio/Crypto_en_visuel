#!/usr/bin/env python3
"""r394: shoots lab/print/ showing one asset (?show=<id>), the preview pane only, optionally zoomed in.
Before/after a change to lib/print.js: serve the old tree on another port and pass --base. With no --base it
serves this tree itself through tools/serve_review.py (r452: the lab runs only there), in a temp review dir.
    tools/print_shot.py out/x.png --asset castle-b [--ep deux-generaux] [--zoom 1] [--base http://localhost:8811/] [--assets tests/print/shape-assets.js] [--no-review]
        [--camera x,y,z --target x,y,z]   (r552: mm in the preview, y up, the bed's centre at 0: a close look, under a body or into a socket)"""
import argparse
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
ap = argparse.ArgumentParser(); ap.add_argument("out"); ap.add_argument("--asset", required=True)
ap.add_argument("--ep", default="deux-generaux"); ap.add_argument("--zoom", type=float, default=1)
ap.add_argument("--base")
ap.add_argument("--assets", help="a test list instead of the episode's, tests/<path>.js (r451)")
ap.add_argument("--camera"); ap.add_argument("--target")
ap.add_argument("--no-review", action="store_true", help="hide the review panel, which covers the preview's lower right (r453: a castle's flag body lies there)")
a = ap.parse_args()
if not a.base:
    import tempfile; from serve_review import serve
    a.base = serve(0, review_dir=tempfile.mkdtemp(prefix='print_shot-'))[0]
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": 1400, "height": 860})
    errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{a.base}lab/print/?ep={a.ep}&show={a.asset}" + (f"&assets={a.assets}" if a.assets else ""))
    pg.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
    if a.zoom != 1:   # the wheel zooms the orbit camera towards its target
        box = pg.locator("#view canvas").bounding_box(); pg.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        for _ in range(int(a.zoom)): pg.mouse.wheel(0, -300); pg.wait_for_timeout(120)
    if a.camera or a.target:
        pg.evaluate("""([c, t]) => { const { camera, controls } = printLab.view; if (t) controls.target.set(...t); if (c) camera.position.set(...c); controls.update(); }""",
            [a.camera and [float(x) for x in a.camera.split(",")], a.target and [float(x) for x in a.target.split(",")]])
    if a.no_review: pg.add_style_tag(content="#rv { display: none; }")
    pg.wait_for_timeout(800)
    pg.locator("#view").screenshot(path=a.out)
    print(a.out, "errors:", errors or "none")
    b.close()
