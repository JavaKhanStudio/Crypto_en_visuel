#!/usr/bin/env python3
"""r496: from one keep room straight to another (a step jump, 1.5's 'lock' to 'open'), lib/room.js slides
the picture across. Traces it every animation frame on the GPU: the slide's share s (0 -> 1), the frame
time, the room drawn. Checks it starts at once (no stall before it), never stalls (no frame over 50 ms, or over the
room's own worst just after when the GPU is shared), costs under twice one room,
s only grows, eased (its first and last frames move less than the middle ones), lands in the new room
with no zoom through the valley, and the render pass is the plain one again after.
    tools/slide_trace.py [--base URL] [--page paquet-complet/] [--from 5] [--step 7] [--size 1280x760]
"""
import argparse, json
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="paquet-complet/")
ap.add_argument("--from", dest="frm", type=int, default=5)
ap.add_argument("--step", type=int, default=7)
ap.add_argument("--size", default="1280x760")
a = ap.parse_args()
w, h = map(int, a.size.split("x"))
bad = []
def report(name, ok, note=""):
    print(("ok   " if ok else "FAIL ") + name + ("  " + note if note else ""))
    if not ok: bad.append(name)
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": w, "height": h})
    errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{a.base}{a.page}#story={a.frm}")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_function("demo.inside.active && !demo.inside.arrival", timeout=30000)
    pg.wait_for_timeout(1500)
    tr = pg.evaluate("""async step => {
      const ins = demo.inside, tr = [], t0 = performance.now(), from = ins.room.name, logs = ins.log.length;
      let done = false;
      const tick = () => { tr.push({ t: performance.now() - t0, s: ins.sliding ? ins.sliding.s : null, room: ins.room?.name,
        outer: demo.composer.passes[0].scene === ins.outer.scene, veil: +getComputedStyle(ins.veil).opacity });
        if (!done) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      demo.story.go(step);
      await new Promise(r => setTimeout(r, 3500)); done = true;
      return { tr, from, log: ins.log.slice(logs).map(l => l[0]), own: Object.hasOwn(demo.composer.passes[0], 'render') };
    }""", a.step - 1)
    b.close()
t = tr["tr"]
sl = [r for r in t if r["s"] is not None]
print(f"from room '{tr['from']}' to '{t[-1]['room']}', log {tr['log']}, {len(t)} frames, {len(sl)} sliding")
report("the slide runs", len(sl) > 10, f"{len(sl)} frames")
if sl:
    first = next(i for i, r in enumerate(t) if r["s"] is not None)
    report("it starts at once (no stall before it)", sl[0]["t"] < 400, f"first slide frame at {sl[0]['t']:.0f} ms")
    span = [t[i]["t"] - t[i - 1]["t"] for i in range(first, first + len(sl) + 1) if i < len(t)]
    # the same room alone, just after: what this machine draws now (another session's browser shares the GPU)
    rest = [t[i]["t"] - t[i - 1]["t"] for i in range(first + len(sl) + 2, len(t))]
    med = lambda x: sorted(x)[len(x) // 2]
    print(f"     sliding: median {med(span):.1f} ms, longest {max(span):.1f} ms; the room alone after: median {med(rest):.1f} ms, longest {max(rest):.1f} ms")
    print("     frames over 40 ms while sliding (frame: ms at s):", [(i, round(d), round(sl[min(i, len(sl) - 1)]["s"], 3)) for i, d in enumerate(span) if d > 40])
    report("no frame over 50 ms while sliding, or over the room's own worst", max(span) < max(50, max(rest) * 1.2), f"longest {max(span):.1f} ms")
    report("two rooms drawn cost under twice one", med(span) < 2 * med(rest) + 2, f"median {med(span):.1f} against {med(rest):.1f} ms")
    ss = [r["s"] for r in sl]
    report("s only grows", all(b >= a for a, b in zip(ss, ss[1:])), f"{ss[0]:.3f} .. {ss[-1]:.3f}")
    d = [b - a for a, b in zip(ss, ss[1:])]
    mid = max(d)
    report("eased: slow at both ends, fastest in the middle", d[0] < mid / 3 and d[-1] < mid / 3, f"first {d[0]:.4f}, last {d[-1]:.4f}, max {mid:.4f}")
    report("no veil while sliding", max(r["veil"] for r in sl) < .01)
report("never through the valley", not any(r["outer"] for r in t), "")
report("lands in the new room", t[-1]["room"] != tr["from"] and t[-1]["s"] is None, f"{t[-1]['room']}")
report("logged as a slide, no zoom in", tr["log"] == ["slide"], f"{tr['log']}")
report("the render pass draws one scene again", not tr["own"])
report("no page errors", not errors, "; ".join(errors))
print("all ok" if not bad else f"{len(bad)} failed")
