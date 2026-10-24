#!/usr/bin/env python3
"""r646: the settings card (lib/settings.js, prototype behind ?settings=1) opens from the Éco / HD button, sets each
setting at once and keeps it for the next episode. Shoots the card open at 1440x900 and 390x844, fr and en.
Serve the repo first (python3 -m http.server 8793), then:
    python3 tests/settings_card.py [base] [--out out/r646]"""
import argparse, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tools"))
from playwright.sync_api import sync_playwright
from browser import launch

ap = argparse.ArgumentParser(); ap.add_argument("base", nargs="?", default="http://localhost:8793/")
ap.add_argument("--out", default="out/r646"); ap.add_argument("--page", default="deux-generaux/")
a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
bad = []
def check(ok, what): print(("ok   " if ok else "FAIL ") + what); ok or bad.append(what)

with sync_playwright() as p:
    b = launch(p)
    for w, h in [(1440, 900), (390, 844)]:
        phone = w < 900
        ctx = b.new_context(viewport={"width": w, "height": h}, has_touch=phone, is_mobile=phone)
        pg = ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        url = f"{a.base}{a.page}?settings=1&topbar=pin#story=2"
        pg.goto(url); pg.wait_for_function("window.demo && demo.ready", timeout=60000); pg.wait_for_timeout(1500)
        pg.click("#quality"); pg.wait_for_timeout(400)
        check(pg.is_visible("#settings-pop"), f"{w}: the card opens from the quality button")
        box = pg.eval_on_selector("#settings-pop", "e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }")
        check(box[0] >= 0 and box[2] <= w and box[3] <= h, f"{w}: the card is on screen {[round(x) for x in box]}")
        pg.screenshot(path=f"{a.out}/card-fr-{w}x{h}.png")
        pg.click("#settings-pop [data-key=quality] [data-v=fine]"); pg.click("#settings-pop [data-key=still] [data-v='60']")
        pg.click("#settings-pop [data-key=sound] [data-v='1']"); pg.click("#settings-pop [data-key=lang] [data-v=en]"); pg.wait_for_timeout(400)
        st = pg.evaluate("() => ({ q: localStorage.getItem('dg-quality'), s: localStorage.getItem('dg-still'), l: localStorage.getItem('dg-lang'), "
                         "fps: demo.composer.stillFrames.fps, label: document.getElementById('quality').textContent, sound: document.getElementById('sound').textContent, "
                         "lang: document.documentElement.lang, open: !document.getElementById('settings-pop').hidden, title: document.querySelector('#settings-pop h4').textContent })")
        check(st["q"] == "fine" and st["label"] == "HD+", f"{w}: HD+ set and shown {st['q']} {st['label']}")
        check(st["s"] == "60" and st["fps"] == 60, f"{w}: 60 when still, live {st['fps']}")
        check(st["lang"] == "en" and st["l"] == "en" and "Settings" in st["title"], f"{w}: English, the card in English ({st['title']})")
        check(st["sound"] == "🔊" and st["open"], f"{w}: sound on, card still open")
        pg.screenshot(path=f"{a.out}/card-en-{w}x{h}.png")
        pg.mouse.click(w // 2, h // 2 + 60); pg.wait_for_timeout(300)
        check(not pg.is_visible("#settings-pop"), f"{w}: a tap on the scene closes it")
        pg.goto(f"{a.base}eve-lit-tout/?settings=1&topbar=pin#story=1"); pg.wait_for_function("window.demo && demo.ready", timeout=60000)
        nx = pg.evaluate("() => [document.getElementById('quality').textContent, demo.composer.stillFrames.fps, document.documentElement.lang]")
        check(nx == ["HD+", 60, "en"], f"{w}: the next episode opens with them {nx}")
        pg.goto(f"{a.base}{a.page}?topbar=pin#story=2"); pg.wait_for_function("window.demo && demo.ready", timeout=60000)
        pg.evaluate("() => localStorage.clear()"); q0 = pg.evaluate("() => document.getElementById('quality').textContent")
        pg.click("#quality"); q1 = pg.evaluate("() => [document.getElementById('quality').textContent, !!document.getElementById('settings-pop')]")
        check(q1[1] is False and q1[0] != q0, f"{w}: without ?settings=1 the button still cycles ({q0} -> {q1[0]})")
        check(not errs, f"{w}: no page error {errs}")
        ctx.close()
    b.close()
print("all ok" if not bad else f"FAILED: {bad}")
sys.exit(1 if bad else 0)
