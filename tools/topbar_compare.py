#!/usr/bin/env python3
"""r310: the top bar of an episode, the live site above, this checkout below, at 360 and 1440 px,
so a change that should not move the bar is seen not to. Serve the repo first (8793).
    tools/topbar_compare.py scytale pingouin   # -> tools/out/topbar/<ep>-<size>.png
    tools/topbar_compare.py --here http://localhost:8831/ scytale   # another tree than the checkout
"""
import subprocess, sys
from pathlib import Path
from PIL import Image
LIVE, OUT = "https://javakhanstudio.github.io/Crypto_en_visuel/", Path("tools/out/topbar")
OUT.mkdir(parents=True, exist_ok=True)
args, HERE = sys.argv[1:], "http://localhost:8793/"
if args[:1] == ["--here"]: HERE, args = args[1], args[2:]
for ep in args:
    for size in ["360x780", "1440x860"]:
        shots = []
        for side, base in [("live", LIVE), ("here", HERE)]:
            out = OUT / f"{ep}-{size}-{side}"
            subprocess.run([sys.executable, "tools/shoot.py", str(out), "--base", base, "--page", f"{ep}/",
                            "--query", "?instant=1&quality=normal", "--size", size, "--wait", "2500"], check=True)
            shots.append(Image.open(f"{out}.png").convert("RGB"))
        w, h = shots[0].width, 130
        pair = Image.new("RGB", (w, 2 * h)); pair.paste(shots[0].crop((0, 0, w, h)), (0, 0)); pair.paste(shots[1].crop((0, 0, w, h)), (0, h))
        pair.save(OUT / f"{ep}-{size}.png"); print(OUT / f"{ep}-{size}.png")
