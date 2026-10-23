#!/usr/bin/env python3
"""r503: on a phone with the top bar tucked (lib/topbar.js, r406), does every keep room's wall reach the
screen's top? Each room step of the five saga room episodes, at 390x844 and 360x640 (touch, ?instant=1,
held at rest), the canvas read back (no HTML on it) and its top 64 CSS px searched for the room's dark
beyond the wall (scene.background 0x120c08): the rows from the screen's top edge down that are mostly dark.
    tools/room_top.py [--base URL] [--out out/r503/top] [ep ...]     # prints each step, then all ok / N bad
"""
import argparse, base64, io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from browser import launch   # r401
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("eps", nargs="*", default="eve-lit-tout octet-change cle-vallee paquet-complet encore-des-tours".split())
ap.add_argument("--base", default="http://localhost:8793/"); ap.add_argument("--out", default="")
a = ap.parse_args()
STRIP = 64   # CSS px: the bar's height and more
bad = 0
with sync_playwright() as p:
    b = launch(p)
    for ep in a.eps:
        for w, h in [(390, 844), (360, 640)]:
            ctx = b.new_context(viewport={"width": w, "height": h}, has_touch=True, is_mobile=True, device_scale_factor=2)
            pg = ctx.new_page(); errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.goto(f"{a.base}{ep}/?instant=1#story=1"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
            steps = pg.evaluate("""async () => { const m = await import(location.pathname + 'js/story.js');
              return m.STEPS.map((s, i) => s.inside ? i : -1).filter(i => i >= 0); }""")
            for i in steps:
                pg.evaluate(f"demo.story.go({i})"); pg.wait_for_timeout(1500)
                pg.evaluate("demo.inside.hold = 1e3")   # at rest, the beat's end
                pg.wait_for_timeout(400)
                url = pg.evaluate("() => { demo.composer.render(); return demo.renderer.domElement.toDataURL('image/png'); }")
                im = Image.open(io.BytesIO(base64.b64decode(url.split(",")[1]))).convert("RGB")
                k = im.width / w; top = im.crop((0, 0, im.width, int(STRIP * k)))
                px = top.load(); rows = 0   # dark rows from the very top down (mortar lower down is not a gap)
                for y in range(top.height):
                    dark = sum(1 for x in range(0, top.width, 4) if max(px[x, y]) < 40)
                    if dark <= .6 * (top.width / 4): break
                    rows += 1
                gap = round(rows / k)
                if a.out: os.makedirs(os.path.dirname(a.out), exist_ok=True); im.save(f"{a.out}-{ep}-{w}-{i + 1}.png")
                print(f"{'ok ' if not gap else 'BAD'}  {ep:17} {w}x{h} step {i + 1:2}: {gap} px of dark in the top {STRIP}")
                bad += bool(gap)
            if errors: print("   page errors:", errors[:3]); bad += 1
            ctx.close()
    b.close()
print("all ok" if not bad else f"{bad} bad"); sys.exit(bool(bad))
