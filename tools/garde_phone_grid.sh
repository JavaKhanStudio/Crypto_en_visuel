#!/bin/sh
# r219: every garde story step on a phone (390x844, ?instant=1), tiled 5x2 into out/<name>.png,
# to judge the portrait framing at a glance. Serve the repo on 8793 first.
# tools/garde_phone_grid.sh r219-after [lang]
name=${1:-garde-phone}; lang=${2:-fr}
for n in 1 2 3 4 5 6 7 8 9 10; do
  python3 tools/shoot.py out/$name-p$n --page garde/ --query "?instant=1&lang=$lang" --hash "#story=$n" --size 390x844 | grep -v "errors: none"
done
python3 - "$name" <<'PY'
import sys
from PIL import Image
n = sys.argv[1]; ims = [Image.open(f'out/{n}-p{k}.png').resize((195, 422)) for k in range(1, 11)]
W = Image.new('RGB', (195 * 5, 422 * 2))
for i, im in enumerate(ims): W.paste(im, ((i % 5) * 195, (i // 5) * 422))
W.save(f'out/{n}.png'); print(f'out/{n}.png')
PY
