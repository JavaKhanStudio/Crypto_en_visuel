#!/usr/bin/env python3
"""r105: Two Generals' last step holds the doors out — sandbox, quiz, all episodes, then the next
episode last at the right — each with a picture that loads; the sandbox and quiz doors switch mode,
the others link out in the page's language. On desktop each door's 4 s clip plays on hover, stops
where it is when the pointer leaves and goes on from there; a phone (no hover) has no clip.
Phone and desktop. Serve the repo root on 8793 first."""
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8793/deux-generaux/"
bad = 0
with sync_playwright() as p:
    br = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    for size, lang in [((1440, 860), "fr"), ((390, 844), "en")]:
        phone = size[0] < 720
        pg = br.new_page(viewport={"width": size[0], "height": size[1]}, has_touch=phone, is_mobile=phone)
        pg.goto(f"{BASE}?instant=1&lang={lang}#story=14"); pg.wait_for_function("window.demo && window.demo.ready", timeout=60000)
        doors = pg.locator("#step-actions .door")
        got = pg.evaluate("""() => [...document.querySelectorAll('#step-actions .door')].map(d => ({
            cls: d.className, href: d.getAttribute('href'), x: d.getBoundingClientRect().right, y: d.getBoundingClientRect().bottom,
            img: d.querySelector('img').complete && d.querySelector('img').naturalWidth > 0 }))""")
        checks = {
            "four doors": len(got) == 4,
            "every picture loaded": all(d["img"] for d in got),
            "next is last": got[-1]["cls"] == "door next" and got[-1]["href"] == f"../eve-lit-tout/?lang={lang}",
            "next at the right, bottom row": all(got[-1]["x"] >= d["x"] - 1 and got[-1]["y"] >= d["y"] - 1 for d in got),
            "home links in language": got[2]["href"] == f"../?lang={lang}",
        }
        clip = "() => { const v = document.querySelector('#step-actions .door.next video'); return v && [v.currentTime, v.paused, v.classList.contains('on')]; }"
        if phone:
            checks["no clip on a phone"] = pg.evaluate("document.querySelectorAll('#step-actions video').length") == 0
        else:
            checks["every door has a clip"] = pg.evaluate("document.querySelectorAll('#step-actions .door video').length") == 4
            doors.nth(3).hover(); pg.wait_for_timeout(1500); t1, paused1, on = pg.evaluate(clip)
            checks[f"hover plays the clip (t={t1:.2f})"] = t1 > .5 and not paused1 and on
            pg.mouse.move(5, 5); pg.wait_for_timeout(200); t2, paused2, _ = pg.evaluate(clip)
            pg.wait_for_timeout(800); t3, _, _ = pg.evaluate(clip)
            checks[f"leaving stops it where it is (t={t2:.2f})"] = paused2 and abs(t3 - t2) < .01
            doors.nth(3).hover(); pg.wait_for_timeout(500); t4, _, _ = pg.evaluate(clip)
            checks[f"hovering again goes on from there (t={t4:.2f})"] = t4 > t2 or t4 < t2 - 3   # or looped past 4 s
        doors.nth(0).click(); pg.wait_for_timeout(300)
        checks["sandbox door opens the sandbox"] = pg.evaluate("location.hash") == "#sandbox"
        for k, ok in checks.items():
            print(("ok  " if ok else "BAD ") + f"{size[0]}px {lang}: {k}"); bad += not ok
        pg.close()
    br.close()
print("all ok" if not bad else f"{bad} failed"); raise SystemExit(bad > 0)
