#!/usr/bin/env python3
"""r601: where lib/room.js ahead()'s off-screen warm draw of the next room spends its time. On a fresh
browser at --from, with the story's own ahead() switched off, builds the next room as ahead() does
(build, compileAsync, initTexture), then draws it off screen in parts, each timed with gl.finish:
first nothing shown (the scene's own setup), then the meshes --chunk at a time, each part alone;
then the whole room again (what is left once every part was drawn). Prints the programs, geometries
and textures three holds after each. Serve the repo root on 8793 first.
    tools/warm_cost.py [--base URL] [--page encore-des-tours/] [--from 5] [--room verify] [--chunk 250] [--runs 2]
        [--keys] [--per-program] [--all]
r601 found with it: compiled with no render target bound, every program was built again at the draw
(--keys: outputColorSpace srgb -> srgb-linear, toneMapping 4 -> 0), and the sign room's 6 point lights
against verify's 7 gave them no program in common (fixed by lib/room.js compile() and lights).
"""
import argparse
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="encore-des-tours/")
ap.add_argument("--from", dest="frm", type=int, default=5)
ap.add_argument("--room", default="verify")
ap.add_argument("--chunk", type=int, default=250)
ap.add_argument("--runs", type=int, default=2)
ap.add_argument("--keys", action="store_true", help="for each program built at a draw, how its key differs from the nearest one compileAsync built")
ap.add_argument("--per-program", action="store_true", help="first, one drawable of each program drawn alone")
ap.add_argument("--all", action="store_true", help="compileAsync with every object shown (three compiles only what is visible)")
a = ap.parse_args()
PROBE = """async ([name, chunk, shownAll, keys, perProgram]) => {
  const ins = demo.inside, r = ins.renderer, gl = r.getContext(), T = () => performance.now(), out = [];
  let known = new Set(r.info.programs);
  const fresh = () => { const n = r.info.programs.filter(p => !known.has(p)); n.forEach(p => known.add(p)); if (!keysOn) return ''; return n.map(p => { const k = p.cacheKey.split(','); let best = null, bd = 1e9;
      for (const q of compiled) { const j = q.split(','); if (j.length !== k.length) continue; const d = k.filter((x, i) => x !== j[i]).length; if (d < bd) { bd = d; best = j; } }
      return ' || new program, differs from the nearest compiled one at ' + (best ? k.map((x, i) => x !== best[i] ? `#${i} ${best[i]} -> ${x}` : '').filter(Boolean).join('; ') + (window.FULLKEY ? ' key ' + k.slice(20, 45).join(',') : '') : 'no same-length key: ' + p.cacheKey.slice(0, 120)); }).join(''); };
  let keysOn = false, compiled = [];
  const info = () => `programs ${r.info.programs.length} geometries ${r.info.memory.geometries} textures ${r.info.memory.textures}${fresh()}`;
  const before = new Set(r.info.programs), room = ins.build(name, ins.room.send);
  const was = []; if (shownAll) room.scene.traverse(o => { was.push([o, o.visible]); o.visible = true; });
  const pr = ins.compile ? ins.compile(room.scene) : r.compileAsync(room.scene, ins.camera);   // r601: as ahead() does for (const [o, v] of was) o.visible = v;
  let s = T(); await pr; out.push(`compileAsync ${Math.round(T() - s)} ms  ${info()}`);
  compiled = r.info.programs.filter(p => !before.has(p)).map(p => p.cacheKey); keysOn = !!keys;
  s = T(); room.scene.traverse(o => [o.material].flat().forEach(m => m?.map && r.initTexture(m.map))); gl.finish();
  out.push(`initTexture ${Math.round(T() - s)} ms  ${info()}`);
  await new Promise(res => setTimeout(res, 500));
  const all = []; room.scene.traverse(o => all.push([o, o.visible, o.frustumCulled]));
  const meshes = all.map(x => x[0]).filter(o => o.isMesh || o.isSprite || o.isLine || o.isPoints);
  const draw = (label, shown) => {
    for (const [o] of all) { o.frustumCulled = false; o.visible = !(o.isMesh || o.isSprite || o.isLine || o.isPoints) || shown.has(o); }
    const t = T(); ins.warmUp(room); gl.finish(); out.push(`${label}: ${Math.round(T() - t)} ms  ${info()}`);
  };
  out.push(`${meshes.length} drawables, ${new Set(meshes.map(o => o.material)).size} materials`);
  draw('nothing shown', new Set());
  if (perProgram) {   // one drawable of each program alone, then the rest
    const by = new Map(); for (const o of meshes) { const pg = r.properties.get([o.material].flat()[0]).currentProgram; if (!by.has(pg)) by.set(pg, o); }
    for (const o of by.values()) { draw(`one ${o.type}:${[o.material].flat()[0].type}${o.material.map ? '/map' : ''} castShadow ${o.castShadow}`, new Set([o])); await new Promise(res => requestAnimationFrame(res)); }
  }
  for (let i = 0; i < meshes.length; i += chunk) {
    const part = meshes.slice(i, i + chunk), kinds = {};
    for (const o of part) { const k = o.type + ':' + [o.material].flat()[0].type + (o.material.map ? '/map' : ''); kinds[k] = (kinds[k] || 0) + 1; }
    draw(`drawables ${i}-${i + part.length - 1} ${JSON.stringify(kinds)}`, new Set(part));
    await new Promise(res => requestAnimationFrame(res));
  }
  draw('all again', new Set(meshes));
  for (const [o, v, c] of all) { o.visible = v; o.frustumCulled = c; }
  return out;
}"""
with sync_playwright() as p:
    for run in range(a.runs):
        b = launch(p); pg = b.new_page(viewport={"width": 1280, "height": 760})
        pg.goto(f"{a.base}{a.page}#story={a.frm}"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.evaluate("demo.inside.ahead = () => {}; window.FULLKEY = true")   # the story's own warm off: this one is timed alone
        pg.wait_for_function("demo.inside.active && !demo.inside.arrival", timeout=30000); pg.wait_for_timeout(2000)
        print(f"run {run + 1}:"); [print("  ", l) for l in pg.evaluate(PROBE, [a.room, a.chunk, a.all, a.keys, a.per_program])]
        b.close()
