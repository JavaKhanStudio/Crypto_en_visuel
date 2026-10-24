#!/usr/bin/env python3
"""Every episode's story test (tests/*_story.py) in both languages, with the wall time of each run
and of the whole (r401). Serve the repo first (python3 -m http.server 8793).

    python3 tests/story_all.py [base] [--langs fr,en] [--only vpn,sel] [-j N]
    python3 tests/story_all.py --changed [<rev> | <a>..<b>]   # only the episodes a change touches
    python3 tests/story_all.py --changed --list               # say which, run nothing
    CRYPTO_GL=soft python3 tests/story_all.py      # the same on the CPU (SwiftShader), to compare

-j N runs N story tests at once (r536: each opens its own chromium on the GPU; the default is the
fastest N measured all ok on this machine). --changed picks the tests whose episode reaches a file
changed since <rev> (default origin/main; the working tree and untracked files count, a range
a..b counts only its commits): the walk starts at <slug>/index.html and follows every src/href, JS
import and quoted path through lib/, assets/, xref.js... A change to vendor/, tools/browser.py or
this file runs everything. Exit 1 when any run fails; the last lines of a failing run are printed."""
import argparse, glob, os, re, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed

JOBS = 4                                       # r536, full run on the RTX 5060: -j 1 33.7 min, 2 18.2, 3 13.4, 4 10.9, all ok
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)
EVERYTHING = ("ficelle/vendor/", "ficelle/tools/", "tools/browser.py", "tests/story_all.py")
QUOTED = re.compile(r"""(?:src|href)\s*=\s*["']([^"'#?]+)|["'`]((?:\.{1,2}/|[\w-]+/)[\w./-]*\.\w+|\.{1,2}/[\w./-]*/)["'`]""")


def slug_of(test):
    """The episode folder a story test opens: its base = ... + "<slug>/"."""
    m = re.search(r'8793/"\)\s*\+\s*"([\w-]+)/"', open(test, encoding="utf-8").read())
    return m and m.group(1)


def reach(slug):
    """Every repo file the episode's page can load, relative to the repo root."""
    page_dir = os.path.join(root, slug)
    seen, todo = set(), [os.path.join(page_dir, "index.html")]
    while todo:
        f = os.path.normpath(todo.pop())
        if f in seen or not os.path.isfile(f):
            continue
        seen.add(f)
        if not f.endswith((".html", ".js", ".mjs", ".css", ".json")):
            continue
        for m in QUOTED.finditer(open(f, encoding="utf-8", errors="replace").read()):
            ref = m.group(1) or m.group(2)
            if not ref or "://" in ref or ref.startswith(("data:", "/")):
                continue
            # a module resolves from its own folder; a fetch, img or css url() from the page's
            for base in {os.path.dirname(f), page_dir}:
                p = os.path.normpath(os.path.join(base, ref))
                if not p.startswith(root + os.sep):
                    continue
                if os.path.isfile(p):
                    todo.append(p)
                elif os.path.isdir(p) and os.path.dirname(p) != root:      # assets/parallax/calm-day/
                    todo += glob.glob(os.path.join(p, "**", "*"), recursive=True)
    return {os.path.relpath(f, root) for f in seen}


def changed(rev):
    git = lambda *a: subprocess.run(["git", "-C", root, *a], capture_output=True, text=True, check=True).stdout.split()
    if ".." in rev:
        return set(git("diff", "--name-only", rev))
    return set(git("diff", "--name-only", rev)) | set(git("ls-files", "--others", "--exclude-standard"))


ap = argparse.ArgumentParser(); ap.add_argument("base", nargs="?", default="http://localhost:8793/")
ap.add_argument("--langs", default="fr,en"); ap.add_argument("--only", default="")
ap.add_argument("--changed", nargs="?", const="origin/main", metavar="REV")
ap.add_argument("--list", action="store_true", help="with --changed: print the episodes, run nothing")
ap.add_argument("-j", "--jobs", type=int, default=JOBS)
a = ap.parse_args()
tests = sorted(glob.glob(os.path.join(here, "*_story.py")))
if a.only:
    tests = [t for t in tests if os.path.basename(t)[:-len("_story.py")] in a.only.split(",")]
if a.changed:
    files = changed(a.changed)
    rel = lambda t: os.path.relpath(t, root)
    if any(f.startswith(EVERYTHING) for f in files):
        print("--changed %s: %s touches every episode" % (a.changed, next(f for f in sorted(files) if f.startswith(EVERYTHING))))
    else:
        hit = {}                                   # slug -> the changed files it reaches
        for d in sorted(os.listdir(root)):
            if os.path.isfile(os.path.join(root, d, "index.html")) and not d.startswith(".") and d != "lab":
                why = sorted(files & reach(d))
                if why:
                    hit[d] = why
        has_test = {slug_of(t) for t in tests}
        print("--changed %s: %d file(s), %d episode(s)" % (a.changed, len(files), len(hit)))
        for d, why in hit.items():
            print("  %-18s %s%s" % (d, ", ".join(why[:3]) + (" +%d" % (len(why) - 3) if len(why) > 3 else ""),
                                     "" if d in has_test else "   (no story test)"))
        tests = [t for t in tests if slug_of(t) in hit or rel(t) in files]
    if a.list:
        print("story tests: " + (" ".join(os.path.basename(t) for t in tests) or "none")); sys.exit(0)

gl = os.environ.get("CRYPTO_GL", "gpu")
runs = [(t, lang) for t in tests for lang in a.langs.split(",")]


def run(t, lang):
    t0 = time.monotonic()
    r = subprocess.run([sys.executable, t, a.base, lang], capture_output=True, text=True)
    return t, lang, time.monotonic() - t0, r


wall0, total, bad = time.monotonic(), 0.0, []
with ThreadPoolExecutor(max(1, a.jobs)) as pool:
    for fut in as_completed([pool.submit(run, t, lang) for t, lang in runs]):
        t, lang, dt, r = fut.result(); total += dt
        name = "%s %s" % (os.path.basename(t), lang)
        print("%-32s %6.1f s  %s" % (name, dt, "ok" if r.returncode == 0 else "FAILED"), flush=True)
        if r.returncode:
            bad.append(name); print("    " + "\n    ".join((r.stdout + r.stderr).strip().splitlines()[-8:]))
wall = time.monotonic() - wall0
print("%d runs on %s, -j %d: %.0f s wall (%.1f min), %.0f s of runs" % (len(runs), gl, a.jobs, wall, wall / 60, total))
print("all ok" if not bad else "FAILED: " + ", ".join(bad)); sys.exit(bool(bad))
