// The guided story of episode 1.5: 14 steps in 4 chapters. Each step names what the corner card
// shows (a view of the real bytes, aes.js, hmac.js and rsa.js), where the packet stands in the
// valley and which of its bricks it has yet (show), flies the camera, pins its bubbles, and offers
// buttons. Alice builds the packet brick by brick; it rides to Bob, who opens the keys, checks the
// seal and decrypts; Eve changes one byte of it and Bob rejects it undecrypted; then the code that
// does it, and main.py's scene played out by two riders.
import * as THREE from 'three';
import { t, raw, lang, onLang } from './i18n.js';
import { linkify } from '../../xref.js';
import { CASTLE_A, CASTLE_B, CITY } from './world.js';
import * as A from './aes.js';
import * as P from './packet.js';

const anchors = {
  a: new THREE.Vector3(CASTLE_A.x, CASTLE_A.y + 27, 0),
  b: new THREE.Vector3(CASTLE_B.x, CASTLE_B.y + 27, 0),
  e: new THREE.Vector3(CITY.x, 27, CITY.z),
  n: new THREE.Vector3(CITY.x, 44, CITY.z),
};

// The story's packets: Alice's order (1.4's keys, IV and seed), what Eve makes of it (one byte of the
// ciphertext), and main.py's « Bonjour Bob ! », sent with the next fresh keys, untouched then changed.
export const packets = () => {
  const s = P.send(A.ORDER[lang], P.STORY), hello = P.send(P.HELLO[lang], P.SCENE);
  return { s, evil: P.tamper(s), hello, helloEvil: P.tamper(hello) };
};
// what Eve says at her gate, and what Bob says of what he gets
export const eveSays = pkt => pkt.eve ? t('m.eveFlip', { b: raw('m.of')[pkt.eve.brick], n: pkt.eve.i + 1 }) : t('m.evePass', { h: A.hex(pkt.ek, 6) });
export const bobSays = r => r.rejected === 'keys' ? t('m.bobNoKeys') : r.rejected ? t(r.decrypted ? 'm.bobLate' : 'm.bobReject') : t('m.bobRead', { m: A.printable(r.back) });

const ALL = P.BRICKS;
export const STEPS = [
  { id: 'intro', refs: { '1.4': 7 }, ch: 0, shot: 'castleA', view: 'whole', show: ['a', ALL], say: ['a'] },
  { id: 'draw', ch: 0, shot: 'castleA', view: 'draw', show: ['a', ['iv']], say: ['a'] },
  { id: 'encrypt', ch: 0, shot: 'castleA', view: 'encrypt', show: ['a', ['iv', 'ct']], say: ['a'] },
  { id: 'seal', ch: 0, shot: 'castleA', view: 'seal', show: ['a', ['iv', 'ct', 'tag']], say: ['a'] },
  { id: 'lock', refs: { '1.4': 7 }, ch: 0, shot: 'castleA', view: 'lock', show: ['a', ALL], say: ['a'] },
  { id: 'ride', ch: 1, shot: 'both', view: 'whole', go: async x => { await x.ride('s'); } },
  // r103/r161: Bob's three moves happen inside his keep, in a room where RSA, HMAC and AES run on the
  // real packet (inside.js): one zoom per chapter, and each chapter has one step in his keep
  { id: 'open', ch: 1, shot: 'castleB', view: 'bob', say: ['b'], inside: 'open' },
  { id: 'eve', ch: 2, shot: 'both', view: 'evil', go: async x => { await x.ride('evil'); } },
  { id: 'anywhere', ch: 2, shot: 'city', orbit: .03, view: 'anywhere', say: ['e'] },
  { id: 'why', ch: 2, shot: 'castleB', view: 'order', say: ['b'], inside: 'why' },
  { id: 'files', ch: 3, shot: 'valley', view: 'files', say: ['n'] },
  { id: 'main', ch: 3, shot: 'both', view: 'term', go: async x => { await x.scene(); } },
  { id: 'readme', ch: 3, shot: 'castleA', view: 'readme', show: ['a', ALL], say: ['a'] },
  { id: 'end', refs: { '1.6': 2 }, ch: 3, shot: 'overview', orbit: .06, view: 'whole', go: x => x.mode('sandbox'), go2: x => x.mode('quiz'),
    link: ['../eve-lit-tout/', '../octet-change/', '../cle-vallee/', '../encore-des-tours/'] },
];

export class Story {
  constructor(ctx) {
    this.ctx = ctx; this.i = 0; this.token = 0;
    this.el = { title: document.getElementById('step-title'), text: document.getElementById('step-text'),
      actions: document.getElementById('step-actions'), count: document.getElementById('step-count'),
      chapters: document.getElementById('chapters'), prev: document.getElementById('prev'), next: document.getElementById('next') };
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
    else if (!await c.inside.enter(step.inside, step.id, packets(), live)) return;
    setTimeout(() => { if (live()) for (const s of step.say || []) this.say(s, undefined, () => c.inside.anchor()); }, c.instant ? 0 : 900);
  }

  say(who, text, anchor) {
    const step = STEPS[this.i];
    this.ctx.bubbles.show('story-' + who, who, text ?? raw('steps')[step.id][who], anchor ?? anchors[who]);
  }

  render(langOnly = false) {
    const step = STEPS[this.i], s = raw('steps')[step.id];
    this.el.title.textContent = s.t; this.el.text.textContent = s.p; linkify(this.el.text, lang, step.refs);   // « épisode 1.4 » links to its step (r119)
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
    (step.link || []).forEach((href, k) => this.el.actions.insertAdjacentHTML('beforeend', `<a class="button" href="${href}?lang=${lang}">${s.link[k]}</a>`));
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
    const tok = this.token, c = this.ctx;
    const live = () => tok === this.token;
    const buttons = [...this.el.actions.querySelectorAll('button'), this.el.play].filter(Boolean);
    buttons.forEach(b => b.disabled = true);
    c.bubbles.clear(); c.rig.setOrbit(0); c.resetWorld(); this.card();
    // one ride: the packet as it leaves Alice, and what Bob makes of it
    const ride = async pkt => {
      const r = P.receive(pkt);
      return c.ride({ eve: eveSays(pkt), bob: bobSays(r), cargo: 'packet', mark: pkt.eve?.brick, reject: !!r.rejected, live });
    };
    const x = {
      live, mode: m => c.setMode(m),
      // a story ride: Alice's packet untouched ('s'), or with Eve's byte changed ('evil')
      ride: async what => { const res = await ride(packets()[what]); if (live()) await c.rig.fly('both'); return res; },
      // main.py's scene: the terminal prints its lines as the two riders go, as `python main.py` would
      scene: async () => {
        const p = packets(), lines = raw('term.lines'), show = n => live() && this.card({ view: 'term', lines: n });
        show(0); await c.wait(500); show(1); await c.wait(900); if (!live()) return;
        show(2); await ride(p.hello); if (!live()) return;
        show(4); await c.wait(1200); if (!live()) return;
        show(6); await ride(p.helloEvil); if (!live()) return;
        show(lines.length); await c.rig.fly('both');
      },
    };
    try { await fn(x); } finally { if (live()) { buttons.forEach(b => b.disabled = false); this.lit(); } }
  }
}
