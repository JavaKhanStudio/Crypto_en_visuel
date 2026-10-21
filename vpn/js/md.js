// The step text's small markup (r174): a blank line starts a paragraph, a run of lines that start
// with "- " is a bulleted list, **x** is bold, and {g|x} {r|x} {b|x} colour a word like the scene
// does: gold for what wins, red for what does not fit (the gravel, the coincidences), blue for
// the other candidates. {@3|a name} is a link to episode 3 under that name (r360): an a.xref whose
// href story.js sets from ../../xref.js. Built as DOM nodes, never as HTML.
const INLINE = /\*\*(.+?)\*\*|\{([grb])\|(.+?)\}|\{@([\d.]+)\|(.+?)\}/g;

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
const bare = (_, b, _t, c, _n, name) => b || c || name;
export const plain = src => src.replace(INLINE, bare).replace(INLINE, bare).replace(/^\s*- /gm, '').replace(/\s*\n\s*/g, ' ');
