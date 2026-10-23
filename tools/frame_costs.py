#!/usr/bin/env python3
"""r496: where a step's move spends its frames, on the GPU. Opens <page>#story=<from>, then go(<step>) and,
for 4.5 s, prints every frame over 40 ms (when, how long, valley or room) and every renderer call over
8 ms (render, compile, compileAsync, initTexture), so a stutter is pinned to what ran in it. Another
session's browser on the same GPU slows every frame: compare with a run of the step before.
    tools/frame_costs.py [--base URL] [--page paquet-complet/] [--from 6] [--step 7] [--size 1280x760]
"""
import argparse, json
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="paquet-complet/")
ap.add_argument("--from", dest="frm", type=int, default=6)
ap.add_argument("--step", type=int, default=7)
ap.add_argument("--size", default="1280x760")
a = ap.parse_args()
w, h = map(int, a.size.split("x"))
with sync_playwright() as p:
    b = launch(p); pg = b.new_page(viewport={"width": w, "height": h})
    errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{a.base}{a.page}#story={a.frm}"); pg.wait_for_function("window.demo && demo.ready", timeout=60000); pg.wait_for_timeout(4000)
    r = pg.evaluate("""async step => {
      const R = demo.renderer, ev = [], t0 = performance.now(), T = () => Math.round(performance.now() - t0);
      for (const k of ['initTexture', 'compile', 'compileAsync', 'render']) { const f = R[k].bind(R);
        R[k] = (...a) => { const s = performance.now(), x = f(...a), d = performance.now() - s; if (d > 8) ev.push([T(), k, Math.round(d)]); return x; }; }
      const gaps = []; let last = performance.now(), on = true;
      const tick = () => { const n = performance.now(); if (n - last > 40) gaps.push([T(), Math.round(n - last), demo.inside.active ? 'room' : 'valley']); last = n; if (on) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      demo.story.go(step); await new Promise(r => setTimeout(r, 4500)); on = false;
      return { ev, gaps, log: demo.inside.log.slice(-3).map(l => [l[0], Math.round(l[1] - t0)]) };
    }""", a.step - 1)
    b.close()
print("room log (ms after go):", r["log"])
print("frames over 40 ms (ms after go, length, scene):")
for g in r["gaps"]: print(f"  {g[0]:5d}  {g[1]:4d} ms  {g[2]}")
print("renderer calls over 8 ms:")
for e in r["ev"]: print(f"  {e[0]:5d}  {e[1]:12s} {e[2]:4d} ms")
print("page errors:", errors or "none")
