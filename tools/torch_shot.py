#!/usr/bin/env python3
"""A keep room's wall torch, close (r586): its holder and its flame from the side and from the front, rendered
from the room's own scene, orthographic and with no bloom, so one can see whether the flame sits on its holder.
    tools/torch_shot.py <out.png> [base] [ep:step ...]   (base: a served repo, default http://localhost:8793/;
    default cases eve-lit-tout:4 and aes-interieur:1). Prints each torch's flame centre and holder top."""
import sys, os, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from browser import launch
args = sys.argv[1:]
out = args.pop(0)
base = args.pop(0) if args and args[0].startswith("http") else "http://localhost:8793/"
CASES = [a.split(":") for a in args] or [("eve-lit-tout", 4), ("aes-interieur", 1)]
JS = """() => { const T = demo.THREE, sc = demo.inside?.room?.scene || demo.room?.scene || demo.scene;
  const f = (sc.userData.flames || [])[0]; if (!f) return { error: 'no torch' };
  const flame = f.flame, holder = sc.children.find(o => o.isMesh && o.geometry.type === 'CylinderGeometry' && o.geometry.parameters.radiusTop === .1
    && Math.abs(o.position.x - flame.position.x) < .01);
  holder.updateMatrixWorld(); const top = new T.Vector3(0, holder.geometry.parameters.height / 2, 0).applyMatrix4(holder.matrixWorld);
  const r = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(300, 300);
  const cam = new T.OrthographicCamera(-1.1, 1.1, 1.1, -1.1, .05, 50), c = flame.position.clone().add(new T.Vector3(0, -.5, -.2)), shots = [];
  const light = new T.AmbientLight(0xffffff, 2); sc.add(light);
  for (const d of [new T.Vector3(4, 0, 0), new T.Vector3(0, .6, 4)]) { cam.position.copy(c).add(d); cam.lookAt(c); r.render(sc, cam); shots.push(r.domElement.toDataURL()); }
  sc.remove(light); r.dispose();
  return { flame: flame.position.toArray().map(v => +v.toFixed(2)), top: top.toArray().map(v => +v.toFixed(2)),
    gap: +Math.max(0, top.distanceTo(flame.position) - flame.geometry.parameters.radius).toFixed(2), shots }; }"""
from PIL import Image
import io
tiles = []
with sync_playwright() as p:
    b = launch(p); pg = b.new_page(viewport={"width": 1440, "height": 900})
    for ep, s in CASES:
        pg.goto(f"{base}{ep}/?instant=1#story={s}"); pg.wait_for_timeout(8000)
        r = pg.evaluate(JS)
        if "error" in r: print(ep, s, r["error"]); continue
        print(ep, s, "flame", r["flame"], "holder top", r["top"], "gap past the ball", r["gap"])
        tiles += [Image.open(io.BytesIO(base64.b64decode(u.split(",")[1]))).convert("RGB") for u in r["shots"]]
    b.close()
sheet = Image.new("RGB", (300 * max(1, len(tiles)), 300))
for i, t in enumerate(tiles): sheet.paste(t, (i * 300, 0))
sheet.save(out); print(out)
