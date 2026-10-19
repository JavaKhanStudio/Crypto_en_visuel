#!/usr/bin/env python3
"""La roue et le caillou (r120): clicks every story action and checks what it left on the road and
the lane against kasiski/js/kasiski.js: the marks printed, the gaps measured, the red ones, the bars'
winner, the tiles stamped with the cipher, the repeats lit, the arcs, the key found. Then runs the
sandbox: the wheel at two turns, the cipher with LEMON and another key. Shoots each outcome to
out/ka-<case>.png. Serve the repo first (python3 -m http.server 8793), or pass a base URL.
Exit 1 on any failure.

    tests/kasiski_story.py [base] [fr|en]
"""
import sys
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "kasiski/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
fails = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1200, "height": 720})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    idle = "() => [...document.querySelectorAll('#play, #step-actions button, #sb-roll, #sb-count')].every(b => !b.disabled)"
    # what the stage holds now, and the truth computed by the arithmetic module
    probe = """async () => { const K = await import('./js/kasiski.js'), s = demo.stage, st = s.st;
      const printed = s.marks.children.filter(o => o.isGroup && o.children.length === 2).length;
      const tiles = s.tiles.slice(0, st.stamped).map(m => m.material.map.image ? 1 : 0).length;
      return { car: st.car, printed, tape: st.tape, red: st.red ? s.gapList.filter(g => g.d % st.road.C).length : 0,
        bars: st.bars, grown: st.grown, win: st.bars ? s.barData().win : null, counts: st.bars ? s.barData().cs.map(c => c.n) : null,
        stamped: st.stamped, kw: st.kw, hot: st.hot, arcs: s.arcsG.children.filter(o => o.isMesh).length,
        key: st.key, lit: (st.lit || []).filter(Boolean).length, card: document.getElementById('card').innerText,
        cipherOk: s.cipher() === K.CIPHER, gaps: s.gapList.map(g => g.d) }; }"""

    def report(name, bad):
        print("ok  " if not bad else "FAIL", name, "" if not bad else f"(got, want): {bad}")
        bad and fails.append(name)
        pg.screenshot(path=f"out/ka-{name}-{lang}.png")

    def open_page(hash_):
        pg.goto("about:blank")                         # a hash-only change would not reload the page
        pg.goto(f"{base}?instant=1&lang={lang}{hash_}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)

    def settle(timeout=180000):
        pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=timeout)
        pg.wait_for_timeout(800)

    def check(got, want):
        return {k: (got[k], w) for k, w in want.items() if got[k] != w}

    # step: what the stage must hold once its action has played
    CASES = {
        2: {"car": 5, "printed": 2},
        3: {"car": 86, "printed": 15},
        4: {"tape": 14, "gaps": [400, 600, 400, 1000, 370, 230, 400, 1000, 600, 400, 760, 240, 600, 400]},
        5: {"red": 4},
        6: {"grown": True, "win": 200, "counts": [3, 10, 2, 3, 0, 5]},
        7: {"stamped": 16, "kw": 15, "cipherOk": True},
        8: {"stamped": 96, "kw": 95, "hot": True},
        9: {"arcs": 11, "hot": True},
        10: {"grown": True, "win": 5, "counts": [36, 24, 9, 44, 20, 6, 7]},
        11: {"key": "LEMON", "lit": 5},
    }
    for step, want in CASES.items():
        open_page(f"#story={step}")
        pg.wait_for_timeout(1500)                      # auto steps start once the camera lands
        pg.wait_for_function(idle, timeout=180000)
        pg.locator("#play").click()
        settle()
        got = pg.evaluate(probe)
        report(f"s{step}", check(got, want))

    # the card says what the stage says: the winner in its row
    open_page("#story=6"); pg.locator("#play").click(); settle()
    card = pg.evaluate(probe)["card"]
    report("card-s6", {} if ("2 m" in card and "10" in card) else {"card": (card[:120], "2 m … 10")})

    # the sandbox: the wheel (turn, gravel) -> the step found; the cipher (key) -> length and key found
    SB = [("wheel", (200, 0), {"L": 200, "C": 200}), ("wheel", (250, 2), {"C": 250}),
          ("cipher", "LEMON", {"L": 5, "found": "LEMON"}), ("cipher", "CHAT", {"L": 4, "found": "CHAT"})]
    for kind, arg, want in SB:
        open_page("#sandbox")
        if kind == "wheel":
            C, g = arg
            pg.locator("#sb-C button").nth([150, 200, 250, 300].index(C)).click()
            pg.locator("#sb-gravel button").nth([0, 2, 4, 6].index(g)).click()
            pg.wait_for_function(idle, timeout=60000)
            pg.click("#sb-roll")
        else:
            pg.fill("#sb-key", arg)
            pg.click("#sb-count")
        settle(240000)
        got = pg.evaluate("demo.sandbox.result()") or {}
        report(f"sandbox-{kind}-{arg if isinstance(arg, str) else '-'.join(map(str, arg))}", {k: (got.get(k), w) for k, w in want.items() if got.get(k) != w})
    print("errors:", errors or "none")
    errors and fails.append("page errors")
    b.close()
sys.exit(1 if fails else 0)
