// r646 (Simon: « something cute that could overlap … Not a whole ass page. Something simple, with all the settings,
// people can quickly access »): the series' settings as a little card that opens over the scene from the Éco / HD
// button of the top bar, in every episode at once (lib/quality.js mounts it). Each row writes the key the episodes
// already read, and takes effect at once: picture (dg-quality), frames when still (dg-still, lib/still.js), language
// (the episode's own #lang buttons, dg-lang), sound (the #sound button; never remembered, as before).
// PROTOTYPE: on only with ?settings=1 until Simon picks it; without it the button cycles the levels as before.
import { STILL_RATES, getStill, setStill } from './still.js';

export const wanted = () => new URLSearchParams(location.search).get('settings') === '1';

const WORDS = {
  fr: { title: 'Réglages', quality: 'Image', still: 'Au repos', lang: 'Langue', sound: 'Son',
    hint: { quality: 'Éco ménage la batterie, HD+ lisse tout', still: 'images par seconde quand rien ne bouge', sound: 'des petits sons à chaque étape' },
    on: 'oui', off: 'non', kept: 'Gardés pour tous les épisodes' },
  en: { title: 'Settings', quality: 'Picture', still: 'At rest', lang: 'Language', sound: 'Sound',
    hint: { quality: 'Eco saves battery, HD+ smooths it all', still: 'frames a second while nothing moves', sound: 'little sounds at each step' },
    on: 'on', off: 'off', kept: 'Kept for every episode' },
};

const CSS = `
#settings-pop { position: absolute; top: calc(100% + 10px); right: 0; z-index: 20; width: 290px; padding: 12px 14px 10px;
  background: rgba(20, 22, 34, .96); border: 1px solid var(--edge); border-radius: 18px;   /* opaque: a backdrop-filter does not work inside .tools, which has one */
  box-shadow: 0 10px 30px rgba(0,0,0,.35); color: var(--ink); font: 13px/1.3 var(--sans); text-align: left;
  transform-origin: top right; animation: settings-in .18s ease-out; }
#settings-pop[hidden] { display: none; }
#settings-pop::before { content: ''; position: absolute; top: -7px; right: 26px; width: 12px; height: 12px; background: inherit;
  border-left: 1px solid var(--edge); border-top: 1px solid var(--edge); transform: rotate(45deg); }
@keyframes settings-in { from { opacity: 0; transform: scale(.92) translateY(-4px); } }
#settings-pop h4 { margin: 0 0 8px; font: 600 14px var(--serif); letter-spacing: .02em; }
#settings-pop .row { display: grid; grid-template-columns: 22px 1fr; gap: 2px 8px; align-items: center; padding: 6px 0; }
#settings-pop .row + .row { border-top: 1px solid var(--edge); }
#settings-pop .ico { font-size: 16px; grid-row: span 2; }
#settings-pop .name { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
#settings-pop .hint { color: var(--muted); font-size: 11px; grid-column: 2; }
#settings-pop .seg { display: inline-flex; background: rgba(255,255,255,.06); border-radius: 999px; padding: 2px; }
#settings-pop .seg button { all: unset; cursor: pointer; padding: 3px 9px; border-radius: 999px; font-size: 12px; color: var(--muted); }
#settings-pop .seg button.on { background: var(--ink); color: #1a1a24; font-weight: 600; }
#settings-pop .kept { margin-top: 6px; color: var(--muted); font-size: 10.5px; text-align: center; }
#topbar .tools { position: relative; }
#topbar:has(#settings-pop:not([hidden])) { z-index: 30; }
@media (max-width: 400px) { #settings-pop { width: min(290px, calc(100vw - 16px)); } }`;

// btn: the Éco / HD button; quality: { levels, get(), set(k) } from lib/quality.js; composer: for the still rate
export function mountSettings(btn, quality, composer, recap) {
  const style = document.createElement('style'); style.id = 'settings-style'; style.textContent = CSS; document.head.append(style);
  const pop = document.createElement('div'); pop.id = 'settings-pop'; pop.hidden = true; pop.setAttribute('role', 'dialog');
  btn.parentElement.append(pop);   // inside .tools, so it moves with the top bar
  const bar = document.getElementById('topbar');
  const lang = () => document.documentElement.lang === 'en' ? 'en' : 'fr';
  const soundOn = () => document.getElementById('sound')?.textContent === '🔊';
  const seg = (key, opts, cur) => `<span class="seg" data-key="${key}">${opts.map(([v, name]) =>
    `<button data-v="${v}" class="${String(v) === String(cur) ? 'on' : ''}">${name}</button>`).join('')}</span>`;
  const row = (ico, name, control, hint) => `<div class="row"><span class="ico">${ico}</span>
    <span class="name">${name}${control}</span>${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
  function render() {
    const L = lang(), t = WORDS[L];
    pop.setAttribute('aria-label', t.title);
    pop.innerHTML = `<h4>⚙ ${t.title}</h4>`
      + row('🖼', t.quality, seg('quality', Object.entries(quality.levels).map(([k, v]) => [k, v.label[L]]), quality.get()), t.hint.quality)
      + row('⏱', t.still, seg('still', STILL_RATES.map(r => [r, r]), composer.stillFrames?.fps ?? getStill()), t.hint.still)
      + row('🌐', t.lang, seg('lang', [['fr', 'FR'], ['en', 'EN']], L))
      + row(soundOn() ? '🔊' : '🔈', t.sound, seg('sound', [[0, t.off], [1, t.on]], +soundOn()), t.hint.sound)
      + `<div class="kept">${t.kept}</div>`;
  }
  pop.addEventListener('click', e => {
    const b = e.target.closest('.seg button'); if (!b) return;
    const key = b.parentElement.dataset.key, v = b.dataset.v;
    if (key === 'quality') quality.set(v);
    if (key === 'still') { setStill(+v); recap(+v); }
    if (key === 'lang') document.querySelector(`#lang button[data-lang="${v}"]`)?.click();
    if (key === 'sound' && +v !== +soundOn()) document.getElementById('sound')?.click();
    render();
  });
  const open = show => {
    pop.hidden = !show; btn.setAttribute('aria-expanded', show);
    if (bar) show ? (bar.dataset.hold = '1') : delete bar.dataset.hold;   // lib/topbar.js keeps the bar while it is open
    if (show) render();
  };
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.addEventListener('click', () => open(pop.hidden));
  addEventListener('pointerdown', e => { if (!pop.hidden && !pop.contains(e.target) && e.target !== btn) open(false); }, true);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) open(false); });
  new MutationObserver(() => pop.hidden || render()).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  return { open, pop };
}
