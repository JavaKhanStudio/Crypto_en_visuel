#!/usr/bin/env python3
"""Frames of an enigma-reglage story step and what follows it, on a hand-driven clock (headless, r202).

Serve the repo first (python3 -m http.server 8793), then:
    tools/reglage_frames.py out/s45 4 play:24 next:12      # step 4's button, 24 frames, then Next, 12 frames
    tools/reglage_frames.py out/s43 4 play:0 wait:40 prev:8 --dt .25
Each word is <action>:<frames>; action is play, next, prev or wait (no click). A frame is --dt
seconds of story time. Writes out/name-NN.png and out/name.png (a contact sheet). Prints page errors.
"""
import argparse
from playwright.sync_api import sync_playwright
from PIL import Image

ap = argparse.ArgumentParser(); ap.add_argument('out'); ap.add_argument('step', type=int); ap.add_argument('acts', nargs='+')
ap.add_argument('--dt', type=float, default=.25); ap.add_argument('--base', default='http://localhost:8793/')
ap.add_argument('--lang', default='fr'); ap.add_argument('--size', default='960x574'); ap.add_argument('--every', type=int, default=1)
a = ap.parse_args()
W, H = map(int, a.size.split('x'))
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": W, "height": H}); errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{a.base}enigma-reglage/?lang={a.lang}#story={a.step}", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.evaluate("demo.freeze()")
    for _ in range(16): pg.evaluate("demo.step(.25)")   # the camera lands
    frames = []; n = 0
    for word in a.acts:
        act, k = word.split(':')
        if act != 'wait': pg.evaluate({'play': "document.querySelector('#play').click()",
                                       'next': "document.querySelector('#next').click()",
                                       'prev': "document.querySelector('#prev').click()"}[act])
        for _ in range(int(k)):
            pg.evaluate(f"demo.step({a.dt})"); n += 1
            if n % a.every == 0:
                f = f"{a.out}-{len(frames):02d}.png"; pg.screenshot(path=f); frames.append(f)
    print("page errors:", errors or "none")
    if frames:
        ims = [Image.open(f).resize((480, 287)) for f in frames]
        cols = 4; rows = (len(ims) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * 480, rows * 287))
        for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * 480, (i // cols) * 287))
        sheet.save(a.out + ".png"); print(a.out + ".png", len(frames), "frames")
    b.close()
