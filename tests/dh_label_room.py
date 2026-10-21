#!/usr/bin/env python3
"""Every pot tag of diffie-hellman reads whole on screen: none runs off the left or right edge (r257).

Serve the repo first (python3 -m http.server 8793). For every story step, fr and en, at 390x844 and
1440x900 (?instant=1), applies the step's state, cuts to each table shot (aliceClose, eveClose,
bobClose: the shots a step lands on at rest) and measures each shown tag's box on screen.
    tests/dh_label_room.py"""
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8793/diffie-hellman/"
MEASURE = """shot => {
  const { THREE, camera, stage, rig } = demo;
  rig.jump(shot); camera.updateMatrixWorld(); stage.relabel();
  const W = innerWidth, H = innerHeight, right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const px = p => { const q = p.clone().project(camera); return [(q.x + 1) / 2 * W, (1 - q.y) / 2 * H, q.z]; };
  const out = [];
  for (const p of stage.pots.values()) {
    const l = p.userData.label;
    if (!p.visible || !l.visible || p.userData.at !== shot[0]) continue;   // only the tags of the table in shot
    l.updateWorldMatrix(true, false);
    const c = new THREE.Vector3().setFromMatrixPosition(l.matrixWorld), s = new THREE.Vector3().setFromMatrixScale(l.matrixWorld);
    const [, y] = px(c);
    const a = px(c.clone().addScaledVector(right, -s.x / 2)), b = px(c.clone().addScaledVector(right, s.x / 2));
    out.push({ text: l.userData.text, left: a[0], right: b[0], y });
  }
  return { W, out };
}"""
bad, seen = [], 0
with sync_playwright() as p:
    br = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    for lang in ["fr", "en"]:
        for w, h in [(390, 844), (1440, 900)]:
            pg = br.new_page(viewport={"width": w, "height": h})
            errors = []
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.goto(f"{BASE}?instant=1&lang={lang}#story=1", wait_until="load")
            pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
            n = int(pg.evaluate("document.getElementById('step-count').textContent.match(/(\\d+)\\D*$/)[1]"))
            for i in range(n):
                pg.evaluate(f"demo.story.go({i})"); pg.wait_for_timeout(400)
                pg.evaluate("demo.stage.speed = 0")                            # freeze the step's actions: measure its state
                for shot in ["aliceClose", "eveClose", "bobClose"]:
                    m = pg.evaluate(MEASURE, shot)
                    for t in m["out"]:
                        seen += 1
                        if t["left"] < 0 or t["right"] > m["W"]:
                            bad.append(f"{lang} {w}px step {i + 1} {shot}: '{t['text']}' spans {t['left']:.0f}..{t['right']:.0f} of {m['W']}")
                pg.evaluate("demo.stage.speed = 50")
            bad += [f"{lang} {w}px page error: {e}" for e in errors]
            pg.close()
    br.close()
print("\n".join(bad) if bad else f"all ok ({seen} tags measured)")
raise SystemExit(1 if bad else 0)
