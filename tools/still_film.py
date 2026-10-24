#!/usr/bin/env python3
"""r546: film a page at ?still=60 (every frame, as before) and at the default (lib/still.js, 30 fps when still),
side by side in one video, so the eye can judge whether flights, rides and the idle scene stay fluid; and print,
for each, the frames drawn, the frames skipped and the longest gap between two drawn frames while the camera moved.
    tools/still_film.py out/r546/pc --page paquet-complet/ --hash '#story=6' [--fly overview] [--secs 14]
Serve the repo first (python3 -m http.server 8793). Writes <out>.mp4 (left 60, right 30) and prints page errors."""
import argparse, pathlib, shutil, subprocess, sys, os
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from browser import launch  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="paquet-complet/")
ap.add_argument("--hash", default="#story=6")
ap.add_argument("--fly", default="", help="a rig shot to fly to halfway through (and back)")
ap.add_argument("--secs", type=float, default=14)
ap.add_argument("--size", default="960x600")
a = ap.parse_args()
w, h = map(int, a.size.split("x"))
out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)

# drawn frames, skipped ones, and the longest gap between two drawn frames while the camera flew or chased
TRACE = """(ms) => new Promise(r => { const s = demo.composer.stillFrames, d0 = s.drawn, k0 = s.skipped, t0 = performance.now();
  let last = 0, gap = 0, n0 = s.drawn; const f = t => { const moving = demo.rig.flight || demo.rig.follow;
    if (s.drawn !== n0) { if (moving && last) gap = Math.max(gap, t - last); last = t; n0 = s.drawn; }
    if (t - t0 < ms) requestAnimationFrame(f); else r({ drawn: s.drawn - d0, skipped: s.skipped - k0, fps: s.fps, movingGapMs: Math.round(gap) }); };
  requestAnimationFrame(f); })"""

bad, vids = 0, []
with sync_playwright() as p:
    b = launch(p)
    for q in ["?still=60", ""]:
        d = out.parent / f"{out.name}-video{q.replace('?', '-').replace('=', '')}"
        shutil.rmtree(d, ignore_errors=True)
        ctx = b.new_context(viewport={"width": w, "height": h}, record_video_dir=str(d), record_video_size={"width": w, "height": h})
        pg = ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"{a.base}{a.page}{q}{a.hash}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        if a.fly:
            pg.evaluate(f"setTimeout(() => demo.rig.fly('{a.fly}', 2.2).then(() => setTimeout(() => demo.rig.fly('intro', 2.2), 1500)), {int(a.secs * 400)})")
        t = pg.evaluate(TRACE, int(a.secs * 1000))
        print(f"{q or 'default':10s} {t}", "errors:", errs or "none"); bad += bool(errs)
        ctx.close(); vids.append(next(d.glob("*.webm")))
    b.close()
# side by side, each labelled
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(vids[0]), "-i", str(vids[1]), "-filter_complex",
                "[0]drawtext=text='60 fps always (before)':x=12:y=12:fontsize=26:fontcolor=yellow:box=1:boxcolor=black@.6[l];"
                "[1]drawtext=text='30 fps when still (now)':x=12:y=12:fontsize=26:fontcolor=yellow:box=1:boxcolor=black@.6[r];[l][r]hstack",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", f"{out}.mp4"], check=True)
print(f"{out}.mp4")
raise SystemExit(1 if bad else 0)
