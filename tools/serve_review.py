#!/usr/bin/env python3
"""r452: the board's site viewer (Atelier's Labs, http://127.0.0.1:8794/): the repo served as static files,
like python3 -m http.server, plus the print lab's review (Simon's pick A on r452):

    GET  /review/api/ping                     {"ok": true}: lab/print/ runs only where this answers
    GET  /review/api/<ep>                     lab/print/review/<ep>.json (comments and checked ticks), {} when none
    POST /review/api/<ep>/comment   {asset, text}        a comment on an asset
    POST /review/api/<ep>/checked   {asset, on}          Simon's tick: today's date, or none
    POST /review/api/<ep>/send      {}                   ONE ticket on the episode's tag with every open comment
                                                         (atelier add on this machine); those comments are marked sent

Bound to 127.0.0.1 only: nobody else reaches it. The review file is written in the working tree; the
session that takes the sent ticket commits it with its work.

    python3 tools/serve_review.py [port] [--review-dir DIR] [--dry-send FILE]

--review-dir writes the review elsewhere (a test's temp dir); --dry-send appends each ticket it would
add to FILE (JSON lines) instead of running atelier add. From Python: serve(port=0, ...) -> (base url, server).
"""
import json, os, re, subprocess, sys, threading, datetime
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUG = re.compile(r"^[a-z0-9-]+$")
lock = threading.Lock()


def where(ep, cfg):
    return os.path.join(cfg["review_dir"], f"{ep}.json")


def load(ep, cfg):
    try:
        with open(where(ep, cfg)) as f: return json.load(f)
    except FileNotFoundError: return {"assets": {}}


def save(ep, cfg, data):
    os.makedirs(cfg["review_dir"], exist_ok=True)
    tmp = where(ep, cfg) + ".tmp"
    with open(tmp, "w") as f: json.dump(data, f, indent=1, ensure_ascii=False); f.write("\n")
    os.replace(tmp, where(ep, cfg))


def entry_line(ep, asset):   # file:line of the asset's entry in <ep>/js/print-assets.js
    path = os.path.join(ROOT, ep, "js", "print-assets.js")
    try:
        for n, line in enumerate(open(path), 1):
            if re.search(r"id:\s*'" + re.escape(asset) + "'", line): return f"{ep}/js/print-assets.js:{n}"
    except FileNotFoundError: pass
    return f"{ep}/js/print-assets.js"


def send(ep, cfg, data):
    open_ = [(a, c) for a, e in data["assets"].items() for c in e.get("comments", []) if not c.get("sent")]
    if not open_: return None, "no open comment"
    assets = sorted({a for a, _ in open_})
    lines = [f"WANTED: Simon's comments from the print lab (lab/print/?ep={ep}), one per line, on {len(assets)} asset(s). "
             "Apply each to the asset's print list entry (strip, scale, bodies, size: the LIST SHAPE in the #demo3d pack), "
             "or ask when a comment is a taste call.", ""]
    for a in assets:
        lines.append(f"{a}  ({entry_line(ep, a)}; lab/print/?ep={ep}#{a})")
        lines += [f"  - {c['text']}  ({c['at']})" for x, c in open_ if x == a]
        lines.append("")
    lines += [f"DONE WHEN: python3 tests/print_lab.py <base> {ep} says all ok; tools/print_shot.py before/after of each asset attached; "
              "each comment answered in the done note.",
              "OUT of scope: the 'checked' tick (only Simon sets it, in the lab); other assets.",
              f"The comments live in lab/print/review/{ep}.json (marked sent with this ticket's ref): commit that file with your work.",
              "Discovered while: Simon's review in lab/print/ (r452's Send button)."]
    title = f"Print {ep}: Simon's lab comments on " + ", ".join(assets)
    argv = ["atelier", "add", title[:160], "--project", "deux-generaux", "--tags", ep, "--detail", "\n".join(lines)]
    if cfg["dry_send"]:
        ref = f"dry{sum(1 for _ in open(cfg['dry_send'])) + 1 if os.path.exists(cfg['dry_send']) else 1}"
        with open(cfg["dry_send"], "a") as f: f.write(json.dumps({"ref": ref, "argv": argv}) + "\n")
    else:
        out = subprocess.run(argv, cwd=ROOT, capture_output=True, text=True)
        m = re.search(r"\b(r\d+)\b", out.stdout)
        if out.returncode or not m: return None, (out.stderr or out.stdout)[-300:]
        ref = m.group(1)
    for _, c in open_: c["sent"] = ref
    return ref, None


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, cfg=None, **k):
        self.cfg = cfg; super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        if self.cfg["verbose"]: super().log_message(*a)

    def reply(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b)))
        self.send_header("Cache-Control", "no-store"); self.end_headers(); self.wfile.write(b)

    def route(self):
        m = re.match(r"^/review/api/([^/?]+)(?:/(comment|checked|send))?/?(?:\?.*)?$", self.path)
        if not m: return None
        ep, verb = m.group(1), m.group(2)
        return (ep, verb) if ep == "ping" or SLUG.match(ep) else ("", "bad")

    def do_GET(self):
        r = self.route()
        if not r: return super().do_GET()
        ep, verb = r
        if ep == "ping": return self.reply(200, {"ok": True})
        if verb: return self.reply(405, {"error": "POST that"})
        if not ep: return self.reply(400, {"error": "bad episode"})
        with lock: return self.reply(200, load(ep, self.cfg))

    def do_POST(self):
        r = self.route()
        if not r or not r[1] or not r[0]: return self.reply(404, {"error": "no such review call"})
        ep, verb = r
        if not os.path.exists(os.path.join(ROOT, ep, "js", "print-assets.js")): return self.reply(404, {"error": f"{ep} has no print list"})
        try: body = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
        except ValueError: return self.reply(400, {"error": "not JSON"})
        with lock:
            data = load(ep, self.cfg); assets = data.setdefault("assets", {})
            if verb == "send":
                ref, err = send(ep, self.cfg, data)
                if err: return self.reply(400 if err == "no open comment" else 500, {"error": err})
                save(ep, self.cfg, data); return self.reply(200, {"ref": ref, "review": data})
            a = str(body.get("asset", ""))
            if not re.match(r"^[\w-]+$", a): return self.reply(400, {"error": "bad asset"})
            e = assets.setdefault(a, {"checked": None, "comments": []})
            if verb == "comment":
                t = str(body.get("text", "")).strip()
                if not t: return self.reply(400, {"error": "empty comment"})
                e["comments"].append({"text": t[:2000], "at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"), "sent": None})
            else:
                e["checked"] = datetime.date.today().isoformat() if body.get("on") else None
            save(ep, self.cfg, data); return self.reply(200, data)


def serve(port=0, review_dir=None, dry_send=None, verbose=False):
    cfg = {"review_dir": review_dir or os.path.join(ROOT, "lab", "print", "review"), "dry_send": dry_send, "verbose": verbose}
    srv = ThreadingHTTPServer(("127.0.0.1", port), partial(Handler, cfg=cfg))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{srv.server_address[1]}/", srv


if __name__ == "__main__":
    args = sys.argv[1:]; opt = lambda n: args[args.index(n) + 1] if n in args else None
    port = int(next((a for a in args if a.isdigit()), 8794))
    url, srv = serve(port, opt("--review-dir"), opt("--dry-send"), verbose=True)
    print(f"serving {ROOT} at {url} (review in {srv.RequestHandlerClass.keywords['cfg']['review_dir']})", flush=True)
    try: threading.Event().wait()
    except KeyboardInterrupt: srv.shutdown()
