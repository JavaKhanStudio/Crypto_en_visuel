// r646 PROTOTYPE: the series' settings page. Each row writes the localStorage key the episodes already read,
// so nothing here is a second copy of a setting: the levels and their names come from lib/quality.js.
import { LEVELS, getQuality, isPhone } from '../lib/quality.js';

const STILL = 'dg-still', STILL_RATES = [30, 60], STILL_DEFAULT = 30;   // r546 (lib/still.js once it lands: read from there)

const fr = {
  tab: 'Réglages · Crypto en visuel', back: '← Tous les épisodes', title: 'Réglages',
  tagline: 'Gardés sur cet appareil, pour tous les épisodes.',
  footer: 'Un épisode déjà ouvert prend les nouveaux réglages au prochain chargement.',
  quality: 'Qualité de l’image',
  qualityLine: 'Plus de qualité, des bords plus nets et des ombres plus douces ; moins, une image plus légère pour un appareil lent.',
  eco: 'bords crénelés, batterie ménagée', normal: 'bords lissés', fine: 'plus de pixels, carte graphique sollicitée',
  qualityAuto: d => `Sans choix, cet appareil prend ${d}.`,
  still: 'Images par seconde quand rien ne bouge',
  stillLine: 'Quand la caméra est immobile, la scène peut se redessiner moins souvent : moins de travail, même image.',
  r30: 'économe (par défaut)', r60: 'toujours fluide',
  lang: 'Langue', langLine: 'La langue des épisodes, des bulles et du quiz.',
  reset: 'Revenir aux réglages par défaut',
};
const en = {
  tab: 'Settings · Crypto, Visualized', back: '← All episodes', title: 'Settings',
  tagline: 'Kept on this device, for every episode.',
  footer: 'An episode already open takes the new settings the next time it loads.',
  quality: 'Picture quality',
  qualityLine: 'More quality: sharper edges and softer shadows; less: a lighter picture for a slow device.',
  eco: 'jagged edges, saves battery', normal: 'smooth edges', fine: 'more pixels, works the graphics card',
  qualityAuto: d => `With nothing chosen, this device uses ${d}.`,
  still: 'Frames per second when nothing moves',
  stillLine: 'While the camera is still, the scene can be redrawn less often: less work, the same picture.',
  r30: 'thrifty (default)', r60: 'always smooth',
  lang: 'Language', langLine: 'The language of the episodes, their bubbles and the quiz.',
  reset: 'Back to the default settings',
};
const dicts = { fr, en };
const fromUrl = new URLSearchParams(location.search).get('lang');
let lang = (fromUrl || localStorage.getItem('dg-lang') || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';

const seg = (key, options, cur) => `<div class="seg" data-key="${key}">${options.map(([v, name, sub]) =>
  `<button data-v="${v}" class="${String(v) === String(cur) ? 'on' : ''}">${name}${sub ? `<small>${sub}</small>` : ''}</button>`).join('')}</div>`;

function render() {
  const t = dicts[lang];
  document.documentElement.lang = lang; document.title = t.tab;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t[el.dataset.i18n];
  const q = getQuality(), still = +localStorage.getItem(STILL) || STILL_DEFAULT;
  const auto = LEVELS[isPhone() ? 'eco' : 'normal'].label[lang];
  document.getElementById('settings').innerHTML = `
    <section class="row" id="row-quality"><h2>${t.quality}</h2><p>${t.qualityLine}</p>
      ${seg('dg-quality', Object.entries(LEVELS).map(([k, L]) => [k, L.label[lang], t[k]]), q)}
      <span class="note">${t.qualityAuto(auto)}</span></section>
    <section class="row" id="row-still"><h2>${t.still}</h2><p>${t.stillLine}</p>
      ${seg(STILL, STILL_RATES.map(r => [r, r, t['r' + r]]), still)}</section>
    <section class="row" id="row-lang"><h2>${t.lang}</h2><p>${t.langLine}</p>
      ${seg('dg-lang', [['fr', 'Français'], ['en', 'English']], lang)}</section>
    <button id="reset">${t.reset}</button>`;
  for (const b of document.querySelectorAll('.seg button')) b.onclick = () => {
    const key = b.parentElement.dataset.key;
    localStorage.setItem(key, b.dataset.v);
    if (key === 'dg-lang') lang = b.dataset.v;
    render();
  };
  document.getElementById('reset').onclick = () => { for (const k of ['dg-quality', STILL]) localStorage.removeItem(k); render(); };
}
render();
window.demo = { ready: true };   // tools/shoot.py waits for it
