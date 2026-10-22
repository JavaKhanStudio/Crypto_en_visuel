#!/usr/bin/env python3
"""r324: story, sandbox and quiz of an episode at 390 and 1440 px, the live site on the left and a
served tree on the right, one sheet per episode, so a change that must not move the page is seen
not to (tools/topbar_compare.py does the same for the top bar alone).
    tools/panel_compare.py [--here http://localhost:8793/] scytale pingouin deux-generaux
    # -> tools/out/panels/<ep>.png
"""
import subprocess, sys
from pathlib import Path
from PIL import Image
LIVE, OUT = "https://javakhanstudio.github.io/Crypto_en_visuel/", Path("tools/out/panels")
OUT.mkdir(parents=True, exist_ok=True)
args, HERE = sys.argv[1:], "http://localhost:8793/"
if args[:1] == ["--here"]: HERE, args = args[1], args[2:]
for ep in args:
    rows = []
    for size in ["390x844", "1440x900"]:
        for mode in ["", "#sandbox", "#quiz"]:
            pair = []
            for side, base in [("live", LIVE), ("here", HERE)]:
                out = OUT / f"{ep}-{size}-{mode[1:] or 'story'}-{side}"
                subprocess.run([sys.executable, "tools/shoot.py", str(out), "--base", base, "--page", f"{ep}/", "--hash", mode,
                                "--query", "?instant=1&quality=normal", "--size", size, "--wait", "2500"], check=True)
                im = Image.open(f"{out}.png").convert("RGB")
                pair.append(im if size.startswith("390") else im.resize((im.width // 2, im.height // 2)))
            rows.append(pair)
    w = max(p[0].width for p in rows) * 2 + 12
    sheet = Image.new("RGB", (w, sum(p[0].height for p in rows) + 12 * len(rows)), (40, 40, 40))
    y = 0
    for a, b in rows:
        sheet.paste(a, (0, y)); sheet.paste(b, (a.width + 12, y)); y += a.height + 12
    sheet.save(OUT / f"{ep}.png"); print(OUT / f"{ep}.png")
