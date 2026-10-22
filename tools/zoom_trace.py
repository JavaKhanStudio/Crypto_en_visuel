#!/usr/bin/env python3
"""r103: a frame-by-frame trace of a zoom into a castle room, on the machine's GPU: for every
animation frame, the time since go(), which scene is drawn (valley / room), the veil's opacity, and
the drawn camera's speed and distance to what it looks at. Proves the camera keeps closing in while
the veil rises, and shows any stop.
    tools/zoom_trace.py eve-lit-tout/ 4 [--base URL] [--out out/r103/trace]   # in; writes .csv and .png
    tools/zoom_trace.py eve-lit-tout/ 8 --leave                                 # out
"""
import argparse, csv, json
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader
from PIL import Image, ImageDraw


def chart(tr, path, title, W=900, H=260):
    """the zoom rate (blue, smoothed over 5 frames) over the veil (gold), the swap dashed"""
    im = Image.new("RGB", (W, H), "white"); d = ImageDraw.Draw(im); L, B, T = 50, H - 30, 24
    tmax = tr[-1]["t"] or 1; x = lambda t: L + (W - L - 10) * t / tmax
    rate = [r["rate"] for r in tr]; sm = [sorted(rate[max(0, i - 2):i + 3])[len(rate[max(0, i - 2):i + 3]) // 2] for i in range(len(rate))]
    for i in range(1, len(tr)):
        d.polygon([(x(tr[i-1]["t"]), B), (x(tr[i-1]["t"]), B - (B - T) * tr[i-1]["veil"]), (x(tr[i]["t"]), B - (B - T) * tr[i]["veil"]), (x(tr[i]["t"]), B)], fill="#f3dfae")
    for k in range(7): y = B - (B - T) * k / 6; d.line([(L, y), (W - 10, y)], fill="#eee"); d.text((L - 22, y - 6), f"{k}/s", fill="#666")
    for i in range(1, len(tr)):
        if tr[i]["scene"] != tr[i-1]["scene"]:
            for y in range(T, B, 8): d.line([(x(tr[i]["t"]), y), (x(tr[i]["t"]), y + 4)], fill="#555")
            d.text((x(tr[i]["t"]) + 4, T + 2), "swap to the " + tr[i]["scene"], fill="#555"); continue
        d.line([(x(tr[i-1]["t"]), B - (B - T) * min(sm[i-1], 6) / 6), (x(tr[i]["t"]), B - (B - T) * min(sm[i], 6) / 6)], fill="#3b6fd6", width=3)
    for t in range(0, tmax, 500): d.text((x(t) - 8, B + 8), f"{t/1000:.1f}s", fill="#666")
    d.text((L, 4), title + "   blue: zoom rate = speed / distance   gold: veil", fill="#000")
    im.save(path)

ap = argparse.ArgumentParser()
ap.add_argument("page"); ap.add_argument("step", type=int, help="the step that moves (1-based): the first inside, or with --leave the first out")
ap.add_argument("--base", default="http://localhost:8793/"); ap.add_argument("--out", default="")
ap.add_argument("--size", default="1280x760"); ap.add_argument("--secs", type=float, default=5)
ap.add_argument("--check", action="store_true", help="exit 1 unless the zoom keeps closing in (or backing off) through the veil")
ap.add_argument("--every", type=int, default=3, help="print one frame in N")
ap.add_argument("--leave", action="store_true", help="the step is a way out: wait longer first, for the room to settle")
a = ap.parse_args()
w, h = map(int, a.size.split("x"))
HOOK = """() => { window.__trace = []; const t0 = performance.now(), d = window.demo, veil = document.getElementById('veil');
  let last = null;
  const tick = () => { const ins = d.inside, inRoom = ins.active, cam = inRoom ? ins.camera : d.camera;
    const p = cam.position.clone(), tgt = inRoom ? ins.view.center : (ins.focus || d.rig.controls.target);
    const now = performance.now();
    const sp = last ? p.distanceTo(last.p) / ((now - last.t) / 1000) : 0;
    window.__trace.push({ t: Math.round(now - t0), scene: inRoom ? 'room' : 'valley', veil: +getComputedStyle(veil).opacity,
      speed: +sp.toFixed(2), dist: +p.distanceTo(tgt).toFixed(2), rate: +(sp / Math.max(.01, p.distanceTo(tgt))).toFixed(2),
      vd: inRoom ? +ins.view.d.toFixed(2) : null, wd: inRoom && ins.want ? +ins.want.d.toFixed(2) : null, arr: !!ins.arrival });
    last = { p, t: now }; requestAnimationFrame(tick); };
  requestAnimationFrame(tick); }"""
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": w, "height": h}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"{a.base}{a.page}#story={a.step - 1}", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(6000 if a.leave else 3500)
    pg.evaluate(HOOK); pg.evaluate(f"demo.story.go({a.step - 1})")
    pg.wait_for_timeout(int(a.secs * 1000))
    tr = pg.evaluate("window.__trace"); b.close()
gaps = [y["t"] - x["t"] for x, y in zip(tr, tr[1:])]
print(f"{len(tr)} frames, median frame {sorted(gaps)[len(gaps)//2]} ms, longest {max(gaps)} ms", "errors:", errs or "none")
for r in tr[::a.every]:
    print(f"{r['t']:5} {r['scene']:6} veil {r['veil']:.2f}  speed {r['speed']:7.2f}  dist {r['dist']:7.2f}  rate {r['rate']:5.2f}/s", f"view.d {r['vd']} want {r['wd']} arrival {r['arr']}" if r['vd'] else "")
if a.check:
    # rates smoothed over 5 frames (a GPU's frame times jitter); the swap frame compares two cameras
    sm = lambda i: sorted(r["rate"] for r in tr[max(0, i - 2):i + 3])[2] if 2 <= i < len(tr) - 2 else tr[i]["rate"]
    swap = next(i for i in range(1, len(tr)) if tr[i]["scene"] != tr[i - 1]["scene"])
    rising = [i for i in range(swap) if .05 < tr[i]["veil"] < .98] if not a.leave else [i for i in range(swap + 2, len(tr)) if .05 < tr[i]["veil"] < .98]
    first = sm(rising[0]) if not a.leave else sm(rising[-1])
    low = min(sm(i) for i in rising)
    room = [sm(i) for i in range(swap + 2, swap + 8)] if not a.leave else [sm(i) for i in range(swap - 8, swap - 2)]
    other = sm(swap - 3) if not a.leave else sm(swap + 3)
    # the whole valley side, once under way (0.5/s): its rate never falls under half of what it reached
    side = list(range(swap)) if not a.leave else list(range(len(tr) - 1, swap, -1))
    side = [i for i in side if tr[i]["veil"] < .98 or not a.leave]
    go = next((n for n, i in enumerate(side) if sm(i) >= .5), len(side)); worst, top = 9, 0
    for i in side[go:]:
        top = max(top, sm(i)); worst = min(worst, sm(i) / top)
    if a.leave: worst = 1 if go >= len(side) else worst   # backwards: the pull-out may slow onto its shot
    ok = [("no slow-down on the way to the glass (worst %.0f%% of the rate already reached)" % (100 * worst), a.leave or worst >= .5),
          ("the camera moves all through the veil (lowest rate %.2f/s, %.2f/s as it starts)" % (low, first), low >= .6 * first and low > .5),
          ("the room side keeps the pace (%.2f/s against %.2f/s at the glass)" % (max(room), other), max(room) >= .5 * other)]
    for name, good in ok: print("ok  " if good else "FAIL", name)
    print("all ok" if all(g for _, g in ok) else "FAILED")
    if not all(g for _, g in ok): raise SystemExit(1)
if a.out:
    with open(a.out + ".csv", "w", newline="") as f:
        wr = csv.DictWriter(f, fieldnames=list(tr[0])); wr.writeheader(); wr.writerows(tr)
    chart(tr, a.out + ".png", f"{a.base}{a.page} step {a.step}"); print(a.out + ".png")
