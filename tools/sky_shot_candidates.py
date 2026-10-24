#!/usr/bin/env python3
"""r494: should the saga's low shots show more of the painted sky (lib/saga/sky.js)? Candidate framings, side by side.

Episode 1.1 at rest on the steps whose shot the whole saga shares (castleA step 2, castleB step 7, both at dawn
step 12; 1.2-1.6 use the same three SHOTS 43 times), each shot three ways from lib/saga/camera.js SHOTS (WAYS):
  ['aim', p]        the camera stays, it looks along pitch p (degrees): the subject sinks, the sky shows above it
  ['up', k, h, dy]  the camera comes k of the way in, h units over the target (3 over the ground at least), looks dy over it:
                    the castle seen from below, standing against the sky
The castle shots are already near level (-10 and -8 deg): what hides the sky there is the snowy ridge round the
valley (world.js, about 50 units high, over the camera at 34), not the pitch.
Writes <out>/s<step>-<shot>-<way>.png and one sheet <out>/candidates-<size>.png (rows: steps, columns: ways).
Desktop only: under 900 px held() refits castle shots to the free band, whatever SHOTS says.
    tools/sky_shot_candidates.py out/r494 [--base http://localhost:8793/] [--size 1440x900]
"""
import argparse, pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

STEPS = [(2, "castleA", 0), (7, "castleB", 0), (12, "both", 1)]   # (1-based step, shot, dawn)
WAYS = {"castleA": [["now"], ["aim", 4], ["up", .3, -6, 8]],
        "castleB": [["now"], ["aim", 4], ["up", .3, -6, 8]],
        "both":    [["now"], ["aim", -16], ["aim", -12]]}
ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--size", default="1440x900")
a = ap.parse_args()
out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
w, h = map(int, a.size.split("x"))

FRAME = """async ([shot, way, dawn]) => {
  const { SHOTS, heightAt } = await Promise.all([import('../ficelle/lib/saga/camera.js'), import('../ficelle/lib/saga/world.js')])
    .then(([c, w]) => ({ SHOTS: c.SHOTS, heightAt: w.heightAt }));
  const T = demo.THREE, s = SHOTS[shot], pos = s.pos.clone(), target = s.target.clone();
  const off = pos.clone().sub(target), flat = Math.hypot(off.x, off.z), d = off.length();
  const deg = Math.PI / 180;
  if (way[0] === 'aim') target.y = pos.y + Math.tan(way[1] * deg) * flat;
  if (way[0] === 'up') {
    const [, k, h, dy] = way;
    pos.set(target.x + off.x * (1 - k), 0, target.z + off.z * (1 - k)); pos.y = Math.max(heightAt(pos.x, pos.z) + 3, target.y + h);
    target.y += dy;
  }
  demo.rig.setOrbit(0); demo.rig.jump({ pos, target }); demo.world.setDawn(dawn);
  const pitch = Math.atan2(target.y - pos.y, Math.hypot(target.x - pos.x, target.z - pos.z)) / deg;
  return { pos: pos.toArray().map(n => +n.toFixed(1)), target: target.toArray().map(n => +n.toFixed(1)), pitch: +pitch.toFixed(1) };
}"""

bad = 0
with sync_playwright() as p:
    br = launch(p)
    pg = br.new_page(viewport={"width": w, "height": h})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"{a.base}deux-generaux/?instant=1&lang=fr#story=1", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=90000)
    pg.evaluate("demo.world.skyReady || null")
    files = []
    for step, shot, dawn in STEPS:
        pg.evaluate(f"demo.story.go({step - 1})"); pg.wait_for_timeout(1600)
        row = []
        for way in WAYS[shot]:
            r = pg.evaluate(FRAME, [shot, way, dawn])
            pg.wait_for_timeout(700)
            f = out / f"s{step}-{shot}-{'-'.join(map(str, way))}.png"; pg.screenshot(path=str(f)); row.append(f)
            print(f"step {step} {shot} {way}: pos {r['pos']} target {r['target']} pitch {r['pitch']} deg")
        files.append((f"{step} {shot}", row, WAYS[shot]))
    if errs: print("page errors:", errs[:3]); bad = 1
    br.close()

tw, th, lab = 480, 300, 26
sheet = Image.new("RGB", (3 * (tw + 6), len(files) * (th + lab)), "black")
d = ImageDraw.Draw(sheet)
for j, (name, row, ways) in enumerate(files):
    y = j * (th + lab)
    for i, (f, way) in enumerate(zip(row, ways)):
        d.text((i * (tw + 6) + 8, y + 6), f"step {name}: {'ABC'[i]} {' '.join(map(str, way))}", fill="#ffd27a")
        sheet.paste(Image.open(f).convert("RGB").resize((tw, th)), (i * (tw + 6), y + lab - 4))
f = out / f"candidates-{a.size}.png"; sheet.save(f); print(f)
print("errors: none" if not bad else "page errors")
sys.exit(bad)
