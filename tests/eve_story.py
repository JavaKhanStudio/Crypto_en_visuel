#!/usr/bin/env python3
"""Eve lit tout (r95): plays each story ride and checks what Eve and Bob read aloud and what Eve's
notebook keeps, then runs the sandbox three ways (in the clear, same key and IV twice, fresh key and
IV twice). Shoots every story step, desktop and phone, to out/eve-<lang>-<step>[-phone].png.
The bytes are checked apart by tests/eve_values.mjs. Serve the repo first (python3 -m http.server
8793), or pass a base URL. Exit 1 on any failure.

    tests/eve_story.py [base] [fr|en]
"""
import sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "eve-lit-tout/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
ORDER = {"fr": "ATTAQUE DEMAIN A L'AUBE", "en": "ATTACK AT DAWN TOMORROW"}[lang]
C1 = {"fr": "fb 0b 3c 02", "en": "58 af b7 c8"}[lang]          # IV1 is what Eve sees first: fd f2 29 e6
fails = []


def report(name, bad):
    print("ok  " if not bad else "FAIL", name, "" if not bad else bad)
    bad and fails.append(name)


with sync_playwright() as p:
    b = launch(p)
    errors = []
    idle = "() => [...document.querySelectorAll('#play, #step-actions button, #sb-send')].every(b => !b.disabled) && !demo.riders.size && !demo.world.busy"   # busy: the sandbox refuses a send until its ride resolves (r401: on the GPU the riders leave first)

    def page(hash_, size=(1440, 860)):
        pg = b.new_page(viewport={"width": size[0], "height": size[1]})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{base}?instant=1&lang={lang}{hash_}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        return pg

    # every step, desktop and phone
    n = 12
    for size, tag in [((1440, 860), ""), ((390, 844), "-phone")]:
        pg = page("#story=1", size)
        for i in range(n):
            pg.evaluate(f"demo.story.go({i})"); pg.wait_for_timeout(1100)
            pg.screenshot(path=f"out/eve-{lang}-{i + 1}{tag}.png")
        pg.close()

    def play(step):
        pg = page(f"#story={step}")
        pg.locator("#play").click()
        pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=90000)
        pg.wait_for_timeout(300)
        said = pg.evaluate("demo.said")
        book = pg.evaluate("[...document.querySelectorAll('#card .book li')].map(li => li.className + '|' + li.textContent.replace(/\\s+/g, ' ').trim())")
        return pg, said, book

    pg, said, _ = play(2)
    report("2 Eve reads the order in the clear", [] if said and said[0][0] == "e" and ORDER in said[0][1] else said)
    report("2 Bob reads it too", [] if said and said[-1][0] == "b" and ORDER in said[-1][1] else said)
    pg.screenshot(path=f"out/eve-{lang}-ride-plain.png"); pg.close()

    pg, said, _ = play(8)
    report("8 Eve reads only bytes (the IV first)", [] if said and "fd f2 29 e6" in said[0][1] and ORDER not in said[0][1] else said)
    report("8 Bob decrypts the order", [] if said and said[-1][0] == "b" and ORDER in said[-1][1] else said)
    pg.screenshot(path=f"out/eve-{lang}-ride-cipher.png"); pg.close()

    pg, said, book = play(9)
    report("9 Eve recognises the same ciphertext", [] if len(said) == 3 and said[1][0] == "e" and len(book) == 2 and book[1].startswith("seen") else (said, book))
    pg.screenshot(path=f"out/eve-{lang}-ride-same.png"); pg.close()

    pg, said, book = play(10)
    report("10 fresh key and IV: nothing in common", [] if len(said) == 2 and len(book) == 3 and not book[2].startswith("seen") and C1 not in book[2] else (said, book))
    pg.screenshot(path=f"out/eve-{lang}-ride-fresh.png"); pg.close()

    # the sandbox: in the clear (Eve reads), same key twice (seen the 2nd time), fresh twice (never seen)
    pg = page("#sandbox")
    def send(how):
        pg.check(f"input[name='sb-how'][value='{how}']")
        pg.locator("#sb-send").click(); pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=90000)
        return pg.evaluate("demo.said.at(-2)[1]"), pg.evaluate("document.getElementById('sb-stats').textContent")
    pg.fill("#sb-order", "RETRAITE A MIDI")
    eve, _ = send("plain");  report("sandbox in the clear: Eve reads it", [] if "RETRAITE A MIDI" in eve else eve)
    send("same"); _, st = send("same")
    seen = pg.evaluate("document.querySelectorAll('#card .book li.seen').length")
    report("sandbox same key and IV: the 2nd is recognised", [] if seen == 1 else (seen, st))
    send("fresh"); send("fresh")
    seen = pg.evaluate("document.querySelectorAll('#card .book li.seen').length")
    report("sandbox fresh key and IV: never recognised", [] if seen == 1 else seen)
    pg.screenshot(path=f"out/eve-{lang}-sandbox.png"); pg.close()

    pg = page("#quiz"); pg.wait_for_timeout(800); pg.screenshot(path=f"out/eve-{lang}-quiz.png"); pg.close()
    report("no page errors", errors)
    b.close()
sys.exit(1 if fails else 0)
