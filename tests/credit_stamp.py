#!/usr/bin/env python3
"""The credit stamp (r185, credit.js at the root) is on every page and every mode, a link to
simonbedardprog.com/ficelle, inside the window and not covered by anything (elementFromPoint at the
centre of each part lands in the stamp). On the home: both logos and the words « Fait par
SimonBedardProg / avec Atelier ». In an episode (Simon, r340: « the simonbedardprog logo is enough »):
Simon's logo alone, in the top bar, its title saying the words (the bar pinned, ?topbar=pin: r406 takes
the whole bar, logo included, out of the way, and this checks where the logo sits when it is shown). Walks the home and, for each episode
given, story / sandbox / quiz at 1440, 1100, 390 and 360 px wide; writes out/credit-<page>.png, a strip
of the stamp's surroundings for each case. Serve the repo first (python3 -m http.server 8793).
    tests/credit_stamp.py deux-generaux [more episodes] [--base URL]"""
import argparse
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
from PIL import Image

ap = argparse.ArgumentParser(); ap.add_argument("episodes", nargs="*")
ap.add_argument("--base", default="http://localhost:8793/"); a = ap.parse_args()
SIZES = [(1440, 860), (1100, 800), (390, 844), (360, 740)]
CHECK = """() => { const el = document.getElementById('credit'); if (!el) return 'no stamp';
  const out = [], home = !!el.closest('footer');
  const parts = home ? [...el.querySelectorAll('img'), el.querySelector('.words')] : [...el.querySelectorAll('img')];
  if (home && el.querySelectorAll('img').length !== 2) out.push('home: not both logos');
  if (!home && (el.querySelector('.words') || el.querySelectorAll('img').length !== 1)) out.push('episode: more than the logo');
  if (!home && !el.closest('#topbar')) out.push('episode: logo not in the top bar');
  for (const part of parts) {
    if (!part) { out.push('part missing'); continue; }
    const r = part.getBoundingClientRect();
    if (!r.width || !r.height) { out.push((part.className || part.tagName) + ' not drawn'); continue; }
    if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) { out.push((part.className || part.tagName) + ' outside the window'); continue; }
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    // the quiz is a modal whose light veil (#quiz itself, not its card) lies over the whole top bar: the logo shows through it, as the modes do
    if (hit && hit.id === 'quiz' && !home) continue;
    if (!hit || !el.contains(hit)) out.push((part.className || part.tagName) + ' covered by ' + (hit ? (hit.id || hit.className || hit.tagName) : 'nothing'));
  }
  if (!/simonbedardprog\\.com\\/ficelle/.test(el.href)) out.push('href ' + el.href);
  const said = home ? el.textContent : el.title;
  if (!/SimonBedardProg/.test(said) || !/Atelier/.test(said)) out.push('words missing');
  const r = el.getBoundingClientRect();
  return out.length ? out.join('; ') : [r.left, r.top, r.right, r.bottom]; }"""

bad = 0
with sync_playwright() as p:
    b = launch(p)
    for page in [""] + a.episodes:
        cases = [("home", "")] if not page else [("story", "#story=2"), ("sandbox", "#sandbox"), ("quiz", "#quiz")]
        crops = []
        for w, h in SIZES:
            for name, hsh in cases:
                pg = b.new_page(viewport={"width": w, "height": h}); errs = []
                pg.on("pageerror", lambda e: errs.append(str(e)))
                pg.goto(f"{a.base}{page}{'/' if page else ''}?instant=1&topbar=pin{hsh}", wait_until="load")
                if page: pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
                if not page: pg.evaluate("document.querySelector('footer')?.scrollIntoView()")
                pg.wait_for_timeout(1500)
                got = pg.evaluate(CHECK)
                ok = isinstance(got, list) and not errs
                print("ok  " if ok else "FAIL", f"{page or 'home'} {name} {w}px", "" if ok else (got if not isinstance(got, list) else errs))
                bad += not ok
                if isinstance(got, list):
                    l, t, r, bt = got; pad = 30
                    shot = pg.screenshot(clip={"x": max(0, l - pad), "y": max(0, t - 90), "width": min(w - max(0, l - pad), r - l + 2 * pad + 160), "height": min(h - max(0, t - 90), bt - t + 120)})
                    import io; crops.append(Image.open(io.BytesIO(shot)))
                pg.close()
        if crops:
            W = max(c.width for c in crops); H = sum(c.height + 6 for c in crops)
            sheet = Image.new("RGB", (W, H), "white"); y = 0
            for c in crops: sheet.paste(c, (0, y)); y += c.height + 6
            sheet.save(f"out/credit-{page or 'home'}.png")
    b.close()
print("all ok" if not bad else "FAILED"); raise SystemExit(1 if bad else 0)
