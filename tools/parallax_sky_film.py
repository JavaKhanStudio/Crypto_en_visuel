#!/usr/bin/env python3
"""r339: lab/parallax-sky/ (the parallax page as episode 1.1's background), shot and filmed frame by frame.

Serve the repo first (python3 -m http.server 8793), then:
    tools/parallax_sky_film.py out/r339 --stills 1,6.5,14,19.5      # a PNG per way per time: <out>/<way>-<size>-t<t>.png
    tools/parallax_sky_film.py out/r339 --film                      # <out>/film-<size>.mp4: the ways one above the other (side by side on a phone), one loop
    --size 1440x810 (default) or 390x844; --ways dome,flat,rings; --fps 10
Each frame is the lab frozen at its time (window.lab.seek), so the clip plays at true speed whatever the GPU;
It draws on the GPU (tools/browser.py, r401); --gpu is kept for old command lines, CRYPTO_GL=soft goes back to SwiftShader. Prints page errors (must be none); exit 1 on any.
"""
import argparse, pathlib, subprocess, tempfile, sys
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--ways", default="dome,flat,rings")
ap.add_argument("--size", default="1440x810")
ap.add_argument("--stills", default="")
ap.add_argument("--film", action="store_true")
ap.add_argument("--fps", type=int, default=10)
ap.add_argument("--gpu", action="store_true")
a = ap.parse_args()
w, h = map(int, a.size.split("x"))
out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
ways = a.ways.split(",")
phone = w < h
bad = 0
with sync_playwright() as p:
    b = launch(p)
    pages = {}
    for way in ways:
        pg = b.new_page(viewport={"width": w, "height": h})   # every way at the full size; the film stacks them
        errs = []
        pg.on("pageerror", lambda e, errs=errs: errs.append(str(e)))
        # embed (no buttons, a tag): with the UI over it, SwiftShader's page screenshot dropped the backdrop the canvas had
        pg.goto(f"{a.base}lab/parallax-sky/?way={way}&t=0&embed=1", wait_until="load")
        pg.wait_for_function("window.labReady", timeout=90000)
        pages[way] = (pg, errs)
    for t in [float(x) for x in a.stills.split(",") if x]:
        for way, (pg, _) in pages.items():
            pg.evaluate(f"lab.seek({t})"); pg.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
            f = out / f"{way}-{a.size}-t{t:g}.png"; pg.screenshot(path=str(f)); print(f)
    if a.film:
        loop = pages[ways[0]][0].evaluate("lab.LOOP")
        tmp = pathlib.Path(tempfile.mkdtemp(prefix="skyfilm-"))
        for i in range(int(loop * a.fps)):
            for k, (way, (pg, _)) in enumerate(pages.items()):
                pg.evaluate(f"lab.seek({i / a.fps})"); pg.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
                pg.screenshot(path=str(tmp / f"{way}-{i:05d}.png"))
        inputs = sum([["-framerate", str(a.fps), "-i", str(tmp / f"{way}-%05d.png")] for way in ways], [])
        stack = f"{'h' if phone else 'v'}stack=inputs={len(ways)}" if len(ways) > 1 else "null"
        f = out / f"film-{a.size}.mp4"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", stack,
                        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "27", str(f)], check=True)
        print(f, int(loop * a.fps), "frames")
    for way, (pg, errs) in pages.items():
        print(way, "errors:", errs or "none"); bad += bool(errs)
    b.close()
sys.exit(1 if bad else 0)
