#!/usr/bin/env python3
"""Enigma, la casse (r114, episode 5.3): clicks every story button and checks what the stage shows
after it (Alice's first key, the crib's places on the slate, the menu and the guess followed round
its loop, the bombe's stops and the clerk's check, what Eve's machine reads, the notepads), then in
the sandbox slides the crib, refuses a crib longer than the cipher, runs the bombe on place 7 and
tries its stop on Eve's machine. Shoots each outcome to out/ec-<case>.png. The arithmetic is
checked apart by tests/enigma-casse_values.mjs. Serve the repo first (python3 -m http.server 8793),
or pass a base URL. Exit 1 on any failure.

    tests/enigma-casse_story.py [base] [fr|en]
"""
import sys
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "enigma-casse/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
CIPHER, PLAIN, READ1 = "EBOWTASBRMHCEFBMMXEFFPA", "HEUTEXWETTERBERICHTXEIS", "HEGTEXWETTERBERICHTXEIS"
LEFT = "5 7 8 10 11"
STOPS = "5:DDO:U 7:IXW:R 10:AKT:J 10:CRK:K 11:BEC:Z 11:EFM:J 11:OFS:K 11:UEA:U 11:WHR:E"
CASES = [
    (2, 0, {"pads": {"a": CIPHER, "e": CIPHER}}),
    (3, 0, {"pos": "IXY", "lit": "E", "rows": [["H IXX O YBRBRBR E", 8]]}),
    (6, 0, {"marks": "1:out", "k": 0}),
    (7, 0, {"marks": "1:out 2:out 3:out 4:out 5:ok 6:out 7:ok 8:ok 9:out 10:ok 11:ok", "k": 10, "cardHas": LEFT.replace(" ", ", ")}),
    (8, 0, {"links": 13, "k": 6}),
    (9, 0, {"trace": "EBRTERSETR"}),
    (11, 0, {"stops": STOPS}),
    (12, 0, {"holds": "7:IXW:BS CZ ER FI HO KW LM"}),
    (13, 0, {"m": "e", "pads": {"a": CIPHER, "e": READ1}, "msg": CIPHER + ">" + READ1, "pos": "IXT"}),
    (14, 0, {"m": "e", "pads": {"a": CIPHER, "e": PLAIN}, "msg": CIPHER + ">" + PLAIN, "plugs": "BS CZ ER FI GU HO KW LM"}),
]
fails = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    idle = "() => [...document.querySelectorAll('#play, #step-actions button')].every(b => !b.disabled)"

    def step_button(k):
        if pg.locator("#play").count(): return pg.locator("#play") if k == 0 else pg.locator("#step-actions button").nth(k - 1)
        return pg.locator("#step-actions button").nth(k)
    state = """m => { const s = demo.stage, st = s.st, sl = st.slate, mn = st.menu, r = st.run;
      return { pos: st.pos[m], lit: st.lit[m] || null, plugs: st.set[m].plugs,
               rows: st.rows.map(r => [`${r.rec.key} ${r.rec.from} ${r.rec.in} ${r.rec.path.join('')} ${r.rec.lamp}`, r.n]),
               pads: Object.fromEntries(Object.entries(st.pads).filter(([k, v]) => v)),
               msg: st.msg ? st.msg.plain + '>' + st.msg.cipher : null,
               k: sl ? sl.k : null, marks: sl ? Object.entries(sl.marks || {}).map(([k, v]) => `${+k + 1}:${v}`).join(' ') : null,
               links: mn ? (mn.n ?? mn.links.length) : null,
               trace: mn && mn.trace ? mn.trace.letters.join('') + mn.trace.vals.join('') : null,
               stops: r ? r.stops.map(s => `${s.k + 1}:${s.pos}:${s.guess}`).join(' ') : null,
               holds: r && r.checks ? r.checks.filter(c => !c.bad.length).map(c => `${c.k + 1}:${c.pos}:${c.pairs.filter(p => p[0] !== p[1]).join(' ')}`).join(' | ') : null,
               card: document.querySelector('#card').innerText }; }"""

    def report(name, bad):
        print("ok  " if not bad else "FAIL", name, "" if not bad else f"(got, want): {bad}")
        bad and fails.append(name)
        pg.screenshot(path=f"out/ec-{name}.png")

    def open_page(hash_):
        pg.goto("about:blank")
        pg.goto(f"{base}?instant=1&lang={lang}{hash_}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)

    def settle(timeout=180000):
        pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=timeout)
        pg.wait_for_timeout(800)

    def compare(got, want):
        bad = {}
        for key, w in want.items():
            if key == "m": continue
            if key == "cardHas":
                if w not in got["card"]: bad[key] = (got["card"][:120], w)
                continue
            if got[key] != w: bad[key] = (got[key], w)
        return bad

    for step, k, want in CASES:
        open_page(f"#story={step}")
        pg.wait_for_timeout(1500)
        pg.wait_for_function(idle, timeout=120000)
        step_button(k).click()
        settle()
        report(f"s{step}-{k}", compare(pg.evaluate(state, want.get("m", "a")), want))

    # the sandbox: Eve's message and crib; ▶ moves the crib to place 2, ruled out; all the way marks the 11 places
    open_page("#sandbox")
    pg.wait_for_timeout(1500)
    busy = "() => !demo.sandbox.state().busy"
    sb = lambda: pg.evaluate("demo.sandbox.state()")
    pg.locator("#sb-right").click(); pg.wait_for_timeout(300); pg.wait_for_function(busy, timeout=60000)
    s1 = sb()
    report("sb-step", {} if (s1["k"], s1["marks"].get("1")) == (1, "out") else {"k": ((s1["k"], s1["marks"]), (1, "out"))})
    pg.locator("#sb-slide").click(); pg.wait_for_timeout(300); pg.wait_for_function(busy, timeout=60000)
    s2 = sb()
    left = " ".join(str(int(k) + 1) for k, v in sorted(s2["marks"].items(), key=lambda kv: int(kv[0])) if v == "ok")
    report("sb-slide", {} if (s2["k"], left) == (10, LEFT) else {"slide": ((s2["k"], left), (10, LEFT))})
    # r149: the place counter between the arrows stays on one line ('place 11 / 11', its longest)
    lines = pg.evaluate("() => { const r = document.createRange(); r.selectNodeContents(document.querySelector('#sb-place')); return new Set([...r.getClientRects()].map(c => Math.round(c.top))).size; }")
    report("sb-place-line", {} if lines == 1 else {"lines": (lines, 1)})
    # the bombe on place 7: one stop holds, at IXW; on Eve's machine it reads HEGTE…
    pg.evaluate(f"demo.sandbox.configure('{CIPHER}', 'WETTERBERICHT', 6)"); pg.wait_for_timeout(300)
    pg.locator("#sb-bombe").click(); pg.wait_for_timeout(300); pg.wait_for_function(busy, timeout=120000)
    s3 = sb()
    holds = [c["pos"] for c in s3["result"]["holds"]] if s3["result"] else None
    report("sb-bombe", {} if holds == ["IXW"] else {"holds": (holds, ["IXW"])})
    pg.locator("#sb-try").click(); pg.wait_for_timeout(300); pg.wait_for_function(busy, timeout=120000)
    s4 = sb()
    report("sb-try", {} if s4["result"]["read"] == READ1 else {"read": (s4["result"]["read"], READ1)})
    # a crib longer than the cipher is refused, and said so
    pg.fill("#sb-crib", "WETTERBERICHTWETTERBERICHT"); pg.locator("#sb-crib").dispatch_event("change"); pg.wait_for_timeout(300)
    s5 = sb()
    report("sb-bad", {} if (s5["bad"], pg.locator("#sb-bad").is_visible(), s5["crib"]) == (True, True, "WETTERBERICHT") else {"bad": ((s5["bad"], s5["crib"]), (True, "WETTERBERICHT"))})
    if errors:
        print("FAIL page errors:", *errors[:5], sep="\n  "); fails.append("errors")
    b.close()
print("all ok" if not fails else f"{len(fails)} failed: {fails}")
sys.exit(1 if fails else 0)
