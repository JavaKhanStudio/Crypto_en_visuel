#!/usr/bin/env python3
"""r105: Two Generals' last step holds the doors out — sandbox, quiz, all episodes, then the next
episode last at the right — each with a picture that loads; the sandbox and quiz doors switch mode,
the others link out in the page's language. Phone and desktop. Serve the repo root on 8793 first."""
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8793/deux-generaux/"
bad = 0
with sync_playwright() as p:
    br = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    for size, lang in [((1440, 860), "fr"), ((390, 844), "en")]:
        pg = br.new_page(viewport={"width": size[0], "height": size[1]})
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
        doors.nth(0).click(); pg.wait_for_timeout(300)
        checks["sandbox door opens the sandbox"] = pg.evaluate("location.hash") == "#sandbox"
        for k, ok in checks.items():
            print(("ok  " if ok else "BAD ") + f"{size[0]}px {lang}: {k}"); bad += not ok
        pg.close()
    br.close()
print("all ok" if not bad else f"{bad} failed"); raise SystemExit(bad > 0)
