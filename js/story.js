// The guided story: 16 steps in 6 chapters. Each step sets the protocol to the
// state the story has reached (so Back, Next and the chapter chips always land
// somewhere consistent), flies the camera, pins its bubbles, and offers buttons.
import * as THREE from 'three';
import { t, raw, onLang } from './i18n.js';
import { CASTLE_A, CASTLE_B, CITY } from './world.js';
import { wait } from './sim.js';

const anchors = {
  a: new THREE.Vector3(CASTLE_A.x, CASTLE_A.y + 27, 0),
  b: new THREE.Vector3(CASTLE_B.x, CASTLE_B.y + 27, 0),
  e: new THREE.Vector3(CITY.x, 27, CITY.z),
  n: new THREE.Vector3(CITY.x, 44, CITY.z),
};

// state: L = highest message each general received, got = distinct messages received
const S = (a, b, extra = {}) => ({ L: { a, b }, got: { a: Math.floor(a / 2) + 0, b: Math.ceil(b / 2) }, ...extra });

export const STEPS = [
  { id: 's1', ch: 0, shot: 'intro', orbit: .04, state: S(0, 0), say: ['e'] },
  { id: 's2', ch: 0, shot: 'castleA', state: S(0, 0), say: ['a'] },
  { id: 's3', ch: 0, shot: 'valley', state: S(0, 0), say: [['e', 'road']] },
  { id: 's4', ch: 1, shot: 'both', state: S(0, 0), go: async (x) => {
      x.apply();
      if (await x.ride('a', { fate: 'beam' }) === 'captured') return x.caught();
      await x.fly('castleB');
    } },
  { id: 's5', ch: 1, shot: 'castleA', state: S(0, 1), say: ['a'] },
  { id: 's6', ch: 2, shot: 'both', state: S(0, 1), go: async (x) => {
      x.apply();
      if (await x.ride('b', { fate: 'beam' }) === 'captured') return x.caught();
      await x.fly('castleA'); x.say('a');
    } },
  { id: 's7', ch: 2, shot: 'castleB', state: S(2, 1), say: ['b'] },
  { id: 's8', ch: 3, shot: 'both', state: S(2, 1), go: async (x) => {
      await x.sim.auto(4, ['deliver', 'deliver', 'deliver', 'deliver']);
      if (!x.live()) return;
      await x.fly('both'); x.say('n');
    } },
  { id: 's10', ch: 3, shot: 'high', orbit: .05, state: S(2, 1), say: ['n'] },
  { id: 's11', ch: 4, shot: 'valley', state: S(0, 0, { p: .5 }), go: async (x) => {
      x.apply(); x.rig.fly('both', 2.5);
      const res = await x.sim.burst('a', 10, 380);
      if (!x.live()) return;
      const ok = res.filter(r => r === 'delivered').length;
      x.say('n', t('m.burstResult', { ok }));
    } },
  { id: 's12', ch: 4, shot: 'both', orbit: .03, state: S(0, 1), say: [['n', null, 'tcp']] },
  { id: 's13', ch: 4, shot: 'both', state: S(2, 1), go: async (x) => {
      x.apply(); await x.dawn(1);
    }, go2: async (x) => {
      x.apply(S(0, 1));
      await x.ride('b', { fate: 'capture' });
      if (!x.live()) return;
      await x.fly('both'); await x.dawn(1);
    } },
  { id: 's14', ch: 5, shot: 'valley', state: S(0, 1, { hmac: false }), go: async (x) => {
      x.apply(); await x.forge(); await x.fly('castleB');
    } },
  { id: 's15', ch: 5, shot: 'valley', state: S(0, 1, { hmac: true }), go: async (x) => {
      x.apply(); await x.forge(); await x.fly('castleB');
    } },
  { id: 's16', ch: 5, shot: 'castleB', state: S(0, 1, { hmac: true }), say: ['b'] },
  { id: 's17', ch: 5, shot: 'overview', orbit: .06, state: S(0, 0), go: x => x.mode('sandbox'), go2: x => x.mode('quiz') },
];

export class Story {
  constructor(ctx) {
    this.ctx = ctx; this.i = 0; this.token = 0;
    this.el = { title: document.getElementById('step-title'), text: document.getElementById('step-text'),
      actions: document.getElementById('step-actions'), count: document.getElementById('step-count'),
      chapters: document.getElementById('chapters'), prev: document.getElementById('prev'), next: document.getElementById('next') };
    this.el.prev.onclick = () => this.go(this.i - 1);
    this.el.next.onclick = () => this.go(this.i + 1);
    onLang(() => this.render(true));
  }

  go(i) {
    i = Math.max(0, Math.min(STEPS.length - 1, i));
    this.i = i; const tok = ++this.token, step = STEPS[i], c = this.ctx;
    location.hash = 'story=' + (i + 1);
    c.bubbles.clear(); c.resetWorld();
    this.applyState(step.state);
    c.rig.setOrbit(0);
    c.rig.fly(step.shot, c.instant ? 0.001 : 2.2).then(() => { if (tok === this.token && step.orbit) c.rig.setOrbit(step.orbit); });
    this.render();
    // bubbles appear once the camera has mostly arrived
    setTimeout(() => { if (tok === this.token) for (const s of step.say || []) this.say(...[].concat(s)); }, c.instant ? 0 : 1300);
  }

  applyState(st) {
    const sim = this.ctx.sim;
    sim.reset();
    sim.L = { ...st.L }; sim.got = { ...st.got }; sim.forgedBelief = false;
    sim.p = st.p ?? .4; sim.hmac = !!st.hmac; sim.lastFrom = null;
    sim.changed();
  }

  // who, anchor ('road' or default by who), text override or key suffix
  say(who, where, textOrKey) {
    const step = STEPS[this.i], steps = raw('steps');
    let text = textOrKey && steps[step.id][textOrKey] ? steps[step.id][textOrKey] : textOrKey || steps[step.id][who];
    const anchor = where === 'road' ? () => this.ctx.world.road.path.getPointAt(.5).add(new THREE.Vector3(0, 6, 0)) : anchors[who];
    this.ctx.bubbles.show('story-' + who, who, text, anchor);
  }

  render(langOnly = false) {
    const step = STEPS[this.i], s = raw('steps')[step.id];
    this.el.title.textContent = s.t; this.el.text.textContent = s.p;
    this.el.count.textContent = t('nav.count', { i: this.i + 1, n: STEPS.length });
    this.el.prev.disabled = this.i === 0; this.el.next.disabled = this.i === STEPS.length - 1;
    // chapter chips
    this.el.chapters.innerHTML = '';
    raw('ch').forEach((name, k) => {
      const b = document.createElement('button'); b.textContent = `${k + 1}. ${name}`;
      b.classList.toggle('active', step.ch === k);
      b.onclick = () => this.go(STEPS.findIndex(x => x.ch === k));
      this.el.chapters.appendChild(b);
    });
    // action buttons
    this.el.actions.innerHTML = '';
    for (const key of ['go', 'go2']) {
      if (!step[key]) continue;
      const b = document.createElement('button'); b.className = key === 'go' ? 'primary' : '';
      b.textContent = s[key];
      b.onclick = () => this.run(step[key], b);
      this.el.actions.appendChild(b);
    }
    if (langOnly) for (const s2 of step.say || []) this.say(...[].concat(s2));
  }

  async run(fn, btn) {
    const tok = this.token, c = this.ctx;
    const live = () => tok === this.token;
    const buttons = [...this.el.actions.querySelectorAll('button')];
    buttons.forEach(b => b.disabled = true);
    c.bubbles.clear(); c.rig.setOrbit(0);
    const x = {
      sim: c.sim, rig: c.rig, live,
      apply: st => { if (live()) { c.resetWorld(); this.applyState(st || STEPS[this.i].state); } },
      fly: shot => live() ? c.rig.fly(shot) : null,
      say: (who, text) => live() && this.say(who, null, text),
      ride: async (from, opts) => { const m = c.sim.send(from, opts); c.rig.chase(m.obj); const r = await m.done; await wait(600); return r; },
      forge: async () => { const m = c.sim.forge(); c.rig.chase(m.obj); const r = await m.done; await wait(900); return r; },
      dawn: k => c.dawn(k),
      // the searchlight took the rider: show the valley, let Étienne gloat, and the button sends again
      caught: async () => { if (!live()) return; await c.rig.fly('both'); x.say('e', 'caught'); },
      mode: m => c.setMode(m),
    };
    try { await fn(x); } finally { if (live()) buttons.forEach(b => b.disabled = false); }
  }
}
