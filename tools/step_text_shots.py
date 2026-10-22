"""Shoot the story steps of one episode in one page per language and size (r240): loads
<page>/?instant=1&lang=L#story=first, then demo.story.go(n-1) for each step, so a whole step-text
audit costs four page loads instead of one per shot. Serve the repo first (python3 -m http.server 8793).
  python3 tools/step_text_shots.py out/r240 --page enigma-reglage --steps 1,2,4 [--langs fr,en] [--sizes 1440x860,390x844]
Writes out/r240-<lang>-<w>-s<n>.png and prints the page errors, which must be none."""
import argparse
from playwright.sync_api import sync_playwright
ap = argparse.ArgumentParser(); ap.add_argument('out'); ap.add_argument('--page', required=True)
ap.add_argument('--steps', required=True); ap.add_argument('--langs', default='fr,en')
ap.add_argument('--sizes', default='1440x860,390x844'); ap.add_argument('--base', default='http://localhost:8793/')
ap.add_argument('--wait', type=int, default=2500)
a = ap.parse_args()
steps = [int(s) for s in a.steps.split(',')]
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    for lang in a.langs.split(','):
        for size in a.sizes.split(','):
            W, H = map(int, size.split('x'))
            pg = b.new_page(viewport={"width": W, "height": H}); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(f"{a.base}{a.page}/?instant=1&lang={lang}#story={steps[0]}", wait_until="load")
            pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
            for n in steps:
                pg.evaluate(f"demo.story.go({n - 1})"); pg.wait_for_timeout(a.wait)
                out = f"{a.out}-{lang}-{W}-s{n}.png"; pg.screenshot(path=out); print(out)
            print(lang, size, 'errors:', errs or 'none')
            pg.close()
    b.close()
