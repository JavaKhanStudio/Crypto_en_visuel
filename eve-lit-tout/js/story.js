// The guided story of episode 1.2: 12 steps in 4 chapters. Each step names what the corner card
// shows (a view of the real bytes, aes.js), flies the camera, pins its bubbles, and offers buttons.
// A ride: Alice's messenger leaves, Eve's guards stop him under her walls, she reads the scroll
// (the order, or the IV and ciphertext), lets him go, and Bob reads it on arrival.
import * as THREE from 'three';
import { t, raw, lang, onLang } from './i18n.js';
import { CASTLE_A, CASTLE_B, CITY } from './world.js';
import * as A from './aes.js';

const anchors = {
  a: new THREE.Vector3(CASTLE_A.x, CASTLE_A.y + 27, 0),
  b: new THREE.Vector3(CASTLE_B.x, CASTLE_B.y + 27, 0),
  e: new THREE.Vector3(CITY.x, 27, CITY.z),
  n: new THREE.Vector3(CITY.x, 44, CITY.z),
};

// The sends of the story: day 1 (the first ride, then the encrypted one), day 2 (the same order,
// same key and IV), day 3 (a fresh key and IV). The bytes depend on the language of the order.
export const sendOf = k => A.send(A.ORDER[lang], k === 2 ? A.KEY2 : A.KEY1, k === 2 ? A.IV2 : A.IV1);
const day = (n, k, extra = {}) => ({ day: n, c: sendOf(k).C[0], ...extra });

export const STEPS = [
  { id: 'intro', ch: 0, shot: 'intro', orbit: .04, view: 'order', say: ['e'] },
  { id: 'read', ch: 0, shot: 'both', view: 'order', go: async x => { await x.ride({ cipher: false }); x.say('e'); } },
  { id: 'why', ch: 0, shot: 'valley', view: 'order', say: ['n'] },
  { id: 'key', ch: 1, shot: 'castleA', view: 'key', say: ['a'] },
  // ?inside=1: the step zooms into Alice's keep, where the AES machine works on P1 (r103, a prototype)
  { id: 'aes', ch: 1, shot: 'castleA', view: 'aes', say: ['a'], inside: new URLSearchParams(location.search).has('inside') ? 'aes' : null },
  { id: 'pad', ch: 1, shot: 'castleA', view: 'pad', say: ['a'] },
  { id: 'cbc', ch: 1, shot: 'castleA', view: 'cbc', say: ['a'] },
  { id: 'cipher', ch: 1, shot: 'both', view: 'cipher', go: async x => { await x.ride({ cipher: true }); } },
  { id: 'again', ch: 2, shot: 'city', view: 'book', book: () => [day(1, 1)],
    go: async x => { await x.ride({ cipher: true, seen: true, log: day(2, 1, { seen: true, tag: 'same' }) }); x.say('e'); } },
  { id: 'fresh', ch: 2, shot: 'city', view: 'book', book: () => [day(1, 1), day(2, 1, { seen: true, tag: 'same' })], key: 2,
    go: async x => { await x.ride({ cipher: true, log: day(3, 2, { tag: 'other' }) }); x.say('e'); } },
  { id: 'packet', ch: 3, shot: 'city', orbit: .03, view: 'packet', key: 2, say: ['e'], link: '../octet-change/' },
  { id: 'end', ch: 3, shot: 'overview', orbit: .06, view: 'packet', key: 2, go: x => x.mode('sandbox'), go2: x => x.mode('quiz'), link: '../pingouin/' },
];

export class Story {
  constructor(ctx) {
    this.ctx = ctx; this.i = 0; this.token = 0;
    this.el = { title: document.getElementById('step-title'), text: document.getElementById('step-text'),
      actions: document.getElementById('step-actions'), count: document.getElementById('step-count'),
      chapters: document.getElementById('chapters'), prev: document.getElementById('prev'), next: document.getElementById('next') };
    this.el.prev.onclick = () => this.go(this.i - 1);
    this.el.next.onclick = () => this.go(this.i + 1);
    onLang(() => { this.render(true); this.card(); });
  }

  // what the corner card shows at this step: the view, the send, Eve's notebook so far
  state(i = this.i) {
    const step = STEPS[i];
    return { view: step.view, send: sendOf(step.key || 1), book: step.book ? step.book() : [] };
  }
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
    // out of a room first, then the camera pulls back from its window to the step's shot
    (c.inside.active ? c.inside.leave() : Promise.resolve()).then(() => {
      if (tok !== this.token) return;
      c.rig.fly(step.shot, c.instant ? 0.001 : 2.2).then(() => { if (tok === this.token && step.orbit) c.rig.setOrbit(step.orbit); });
      // bubbles appear once the camera has mostly arrived
      setTimeout(() => { if (tok === this.token) for (const s of step.say || []) this.say(s); }, c.instant ? 0 : 1300);
    });
  }

  // a step inside the castle: fly to the step's shot, zoom in through the window, the speaker talks in the room
  async enter(step, tok) {
    const c = this.ctx, live = () => tok === this.token;
    if (!c.inside.active) await c.rig.fly(step.shot, c.instant ? 0.001 : 1.6);
    else c.inside.play();
    if (!live() || (!c.inside.active && !await c.inside.enter(step.inside, sendOf(step.key || 1), live))) return;
    setTimeout(() => { if (live()) for (const s of step.say || []) this.say(s, undefined, c.inside.anchor()); }, c.instant ? 0 : 900);
  }

  say(who, text, anchor) {
    const step = STEPS[this.i];
    this.ctx.bubbles.show('story-' + who, who, text ?? raw('steps')[step.id][who], anchor ?? anchors[who]);
  }

  render(langOnly = false) {
    const step = STEPS[this.i], s = raw('steps')[step.id];
    this.el.title.textContent = s.t; this.el.text.textContent = s.p;
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
    if (step.link) this.el.actions.insertAdjacentHTML('beforeend', `<a class="button" href="${step.link}?lang=${lang}">${s.link}</a>`);
    this.el.next.classList.toggle('primary', !anim || this.seen);
    if (!this.seen) this.el.next.classList.remove('shine');
    if (langOnly) for (const s2 of step.say || []) this.say(s2, undefined, step.inside ? this.ctx.inside.anchor() : undefined);
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
      // one ride of the story's send: Eve reads it at her gate, Bob reads it at his
      ride: async ({ cipher, seen = false, log = null }) => {
        const s = sendOf(step.key || 1);
        const r = await c.ride({
          eve: cipher ? t('m.readCipher', { h: A.hex(A.concat([s.iv, ...s.C]), 8) }) : t('m.readPlain', { m: s.order }),
          eve2: seen ? t('m.seen') : null,
          bob: cipher ? t('m.bobCipher', { m: s.back }) : t('m.bobPlain', { m: s.order }),
          cipher, live,
          onRead: () => { if (live() && log) this.card({ book: [...this.st.book, log] }); },
        });
        if (live()) await c.rig.fly('both');
        return r;
      },
    };
    try { await fn(x); } finally { if (live()) { buttons.forEach(b => b.disabled = false); this.lit(); } }
  }
}
