// The guided story of episode 1.3: 13 steps in 4 chapters. Each step names what the corner card
// shows (a view of the real bytes, aes.js and hmac.js), flies the camera, pins its bubbles, and offers
// buttons. A ride: Alice's messenger leaves, Eve's guards stop him under her walls, she changes a byte
// of the IV, lets him go, and Bob decrypts the changed order, or rejects the packet on its seal.
import * as THREE from 'three';
import { t, raw, lang, onLang } from './i18n.js';
import { linkify } from '../../xref.js';
import { render as md } from '../../lib/md.js';
import { renderDoors } from '../../lib/doors.js';
import { roomFold } from '../../lib/fold.js';
import { CASTLE_A, CASTLE_B, CITY } from '../../lib/saga/world.js';
import * as A from '../../lib/saga-aes.js';

const anchors = {
  a: new THREE.Vector3(CASTLE_A.x, CASTLE_A.y + 27, 0),
  b: new THREE.Vector3(CASTLE_B.x, CASTLE_B.y + 27, 0),
  e: new THREE.Vector3(CITY.x, 27, CITY.z),
  n: new THREE.Vector3(CITY.x, 44, CITY.z),
};

// The story's packets: Alice's order sealed (key, IV and HMAC key drawn once), the same with byte 11
// of the IV changed by Eve, with byte 1 of the ciphertext changed, and Eve's own forged packet.
export const packets = () => {
  const s = A.send(A.ORDER[lang], A.KEY, A.IV, A.MACKEY);
  return { s, iv: A.tamper(s, 'iv', A.HOUR), ct: A.tamper(s, 'ct', 0), forged: A.send(A.FORGED[lang], A.EVE_KEY, A.EVE_IV, A.EVE_MACKEY) };
};
// What Eve says as she changes byte i of the IV or the ciphertext, and what Bob says of what he gets
export const eveSays = (s, pkt) => {
  const was = pkt.where === 'iv' ? s.iv[pkt.i] : A.concat(s.C)[pkt.i], now = was ^ A.FLIP, h = x => x.toString(16).padStart(2, '0');
  return t(pkt.where === 'iv' ? 'm.flip' : 'm.flipCt', { n: pkt.i + 1, a: h(was), b: h(now) });
};
export const bobSays = (r, check) => r.rejected ? t('m.bobReject') : !r.padGood ? t('m.bobPad')
  : t(check ? 'm.bobRead' : 'm.bobNoCheck', { m: A.printable(r.back) });

export const STEPS = [
  { id: 'intro', refs: { '1.2': 8 }, ch: 0, shot: 'city', orbit: .04, view: 'sent', say: ['e'] },
  { id: 'flip', ch: 0, shot: 'city', view: 'flip', say: ['e'] },
  { id: 'ride', ch: 0, shot: 'both', view: 'flip', go: async x => { await x.ride({ how: 'iv', check: false }); x.say('n', t('m.alone')); } },
  { id: 'why', ch: 0, shot: 'valley', view: 'ctflip', say: ['n'] },
  // r103/r159: chapter 2 happens inside Alice's keep, one zoom for the three steps; the HMAC room
  // (inside.js) grows a beat per step, 'avalanche' plays Bob's check on the same machine, and the
  // camera comes out at 'sealed'
  { id: 'key', ch: 1, shot: 'castleA', view: 'mackey', say: ['a'], inside: 'hmac' },
  { id: 'hmac', ch: 1, shot: 'castleA', view: 'hmac', say: ['a'], inside: 'hmac' },
  { id: 'avalanche', ch: 1, shot: 'castleB', view: 'avalanche', say: ['b'], inside: 'hmac' },
  { id: 'sealed', ch: 1, shot: 'both', view: 'avalanche', go: async x => { await x.ride({ how: 'iv', check: true }); } },
  { id: 'forged', ch: 1, shot: 'city', view: 'forged', go: async x => { await x.ride({ how: 'forge', check: true }); } },
  { id: 'first', ch: 2, shot: 'castleB', view: 'ops', say: ['b'] },
  { id: 'compare', ch: 2, shot: 'castleB', view: 'compare', say: ['b'] },
  { id: 'packet', refs: { '1.6': 8 }, ch: 3, shot: 'city', orbit: .03, view: 'packet', say: ['e'] },
  // r105/r127: the last step is the doors out, each with its picture and its hover clip; the next episode is last, at the right
  { id: 'end', refs: { '6': 9 }, ch: 3, shot: 'overview', orbit: .06, view: 'packet', doors: [
      { k: 'sandbox', img: 'img/door-sandbox.jpg', clip: 'img/door-sandbox.mp4', go: x => x.mode('sandbox') },
      { k: 'quiz', img: 'img/door-quiz.jpg', clip: 'img/door-quiz.mp4', go: x => x.mode('quiz') },
      { k: 'home', img: '../assets/doors/home-2.jpg', clip: 'img/door-home.mp4', href: '../' },
      { k: 'next', img: '../cle-vallee/vignette.jpg', clip: 'img/door-next.mp4', href: '../cle-vallee/' }] },
];

export class Story {
  constructor(ctx) {
    this.ctx = ctx; this.i = 0; this.token = 0;
    this.el = { title: document.getElementById('step-title'), text: document.getElementById('step-text'),
      actions: document.getElementById('step-actions'), count: document.getElementById('step-count'),
      chapters: document.getElementById('chapters'), prev: document.getElementById('prev'), next: document.getElementById('next'),
      panel: document.getElementById('story'), more: document.getElementById('step-more') };
    this.fold = roomFold(this.el.panel, this.el.text, this.el.more, t);   // r368's phone fold in a room (lib/fold.js)
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

  // a step inside the castle: the first one zooms in through the window (from wherever the camera is,
  // so #story=N straight into the chapter enters too); the next ones are beats of the same room
  async enter(step, tok) {
    const c = this.ctx, live = () => tok === this.token;
    if (c.inside.active && c.inside.room.name === step.inside) c.inside.beat(step.id);
    else if (!await c.inside.enter(step.inside, step.id, packets(), live)) return;
    setTimeout(() => { if (live()) for (const s of step.say || []) this.say(s, undefined, () => c.inside.anchor()); }, c.instant ? 0 : 900);
  }

  say(who, text, anchor) {
    const step = STEPS[this.i];
    this.ctx.bubbles.show('story-' + who, who, text ?? raw('steps')[step.id][who], anchor ?? anchors[who]);
  }

  render(langOnly = false) {
    const step = STEPS[this.i], s = raw('steps')[step.id];
    this.el.title.textContent = s.t; md(this.el.text, s.p); linkify(this.el.text, lang, step.refs);   // « épisode 1.4 » links to its step (r119)
    this.fold(!!step.inside, !langOnly);
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
      // one ride of the story's packet: Eve changes byte 11 of the IV at her gate (how 'iv'), or sends
      // her own rider (how 'forge'); Bob checks the seal first (check) or decrypts whatever arrives
      ride: async ({ how, check }) => {
        const p = packets(), pkt = how === 'forge' ? p.forged : p.iv, r = A.receive(pkt, A.KEY, A.MACKEY, check);
        const res = await c.ride({ eve: how === 'forge' ? t('m.forge') : eveSays(p.s, pkt), bob: bobSays(r, check),
          forged: how === 'forge', reject: !!r.rejected, live });
        if (live()) await c.rig.fly('both');
        return res;
      },
    };
    try { await fn(x); } finally { if (live()) { buttons.forEach(b => b.disabled = false); this.lit(); } }
  }
}
