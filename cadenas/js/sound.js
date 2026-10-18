// A few synthesised sounds (Web Audio, no files): steps, bell, capture, lock clicks, fanfare.
// Off until the visitor turns it on, since it starts in a classroom.
let ctx = null, on = false;
const btn = document.getElementById('sound');

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
  click() { tone(660, .05, { gain: .05 }); },
};
