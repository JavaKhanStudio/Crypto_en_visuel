#!/usr/bin/env python3
"""r596: a Chrome trace (devtools.timeline, gpu, cc, viz) of a room-to-room slide's first 600 ms, and
the longest events in it on any thread: what a long frame waits on when the page's own script and
render are short (tools/slide_frames.py). Serve the repo root on 8793 first.
    tools/slide_chrome_trace.py out.json [--page encore-des-tours/] [--from 5] [--step 6]
"""
import argparse, json, collections
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="encore-des-tours/")
ap.add_argument("--from", dest="frm", type=int, default=5)
ap.add_argument("--step", type=int, default=6)
a = ap.parse_args()
with sync_playwright() as p:
    b = launch(p); pg = b.new_page(viewport={"width": 1280, "height": 760})
    pg.goto(f"{a.base}{a.page}#story={a.frm}"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_function("demo.inside.active && !demo.inside.arrival", timeout=30000); pg.wait_for_timeout(3500)
    b.start_tracing(page=pg, path=a.out, categories=["devtools.timeline", "disabled-by-default-devtools.timeline", "gpu", "cc", "viz", "blink", "v8", "toplevel", "blink.user_timing"])
    pg.evaluate(f"new Promise(r => {{ performance.mark('go'); demo.story.go({a.step - 1}); setTimeout(r, 600); }})")
    b.stop_tracing()
ev = json.load(open(a.out)); ev = ev["traceEvents"] if isinstance(ev, dict) else ev
names = {(e["pid"], e["tid"]): e["args"]["name"] for e in ev if e.get("ph") == "M" and e.get("name") == "thread_name"}
go = next(e["ts"] for e in ev if e.get("name") == "go")
long = [e for e in ev if e.get("ph") == "X" and e.get("dur", 0) > 30000 and e["ts"] >= go - 1000]
long.sort(key=lambda e: -e["dur"])
seen = collections.Counter()
for e in long:
    k = (names.get((e["pid"], e["tid"]), "?"), e["name"])
    if seen[k] >= 2: continue
    seen[k] += 1
    print(f"{(e['ts'] - go) / 1000:7.1f} ms  {e['dur'] / 1000:6.1f} ms  {k[0]:28s} {e['name']}  {json.dumps(e.get('args', {}))[:140]}")
