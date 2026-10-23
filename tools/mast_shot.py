#!/usr/bin/env python3
"""The Enigma forest's aerial mast, close (r599): its top from the front and from the side, rendered from the
episode's own scene, orthographic and with no bloom, so one can see whether the cross-bar meets the posts.
    tools/mast_shot.py <out.png> [base] [ep ...]   (base: a served repo, default http://localhost:8793/;
    default episodes enigma, enigma-reglage, enigma-casse)."""
import sys, os, io, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from browser import launch
from PIL import Image
args = sys.argv[1:]
out = args.pop(0)
base = args.pop(0) if args and args[0].startswith("http") else "http://localhost:8793/"
EPS = args or ["enigma", "enigma-reglage", "enigma-casse"]
JS = """async () => { const T = await import('three'), sc = demo.scene; let mast;
  sc.traverse(o => { if (!mast && o.isGroup && o.userData.light && o.children.some(c => c.geometry?.type === 'BoxGeometry' && c.geometry.parameters.width === 14)) mast = o; });
  if (!mast) return { error: 'no mast' };
  const bar = mast.children.find(c => c.geometry?.type === 'BoxGeometry'); mast.updateMatrixWorld(true);
  const c = bar.getWorldPosition(new T.Vector3()), r = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(400, 300);
  const cam = new T.OrthographicCamera(-8, 8, 6, -6, .1, 200), light = new T.AmbientLight(0xffffff, 3), shots = []; sc.add(light);
  const fwd = new T.Vector3(0, 0, 1).applyQuaternion(mast.getWorldQuaternion(new T.Quaternion())), side = new T.Vector3(1, 0, 0).applyQuaternion(mast.getWorldQuaternion(new T.Quaternion()));
  for (const [d, zoom] of [[fwd, 1], [side, 4]]) { cam.zoom = zoom; cam.updateProjectionMatrix(); cam.position.copy(c).addScaledVector(d, 40); cam.lookAt(c); r.render(sc, cam); shots.push(r.domElement.toDataURL()); }
  sc.remove(light); r.dispose(); return { bar: bar.position.toArray(), shots }; }"""
tiles = []
with sync_playwright() as p:
    b = launch(p); pg = b.new_page(viewport={"width": 1440, "height": 900})
    for ep in EPS:
        pg.goto(f"{base}{ep}/?instant=1#story=1"); pg.wait_for_timeout(8000)
        r = pg.evaluate(JS)
        if "error" in r: print(ep, r["error"]); continue
        print(ep, "bar at", [round(v, 2) for v in r["bar"]])
        tiles += [Image.open(io.BytesIO(base64.b64decode(u.split(",")[1]))).convert("RGB") for u in r["shots"]]
    b.close()
sheet = Image.new("RGB", (400 * 2, 300 * max(1, len(tiles) // 2)))
for i, t in enumerate(tiles): sheet.paste(t, ((i % 2) * 400, (i // 2) * 300))
sheet.save(out); print(out)
