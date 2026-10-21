#!/usr/bin/env python3
"""AES de l'intérieur (r335): walks every story step and reads what the room's cubes show at the end
of its beat (demo.room.m.read()): the block AES is given (P1 xor IV), each step of round 1, the state
after round 14 equal to episode 1.2's C1, the changed letter outlining 16 cubes; the step texts quote
the real bytes; then the sandbox: one byte changed, the 14 rounds, the outlines and the count; back to
Alice's block. Shoots every step, desktop and phone, to out/aes-<lang>-<step>[-phone].png.
The bytes themselves are checked apart by tests/aes_interieur_values.mjs. Serve the repo first
(python3 -m http.server 8793), or pass a base URL. Exit 1 on any failure.

    tests/aes_interieur_story.py [base] [fr|en]
"""
import sys
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "aes-interieur/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
# 1.2's C1 for this language (tests/eve_story.py, tests/eve_values.mjs), and what AES is given
C1 = {"fr": "fb 0b 3c 02 cf 76 8c c2 f8 13 f7 a1 66 b3 50 0a", "en": "58 af b7 c8 66 9e 50 44 b8 7e fe 5f 8d 5e 43 92"}[lang]
X1 = {"fr": "bc a6 7d a7 d8 da fe b9 b5 6f 87 84 6a 5d 95 d3", "en": "bc a6 7d a7 ca c4 9b d8 a5 0a 8e 84 74 5d 95 c6"}[lang]
P1 = {"fr": "ATTAQUE DEMAIN A", "en": "ATTACK AT DAWN T"}[lang]
STEPS = ["intro", "block", "state", "key", "ark0", "sub1", "shift1", "mix1", "ark1", "fast", "last", "spread", "end"]
fails = []


def report(name, bad):
    print("ok  " if not bad else "FAIL", name, "" if not bad else bad)
    bad and fails.append(name)


hexs = lambda b: " ".join(f"{x:02x}" for x in b)

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    errors = []

    def page(hash_, size=(1440, 860)):
        pg = b.new_page(viewport={"width": size[0], "height": size[1]})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{base}?instant=1&lang={lang}{hash_}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        return pg

    read = "demo.room.m.read()"
    pg = page("#story=1")
    n = pg.evaluate("demo.story.constructor.name && document.getElementById('step-count').textContent")
    report(f"13 steps ({n})", [] if n.endswith("13") else n)
    seen = {}
    for i, sid in enumerate(STEPS):
        pg.evaluate(f"demo.story.go({i})"); pg.wait_for_timeout(500)
        seen[sid] = {"room": pg.evaluate(read), "text": pg.inner_text("#step-text").replace("\xa0", " "), "card": pg.inner_text("#card").replace("\xa0", " "),
                     "beat": pg.evaluate("demo.room.id"), "ops": pg.evaluate("demo.room.m.plan[demo.room.id]?.ops.map(o => o.op + o.round + ':' + [...o.to].map(x => x.toString(16).padStart(2, '0')).join(' '))")}
    ops = pg.evaluate("demo.room.data.st.tr.ops.map(o => [o.op, o.round, [...o.from], [...o.to], o.key ? [...o.key] : null])")
    report("every step is its own beat", [s for s in STEPS if seen[s]["beat"] != s])
    report("intro: the 16 cubes are P1 xor IV", [] if hexs(seen["intro"]["room"]["bytes"]) == X1 else seen["intro"]["room"]["bytes"])
    report("block: the text names P1 and its first byte", [] if P1 in seen["block"]["text"] and X1[:2] in seen["block"]["text"] else seen["block"]["text"][:200])
    report("state: the cubes are still P1 xor IV", [] if hexs(seen["state"]["room"]["bytes"]) == X1 else seen["state"]["room"]["bytes"])
    after = {s: hexs(seen[s]["room"]["bytes"]) for s in ["ark0", "sub1", "shift1", "mix1", "ark1"]}
    report("ark0 .. ark1: the cubes end on each step's state", [s for k, s in enumerate(after) if after[s] != hexs(ops[k][3])])
    o = ops
    report("ark0 text: x xor k = y, the real bytes", [] if f"{o[0][2][0]:02x} ⊕ {o[0][4][0]:02x} = {o[0][3][0]:02x}" in seen["ark0"]["text"] else seen["ark0"]["text"][:300])
    report("sub1 text: S(a) = b, the real bytes", [] if f"S({o[1][2][0]:02x}) = {o[1][3][0]:02x}" in seen["sub1"]["text"] else seen["sub1"]["text"][:300])
    report("shift1: same 16 values, other places", [] if sorted(o[2][2]) == sorted(o[2][3]) and o[2][2] != o[2][3] else "")
    report("mix1 text: the first column before and after", [] if hexs(o[3][2][:4]) in seen["mix1"]["text"] and hexs(o[3][3][:4]) in seen["mix1"]["text"] else seen["mix1"]["text"][-300:])
    report("fast: rounds 2 to 13, 4 steps each", [] if len(seen["fast"]["ops"]) == 48 and seen["fast"]["ops"][0].startswith("sub2") and seen["fast"]["ops"][-1].startswith("ark13") else seen["fast"]["ops"][:2])
    report("last: no MixColumns in round 14", [] if [x.split(":")[0] for x in seen["last"]["ops"]] == ["sub14", "shift14", "ark14"] else seen["last"]["ops"])
    report("last: the cubes are 1.2's C1", [] if hexs(seen["last"]["room"]["bytes"]) == C1 else hexs(seen["last"]["room"]["bytes"]))
    report("last: the card shows C1 and says identical", [] if C1 in seen["last"]["card"] and "✓" in seen["last"]["card"] else seen["last"]["card"])
    report("spread: 16 cubes outlined at the end", [] if seen["spread"]["room"]["red"] == 16 else seen["spread"]["room"])
    pg.evaluate("demo.story.go(11)"); pg.wait_for_timeout(300)
    counts = pg.evaluate("[...document.querySelectorAll('#card .spread span')].map(s => s.textContent)")
    report("spread card: 1 before, then 1 4 16 after rounds 0-2", [] if counts[:4] == [{"fr": "avant", "en": "before"}[lang] + "1", "01", "14", "216"] else counts[:4])
    # a beat mid-way: round 1's SubBytes at half time shows the S-box lookup over the cube going through
    pg.evaluate("demo.story.go(5)"); pg.evaluate("demo.room.instant = false; demo.room.speed = 0; demo.room.time = 3.6"); pg.wait_for_timeout(300)
    words = pg.evaluate(read)["words"]
    report("sub1 mid-way: an S(..) = .. label", [] if any(w.startswith("S(") for w in words) else words)
    pg.close()

    # every step, desktop and phone; then the sandbox and the quiz
    for size, tag in [((1440, 860), ""), ((390, 844), "-phone")]:
        pg = page("#story=1", size)
        for i in range(len(STEPS)):
            pg.evaluate(f"demo.story.go({i})"); pg.wait_for_timeout(1100)
            pg.screenshot(path=f"out/aes-{lang}-{i + 1}{tag}.png")
        pg.close()

    pg = page("#sandbox")
    pg.wait_for_timeout(500)
    st = pg.evaluate("document.getElementById('sb-stats').textContent")
    report("sandbox opens on Alice's block, nothing changed", [] if hexs(pg.evaluate(read)["bytes"]) == X1 and pg.evaluate(read)["red"] == 0 else (st, pg.evaluate(read)))
    pg.fill("#sb-block input:nth-child(6)", "00")   # byte 5: row 1, column 1
    pg.wait_for_timeout(300)
    report("sandbox: the changed byte is outlined before the run", [] if pg.evaluate(read)["red"] == 1 else pg.evaluate(read))
    pg.click("#sb-run"); pg.wait_for_timeout(500)
    r = pg.evaluate(read); st = pg.evaluate("document.getElementById('sb-stats').textContent")
    report("sandbox: one byte changed, the output differs in (nearly) all 16", [] if r["red"] >= 14 and "1" in st else (r, st))
    pg.screenshot(path=f"out/aes-{lang}-sandbox.png")
    pg.fill("#sb-key input:nth-child(1)", "zz"); pg.wait_for_timeout(200)
    report("sandbox: a bad byte stops the run", [] if pg.evaluate("document.getElementById('sb-run').disabled") else "run enabled")
    pg.click("#sb-reset"); pg.wait_for_timeout(300)
    report("sandbox: back to Alice's block", [] if pg.evaluate(read)["red"] == 0 and not pg.evaluate("document.querySelectorAll('.bytes-in input.changed, .bytes-in input.bad').length") else pg.evaluate(read))
    pg.close()
    pg = b.new_page(viewport={"width": 390, "height": 844}); pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{base}?instant=1&lang={lang}#sandbox", wait_until="load"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.fill("#sb-block input:nth-child(1)", "00"); pg.click("#sb-run"); pg.wait_for_timeout(800)
    pg.screenshot(path=f"out/aes-{lang}-sandbox-phone.png"); pg.close()

    pg = page("#quiz"); pg.wait_for_timeout(800); pg.screenshot(path=f"out/aes-{lang}-quiz.png"); pg.close()
    report("no page errors", errors)
    b.close()
sys.exit(1 if fails else 0)
