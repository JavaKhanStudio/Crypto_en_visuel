// The guided story of episode 1.6: 14 steps in 5 chapters. Each step names what the corner card
// shows (a view of the real bytes: aes.js, hmac.js, rsa.js, sign.js, gcm.js), where the packet
// stands in the valley and which of its bricks it has (show), flies the camera, pins its bubbles,
// and offers buttons. Eve forges a whole packet with Bob's public padlock and Bob accepts it; Alice
// signs, and Eve's next forgery is rejected; Eve replays a real packet, and a number under the
// signature stops her; AES-GCM encrypts and seals in one move; then it is the reader's turn to play Eve.
import * as THREE from 'three';
import { t, raw, lang, onLang } from './i18n.js';
import { linkify } from '../../xref.js';
import { renderDoors } from '../../lib/doors.js';
import { render } from '../../lib/md.js';
import { CASTLE_A, CASTLE_B, CITY } from '../../lib/saga/world.js';
import * as A from '../../lib/saga-aes.js';
import * as S from './sign.js';
import * as P from './packet.js';

const anchors = {
  a: new THREE.Vector3(CASTLE_A.x, CASTLE_A.y + 27, 0),
  b: new THREE.Vector3(CASTLE_B.x, CASTLE_B.y + 27, 0),
  e: new THREE.Vector3(CITY.x, 27, CITY.z),
  n: new THREE.Vector3(CITY.x, 44, CITY.z),
};

// The story's packets, once per language (RSA on BigInt takes a few milliseconds each): Eve's
// forgery, unsigned then signed with her own key; Alice's order signed, then numbered (n° 42), and
// that one with Eve's 42 changed to 43; the order in AES-GCM, and with Eve's byte; the final packet.
const cache = {};
export const packets = () => cache[lang] ??= (() => {
  const order = A.ORDER[lang], numbered = P.alice(order, P.NUM), g = P.gcm(order);
  return { forged: P.forge(lang), forgedSig: P.forge(lang, S.EVE), signed: P.alice(order), numbered,
    bumped: P.tamper(numbered, 'num', 7, P.NUM ^ (P.NUM + 1)), g, gEvil: P.gcmTamper(g), fin: P.final(order) };
})();
// Bob saw n° 41 the day before
export const LAST = P.NUM - 1;
// what Bob says of what he gets, by where he stopped; with his checks named when they passed
export function bobSays(r) {
  if (r.rejected === 'sig') return t('m.bobSig');
  if (r.rejected === 'num') return r.n === null ? t('m.bobNoNum') : t('m.bobNum', { k: r.n });
  if (r.rejected === 'keys') return t('m.bobNoKeys');
  if (r.rejected) return t('m.bobReject');
  return (r.sigOk ? t('m.okSig') : '') + (r.numOk ? t('m.okNum', { k: r.n }) : '') + t('m.bobRead', { m: A.printable(r.back) });
}

const FOUR = ['ek', 'iv', 'ct', 'tag'], SIGNED = [...FOUR, 'sig'], ALL = P.BRICKS;
export const STEPS = [
  { id: 'intro', ch: 0, shot: 'city', orbit: .03, view: 'tricks', say: ['e'] },
  { id: 'forge', ch: 0, shot: 'city', view: 'forge', show: ['e', FOUR, FOUR], say: ['e'] },
  { id: 'forged', ch: 0, shot: 'both', view: 'bobForged', go: async x => { await x.ride('forged'); } },
  { id: 'who', ch: 0, shot: 'castleB', view: 'who', show: ['b', FOUR, FOUR], say: ['b'] },
  // r103/r162: Alice signs inside her keep and Bob checks inside his, on the real bytes (inside.js):
  // one zoom into Alice's keep, a cut through to Bob's, out at 'evilSig'. The same for AES-GCM below.
  { id: 'sign', ch: 1, shot: 'castleA', view: 'sign', show: ['a', SIGNED], say: ['a'], inside: 'sign' },
  { id: 'verify', ch: 1, shot: 'castleB', view: 'verify', show: ['b', SIGNED], say: ['b'], inside: 'verify' },
  { id: 'evilSig', ch: 1, shot: 'both', view: 'evilSig', go: async x => { await x.ride('forgedSig'); } },
  { id: 'replay', ch: 2, shot: 'both', view: 'replay', go: async x => { await x.ride('replay'); } },
  { id: 'num', ch: 2, shot: 'castleA', view: 'num', show: ['a', ALL], say: ['a'] },
  { id: 'replayNum', ch: 2, shot: 'both', view: 'replayNum', go: async x => { await x.ride('replayNum'); } },
  { id: 'gcm', ch: 3, shot: 'castleA', view: 'gcm', show: ['a', ['iv', 'ct', 'tag']], say: ['a'], inside: 'gcm' },
  { id: 'gcmEve', ch: 3, shot: 'castleB', view: 'gcmEve', show: ['b', ['iv', 'ct', 'tag'], 'ct'], say: ['b'], inside: 'gcmEve' },
  { id: 'final', ch: 4, shot: 'castleA', view: 'final', show: ['a', ALL], say: ['a'] },
  // r105/r130: the last step is the doors out, each with its picture and its hover clip; the next episode (1.7, r508) is last, at the right
  { id: 'end', ch: 4, shot: 'overview', orbit: .06, view: 'play', doors: [
      { k: 'sandbox', img: 'img/door-sandbox.jpg', clip: 'img/door-sandbox.mp4', go: x => x.mode('sandbox') },
      { k: 'quiz', img: 'img/door-quiz.jpg', clip: 'img/door-quiz.mp4', go: x => x.mode('quiz') },
      { k: 'home', img: '../assets/doors/home.jpg', clip: 'img/door-home.mp4', href: '../' },
      { k: 'next', img: '../a-toi-de-jouer/vignette.jpg', clip: 'img/door-next.mp4', href: '../a-toi-de-jouer/' }] },
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
    c.showcase(...(step.show || []));
    this.card();
    c.rig.setOrbit(0);
    this.render();
    if (step.inside) return this.enter(step, tok);
    // out of a room, the camera backs out of its keep's window and flies on to the step's shot
    const out = c.inside.active;
    Promise.resolve(out ? c.inside.leave(step.shot) : c.rig.fly(step.shot, c.instant ? 0.001 : 2.2))
      .then(() => { if (tok === this.token && step.orbit) c.rig.setOrbit(step.orbit); });
    // bubbles appear once the camera has mostly arrived
    setTimeout(() => { if (tok === this.token) for (const s of step.say || []) this.say(s); }, c.instant ? 0 : out ? 2000 : 1300);
  }

  // a step inside a keep: it zooms in through the window from wherever the camera is (so #story=5
  // straight into it enters too); from the other keep's room of the chapter, it cuts through to this one
  async enter(step, tok) {
    const c = this.ctx, live = () => tok === this.token, room = c.inside.room;
    if (room && room.name === step.inside) c.inside.beat(step.id);
    else if (!await (room ? c.inside.cut(step.inside, step.id, packets(), live) : c.inside.enter(step.inside, step.id, packets(), live))) return;
    setTimeout(() => { if (live()) for (const s of step.say || []) this.say(s, undefined, () => c.inside.anchor()); }, c.instant ? 0 : 900);
  }

  say(who, text, anchor) {
    const step = STEPS[this.i];
    this.ctx.bubbles.show('story-' + who, who, text ?? raw('steps')[step.id][who], anchor ?? anchors[who]);
  }

  render(langOnly = false) {
    const step = STEPS[this.i], s = raw('steps')[step.id];
    this.el.title.textContent = s.t; render(this.el.text, s.p); linkify(this.el.text, lang, step.refs);   // « épisode 1.4 » links to its step (r119)
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

  // r368, Simon's pick A (r372 for 1.6): in a room on a phone the text shows its first 3 lines (style.css #story.roomy),
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
    const tok = this.token, c = this.ctx;
    const live = () => tok === this.token;
    const buttons = [...this.el.actions.querySelectorAll('button'), this.el.play].filter(Boolean);
    buttons.forEach(b => b.disabled = true);
    c.bubbles.clear(); c.rig.setOrbit(0); c.resetWorld(); this.card();
    // one ride: a packet, what Eve says of it, Bob's checks, and where it leaves from (Alice's
    // castle, or Eve's city for her forgeries and her copies)
    const ride = (pkt, eve, checks, from = 'a') => {
      const r = P.receive(pkt, checks);
      return c.ride({ eve, bob: bobSays(r), from, cargo: 'packet', bricks: P.has(pkt), mark: from === 'city' && !pkt.copy ? P.has(pkt) : null, reject: !!r.rejected, live });
    };
    const p = packets(), sig = { sig: true };
    const rides = {
      forged: () => ride(p.forged, t('m.eveForge'), {}, 'city'),
      forgedSig: () => ride(p.forgedSig, t('m.eveForgeSig'), sig, 'city'),
      // Alice's signed packet goes through, Eve keeps a copy; the next day she sends the copy
      replay: async () => {
        await ride(p.signed, t('m.eveCopy', { h: A.hex(p.signed.sig, 4) }), sig); if (!live()) return;
        await c.wait(900); if (!live()) return;
        await ride(P.replay(p.signed), t('m.eveReplay'), sig, 'city');
      },
      replayNum: async () => {
        await ride(p.numbered, t('m.eveCopyNum', { k: P.NUM }), { sig: true, last: LAST }); if (!live()) return;
        await c.wait(900); if (!live()) return;
        await ride(P.replay(p.numbered), t('m.eveReplay'), { sig: true, last: P.NUM }, 'city');
      },
    };
    const x = {
      live, mode: m => c.setMode(m),
      ride: async what => { const res = await rides[what](); if (live()) await c.rig.fly('both'); return res; },
    };
    try { await fn(x); } finally { if (live()) { buttons.forEach(b => b.disabled = false); this.lit(); } }
  }
}
