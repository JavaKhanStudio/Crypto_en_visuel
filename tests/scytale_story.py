#!/usr/bin/env python3
"""La scytale (r37): clicks every story button and checks where the strip ends up (lying flat
on which table, or wound on which stick) and what the lines in front of each stick read, then
runs the sandbox with the right reading stick and a wrong one. Shoots each outcome to
out/sc-<case>.png. Serve the repo first (python3 -m http.server 8793), or pass a base URL.
Exit 1 on any failure.

    tests/scytale_story.py [base] [fr|en]
"""
import sys
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "scytale/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
# the lines each stick shows once the strip is on it, from scytale/js/scytale.js's arithmetic
LINES = {
    "fr": {4: ["ATTAQ", "UEZDE", "MAINA", "LAUBE"], 3: ["ALAZABA", "UTAIDQE", "METUNE"], 5: ["AEIB", "UAUQ", "MAAE", "LTDA", "TZNE"],
           "strip": "AUMLTEAATZIUADNBQEAE"},
    "en": {4: ["ATTAC", "KTOMO", "RROWA", "TDAWN"], 3: ["ATROAWA", "KTDOMCN", "RTTAWO"], 5: ["ATOW", "KRAC", "RDAO", "TTMA", "TOWN"],
           "strip": "AKRTTTRDTOOAAMWWCOAN"},
}[lang]
# (step, button index, where the strip is: stick id or table, lines expected on that stick)
CASES = [
    (2, 0, ("stick", "a"), None),
    (3, 0, ("stick", "a"), LINES[4]),
    (4, 0, ("flat", "a"), None),
    (5, 0, ("flat", "a"), None),
    (6, 0, ("flat", "e"), None),
    (7, 0, ("stick", "eT"), LINES[3]),
    (8, 0, ("stick", "eG"), LINES[5]),
    (9, 0, ("flat", "b"), None),
    (10, 0, ("stick", "b"), LINES[4]),
]
SANDBOX = [(4, 4, True), (4, 3, False), (3, 5, False)]
fails = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1200, "height": 720})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    idle = "() => [...document.querySelectorAll('#play, #step-actions button, #sb-run')].every(b => !b.disabled)"

    def step_button(k):                            # k: 0 = the step's go, 1 = its go2
        # go sits in the nav as #play (r62), except on the last step; go2 stays in #step-actions
        if pg.locator("#play").count(): return pg.locator("#play") if k == 0 else pg.locator("#step-actions button").nth(k - 1)
        return pg.locator("#step-actions button").nth(k)
    where = """() => { const s = demo.stage, st = s.st, on = st.strip.on;
      return { where: on ? ['stick', on] : ['flat', st.strip.at], lines: on ? s.linesOn(on).map(l => l.join('')) : null,
               strip: s.lay.strip.join(''), front: on ? s.front(on) : null }; }"""

    def report(name, bad):
        print("ok  " if not bad else "FAIL", name, "" if not bad else f"(got, want): {bad}")
        bad and fails.append(name)
        pg.screenshot(path=f"out/sc-{name}.png")

    def open_page(hash_):
        pg.goto("about:blank")                         # a hash-only change would not reload the page
        pg.goto(f"{base}?instant=1&lang={lang}{hash_}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)

    def settle(timeout=120000):
        pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=timeout)
        pg.wait_for_timeout(800)

    for step, k, at, lines in CASES:
        open_page(f"#story={step}")
        pg.wait_for_timeout(1500)                      # auto steps start once the camera lands
        pg.wait_for_function(idle, timeout=60000)
        step_button(k).click()
        settle()
        got = pg.evaluate(where)
        bad = {}
        if got["where"] != list(at): bad["where"] = (got["where"], at)
        if lines and got["lines"] != lines: bad["lines"] = (got["lines"], lines)
        if got["strip"] != LINES["strip"]: bad["strip"] = (got["strip"], LINES["strip"])
        report(f"s{step}-{k}", bad)
        # the second button turns the stick by one line
        if lines and pg.locator("#play, #step-actions button").count() > 1:
            f0 = got["front"]
            step_button(1).click(); settle()
            f1 = pg.evaluate(where)["front"]
            want = (f0 + 1) % len(lines)
            report(f"s{step}-turn", {} if f1 == want else {"front": (f1, want)})

    for ka, kr, same in SANDBOX:
        open_page("#sandbox")
        pg.locator("#sb-alice button").nth(ka - 2).click()
        pg.locator("#sb-reader button").nth(kr - 2).click()
        pg.wait_for_function(idle, timeout=60000)
        pg.click("#sb-run"); settle(180000)
        got = pg.evaluate("demo.sandbox.result()") or {}
        bad = {} if got.get("same") == same else {"same": (got.get("same"), same)}
        if same and got.get("lines") != LINES[4]: bad["lines"] = (got.get("lines"), LINES[4])
        report(f"sandbox-{ka}-{kr}", bad)
    print("errors:", errors or "none")
    errors and fails.append("page errors")
    b.close()
sys.exit(1 if fails else 0)
