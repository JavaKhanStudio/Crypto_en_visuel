#!/usr/bin/env python3
"""r324: a CSS move that must change nothing, proven element by element. Two trees are served (the
commit before and the one after), every episode opened in both in story, sandbox and quiz at 390 and
1440 px, and the computed style of every element under <body> (and its ::before/::after) compared.
A moved rule that now loses to a rule it used to beat shows as a property that differs.

    python3 -m http.server 8810 -d /tmp/before & python3 -m http.server 8811 -d /tmp/after &
    tools/style_diff.py http://localhost:8810/ http://localhost:8811/ [ep ...]

Bubbles, the canvas and the loading veil move with time, so their geometry is not compared.
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

A, B = sys.argv[1], sys.argv[2]
eps = sys.argv[3:] or sorted(p.parent.parent.name for p in Path('.').glob('*/css/style.css')
                             if (p.parent.parent / 'index.html').exists() and p.parts[0] not in ('lab', 'lib'))
GRAB = """() => {
  const moving = /^(transform|left|top|right|bottom|opacity|width|height|inset|translate|--tail|transition|visibility|perspective-origin|transform-origin|block-size|inline-size|max-height)/;
  const skip = el => el.closest('#bubbles, canvas, #loading, #credit');
  const out = {};
  const path = el => { const p = []; for (; el && el !== document.body; el = el.parentElement)
    p.unshift(el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ':' + [...el.parentElement.children].indexOf(el)); return p.join('>'); };
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('svg') && el.tagName !== 'svg') continue;
    for (const pseudo of [null, '::before', '::after']) {
      const cs = getComputedStyle(el, pseudo); if (pseudo && cs.content === 'none') continue;
      const o = {};
      for (const k of cs) if (!(skip(el) && moving.test(k))) o[k] = cs.getPropertyValue(k);
      out[path(el) + (pseudo || '')] = o;
    }
  }
  return out;
}"""
STATES = [('story', ''), ('sandbox', '#sandbox'), ('quiz', '#quiz')]
bad = 0
with sync_playwright() as p:
    b = launch(p)
    for ep in eps:
        for w, h in [(390, 844), (1440, 900)]:
            for name, hash_ in STATES:
                got = []
                for base in (A, B):
                    pg = b.new_page(viewport={'width': w, 'height': h})
                    pg.goto(f'{base}{ep}/?instant=1&quality=normal{hash_}', wait_until='load')
                    pg.wait_for_function('window.demo && window.demo.ready', timeout=60000)
                    pg.wait_for_timeout(600)
                    got.append(pg.evaluate(GRAB)); pg.close()
                diffs = []
                for k in sorted(set(got[0]) | set(got[1])):
                    x, y = got[0].get(k), got[1].get(k)
                    if x is None or y is None: diffs.append(f'{k}: only in {"after" if x is None else "before"}'); continue
                    for prop in x:
                        if x[prop] != y.get(prop): diffs.append(f'{k} {prop}: {x[prop]!r} -> {y.get(prop)!r}')
                print(f'{ep:17} {w:4} {name:8} {len(got[1]):4} elements  ' + ('ok' if not diffs else f'BAD {len(diffs)}'))
                for d in diffs[:8]: print('     ', d[:200])
                bad += bool(diffs)
    b.close()
print('all ok' if not bad else f'{bad} bad')
sys.exit(bool(bad))
