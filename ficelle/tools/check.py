#!/usr/bin/env python3
"""A visuel's pinned Ficelle is whole and is the only one (r333).

Vendored with the rest: this file sits at <child>/ficelle/tools/check.py, and from the child's root

    python3 ficelle/tools/check.py            # exit 1 on any FAIL

checks that
  1. <child>/ficelle/ is exactly the tree <child>/ficelle.lock names (its hash over every file):
     an edit made in the vendored copy is lost at the next sync, so it is made in Ficelle;
  2. no vendored name is also at the child's root (lib/, assets/, vendor/, credit.js): a second copy;
  3. no .js/.html/.css of the child outside ficelle/ points at one (an import '../../lib/x.js' left
     unswitched, which would 404 on the published page).
The hash is the one tools/ficelle_sync.py writes: sha256 over 'path NUL sha256(file) LF', sorted.
"""
import hashlib, os, re, sys
from pathlib import Path

NAMES = ('lib', 'assets', 'vendor', 'credit.js')        # the vendored top level (VENDORED in ficelle_sync.py)
SKIP = {'.git', 'ficelle', 'out', 'node_modules', '.wrangler', '__pycache__'}
REF = re.compile(r"""(?<=["'`(])((?:\.\./)+|\./)?((?:lib|assets|vendor)/[\w./-]*|credit\.js)""")


def tree_hash(root):
    h = hashlib.sha256()
    for p in sorted(q for q in Path(root).rglob('*') if q.is_file() and '__pycache__' not in q.parts):
        h.update(p.relative_to(root).as_posix().encode() + b'\0' + hashlib.sha256(p.read_bytes()).hexdigest().encode() + b'\n')
    return h.hexdigest()


def read_lock(path):
    return dict(l.split(None, 1) for l in Path(path).read_text().splitlines() if l.strip() and not l.startswith('#'))


def stray_refs(child):
    """(file, line, ref) of every relative reference that lands on a vendored name at the child's root."""
    child = Path(child).resolve()
    for dirpath, dirs, files in os.walk(child):
        top = Path(dirpath) == child
        dirs[:] = [d for d in dirs if d not in SKIP and not (top and d in NAMES)]
        for f in files:
            if top and f in NAMES or not f.endswith(('.js', '.mjs', '.html', '.css')): continue
            p = Path(dirpath) / f
            for n, line in enumerate(p.read_text(errors='replace').splitlines(), 1):
                for m in REF.finditer(line):
                    if lands(child, dirpath, m) or m.group(1) and lands(child, page_of(dirpath), m):
                        yield p.relative_to(child), n, m.group(0)


def page_of(dirpath):
    """A fetch or new URL(x, location) in <ep>/js/*.js resolves from the page, <ep>/ (vpn's '../assets/shapes/')."""
    return os.path.dirname(dirpath) if os.path.basename(dirpath) == 'js' else dirpath


def lands(child, base, m):
    """The reference m, read from the folder base, is a vendored name at the child's root."""
    to = os.path.normpath(os.path.join(base, (m.group(1) or '') + m.group(2)))
    return to.startswith(str(child) + os.sep) and Path(to).relative_to(child).parts[0] in NAMES


def main(child='.'):
    child = Path(child)
    fails = 0
    def check(what, ok, extra=''):
        nonlocal fails
        fails += not ok
        print('ok  ' if ok else 'FAIL', what + (f'  {extra}' if extra else ''))
    lock = child / 'ficelle.lock'
    if not lock.exists() or not (child / 'ficelle').is_dir():
        check('ficelle/ and ficelle.lock are there', False); return 1
    want = read_lock(lock)
    got = tree_hash(child / 'ficelle')
    check(f"ficelle/ is Ficelle {want.get('version', '?')} as pinned", got == want.get('tree'),
          '' if got == want.get('tree') else f"(tree {got[:12]}, the lock says {want.get('tree', '?')[:12]}: edited in place? edit Ficelle, then sync)")
    for n in NAMES:
        check(f'no {n} of its own at the root', not (child / n).exists())
    stray = list(stray_refs(child))
    check('no page or module points at a root ' + '/'.join(NAMES), not stray)
    for f, n, ref in stray[:20]: print(f'       {f}:{n}  {ref}')
    print('all ok' if not fails else f'{fails} FAILED')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main(*sys.argv[1:2]))
