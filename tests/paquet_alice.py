#!/usr/bin/env python3
"""Episode 1.5's steps 2-5 ('draw', 'encrypt', 'seal', 'lock') happen inside ALICE's keep (r369): one
room, four beats, her four moves on the story's packet. Checks, desktop and phone: step 1 is in the
valley; step 2 zooms in once, through Alice's window; steps 3-5 are beats of the same room (no new
zoom); the frame and Alice's bubble sit in the free band at every held second (demo.inside.hold);
each beat's tiles are the card's bytes (the draws; the order padded and the ciphertext; the seal; the
64 key bytes and the 256 locked) and its output is all shown at the beat's end, with the packet's
bricks made so far; step 6 comes out; Back into step 5 zooms in again; English inside rebuilds the
room on the English packet; #story=5 straight in enters with the moves before it done; no page errors.
Serve the repo first (python3 -m http.server 8793).

    python3 tests/paquet_alice.py [base]
"""
import sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "paquet-complet/"
bad = 0


def check(name, ok, info=""):
    global bad
    print(("ok  " if ok else "BAD ") + name + (f"  ({info})" if info and not ok else ""))
    bad += not ok


STATE = """() => { const i = demo.inside; return { active: i.active, beat: i.room && i.room.beat, name: i.room && i.room.name,
  ins: i.log.filter(x => x[0] === 'in').length, outs: i.log.filter(x => x[0] === 'out').length,
  focusX: i.focus && i.focus.x, order: i.room && i.room.send.s.order }; }"""
PLACE = """() => { const i = demo.inside, cam = i.camera, box = i.want.box;
  const W = innerWidth, H = innerHeight, px = p => { const v = p.clone().project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
  const V = demo.THREE.Vector3, c = [px(new V(box.min.x, box.min.y, 0)), px(new V(box.max.x, box.max.y, 0))];
  const story = document.getElementById('story').getBoundingClientRect(), bar = document.getElementById('topbar').getBoundingClientRect();
  const bub = document.querySelector('.bubble.show'), br = bub && bub.getBoundingClientRect();
  return { left: c[0][0], right: c[1][0], top: c[1][1], bottom: c[0][1], storyTop: story.top, barBottom: bar.bottom, W, fallback: i.band().h >= H - 1,
           bubble: br && { top: br.top, bottom: br.bottom } }; }"""
# the room's tiles against the card's rows, and what is shown at the beat's end
BYTES = """(beat) => { const hx = b => b.toString(16).padStart(2, '0'), T = demo.inside.room.machine.tiles;
  const rows = sel => [...document.querySelectorAll('#card ' + sel)].map(e => e.textContent.trim().replace(/\\s+/g, ' '));
  const hexRows = list => { const out = []; for (let r = 0; r < list.length; r += 16) out.push(list.slice(r, r + 16).map(x => hx(x.userData.b)).join(' ')); return out; };
  const all = list => list.every(m => m.visible);
  const want = { draw: [['.hex.key', 'key'], ['.hex.mac', 'macKey'], ['.hex.iv', 'iv']], encrypt: [['.hex.plain', 'plain'], ['.hex.ct', 'ct']],
                 seal: [['.hex.seal', 'tag']], lock: [['.hex.key:not(.arrow)', 'keys']] }[beat];
  const pairs = want.map(([sel, k]) => [k, rows(sel).slice(0, T[k].length / 16), hexRows(T[k])]);
  if (beat === 'lock') pairs.push(['ek', rows('.hex.key:not(.arrow)').slice(4, 6), hexRows(T.ek).slice(0, 2)]);
  const out = { draw: ['key', 'macKey', 'iv'], encrypt: ['ct'], seal: ['tag'], lock: ['ek'] }[beat];
  return { pairs, shown: out.every(k => all(T[k])) }; }"""
BRICKS = {"draw": 1, "encrypt": 2, "seal": 3, "lock": 4}
HOLDS = {"draw": [.6, 1.8, 3, 4.5, 5.8], "encrypt": [.6, 2, 3, 4.5, 6, 7.5, 9.8], "seal": [.6, 1.8, 3, 4.5, 6, 7.5, 8.8],
         "lock": [.6, 1.8, 3, 4.5, 6, 7.5, 9, 10.4]}

with sync_playwright() as p:
    br = launch(p)
    for size in [(1440, 860), (390, 844)]:
        tag = f"{size[0]}px"
        pg = br.new_page(viewport={"width": size[0], "height": size[1]}, is_mobile=size[0] < 900, has_touch=size[0] < 900)
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(BASE + "?instant=1&lang=fr#story=1"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.add_style_tag(content=".bubble { transition: opacity .35s !important; }")
        pg.wait_for_timeout(500)
        check(f"{tag}: step 1 is in the valley", not pg.evaluate(STATE)["active"])
        for n, beat in enumerate(["draw", "encrypt", "seal", "lock"], start=2):
            pg.evaluate(f"demo.story.go({n - 1})")
            pg.wait_for_function(f"demo.inside.active && demo.inside.room.beat === '{beat}'", timeout=20000)
            pg.wait_for_function("(() => { const b = document.querySelector('.bubble.show'); return b && b.style.transform && b.style.visibility === 'visible'; })()", timeout=20000)
            s = pg.evaluate(STATE)
            check(f"{tag} step {n} is the beat '{beat}' of Alice's room, one zoom in all four steps, through her window",
                  s["name"] == "alice" and s["ins"] == 1 and s["outs"] == 0 and s["focusX"] < 0, s)
            for at in HOLDS[beat]:
                pg.evaluate(f"demo.inside.hold = {at}"); pg.wait_for_timeout(900)
                q = pg.evaluate(PLACE)
                if q["fallback"]:
                    check(f"{tag} step {n} {at} s: the step's text leaves a band (folded on a phone, r368)", False, q); continue
                check(f"{tag} step {n} {at} s: the frame stays clear of the top bar and the story panel",
                      q["top"] >= q["barBottom"] - 2 and q["bottom"] <= q["storyTop"] + 2 and q["left"] >= -2 and q["right"] <= q["W"] + 2, q)
                b = q["bubble"]
                check(f"{tag} step {n} {at} s: Alice's bubble is between the top bar and the story panel",
                      bool(b) and b["top"] >= q["barBottom"] - 2 and b["bottom"] <= q["storyTop"] + 2, q)
            t = pg.evaluate(BYTES, beat)
            for k, card, room in t["pairs"]:
                check(f"{tag} step {n}: the room's {k} tiles are the card's bytes", card == room and len(card) > 0, (card, room))
            check(f"{tag} step {n}: at the beat's end its output is all shown", t["shown"], t)
            bricks = pg.evaluate("Object.values(demo.inside.room.scene.children.find(o => o.userData.parts).userData.parts).filter(o => o.visible).length")
            check(f"{tag} step {n}: the packet has {BRICKS[beat]} brick(s)", bricks == BRICKS[beat], bricks)
            pg.evaluate("demo.inside.hold = undefined")
        pg.evaluate("demo.story.go(5)"); pg.wait_for_function("!demo.inside.active", timeout=20000)
        s = pg.evaluate(STATE)
        check(f"{tag}: step 6 comes out of the keep", s["outs"] == 1 and s["ins"] == 1, s)
        pg.evaluate("demo.story.go(4)"); pg.wait_for_function("demo.inside.active", timeout=20000)
        s = pg.evaluate(STATE)
        check(f"{tag}: Back into step 5 zooms in again", s["ins"] == 2 and s["beat"] == "lock", s)
        pg.click("#lang button[data-lang=en]"); pg.wait_for_timeout(600)
        s = pg.evaluate(STATE)
        check(f"{tag}: English inside rebuilds the room on the English packet", s["active"] and s["order"] == "ATTACK AT 6AM TOMORROW", s)
        t = pg.evaluate(BYTES, "lock")
        check(f"{tag}: in English the key tiles are the card's", all(c == r for _, c, r in t["pairs"]), t)
        pg.goto(BASE + "?instant=1&lang=fr&direct=1#story=5")
        pg.wait_for_function("window.demo && window.demo.ready && demo.inside.active", timeout=60000)
        pg.wait_for_timeout(800)
        t = pg.evaluate(BYTES, "lock"); s = pg.evaluate(STATE)
        shown = pg.evaluate("['ct', 'tag', 'iv'].every(k => demo.inside.room.machine.tiles[k].every(m => m.visible))")
        check(f"{tag}: #story=5 straight in enters with the moves before it done", s["beat"] == "lock" and t["shown"] and shown, (s, shown))
        check(f"{tag}: no page errors", not errors, errors)
        pg.close()
    br.close()
print("all ok" if not bad else f"{bad} BAD")
sys.exit(1 if bad else 0)
