#!/usr/bin/env python3
"""The small pictures on an episode's last step (r105): one per door — the sandbox, the quiz,
the series home — cropped from a 1280×720 shot of each and saved as <slug>/img/door-<name>.jpg,
320×180. The next episode's door uses that episode's own vignette.jpg. Serve the repo root first
(python3 -m http.server 8793), or pass --base.

    tools/door_thumbs.py deux-generaux
"""
import argparse, os, subprocess, sys, tempfile
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("slug")
ap.add_argument("--base", default="http://localhost:8793/")
a = ap.parse_args()
here = os.path.dirname(os.path.abspath(__file__))
# name: (page, hash, crop box in the 1280×720 shot, 16:9)
doors = {
    "sandbox": (a.slug + "/", "#sandbox", (0, 90, 640, 450)),
    "quiz": (a.slug + "/", "#quiz", (280, 130, 1000, 535)),
    "home": ("", "", (0, 0, 1280, 720)),
}
os.makedirs(f"{a.slug}/img", exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    for name, (page, hsh, box) in doors.items():
        raw = os.path.join(tmp, name)
        subprocess.run([sys.executable, os.path.join(here, "shoot.py"), raw, "--base", a.base, "--page", page,
                        "--hash", hsh, "--query", "?instant=1" if page else "", "--size", "1280x720"], check=True)
        Image.open(raw + ".png").convert("RGB").crop(box).resize((320, 180), Image.LANCZOS) \
            .save(f"{a.slug}/img/door-{name}.jpg", quality=82)
        print(f"{a.slug}/img/door-{name}.jpg")
