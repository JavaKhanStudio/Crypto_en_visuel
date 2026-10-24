#!/usr/bin/env python3
"""r424: the keep-room engine is lib/room.js, once for the saga's rooms (1.2-1.6): no episode keeps a
class Inside, every main.js imports it, and the doors it reads from the castles (userData.doors,
lib/saga/castles.js hall and talan, r425) land in world space on the window that castle publishes (r525:
the old copies' hand-written keep windows no longer hold since the rooms moved to Middle-earth's castles); r485: no
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
                   "import { Inside } from '../../ficelle/lib/room.js';" in main and re.search(r"castles: \{ a: world\.castleA, b: world\.castleB \},(?: \w+,)* \.\.\.ROOM", main) is not None))   # options between (composer, r597)
    # r485: the parts of a room (tiles, words, the stone room) are lib/room-parts.js's
    left = re.findall(r"^(?:export )?(?:function (tileTex|face|tile|label|relabel|buildRoom)\b|const (side|BOX|faces|show|paint|glyph) =)", ins, re.M)
    checks.append((f"{ep}: no room part of its own (lib/room-parts.js){' — ' + str(left) if left else ''}", not left))
    checks.append((f"{ep}: imports lib/room-parts.js", "from '../../ficelle/lib/room-parts.js';" in ins))

# r525: every room's door lands on the window its castle publishes now (userData.doors of the castle
# actually built, r425's hall door and talan on Middle-earth's), put in world space here by the castle's
# own matrix, not by lib/room.js doorOf(); no castle is a keep any more, the old copies' numbers are gone
PROBE = """async () => {
  const d = window.demo, castles = { a: d.world.castleA, b: d.world.castleB }, flat = v => [v.x, v.y, v.z];
  const pub = door => {
    const [team, name = 'valley'] = door.split(':'), c = castles[team], w = c.userData.doors?.[name];
    if (!w) return null;
    c.updateWorldMatrix(true, false); const m = c.matrixWorld, at = p => flat(p.clone().applyMatrix4(m));
    return { focus: at(w.focus), normal: flat(w.normal.clone().transformDirection(m)), near: { pos: at(w.near.pos), target: at(w.near.target) } };
  };
  const now = door => { const x = d.inside.door(door); return { focus: flat(x.focus), normal: flat(x.normal), near: { pos: flat(x.near.pos), target: flat(x.near.target) } }; };
  const far = (u, w) => Array.isArray(w) ? Math.max(...w.map((x, i) => Math.abs(u[i] - x))) : Math.max(...Object.keys(w).map(k => far(u[k], w[k])));
  const rooms = Object.fromEntries(Object.entries(d.inside.rooms).map(([n, r]) => [n, r.door]));
  const doors = [...new Set(['a', 'b', ...Object.values(rooms)])], missing = doors.filter(x => !pub(x));
  return { gap: missing.length ? Infinity : Math.max(...doors.map(x => far(now(x), pub(x)))), missing, rooms,
           kind: [castles.a.userData.doors?.hall ? 'hall' : 'keep', castles.b.userData.doors?.talan ? 'talan' : 'keep'] };
}"""
with sync_playwright() as p:
    b = launch(p); pg = b.new_page(viewport={"width": 1440, "height": 900}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    for ep in ROOMS:
        errs.clear()
        pg.goto(f"{BASE}{ep}/?instant=1"); pg.wait_for_function("window.demo && window.demo.ready && window.demo.inside", timeout=60000)
        r = pg.evaluate(PROBE)
        checks.append((f"{ep}: every door on its castle's published window ({'/'.join(r['kind'])}, gap {r['gap']:.1e}"
                       f"{', missing ' + str(r['missing']) if r['missing'] else ''}), rooms {json.dumps(r['rooms'])}", r["gap"] < 1e-9))
        checks.append((f"{ep}: no page error {errs[:1]}", not errs))
    b.close()
bad = 0
for what, ok in checks:
    print(("ok   " if ok else "BAD  ") + what); bad += not ok
print("all ok" if not bad else f"{bad} failed"); raise SystemExit(bad > 0)
