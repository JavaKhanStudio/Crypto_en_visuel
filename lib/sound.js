// The sounds of every episode (r319, was 17 <ep>/js/sound.js in 6 versions that differed only by
// the tones each had added): synthesised with Web Audio, no files. Off until the visitor turns it
// on, since an episode opens in a classroom, and not remembered from page to page.
// The #sound button is the episode's own (index.html, in .right, styled by its css), so it shows
// before any script runs and lib/quality.js can wrap it; a page without one gets one built here.
let ctx = null, on = false;
const btn = soundButton();

function soundButton() {
  let b = document.getElementById('sound');
  if (b) return b;
  b = document.createElement('button');
  b.id = 'sound'; b.className = 'icon'; b.title = 'Son'; b.setAttribute('aria-label', 'Son'); b.textContent = '🔈';
  document.querySelector('.right')?.prepend(b);
  return b;
}

export function toggleSound() {
  on = !on;
  if (on && !ctx) ctx = new AudioContext();
  btn.textContent = on ? '🔊' : '🔈';
}
btn.addEventListener('click', toggleSound);

function tone(freq, dur, { type = 'sine', gain = .15, at = 0, slide = 0 } = {}) {
  if (!on) return;
  const t0 = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + dur + .05);
}

export const sfx = {
  send() { for (let i = 0; i < 6; i++) tone(90 + (i % 2) * 20, .08, { type: 'triangle', gain: .12, at: i * .11 }); },
  arrive() { tone(880, 1.2, { gain: .12 }); tone(1320, 1, { gain: .06, at: .05 }); },
  capture() { tone(160, .6, { type: 'sawtooth', gain: .12, slide: .4 }); tone(70, .7, { type: 'square', gain: .08 }); },
  reject() { tone(300, .15, { type: 'square', gain: .1 }); tone(200, .3, { type: 'square', gain: .1, at: .16 }); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, .9, { type: 'triangle', gain: .12, at: i * .15 })); },
  lose() { [392, 311, 262].forEach((f, i) => tone(f, .7, { type: 'sawtooth', gain: .08, at: i * .25 })); },
  lock() { tone(1800, .04, { type: 'square', gain: .08 }); tone(900, .08, { type: 'square', gain: .06, at: .03 }); },
  unlock() { tone(500, .06, { type: 'square', gain: .07 }); tone(1200, .1, { gain: .08, at: .12 }); },
  pour() { for (let i = 0; i < 7; i++) tone(240 + Math.random() * 120, .12, { gain: .04, at: i * .13, slide: .6 }); },
  wind() { for (let i = 0; i < 10; i++) tone(180 + i * 14, .1, { type: 'triangle', gain: .04, at: i * .2 }); },
  scratch() { tone(2400 + Math.random() * 600, .05, { type: 'sawtooth', gain: .025, slide: .7 }); },
  tick() { tone(1100, .03, { type: 'square', gain: .03 }); },
  lamp() { tone(1500, .25, { gain: .06 }); tone(2250, .2, { gain: .03, at: .03 }); },
  press() { tone(70, .35, { type: 'square', gain: .1, slide: .6 }); tone(1400, .08, { type: 'triangle', gain: .05, at: .2 }); },
  mix() { for (let i = 0; i < 4; i++) tone(500 + i * 180, .12, { type: 'triangle', gain: .05, at: i * .05 }); },
  flip() { tone(2200, .05, { type: 'square', gain: .06 }); tone(900, .12, { type: 'sawtooth', gain: .06, at: .06, slide: .5 }); },
  thud() { tone(90, .18, { type: 'triangle', gain: .14, slide: .5 }); },
  click() { tone(660, .05, { gain: .05 }); },
};
