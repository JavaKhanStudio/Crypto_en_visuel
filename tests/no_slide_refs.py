"""No visible word refers to the slides or the course (r80, Simon: « anywhere, ever in this project »).

Scans every episode's js/i18n.js and js/quiz-data.js, skipping comment lines, for diapo / slide /
cours / course as whole words or stems (« courant », « en cours » as 'in progress' are allowed)."""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BAD = re.compile(r'diapo|slide|\bcourse\b|\bdu cours\b|\ble cours\b|dans le cours', re.I)
hits = []
for f in sorted(ROOT.glob('*/js/i18n.js')) + sorted(ROOT.glob('*/js/quiz-data.js')):
    for n, line in enumerate(f.read_text().splitlines(), 1):
        code = line.split('//')[0] if line.lstrip().startswith('//') else line
        if line.lstrip().startswith(('//', '*', '/*')):
            continue
        if BAD.search(code):
            hits.append(f'{f.relative_to(ROOT)}:{n}: {line.strip()[:120]}')
print('\n'.join(hits) or 'all ok')
sys.exit(1 if hits else 0)
