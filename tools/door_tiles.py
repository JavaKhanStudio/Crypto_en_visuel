#!/usr/bin/env python3
"""r595: the last step's door tiles on a phone, each tile's height against what it holds (picture + name).
    tools/door_tiles.py [--page aes-interieur/] [--step 13] [--size 360x640] [--base URL] [--shot out/name]
Prints, per language, each door's tile height and content height (the lowest child's bottom + padding)
and the slack; exits 1 when a tile is taller than its content by more than one line of a name (a tile one
line shorter than its neighbour's name is a row, not half empty)."""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from browser import launch
ap = argparse.ArgumentParser()
ap.add_argument("--page", default="aes-interieur/"); ap.add_argument("--step", default="13")
ap.add_argument("--size", default="360x640"); ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--shot", default="")
a = ap.parse_args(); w, h = map(int, a.size.split("x")); bad = 0
READ = """() => [...document.querySelectorAll('#step-actions .door')].map(d => {
  const r = d.getBoundingClientRect(), pad = parseFloat(getComputedStyle(d).paddingBottom) + parseFloat(getComputedStyle(d).borderBottomWidth);
  const kids = [...d.children].filter(k => k.offsetParent !== null).map(k => k.getBoundingClientRect().bottom);
  const line = parseFloat(getComputedStyle(d.querySelector('b')).lineHeight);
  return { k: d.querySelector('b').textContent, line: Math.round(line), h: Math.round(r.height), need: Math.round(Math.max(...kids) + pad - r.top) }; })"""
with sync_playwright() as p:
    br = launch(p)
    for lang in ("fr", "en"):
        ctx = br.new_context(viewport={"width": w, "height": h}, has_touch=w < 720, is_mobile=w < 720, device_scale_factor=2)
        pg = ctx.new_page()
        pg.goto(f"{a.base}{a.page}?instant=1&lang={lang}#story={a.step}"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.wait_for_timeout(2500)
        for d in pg.evaluate(READ):
            slack = d["h"] - d["need"]; ok = slack <= d["line"] + 4; bad += not ok
            print(("ok  " if ok else "BAD ") + f"{a.size} {lang} {d['k'][:24]!r}: tile {d['h']} px, holds {d['need']} px, slack {slack} (a line {d['line']})")
        if a.shot: pg.screenshot(path=f"{a.shot}-{lang}.png")
        ctx.close()
    br.close()
print("all ok" if not bad else f"{bad} failed"); raise SystemExit(bad > 0)
