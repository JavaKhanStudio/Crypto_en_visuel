"""Close-ups of episode 10's figures (r644): Alice, Eve, Bob, Victor and one of Victor's customers, each from
in front (Victor from above: his hall's wall is in front of him) at step 12 (every figure on the map), side by side in one sheet, to judge the cast before and after a
change to who draws them.

    python3 tools/vpn_cast_close.py out/r644/close-after.png [--base http://localhost:8793/]
"""
import argparse, io, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from PIL import Image
from browser import launch

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
a = ap.parse_args()
WHO = ["a", "e", "b", "v", "c0", "c1"]
tiles, errors = [], []
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": 600, "height": 700})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(a.base + "vpn/?instant=1&topbar=pin#story=12")
    pg.wait_for_function("window.demo && demo.ready", timeout=60000)
    pg.wait_for_timeout(2500)
    pg.add_style_tag(content="#bubbles,.bubble,#card,#panel,#topbar,.panel,#modes{visibility:hidden!important}")
    for w in WHO:
        pg.evaluate("""w => {
          const s = demo.stage, f = w[0] === 'c' ? s.customers[+w[1]].p : s.people[w], T = demo.THREE;
          f.visible = true; f.updateMatrixWorld(true);
          const c = new T.Box3().setFromObject(f).getCenter(new T.Vector3()), fwd = new T.Vector3(0, 0, 1).applyQuaternion(f.quaternion);
          for (const t of Object.values(s.tags)) t.visible = false;
          demo.rig.jump({ pos: c.clone().addScaledVector(fwd, w === 'v' ? 1.6 : 3.2).add(new T.Vector3(0, w === 'v' ? 2.6 : .5, 0)), target: c });
        }""", w)
        pg.wait_for_timeout(1200)
        tiles.append(Image.open(io.BytesIO(pg.screenshot())))
sheet = Image.new("RGB", (600 * len(tiles), 700))
for i, t in enumerate(tiles): sheet.paste(t, (600 * i, 0))
sheet.save(a.out)
print(a.out, "errors:", errors or "none")
