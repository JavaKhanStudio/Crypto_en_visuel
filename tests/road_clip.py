#!/usr/bin/env python3
"""The road never sinks into the ground (r73). Casts rays straight down over the whole road,
at 9 points across its width every ~0.3 m along it, and compares where each ray meets the
terrain with where it meets the road. Fails if the terrain anywhere rises above the road
(less than 2 cm under it). Serve the repo first (python3 -m http.server 8793)."""
import argparse, sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

ap = argparse.ArgumentParser(); ap.add_argument("--base", default="http://localhost:8793/"); a = ap.parse_args()
PROBE = """() => {
  const { THREE, world, scene } = demo;
  const terrain = scene.children.find(o => o.isMesh && o.geometry.type === 'PlaneGeometry' && o.material.vertexColors);
  const road = world.road.mesh, path = world.road.path, ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0);
  let worst = { gap: 1e9 }, n = 0, under = 0;
  for (let t = 0; t <= 1; t += .002) {
    const p = path.getPointAt(t), tan = path.getTangentAt(t), side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    for (let s = -1.6; s <= 1.61; s += .4) {
      const o = p.clone().addScaledVector(side, s); o.y = 300; ray.set(o, down);
      const r = ray.intersectObject(road)[0], g = ray.intersectObject(terrain)[0];
      if (!r || !g) continue;
      const gap = r.point.y - g.point.y; n++;
      if (gap < .02) under++;
      if (gap < worst.gap) worst = { gap, x: o.x, z: o.z, t, s };
    }
  }
  return { n, under, worst };
}"""
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": 800, "height": 500})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(a.base + "deux-generaux/index.html?instant=1#story=1", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    r = pg.evaluate(PROBE)
    b.close()
w = r["worst"]
print(f"{r['n']} rays, {r['under']} where the ground is above or within 2 cm of the road; "
      f"lowest gap {w['gap']:.3f} m at x {w['x']:.1f} z {w['z']:.1f} (t {w['t']:.3f}, side {w['s']:+.1f}); errors: {errors or 'none'}")
sys.exit(0 if (r["n"] > 4000 and r["under"] == 0 and not errors) else 1)
