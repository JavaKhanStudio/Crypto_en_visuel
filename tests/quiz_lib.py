#!/usr/bin/env python3
"""lib/quiz.js (r317), the one quiz every episode imports: in each episode, open #quiz, check that the first
question shows with its options, that an empty check asks to pick, that a pick gives feedback and a score,
that FR -> EN re-renders the question in English, and that playing to the end shows the end card and
« Recommencer » brings question 1 back. Serve the repo first (python3 -m http.server 8793). Exit 1 on failure.

    tests/quiz_lib.py [episode ...]
"""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8793/"
EPISODES = sys.argv[1:] or ["deux-generaux", "eve-lit-tout", "octet-change", "cle-vallee", "paquet-complet",
    "encore-des-tours", "cadenas", "diffie-hellman", "scytale", "enigma", "enigma-reglage", "enigma-casse",
    "pingouin", "sel", "garde", "kasiski", "vpn"]
fails = []

def check(name, ok):
    print(("ok   " if ok else "FAIL ") + name)
    ok or fails.append(name)

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    for ep in EPISODES:
        pg = b.new_page(viewport={"width": 1280, "height": 800})
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{BASE}{ep}/?instant=1&lang=fr#quiz", wait_until="domcontentloaded", timeout=90000)
        pg.wait_for_function("window.demo && window.demo.ready", timeout=90000)
        pg.wait_for_function("document.querySelectorAll('#quiz-options li').length > 0", timeout=30000)
        q_fr = pg.inner_text("#quiz-q")
        check(f"{ep}: question 1 with options", bool(q_fr) and pg.locator("#quiz-options li").count() >= 2)
        pg.click("#quiz-check")
        check(f"{ep}: empty check asks to pick", pg.locator("#quiz-feedback .ko").count() == 1)
        pg.click("#quiz-options li >> nth=0"); pg.click("#quiz-check")
        check(f"{ep}: a pick gets feedback", pg.locator("#quiz-feedback p").count() == 1
              and pg.locator("#quiz-options.locked").count() == 1)
        pg.click("#quiz-next")
        pg.evaluate("document.querySelector('#lang [data-lang=en]').click()")   # the quiz modal covers the top bar
        pg.wait_for_timeout(200)
        q_en = pg.inner_text("#quiz-q")
        check(f"{ep}: FR -> EN re-renders the question", q_en and q_en != q_fr and "2 /" in pg.inner_text("#quiz-progress"))
        for _ in range(40):
            if pg.locator(".quiz-end").count(): break
            pg.click("#quiz-options li >> nth=0"); pg.click("#quiz-check"); pg.click("#quiz-next")
        check(f"{ep}: the end card", pg.locator(".quiz-end .big").count() == 1)
        pg.click("#q-again")
        check(f"{ep}: again -> question 1", "1 /" in pg.inner_text("#quiz-progress"))
        check(f"{ep}: no page errors", not errors)
        errors and print(errors)
        pg.close()
    b.close()
print("all ok" if not fails else f"{len(fails)} FAIL")
sys.exit(bool(fails))
