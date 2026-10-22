#!/usr/bin/env python3
"""Le garde trop pressé (r41): clicks each story button and checks what the room shows after it
(the guard's lamp and gate, Bob's ledger, Eve's recovered prefix, her try count and her chart of
answer times), then runs the sandbox both ways (the hasty == guard, which Eve cracks letter by
letter, and hmac.compare_digest, which she cannot). Shoots each outcome to out/garde-<lang>-<case>.png.
The values are the slides' (« HMAC », « HMAC - La timing attack »); the HMACs are checked apart by
tests/garde_values.mjs. Serve the repo first (python3 -m http.server 8793), or pass a base URL.
Exit 1 on any failure.

    tests/garde_story.py [base] [fr|en]
"""
import sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "garde/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
MAC_E = "b2ef092277667582010f50460c54b1abdce90f00c645db5998776feb817a24c6"
# step, button index, what must hold after it
CASES = [
    (2, 0, {"lamp": "ok", "gate_open": True, "ledger": 1}),                # Alice's badge passes
    (3, 0, {"lamp": "bad", "gate_open": False, "n": 1}),                   # Eve rejected at the first letter
    (5, 0, {"prefix": "b", "tries": 16, "hi": 11}),                        # first letter found: b (index 11)
    (6, 0, {"prefix": "b2", "tries": 16, "hi": 2}),                        # second letter: 2 (index 2)
    (7, 0, {"prefix": MAC_E, "gate_open": True, "ledger": 1}),            # whole code, the forged order gets in
    (8, 0, {"prefix": "", "equal": True}),                                 # compare_digest: sixteen equal bars
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
    state = """() => { const st = demo.stage.st, bars = st.bars.filter(Boolean);
      return { prefix: st.prefix, tries: st.tries, lamp: st.lamp, gate: st.gate,
               ledger: st.ledger.length, n: st.n,
               hi: st.bars.findIndex(x => x && x.hi),
               spread: bars.length ? Math.max(...bars.map(x => x.t)) - Math.min(...bars.map(x => x.t)) : 0,
               nbars: bars.length }; }"""

    def report(name, bad):
        print("ok  " if not bad else "FAIL", name, "" if not bad else f"(got, want): {bad}")
        bad and fails.append(name)
        pg.screenshot(path=f"out/garde-{lang}-{name}.png")

    def open_page(hash_):
        pg.goto("about:blank")
        pg.goto(f"{base}?instant=1&lang={lang}{hash_}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)

    def check(got, want):
        bad = {}
        for key, w in want.items():
            if key == "gate_open":
                if (got["gate"] > .5) != w: bad[key] = (got["gate"], w)
            elif key == "equal":
                # compare_digest: sixteen bars, none singled out (spread is pure noise, under a letter)
                if (got["nbars"] == 16 and got["hi"] == -1 and got["spread"] < .15) != w:
                    bad[key] = (got["nbars"], got["hi"], round(got["spread"], 3))
            else:
                if got.get(key) != w: bad[key] = (got.get(key), w)
        return bad

    for step, k, want in CASES:
        open_page(f"#story={step}")
        pg.wait_for_timeout(1000)
        pg.wait_for_function(idle, timeout=120000)
        step_button(k).click()
        pg.wait_for_timeout(300); pg.wait_for_function(idle, timeout=240000); pg.wait_for_timeout(600)
        report(f"s{step}", check(pg.evaluate(state), want))

    # every step's starting state, so Back / Next / the chips land somewhere: no page error, a card
    for step in range(1, 11):
        open_page(f"#story={step}"); pg.wait_for_timeout(400)
        if not pg.evaluate("document.querySelector('#card h3').innerText"):
            fails.append(f"card {step}"); print("FAIL card", step)

    # the sandbox: the hasty guard is cracked, the constant-time one is not
    def sandbox(guard, want):
        open_page("#sandbox"); pg.wait_for_timeout(500)
        pg.check(f"input[name=sb-guard][value={guard}]")
        busy = "() => !demo.sandbox.state().busy"
        pg.click("#sb-run"); pg.wait_for_timeout(300); pg.wait_for_function(busy, timeout=240000); pg.wait_for_timeout(600)
        report(f"sb-{guard}", check(pg.evaluate(state), want))

    sandbox("eq", {"prefix": MAC_E, "gate_open": True})
    sandbox("cd", {"prefix": "", "equal": True})

    if errors: print("page errors:", errors); fails.append("errors")
    b.close()
print("FAILED:" if fails else "all ok", *fails)
sys.exit(1 if fails else 0)
