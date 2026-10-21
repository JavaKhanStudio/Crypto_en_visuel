#!/usr/bin/env python3
"""Le tunnel (r197): clicks every story action and checks what it left on the map against
vpn/js/net.js: which watchers read the packet, what each tag says (Bob's address or the VPN's, the
password, the lock, the seal), the keys found, the packet thrown away when a bit is flipped. Then runs
the sandbox: Eve at each place, with and without the tunnel and HTTPS, and a flipped bit. Shoots each
outcome to out/vpn-<case>-<lang>.png. Serve the repo first (python3 -m http.server 8793), or pass a base URL.
Exit 1 on any failure.

    tests/vpn_story.py [base] [fr|en]
"""
import sys
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/") + "vpn/"
lang = sys.argv[2] if len(sys.argv) > 2 else "fr"
fails = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1200, "height": 720})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    idle = "() => [...document.querySelectorAll('#play, #step-actions button, #sb-send')].every(b => !b.disabled)"
    # what the stage holds now: who read, and the words on each tag (the text the stage drew on it)
    probe = """() => { const s = demo.stage, st = s.st;
      const tags = Object.fromEntries(['e', 'i', 'v', 'b'].filter(w => st.read.includes(w)).map(w => [w, s.lines(w).map(l => l[0]).join(' | ')]));
      return { read: [...st.read].sort().join(''), dropped: st.dropped, keys: st.keys, tunnel: st.tunnel, tags,
        keysOn: ['a', 'v'].every(k => s.keys[k].shared.visible), card: document.getElementById('card').innerText }; }"""

    def report(name, bad):
        print("ok  " if not bad else "FAIL", name, "" if not bad else f"{bad}")
        bad and fails.append(name)
        pg.screenshot(path=f"out/vpn-{name}-{lang}.png")

    def open_page(hash_):
        pg.goto("about:blank")                         # a hash-only change would not reload the page
        pg.goto(f"{base}?instant=1&lang={lang}{hash_}", wait_until="load")
        pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)

    def settle(timeout=180000):
        pg.wait_for_timeout(300)
        pg.wait_for_function(idle, timeout=timeout)
        pg.wait_for_timeout(500)

    BOB, VPN, CAFE = "198.51.100.20", "192.0.2.44", "203.0.113.7"
    # step: what must hold once its action has played; tags: watcher -> words its tag must hold / must not
    CASES = {
        2: {"read": "b", "tags": {"b": [CAFE]}},
        4: {"read": "e", "tags": {"e": [BOB, "soleil42"]}},
        5: {"read": "e", "tags": {"e": [BOB, "bob.example", "HTTPS"]}, "not": {"e": ["soleil42"]}},
        6: {"read": "ei", "tags": {"i": [BOB, "bob.example"]}},
        7: {"keys": 1},
        8: {"keys": 2, "keysOn": True},
        9: {"read": "beiv", "dropped": False, "tags": {"e": [VPN], "i": [VPN], "v": [BOB, "bob.example"], "b": [VPN]},
            "not": {"e": [BOB, "bob.example"], "i": [BOB, "bob.example"]}},
        10: {"read": "v", "dropped": True},
        11: {"read": "beiv", "dropped": False, "tags": {"b": [VPN]}, "not": {"b": [CAFE]}},
        12: {"read": "v", "tags": {"v": [CAFE, BOB, "bob.example"]}},
    }
    for step, want in CASES.items():
        open_page(f"#story={step}")
        pg.wait_for_timeout(1200)
        pg.wait_for_function(idle, timeout=180000)
        pg.locator("#play").click()
        settle()
        got = pg.evaluate(probe)
        bad = {k: (got[k], w) for k, w in want.items() if k not in ("tags", "not") and got[k] != w}
        for w, words in want.get("tags", {}).items():
            miss = [x for x in words if x not in got["tags"].get(w, "")]
            if miss: bad[f"tag {w}"] = (got["tags"].get(w), f"has {miss}")
        for w, words in want.get("not", {}).items():
            extra = [x for x in words if x in got["tags"].get(w, "")]
            if extra: bad[f"tag {w}"] = (got["tags"].get(w), f"must not have {extra}")
        report(f"s{step}", bad)

    # the card says what net.js computes: the seal's bytes in step 9, the two seals in step 10
    open_page("#story=9"); pg.wait_for_timeout(800)
    card = pg.evaluate(probe)["card"]
    report("card-s9", {} if ("41 18 59 14 3a" in card and "10 a6 35 ff" in card and VPN in card) else {"card": card[:200]})
    open_page("#story=10"); pg.wait_for_timeout(800)
    card = pg.evaluate(probe)["card"]
    report("card-s10", {} if ("68 92 f3 1c" in card and "10 a6 35 ff" in card) else {"card": card[:200]})

    # the sandbox: (vpn, https, eve, flip) -> what Eve's tag holds, and whether the packet arrived
    SB = [((True, True, "cafe", False), [VPN], [BOB], False), ((False, True, "cafe", False), [BOB, "bob.example"], ["soleil42"], False),
          ((False, False, "isp", False), ["soleil42"], [], False), ((True, True, "vpn", False), [CAFE, BOB], [], False),
          ((True, True, "bob", False), [VPN], [CAFE], False), ((True, True, "isp", True), [VPN], [], True)]
    for (vpn, https, eve, flip), has, hasnt, dropped in SB:
        open_page("#sandbox")
        pg.locator("#sb-vpn button").nth(0 if vpn else 1).click()
        pg.locator("#sb-https button").nth(0 if https else 1).click()
        pg.locator("#sb-eve button").nth(["cafe", "isp", "vpn", "bob"].index(eve)).click()
        if flip: pg.check("#sb-flip")
        pg.wait_for_function(idle, timeout=60000)
        pg.click("#sb-send")
        settle(240000)
        r = pg.evaluate("demo.sandbox.result()") or {}
        text = " | ".join(r.get("lines", []))
        bad = {}
        if [x for x in has if x not in text]: bad["has"] = (text, has)
        if [x for x in hasnt if x in text]: bad["hasnt"] = (text, hasnt)
        if r.get("dropped") != dropped: bad["dropped"] = (r.get("dropped"), dropped)
        report(f"sandbox-{'vpn' if vpn else 'novpn'}-{'https' if https else 'http'}-{eve}{'-flip' if flip else ''}", bad)
    print("errors:", errors or "none")
    errors and fails.append("page errors")
    b.close()
sys.exit(1 if fails else 0)
