#!/usr/bin/env python3
"""À toi de jouer (r505): plays every choice of every step of episode 1.7 and checks the choice engine
(lib/choices.js) and what Eve and Bob say aloud.

On each step with choices: Suivant is shut until the right choice is found; each wrong choice plays,
says Eve's line and Bob's, ends with the three shown again and the played ones red; the right one ends
with « continue » (not on the last step) and « try another », and « try another » brings the three back
with the right one green and the wrong ones still red; then Continue (or Suivant) opens the next step.
The lines checked hold the real bytes: Eve's ECB blocks are yesterday's, her CBC blocks are not, and
the changed byte gives 9 where Alice wrote 6; the keys in the clear let Eve reseal a 9; RSA-OAEP gives
Bob the keys back; decrypting first, Bob finds a bad padding; Eve's forgery under her own keys passes
the HMAC check; on the replay step, Alice's packet is read first, then Eve's copy. The last step has
its doors out (the saga's start, the home, episode 2 in gold). Also runs at 390x844 (the phone) once. Serve the repo
first (python3 -m http.server 8793), or pass a base URL. Exit 1 on any failure.

    tests/jouer_story.py [base] [fr|en]
"""
import sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "a-toi-de-jouer/"
langs = sys.argv[2:] or ["fr", "en"]
ORDER = {"fr": "ATTAQUE A 6H DEMAIN", "en": "ATTACK AT 6AM TOMORROW"}
NINE = {"fr": "ATTAQUE A 9H DEMAIN", "en": "ATTACK AT 9AM TOMORROW"}
REJECT = {"fr": "paquet rejeté", "en": "packet rejected"}
FORGED = {"fr": "ATTAQUE A MINUIT", "en": "ATTACK AT MIDNIGHT"}
PADDING = {"fr": "padding est faux", "en": "padding is wrong"}
LAST = 8   # the end step, its doors, no choices
# step (1-based hash) -> [(k, right, what Eve's line holds, what Bob's line holds)]
STEPS = {
    2: [("clear", False, "ORDER", "ORDER"), ("ecb", False, "ECB", "ORDER"), ("cbc", True, "CBC", "ORDER")],
    3: [("none", False, "", "NINE"), ("hmac", True, "", "REJECT"), ("sum", False, "SUM", "NINE")],
    4: [("clear", False, "KEYS", "NINE"), ("rsa", True, "LOCKED", "ORDER"), ("same", False, "", "ORDER")],
    5: [("dec", False, "", "PADDING"), ("check", True, "", "REJECT"), ("skip", False, "", "NINE")],
    6: [("hmac", False, "FSEAL", "FORGED"), ("sign", True, "", "REJECT"), ("two", False, "", "FORGED")],
    7: [("nothing", False, "", "ORDER"), ("num", True, "", "REJECT"), ("date", False, "", "ORDER")],
}
TWO_RIDES = {7}   # Alice's packet first: Bob reads her order, then Eve's copy
fails = []


def report(name, bad):
    print("ok  " if not bad else "FAIL", name, "" if not bad else bad, flush=True)
    bad and fails.append(name)


STATE = """() => ({ state: document.querySelector('.choices')?.dataset.state,
  marks: Object.fromEntries([...document.querySelectorAll('.choice')].map(b => [b.dataset.k, b.dataset.mark || ''])),
  shown: [...document.querySelectorAll('.choice')].filter(b => b.offsetParent).length,
  enabled: [...document.querySelectorAll('.choice')].filter(b => !b.disabled).length,
  verdict: document.getElementById('choice-verdict')?.dataset.verdict || '',
  cont: !!document.getElementById('choice-continue'), again: !!document.getElementById('choice-again'),
  next: !document.getElementById('next').disabled, hash: location.hash })"""
# the bytes Eve should quote, computed by the page's own module (story.js values())
BYTES = """async () => { const m = await import('./js/story.js'), A = await import('../lib/saga-aes.js'), v = m.values();
  const h = b => A.hex(b, 4);
  return { ecb: [h(v.ecb[0]), h(v.ecb[1])], ecbSame: A.same(A.concat(v.ecb), A.concat(v.ecbYesterday)),
    cbc: [h(v.cbc.C[0]), h(v.cbc.C[1])], cbcSame: A.diff(A.concat(v.cbc.C), A.concat(v.cbcYesterday.C)), sum: h(v.sum), back: v.back,
    keys: h(A.MACKEY), stolen: v.stolen, stolenOk: v.stolenOk, locked: h(v.locked.c), got: v.got,
    padBad: !v.padFirst.padGood && !v.padFirst.rejected, sealFirst: v.sealFirst.rejected && !v.sealFirst.P, skipped: v.skipped,
    fseal: h(v.forged.tag), forgedGot: v.forgedGot, forgedOk: v.forgedOk }; }"""

with sync_playwright() as p:
    b = launch(p)
    for lang, size in [(l, (1440, 860)) for l in langs] + [(langs[0], (390, 844))]:
        tag = f"{lang} {size[0]}px"
        errors = []
        pg = b.new_context(viewport={"width": size[0], "height": size[1]}, has_touch=size[0] < 900).new_page()
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{base}?instant=1&lang={lang}#story=2", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        v = pg.evaluate(BYTES)
        report(f"{tag} ECB blocks are yesterday's, CBC with a fresh IV shares none", [] if v["ecbSame"] and v["cbcSame"] >= 30 else v)
        report(f"{tag} Eve's byte turns 6 into 9", [] if v["back"] == NINE[lang] else v["back"])
        report(f"{tag} keys in the clear: Eve reseals a 9; under RSA-OAEP Bob gets them back", [] if v["stolen"] == NINE[lang] and v["stolenOk"] and v["got"] == ORDER[lang] else v)
        report(f"{tag} decrypting first, a bad padding; checking first, rejected undecrypted; no check, 9", [] if v["padBad"] and v["sealFirst"] and v["skipped"] == NINE[lang] else v)
        report(f"{tag} Eve's forgery under her own keys passes the seal", [] if v["forgedOk"] and v["forgedGot"] == FORGED[lang] else v)
        want = {"ORDER": ORDER[lang], "NINE": NINE[lang], "REJECT": REJECT[lang], "ECB": v["ecb"][1], "CBC": v["cbc"][1], "SUM": v["sum"],
                "KEYS": v["keys"], "LOCKED": v["locked"], "FSEAL": v["fseal"], "FORGED": FORGED[lang], "PADDING": PADDING[lang], "": ""}

        for step, choices in STEPS.items():
            pg.evaluate(f"demo.story.go({step - 1})"); pg.wait_for_timeout(400)
            s = pg.evaluate(STATE)
            report(f"{tag} step {step}: three choices, Suivant shut", [] if s["shown"] == 3 and s["enabled"] == 3 and not s["next"] and s["state"] == "pick" else s)
            right = next(c for c in choices if c[1])
            order = [c for c in choices if not c[1]] + [right]
            for k, ok, eve, bob in order:
                n = pg.evaluate("demo.said.length")
                pg.locator(f".choice[data-k={k}]").click()
                pg.wait_for_function("() => ['wrong', 'right'].includes(document.querySelector('.choices')?.dataset.state)", timeout=120000)
                said = pg.evaluate("demo.said")[n:]
                lines = {w: t for w, t in said}
                bad = []
                if step in TWO_RIDES:
                    first = [t for w, t in said if w == "b"][:1]
                    if len(said) != 4 or ORDER[lang] not in (first or [""])[0]: bad.append(f"two rides, Alice's read first: {said}")
                if eve and want[eve] not in lines.get("e", ""): bad.append(f"Eve said {lines.get('e')!r}, wanted {want[eve]!r}")
                if want[bob] not in lines.get("b", ""): bad.append(f"Bob said {lines.get('b')!r}, wanted {want[bob]!r}")
                if k == "cbc" and v["ecb"][0] in lines.get("e", ""): bad.append("Eve quotes the ECB block under CBC")
                s = pg.evaluate(STATE)
                if s["marks"].get(k) != ("right" if ok else "wrong"): bad.append(f"mark {s['marks']}")
                if s["verdict"] != ("right" if ok else "wrong"): bad.append(f"verdict {s['verdict']!r}")
                if not ok and (s["shown"] != 3 or s["enabled"] != 3 or s["next"]): bad.append(f"after a wrong one: {s}")
                if ok and (s["shown"] != 0 or not s["again"] or not s["cont"]): bad.append(f"after the right one: {s}")
                if ok and not s["next"]: bad.append("Suivant still shut")
                report(f"{tag} step {step} {k}: {'right' if ok else 'wrong'}", bad)
            # try another: the three again, the right one green, the wrong ones red
            pg.locator("#choice-again").click(); pg.wait_for_timeout(100)
            s = pg.evaluate(STATE)
            want_marks = {c[0]: "right" if c[1] else "wrong" for c in choices}
            report(f"{tag} step {step} try another: right green, wrong red", [] if s["marks"] == want_marks and s["shown"] == 3 and s["state"] == "pick" else s)
            # the marks stay when the reader goes away and back
            pg.evaluate(f"demo.story.go({step - 2})"); pg.wait_for_timeout(100); pg.evaluate(f"demo.story.go({step - 1})"); pg.wait_for_timeout(100)
            s = pg.evaluate(STATE)
            report(f"{tag} step {step} back again: marks kept, Suivant open", [] if s["marks"] == want_marks and s["next"] else s)
            if True:
                pg.locator(f".choice[data-k={right[0]}]").click()
                pg.wait_for_function("() => document.querySelector('.choices')?.dataset.state === 'right'", timeout=120000)
                pg.locator("#choice-continue").click(); pg.wait_for_timeout(200)
                s = pg.evaluate(STATE)
                report(f"{tag} step {step} continue opens step {step + 1}", [] if s["hash"] == f"#story={step + 1}" else s)
        # the end: no choices, the doors out, the next episode last and gold
        d = pg.evaluate("""() => ({ hash: location.hash, choices: document.querySelectorAll('.choice').length,
          doors: [...document.querySelectorAll('#step-actions .door')].map(a => [a.getAttribute('href'), a.classList.contains('next')]),
          next: !document.getElementById('next').disabled })""")
        want_doors = [[f"../deux-generaux/?lang={lang}", False], [f"../?lang={lang}", False], [f"../cadenas/?lang={lang}", True]]
        report(f"{tag} step {LAST}: the doors out, episode 2 last in gold", [] if d["hash"] == f"#story={LAST}" and not d["choices"] and d["doors"] == want_doors and not d["next"] else d)
        report(f"{tag} no page error", errors[:2])
        pg.close()
    b.close()
print("all ok" if not fails else f"{len(fails)} FAILED")
sys.exit(1 if fails else 0)
