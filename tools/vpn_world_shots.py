#!/usr/bin/env python3
"""Le tunnel's map from a few fixed points of view, as one contact sheet (r382): the provider's hall and
its poles, the VPN's hall, the café and its Wi-Fi box. Serve the repo first (python3 -m http.server 8793).
    tools/vpn_world_shots.py OUT.png [base]"""
import sys
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
from PIL import Image, ImageDraw

OUT = sys.argv[1]
BASE = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8793/"
VIEWS = [   # name, camera, target
    ("provider, from the street", (-6, 9, 12), (-6, 1, -11)),
    ("provider, from above", (-6, 26, -4), (-6, 0, -11.5)),
    ("VPN, from the south", (-14, 12, -20), (-14, 1, -35)),
    ("VPN, from above", (-14, 24, -28), (-14, 0, -35.5)),
    ("provider's plate", (-8, 3.5, 2), (-7, 1.5, -5.5)),
    ("VPN's plate", (-15, 3.5, -24), (-14, 1.5, -30)),
    ("café, from the terrace", (-35, 5, 10), (-36, 3, -6)),
    ("café, from the side", (-24, 9, 4), (-36, 3.5, -7)),
    ("the café's box, close", (-33, 6.5, 0), (-36, 4.5, -5.1)),
    ("the poles by the provider", (-22, 6, 4), (-10, 2, -8)),
]
W, H = 720, 430
with sync_playwright() as p:
    br = launch(p)
    pg = br.new_page(viewport={"width": W, "height": H})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{BASE}vpn/?instant=1#story=1", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.add_style_tag(content="body > *:not(canvas) { display: none !important; }")
    frames = []
    for name, c, t in VIEWS:
        pg.evaluate("""([c, t]) => { const r = demo.rig; r.flight = null; r.follow = null; r.setOrbit?.(0);
          demo.camera.position.set(...c); r.controls.target.set(...t); demo.camera.lookAt(...t); }""", [c, t])
        pg.evaluate("() => demo.scene.traverse(o => { if (o.isSprite) o.visible = false; })")
        pg.wait_for_timeout(1200)
        path = f"{OUT}.{len(frames)}.png"; pg.screenshot(path=path); frames.append((name, path))
    br.close()
sheet = Image.new("RGB", (W * 2, H * 5), "white")
for i, (name, path) in enumerate(frames):
    im = Image.open(path); ImageDraw.Draw(im).text((8, 6), name, fill="yellow"); sheet.paste(im, ((i % 2) * W, (i // 2) * H))
sheet.save(OUT)
print(OUT, "errors:", errors or "none")
