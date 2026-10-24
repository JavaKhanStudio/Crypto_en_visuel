#!/usr/bin/env python3
"""r319: lib/sound.js replaced 17 <ep>/js/sound.js in 6 versions. Checks:
- every tone of every old copy (read from 57dbbb6, the last commit that had them) is in lib, same line;
- per episode, headless: the #sound button reads 🔈, a click turns it 🔊 and makes the AudioContext,
  every sfx plays without a page error, a second click turns it off, a reload opens it off again (as
  before: never remembered), and lib/quality.js, where adopted, still wraps it (#sound inside .tools beside #quality);
- a page whose html has no #sound gets one built into .right, wired the same.
    python3 tests/sound_lib.py [ep ...]      (default: scytale deux-generaux, one with lib/quality.js, one without; serve the repo on 8793)"""
import re, subprocess, sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
OLD, BASE = '57dbbb6', 'http://localhost:8793/'
eps = sys.argv[1:] or ['scytale', 'deux-generaux']
bad = 0
def check(name, ok, got=''):
    global bad; bad += not ok; print('ok  ' if ok else 'FAIL', name, got)

lib = open('ficelle/lib/sound.js').read()
olds = subprocess.run(['git', 'ls-tree', '-r', '--name-only', OLD], capture_output=True, text=True).stdout.split()
for f in [f for f in olds if f.endswith('/js/sound.js')]:
    src = subprocess.run(['git', 'show', f'{OLD}:{f}'], capture_output=True, text=True).stdout
    tones = re.findall(r'^  \w+\(.*$', src, re.M)
    missing = [t.split('(')[0].strip() for t in tones if t not in lib]
    check(f'{f}: its {len(tones)} tones are in lib/sound.js', not missing, missing)
lib_tone = re.findall(r'^  (\w+)\(', lib.split('export const sfx')[1], re.M)

PROBE = """() => { const b = document.getElementById('sound');
  return { text: b?.textContent, inTools: !!b?.parentElement?.matches('.tools') && !!document.getElementById('quality'),
           inRight: !!b?.closest('.right') }; }"""
with sync_playwright() as p:
    br = launch(p)
    def page(ep, strip=False):
        pg = br.new_page(viewport={'width': 1440, 'height': 860}); errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        if strip:   # the episode's html without its #sound button
            pg.route(BASE + ep + '/', lambda r: r.fulfill(response=r.fetch(),
                body=re.sub(r'\s*<button id="sound"[^>]*>.*?</button>', '', r.fetch().text())))
        pg.goto(BASE + ep + '/'); pg.wait_for_function('window.demo && window.demo.ready', timeout=60000)
        return pg, errors
    for ep in eps:
        pg, errors = page(ep)
        s = pg.evaluate(PROBE)
        quality = 'qualityComposer' in open(f'{ep}/js/main.js').read()   # adopted lib/quality.js (r254)
        check(f'{ep}: opens off, in .right' + (', wrapped by the quality button' if quality else ''),
              s == {'text': '🔈', 'inTools': quality, 'inRight': True}, s)
        pg.click('#sound'); s = pg.evaluate(PROBE)
        check(f'{ep}: a click turns it on', s['text'] == '🔊', s['text'])
        played = pg.evaluate("""names => import('../ficelle/lib/sound.js').then(({ sfx }) => { for (const n of names) sfx[n](); return Object.keys(sfx).length; })""", lib_tone)
        pg.wait_for_timeout(300)
        check(f'{ep}: all {played} sfx play without a page error', played == len(lib_tone) and not errors, errors)
        pg.click('#sound')
        check(f'{ep}: a second click turns it off', pg.evaluate(PROBE)['text'] == '🔈')
        pg.click('#sound'); pg.reload(); pg.wait_for_function('window.demo && window.demo.ready', timeout=60000)
        check(f'{ep}: a reload opens it off again (never remembered, as before)', pg.evaluate(PROBE)['text'] == '🔈')
        pg.close()
    pg, errors = page(eps[0], strip=True)
    s = pg.evaluate(PROBE); pg.click('#sound')
    check(f'{eps[0]} with no #sound in its html: one is built in .right and works',
          s['inRight'] and s['text'] == '🔈' and pg.evaluate(PROBE)['text'] == '🔊' and not errors, [s, errors])
print(f'{bad} FAIL' if bad else 'all ok'); sys.exit(bool(bad))
