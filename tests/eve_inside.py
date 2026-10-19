#!/usr/bin/env python3
"""Episode 1.2's chapter 2 happens inside Alice's keep (r103, r158): ONE zoom in for the four steps
key, aes, pad, cbc, each a beat of the same room, and out at 'cipher'. Checks, desktop and phone:
the zoom in happens once from step 3, the next steps change the beat without flying again, step 8
comes out, Back into step 7 zooms in again, #story=6 straight into the chapter enters the room;
each beat's frame sits in the free band (between the top bar and the story panel, never under
them), Alice's bubble points into it; a language switch inside rebuilds the room in English; no
page errors. Serve the repo first (python3 -m http.server 8793).

    python3 tests/eve_inside.py [base]
"""
import sys
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "eve-lit-tout/"
bad = 0


def check(name, ok, info=""):
    global bad
    print(("ok  " if ok else "BAD ") + name + (f"  ({info})" if info and not ok else ""))
    bad += not ok


STATE = """() => { const i = demo.inside; return { active: i.active, beat: i.room && i.room.beat,
  ins: i.log.filter(x => x[0] === 'in').length, outs: i.log.filter(x => x[0] === 'out').length,
  order: i.room && i.room.send.order }; }"""
# where the frame and the bubble land on screen, against the band the room must keep to
PLACE = """() => { const i = demo.inside, cam = i.camera, b = i.want.b, box = i.want.box;
  const W = innerWidth, H = innerHeight, px = p => { const v = p.clone().project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
  const V = demo.THREE.Vector3, c = [px(new V(box.min.x, box.min.y, 0)), px(new V(box.max.x, box.max.y, 0))];
  const story = document.getElementById('story').getBoundingClientRect(), bar = document.getElementById('topbar').getBoundingClientRect();
  const bub = document.querySelector('.bubble.show'), br = bub && bub.getBoundingClientRect();
  return { left: c[0][0], right: c[1][0], top: c[1][1], bottom: c[0][1], storyTop: story.top, barBottom: bar.bottom, W,
           bubble: br && { top: br.top, bottom: br.bottom, left: br.left, right: br.right } }; }"""

with sync_playwright() as p:
    br = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    for size in [(1440, 860), (390, 844)]:
        tag = f"{size[0]}px"
        pg = br.new_page(viewport={"width": size[0], "height": size[1]}, is_mobile=size[0] < 900, has_touch=size[0] < 900)
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(BASE + "?instant=1&lang=fr#story=3"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.add_style_tag(content=".bubble { transition: opacity .35s !important; }")   # where a bubble goes, not its glide (as bubble_room.py)
        pg.wait_for_timeout(500)
        check(f"{tag} step 3 is in the valley", not pg.evaluate(STATE)["active"])
        for i, beat in enumerate(["key", "aes", "pad", "cbc"]):
            pg.evaluate(f"demo.story.go({3 + i})")
            pg.wait_for_function(f"demo.inside.active && demo.inside.room.beat === '{beat}'", timeout=20000)
            # SwiftShader draws a few frames a second: wait until the bubble has been placed once
            pg.wait_for_function("(() => { const b = document.querySelector('.bubble.show'); return b && b.style.transform && b.style.visibility === 'visible'; })()", timeout=20000)
            pg.wait_for_timeout(600)
            s, at = pg.evaluate(STATE), pg.evaluate(PLACE)
            check(f"{tag} step {4 + i} is the beat '{beat}', one zoom in so far", s["ins"] == 1, s)
            check(f"{tag} step {4 + i}: the frame stays clear of the top bar and the story panel",
                  at["top"] >= at["barBottom"] - 2 and at["bottom"] <= at["storyTop"] + 2 and at["left"] >= -2 and at["right"] <= at["W"] + 2, at)
            b = at["bubble"]
            check(f"{tag} step {4 + i}: Alice's bubble is between the top bar and the story panel",
                  bool(b) and b["top"] >= at["barBottom"] - 2 and b["bottom"] <= at["storyTop"] + 2, at)
        pg.evaluate("demo.story.go(7)"); pg.wait_for_function("!demo.inside.active", timeout=20000)
        s = pg.evaluate(STATE)
        check(f"{tag} step 8 'cipher' comes out of the keep", s["outs"] == 1 and s["ins"] == 1, s)
        pg.evaluate("demo.story.go(6)"); pg.wait_for_function("demo.inside.active", timeout=20000)
        s = pg.evaluate(STATE)
        check(f"{tag} Back into step 7 zooms in again, on the beat 'cbc'", s["ins"] == 2 and s["beat"] == "cbc", s)
        pg.click("#lang button[data-lang=en]"); pg.wait_for_timeout(600)
        s = pg.evaluate(STATE)
        check(f"{tag} switching to English inside rebuilds the room on the English order", s["active"] and s["order"] == "ATTACK AT DAWN TOMORROW", s)
        pg.goto(BASE + "?instant=1&lang=fr&direct=1#story=6")   # another query: a new page, not a hash change; pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.wait_for_function("demo.inside.active", timeout=20000)
        check(f"{tag} #story=6 straight into the chapter enters the room on 'pad'", pg.evaluate(STATE)["beat"] == "pad")
        check(f"{tag} no page errors", not errors, errors)
        pg.close()
    br.close()
print("all ok" if not bad else f"{bad} BAD")
sys.exit(1 if bad else 0)
