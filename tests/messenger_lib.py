#!/usr/bin/env python3
"""r323: lib/messenger.js holds the two values it used to import from an episode's world.js, the
cast's COLORS and Eve's CITY; they must still be what each of the six saga episodes' world.js says.
    python3 tests/messenger_lib.py"""
import re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SAGA = "deux-generaux eve-lit-tout octet-change cle-vallee paquet-complet encore-des-tours".split()
grab = lambda t: [re.search(r"(?:export )?const COLORS = (\{[^}]*\});", t).group(1),
                  re.search(r"(?:export )?const CITY = (new THREE\.Vector3\([^)]*\));", t).group(1)]
lib = grab((ROOT / "lib/messenger.js").read_text())
bad = 0
for ep in SAGA:
    ok = grab((ROOT / ep / "js/world.js").read_text()) == lib
    print(("ok   " if ok else "BAD  ") + f"{ep}/js/world.js COLORS and CITY match lib/messenger.js"); bad += not ok
print("all ok" if not bad else f"{bad} failed"); raise SystemExit(bad > 0)
