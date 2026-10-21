"""Screen boxes of vpn/'s place names and watcher tags on a phone (390x844), after pinTags, with the
page's walls: says which name pinTags hid and why (r364). tools/vpn_place_probe.py STEP [base]"""
import sys, json
from playwright.sync_api import sync_playwright
step = sys.argv[1]
base = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:8793/'
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width':390,'height':844})
    pg.goto(f'{base}vpn/?instant=1#story={step}'); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
    pg.wait_for_timeout(9000)
    print(json.dumps(pg.evaluate("""async () => { const s=demo.stage, c=demo.camera, o={};
      for (const [k,p] of Object.entries(s.places)) { const b=s.screenBox(p,c); o[k]={vis:p.visible, op:+p.material.opacity.toFixed(2), b: b && [b.x,b.y,b.w,b.h].map(Math.round)}; }
      for (const [k,t] of Object.entries(s.tags)) { const b=s.screenBox(t,c); o['tag_'+k]={vis:t.visible, b: b && [b.x,b.y,b.w,b.h].map(Math.round)}; }
      o.walls=(await import("./js/bubbles.js")).walls().map(b=>[b.x,b.y,b.w,b.h].map(Math.round)); return o; }"""), indent=0))
    b.close()
