// r254: the picture quality, one setting for the whole series. Every episode draws through an
// EffectComposer (bloom), and a composer renders into its own target, so the canvas's
// `antialias: true` never reached the scene: until now no episode had any antialiasing. Here the
// composer's target is multisampled (MSAA), and the level is kept in localStorage 'dg-quality' so
// the next episode opens with the same one, like 'dg-lang'. With nothing chosen, a phone opens on Éco
// (Simon 21 Oct: battery, small screen) and everything else on HD.
// r310: the button is this file's too. It puts itself beside #sound (both in a .tools span, which
// takes the sound's cell in the phone's second row) and brings its own styles, so an episode adopts
// the whole thing in two lines of its js/main.js and nothing in its html or css. r340: every episode
// takes it through lib/episode.js, the series' boot module, which brings the credit stamp too:
//     import { qualityComposer } from '../../lib/episode.js';
//     const composer = qualityComposer(renderer);   // in place of new EffectComposer(renderer)
// The top bar is already a bubble wall (js/bubbles.js WALLS 'topbar'), and the button is inside it.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { stillCap } from './still.js';

// r613 (Simon: tie the shadows to the quality level, the way games do): Éco filters the shadows with a
// bilinear 2x2 compare, 4 fetches a receiving pixel, where PCFSoft takes 16 (-2 to -4 ms a still frame at
// 1440, harder edges). three r170 packs the depth in RGBA, so its own PCF is 17 manual fetches and slower than
// PCFSoft: no page uses it, and its branch carries the bilinear filter, patched before any program compiles.
const SHADOW = 'shadowmap_pars_fragment', PCF_AT = '#if defined( SHADOWMAP_TYPE_PCF )';
{
  const src = THREE.ShaderChunk[SHADOW], a = src.indexOf(PCF_AT), b = src.indexOf('#elif defined( SHADOWMAP_TYPE_PCF_SOFT )', a);
  if (a >= 0 && b > a) THREE.ShaderChunk[SHADOW] = src.slice(0, a) + `${PCF_AT}
    vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
    vec2 st = shadowCoord.xy * shadowMapSize - 0.5, f = fract( st ), uv = ( floor( st ) + 0.5 ) * texelSize;
    shadow = mix( mix( texture2DCompare( shadowMap, uv, shadowCoord.z ), texture2DCompare( shadowMap, uv + vec2( texelSize.x, 0.0 ), shadowCoord.z ), f.x ),
      mix( texture2DCompare( shadowMap, uv + vec2( 0.0, texelSize.y ), shadowCoord.z ), texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ), f.x ), f.y );
  ` + src.slice(b);
}

// eco: one pixel per CSS pixel, no MSAA and the 4-fetch shadows, for a slow machine; normal: the screen's
// sharpness (up to 2), 4 samples and PCFSoft; fine: 8 samples (or the card's maximum) and 1.5x the pixels.
export const LEVELS = {
  eco: { ratio: () => 1, samples: 0, shadow: THREE.PCFShadowMap, label: { fr: 'Éco', en: 'Eco' } },
  normal: { ratio: () => Math.min(devicePixelRatio, 2), samples: 4, shadow: THREE.PCFSoftShadowMap, label: { fr: 'HD', en: 'HD' } },
  fine: { ratio: () => Math.min(devicePixelRatio * 1.5, 3), samples: 8, shadow: THREE.PCFSoftShadowMap, label: { fr: 'HD+', en: 'HD+' } },
};
const KEY = 'dg-quality', ORDER = Object.keys(LEVELS);
const TITLE = { fr: 'Qualité de l’image', en: 'Picture quality' };   // the button cycles Éco, HD, HD+

// a phone: a finger for a pointer and a short side under 600 CSS px (a tablet's is 744 or more)
export const isPhone = () => matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600;

export function getQuality() {
  const q = new URLSearchParams(location.search).get('quality') || localStorage.getItem(KEY);
  return LEVELS[q] ? q : isPhone() ? 'eco' : 'normal';
}

// .tools: the quality and the sound side by side; under 900px the span takes the cell the sound had
// (2 / 2); under 400px the mode buttons and the chip get tighter so it fits beside them at 360px (Simon's 2A).
// r329: the span wears the glass of #modes and #lang. A button's own fill is a 6% white, so bare on
// the scene the pair took its colour: lost on scytale's light sand, dark on pingouin's night.
const CSS = `
.tools { display: inline-flex; gap: 6px; padding: 6px; background: var(--glass); border: 1px solid var(--edge);
  border-radius: 14px; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
#quality { font-size: 13px; }
@media (max-width: 900px) { #topbar .tools { grid-area: 2 / 2; justify-self: end; } }
@media (max-width: 400px) { #modes button { padding: .45em .4em; } #topbar .tools { padding: 4px; gap: 4px; } }`;

// the button beside #sound, made once; its style goes last in <head> so it wins over the episode's
export function qualityButton() {
  let btn = document.getElementById('quality');
  if (btn) return btn;
  const sound = document.getElementById('sound');
  if (!sound) return null;
  const style = document.createElement('style');
  style.id = 'quality-style'; style.textContent = CSS; document.head.append(style);
  const tools = document.createElement('span');
  tools.className = 'tools'; sound.before(tools);
  btn = document.createElement('button');
  btn.id = 'quality'; btn.className = 'icon';
  tools.append(btn, sound);
  return btn;
}

export function qualityComposer(renderer, btn = qualityButton()) {
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
    // the filter is compiled into every receiving material: a switch rebuilds the composer's scenes' programs
    // (the shadow map itself is the same RGBA depth for both, and stays cached, r543)
    if (renderer.shadowMap.type !== L.shadow) {
      renderer.shadowMap.type = L.shadow;
      for (const pass of composer.passes) pass.scene?.traverse(o => [].concat(o.material || []).forEach(m => { m.needsUpdate = true; }));
    }
    document.documentElement.dataset.quality = cur; label();
  }
  apply();
  btn?.addEventListener('click', () => { cur = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length]; localStorage.setItem(KEY, cur); apply(); });
  // the label follows the page's language
  new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  stillCap(composer);   // r546: composer.idle(), a still scene at 30 fps (lib/still.js)
  return composer;
}
