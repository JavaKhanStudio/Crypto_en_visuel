#!/usr/bin/env python3
"""r324: no rule is copied into every <ep>/css/style.css any more; the shell is lib/episode.css.
    python3 tests/shell_css_shared.py      # all ok, or the rules every style.css still shares"""
import subprocess, sys
r = subprocess.run([sys.executable, 'tools/shell_css.py', 'count'], capture_output=True, text=True)
print(r.stdout, end='')
missing = [p for p in __import__('pathlib').Path('.').glob('*/index.html')
           if 'css/style.css' in p.read_text() and '../lib/episode.css' not in p.read_text()]
for p in missing: print('  no lib/episode.css link:', p)
print('all ok' if r.returncode == 0 and not missing else 'FAIL')
sys.exit(r.returncode or bool(missing))
