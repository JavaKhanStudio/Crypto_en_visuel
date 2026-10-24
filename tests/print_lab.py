#!/usr/bin/env python3
"""r196: lab/print/ (the admin page that prints a scene) on one episode. Checks every asset of its
print list resolves (or says why it cannot be printed), then reads the STL the page would put in the
zip and checks it: a whole number of triangles, the size it shows (height or longest side as asked,
within 1 mm), standing on z = 0, repaired (r394: lib/print.js repair leaves 0 open, 0 flat, 0 thin, 0
floating pieces, and PRINT.txt lists the fixes), and closed pieces with a positive volume (outward faces: the export
turns Y up into Z up without mirroring). r451: every asset shows whether a human checked it, and the list
shape's fields are proven on a fixture list (tests/print/shape-assets.js): a stripped part is absent from
the files, a scaled part is scaled, a body is its own STL on the bed, a checked asset loses the badge;
r395: a cast figure's swing: in the list keys the arm it names for that range and leaves the null one a plain peg.
r552: a body that sat on another (the fixture's rider on his horse) has a 3 mm peg under it and a socket 0.4 mm wider
in the body below, measured from the STL; glue: [names] opts a body out. r572: 1.1's castle flags: the pole is the peg,
the castle has a socket 0.4 mm wider, and the flag body lies flat (flat: [names]).
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
        stripped: [...new Set(r.parts?.stripped.map(p => p.part) || [])],
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
    # r460: an episode without the saga's castle, guard or rider is shot and zipped on its own first assets
    kinds = pg.evaluate("() => Object.fromEntries(printLab.rows.map(r => [r.a.id, r.a.kind]))")
    land = "castle-a" if "castle-a" in ids else next((i for i in ids if kinds[i] == "landmark"), ids[0])
    pair = ["guard", "tree"] if {"guard", "tree"} <= set(ids) else ids[:2]
    fl = pg.evaluate("""ids => printLab.files(ids).map(f => ({ name: f.name,
        b64: typeof f.data === 'string' ? btoa(unescape(encodeURIComponent(f.data))) : btoa(Array.from(f.data, c => String.fromCharCode(c)).join('')) }))""", ids)
    files = {f["name"]: base64.b64decode(f["b64"]) for f in fl}
    for r in rows:
        if r["no"] or r["err"]: continue
        i = r["id"]; many = len(r["bodies"]) > 1
        if many:   # r451: one STL per body, each on the bed on its own; the size is checked on the whole below
            for b in r["bodies"]:
                n = f"{i}/{i}-{slug(b)}.stl"; bt = read_stl(files[n]) if n in files else None
                dims = bt and [max(t[k] for t in bt for k in ax) - min(t[k] for t in bt for k in ax) for ax in ((0, 3, 6), (1, 4, 7), (2, 5, 8))]
                report(f"{n}: a body of its own, whole triangles, on the bed", bt is not None and abs(min(t[k] for t in bt for k in (2, 5, 8))) < 1e-3,
                    dims and "%.0f x %.0f x %.0f mm" % tuple(dims))
                if b == "flag" and dims:   # r453: the flag prints on its own (a pin), the castle keeps the footprint it had with it
                    m = f"{i}/{i}-main.stl"; mt = read_stl(files[m]) if m in files else []
                    mh = max((t[k] for t in mt for k in (2, 5, 8)), default=0)
                    report(f"{i}: the flag apart, the castle under it {mh:.0f} mm high, the footprint {r['mm'][0]}x{r['mm'][2]} mm",
                        mt and mh < max(r["size"].values()) - 5 and max(r["mm"]) <= max(r["size"].values()) + 1
                        and f"x {mh:.0f} mm)" in files.get(f"{i}/PRINT.txt", b"").decode())
        if "flag" in r["bodies"]:   # r572: the flag's pole is its peg, a socket 0.4 mm wider in the castle, and the flag lies flat
            ax = pg.evaluate("""async id => { const P = await import('../../ficelle/lib/print.js'), r = printLab.rows.find(r => r.a.id === id), b = r.fix.bodies.find(b => b.name === 'main');
                const { lo, hi } = P.bounds(b.ps), pole = r.fix.ps.find(p => p.peg); if (!pole) return null;
                return { xy: [(pole.axis[0] - (lo[0] + hi[0]) / 2) * r.k, -(pole.axis[2] - (lo[2] + hi[2]) / 2) * r.k], i: r.fix.ps.indexOf(pole) }; }""", i)
            mt = read_stl(files.get(f"{i}/{i}-main.stl", b"")) or []; ft = read_stl(files.get(f"{i}/{i}-flag.stl", b"")) or []
            pf = sorted((n for n in files if n.startswith(f"{i}/pieces/")), key=lambda n: int(n.split("/")[-1].split("-")[0]))
            pt = ax and read_stl(files[pf[ax["i"]]])
            pd = pt and sorted(max(t[k] for t in pt for k in ax_) - min(t[k] for t in pt for k in ax_) for ax_ in ((0, 3, 6), (1, 4, 7), (2, 5, 8)))[1]   # across the pole: its middle extent
            wall = ax and [((v[0] - ax["xy"][0]) ** 2 + (v[1] - ax["xy"][1]) ** 2) ** .5 for t in mt for v in (t[0:3], t[3:6], t[6:9])]
            ring = wall and [round(d, 2) for d in wall if .8 < d < 1.6]   # the socket's wall: the distance most vertices near the axis share
            sd = ring and 2 * max(set(ring), key=ring.count)
            fd = ft and [max(t[k] for t in ft for k in a_) - min(t[k] for t in ft for k in a_) for a_ in ((0, 3, 6), (1, 4, 7), (2, 5, 8))]
            report(f"{i}: the flag's pole is its peg, the castle a socket 0.4 mm wider", bool(pd and sd) and abs(pd - 2) < .1 and abs(sd - pd - .4) < .06 and volume(pt) > 0,
                f"pole {pd or 0:.2f} mm, socket {sd or 0:.2f} mm")
            report(f"{i}: the flag lies flat, its thinnest side vertical", bool(fd) and fd[2] == min(fd), fd and "%.1f x %.1f x %.1f mm" % tuple(fd))
        else:
            tris = read_stl(files[f"{i}/{i}.stl"])
            report(f"{i}.stl: whole triangles", tris is not None)
            if not tris: continue
            xs = [t[k] for t in tris for k in (0, 3, 6)]; ys = [t[k] for t in tris for k in (1, 4, 7)]; zs = [t[k] for t in tris for k in (2, 5, 8)]
            w, d, h = max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)
            want = r["size"].get("h") or r["size"].get("max"); got = h if "h" in r["size"] else max(w, d, h)
            report(f"{i}.stl: {want} mm as asked", abs(got - want) < 1, f"{w:.0f} x {d:.0f} x {h:.0f} mm")
            report(f"{i}.stl: stands on the bed", abs(min(zs)) < 1e-3)
        # r501: a body per part (a cast figure, its sockets cut) has its pieces checked like any asset's
        pieces = sorted((n for n in files if n.startswith(f"{i}/pieces/")), key=lambda n: int(n.split("/")[-1].split("-")[0]))
        report(f"{i}: one STL per piece", len(pieces) == r["n"])
        vols = [volume(read_stl(files[n])) for n, c in zip(pieces, r["closed"]) if c]
        report(f"{i}: closed pieces face outwards", all(v > 0 for v in vols), f"{len(vols)} closed, min volume {min(vols, default=0):.1f} mm3")
        report(f"{i}: PRINT.txt", f"{i}/PRINT.txt" in files and (not r["fixes"] or "Fixed for printing" in files[f"{i}/PRINT.txt"].decode()))
        if r["stripped"]:   # r453: what the list strips (1.1's flags and capes) is named in PRINT.txt, and no piece of it is written
            txt = files.get(f"{i}/PRINT.txt", b"").decode()
            report(f"{i}: PRINT.txt lists the parts removed for print", all(f"{n}: removed for print" in txt for n in r["stripped"]), ", ".join(r["stripped"]))
        if i.startswith("rider-"):   # r453: the 'triangle on top of him' is the beacon gem, a glow left out since r394
            report(f"{i}: no beacon gem in the files", not any("octahedron" in n.lower() for n in files if n.startswith(f"{i}/")), ", ".join(n.split("/")[-1] for n in files if n.startswith(f"{i}/pieces/"))[:120])
    zb = base64.b64decode(pg.evaluate("""async ids => { const { zip } = await import('../../ficelle/lib/print.js');
        const b = new Uint8Array(await zip(printLab.files(ids)).arrayBuffer()); let s = ''; for (const c of b) s += String.fromCharCode(c); return btoa(s); }""", pair))
    zf = zipfile.ZipFile(io.BytesIO(zb))
    first = next(n for n in files if n.startswith(f"{pair[0]}/") and n.endswith(".stl"))   # <id>.stl, or a body's (r451, r501)
    report("the .zip opens, every CRC right", zf.testzip() is None and zf.read(first) == files[first], f"{len(zf.namelist())} files")
    pg.locator(f"tr.asset[data-id={land}]").click(); pg.wait_for_timeout(800)
    pg.screenshot(path=f"out/print_lab-{ep}.png")
    figure = next((i for i in ids if "rider" in i), None) or next((i for i in ids if kinds[i] == "figure"), None) \
    or next((i for i in ids if i != land), None)   # r470: an episode with no figure (11: cubes, tiles, a box) is reviewed on another asset
    if figure:
        pg.locator(f"tr.asset[data-id={figure}]").click(); pg.wait_for_timeout(800)
        pg.screenshot(path=f"out/print_lab-{ep}-{figure}.png")
    # r451: the list shape's fields, on the fixture list
    pg.goto(f"{base}lab/print/?ep={ep}&assets=tests/print/shape-assets.js")
    pg.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
    sh = pg.evaluate("""async () => { const r = printLab.rows.find(r => r.a.id === 'shape-rider'), c = printLab.rows.find(r => r.a.id === 'shape-checked');
        const P = await import('../../ficelle/lib/print.js'), z = ps => P.bounds(ps).size[2];
        const scroll = r.fix.ps.find(p => p.scaled === 'scroll'), raw = P.pieces(r.a.get(), { omit: [] }).find(p => p.type === 'CylinderGeometry' && p.name === 'Cylinder' && Math.abs(P.bounds([p]).size[2] - .8) < .05);
        return { rawCape: P.pieces(r.a.get(), { omit: [] }).some(p => p.type === 'PlaneGeometry'), stripped: r.parts.stripped.map(p => p.part), inFix: r.fix.ps.filter(p => p.part).length, log: r.fix.log,
          bodies: r.fix.bodies.map(b => ({ name: b.name, n: b.ps.length, tris: b.ps.reduce((s, p) => s + p.tris.length / 9, 0) })),
          scroll: scroll && z([scroll]), rawScroll: raw && z([raw]), left: r.left,
          badge: !!r.tr.querySelector('.unchecked'), cBadge: !!c.tr.querySelector('.unchecked'), cMark: c.tr.querySelector('.checked')?.textContent }; }""")
    fl = pg.evaluate("""ids => printLab.files(ids).map(f => ({ name: f.name,
        b64: typeof f.data === 'string' ? btoa(unescape(encodeURIComponent(f.data))) : btoa(Array.from(f.data, c => String.fromCharCode(c)).join('')) }))""", ["shape-rider"])
    sf = {f["name"]: base64.b64decode(f["b64"]) for f in fl}; txt = sf.get("shape-rider/PRINT.txt", b"").decode()
    report("strip: the cape is out of the files and listed in PRINT.txt", sh["stripped"] == ["cape"] and not sh["inFix"] and sh["rawCape"]
        and not any("-plane-" in n for n in sf) and "cape: removed for print" in txt, f"the unstripped rider has a cape piece: {sh['rawCape']}")
    report("scale: the scroll is 1.5 times as long", sh["scroll"] and abs(sh["scroll"] / sh["rawScroll"] - 1.5) < .02 and "scroll: reshaped for print" in txt, f"{sh['rawScroll']} -> {sh['scroll']}")
    bt = {b["name"]: b for b in sh["bodies"]}
    ok = set(bt) == {"main", "rider"}
    for b in sh["bodies"]:
        t = read_stl(sf.get(f"shape-rider/shape-rider-{b['name']}.stl", b""))
        ok = ok and t is not None and len(t) == b["tris"] and abs(min(v[k] for v in t for k in (2, 5, 8))) < 1e-3
    report("bodies: the rider is an STL of its own, the horse another, each on the bed", ok and "shape-rider/shape-rider.stl" not in sf and "Printed in 2 bodies" in txt,
        ", ".join(f"{b['name']} {b['n']} pieces {b['tris']} tris" for b in sh["bodies"]))
    # r552: the rider goes back on his horse on a peg: a 3 mm post under his foot, a socket 0.4 mm wider cut in the
    # horse's back, both measured from the files the zip gets, both closed with a positive volume
    pk = pg.evaluate("""() => { const r = printLab.rows.find(r => r.a.id === 'shape-rider');
        return r.fix.ps.map((p, i) => ({ i, body: p.body, peg: !!p.peg, cut: !!p.cut, closed: !r.after[i].open && !r.after[i].flat })); }""")
    pf = sorted((n for n in sf if n.startswith("shape-rider/pieces/")), key=lambda n: int(n.split("/")[-1].split("-")[0]))
    ext = lambda vs, k: max(v[k] for v in vs) - min(v[k] for v in vs)
    pv = lambda t: [v[j:j + 3] for v in t for j in (0, 3, 6)]
    peg = next((q for q in pk if q["peg"]), None); sock = next((q for q in pk if q["cut"] and q["body"] == "main"), None)
    rt = read_stl(sf.get("shape-rider/shape-rider-rider.stl", b"")) or []
    low = [v for v in pv(rt) if v[2] < 2.9]   # the rider stands on his peg's tip: under 2.9 mm there is only the peg
    pin_d = low and (ext(low, 0) + ext(low, 1)) / 2
    st = read_stl(sf[pf[sock["i"]]]) if sock else []
    vs = pv(st); lo = [min(v[k] for v in vs) for k in range(3)] if vs else []; hi = [max(v[k] for v in vs) for k in range(3)] if vs else []
    hole = [v for v in vs if all(lo[k] + .5 < v[k] < hi[k] - .5 for k in (0, 1)) and lo[2] + .1 < v[2] < hi[2] - .1]   # inside the horse's back, off its faces
    sock_d = hole and (ext(hole, 0) + ext(hole, 1)) / 2; depth = hole and hi[2] - min(v[2] for v in hole)
    pv_ = peg and volume(read_stl(sf[pf[peg["i"]]])); sv = st and volume(st)
    report("peg: the rider has a 3 mm peg under him, the horse a socket 0.4 mm wider", bool(peg and sock and pin_d and sock_d) and abs(pin_d - 3) < .06 and abs(sock_d - pin_d - .4) < .03
        and peg["closed"] and sock["closed"] and pv_ > 0 and sv > 0 and "peg: rider: a 3 mm peg" in txt and "each peg into its socket (r552)" in txt,
        f"peg {pin_d or 0:.2f} mm ({pv_ or 0:.1f} mm3), socket {sock_d or 0:.2f} mm, {depth or 0:.1f} mm deep ({sv or 0:.0f} mm3)")
    gl = pg.evaluate("""async () => { const P = await import('../../ficelle/lib/print.js'), r = printLab.rows.find(r => r.a.id === 'shape-rider');
        const g = P.pegs(r.fix.ps.filter(p => !p.peg), r.k, { glue: ['rider'] }); return { pegs: g.ps.filter(p => p.peg).length, log: g.log }; }""")
    report("glue: a body the list names in glue gets no peg", gl["pegs"] == 0 and gl["log"] == ["rider: glued, no peg (the list's glue)"], "; ".join(gl["log"]))
    report("bodies: each repaired, nothing left to fix", not any(sh["left"].values()), str(sh["left"]))
    # r395: swing: overrides a cast figure's range: the right arm keyed for 30 degrees, the left one a plain peg
    cl = pg.evaluate("() => { const r = printLab.rows.find(r => r.a.id === 'shape-cast'); return { log: r.fix.log, keys: r.fix.ps.filter(p => p.key).map(p => p.piece) }; }")
    report("swing: the list's range keys the right arm (-30 to 0), not the left", cl["keys"] == ["arm right"] and any(l.startswith("cut: arm right turns -30 to 0 degrees") for l in cl["log"]),
           f"keys on {cl['keys']}; " + next((l for l in cl["log"] if " turns " in l), "no key in the log")[:110])
    report("checked: the badge on an unchecked asset, a date on a checked one", sh["badge"] and not sh["cBadge"] and "2026-10-23" in (sh["cMark"] or "") and "NOT CHECKED BY A HUMAN" in txt, sh["cMark"])
    # r452: Simon's review. Local only: a plain static server gets the notice, not the lab
    pp = br.new_page(); pp.goto(f"http://127.0.0.1:{plain.server_address[1]}/lab/print/?ep={ep}"); pp.wait_for_selector("#local-only", timeout=20000)
    report("local only: a plain static server shows the notice and loads nothing", pp.locator("#rows").count() == 0, pp.inner_text("#local-only").replace("\n", " ")[:90]); pp.close()
    if len(sys.argv) > 1 and sys.argv[1]:
        print("(review checks skipped: they write, so they run only on the test's own server)")
    else:
        lab = f"{base}lab/print/?ep={ep}"
        pg.goto(lab + f"#{land}"); pg.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
        report("#<asset> opens that asset", pg.locator("tr.asset.on").get_attribute("data-id") == land)
        pg.fill("#rv-text", "the flag can go, and the base need not be this big"); pg.click("#rv-add")
        pg.wait_for_selector("#review li .open")
        pg.locator(f"tr.asset[data-id={figure}]").click(); pg.fill("#rv-text", "no cape"); pg.click("#rv-add"); pg.wait_for_selector("#review li .open")
        pg.locator("#rv-check").check(); pg.wait_for_selector(f"tr.asset[data-id={figure}] .checked")
        report("checked: the tick clears the badge", pg.locator(f"tr.asset[data-id={figure}] .unchecked").count() == 0
            and pg.locator(f"tr.asset[data-id={land}] .unchecked").count() == 1, pg.inner_text(f"tr.asset[data-id={figure}] .checked"))
        ctx = br.new_context(); fresh = ctx.new_page()   # a fresh browser: no cache, no storage
        fresh.goto(lab + f"#{land}"); fresh.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
        report("a comment survives a fresh browser", "the flag can go" in fresh.inner_text("#review")
            and fresh.locator(f"tr.asset[data-id={figure}] .checked").count() == 1, fresh.inner_text(f"tr.asset[data-id={land}] .mark").strip())
        report("Send says how many comments are open", fresh.inner_text("#send") == "Send the 2 open comments to an agent", fresh.inner_text("#send"))
        fresh.click("#send"); fresh.wait_for_selector("#sent .ok, #sent .bad")
        sent = [json.loads(l) for l in open(dry)] if _os.path.exists(dry) else []
        argv = sent[0]["argv"] if sent else []
        det = argv[argv.index("--detail") + 1] if "--detail" in argv else ""
        report("Send: ONE ticket on the episode's tag, every open comment, file:line, the lab link", len(sent) == 1 and argv[:2] == ["atelier", "add"]
            and argv[argv.index("--tags") + 1] == ep and "the flag can go" in det and "no cape" in det
            and re.search(rf"{ep}/js/print-assets.js:\d+", det) and f"lab/print/?ep={ep}#{land}" in det, fresh.inner_text("#sent"))
        fresh.reload(); fresh.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
        rv = json.load(open(_os.path.join(tmp, f"{ep}.json")))
        report("sent comments are marked with the ticket, none left to send", all(c["sent"] == sent[0]["ref"] for e in rv["assets"].values() for c in e["comments"])
            and fresh.locator("#send").is_disabled() and "sent in" in fresh.inner_text("#review"), fresh.inner_text("#send"))
        fresh.locator(f"tr.asset[data-id={figure}]").click(); fresh.locator("#rv-check").uncheck(); fresh.wait_for_selector(f"tr.asset[data-id={figure}] .unchecked")
        report("unticking brings the badge back", True)
        pg.reload(); pg.wait_for_function("window.printLab && window.printLab.ready", timeout=120000)
        pg.locator(f"tr.asset[data-id={land}]").click(); pg.wait_for_timeout(600); pg.screenshot(path=f"out/print_lab-{ep}-review.png")
        ctx.close()
    report("no page errors", not errs, "; ".join(errs)[:200])
    br.close()
print("all ok" if not bad else f"FAIL: {len(bad)}")
sys.exit(1 if bad else 0)
