#!/usr/bin/env python3
"""r590: did a phone castle step's hold (lib/saga/camera.js held()) decide on the band as it is at rest?
For each step, loaded at 390x844 and left to settle: the band the rig read when it resolved the flight
(rig.held.band) against lib/band.js freeBand() now, and held() of the same shot now against where the rig
flew (under 3 units: 1.6's packet, the subject held, bobs and turns). touch: the bar tucked from the start (a real phone); mouse: hover, the bar shown then sliding away.
    tools/hold_rest.py [--base URL] [--out out/r590/x] [ep:step ...]"""
import argparse, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from browser import launch
ap = argparse.ArgumentParser(); ap.add_argument("cases", nargs="*", default=["encore-des-tours:9", "encore-des-tours:13", "octet-change:10", "encore-des-tours:4", "deux-generaux:2"])
ap.add_argument("--base", default="http://localhost:8793/"); ap.add_argument("--out", default=""); ap.add_argument("--wait", type=int, default=9000)
a = ap.parse_args(); base = a.base.rstrip("/") + "/"
PROBE = """async () => {
  const { held } = await import('%slib/saga/camera.js'), { freeBand } = await import('%slib/band.js');
  const r = demo.rig.held; if (!r) return null;
  const b = freeBand(), now = held(r.shot, demo.camera), d = r.to.pos.distanceTo(now.pos) + r.to.target.distanceTo(now.target);
  const B = x => [Math.round(x.top), Math.round(x.top + x.h)];
  return { shot: typeof r.shot === 'string' ? r.shot : 'obj', fly: B(r.band), rest: B(b), moved: +d.toFixed(2) };
}"""
bad = 0
with sync_playwright() as p:
    br = launch(p)
    for case in a.cases:
        ep, st = case.split(":")
        for lang in ["fr", "en"]:
            for touch in [True, False]:
                ctx = br.new_context(viewport={"width": 390, "height": 844}, is_mobile=touch, has_touch=touch); pg = ctx.new_page()
                pg.goto(f"{base}{ep}/?lang={lang}#story={st}"); pg.wait_for_function("window.demo && demo.ready", timeout=60000)
                pg.wait_for_timeout(a.wait)
                m = pg.evaluate(PROBE % (base, base))
                ok = m is not None and abs(m["fly"][0] - m["rest"][0]) <= 4 and abs(m["fly"][1] - m["rest"][1]) <= 4 and m["moved"] < 3
                bad += not ok
                print(("ok   " if ok else "BAD  ") + f"{ep} {st} {lang} {'touch' if touch else 'mouse'}: {json.dumps(m)}", flush=True)
                if a.out: pg.screenshot(path=f"{a.out}-{ep}-{st}-{lang}-{'touch' if touch else 'mouse'}.png")
                ctx.close()
    br.close()
print("all ok" if not bad else f"{bad} bad"); sys.exit(bad > 0)
