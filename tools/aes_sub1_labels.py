#!/usr/bin/env python3
"""« AES de l'intérieur » round 1 SubBytes (step 6), held while one cube is mid-lookup, so its
S(..) = .. label can be checked against the step's title and the other cubes (r422). The beat is
scanned in time for the labels; the n-th label is cube n (column-major: row n % 4, column n / 4).
Shoots cubes 0 (top left), 4 (top, 2nd column), 8 (top, 3rd column), 3 (bottom left) and 13 (row 1, last column) at
1440x860 and 390x844 to out/aes-sub1-cube<n>[-phone]-<lang>.png. Serve the repo first.
    tools/aes_sub1_labels.py [fr|en] [base]"""
import sys
from playwright.sync_api import sync_playwright

lang = sys.argv[1] if len(sys.argv) > 1 else "fr"
base = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8793/"
CUBES = [0, 4, 8, 3, 13]
scan = """() => { const r = demo.room, seen = [];
  for (let t = 0; t < r.end; t += .02) { r.time = t; r.m.pose(r.id, t);
    const s = r.m.read().words.find(w => w.startsWith('S('));
    if (s && (!seen.length || seen.at(-1).s !== s)) seen.push({ s, t }); }
  return seen; }"""
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    errors = []
    for (w, h), tag in [((1440, 860), ""), ((390, 844), "-phone")]:
        pg = b.new_page(viewport={"width": w, "height": h}); pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{base}aes-interieur/?instant=1&lang={lang}#story=6", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.wait_for_timeout(400); pg.evaluate("demo.room.speed = 0")
        seen = pg.evaluate(scan)
        if len(seen) < 16: print("only", len(seen), "labels found:", seen); continue
        for n in CUBES:
            pg.evaluate(f"demo.room.time = {seen[n]['t'] + .03}")
            pg.wait_for_function(f"demo.room.m.read().words.includes({seen[n]['s']!r})", timeout=15000)
            pg.wait_for_timeout(300)
            path = f"out/aes-sub1-cube{n}{tag}-{lang}.png"; pg.screenshot(path=path); print(path, seen[n]["s"])
        pg.close()
    print("errors:", errors or "none")
    b.close()
