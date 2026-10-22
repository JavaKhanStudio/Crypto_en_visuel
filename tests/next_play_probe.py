#!/usr/bin/env python3
"""r62: on every episode, a step's animation button sits at Suivant's place (far right of the nav),
Suivant waits beside it in grey until the animation has played, then turns gold and shines once.
A step without an animation keeps Suivant gold, alone at the right; the last step keeps its
sandbox/quiz buttons in the row above.

Serve the repo first (python3 -m http.server 8793), then:
    python3 tests/next_play_probe.py [out/r62] [--size 390x844] [--only cadenas]
Checks every episode, prints FAIL lines (exit 1 on any), and shoots each case to <out>/<ep>-<case>.png.
"""
import argparse, os
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

EPISODES = ['deux-generaux', 'cadenas', 'diffie-hellman', 'scytale', 'enigma', 'pingouin', 'sel', 'garde']

ap = argparse.ArgumentParser()
ap.add_argument('out', nargs='?', default='out/r62')
ap.add_argument('--base', default='http://localhost:8793/')
ap.add_argument('--size', default='1440x860')
ap.add_argument('--only', default='')
a = ap.parse_args()
w, h = map(int, a.size.split('x'))
tag = 'phone' if w < 720 else 'desk'
os.makedirs(a.out, exist_ok=True)
fails = []

# what the nav looks like now: the order of its buttons and which of them is gold
NAV = """() => {
  const nav = document.querySelector('#story .nav'), next = document.getElementById('next'), play = document.getElementById('play');
  const box = el => el && el.getBoundingClientRect();
  return { order: [...nav.children].map(e => e.id || e.tagName), nextGold: next.classList.contains('primary'),
    nextShine: next.classList.contains('shine'), nextDisabled: next.disabled,
    play: play && { text: play.textContent, gold: play.classList.contains('primary'), disabled: play.disabled,
      right: Math.round(box(play).right), top: Math.round(box(play).top), bottom: Math.round(box(play).bottom) },
    nextBox: { right: Math.round(box(next).right), top: Math.round(box(next).top), width: Math.round(box(next).width) },
    navRight: Math.round(box(nav).right), panelBottom: Math.round(box(nav.closest('section')).bottom),
    actions: [...document.getElementById('step-actions').children].map(b => b.textContent),
    overflow: [...nav.querySelectorAll('button')].some(b => b.scrollWidth > b.clientWidth + 1) };
}"""

def check(cond, ep, what):
    if not cond:
        fails.append(f'{ep}: {what}'); print('  FAIL', what)

with sync_playwright() as p:
    b = launch(p)
    for ep in EPISODES:
        if a.only and ep != a.only: continue
        pg = b.new_page(viewport={'width': w, 'height': h})
        errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.goto(f'{a.base}{ep}/?instant=1#story=1', wait_until='load')
        pg.wait_for_function('window.demo && window.demo.ready', timeout=60000)
        # the step list, read from the page: which steps have an animation, which play it by themselves
        steps = pg.evaluate("""async () => { const m = await import('./js/story.js');
          return m.STEPS.map((s, i) => ({ i, go: !!s.go, go2: !!s.go2, auto: !!s.auto })); }""")
        last = len(steps) - 1
        click = next(s for s in steps if s['go'] and not s['auto'] and s['i'] < last)
        auto = next((s for s in steps if s['auto']), None)
        plain = next((s for s in steps if not s['go']), None)
        print(f'{ep}: click step {click["i"] + 1}, auto {auto and auto["i"] + 1}, plain {plain and plain["i"] + 1}, last {last + 1}')

        def goto(i, wait=600):
            pg.evaluate(f'demo.story.go({i})')
            pg.wait_for_timeout(wait)

        # 1. a step with a button: the button at the right, Suivant grey beside it, still usable
        goto(click['i'])
        n = pg.evaluate(NAV)
        check(n['order'][-2:] == ['next', 'play'], ep, f'nav order {n["order"]}')
        check(n['play'] and n['play']['gold'] and not n['nextGold'] and not n['nextDisabled'], ep, f'before play: {n}')
        check(not n['overflow'], ep, 'a nav button clips its text')
        if tag == 'desk': check(n['play'] and n['play']['right'] >= n['navRight'] - 1, ep, 'play is not at the far right')
        pg.screenshot(path=f'{a.out}/{ep}-{tag}-1-before.png')
        # play it (?instant=1 runs the stage fast), catch the shine, then let it settle
        pg.click('#play')
        pg.wait_for_function("document.getElementById('next').classList.contains('primary')", timeout=120000)
        pg.wait_for_timeout(250)
        n = pg.evaluate(NAV)
        check(n['nextGold'] and n['nextShine'] and not n['play']['gold'], ep, f'after play: {n}')
        pg.screenshot(path=f'{a.out}/{ep}-{tag}-2-shine.png')
        pg.wait_for_timeout(3000)
        n = pg.evaluate(NAV)
        check(n['nextGold'] and not n['nextShine'], ep, f'shine did not end: {n}')
        pg.screenshot(path=f'{a.out}/{ep}-{tag}-3-after.png')

        # 2. a step that plays itself: Suivant grey while it plays, gold when it ends
        if auto:
            pg.evaluate('demo.stage.speed = 1')   # real speed, so it is still playing when we look
            # read in the same tick as the step opens: a short animation can be over in 200 ms
            n = pg.evaluate(f'(() => {{ demo.story.go({auto["i"]}); return ({NAV})(); }})()')
            check(n['play'] and not n['nextGold'], ep, f'auto step, while playing: {n}')
            pg.wait_for_function("document.getElementById('next').classList.contains('primary')", timeout=120000)
            pg.evaluate('demo.stage.speed = 50')
        # 3. a step with nothing to play: Suivant gold, alone at the right
        if plain:
            goto(plain['i'])
            n = pg.evaluate(NAV)
            check(n['order'][-1] == 'next' and n['nextGold'] and not n['play'], ep, f'plain step: {n}')
            pg.screenshot(path=f'{a.out}/{ep}-{tag}-4-plain.png')
        # 4. the last step: sandbox and quiz stay in the row above, no play in the nav
        goto(last)
        n = pg.evaluate(NAV)
        check(not n['play'] and len(n['actions']) == 2, ep, f'last step: {n}')
        pg.screenshot(path=f'{a.out}/{ep}-{tag}-5-last.png')
        check(not errors, ep, f'page errors {errors}')
        pg.close()
    b.close()
print('FAIL' if fails else 'ok', len(fails))
raise SystemExit(1 if fails else 0)
