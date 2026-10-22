#!/usr/bin/env python3
"""r424: the keep-room engine is lib/room.js, once for the saga's rooms (1.2-1.6): no episode keeps a
class Inside, every main.js imports it, and the doors it reads from the keep castles (userData.doors,
lib/saga/world.js keepDoors) land in world space where the five copies hard-coded them; r485: no
episode keeps a room part (tile, face, label, buildRoom...) of its own, all come from lib/room-parts.js.
    python3 tests/room_lib.py [base]      (base: a served repo, default http://localhost:8793/)"""
import re, sys, pathlib, json
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from playwright.sync_api import sync_playwright
from browser import launch

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/").rstrip("/") + "/"
ROOMS = "eve-lit-tout octet-change cle-vallee paquet-complet encore-des-tours".split()
checks = []
for ep in ROOMS:
    ins, main = (ROOT / ep / "js/inside.js").read_text(), (ROOT / ep / "js/main.js").read_text()
    checks.append((f"{ep}: no class Inside in js/inside.js", "class Inside" not in ins))
    checks.append((f"{ep}: no DOORS or keepWindow of its own", re.search(r"\b(DOORS|keepWindow)\b", ins) is None))
    checks.append((f"{ep}: main.js imports Inside from lib/room.js",
                   "import { Inside } from '../../lib/room.js';" in main and "castles: { a: world.castleA, b: world.castleB }, ...ROOM" in main))
    # r485: the parts of a room (tiles, words, the stone room) are lib/room-parts.js's
    left = re.findall(r"^(?:export )?(?:function (tileTex|face|tile|label|relabel|buildRoom)\b|const (side|BOX|faces|show|paint|glyph) =)", ins, re.M)
    checks.append((f"{ep}: no room part of its own (lib/room-parts.js){' — ' + str(left) if left else ''}", not left))
    checks.append((f"{ep}: imports lib/room-parts.js", "from '../../lib/room-parts.js';" in ins))

# the windows the five copies wrote by hand (eve-lit-tout DOORS.a, paquet-complet DOORS.b, cle-vallee keepWindow)
OLD = """(C, dx) => ({ focus: [C.x, C.y + 9, 0], normal: [0, 0, 1],
  near: { pos: [C.x + dx, C.y + 12.5, 16], target: [C.x, C.y + 9, 3.52] } })"""
PROBE = """async () => {
  const d = window.demo, old = %s, A = d.world.castleA.position, B = d.world.castleB.position;
  const flat = o => JSON.stringify(o, (k, x) => x && x.isVector3 ? [x.x, x.y, x.z] : x);
  const now = { a: d.inside.door('a'), b: d.inside.door('b') }, was = { a: old(A, 3), b: old(B, -3) };
  const far = (u, w) => typeof u === 'number' ? Math.abs(u - w) : Math.max(...Object.keys(w).map(k => far(u[k], w[k])));
  return { gap: Math.max(far(JSON.parse(flat(now.a)), was.a), far(JSON.parse(flat(now.b)), was.b)),
           rooms: Object.fromEntries(Object.entries(d.inside.rooms).map(([n, r]) => [n, r.door])) };
}""" % OLD
with sync_playwright() as p:
    b = launch(p); pg = b.new_page(viewport={"width": 1440, "height": 900}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    for ep in ROOMS:
        errs.clear()
        pg.goto(f"{BASE}{ep}/?instant=1"); pg.wait_for_function("window.demo && window.demo.ready && window.demo.inside", timeout=60000)
        r = pg.evaluate(PROBE)
        checks.append((f"{ep}: doors a and b where the copy had them (gap {r['gap']:.1e}), rooms {json.dumps(r['rooms'])}", r["gap"] < 1e-9))
        checks.append((f"{ep}: no page error {errs[:1]}", not errs))
    b.close()
bad = 0
for what, ok in checks:
    print(("ok   " if ok else "BAD  ") + what); bad += not ok
print("all ok" if not bad else f"{bad} failed"); raise SystemExit(bad > 0)
