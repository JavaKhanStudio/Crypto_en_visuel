#!/usr/bin/env python3
"""Where the gold path of enigma-reglage starts, on screen, frame by frame (r228).

Serve the repo first (python3 -m http.server 8793), then:
    tools/reglage_drift.py 4 play:300 next:200 play:400
    tools/reglage_drift.py 4 play:420 next:240 play:480 --gpu --live --video out/vid
Same words as tools/reglage_frames.py (<action>:<frames>, action play, next, prev or wait), on a
hand-driven clock of --dt seconds (1/60: a real screen's frame), or with --live on the page's own
clock, each frame a screen refresh. Each frame logs, in pixels, the first point of the first path
tube (the top of the key) and its middle, the camera, the key's height, and the left edge of the
corner card's last row (key and cable cells); a line is printed whenever one of them moves by more
than --eps pixels. --gpu renders on this machine's GPU (headless, no window) instead of SwiftShader.
"""
import argparse, json
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser(); ap.add_argument('step', type=int); ap.add_argument('acts', nargs='+')
ap.add_argument('--dt', type=float, default=1 / 60); ap.add_argument('--base', default='http://localhost:8793/')
ap.add_argument('--size', default='1440x860'); ap.add_argument('--eps', type=float, default=.05)
ap.add_argument('--gpu', action='store_true', help="this machine's GPU (ANGLE on EGL) instead of SwiftShader")
ap.add_argument('--live', action='store_true', help='the real clock (requestAnimationFrame) instead of a hand-driven one: a frame is then a screen refresh')
ap.add_argument('--video', help='with --live: a folder to record the run in (webm)')
a = ap.parse_args()
W, H = map(int, a.size.split('x'))
PROBE = """() => {
  const d = demo, T = d.THREE, tube = d.stage.paths.children.find(m => !m.material.transparent);
  const px = p => { const q = p.clone().project(d.camera); return [+((q.x + 1) / 2 * innerWidth).toFixed(2), +((1 - q.y) / 2 * innerHeight).toFixed(2)]; };
  const out = { tubes: d.stage.paths.children.length, cam: d.camera.position.toArray().map(x => +x.toFixed(4)),
    keyY: +d.stage.machines.a.userData.keys.O.position.y.toFixed(4), arm: +d.stage.people.a.userData.arms.rotation.x.toFixed(3) };
  const row = document.querySelector('#card table tr:last-child'), card = document.getElementById('card');
  if (row && row.cells.length > 2) { const r = row.cells[0].getBoundingClientRect(), g = row.cells[2].getBoundingClientRect(); out.cardKey = [+r.left.toFixed(1), +g.left.toFixed(1)]; out.cardW = +card.getBoundingClientRect().width.toFixed(1); }
  if (tube) { const c = tube.userData.curve; out.start = px(c.getPoint(0)); out.mid = px(c.getPoint(.5)); out.n = tube.geometry.drawRange.count; }
  return out;
}"""
with sync_playwright() as p:
    gl = ["--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu"] if a.gpu else ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
    b = p.chromium.launch(args=gl + ["--ignore-gpu-blocklist"])
    vid = {'record_video_dir': a.video, 'record_video_size': {'width': W, 'height': H}} if a.video else {}
    pg = b.new_page(viewport={"width": W, "height": H}, **vid); errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{a.base}enigma-reglage/#story={a.step}", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    print("renderer:", pg.evaluate("""() => { const c = document.createElement('canvas').getContext('webgl2'), e = c.getExtension('WEBGL_debug_renderer_info'); return c.getParameter(e.UNMASKED_RENDERER_WEBGL); }"""))
    if a.live:
        # every refresh logs the probe; a word's frames are refreshes, waited for in real time
        pg.evaluate(f"() => {{ window.__log = []; const probe = {PROBE}; const f = () => {{ __log.push(probe()); requestAnimationFrame(f); }}; requestAnimationFrame(f); }}")
        pg.wait_for_timeout(3000)
    else:
        pg.evaluate("demo.freeze()")
        for _ in range(int(3 / a.dt)): pg.evaluate(f"demo.step({a.dt})")   # the camera lands
    last = None; n = 0
    for word in a.acts:
        act, k = word.split(':')
        if act != 'wait': pg.evaluate({'play': "document.querySelector('#play').click()",
                                       'next': "document.querySelector('#next').click()",
                                       'prev': "document.querySelector('#prev').click()"}[act])
        print(f"--- {word} at frame {n}")
        if a.live:
            i0 = pg.evaluate("__log.length"); pg.wait_for_function(f"__log.length >= {i0 + int(k)}", timeout=120000, polling=50)
            todo = pg.evaluate(f"__log.slice({i0}, {i0 + int(k)})")
        else: todo = None
        for j in range(int(k)):
            if todo is None: pg.evaluate(f"demo.step({a.dt})"); s = pg.evaluate(PROBE)
            else: s = todo[j]
            n += 1
            if last and 'start' in s and 'start' in last:
                dd = max(abs(x - y) for x, y in zip(s['start'] + s['mid'] + s.get('cardKey', []), last['start'] + last['mid'] + last.get('cardKey', [])))
                if dd > a.eps or s['cam'] != last['cam'] or s['keyY'] != last['keyY']:
                    print(n, f"moved {dd:.2f}px", json.dumps(s))
            elif 'start' in s and not (last and 'start' in last): print(n, "path appears", json.dumps(s))
            last = s
    print("page errors:", errors or "none")
    pg.close(); b.close()
    if a.video: print("video in", a.video)
