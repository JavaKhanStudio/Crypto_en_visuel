#!/usr/bin/env python3
"""Enigma, le vrai réglage (r113, episode 5.2): clicks every story button and checks what the
machines show after it (the setting, rotor positions, the letters in the windows, the lamp lit, the
rows of the card's table and how far each is filled, the count, what each notepad holds), then in the
sandbox types OUI with the setting of the day and types the cipher back, refuses bad cables, and
types AAAAA on the bare machine (BDZGO). Shoots each outcome to out/er-<case>.png. The arithmetic is
checked apart by tests/enigma-reglage_values.mjs. Serve the repo first (python3 -m http.server 8793),
or pass a base URL. Exit 1 on any failure.

    tests/enigma-reglage_story.py [base] [fr|en]
"""
import sys
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "enigma-reglage/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
CABLES = "BS CZ DN ER FI GU HO KW LM QY"
O_BARE, O_CAB, F_BACK, O_RING = "O AAA O DKNKBJT T", "O AAA H QQXJZSI F", "F AAA I SZJXQQH O", "O AAA H PCMOMOZ C"
MSG = ["O ADU H JTPIVSB S", "U ADV G ISSFDHL M", "I AEW F HRRBXKW K"]
BOB = ["S ADU B SVIPTJH O", "M ADV L HDFSSIG U", "K AEW W KXBRRHF I"]
full = lambda rows: [(r, 8) for r in rows]
# (step, button, expected: a dict of the fields below that must match)
CASES = [
    (2, 0, {"apart": 1, "pos": "AAB", "lit": "T", "rows": full([O_BARE]), "plugs": ""}),
    (3, 0, {"plugs": CABLES, "rows": []}),
    (4, 0, {"pos": "AAB", "down": "O", "rows": [(O_CAB, 4)], "filled": "QQX"}),
    (5, 0, {"pos": "AAB", "lit": "F", "rows": full([O_CAB]), "filled": "QQXJZSI"}),
    (6, 0, {"pos": "AAB", "lit": "O", "rows": full([O_CAB, F_BACK])}),
    (7, 0, {"rings": "AAB", "windows": "AAA", "pos": "AAA"}),
    (8, 0, {"rings": "AAB", "pos": "AAB", "lit": "C", "rows": full([O_CAB, O_RING])}),
    (9, 0, {"pos": "ADV", "windows": "ADV", "rows": full(MSG[:1]), "pads": {"a": "S"}}),
    (10, 0, {"pos": "AEW", "windows": "AEW", "rows": full(MSG[:2]), "pads": {"a": "SM"}}),
    (11, 0, {"pos": "BFX", "windows": "BFX", "rows": full(MSG), "pads": {"a": "SMK"}, "msg": "OUI>SMK"}),
    (12, 0, {"pads": {"a": "SMK", "e": "SMK"}}),
    (13, 0, {"m": "b", "pos": "BFX", "rows": full(BOB), "lit": "I", "pads": {"a": "SMK", "e": "SMK", "b": "OUI"}, "msg": "SMK>OUI"}),
    (14, 0, {"tally": "orders 3", "count": "5 × 4 × 3 = 60"}),
    (15, 0, {"tally": "cables 10", "cardHas": "150"}),
    (16, 0, {"tally": "total 4", "cardHas": "158"}),
]
fails = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    idle = "() => [...document.querySelectorAll('#play, #step-actions button')].every(b => !b.disabled)"

    def step_button(k):                            # k: 0 = the step's go, 1 = its go2
        if pg.locator("#play").count(): return pg.locator("#play") if k == 0 else pg.locator("#step-actions button").nth(k - 1)
        return pg.locator("#step-actions button").nth(k)
    state = """m => { const s = demo.stage, st = s.st, rows = st.rows.map(r => [`${r.rec.key} ${r.rec.from} ${r.rec.in} ${r.rec.path.join('')} ${r.rec.lamp}`, r.n]);
      const last = st.rows.at(-1);
      return { apart: st.apart[m] ?? 0, pos: st.pos[m], down: st.down[m] || null, lit: st.lit[m] || null, rows,
               plugs: st.set[m].plugs, rings: st.set[m].rings,
               filled: last ? last.rec.path.slice(0, Math.max(0, last.n - 1)).join('') : '',
               windows: ['L', 'M', 'R'].map(id => s.windowLetter(m, id)).join(''),
               pads: Object.fromEntries(Object.entries(st.pads).filter(([k, v]) => v)),
               msg: st.msg ? st.msg.plain + '>' + st.msg.cipher : null,
               tally: st.tally ? st.tally.kind + ' ' + st.tally.n : null, count: st.count ? st.count.sum : null,
               card: document.querySelector('#card').innerText }; }"""

    def report(name, bad):
        print("ok  " if not bad else "FAIL", name, "" if not bad else f"(got, want): {bad}")
        bad and fails.append(name)
        pg.screenshot(path=f"out/er-{name}.png")

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
        step_button(k).click()
        settle()
        m = want.get("m", "a")
        got = pg.evaluate(state, m)
        bad = {}
        for key, w in want.items():
            if key == "m": continue
            if key == "cardHas":
                if w not in got["card"]: bad[key] = (got["card"][:80], w)
                continue
            g = got[key]
            if key == "rows": w = [list(r) for r in w]
            if g != w: bad[key] = (g, w)
        # the card shows the last row's letters as filled
        if "filled" in want and want["filled"] and want["filled"][-1] not in got["card"]: bad["card"] = got["card"]
        report(f"s{step}-{k}", bad)

    # the sandbox opens on the setting of the day: OUI from ADU lights SMK; back to the start, SMK lights OUI
    open_page("#sandbox")
    pg.wait_for_timeout(1500)
    def type_keys(text):
        for c in text:
            pg.locator("#sb-keys button", has_text=c).first.click(); pg.wait_for_timeout(200)
            pg.wait_for_function("() => !demo.sandbox.state().busy", timeout=120000)
    type_keys("OUI")
    s1 = pg.evaluate("demo.sandbox.state()")
    report("sb-type", {} if (s1["typed"], s1["lit"], s1["start"]) == ("OUI", "SMK", "ADU") else {"tape": ((s1["typed"], s1["lit"], s1["start"]), ("OUI", "SMK", "ADU"))})
    pg.locator("#sb-replay").click(); pg.wait_for_timeout(300)
    pg.wait_for_function("() => !demo.sandbox.state().busy", timeout=120000)
    s2 = pg.evaluate("demo.sandbox.state()")
    report("sb-back", {} if (s2["typed"], s2["lit"], s2["back"]) == ("SMK", "OUI", True) else {"tape": ((s2["typed"], s2["lit"], s2["back"]), ("SMK", "OUI", True))})
    # a letter on two cables is refused, and said so; the cables stay as they were
    pg.fill("#sb-cables", "AB AC"); pg.locator("#sb-cables").dispatch_event("change"); pg.wait_for_timeout(300)
    s3 = pg.evaluate("demo.sandbox.state()")
    shown = pg.locator("#sb-cables-bad").is_visible()
    report("sb-bad-cables", {} if (s3["bad"], shown, s3["set"]["plugs"]) == (True, True, CABLES) else {"bad": ((s3["bad"], shown, s3["set"]["plugs"]), (True, True, CABLES))})
    # the bare machine (no cable, rings AAA, start AAA): AAAAA lights BDZGO, the classic check
    pg.locator("#sb-bare").click(); pg.wait_for_timeout(300)
    type_keys("AAAAA")
    s4 = pg.evaluate("demo.sandbox.state()")
    report("sb-bare", {} if (s4["lit"], s4["set"]["plugs"]) == ("BDZGO", "") else {"bare": ((s4["lit"], s4["set"]["plugs"]), ("BDZGO", ""))})
    # rotor II picked for the left slot swaps with the middle one, which held it: the three stay different
    pg.locator("#sb-rotors select").first.select_option("II"); pg.wait_for_timeout(300)
    s5 = pg.evaluate("demo.sandbox.state()")
    report("sb-swap", {} if s5["set"]["rotors"] == ["II", "I", "III"] else {"rotors": (s5["set"]["rotors"], ["II", "I", "III"])})
    if errors:
        print("FAIL page errors:", *errors[:5], sep="\n  "); fails.append("errors")
    b.close()
print("all ok" if not fails else f"{len(fails)} failed: {fails}")
sys.exit(1 if fails else 0)
