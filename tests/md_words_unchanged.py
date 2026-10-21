#!/usr/bin/env python3
"""r176 roll-outs are layout only (slides:D2): every step text's plain() (js/md.js markup stripped)
must equal its text at a reference commit.  python3 tests/md_words_unchanged.py enigma <rev>"""
import re, subprocess, sys

ep, rev = sys.argv[1], sys.argv[2]
path = f"{ep}/js/i18n.js"
old = subprocess.run(["git", "show", f"{rev}:{path}"], capture_output=True, text=True, check=True).stdout
new = open(path).read()
P = lambda t: re.findall(r'\n\s*p: "((?:[^"\\]|\\.)*)"', t)
INLINE = re.compile(r"\*\*(.+?)\*\*|\{([grb1-4])\|(.+?)\}")

def plain(s):   # the same as md.js plain()
    s = s.replace("\\n", "\n")
    for _ in range(2): s = INLINE.sub(lambda m: m.group(1) or m.group(3), s)
    return re.sub(r"\s*\n\s*", " ", re.sub(r"(?m)^\s*- ", "", s))

o, n = P(old), P(new)
bad = len(o) != len(n)
for a, b in zip(o, n):
    if plain(b) != plain(a): bad = True; print("DIFF\n  was:", plain(a), "\n  now:", plain(b))
print(f"{len(n)} step texts:", "all ok" if not bad else "FAIL")
sys.exit(bad)
