#!/usr/bin/env python3
"""r614: a room built ahead (lib/room.js ahead()) but taken by enter() before it is warm: what is left
to compile at the glass. Frame times on a shared, loaded GPU swing 90-1700 ms either way (tools/
zoom_frames.py), so this counts instead: when enter() draws the room at the glass (warmUp(room, true)),
how many of its materials have no program yet or one the driver has not finished (isReady), how many
programs that draw builds (renderer.info.programs), and how long it takes.
    tools/taken_cold.py encore-des-tours/ 5 [--read 3000] [--base URL] [--n 3]
The step is the one that zooms in (1-based); the step before is read --read ms before the click.
"""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from browser import launch   # r401

ap = argparse.ArgumentParser()
ap.add_argument("page"); ap.add_argument("step", type=int)
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--read", type=int, default=3000)
ap.add_argument("--n", type=int, default=3)
a = ap.parse_args()
with sync_playwright() as p:
    b = launch(p)
    for k in range(a.n):
        pg = b.new_page(viewport={"width": 1280, "height": 760}); errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{a.base}{a.page}#story={a.step - 1}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000); pg.wait_for_timeout(a.read)
        ahead = pg.evaluate("(n => n ? (n.warm ? 'warm ' : 'NOT warm ') + n.name : 'none')(demo.inside.next)")
        pg.evaluate("""() => { const ins = demo.inside, r = ins.renderer, f = ins.warmUp; window.__glass = null;
          ins.warmUp = function (room, all, only) {
            if (!all || only || ins.next) return f.apply(this, arguments);   // ahead()'s own slices
            const mats = new Set(); room.scene.traverse(o => [o.material].flat().forEach(m => m && mats.add(m)));
            let none = 0, busy = 0;
            mats.forEach(m => { const q = r.properties.get(m).currentProgram; if (!q) none++; else if (!q.isReady()) busy++; });
            const n0 = r.info.programs.length, t = performance.now(); const x = f.apply(this, arguments);
            r.getContext().finish();
            window.__glass = { mats: mats.size, none, busy, built: r.info.programs.length - n0, ms: Math.round(performance.now() - t) };
            return x; };
          // then each frame from the click: the time in renderer.render (to the GPU's end), programs and textures it added
          const rr = r.render; window.__fr = [];
          r.render = function () { const p0 = r.info.programs.length, x0 = r.info.memory.textures, t = performance.now();
            const x = rr.apply(this, arguments); r.getContext().finish();
            const ms = performance.now() - t, last = window.__fr.at(-1), now = Math.round(performance.now());
            const row = last && now - last.at < 4 ? last : (window.__fr.push({ at: now, ms: 0, prog: 0, tex: 0, room: ins.active }), window.__fr.at(-1));
            row.at = now; row.ms += ms; row.prog += r.info.programs.length - p0; row.tex += r.info.memory.textures - x0; return x; }; }""")
        pg.evaluate(f"demo.story.go({a.step - 1})"); pg.wait_for_timeout(6000)
        g = pg.evaluate("window.__glass"); fr = pg.evaluate("window.__fr")
        print(f"{a.page} {a.step} read {a.read}: ahead {ahead:16} at the glass:",
              f"{g['mats']} materials, {g['none']} with no program, {g['busy']} unfinished, {g['built']} built there, {g['ms']} ms"
              if g else "no warmUp (taken warm)", "  page errors: " + "; ".join(errors[:2]) if errors else "")
        sw = next((i for i in range(1, len(fr)) if fr[i]["room"] and not fr[i - 1]["room"]), None)
        worst = max(fr, key=lambda r: r["ms"])
        print(f"   worst frame {worst['ms']:.0f} ms ({'room' if worst['room'] else 'valley'}, {worst['prog']} programs built, {worst['tex']} textures);",
              f"first room frame {fr[sw]['ms']:.0f} ms, {fr[sw]['prog']} programs, {fr[sw]['tex']} textures" if sw else "no swap")
        pg.close()
    b.close()
