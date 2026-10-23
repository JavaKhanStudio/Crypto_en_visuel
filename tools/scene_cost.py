#!/usr/bin/env python3
"""What a saga scene costs, part by part (r518): GPU time a frame, draw calls and triangles, for the
whole scene, then with each top-level part hidden, the shadows off, the composer off and the bloom pass alone off; the CPU of
world.update(); the textures; and how much of a core the page burns while it sits idle.

Serve the tree to measure first (python3 -m http.server PORT), then:

    tools/scene_cost.py --base http://localhost:8793/ --page deux-generaux/ --hash '#story=1'
    tools/scene_cost.py --base ... --page paquet-complet/ --size 390x844 --json out/cost.json

GPU time is a frame drawn then read back (readPixels waits for the GPU), median of --frames, all in
one task so the page's own loop cannot interleave. Hiding a part removes its draw calls AND its
shadow casting, so 'saves' is what that part costs in both passes. Opens chromium through
tools/browser.py (the real GPU; CRYPTO_GL=soft for SwiftShader, whose times mean nothing)."""
import argparse
import json
import os
import sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from browser import launch  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--page", default="deux-generaux/")
ap.add_argument("--hash", default="#story=1")
ap.add_argument("--query", default="?instant=1")
ap.add_argument("--size", default="1440x860")
ap.add_argument("--frames", type=int, default=40)
ap.add_argument("--settle", type=int, default=6000, help="ms after ready before measuring")
ap.add_argument("--dpr", type=float, default=1, help="devicePixelRatio (a laptop's HiDPI screen: 2)")
ap.add_argument("--json")
a = ap.parse_args()

MEASURE = """async (N) => {
  const d = demo, R = d.renderer, gl = R.getContext(), scene = d.scene, cam = d.camera;
  const px = new Uint8Array(4), sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const draw = () => d.composer.render();
  function once(render) {
    const ts = [];
    for (let i = 0; i < N; i++) { const t = performance.now(); render(); sync(); ts.push(performance.now() - t); }
    ts.sort((x, y) => x - y); return ts[N >> 1];
  }
  function run(render = draw) {
    for (let i = 0; i < 8; i++) { render(); sync(); }            // warm up (a toggle recompiles shaders)
    R.info.autoReset = false; R.info.reset(); render(); sync();
    const calls = R.info.render.calls, tris = R.info.render.triangles; R.info.autoReset = true;
    return { ms: +once(render).toFixed(2), calls, tris };
  }
  // what a change saves: full and changed frames measured in turns, ROUNDS times, the median of the differences
  const ROUNDS = 5;
  function saves(on, off, render = draw) {
    const ds = [];
    off(); for (let i = 0; i < 8; i++) { render(); sync(); } on(); for (let i = 0; i < 8; i++) { draw(); sync(); }
    for (let k = 0; k < ROUNDS; k++) { const f = once(draw); off(); const v = once(render); on(); ds.push(f - v); }
    ds.sort((x, y) => x - y); return +ds[ROUNDS >> 1].toFixed(2);
  }
  const name = o => o.name || (o.userData && (o.userData.name || o.userData.kind)) || o.type;
  const count = o => { let tris = 0, meshes = 0, inst = 0;
    o.traverse(m => { if (!m.isMesh && !m.isPoints && !m.isSprite) return; meshes++;
      const g = m.geometry; if (!g) return;
      const n = (g.index ? g.index.count : g.attributes.position.count) / 3;
      tris += n * (m.isInstancedMesh ? m.count : 1); if (m.isInstancedMesh) inst += m.count; });
    return { meshes, tris: Math.round(tris), instances: inst }; };
  const W = d.world || {}, labels = new Map();
  for (const [k, v] of Object.entries(W)) if (v && v.isObject3D) labels.set(v, k);
  if (W.road && W.road.mesh) labels.set(W.road.mesh, 'road');
  if (W.pageSky && W.pageSky.group) labels.set(W.pageSky.group, 'pageSky');
  for (const o of scene.children) if (!labels.has(o)) {   // what an unnamed part is, from what it holds
    const c = count(o), first = []; o.traverse(m => m.isMesh && first.length < 1 && first.push(m.geometry?.type || ''));
    if (o.isMesh && c.tris > 30000) labels.set(o, 'terrain'); else if (c.instances >= 1000) labels.set(o, 'trees');
    else if (o.isGroup && o.children.length > 8 && first[0] === 'CylinderGeometry') labels.set(o, 'torches');
    else labels.set(o, name(o) + (first[0] ? ':' + first[0].replace('Geometry', '') : ''));
  }
  const out = { size: [R.domElement.width, R.domElement.height], pixelRatio: R.getPixelRatio(),
    quality: localStorage.getItem('dg-quality'), samples: d.composer.renderTarget1?.samples,
    shadowMap: R.shadowMap.enabled, gpu: (() => { const x = gl.getExtension('WEBGL_debug_renderer_info'); return x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : ''; })() };
  out.full = run();
  out.noBloom = run(() => R.render(scene, cam)); out.noBloom.saves_ms = saves(() => 0, () => 0, () => R.render(scene, cam));
  // r548: 'noBloom' above drops the whole composer (its MSAA target, the bloom, the output pass) for a plain canvas
  // render, which has no antialiasing at all; the bloom pass alone is the composer with that one pass switched off
  const bloom = d.composer.passes.find(q => q.nMips || q.isBloom);
  if (bloom) { bloom.enabled = false; out.bloomPass = run(); bloom.enabled = true;
    out.bloomPass.saves_ms = saves(() => bloom.enabled = true, () => bloom.enabled = false); }
  const lights = []; scene.traverse(o => { if (o.isLight && o.castShadow) lights.push(o); });
  lights.forEach(l => l.castShadow = false); out.noShadow = run(); lights.forEach(l => l.castShadow = true);
  out.noShadow.saves_ms = saves(() => lights.forEach(l => l.castShadow = true), () => lights.forEach(l => l.castShadow = false));
  out.shadowLights = lights.map(l => [l.type, l.shadow.mapSize.x]);
  // r543: the map redrawn on every frame against the frame as the page draws it (the saga's moon redraws
  // only when a caster or the light moved, so on a still step the difference is the whole redraw)
  const redraw = () => { lights.forEach(l => l.shadow.needsUpdate = true); draw(); };
  out.shadowRedraw_ms = -saves(() => 0, () => 0, redraw);
  out.shadowCached = lights.length > 0 && lights.every(l => l.shadow.autoUpdate === false);
  // r544: each point or spot light alone, hidden (every lit material recompiles without it): what it costs every lit pixel
  out.lights = [];
  scene.traverseVisible(o => { if ((o.isPointLight || o.isSpotLight) && o.intensity > 0) out.lights.push(o); });
  out.lights = out.lights.map(l => ({ light: l.type + (l.name ? ' ' + l.name : '') + ' in ' + (labels.get(l.parent) || name(l.parent)),
    saves_ms: saves(() => l.visible = true, () => l.visible = false) }));
  out.parts = [];
  for (const o of [...scene.children]) {
    if (!o.visible) continue;
    const c = count(o); o.visible = false; const r = run(); o.visible = true;
    const ms = saves(() => o.visible = true, () => o.visible = false);
    out.parts.push({ part: labels.get(o) || name(o), ...c, saves_ms: ms, saves_calls: out.full.calls - r.calls });
  }
  out.parts.sort((x, y) => y.saves_ms - x.saves_ms);
  out.full2 = run();                                                // the scene back as it was: noise floor
  // CPU: world.update (flags, flames, the Eye, the sky) alone, 200 calls
  if (W.update) { const t = performance.now(); for (let i = 0; i < 200; i++) W.update(1 / 60, 10 + i / 60); out.worldUpdate_ms = +((performance.now() - t) / 200).toFixed(3); }
  const tex = new Map();
  scene.traverse(o => { for (const m of [].concat(o.material || [])) { for (const v of Object.values(m)) if (v && v.isTexture) tex.set(v, 1);
    for (const u of Object.values(m.uniforms || {})) if (u.value && u.value.isTexture) tex.set(u.value, 1); } });
  if (scene.background && scene.background.isTexture) tex.set(scene.background, 1);
  out.textures = [...tex.keys()].map(t => { const i = t.image || {}; return { name: t.name || (i.src || i.currentSrc || '').split('/').slice(-2).join('/') || (i.tagName || i.constructor?.name || 'data'), w: i.width || 0, h: i.height || 0, mb: +((i.width || 0) * (i.height || 0) * 4 * (t.generateMipmaps ? 1.33 : 1) / 1048576).toFixed(1) }; })
    .sort((x, y) => y.mb - x.mb);
  out.memory = { ...R.info.memory, programs: R.info.programs?.length };
  return out;
}"""

w, h = map(int, a.size.split("x"))
with sync_playwright() as p:
    b = launch(p)
    ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=a.dpr, has_touch=w < 900, is_mobile=w < 900)
    pg = ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(a.base + a.page + a.query + a.hash, wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(a.settle)
    # idle: how much of a core the page burns standing still (CDP TaskDuration over 5 s), and its frame rate
    cdp = ctx.new_cdp_session(pg); cdp.send("Performance.enable")
    m0 = {m["name"]: m["value"] for m in cdp.send("Performance.getMetrics")["metrics"]}
    fps = pg.evaluate("""() => new Promise(r => { let n = 0; const t0 = performance.now();
      const f = () => { n++; if (performance.now() - t0 < 5000) requestAnimationFrame(f); else r(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); })""")
    m1 = {m["name"]: m["value"] for m in cdp.send("Performance.getMetrics")["metrics"]}
    span = m1["Timestamp"] - m0["Timestamp"]
    r = pg.evaluate(MEASURE, a.frames)
    r["idle"] = {"fps": round(fps, 1), "cpu_pct": round(100 * (m1["TaskDuration"] - m0["TaskDuration"]) / span, 1),
                 "script_pct": round(100 * (m1["ScriptDuration"] - m0["ScriptDuration"]) / span, 1),
                 "heap_mb": round(m1["JSHeapUsedSize"] / 1048576, 1)}
    r["page"] = a.page + a.hash; r["errors"] = errors
    b.close()

print(f"{r['page']}  {a.size}  canvas {r['size'][0]}x{r['size'][1]} (ratio {r['pixelRatio']}, quality {r['quality']}, MSAA {r['samples']})  {r['gpu']}")
f = r["full"]
print(f"frame      {f['ms']:6.2f} ms  {f['calls']:4d} calls  {f['tris']:8d} tris   (again at the end: {r['full2']['ms']} ms)")
print(f"composer   costs {r['noBloom']['saves_ms']:5.2f} ms  {f['calls'] - r['noBloom']['calls']:4d} calls   (MSAA target + bloom + output, against a plain canvas render)")
if r.get("bloomPass"):
    print(f"  bloom pass alone  {r['bloomPass']['saves_ms']:5.2f} ms  {f['calls'] - r['bloomPass']['calls']:4d} calls   (so MSAA + output: {r['noBloom']['saves_ms'] - r['bloomPass']['saves_ms']:5.2f} ms)")
print(f"shadow     costs {r['noShadow']['saves_ms']:5.2f} ms  {f['calls'] - r['noShadow']['calls']:4d} calls   shadow lights: {r['shadowLights']}")
print(f"  map redrawn every frame would add {r['shadowRedraw_ms']:5.2f} ms; "
      + ("the page redraws it only when a caster or the light moved (r543), so the rest is shading the receivers" if r['shadowCached'] else "the page already does"))
print(f"idle       {r['idle']['fps']} fps, {r['idle']['cpu_pct']}% of a core on the main thread ({r['idle']['script_pct']}% script), heap {r['idle']['heap_mb']} MB")
print(f"world.update {r.get('worldUpdate_ms')} ms a frame (CPU)   gpu memory: {r['memory']}")
for x in r.get("lights", []):
    print(f"light      {x['light'][:40]:40s} costs {x['saves_ms']:5.2f} ms   (hidden: the lit materials without it)")
print("part hidden            saves ms  calls   meshes   instances      tris")
for x in r["parts"]:
    print(f"  {x['part'][:20]:20s} {x['saves_ms']:8.2f} {x['saves_calls']:6d} {x['meshes']:8d} {x['instances']:11d} {x['tris']:9d}")
print("textures (MB, with mips):", ", ".join(f"{t['name']} {t['w']}x{t['h']} {t['mb']}" for t in r["textures"][:12]))
print("page errors:", r["errors"] or "none")
if a.json:
    os.makedirs(os.path.dirname(a.json) or ".", exist_ok=True)
    json.dump(r, open(a.json, "w"), indent=1)
