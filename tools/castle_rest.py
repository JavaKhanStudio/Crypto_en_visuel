#!/usr/bin/env python3
"""r584: a saga castle step on a phone at rest: is the castle's outline (lib/saga/camera.js outline(),
the meshes cut at the ground) whole between the bubble room and the free band's bottom (lib/band.js
freeBand()), measured on the camera as it stands, not on what held() decided at the flight's start?
Shoots each case to <out>-<ep>-<step>.png. Touch phone 390x844 (the bar tucked, lib/topbar.js r406).
    tools/castle_rest.py <out> [--base URL] [--instant] [ep:step ...]   (default deux-generaux 2, 5, 7)"""
import argparse, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from browser import launch
ap = argparse.ArgumentParser(); ap.add_argument("out"); ap.add_argument("cases", nargs="*", default=["deux-generaux:2", "deux-generaux:5", "deux-generaux:7"])
ap.add_argument("--base", default="http://localhost:8793/"); ap.add_argument("--instant", action="store_true")
ap.add_argument("--size", default="390x844"); ap.add_argument("--wait", type=int, default=12000)
a = ap.parse_args(); W, H = map(int, a.size.split("x")); base = a.base.rstrip("/") + "/"
PROBE = """async () => {
  const { BUILT } = await import('%sficelle/lib/saga/world.js'), { freeBand } = await import('%sficelle/lib/band.js');
  const cam = demo.camera, b = freeBand(), out = {};
  for (const k of ['castleA', 'castleB']) {
    const c = BUILT[k]; c.updateMatrixWorld(true);
    const box = new demo.THREE.Box3(), ys = [], xs = [];
    c.traverse(o => { if (!o.isMesh || o === c.userData.glow || !o.visible) return; box.setFromObject(o);
      for (let i = 0; i < 8; i++) { const p = new demo.THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(cam);
        if (p.z < 1) { ys.push((1 - p.y) / 2 * innerHeight); xs.push((p.x + 1) / 2 * innerWidth); } } });
    out[k] = ys.length ? [Math.round(Math.min(...ys)), Math.round(Math.max(...ys)), Math.round(Math.min(...xs)), Math.round(Math.max(...xs))] : null;
  }
  const r = id => { const e = document.getElementById(id); return e?.offsetHeight ? Math.round(e.getBoundingClientRect().top) : null; };
  return { band: [Math.round(b.top), Math.round(b.top + b.h)], story: r('story'), card: r('card'), castles: out };
}"""
with sync_playwright() as p:
    br = launch(p)
    for case in a.cases:
        ep, st = case.split(":")
        ctx = br.new_context(viewport={"width": W, "height": H}, is_mobile=W < 900, has_touch=W < 900); pg = ctx.new_page()
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"{base}{ep}/{'?instant=1' if a.instant else ''}#story={st}")
        pg.wait_for_function("window.demo && demo.ready", timeout=60000); pg.wait_for_timeout(a.wait)
        m = pg.evaluate(PROBE % (base, base)); f = f"{a.out}-{ep}-{st}.png"; pg.screenshot(path=f)
        print(f"{ep} {st}: {json.dumps(m)} {f} errors: {errs[:1] or 'none'}"); ctx.close()
    br.close()
