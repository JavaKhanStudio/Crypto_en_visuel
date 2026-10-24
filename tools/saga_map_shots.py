#!/usr/bin/env python3
"""r621: the saga's valley on each candidate map of lib/saga/world.js (MAPS, chosen by ?map=), side by side.

Episode 1.1 at rest on the steps that use the saga's main shots (intro, castleA, valley, castleB, both at dawn,
overview), one column per map, at one size. Step 12 is shot after « Lever le soleil » (dawn 1), the others at night.
Writes <out>/<size>/<map>-s<step>.png and one sheet <out>/maps-<size>.png (rows: steps, columns: maps).
    tools/saga_map_shots.py out/r621 [--base http://localhost:8793/] [--size 1440x900] [--maps now,col,collines,eperons]
"""
import argparse, pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

STEPS = [(1, "intro", 0), (2, "castleA", 0), (3, "valley", 0), (7, "castleB", 0), (12, "both", 1), (14, "overview", 0)]
ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--size", default="1440x900")
ap.add_argument("--maps", default="now,col,collines,eperons")
ap.add_argument("--page", default="deux-generaux/")
ap.add_argument("--lab", action="store_true", help="shoot lab/saga-map/ itself (each map at step 7) instead")
a = ap.parse_args()
maps = a.maps.split(",")
out = pathlib.Path(a.out) / a.size; out.mkdir(parents=True, exist_ok=True)
w, h = map(int, a.size.split("x"))
phone = w < 900

bad = 0
shots = {}
if a.lab:
    with sync_playwright() as p:
        br = launch(p)
        pg = br.new_page(viewport={"width": w, "height": h})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        for m in maps:
            pg.goto(f"{a.base}lab/saga-map/?map={m}&ep=deux-generaux&step=7", wait_until="load")
            fr = pg.frame_locator("#ep")
            pg.wait_for_function("() => { const d = document.getElementById('ep').contentWindow.demo; return d && d.ready }", timeout=90000)
            got = pg.evaluate("document.getElementById('ep').contentWindow.demo.world.map")
            if got != m: print(f"lab {m}: the episode built map {got!r}"); bad = 1
            pg.wait_for_timeout(3000)
            f = out / f"lab-{m}.png"; pg.screenshot(path=str(f)); print(f)
        if errs: print("page errors:", errs[:3]); bad = 1
        br.close()
    print("errors: none" if not bad else "ERRORS")
    sys.exit(bad)
with sync_playwright() as p:
    br = launch(p)
    for m in maps:
        pg = br.new_page(viewport={"width": w, "height": h}, is_mobile=phone, has_touch=phone,
                         device_scale_factor=1)
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"{a.base}{a.page}?instant=1&lang=fr&topbar=pin&map={m}#story=1", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=90000)
        pg.evaluate("demo.world.skyReady || null")
        got = pg.evaluate("demo.world.map")
        if got != m: print(f"{m}: the page built map {got!r}"); bad = 1
        for step, shot, dawn in STEPS:
            pg.evaluate(f"demo.story.go({step - 1})"); pg.wait_for_timeout(2200)
            pg.evaluate(f"demo.rig.setOrbit && demo.rig.setOrbit(0); demo.world.setDawn({dawn})")
            pg.wait_for_timeout(500)
            f = out / f"{m}-s{step}.png"; pg.screenshot(path=str(f)); shots[(m, step)] = f
        print(f"{m}: {len(STEPS)} steps shot" + (f", page errors: {errs[:3]}" if errs else ""))
        if errs: bad = 1
        pg.close()
    br.close()

tw = 480 if not phone else 220
th = round(tw * h / w)
lab = 24
sheet = Image.new("RGB", (len(maps) * (tw + 6), len(STEPS) * (th + lab)), "black")
d = ImageDraw.Draw(sheet)
for j, (step, shot, dawn) in enumerate(STEPS):
    y = j * (th + lab)
    for i, m in enumerate(maps):
        d.text((i * (tw + 6) + 6, y + 5), f"{m} · step {step} {shot}{' dawn' if dawn else ''}", fill="#ffd27a")
        sheet.paste(Image.open(shots[(m, step)]).convert("RGB").resize((tw, th)), (i * (tw + 6), y + lab))
f = pathlib.Path(a.out) / f"maps-{a.size}.png"; sheet.save(f); print(f)
print("errors: none" if not bad else "ERRORS")
sys.exit(bad)
