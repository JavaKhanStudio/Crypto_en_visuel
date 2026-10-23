#!/usr/bin/env python3
"""r597: what a long frame early in a room-to-room slide comes from, by switching one thing at a time
before the click and comparing the slide's first frames, runs interleaved (the GPU is shared: compare
within one run of this tool only). Serve the repo root on 8793 first.
    tools/slide_bisect.py [--base URL] [--page encore-des-tours/] [--from 5] [--step 6] [--runs 3] [--only a,b] [--after ms]
"""
import argparse
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

# each: JS run once the next room is built ahead and warm, just before story.go(). r597 found: base
# stalled 140-180 ms on a fresh browser, noshadow and fullwarm too, likewarm not: the fix in lib/room.js warmUp
VARIANTS = {
    "base": "",
    # the new room's shadow map never drawn during the slide (it was drawn at the warm-up)
    "noshadow": "const r = ins.renderer, g = r.render; r.render = function (...x) { if (ins.sliding) r.shadowMap.autoUpdate = false; return g.apply(this, x); };",
    # the warm-up drawn again at the screen's size, every tile covering pixels as it will in the slide
    "fullwarm": "if (ins.next) { ins.warm.setSize(innerWidth, innerHeight); ins.warmUp(ins.next.room, true); } await new Promise(r => setTimeout(r, 800));",
    # the warm-up drawn into a target like the composer's (its format and samples), not a plain 64x64 RGBA8 one
    "likewarm": "if (ins.next) { ins.warm = demo.composer.readBuffer.clone(); ins.warm.setSize(64, 64); ins.warmUp(ins.next.room, true); } await new Promise(r => setTimeout(r, 800));",
    # no room built ahead: built, compiled and warmed at the click (r591's old path)
    "noahead": "ins.drop();",
}
ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="encore-des-tours/")
ap.add_argument("--from", dest="frm", type=int, default=5)
ap.add_argument("--step", type=int, default=6)
ap.add_argument("--runs", type=int, default=3)
ap.add_argument("--only", default=",".join(VARIANTS))
ap.add_argument("--after", type=int, help="click this many ms after the room arrived instead of once the next room is warm (tools/slide_trace.py: 1500)")
a = ap.parse_args()
PROBE = """async ([step, pre]) => {
  const ins = demo.inside, T = () => performance.now();
  await (async () => {})(); %s
  const rows = []; let last = T(), slid = false;
  await new Promise(res => { const tick = () => { const n = T();
    if (ins.sliding || slid) { slid = true; rows.push([Math.round(n - last), ins.sliding ? +ins.sliding.s.toFixed(3) : 1]); }
    last = n; if (slid && !ins.sliding) return res(); requestAnimationFrame(tick); };
    requestAnimationFrame(tick); demo.story.go(step); });
  return rows;
}"""
names = a.only.split(",")
res = {k: [] for k in names}
with sync_playwright() as p:
    for run in range(a.runs):
        for k in names:
            # a fresh browser each time: the stall comes only on a browser's first page (its GPU process's caches)
            b = launch(p); pg = b.new_page(viewport={"width": 1280, "height": 760})
            pg.goto(f"{a.base}{a.page}#story={a.frm}"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
            pg.wait_for_function("demo.inside.active && !demo.inside.arrival", timeout=30000)
            if a.after is None: pg.wait_for_function("demo.inside.next && demo.inside.next.warm", timeout=30000); pg.wait_for_timeout(1500)
            else: pg.wait_for_timeout(a.after)
            state = pg.evaluate("demo.inside.next ? (demo.inside.next.warm ? 'warm' : 'built') : 'none'")
            rows = pg.evaluate(PROBE % VARIANTS[k], [a.step - 1, 0])
            early = [d for d, s in rows[:12]]; rest = sorted(d for d, s in rows[12:])
            res[k].append((max(early), rest[len(rest) // 2], early.index(max(early))))
            print(f"run {run + 1} {k:9s} next {state:5s} first 12 frames {early}  then median {rest[len(rest) // 2]} ms", flush=True)
            b.close()
print()
for k in names:
    print(f"{k:9s} worst early frame per run {[w for w, m, i in res[k]]} (median frame after {[m for w, m, i in res[k]]})")
