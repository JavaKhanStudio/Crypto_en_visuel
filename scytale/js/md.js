// The step text's small markup (r174, copied from kasiski for r238): a blank line starts a
// paragraph, a run of lines that start with "- " is a bulleted list, **x** is bold, and {1|x} to
// {4|x} colour letters like the card does: the colour of the line Alice wrote them on (card.js
// ROW_COLORS). Built as DOM nodes, never as HTML.
const INLINE = /\*\*(.+?)\*\*|\{([1-4])\|(.+?)\}/g;

function inline(parent, text) {
  let at = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > at) parent.append(text.slice(at, m.index));
    const el = document.createElement(m[1] ? 'strong' : 'span');
    if (!m[1]) el.className = 'tone-' + m[2];
    if (m[1]) inline(el, m[1]); else el.textContent = m[3];   // a bold run may hold a coloured word
    parent.append(el); at = m.index + m[0].length;
  }
  if (at < text.length) parent.append(text.slice(at));
}

// non-breaking spaces (r178): a number keeps its unit (2 m, 5 lettres), « 30 = 5 × 6 » stays whole,
// and a French : ; ? ! » (and the space after «) never starts or ends a line alone. Applied when
// rendering, so the source and plain() keep ordinary spaces for the values test. A letter keeps its
// « (ligne N) » / '(line N)' label on its line, and the label stays whole (r314).
export const tie = src => src
  .replace(/(\}|\b\w) (?=\((?:ligne|line) \d\))/g, '$1\u00a0').replace(/\((ligne|line) (\d)\)/g, '($1\u00a0$2)')
  .replace(/(\d\}?) (?=(?:\{[1-4]\|)?(?:k?m|cm|lettres?|letters?|R\d+)\b)/g, '$1\u00a0')
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
export const plain = src => src.replace(INLINE, (_, b, _t, c) => b || c).replace(INLINE, (_, b, _t, c) => b || c).replace(/^\s*- /gm, '').replace(/\s*\n\s*/g, ' ');
