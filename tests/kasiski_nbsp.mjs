// r178: the step panel never wraps a unit, an '= 5 × 6' or a French : ; ? ! » alone onto a line.
// lib/md.js tie() puts the non-breaking spaces in when rendering; this holds every step text, fr and en,
// to it: after tie(), no ordinary space is left where a line must not break.
//     node tests/kasiski_nbsp.mjs
globalThis.location = { search: '' };
globalThis.localStorage = { getItem: () => null, setItem() {} };
const { DICTS } = await import('../kasiski/js/i18n.js');
const { tie } = await import('../ficelle/lib/md.js');
const BAD = [
  [/\d\}? (?:\{[grb]\|)?(?:k?m|cm|lettres?|letters?)\b/, 'a number apart from its unit'],
  [/ [=×+] |[=×+] \d/, 'a split « a = b × c »'],
  [/ [:;?!»]|« /, 'a French : ; ? ! » apart from its word'],
];
let bad = 0, tied = 0;
for (const lang of ['fr', 'en']) for (const [id, s] of Object.entries(DICTS[lang].steps)) {
  const t = tie(s.p); tied += (t.match(/ /g) || []).length;
  for (const [re, what] of BAD) { const m = t.match(re); if (m) { bad++; console.log(`FAIL ${lang} ${id}: ${what}: «${m[0]}»`); } }
  if (t.replace(/ /g, ' ') !== s.p) { bad++; console.log(`FAIL ${lang} ${id}: tie() changed more than spaces`); }
}
console.log(bad ? `${bad} failed` : `all ok (${tied} non-breaking spaces)`);
process.exit(bad ? 1 : 0);
