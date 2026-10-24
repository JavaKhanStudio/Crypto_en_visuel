#!/usr/bin/env python3
"""r590: is a phone castle flight smooth when held() re-holds it mid-air (lib/saga/camera.js rehold())?
Traces the camera every frame through a step's flight at 390x844 touch, from a cold load and from the
step before (story.go), and reports the largest jerk: how far one frame's move strays from the mean of
its neighbours', against the flight's typical move. CRYPTO_GL=soft is too slow to judge; use the GPU.
    tools/hold_glide.py [--base URL] [ep:step ...]"""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from browser import launch
ap = argparse.ArgumentParser(); ap.add_argument("cases", nargs="*", default=["encore-des-tours:9", "encore-des-tours:13", "octet-change:10", "deux-generaux:2"])
ap.add_argument("--base", default="http://localhost:8793/"); a = ap.parse_args(); base = a.base.rstrip("/") + "/"
TRACE = """() => new Promise(res => { const out = [], t0 = performance.now(), c = demo.camera;
  const tick = () => { out.push([performance.now() - t0, c.position.x, c.position.y, c.position.z, !!demo.rig.flight, demo.rig.held?.band?.h | 0]);
    if (performance.now() - t0 < 4500) requestAnimationFrame(tick); else res(out); }; tick(); })"""
def jerk(tr):
    mv = [sum((tr[i][k] - tr[i - 1][k]) ** 2 for k in (1, 2, 3)) ** .5 for i in range(1, len(tr))]
    big = sorted(mv)[len(mv) // 2] if mv else 0
    worst = max((abs(mv[i] - (mv[i - 1] + mv[i + 1]) / 2), i) for i in range(1, len(mv) - 1)) if len(mv) > 2 else (0, 0)
    return worst[0], tr[worst[1]][0], max(mv) if mv else 0
with sync_playwright() as p:
    br = launch(p)
    for case in a.cases:
        ep, st = case.split(":"); st = int(st)
        ctx = br.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True); pg = ctx.new_page()
        pg.add_init_script("window.__early = true")
        pg.goto(f"{base}{ep}/#story={st}"); pg.wait_for_function("window.demo && demo.ready && demo.rig.flight", timeout=60000, polling=16)
        tr = pg.evaluate(TRACE); j, at, mx = jerk([r for r in tr if r[4]])
        print(f"{ep} {st} load: worst jerk {j:.3f} at {at:.0f} ms, largest frame move {mx:.3f}, bands {sorted(set(r[5] for r in tr))}")
        pg.evaluate(f"demo.story.go({st - 2})"); pg.wait_for_timeout(4000)
        pg.evaluate(f"demo.story.go({st - 1})"); pg.wait_for_function("demo.rig.flight", polling=16)
        tr = pg.evaluate(TRACE); j, at, mx = jerk([r for r in tr if r[4]])
        print(f"{ep} {st} from {st - 1}: worst jerk {j:.3f} at {at:.0f} ms, largest frame move {mx:.3f}, bands {sorted(set(r[5] for r in tr))}")
        ctx.close()
    br.close()
