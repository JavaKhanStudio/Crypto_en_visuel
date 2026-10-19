#!/usr/bin/env python3
"""La clé qui traverse la vallée (r97): plays each story ride and checks what Eve and the far castle
say aloud (Eve copies the keys sent in the clear; she copies Bob's open padlock on its way to Alice;
she cannot open the locked keys, and Bob opens them and reads the order), then runs the sandbox (keys
in the clear or locked, Eve reading or rewriting). Shoots every story step, desktop and phone, to
out/cle-<lang>-<step>[-phone].png. The bytes and numbers are checked apart by tests/cle_values.mjs.
Serve the repo first (python3 -m http.server 8793), or pass a base URL. Exit 1 on any failure.

    tests/cle_story.py [base] [fr|en]
"""
import re
import sys
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "cle-vallee/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
ORDER = {"fr": "ATTAQUE A 6H DEMAIN", "en": "ATTACK AT 6AM TOMORROW"}[lang]
CHANGED = {"fr": "ATTAQUE A 9H DEMAIN", "en": "ATTACK AT 9AM TOMORROW"}[lang]
REJECT = {"fr": "Sceau invalide", "en": "Invalid seal"}[lang]
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
    n = 13
    for size, tag in [((1440, 860), ""), ((390, 844), "-phone")]:
        pg = page("#story=1", size)
        for i in range(n):
            pg.evaluate(f"demo.story.go({i})"); pg.wait_for_timeout(1100)
            pg.screenshot(path=f"out/cle-{lang}-{i + 1}{tag}.png")
        pg.close()

    def play(step):
        pg = page(f"#story={step}")
        pg.locator("#play").click()
        pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=90000)
        pg.wait_for_timeout(300)
        return pg, pg.evaluate("demo.said")

    pg, said = play(2)
    report("2 Eve copies the keys sent in the clear", [] if said and said[0][0] == "e" and "7f 6d 5b 1b" in said[0][1] and "dc bd a0 50" in said[0][1] else said)
    report("2 Bob gets the keys", [] if said and said[-1][0] == "b" else said)
    pg.screenshot(path=f"out/cle-{lang}-ride-clear.png"); pg.close()

    pg, said = play(6)
    report("6 Bob's padlock rides west: Eve copies it, Alice gets it", [] if len(said) == 2 and said[0][0] == "e" and "65537" in said[0][1] and said[1][0] == "a" else said)
    pg.screenshot(path=f"out/cle-{lang}-ride-padlock.png"); pg.close()

    pg, said = play(9)
    report("9 Eve reads 256 locked bytes, starting 2b 3d 82", [] if said and said[0][0] == "e" and "2b 3d 82 68 ae 9f" in said[0][1] else said)
    report("9 Bob opens the keys and reads the order", [] if said and said[-1][0] == "b" and ORDER in said[-1][1] else said)
    pg.screenshot(path=f"out/cle-{lang}-ride-locked.png"); pg.close()

    # the sandbox
    pg = page("#sandbox")
    def send(keys, eve):
        pg.check(f"input[name='sb-keys'][value='{keys}']")
        pg.check(f"input[name='sb-eve'][value='{eve}']")
        pg.locator("#sb-send").click(); pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=90000)
        return pg.evaluate("demo.said.at(-2)[1]"), pg.evaluate("demo.said.at(-1)[1]"), pg.evaluate("document.querySelector('#card .verdict:last-of-type').className")
    pg.fill("#sb-order", "RETRAITE A MIDI")
    e, bob, v = send("clear", "read");    report("sandbox keys in the clear: Eve reads the order", [] if "RETRAITE A MIDI" in e and "RETRAITE A MIDI" in bob and "ok" in v else (e, bob, v))
    e, bob, v = send("clear", "rewrite"); report("sandbox keys in the clear, Eve rewrites: Bob reads her order", [] if CHANGED in bob and "bad" in v else (e, bob, v))
    e, bob, v = send("rsa", "read");      report("sandbox keys locked: Eve reads nothing, Bob reads", [] if "RETRAITE" not in e and "RETRAITE A MIDI" in bob and "ok" in v else (e, bob, v))
    e, bob, v = send("rsa", "rewrite");   report("sandbox keys locked, Eve changes a byte: rejected", [] if REJECT in bob else (e, bob, v))
    pg.screenshot(path=f"out/cle-{lang}-sandbox.png")
    st = pg.evaluate("document.getElementById('sb-stats').textContent")
    report("sandbox stats count 4 sent, 2 keys read, 1 fooled, 1 rejected", [] if [int(x) for x in re.findall(r'\d+', st)] == [4, 2, 1, 1] else st)
    pg.close()

    pg = page("#quiz"); pg.wait_for_timeout(800); pg.screenshot(path=f"out/cle-{lang}-quiz.png"); pg.close()
    report("no page errors", errors)
    b.close()
sys.exit(1 if fails else 0)
