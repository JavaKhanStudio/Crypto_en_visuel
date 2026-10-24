#!/usr/bin/env python3
"""Before | after of a room step's text-open half on a phone (r631): tools/fold_shot.py run on two served
trees, the open halves side by side, before on the left. Serve both trees first.

    tools/fold_pair.py out/r631/eve7 --before http://localhost:8832/ --after http://localhost:8831/ \\
        --page eve-lit-tout/ --step 7 [--lang en] [--size 390x844]
"""
import argparse, os, subprocess, sys
from PIL import Image
ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--before", required=True)
ap.add_argument("--after", required=True)
ap.add_argument("--page", required=True)
ap.add_argument("--step", required=True)
ap.add_argument("--lang", default="fr")
ap.add_argument("--size", default="390x844")
a = ap.parse_args()
shot = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fold_shot.py")
halves = []
for side, base in [("before", a.before), ("after", a.after)]:
    r = subprocess.run([sys.executable, shot, f"{a.out}-{side}", "--base", base, "--page", a.page,
                        "--step", a.step, "--lang", a.lang, "--size", a.size], capture_output=True, text=True)
    print(side, (r.stdout + r.stderr).strip().splitlines()[-1])
    halves.append(Image.open(f"{a.out}-{side}-open.png").convert("RGB"))
w, h = halves[0].size
sheet = Image.new("RGB", (2 * w + 8, h), (255, 255, 255))
for i, im in enumerate(halves): sheet.paste(im, (i * (w + 8), 0))
sheet.save(a.out + ".png")
print(a.out + ".png")
