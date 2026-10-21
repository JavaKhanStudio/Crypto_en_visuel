#!/usr/bin/env python3
"""Episode 1.6's chapters 2 and 4 happen inside the keeps (r103, r162, after tests/cle_inside.py):
step 5 'sign' zooms into Alice's keep (SHA-256, PSS, RSA with her private key), step 6 'verify' CUTS
through to Bob's (his check with her public key), step 7 comes out of Bob's window; step 11 'gcm'
zooms into Alice's keep again (AES-GCM), step 12 'gcmEve' cuts to Bob's (InvalidTag), step 13 comes
out. Checks, desktop and phone: one zoom per chapter and one cut; the frame and the speaker's bubble
sit in the free band at every moment that moves the frame (the room's clock held there), except on a
phone where the step's text leaves less than a fifth of the screen (SKIP: Simon's call on r368);
the room's bytes are the card's (the block, the signature, the two digests, the GCM ciphertext and
tag, Bob's tag); Back from step 13 zooms into Bob's keep; a language switch inside rebuilds the room
on the English packets; #story=6 straight in enters Bob's keep; no page errors. Serve the repo first
(python3 -m http.server 8793).

    python3 tests/tours_inside.py [base]
"""
import sys
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "encore-des-tours/"
bad = 0


def check(name, ok, info=""):
    global bad
    print(("ok  " if ok else "BAD ") + name + (f"  ({info})" if info and not ok else ""))
    bad += not ok


STATE = """() => { const i = demo.inside, n = k => i.log.filter(x => x[0] === k).length;
  return { active: i.active, beat: i.room && i.room.beat, door: i.room && i.room.door, ins: n('in'), cuts: n('cut'), outs: n('out'),
    order: i.room && i.room.send.g.order }; }"""
# where the frame and the bubble land on screen, against the band the room must keep to
PLACE = """() => { const i = demo.inside, cam = i.camera, b = i.want.b, box = i.want.box;
  const W = innerWidth, H = innerHeight, px = p => { const v = p.clone().project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
  const V = demo.THREE.Vector3, c = [px(new V(box.min.x, box.min.y, 0)), px(new V(box.max.x, box.max.y, 0))];
  const story = document.getElementById('story').getBoundingClientRect(), bar = document.getElementById('topbar').getBoundingClientRect();
  const bub = document.querySelector('.bubble.show'), br = bub && bub.getBoundingClientRect();
  return { left: c[0][0], right: c[1][0], top: c[1][1], bottom: c[0][1], storyTop: story.top, barBottom: bar.bottom, W, H, full: i.band().h >= H - 1,
           bubble: br && { top: br.top, bottom: br.bottom, left: br.left, right: br.right } }; }"""
# the room's tiles against the card's rows (hex, 16 to a row)
BYTES = """(sel) => { const hx = b => b.toString(16).padStart(2, '0'), T = demo.inside.room.machine.tiles;
  const rows = s => [...document.querySelectorAll(s)].map(e => e.textContent.trim().replace(/\\s+/g, ' '));
  const row = (B, r) => B.tiles.slice(r * 16, r * 16 + 16).map(m => hx(m.userData.b)).join(' ');
  return { card: { plain: rows('#card .hex.plain'), sig: rows('#card .hex.sig'), ct: rows('#card .hex.ct'), seal: rows('#card .hex.seal') },
           room: Object.fromEntries(Object.entries(T).map(([k, B]) => [k, [0, 1, 15].map(r => row(B, r))])) }; }"""
BEATS = {5: ("sign", "a", [1, 3, 5, 7, 9, 10.8, 12.2, 15, 17, 18.5, 20, 23]),
         6: ("verify", "b", [1, 3, 5, 7, 9, 10.5, 12, 13.6, 15, 17, 19, 21.5]),
         11: ("gcm", "a", [1, 2.4, 4, 6, 8, 10, 11, 12.5, 14.2, 15.5, 17.6]),
         12: ("gcmEve", "b", [1, 4, 6, 7.6, 8.6, 10.6, 12, 13.6])}


def held(pg, tag, step):
    beat, _, times = BEATS[step]
    for at in times:
        pg.evaluate(f"demo.inside.hold = {at}"); pg.wait_for_timeout(900)
        p_ = pg.evaluate(PLACE)
        if p_["full"]:
            print(f"SKIP {tag} step {step} {at} s: the step's text leaves the room under a fifth of the screen (r368)")
            return
        check(f"{tag} step {step} {at} s: the frame stays clear of the top bar and the story panel",
              p_["top"] >= p_["barBottom"] - 2 and p_["bottom"] <= p_["storyTop"] + 2 and p_["left"] >= -2 and p_["right"] <= p_["W"] + 2, p_)
        b = p_["bubble"]
        check(f"{tag} step {step} {at} s: the speaker's bubble is between the top bar and the story panel",
              bool(b) and b["top"] >= p_["barBottom"] - 2 and b["bottom"] <= p_["storyTop"] + 2, p_)
    pg.evaluate("demo.inside.hold = undefined")


def go(pg, i, cond):
    pg.evaluate(f"demo.story.go({i})"); pg.wait_for_function(cond, timeout=30000)
    # SwiftShader draws a few frames a second: wait until the bubble has been placed once
    pg.wait_for_function("(() => { const b = document.querySelector('.bubble.show'); return !demo.inside.active || (b && b.style.transform && b.style.visibility === 'visible'); })()", timeout=20000)


with sync_playwright() as p:
    br = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    for size in [(1440, 860), (390, 844)]:
        tag = f"{size[0]}px"
        pg = br.new_page(viewport={"width": size[0], "height": size[1]}, is_mobile=size[0] < 900, has_touch=size[0] < 900)
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(BASE + "?instant=1&lang=fr#story=4"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.add_style_tag(content=".bubble { transition: opacity .35s !important; }")   # where a bubble goes, not its glide (as bubble_room.py)
        pg.wait_for_timeout(500)
        check(f"{tag} step 4 is in the valley", not pg.evaluate(STATE)["active"])
        # chapter 2: Alice's keep, then Bob's, then out
        go(pg, 4, "demo.inside.active && demo.inside.room.beat === 'sign'")
        s = pg.evaluate(STATE)
        check(f"{tag} step 5 zooms into Alice's keep once", s["ins"] == 1 and s["door"] == "a", s)
        held(pg, tag, 5)
        pg.evaluate("demo.inside.hold = 30"); pg.wait_for_timeout(600)
        d = pg.evaluate(BYTES)
        check(f"{tag} step 5: the PSS block is the card's", d["room"]["em"][0] == d["card"]["plain"][2], d)
        check(f"{tag} step 5: the signature is the card's", d["room"]["sig"][:2] == d["card"]["sig"][:2], d)
        check(f"{tag} step 5: the digest is the card's", d["room"]["digest"][:2] == d["card"]["plain"][:2], d)
        pg.evaluate("demo.inside.hold = undefined")
        go(pg, 5, "demo.inside.active && demo.inside.room.beat === 'verify'")
        s = pg.evaluate(STATE)
        check(f"{tag} step 6 cuts through to Bob's keep, no second zoom", s["ins"] == 1 and s["cuts"] == 1 and s["door"] == "b", s)
        held(pg, tag, 6)
        pg.evaluate("demo.inside.hold = 30"); pg.wait_for_timeout(600)
        d = pg.evaluate(BYTES)
        check(f"{tag} step 6: the digest the block carries is the card's", d["room"]["hIn"][:2] == d["card"]["plain"][1:3], d)
        check(f"{tag} step 6: the one Bob recomputes is the card's, the same", d["room"]["hMine"][:2] == d["card"]["plain"][3:5] == d["card"]["plain"][1:3], d)
        pg.evaluate("demo.inside.hold = undefined")
        go(pg, 6, "!demo.inside.active")
        s = pg.evaluate(STATE)
        check(f"{tag} step 7 comes out of Bob's keep", s["outs"] == 1, s)
        # chapter 4
        go(pg, 10, "demo.inside.active && demo.inside.room.beat === 'gcm'")
        s = pg.evaluate(STATE)
        check(f"{tag} step 11 zooms into Alice's keep", s["ins"] == 2 and s["door"] == "a", s)
        held(pg, tag, 11)
        pg.evaluate("demo.inside.hold = 30"); pg.wait_for_timeout(600)
        d = pg.evaluate(BYTES)
        check(f"{tag} step 11: the GCM ciphertext is the card's", d["room"]["ct"][:2] == d["card"]["ct"][:2], d)
        check(f"{tag} step 11: the tag is the card's", d["room"]["tag"][0] == d["card"]["seal"][0], d)
        pg.evaluate("demo.inside.hold = undefined")
        go(pg, 11, "demo.inside.active && demo.inside.room.beat === 'gcmEve'")
        s = pg.evaluate(STATE)
        check(f"{tag} step 12 cuts through to Bob's keep", s["ins"] == 2 and s["cuts"] == 2 and s["door"] == "b", s)
        held(pg, tag, 12)
        pg.evaluate("demo.inside.hold = 30"); pg.wait_for_timeout(600)
        d = pg.evaluate(BYTES)
        check(f"{tag} step 12: the ciphertext Bob got is the card's, Eve's byte in it", d["room"]["ct"][:2] == d["card"]["ct"][2:4], d)
        check(f"{tag} step 12: the tag Bob recomputes is the card's", d["room"]["mine"][0] == d["card"]["seal"][1], d)
        pg.evaluate("demo.inside.hold = undefined")
        go(pg, 12, "!demo.inside.active")
        go(pg, 11, "demo.inside.active")
        s = pg.evaluate(STATE)
        check(f"{tag} Back from step 13 zooms into Bob's keep", s["ins"] == 3 and s["door"] == "b" and s["beat"] == "gcmEve", s)
        pg.click("#lang button[data-lang=en]"); pg.wait_for_timeout(800)
        s = pg.evaluate(STATE)
        check(f"{tag} switching to English inside rebuilds the room on the English packets", s["active"] and s["order"] == "ATTACK AT 6AM TOMORROW", s)
        pg.goto(BASE + "?instant=1&lang=fr&direct=1#story=6")   # another query: a new page, not a hash change
        pg.wait_for_function("window.demo && window.demo.ready && demo.inside.active", timeout=60000)
        s = pg.evaluate(STATE)
        check(f"{tag} #story=6 straight in enters Bob's keep", s["beat"] == "verify" and s["door"] == "b", s)
        check(f"{tag} no page errors", not errors, errors)
        pg.close()
    br.close()
print("all ok" if not bad else f"{bad} BAD")
sys.exit(1 if bad else 0)
