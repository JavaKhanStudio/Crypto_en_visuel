#!/usr/bin/env python3
"""Every episode's story test (tests/*_story.py) in both languages, one after the other, with the
wall time of each run and the total (r401). Serve the repo first (python3 -m http.server 8793).

    python3 tests/story_all.py [base] [--langs fr,en] [--only vpn,sel]
    CRYPTO_GL=soft python3 tests/story_all.py      # the same on the CPU (SwiftShader), to compare

Exit 1 when any run fails; the last lines of a failing run are printed."""
import argparse, glob, os, subprocess, sys, time

ap = argparse.ArgumentParser(); ap.add_argument("base", nargs="?", default="http://localhost:8793/")
ap.add_argument("--langs", default="fr,en"); ap.add_argument("--only", default="")
a = ap.parse_args()
here = os.path.dirname(os.path.abspath(__file__))
tests = sorted(glob.glob(os.path.join(here, "*_story.py")))
if a.only:
    tests = [t for t in tests if os.path.basename(t)[:-len("_story.py")] in a.only.split(",")]
gl = os.environ.get("CRYPTO_GL", "gpu")
total, bad = 0.0, []
for t in tests:
    for lang in a.langs.split(","):
        t0 = time.monotonic()
        r = subprocess.run([sys.executable, t, a.base, lang], capture_output=True, text=True)
        dt = time.monotonic() - t0; total += dt
        name = "%s %s" % (os.path.basename(t), lang)
        print("%-32s %6.1f s  %s" % (name, dt, "ok" if r.returncode == 0 else "FAILED"), flush=True)
        if r.returncode:
            bad.append(name); print("    " + "\n    ".join((r.stdout + r.stderr).strip().splitlines()[-8:]))
print("%d runs on %s: %.0f s (%.1f min)" % (len(tests) * len(a.langs.split(",")), gl, total, total / 60))
print("all ok" if not bad else "FAILED: " + ", ".join(bad)); sys.exit(bool(bad))
