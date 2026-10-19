#!/usr/bin/env python3
"""The hover clips of an episode's last-step doors (r105, Simon: « a short 4 seconds clip, that
loops »): one per door, filmed at 1280×720 real speed through the CDP screencast (its frames carry
their own time, so the 4 s cut lands where the script marked it), cut to 4 s, cropped like
tools/door_thumbs.py and scaled to 384×216 H.264, saved as <slug>/img/door-<name>.mp4. The next
episode's clip (door-next.mp4) is shot in that episode, from --next and --next-hash, the DOM
panels hidden as in tools/vignette.py; it stays in this episode's folder. Needs ffmpeg with libx264. Serve the repo root first
(python3 -m http.server 8793), or pass --base.

    tools/door_clips.py deux-generaux --next eve-lit-tout --next-hash '#story=2' [--only next]
"""
import argparse, base64, os, subprocess, tempfile, time
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument("slug")
ap.add_argument("--next", required=True, help="the next episode's folder")
ap.add_argument("--next-hash", default="#story=2", help="a story step whose #play makes a good clip")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--only", default="", help="comma list of sandbox,quiz,home,next")
a = ap.parse_args()
W, H, SEC = 1280, 720, 4
hide = "for(const s of ['#topbar','#story','#sandbox','#quiz','#card','#bubbles','#toast','#loading'])" \
       "{const e=document.querySelector(s); if(e) e.style.display='none';}"
ready = "window.demo && window.demo.ready"


def sandbox(pg):
    pg.goto(f"{a.base}{a.slug}/?instant=1#sandbox"); pg.wait_for_function(ready, timeout=60000)
    pg.wait_for_timeout(1500); t = time.time()
    pg.click("#sb-burst"); pg.wait_for_timeout(SEC * 1000 + 500)
    return t, (0, 90, 640, 450)


def quiz(pg):
    pg.goto(f"{a.base}{a.slug}/?instant=1#quiz"); pg.wait_for_function(ready, timeout=60000)
    pg.wait_for_timeout(1500); t = time.time()
    pg.wait_for_timeout(600); pg.locator("#quiz-options li").nth(2).click()
    pg.wait_for_timeout(900); pg.click("#quiz-check"); pg.wait_for_timeout(SEC * 1000)
    return t, (280, 130, 1000, 535)


def home(pg):
    pg.goto(f"{a.base}?lang=fr"); pg.wait_for_timeout(1500); t = time.time()
    # a slow scroll down the saga's cards, then a rest at the bottom of the run
    pg.evaluate("""() => { const t0 = performance.now(), d = 520;
      const f = now => { const k = Math.min(1, (now - t0) / 3200); scrollTo(0, d * (1 - Math.cos(k * Math.PI)) / 2); if (k < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f); }""")
    pg.wait_for_timeout(SEC * 1000 + 300)
    return t, (0, 0, W, H)


def nxt(pg):
    pg.goto(f"{a.base}{a.next}/{a.next_hash}"); pg.wait_for_function(ready, timeout=60000)
    pg.wait_for_timeout(2600); pg.click("#play"); pg.evaluate(hide); pg.wait_for_timeout(200)
    # the clip is the step's ride, from the click (in eve-lit-tout: the rider reaches Eve's gate)
    t = time.time(); pg.wait_for_timeout(SEC * 1000 + 300)
    return t, (0, 0, W, H)


doors = {"sandbox": sandbox, "quiz": quiz, "home": home, "next": nxt}
only = [k for k in a.only.split(",") if k] or list(doors)
with sync_playwright() as p, tempfile.TemporaryDirectory() as tmp:
    # the machine's GPU (about 50 fps at 1280×720); SwiftShader's 6 fps would make a slideshow
    b = p.chromium.launch(args=["--use-gl=angle", "--use-angle=gl-egl", "--ignore-gpu-blocklist"])
    for name in only:
        pg = b.new_page(viewport={"width": W, "height": H}); errors = []; frames = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        cdp = pg.context.new_cdp_session(pg)
        def got(f, cdp=cdp, frames=frames):
            frames.append((f["metadata"]["timestamp"], f["data"]))
            try: cdp.send("Page.screencastFrameAck", {"sessionId": f["sessionId"]})
            except Exception: pass   # a last frame can arrive as the page closes
        cdp.on("Page.screencastFrame", got)
        cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 90, "maxWidth": W, "maxHeight": H})
        t, (x0, y0, x1, y1) = doors[name](pg)
        cdp.send("Page.stopScreencast"); pg.close()
        # the screencast sends a frame only when the page changes: hold each until the next one
        clip = [f for f in frames if t <= f[0] < t + SEC]
        before = [f for f in frames if f[0] < t]
        if before: clip.insert(0, (t, before[-1][1]))
        d = os.path.join(tmp, name); os.makedirs(d)
        with open(os.path.join(d, "list.txt"), "w") as lst:
            for k, (ts, data) in enumerate(clip):
                open(os.path.join(d, f"{k:04d}.jpg"), "wb").write(base64.b64decode(data))
                end = clip[k + 1][0] if k + 1 < len(clip) else t + SEC
                lst.write(f"file '{k:04d}.jpg'\nduration {max(end - ts, 0.001):.4f}\n")
            lst.write(f"file '{len(clip) - 1:04d}.jpg'\n")
        out = f"{a.slug}/img/door-{name}.mp4"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-i", os.path.join(d, "list.txt"),
                        "-vf", f"crop={x1 - x0}:{y1 - y0}:{x0}:{y0},scale=384:216,fps=25", "-t", str(SEC), "-an", "-c:v", "libx264",
                        "-pix_fmt", "yuv420p", "-crf", "28", "-preset", "slow", "-movflags", "+faststart", out], check=True)
        print(out, f"{len(clip)} frames, {os.path.getsize(out) // 1024} KB", "errors:", errors or "none")
    b.close()
