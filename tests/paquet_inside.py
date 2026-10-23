#!/usr/bin/env python3
"""Episode 1.5's steps 7 ('open') and 10 ('why') happen inside Bob's keep (r103, r161, copied from
tests/cle_inside.py): each zooms in ONCE, a room where Bob opens the keys with RSA, checks the seal
with HMAC and only then decrypts with AES-CBC (step 7, Alice's packet), or stops at the wrong seal and
then shows what decrypting first would have run through AES (step 10, Eve's packet); each comes out
at the next step. Checks, desktop and phone: the step before is in the valley, the step zooms in once,
the frame and the speaker's bubble sit in the free band at every held second (the room's clock held,
demo.inside.hold); the tiles are the card's bytes (the 64 key bytes, Bob's seal, the order; on 'why'
what AES gives of Eve's bytes); the next step comes out, Back zooms in again, a language switch inside
rebuilds the room in English, #story=N straight into it enters; no page errors.
On a phone the step's text is folded to 3 lines inside a room (r368); should a text still leave no band
(under a fifth of the screen, Inside.band() falls back to the whole screen), the frame checks are
reported as skipped, never as ok.
Serve the repo first (python3 -m http.server 8793).

    python3 tests/paquet_inside.py [base]
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


STATE = """() => { const i = demo.inside; return { active: i.active, beat: i.room && i.room.beat,
  ins: i.log.filter(x => x[0] === 'in').length, outs: i.log.filter(x => x[0] === 'out').length,
  order: i.room && i.room.send.s.order }; }"""
PLACE = """() => { const i = demo.inside, cam = i.camera, b = i.want.b, box = i.want.box;
  const W = innerWidth, H = innerHeight, px = p => { const v = p.clone().project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
  const V = demo.THREE.Vector3, c = [px(new V(box.min.x, box.min.y, 0)), px(new V(box.max.x, box.max.y, 0))];
  const story = document.getElementById('story').getBoundingClientRect(), bar = document.getElementById('topbar').getBoundingClientRect();
  const bub = document.querySelector('.bubble.show'), br = bub && bub.getBoundingClientRect();
  return { left: c[0][0], right: c[1][0], top: c[1][1], bottom: c[0][1], storyTop: story.top, barBottom: bar.bottom, W, fallback: i.band().h >= H - 1,
           bubble: br && { top: br.top, bottom: br.bottom, left: br.left, right: br.right } }; }"""
# the room's tiles against the card: step 7's card ('bob') shows the keys' first row, Bob's seal and the order;
# step 10's ('order') what Bob would have decrypted first
BYTES = """() => { const hx = b => b.toString(16).padStart(2, '0'), m = demo.inside.room.machine, T = m.tiles;
  const rows = sel => [...document.querySelectorAll(sel)].map(e => e.textContent.trim());
  const row = (list, r) => list.slice(r * 16, r * 16 + 16).map(x => hx(x.userData.b)).join(' ');
  const text = list => new TextDecoder().decode(Uint8Array.from(list.map(x => x.userData.b)));
  const pad = T.out[T.out.length - 1].userData.b, order = text(T.out.slice(0, T.out.length - pad));
  const printable = s => [...s].map(ch => ch >= ' ' && ch <= '~' ? ch : '·').join('');
  const lateTxt = [...T.out.slice(0, T.out.length - pad)].map(x => x.userData.b >= 32 && x.userData.b < 127 ? String.fromCharCode(x.userData.b) : '·').join('');
  return { key: rows('#card .hex.key')[0], keys0: row(T.keys, 0), seal: rows('#card .hex.seal'), mine: [row(T.mine, 0), row(T.mine, 1)],
           order, cardOrder: (document.querySelector('#card .order:not(.bad)') || {}).textContent, late: lateTxt,
           cardLate: (document.querySelector('#card .order.bad') || {}).textContent }; }"""

STEPS = [  # (step, beat, the seconds to hold, the step after)
    (7, "open", [1, 3.5, 6, 8, 9.5, 12, 14.5, 16, 19, 21.6]),
    (10, "why", [1, 6, 9.5, 12, 14.5, 16, 18, 20, 22.5, 24.4]),
]

with sync_playwright() as p:
    br = launch(p)
    for size in [(1440, 860), (390, 844)]:
        for n, beat, holds in STEPS:
            tag = f"{size[0]}px step {n}"
            pg = br.new_page(viewport={"width": size[0], "height": size[1]}, is_mobile=size[0] < 900, has_touch=size[0] < 900)
            errors = []
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.goto(BASE + f"?instant=1&lang=fr#story={n - 1}"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
            pg.add_style_tag(content=".bubble { transition: opacity .35s !important; }")
            pg.wait_for_timeout(500)
            check(f"{tag}: the step before is in the valley", not pg.evaluate(STATE)["active"])
            pg.evaluate(f"demo.story.go({n - 1})")
            pg.wait_for_function(f"demo.inside.active && demo.inside.room.beat === '{beat}'", timeout=20000)
            pg.wait_for_function("(() => { const b = document.querySelector('.bubble.show'); return b && b.style.transform && b.style.visibility === 'visible'; })()", timeout=20000)
            s = pg.evaluate(STATE)
            check(f"{tag} is the beat '{beat}', one zoom in", s["ins"] == 1, s)
            for at in holds:
                pg.evaluate(f"demo.inside.hold = {at}"); pg.wait_for_timeout(900)
                q = pg.evaluate(PLACE)
                if q["fallback"]:
                    print(f"SKIP {tag} {at} s: the step's text leaves no band on this screen (r161's follow-up)")
                    continue
                check(f"{tag} {at} s: the frame stays clear of the top bar and the story panel",
                      q["top"] >= q["barBottom"] - 2 and q["bottom"] <= q["storyTop"] + 2 and q["left"] >= -2 and q["right"] <= q["W"] + 2, q)
                b = q["bubble"]
                check(f"{tag} {at} s: the speaker's bubble is between the top bar and the story panel",
                      bool(b) and b["top"] >= q["barBottom"] - 2 and b["bottom"] <= q["storyTop"] + 2, q)
            t = pg.evaluate(BYTES)
            if beat == "open":
                check(f"{tag}: the key tiles are the card's 64 bytes (first row)", t["keys0"] == t["key"], t)
                check(f"{tag}: Bob's seal is the card's", t["mine"] == t["seal"], t)
                check(f"{tag}: the plaintext tiles are the card's order", t["order"] == t["cardOrder"], t)
            else:
                check(f"{tag}: what AES gives of Eve's bytes is the card's", t["late"] == t["cardLate"], t)
            pg.evaluate("demo.inside.hold = undefined")
            pg.evaluate(f"demo.story.go({n})"); pg.wait_for_function("!demo.inside.active", timeout=20000)
            s = pg.evaluate(STATE)
            check(f"{tag}: step {n + 1} comes out of the keep", s["outs"] == 1 and s["ins"] == 1, s)
            pg.evaluate(f"demo.story.go({n - 1})"); pg.wait_for_function("demo.inside.active", timeout=20000)
            s = pg.evaluate(STATE)
            check(f"{tag}: Back into step {n} zooms in again", s["ins"] == 2 and s["beat"] == beat, s)
            pg.evaluate("document.querySelector('#lang button[data-lang=en]').click()"); pg.wait_for_timeout(600)   # a DOM click: the top bar may have slid out of view (lib/topbar.js, r406)
            s = pg.evaluate(STATE)
            check(f"{tag}: English inside rebuilds the room on the English packet", s["active"] and s["order"] == "ATTACK AT 6AM TOMORROW", s)
            t = pg.evaluate(BYTES)
            if beat == "open": check(f"{tag}: in English the plaintext tiles are the card's order", t["order"] == t["cardOrder"], t)
            else: check(f"{tag}: in English what AES gives is the card's", t["late"] == t["cardLate"], t)
            pg.goto(BASE + f"?instant=1&lang=fr&direct=1#story={n}")
            pg.wait_for_function("window.demo && window.demo.ready && demo.inside.active", timeout=60000)
            check(f"{tag}: #story={n} straight in enters the room", pg.evaluate(STATE)["beat"] == beat)
            check(f"{tag}: no page errors", not errors, errors)
            pg.close()
    br.close()
print("all ok" if not bad else f"{bad} BAD")
sys.exit(1 if bad else 0)
