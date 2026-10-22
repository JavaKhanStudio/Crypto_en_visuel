#!/usr/bin/env python3
"""Le sel (r40): clicks every story button and checks what the room shows after it (the rows of
the site's database, Eve's copy and what her book found, the counter, the stopwatch, the corner
card), then runs the sandbox three ways (MD5 without salt, with the slide's salts, bcrypt for real
in the worker). Shoots each outcome to out/sel-<lang>-<case>.png. The values are the slides'
(cryptographie « Mots de passe - Le sel »); the hashes are checked apart by tests/sel_values.mjs.
Serve the repo first (python3 -m http.server 8793), or pass a base URL. Exit 1 on any failure.

    tests/sel_story.py [base] [fr|en]
"""
import hashlib, sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "sel/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
U, S = "5f4dcc3b", {"alice": "cffbee8f", "bob": "648c5237"}
# bcrypt cells: the cost, the start of the salt, the end of the string (sel/js/data.js bshort)
BA, BB = "$2b$12$dKaaqY…2lfRkm", "$2b$12$WNGj4Y…ZRVLtq"
# step, button, what must hold after it
CASES = [
    (2, 0, {"base": [("alice", "", U)], "cells": ["password", U]}),
    (3, 0, {"base": [("alice", "", U), ("bob", "", U)], "same": 2}),
    (4, 0, {"copy": [("alice", U, None), ("bob", U, None)]}),
    (5, 0, {"copy": [("alice", U, "password"), ("bob", U, "password")], "book": 0}),
    (6, 0, {"base": [("alice", "x7k2m", S["alice"])], "cells": ["password+x7k2m", S["alice"]]}),
    (7, 0, {"base": [("alice", "x7k2m", S["alice"]), ("bob", "r3n8q", S["bob"])], "same": 0, "cells": ["password+r3n8q", S["bob"]]}),
    (8, 0, {"copy": [("alice", S["alice"], ""), ("bob", S["bob"], "")], "miss": True}),
    (9, 0, {"copy": [("alice", S["alice"], "password"), ("bob", S["bob"], "")], "counter": "md5", "cells": ["password+x7k2m", "="]}),
    (10, 0, {"base": [("alice", "dKaaqY…", BA), ("bob", "WNGj4Y…", BB)], "watch": .24, "machine": "bcrypt"}),
    (11, 0, {"copy": [("alice", BA, "password"), ("bob", BB, None)], "counter": "bcrypt"}),
]
fails = []
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    idle = "() => [...document.querySelectorAll('#play, #step-actions button')].every(b => !b.disabled)"

    def step_button(k):                            # k: 0 = the step's go, 1 = its go2
        # go sits in the nav as #play (r62), except on the last step; go2 stays in #step-actions
        if pg.locator("#play").count(): return pg.locator("#play") if k == 0 else pg.locator("#step-actions button").nth(k - 1)
        return pg.locator("#step-actions button").nth(k)
    state = """() => { const st = demo.stage.st;
      return { base: st.base.rows.map(r => [r.u, r.salt, r.hash]), same: st.base.rows.filter(r => r.mark === 'same').length,
               copy: st.copy ? st.copy.rows.map(r => [r.u, r.hash, r.found ?? null]) : null, book: st.book.hi, miss: st.book.miss,
               counter: st.counter, watch: st.watch, machine: st.machine, cells: st.table.rows.flat(),
               card: document.querySelector('#card').innerText }; }"""

    def report(name, bad):
        print("ok  " if not bad else "FAIL", name, "" if not bad else f"(got, want): {bad}")
        bad and fails.append(name)
        pg.screenshot(path=f"out/sel-{lang}-{name}.png")

    def open_page(hash_):
        pg.goto("about:blank")                         # a hash-only change would not reload the page
        pg.goto(f"{base}?instant=1&lang={lang}{hash_}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)

    def check(got, want):
        bad = {}
        for key, w in want.items():
            g = got[key]
            if key == "base" and [tuple(r) for r in g] != w: bad[key] = (g, w)
            elif key == "copy" and (g is None or [tuple(r) for r in g] != w): bad[key] = (g, w)
            elif key == "cells":
                miss = [c for c in w if c not in g]
                if miss: bad[key] = (g, miss)
            elif key not in ("base", "copy", "cells") and g != w: bad[key] = (g, w)
        return bad

    for step, k, want in CASES:
        open_page(f"#story={step}")
        pg.wait_for_timeout(1200)
        pg.wait_for_function(idle, timeout=120000)
        step_button(k).click()
        pg.wait_for_timeout(300); pg.wait_for_function(idle, timeout=240000); pg.wait_for_timeout(800)
        report(f"s{step}", check(pg.evaluate(state), want))

    # every step's starting state, so Back / Next / the chips land somewhere: no page error, a card
    for step in range(1, 14):
        open_page(f"#story={step}"); pg.wait_for_timeout(400)
        t = pg.evaluate("document.querySelector('#card h3').innerText")
        if not t: fails.append(f"card {step}"); print("FAIL card", step)

    # the sandbox
    def sandbox(mode, pa, pb, want):
        open_page("#sandbox"); pg.wait_for_timeout(500)
        pg.fill("#sb-pa", pa); pg.fill("#sb-pb", pb)
        pg.check(f"input[name=sb-store][value={mode}]")
        busy = "() => !demo.sandbox.state().busy"
        pg.click("#sb-signup"); pg.wait_for_timeout(300); pg.wait_for_function(busy, timeout=240000)
        pg.click("#sb-steal"); pg.wait_for_timeout(300); pg.wait_for_function(busy, timeout=240000); pg.wait_for_timeout(600)
        got = pg.evaluate(state); got["status"] = pg.inner_text("#sb-status")
        bad = check(got, {k: v for k, v in want.items() if k != "status"})
        for w in want.get("status", []):
            if w not in got["status"]: bad.setdefault("status", (got["status"], []))[1].append(w)
        report(f"sb-{mode}", bad)

    sandbox("md5", "password", "password", {"copy": [("alice", U, "password"), ("bob", U, "password")]})
    sandbox("salt", "password", "Tr0ub4dor", {"copy": [("alice", S["alice"], ""), ("bob", hashlib.md5(b"Tr0ub4dorr3n8q").hexdigest()[:8], "")],
        "status": ["62", "9"]})
    sandbox("bcrypt", "password", "zebra42", {"counter": "bcrypt", "status": ["36", "7"]})
    # measuring on this machine: a real bcrypt and a real MD5 rate
    open_page("#sandbox"); pg.wait_for_timeout(500)
    pg.click("#sb-measure"); pg.wait_for_timeout(300); pg.wait_for_function("() => !demo.sandbox.state().busy", timeout=240000)
    m = pg.evaluate("demo.sandbox.state().measured")
    report("sb-measure", {} if "bcrypt" in m and " s" in m else {"measured": m})

    if errors: print("page errors:", errors); fails.append("errors")
    b.close()
print("FAILED:" if fails else "all ok", *fails)
sys.exit(1 if fails else 0)
