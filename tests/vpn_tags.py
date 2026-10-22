#!/usr/bin/env python3
"""Le tunnel on a phone: every packet tag shown reads in full (r226).

Serve the repo first (python3 -m http.server 8793). At 390x844 (?instant=1), fr then en, walks the
steps where the watchers' tags show (stage.js pinTags) and measures, in screen pixels, each shown
watcher tag and place name against the others, the page's walls (bubbles.js WALLS), the speech
bubbles and the screen's edge. The tag each step's words are about must be among those shown, and
every shown tag's first line must say whose it is (r344); at step 12 each customer's address is read in
full (r379). Step 12 is also measured after « Envoyer »
(#play): Victor's tag then grows to its crowd form, the widest of the episode, and pinTags hides it if
it finds no room (r373).
    tests/vpn_tags.py [base]"""
import sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/"
MUST = {11: "b", 12: "v", 13: "e"}   # step: the watcher whose tag the step is about
HEAD = {"fr": {"e": "Eve", "i": "Le fournisseur", "v": "Victor", "b": "Bob"}, "en": {"e": "Eve", "i": "The internet provider", "v": "Victor", "b": "Bob"}}
MEASURE = """() => {
  const st = demo.stage, cam = demo.camera, out = [];
  const box = (el, name) => { const r = el.getBoundingClientRect(); return { name, x: r.left, y: r.top, w: r.width, h: r.height }; };
  for (const [k, s] of Object.entries(st.tags)) if (s.visible) { const b = st.screenBox(s, cam); if (b) out.push({ name: 'tag ' + k, kind: 'tag', head: JSON.parse(s.userData.key)[0][0][0], ...b }); }
  for (const [k, s] of Object.entries(st.places)) if (s.visible && s.material.opacity > .05) { const b = st.screenBox(s, cam); if (b) out.push({ name: 'place ' + k, kind: 'place', ...b }); }
  const walls = ['topbar', 'modes', 'lang', 'sound', 'card', 'story'].map(id => document.getElementById(id))
    .filter(el => el && !el.classList.contains('hidden') && el.offsetHeight).map(el => box(el, '#' + el.id));
  const customers = st.customers.filter(c => c.tag.visible).map((c, k) => ({ name: 'customer ' + k, ...st.screenBox(c.tag, cam) }));
  const bubbles = [...document.querySelectorAll('#bubbles .bubble.show')].map(el => box(el, 'bubble ' + el.querySelector('.who').textContent));
  return { labels: out, others: [...walls, ...bubbles, ...customers], walls: [...walls, ...bubbles], customers };
}"""
over = lambda a, b: min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"]) > 1 and min(a["y"] + a["h"], b["y"] + b["h"]) - max(a["y"], b["y"]) > 1
bad = []
def check(pg, lang, n, label):
    m = pg.evaluate(MEASURE)
    L = m["labels"]
    for i, a in enumerate(L):
        if a["kind"] != "tag": continue
        if a["x"] < 0 or a["y"] < 0 or a["x"] + a["w"] > 390 or a["y"] + a["h"] > 844:
            bad.append(f"{lang} {label}: {a['name']} runs off the screen")
        for b in [x for j, x in enumerate(L) if j != i] + m["others"]:
            if over(a, b): bad.append(f"{lang} {label}: {a['name']} on {b['name']}")
    for a in L:   # r344: on a phone a tag may leave its watcher and the places' names may hide, so its first line names it
        if a["kind"] == "tag" and not a["head"].startswith(HEAD[lang][a["name"][4:]]):
            bad.append(f"{lang} {label}: {a['name']} does not say whose it is (first line: {a['head']})")
    for a in m["customers"]:   # r379: a customer's address over them (step 12) is read in full, or not shown at all
        if a["x"] < 0 or a["y"] < 0 or a["x"] + a["w"] > 390 or a["y"] + a["h"] > 844:
            bad.append(f"{lang} {label}: {a['name']} runs off the screen")
        for b in m["walls"] + [x for x in m["customers"] if x is not a] + [x for x in L if x["kind"] == "place"]:
            if over(a, b): bad.append(f"{lang} {label}: {a['name']} on {b['name']}")
    shown = [a["name"][4:] for a in L if a["kind"] == "tag"]
    if n in MUST and MUST[n] not in shown: bad.append(f"{lang} {label}: tag {MUST[n]} not shown (shown: {shown})")
    print(f"{lang} {label}: tags {' '.join(shown) or '-'}")

with sync_playwright() as p:
    br = launch(p)
    for lang in ["fr", "en"]:
        pg = br.new_page(viewport={"width": 390, "height": 844})
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{BASE}vpn/?instant=1&lang={lang}#story=1", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.add_style_tag(content=".bubble { transition: opacity .35s !important; }")
        for n in range(1, 15):
            pg.evaluate(f"demo.story.go({n - 1})"); pg.wait_for_timeout(1500)
            check(pg, lang, n, f"step {n}")
            if n == 12:   # r373: Victor's crowd tag, after « Envoyer »
                others = pg.evaluate("async () => (await import('./js/net.js')).OTHERS.length")
                pg.click("#play")
                pg.wait_for_function(f"demo.stage.st.crowd === {others}", timeout=90000)
                # then Victor speaks: measure once his bubble has settled, the state the step ends in
                pg.wait_for_function("[...document.querySelectorAll('#bubbles .bubble.v.show')].some(e => getComputedStyle(e).opacity === '1')", timeout=30000)
                pg.wait_for_timeout(1000)
                check(pg, lang, n, "step 12 after #play")
        if errors: bad.append(f"{lang} page errors: {errors[:2]}")
        pg.close()
    br.close()
print("\n".join(bad) or "all ok")
sys.exit(1 if bad else 0)
