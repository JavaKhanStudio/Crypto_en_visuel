// r322: the last step's doors out (r105/r133), one for every episode: sandbox, quiz, home, then the
// next episode last at the right in gold, a picture each. Was 10 copies of the same loop in
// <ep>/js/story.js and of the .door rules in <ep>/css/style.css. An episode keeps only its data,
// a doors: [...] list on its last step, and calls in its render():
//     import { renderDoors } from '../../lib/doors.js';
//     renderDoors(this.el.actions, step.doors, s.doors, { lang, setMode: m => this.ctx.setMode(m) });
// A door is { k, img, en?, clip?, go? | href, hash? }: k names its words in the episode's i18n
// (steps.<last>.doors[k] = [name, what]), en a picture for ?lang=en, clip its hover clip, go(x) what
// it does in the page (x.mode(m)), href where it leads (?lang= added, then hash).
// The styles are this file's too (the lib/quality.js pattern), last in <head> so they win.

// A phone (under 720px) shows the doors 2 by 2 with their line; { phone: 'row' } keeps them four
// side by side, a picture and a name each (r132: where a 2 by 2 grid pushes the panel over the scene).
// A short phone (under 720px wide and 700px high, r568) always gets the row: 2 by 2, they scrolled inside the panel
// (.doors.doors: it must outweigh the 2 by 2 rule's :not(.doors-row)).
const ROW = d => `.actions${d} { grid-template-columns: repeat(4, 1fr); gap: 5px; } ${d} .door { padding: 4px; border-radius: 9px; font-size: 12px; }
  ${d} .door b { font-size: 11px; line-height: 1.2; } ${d} .door > span:not(.pic) { display: none; } ${d} .door .pic { margin-bottom: 2px; }
  ${d} .door img, ${d} .door video { border-radius: 6px; }`;
const CSS = `
.actions.doors { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.door { display: grid; gap: 2px; align-content: start; padding: 6px; border-radius: 12px; font-size: 12px; line-height: 1.3;
  background: rgba(255,255,255,.04); border: 1px solid var(--edge); color: #e6dfcf; text-decoration: none; }
.door .pic { position: relative; display: block; margin-bottom: 4px; }
.door img, .door video { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 8px; }
.door video { position: absolute; inset: 0; opacity: 0; } .door video.on { opacity: 1; }
.door b { font-size: 13.5px; color: var(--ink); } .door:hover { border-color: rgba(255,255,255,.35); }
.door.next { background: rgba(255,194,77,.12); border: 2px solid var(--b); } .door.next b { color: var(--b); }
@media (max-width: 720px) {
  .actions.doors:not(.doors-row) { grid-template-columns: 1fr 1fr; gap: 6px; }
  .doors:not(.doors-row) .door { font-size: 11px; padding: 5px; } .doors:not(.doors-row) .door b { font-size: 12.5px; }
  ${ROW('.doors-row')} }
@media (max-width: 720px) and (max-height: 700px) { ${ROW('.doors.doors')} }`;

if (!document.getElementById('doors-style')) {
  const style = document.createElement('style');
  style.id = 'doors-style'; style.textContent = CSS; document.head.append(style);
}

// fills el (the step's .actions, emptied by the caller) with the doors; no doors: el loses its classes
export function renderDoors(el, doors, words, { lang, setMode, phone = 'grid' }) {
  el.classList.toggle('doors', !!doors);
  el.classList.toggle('doors-row', !!doors && phone === 'row');
  for (const d of doors || []) {
    const [name, what] = words[d.k], a = document.createElement('a');
    a.className = 'door' + (d.k === 'next' ? ' next' : '');
    a.innerHTML = `<span class="pic"><img src="${lang === 'en' && d.en || d.img}" alt=""></span><b>${name}</b><span>${what}</span>`;
    // r105 (Simon): on hover, a 4 s clip of where the door leads loops; it stops where it is when the
    // pointer leaves and goes on from there. A phone has no hover: it keeps the picture.
    if (d.clip && matchMedia('(hover: hover)').matches) {
      const v = document.createElement('video');
      Object.assign(v, { src: d.clip, muted: true, loop: true, playsInline: true, preload: 'none' });
      v.addEventListener('playing', () => v.classList.add('on'), { once: true });
      a.firstChild.appendChild(v);
      a.onmouseenter = () => v.play().catch(() => {}); a.onmouseleave = () => v.pause();
    }
    if (d.href) a.href = d.href + '?lang=' + lang + (d.hash || '');
    else { a.href = '#'; a.onclick = e => { e.preventDefault(); d.go({ mode: setMode }); }; }
    el.appendChild(a);
  }
}
