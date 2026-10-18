#!/usr/bin/env python3
"""Contact sheet: tools/sheet.py out.png a.png b.png ... [--cols 2] [--w 720] — tiles shots
side by side, each labelled with its file name, to look at a whole story in one image."""
import argparse
from PIL import Image, ImageDraw
ap = argparse.ArgumentParser(); ap.add_argument("out"); ap.add_argument("ins", nargs="+")
ap.add_argument("--cols", type=int, default=2); ap.add_argument("--w", type=int, default=720)
a = ap.parse_args()
ims = [Image.open(p).convert("RGB") for p in a.ins]
h = round(a.w * ims[0].height / ims[0].width)
rows = -(-len(ims) // a.cols)
sheet = Image.new("RGB", (a.cols * a.w, rows * h), "black")
for i, (im, p) in enumerate(zip(ims, a.ins)):
    x, y = i % a.cols * a.w, i // a.cols * h
    sheet.paste(im.resize((a.w, h)), (x, y))
    ImageDraw.Draw(sheet).text((x + 6, y + 4), p.rsplit("/", 1)[-1], fill="yellow")
sheet.save(a.out)
