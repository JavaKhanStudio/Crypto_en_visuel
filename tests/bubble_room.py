#!/usr/bin/env python3
"""No speech bubble covers another bubble, the corner card, the open panel or the top controls (r84).

Serve the repo first (python3 -m http.server 8793). Walks every story step of every episode at
390x844 and 1440x900 (?instant=1), measures the shown bubbles against each other and against the
page's walls (lib/bubbles.js WALLS), and writes a phone contact sheet to out/bubble-room-<episode>.png.
    tests/bubble_room.py [episode ...]"""
import sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
from PIL import Image

BASE = "http://localhost:8793/"
EPISODES = sys.argv[1:] or ["deux-generaux", "cadenas", "diffie-hellman", "scytale", "enigma", "enigma-reglage", "enigma-casse", "pingouin", "sel", "garde", "eve-lit-tout", "octet-change", "cle-vallee", "paquet-complet", "encore-des-tours", "kasiski", "vpn", "aes-interieur"]
MEASURE = """() => {
  const box = (el, name) => { const r = el.getBoundingClientRect(); return { name, x: r.left, y: r.top, w: r.width, h: r.height }; };
  const walls = ['topbar', 'modes', 'lang', 'sound', 'card', 'story', 'sandbox', 'quiz', 'credit', 'ladder'].map(id => document.getElementById(id))
    .filter(el => el && !el.classList.contains('hidden') && el.offsetHeight).map(el => box(el, '#' + el.id));
  const bubbles = [...document.querySelectorAll('#bubbles .bubble.show')].filter(el => getComputedStyle(el).visibility !== 'hidden')
    .map(el => box(el, 'bubble ' + el.querySelector('.who').textContent));
  return { walls, bubbles };
}"""
over = lambda a, b: min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"]) > 1 and min(a["y"] + a["h"], b["y"] + b["h"]) - max(a["y"], b["y"]) > 1
bad = []
with sync_playwright() as p:
    br = launch(p)
    for ep in EPISODES:
        for w, h in [(390, 844), (1440, 900)]:
            pg = br.new_page(viewport={"width": w, "height": h})
            errors = []
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.goto(f"{BASE}{ep}/?instant=1#story=1", wait_until="load")
            pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
            pg.add_style_tag(content=".bubble { transition: opacity .35s !important; }")   # measure where a bubble goes, not its glide
            n = int(pg.evaluate("document.getElementById('step-count').textContent.match(/(\\d+)\\D*$/)[1]"))
            shots = []
            for i in range(n):
                pg.evaluate(f"demo.story.go({i})"); pg.wait_for_timeout(1300)
                m = pg.evaluate(MEASURE)
                bs = m["bubbles"]
                for k, a in enumerate(bs):
                    for b in bs[k + 1:] + m["walls"]:
                        if over(a, b):
                            bad.append(f"{ep} {w}px step {i + 1}: {a['name']} covers {b['name']}")
                if w < 900:
                    path = f"out/bubble-room-{ep}-{i + 1}.png"; pg.screenshot(path=path); shots.append(path)
            if w < 900:
                ims = [Image.open(s).resize((195, 422)) for s in shots]
                sheet = Image.new("RGB", (195 * 7, 422 * ((len(ims) + 6) // 7)), "black")
                for k, im in enumerate(ims): sheet.paste(im, (195 * (k % 7), 422 * (k // 7)))
                sheet.save(f"out/bubble-room-{ep}.png")
            if errors: bad.append(f"{ep} {w}px page errors: {errors[:2]}")
            pg.close()
    br.close()
print("\n".join(bad) or "all ok")
sys.exit(1 if bad else 0)
