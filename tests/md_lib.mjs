// r321: lib/md.js is the one step-text markup of every episode; it replaced 9 copies of js/md.js
// (scytale's {1|x}..{4|x} tones and (ligne N) ties, vpn's {@N|name} links, the rest kasiski's).
// Every string of each of those episodes' i18n.js (fr and en) is rendered by its old copy (read
// from git) and by lib/md.js on a small fake DOM: plain() and the trees must be the same, except
// that the lib may add non-breaking spaces (r178): its tie() holds the union of the units
// (pingouin's octets, bytes, pixels, bits now tie in aes-interieur and eve-lit-tout too), and vpn's
// copy had lost tie() altogether (made from kasiski's minutes before r178). Those are counted.
//     node tests/md_lib.mjs [rev]      rev: a commit that still holds the copies
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const EPS = ['aes-interieur', 'cadenas', 'diffie-hellman', 'enigma', 'eve-lit-tout', 'kasiski', 'pingouin', 'scytale', 'vpn'];
const git = c => execSync('git ' + c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
let rev = process.argv[2];
if (!rev) try { git('cat-file -e HEAD:kasiski/js/md.js'); rev = 'HEAD'; }
  catch { rev = git('log -1 --diff-filter=D --format=%H -- kasiski/js/md.js') + '^'; }

class El {   // just what md.js calls
  constructor(tag) { this.tag = tag; this.kids = []; this.className = ''; this.dataset = {}; }
  append(...k) { this.kids.push(...k); }
  replaceChildren() { this.kids = []; }
  set textContent(t) { this.kids = [t]; }
  toString() {
    const a = (this.className ? ` class=${this.className}` : '') + (this.dataset.ep ? ` ep=${this.dataset.ep}` : '');
    return `<${this.tag}${a}>${this.kids.map(String).join('')}</${this.tag}>`;
  }
}
globalThis.document = { createElement: t => new El(t) };
const load = src => import('data:text/javascript,' + encodeURIComponent(src));
const lib = await import('../lib/md.js');
const draw = (m, s) => { const el = new El('div'); m.render(el, s); return String(el); };
const NBSP = String.fromCharCode(160), sp = t => t.replaceAll(NBSP, ' ');

let bad = false, total = 0;
for (const ep of EPS) {
  const old = await load(git(`show ${rev}:${ep}/js/md.js`));
  const src = readFileSync(`${ep}/js/i18n.js`, 'utf8');
  const strs = [...src.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)].map(m => JSON.parse(`"${m[1]}"`));
  let tied = 0;
  for (const s of strs) {
    const want = draw(old, s), got = draw(lib, s);
    if (got !== want) tied++;
    if (sp(got) !== sp(want) || lib.plain(s) !== old.plain(s)) {
      bad = true; console.log(`DIFF ${ep}: ${JSON.stringify(s).slice(0, 120)}\n  was: ${want}\n  now: ${got}`);
    }
  }
  total += strs.length;
  console.log(`${ep}: ${strs.length} strings, ${tied} gain only non-breaking spaces${old.tie ? '' : ' (its copy had no tie())'}`);
}
console.log(`${total} strings over ${EPS.length} episodes, against ${rev}:`, bad ? 'FAIL' : 'all ok');
process.exit(bad ? 1 : 0);
