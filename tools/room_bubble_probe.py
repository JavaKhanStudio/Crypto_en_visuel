#!/usr/bin/env python3
"""r529: on a touch phone (390x844, the bar tucked behind #topbar-tab), every room step of every saga room
episode at rest: the speaker's bubble ends above the top of the frame the room holds (tools/r473_probe.py's
measure, for all of them). Prints one line a step; fails when a bubble runs into its frame.
--open (r474): the same with the step text opened by « Lire la suite ▾ » (steps whose text folds).
    python3 tools/room_bubble_probe.py [--open] [base] [episode ...]      (base default http://localhost:8793/)"""
import sys, json
from playwright.sync_api import sync_playwright
from browser import launch
args = sys.argv[1:]
OPEN = "--open" in args
args = [x for x in args if x != "--open"]
base = (args.pop(0) if args and args[0].startswith("http") else "http://localhost:8793/").rstrip("/") + "/"
EPISODES = args or "eve-lit-tout octet-change cle-vallee paquet-complet encore-des-tours".split()
MEASURE = """() => {
  const R = demo.inside, w = R.want, r = id => { const e = document.getElementById(id); return e?.offsetHeight ? Math.round(e.getBoundingClientRect().bottom) : 0; };
  const bubbles = [...document.querySelectorAll('#bubbles .bubble.show')].filter(e => getComputedStyle(e).visibility !== 'hidden')
    .map(e => { const b = e.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; });
  let top = null;
  if (w) { const v = w.box.max.clone(); v.x = (w.box.min.x + w.box.max.x) / 2; v.project(R.camera || demo.camera); top = Math.round((1 - v.y) / 2 * innerHeight); }
  return { tab: r('topbar-tab'), band: w && Math.round(w.b.top), frameTop: top, bubbles };
}"""
bad = 0
with sync_playwright() as p:
    b = launch(p)
    for ep in EPISODES:
        for lang in ["fr", "en"]:
            ctx = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
            pg = ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(f"{base}{ep}/?instant=1&lang={lang}#story=1")
            pg.wait_for_function("window.demo && demo.ready", timeout=60000)
            pg.add_style_tag(content=".bubble { transition: none !important; }")
            n = pg.evaluate(f"async () => (await import('{base}{ep}/js/story.js')).STEPS.length")
            for s in range(1, n + 1):
                pg.goto(f"{base}{ep}/?instant=1&lang={lang}#story={s}"); pg.reload()
                pg.wait_for_function("window.demo && demo.ready", timeout=60000)
                pg.add_style_tag(content=".bubble { transition: none !important; }")
                pg.wait_for_timeout(2500)
                if not pg.evaluate("demo.inside.active && !!demo.inside.room"): continue
                pg.evaluate("demo.inside.hold = 16"); pg.wait_for_timeout(2500)
                if OPEN:
                    if not pg.is_visible("#step-more"): continue
                    pg.click("#step-more"); pg.wait_for_timeout(2500)
                m = pg.evaluate(MEASURE)
                ok = m["frameTop"] is not None and all(bot <= m["frameTop"] for _, bot in m["bubbles"])
                bad += not ok
                print(("ok   " if ok else "BAD  ") + f"{ep} {lang} step {s}: {json.dumps(m)}", flush=True)
            if errs: bad += 1; print(f"BAD  {ep} {lang}: page error {errs[:1]}")
            ctx.close()
    b.close()
print("all ok" if not bad else f"{bad} failed"); sys.exit(bad > 0)
