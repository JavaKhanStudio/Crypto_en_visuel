// r406 (Simon: « Top menu should fade out / in when the mouse is not near it. For phone, menu should
// be openable with a small arrow »; his picks: the whole bar goes, title chip included, and the scene
// takes the room back, smoothly). lib/episode.js loads it for every episode.
//   - with a mouse (hover: hover): the bar fades and slides up out of the screen once the pointer has
//     been away from it for a moment, and comes back as the pointer nears its place (or a key focuses it);
//   - with a finger: the bar is tucked up out of the screen, and a tab at the top opens it; the tab
//     (now under the bar, smaller) or a tap on the scene closes it again. The tab is larger when it
//     offers to open, and grows and shrinks smoothly.
// The scene reclaims the room through the bar's own box: it moves with a transform, and everything
// that keeps clear of the bar (lib/bubbles.js, lib/room.js band(), each main.js dock()) reads
// getBoundingClientRect, which follows the transform frame by frame, so they glide with it.
// dock() only runs on a resize, so the card's --top (its phone height) is written here while the bar
// moves; on a desktop the card's top: 96px of every episode's style.css climbs to 14px, and on a phone,
// while the bar is away, an unfolded card stops under the tab instead of --top.
// ?topbar=pin keeps the bar always shown, where it was (tests and shots that measure the bar itself).
const pin = new URLSearchParams(location.search).get('topbar') === 'pin';
const NEAR = 90, IDLE = 1800, T = 450;   // px below the bar's place that still count as near; ms away before it goes; ms of the move
const TAB = 34;   // px, the tab's height while it offers to open

const CSS = `
#topbar { transition: transform ${T}ms ease, opacity ${T}ms ease; }
#topbar.away { transform: translateY(calc(-100% - 24px)); }
#topbar.faded { opacity: 0; }
#topbar.away > * { pointer-events: none; }
#topbar-tab { position: fixed; top: 0; left: 50%; transform: translateX(-50%); z-index: 5;
  width: 46px; height: 22px; padding: 0; border: 1px solid var(--edge); border-top: 0; border-radius: 0 0 12px 12px;
  background: var(--glass); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  color: var(--text, #eee); font-size: 13px; line-height: 1; cursor: pointer;
  transition: top ${T}ms ease, width ${T}ms ease, height ${T}ms ease, font-size ${T}ms ease, border-radius ${T}ms ease; }
#topbar-tab.offer { width: 68px; height: ${TAB}px; font-size: 20px; border-radius: 0 0 16px 16px; }
@media (min-width: 901px) { #card { transition: top ${T}ms ease; } body:has(#topbar.away) #card { top: 14px; } }
@media (max-width: 900px) { #card { transition: max-height ${T}ms ease; }
  body:has(#topbar.away) #card { max-height: calc(100% - var(--dock, 230px) - ${TAB + 6}px - 16px); } }`;

// the card's --top as dock() writes it, every frame while the bar moves (and once after)
function follow(bar) {
  const until = performance.now() + T + 60;
  const step = () => {
    const top = Math.max(0, ...['topbar', 'modes', 'lang'].map(id => document.getElementById(id)?.getBoundingClientRect().bottom ?? 0));
    document.documentElement.style.setProperty('--top', `${top}px`);
    if (performance.now() < until) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function mouse(bar) {
  let timer = 0;
  const set = away => {
    if (bar.classList.contains('away') === away) return;
    bar.classList.toggle('away', away); bar.classList.toggle('faded', away); follow(bar);
  };
  const show = () => { clearTimeout(timer); set(false); };
  const later = () => { clearTimeout(timer); timer = setTimeout(() => set(true), IDLE); };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    // its place, not its box: once away, the box is above the screen
    const near = e.clientY < bar.offsetTop + bar.offsetHeight + NEAR;
    near ? show() : (bar.classList.contains('away') || later());
  });
  document.documentElement.addEventListener('pointerleave', later);
  bar.addEventListener('focusin', show);
  later();   // seen on arrival, then out of the way
}

function touch(bar) {
  const tab = document.createElement('button');
  tab.id = 'topbar-tab';
  tab.setAttribute('aria-controls', 'topbar');
  document.body.append(tab);
  const set = open => {
    if (bar.classList.contains('away') !== open && tab.textContent) return;
    bar.classList.toggle('away', !open);
    tab.classList.toggle('offer', !open);
    tab.textContent = open ? '▴' : '▾';
    tab.setAttribute('aria-expanded', open);
    tab.title = open ? 'Ranger le menu / Hide the menu' : 'Ouvrir le menu / Open the menu';
    tab.style.top = open ? `${bar.offsetTop + bar.offsetHeight + 6}px` : '0px';
    follow(bar);
  };
  tab.addEventListener('click', () => set(bar.classList.contains('away')));
  document.getElementById('scene')?.addEventListener('pointerdown', () => set(false));
  set(false);
}

if (!pin) {
  const start = () => {
    const bar = document.getElementById('topbar');
    if (!bar) return;
    const style = document.createElement('style'); style.id = 'topbar-style'; style.textContent = CSS; document.head.append(style);
    (matchMedia('(hover: hover)').matches ? mouse : touch)(bar);
  };
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', start) : start();
}
