#!/usr/bin/env python3
"""r635: diffie-hellman's figures from lib/cast.js, proved step by step. Shoots every story step (desktop and phone,
?instant=1, the bar pinned) and records each shown bubble's box, so two trees can be compared:
    python3 tools/dh_cast_probe.py out/r635/before --base http://localhost:8781/
    python3 tools/dh_cast_probe.py out/r635/after  --base http://localhost:8782/
    python3 tools/dh_cast_probe.py --compare out/r635/before out/r635/after
--page scytale/ runs it on another episode (r636). Prints page errors per tree; --compare prints every bubble that moved more than 2 px and a before|after sheet per step."""
import argparse, json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))

ap = argparse.ArgumentParser()
ap.add_argument("out", nargs="?")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--compare", nargs=2)
ap.add_argument("--page", default="diffie-hellman/")
a = ap.parse_args()

BUBBLES = """() => [...document.querySelectorAll('#bubbles .bubble.show')].filter(el => getComputedStyle(el).visibility !== 'hidden')
  .map(el => { const r = el.getBoundingClientRect(); return { who: el.querySelector('.who').textContent, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; })"""
SIZES = {"desk": (1440, 860), "phone": (390, 844)}

if a.compare:
    from PIL import Image
    A, B = (json.load(open(os.path.join(d, "bubbles.json"))) for d in a.compare)
    moved = 0
    for size in SIZES:
        sheets = []
        for i, (ba, bb) in enumerate(zip(A[size], B[size])):
            if [b["who"] for b in ba] != [b["who"] for b in bb]:
                print(f"{size} step {i + 1}: bubbles {[b['who'] for b in ba]} -> {[b['who'] for b in bb]}"); moved += 1
            for p, q in zip(ba, bb):
                d = max(abs(p[k] - q[k]) for k in "xywh")
                if d > 2: print(f"{size} step {i + 1}: {p['who']} moved {d} px ({p} -> {q})"); moved += 1
            ia, ib = (Image.open(os.path.join(d, f"{size}-{i + 1}.png")) for d in a.compare)
            pair = Image.new("RGB", (ia.width * 2 + 8, ia.height), "white"); pair.paste(ia, (0, 0)); pair.paste(ib, (ia.width + 8, 0))
            sheets.append(pair.resize((pair.width // 3, pair.height // 3)))
        cols = 3 if size == "desk" else 5
        w, h = sheets[0].size
        sheet = Image.new("RGB", (w * cols, h * ((len(sheets) + cols - 1) // cols)), "black")
        for k, s in enumerate(sheets): sheet.paste(s, (w * (k % cols), h * (k // cols)))
        sheet.save(os.path.join(a.compare[1], f"pairs-{size}.png"))
    print("all bubbles in place" if not moved else f"{moved} differences")
    sys.exit(0)

from playwright.sync_api import sync_playwright
from browser import launch
os.makedirs(a.out, exist_ok=True)
rec, errors = {}, []
with sync_playwright() as p:
    br = launch(p)
    for size, (w, h) in SIZES.items():
        pg = br.new_context(viewport={"width": w, "height": h}, has_touch=w < 900, is_mobile=w < 900).new_page()
        pg.on("pageerror", lambda e: errors.append(f"{size}: {e}"))
        pg.goto(f"{a.base}{a.page}?instant=1&topbar=pin#story=1", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.add_style_tag(content=".bubble { transition: none !important; }")
        n = int(pg.evaluate("document.getElementById('step-count').textContent.match(/(\\d+)\\D*$/)[1]"))
        rec[size] = []
        for i in range(n):
            pg.evaluate(f"demo.story.go({i})"); pg.wait_for_timeout(2500)
            rec[size].append(pg.evaluate(BUBBLES))
            pg.screenshot(path=os.path.join(a.out, f"{size}-{i + 1}.png"))
        pg.close()
    br.close()
json.dump(rec, open(os.path.join(a.out, "bubbles.json"), "w"), indent=1)
print("page errors:", errors or "none")
