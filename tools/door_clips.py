#!/usr/bin/env python3
"""The hover clips of an episode's last-step doors (r105, Simon: « a short 4 seconds clip, that
loops »): one per door, filmed at 1280×720 real speed through the CDP screencast (its frames carry
their own time, so the 4 s cut lands where the script marked it), cut to 4 s, cropped like
tools/door_thumbs.py and scaled to 384×216 H.264, saved as <slug>/img/door-<name>.mp4. The next
episode's clip (door-next.mp4) is shot in that episode, from --next and --next-hash, the DOM
panels hidden as in tools/vignette.py; it stays in this episode's folder. The quiz clip is shot once,
in French, for every language (r290, Simon: a clip per language is a cost with no gain). Needs ffmpeg with libx264. Serve the repo root first
(python3 -m http.server 8793), or pass --base.

    tools/door_clips.py deux-generaux --next eve-lit-tout --next-hash '#story=2' [--only next]
    tools/door_clips.py enigma --next enigma-reglage --next-hash '#story=5' --sandbox-keys OUI --box sandbox=300,100,1100,550
    tools/door_clips.py eve-lit-tout --next octet-change --next-hash '#story=3' --sandbox-pre 'input[value=plain]' --sandbox-click '#sb-send' --box sandbox=0,0,1280,720
    tools/door_clips.py cadenas --next diffie-hellman --next-hash '#story=4' --sandbox-click '#sb-lock,#sb-send'
    tools/door_clips.py diffie-hellman --next scytale --next-hash '#story=2' --sandbox-eval 'demo.stage.speed=1.7' --sandbox-click '#sb-run' --box sandbox=340,84,1080,500
    tools/door_clips.py sel --next garde --next-hash '#story=5' --sandbox-pre '#sb-signup' --sandbox-eval 'new Promise(r=>setTimeout(r,2500)).then(()=>{demo.stage.speed=1.5})' --sandbox-click '#sb-steal' --box sandbox=360,110,1280,628
    tools/door_clips.py scytale --next enigma --next-hash '#story=2' --sandbox-eval 'demo.stage.speed=1.7' --sandbox-click '#sb-run' --box sandbox=345,190,825,460
    tools/door_clips.py garde --next kasiski --next-hash '#story=4' --sandbox-eval "demo.stage.speed=6; document.getElementById('card').style.visibility='hidden'" --sandbox-click '#sb-run' --box sandbox=345,86,1105,513
      (garde's sandbox still is this clip's first frame: ffmpeg -i garde/img/door-sandbox.mp4 -frames:v 1 -vf scale=320:180, the card hidden)
    tools/door_clips.py paquet-complet --next encore-des-tours --next-hash '#story=8' --sandbox-click '#sb-send'
      (r479: 1.6's replay keeps the rider, the packet and Eve's castle in frame; '#story=3' shows grass after 0.5 s)
    tools/door_clips.py encore-des-tours --next a-toi-de-jouer --next-hash '#story=6' --next-click '.choice[data-k=hmac]' --only next
      (r508: 1.7's rides start from a choice; Eve's own rider leaves her city with the forged packet)
    tools/door_clips.py pingouin --next sel --next-hash '#story=7' --sandbox-click '#sb-encrypt,#sb-send' --box sandbox=348,96,992,458
"""
import argparse, base64, os, subprocess, tempfile, time
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

ap = argparse.ArgumentParser()
ap.add_argument("slug")
ap.add_argument("--next", required=True, help="the next episode's folder")
ap.add_argument("--next-hash", default="#story=2", help="a story step whose #play makes a good clip")
ap.add_argument("--next-click", default="#play", help="what starts the next episode's ride (1.7 has no #play: a choice, '.choice[data-k=hmac]')")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--only", default="", help="comma list of sandbox,quiz,home,next")
ap.add_argument("--sandbox-keys", default="", help="type these letters on #sb-keys instead of clicking #sb-burst (enigma: OUI)")
ap.add_argument("--sandbox-pre", default="", help="a comma list clicked before the clip starts (eve-lit-tout: « en clair », so Eve reads the order)")
ap.add_argument("--sandbox-eval", default="", help="JS run before the clip starts (diffie-hellman: demo.stage.speed=1.7, the sandbox's own speed, which ?instant=1 sets to 50)")
ap.add_argument("--sandbox-click", default="#sb-burst", help="the sandbox buttons the clip presses, a comma list clicked in turn over the 4 s (eve-lit-tout: #sb-send; cadenas: #sb-lock,#sb-send)")
ap.add_argument("--box", action="append", default=[], help="name=x0,y0,x1,y1: crop that door elsewhere (16:9), as tools/door_thumbs.py")
a = ap.parse_args()
BOX = {n: tuple(int(v) for v in xy.split(",")) for n, xy in (b.split("=") for b in a.box)}
W, H, SEC = 1280, 720, 4
hide = "for(const s of ['#topbar','#story','#sandbox','#quiz','#card','#bubbles','#toast','#loading'])" \
       "{const e=document.querySelector(s); if(e) e.style.display='none';}"
ready = "window.demo && window.demo.ready"


def sandbox(pg):
    pg.goto(f"{a.base}{a.slug}/?instant=1#sandbox"); pg.wait_for_function(ready, timeout=60000)
    for c in filter(None, a.sandbox_pre.split(",")): pg.click(c)
    if a.sandbox_eval: pg.evaluate(a.sandbox_eval)
    pg.wait_for_timeout(1500); t = time.time()
    if a.sandbox_keys:
        for c in a.sandbox_keys:
            pg.locator("#sb-keys button", has_text=c).first.click(); pg.wait_for_timeout(SEC * 1000 // len(a.sandbox_keys))
    else:
        sel = a.sandbox_click.split(",")
        for c in sel:
            pg.click(c); pg.wait_for_timeout(SEC * 1000 // len(sel))
    pg.wait_for_timeout(500)
    return t, BOX.get("sandbox", (0, 90, 640, 450))


def quiz(pg):
    pg.goto(f"{a.base}{a.slug}/?instant=1&lang=fr#quiz"); pg.wait_for_function(ready, timeout=60000)
    # the student reads question 1 and hesitates between two WRONG options, never pressing
    # « Vérifier »: check() paints the right option green even on a wrong pick (r139)
    right = pg.evaluate("async () => (await import(new URL('js/quiz-data.js', location.href))).QUIZ[0].correct")
    n = pg.locator("#quiz-options li").count()
    wrong = [k for k in range(n) if k not in right][:2]
    pg.wait_for_timeout(1500); t = time.time()
    for k in wrong:
        pg.wait_for_timeout(1200); pg.locator("#quiz-options li").nth(k).click()
    pg.wait_for_timeout(SEC * 1000)
    assert not pg.locator("#quiz-options li.right, #quiz-options li.wrong").count(), "the quiz clip revealed an answer"
    return t, BOX.get("quiz", (280, 130, 1000, 535))


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
    # the panels go before the click (r135: the clip's first frame is the last one before it, which showed them)
    pg.wait_for_timeout(2600); pg.evaluate(hide); pg.wait_for_timeout(1000)
    pg.evaluate("s => document.querySelector(s).click()", a.next_click); pg.wait_for_timeout(200)
    # the clip is the step's ride, from the click (in eve-lit-tout: the rider reaches Eve's gate)
    t = time.time(); pg.wait_for_timeout(SEC * 1000 + 300)
    return t, (0, 0, W, H)


doors = {"sandbox": sandbox, "quiz": quiz, "home": home, "next": nxt}
only = [k for k in doors if k in a.only.split(",")] if a.only else list(doors)
with sync_playwright() as p, tempfile.TemporaryDirectory() as tmp:
    # the machine's GPU (about 50 fps at 1280×720); SwiftShader's 6 fps would make a slideshow
    b = launch(p)
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
