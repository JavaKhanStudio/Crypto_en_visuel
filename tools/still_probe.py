#!/usr/bin/env python3
"""r546: what the still cap (lib/still.js, 30 fps by default, 'dg-still') does to a page: frames drawn and skipped
while the camera stands still, then during a camera flight (rig.fly, none may be skipped), and the main thread's
CPU standing still against the same page at ?still=60 (every frame): at 30 it must be under 85% of it (skipped frames still cost the browser its frame tasks).
    tools/still_probe.py deux-generaux --hash '#story=1' --shot both [--base http://localhost:8793/]
Prints ok/FAIL lines and page errors (must be none)."""
import argparse
import os
import sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from browser import launch  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("episode")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--hash", default="#story=1")
ap.add_argument("--shot", default="overview", help="a rig shot to fly to (the flight must draw every frame)")
ap.add_argument("--size", default="1440x860")
a = ap.parse_args()
w, h = map(int, a.size.split("x"))

COUNT = """(ms) => new Promise(r => { const s = demo.composer.stillFrames, d0 = s.drawn, k0 = s.skipped, t0 = performance.now();
  let n = 0; const f = () => { n++; if (performance.now() - t0 < ms) requestAnimationFrame(f); else r({ frames: n, drawn: s.drawn - d0, skipped: s.skipped - k0 }); };
  requestAnimationFrame(f); })"""
FLY = """(shot) => new Promise(r => { const s = demo.composer.stillFrames, d0 = s.drawn, k0 = s.skipped, t0 = performance.now();
  demo.rig.fly(shot, 2).then(() => r({ ms: Math.round(performance.now() - t0), drawn: s.drawn - d0, skipped: s.skipped - k0 })); })"""


def cpu(pg, ms=4000):
    cdp = pg.context.new_cdp_session(pg); cdp.send("Performance.enable")
    m0 = {m["name"]: m["value"] for m in cdp.send("Performance.getMetrics")["metrics"]}
    pg.wait_for_timeout(ms)
    m1 = {m["name"]: m["value"] for m in cdp.send("Performance.getMetrics")["metrics"]}
    return round(100 * (m1["TaskDuration"] - m0["TaskDuration"]) / (m1["Timestamp"] - m0["Timestamp"]), 1)


bad = 0
with sync_playwright() as p:
    b = launch(p)
    c60 = None
    for still in ["&still=60", ""]:
        pg = b.new_page(viewport={"width": w, "height": h}); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"{a.base}{a.episode}/?quality=normal{still}{a.hash}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000); pg.wait_for_timeout(9000)   # no ?instant: the flight must be a real one
        c = cpu(pg)
        if still:
            c60 = c; print(f"     still=60: main thread {c}% of a core standing still")
        else:
            s = pg.evaluate(COUNT, 3000); ok = 0.35 < s["skipped"] / s["frames"] < 0.65; bad += not ok
            print("ok  " if ok else "FAIL", f"still=30 standing: {s} (about half skipped)")
            ok = c < .85 * c60; bad += not ok   # r546: under 85%, not 50%: the browser's own frame work stays, and a shared GPU skews it (half-skip is the strict check)
            print("ok  " if ok else "FAIL", f"still=30: main thread {c}% of a core standing still (60: {c60}%)")
            f = pg.evaluate(FLY, a.shot); ok = f["skipped"] == 0 and f["drawn"] > 20; bad += not ok
            print("ok  " if ok else "FAIL", f"still=30 flight to '{a.shot}': {f} (none skipped)")
        print("ok  " if not errs else "FAIL", "errors:", errs or "none"); bad += bool(errs)
        pg.close()
    b.close()
print("all ok" if not bad else "FAILED"); raise SystemExit(1 if bad else 0)
