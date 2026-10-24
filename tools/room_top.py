#!/usr/bin/env python3
"""r503: on a phone with the top bar tucked (lib/topbar.js, r406), does every keep room's wall reach the
screen's top? Each room step of the five saga room episodes, at 390x844 and 360x640 (touch, ?instant=1,
held at rest), the canvas read back (no HTML on it) and its top 64 CSS px searched for the room's dark
beyond the wall (scene.background 0x120c08): the rows from the screen's top edge down that are mostly dark.
    tools/room_top.py [--base URL] [--out out/r503/top] [ep ...]     # prints each step, then all ok / N bad
r616: --desk does the same at 1440x860 and 1280x720 (mouse, the top bar away), where 1.2's wall stopped
~195 px under the screen's top.
r615: --edges also looks at the other three edges, a strip 3 CSS px wide: the left and right ones down to
the story panel's top where the panel spans that column (else to the screen's bottom), the bottom one just
above the panel (beside it, the screen's bottom): BAD when over 3% of it is the room's void, the scene's
background (5,2,1 on screen) (a wall's ragged end, a floor that stops short of the panel).
"""
import argparse, base64, io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from browser import launch   # r401
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("eps", nargs="*", default="eve-lit-tout octet-change cle-vallee paquet-complet encore-des-tours".split())
ap.add_argument("--base", default="http://localhost:8793/"); ap.add_argument("--out", default="")
ap.add_argument("--desk", action="store_true"); ap.add_argument("--edges", action="store_true")
a = ap.parse_args()
STRIP = 360 if a.desk else 64   # CSS px: the bar's height and more (a desktop gap ran to ~195 px)
bad = 0
with sync_playwright() as p:
    b = launch(p)
    for ep in a.eps:
        for w, h in [(1440, 860), (1280, 720)] if a.desk else [(390, 844), (360, 640)]:
            ctx = (b.new_context(viewport={"width": w, "height": h}) if a.desk else
                   b.new_context(viewport={"width": w, "height": h}, has_touch=True, is_mobile=True, device_scale_factor=2))
            pg = ctx.new_page(); errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.goto(f"{a.base}{ep}/?instant=1#story=1"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
            if a.desk: pg.mouse.move(w / 2, h - 5); pg.wait_for_timeout(2600)   # the bar slides away (lib/topbar.js)
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
                gap = round(rows / k); edges = ""
                if a.edges:
                    pn = pg.evaluate("(r => [r.left, r.right, r.top])(document.getElementById('story').getBoundingClientRect())")
                    full = im.load(); W, H = im.size; S = max(1, int(3 * k))
                    under = lambda x: pn[0] * k <= x <= pn[1] * k   # the panel spans this column
                    foot = lambda x: int(pn[2] * k) if under(x) else H   # where the canvas stops showing
                    # the void itself: scene.background 0x120c08 comes out (5,2,1) after tone mapping; a dim wall's mortar
                    # or a machine's black box (0,0,0) is darker than 40 too, and is not a gap
                    void = lambda c: abs(c[0] - 5) <= 3 and abs(c[1] - 2) <= 2 and c[2] <= 3
                    dk = lambda pts: (sum(1 for x, y in pts if void(full[x, y])) / max(1, len(pts)))
                    side = lambda x0: dk([(x, y) for x in range(x0, x0 + S) for y in range(0, foot(x), 2)])
                    low = dk([(x, y) for x in range(0, W, 2) for y in range(max(0, foot(x) - S), foot(x))])
                    share = {"left": side(0), "right": side(W - S), "bottom": low}
                    worse = [f"{e} {v:.0%}" for e, v in share.items() if v > .03]
                    edges = "; edges " + (", ".join(worse) if worse else "clear")
                    gap = gap or bool(worse)
                if a.out: os.makedirs(os.path.dirname(a.out), exist_ok=True); im.save(f"{a.out}-{ep}-{w}-{i + 1}.png")
                print(f"{'ok ' if not gap else 'BAD'}  {ep:17} {w}x{h} step {i + 1:2}: {round(rows / k)} px of dark in the top {STRIP}{edges}")
                bad += bool(gap)
            if errors: print("   page errors:", errors[:3]); bad += 1
            ctx.close()
    b.close()
print("all ok" if not bad else f"{bad} bad"); sys.exit(bool(bad))
