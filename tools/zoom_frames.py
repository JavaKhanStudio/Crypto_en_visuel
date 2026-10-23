#!/usr/bin/env python3
"""r492: where the time goes in the frames around a zoom's swap into a room. For each animation frame
from 4 before the swap to 8 after: the gap since the last frame and the ms spent in Inside.update,
Inside.fit, Bubbles.settle and renderer.render (the GPU wait shows up in render). A long frame right
after the swap with a long render is the room's first draw: lib/room.js warmUp(room, true) moves it to
the glass, under the whole veil.
    tools/zoom_frames.py octet-change/ 5 [--base URL]    # the step that zooms in (1-based)
r602: --ahead first builds the step's room ahead from the page (inside.ahead(name, packets()), what the
episode's story.js does on the step before), waits until it is warm, then zooms: the swap should then
be a frame like the others, and it prints whether enter() took that room.
r611: without --ahead, it prints whether the episode's own story built the room ahead while the step
before was read (--read ms, 3500 by default: how long that step is read before the click).
"""
import argparse
from playwright.sync_api import sync_playwright
from browser import launch   # r401

ap = argparse.ArgumentParser()
ap.add_argument("page"); ap.add_argument("step", type=int)
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--ahead", action="store_true")
ap.add_argument("--read", type=int, default=3500)
a = ap.parse_args()
with sync_playwright() as p:
    b = launch(p); pg = b.new_page(viewport={"width": 1280, "height": 760})
    pg.goto(f"{a.base}{a.page}#story={a.step - 1}", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000); pg.wait_for_timeout(a.read)
    pg.evaluate("""() => { const ins = demo.inside, r = ins.renderer; window.__f = []; const t0 = performance.now();
      const wrap = (o, k, tag) => { const f = o[k]; o[k] = function (...a) { const s = performance.now(); const x = f.apply(this, a);
        (window.__cur ||= {})[tag] = (window.__cur[tag] || 0) + performance.now() - s; return x; }; };
      wrap(ins, 'update', 'update'); wrap(ins, 'fit', 'fit'); wrap(ins.bubbles, 'settle', 'settle'); wrap(r, 'render', 'render');
      let last = performance.now();
      const tick = () => { const n = performance.now();
        window.__f.push({ t: Math.round(n - t0), gap: Math.round(n - last), scene: ins.active ? 'room' : 'valley', ...(window.__cur || {}) });
        window.__cur = {}; last = n; requestAnimationFrame(tick); };
      requestAnimationFrame(tick); }""")
    if a.ahead:
        print("ahead: warm in", pg.evaluate(f"""async () => {{ const m = await import(location.pathname + 'js/story.js'), s = m.STEPS[{a.step - 1}];
          const t = performance.now(); demo.inside.ahead(s.inside, (m.packets || (() => m.sendOf(s.key || 1)))());
          await demo.inside.next.ready; window.__ahead = demo.inside.next.warm && demo.inside.next.room;
          return Math.round(performance.now() - t) + ' ms' + (window.__ahead ? '' : ' (NOT warm)'); }}"""))
        pg.wait_for_timeout(500)
    else: print("built ahead by the story:", pg.evaluate("(n => n ? (n.warm ? 'warm ' : 'NOT warm ') + n.name : 'none')(demo.inside.next)"))
    pg.evaluate(f"demo.story.go({a.step - 1})"); pg.wait_for_timeout(4000)
    if a.ahead: print("taken by enter():", pg.evaluate("demo.inside.room === window.__ahead"))
    f = pg.evaluate("window.__f"); b.close()
sw = next(i for i in range(1, len(f)) if f[i]["scene"] != f[i - 1]["scene"])
for r in f[max(0, sw - 4):sw + 8]:
    print(f"{r['t']:5} {r['scene']:6} gap {r['gap']:4} ms", "  ".join(f"{k} {r[k]:.1f}" for k in ("update", "fit", "settle", "render") if k in r))
