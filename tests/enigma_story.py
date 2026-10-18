#!/usr/bin/env python3
"""Enigma, une touche (r38): clicks every story button and checks what the machines show after
it (rotor positions, the lamp lit, the rows of the slide's table and how far each is filled, what
each notepad holds), then types OUI in the sandbox from AAA and types the cipher back. Shoots
each outcome to out/en-<case>.png. The values are the slide's (« Enigma - À la main »); the
arithmetic is checked apart by tests/enigma_values.mjs. Serve the repo first
(python3 -m http.server 8793), or pass a base URL. Exit 1 on any failure.

    tests/enigma_story.py [base] [fr|en]
"""
import sys
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "enigma/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
O1, O2 = "O AAA DKNKBJT", "O AAB GRUCYVI"
OUI = [O1, "U AAB SZJXQQV", "I AAC SZJXQQG"]
TVG = ["T AAA JBKNKDO", "V AAB QQXJZSU", "G AAC QQXJZSI"]
# (step, button, expected: a dict of the fields below that must match)
CASES = [
    (2, 0, {"apart": 1}),
    (3, 0, {"apart": 1, "pos": "AAA"}),
    (4, 0, {"pos": "AAB", "down": "O", "rows": [(O1, 0)]}),
    (5, 0, {"pos": "AAB", "rows": [(O1, 4)], "filled": "DKN"}),
    (6, 0, {"pos": "AAB", "rows": [(O1, 8)], "lit": "T", "filled": "DKNKBJT"}),
    (7, 0, {"pos": "AAC", "rows": [(O1, 8), (O2, 8)], "lit": "I"}),
    (8, 0, {"pos": "AAC", "lit": "I", "windows": "AAC"}),
    (9, 0, {"pos": "AAD", "rows": [(r, 8) for r in OUI], "pads": {"a": "TVG"}, "msg": "OUI>TVG"}),
    (10, 0, {"pads": {"a": "TVG", "e": "TVG"}}),
    (11, 0, {"m": "b", "pos": "AAD", "rows": [(r, 8) for r in TVG], "lit": "I", "pads": {"a": "TVG", "e": "TVG", "b": "OUI"}, "msg": "TVG>OUI"}),
]
fails = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    idle = "() => [...document.querySelectorAll('#step-actions button')].every(b => !b.disabled)"
    state = """m => { const s = demo.stage, st = s.st, rows = st.rows.map(r => [`${r.rec.key} ${r.rec.from} ${r.rec.path.join('')}`, r.n]);
      const last = st.rows.at(-1);
      return { apart: st.apart[m] ?? 0, pos: st.pos[m], down: st.down[m] || null, lit: st.lit[m] || null, rows,
               filled: last ? last.rec.path.slice(0, Math.max(0, last.n - 1)).join('') : '',
               windows: ['I', 'II', 'III'].map(id => s.windowLetter(m, id)).join(''),
               pads: Object.fromEntries(Object.entries(st.pads).filter(([k, v]) => v)),
               msg: st.msg ? st.msg.plain + '>' + st.msg.cipher : null,
               card: document.querySelector('#card').innerText }; }"""

    def report(name, bad):
        print("ok  " if not bad else "FAIL", name, "" if not bad else f"(got, want): {bad}")
        bad and fails.append(name)
        pg.screenshot(path=f"out/en-{name}.png")

    def open_page(hash_):
        pg.goto("about:blank")                         # a hash-only change would not reload the page
        pg.goto(f"{base}?instant=1&lang={lang}{hash_}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)

    def settle(timeout=180000):
        pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=timeout)
        pg.wait_for_timeout(800)

    for step, k, want in CASES:
        open_page(f"#story={step}")
        pg.wait_for_timeout(1500)                      # auto steps start once the camera lands
        pg.wait_for_function(idle, timeout=120000)
        pg.locator("#step-actions button").nth(k).click()
        settle()
        m = want.get("m", "a")
        got = pg.evaluate(state, m)
        bad = {}
        for key, w in want.items():
            if key == "m": continue
            g = got[key]
            if key == "rows": w = [list(r) for r in w]
            if g != w: bad[key] = (g, w)
        # the card shows the last row's letters as filled
        if "filled" in want and want["filled"] and want["filled"][-1] not in got["card"]: bad["card"] = got["card"]
        report(f"s{step}-{k}", bad)

    # the sandbox: OUI from AAA lights TVG; back to the start, TVG lights OUI
    open_page("#sandbox")
    pg.wait_for_timeout(1500)
    for c in "OUI":
        pg.locator("#sb-keys button", has_text=c).first.click(); pg.wait_for_timeout(200)
        pg.wait_for_function("() => !demo.sandbox.state().busy", timeout=120000)
    s1 = pg.evaluate("demo.sandbox.state()")
    report("sb-type", {} if (s1["typed"], s1["lit"]) == ("OUI", "TVG") else {"tape": ((s1["typed"], s1["lit"]), ("OUI", "TVG"))})
    pg.locator("#sb-replay").click(); pg.wait_for_timeout(300)
    pg.wait_for_function("() => !demo.sandbox.state().busy", timeout=120000)
    s2 = pg.evaluate("demo.sandbox.state()")
    report("sb-back", {} if (s2["typed"], s2["lit"], s2["back"]) == ("TVG", "OUI", True) else {"tape": ((s2["typed"], s2["lit"], s2["back"]), ("TVG", "OUI", True))})
    if errors:
        print("FAIL page errors:", *errors[:5], sep="\n  "); fails.append("errors")
    b.close()
print("all ok" if not fails else f"{len(fails)} failed: {fails}")
sys.exit(1 if fails else 0)
