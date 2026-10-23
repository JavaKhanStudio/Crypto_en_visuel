// The story of episode 1.7 « À toi de jouer » (r420, r505): « get the order to Bob », the saga 1.2-1.6
// told back as choices. Each step after the intro offers three ways for Alice to answer one of Eve's
// tricks (lib/choices.js); the one picked rides the road, Eve holds the rider at her gate and says what
// she makes of it, and Bob says what he gets. Every byte said is computed here, on the saga's story
// values (lib/saga-aes.js): the same order, key, IV and byte 11 as episodes 1.2 and 1.3.
import * as THREE from 'three';
import { t, raw, lang, onLang } from './i18n.js';
import { linkify } from '../../xref.js';
import { render } from '../../lib/md.js';
import { Choices } from '../../lib/choices.js';
import { sha256, equal } from '../../lib/hmac.js';
import { CASTLE_A, CITY } from '../../lib/saga/world.js';
import * as A from '../../lib/saga-aes.js';

const anchors = {
  a: new THREE.Vector3(CASTLE_A.x, CASTLE_A.y + 27, 0),
  e: new THREE.Vector3(CITY.x, 27, CITY.z),
};

// Yesterday's IV, drawn once (openssl rand): today's packet is the saga's (A.IV), so the two CBC sends
// of the same order share nothing; ECB has no IV, and gives yesterday's blocks back.
const IV_YESTERDAY = A.fromHex('7d14b785cba7941b9550dec1a945c20c');
const cache = {};
export const values = () => cache[lang] ??= (() => {
  const order = A.ORDER[lang], P = A.blocks(A.pad(A.bytes(order)));
  const ecb = A.ecb(A.KEY, P), ecbYesterday = A.ecb(A.KEY, P);
  const cbc = A.send(order, A.KEY, A.IV, A.MACKEY), cbcYesterday = A.send(order, A.KEY, IV_YESTERDAY, A.MACKEY);
  // step 2: Eve XORs byte 11 of the IV with 0f; the fingerprint without a key she simply redoes
  const evil = A.tamper(cbc, 'iv', A.HOUR), body = s => A.concat([s.iv, ...s.C]);
  const back = A.unpad(A.concat(A.cbcDec(A.KEY, evil.iv, evil.C)));
  const sum = sha256(body(evil)), sumOk = equal(sha256(body(evil)), sum);
  const sealed = A.receive({ ...evil, tag: cbc.tag }, A.KEY, A.MACKEY);
  return { order, P, ecb, ecbYesterday, cbc, cbcYesterday, evil, back: A.text(back), sum, sumOk, sealed };
})();

// Bob, at his gate: what the packet gives him
const bobReads = { clear: v => v.order, ecb: v => A.text(A.unpad(A.concat(v.ecb.map(c => A.decryptBlock(A.KEY, c))))),
  cbc: v => A.text(A.unpad(A.concat(A.cbcDec(A.KEY, v.cbc.iv, v.cbc.C)))) };

// The steps. A choice: k (its words in i18n steps.<id>.choices.<k>), right, icon, and its ride:
// what Eve says (m.<id>.<k>.e with the bytes), what Bob says, whether Bob turns the rider away.
const hex4 = b => A.hex(b, 4);
export const STEPS = [
  { id: 'intro', shot: 'overview', orbit: .05, say: ['e'] },
  { id: 'text', shot: 'both', choices: [
      { k: 'clear', right: false, icon: '📜', ride: v => ({ eve: {}, bob: { m: bobReads.clear(v) } }) },
      { k: 'ecb', right: false, icon: '🧱', ride: v => ({ eve: { c1: hex4(v.ecb[0]), c2: hex4(v.ecb[1]) }, bob: { m: bobReads.ecb(v) } }) },
      { k: 'cbc', right: true, icon: '🔗', ride: v => ({ eve: { c1: hex4(v.cbc.C[0]), c2: hex4(v.cbc.C[1]) }, bob: { m: bobReads.cbc(v) } }) }] },
  { id: 'seal', shot: 'both', choices: [
      { k: 'none', right: false, icon: '✉️', ride: v => ({ eve: {}, bob: { m: v.back } }) },
      { k: 'hmac', right: true, icon: '🔏', ride: v => ({ eve: {}, bob: {}, reject: v.sealed.rejected }) },
      { k: 'sum', right: false, icon: '🧮', ride: v => ({ eve: { h: hex4(v.sum) }, bob: { m: v.back }, reject: !v.sumOk }) }] },
];

export class Story {
  constructor(ctx) {
    this.ctx = ctx; this.i = 0; this.token = 0;
    this.el = { title: document.getElementById('step-title'), text: document.getElementById('step-text'),
      choices: document.getElementById('step-choices'), count: document.getElementById('step-count'),
      prev: document.getElementById('prev'), next: document.getElementById('next') };
    this.el.prev.onclick = () => this.go(this.i - 1);
    this.el.next.onclick = () => this.go(this.i + 1);
    this.choices = new Choices(this.el.choices, { t,
      render: (el, src) => { render(el, src); linkify(el, lang); },
      play: (c, live) => this.play(c, live),
      onPick: () => { ctx.bubbles.clear(); ctx.resetWorld(); },
      onSolve: () => { this.nav(); ctx.onRight(); },
      onContinue: () => this.go(this.i + 1) });
    onLang(() => { this.render(true); this.choices.reword(raw('steps')[STEPS[this.i].id]); });
  }

  go(i) {
    i = Math.max(0, Math.min(STEPS.length - 1, i));
    this.i = i; const tok = ++this.token, step = STEPS[i], c = this.ctx;
    location.hash = 'story=' + (i + 1);
    c.bubbles.clear(); c.resetWorld(); c.rig.setOrbit(0);
    this.render();
    c.rig.fly(step.shot, c.instant ? .001 : 2.2).then(() => { if (tok === this.token && step.orbit) c.rig.setOrbit(step.orbit); });
    setTimeout(() => { if (tok === this.token) for (const s of step.say || []) this.say(s); }, c.instant ? 0 : 1300);
  }

  say(who) {
    const step = STEPS[this.i];
    this.ctx.bubbles.show('story-' + who, who, raw('steps')[step.id][who], anchors[who]);
  }

  render(langOnly = false) {
    const step = STEPS[this.i], s = raw('steps')[step.id];
    this.el.title.textContent = s.t; render(this.el.text, s.p); linkify(this.el.text, lang);   // « épisode 1.3 » links to it (r119)
    this.el.count.textContent = t('nav.count', { i: this.i + 1, n: STEPS.length });
    if (step.choices && !langOnly) this.choices.show(step, s, { last: this.i === STEPS.length - 1 });
    if (!step.choices) this.choices.stop();
    this.nav();
    if (langOnly) for (const w of step.say || []) this.say(w);
  }

  // Suivant waits, grey, until the step's right choice has been found (r420: a wrong one forces a new pick)
  nav() {
    const step = STEPS[this.i], open = !step.choices || this.choices.solved(step.id);
    this.el.prev.disabled = this.i === 0;
    this.el.next.disabled = this.i === STEPS.length - 1 || !open;
  }

  // one choice, played: the rider leaves Alice's castle, Eve holds him at her gate and says what she
  // makes of what he carries, Bob at his gate says what he reads, or turns him away
  async play(c, live) {
    const x = this.ctx, v = values(), r = c.ride(v), id = STEPS[this.i].id;
    await x.ride({ eve: t(`m.${id}.${c.k}.e`, r.eve), bob: t(`m.${id}.${c.k}.b`, r.bob), reject: !!r.reject, live });
    if (live()) await x.rig.fly('both', x.instant ? .001 : 1.6);
  }
}
