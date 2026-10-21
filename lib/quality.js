// r254: the picture quality, one setting for the whole series. Every episode draws through an
// EffectComposer (bloom), and a composer renders into its own target, so the canvas's
// `antialias: true` never reached the scene: until now no episode had any antialiasing. Here the
// composer's target is multisampled (MSAA), and the level is kept in localStorage 'dg-quality' so
// the next episode opens with the same one, like 'dg-lang'. With nothing chosen, a phone opens on Éco
// (Simon 21 Oct: battery, small screen) and everything else on HD.
//     import { qualityComposer } from '../lib/quality.js';
//     const composer = qualityComposer(renderer, document.getElementById('quality'));
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';

// eco: one pixel per CSS pixel and no MSAA, for a slow machine; normal: the screen's sharpness
// (up to 2) and 4 samples; fine: 8 samples (or the card's maximum) and 1.5x the pixels, downsampled.
export const LEVELS = {
  eco: { ratio: () => 1, samples: 0, label: { fr: 'Éco', en: 'Eco' } },
  normal: { ratio: () => Math.min(devicePixelRatio, 2), samples: 4, label: { fr: 'HD', en: 'HD' } },
  fine: { ratio: () => Math.min(devicePixelRatio * 1.5, 3), samples: 8, label: { fr: 'HD+', en: 'HD+' } },
};
const KEY = 'dg-quality', ORDER = Object.keys(LEVELS);
const TITLE = { fr: 'Qualité de l’image', en: 'Picture quality' };   // the button cycles Éco, HD, HD+

// a phone: a finger for a pointer and a short side under 600 CSS px (a tablet's is 744 or more)
export const isPhone = () => matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600;

export function getQuality() {
  const q = new URLSearchParams(location.search).get('quality') || localStorage.getItem(KEY);
  return LEVELS[q] ? q : isPhone() ? 'eco' : 'normal';
}

export function qualityComposer(renderer, btn) {
  const max = renderer.capabilities.maxSamples || 0;
  const composer = new EffectComposer(renderer,
    new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }));
  let cur = getQuality();
  function label() {
    if (!btn) return;
    const lang = document.documentElement.lang === 'en' ? 'en' : 'fr', name = LEVELS[cur].label[lang];
    btn.textContent = name; btn.title = `${TITLE[lang]}${lang === 'fr' ? ' :' : ':'} ${name}`; btn.setAttribute('aria-label', btn.title);
  }
  function apply() {
    const L = LEVELS[cur], ratio = L.ratio();
    for (const rt of [composer.renderTarget1, composer.renderTarget2]) { rt.samples = Math.min(L.samples, max); rt.dispose(); }
    renderer.setPixelRatio(ratio); composer.setPixelRatio(ratio);
    document.documentElement.dataset.quality = cur; label();
  }
  apply();
  btn?.addEventListener('click', () => { cur = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length]; localStorage.setItem(KEY, cur); apply(); });
  // the label follows the page's language
  new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  return composer;
}
