"""Shoot an enigma-reglage (or --page enigma-casse) story step after its action button has played (bubble shown), and print the
name tags cut by the screen edge or under a bubble or panel. Serve the repo first (python3 -m http.server 8793).
  python3 tools/story_shot.py out/name 7 [--lang en] [--base http://localhost:8793/] [--page enigma-casse]   (r125, r151)
A page whose bubbles have no tagBoxes() (enigma-casse) gets its tags projected here from every sprite with userData.text."""
import argparse, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, 'tests')
ap = argparse.ArgumentParser(); ap.add_argument('out'); ap.add_argument('step', type=int)
ap.add_argument('--lang', default='fr'); ap.add_argument('--base', default='http://localhost:8793/'); ap.add_argument('--size', default='1440x860')
ap.add_argument('--page', default='enigma-reglage')
a = ap.parse_args()
W, H = map(int, a.size.split('x'))
src = open('tests/enigma-reglage_story.py').read()
TAGS = src.split('TAGS = """', 1)[1].split('"""', 1)[0]
# the same check where demo.bubbles has no tagBoxes(): each visible sprite carrying a text, projected by its four corners
TAGS = TAGS.replace('demo.bubbles.tagBoxes()', """(demo.bubbles?.tagBoxes ? demo.bubbles.tagBoxes() : (() => {
        const T = demo.THREE, cam = demo.camera, r = new T.Vector3(), u = new T.Vector3(), c = new T.Vector3(), q = new T.Vector3(), o = [];
        r.setFromMatrixColumn(cam.matrixWorld, 0); u.setFromMatrixColumn(cam.matrixWorld, 1);
        demo.scene.traverseVisible(s => { if (!s.isSprite || !s.userData.text) return; s.getWorldPosition(c);
          let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, behind = false;
          for (const [i, j] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
            q.copy(c).addScaledVector(r, i * s.scale.x / 2).addScaledVector(u, j * s.scale.y / 2).project(cam);
            if (q.z > 1) behind = true; const x = (q.x * .5 + .5) * W, y = (-q.y * .5 + .5) * H;
            x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
          if (!behind) o.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, text: s.userData.text }); });
        return o; })())""")
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": W, "height": H}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"{a.base}{a.page}/?instant=1&lang={a.lang}#story={a.step}", wait_until="load")
    pg.wait_for_function("window.demo && window.demo.ready", timeout=60000); pg.wait_for_timeout(1500)
    idle = "() => [...document.querySelectorAll('#play, #step-actions button')].every(b => !b.disabled)"
    pg.wait_for_function(idle, timeout=120000)
    btn = pg.locator("#play") if pg.locator("#play").count() else pg.locator("#step-actions button").first
    btn.click(); pg.wait_for_timeout(300); pg.wait_for_function(idle, timeout=180000); pg.wait_for_timeout(1200)
    pg.screenshot(path=a.out + '.png')
    print(a.out + '.png', 'tags:', pg.evaluate(TAGS) or 'all clear', 'errors:', errs or 'none')
    b.close()
