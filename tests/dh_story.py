#!/usr/bin/env python3
"""Les couleurs de Diffie-Hellman (r36): clicks every story button and checks where each paint
pot ends up and what is in it (its recipe: 'JR' = JAUNE + ROUGE = ORANGE, see
diffie-hellman/js/paint.js), then runs the sandbox's three cases (Eve watches; Eve in the
middle; Eve in the middle and Bob signs). Shoots each outcome to out/dh-<case>.png.
Serve the repo first (python3 -m http.server 8793), or pass a base URL. Exit 1 on any failure.

    tests/dh_story.py [base] [fr|en]
"""
import sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "diffie-hellman/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
# (step, button index, {pot id: (table, recipe)}), plus extra checks on the stage state
CASES = [
    (2, 0, {"aJ": ("a", "J"), "eJ": ("e", "J"), "bJ": ("b", "J")}),
    (3, 0, {"aR": ("a", "R"), "bB": ("b", "B")}),
    (4, 0, {"aM": ("a", "JR")}),                                   # JAUNE + ROUGE = ORANGE
    (5, 0, {"bM": ("b", "BJ")}),                                   # JAUNE + BLEU = VERT
    (6, 0, {"aM": ("b", "JR"), "bM": ("a", "BJ"), "eO": ("e", "JR"), "eV": ("e", "BJ")}),
    (7, 0, {"eU1": ("e", "JR"), "eU2": ("e", "JR")}),              # un-mixing gives ORANGE twice
    (7, 1, {"eX": ("e", "BJJR")}),                                 # ORANGE + VERT = OCRE, not MARRON
    (8, 0, {"bM": ("a", "BJR"), "aM": ("b", "BJR")}),              # the same MARRON on both sides
    (10, 0, {"aM": ("e", "JR"), "bM": ("e", "BJ")}),
    (11, 0, {"eK1": ("b", "JN"), "eK2": ("a", "JN")}),
    (12, 0, {"eK2": ("a", "JNR"), "aM": ("e", "JNR"), "eK1": ("b", "BJN"), "bM": ("e", "BJN")}),
    (13, 0, {}, {"chest": ["b", 0, "BJN", 1]}),
    (14, 0, {"eK2": ("a", "JN"), "bM": ("e", "BJ")}),
    (14, 1, {"bM": ("a", "BJ"), "eV": ("e", "BJ")}),
]
SANDBOX = [
    ("listen", False, {"a": "BJR", "b": "BJR"}),
    ("middle", False, {"a": "JNR", "b": "BJN"}),
    ("middle", True, {"refused": True}),
]
fails = []
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": 1200, "height": 720})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    idle = "() => [...document.querySelectorAll('#play, #step-actions button, #sb-run')].every(b => !b.disabled)"

    def step_button(k):                            # k: 0 = the step's go, 1 = its go2
        # go sits in the nav as #play (r62), except on the last step; go2 stays in #step-actions
        if pg.locator("#play").count(): return pg.locator("#play") if k == 0 else pg.locator("#step-actions button").nth(k - 1)
        return pg.locator("#step-actions button").nth(k)

    def report(name, bad):
        print("ok  " if not bad else "FAIL", name, "" if not bad else f"(got, want): {bad}")
        bad and fails.append(name)
        pg.screenshot(path=f"out/dh-{name}.png")

    def open_page(hash_):
        pg.goto("about:blank")                         # a hash-only change would not reload the page
        pg.goto(f"{base}?instant=1&lang={lang}{hash_}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)

    for step, k, pots, *extra in CASES:
        open_page(f"#story={step}")
        pg.wait_for_timeout(1500)                      # auto steps start once the camera lands
        pg.wait_for_function(idle, timeout=60000)
        step_button(k).click()
        pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=120000)
        pg.wait_for_timeout(800)
        st = pg.evaluate("demo.stage.st")
        bad = {}
        for pid, (at, recipe) in pots.items():
            got = st["pots"].get(pid)
            if not got or got[0] != at or got[2] != recipe:
                bad[pid] = (got and got[:3], (at, recipe))
        for key, want in (extra[0] if extra else {}).items():
            if st.get(key) != want: bad[key] = (st.get(key), want)
        report(f"s{step}-{k}", bad)

    for eve, sign, want in SANDBOX:
        open_page("#sandbox")
        if eve == "middle": pg.check("#sb-middle")
        if sign: pg.check("#sb-sign")
        pg.wait_for_function(idle, timeout=60000)
        pg.click("#sb-run"); pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=120000); pg.wait_for_timeout(800)
        got = pg.evaluate("demo.sandbox.result()") or {}
        report(f"sandbox-{eve}{'-signed' if sign else ''}", {k: (got.get(k), v) for k, v in want.items() if got.get(k) != v})
    print("errors:", errors or "none")
    errors and fails.append("page errors")
    b.close()
sys.exit(1 if fails else 0)
