#!/usr/bin/env python3
"""r548: lib/bloom.js against three's UnrealBloomPass + OutputPass, on one page, one frame. The probe swaps the
composer's passes between the two chains inside one task (the scene cannot move between them), reads the canvas
back after each and prints how far the two pictures are apart, then times the two in paired rounds (r518's
saves(): this machine's GPU timings swing between runs, never between two halves of one task).

    tools/bloom_probe.py --base http://localhost:8793/ --page deux-generaux/ --hash '#story=1' [--dpr 2] [--query '?instant=1&quality=normal']

Passes when the largest channel difference is <= 2 (of 255) and fewer than 0.5% of the pixels differ by more than 1
(half-float rounding: the old chain rounds the sum into the target, the new one does not)."""
import argparse
import os
import sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from browser import launch  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="deux-generaux/")
ap.add_argument("--hash", default="#story=1")
ap.add_argument("--query", default="?instant=1")
ap.add_argument("--size", default="1440x860")
ap.add_argument("--dpr", type=float, default=1)
ap.add_argument("--frames", type=int, default=30)
ap.add_argument("--settle", type=int, default=6000)
ap.add_argument("--scale", type=float, default=1, help="r542: compare lib/bloom.js at full size against it at SCALE of the canvas (0.5: its bright pass at quarter res), a picture that changes")
a = ap.parse_args()

PROBE = """async ([N, S]) => {
  const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
  const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');
  const { addBloom } = await import(new URL('../lib/bloom.js', location.href).href);
  const d = demo, R = d.renderer, gl = R.getContext(), C = d.composer;
  const first = C.passes[0], was = C.passes.slice(1);
  const ub = was.find(p => p.nMips);
  const [s, r, t] = [ub.strength, ub.radius, ub.threshold];
  // the old chain, fresh, and the new one, both after the episode's own RenderPass
  const W = R.domElement.width, H = R.domElement.height;
  C.passes = [first];
  if (S < 1) { const ob = addBloom(C, s, r, t); ob.scale = 1; ob.setSize(W, H); } else { C.addPass(new UnrealBloomPass(new demo.THREE.Vector2(1, 1), s, r, t)); C.addPass(new OutputPass()); }
  const oldP = C.passes.slice(1);
  C.passes = [first]; const nb = addBloom(C, s, r, t); const newP = C.passes.slice(1);
  nb.scale = S; nb.setSize(W, H);   // r542: by hand, over lib/bloom.js's HiDPI half
  const use = ps => { C.passes = [first, ...ps]; };
  const px = new Uint8Array(4), sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const grab = () => { const b = new Uint8Array(W * H * 4); C.render(); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b); return b; };
  use(oldP); for (let i = 0; i < 6; i++) { C.render(); sync(); }
  use(newP); for (let i = 0; i < 6; i++) { C.render(); sync(); }
  use(oldP); const A = grab(); use(newP); const B = grab();
  let max = 0, n = 0, n2 = 0;
  for (let i = 0; i < A.length; i += 4) { let m = 0;
    for (let c = 0; c < 3; c++) m = Math.max(m, Math.abs(A[i + c] - B[i + c]));
    if (m) n++; if (m > 1) n2++; if (m > max) max = m; }
  const once = () => { const ts = []; for (let i = 0; i < N; i++) { const t0 = performance.now(); C.render(); sync(); ts.push(performance.now() - t0); }
    ts.sort((x, y) => x - y); return ts[N >> 1]; };
  const ds = [], olds = [], news = [];
  for (let k = 0; k < 5; k++) { use(oldP); const o = once(); use(newP); const v = once(); olds.push(o); news.push(v); ds.push(o - v); }
  const med = x => x.sort((p, q) => p - q)[x.length >> 1];
  use(was);
  return { W, H, bright: [ub.renderTargetBright.width, ub.renderTargetBright.height], samples: C.renderTarget1.samples, quality: document.documentElement.dataset.quality, max, differ: n / (W * H), differ2: n2 / (W * H),
    old_ms: +med(olds).toFixed(2), new_ms: +med(news).toFixed(2), saves_ms: +med(ds).toFixed(2) };
}"""

w, h = map(int, a.size.split("x"))
with sync_playwright() as p:
    b = launch(p)
    ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=a.dpr, has_touch=w < 900, is_mobile=w < 900)
    pg = ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(a.base + a.page + a.query + a.hash, wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(a.settle)
    r = pg.evaluate(PROBE, [a.frames, a.scale])
    b.close()
ok = (a.scale < 1 or (r["max"] <= 2 and r["differ2"] < .005)) and not errors
print(("" if a.scale == 1 else f"bloom at {a.scale} of the canvas: ") + f"{a.page}{a.hash}  canvas {r['W']}x{r['H']} quality {r['quality']} MSAA {r['samples']} (page's bloom bright pass {r['bright'][0]}x{r['bright'][1]}): "
      f"frame {r['old_ms']} -> {r['new_ms']} ms (saves {r['saves_ms']} ms), picture: max diff {r['max']}/255, "
      f"{100 * r['differ']:.2f}% of pixels differ, {100 * r['differ2']:.3f}% by more than 1  {'ok' if ok else 'FAIL'}" + (f"  errors: {errors}" if errors else ""))
sys.exit(0 if ok else 1)
