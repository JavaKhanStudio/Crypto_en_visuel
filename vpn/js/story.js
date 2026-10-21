// The guided story: 14 steps in 5 chapters. Each step sets the map where the story has reached (HTTPS,
// the tunnel, the keys, which watchers have read what), so Back, Next and the chapter chips always
// land somewhere consistent; flies the camera, pins its bubbles, and offers buttons.
import * as THREE from 'three';
import { t, raw, lang, onLang } from './i18n.js';
import { render as md } from './md.js';
import { linkify } from '../../xref.js';

const ALL = ['e', 'i', 'v', 'b'];
const TUNNEL = { tunnel: true };            // the keys did their work: from here the gold tube shows the tunnel
const behind = new THREE.Vector3(-3, 3.5, 8.5);     // the camera's place beside a riding envelope

export const STEPS = [
  { id: 's1', ch: 0, shot: 'map', orbit: .02, state: { card: 'map' }, say: ['a', 'e'] },
  { id: 's2', ch: 0, shot: 'envelope', state: { https: false, parked: { at: 'a', kind: 'plain' }, card: 'env' }, go: async x => {
      x.apply(); x.chase(x.stage.focus, behind);
      if (!await x.stage.send(['b'])) return;
      await x.fly('bob'); x.say('b');
    } },
  { id: 's3', ch: 0, shot: 'street', state: { https: false, card: 'env' }, go: async x => {
      x.apply(); x.chase(x.stage.focus, new THREE.Vector3(-2, 6, 12));
      if (!await x.stage.send([])) return;
      await x.fly('street');
    } },
  { id: 's4', ch: 1, shot: 'cafe', state: { https: false, card: 'sees' }, go: async x => {
      x.apply(); if (!await x.stage.send(['e'])) return; x.say('e');
    } },
  { id: 's5', ch: 1, shot: 'cafe', state: { card: 'sees' }, go: async x => {
      x.apply(); if (!await x.stage.dns(['e'])) return;
      x.stage.st.read = []; if (!await x.stage.send(['e'])) return; x.say('e');
    } },
  { id: 's6', ch: 1, shot: 'street', state: { read: ['e'], card: 'sees' }, go: async x => {
      x.apply(); if (!await x.stage.send(['e', 'i'])) return; x.say('e');
    } },
  { id: 's7', ch: 2, shot: 'keys', state: { card: 'keys' }, go: async x => {
      x.apply(); if (!await x.stage.exchange()) return; x.say('v');
    } },
  { id: 's8', ch: 2, shot: 'keys', state: { keys: 1, what: 'keys', read: ['e'], card: 'shared' }, go: async x => {
      x.apply(); if (!await x.stage.derive()) return; x.say('e');
    } },
  { id: 's9', ch: 2, shot: 'tunnel', state: { ...TUNNEL, card: 'seal' }, go: async x => {
      x.apply(); x.chase(x.stage.focus, new THREE.Vector3(-3, 6, 12));
      if (!await x.stage.send(['e', 'i', 'v', 'b'])) return;
      await x.fly('tunnel'); x.say('e');
    } },
  { id: 's10', ch: 2, shot: 'tunnel', state: { ...TUNNEL, card: 'flip' }, go: async x => {
      x.apply(); x.chase(x.stage.focus, new THREE.Vector3(-3, 6, 12));
      if (!await x.stage.send(['v'], { flip: true })) return;
      await x.fly('vpn'); x.say('v');
    } },
  { id: 's11', ch: 3, shot: 'overview', state: { ...TUNNEL, read: ALL, card: 'sees2' }, say: ['b'], go: async x => {
      x.apply({ ...TUNNEL, card: 'sees2' }); if (!await x.stage.send(ALL)) return; x.say('b');
    } },
  { id: 's12', ch: 3, shot: 'vpn', state: { ...TUNNEL, read: ['v'], card: 'trust' }, say: ['v'], go: async x => {
      x.apply({ ...TUNNEL, card: 'trust' }); x.chase(x.stage.focus, new THREE.Vector3(-3, 6, 12));
      if (!await x.stage.send(['v'])) return; await x.fly('vpn'); x.say('v');
    } },
  { id: 's13', ch: 4, shot: 'overview', orbit: .02, state: { ...TUNNEL, read: ['e', 'b'], card: 'sees2' }, say: ['a'] },
  { id: 's14', ch: 4, shot: 'overview', orbit: .02, state: { ...TUNNEL, read: ALL, card: 'sees2' },
    go: x => x.mode('sandbox'), go2: x => x.mode('quiz') },
];

export class Story {
  constructor(ctx) {
    this.ctx = ctx; this.i = 0; this.token = 0;
    this.el = { title: document.getElementById('step-title'), text: document.getElementById('step-text'),
      actions: document.getElementById('step-actions'), count: document.getElementById('step-count'),
      chapters: document.getElementById('chapters'), prev: document.getElementById('prev'), next: document.getElementById('next') };
    this.el.prev.onclick = () => this.go(this.i - 1);
    this.el.next.onclick = () => this.go(this.i + 1);
    this.said = new Map();   // bubble id -> text key, to re-say them after a language switch
    this.steps = STEPS;
    onLang(() => { this.ctx.stage.apply({ ...this.ctx.stage.st }); this.render(true); });
  }

  state(i = this.i) { return { ...STEPS[i].state }; }

  go(i) {
    i = Math.max(0, Math.min(STEPS.length - 1, i));
    this.i = i; this.seen = false; const tok = ++this.token, step = STEPS[i], c = this.ctx;
    location.hash = 'story=' + (i + 1);
    c.bubbles.clear(); this.said.clear();
    c.stage.apply(this.state());
    c.rig.setOrbit(0);
    c.rig.fly(step.shot, c.instant ? 0.001 : 2.2).then(() => {
      if (tok !== this.token) return;
      if (step.orbit) c.rig.setOrbit(step.orbit);
    });
    this.render();
    // bubbles appear once the camera has mostly arrived
    setTimeout(() => { if (tok === this.token) for (const s of step.say || []) this.say(s); }, c.instant ? 0 : 1300);
  }

  say(who, key = who) {
    const step = STEPS[this.i];
    this.said.set(who, key);
    const st = this.ctx.stage;
    this.ctx.bubbles.show('story-' + who, who, raw('steps')[step.id][key], () => st.head(who).add(new THREE.Vector3(0, .5, 0)));
  }

  render(langOnly = false) {
    const step = STEPS[this.i], s = raw('steps')[step.id];
    this.el.title.textContent = s.t; md(this.el.text, s.p); linkify(this.el.text, lang, { '1.3': 6 });
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
      b.onclick = () => this.run(step[key], key === 'go2');
      if (anim && key === 'go') { b.id = 'play'; this.el.next.after(b); this.el.play = b; } else this.el.actions.appendChild(b);
    }
    this.el.next.classList.toggle('primary', !anim || this.seen);
    if (!this.seen) this.el.next.classList.remove('shine');
    if (langOnly) for (const [who, key] of this.said) if (this.ctx.bubbles.items.has('story-' + who)) this.say(who, key);
  }

  // the step's animation has played: Suivant takes the gold back and shines once to call the eye
  lit() {
    if (this.seen || !this.el.play) return;
    this.seen = true; this.el.play.classList.remove('primary');
    const n = this.el.next; n.classList.add('primary', 'shine');
    n.addEventListener('animationend', () => n.classList.remove('shine'), { once: true });
  }

  // keep: a small action on top of where the stage is, no reset, bubbles stay
  async run(fn, keep = false) {
    const tok = this.token, c = this.ctx, st = c.stage;
    const live = () => tok === this.token;
    const buttons = [...this.el.actions.children, this.el.play].filter(Boolean);
    buttons.forEach(b => b.disabled = true);
    if (!keep) { c.bubbles.clear(); this.said.clear(); }
    c.rig.setOrbit(0);
    const x = {
      stage: st, rig: c.rig, live,
      // back to the step's own state (or another), unless the visitor has moved on
      apply: s => { if (live()) st.apply(s ?? this.state()); },
      fly: shot => live() ? c.rig.fly(shot) : null,
      say: (who, key) => live() && this.say(who, key),
      // the camera rides beside the envelope
      chase: (obj, off, back) => live() && c.rig.chase(obj, off, back),
      celebrate: () => live() && c.celebrate(),
      mode: m => c.setMode(m),
    };
    try { await fn(x); } finally { if (live()) { buttons.forEach(b => b.disabled = false); this.lit(); } }
  }
}
