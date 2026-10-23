#!/usr/bin/env python3
"""r591: what 1.6's Bob room (verify) costs to draw a first time, built off screen while Alice's room
plays: build, compileAsync, texture uploads, its meshes by material, then the first draw of the empty
scene (every mesh hidden), one mesh, the rest, and a second draw. Found: no new shader and 28 buffers,
yet the empty scene's first draw alone costs ~150 ms, so slicing the warm draw cannot spread it.
Serve the repo root on 8793 first.
    tools/room_first_draw.py
"""
import sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, 'tools')
from browser import launch
with sync_playwright() as p:
    b = launch(p)
    for run in range(2):
        pg = b.new_page(viewport={"width": 1280, "height": 760})
        pg.goto("http://localhost:8793/encore-des-tours/#story=5"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        pg.wait_for_function("demo.inside.active && !demo.inside.arrival", timeout=30000); pg.wait_for_timeout(4000)
        print(pg.evaluate("""async () => { const ins = demo.inside, r = ins.renderer, o = [], T = () => performance.now();
          ins.drop(); let t = T(); const room = ins.build('verify', ins.room.send); o.push('build ' + Math.round(T() - t));
          t = T(); await r.compileAsync(room.scene, ins.camera); o.push('compileAsync wall ' + Math.round(T() - t));
          let n = 0; t = T(); room.scene.traverse(x => [x.material].flat().forEach(m => { if (m?.map) { n++; r.initTexture(m.map); } })); o.push(n + ' maps ' + Math.round(T() - t));
          let meshes = 0; room.scene.traverse(x => x.isMesh && meshes++); o.push(meshes + ' meshes'); let lights = 0, casts = 0; room.scene.traverse(x => { if (x.isLight) { lights++; if (x.castShadow) casts++; } }); o.push(lights + ' lights, ' + casts + ' cast');
          const ms = []; room.scene.traverse(x => x.isMesh && x.visible && ms.push(x)); ms.forEach(x => { x.visible = false; });
          const kinds = {}; ms.forEach(x => { const k = x.material.type + (x.isInstancedMesh ? '/inst' : '') + (x.material.map ? '/map' : ''); kinds[k] = (kinds[k] || 0) + 1; }); o.push(JSON.stringify(kinds));
          t = T(); ins.warmUp(room); r.getContext().finish(); o.push('nothing ' + Math.round(T() - t));
          ms[0].visible = true; t = T(); ins.warmUp(room); r.getContext().finish(); o.push('one (' + ms[0].material.type + ') ' + Math.round(T() - t));
          for (let k = 1; k < ms.length; k += 250) { ms.slice(k, k + 250).forEach(x => { x.visible = true; }); t = T(); ins.warmUp(room); r.getContext().finish(); o.push('+250 ' + Math.round(T() - t)); }
          t = T(); ins.warmUp(room); r.getContext().finish(); o.push('again ' + Math.round(T() - t));
          return o.join(', '); }"""))
        pg.close()
