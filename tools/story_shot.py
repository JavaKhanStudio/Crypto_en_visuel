"""Shoot an enigma-reglage story step after its action button has played (bubble shown), and print the
name tags cut by the screen edge or under a bubble or panel. Serve the repo first (python3 -m http.server 8793).
  python3 tools/story_shot.py out/name 7 [--lang en] [--base http://localhost:8793/]   (r125)"""
import argparse, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, 'tests')
ap = argparse.ArgumentParser(); ap.add_argument('out'); ap.add_argument('step', type=int)
ap.add_argument('--lang', default='fr'); ap.add_argument('--base', default='http://localhost:8793/'); ap.add_argument('--size', default='1440x860')
a = ap.parse_args()
W, H = map(int, a.size.split('x'))
src = open('tests/enigma-reglage_story.py').read()
TAGS = src.split('TAGS = """', 1)[1].split('"""', 1)[0]
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": W, "height": H}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"{a.base}enigma-reglage/?instant=1&lang={a.lang}#story={a.step}", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000); pg.wait_for_timeout(1500)
    idle = "() => [...document.querySelectorAll('#play, #step-actions button')].every(b => !b.disabled)"
    pg.wait_for_function(idle, timeout=120000)
    btn = pg.locator("#play") if pg.locator("#play").count() else pg.locator("#step-actions button").first
    btn.click(); pg.wait_for_timeout(300); pg.wait_for_function(idle, timeout=180000); pg.wait_for_timeout(1200)
    pg.screenshot(path=a.out + '.png')
    print(a.out + '.png', 'tags:', pg.evaluate(TAGS) or 'all clear', 'errors:', errs or 'none')
    b.close()
