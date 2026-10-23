#!/usr/bin/env python3
"""r425: Simon's picked doors are built into the Middle-earth castles (lib/saga/castles.js userData.doors):
Alice's hall door (A2) and Bob's great mallorn lower talan door (B1), each the 'valley' door lib/room.js
doorOf() reads for 'a' / 'b', equal to lab/doors/'s candidate (door(), in castle space), with its lit pane
in the castle and no second pane from the lab. Serve the repo first (python3 -m http.server 8793).
    tests/saga_doors.py [--base URL]"""
import argparse, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tools'))
from playwright.sync_api import sync_playwright
from browser import launch
ap = argparse.ArgumentParser(); ap.add_argument("--base", default="http://localhost:8793/"); a = ap.parse_args()
CHECK = """async () => {
  const { CANDIDATES, door } = await import('./doors.js');
  const out = [], near = (p, q) => p.distanceTo(q) < 1e-6;
  for (const [team, id] of [['a', 'hall'], ['b', 'talan']]) {
    const castle = demo.world['castle' + team.toUpperCase()], ds = castle.userData.doors || {};
    const want = door(CANDIDATES[team].find(c => c.id === id));
    for (const name of ['valley', id]) {
      const d = ds[name];
      out.push([`${team} '${name}' is the ${id} door`, !!d && near(d.focus, want.focus) && near(d.normal, want.normal)
        && near(d.near.pos, want.near.pos) && near(d.near.target, want.near.target)]);
    }
    const glass = CANDIDATES[team].find(c => c.id === id).glass;
    let panes = 0;
    castle.traverse(o => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && near(o.position, glass)) panes++; });
    out.push([`${team} has one lit pane on the ${id} door`, panes === 1]);
    out.push([`${team}: the lab adds no pane of its own on it`, !CANDIDATES[team].find(c => c.id === id).make]);
  }
  return out;
}"""
bad, errors = 0, []
with sync_playwright() as p:
    b = launch(p); pg = b.new_page(viewport={"width": 1000, "height": 700})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(a.base + "lab/doors/"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    for name, ok in pg.evaluate(CHECK):
        print("ok  " if ok else "FAIL", name); bad += not ok
    b.close()
print("page errors:", errors or "none")
print("all ok" if not bad and not errors else "FAILED"); sys.exit(1 if bad or errors else 0)
