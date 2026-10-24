#!/usr/bin/env python3
"""What the saga's painted sky (lib/saga/sky.js, r449) costs, r621 (Simon: « how much in term of ressource the
parallax is taking ? The scene felt very laggy »). On a saga page, at rest on a step:
  - GPU time of a frame (drawn then read back, median), whole scene vs: the bands hidden (the page's gradient
    sphere alone), the page gone and the old dome back (the sky before r449), and each band hidden alone;
  - the share of the screen each band covers (its fragments, overdraw: every band is transparent and drawn
    whole, far to near, each one a full shader pass over the pixels it covers);
  - its textures (MB on the GPU) and what loading it took (fetch, decode, the canvas cuts of plax.js).
Serve the tree first (python3 -m http.server PORT), then:
    tools/sky_cost.py --base http://localhost:8793/ --page deux-generaux/ --steps 1,6,12 [--size 390x844] [--dpr 2]
Another session's chromium or a game on the same GPU skews every number (compare rows of one run)."""
import argparse
import os
import sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from browser import launch  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="deux-generaux/")
ap.add_argument("--steps", default="1,6,12")
ap.add_argument("--size", default="1440x900")
ap.add_argument("--map", default="", help="a candidate valley of lib/saga/world.js MAPS (?map=)")
ap.add_argument("--dpr", type=float, default=1)
ap.add_argument("--frames", type=int, default=20)
ap.add_argument("--per-band", action="store_true", help="also time each band hidden alone (slow: 2 x 5 x frames each)")
ap.add_argument("--flight", help="FROM,TO: instead, the frame intervals of the camera's flight FROM -> TO (4.5 s of requestAnimationFrame), with the page sky and with the old dome, in turns")
a = ap.parse_args()

MEASURE = """async ([N, PER]) => {
  const d = demo, R = d.renderer, gl = R.getContext(), scene = d.scene, W = d.world;
  await W.skyReady;
  const S = W.pageSky, dome = W.sky.children[0];
  const px = new Uint8Array(4), sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const draw = () => d.composer.render();
  const once = () => { const ts = []; for (let i = 0; i < N; i++) { const t = performance.now(); draw(); sync(); ts.push(performance.now() - t); }
    ts.sort((x, y) => x - y); return ts[N >> 1]; };
  // what a change saves: whole and changed frames in turns, 5 rounds, the median of the differences
  const saves = (on, off) => { off(); for (let i = 0; i < 8; i++) { draw(); sync(); } on(); for (let i = 0; i < 8; i++) { draw(); sync(); }
    const ds = []; for (let k = 0; k < 5; k++) { const f = once(); off(); const v = once(); on(); ds.push(f - v); }
    ds.sort((x, y) => x - y); return +ds[2].toFixed(2); };
  const calls = () => { R.info.autoReset = false; R.info.reset(); draw(); sync(); const c = R.info.render.calls; R.info.autoReset = true; return c; };
  for (let i = 0; i < 8; i++) { draw(); sync(); }
  const out = { canvas: [R.domElement.width, R.domElement.height], quality: localStorage.getItem('dg-quality'),
    samples: d.composer.renderTarget1?.samples, frame: +once().toFixed(2), calls: calls() };
  out.bands = saves(() => S.root.visible = true, () => S.root.visible = false);
  out.page = saves(() => { S.root.visible = S.gradient.mesh.visible = true; dome.visible = false; },
                   () => { S.root.visible = S.gradient.mesh.visible = false; dome.visible = true; });
  out.layers = S.layers.map((x, i) => ({ name: x.l.region.name, r: Math.round(x.r), segs: x.mesh.geometry.parameters.radialSegments,
    tex: [x.l.texture.image.width, x.l.texture.image.height],
    saves: PER ? saves(() => x.mesh.visible = true, () => x.mesh.visible = false) : null }));
  // coverage: each band alone, drawn flat into a plain target, its pixels counted (alpha kept: discard below .02)
  const w = R.domElement.width, h = R.domElement.height, rt = new THREE_RT(w, h), buf = new Uint8Array(w * h * 4);
  const hidden = []; scene.traverse(o => { if (o.visible && o !== scene) hidden.push(o); });
  for (const x of out.layers.keys()) {
    const L = S.layers[x];
    hidden.forEach(o => o.visible = false); let p = L.mesh; while (p) { p.visible = true; p = p.parent; }
    const bg = scene.background, fog = scene.fog; scene.background = null;
    R.setRenderTarget(rt); R.setClearColor(0, 0); R.clear(); R.render(scene, d.camera);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf); R.setRenderTarget(null);
    let n = 0; for (let i = 3; i < buf.length; i += 4) if (buf[i] > 0) n++;
    out.layers[x].cover = +(100 * n / (w * h)).toFixed(1);
    hidden.forEach(o => o.visible = true); scene.background = bg; scene.fog = fog;
  }
  rt.dispose();
  out.texMB = +S.layers.reduce((s, x) => s + x.l.texture.image.width * x.l.texture.image.height * 4 * 1.33 / 1048576, 0).toFixed(1);
  const res = performance.getEntriesByType('resource').filter(e => /parallax/.test(e.name));
  out.fetch = res.map(e => [e.name.split('/').pop(), Math.round(e.duration), Math.round(e.transferSize / 1024)]);
  // the load once more, timed (the files are cached now: decode + canvas cuts)
  const { loadPage } = await import(new URL('../lib/plax.js', location.href).href);
  const t = performance.now(); await loadPage(new URL('../assets/parallax/calm-day/calm-day.jplax?again=' + Date.now(), location.href).href); out.reload_ms = Math.round(performance.now() - t);
  return out;
}"""

FLIGHT = """async ([to, sky]) => {
  const W = demo.world; await W.skyReady; const S = W.pageSky;
  S.root.visible = S.gradient.mesh.visible = sky; W.sky.children[0].visible = !sky;
  await new Promise(r => setTimeout(r, 1500));
  const iv = []; let last = performance.now(), on = true;
  const tick = () => { const n = performance.now(); iv.push(n - last); last = n; if (on) requestAnimationFrame(tick); };
  requestAnimationFrame(tick); demo.story.go(to); await new Promise(r => setTimeout(r, 4500)); on = false;
  iv.shift(); iv.sort((x, y) => x - y);
  const q = f => +iv[Math.min(iv.length - 1, Math.floor(f * iv.length))].toFixed(1);
  return { frames: iv.length, fps: +(iv.length / 4.5).toFixed(1), median: q(.5), p95: q(.95), over33: iv.filter(x => x > 33.4).length, worst: q(1) };
}"""

def flight(ctx):
    frm, to = map(int, a.flight.split(","))
    rows = []
    for k in range(4):
        for sky in (True, False):
            pg = ctx.new_page(); pg.goto(f"{a.base}{a.page}{'?map=' + a.map if a.map else ''}#story={frm}", wait_until="load")   # no ?instant: the flight is what is timed
            pg.wait_for_function("window.demo && window.demo.ready", timeout=60000); pg.wait_for_timeout(3000)
            r = pg.evaluate(FLIGHT, [to - 1, sky]); pg.close()
            print(f"  {'page sky' if sky else 'old dome'}  {r}", flush=True); rows.append((sky, r))
    for sky in (True, False):
        m = sorted(r["median"] for s, r in rows if s == sky); f = sorted(r["fps"] for s, r in rows if s == sky)
        print(f"{'page sky' if sky else 'old dome'}: median frame {m[len(m) // 2]} ms, {f[len(f) // 2]} fps (medians of 4 runs)")

w, h = map(int, a.size.split("x"))
if a.flight:
    with sync_playwright() as p:
        b = launch(p); ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=a.dpr)
        print(f"{a.page} flight {a.flight} at {a.size} dpr {a.dpr}"); flight(ctx); b.close()
    sys.exit()
with sync_playwright() as p:
    b = launch(p)
    ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=a.dpr, has_touch=w < 900, is_mobile=w < 900)
    errors = []
    for s in a.steps.split(","):
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{a.base}{a.page}?instant=1{'&map=' + a.map if a.map else ''}#story={s}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.wait_for_timeout(5000)
        pg.evaluate("() => import('three').then(T => { window.THREE_RT = T.WebGLRenderTarget; })")
        r = pg.evaluate(MEASURE.replace("new THREE_RT", "new window.THREE_RT"), [a.frames, a.per_band])
        pg.close()
        print(f"\n{a.page}#story={s} map {a.map or 'now'}  {a.size} dpr {a.dpr}  canvas {r['canvas'][0]}x{r['canvas'][1]}  quality {r['quality']} MSAA {r['samples']}")
        print(f"  frame {r['frame']:6.2f} ms, {r['calls']} draw calls")
        print(f"  bands hidden (gradient left)       saves {r['bands']:6.2f} ms")
        print(f"  page gone, old dome back (pre-r449) saves {r['page']:6.2f} ms")
        for x in r["layers"]:
            print(f"    {x['name'][:18]:18s} r {x['r']:4d}  {x['segs']} segs  tex {x['tex'][0]}x{x['tex'][1]}  covers {x.get('cover', 0):5.1f}% of the screen  " + (f"saves {x['saves']:6.2f} ms" if x['saves'] is not None else ""), flush=True)
        print(f"  band textures {r['texMB']} MB on the GPU (mips);  fetched {r['fetch']};  load again (cached: decode + cuts) {r['reload_ms']} ms", flush=True)
    b.close()
print("\npage errors:", errors or "none")
