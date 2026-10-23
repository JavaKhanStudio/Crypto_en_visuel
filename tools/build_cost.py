#!/usr/bin/env python3
"""r603: where the synchronous build of the room built ahead goes (lib/room.js ahead() -> build()):
the canvases drawn (tile faces, labels), the rest of the episode's room build, the shell; then the whole of ahead()'s own task (r603: r170's compileAsync set up every material's program in it, 110 ms)
and how long until the room is ready, timed on the
first ahead() of a fresh page (the tile faces are cached across builds, so only a first one counts).
Serve the repo root first.
    tools/build_cost.py [--base URL] [--page encore-des-tours/] [--step 5] [--runs 2]
"""
import argparse
from playwright.sync_api import sync_playwright
from browser import launch

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="encore-des-tours/")
ap.add_argument("--step", type=int, default=5)
ap.add_argument("--runs", type=int, default=2)
a = ap.parse_args()
# installed before the page's scripts: every 2d canvas made and its drawing time
INIT = """(() => { const st = window.__cost = { canvases: 0, draw: 0, on: false };
  const P = CanvasRenderingContext2D.prototype;
  for (const k of ['fillText', 'measureText', 'fillRect', 'strokeRect', 'fill', 'roundRect']) {
    const g = P[k]; P[k] = function (...x) { if (!st.on) return g.apply(this, x); const s = performance.now(); const o = g.apply(this, x); st.draw += performance.now() - s; return o; }; }
  const ce = Document.prototype.createElement;
  Document.prototype.createElement = function (n, ...x) { if (st.on && n === 'canvas') st.canvases++; return ce.call(this, n, ...x); };
})()"""
PROBE = """() => new Promise(res => { const ins = demo.inside, st = window.__cost, out = {};
  const ah = ins.ahead; ins.ahead = function (...x) { const s = performance.now(); ah.apply(this, x); out.ahead = performance.now() - s; this.ahead = ah;
    const n = this.next, t0 = performance.now(); if (!n) return res(out); n.ready.then(() => { out.ready = performance.now() - t0; res(out); }); };
  const g = ins.build, shell = ins.shell;
  ins.build = function (name, send, door) {
    const rooms = this.rooms[name], rb = rooms.build;
    rooms.build = (...x) => { const s = performance.now(); const m = rb(...x); out.room = performance.now() - s; return m; };
    if (shell) this.shell = (...x) => { const s = performance.now(); shell(...x); out.shell = performance.now() - s; };
    st.on = true; st.draw = 0; st.canvases = 0; const s = performance.now();
    const r = g.call(this, name, send, door);
    out.total = performance.now() - s; st.on = false; rooms.build = rb; this.shell = shell; this.build = g;
    let n = 0, maps = new Set(); r.scene.traverse(o => { if (o.isMesh || o.isSprite) n++; [o.material].flat().forEach(m => m?.map && maps.add(m.map)); });
    Object.assign(out, { name, canvases: st.canvases, draw: st.draw, drawables: n, maps: maps.size });
    return r; };
})"""
with sync_playwright() as p:
    b = launch(p)
    for run in range(a.runs):
        ctx = b.new_context(viewport={"width": 1280, "height": 760}); ctx.add_init_script(INIT); pg = ctx.new_page()
        pg.goto(f"{a.base}{a.page}#story={a.step}"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        o = pg.evaluate(PROBE)
        print(f"run {run + 1}: ahead build of {o['name']}: {o['total']:.0f} ms (room {o['room']:.0f}, shell {o.get('shell', 0):.0f}); "
              f"ahead() {o['ahead']:.0f} ms in its task, ready (compiled, uploaded, warmed) {o['ready']:.0f} ms later; {o['canvases']} canvases made, {o['draw']:.0f} ms drawing them; {o['drawables']} drawables, {o['maps']} textures")
        ctx.close()
