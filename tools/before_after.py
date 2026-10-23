#!/usr/bin/env python3
"""Before/after contact sheet (r429): two rows, the same shots from two prefixes, scaled.
tools/before_after.py out.png scale before_prefix after_prefix name1 name2 ...  (files <prefix><name>.png)"""
import sys
from PIL import Image, ImageDraw
out, sc, pa, pb, names = sys.argv[1], float(sys.argv[2]), sys.argv[3], sys.argv[4], sys.argv[5:]
rows = []
for pre in (pa, pb):
    ims = [Image.open(f"{pre}{n}.png").convert("RGB") for n in names]
    ims = [i.resize((int(i.width * sc), int(i.height * sc))) for i in ims]
    r = Image.new("RGB", (sum(i.width for i in ims), ims[0].height)); x = 0
    for n, i in zip(names, ims): r.paste(i, (x, 0)); ImageDraw.Draw(r).text((x + 6, 4), pre.split('/')[-1] + n, fill=(255, 255, 0)); x += i.width
    rows.append(r)
s = Image.new("RGB", (max(r.width for r in rows), sum(r.height for r in rows))); y = 0
for r in rows: s.paste(r, (0, y)); y += r.height
s.save(out); print(out, s.size)
