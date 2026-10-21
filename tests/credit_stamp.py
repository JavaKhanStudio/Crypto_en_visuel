#!/usr/bin/env python3
"""The credit stamp (r185, credit.js at the root) is on every page and every mode, whole and on top:
both logos and the words « Fait par SimonBedardProg / avec Atelier », a link to
simonbedardprog.com/ficelle, inside the window and not covered by anything (elementFromPoint at the
centre of each logo and of the words lands in the stamp). Walks the home and, for each episode given,
story / sandbox / quiz at 1440, 1100, 390 and 360 px wide; writes out/credit-<page>.png, a strip of
the stamp's surroundings for each case. In a panel that scrolls (the sandbox on a phone) the stamp
is the panel's last line: the check scrolls to it first. Serve the repo first (python3 -m http.server 8793).
    tests/credit_stamp.py deux-generaux [more episodes] [--base URL]"""
import argparse
from playwright.sync_api import sync_playwright
from PIL import Image

ap = argparse.ArgumentParser(); ap.add_argument("episodes", nargs="*")
ap.add_argument("--base", default="http://localhost:8793/"); a = ap.parse_args()
SIZES = [(1440, 860), (1100, 800), (390, 844), (360, 740)]
CHECK = """() => { const el = document.getElementById('credit'); if (!el) return 'no stamp';
  const out = [];
  // inside a panel that scrolls (the sandbox on a phone), the stamp is its last line: scroll to it, as a reader would
  const host = el.parentElement; if (host && host.scrollHeight > host.clientHeight + 1) { host.scrollTop = host.scrollHeight; }
  for (const part of [...el.querySelectorAll('img'), el.querySelector('.words')]) {
    const r = part.getBoundingClientRect();
    if (!r.width || !r.height) { out.push((part.className || part.tagName) + ' not drawn'); continue; }
    if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) { out.push((part.className || part.tagName) + ' outside the window'); continue; }
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (!hit || !el.contains(hit)) out.push((part.className || part.tagName) + ' covered by ' + (hit ? (hit.id || hit.className || hit.tagName) : 'nothing'));
  }
  if (!/simonbedardprog\\.com\\/ficelle/.test(el.href)) out.push('href ' + el.href);
  if (!/SimonBedardProg/.test(el.textContent) || !/Atelier/.test(el.textContent)) out.push('words missing');
  const r = el.getBoundingClientRect();
  return out.length ? out.join('; ') : [r.left, r.top, r.right, r.bottom]; }"""

bad = 0
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    for page in [""] + a.episodes:
        cases = [("home", "")] if not page else [("story", "#story=2"), ("sandbox", "#sandbox"), ("quiz", "#quiz")]
        crops = []
        for w, h in SIZES:
            for name, hsh in cases:
                pg = b.new_page(viewport={"width": w, "height": h}); errs = []
                pg.on("pageerror", lambda e: errs.append(str(e)))
                pg.goto(f"{a.base}{page}{'/' if page else ''}?instant=1{hsh}", wait_until="load")
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
