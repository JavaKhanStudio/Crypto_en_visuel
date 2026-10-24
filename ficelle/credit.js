// The credit stamp (r185): Simon's logo and Atelier's, with « Fait par SimonBedardProg, avec Atelier »,
// a link to simonbedardprog.com/ficelle. It brings its own style and follows the page's language (<html lang>).
// The home loads it with one line in its <footer> (src="credit.js"); an episode gets it through
// lib/episode.js (r340), a page that is neither keeps one line, src="../credit.js".
// Simon (22 Oct, r340): « In the scene selection it's fine to have the whole thing. Everywhere else, the
// simonbedardprog logo is enough. It should be subtle, but visible to anyone who is looking. »
// So: the home's <footer> has the whole stamp (both logos and the words). An episode has Simon's logo
// alone, small and dimmed, a badge on the lower corner of the episode's crest in the top bar's title chip:
// the same place at every size and in every mode, adding no height to any panel nor any size to the chip
// (on the series line it pushed « CRYPTO, VISUALIZED » past the chip at 360px; under the crest it made a
// one-line title's chip taller, and 1.2's card no longer opened above the panel); the words are its title.
// A page with no .brand .crest (none today) gets the same logo in the bottom-left corner.
const base = new URL('.', import.meta.url).href, HREF = 'https://simonbedardprog.com/ficelle';
const words = {
  fr: ['Fait par', 'avec'],
  en: ['Made by', 'with'],
};

const css = `
.credit { display: flex; align-items: center; gap: 8px; font: 11px/1.25 system-ui, sans-serif;
  color: rgba(235, 238, 248, .62); text-decoration: none; pointer-events: auto; }
.credit img { height: 26px; width: 26px; display: block; }
.credit .simon { border-radius: 50%; background: #f3f1ea; padding: 2px; box-sizing: border-box; object-fit: contain; }
.credit .atelier { border-radius: 7px; }
.credit b { font-weight: 600; color: rgba(245, 247, 255, .85); }
.credit.corner { position: fixed; left: 12px; bottom: 12px; z-index: 5; padding: 5px 9px 5px 5px;
  border-radius: 10px; background: rgba(12, 16, 30, .55); backdrop-filter: blur(4px); }
a.credit:hover b, a.credit:focus-visible b { color: #fff; text-decoration: underline; }
footer .credit { justify-content: center; margin: 10px 0 0; font-size: 12px; }
footer .credit img { height: 32px; width: 32px; }
.crest-col { position: relative; display: inline-block; }
.crest-col .credit.mark { position: absolute; left: -9px; bottom: -3px; }
.credit.mark { gap: 0; opacity: .5; transition: opacity .2s; }
.credit.mark:hover, .credit.mark:focus-visible { opacity: 1; }
.credit.mark .simon { height: 15px; width: 15px; padding: 1px; }
.credit.mark.corner { padding: 0; background: none; backdrop-filter: none; }
.credit.mark.corner .simon { height: 22px; width: 22px; }
`;

const footer = document.querySelector('body > footer');   // the home (scene selection): the whole stamp
const el = document.createElement('a');
el.className = footer ? 'credit' : 'credit mark'; el.id = 'credit'; el.href = HREF; el.target = '_blank'; el.rel = 'noopener';
el.innerHTML = `<img class="simon" alt="SimonBedardProg" src="${base}assets/credit/simon.png">`
  + (footer ? `<img class="atelier" alt="Atelier" src="${base}assets/credit/atelier.svg">`
    + '<span class="words"><span class="by"></span> <b>SimonBedardProg</b><br><span class="with"></span> <b>Atelier</b></span>' : '');

function text() {
  const [by, w] = words[document.documentElement.lang === 'en' ? 'en' : 'fr'];
  if (footer) { el.querySelector('.by').textContent = by; el.querySelector('.with').textContent = w; }
  el.title = `${by} SimonBedardProg, ${w} Atelier`;
  el.setAttribute('aria-label', el.title);
}

// where it sits: the home's footer; in an episode, under the crest of the top bar's title chip
function place() {
  if (footer) { footer.append(el); return; }
  const crest = document.querySelector('.brand .crest');
  if (!crest) { el.classList.add('corner'); document.body.append(el); return; }
  const col = document.createElement('span');
  col.className = 'crest-col';
  crest.replaceWith(col); col.append(crest, el);
}

const style = document.createElement('style');
style.textContent = css;
document.head.append(style);
text(); place();
new MutationObserver(text).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
