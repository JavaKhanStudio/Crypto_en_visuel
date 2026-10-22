"""r400: lib/md.js tie() keeps a French number's groups of three together. Checks, on the given
episode steps and phone sizes in French, that every grouped number of the step text sits on ONE
line, and that no line of #step-text runs past the panel (a glued run too long for a phone would).
Serve the repo first (python3 -m http.server 8793).
  python3 tests/number_groups_fit.py [--base URL] [--sizes 390x844,360x740] enigma-reglage:16 garde:all ...
The series' floor is 360 px (tools_chip, credit_stamp); at 320 the 27-digit total of enigma-reglage
step 16, glued to « tableaux = », runs 27 px past the panel."""
import argparse, sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
ap = argparse.ArgumentParser(); ap.add_argument('shots', nargs='+')
ap.add_argument('--sizes', default='390x844,360x740'); ap.add_argument('--base', default='http://localhost:8793/')
a = ap.parse_args()
# every text node's grouped numbers: their rects' tops must be one line; every rect inside the text box
PROBE = r"""() => {
  const box = document.getElementById('step-text'), r0 = box.getBoundingClientRect(), bad = [];
  const w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    for (const m of n.data.matchAll(/\d{1,3}(?:[  ]\d{3})+(?!\d)/g)) {
      const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
      const tops = new Set([...rg.getClientRects()].map(r => Math.round(r.top)));
      if (tops.size > 1) bad.push('split: ' + m[0]);
    }
    const rg = document.createRange(); rg.selectNodeContents(n);
    for (const r of rg.getClientRects()) if (r.right > r0.right + 1) bad.push('past the panel by ' + Math.round(r.right - r0.right) + 'px: ' + n.data.slice(0, 40));
  }
  return bad;
}"""
fails = 0
with sync_playwright() as p:
    b = launch(p)
    for shot in a.shots:
        ep, step = shot.split(':')
        for size in a.sizes.split(','):
            W, H = map(int, size.split('x'))
            pg = b.new_page(viewport={"width": W, "height": H}); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(f"{a.base}{ep}/?instant=1&lang=fr#story={1 if step == 'all' else step}", wait_until="load")
            pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
            n = pg.evaluate("import('./js/story.js').then(m => m.STEPS.length)")
            for i in range(1, n + 1) if step == 'all' else [int(step)]:
                pg.evaluate(f"demo.story.go({i - 1})"); pg.wait_for_timeout(400)
                bad = pg.evaluate(PROBE)
                if step != 'all' or bad: print(f"{ep} #story={i} {size}:", 'ok' if not bad else '; '.join(bad))
                fails += bool(bad)
            if step == 'all': print(f"{ep} {n} steps {size}:", 'errors: ' + '; '.join(errs) if errs else 'ok')
            fails += bool(errs); pg.close()
    b.close()
print('all ok' if not fails else f'{fails} FAILED'); sys.exit(bool(fails))
