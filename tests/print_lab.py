#!/usr/bin/env python3
"""r196: lab/print/ (the admin page that prints a scene) on one episode. Checks every asset of its
print list resolves (or says why it cannot be printed), then reads the STL the page would put in the
zip and checks it: a whole number of triangles, the size it shows (height or longest side as asked,
within 1 mm), standing on z = 0, repaired (r394: lib/print.js repair leaves 0 open, 0 flat, 0 thin, 0
floating pieces, and PRINT.txt lists the fixes), and closed pieces with a positive volume (outward faces: the export
turns Y up into Z up without mirroring). r451: every asset shows whether a human checked it, and the list
shape's fields are proven on a fixture list (tests/print/shape-assets.js): a stripped part is absent from
the files, a scaled part is scaled, a body is its own STL on the bed, a checked asset loses the badge.
r452: the lab runs only behind tools/serve_review.py (a plain static server gets the 'local only' page);
a comment survives a reload and a fresh browser, Send makes one ticket with it (dry: the atelier add it
would run), ticking 'checked' clears the badge. With no base, the test serves the repo itself through
tools/serve_review.py in a temp review dir; a base you pass must be a serve_review.py. Prints each asset's line as the page shows it, shoots the
page to out/print_lab-<ep>.png (a castle) and -<figure>.png. Serve the repo first (python3 -m http.server 8793), or pass a base URL.

    python3 tests/print_lab.py [base] [ep]      (base '' or omitted: its own server)
"""
import sys, struct, base64, io, zipfile
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'tools'))
from browser import launch   # r401: GPU, CRYPTO_GL=soft for SwiftShader

import tempfile, json, threading, functools, http.server
from serve_review import serve, ROOT
ep = sys.argv[2] if len(sys.argv) > 2 else "deux-generaux"
tmp = tempfile.mkdtemp(prefix="print_lab-"); dry = _os.path.join(tmp, "sent.jsonl")
base = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] else serve(0, review_dir=tmp, dry_send=dry)[0]
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
plain = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT))   # a plain static host, like Pages
threading.Thread(target=plain.serve_forever, daemon=True).start()
bad = []
def report(name, ok, note=""):
    print(("ok   " if ok else "FAIL ") + name + ("  " + note if note else ""))
    if not ok: bad.append(name)

def read_stl(b):
    n = struct.unpack_from("<I", b, 80)[0]
    if len(b) != 84 + 50 * n: return None
    tris = [struct.unpack_from("<12f", b, 84 + 50 * i)[3:] for i in range(n)]
    return tris

import re
slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s, flags=re.I).lower()

def volume(tris):   # signed volume: > 0 when the faces point out
    v = 0
    for t in tris:
        a, b, c = t[0:3], t[3:6], t[6:9]
        v += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6
    return v

with sync_playwright() as p:
    br = launch(p)
    pg = br.new_page(viewport={"width": 1400, "height": 860})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"{base}lab/print/?ep={ep}")
    pg.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
    rows = pg.evaluate("""() => printLab.rows.map(r => ({ id: r.a.id, no: r.a.printable === false, why: r.a.why, err: r.error,
        n: r.fix?.ps.length, mm: r.mm, size: r.size, issues: r.issues, left: r.left, skipped: r.parts?.skipped, fixes: r.fix?.log.length,
        closed: r.after?.map(c => !c.open && !c.flat), bodies: r.fix?.bodies.map(b => b.name),
        unchecked: !!r.tr.querySelector('.unchecked'), checked: r.tr.querySelector('.checked')?.textContent,
        can: !r.tr.querySelector('input[type=checkbox]').disabled }))""")
    for r in rows:
        if r["no"]:
            report(f"{r['id']}: not printable, says why", bool(r["why"]), r["why"][:70]); continue
        report(f"{r['id']}: read from the episode", not r["err"] and r["n"], r["err"] or f"{r['n']} pieces, {r['mm'][0]}x{r['mm'][2]}x{r['mm'][1]} mm, {r['issues']}, left out {r['skipped']}")
        report(f"{r['id']}: says whether a human checked it, still downloadable", (r["unchecked"] != bool(r["checked"])) and (r["can"] or bool(r["err"])), r["checked"] or "not checked by a human")
        if not r["err"]:   # r394: the export repairs what check() and floating() flag
            left = r["left"]
            report(f"{r['id']}: repaired, 0 open, 0 flat, 0 thin, 0 floating", not (left["open"] or left["flat"] or left["thin"] or left["floats"]), f"{r['fixes']} fixes, left {left}")
    ids = [r["id"] for r in rows if not r["no"] and not r["err"]]
    fl = pg.evaluate("""ids => printLab.files(ids).map(f => ({ name: f.name,
        b64: typeof f.data === 'string' ? btoa(unescape(encodeURIComponent(f.data))) : btoa(Array.from(f.data, c => String.fromCharCode(c)).join('')) }))""", ids)
    files = {f["name"]: base64.b64decode(f["b64"]) for f in fl}
    for r in rows:
        if r["no"] or r["err"]: continue
        i = r["id"]; many = len(r["bodies"]) > 1
        if many:   # r451: one STL per body, each on the bed on its own; the size is checked on the whole below
            for b in r["bodies"]:
                n = f"{i}/{i}-{slug(b)}.stl"; bt = read_stl(files[n]) if n in files else None
                report(f"{n}: a body of its own, whole triangles, on the bed", bt is not None and abs(min(t[k] for t in bt for k in (2, 5, 8))) < 1e-3)
            continue
        tris = read_stl(files[f"{i}/{i}.stl"])
        report(f"{i}.stl: whole triangles", tris is not None)
        if not tris: continue
        xs = [t[k] for t in tris for k in (0, 3, 6)]; ys = [t[k] for t in tris for k in (1, 4, 7)]; zs = [t[k] for t in tris for k in (2, 5, 8)]
        w, d, h = max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)
        want = r["size"].get("h") or r["size"].get("max"); got = h if "h" in r["size"] else max(w, d, h)
        report(f"{i}.stl: {want} mm as asked", abs(got - want) < 1, f"{w:.0f} x {d:.0f} x {h:.0f} mm")
        report(f"{i}.stl: stands on the bed", abs(min(zs)) < 1e-3)
        pieces = sorted((n for n in files if n.startswith(f"{i}/pieces/")), key=lambda n: int(n.split("/")[-1].split("-")[0]))
        report(f"{i}: one STL per piece", len(pieces) == r["n"])
        vols = [volume(read_stl(files[n])) for n, c in zip(pieces, r["closed"]) if c]
        report(f"{i}: closed pieces face outwards", all(v > 0 for v in vols), f"{len(vols)} closed, min volume {min(vols, default=0):.1f} mm3")
        report(f"{i}: PRINT.txt", f"{i}/PRINT.txt" in files and (not r["fixes"] or "Fixed for printing" in files[f"{i}/PRINT.txt"].decode()))
    zb = base64.b64decode(pg.evaluate("""async ids => { const { zip } = await import('../../lib/print.js');
        const b = new Uint8Array(await zip(printLab.files(ids)).arrayBuffer()); let s = ''; for (const c of b) s += String.fromCharCode(c); return btoa(s); }""", ["guard", "tree"]))
    zf = zipfile.ZipFile(io.BytesIO(zb))
    report("the .zip opens, every CRC right", zf.testzip() is None and zf.read("guard/guard.stl") == files["guard/guard.stl"], f"{len(zf.namelist())} files")
    pg.locator("tr.asset[data-id=castle-a]").click(); pg.wait_for_timeout(800)
    pg.screenshot(path=f"out/print_lab-{ep}.png")
    figure = next((r["id"] for r in rows if not r["no"] and not r["err"] and "rider" in r["id"]), None)
    if figure:
        pg.locator(f"tr.asset[data-id={figure}]").click(); pg.wait_for_timeout(800)
        pg.screenshot(path=f"out/print_lab-{ep}-{figure}.png")
    # r451: the list shape's fields, on the fixture list
    real_cape = any(n.startswith("rider-a/pieces/") and "-plane-" in n for n in files)
    pg.goto(f"{base}lab/print/?ep={ep}&assets=tests/print/shape-assets.js")
    pg.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
    sh = pg.evaluate("""async () => { const r = printLab.rows.find(r => r.a.id === 'shape-rider'), c = printLab.rows.find(r => r.a.id === 'shape-checked');
        const P = await import('../../lib/print.js'), z = ps => P.bounds(ps).size[2];
        const scroll = r.fix.ps.find(p => p.scaled === 'scroll'), raw = P.pieces(r.a.get(), { omit: [] }).find(p => p.type === 'CylinderGeometry' && p.name === 'Cylinder' && Math.abs(P.bounds([p]).size[2] - .8) < .05);
        return { stripped: r.parts.stripped.map(p => p.part), inFix: r.fix.ps.filter(p => p.part).length, log: r.fix.log,
          bodies: r.fix.bodies.map(b => ({ name: b.name, n: b.ps.length, tris: b.ps.reduce((s, p) => s + p.tris.length / 9, 0) })),
          scroll: scroll && z([scroll]), rawScroll: raw && z([raw]), left: r.left,
          badge: !!r.tr.querySelector('.unchecked'), cBadge: !!c.tr.querySelector('.unchecked'), cMark: c.tr.querySelector('.checked')?.textContent }; }""")
    fl = pg.evaluate("""ids => printLab.files(ids).map(f => ({ name: f.name,
        b64: typeof f.data === 'string' ? btoa(unescape(encodeURIComponent(f.data))) : btoa(Array.from(f.data, c => String.fromCharCode(c)).join('')) }))""", ["shape-rider"])
    sf = {f["name"]: base64.b64decode(f["b64"]) for f in fl}; txt = sf.get("shape-rider/PRINT.txt", b"").decode()
    report("strip: the cape is out of the files and listed in PRINT.txt", sh["stripped"] == ["cape"] and not sh["inFix"] and real_cape
        and not any("-plane-" in n for n in sf) and "cape: removed for print" in txt, f"rider-a has a cape piece: {real_cape}")
    report("scale: the scroll is 1.5 times as long", sh["scroll"] and abs(sh["scroll"] / sh["rawScroll"] - 1.5) < .02 and "scroll: reshaped for print" in txt, f"{sh['rawScroll']} -> {sh['scroll']}")
    bt = {b["name"]: b for b in sh["bodies"]}
    ok = set(bt) == {"main", "rider"}
    for b in sh["bodies"]:
        t = read_stl(sf.get(f"shape-rider/shape-rider-{b['name']}.stl", b""))
        ok = ok and t is not None and len(t) == b["tris"] and abs(min(v[k] for v in t for k in (2, 5, 8))) < 1e-3
    report("bodies: the rider is an STL of its own, the horse another, each on the bed", ok and "shape-rider/shape-rider.stl" not in sf and "Printed in 2 bodies" in txt,
        ", ".join(f"{b['name']} {b['n']} pieces {b['tris']} tris" for b in sh["bodies"]))
    report("bodies: each repaired, nothing left to fix", not any(sh["left"].values()), str(sh["left"]))
    report("checked: the badge on an unchecked asset, a date on a checked one", sh["badge"] and not sh["cBadge"] and "2026-10-23" in (sh["cMark"] or "") and "NOT CHECKED BY A HUMAN" in txt, sh["cMark"])
    # r452: Simon's review. Local only: a plain static server gets the notice, not the lab
    pp = br.new_page(); pp.goto(f"http://127.0.0.1:{plain.server_address[1]}/lab/print/?ep={ep}"); pp.wait_for_selector("#local-only", timeout=20000)
    report("local only: a plain static server shows the notice and loads nothing", pp.locator("#rows").count() == 0, pp.inner_text("#local-only").replace("\n", " ")[:90]); pp.close()
    if len(sys.argv) > 1 and sys.argv[1]:
        print("(review checks skipped: they write, so they run only on the test's own server)")
    else:
        lab = f"{base}lab/print/?ep={ep}"
        pg.goto(lab + "#castle-a"); pg.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
        report("#<asset> opens that asset", pg.locator("tr.asset.on").get_attribute("data-id") == "castle-a")
        pg.fill("#rv-text", "the flag can go, and the base need not be this big"); pg.click("#rv-add")
        pg.wait_for_selector("#review li .open")
        pg.locator("tr.asset[data-id=rider-a]").click(); pg.fill("#rv-text", "no cape"); pg.click("#rv-add"); pg.wait_for_selector("#review li .open")
        pg.locator("#rv-check").check(); pg.wait_for_selector("tr.asset[data-id=rider-a] .checked")
        report("checked: the tick clears the badge", pg.locator("tr.asset[data-id=rider-a] .unchecked").count() == 0
            and pg.locator("tr.asset[data-id=castle-a] .unchecked").count() == 1, pg.inner_text("tr.asset[data-id=rider-a] .checked"))
        ctx = br.new_context(); fresh = ctx.new_page()   # a fresh browser: no cache, no storage
        fresh.goto(lab + "#castle-a"); fresh.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
        report("a comment survives a fresh browser", "the flag can go" in fresh.inner_text("#review")
            and fresh.locator("tr.asset[data-id=rider-a] .checked").count() == 1, fresh.inner_text("tr.asset[data-id=castle-a] .mark").strip())
        report("Send says how many comments are open", fresh.inner_text("#send") == "Send the 2 open comments to an agent", fresh.inner_text("#send"))
        fresh.click("#send"); fresh.wait_for_selector("#sent .ok, #sent .bad")
        sent = [json.loads(l) for l in open(dry)] if _os.path.exists(dry) else []
        argv = sent[0]["argv"] if sent else []
        det = argv[argv.index("--detail") + 1] if "--detail" in argv else ""
        report("Send: ONE ticket on the episode's tag, every open comment, file:line, the lab link", len(sent) == 1 and argv[:2] == ["atelier", "add"]
            and argv[argv.index("--tags") + 1] == ep and "the flag can go" in det and "no cape" in det
            and re.search(rf"{ep}/js/print-assets.js:\d+", det) and f"lab/print/?ep={ep}#castle-a" in det, fresh.inner_text("#sent"))
        fresh.reload(); fresh.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
        rv = json.load(open(_os.path.join(tmp, f"{ep}.json")))
        report("sent comments are marked with the ticket, none left to send", all(c["sent"] == sent[0]["ref"] for e in rv["assets"].values() for c in e["comments"])
            and fresh.locator("#send").is_disabled() and "sent in" in fresh.inner_text("#review"), fresh.inner_text("#send"))
        fresh.locator("tr.asset[data-id=rider-a]").click(); fresh.locator("#rv-check").uncheck(); fresh.wait_for_selector("tr.asset[data-id=rider-a] .unchecked")
        report("unticking brings the badge back", True)
        pg.reload(); pg.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
        pg.locator("tr.asset[data-id=castle-a]").click(); pg.wait_for_timeout(600); pg.screenshot(path=f"out/print_lab-{ep}-review.png")
        ctx.close()
    report("no page errors", not errs, "; ".join(errs)[:200])
    br.close()
print("all ok" if not bad else f"FAIL: {len(bad)}")
sys.exit(1 if bad else 0)
