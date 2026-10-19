#!/usr/bin/env python3
"""Le paquet complet (r98): plays each story ride and checks what Eve and Bob say aloud (Eve lets the
whole packet through and Bob reads the order; Eve changes the first byte of the ciphertext and Bob
rejects it; main.py's scene, two riders, and the terminal's last line), then runs the sandbox (Eve lets
it through or changes a byte of a brick; Bob checks first or decrypts first). Shoots every story step,
desktop and phone, to out/paquet-<lang>-<step>[-phone].png. The bytes are checked apart by
tests/paquet_values.mjs. Serve the repo first (python3 -m http.server 8793), or pass a base URL.
Exit 1 on any failure.

    tests/paquet_story.py [base] [fr|en]
"""
import re
import sys
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "paquet-complet/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
ORDER = {"fr": "ATTAQUE A 6H DEMAIN", "en": "ATTACK AT 6AM TOMORROW"}[lang]
HELLO = {"fr": "Bonjour Bob !", "en": "Hello Bob!"}[lang]
REJECT = {"fr": "HMAC invalide", "en": "invalid HMAC"}[lang]
NOKEYS = {"fr": "n’ouvre pas", "en": "does not open"}[lang]
LATE = {"fr": "déchiffré d’abord", "en": "decrypted first"}[lang]
LAST = {"fr": "[OK] Manipulation détectée", "en": "[OK] Tampering detected"}[lang]
fails = []


def report(name, bad):
    print("ok  " if not bad else "FAIL", name, "" if not bad else bad)
    bad and fails.append(name)


with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
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
            pg.screenshot(path=f"out/paquet-{lang}-{i + 1}{tag}.png")
        pg.close()

    def play(step):
        pg = page(f"#story={step}")
        pg.locator("#play").click()
        pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=120000)
        pg.wait_for_timeout(300)
        return pg, pg.evaluate("demo.said")

    pg, said = play(6)
    report("6 Eve sees the locked keys, starting 2b 3d 82, and lets them pass", [] if said and said[0][0] == "e" and "2b 3d 82 68 ae 9f" in said[0][1] else said)
    report("6 Bob opens, checks and reads the order", [] if len(said) == 2 and said[1][0] == "b" and ORDER in said[1][1] else said)
    pg.screenshot(path=f"out/paquet-{lang}-ride.png"); pg.close()

    pg, said = play(8)
    report("8 Eve changes byte 1 of the ciphertext", [] if said and said[0][0] == "e" and ("1er octet du chiffré" in said[0][1] or "byte 1 of the ciphertext" in said[0][1]) else said)
    report("8 Bob rejects: invalid HMAC, nothing decrypted", [] if len(said) == 2 and REJECT in said[1][1] else said)
    pg.screenshot(path=f"out/paquet-{lang}-ride-eve.png"); pg.close()

    pg, said = play(12)
    report("12 main.py: Bob reads the greeting, then rejects Eve's byte", [] if len(said) == 4 and HELLO in said[1][1] and REJECT in said[3][1] else said)
    term = pg.evaluate("document.querySelector('#card pre.term').textContent")
    report("12 the terminal ends on the expected line", [] if term.strip().endswith(LAST) and f'"{HELLO}"' in term else term)
    pg.screenshot(path=f"out/paquet-{lang}-main.png"); pg.close()

    # the sandbox
    pg = page("#sandbox")
    def send(eve, brick, place, bob):
        pg.check(f"input[name='sb-eve'][value='{eve}']")
        if eve == "flip":
            pg.check(f"input[name='sb-brick'][value='{brick}']"); pg.fill("#sb-byte", str(place))
        pg.check(f"input[name='sb-bob'][value='{bob}']")
        pg.locator("#sb-send").click(); pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=90000)
        return pg.evaluate("demo.said.at(-1)[1]"), pg.evaluate("document.querySelector('#card .verdict:last-of-type').className")
    pg.fill("#sb-order", "RETRAITE A MIDI")
    bob, v = send("pass", None, 0, "check");      report("sandbox Eve lets it through: Bob reads", [] if "RETRAITE A MIDI" in bob and "ok" in v else (bob, v))
    bob, v = send("flip", "ct", 5, "check");      report("sandbox a byte of the ciphertext: rejected", [] if REJECT in bob and "bad" in v else (bob, v))
    bob, v = send("flip", "ek", 200, "check");    report("sandbox a byte of the locked keys: no keys", [] if NOKEYS in bob else (bob, v))
    bob, v = send("flip", "tag", 32, "decrypt");  report("sandbox decrypt first, a byte of the seal: decrypted, then rejected", [] if LATE in bob else (bob, v))
    pg.screenshot(path=f"out/paquet-{lang}-sandbox.png")
    st = pg.evaluate("document.getElementById('sb-stats').textContent")
    report("sandbox stats count 4 sent, 1 accepted, 3 rejected, 1 decrypted first", [] if [int(x) for x in re.findall(r'\d+', st)] == [4, 1, 3, 1] else st)
    pg.close()
    pg = page("#sandbox", (390, 844)); pg.wait_for_timeout(800); pg.screenshot(path=f"out/paquet-{lang}-sandbox-phone.png"); pg.close()

    pg = page("#quiz"); pg.wait_for_timeout(800); pg.screenshot(path=f"out/paquet-{lang}-quiz.png"); pg.close()
    report("no page errors", errors)
    b.close()
sys.exit(1 if fails else 0)
