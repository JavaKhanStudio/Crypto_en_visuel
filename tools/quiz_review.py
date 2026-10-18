#!/usr/bin/env python3
"""An episode's built-in quiz (<slug>/js/quiz-data.js) through Simon's review page, and back (d2, r48).

    tools/quiz_review.py export deux-generaux    # -> review/data/demo3d-deux-generaux.json, every question pending
    tools/quiz_review.py import deux-generaux    # the reviewed file -> <slug>/js/quiz-data.js

The review page reads French only: each question carries its English under "en", untouched by the
page. export refuses to overwrite a file that has been reviewed (a statut other than pending).
import keeps the accepted questions (the French as Simon left it), drops the rejected ones, refuses
while any is pending or rework, and names each question whose French changed: its English must
then be rewritten by hand (the TRAP: a key missing from en shows French).
The page: http://localhost:8770/quiz/demo3d-<slug>/ (atelier), or review/server.py at /revue?q=<slug>.
"""
import json, os, subprocess, sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.environ.get("REVIEW_DATA") or os.path.expanduser("~/Documents/Claude_GDrive_HQ/review/data")


def load_js(slug):
    path = os.path.join(REPO, slug, "js", "quiz-data.js")
    out = subprocess.run(["node", "--input-type=module", "-e",
                          f"import {{ QUIZ }} from {json.dumps('file://' + path)}; console.log(JSON.stringify(QUIZ))"],
                         check=True, capture_output=True, text=True).stdout
    return path, json.loads(out)


def export(slug):
    _, quiz = load_js(slug)
    dest = os.path.join(DATA, f"demo3d-{slug}.json")
    if os.path.exists(dest):
        old = json.load(open(dest))
        if any(q.get("statut", "pending") != "pending" for q in old["questions"]):
            sys.exit(f"{dest} has been reviewed already: import it, do not overwrite it")
    doc = {
        "quiz": f"Crypto en visuel - quiz intégré de l'épisode « {slug} »",
        "deck": "Crypto en visuel (démo 3D, dépôt deux-generaux)",
        "scope": f"Les {len(quiz)} questions du mode Quiz de https://javakhanstudio.github.io/Crypto_en_visuel/{slug}/#quiz "
                 f"({slug}/js/quiz-data.js). Elles vivent dans la page : pas de Form. Le français seul est relu ici ; "
                 "l'anglais suit (champ « en »), réécrit après la revue pour toute question modifiée.",
        "requests": "",
        "questions": [{
            "id": f"q{i + 1}", "statut": "pending", "section": slug, "source": f"{slug}/js/quiz-data.js", "note": "",
            "question": q["fr"]["q"], "options": q["fr"]["o"], "correct": q["correct"],
            "feedback_ok": q["fr"]["ok"], "feedback_ko": q["fr"]["ko"], "en": q["en"],
        } for i, q in enumerate(quiz)],
    }
    json.dump(doc, open(dest, "w"), ensure_ascii=False, indent=1)
    print(f"{dest}: {len(quiz)} questions, pending")


def js_str(s):
    return json.dumps(s, ensure_ascii=False)


def import_(slug):
    path, quiz = load_js(slug)
    doc = json.load(open(os.path.join(DATA, f"demo3d-{slug}.json")))
    open_ = [q["id"] for q in doc["questions"] if q.get("statut", "pending") in ("pending", "rework")]
    if open_:
        sys.exit(f"still to review: {', '.join(open_)}")
    kept, stale = [], []
    for q in doc["questions"]:
        if q["statut"] != "accepted":
            continue
        fr = {"q": q["question"], "o": q["options"], "ok": q["feedback_ok"], "ko": q["feedback_ko"]}
        before = next((x for x in quiz if x["en"] == q["en"]), None)
        if not before or before["fr"] != fr or before["correct"] != q["correct"]:
            stale.append(q["id"])
        kept.append({"correct": q["correct"], "fr": fr, "en": q["en"]})
    src = open(path).read()
    head = src[:src.index("export const QUIZ")]
    body = "export const QUIZ = [\n" + "".join(
        "  {\n    correct: " + json.dumps(k["correct"]) + ",\n" + "".join(
            f"    {lang}: {{\n" + "".join(f"      {f}: {js_str(k[lang][f])},\n" for f in ("q", "o", "ok", "ko")) + "    },\n"
            for lang in ("fr", "en")) + "  },\n" for k in kept) + "];\n"
    open(path, "w").write(head + body)
    print(f"{path}: {len(kept)} questions kept")
    if stale:
        print("French changed, rewrite the English of:", *stale)


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in ("export", "import"):
        sys.exit(__doc__)
    (export if sys.argv[1] == "export" else import_)(sys.argv[2])
