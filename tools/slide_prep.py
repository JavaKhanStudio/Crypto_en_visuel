#!/usr/bin/env python3
"""r591: where the wait before a room-to-room slide goes (lib/room.js across()): the room's build,
compileAsync, the texture uploads, the off-screen warm draw, and the first slide frame, timed from
story.go() on the GPU. Serve the repo root on 8793 first.
    tools/slide_prep.py [--base URL] [--page encore-des-tours/] [--from 5] [--step 6] [--runs 2]
"""
import argparse, json
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="encore-des-tours/")
ap.add_argument("--from", dest="frm", type=int, default=5)
ap.add_argument("--step", type=int, default=6)
ap.add_argument("--runs", type=int, default=2)
ap.add_argument("--window", type=int, default=5000, help="with --hitch: ms watched (r601: r492's warm under the veil delays ahead() past 5 s)")
ap.add_argument("--hitch", action="store_true", help="instead: the frames over 50 ms from entering --from (from the step before) to 5 s after, while the next room is built ahead")
a = ap.parse_args()
PROBE = """async step => {
  const ins = demo.inside, r = ins.renderer, t0 = performance.now(), ev = [], at = k => ev.push([k, Math.round(performance.now() - t0)]);
  const wrap = (o, k, f) => { const g = o[k]; o[k] = function (...x) { return f.call(this, g, x); }; };
  wrap(ins, 'build', function (g, x) { at('build>'); const out = g.apply(this, x); at('build<'); return out; });
  wrap(r, 'compileAsync', function (g, x) { at('compile>'); const p = g.apply(this, x); p.then(() => at('compile<')); return p; });
  wrap(r, 'initTexture', function (g, x) { const s = performance.now(); g.apply(this, x); const d = performance.now() - s; if (d > 4) at('texture ' + Math.round(d) + 'ms'); });
  wrap(r, 'render', function (g, x) { const s = performance.now(); g.apply(this, x);
    if (r.getRenderTarget() === ins.warm) at('warm ' + Math.round(performance.now() - s) + 'ms'); });
  let last = performance.now(), slid = false;
  const tick = () => { const n = performance.now(); if (n - last > 50) at('frame ' + Math.round(n - last) + 'ms');
    last = n; if (ins.sliding && !slid) { slid = true; at('slide starts'); } if (n - t0 < 3000) requestAnimationFrame(tick); };
  requestAnimationFrame(tick); at('go');
  demo.story.go(step);
  await new Promise(res => setTimeout(res, 3000));
  return ev;
}"""
HITCH = """async step => { const t0 = performance.now(), ev = []; let last = t0;
  const ins = demo.inside, r = ins.renderer, at = k => ev.push([Math.round(performance.now() - t0), k]);
  const wrap = (o, k, f) => { const g = o[k]; o[k] = function (...x) { return f.call(this, g, x); }; };
  wrap(ins, 'ahead', function (g, x) { at('ahead>'); const out = g.apply(this, x); at('ahead<'); return out; });
  wrap(r, 'compileAsync', function (g, x) { const p = g.apply(this, x); p.then(() => at('compiled')); return p; });
  wrap(ins, 'warmUp', function (g, x) { const s = performance.now(); g.apply(this, x); at('warm ' + Math.round(performance.now() - s)); });
  await new Promise(res => { const tick = () => { const n = performance.now(); if (n - last > 50) ev.push([Math.round(n - t0), Math.round(n - last)]);
    last = n; if (n - t0 < WINDOW) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); demo.story.go(step); });
  return { ev, next: !!demo.inside.next, warm: !!demo.inside.next?.warm }; }"""
with sync_playwright() as p:
    b = launch(p)
    for run in range(a.runs):
        pg = b.new_page(viewport={"width": 1280, "height": 760})
        pg.goto(f"{a.base}{a.page}#story={a.frm - 1 if a.hitch else a.frm}"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        if a.hitch: pg.wait_for_timeout(3000)
        else: pg.wait_for_function("demo.inside.active && !demo.inside.arrival", timeout=30000); pg.wait_for_timeout(1500)
        if a.hitch: print(f"run {run + 1}: frames over 50 ms (at ms, ms):", pg.evaluate(HITCH.replace("WINDOW", str(a.window)), a.frm - 1))
        else: print(f"run {run + 1}:", "  ".join(f"{k}@{t}" for k, t in pg.evaluate(PROBE, a.step - 1)))
        pg.close()
