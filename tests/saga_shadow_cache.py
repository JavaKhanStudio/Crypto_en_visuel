#!/usr/bin/env python3
"""r543: the saga's moon shadow map is redrawn only when something in it changed.

Serve the tree, then:   tests/saga_shadow_cache.py [--base http://localhost:8793/]

For each saga episode, a still step: over --secs seconds, how many frames the page drew and how many
of them redrew the shadow map (scene.userData.shadowDraws, lib/saga/world.js cacheShadow). A still
step must redraw it at most twice; then deux-generaux's sandbox sends a rider (demo.sim.send('a'))
and must redraw on most of its frames, or the rider's shadow would stand still. (1.5's step 1 is not
still: its packet turns on a stand, and redraws every frame, as it should.) Prints ok/FAIL per line;
exit 1 on any FAIL. Mutant: castShadow on a flag's cloth (lib/saga/world.js flag()) fails every line.
"""
import argparse, os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tools'))
from browser import launch  # noqa: E402

STILL = {'deux-generaux': 1, 'eve-lit-tout': 1, 'octet-change': 1, 'cle-vallee': 1,
         'paquet-complet': 2, 'encore-des-tours': 1, 'a-toi-de-jouer': 1}
ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--secs", type=float, default=3)
ap.add_argument("--settle", type=int, default=8000)
ap.add_argument("--eps", nargs="*", default=list(STILL))
a = ap.parse_args()

# frames the page drew (requestAnimationFrame) and shadow redraws, over ms
COUNT = """async (ms) => {
  const s = demo.scene.userData, d0 = s.shadowDraws || 0; let f = 0, run = true;
  const tick = () => { if (run) { f++; requestAnimationFrame(tick); } }; requestAnimationFrame(tick);
  await new Promise(res => setTimeout(res, ms)); run = false;
  return [f, (s.shadowDraws || 0) - d0];
}"""
bad = 0
with sync_playwright() as p:
    b = launch(p)
    for ep in a.eps:
        pg = b.new_page(viewport={"width": 1440, "height": 860})
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"{a.base}{ep}/?instant=1#story={STILL[ep]}")
        pg.wait_for_function("window.demo && demo.ready", timeout=60000)
        pg.wait_for_timeout(a.settle)
        frames, draws = pg.evaluate(COUNT, int(a.secs * 1000))
        ok = frames > 5 and draws <= 2 and not errs
        bad += not ok
        print(f"{'ok  ' if ok else 'FAIL'} {ep} step {STILL[ep]} still: {draws} shadow draws in {frames} frames", *errs[:3])
        pg.close()
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    pg.goto(f"{a.base}deux-generaux/#sandbox")
    pg.wait_for_function("window.demo && demo.ready", timeout=60000)
    pg.wait_for_timeout(3000)
    pg.evaluate("demo.sim.send('a')")
    frames, draws = pg.evaluate(COUNT, 2000)
    ok = frames > 5 and draws >= frames * .8
    bad += not ok
    print(f"{'ok  ' if ok else 'FAIL'} deux-generaux sandbox, a rider out: {draws} shadow draws in {frames} frames")
    b.close()
sys.exit(1 if bad else 0)
