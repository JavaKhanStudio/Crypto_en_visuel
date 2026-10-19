// The step text's small markup (r174): a blank line starts a paragraph, a run of lines that start
// with "- " is a bulleted list, **x** is bold, and {g|x} {r|x} {b|x} colour a word like the scene
// does: gold for what wins, red for what does not fit (the gravel, the coincidences), blue for
// the other candidates. Built as DOM nodes, never as HTML.
const INLINE = /\*\*(.+?)\*\*|\{([grb])\|(.+?)\}/g;

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

export function render(el, src) {
  el.replaceChildren();
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
