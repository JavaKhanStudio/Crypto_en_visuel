#!/usr/bin/env python3
"""r196: lab/print/ (the admin page that prints a scene) on one episode. Checks every asset of its
print list resolves (or says why it cannot be printed), then reads the STL the page would put in the
zip and checks it: a whole number of triangles, the size it shows (height or longest side as asked,
within 1 mm), standing on z = 0, repaired (r394: lib/print.js repair leaves 0 open, 0 flat, 0 thin, 0
floating pieces, and PRINT.txt lists the fixes), and closed pieces with a positive volume (outward faces: the export
turns Y up into Z up without mirroring). Prints each asset's line as the page shows it, shoots the
page to out/print_lab-<ep>.png (a castle) and -<figure>.png. Serve the repo first (python3 -m http.server 8793), or pass a base URL.

    python3 tests/print_lab.py [base] [ep]
"""
import sys, struct, base64, io, zipfile
from playwright.sync_api import sync_playwright

base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8793/"
ep = sys.argv[2] if len(sys.argv) > 2 else "deux-generaux"
bad = []
def report(name, ok, note=""):
    print(("ok   " if ok else "FAIL ") + name + ("  " + note if note else ""))
    if not ok: bad.append(name)

def read_stl(b):
    n = struct.unpack_from("<I", b, 80)[0]
    if len(b) != 84 + 50 * n: return None
    tris = [struct.unpack_from("<12f", b, 84 + 50 * i)[3:] for i in range(n)]
    return tris

def volume(tris):   # signed volume: > 0 when the faces point out
    v = 0
    for t in tris:
        a, b, c = t[0:3], t[3:6], t[6:9]
        v += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6
    return v

with sync_playwright() as p:
    br = p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = br.new_page(viewport={"width": 1400, "height": 860})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"{base}lab/print/?ep={ep}")
    pg.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
    rows = pg.evaluate("""() => printLab.rows.map(r => ({ id: r.a.id, no: r.a.printable === false, why: r.a.why, err: r.error,
        n: r.fix?.ps.length, mm: r.mm, size: r.size, issues: r.issues, left: r.left, skipped: r.parts?.skipped, fixes: r.fix?.log.length,
        closed: r.after?.map(c => !c.open && !c.flat) }))""")
    for r in rows:
        if r["no"]:
            report(f"{r['id']}: not printable, says why", bool(r["why"]), r["why"][:70]); continue
        report(f"{r['id']}: read from the episode", not r["err"] and r["n"], r["err"] or f"{r['n']} pieces, {r['mm'][0]}x{r['mm'][2]}x{r['mm'][1]} mm, {r['issues']}, left out {r['skipped']}")
        if not r["err"]:   # r394: the export repairs what check() and floating() flag
            left = r["left"]
            report(f"{r['id']}: repaired, 0 open, 0 flat, 0 thin, 0 floating", not (left["open"] or left["flat"] or left["thin"] or left["floats"]), f"{r['fixes']} fixes, left {left}")
    ids = [r["id"] for r in rows if not r["no"] and not r["err"]]
    fl = pg.evaluate("""ids => printLab.files(ids).map(f => ({ name: f.name,
        b64: typeof f.data === 'string' ? btoa(unescape(encodeURIComponent(f.data))) : btoa(Array.from(f.data, c => String.fromCharCode(c)).join('')) }))""", ids)
    files = {f["name"]: base64.b64decode(f["b64"]) for f in fl}
    for r in rows:
        if r["no"] or r["err"]: continue
        i = r["id"]; tris = read_stl(files[f"{i}/{i}.stl"])
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
    report("no page errors", not errs, "; ".join(errs)[:200])
    br.close()
print("all ok" if not bad else f"FAIL: {len(bad)}")
sys.exit(1 if bad else 0)
