"""No visible word refers to the slides or the course (r80, Simon: « anywhere, ever in this project »).

Scans every episode's js/i18n.js and js/quiz-data.js, skipping comment lines, for diapo / slide /
cours / course as whole words or stems (« courant », « en cours » as 'in progress' are allowed).
The English VERB « slide » is allowed (r376: « the second row slides one place »): only the noun is
caught, after the/this/that/a/on/in/… or before a number (« slide 12 »), and slideshow/slide deck."""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
NOUN = r'\b(?:the|this|these|those|a|an|each|every|our|your|next|previous|same|last|first|on|in|see)\s+slides?\b'
BAD = re.compile(r'diapo|' + NOUN + r'|\bslides?\s+\d|slide ?show|slide ?deck|\bcourse\b|\bdu cours\b|\ble cours\b|dans le cours', re.I)
# the check checks itself: these must be caught, and the verb must not
for t, bad in [('voir la diapositive', 1), ('as on the slide', 1), ('see slide 12', 1), ('on the slides', 1),
               ('the second row slides one place', 0), ('the rows slide left', 0), ('each byte slides by one', 0), ('the rows that slide left', 0)]:
    assert bool(BAD.search(t)) == bool(bad), f'self-test: {t!r}'

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
