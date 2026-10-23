#!/usr/bin/env python3
"""Episode 1.3's chapter 2 happens inside Alice's keep (r103, r159, copied from tests/eve_inside.py):
ONE zoom in for the three steps key, hmac, avalanche, each a beat of the same HMAC room, and out at
'sealed'. Checks, desktop and phone: the zoom in happens once from step 4, the next steps change the
beat without flying again, step 8 comes out, Back into step 7 zooms in again, #story=6 straight into
the chapter enters the room; each beat's frame sits in the free band (between the top bar and the
story panel, never under them), the speaker's bubble too; the room's seal is the card's (the real
HMAC); a language switch inside rebuilds the room on the English order; no page errors. Serve the
repo first (python3 -m http.server 8793).

    python3 tests/octet_inside.py [base]
"""
import sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "octet-change/"
bad = 0


def check(name, ok, info=""):
    global bad
    print(("ok  " if ok else "BAD ") + name + (f"  ({info})" if info and not ok else ""))
    bad += not ok


STATE = """() => { const i = demo.inside; return { active: i.active, beat: i.room && i.room.beat,
  ins: i.log.filter(x => x[0] === 'in').length, outs: i.log.filter(x => x[0] === 'out').length,
  order: i.room && i.room.send.s.order }; }"""
# where the frame and the bubble land on screen, against the band the room must keep to
PLACE = """() => { const i = demo.inside, cam = i.camera, b = i.want.b, box = i.want.box;
  const W = innerWidth, H = innerHeight, px = p => { const v = p.clone().project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
  const V = demo.THREE.Vector3, c = [px(new V(box.min.x, box.min.y, 0)), px(new V(box.max.x, box.max.y, 0))];
  const story = document.getElementById('story').getBoundingClientRect(), bar = document.getElementById('topbar').getBoundingClientRect();
  const bub = document.querySelector('.bubble.show'), br = bub && bub.getBoundingClientRect();
  return { left: c[0][0], right: c[1][0], top: c[1][1], bottom: c[0][1], storyTop: story.top, barBottom: bar.bottom, W,
           bubble: br && { top: br.top, bottom: br.bottom, left: br.left, right: br.right } }; }"""

with sync_playwright() as p:
    br = launch(p)
    for size in [(1440, 860), (390, 844)]:
        tag = f"{size[0]}px"
        pg = br.new_page(viewport={"width": size[0], "height": size[1]}, is_mobile=size[0] < 900, has_touch=size[0] < 900)
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(BASE + "?instant=1&lang=fr#story=4"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.add_style_tag(content=".bubble { transition: opacity .35s !important; }")   # where a bubble goes, not its glide (as bubble_room.py)
        pg.wait_for_timeout(500)
        check(f"{tag} step 4 is in the valley", not pg.evaluate(STATE)["active"])
        for i, beat in enumerate(["key", "hmac", "avalanche"]):
            pg.evaluate(f"demo.story.go({4 + i})")
            pg.wait_for_function(f"demo.inside.active && demo.inside.room.beat === '{beat}'", timeout=20000)
            # SwiftShader draws a few frames a second: wait until the bubble has been placed once
            pg.wait_for_function("(() => { const b = document.querySelector('.bubble.show'); return b && b.style.transform && b.style.visibility === 'visible'; })()", timeout=20000)
            pg.wait_for_timeout(600)
            s, at = pg.evaluate(STATE), pg.evaluate(PLACE)
            check(f"{tag} step {5 + i} is the beat '{beat}', one zoom in so far", s["ins"] == 1, s)
            check(f"{tag} step {5 + i}: the frame stays clear of the top bar and the story panel",
                  at["top"] >= at["barBottom"] - 2 and at["bottom"] <= at["storyTop"] + 2 and at["left"] >= -2 and at["right"] <= at["W"] + 2, at)
            if beat == "hmac":
                same = pg.evaluate("""() => { const card = [...document.querySelectorAll('#card .hex.seal')].map(e => e.textContent).join(' ');
                  const room = demo.inside.room.send.s.tag; return card === [...room].map(x => x.toString(16).padStart(2, '0')).join(' '); }""")
                check(f"{tag} step 6: the room's seal is the card's", same)
            b = at["bubble"]
            check(f"{tag} step {5 + i}: the speaker's bubble is between the top bar and the story panel",
                  bool(b) and b["top"] >= at["barBottom"] - 2 and b["bottom"] <= at["storyTop"] + 2, at)
        pg.evaluate("demo.story.go(7)"); pg.wait_for_function("!demo.inside.active", timeout=20000)
        s = pg.evaluate(STATE)
        check(f"{tag} step 8 'sealed' comes out of the keep", s["outs"] == 1 and s["ins"] == 1, s)
        pg.evaluate("demo.story.go(6)"); pg.wait_for_function("demo.inside.active", timeout=20000)
        s = pg.evaluate(STATE)
        check(f"{tag} Back into step 7 zooms in again, on the beat 'avalanche'", s["ins"] == 2 and s["beat"] == "avalanche", s)
        pg.evaluate("document.querySelector('#lang button[data-lang=en]').click()"); pg.wait_for_timeout(600)   # a DOM click: the top bar may have slid out of view (lib/topbar.js, r406)
        s = pg.evaluate(STATE)
        check(f"{tag} switching to English inside rebuilds the room on the English order", s["active"] and s["order"] == "ATTACK AT 6AM TOMORROW", s)
        pg.goto(BASE + "?instant=1&lang=fr&direct=1#story=6")   # another query: a new page, not a hash change; pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.wait_for_function("demo.inside.active", timeout=20000)
        check(f"{tag} #story=6 straight into the chapter enters the room on 'hmac'", pg.evaluate(STATE)["beat"] == "hmac")
        check(f"{tag} no page errors", not errors, errors)
        pg.close()
    br.close()
print("all ok" if not bad else f"{bad} BAD")
sys.exit(1 if bad else 0)
