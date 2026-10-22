// The step text's small markup (r174), one module for every episode (r321; was 9 copies in
// <ep>/js/md.js): a blank line starts a paragraph, a run of lines that start with "- " is a
// bulleted list, **x** is bold, {k|x} colours a word as class tone-k, and {@N|a name} is a link to
// episode N under that name (r360): an a.xref whose href the episode's story.js sets from
// ../../xref.js. The keys are the union of the episodes': g r b (most), 1 to 4 (scytale's card
// lines); what each colour means is the episode's to say, in its own pack and css. Built as DOM
// nodes, never as HTML.
const INLINE = /\*\*(.+?)\*\*|\{([grb1-4])\|(.+?)\}|\{@([\d.]+)\|(.+?)\}/g;

function inline(parent, text) {
  let at = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > at) parent.append(text.slice(at, m.index));
    if (m[4]) {
      const a = document.createElement('a'); a.className = 'xref'; a.dataset.ep = m[4]; a.textContent = m[5];
      parent.append(a); at = m.index + m[0].length; continue;
    }
    const el = document.createElement(m[1] ? 'strong' : 'span');
    if (!m[1]) el.className = 'tone-' + m[2];
    if (m[1]) inline(el, m[1]); else el.textContent = m[3];   // a bold run may hold a coloured word
    parent.append(el); at = m.index + m[0].length;
  }
  if (at < text.length) parent.append(text.slice(at));
}

// non-breaking spaces (r178): a number keeps its unit (2 m, 5 lettres, 16 octets), « 30 = 5 × 6 » stays whole,
// and a French : ; ? ! » (and the space after «) never starts or ends a line alone; a letter keeps
// its « (ligne N) » / '(line N)' label on its line, and the label stays whole (r314); a French number's
// groups of three stay together (r400: « 158 962 555 … » broke across lines on a phone). Applied when
// rendering, so the source and plain() keep ordinary spaces for the values test.
export const tie = src => src
  .replace(/(\}|\b\w) (?=\((?:ligne|line) \d\))/g, '$1\u00a0').replace(/\((ligne|line) (\d)\)/g, '($1\u00a0$2)')
  .replace(/(\d\}?) (?=(?:\{[grb1-4]\|)?(?:k?m|cm|lettres?|letters?|octets?|bytes?|pixels?|bits?|R\d+)\b)/g, '$1\u00a0')
  .replace(/(\d) (?=\d{3}(?!\d))/g, '$1\u00a0')
  .replace(/ ([=×+]) /g, '\u00a0$1\u00a0')
  .replace(/ ([:;?!»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');

export function render(el, src) {
  el.replaceChildren(); src = tie(src);
  for (const block of src.split(/\n\s*\n/)) {
    // within a block, a run of "- " lines is a list; the lines around it are paragraphs
    let p = null, ul = null;
    for (const l of block.split('\n').map(l => l.trim()).filter(Boolean)) {
      if (l.startsWith('- ')) {
        p = null; if (!ul) el.append(ul = document.createElement('ul'));
        const li = document.createElement('li'); inline(li, l.slice(2)); ul.append(li);
      } else {
        ul = null; if (!p) el.append(p = document.createElement('p')); else p.append(' ');
        inline(p, l);
      }
    }
  }
}

// the same text without its markup: what the tests read
const bare = (_, b, _t, c, _n, name) => b || c || name;
export const plain = src => src.replace(INLINE, bare).replace(INLINE, bare).replace(/^\s*- /gm, '').replace(/\s*\n\s*/g, ' ');
