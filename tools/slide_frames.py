#!/usr/bin/env python3
"""r596: what each frame of a room-to-room slide spends, frame by frame: the whole frame, the
composer's render (both rooms), inside.update, and how many of the new room's meshes are drawn for
the first time that frame (visible now, never visible before), with the GPU synced (gl.finish) so the
time lands on the frame that caused it. Serve the repo root on 8793 first.
    tools/slide_frames.py [--base URL] [--page encore-des-tours/] [--from 5] [--step 6]
"""
import argparse
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="encore-des-tours/")
ap.add_argument("--from", dest="frm", type=int, default=5)
ap.add_argument("--step", type=int, default=6)
ap.add_argument("--runs", type=int, default=2)
a = ap.parse_args()
PROBE = """async step => {
  const ins = demo.inside, comp = demo.composer, gl = ins.renderer.getContext(), rows = [], T = () => performance.now();
  const seen = new WeakSet(); let cur = { render: 0, update: 0, fresh: 0, names: {} };
  const wrap = (o, k, f) => { const g = o[k]; o[k] = function (...x) { return f.call(this, g, x); }; };
  wrap(comp, 'render', function (g, x) { const s = T(); const out = g.apply(this, x); gl.finish(); cur.render += T() - s; return out; });
  wrap(ins, 'update', function (g, x) { const s = T(); const out = g.apply(this, x); cur.update += T() - s;
    if (ins.sliding && ins.room) ins.room.scene.traverse(o => { if (o.isMesh && o.visible && !seen.has(o)) {
      let v = true; for (let p = o.parent; p; p = p.parent) if (!p.visible) v = false;
      if (v) { seen.add(o); cur.fresh++; const n = o.material.type + (o.material.map ? '/map' : ''); cur.names[n] = (cur.names[n] || 0) + 1; } } });
    return out; });
  let last = T(), slid = false;
  await new Promise(res => { const tick = () => { const n = T();
    if (ins.sliding || slid) { if (!slid) { slid = true; ins.room.scene.traverse(o => { if (o.isMesh && o.visible) seen.add(o); }); }
      rows.push({ dt: Math.round(n - last), render: Math.round(cur.render), update: Math.round(cur.update), fresh: cur.fresh, names: cur.names, s: ins.sliding ? +ins.sliding.s.toFixed(3) : 1 }); }
    cur = { render: 0, update: 0, fresh: 0, names: {} }; last = n;
    if (slid && !ins.sliding) return res(); requestAnimationFrame(tick); }; requestAnimationFrame(tick); demo.story.go(step); });
  return rows;
}"""
with sync_playwright() as p:
    b = launch(p)
    for run in range(a.runs):
        pg = b.new_page(viewport={"width": 1280, "height": 760})
        pg.goto(f"{a.base}{a.page}#story={a.frm}"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.wait_for_function("demo.inside.active && !demo.inside.arrival", timeout=30000); pg.wait_for_timeout(3500)
        rows = pg.evaluate(PROBE, a.step - 1)
        print(f"run {run + 1}: {len(rows)} frames; the ones over 40 ms or with a first draw:")
        for i, r in enumerate(rows):
            if r["dt"] > 40 or r["fresh"]: print(f"   frame {i:2d} s {r['s']:.3f}  {r['dt']:4d} ms  render {r['render']:4d}  update {r['update']:3d}  first drawn {r['fresh']} {r['names'] or ''}")
        pg.close()
