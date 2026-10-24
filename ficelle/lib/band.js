// The free band of an episode's screen (r516): below the top bar, above the story panel, left of an
// open corner card, in px. lib/room.js holds a room's frame in it; lib/saga/camera.js holds a castle
// in it on a phone. It reads the DOM each time: the top bar moves by a transform (lib/topbar.js) and
// the panel grows with the step's text.
export function freeBand() {
  const W = innerWidth, H = innerHeight, r = id => document.getElementById(id)?.getBoundingClientRect();
  const bar = [r('topbar'), r('modes'), r('lang')].filter(b => b && b.height).reduce((m, b) => Math.max(m, b.bottom), 0);
  const story = r('story'), card = document.getElementById('card'), cr = r('card');
  let top = bar + 8, bottom = story && story.height ? story.top - 8 : H, left = 0, right = W;
  if (cr && cr.height && !card.classList.contains('hidden')) {
    if (card.classList.contains('folded') && W < 900) bottom = Math.min(bottom, cr.top - 4);   // a phone's card is folded to a line (r84)
    else if (cr.left > W * .55) right = cr.left - 8;
  }
  if (bottom - top < H * .2) { top = 0; bottom = H; }
  return { W, H, left, top, w: right - left, h: bottom - top };
}
