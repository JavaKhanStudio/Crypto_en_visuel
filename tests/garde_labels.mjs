// r189: every story step with an animation (go/go2) has its button label in fr AND en; a missing
// one draws an empty button (raw() gives undefined) or, for en, silently the French text.
// node tests/garde_labels.mjs
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../garde/js/story.js', import.meta.url), 'utf8');
const ids = [...src.matchAll(/\{ id: '(s\d+)'[^\n]*?\b(go2?):/g)].map(m => m[1]);
const i18n = readFileSync(new URL('../garde/js/i18n.js', import.meta.url), 'utf8');
const [fr, en] = i18n.split(/\nconst en = \{/);
let bad = 0;
for (const id of ids) for (const [name, d] of [['fr', fr], ['en', en]]) {
  const m = d.match(new RegExp(`\\b${id}: \\{([\\s\\S]*?)\\n    s\\d+: \\{|\\b${id}: \\{([\\s\\S]*?)\\n  \\}`));
  const body = m && (m[1] ?? m[2]);
  const ok = body && /\bgo: '/.test(body);
  if (!ok) bad++;
  console.log(ok ? 'ok  ' : 'FAIL', id, name, 'go label');
}
console.log(bad ? `${bad} failed` : 'all ok'); process.exit(bad ? 1 : 0);
