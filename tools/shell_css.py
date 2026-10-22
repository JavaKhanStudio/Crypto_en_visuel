#!/usr/bin/env python3
"""r324: the episode shell's CSS, the rules every <ep>/css/style.css has word for word, in ONE file.

A style.css is read as rules: a top-level rule, a comment, a whole @keyframes, and each rule inside an
@media (keyed with its query). A rule found in every episode (whitespace aside) is shared. Lines are
not enough: the 900px block is shared line by line, but some episodes add their own rules inside it.

    tools/shell_css.py count [root]          # the rules every style.css still shares (0 once split)
    tools/shell_css.py split <root>          # in <root>: writes lib/episode.css, takes its rules out of
                                             # each <ep>/css/style.css, links it before css/style.css
The split was run once (r324); count is what tests/shell_css_shared.py checks.
"""
import re, sys
from collections import Counter
from pathlib import Path

def units(text, start=0, end=None, ctx=''):
    """[(ctx, key, a, b)]: each rule or comment of text[start:end], its span, and for an @media its
    inner rules (ctx = the query), never the @media itself. key is the rule with whitespace collapsed."""
    end = len(text) if end is None else end
    out, i = [], start
    while i < end:
        if text[i].isspace(): i += 1; continue
        if text.startswith('/*', i):
            j = text.index('*/', i) + 2
            out.append((ctx, norm(text[i:j]), i, j)); i = j; continue
        if text[i] == '}': break                       # the end of the @media we are in
        j = text.index('{', i)
        head = text[i:j].strip()
        k = close(text, j)
        if head.startswith('@media'):
            out.append(('@', head, i, k))              # the block itself: rebuilt, never matched
            out += units(text, j + 1, k - 1, norm(head))
        else:
            out.append((ctx, norm(text[i:k]), i, k))
        i = k
    return out

def close(text, j):
    """the index just past the } matching the { at j, skipping strings and comments"""
    depth, i = 0, j
    while True:
        c = text[i]
        if text.startswith('/*', i): i = text.index('*/', i) + 2; continue
        if c in '"\'': i = text.index(c, i + 1) + 1; continue
        if c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0: return i + 1
        i += 1

norm = lambda s: re.sub(r'\s+', ' ', s).strip()

def keyed(us):
    """(ctx, key, n): the n-th time this rule appears in the file, so a rule written twice counts twice"""
    seen, out = Counter(), []
    for u in us:
        if u[0] == '@': out.append(None); continue
        seen[u[:2]] += 1; out.append((*u[:2], seen[u[:2]]))
    return out

def sheets(root):
    return sorted(p for p in Path(root).glob('*/css/style.css') if (p.parent.parent / 'index.html').exists()
                  and p.parent.parent.name not in ('lab', 'lib', 'vendor'))

def shared(root):
    texts = {p: p.read_text() for p in sheets(root)}
    sets = [Counter(k for k in keyed(units(t)) if k) for t in texts.values()]
    common = sets[0]
    for s in sets[1:]: common &= s
    # a comment alone is not a rule: it is shared only as a heading; count rules
    return texts, common

def cut(text, keep):
    """text without the rules keep() refuses; an @media left with no rule goes too"""
    us = units(text); ks = keyed(us)
    drop = [(a, b) for u, k in zip(us, ks) if k and not keep(k) for a, b in [u[2:]]]
    for u in us:
        if u[0] == '@':
            inner = [k for v, k in zip(us, ks) if k and v[0] == norm(u[1]) and u[2] < v[2] < u[3]]
            if not any(keep(k) and not k[1].startswith('/*') for k in inner): drop.append(u[2:])
    drop.sort(); out, i = [], 0
    for a, b in drop:
        if a < i: continue                             # inside an @media already dropped
        out.append(text[i:a]); i = b
    out.append(text[i:])
    s = ''.join(out)
    s = re.sub(r'[ \t]+\n', '\n', s)                   # what a removed rule left on its line
    s = re.sub(r'\n{3,}', '\n\n', s)
    s = re.sub(r'\{\n\n', '{\n', s)
    return s.lstrip('\n')

LINK = '<link rel="stylesheet" href="css/style.css">'
HEAD = """/* r324: the episode shell, the rules every <ep>/css/style.css had word for word (colours, buttons,
   panels, the top bar and its phone two-row grid r84, story and sandbox panels, bubbles, quiz,
   loading). Each <ep>/index.html links it before its own css/style.css, which keeps only what is
   that episode's. A shell fix goes here, once; tools/shell_css.py count says what is still copied. */
"""

if __name__ == '__main__':
    cmd, root = sys.argv[1], Path(sys.argv[2] if len(sys.argv) > 2 else '.')
    texts, common = shared(root)
    rules = [k for k in common if not k[1].startswith('/*')]
    if cmd == 'count':
        print(f'{len(texts)} style.css, {len(rules)} rules shared by all ({sum(len(k[1]) for k in rules)} chars)')
        for k in rules[:20]: print('  ', (k[0] + ' ' if k[0] else '') + k[1][:110])
        sys.exit(1 if rules else 0)
    assert cmd == 'split'
    ref = root / 'scytale/css/style.css'
    lib = HEAD + cut(texts[ref], lambda k: k in common)
    (root / 'lib/episode.css').write_text(lib)
    for p, t in texts.items():
        p.write_text(cut(t, lambda k: k not in common))
        html = p.parent.parent / 'index.html'
        h = html.read_text()
        assert h.count(LINK) == 1, html
        html.write_text(h.replace(LINK, '<link rel="stylesheet" href="../lib/episode.css">\n  ' + LINK))
    print(f'lib/episode.css: {len(rules)} rules, {lib.count(chr(10))} lines; {len(texts)} style.css cut')
