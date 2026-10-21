#!/usr/bin/env python3
"""Le tunnel on a phone: every packet tag shown reads in full (r226).

Serve the repo first (python3 -m http.server 8793). At 390x844 (?instant=1), fr then en, walks the
steps where the watchers' tags show (stage.js pinTags) and measures, in screen pixels, each shown
watcher tag and place name against the others, the page's walls (bubbles.js WALLS), the speech
bubbles and the screen's edge. The tag each step's words are about must be among those shown.
    tests/vpn_tags.py [base]"""
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/"
MUST = {11: "b", 12: "v", 13: "e"}   # step: the watcher whose tag the step is about
MEASURE = """() => {
  const st = demo.stage, cam = demo.camera, out = [];
  const box = (el, name) => { const r = el.getBoundingClientRect(); return { name, x: r.left, y: r.top, w: r.width, h: r.height }; };
  for (const [k, s] of Object.entries(st.tags)) if (s.visible) { const b = st.screenBox(s, cam); if (b) out.push({ name: 'tag ' + k, kind: 'tag', ...b }); }
  for (const [k, s] of Object.entries(st.places)) if (s.visible && s.material.opacity > .05) { const b = st.screenBox(s, cam); if (b) out.push({ name: 'place ' + k, kind: 'place', ...b }); }
  const walls = ['topbar', 'modes', 'lang', 'sound', 'card', 'story'].map(id => document.getElementById(id))
    .filter(el => el && !el.classList.contains('hidden') && el.offsetHeight).map(el => box(el, '#' + el.id));
  const bubbles = [...document.querySelectorAll('#bubbles .bubble.show')].map(el => box(el, 'bubble ' + el.querySelector('.who').textContent));
  return { labels: out, others: [...walls, ...bubbles] };
}"""
over = lambda a, b: min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"]) > 1 and min(a["y"] + a["h"], b["y"] + b["h"]) - max(a["y"], b["y"]) > 1
bad = []
with sync_playwright() as p:
    br = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    for lang in ["fr", "en"]:
        pg = br.new_page(viewport={"width": 390, "height": 844})
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{BASE}vpn/?instant=1&lang={lang}#story=1", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.add_style_tag(content=".bubble { transition: opacity .35s !important; }")
        for n in range(1, 15):
            pg.evaluate(f"demo.story.go({n - 1})"); pg.wait_for_timeout(1500)
            m = pg.evaluate(MEASURE)
            L = m["labels"]
            for i, a in enumerate(L):
                if a["kind"] != "tag": continue
                if a["x"] < 0 or a["y"] < 0 or a["x"] + a["w"] > 390 or a["y"] + a["h"] > 844:
                    bad.append(f"{lang} step {n}: {a['name']} runs off the screen")
                for b in [x for j, x in enumerate(L) if j != i] + m["others"]:
                    if over(a, b): bad.append(f"{lang} step {n}: {a['name']} on {b['name']}")
            shown = [a["name"][4:] for a in L if a["kind"] == "tag"]
            if n in MUST and MUST[n] not in shown: bad.append(f"{lang} step {n}: tag {MUST[n]} not shown (shown: {shown})")
            print(f"{lang} step {n}: tags {' '.join(shown) or '-'}")
        if errors: bad.append(f"{lang} page errors: {errors[:2]}")
        pg.close()
    br.close()
print("\n".join(bad) or "all ok")
sys.exit(1 if bad else 0)
