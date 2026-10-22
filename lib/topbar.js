// r406 PROTOTYPE (Simon: « Top menu should fade out / in when the mouse is not near it. For phone, menu
// should be openable with a small arrow »). Off unless the address says ?topbar=auto, so the live
// episodes do not change before Simon picks; lib/episode.js loads it for every episode.
//   - with a mouse (hover: hover): the top bar fades out once the pointer has been away from it for
//     a moment, and back in as the pointer comes within NEAR px of it (or a key focuses it);
//   - with a finger: the bar is tucked up out of the screen, and a small ▾ tab at the top opens it;
//     ▴ (the same tab, now under the bar) or a tap on the scene closes it again.
// The bar keeps its place in the layout (bubbles, card and rooms still budget its room): this only
// takes it out of sight.
const on = new URLSearchParams(location.search).get('topbar') === 'auto';
const NEAR = 90, IDLE = 1800;   // px below the bar that still count as near; ms away before the fade

const CSS = `
#topbar > * { transition: opacity .45s ease; }
#topbar.faded > * { opacity: 0; }
#topbar { transition: transform .35s ease; }
#topbar.tucked { transform: translateY(calc(-100% - 20px)); }
#topbar-tab { position: fixed; top: 0; left: 50%; transform: translateX(-50%); z-index: 5; display: none;
  width: 46px; height: 22px; padding: 0; border: 1px solid var(--edge); border-top: 0; border-radius: 0 0 12px 12px;
  background: var(--glass); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  color: var(--text, #eee); font-size: 13px; line-height: 20px; cursor: pointer; transition: top .35s ease; }
#topbar-tab.touch { display: block; }`;

function mouse(bar) {
  let timer = 0;
  const show = () => { bar.classList.remove('faded'); clearTimeout(timer); };
  const later = () => { clearTimeout(timer); timer = setTimeout(() => bar.classList.add('faded'), IDLE); };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const near = e.clientY < bar.getBoundingClientRect().bottom + NEAR;
    near ? show() : (bar.classList.contains('faded') || later());
  });
  document.documentElement.addEventListener('pointerleave', later);
  bar.addEventListener('focusin', show);
  later();   // seen on arrival, then out of the way
}

function touch(bar) {
  const tab = document.createElement('button');
  tab.id = 'topbar-tab'; tab.className = 'touch';
  tab.setAttribute('aria-controls', 'topbar');
  document.body.append(tab);
  const set = open => {
    bar.classList.toggle('tucked', !open);
    tab.textContent = open ? '▴' : '▾';
    tab.setAttribute('aria-expanded', open);
    tab.title = open ? 'Ranger le menu / Hide the menu' : 'Ouvrir le menu / Open the menu';
    tab.style.top = open ? `${bar.getBoundingClientRect().height + 16}px` : '0px';
  };
  tab.addEventListener('click', () => set(bar.classList.contains('tucked')));
  document.getElementById('scene')?.addEventListener('pointerdown', () => set(false));
  set(false);
}

if (on) {
  const start = () => {
    const bar = document.getElementById('topbar');
    if (!bar) return;
    const style = document.createElement('style'); style.id = 'topbar-style'; style.textContent = CSS; document.head.append(style);
    (matchMedia('(hover: hover)').matches ? mouse : touch)(bar);
  };
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', start) : start();
}
