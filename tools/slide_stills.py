#!/usr/bin/env python3
"""r496: stills of the slide from one keep room to another (lib/room.js slide), held at chosen shares of
it, desktop and phone: <out>-<w>-<pct>.png and a strip <out>-<w>.png per size.
    tools/slide_stills.py out/r496/mid [--base URL] [--page paquet-complet/] [--from 5] [--step 7] [--at .3,.5,.7]
"""
import argparse
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="paquet-complet/")
ap.add_argument("--from", dest="frm", type=int, default=5)
ap.add_argument("--step", type=int, default=7)
ap.add_argument("--at", default=".3,.5,.7")
ap.add_argument("--sizes", default="1280x760,390x844")
a = ap.parse_args()
ats = [float(x) for x in a.at.split(",")]
with sync_playwright() as p:
    b = launch(p)
    for size in a.sizes.split(","):
        w, h = map(int, size.split("x"))
        pg = b.new_page(viewport={"width": w, "height": h}); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"{a.base}{a.page}#story={a.frm}"); pg.wait_for_function("window.demo && demo.ready", timeout=60000)
        pg.wait_for_function("demo.inside.active && !demo.inside.arrival", timeout=30000); pg.wait_for_timeout(1500)
        for at in ats:   # the slide's clock k held at `at` (a getter that ignores update's writes)
            pg.evaluate("""([at, step]) => new Promise(res => { if (!demo.inside.sliding) demo.story.go(step);
              const f = () => { const sl = demo.inside.sliding; if (sl && sl.k >= at) { Object.defineProperty(sl, 'k', { get: () => at, set: () => {}, configurable: true }); res(); } else requestAnimationFrame(f); }; f(); })""", [at, a.step - 1])
            pg.wait_for_timeout(400); pg.screenshot(path=f"{a.out}-{w}-{round(at * 100)}.png")
            pg.evaluate("at => { const sl = demo.inside.sliding; delete sl.k; sl.k = at; }", at)
        pg.close()
        ims = [Image.open(f"{a.out}-{w}-{round(at * 100)}.png") for at in ats]
        strip = Image.new("RGB", (sum(i.width for i in ims) + 10 * (len(ims) - 1), h), "white")
        for i, im in enumerate(ims): strip.paste(im, (i * (w + 10), 0))
        strip.save(f"{a.out}-{w}.png")
        print(f"{a.out}-{w}.png errors:", errs or "none")
    b.close()
