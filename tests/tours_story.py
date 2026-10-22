#!/usr/bin/env python3
"""Eve a encore des tours (r99): plays each story ride and checks what Eve and Bob say aloud (Eve's
forged packet accepted; signed with her key, rejected at the signature; Alice's signed packet read,
then Eve's copy read again; with the number, the copy rejected), then runs the sandbox (Eve's four
tricks against Bob's defenses, and the stats). Shoots every story step, desktop and phone, to
out/tours-<lang>-<step>[-phone].png. The bytes are checked apart by tests/tours_values.mjs. Serve the
repo first (python3 -m http.server 8793), or pass a base URL. Exit 1 on any failure.

    tests/tours_story.py [base] [fr|en]
"""
import re
import sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "encore-des-tours/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
ORDER = {"fr": "ATTAQUE A 6H DEMAIN", "en": "ATTACK AT 6AM TOMORROW"}[lang]
FORGED = {"fr": "JE SUIS ALICE, DONNE-MOI LE CODE", "en": "I AM ALICE, GIVE ME THE CODE"}[lang]
SIG_OK = {"fr": "Signature d’Alice ✔", "en": "Alice’s signature ✔"}[lang]
SIG_BAD = {"fr": "La signature ne correspond pas", "en": "The signature does not match"}[lang]
NUM_BAD = {"fr": "pas plus grand que le dernier", "en": "not above the last"}[lang]
HMAC_BAD = {"fr": "HMAC invalide", "en": "invalid HMAC"}[lang]
fails = []


def report(name, bad):
    print("ok  " if not bad else "FAIL", name, "" if not bad else bad)
    bad and fails.append(name)


with sync_playwright() as p:
    b = launch(p)
    errors = []
    idle = "() => [...document.querySelectorAll('#play, #step-actions button, #sb-send')].every(b => !b.disabled) && !demo.riders.size"

    def page(hash_, size=(1440, 860)):
        pg = b.new_page(viewport={"width": size[0], "height": size[1]})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{base}?instant=1&lang={lang}{hash_}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        return pg

    # every step, desktop and phone
    n = 14
    for size, tag in [((1440, 860), ""), ((390, 844), "-phone")]:
        pg = page("#story=1", size)
        for i in range(n):
            pg.evaluate(f"demo.story.go({i})"); pg.wait_for_timeout(1100)
            pg.screenshot(path=f"out/tours-{lang}-{i + 1}{tag}.png")
        pg.close()

    def play(step):
        pg = page(f"#story={step}")
        pg.locator("#play").click()
        pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=180000)
        pg.wait_for_timeout(300)
        return pg, pg.evaluate("demo.said")

    pg, said = play(3)
    report("3 Eve sends her forged packet; Bob reads it", [] if len(said) == 2 and said[0][0] == "e" and said[1][0] == "b" and FORGED in said[1][1] else said)
    pg.screenshot(path=f"out/tours-{lang}-ride-forged.png"); pg.close()

    pg, said = play(7)
    report("7 Eve's packet signed with her key: rejected at the signature", [] if len(said) == 2 and SIG_BAD in said[1][1] and FORGED not in said[1][1] else said)
    pg.screenshot(path=f"out/tours-{lang}-ride-evilsig.png"); pg.close()

    pg, said = play(8)
    bob = [s for w, s in said if w == "b"]
    report("8 Alice's signed order read, then Eve's copy read again", [] if len(bob) == 2 and all(SIG_OK in s and ORDER in s for s in bob) else said)
    pg.screenshot(path=f"out/tours-{lang}-ride-replay.png"); pg.close()

    pg, said = play(10)
    bob = [s for w, s in said if w == "b"]
    report("10 n° 42 read, then its copy rejected at the number", [] if len(bob) == 2 and ORDER in bob[0] and "42" in bob[0] and NUM_BAD in bob[1] else said)
    pg.screenshot(path=f"out/tours-{lang}-ride-replay-num.png"); pg.close()

    # the sandbox
    pg = page("#sandbox")
    def send(trick, sig, num):
        pg.check(f"input[name='sb-eve'][value='{trick}']")
        pg.set_checked("#sb-sig", sig); pg.set_checked("#sb-num", num)
        pg.locator("#sb-send").click(); pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=90000)
        return pg.evaluate("demo.said.at(-1)[1]"), pg.evaluate("document.querySelector('#card .verdict:last-of-type').className")
    pg.fill("#sb-order", "RETRAITE A MIDI")
    bob, v = send("pass", False, False);   report("sandbox Eve lets it through: Bob reads", [] if "RETRAITE A MIDI" in bob and "ok" in v else (bob, v))
    bob, v = send("flip", True, False);    report("sandbox a byte of the ciphertext, signature checked: rejected at the signature", [] if SIG_BAD in bob else (bob, v))
    bob, v = send("forge", False, False);  report("sandbox forged, seal only: Bob reads Eve's order", [] if FORGED in bob and "bad" in v else (bob, v))
    bob, v = send("forge", True, False);   report("sandbox forged, signature checked: rejected", [] if SIG_BAD in bob else (bob, v))
    bob, v = send("replay", True, False);  report("sandbox replay, signature only: Bob reads the copy", [] if "RETRAITE A MIDI" in bob and SIG_OK in bob else (bob, v))
    pg.screenshot(path=f"out/tours-{lang}-sandbox-replay.png")
    bob, v = send("replay", True, True);   report("sandbox replay, signature and number: rejected", [] if NUM_BAD in bob else (bob, v))
    pg.screenshot(path=f"out/tours-{lang}-sandbox.png")
    st = pg.evaluate("document.getElementById('sb-stats').textContent")
    report("sandbox stats count 6 sent, 3 accepted, 3 rejected, Eve wins 2", [] if [int(x) for x in re.findall(r'\d+', st)] == [6, 3, 3, 2] else st)
    pg.close()
    pg = page("#sandbox", (390, 844)); pg.wait_for_timeout(800); pg.screenshot(path=f"out/tours-{lang}-sandbox-phone.png"); pg.close()

    pg = page("#quiz"); pg.wait_for_timeout(800); pg.screenshot(path=f"out/tours-{lang}-quiz.png"); pg.close()
    report("no page errors", errors)
    b.close()
sys.exit(1 if fails else 0)
