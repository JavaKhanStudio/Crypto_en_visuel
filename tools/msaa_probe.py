#!/usr/bin/env python3
"""r576: what HD's MSAA costs and buys, on one page, one frame. Inside one task the probe sets the composer's
targets to each --samples count in turn (the scene cannot move between them), times them in paired rounds
(r518's pattern: this GPU's timings swing between runs, never between two halves of one task) and grabs the frame
for each, cropped at 100% (device pixels) on --crop, side by side.

    tools/msaa_probe.py out/r576/dg-dpr2 --page deux-generaux/ --hash '#story=1' --dpr 2 --crop 560,140,360,260

--crop x,y,w,h is in CSS px. Prints each count's median frame and what it saves against the first; writes <out>.png
and prints page errors (must be none)."""
import argparse
import base64
import io
import os
import sys
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from browser import launch  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="deux-generaux/")
ap.add_argument("--hash", default="#story=1")
ap.add_argument("--query", default="?instant=1&quality=normal")
ap.add_argument("--size", default="1440x860")
ap.add_argument("--dpr", type=float, default=1)
ap.add_argument("--samples", default="4,2,0")
ap.add_argument("--crop", default="")
ap.add_argument("--frames", type=int, default=20)
ap.add_argument("--rounds", type=int, default=7)
ap.add_argument("--settle", type=int, default=8000)
a = ap.parse_args()

PROBE = """([counts, N, K]) => {
  const C = demo.composer, R = demo.renderer, gl = R.getContext(), max = R.capabilities.maxSamples;
  const was = C.renderTarget1.samples, px = new Uint8Array(4), sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const use = s => { for (const rt of [C.renderTarget1, C.renderTarget2]) { rt.samples = Math.min(s, max); rt.dispose(); } C.render(); sync(); };
  const once = () => { const ts = []; for (let i = 0; i < N; i++) { const t0 = performance.now(); C.render(); sync(); ts.push(performance.now() - t0); }
    ts.sort((x, y) => x - y); return ts[N >> 1]; };
  const pics = counts.map(s => { use(s); C.render(); return R.domElement.toDataURL('image/png'); });
  const ms = counts.map(() => []);
  for (let k = 0; k < K; k++) {   // each round times every count, in a rotated order
    for (let j = 0; j < counts.length; j++) { const i = (j + k) % counts.length; use(counts[i]); once(); ms[i].push(once()); } }
  const med = x => [...x].sort((p, q) => p - q)[x.length >> 1];
  const saves = ms.map(m => +med(m.map((v, k) => ms[0][k] - v)).toFixed(2));
  use(was);
  return { W: R.domElement.width, H: R.domElement.height, max, quality: document.documentElement.dataset.quality,
    ms: ms.map(m => +med(m).toFixed(2)), spread: ms.map(m => [+Math.min(...m).toFixed(1), +Math.max(...m).toFixed(1)]), saves, pics };
}"""

counts = [int(s) for s in a.samples.split(",")]
w, h = map(int, a.size.split("x"))
with sync_playwright() as p:
    br = launch(p)
    ctx = br.new_context(viewport={"width": w, "height": h}, device_scale_factor=a.dpr, has_touch=w < 900, is_mobile=w < 900)
    pg = ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(a.base + a.page + a.query + a.hash, wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(a.settle)
    r = pg.evaluate(PROBE, [counts, a.frames, a.rounds])
    br.close()
pics = [Image.open(io.BytesIO(base64.b64decode(u.split(",")[1]))).convert("RGB") for u in r["pics"]]
if a.crop:
    x, y, cw, ch = (int(v * a.dpr) for v in map(float, a.crop.split(",")))
    pics = [im.crop((x, y, x + cw, y + ch)) for im in pics]
gap = 12
out = Image.new("RGB", (pics[0].width * len(pics) + gap * (len(pics) - 1), pics[0].height + 34), (20, 22, 28))
d = ImageDraw.Draw(out)
for i, (im, s) in enumerate(zip(pics, counts)):
    out.paste(im, (i * (im.width + gap), 34))
    d.text((i * (im.width + gap) + 8, 10), f"MSAA {s}" + (" (HD today)" if s == 4 else "") + f"  {r['ms'][i]} ms", fill=(240, 240, 240))
os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
out.save(a.out + ".png")
print(f"{a.page}{a.hash}  canvas {r['W']}x{r['H']} (dpr {a.dpr}, quality {r['quality']}, max samples {r['max']})")
for s, m, sp, sv in zip(counts, r["ms"], r["spread"], r["saves"]):
    print(f"  MSAA {s}: frame {m:6.2f} ms (rounds {sp[0]}-{sp[1]})" + (f"  saves {sv:5.2f} ms against MSAA {counts[0]}" if s != counts[0] else ""))
print(f"{a.out}.png errors: {'none' if not errors else errors}")
sys.exit(1 if errors else 0)
