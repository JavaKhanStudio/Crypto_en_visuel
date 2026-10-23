// r368, Simon's pick A, once for every episode since r500: in a room on a phone the step's text shows
// its first 3 lines (lib/episode.css #story.roomy), so the room keeps the screen; « Lire la suite ▾ »
// (#step-more) shows only when that cuts the text, and opens it. The words are the episode's own
// i18n keys nav.more and nav.less.
//
//   import { roomFold } from '../../lib/fold.js';
//   this.fold = roomFold(this.el.panel, this.el.text, this.el.more, t);   // in the constructor
//   this.fold(!!step.inside, !langOnly);                                  // in render()
export function roomFold(panel, text, more, t) {
  const fit = () => {
    if (!panel.classList.contains('open')) panel.classList.toggle('long', text.scrollHeight > text.clientHeight + 2);
    more.textContent = t(panel.classList.contains('open') ? 'nav.less' : 'nav.more');
  };
  more.onclick = () => { panel.classList.toggle('open'); fit(); };
  addEventListener('resize', fit);
  // roomy: the step is in a room; fold: a new step, folded again (a language switch keeps it open)
  return (roomy, fold = true) => {
    if (fold) panel.classList.remove('open');
    panel.classList.toggle('roomy', roomy); fit();
  };
}
