#!/usr/bin/env python3
"""On a phone, the episode's corner card never covers the step panel nor climbs under the top bar (r83);
it is folded to its title line, and a tap on the title opens it (r84).

Serve the repo first (python3 -m http.server 8793). For every episode with a #card, walks every story
step and the sandbox at 390x844 (and 1440x900, where the card must stay at the top right), checks
the card's box against the open panel's and the top bar's, and writes a contact sheet of the phone
steps to out/card-dock-<episode>.png."""
import sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
from PIL import Image

BASE = "http://localhost:8793/"
EPISODES = sys.argv[1:] or ["enigma", "enigma-reglage", "enigma-casse", "garde", "pingouin", "scytale", "sel", "eve-lit-tout", "octet-change", "cle-vallee", "paquet-complet", "encore-des-tours", "kasiski", "vpn", "aes-interieur"]
MEASURE = """() => {
  const r = id => { const e = document.getElementById(id); return e && !e.classList.contains('hidden') && e.offsetHeight ? e.getBoundingClientRect() : null; };
  const card = r('card'), panel = r('story') || r('sandbox');
  const top = Math.max(...['topbar', 'modes', 'lang', 'topbar-tab'].map(id => document.getElementById(id)?.getBoundingClientRect().bottom ?? 0));
  return { card: card && [card.top, card.bottom, card.right], panel: panel && panel.top, top, n: demo.story.steps?.length ?? null };
}"""
bad = []
with sync_playwright() as p:
    b = launch(p)
    for ep in EPISODES:
        for w, h in [(390, 844), (1440, 900)]:
            # r406: a phone has a finger, so its top bar starts tucked behind the tab (lib/topbar.js); the
            # desktop is measured once the bar has slid away from the still mouse. ?topbar=pin is the bar shown.
            pg = b.new_context(viewport={"width": w, "height": h}, has_touch=w < 900, is_mobile=w < 900).new_page()
            errors = []
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.goto(f"{BASE}{ep}/?instant=1#story=1", wait_until="load")
            pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
            if w >= 900: pg.wait_for_timeout(2400)   # the bar away (IDLE 1.8 s + its 0.45 s slide)
            n = pg.evaluate("document.getElementById('step-count').textContent.match(/\\d+\\s*\\/\\s*(\\d+)/)[1]")
            shots = []
            for i in range(int(n)):
                pg.evaluate(f"demo.story.go({i})"); pg.wait_for_timeout(900)
                m = pg.evaluate(MEASURE)
                where = f"{ep} {w}px step {i + 1}"
                if m["card"]:
                    ct, cb, cr = m["card"]
                    if w < 900 and (cb > m["panel"] + 1 or ct < m["top"] - 1):
                        bad.append(f"{where}: card {ct:.0f}-{cb:.0f}, panel top {m['panel']:.0f}, top bar {m['top']:.0f}")
                    if w >= 900 and ct > 200:
                        bad.append(f"{where}: card left the top right (top {ct:.0f})")
                if w < 900:
                    path = f"out/card-dock-{ep}-{i + 1}.png"; pg.screenshot(path=path); shots.append(path)
            if w < 900 and m["card"]:   # folded on a phone (r84); a tap on its title opens it, still docked
                if m["card"][1] - m["card"][0] > 60: bad.append(f"{ep} {w}px: the card is not folded ({m['card'][1] - m['card'][0]:.0f}px tall)")
                pg.click("#card h3"); pg.wait_for_timeout(400); o = pg.evaluate(MEASURE)
                if o["card"][1] - o["card"][0] < 60 or o["card"][1] > o["panel"] + 1 or o["card"][0] < o["top"] - 1:
                    bad.append(f"{ep} {w}px: the tapped card {o['card'][0]:.0f}-{o['card'][1]:.0f} is not open above the panel")
                path = f"out/card-dock-{ep}-open.png"; pg.screenshot(path=path); shots.append(path)
                pg.click("#card h3"); pg.wait_for_timeout(200)
            if pg.evaluate("typeof demo.setMode === 'function'"):
                pg.evaluate("demo.setMode('sandbox')"); pg.wait_for_timeout(1500)
                m = pg.evaluate(MEASURE)
                if w < 900 and m["card"] and (m["card"][1] > m["panel"] + 1 or m["card"][0] < m["top"] - 1):
                    bad.append(f"{ep} {w}px sandbox: card {m['card'][0]:.0f}-{m['card'][1]:.0f}, panel top {m['panel']:.0f}")
                if w < 900:
                    path = f"out/card-dock-{ep}-sb.png"; pg.screenshot(path=path); shots.append(path)
            else: print(f"skip {ep} {w}px sandbox: story only, no modes (1.7, r505)")
            if w < 900:
                ims = [Image.open(s).resize((195, 422)) for s in shots]
                sheet = Image.new("RGB", (195 * 7, 422 * ((len(ims) + 6) // 7)), "black")
                for k, im in enumerate(ims): sheet.paste(im, (195 * (k % 7), 422 * (k // 7)))
                sheet.save(f"out/card-dock-{ep}.png")
            if errors: bad.append(f"{ep} {w}px page errors: {errors[:2]}")
            pg.close()
    b.close()
print("\n".join(bad) or "all ok")
sys.exit(1 if bad else 0)
