"""Close-up of a scytale stick with every letter written, to judge the strip's lettering (r398).

    tools/scytale_strip_close.py out/r398/close.png [--stick a] [--front 1] [--hot 5]

Loads step 3, lets the writing finish at high speed, writes all 20 letters, turns the stick
so line --front faces the camera, lights strip letter --hot, and shoots from close. A
mid-animation shot cannot judge a letter's colour: the hot one is still being drawn.
"""
import argparse
from playwright.sync_api import sync_playwright
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--base", default="http://localhost:8793/")
ap.add_argument("--stick", default="a")
ap.add_argument("--front", type=int, default=1)
ap.add_argument("--hot", type=int, default=-1)
a = ap.parse_args()
with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(a.base + "scytale/?instant=1#story=3")
    pg.wait_for_function("window.demo && demo.ready", timeout=60000)
    pg.wait_for_timeout(2000)
    pg.evaluate("demo.story.token++; demo.stage.speed = 50")
    pg.wait_for_timeout(15000)
    pg.evaluate("""([id, front, hot]) => {
      const s = demo.stage, st = s.sticks[id], k = st.userData.k;
      s.st.strip.written = s.lay.n; s.hot = hot; s.redraw();
      st.userData.setPhi(-2 * Math.PI * front / k); s.strip.update();
      const p = st.position; demo.rig.setOrbit(0);
      demo.rig.jump({ pos: new demo.THREE.Vector3(p.x + .2, p.y + .6, p.z + 1.9), target: p.clone() });
    }""", [a.stick, a.front, a.hot])
    pg.wait_for_timeout(1500)
    pg.screenshot(path=a.out)
    print(a.out, "errors:", errors or "none")
