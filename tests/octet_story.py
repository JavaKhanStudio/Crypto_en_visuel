#!/usr/bin/env python3
"""L'octet changé (r96): plays each story ride and checks what Eve and Bob say aloud (Bob reads « 9H »
without the seal, rejects the changed packet with it, rejects Eve's forged rider), then runs the
sandbox (Eve on the IV, on the ciphertext, her own rider; the seal checked or not). Shoots every
story step, desktop and phone, to out/octet-<lang>-<step>[-phone].png. The bytes are checked apart
by tests/octet_values.mjs. Serve the repo first (python3 -m http.server 8793), or pass a base URL.
Exit 1 on any failure.

    tests/octet_story.py [base] [fr|en]
"""
import sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "octet-change/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
CHANGED = {"fr": "ATTAQUE A 9H DEMAIN", "en": "ATTACK AT 9AM TOMORROW"}[lang]
REJECT = {"fr": "Sceau invalide", "en": "Invalid seal"}[lang]
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
    n = 13
    for size, tag in [((1440, 860), ""), ((390, 844), "-phone")]:
        pg = page("#story=1", size)
        for i in range(n):
            pg.evaluate(f"demo.story.go({i})"); pg.wait_for_timeout(1100)
            pg.screenshot(path=f"out/octet-{lang}-{i + 1}{tag}.png")
        pg.close()

    def play(step):
        pg = page(f"#story={step}")
        pg.locator("#play").click()
        pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=90000)
        pg.wait_for_timeout(300)
        return pg, pg.evaluate("demo.said")

    pg, said = play(3)
    report("3 Eve changes byte 11 of the IV (6 -> 9)", [] if said and said[0][0] == "e" and "ab ⊕ 0f = a4" in said[0][1] else said)
    report("3 Bob reads 9H, no error", [] if said and said[-1][0] == "b" and CHANGED in said[-1][1] else said)
    pg.screenshot(path=f"out/octet-{lang}-ride-flip.png"); pg.close()

    pg, said = play(8)
    report("8 the sealed packet is rejected, not decrypted", [] if said and said[-1][0] == "b" and REJECT in said[-1][1] and CHANGED not in said[-1][1] else said)
    pg.screenshot(path=f"out/octet-{lang}-ride-sealed.png"); pg.close()

    pg, said = play(9)
    report("9 Eve's forged rider is rejected", [] if len(said) == 2 and said[0][0] == "e" and REJECT in said[1][1] else said)
    pg.screenshot(path=f"out/octet-{lang}-ride-forged.png"); pg.close()

    # the sandbox
    pg = page("#sandbox")
    def send(how, check=True, byte=None):
        pg.check(f"input[name='sb-how'][value='{how}']")
        pg.set_checked("#sb-check", check)
        if byte: pg.fill("#sb-byte", str(byte))
        pg.locator("#sb-send").click(); pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=90000)
        return pg.evaluate("demo.said.at(-1)[1]"), pg.evaluate("document.querySelector('#card .verdict').className")
    pg.fill("#sb-order", "RETRAITE A MIDI")
    bob, v = send("none");              report("sandbox untouched: Bob reads it", [] if "RETRAITE A MIDI" in bob and "ok" in v else (bob, v))
    bob, v = send("iv", False, 3);      report("sandbox IV byte 3, no check: Bob reads RE[ -> changed", [] if "RE[RAITE A MIDI" in bob and "bad" in v else (bob, v))
    bob, v = send("iv", True, 3);       report("sandbox IV byte 3, checked: rejected", [] if REJECT in bob else (bob, v))
    bob, v = send("ct", True, 20);      report("sandbox ciphertext byte, checked: rejected", [] if REJECT in bob else (bob, v))
    bob, v = send("forge", True);       report("sandbox forged rider, checked: rejected", [] if REJECT in bob else (bob, v))
    pg.screenshot(path=f"out/octet-{lang}-sandbox.png")
    st = pg.evaluate("document.getElementById('sb-stats').textContent")
    report("sandbox stats count 5 sent, 4 changed, 1 fooled, 3 rejected", [] if [int(x) for x in __import__('re').findall(r'\d+', st)] == [5, 4, 1, 3] else st)
    pg.close()

    pg = page("#quiz"); pg.wait_for_timeout(800); pg.screenshot(path=f"out/octet-{lang}-quiz.png"); pg.close()
    report("no page errors", errors)
    b.close()
sys.exit(1 if fails else 0)
