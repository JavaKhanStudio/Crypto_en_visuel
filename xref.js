// Cross-references between episodes (r119): « l'épisode 1.4 », « episode 6 » in a step's text or in the
// corner card becomes a link to the step that explains it. A story step names the step it means in each
// episode it cites (refs: { '1.4': 9 }); otherwise the cited episode's default step below. Shared by the
// episodes, imported as '../../xref.js' from their js/; tests/xref_links.py walks every link.
export const EPISODES = {
  '1.1': ['deux-generaux', 4],    // Eve's searchlight catches the messenger
  '1.2': ['eve-lit-tout', 7],     // AES-256-CBC: the CBC chain
  '1.3': ['octet-change', 6],     // the seal, HMAC-SHA256
  '1.4': ['cle-vallee', 4],       // Bob's padlock: how keys reach Bob without Eve reading them
  '1.5': ['paquet-complet', 1],   // the whole packet
  '1.6': ['encore-des-tours', 1], // Eve has more tricks
  '1.7': ['a-toi-de-jouer', 1],   // your move: the recap
  '2': ['cadenas', 1], '3': ['diffie-hellman', 1], '4': ['scytale', 1], '5': ['enigma', 1],
  '5.1': ['enigma', 1], '5.2': ['enigma-reglage', 1], '5.3': ['enigma-casse', 1],
  '6': ['pingouin', 5],           // the penguin: ECB lets the picture show
  '7': ['sel', 1],
  '8': ['garde', 4],              // the guard in a hurry, timed
  '9': ['kasiski', 1],
  '10': ['vpn', 1],
  '11': ['aes-interieur', 1],
};
const RX = /([ÉéEe]pisode) (\d+(?:\.\d+)?)(?![\d])/g;

export function href(n, lang, refs = {}) {
  const [slug, step] = EPISODES[n];
  return `../${slug}/?lang=${lang}#story=${refs[n] ?? step}`;
}

let styled = false;
// wrap every episode mention under el (text outside links) in a link; refs: the step meant, per episode
export function linkify(el, lang, refs = {}) {
  if (!styled) {
    styled = true;
    document.head.insertAdjacentHTML('beforeend', '<style>a.xref { color: #ffd27a; text-decoration: underline dotted; text-underline-offset: 3px; } a.xref:hover { text-decoration-style: solid; }</style>');
  }
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: t => t.parentElement.closest('a') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; while (walk.nextNode()) nodes.push(walk.currentNode);
  for (const t of nodes) {
    const s = t.nodeValue; RX.lastIndex = 0;
    if (!RX.test(s)) continue;
    const frag = document.createDocumentFragment(); let at = 0; RX.lastIndex = 0;
    for (const m of s.matchAll(RX)) {
      if (!EPISODES[m[2]]) continue;
      frag.append(s.slice(at, m.index));
      const a = document.createElement('a'); a.className = 'xref'; a.textContent = m[0];
      a.href = href(m[2], lang, refs); a.dataset.ep = m[2];
      frag.append(a); at = m.index + m[0].length;
    }
    frag.append(s.slice(at)); t.replaceWith(frag);
  }
}
