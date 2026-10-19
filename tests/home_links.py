#!/usr/bin/env python3
"""The series addresses (r34): old root links still open Two Generals at the same step, each
reserved episode folder lands on its card on the home, and the home links the published ones.
Serve the repo first (python3 -m http.server 8793), or pass a base URL:
    tests/home_links.py [https://javakhanstudio.github.io/Crypto_en_visuel/]
Exit 1 on any failure."""
import sys
from playwright.sync_api import sync_playwright

base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/"
SOON = ["encore-des-tours"]   # saga 1.6 (r94), not built yet: their folder is a stub that forwards to the card
fails = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))

    def check(name, ok):
        print(("ok  " if ok else "FAIL"), name)
        ok or fails.append(name)

    for old, want in [("#story=5", "#story=5"), ("?lang=en#quiz", "?lang=en#quiz"), ("#sandbox", "#sandbox"), ("", None)]:
        pg.goto(base + old, wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        if want:
            check(f"root {old} -> deux-generaux/{want}", pg.url == base + "deux-generaux/" + want)
        else:
            check("bare root shows the home", pg.url == base and pg.locator(".card").count() == 13 and pg.locator(".saga .card").count() == 6)
    pg.evaluate("location.hash = 'story=5'")   # typed on the home, no reload
    pg.wait_for_function("window.demo && window.demo.story", timeout=60000)
    check("hash typed on the home -> step 5 of deux-generaux/", pg.url == base + "deux-generaux/#story=5" and pg.evaluate("demo.story.i") == 4)
    pg.goto(base, wait_until="load")
    for live in ["deux-generaux", "eve-lit-tout", "octet-change", "cadenas", "diffie-hellman", "scytale", "enigma", "pingouin", "sel", "garde"]:
        check(f"{live} card links {live}/", pg.locator(f"a.card#{live}").get_attribute("href").startswith(f"{live}/"))
    for s in SOON:
        check(f"{s} card is a « soon » card, not a link", pg.locator(f"div.card.soon#{s}").count() == 1)
    for s in SOON:
        pg.goto(base + s + "/", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=30000)
        check(f"{s}/ -> its card on the home", pg.url == base + "#" + s and pg.locator(f"#{s}.flash").count() == 1)
    check("no page errors", not errors)
    errors and print(errors)
    b.close()
sys.exit(1 if fails else 0)
