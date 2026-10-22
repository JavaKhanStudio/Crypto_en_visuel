#!/usr/bin/env python3
"""Episode 1.4 has two rooms (r363): steps 4 and 5 happen inside Bob's keep, entered by his window
(the RSA room: RSA by hand, 5 x 11 = 55 and 7 -> 13 -> 7, then the 2048-bit n), out at step 6.
Checks, desktop and phone: step 4 zooms in once by Bob's window, step 5 is the next beat of the same
room (no flight), the frame and the bubble sit in the band at every held second of both beats, the
tiles carry the card's numbers (55, 13, 7) and n's bytes, step 6 comes out, Back into step 5 zooms
in again, and a jump from step 5 to step 7 lands in Alice's room by her window.

Episode 1.4's step 7 (« Alice ferme le cadenas ») happens inside Alice's keep (r103, r160, copied
from tests/octet_inside.py): ONE zoom in, a room where OAEP builds EM around the two keys and Bob's
padlock locks it into c, and out at step 8 'seed'. Checks, desktop and phone: step 6 is in the valley,
step 7 zooms in once, the frame and the speaker's bubble sit in the free band (between the top bar
and the story panel) at every moment of the beat, which moves the frame (the room's clock held at
each one); at the end the wall's tiles are EM and the c tiles are c, byte for byte as the card shows
them (the real RSA-OAEP); step 8 comes out, Back into step 7 zooms in again, a language switch inside
rebuilds the room on the English packets, #story=7 straight into it enters; no page errors. Serve
the repo first (python3 -m http.server 8793).

    python3 tests/cle_inside.py [base]
"""
import sys
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "cle-vallee/"
bad = 0


def check(name, ok, info=""):
    global bad
    print(("ok  " if ok else "BAD ") + name + (f"  ({info})" if info and not ok else ""))
    bad += not ok


STATE = """() => { const i = demo.inside; return { active: i.active, beat: i.room && i.room.beat, room: i.room && i.room.name,
  fx: i.focus && i.focus.x,
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
    br = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    def held(pg, tag, step, times):
        for at in times:
            pg.evaluate(f"demo.inside.hold = {at}"); pg.wait_for_timeout(900)
            p_ = pg.evaluate(PLACE)
            check(f"{tag} step {step} {at} s: the frame stays clear of the top bar and the story panel",
                  p_["top"] >= p_["barBottom"] - 2 and p_["bottom"] <= p_["storyTop"] + 2 and p_["left"] >= -2 and p_["right"] <= p_["W"] + 2, p_)
            b = p_["bubble"]
            check(f"{tag} step {step} {at} s: the speaker's bubble is between the top bar and the story panel",
                  bool(b) and b["top"] >= p_["barBottom"] - 2 and b["bottom"] <= p_["storyTop"] + 2, p_)
        pg.evaluate("demo.inside.hold = undefined")

    for size in [(1440, 860), (390, 844)]:
        tag = f"{size[0]}px"
        pg = br.new_page(viewport={"width": size[0], "height": size[1]}, is_mobile=size[0] < 900, has_touch=size[0] < 900)
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        # ---- Bob's keep: steps 4 and 5 (r363)
        pg.goto(BASE + "?instant=1&lang=fr&bob=1#story=3"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.add_style_tag(content=".bubble { transition: opacity .35s !important; }")
        pg.wait_for_timeout(500)
        check(f"{tag} step 3 is in the valley", not pg.evaluate(STATE)["active"])
        pg.evaluate("demo.story.go(3)")
        pg.wait_for_function("demo.inside.active && demo.inside.room.beat === 'padlock'", timeout=20000)
        pg.wait_for_function("(() => { const b = document.querySelector('.bubble.show'); return b && b.style.transform && b.style.visibility === 'visible'; })()", timeout=20000)
        s = pg.evaluate(STATE)
        check(f"{tag} step 4 is the RSA room, one zoom in by Bob's window", s["ins"] == 1 and s["room"] == "rsa" and s["fx"] > 0, s)
        held(pg, tag, 4, [1, 2.2, 4, 6, 6.6, 8, 10, 11.3, 13.8])
        toy = pg.evaluate("""() => { const B = demo.inside.room.machine.tiles.big; return Object.fromEntries(Object.entries(B).map(([k, m]) => [k, m.userData.n])); }""")
        check(f"{tag} step 4: 5 x 11 = 55, e = 3, d = 27, 7 locks to 13 and opens to 7",
              toy == {"p": "5", "q": "11", "n": "55", "e": "3", "d": "27", "m": "7", "c": "13", "back": "7"}, toy)
        pg.evaluate("demo.story.go(4)")
        pg.wait_for_function("demo.inside.room && demo.inside.room.beat === 'rsa2048'", timeout=20000)
        s = pg.evaluate(STATE)
        check(f"{tag} step 5 is the next beat of the same room, no second zoom", s["ins"] == 1 and s["room"] == "rsa", s)
        held(pg, tag, 5, [1, 2.8, 5, 8, 9.4, 12])
        same = pg.evaluate("""() => { const hx = b => b.toString(16).padStart(2, '0'), N = demo.inside.room.machine.tiles.N;
          const card = [...document.querySelectorAll('#card .hex.key')].map(e => e.textContent.trim());
          const row = r => N.slice(r * 16, r * 16 + 16).map(m => hx(m.userData.b)).join(' ');
          return { ok: N.length === 256 && card.length >= 4 && [0, 1, 2, 3].every(r => row(r) === card[r]), card, w: row(0) }; }""")
        check(f"{tag} step 5: the n wall is the card's n, 256 bytes", same["ok"], same)
        pg.evaluate("demo.story.go(5)"); pg.wait_for_function("!demo.inside.active", timeout=20000)
        s = pg.evaluate(STATE)
        check(f"{tag} step 6 'deliver' comes out of Bob's keep", s["outs"] == 1 and s["ins"] == 1, s)
        pg.evaluate("demo.story.go(4)"); pg.wait_for_function("demo.inside.active", timeout=20000)
        s = pg.evaluate(STATE)
        check(f"{tag} Back into step 5 zooms in again", s["ins"] == 2 and s["beat"] == "rsa2048", s)
        pg.evaluate("demo.story.go(6)"); pg.wait_for_function("demo.inside.active && demo.inside.room.name === 'oaep'", timeout=20000)
        s = pg.evaluate(STATE)
        check(f"{tag} a jump from step 5 to step 7 lands in Alice's room, by her window", s["beat"] == "close" and s["fx"] < 0, s)

        # ---- Alice's keep: step 7
        pg.goto(BASE + "?instant=1&lang=fr#story=6"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.add_style_tag(content=".bubble { transition: opacity .35s !important; }")   # where a bubble goes, not its glide (as bubble_room.py)
        pg.wait_for_timeout(500)
        check(f"{tag} step 6 is in the valley", not pg.evaluate(STATE)["active"])
        pg.evaluate("demo.story.go(6)")
        pg.wait_for_function("demo.inside.active && demo.inside.room.beat === 'close'", timeout=20000)
        # SwiftShader draws a few frames a second: wait until the bubble has been placed once
        pg.wait_for_function("(() => { const b = document.querySelector('.bubble.show'); return b && b.style.transform && b.style.visibility === 'visible'; })()", timeout=20000)
        s = pg.evaluate(STATE)
        check(f"{tag} step 7 is the beat 'close', one zoom in", s["ins"] == 1, s)
        # every framing of the beat: the keys, the zeros, the seed, the masks, EM, the box, c
        for at in [1, 3, 6, 8, 10.5, 12, 14, 16.5, 19]:
            pg.evaluate(f"demo.inside.hold = {at}"); pg.wait_for_timeout(900)
            p_ = pg.evaluate(PLACE)
            check(f"{tag} {at} s: the frame stays clear of the top bar and the story panel",
                  p_["top"] >= p_["barBottom"] - 2 and p_["bottom"] <= p_["storyTop"] + 2 and p_["left"] >= -2 and p_["right"] <= p_["W"] + 2, p_)
            b = p_["bubble"]
            check(f"{tag} {at} s: the speaker's bubble is between the top bar and the story panel",
                  bool(b) and b["top"] >= p_["barBottom"] - 2 and b["bottom"] <= p_["storyTop"] + 2, p_)
        same = pg.evaluate("""() => { const hx = b => b.toString(16).padStart(2, '0'), T = demo.inside.room.machine.tiles;
          const rows = sel => [...document.querySelectorAll(sel)].map(e => e.textContent.trim());
          const iv = rows('#card .hex.iv'), ct = rows('#card .hex.ct');   // the card: seed (2 rows), EM (2 rows); c (2 rows)
          const row = (list, r) => list.slice(r * 16, r * 16 + 16).map(m => hx(m.userData.b)).join(' ');
          return { em: row(T.W, 0) === iv[2] && row(T.W, 1) === iv[3], c: row(T.C, 0) === ct[0] && row(T.C, 1) === ct[1], iv, ct, w: row(T.W, 0) }; }""")
        check(f"{tag} step 7: the wall ends as the card's EM", same["em"], same)
        check(f"{tag} step 7: the c tiles are the card's c", same["c"], same)
        pg.evaluate("demo.inside.hold = undefined")
        pg.evaluate("demo.story.go(7)"); pg.wait_for_function("!demo.inside.active", timeout=20000)
        s = pg.evaluate(STATE)
        check(f"{tag} step 8 'seed' comes out of the keep", s["outs"] == 1 and s["ins"] == 1, s)
        pg.evaluate("demo.story.go(6)"); pg.wait_for_function("demo.inside.active", timeout=20000)
        s = pg.evaluate(STATE)
        check(f"{tag} Back into step 7 zooms in again", s["ins"] == 2 and s["beat"] == "close", s)
        pg.click("#lang button[data-lang=en]"); pg.wait_for_timeout(600)
        s = pg.evaluate(STATE)
        check(f"{tag} switching to English inside rebuilds the room on the English packets", s["active"] and s["order"] == "ATTACK AT 6AM TOMORROW", s)
        pg.goto(BASE + "?instant=1&lang=fr&direct=1#story=7")   # another query: a new page, not a hash change
        pg.wait_for_function("window.demo && window.demo.ready && demo.inside.active", timeout=60000)
        check(f"{tag} #story=7 straight in enters the room", pg.evaluate(STATE)["beat"] == "close")
        check(f"{tag} no page errors", not errors, errors)
        pg.close()
    br.close()
print("all ok" if not bad else f"{bad} BAD")
sys.exit(1 if bad else 0)
