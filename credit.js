// The credit stamp (r185): Simon's logo and Atelier's, with « Fait par SimonBedardProg, avec Atelier ».
// One line in a page loads it: <script type="module" src="../credit.js"></script> in an episode,
// src="credit.js" on the home. It brings its own style and follows the page's language (<html lang>).
// Simon (21 Oct): both logos AND the words, everywhere, and a link to simonbedardprog.com/ficelle.
// Episode, wide screen (over 1240px, room beside the step panel): a stamp in the bottom-left corner.
// Narrower, or in the quiz (a modal over everything): it moves into the foot of the panel on show,
// #story, #sandbox or #quiz, so it is never hidden behind one nor gone with one. Home: in <footer>.
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
.credit.foot { justify-content: center; margin-top: 8px; font-size: 10px; }
.credit.foot img { height: 22px; width: 22px; }
.credit.foot .atelier { border-radius: 5px; }
footer .credit { justify-content: center; margin: 10px 0 0; font-size: 12px; }
footer .credit img { height: 32px; width: 32px; }
`;

const el = document.createElement('a');
el.className = 'credit'; el.id = 'credit'; el.href = HREF; el.target = '_blank'; el.rel = 'noopener';
el.innerHTML = `<img class="simon" alt="SimonBedardProg" src="${base}assets/credit/simon.png">`
  + `<img class="atelier" alt="Atelier" src="${base}assets/credit/atelier.svg">`
  + '<span class="words"><span class="by"></span> <b>SimonBedardProg</b><br><span class="with"></span> <b>Atelier</b></span>';

function text() {
  const [by, w] = words[document.documentElement.lang === 'en' ? 'en' : 'fr'];
  el.querySelector('.by').textContent = by;
  el.querySelector('.with').textContent = w;
  el.title = `${by} SimonBedardProg, ${w} Atelier`;
}

// where it sits: the home's footer; else the quiz when it is open; else, narrow, the panel on show; else the corner
const footer = document.querySelector('body > footer');
const panels = ['story', 'sandbox', 'quiz'].map(id => document.getElementById(id)).filter(Boolean);
const narrow = matchMedia('(max-width: 1240px)');
const shown = id => panels.find(p => p.id === id && !p.classList.contains('hidden'));
function place() {
  if (footer) { if (el.parentNode !== footer) footer.append(el); return; }
  const host = shown('quiz') || (narrow.matches && panels.find(p => p.id !== 'quiz' && !p.classList.contains('hidden'))) || null;
  el.classList.toggle('foot', !!host);
  el.classList.toggle('corner', !host);
  const parent = host?.id === 'quiz' ? host.querySelector('.card') || host : host || document.body;   // the quiz: inside its card
  if (el.parentNode !== parent) parent.append(el);
}

const style = document.createElement('style');
style.textContent = css;
document.head.append(style);
text(); place();
new MutationObserver(text).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
narrow.addEventListener('change', place);
// a mode switch hides and shows the panels (class hidden): follow it
for (const p of panels) new MutationObserver(place).observe(p, { attributes: true, attributeFilter: ['class'] });
