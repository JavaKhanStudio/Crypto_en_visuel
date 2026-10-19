#!/usr/bin/env python3
"""Cross-references of the saga (r119): every « épisode N » / « episode N » in a step's text or in the
corner card of episodes 1.2 to 1.6, FR and EN, is a link (xref.js), and each link lands on a step that
exists in the cited episode. Prints each link with the title of the step it lands on, for a reader to
check that it is the step that explains it. Serve the repo first (python3 -m http.server 8793), or
pass a base URL. Exit 1 on any failure.

    tests/xref_links.py [base]
"""
import os, re, sys
from playwright.sync_api import sync_playwright

base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/"
EPISODES = ["eve-lit-tout", "octet-change", "cle-vallee", "paquet-complet", "encore-des-tours"]
RX = re.compile(r"[ÉéEe]pisode \d+(?:\.\d+)?(?!\d)")
fails = []
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    errors = []

    def open_(url):
        pg = b.new_page(viewport={"width": 1440, "height": 860})
        pg.on("pageerror", lambda e: errors.append(f"{url}: {e}"))
        pg.goto(url, wait_until="domcontentloaded", timeout=90000)
        pg.wait_for_function("window.demo && window.demo.ready", timeout=90000)
        return pg

    def landing(href, lang):
        # the title of the step a link lands on, read from the cited episode's own files, or None
        slug, n = href.split("/")[1], int(href.split("#story=")[1])
        story = open(f"{root}/{slug}/js/story.js", encoding="utf-8").read()
        ids = re.findall(r"^\s*\{ id: '(\w+)'", story[story.index("export const STEPS"):], re.M)
        if not 1 <= n <= len(ids):
            return None
        src = open(f"{root}/{slug}/js/i18n.js", encoding="utf-8").read()
        part = src[src.index("const en = {"):] if lang == "en" else src[:src.index("const en = {")]
        m = re.search(r"\n\s*%s: \{ t: (['\"])(.*?)\1" % ids[n - 1], part)
        return m.group(2) if m else ids[n - 1]

    for lang in ["fr", "en"]:
        for ep in EPISODES:
            pg = open_(f"{base}{ep}/?instant=1&lang={lang}#story=1")
            i = 0
            while True:
                pg.evaluate(f"demo.story.go({i})")
                pg.wait_for_timeout(80)
                got = pg.evaluate("""() => [...document.querySelectorAll('#step-text, #card')].map(el => ({
                    text: [...el.childNodes].map(function flat(c) { return c.nodeType === 3 ? c.nodeValue : c.closest && c.closest('a:not(.xref)') ? '' : [...c.childNodes].map(flat).join(''); }).join(''),
                    links: [...el.querySelectorAll('a.xref')].map(a => [a.textContent, a.getAttribute('href')]) }))""")
                for where, g in zip(["text", "card"], got):
                    mentions = RX.findall(g["text"])
                    if len(mentions) != len(g["links"]):
                        fails.append(f"{lang} {ep} step {i + 1} {where}: {len(mentions)} mentions, {len(g['links'])} links")
                    for txt, href in g["links"]:
                        t = landing(href, lang)
                        print(f"{'ok  ' if t else 'FAIL'} {lang} {ep} #{i + 1} {where}: {txt} -> {href}  « {t} »")
                        if not t:
                            fails.append(f"{lang} {ep} step {i + 1}: {href} lands nowhere")
                if pg.evaluate("document.querySelector('#next').disabled"):
                    break
                i += 1
            pg.close()
    b.close()

for f in fails + errors:
    print("FAIL", f)
print("all ok" if not fails and not errors else f"{len(fails) + len(errors)} failure(s)")
sys.exit(1 if fails or errors else 0)
