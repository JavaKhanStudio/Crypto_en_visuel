#!/usr/bin/env python3
"""A strip of door clips to look at (r479): one row per mp4, a frame every half second (8 for a 4 s
clip), each 384x216, labelled with its file. tools/clip_strip.py out.png a.mp4 [b.mp4 ...]"""
import subprocess, sys, tempfile, os
from PIL import Image, ImageDraw

out, clips = sys.argv[1], sys.argv[2:]
rows = []
with tempfile.TemporaryDirectory() as tmp:
    for k, c in enumerate(clips):
        png = os.path.join(tmp, f"{k}.png")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", c, "-vf", "fps=2,scale=384:216,tile=8x1",
                        "-frames:v", "1", png], check=True)
        im = Image.open(png).convert("RGB"); ImageDraw.Draw(im).text((6, 4), c, fill=(255, 255, 0)); rows.append(im)
sheet = Image.new("RGB", (max(r.width for r in rows), sum(r.height for r in rows)))
y = 0
for r in rows: sheet.paste(r, (0, y)); y += r.height
sheet.save(out); print(out, sheet.size)
