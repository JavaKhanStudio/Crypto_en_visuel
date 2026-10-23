#!/usr/bin/env python3
"""r604: what the zoom into a room spends, and when. Default: every renderer.compile / initTexture /
Inside.warmUp call from go() on (CPU ms; initTexture merged by run) and every frame over 90 ms.
--split: the draw at the glass (Inside.warmUp(room, true)) taken apart, each part closed by gl.finish():
the textures not yet uploaded, the room drawn with nothing shown, one shadow caster without then with
the shadow pass (and whether three built a program there), one drawable per program, the whole room.
What it found on 1.6 step 5 (loaded GPU): initTexture of the ~275 textures left costs 4-8 ms, but the
next draw pays them (Chrome uploads a canvas texture at its next draw), 700-1050 ms; with none left
that draw is 74-94 ms. No program is built at the glass.
Serve the repo first.
    tools/zoom_slices.py [--base URL] [--page encore-des-tours/] [--step 5] [--split]
"""
import argparse
from playwright.sync_api import sync_playwright
from browser import launch

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="encore-des-tours/")
ap.add_argument("--step", type=int, default=5)
ap.add_argument("--split", action="store_true")
ap.add_argument("--no-upload", action="store_true", help="with --split: leave the textures not yet uploaded alone, so a long caster draw is the program, not them")
a = ap.parse_args()
LOG = """step => new Promise(res => { const r = demo.inside.renderer, t0 = performance.now(), ev = [];
  const wrap = (o, k) => { const g = o[k]; o[k] = function (...x) { const s = performance.now(); const out = g.apply(this, x); ev.push([k, Math.round(s - t0), +(performance.now() - s).toFixed(1)]); return out; }; };
  wrap(r, 'initTexture'); wrap(r, 'compile'); wrap(demo.inside, 'warmUp');
  let last = t0; const tick = () => { const n = performance.now(); if (n - last > 90) ev.push(['FRAME', Math.round(n - t0), Math.round(n - last)]); last = n; if (n - t0 < 6000) requestAnimationFrame(tick); else res(ev); };
  requestAnimationFrame(tick); demo.story.go(step); })"""
SPLIT = """step => new Promise(res => { const ins = demo.inside, r = ins.renderer, gl = r.getContext(), g = ins.warmUp, out = {};
  ins.warmUp = function (room, all, only) {
    if (!all || only) return g.call(this, room, all, only);
    const t = () => { gl.finish(); return performance.now(); };
    let s = t(); out.before = 0;
    const maps = new Set(); room.scene.traverse(o => [o.material].flat().forEach(m => m?.map && maps.add(m.map)));
    const up = [...maps].filter(m => !r.properties.get(m).__webglTexture); if (!NOUP) up.forEach(m => r.initTexture(m));
    let e = t(); out.textures = [up.length, maps.size, Math.round(e - s)]; s = e;
    const one = new Map(); room.scene.traverse(o => [o.material].flat().forEach(m => { const p = m && r.properties.get(m).currentProgram; if (p && !one.has(p)) one.set(p, o); }));
    out.programs = [];
    // the shadow pass alone first: nothing drawn but what casts a shadow, into the shadow map
    const cam = r.shadowMap.enabled; out.shadow = Math.round((() => { const casts = []; room.scene.traverse(o => o.castShadow && (o.isMesh) && casts.push(o));
      out.casters = casts.length; return 0; })());
    // the room's first render with no drawable shown (lights, shadow map), then one caster alone (the depth programs)
    g.call(this, room, true, []); e = t(); out.programs.push([Math.round(e - s), 'nothing drawn']); s = e;
    let caster = null; room.scene.traverse(o => { if (!caster && o.isMesh && o.castShadow) caster = o; });
    if (caster) { const au = r.shadowMap.autoUpdate; r.shadowMap.autoUpdate = false; r.shadowMap.needsUpdate = false;
      const n0 = r.info.programs.length, p0 = [caster.material].flat().map(m => r.properties.get(m).currentProgram?.cacheKey);
      g.call(this, room, true, [caster]); e = t(); r.shadowMap.autoUpdate = au;
      const p1 = [caster.material].flat().map(m => r.properties.get(m).currentProgram?.cacheKey);
      out.programs.push([Math.round(e - s), 'that caster, no shadow pass', 'programs ' + n0 + ' -> ' + r.info.programs.length, 'same program: ' + p0.every((k, i) => k === p1[i]), String(p0[0]).slice(0, 200), String(p1[0]).slice(0, 200)]); s = e;
      g.call(this, room, true, [caster]); e = t(); out.programs.push([Math.round(e - s), 'that caster with its shadow pass', [caster.material].flat().map(m => m.type).join('+')]); s = e; }
    for (const o of one.values()) { g.call(this, room, true, [o]); e = t(); out.programs.push([Math.round(e - s), o.type, [o.material].flat().map(m => m.type).join('+'), o.castShadow, o.receiveShadow, o.name]); s = e; }
    out.lights = []; room.scene.traverse(o => o.isLight && o.castShadow && out.lights.push(o.type));
    g.call(this, room, true); e = t(); out.whole = Math.round(e - s);
    this.warmUp = g; setTimeout(() => res(out), 0);
  };
  demo.story.go(step); })"""
with sync_playwright() as p:
    b = launch(p); pg = b.new_page(viewport={"width": 1280, "height": 760})
    pg.goto(f"{a.base}{a.page}#story={a.step - 1}"); pg.wait_for_function("window.demo && demo.ready"); pg.wait_for_timeout(3500)
    if a.split:
        o = pg.evaluate(SPLIT.replace("NOUP", "true" if a.no_upload else "false"), a.step - 1)
        print(f"at the glass: textures {o['textures'][0]} of {o['textures'][1]} still to upload, {o['textures'][2]} ms; "
              f"then the whole room {o['whole']} ms; shadow casting lights {o['lights']}, {o['casters']} meshes cast")
        for x in o['programs']: print("   one drawable per program:", x)
    else:
        out = []
        for k, t, d in pg.evaluate(LOG, a.step - 1):
            if out and out[-1][0] == k == 'initTexture' and t - out[-1][1] < 30: out[-1][2] = round(out[-1][2] + d, 1); out[-1][3] += 1
            else: out.append([k, t, d, 1])
        for o in out: print(*o)
    b.close()
