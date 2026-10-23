#!/usr/bin/env python3
"""On a short phone (360x640), the open story panel never rises over the top controls (r484).

Serve the repo first (python3 -m http.server 8793), or pass --base <url>. For every episode, goes to its
last story step, fr and en, at 360x640 (and 390x844), with the top bar open (a tap on #topbar-tab when it
starts tucked) and tucked, and checks that the #story panel's top is under the bottom of #modes, #lang,
#topbar and #sound. Shots to out/panel-room-<ep>-<lang>-<w>.png."""
import sys, argparse
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--size", action="append")
ap.add_argument("episodes", nargs="*")
a = ap.parse_args()
EPISODES = a.episodes or ["deux-generaux", "scytale", "cadenas", "enigma", "enigma-reglage", "enigma-casse", "garde", "pingouin",
  "sel", "eve-lit-tout", "octet-change", "cle-vallee", "paquet-complet", "diffie-hellman", "encore-des-tours", "kasiski", "vpn",
  "aes-interieur", "a-toi-de-jouer"]
SIZES = [tuple(map(int, s.split("x"))) for s in (a.size or ["360x640", "390x844"])]
MEASURE = """() => {
  const box = id => { const e = document.getElementById(id); if (!e || e.classList.contains('hidden') || !e.offsetHeight) return null;
    const r = e.getBoundingClientRect(); return r.bottom > 0 ? r : null; };
  const story = box('story');
  const top = Math.max(0, ...['topbar', 'modes', 'lang', 'sound'].map(id => box(id)?.bottom ?? 0));
  return { story: story && [story.top, story.bottom, story.height], top, h: innerHeight };
}"""
bad, rows = [], []
with sync_playwright() as p:
    b = launch(p)
    for ep in EPISODES:
        for w, h in SIZES:
            for lang in ["fr", "en"]:
                pg = b.new_context(viewport={"width": w, "height": h}, has_touch=True, is_mobile=True).new_page()
                errors = []
                pg.on("pageerror", lambda e: errors.append(str(e)))
                try:
                    pg.goto(f"{a.base}{ep}/?instant=1&lang={lang}#story=1", wait_until="load")
                    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
                except Exception as e:
                    bad.append(f"{ep} {w}x{h} {lang}: no demo ({str(e).splitlines()[0]})"); pg.close(); continue
                n = pg.evaluate("demo.story.steps?.length ?? +document.getElementById('step-count').textContent.match(/\\/\\s*(\\d+)/)[1]")
                pg.evaluate(f"demo.story.go({n - 1})"); pg.wait_for_timeout(1200)
                for state in ["tucked", "open"]:
                    if state == "open":
                        if pg.evaluate("!!document.getElementById('topbar-tab')?.offsetHeight"):
                            pg.tap("#topbar-tab"); pg.wait_for_timeout(900)
                        else:
                            continue
                    m = pg.evaluate(MEASURE)
                    s = m["story"]
                    where = f"{ep} {w}x{h} {lang} step {n} ({state})"
                    if not s: bad.append(f"{where}: no story panel"); continue
                    rows.append(f"{where}: controls end {m['top']:.0f}, panel {s[0]:.0f}-{s[1]:.0f} ({s[2]:.0f} px)")
                    if s[0] < m["top"] - 1: bad.append(f"{where}: panel top {s[0]:.0f} over the controls ending at {m['top']:.0f}")
                    if s[1] > m["h"] + 1: bad.append(f"{where}: panel bottom {s[1]:.0f} below the screen ({m['h']})")
                    pg.screenshot(path=f"out/panel-room-{ep}-{lang}-{w}-{state}.png")
                if errors: bad.append(f"{ep} {w}x{h} {lang} page errors: {errors[:2]}")
                pg.close()
    b.close()
print("\n".join(rows))
print("\n".join(bad) or "all ok")
sys.exit(1 if bad else 0)
