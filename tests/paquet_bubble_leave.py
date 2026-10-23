# r569: when a step changes, the bubbles of the step before must fade out at once, the same .35 s fade
# whatever the next step is: here a jump from step 5 (in Alice's room) to step 7 (into Bob's), against an
# ordinary change in the valley (11 to 12, 13 to 14) and 9 to 10 (valley into Bob's room). Samples, every 30 ms
# by setInterval in the page, the opacity of the old step's bubbles and the longest main-thread stall,
# from go() until they are gone. Usage: python3 tests/paquet_bubble_leave.py [base]
import sys, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, 'tools')
from browser import launch

base = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8793/'
PROBE = """async ([to]) => {
  const old = [...document.querySelectorAll('#bubbles .bubble.show')];
  if (!old.length) return { none: true };
  const t0 = performance.now(), rows = []; let last = t0, stall = 0;
  const iv = setInterval(() => {
    const now = performance.now(); stall = Math.max(stall, now - last); last = now;
    rows.push([Math.round(now - t0), Math.max(...old.map(b => b.isConnected ? +getComputedStyle(b).opacity : 0))]);
  }, 30);
  demo.story.go(to);
  await new Promise(r => setTimeout(r, 900)); clearInterval(iv);
  const full = rows.filter(([, o]) => o > .95).map(([t]) => t);
  return { stall: Math.round(stall), opaqueUntil: full.length ? Math.max(...full) : 0,
    goneAt: (rows.find(([, o]) => o < .05) || [-1])[0], rows };
}"""
bad = 0
with sync_playwright() as p:
    b = launch(p)
    for frm, to, size in [(5, 7, '1280x800'), (5, 7, '390x844'), (11, 12, '1280x800'), (13, 14, '1280x800'), (9, 10, '1280x800')]:
        w, h = map(int, size.split('x'))
        pg = b.new_page(viewport={'width': w, 'height': h})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f"{base}paquet-complet/#story={frm}", wait_until='load')
        pg.wait_for_function('window.demo && demo.ready')
        pg.wait_for_function("document.querySelectorAll('#bubbles .bubble.show').length > 0", timeout=60000)
        pg.wait_for_timeout(1500)
        r = pg.evaluate(PROBE, [to - 1])
        if r.get('none'): print(f"SKIP {frm}->{to} {size}: no bubble on step {frm}"); bad += 1; continue
        # the fade is .35 s and starts at go(); building a room stalls the page up to ~150 ms (9 -> 10), so a
        # bubble still fully drawn 200 ms after go(), or not gone by 500 ms, is late
        ok = r['opaqueUntil'] <= 200 and 0 <= r['goneAt'] <= 500 and not errs
        bad += not ok
        print(f"{'ok  ' if ok else 'FAIL'} {frm}->{to} {size}: opaque until {r['opaqueUntil']} ms, gone at {r['goneAt']} ms, longest stall {r['stall']} ms{' errors: ' + str(errs) if errs else ''}")
        pg.close()
    b.close()
print('all ok' if not bad else f'{bad} failed')
sys.exit(1 if bad else 0)
