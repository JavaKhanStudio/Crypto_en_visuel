"""Le tunnel, step 12 on a phone (390x844), at rest after « Envoyer »: prints Victor's tag box and the
bubbles each second, then saves OUT_<lang>.png (r373, r374). tools/vpn_crowd_phone_shot.py OUT [fr|en] [base]"""
import sys
from playwright.sync_api import sync_playwright
out=sys.argv[1]; lang=sys.argv[2] if len(sys.argv) > 2 else 'fr'; base=sys.argv[3] if len(sys.argv) > 3 else 'http://localhost:8793/'
with sync_playwright() as p:
    br = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = br.new_page(viewport={"width": 390, "height": 844})
    pg.goto(f"{base}vpn/?instant=1&lang={lang}#story=12"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.add_style_tag(content=".bubble { transition: opacity .35s !important; }")
    pg.wait_for_timeout(2000); pg.click("#play")
    pg.wait_for_function("demo.stage.st.crowd === 3", timeout=90000)
    for k in range(8):
        print(pg.evaluate("""() => { const s=demo.stage,c=demo.camera; const t=s.tags.v; const b=s.screenBox(t,c);
          const bb=[...document.querySelectorAll('#bubbles .bubble')].map(e=>{const r=e.getBoundingClientRect(); return [e.className, e.querySelector('.who').textContent, Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height), getComputedStyle(e).opacity]});
          return {vis:t.visible, b: b && [b.x,b.y,b.w,b.h].map(Math.round), bb}; }"""))
        pg.wait_for_timeout(1000)
    pg.screenshot(path=f"{out}_{lang}.png")
    br.close()
