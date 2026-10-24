// The protocol, apart from the drawing. Message n of the chain is sent by Alice
// when n is odd (the plan, then acks of acks), by Bob when n is even. When message
// n arrives, its receiver knows level n: "Bob knows the plan" (1), "Alice knows
// that Bob knows" (2), and so on. The sender of the last arrived message never
// knows that it arrived: that is the whole problem.
import { Messenger } from '../../ficelle/lib/messenger.js';

export class Sim {
  constructor(world, hooks) {
    this.world = world; this.hooks = hooks;   // hooks: onChange, onMessenger(m, event)
    this.messengers = new Set();
    this.p = .4; this.nextCaught = false; this.speed = 26;
    this.reset();
  }

  reset() {
    for (const m of this.messengers) m.finish('cancelled');
    this.messengers.clear();
    this.L = { a: 0, b: 0 };         // highest message number each general has received
    this.got = { a: 0, b: 0 };       // distinct messages received, for the dawn rule
    this.stats = { sent: 0, ok: 0, lost: 0 };
    this.changed();
  }

  get level() { return Math.max(this.L.a, this.L.b); }
  changed() { this.hooks.onChange?.(this); }

  // The number the next message from `from` carries: one more than what it last heard.
  nextSeq(from) { return from === 'a' ? this.L.a + 1 : (this.L.b ? this.L.b + 1 : 0); }

  decideFate() {
    if (this.nextCaught) { this.nextCaught = false; this.hooks.onFlag?.(); return 'capture'; }
    return Math.random() < this.p ? 'capture' : 'deliver';
  }

  // Send one messenger. fate: 'deliver' | 'capture' | undefined (random, by p).
  send(from, { fate, seq, speed, captureAt } = {}) {
    seq = seq ?? this.nextSeq(from);
    if (!seq) return null;           // Bob with nothing to acknowledge
    fate = fate ?? this.decideFate();
    this.stats.sent++; this.lastFrom = from;
    const m = new Messenger(this.world, { from, fate, captureAt, speed: speed ?? this.speed,
      onEvent: (ev, mm) => this.hooks.onMessenger?.(mm, ev) });
    m.seq = seq; this.messengers.add(m); this.changed();
    m.done.then(r => {
      this.messengers.delete(m);
      if (r === 'delivered') {
        const to = from === 'a' ? 'b' : 'a';
        this.stats.ok++;
        const fresh = seq > this.L[to];
        if (fresh) { this.L[to] = seq; this.got[to]++; }
        m.fresh = fresh;
      } else if (r === 'captured') this.stats.lost++;
      this.changed();
      return r;
    });
    this.hooks.onMessenger?.(m, 'sent');
    return m;
  }

  // n copies of the same message, staggered. Resolves when all are done.
  // Each is marked burst: Eve says nothing when she takes one, ten bubbles hid the valley (r417).
  async burst(from, n = 10, gap = 280) {
    const seq = this.nextSeq(from);
    if (!seq) return null;
    const all = [];
    for (let i = 0; i < n; i++) { const m = this.send(from, { seq }); m.burst = true; all.push(m.done); await wait(gap); }
    return Promise.all(all);
  }

  // Ping-pong until a messenger is lost or `rounds` messages have arrived.
  async auto(rounds = 6, fates = []) {
    let from = this.level % 2 === 0 ? 'a' : 'b';
    for (let i = 0; i < rounds; i++) {
      const m = this.send(from, { fate: fates[i] });
      if (!m) return 'nothing';
      this.hooks.onFollow?.(m);
      const r = await m.done;
      if (r !== 'delivered') return 'lost';
      from = from === 'a' ? 'b' : 'a';
      await wait(250);
    }
    return 'done';
  }

  // Each general attacks if it received at least `k` distinct messages.
  dawn(k) {
    const a = this.got.a >= k, b = this.got.b >= k;
    return a && b ? 'both' : a ? 'a' : b ? 'b' : 'none';
  }

  update(dt, t) { for (const m of this.messengers) m.update(dt, t); }
}

export const wait = ms => new Promise(r => setTimeout(r, ms));
