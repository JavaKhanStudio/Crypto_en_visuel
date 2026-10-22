#!/usr/bin/env python3
"""r322: lib/doors.js draws every episode's last-step doors exactly as its own copy did. For each
episode, at 1440 and 390 px, in fr and en, the last step's doors are read on a BASE (the live site by
default: the copies) and on localhost:8793 (the lib): each door's href, picture, classes, its size
and place inside #step-actions, and the computed style of the door, its picture, name, line and
the grid. Any difference is printed. Serve the repo root on 8793 first.
    python3 tests/doors_lib.py [--base URL] [ep ...]"""
import json, sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

EPS = "aes-interieur cadenas deux-generaux diffie-hellman enigma eve-lit-tout garde pingouin scytale sel".split()
argv = sys.argv[1:]
BASE = "https://javakhanstudio.github.io/Crypto_en_visuel/"
if "--base" in argv:
    i = argv.index("--base"); BASE = argv[i + 1]; del argv[i:i + 2]
eps = argv or EPS
LOCAL = "http://localhost:8793/"
PROPS = ["display", "grid-template-columns", "gap", "padding", "border-radius", "border", "background-color",
         "color", "font-size", "line-height", "margin-bottom", "aspect-ratio", "object-fit", "opacity", "position"]
READ = """async props => {
  const box = document.getElementById('step-actions'), o = box.getBoundingClientRect();
  const st = el => { if (!el) return null; const c = getComputedStyle(el), r = el.getBoundingClientRect();
    return { ...Object.fromEntries(props.map(p => [p, c.getPropertyValue(p)])),
             rect: [r.x - o.x, r.y - o.y, r.width, r.height].map(Math.round) }; };
  const out = { cls: box.className.replace(' doors-row', ''), grid: st(box), doors: [...box.querySelectorAll('.door')].map(d => ({
    cls: d.className, href: d.getAttribute('href'), src: d.querySelector('img').src,
    clip: d.querySelector('video')?.getAttribute('src') ?? null, door: st(d), pic: st(d.querySelector('.pic')),
    img: st(d.querySelector('img')), name: st(d.querySelector('b')), line: st(d.querySelector('b + span')),
    text: d.textContent })) };
  // r431: a picture is its bytes, not its path (the home door moved to ../assets/doors/home.jpg)
  for (const d of out.doors) d.src = [...new Uint8Array(await crypto.subtle.digest('SHA-256',
    await (await fetch(d.src)).arrayBuffer()))].slice(0, 6).map(b => b.toString(16).padStart(2, '0')).join('');
  return out;
}"""

def read(br, url, size):
    phone = size[0] < 720
    pg = br.new_page(viewport={"width": size[0], "height": size[1]}, has_touch=phone, is_mobile=phone)
    pg.goto(url); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(300)
    got = pg.evaluate(READ, PROPS); pg.close()
    return got

def diff(a, b, path=""):
    if isinstance(a, dict) and isinstance(b, dict):
        return [d for k in sorted(set(a) | set(b)) for d in diff(a.get(k), b.get(k), f"{path}.{k}")]
    if isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
        return [d for i, (x, y) in enumerate(zip(a, b)) for d in diff(x, y, f"{path}[{i}]")]
    return [] if a == b else [f"{path}: {json.dumps(a)} -> {json.dumps(b)}"]

bad = 0
with sync_playwright() as p:
    br = launch(p)
    for ep in eps:
        for size, lang in [((1440, 860), "fr"), ((1440, 860), "en"), ((390, 844), "fr")]:
            q = f"{ep}/?instant=1&lang={lang}#story=99"
            before, after = read(br, BASE + q, size), read(br, LOCAL + q, size)
            ds = diff(before, after) if len(before["doors"]) == 4 else ["no four doors on the base"]
            print(("ok  " if not ds else "BAD ") + f"{ep} {size[0]}px {lang}: {len(after['doors'])} doors"
                  + "".join("\n      " + d for d in ds[:12]))
            bad += bool(ds)
    br.close()
print("all ok" if not bad else f"{bad} failed"); raise SystemExit(bad > 0)
