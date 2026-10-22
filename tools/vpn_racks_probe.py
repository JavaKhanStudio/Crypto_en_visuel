#!/usr/bin/env python3
"""Le tunnel's server halls (r408): does every rack's fan turn, the instanced ones as well as the whole
racks at the packet's stops, and is every row full (no aisle, no hole)? Serve the repo first
(python3 -m http.server 8793).
    tools/vpn_racks_probe.py [base]"""
import sys
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/"
with sync_playwright() as p:
    br = launch(p)
    pg = br.new_page(viewport={"width": 900, "height": 600})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"{BASE}vpn/?instant=1#story=1", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    # every rack's spot (whole racks' position, instanced racks' instance 0 part), and each fan blade's
    # instance matrices twice, half a second apart
    read = """() => { const d = window.demo, T = d.THREE, out = { whole: [], fans: [], spots: [] }, m = new T.Matrix4();
      const parts = new Set(); d.world.items.racks[0].traverse(o => { if (o.isMesh) parts.add(o.geometry); });
      const ims = []; d.scene.traverse(o => { if (o.isInstancedMesh && parts.has(o.geometry)) ims.push(o); });   // not the trees
      for (const o of ims) { const a = []; for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, m); a.push(Array.from(m.elements)); }
        out.fans.push(a); }
      // a whole rack's spot read off the same part as the instanced copies' first mesh, so both compare
      for (const r of d.world.items.racks) { let w = null; r.traverse(o => { if (o.isMesh && o.geometry === ims[0].geometry) w = o; });
        r.updateMatrixWorld(true); out.whole.push([w.matrixWorld.elements[12], w.matrixWorld.elements[14], r.getObjectByName('Fan').rotation.y]); }
      return out; }"""
    a = pg.evaluate(read)
    pg.wait_for_timeout(500)
    b = pg.evaluate(read)
    ok = True
    # the whole racks' fans turn
    turned = sum(1 for x, y in zip(a["whole"], b["whole"]) if abs(x[2] - y[2]) > 1e-3)
    print(("ok  " if turned == len(a["whole"]) else "BAD ") + f"whole racks: {turned}/{len(a['whole'])} fans turned")
    ok &= turned == len(a["whole"])
    # instanced meshes whose matrices changed are the fan blades; each must change on every copy
    moving = [(ma, mb) for ma, mb in zip(a["fans"], b["fans"]) if ma != mb]
    copies = len(a["fans"][0]) if a["fans"] else 0
    every = all(all(x != y for x, y in zip(ma, mb)) for ma, mb in moving)
    print(("ok  " if moving and every else "BAD ") + f"instanced racks: {len(moving)} moving parts, on all {copies} copies: {every}")
    ok &= bool(moving) and every
    # rows: the spots of one static part (instanced) plus the whole racks, per row, evenly spaced
    still = a["fans"][0]
    assert a["fans"][0] == b["fans"][0], "the first instanced part is a fan blade: pick a still one"
    spots = [(round(e[12], 2), round(e[14], 2)) for e in still] + [(round(x, 2), round(z, 2)) for x, z, _ in a["whole"]]
    rows = {}
    for x, z in spots: rows.setdefault(z, []).append(x)
    for z, xs in sorted(rows.items()):
        xs.sort(); gaps = [round(q - p, 2) for p, q in zip(xs, xs[1:])]
        full = max(gaps) - min(gaps) < .05
        print(("ok  " if full else "BAD ") + f"row z={z}: {len(xs)} racks, spacing {min(gaps)}..{max(gaps)}")
        ok &= full
    print("errors:", errors or "none")
    print("all ok" if ok and not errors else "FAILED")
    br.close()
