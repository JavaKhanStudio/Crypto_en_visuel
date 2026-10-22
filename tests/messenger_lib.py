#!/usr/bin/env python3
"""r323, r423: lib/messenger.js reads the cast's COLORS and Eve's CITY from the saga's one valley,
lib/saga/world.js, and keeps no copy of them; no saga episode keeps a js/world.js or js/camera.js of its own.
    python3 tests/messenger_lib.py"""
import re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SAGA = "deux-generaux eve-lit-tout octet-change cle-vallee paquet-complet encore-des-tours".split()
msg = (ROOT / "lib/messenger.js").read_text()
checks = [("lib/messenger.js imports COLORS and CITY from ./saga/world.js",
           re.search(r"import \{ COLORS, CITY \} from './saga/world\.js';", msg) is not None),
          ("lib/messenger.js declares no COLORS or CITY of its own",
           re.search(r"^(?:export )?const (COLORS|CITY) =", msg, re.M) is None),
          ("lib/saga/world.js exports COLORS and CITY",
           all(re.search(rf"^export const {n} =", (ROOT / "lib/saga/world.js").read_text(), re.M) for n in ("COLORS", "CITY")))]
for ep in SAGA:
    for f in ("world.js", "camera.js", "castles.js"):
        checks.append((f"{ep}/js/{f} gone (lib/saga/{f})", not (ROOT / ep / "js" / f).exists()))
bad = 0
for what, ok in checks:
    print(("ok   " if ok else "BAD  ") + what); bad += not ok
print("all ok" if not bad else f"{bad} failed"); raise SystemExit(bad > 0)
