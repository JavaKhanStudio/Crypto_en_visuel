#!/usr/bin/env python3
"""r195: film lab/parallax/ frame by frame (headless, SwiftShader is too slow to film in real time), as an mp4.

Serve the repo first (python3 -m http.server 8793), then:
    tools/parallax_lab_film.py out/r195/film.mp4                 # Fond, then Théâtre, then Coulisses, one loop each
    tools/parallax_lab_film.py out/x.mp4 --modes theatre --fps 12
Each frame is the page frozen at its time (window.lab.seek), so the clip plays at true speed whatever the GPU.
"""
import argparse, pathlib, subprocess, tempfile
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--modes", default="fond,theatre,coulisses")
ap.add_argument("--size", default="960x540")
ap.add_argument("--fps", type=int, default=10)
ap.add_argument("--seconds", type=float, default=18, help="one loop of the lab's timeline")
a = ap.parse_args()
w, h = map(int, a.size.split("x"))
tmp = pathlib.Path(tempfile.mkdtemp(prefix="plaxfilm-"))
n = 0
with sync_playwright() as p:
    b = launch(p)
    for mode in a.modes.split(","):
        pg = b.new_page(viewport={"width": w, "height": h})
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{a.base}lab/parallax/?mode={mode}&t=0", wait_until="load")
        pg.wait_for_function("window.labReady", timeout=60000)
        for i in range(int(a.seconds * a.fps)):
            pg.evaluate(f"lab.seek({i / a.fps})")
            pg.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
            pg.screenshot(path=str(tmp / f"f{n:05d}.png")); n += 1
        if errors: print(mode, "errors:", errors)
        pg.close()
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(a.fps), "-i", str(tmp / "f%05d.png"),
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "26", a.out], check=True)
print(a.out, n, "frames")
