#!/usr/bin/env python3
"""r449: the saga's sky before and after, every story step of 1.1-1.6, side by side.

Each step is shot at rest (?instant=1, then held 1.6 s) on two served trees, BEFORE (--before, e.g. an origin/main
worktree on another port) on the left and AFTER (--after, default localhost:8793) on the right, and the pairs are
laid out as one contact sheet per episode and size: <out>/<ep>-<size>.png. The after page waits for
demo.world.skyReady, so the painted page is in. Prints page errors (must be none); exit 1 on any.
    tools/saga_sky_shots.py out/r449 --before http://localhost:8798/ [--ep deux-generaux ...] [--size 1440x900 390x844]
"""
import argparse, pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

SAGA = ["deux-generaux", "eve-lit-tout", "octet-change", "cle-vallee", "paquet-complet", "encore-des-tours"]
ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--before", required=True)
ap.add_argument("--after", default="http://localhost:8793/")
ap.add_argument("--ep", nargs="*", default=SAGA)
ap.add_argument("--size", nargs="*", default=["1440x900", "390x844"])
ap.add_argument("--steps", default="", help="comma list of 1-based steps (default: all)")
a = ap.parse_args()
out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
bad = 0

def open_page(br, base, ep, w, h):
    phone = w < 900
    pg = br.new_page(viewport={"width": w, "height": h}, has_touch=phone, is_mobile=phone)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"{base}{ep}/?instant=1&lang=fr#story=1", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=90000)
    pg.evaluate("demo.world.skyReady || null")
    return pg, errs

with sync_playwright() as p:
    br = launch(p)
    for ep in a.ep:
        for size in a.size:
            w, h = map(int, size.split("x"))
            pages = [open_page(br, base, ep, w, h) for base in (a.before, a.after)]
            n = int(pages[1][0].evaluate("document.getElementById('step-count').textContent.match(/(\\d+)\\D*$/)[1]"))
            steps = [int(s) for s in a.steps.split(",") if s] or range(1, n + 1)
            pairs = []
            for i in steps:
                shots = []
                for k, (pg, _) in enumerate(pages):
                    pg.evaluate(f"demo.story.go({i - 1})"); pg.wait_for_timeout(1600)
                    f = out / f"{ep}-{size}-s{i}-{'ab'[k]}.png"; pg.screenshot(path=str(f)); shots.append(f)
                pairs.append(shots)
            for k, (pg, errs) in enumerate(pages):
                if errs: print(ep, size, ("before", "after")[k], "errors:", errs[:2]); bad += k == 1
                pg.close()
            sc = 360 / w if w > h else 195 / w
            tw, th = int(w * sc), int(h * sc)
            cols = 2 if w > h else 3
            sheet = Image.new("RGB", (cols * (2 * tw + 12), ((len(pairs) + cols - 1) // cols) * (th + 6)), "black")
            for j, (b4, af) in enumerate(pairs):
                x, y = (j % cols) * (2 * tw + 12), (j // cols) * (th + 6)
                sheet.paste(Image.open(b4).convert("RGB").resize((tw, th)), (x, y))
                sheet.paste(Image.open(af).convert("RGB").resize((tw, th)), (x + tw + 2, y))
            f = out / f"{ep}-{size}.png"; sheet.save(f); print(f, len(pairs), "steps")
    br.close()
print("errors: none" if not bad else f"{bad} pages with errors")
sys.exit(1 if bad else 0)
