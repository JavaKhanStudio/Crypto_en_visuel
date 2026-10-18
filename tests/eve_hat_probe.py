#!/usr/bin/env python3
"""r65: Eve's head close up in every episode that has her (fedora + eye mask, not a pointed hood).
Finds her by the hat's brim, flies the camera to face her and to three-quarters, and shoots
<out>/<ep>-front.png and <ep>-side.png, plus one sheet <out>/eve-sheet.png.

Serve the repo first (python3 -m http.server 8793), then:  python3 tests/eve_hat_probe.py [out/r65]
"""
import sys, os
from playwright.sync_api import sync_playwright
from PIL import Image

EPISODES = [('cadenas', 8), ('diffie-hellman', 7), ('scytale', 7), ('enigma', 10), ('pingouin', 2), ('sel', 2), ('garde', 2)]
out = sys.argv[1] if len(sys.argv) > 1 else 'out/r65'
base = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:8793/'
os.makedirs(out, exist_ok=True)

# every Eve in the scene: the brim is the only 0.74-radius cylinder; its parent's parent is her figure
FIND = """() => { const V = demo.THREE.Vector3, found = [];
  demo.scene.traverse(o => { const p = o.geometry?.parameters;
    if (o.isMesh && p && p.radiusTop === .74 && p.height === .05) found.push(o); });
  return found.map(b => { const fig = b.parent.parent, head = new V(0, 2.6, 0), front = new V(0, 2.6, 1);
    fig.localToWorld(head); fig.localToWorld(front); const s = new V(); fig.getWorldScale(s);
    return { head: head.toArray(), dir: front.sub(head).normalize().toArray(), scale: s.x, visible: fig.visible }; }); }"""
fails, tiles = [], []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    for ep, step in EPISODES:
        pg = b.new_page(viewport={'width': 900, 'height': 700})
        errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.goto(f'{base}{ep}/?instant=1#story={step}', wait_until='load')
        pg.wait_for_function('window.demo && window.demo.ready', timeout=60000)
        pg.wait_for_timeout(1500)
        eves = pg.evaluate(FIND)
        if not eves:
            fails.append(f'{ep}: no Eve with the hat found'); print('FAIL', ep, 'no hat'); continue
        e = max(eves, key=lambda x: x['visible'])
        hx, hy, hz = e['head']; dx, dy, dz = e['dir']; k = e['scale']
        for name, (side, dist) in {'front': (0, 3.2), 'side': (.8, 3.2)}.items():
            # turn the facing direction by `side` radians around the vertical
            import math
            c, s = math.cos(side), math.sin(side)
            rx, rz = dx * c + dz * s, -dx * s + dz * c
            pos = [hx + rx * dist * k, hy + .5 * k, hz + rz * dist * k]
            pg.evaluate(f"""() => {{ const V = demo.THREE.Vector3; demo.bubbles?.clear?.();
              document.querySelectorAll('.panel, header, #card, .bubble').forEach(el => el.style.visibility = 'hidden');
              demo.rig.fly({{ pos: new V({pos[0]}, {pos[1]}, {pos[2]}), target: new V({hx}, {hy}, {hz}) }}, 0.001); }}""")
            pg.wait_for_timeout(900)
            f = f'{out}/{ep}-{name}.png'; pg.screenshot(path=f); tiles.append((ep, name, f))
        print(ep, 'eves', len(eves), 'errors', errors or 'none')
        if errors: fails.append(f'{ep}: {errors}')
        pg.close()
    b.close()
if tiles:
    W, H = 450, 350
    sheet = Image.new('RGB', (W * 2, H * len(tiles) // 2))
    for i, (_, _, f) in enumerate(tiles):
        sheet.paste(Image.open(f).crop((225, 175, 675, 525)), ((i % 2) * W, (i // 2) * H))
    sheet.save(f'{out}/eve-sheet.png')
print('FAIL' if fails else 'ok', fails)
raise SystemExit(1 if fails else 0)
