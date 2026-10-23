#!/usr/bin/env python3
"""Episode 1.7 « À toi de jouer » (r505): a strip of one wrong pick then the right one, at real speed,
for Simon's eyes. Step N's choices: the three; a wrong one riding (Eve at her gate); its verdict, red;
the right one riding; its verdict, green, with « continue »; « try another », the right one green.
Writes <out>-<k>.png per frame and <out>.png, the frames side by side. Serve the repo first.

    tools/jouer_strip.py out/jouer/strip [--step 2] [--wrong ecb] [--right cbc] [--size 1440x860] [--lang fr]
"""
import argparse
from playwright.sync_api import sync_playwright
from PIL import Image
from browser import launch

ap = argparse.ArgumentParser()
ap.add_argument("out"); ap.add_argument("--step", type=int, default=2)
ap.add_argument("--wrong", default="ecb"); ap.add_argument("--right", default="cbc")
ap.add_argument("--size", default="1440x860"); ap.add_argument("--lang", default="fr")
ap.add_argument("--base", default="http://localhost:8793/")
a = ap.parse_args()
w, h = map(int, a.size.split("x"))
EVE = "() => [...document.querySelectorAll('#bubbles .bubble.show')].some(b => b.querySelector('.who')?.textContent === 'Eve' && b.offsetWidth)"
DONE = "() => ['wrong', 'right'].includes(document.querySelector('.choices')?.dataset.state)"

with sync_playwright() as p:
    b = launch(p)
    pg = b.new_context(viewport={"width": w, "height": h}, has_touch=w < 900).new_page()
    errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{a.base}a-toi-de-jouer/?lang={a.lang}&topbar=pin#story={a.step}", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(4500)
    frames = []

    def shot(k):
        path = f"{a.out}-{k}.png"; pg.screenshot(path=path); frames.append(path)

    shot("1-pick")
    for n, k in [(2, a.wrong), (4, a.right)]:
        pg.locator(f".choice[data-k={k}]").click()
        pg.wait_for_function(EVE, timeout=60000); pg.wait_for_timeout(1400)
        shot(f"{n}-{k}-ride")
        pg.wait_for_function(DONE, timeout=60000); pg.wait_for_timeout(600)
        shot(f"{n + 1}-{k}-verdict")
    pg.locator("#choice-again").click(); pg.wait_for_timeout(300)
    shot("6-again")
    b.close()

scale = 480 / w
ims = [Image.open(f) for f in frames]
ims = [im.resize((int(im.width * scale), int(im.height * scale))) for im in ims]
sheet = Image.new("RGB", (sum(im.width for im in ims) + 8 * (len(ims) - 1), ims[0].height), "black")
x = 0
for im in ims: sheet.paste(im, (x, 0)); x += im.width + 8
sheet.save(f"{a.out}.png")
print(f"{a.out}.png", "errors:", errors[:2] or "none")
