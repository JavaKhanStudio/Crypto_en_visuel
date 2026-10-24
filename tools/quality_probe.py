#!/usr/bin/env python3
"""r254: prints, per ?quality level, the composer's MSAA samples, the pixel ratio, the GPU's
maxSamples, the shadow filter (r613: Éco Bilinear, HD and HD+ PCFSoft) and the frame time, so a level is
proved to do what it says (samples: Éco 0, HD 4 below pixel ratio 2 and 0 from it on, r576; HD+ 4 or more); then clicks Éco -> HD and checks the filter switched and the programs rebuilt.
    tools/quality_probe.py enigma [--base http://localhost:8793/]
    tools/quality_probe.py enigma --dpr 2      # a HiDPI screen: HD has no MSAA
    tools/quality_probe.py enigma --defaults   # nothing chosen: a phone opens on eco, a desktop and a tablet on normal
"""
import argparse, json
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
ap = argparse.ArgumentParser(); ap.add_argument("episode"); ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--size", default="1440x860")
ap.add_argument("--dpr", type=float, default=1)
ap.add_argument("--defaults", action="store_true", help="check the level an empty localStorage opens on, phone / tablet / desktop")
a = ap.parse_args()
w, h = map(int, a.size.split("x"))
JS = """async () => { const d = window.demo, c = d.composer, r = d.renderer;
  const t0 = performance.now(); for (let i = 0; i < 10; i++) c.render(); r.getContext().finish();
  return { samples: c.renderTarget1.samples, ratio: r.getPixelRatio(), max: r.capabilities.maxSamples,
           rt: [c.renderTarget1.width, c.renderTarget1.height], ms: Math.round((performance.now() - t0) / 10),
           label: document.getElementById('quality')?.textContent,
           shadow: ['Basic', 'Bilinear', 'PCFSoft', 'VSM'][r.shadowMap.type] }; }"""
SHADOW = {"eco": "Bilinear", "normal": "PCFSoft", "fine": "PCFSoft"}
SAMPLES = {"eco": lambda r: r["samples"] == 0, "normal": lambda r: r["samples"] == (0 if r["ratio"] >= 2 else min(4, r["max"])),
           "fine": lambda r: r["samples"] >= min(4, r["max"])}
# r613: a click from Éco to HD must swap the filter and recompile the receivers (new programs appear)
SWITCH = """async () => { const d = window.demo, r = d.renderer, n0 = r.info.programs.length;
  document.getElementById('quality').click(); d.composer.render();
  return { type: r.shadowMap.type, built: r.info.programs.length - n0 }; }"""
DEVICES = [("phone", dict(viewport={"width": 390, "height": 844}, screen={"width": 390, "height": 844}, is_mobile=True, has_touch=True), "eco"),
           ("phone landscape", dict(viewport={"width": 844, "height": 390}, screen={"width": 844, "height": 390}, is_mobile=True, has_touch=True), "eco"),
           ("tablet", dict(viewport={"width": 820, "height": 1180}, screen={"width": 820, "height": 1180}, is_mobile=True, has_touch=True), "normal"),
           ("desktop", dict(viewport={"width": 1440, "height": 860}, screen={"width": 1440, "height": 860}), "normal")]
if a.defaults:   # lib/quality.js is imported straight from the episode's page (its importmap gives 'three')
    bad = 0
    with sync_playwright() as p:
        b = launch(p)
        for name, opts, want in DEVICES:
            ctx = b.new_context(**opts); pg = ctx.new_page()
            pg.goto(f"{a.base}{a.episode}/", wait_until="load")
            got = pg.evaluate("async () => { localStorage.removeItem('dg-quality'); return (await import('../ficelle/lib/quality.js')).getQuality(); }")
            print("ok  " if got == want else "FAIL", f"{name}: opens on {got} (want {want})"); bad += got != want; ctx.close()
        b.close()
    print("all ok" if not bad else "FAILED"); raise SystemExit(1 if bad else 0)
with sync_playwright() as p:
    b = launch(p)
    bad = 0
    for q in ["eco", "normal", "fine"]:
        pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=a.dpr); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"{a.base}{a.episode}/?instant=1&quality={q}#story=5", wait_until="load"); pg.wait_for_timeout(3000)
        r = pg.evaluate(JS); ok = r["shadow"] == SHADOW[q] and SAMPLES[q](r) and not errs; bad += not ok
        print("ok  " if ok else "FAIL", q, json.dumps(r), "errors:", errs or "none")
        if q == "eco":
            s = pg.evaluate(SWITCH); ok = s["type"] == 2 and s["built"] > 0; bad += not ok
            print("ok  " if ok else "FAIL", "click Éco -> HD:", json.dumps(s))
        pg.close()
    b.close()
    print("all ok" if not bad else "FAILED"); raise SystemExit(1 if bad else 0)
