#!/usr/bin/env python3
"""Frames of a zoom into a castle room (r103), real speed, headless: a contact sheet of the flight
in, the veil, and the room, cut from a video (a screenshot stalls SwiftShader for a second or more,
so shooting one every N ms misses the flight). Also keeps the video (.webm). Needs ffmpeg.
Serve the repo first (python3 -m http.server 8793).

    tools/inside_frames.py out/r103/zoom --page eve-lit-tout/ --query '?inside=1' --step 5
"""
import argparse, glob, shutil, subprocess, tempfile, time
from playwright.sync_api import sync_playwright
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="eve-lit-tout/")
ap.add_argument("--query", default="?inside=1")
ap.add_argument("--step", type=int, default=5, help="the step that goes inside (1-based); the shot starts one before")
ap.add_argument("--every", type=int, default=600)
ap.add_argument("--n", type=int, default=12)
ap.add_argument("--lead", type=float, default=4, help="seconds of video before go() by the estimate: the estimate runs late")
ap.add_argument("--size", default="1280x760")
a = ap.parse_args()
w, h = map(int, a.size.split("x"))
tmp = tempfile.mkdtemp()
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": w, "height": h}, record_video_dir=tmp, record_video_size={"width": w, "height": h})
    pg = ctx.new_page(); t_rec = time.time()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{a.base}{a.page}{a.query}#story={a.step - 1}", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(3500)
    pg.evaluate(f"demo.story.go({a.step - 1})")
    t_go = time.time()
    pg.wait_for_timeout(a.every * a.n + 500)
    t_end = time.time()
    ctx.close(); b.close()
video = glob.glob(tmp + "/*.webm")[0]
shutil.copy(video, a.out + ".webm")
# the video runs slower than the wall clock on SwiftShader: place go() and the frames by proportion
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]))
scale = dur / (t_end - t_rec)
start = max(0, (t_go - t_rec) * scale - a.lead)
shots = []
for i in range(a.n):
    f = f"{tmp}/f{i:02}.png"
    subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{start + i * a.every / 1000 * scale:.2f}", "-i", video, "-frames:v", "1", "-y", f], check=True)
    shots.append(Image.open(f).resize((w // 3, h // 3)))
cols = 4
sheet = Image.new("RGB", (cols * (w // 3), -(-len(shots) // cols) * (h // 3)))
for i, im in enumerate(shots):
    sheet.paste(im, ((i % cols) * (w // 3), (i // cols) * (h // 3)))
sheet.save(a.out + ".png")
shutil.rmtree(tmp)
print(a.out + ".png", a.out + ".webm", "errors:", errors or "none")
