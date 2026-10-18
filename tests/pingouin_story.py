#!/usr/bin/env python3
"""Le pingouin et la chaîne (r39): clicks every story button and checks what the hall shows after
it (each crate's label and first bytes, where the crates stand, the card's table, the screens, Bob's
verdict), then runs the sandbox (CBC + Eve's flip, then the same with an HMAC, then ECB). Shoots
each outcome to out/pg-<lang>-<case>.png. The values are the slides' (cryptographie r57), but for the
header block, VIREMENT URGENT! instead of the school's name (r78); the
arithmetic is checked apart by tests/pingouin_values.mjs. Serve the repo first
(python3 -m http.server 8793), or pass a base URL. Exit 1 on any failure.

    tests/pingouin_story.py [base] [fr|en]
"""
import sys
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "pingouin/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
# crates: label -> first 4 bytes of what it shows (hex), in the order of the belt
E = {"C1": "acb56795", "C2": "0c5df969", "C3": "acb56795", "C4": "308422c2"}
CBC = {"IV": "7efa5a79", "C1": "01a1da22", "C2": "b41496c5", "C3": "17b93f60", "C4": "f8e2ce0c"}
CBC2 = {"IV₂": "1a2f1c3c", "C1": "2002b8b5", "C4": "e861d4ab"}
CASES = [
    (2, 0, {"crates": {"P1": "56495245", "P2": "6d6f6e74", "P3": "56495245", "P4": "416c6963"}, "rows": 4}),
    (3, 0, {"crates": E, "rows": 4, "same": ["P1", "P1", "C1", "C1"] and None}),
    (4, 0, {"crates": E, "marked": ["C1", "C3"]}),
    (5, 0, {"wall": {"plain": 1, "ecb": 1, "cbc": 0}, "distinct": True}),
    (6, 0, {"crates": CBC, "rows": 5, "cells": ["28 b3 08 3c b1 96 ..", "e2 5d c4 80 0a b4 .."]}),
    (7, 0, {"wall": {"plain": 1, "ecb": 1, "cbc": 1}}),
    (8, 0, {"crates": CBC2}),
    (9, 0, {"crates": {"C1": "01a1da22"}, "byte8": "f6", "x": {"C1": 0}, "cells": ["ff → f6", "⊕ 09"]}),
    (10, 0, {"crates": {"P3": "56495245"}, "read": "montant=90100EUR", "bad": ["P1"], "cells": ["montant=90100EUR"]}),
    (11, 0, {"verdict": "bad", "cells": ["c1 58 3b 57 e2 c9 ..", "40 b7 d9 f6 81 68 .."]}),
]
fails = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    idle = "() => [...document.querySelectorAll('#play, #step-actions button')].every(b => !b.disabled)"

    def step_button(k):                            # k: 0 = the step's go, 1 = its go2
        # go sits in the nav as #play (r62), except on the last step; go2 stays in #step-actions
        if pg.locator("#play").count(): return pg.locator("#play") if k == 0 else pg.locator("#step-actions button").nth(k - 1)
        return pg.locator("#step-actions button").nth(k)
    state = """() => { const s = demo.stage, st = s.st, hx = b => [...b.slice(0, 4)].map(x => x.toString(16).padStart(2, '0')).join('');
      const crates = Object.fromEntries(st.crates.filter(c => c.id !== 'T').map(c => [c.label, hx(c.bytes)]));
      const p1 = st.crates.find(c => c.id === 'P1');
      return { crates, marked: st.crates.filter(c => c.mark === 'same').map(c => c.label),
               bad: st.crates.filter(c => c.mark === 'bad').map(c => c.label), rows: st.table.rows.length,
               cells: st.table.rows.flat(), wall: st.wall, verdict: st.verdict,
               byte8: p1 ? p1.bytes[8].toString(16) : null, x: Object.fromEntries(st.crates.map(c => [c.label, Math.round(c.x)])),
               read: st.read ? new TextDecoder().decode(st.read[1]) : null,
               card: document.querySelector('#card').innerText }; }"""

    def report(name, bad):
        print("ok  " if not bad else "FAIL", name, "" if not bad else f"(got, want): {bad}")
        bad and fails.append(name)
        pg.screenshot(path=f"out/pg-{lang}-{name}.png")

    def open_page(hash_):
        pg.goto("about:blank")                         # a hash-only change would not reload the page
        pg.goto(f"{base}?instant=1&lang={lang}{hash_}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)

    for step, k, want in CASES:
        open_page(f"#story={step}")
        pg.wait_for_timeout(1500)                      # auto steps start once the camera lands
        pg.wait_for_function(idle, timeout=120000)
        step_button(k).click()
        pg.wait_for_timeout(300); pg.wait_for_function(idle, timeout=240000); pg.wait_for_timeout(800)
        got = pg.evaluate(state)
        bad = {}
        for key, w in want.items():
            if w is None: continue
            if key == "crates":
                for lab, h in w.items():
                    if got["crates"].get(lab) != h: bad[lab] = (got["crates"].get(lab), h)
            elif key == "cells":
                for c in w:
                    if c not in got["cells"]: bad["cell " + c] = (got["cells"], c)
            elif key == "x":
                for lab, x in w.items():
                    if got["x"].get(lab) != x: bad["x " + lab] = (got["x"].get(lab), x)
            elif key == "distinct":
                d = pg.evaluate("import('./js/penguin.js').then(m => m.penguin().distinct)")
                if not (d["ecb"] == d["plain"] and d["cbc"] > d["plain"] * 10): bad["distinct"] = d
            elif got[key] != w: bad[key] = (got[key], w)
        report(f"s{step}", bad)

    # the sandbox: CBC, Eve flips bit 0 of byte 8 of C1 -> P1 unreadable, P2 changed ('0' -> '1'), P3 P4 intact
    def sandbox(name, mode, hmac, want):
        open_page("#sandbox"); pg.wait_for_timeout(1200)
        pg.check(f"input[name=sb-mode][value={mode}]")
        if hmac: pg.check("#sb-hmac")
        pg.select_option("#sb-block", "1"); pg.select_option("#sb-byte", "8"); pg.select_option("#sb-bit", "0")
        pg.click("#sb-encrypt"); pg.wait_for_timeout(300); pg.wait_for_function("() => !demo.sandbox.state().busy", timeout=120000)
        pg.click("#sb-send"); pg.wait_for_timeout(300); pg.wait_for_function("() => !demo.sandbox.state().busy", timeout=240000)
        pg.wait_for_timeout(600)
        s = pg.evaluate("(() => { const r = demo.sandbox.state().result; return r.refused ? 'refused' : r.read.map(b => new TextDecoder().decode(b).replace(/[^ -~]/g, '?')).join('|'); })()")
        ok = want(s)
        report(name, {} if ok else {"read": s})
    sandbox("sb-cbc", "cbc", False, lambda s: s.split("|")[1] == "montant=10100EUR" and s.split("|")[2] == "VIREMENT URGENT!" and s.split("|")[0] != "VIREMENT URGENT!")
    sandbox("sb-hmac", "cbc", True, lambda s: s == "refused")
    sandbox("sb-ecb", "ecb", False, lambda s: s.split("|")[1:3] == ["montant=00100EUR", "VIREMENT URGENT!"] and s.split("|")[0] != "VIREMENT URGENT!")
    if errors:
        print("FAIL page errors:", *errors[:5], sep="\n  "); fails.append("errors")
    b.close()
print("all ok" if not fails else f"{len(fails)} failed: {fails}")
sys.exit(1 if fails else 0)
