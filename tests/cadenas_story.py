#!/usr/bin/env python3
"""Le cadenas de Bob (r35): clicks every story button and checks where the chest ends up and
whether it is open, then runs the sandbox's cases (Eve without and with the stolen key).
Shoots each outcome to out/cadenas-<case>.png. Serve the repo first (python3 -m http.server
8793), or pass a base URL. Exit 1 on any failure."""
import sys
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "cadenas/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
# (step, button index, expected stage state after it)
CASES = [
    (2, 0, {"box": "b", "locked": True, "lid": 0}),       # locked box reaches Bob, he cannot open it
    (2, 1, {"box": "e", "locked": False, "lid": 1}),      # key sent along: Eve opens it
    (3, 0, {"made": 9}),
    (4, 0, {"dist": True}),
    (5, 0, {"lock": "bob", "locked": True}),
    (6, 0, {"locked": True, "lid": 0}),                   # Alice cannot reopen
    (7, 0, {"box": "e", "locked": True}),
    (8, 0, {"box": "e", "locked": True, "lid": 0}),       # Eve's padlock opens nothing
    (9, 0, {"box": "b", "locked": False, "lid": 1}),      # only Bob opens it
]
fails = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1200, "height": 720})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    idle = "() => [...document.querySelectorAll('#step-actions button, #sandbox button')].every(b => !b.disabled)"

    def check(name, want):
        st = pg.evaluate("demo.stage.st")
        bad = {k: (st.get(k), v) for k, v in want.items() if st.get(k) != v}
        print("ok  " if not bad else "FAIL", name, "" if not bad else f"(got, want): {bad}")
        bad and fails.append(name)
        pg.screenshot(path=f"out/cadenas-{name}.png")

    for step, k, want in CASES:
        pg.goto("about:blank")                         # a hash-only change would not reload the page
        pg.goto(f"{base}?instant=1&lang={lang}#story={step}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.wait_for_timeout(1500)                      # auto steps start once the camera lands
        pg.wait_for_function(idle, timeout=60000)
        pg.locator("#step-actions button").nth(k).click()
        pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=90000)
        pg.wait_for_timeout(800)
        check(f"s{step}-{k}", want)

    for stolen, who, want in [(False, "e", {"box": "e", "lid": 0}), (True, "e", {"box": "e", "lid": 1})]:
        pg.goto("about:blank")
        pg.goto(f"{base}?instant=1&lang={lang}#sandbox", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        if stolen: pg.check("#sb-stolen")
        for btn in ["#sb-lock", "#sb-send", f"#sb-try-{who}"]:
            pg.wait_for_function(idle, timeout=60000); pg.click(btn); pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=60000); pg.wait_for_timeout(800)
        check(f"sandbox-{'stolen' if stolen else 'eve'}", want)
    print("errors:", errors or "none")
    errors and fails.append("page errors")
    b.close()
sys.exit(1 if fails else 0)
