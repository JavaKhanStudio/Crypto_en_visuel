#!/usr/bin/env python3
"""Stills of a castle room (r103) at chosen seconds of a beat, and a contact sheet: the room's clock is
held (demo.inside.hold) so each shot is the pose at that second and the camera on its framing, the
way a reader sees it once the camera has caught up; lib/room.js honours `hold` for every saga room
(r160, r424). Serve the repo first (python3 -m http.server 8793).

    tools/room_stills.py out/r160/fr-390 --page cle-vallee/ --step 7 --at 1,3,5,8,10.5,12,14,17,19 --size 390x844
--from N (r603): the room reached by sliding from step N (no ?instant), the one lib/room.js ahead() built,
compiled and warmed while N was read, instead of the room entered straight in.
"""
import argparse, time
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="cle-vallee/")
ap.add_argument("--step", type=int, required=True, help="1-based, a step inside the room")
ap.add_argument("--at", default="1,4,8,12,16,20")
ap.add_argument("--lang", default="fr")
ap.add_argument("--size", default="1440x860")
ap.add_argument("--from", dest="frm", type=int, help="slide in from this step, once its next room is built ahead (r603)")
ap.add_argument("--settle", type=int, default=1800)
ap.add_argument("--mask", type=int, default=0, help="mock (r474): fade the scene to dark over N px under the top controls")
a = ap.parse_args()
w, h = map(int, a.size.split("x"))
errors, shots = [], []
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": w, "height": h}, is_mobile=w < 900, has_touch=w < 900)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    if a.frm:
        pg.goto(f"{a.base}{a.page}?lang={a.lang}#story={a.frm}")
        pg.wait_for_function("window.demo && demo.ready && demo.inside.active && !demo.inside.arrival", timeout=60000)
        pg.wait_for_function("demo.inside.next?.warm", timeout=30000)
        pg.evaluate(f"demo.story.go({a.step - 1})")
        pg.wait_for_function("demo.inside.log.at(-1)[0] === 'slide' && !demo.inside.sliding", timeout=30000)
    else:
        pg.goto(f"{a.base}{a.page}?instant=1&lang={a.lang}#story={a.step}")
        pg.wait_for_function("window.demo && demo.ready && demo.inside.active", timeout=60000)
    pg.add_style_tag(content=".bubble { transition: none !important; }")
    pg.wait_for_timeout(2500)
    if a.mask:   # a mock, not the page's: a dark gradient laid on the canvas from the bar's foot down
        pg.evaluate("""n => { const bar = Math.max(...['topbar', 'modes', 'lang'].map(i => document.getElementById(i)?.getBoundingClientRect().bottom || 0));
          const c = document.querySelector('canvas'), d = document.createElement('div');
          d.style.cssText = `position:fixed;left:0;right:0;top:0;height:${bar + n}px;pointer-events:none;
            background:linear-gradient(to bottom, #0b0806 ${bar}px, rgba(11,8,6,.0) ${bar + n}px)`;
          c.after(d); }""", a.mask)
    for s in [float(x) for x in a.at.split(",")]:
        pg.evaluate(f"demo.inside.hold = {s}")
        pg.wait_for_timeout(a.settle)
        f = f"{a.out}-{s:05.1f}s.png"; pg.screenshot(path=f); shots.append((f, s))
    b.close()
cols = 3 if w < h else 2
tw = w // 2 if w < h else w // 2
th = round(tw * h / w)
sheet = Image.new("RGB", (cols * tw, -(-len(shots) // cols) * th))
for i, (f, s) in enumerate(shots):
    x, y = i % cols * tw, i // cols * th
    sheet.paste(Image.open(f).convert("RGB").resize((tw, th)), (x, y))
    ImageDraw.Draw(sheet).text((x + 6, y + 4), f"{s:.1f} s", fill="yellow")
sheet.save(a.out + ".png")
print(a.out + ".png", "errors:", errors or "none")
