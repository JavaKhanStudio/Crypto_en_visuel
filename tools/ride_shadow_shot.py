#!/usr/bin/env python3
"""r543: a rider of the saga close up, mid-ride, to see that its shadow still rides with it.

Serve the tree(s), then:

    tools/ride_shadow_shot.py out/ride http://localhost:8831/ http://localhost:8832/ [--size 390x844]

deux-generaux's sandbox sends Alice's rider (never caught), and after --after ms the camera is held
a few metres from it, the moon behind the camera, every frame (demo.rig.update stopped). Writes
<out>-<w>.png: one shot per base side by side (before | after). A shadow map left stale (r543's
cache missing a caster) shows as a shadow standing behind the rider on the road.
"""
import argparse, io, os, sys
from PIL import Image
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from browser import launch  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("out"); ap.add_argument("bases", nargs="+")
ap.add_argument("--size", default="1440x860")
ap.add_argument("--after", type=int, default=2500)
a = ap.parse_args()
w, h = map(int, a.size.split("x"))
HOLD = """() => {
  const d = demo, T = d.THREE, m = window.r543m;
  d.rig.update = () => {};
  document.querySelectorAll('.panel, #card, .bubble, #topbar, header').forEach(e => e.style.visibility = 'hidden');
  const hold = () => { const p = m.obj.position, l = d.world.moonLight.position.clone().setY(0).normalize();
    d.camera.position.set(p.x + l.x * 9, p.y + 6, p.z + l.z * 9); d.camera.lookAt(p.x, p.y + 1, p.z); requestAnimationFrame(hold); };
  hold();
}"""
shots, errs = [], []
with sync_playwright() as p:
    b = launch(p)
    for base in a.bases:
        ctx = b.new_context(viewport={"width": w, "height": h}, has_touch=w < 900, is_mobile=w < 900)
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(base + "deux-generaux/#sandbox")
        pg.wait_for_function("window.demo && demo.ready", timeout=60000)
        pg.wait_for_timeout(2000)
        pg.evaluate("demo.sim.nextCaught = false; window.r543m = demo.sim.send('a')")
        pg.wait_for_timeout(a.after)
        pg.evaluate(HOLD)
        pg.wait_for_timeout(600)
        shots.append(Image.open(io.BytesIO(pg.screenshot())))
        ctx.close()
    b.close()
im = Image.new("RGB", (w * len(shots) + 10 * (len(shots) - 1), h), "white")
for i, s in enumerate(shots):
    im.paste(s, (i * (w + 10), 0))
os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
im.save(f"{a.out}-{w}.png")
print(f"{a.out}-{w}.png", "errors:", errs or "none")
