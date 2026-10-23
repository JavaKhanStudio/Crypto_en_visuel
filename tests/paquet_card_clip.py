#!/usr/bin/env python3
"""Episodes 1.5, 1.4 and 1.6 on a desktop: a corner card taller than the room above the story panel stops on a
whole row, never halfway through one, and its last line « ▾ la suite plus bas » / '▾ more below'
says what is hidden, until the reader scrolls to the end (r478, after r129 cut the IV in half; r504
rolled it out to cle-vallee and encore-des-tours).

Serve the repo first (python3 -m http.server 8793). Walks every story step, fr and en, at 1440x860,
1280x720 and 1920x1080, and checks: the card stays off the story panel where they share columns;
no row of the card (a line of hex, a label, a size, a list item) is cut by the card's visible bottom;
an overflowing card shows the cue, a fitting one does not; scrolled to the end, the cue hides.
Usage: tests/paquet_card_clip.py [base] [episode]   (episode: paquet-complet, the default, cle-vallee or encore-des-tours)"""
import sys
import os as _os; sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch
from playwright.sync_api import sync_playwright

EP = sys.argv[2] if len(sys.argv) > 2 else "paquet-complet"
BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + EP + "/"
# each episode's main.js ROWS: what one row of its card is
ROWS = {
  "paquet-complet": ":scope > *, .sizes > *, .tree > *, .why > *, .hex, .lbl, .code, .note, .order, .packet, li",
  "cle-vallee": ":scope > *, .sizes > *, .chain > *, .hex, .lbl, .note, .order, .packet, li",
  "encore-des-tours": ":scope > *, .sizes > *, .tricks > *, .duo > *, .hex, .lbl, .code, .note, .order, .packet, li",
}[EP]
MEASURE = """(ROWS) => {
  const card = document.getElementById('card'), panel = document.getElementById('story');
  if (!card.firstChild || card.classList.contains('hidden')) return null;
  const c = card.getBoundingClientRect(), p = panel.getBoundingClientRect();
  const cue = card.classList.contains('more') && !card.classList.contains('end') ? parseFloat(getComputedStyle(card, '::after').height) || 0 : 0;
  const seen = c.bottom - card.clientTop - cue;             // the lowest pixel of content a reader sees
  const cut = [...card.querySelectorAll(ROWS)].filter(r => !r.querySelector(ROWS.slice(12)))
    .map(r => r.getBoundingClientRect()).filter(r => r.height && r.top < seen - 1 && r.bottom > seen + 1)
    .map(r => Math.round(r.top) + '-' + Math.round(r.bottom));
  return { over: card.scrollHeight > card.clientHeight + 1, more: card.classList.contains('more'), cue,
    cue_text: card.classList.contains('tight') ? 'tight' : card.dataset.more || '', cut, seen: Math.round(seen),
    top: Math.round(c.top), hits: c.bottom > p.top && c.left < p.right && c.right > p.left, bottom: Math.round(c.bottom), panel: Math.round(p.top) };
}"""
bad, n_over = [], 0
with sync_playwright() as p:
    b = launch(p)
    for w, h in [(1440, 860), (1280, 720), (1920, 1080)]:
        for lang in ["fr", "en"]:
            pg = b.new_page(viewport={"width": w, "height": h})
            errors = []
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.goto(f"{BASE}?instant=1&lang={lang}#story=1", wait_until="load")
            pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
            n = int(pg.evaluate("document.getElementById('step-count').textContent.match(/\\d+\\s*\\/\\s*(\\d+)/)[1]"))
            def check(where):
                global n_over
                m = pg.evaluate(MEASURE, ROWS)
                if not m: return
                was = len(bad)
                if m["hits"]: bad.append(f"{where}: card bottom {m['bottom']} under the panel top {m['panel']}")
                if m["cut"]: bad.append(f"{where}: rows cut at the visible bottom {m['seen']}: {m['cut']}")
                if m["over"] != m["more"]: bad.append(f"{where}: overflows {m['over']}, cue {m['more']}")
                if m["over"]:
                    n_over += 1
                    want = "▾ la suite plus bas" if lang == "fr" else "▾ more below"
                    if m["cue_text"] not in (want, "tight"): bad.append(f"{where}: cue says {m['cue_text']!r}")
                    pg.evaluate("(() => { const c = document.getElementById('card'); c.scrollTop = c.scrollHeight; })()")
                    pg.wait_for_timeout(150)
                    if pg.evaluate("(c => c.classList.contains('more') && !c.classList.contains('end'))(document.getElementById('card'))"):
                        bad.append(f"{where}: scrolled to the end, the cue still shows")
                    pg.evaluate("document.getElementById('card').scrollTop = 0"); pg.wait_for_timeout(100)
                    if len(bad) == was: print(f"ok   {where}: card top {m['top']}, ends on a whole row at {m['seen']}, {'title ▾ alone' if m['cue_text'] == 'tight' else 'cue shown, hidden at the end'}")
            for i in range(n):   # the top bar leaves after 1.8 s (lib/topbar.js): the first steps see it, the rest do not
                pg.evaluate(f"demo.story.go({i})"); pg.wait_for_timeout(1200)
                check(f"{w}x{h} {lang} step {i + 1}")
            # the bar comes back as the pointer nears it, the card glides down from 14px to 96px: check it after
            pg.mouse.move(w / 2, 20); pg.wait_for_timeout(1000)
            if not pg.evaluate("document.getElementById('topbar').classList.contains('away')"):
                check(f"{w}x{h} {lang} step {n}, bar back")
            else: bad.append(f"{w}x{h} {lang}: the top bar did not come back under the pointer")
            if errors: bad.append(f"{w}x{h} {lang}: page errors {errors[:2]}")
            pg.close()
    b.close()
for x in bad: print("FAIL", x)
if not n_over: print("FAIL no step overflowed: the cue was never tested")
print("all ok" if not bad and n_over else f"{len(bad)} failed")
sys.exit(1 if bad or not n_over else 0)
