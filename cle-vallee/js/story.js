// The guided story of episode 1.4: 13 steps in 4 chapters. Each step names what the corner card
// shows (a view of the real bytes and numbers, aes.js, hmac.js and rsa.js), flies the camera, pins
// its bubbles, and offers buttons. Three rides: Alice's keys in the clear, copied by Eve at her gate;
// Bob's open padlock carried west to Alice, copied too; the packet with its keys locked, which Eve
// cannot open and Bob can.
import * as THREE from 'three';
import { t, raw, lang, onLang } from './i18n.js';
import { linkify } from '../../xref.js';
import { renderDoors } from '../../lib/doors.js';
import { render as md } from '../../lib/md.js';
import { CASTLE_A, CASTLE_B, CITY } from '../../lib/saga/world.js';
import * as A from '../../lib/saga-aes.js';
import * as R from '../../lib/rsa.js';
import * as P from './packet.js';

const anchors = {
  a: new THREE.Vector3(CASTLE_A.x, CASTLE_A.y + 27, 0),
  b: new THREE.Vector3(CASTLE_B.x, CASTLE_B.y + 27, 0),
  e: new THREE.Vector3(CITY.x, 27, CITY.z),
  n: new THREE.Vector3(CITY.x, 44, CITY.z),
};

// The story's packets: Alice's order with her keys locked (seed 1), the same keys locked with seed 2,
// the same order sent with the keys in the clear and what Eve makes of it, and the next send of the
// same order with fresh keys, IV and seed.
export const packets = () => {
  const order = A.ORDER[lang], s = P.send(order, P.STORY), clear = P.send(order, P.STORY, 'clear');
  return { s, clear, fall: P.eve(clear, true, lang), twice: P.send(order, { ...P.STORY, seed: R.SEED2 }), next: P.send(order, R.NEXT) };
};
// what Eve says at her gate, and what Bob says of what he gets
export const eveSays = (e, rewrite) => e.keys
  ? rewrite ? t('m.eveRewrite', { m: e.m, w: e.w }) : t('m.eveRead', { m: e.m })
  : rewrite ? t('m.eveFlip') : t('m.lockedEve', { h: A.hex(e.pkt.ek, 6) });
export const bobSays = (pkt, r) => r.rejected ? t('m.bobReject') : t(pkt.how === 'rsa' ? 'm.bobOpen' : 'm.bobRead', { m: A.printable(r.back) });

export const STEPS = [
  { id: 'intro', ch: 0, shot: 'castleA', view: 'keys', say: ['a'] },
  { id: 'clear', ch: 0, shot: 'both', view: 'clear', go: async x => { await x.ride('clear'); } },
  { id: 'fall', refs: { '1.3': 8 }, ch: 0, shot: 'city', orbit: .04, view: 'fall', say: ['e'] },
  // r363: Bob makes his padlock inside his keep, a room of two beats (inside.js rsaRoom): RSA by hand
  // on 5 and 11, then the 2048-bit n; the camera comes out at 'deliver'. A step can name another
  // window with door: (inside.js DOORS, keepWindow)
  { id: 'padlock', ch: 1, shot: 'castleB', view: 'toy', say: ['b'], inside: 'rsa' },
  { id: 'rsa2048', ch: 1, shot: 'castleB', view: 'pubkey', say: ['b'], inside: 'rsa' },
  { id: 'deliver', ch: 1, shot: 'both', view: 'pubkey', go: async x => { await x.ride('padlock'); } },
  // r103/r160: Alice locks the padlock inside her keep, in a room where OAEP and RSA run on the
  // real bytes (inside.js); the only step of the chapter in her keep, so the camera comes out at 'seed'
  { id: 'close', ch: 1, shot: 'castleA', view: 'oaep', say: ['a'], inside: 'oaep' },
  { id: 'seed', ch: 1, shot: 'city', view: 'seed', say: ['e'] },
  { id: 'ride', ch: 1, shot: 'both', view: 'open', go: async x => { await x.ride('locked'); } },
  { id: 'hybrid', ch: 2, shot: 'valley', view: 'hybrid', say: ['n'] },
  { id: 'fresh', ch: 2, shot: 'castleA', view: 'fresh', say: ['a'] },
  { id: 'packet', refs: { '1.6': 2 }, ch: 3, shot: 'city', orbit: .03, view: 'packet', say: ['e'] },
  // r105/r128: the last step is the doors out, each with its picture and its hover clip; the next episode is last, at the right
  { id: 'end', ch: 3, shot: 'overview', orbit: .06, view: 'packet', doors: [
      { k: 'sandbox', img: 'img/door-sandbox.jpg', clip: 'img/door-sandbox.mp4', go: x => x.mode('sandbox') },
      { k: 'quiz', img: 'img/door-quiz.jpg', clip: 'img/door-quiz.mp4', go: x => x.mode('quiz') },
      { k: 'home', img: '../assets/doors/home.jpg', clip: 'img/door-home.mp4', href: '../' },
      { k: 'next', img: '../paquet-complet/vignette.jpg', clip: 'img/door-next.mp4', href: '../paquet-complet/' }] },
];

export class Story {
  constructor(ctx) {
    this.ctx = ctx; this.i = 0; this.token = 0;
    this.el = { title: document.getElementById('step-title'), text: document.getElementById('step-text'),
      actions: document.getElementById('step-actions'), count: document.getElementById('step-count'),
      chapters: document.getElementById('chapters'), prev: document.getElementById('prev'), next: document.getElementById('next'),
      panel: document.getElementById('story'), more: document.getElementById('step-more') };
    this.el.more.onclick = () => { this.el.panel.classList.toggle('open'); this.fold(); };
    addEventListener('resize', () => this.fold());
    this.el.prev.onclick = () => this.go(this.i - 1);
    this.el.next.onclick = () => this.go(this.i + 1);
    onLang(() => { if (STEPS[this.i].inside) this.ctx.inside.rebuild(packets()); this.render(true); this.card(); });
  }

  // what the corner card shows at this step: the view and the story's packets
  state(i = this.i) { return { view: STEPS[i].view, ...packets() }; }
  card(extra) { if (this.ctx.mode() !== 'story') return; this.st = { ...(extra ? this.st : this.state()), ...extra }; this.ctx.renderCard(this.st); }

  go(i) {
    i = Math.max(0, Math.min(STEPS.length - 1, i));
    this.i = i; this.seen = false; const tok = ++this.token, step = STEPS[i], c = this.ctx;
    location.hash = 'story=' + (i + 1);
    c.bubbles.clear(); c.resetWorld();
    this.card();
    c.rig.setOrbit(0);
    this.render();
    if (step.inside) return this.enter(step, tok);
    // out of a room, the camera backs out of its window and flies on to the step's shot
    const out = c.inside.active;
    Promise.resolve(out ? c.inside.leave(step.shot) : c.rig.fly(step.shot, c.instant ? 0.001 : 2.2))
      .then(() => { if (tok === this.token && step.orbit) c.rig.setOrbit(step.orbit); });
    // bubbles appear once the camera has mostly arrived
    setTimeout(() => { if (tok === this.token) for (const s of step.say || []) this.say(s); }, c.instant ? 0 : out ? 2000 : 1300);
  }

  // a step inside the castle: it zooms in through the window from wherever the camera is (so #story=7
  // straight into it enters too); a next step in the same room would be a beat of it
  async enter(step, tok) {
    const c = this.ctx, live = () => tok === this.token;
    if (c.inside.active && c.inside.room.name === step.inside) c.inside.beat(step.id);
    else if (!await c.inside.enter(step.inside, step.id, packets(), live, step.door)) return;
    setTimeout(() => { if (live()) for (const s of step.say || []) this.say(s, undefined, () => c.inside.anchor()); }, c.instant ? 0 : 900);
  }

  say(who, text, anchor) {
    const step = STEPS[this.i];
    this.ctx.bubbles.show('story-' + who, who, text ?? raw('steps')[step.id][who], anchor ?? anchors[who]);
  }

  render(langOnly = false) {
    const step = STEPS[this.i], s = raw('steps')[step.id];
    this.el.title.textContent = s.t; md(this.el.text, s.p); linkify(this.el.text, lang, step.refs);   // « épisode 1.4 » links to its step (r119)
    if (!langOnly) this.el.panel.classList.remove('open');
    this.el.panel.classList.toggle('roomy', !!step.inside); this.fold();
    this.el.count.textContent = t('nav.count', { i: this.i + 1, n: STEPS.length });
    this.el.prev.disabled = this.i === 0; this.el.next.disabled = this.i === STEPS.length - 1;
    this.el.chapters.innerHTML = '';
    raw('ch').forEach((name, k) => {
      const b = document.createElement('button'); b.textContent = `${k + 1}. ${name}`;
      b.classList.toggle('active', step.ch === k);
      b.onclick = () => this.go(STEPS.findIndex(x => x.ch === k));
      this.el.chapters.appendChild(b);
    });
    // a step's animation takes Suivant's place at the right; Suivant waits beside it, grey, until
    // the animation has played (it works all along). The last step's buttons are not animations.
    this.el.actions.innerHTML = ''; this.el.play?.remove(); this.el.play = null;
    const anim = step.go && this.i < STEPS.length - 1;
    for (const key of ['go', 'go2']) {
      if (!step[key]) continue;
      const b = document.createElement('button'); b.className = key === 'go' && !(anim && this.seen) ? 'primary' : '';
      b.textContent = s[key];
      b.onclick = () => this.run(step[key]);
      if (anim && key === 'go') { b.id = 'play'; this.el.next.after(b); this.el.play = b; } else this.el.actions.appendChild(b);
    }
    renderDoors(this.el.actions, step.doors, s.doors, { lang, setMode: m => this.ctx.setMode(m), phone: 'row' });
    this.el.next.classList.toggle('primary', !anim || this.seen);
    if (!this.seen) this.el.next.classList.remove('shine');
    if (langOnly) for (const s2 of step.say || []) this.say(s2, undefined, step.inside ? () => this.ctx.inside.anchor() : undefined);
  }

  // r368, Simon's pick A: in a room on a phone the text shows its first 3 lines (style.css #story.roomy),
  // so the room keeps the screen; « Lire la suite ▾ » shows only when that cuts the text, and opens it
  fold() {
    const { panel, text, more } = this.el;
    if (!panel.classList.contains('open')) panel.classList.toggle('long', text.scrollHeight > text.clientHeight + 2);
    more.textContent = t(panel.classList.contains('open') ? 'nav.less' : 'nav.more');
  }

  // the step's animation has played: Suivant takes the gold back and shines once to call the eye
  lit() {
    if (this.seen || !this.el.play) return;
    this.seen = true; this.el.play.classList.remove('primary');
    const n = this.el.next; n.classList.add('primary', 'shine');
    n.addEventListener('animationend', () => n.classList.remove('shine'), { once: true });
  }

  async run(fn) {
    const tok = this.token, c = this.ctx, step = STEPS[this.i];
    const live = () => tok === this.token;
    const buttons = [...this.el.actions.querySelectorAll('button'), this.el.play].filter(Boolean);
    buttons.forEach(b => b.disabled = true);
    c.bubbles.clear(); c.rig.setOrbit(0); c.resetWorld(); this.card();
    const x = {
      live, mode: m => c.setMode(m),
      say: (who, text) => live() && this.say(who, text),
      // one ride of the story: Alice's keys in the clear ('clear'), Bob's open padlock going west
      // ('padlock'), or Alice's packet with its keys locked ('locked'); Eve holds each one at her gate
      ride: async what => {
        const p = packets(), k = p.clear.sent, h = b => A.hex(b, 4);
        const said = {
          clear: { eve: t('m.keysClear', { a: h(k.slice(0, 32)), b: h(k.slice(32)) }), bob: t('m.bobKeys') },
          padlock: { eve: t('m.padlockEve'), bob: t('m.aliceGot') },
          locked: { eve: eveSays(P.eve(p.s, false, lang), false), bob: bobSays(p.s, P.receive(p.s)) },
        }[what];
        const res = await c.ride({ ...said, from: what === 'padlock' ? 'b' : 'a', cargo: { clear: 'keys', padlock: 'open', locked: 'locked' }[what], live });
        if (live()) await c.rig.fly('both');
        return res;
      },
    };
    try { await fn(x); } finally { if (live()) { buttons.forEach(b => b.disabled = false); this.lit(); } }
  }
}
