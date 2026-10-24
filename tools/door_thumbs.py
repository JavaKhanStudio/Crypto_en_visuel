#!/usr/bin/env python3
"""The small pictures on an episode's last step (r105): one per door — the sandbox, the quiz,
the series home — cropped from a 1280×720 shot of each and saved as <slug>/img/door-<name>.jpg,
320×180. The home door is the same picture for every episode: it is saved ONCE, as
assets/doors/home.jpg (r431) in Ficelle (r333: the checkout $FICELLE, default ~/Documents/GitHub/ficelle; sync
it in after), and every story.js names it '../ficelle/assets/doors/home.jpg'. The next
episode's door uses that episode's own vignette.jpg. Serve the repo root first
(python3 -m http.server 8793), or pass --base.

    tools/door_thumbs.py deux-generaux
    tools/door_thumbs.py enigma --box sandbox=300,100,1100,550   # another crop for one door
    tools/door_thumbs.py eve-lit-tout --box sandbox=0,0,1280,720   # the whole frame: Eve's notebook is in the corner card
"""
import argparse, os, subprocess, sys, tempfile
from PIL import Image

FICELLE = os.environ.get("FICELLE", os.path.expanduser("~/Documents/GitHub/ficelle"))   # never this repo's ficelle/ (r333)

ap = argparse.ArgumentParser()
ap.add_argument("slug")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--only", default="", help="comma list of sandbox,quiz,quiz.en,home")
ap.add_argument("--box", action="append", default=[], help="name=x0,y0,x1,y1: crop that door elsewhere (16:9)")
a = ap.parse_args()
here = os.path.dirname(os.path.abspath(__file__))
# name: (page, hash, crop box in the 1280×720 shot, 16:9)
doors = {
    "sandbox": (a.slug + "/", "#sandbox", (0, 90, 640, 450)),
    "quiz": (a.slug + "/", "#quiz", (280, 130, 1000, 535)),
    "quiz.en": (a.slug + "/", "#quiz", (280, 130, 1000, 535)),   # r182: the quiz is all words, one picture per language
    "home": ("", "", (0, 0, 1280, 720)),
}
for b in a.box:
    name, xy = b.split("=")
    for n in [n for n in doors if n.split(".")[0] == name]:
        doors[n] = doors[n][:2] + (tuple(int(v) for v in xy.split(",")),)
if a.only: doors = {n: v for n, v in doors.items() if n in a.only.split(",")}
os.makedirs(f"{a.slug}/img", exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    for name, (page, hsh, box) in doors.items():
        raw = os.path.join(tmp, name)
        q = "?instant=1&lang=" + (name.split(".")[1] if "." in name else "fr") if page else ""
        subprocess.run([sys.executable, os.path.join(here, "shoot.py"), raw, "--base", a.base, "--page", page,
                        "--hash", hsh, "--query", q, "--size", "1280x720"], check=True)
        out = os.path.join(FICELLE, "assets/doors/home.jpg") if name == "home" else f"{a.slug}/img/door-{name}.jpg"
        os.makedirs(os.path.dirname(out), exist_ok=True)
        Image.open(raw + ".png").convert("RGB").crop(box).resize((320, 180), Image.LANCZOS).save(out, quality=82)
        print(out)
